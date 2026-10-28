import { ANTES, BOSS, BOSSES, BRANDIES, BRANDY, CUP, CUPS, DECK, PACK, PACKS, REG, REGULARS, RULES, STAKES, VOUCHERS, regDef } from './data.ts';
import type { Card, EditionId, EnhId, LevelKey, PackOption, Rank, RegularInstance, RoundState, Rules, RunState, SealId, ShopItem, Suit } from './types.ts';
import { makeDeck, SUITS } from './cards.ts';
import { canCaptureAny, evaluateOptions, type CaptureEval } from './capture.ts';
import { scoreCapture, type ScoreResult } from './scoring.ts';
import { computeRules } from './rules.ts';
import { resolveRegular } from './content/regulars.ts';
import { createRng, int, next, pick, shuffle, weighted } from './rng.ts';
import { TUTORIAL } from './tutorial.ts';

export const SAVE_VERSION = 1;

export type Action =
  | { type: 'startRound' }
  | { type: 'capture'; handId: string; tableIds: string[] }
  | { type: 'lay'; handId: string }
  | { type: 'useConsumable'; index: number; targets?: string[] }
  | { type: 'sellConsumable'; index: number }
  | { type: 'collect' }
  | { type: 'buy'; index: number }
  | { type: 'buyPack'; index: number }
  | { type: 'buyVoucher' }
  | { type: 'reroll' }
  | { type: 'sellRegular'; uid: string }
  | { type: 'moveRegular'; from: number; to: number }
  | { type: 'packPick'; index: number; targets?: string[] }
  | { type: 'packSkip' }
  | { type: 'leaveShop' }
  | { type: 'continueEndless' };

export type GameEvent =
  | { type: 'captured'; result: ScoreResult; captureType: string; groups: number; handCard: Card; tableCards: Card[]; tabla: boolean }
  | { type: 'laid'; card: Card; forced: boolean; discarded: boolean }
  | { type: 'discarded'; card: Card }
  | { type: 'glassBroken'; ids: string[] }
  | { type: 'roundWon' }
  | { type: 'roundLost' }
  | { type: 'bossDefeated'; id: string }
  | { type: 'runWon' }
  | { type: 'regularAdded'; id: string }
  | { type: 'consumableUsed'; id: string }
  | { type: 'money'; amount: number }
  | { type: 'missInDark' }
  | { type: 'error'; key: string };

export interface NewRunOptions { seed: string; seeded: boolean; deckId: string; stakeLevel: number; tutorial?: number; firstRun?: boolean }

export function newRun(o: NewRunOptions): RunState {
  const deckDef = DECK[o.deckId] ?? DECK.deck_classic!;
  const run: RunState = {
    version: SAVE_VERSION,
    seed: o.seed,
    seeded: o.seeded,
    rng: createRng(o.seed),
    deckId: deckDef.id,
    stakeId: STAKES[Math.min(o.stakeLevel, STAKES.length - 1)]!.id,
    stakeLevel: o.stakeLevel,
    ante: 1,
    roundIndex: 0,
    money: deckDef.money ?? RULES.startMoney,
    deck: makeDeck(deckDef),
    regulars: [],
    consumables: [],
    levels: { pair: 1, sum: 1, double: 1, triple: 1, tabla: 1 },
    vouchers: [],
    usedBosses: [],
    phase: 'map',
    stats: { captures: 0, lays: 0, tablas: 0, bestCapture: 0, glassBroken: 0, cupsUsed: 0, brandiesUsed: 0, maxMoney: 0, bossesBeaten: 0, hadRare: false, regularCaptures: {} },
    endless: false,
    uidCounter: 1,
  };
  if (deckDef.cups) for (let i = 0; i < deckDef.cups; i++) run.consumables.push(pick(run.rng, 'start', CUPS.filter(c => c.id !== 'cup_sun')).id);
  if (o.tutorial !== undefined) run.tutorial = o.tutorial;
  if (o.firstRun) run.firstRun = true;
  startAnte(run);
  return run;
}

// ---------- pomoćne ----------
export function targetFor(run: RunState, roundIndex = run.roundIndex): number {
  const t = ANTES.targets;
  let base: number;
  if (run.ante <= t.length) base = t[run.ante - 1]![roundIndex]!;
  else base = t[t.length - 1]![roundIndex]! * Math.pow(ANTES.endlessGrowth, run.ante - t.length);
  const stakeMul = run.stakeLevel >= 4 ? 1.5 : run.stakeLevel >= 2 ? 1.25 : 1;
  const bossMul = roundIndex === 2 && run.bossForAnte ? BOSS[run.bossForAnte]?.targetMul ?? 1 : 1;
  return Math.round(base * stakeMul * bossMul);
}

function startAnte(run: RunState) {
  if (run.tutorial !== undefined) { run.bossForAnte = undefined; return; }
  if (run.ante % 8 === 0) run.bossForAnte = 'chain_owner';
  else {
    let pool = BOSSES.filter(b => !b.final && b.minAnte <= run.ante && !run.usedBosses.includes(b.id));
    if (!pool.length) pool = BOSSES.filter(b => !b.final && b.minAnte <= run.ante);
    run.bossForAnte = pick(run.rng, 'boss', pool).id;
  }
  const vs = VOUCHERS.filter(v => !run.vouchers.includes(v.id));
  run.anteVoucher = vs.length ? pick(run.rng, 'shop', vs).id : undefined;
  run.anteVoucherBought = false;
}

function uid(run: RunState, prefix: string): string { return prefix + (run.uidCounter++); }

export function rulesOf(run: RunState): Rules { return computeRules(run); }

/** Redoslijed po DESIGN_REVIEW K6: prvo sto (ako ima < 2 karte, do 4), pa ruka do H. */
function refill(round: RoundState, rules: Rules) {
  if (round.table.length < RULES.tableMin) {
    while (round.table.length < RULES.tableStart && round.drawPile.length) round.table.push(round.drawPile.shift()!);
  }
  while (round.hand.length < rules.handSize && round.drawPile.length) round.hand.push(round.drawPile.shift()!);
}

/** Bira dodjelu vrijednosti s najviše predviđenih bodova; tie-break: više grupa, pa manja vrijednost (K3). */
function bestOption(run: RunState, round: RoundState, rules: Rules, hand: Card, sel: Card[]): { ev: CaptureEval; preview: ScoreResult } | null {
  let best: { ev: CaptureEval; preview: ScoreResult } | null = null;
  const held = round.hand.filter(c => c.id !== hand.id);
  for (const ev of evaluateOptions(hand, sel, rules.aceAny)) {
    const preview = scoreCapture({ run, round, rules, type: ev.type, groups: ev.groups, handCard: hand, tableCards: sel, held, tabla: sel.length === round.table.length, preview: true });
    if (!best || preview.total > best.preview.total || (preview.total === best.preview.total && (ev.groups > best.ev.groups || (ev.groups === best.ev.groups && ev.value < best.ev.value)))) best = { ev, preview };
  }
  return best;
}

function syncDeckCard(run: RunState, card: Card) {
  const i = run.deck.findIndex(c => c.id === card.id);
  if (i >= 0) run.deck[i] = { ...card, faceDown: undefined };
}

export function interestFor(run: RunState, rules: Rules): number {
  return Math.min(rules.interestCap, Math.floor(Math.max(0, run.money) / RULES.interestPer));
}

/** Može li igrač nešto nositi s trenutnom rukom (bez skrivenih karata se ne računa posebno). */
export function mustForceLay(run: RunState): boolean {
  const r = run.round; if (!r) return false;
  const rules = computeRules(run);
  // skrivene karte (Nestanak struje) se ne računaju: igrač ne smije biti prisiljen da pogađa u mraku
  return !canCaptureAny(r.hand, r.table.filter(c => !c.faceDown), rules.aceAny) && (r.laysLeft <= 0 || r.table.length >= RULES.tableMax);
}

export function previewCapture(run: RunState, handId: string, tableIds: string[]): (ScoreResult & { captureType: string; groups: number; value: number }) | null {
  const r = run.round; if (!r) return null;
  const rules = computeRules(run);
  const hand = r.hand.find(c => c.id === handId);
  const sel = tableIds.map(id => r.table.find(c => c.id === id)).filter((c): c is Card => !!c);
  if (!hand || sel.length !== tableIds.length) return null;
  const orderedSel = r.table.filter(c => tableIds.includes(c.id));
  if (orderedSel.some(c => c.faceDown)) return null;
  const b = bestOption(run, r, rules, hand, orderedSel);
  if (!b) return null;
  return { ...b.preview, captureType: b.ev.type, groups: b.ev.groups, value: b.ev.value };
}

// ---------- reducer ----------
export function apply(prev: RunState, action: Action): { state: RunState; events: GameEvent[] } {
  const run = structuredClone(prev);
  const events: GameEvent[] = [];
  const err = (key: string) => { events.push({ type: 'error', key }); return { state: prev, events }; };

  switch (action.type) {
    case 'startRound': {
      if (run.phase !== 'map') return err('err.phase');
      startRound(run);
      break;
    }
    case 'capture': {
      const r = run.round;
      if (run.phase !== 'round' || !r) return err('err.phase');
      if (r.capturesLeft <= 0) return err('err.noCaptures');
      const rules = computeRules(run);
      const hand = r.hand.find(c => c.id === action.handId);
      const sel = r.table.filter(c => action.tableIds.includes(c.id));
      if (!hand || sel.length !== action.tableIds.length || !sel.length) return err('err.invalid');
      const hidden = sel.filter(c => c.faceDown);
      for (const c of hidden) c.faceDown = undefined;
      const best = bestOption(run, r, rules, hand, sel);
      if (!best) {
        if (!hidden.length) return err('err.invalid');
        // Promašaj u mraku (K5): skrivene karte se otkrivaju, karta iz ruke se spušta
        layCard(run, r, rules, hand.id, events, true);
        events.push({ type: 'missInDark' });
        refill(r, rules);
        checkRoundEnd(run, events);
        break;
      }
      const ev = best.ev;
      const held = r.hand.filter(c => c.id !== hand.id);
      const tabla = sel.length === r.table.length;
      const res = scoreCapture({ run, round: r, rules, type: ev.type, groups: ev.groups, handCard: hand, tableCards: sel, held, tabla, preview: false });
      r.score += res.total;
      run.money += res.money;
      if (run.roundIndex === 2 && r.boss === 'tax') run.money = Math.max(0, run.money - (BOSS.tax?.money ?? 1));
      r.hand = held;
      r.table = r.table.filter(c => !action.tableIds.includes(c.id));
      r.pile.push(hand, ...sel);
      r.capturesLeft--;
      r.capturesMade++;
      if (tabla) { r.tablas++; run.stats.tablas++; }
      r.bestCapture = Math.max(r.bestCapture, res.total);
      run.stats.captures++;
      run.stats.bestCapture = Math.max(run.stats.bestCapture, res.total);
      for (const reg of run.regulars) run.stats.regularCaptures[reg.id] = (run.stats.regularCaptures[reg.id] ?? 0) + 1;
      events.push({ type: 'captured', result: res, captureType: ev.type, groups: ev.groups, handCard: hand, tableCards: sel, tabla });
      if (res.brokenGlass.length) {
        run.deck = run.deck.filter(c => !res.brokenGlass.includes(c.id));
        run.stats.glassBroken += res.brokenGlass.length;
        events.push({ type: 'glassBroken', ids: res.brokenGlass });
      }
      if (run.roundIndex === 2 && r.boss === 'drunk_guest' && r.hand.length) {
        const i = int(run.rng, 'boss', r.hand.length);
        const [c] = r.hand.splice(i, 1);
        r.pile.push(c!);
        events.push({ type: 'discarded', card: c! });
      }
      refill(r, rules);
      checkRoundEnd(run, events);
      break;
    }
    case 'lay': {
      const r = run.round;
      if (run.phase !== 'round' || !r) return err('err.phase');
      const rules = computeRules(run);
      if (!r.hand.some(c => c.id === action.handId)) return err('err.invalid');
      const forced = mustForceLay(run);
      if (!forced && r.laysLeft <= 0) return err('err.noLays');
      if (!forced && r.table.length >= RULES.tableMax) return err('err.tableFull');
      layCard(run, r, rules, action.handId, events, forced);
      refill(r, rules);
      checkRoundEnd(run, events);
      break;
    }
    case 'useConsumable': {
      const id = run.consumables[action.index];
      if (!id) return err('err.invalid');
      const ok = useConsumable(run, id, action.targets ?? [], 'hand');
      if (ok !== true) return err(ok);
      run.consumables.splice(action.index, 1);
      events.push({ type: 'consumableUsed', id });
      if (run.round && run.phase === 'round') checkRoundEnd(run, events);
      break;
    }
    case 'sellConsumable': {
      const id = run.consumables[action.index];
      if (!id) return err('err.invalid');
      run.consumables.splice(action.index, 1);
      run.money += 1;
      break;
    }
    case 'collect': {
      if (run.phase !== 'cashout' || !run.cashout) return err('err.phase');
      const total = run.cashout.reduce((a, l) => a + l.amount, 0);
      run.money += total;
      run.cashout = undefined;
      run.stats.maxMoney = Math.max(run.stats.maxMoney, run.money);
      if (run.tutorial !== undefined) { run.phase = 'won'; break; }
      if (run.roundIndex === 2 && run.ante === 8 && !run.endless) { run.phase = 'won'; events.push({ type: 'runWon' }); break; }
      enterShop(run);
      break;
    }
    case 'buy': {
      if (run.phase !== 'shop' || !run.shop) return err('err.phase');
      const it = run.shop.items[action.index];
      if (!it || it.sold) return err('err.invalid');
      if (run.money < it.price) return err('err.money');
      const rules = computeRules(run);
      if (it.kind === 'regular') {
        if (run.regulars.length >= rules.regularSlots && it.edition !== 'negative') return err('err.slots');
        run.regulars.push(makeRegular(run, it.id, it.edition, it.price));
        events.push({ type: 'regularAdded', id: it.id });
      } else {
        if (run.consumables.length >= rules.consumableSlots) return err('err.consSlots');
        run.consumables.push(it.id);
      }
      run.money -= it.price;
      it.sold = true;
      break;
    }
    case 'buyPack': {
      if (run.phase !== 'shop' || !run.shop) return err('err.phase');
      const p = run.shop.packs[action.index];
      if (!p || p.sold) return err('err.invalid');
      if (run.money < p.price) return err('err.money');
      run.money -= p.price;
      p.sold = true;
      openPack(run, p.id);
      break;
    }
    case 'buyVoucher': {
      if (run.phase !== 'shop' || !run.anteVoucher || run.anteVoucherBought) return err('err.invalid');
      const price = shopPrice(run, VOUCHERS.find(v => v.id === run.anteVoucher)!.cost);
      if (run.money < price) return err('err.money');
      run.money -= price;
      run.vouchers.push(run.anteVoucher);
      run.anteVoucherBought = true;
      break;
    }
    case 'reroll': {
      if (run.phase !== 'shop' || !run.shop) return err('err.phase');
      if (run.money < run.shop.rerollCost) return err('err.money');
      run.money -= run.shop.rerollCost;
      run.shop.rerollCost++;
      run.shop.items = genShopItems(run);
      break;
    }
    case 'sellRegular': {
      const i = run.regulars.findIndex(r => r.uid === action.uid);
      if (i < 0 || run.phase === 'round') return err('err.invalid');
      const rules = computeRules(run);
      const inst = run.regulars[i]!;
      let gainM = sellPrice(run, inst, rules);
      run.regulars.forEach((_r, j) => { if (j === i) return; const res = resolveRegular(run, j); if (res?.hooks.onSell) gainM += res.hooks.onSell(run, res.inst, res.def); });
      run.regulars.splice(i, 1);
      run.money += gainM;
      break;
    }
    case 'moveRegular': {
      const { from, to } = action;
      if (from < 0 || to < 0 || from >= run.regulars.length || to >= run.regulars.length) return err('err.invalid');
      const [x] = run.regulars.splice(from, 1);
      run.regulars.splice(to, 0, x!);
      break;
    }
    case 'packPick': {
      const p = run.pack;
      if (run.phase !== 'pack' || !p) return err('err.phase');
      const opt = p.options[action.index];
      if (!opt || p.taken.includes(action.index)) return err('err.invalid');
      const rules = computeRules(run);
      if (opt.kind === 'regular') {
        if (run.regulars.length >= rules.regularSlots && opt.edition !== 'negative') return err('err.slots');
        run.regulars.push(makeRegular(run, opt.id, opt.edition));
        events.push({ type: 'regularAdded', id: opt.id });
      } else if (opt.kind === 'brandy') {
        const r = useConsumable(run, opt.id, [], 'pack');
        if (r !== true) return err(r);
        events.push({ type: 'consumableUsed', id: opt.id });
      } else if (opt.kind === 'cup') {
        const r = useConsumable(run, opt.id, action.targets ?? [], 'pack');
        if (r !== true) return err(r);
        events.push({ type: 'consumableUsed', id: opt.id });
      } else {
        run.deck.push(opt.card);
      }
      p.taken.push(action.index);
      p.picksLeft--;
      if (p.picksLeft <= 0) { run.pack = undefined; run.phase = 'shop'; }
      break;
    }
    case 'packSkip': {
      if (run.phase !== 'pack') return err('err.phase');
      run.pack = undefined;
      run.phase = 'shop';
      break;
    }
    case 'leaveShop': {
      if (run.phase !== 'shop') return err('err.phase');
      run.shop = undefined;
      if (run.roundIndex === 2) {
        run.ante++;
        run.roundIndex = 0;
        startAnte(run);
      } else run.roundIndex = (run.roundIndex + 1) as 0 | 1 | 2;
      run.phase = 'map';
      break;
    }
    case 'continueEndless': {
      if (run.phase !== 'won' || run.tutorial !== undefined) return err('err.phase');
      run.endless = true;
      enterShop(run);
      break;
    }
  }
  run.stats.maxMoney = Math.max(run.stats.maxMoney, run.money);
  return { state: run, events };
}

/** Spuštanje / prisilno spuštanje / prisilno odbacivanje (DESIGN_REVIEW K8, K10, K11). */
function layCard(run: RunState, r: RoundState, _rules: Rules, handId: string, events: GameEvent[], forced: boolean) {
  const idx = r.hand.findIndex(c => c.id === handId);
  const [card] = r.hand.splice(idx, 1);
  if (r.table.length >= RULES.tableMax) {
    // prisilno odbacivanje: nije lay događaj
    if (r.laysLeft > 0) r.laysLeft--; else r.capturesLeft--;
    r.pile.push(card!);
    events.push({ type: 'laid', card: card!, forced: true, discarded: true });
    return;
  }
  if (r.laysLeft > 0) r.laysLeft--; else r.capturesLeft--;
  r.table.push(card!);
  if (card!.seal === 'blue' && !r.flags['blue:' + card!.id]) { r.flags['blue:' + card!.id] = 1; r.laysLeft++; }
  r.laysMade++;
  run.stats.lays++;
  run.regulars.forEach((_reg, i) => { const res = resolveRegular(run, i); if (res && !res.isCopy) res.hooks.onLay?.(run, r, res.inst, res.def, card!); });
  events.push({ type: 'laid', card: card!, forced, discarded: false });
}

function startRound(run: RunState) {
  run.phase = 'round';
  const isBoss = run.roundIndex === 2;
  const boss = isBoss ? run.bossForAnte : undefined;
  run.regulars.forEach(r => { r.disabled = false; });
  if (boss === 'chain_owner' && run.regulars[0]) run.regulars[0].disabled = true;
  const rules = computeRules(run, isBoss);
  const round: RoundState = {
    table: [], hand: [], drawPile: [], pile: [],
    capturesLeft: rules.captures, laysLeft: rules.lays,
    score: 0, target: targetFor(run), boss,
    capturesMade: 0, laysMade: 0, tablas: 0, bestCapture: 0, flags: {},
  };
  const script = run.tutorial !== undefined ? TUTORIAL[run.tutorial] : undefined;
  if (script) {
    const byKey = (k: string) => scriptedCard(k);
    round.table = script.table.map(byKey);
    round.hand = script.hand.map(byKey);
    round.drawPile = script.draw.map(byKey);
    round.target = script.target;
    round.capturesLeft = script.captures;
    round.laysLeft = script.lays;
    round.scripted = true;
  } else {
    round.drawPile = shuffle(run.rng, 'deal', run.deck.map(c => ({ ...c })));
    for (let i = 0; i < RULES.tableStart && round.drawPile.length; i++) round.table.push(round.drawPile.shift()!);
    for (let i = 0; i < rules.handSize && round.drawPile.length; i++) round.hand.push(round.drawPile.shift()!);
    const fd = boss ? BOSS[boss]?.faceDown ?? 0 : 0;
    for (let i = 0; i < fd && i < round.table.length; i++) round.table[i]!.faceDown = true;
  }
  run.round = round;
}

/** "10D" → 10♦ karta za tutorijal. */
export function scriptedCard(k: string): Card {
  const suit = k.slice(-1) as Suit;
  const r = k.slice(0, -1);
  const rank = (r === 'A' ? 1 : r === 'J' ? 11 : r === 'Q' ? 12 : r === 'K' ? 13 : Number(r)) as Rank;
  return { id: 't' + k, suit, rank };
}

function checkRoundEnd(run: RunState, events: GameEvent[]) {
  const r = run.round!;
  if (r.score >= r.target) {
    run.phase = 'cashout';
    const rules = computeRules(run, false);
    const lines: RunState['cashout'] = [];
    const isBoss = run.roundIndex === 2;
    const noBossMoney = isBoss && run.stakeLevel >= 1;
    const interest = interestFor(run, rules);
    if (interest > 0) lines.push({ key: 'cash.interest', amount: interest });
    lines.push({ key: noBossMoney ? 'cash.rewardRestaurant' : 'cash.reward', amount: noBossMoney ? 0 : RULES.roundReward[run.roundIndex]! });
    if (r.capturesLeft > 0) lines.push({ key: 'cash.unused', amount: r.capturesLeft * RULES.unusedCaptureMoney, params: { n: r.capturesLeft } });
    run.regulars.forEach((_reg, i) => {
      const res = resolveRegular(run, i);
      const m = res?.hooks.onRoundEnd?.(run, res.inst, res.def) ?? 0;
      if (m) lines.push({ key: 'cash.regular', amount: m, params: { id: res!.inst.id } });
    });
    run.cashout = lines;
    events.push({ type: 'roundWon' });
    if (isBoss && r.boss) {
      run.usedBosses.push(r.boss);
      run.stats.bossesBeaten++;
      run.regulars.forEach((_reg, i) => { const res = resolveRegular(run, i); res?.hooks.onBossDefeated?.(run, res.inst, res.def, rules); });
      events.push({ type: 'bossDefeated', id: r.boss });
    }
    run.regulars.forEach(x => { x.disabled = false; });
    run.round = undefined;
    return;
  }
  const lost = r.capturesLeft <= 0 || (!r.hand.length && !r.drawPile.length);
  if (lost) {
    run.phase = 'gameover';
    events.push({ type: 'roundLost' });
  }
}

// ---------- šank ----------
function shopPrice(run: RunState, base: number): number {
  const rules = computeRules(run);
  return Math.max(1, Math.floor(base * (1 - rules.discount))) + rules.shopExtra;
}

function rollEdition(run: RunState, allowNegative = true): EditionId | undefined {
  const x = next(run.rng, 'edition');
  const c = RULES.editionChances;
  if (x < c.poly) return 'poly';
  if (allowNegative && x < c.poly + c.negative) return 'negative';
  if (x < c.poly + c.negative + c.holo) return 'holo';
  if (x < c.poly + c.negative + c.holo + c.foil) return 'foil';
  return undefined;
}

function rollRegular(run: RunState, exclude: Set<string>, allowLegendary: boolean): string {
  for (let tries = 0; tries < 12; tries++) {
    let rarity: string = weighted(run.rng, 'shop', RULES.rarityWeights as Record<string, number>);
    if (allowLegendary && next(run.rng, 'shop') < RULES.legendaryPackChance) rarity = 'legendary';
    const pool = REGULARS.filter(r => r.rarity === rarity && !exclude.has(r.id));
    if (pool.length) return pick(run.rng, 'shop', pool).id;
  }
  return pick(run.rng, 'shop', REGULARS.filter(r => r.rarity !== 'legendary')).id;
}

function genShopItems(run: RunState): ShopItem[] {
  const rules = computeRules(run);
  const items: ShopItem[] = [];
  const owned = new Set(run.regulars.map(r => r.id));
  const w = { ...RULES.shopWeights, brandy: RULES.shopWeights.brandy * rules.brandyWeightMul };
  for (let i = 0; i < rules.shopSlots; i++) {
    const kind = weighted(run.rng, 'shop', w as Record<string, number>);
    if (kind === 'regular') {
      const id = rollRegular(run, new Set([...owned, ...items.filter(x => x.kind === 'regular').map(x => x.id)]), false);
      const edition = rollEdition(run);
      const extra = edition ? (RULES.editionCost as Record<string, number>)[edition] ?? 0 : 0;
      items.push({ kind: 'regular', id, edition, price: shopPrice(run, regDef(id).cost + extra) });
    } else if (kind === 'brandy') {
      const id = pick(run.rng, 'shop', BRANDIES.filter(b => !b.packOnly)).id;
      items.push({ kind: 'brandy', id, price: shopPrice(run, BRANDY[id]!.cost) });
    } else {
      const id = pick(run.rng, 'shop', CUPS).id;
      items.push({ kind: 'cup', id, price: shopPrice(run, CUP[id]!.cost) });
    }
  }
  return items;
}

function enterShop(run: RunState) {
  run.phase = 'shop';
  const packs = [0, 1].map(() => {
    const id = weighted(run.rng, 'shop', Object.fromEntries(PACKS.map(p => [p.id, p.weight])) as Record<string, number>);
    return { id, price: shopPrice(run, PACK[id]!.cost) };
  });
  const items = genShopItems(run);
  if (run.firstRun && run.ante === 1 && run.roundIndex === 0 && !run.regulars.some(r => r.id === 'waiter')) {
    items[0] = { kind: 'regular', id: 'waiter', price: shopPrice(run, regDef('waiter').cost) };
  }
  run.shop = { items, packs, rerollCost: RULES.rerollBase };
}

export function sellPrice(run: RunState, inst: RegularInstance, rules = computeRules(run)): number {
  const paid = inst.paid ?? REG[inst.id]!.cost;
  const selfBonus = inst.id === 'smuggler' ? 1 : 0; // prodaja samog Švercera ne okida njegov efekat (K28)
  return Math.max(1, Math.floor(paid / 2)) + rules.sellBonus - selfBonus;
}

export function voucherPrice(run: RunState): number {
  const v = VOUCHERS.find(x => x.id === run.anteVoucher);
  return v ? shopPrice(run, v.cost) : 0;
}

function makeRegular(run: RunState, id: string, edition?: EditionId, paid?: number): RegularInstance {
  const inst: RegularInstance = { id, uid: uid(run, 'r'), counters: {} };
  if (edition) inst.edition = edition;
  const d = REG[id]!;
  inst.paid = paid ?? d.cost + (edition ? (RULES.editionCost as Record<string, number>)[edition] ?? 0 : 0);
  if (d.rarity === 'rare' || d.rarity === 'legendary') run.stats.hadRare = true;
  return inst;
}

// ---------- ture ----------
function randomCard(run: RunState, enhChance: number, sealChance: number): Card {
  const suit = pick(run.rng, 'pack', SUITS);
  const rank = (1 + int(run.rng, 'pack', 13)) as Rank;
  const c: Card = { id: uid(run, 'n'), suit, rank };
  if (next(run.rng, 'pack') < enhChance) c.enhancement = pick(run.rng, 'pack', ['gold', 'glass', 'bonus', 'mult', 'wild', 'steel'] as EnhId[]);
  if (next(run.rng, 'pack') < sealChance) c.seal = pick(run.rng, 'pack', ['red', 'gold_seal', 'blue'] as SealId[]);
  const ed = rollEdition(run, false);
  if (ed) c.edition = ed;
  return c;
}

function openPack(run: RunState, packId: string) {
  const def = PACK[packId]!;
  let kind = def.kind;
  if (kind === 'mega') kind = pick(run.rng, 'pack', ['regulars', 'brandy', 'cups', 'cards'] as const);
  const options: PackOption[] = [];
  const seen = new Set<string>(run.regulars.map(r => r.id));
  let cards: Card[] = [];
  for (let i = 0; i < def.options; i++) {
    if (kind === 'regulars') {
      const id = rollRegular(run, seen, true); seen.add(id);
      options.push({ kind: 'regular', id, edition: rollEdition(run) });
    } else if (kind === 'brandy') {
      const mead = BRANDY.mead!;
      const id = next(run.rng, 'pack') < (mead.packChance ?? 0) ? mead.id : pick(run.rng, 'pack', BRANDIES.filter(b => !b.packOnly)).id;
      options.push({ kind: 'brandy', id });
    } else if (kind === 'cups') {
      options.push({ kind: 'cup', id: pick(run.rng, 'pack', CUPS).id });
    } else {
      options.push({ kind: 'card', card: randomCard(run, PACK.pack_cards!.enhChance ?? 0.3, PACK.pack_cards!.sealChance ?? 0.1) });
    }
  }
  if (kind === 'cups') cards = shuffle(run.rng, 'pack', run.deck.map(c => ({ ...c }))).slice(0, PACK.pack_cups!.cards ?? 6);
  run.pack = { id: packId, options, picksLeft: def.picks, cards, taken: [] };
  run.phase = 'pack';
}

// ---------- potrošni predmeti ----------
/** Vraća true ili i18n ključ greške. `where`: 'hand' = mete su karte u ruci, 'pack' = karte iz ture fildžana. */
function useConsumable(run: RunState, id: string, targets: string[], where: 'hand' | 'pack'): true | string {
  const brandy = BRANDY[id];
  if (brandy) {
    const keys: LevelKey[] = brandy.target === 'all' ? ['pair', 'sum', 'double', 'triple', 'tabla'] : [brandy.target];
    for (const k of keys) run.levels[k]++;
    run.stats.brandiesUsed++;
    if (id !== 'cup_sun') run.lastConsumable = id;
    return true;
  }
  const cup = CUP[id];
  if (!cup) return 'err.invalid';
  const pool: Card[] = where === 'pack' ? run.pack?.cards ?? [] : run.round?.hand ?? [];
  const sel = targets.map(t => pool.find(c => c.id === t)).filter((c): c is Card => !!c);
  if (cup.max > 0) {
    if (where === 'hand' && run.phase !== 'round') return 'err.cupNeedsRound';
    if (sel.length < (cup.min ?? 1) || sel.length > cup.max || sel.length !== targets.length) return 'err.targets';
  }
  if (cup.moneyCap !== undefined) run.money += Math.min(Math.max(0, run.money), cup.moneyCap);
  else if (cup.copyLast) {
    if (!run.lastConsumable) return 'err.nothingToCopy';
    if (run.consumables.length > computeRules(run).consumableSlots) return 'err.consSlots';
    run.consumables.push(run.lastConsumable);
  } else if (cup.enh) for (const c of sel) { c.enhancement = cup.enh; syncDeckCard(run, c); }
  else if (cup.suit) for (const c of sel) { c.suit = cup.suit; syncDeckCard(run, c); }
  else if (cup.rankUp) for (const c of sel) { c.rank = (c.rank === 13 ? 1 : c.rank + 1) as Rank; syncDeckCard(run, c); }
  else if (cup.destroy) {
    const ids = sel.map(c => c.id);
    run.deck = run.deck.filter(c => !ids.includes(c.id));
    if (where === 'hand' && run.round) { run.round.hand = run.round.hand.filter(c => !ids.includes(c.id)); refill(run.round, computeRules(run)); }
    if (where === 'pack' && run.pack) run.pack.cards = run.pack.cards.filter(c => !ids.includes(c.id));
  } else if (cup.mirror) {
    const [a, b] = sel;
    if (!a || !b) return 'err.targets';
    a.suit = b.suit; a.rank = b.rank; a.enhancement = b.enhancement; a.seal = b.seal; a.edition = b.edition;
    syncDeckCard(run, a);
  }
  run.stats.cupsUsed++;
  if (id !== 'cup_sun') run.lastConsumable = id;
  return true;
}

export function allContentIds() {
  return { regulars: REGULARS.map(r => r.id), bosses: BOSSES.map(b => b.id), cups: CUPS.map(c => c.id), brandies: BRANDIES.map(b => b.id), vouchers: VOUCHERS.map(v => v.id), packs: PACKS.map(p => p.id) };
}
