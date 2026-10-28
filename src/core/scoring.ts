import type { Card, CaptureType, RoundState, Rules, RunState } from './types.ts';
import { RULES } from './data.ts';
import { cardChips, isFace } from './cards.ts';
import { chance, type RngState } from './rng.ts';
import { resolveRegular } from './content/regulars.ts';
import type { CaptureCtx, Effect } from './content/hooks.ts';

export type StepSource =
  | { kind: 'base'; type: CaptureType; level: number }
  | { kind: 'card'; cardId: string }
  | { kind: 'enh'; cardId: string; enh: string }
  | { kind: 'edition'; cardId?: string; uid?: string; edition: string }
  | { kind: 'seal'; cardId: string; seal: string }
  | { kind: 'held'; cardId: string }
  | { kind: 'regular'; uid: string; id: string }
  | { kind: 'tabla'; level: number }
  | { kind: 'boss'; id: string }
  | { kind: 'retrigger'; cardId: string };

export interface ScoreStep {
  source: StepSource;
  chipsDelta: number;
  multDelta: number;
  xMult: number;
  money: number;
  /** stanje nakon koraka */
  chips: number;
  mult: number;
}

export interface ScoreResult {
  steps: ScoreStep[];
  chips: number;
  mult: number;
  total: number;
  money: number;
  brokenGlass: string[];
}

export interface ScoreInput {
  run: RunState;
  round: RoundState;
  rules: Rules;
  type: CaptureType;
  groups: number;
  handCard: Card;
  tableCards: Card[];
  held: Card[];
  tabla: boolean;
  preview: boolean;
}

const CAP = 1e300;

export function scoreCapture(inp: ScoreInput): ScoreResult {
  const { run, round, type, tabla, preview } = inp;
  const boss = run.phase === 'round' && run.roundIndex === 2 ? round.boss : undefined;
  // Preview koristi klon RNG-a i ne otkriva šanse; stvarno bodovanje vuče iz 'scoring' streama.
  const rng: RngState = preview ? structuredClone(run.rng) : run.rng;
  const ctx: CaptureCtx = {
    ...inp,
    tablaBonus: tabla && boss !== 'rose_on_table',
    roll: (n: number) => (preview ? false : chance(rng, 'scoring', n)),
  };
  let chips = 0, mult = 0, money = 0;
  const steps: ScoreStep[] = [];
  const brokenGlass: string[] = [];
  const push = (source: StepSource, e: Effect) => {
    const cd = e.chips ?? 0, md = e.mult ?? 0, x = e.xMult ?? 1, m = e.money ?? 0;
    if (!cd && !md && x === 1 && !m) return;
    chips = Math.min(CAP, chips + cd);
    mult = Math.min(CAP, (mult + md) * x);
    money += m;
    steps.push({ source, chipsDelta: cd, multDelta: md, xMult: x, money: m, chips, mult });
  };

  // 1. Bazni chips i mult tipa nošenja (po levelu)
  const lv = run.levels[type];
  const base = RULES.captureTypes[type];
  chips = base.chips + base.lvChips * (lv - 1);
  mult = base.mult + base.lvMult * (lv - 1);
  steps.push({ source: { kind: 'base', type, level: lv }, chipsDelta: chips, multDelta: mult, xMult: 1, money: 0, chips, mult });

  const regs = run.regulars.map((_, i) => resolveRegular(run, i));
  const facesDead = boss === 'retirement';
  const glassCards: Card[] = [];

  // 2. Karte: prvo karta iz ruke, zatim nošene karte slijeva nadesno
  for (const card of [inp.handCard, ...inp.tableCards]) {
    const dead = facesDead && isFace(card);
    let triggers = 1;
    if (!dead) {
      if (card.seal === 'red') triggers += 1;
      for (const r of regs) if (r?.hooks.retrigger) triggers += r.hooks.retrigger(ctx, r.inst, r.def, card);
    }
    for (let t = 0; t < triggers; t++) {
      const src: StepSource = t === 0 ? { kind: 'card', cardId: card.id } : { kind: 'retrigger', cardId: card.id };
      // a) chips karte
      let c = cardChips(card);
      if (boss === 'inspection' && card.suit === 'C') c = 0;
      if (dead) c = 0;
      push(src, { chips: c });
      if (dead) continue;
      // b) poboljšanje
      const enh = card.enhancement;
      const noChips = boss === 'inspection' && card.suit === 'C';
      if (enh === 'bonus' && !noChips) push({ kind: 'enh', cardId: card.id, enh }, { chips: RULES.enhancements.bonus.chips });
      if (enh === 'mult') push({ kind: 'enh', cardId: card.id, enh }, { mult: RULES.enhancements.mult.mult });
      if (enh === 'glass') push({ kind: 'enh', cardId: card.id, enh }, { xMult: RULES.enhancements.glass.xMult });
      if (enh === 'gold') push({ kind: 'enh', cardId: card.id, enh }, { money: RULES.enhancements.gold.money });
      if (card.seal === 'gold_seal') push({ kind: 'seal', cardId: card.id, seal: card.seal }, { money: RULES.seals.gold_seal.money });
      // c) edicija
      if (card.edition === 'foil' && !noChips) push({ kind: 'edition', cardId: card.id, edition: 'foil' }, { chips: RULES.editions.foil.chips });
      if (card.edition === 'holo') push({ kind: 'edition', cardId: card.id, edition: 'holo' }, { mult: RULES.editions.holo.mult });
      if (card.edition === 'poly') push({ kind: 'edition', cardId: card.id, edition: 'poly' }, { xMult: RULES.editions.poly.xMult });
      // e) gosti onCardScored, slijeva nadesno
      for (const r of regs) {
        const e = r?.hooks.onCardScored?.(ctx, r.inst, r.def, card);
        if (e) push({ kind: 'regular', uid: r!.uid, id: r!.inst.id }, e);
      }
    }
    if (!dead && card.enhancement === 'glass') glassCards.push(card);
  }

  // 3. Karte koje ostaju u ruci
  for (const card of inp.held) {
    if (facesDead && isFace(card)) continue;
    const reps = card.seal === 'red' ? 2 : 1;
    for (let k = 0; k < reps; k++) if (card.enhancement === 'steel') push({ kind: 'held', cardId: card.id }, { xMult: RULES.enhancements.steel.xMult });
    for (const r of regs) {
      const e = r?.hooks.onHeldCard?.(ctx, r.inst, r.def, card);
      if (e) push({ kind: 'regular', uid: r!.uid, id: r!.inst.id }, e);
    }
  }

  // 4. Gosti onCapture, slijeva nadesno, uključujući edicije gostiju
  for (const r of regs) {
    if (!r) continue;
    const e = r.hooks.onCapture?.(ctx, r.inst, r.def);
    if (e) push({ kind: 'regular', uid: r.uid, id: r.inst.id }, e);
    // edicija pripada gostu u slotu (kod Dvojnika: Dvojniku)
    const ed = run.regulars.find(x => x.uid === r.uid)?.edition;
    if (ed === 'foil') push({ kind: 'edition', uid: r.uid, edition: ed }, { chips: RULES.editions.foil.chips });
    if (ed === 'holo') push({ kind: 'edition', uid: r.uid, edition: ed }, { mult: RULES.editions.holo.mult });
    if (ed === 'poly') push({ kind: 'edition', uid: r.uid, edition: ed }, { xMult: RULES.editions.poly.xMult });
  }

  // 5. Tabla bonus
  if (tabla && boss !== 'rose_on_table') {
    const tl = run.levels.tabla;
    push({ kind: 'tabla', level: tl }, { chips: RULES.tabla.chips + RULES.tabla.lvChips * (tl - 1), xMult: RULES.tabla.xMult + RULES.tabla.lvX * (tl - 1) });
  }

  let total = Math.floor(Math.min(CAP, chips * mult) + 1e-9);
  // Pravila gazde koja poništavaju bodove
  if (boss === 'private_party' && round.capturesMade === 0) { total = 0; steps.push({ source: { kind: 'boss', id: boss }, chipsDelta: 0, multDelta: 0, xMult: 0, money: 0, chips, mult: 0 }); }
  if (boss === 'stingy' && type === 'pair') { total = 0; steps.push({ source: { kind: 'boss', id: boss }, chipsDelta: 0, multDelta: 0, xMult: 0, money: 0, chips, mult: 0 }); }

  // 6. afterScore (gosti koji rastu) — samo u stvarnom bodovanju
  if (!preview) for (const r of regs) if (r && !r.isCopy) r.hooks.afterScore?.(ctx, r.inst, r.def);
  // Staklo: jedno bacanje po karti po nošenju, nakon koraka 6 (DESIGN_REVIEW K13)
  for (const c of glassCards) if (ctx.roll(RULES.enhancements.glass.breakChance)) brokenGlass.push(c.id);

  return { steps, chips, mult, total, money, brokenGlass };
}

export function formatMult(m: number): string {
  return Number.isInteger(m) ? String(m) : m.toFixed(1);
}
