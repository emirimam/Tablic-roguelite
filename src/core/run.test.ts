import { describe, expect, it } from 'vitest';
import { apply, newRun, targetFor, sellPrice, mustForceLay, type Action } from './run.ts';
import { computeRules } from './rules.ts';
import { C, greedyAction, runWith, setRound } from './testutil.ts';
import { TUTORIAL } from './tutorial.ts';
import { serializeRun, deserializeRun } from './save.ts';
import { processEvents, newMeta } from './meta.ts';
import type { RunState } from './types.ts';

const ok = (run: RunState, a: Action) => {
  const r = apply(run, a);
  const e = r.events.find(x => x.type === 'error');
  if (e) throw new Error('action failed: ' + JSON.stringify(e));
  return r;
};

describe('runda: nošenje, dopuna, kraj', () => {
  it('nošenje uklanja karte, dodaje bodove i troši nošenje', () => {
    const run = setRound(runWith(), [C('7H'), C('KC'), C('3D')], [C('7C'), C('2S')], [C('9S'), C('4H')]);
    const { state, events } = ok(run, { type: 'capture', handId: 't7C', tableIds: ['t7H'] });
    expect(state.round!.score).toBe(24);
    expect(state.round!.capturesLeft).toBe(computeRules(run).captures - 1);
    expect(state.round!.table.map(c => c.id)).toEqual(['tKC', 't3D']);
    expect(events[0]!.type).toBe('captured');
  });
  it('K6: sto se dopunjava (ako ima < 2) prije ruke', () => {
    const run = setRound(runWith(), [C('7H'), C('KC')], [C('7C'), C('2S')], [C('9S'), C('4H'), C('5D'), C('6D')]);
    const { state } = ok(run, { type: 'capture', handId: 't7C', tableIds: ['t7H'] });
    expect(state.round!.table.map(c => c.id)).toEqual(['tKC', 't9S', 't4H', 't5D']);
    expect(state.round!.hand.map(c => c.id)).toContain('t6D');
  });
  it('nevalidno nošenje vraća grešku i ne mijenja stanje', () => {
    const run = setRound(runWith(), [C('7H'), C('KC')], [C('5C')]);
    const { state, events } = apply(run, { type: 'capture', handId: 't5C', tableIds: ['t7H'] });
    expect(state).toBe(run);
    expect(events[0]).toMatchObject({ type: 'error', key: 'err.invalid' });
  });
  it('pobjeda prelazi u isplatu; kamata je prvi red (K26)', () => {
    const run = setRound(runWith(), [C('7H'), C('KC')], [C('7C')], [], { target: 20 });
    run.money = 14;
    const { state } = ok(run, { type: 'capture', handId: 't7C', tableIds: ['t7H'] });
    expect(state.phase).toBe('cashout');
    expect(state.cashout![0]).toMatchObject({ key: 'cash.interest', amount: 2 });
    expect(state.cashout![1]).toMatchObject({ key: 'cash.reward', amount: 3 });
    const after = ok(state, { type: 'collect' }).state;
    expect(after.phase).toBe('shop');
    expect(after.money).toBe(14 + 2 + 3 + 4);
  });
  it('poraz kad se potroše nošenja', () => {
    const run = setRound(runWith(), [C('7H'), C('KC')], [C('7C'), C('2S')], [], { capturesLeft: 1, target: 1000 });
    expect(ok(run, { type: 'capture', handId: 't7C', tableIds: ['t7H'] }).state.phase).toBe('gameover');
  });
  it('poraz kad su ruka i špil prazni (K9)', () => {
    const run = setRound(runWith(), [C('7H'), C('KC')], [C('7C')], [], { target: 1000 });
    expect(ok(run, { type: 'capture', handId: 't7C', tableIds: ['t7H'] }).state.phase).toBe('gameover');
  });
});

describe('spuštanje', () => {
  it('spuštanje troši spuštanje i stavlja kartu desno', () => {
    const run = setRound(runWith(), [C('7H'), C('KC')], [C('3C'), C('2S')]);
    const { state } = ok(run, { type: 'lay', handId: 't3C' });
    expect(state.round!.laysLeft).toBe(2);
    expect(state.round!.table.at(-1)!.id).toBe('t3C');
  });
  it('bez spuštanja, a nošenje moguće: spuštanje nije dozvoljeno', () => {
    const run = setRound(runWith(), [C('7H'), C('KC')], [C('7C'), C('2S')], [], { laysLeft: 0 });
    expect(apply(run, { type: 'lay', handId: 't2S' }).events[0]).toMatchObject({ key: 'err.noLays' });
  });
  it('prisilno spuštanje (nema nošenja, nema spuštanja) košta nošenje i broji se kao spuštanje (K10)', () => {
    const run = setRound(runWith({ regulars: ['porter'] }), [C('7H'), C('KC')], [C('3C'), C('2S')], [], { laysLeft: 0 });
    expect(mustForceLay(run)).toBe(true);
    const { state, events } = ok(run, { type: 'lay', handId: 't3C' });
    expect(state.round!.capturesLeft).toBe(computeRules(run).captures - 1);
    expect(events[0]).toMatchObject({ type: 'laid', forced: true, discarded: false });
    expect(state.regulars[0]!.counters.chips).toBe(8);
  });
  it('pun sto i nema nošenja: prisilno odbacivanje, nije lay događaj (K8)', () => {
    const table = ['KH', 'KD', 'KS', 'QH', 'QD', 'QS', 'JH', 'JD', 'JS', '10H'].map(k => C(k));
    const run = setRound(runWith({ regulars: ['porter'] }), table, [C('2C'), C('3C')]);
    const { state, events } = ok(run, { type: 'lay', handId: 't2C' });
    expect(events[0]).toMatchObject({ discarded: true });
    expect(state.round!.table.length).toBe(10);
    expect(state.round!.laysLeft).toBe(2);
    expect(state.regulars[0]!.counters.chips ?? 0).toBe(0);
  });
  it('plavi pečat vraća spuštanje jednom po rundi', () => {
    const run = setRound(runWith(), [C('7H'), C('KC')], [C('3C', { seal: 'blue' }), C('2S')]);
    expect(ok(run, { type: 'lay', handId: 't3C' }).state.round!.laysLeft).toBe(3);
  });
});

describe('gazde', () => {
  it('Policijski sat: 3 nošenja; Tamburaši: ruka −1; Konobar žuri: 0 spuštanja', () => {
    expect(computeRules(setRound(runWith({ boss: 'curfew' }), [], [])).captures).toBe(3);
    expect(computeRules(setRound(runWith({ boss: 'tamburitza' }), [], [])).handSize).toBe(5);
    expect(computeRules(setRound(runWith({ boss: 'rush' }), [], [])).lays).toBe(0);
  });
  it('Porezna: −1 para po nošenju, nikad ispod 0', () => {
    const run = setRound(runWith({ boss: 'tax' }), [C('7H'), C('KC')], [C('7C'), C('2S')]);
    run.money = 3;
    expect(ok(run, { type: 'capture', handId: 't7C', tableIds: ['t7H'] }).state.money).toBe(2);
  });
  it('Pijani gost: nakon nošenja odbacuje kartu iz ruke', () => {
    const run = setRound(runWith({ boss: 'drunk_guest' }), [C('7H'), C('KC')], [C('7C'), C('2S'), C('3S')]);
    const { state, events } = ok(run, { type: 'capture', handId: 't7C', tableIds: ['t7H'] });
    expect(events.some(e => e.type === 'discarded')).toBe(true);
    expect(state.round!.hand.length).toBe(1);
  });
  it('Nestanak struje: promašaj u mraku otkriva kartu i spušta kartu iz ruke (K5)', () => {
    const run = setRound(runWith({ boss: 'darkness' }), [C('5H', { faceDown: true }), C('KC')], [C('7C'), C('2S')]);
    const { state, events } = ok(run, { type: 'capture', handId: 't7C', tableIds: ['t5H'] });
    expect(events.some(e => e.type === 'missInDark')).toBe(true);
    expect(state.round!.table.find(c => c.id === 't5H')!.faceDown).toBeFalsy();
    expect(state.round!.table.at(-1)!.id).toBe('t7C');
  });
  it('Nestanak struje: prisilno spuštanje ne gleda skrivene karte (regresija)', () => {
    const run = setRound(runWith({ boss: 'darkness' }), [C('7H', { faceDown: true }), C('KC')], [C('7C'), C('2S')], [], { laysLeft: 0 });
    expect(mustForceLay(run)).toBe(true);
    expect(apply(run, { type: 'lay', handId: 't2S' }).events[0]).toMatchObject({ type: 'laid', forced: true });
  });
  it('Nestanak struje: pogodak u mraku je normalno nošenje', () => {
    const run = setRound(runWith({ boss: 'darkness' }), [C('7H', { faceDown: true }), C('KC')], [C('7C'), C('2S')]);
    expect(ok(run, { type: 'capture', handId: 't7C', tableIds: ['t7H'] }).state.round!.score).toBe(24);
  });
  it('Vlasnik lanca: cilj ×1,5 i lijevi gost onesposobljen', () => {
    const run = newRun({ seed: 'X', seeded: true, deckId: 'deck_classic', stakeLevel: 0 });
    run.ante = 8; run.roundIndex = 2; run.bossForAnte = 'chain_owner';
    run.regulars = [{ id: 'waiter', uid: 'a', counters: {} }, { id: 'lover', uid: 'b', counters: {} }];
    expect(targetFor(run)).toBe(60000);
    const s = ok(run, { type: 'startRound' }).state;
    expect(s.regulars[0]!.disabled).toBe(true);
    expect(s.regulars[1]!.disabled).toBe(false);
  });
  it('svaka kafana bira gazdu s minAnte ≤ kafana', () => {
    for (let i = 0; i < 30; i++) {
      const run = newRun({ seed: 'S' + i, seeded: true, deckId: 'deck_classic', stakeLevel: 0 });
      expect(['inspection', 'tamburitza', 'private_party']).toContain(run.bossForAnte);
    }
  });
});

describe('šank, ture, ekonomija', () => {
  function shopRun(): RunState {
    const run = setRound(runWith(), [C('7H'), C('KC')], [C('7C')], [], { target: 1 });
    run.money = 50;
    return ok(ok(run, { type: 'capture', handId: 't7C', tableIds: ['t7H'] }).state, { type: 'collect' }).state;
  }
  it('Šank ima 2 predmeta i 2 ture; reroll poskupljuje', () => {
    const s = shopRun();
    expect(s.shop!.items.length).toBe(2);
    expect(s.shop!.packs.length).toBe(2);
    const r1 = ok(s, { type: 'reroll' }).state;
    expect(r1.shop!.rerollCost).toBe(6);
    expect(r1.money).toBe(s.money - 5);
  });
  it('kupovina gosta i prodaja za pola plaćene cijene', () => {
    let s = shopRun();
    s.shop!.items[0] = { kind: 'regular', id: 'waiter', price: 4 };
    s = ok(s, { type: 'buy', index: 0 }).state;
    expect(s.regulars.map(r => r.id)).toEqual(['waiter']);
    expect(sellPrice(s, s.regulars[0]!)).toBe(2);
    const sold = ok(s, { type: 'sellRegular', uid: s.regulars[0]!.uid }).state;
    expect(sold.money).toBe(s.money + 2);
  });
  it('Švercer: +3 pare kad prodaš drugog gosta', () => {
    const s = shopRun();
    s.regulars = [{ id: 'smuggler', uid: 'a', counters: {}, paid: 6 }, { id: 'waiter', uid: 'b', counters: {}, paid: 4 }];
    const after = ok(s, { type: 'sellRegular', uid: 'b' }).state;
    expect(after.money).toBe(s.money + 2 + 1 + 3);
  });
  it('nema slobodnog slota za gosta', () => {
    const s = shopRun();
    s.regulars = ['a', 'b', 'c', 'd', 'e'].map(u => ({ id: 'waiter', uid: u, counters: {} }));
    s.shop!.items[0] = { kind: 'regular', id: 'lover', price: 5 };
    expect(apply(s, { type: 'buy', index: 0 }).events[0]).toMatchObject({ key: 'err.slots' });
  });
  it('investicija Prekovremeni daje +1 nošenje', () => {
    const s = shopRun();
    s.anteVoucher = 'v_overtime';
    const before = computeRules(s).captures;
    expect(computeRules(ok(s, { type: 'buyVoucher' }).state).captures).toBe(before + 1);
  });
  it('Tura rakija: izbor odmah podiže level', () => {
    let s = shopRun();
    s.shop!.packs[0] = { id: 'pack_brandy', price: 4 };
    s = ok(s, { type: 'buyPack', index: 0 }).state;
    expect(s.phase).toBe('pack');
    s.pack!.options[0] = { kind: 'brandy', id: 'loza' };
    s = ok(s, { type: 'packPick', index: 0 }).state;
    expect(s.levels.sum).toBe(2);
    expect(s.phase).toBe('shop');
  });
  it('prva partija: prvi Šank garantuje Konobara', () => {
    const run = newRun({ seed: 'F1', seeded: false, deckId: 'deck_classic', stakeLevel: 0, firstRun: true });
    setRound(run, [C('7H'), C('KC')], [C('7C')], [], { target: 1 });
    const s = ok(ok(run, { type: 'capture', handId: 't7C', tableIds: ['t7H'] }).state, { type: 'collect' }).state;
    expect(s.shop!.items[0]).toMatchObject({ kind: 'regular', id: 'waiter' });
  });
  it('napuštanje Šanka: sljedeća runda, pa nova kafana nakon Gazde', () => {
    let s = shopRun();
    s = ok(s, { type: 'leaveShop' }).state;
    expect(s.roundIndex).toBe(1);
    s.phase = 'shop'; s.roundIndex = 2;
    s = ok(s, { type: 'leaveShop' }).state;
    expect(s.ante).toBe(2);
    expect(s.roundIndex).toBe(0);
  });
});

describe('fildžani', () => {
  function withCup(id: string, hand = [C('7C'), C('KD'), C('10D')]) {
    const run = setRound(runWith(), [C('3H'), C('KC')], hand);
    run.deck = [...run.deck, ...hand];
    run.consumables = [id];
    return run;
  }
  it('Šoljica sreće: karte postaju Zlatne i u špilu', () => {
    const s = ok(withCup('cup_luck'), { type: 'useConsumable', index: 0, targets: ['t7C'] }).state;
    expect(s.round!.hand[0]!.enhancement).toBe('gold');
    expect(s.deck.find(c => c.id === 't7C')!.enhancement).toBe('gold');
  });
  it('Ključ: K postaje A (K4)', () => {
    expect(ok(withCup('cup_key'), { type: 'useConsumable', index: 0, targets: ['tKD'] }).state.round!.hand[1]!.rank).toBe(1);
  });
  it('Ogledalo: lijeva karta postaje kopija desne', () => {
    const s = ok(withCup('cup_mirror'), { type: 'useConsumable', index: 0, targets: ['t7C', 'tKD'] }).state;
    expect(s.round!.hand[0]).toMatchObject({ rank: 13, suit: 'D' });
  });
  it('Krst uništava karte iz špila i ruke', () => {
    const s = ok(withCup('cup_cross'), { type: 'useConsumable', index: 0, targets: ['t7C'] }).state;
    expect(s.deck.some(c => c.id === 't7C')).toBe(false);
    expect(s.round!.hand.some(c => c.id === 't7C')).toBe(false);
  });
  it('Novčić udvostručuje pare do +20', () => {
    const r = withCup('cup_coin'); r.money = 30;
    expect(ok(r, { type: 'useConsumable', index: 0 }).state.money).toBe(50);
  });
  it('Sunce kopira posljednji iskorišteni predmet', () => {
    const r = withCup('cup_sun'); r.lastConsumable = 'loza';
    expect(ok(r, { type: 'useConsumable', index: 0 }).state.consumables).toEqual(['loza']);
  });
  it('previše meta je greška', () => {
    expect(apply(withCup('cup_sediment'), { type: 'useConsumable', index: 0, targets: ['t7C', 'tKD'] }).events[0]).toMatchObject({ key: 'err.targets' });
  });
});

describe('determinizam, snimanje, meta', () => {
  function playRun(seed: string, steps = 400): RunState {
    let run = newRun({ seed, seeded: true, deckId: 'deck_classic', stakeLevel: 0 });
    for (let i = 0; i < steps; i++) {
      let a: Action;
      if (run.phase === 'map') a = { type: 'startRound' };
      else if (run.phase === 'round') a = greedyAction(run);
      else if (run.phase === 'cashout') a = { type: 'collect' };
      else if (run.phase === 'shop') {
        const idx = run.shop!.items.findIndex(it => !it.sold && it.kind === 'regular' && it.price <= run.money && run.regulars.length < 5);
        a = idx >= 0 ? { type: 'buy', index: idx } : { type: 'leaveShop' };
      } else if (run.phase === 'pack') a = { type: 'packSkip' };
      else break;
      run = apply(run, a).state;
    }
    return run;
  }
  it('isti seed i iste akcije daju identično stanje', () => {
    expect(serializeRun(playRun('DETERM01'))).toBe(serializeRun(playRun('DETERM01')));
    expect(serializeRun(playRun('DETERM01'))).not.toBe(serializeRun(playRun('DETERM02')));
  });
  it('greedy bot prolazi bar prvu rundu u većini seedova', () => {
    let passed = 0;
    for (let i = 0; i < 20; i++) if (playRun('P' + i, 40).roundIndex > 0 || playRun('P' + i, 40).ante > 1) passed++;
    expect(passed).toBeGreaterThan(10);
  });
  it('snimanje: serialize/deserialize i migracija v0 → v1', () => {
    const run = playRun('SAVE0001', 30);
    expect(deserializeRun(serializeRun(run))).toEqual(run);
    const old = JSON.parse(serializeRun(run));
    delete old.uidCounter; old.version = 0;
    const migrated = deserializeRun(JSON.stringify(old))!;
    expect(migrated.version).toBe(1);
    expect(migrated.uidCounter).toBe(1000);
    expect(deserializeRun('{nije json')).toBeNull();
  });
  it('meta: prvo nošenje i Tabla otključavaju dostignuća (ne u seedovanoj partiji)', () => {
    const run = setRound(runWith(), [C('3H'), C('7D')], [C('10C'), C('2S')]);
    run.seeded = false;
    const { state, events } = ok(run, { type: 'capture', handId: 't10C', tableIds: ['t3H', 't7D'] });
    const res = processEvents(newMeta(), run, state, events);
    expect(res.achievements).toEqual(expect.arrayContaining(['first_capture', 'first_tabla']));
    run.seeded = true; state.seeded = true;
    expect(processEvents(newMeta(), run, state, events).achievements).toEqual([]);
  });
});

describe('tutorijal (DESIGN_REVIEW §2) — golden skripte', () => {
  function tut(i: number, actions: Action[]): number[] {
    let run = newRun({ seed: 'TUTOR', seeded: true, deckId: 'deck_classic', stakeLevel: 0, tutorial: i });
    run = ok(run, { type: 'startRound' }).state;
    const scores: number[] = [];
    for (const a of actions) {
      const { state, events } = ok(run, a);
      for (const e of events) if (e.type === 'captured') scores.push(e.result.total);
      run = state;
    }
    expect(run.phase).toBe('cashout');
    expect(TUTORIAL[i]).toBeDefined();
    return scores;
  }
  it('runda 1: 24 / 30 / 28', () => {
    expect(tut(0, [
      { type: 'capture', handId: 't7C', tableIds: ['t7H'] },
      { type: 'capture', handId: 'tKD', tableIds: ['tKS'] },
      { type: 'capture', handId: 't9H', tableIds: ['t9C'] },
    ])).toEqual([24, 30, 28]);
  });
  it('runda 2: 108 / 84', () => {
    expect(tut(1, [
      { type: 'capture', handId: 'tKD', tableIds: ['tAS', 't7D', 't6C'] },
      { type: 'capture', handId: 'tAH', tableIds: ['t9S', 't2H'] },
    ])).toEqual([108, 84]);
  });
  it('runda 3: 171 / 636', () => {
    expect(tut(2, [
      { type: 'capture', handId: 't9H', tableIds: ['t9C', 't4D', 't5H'] },
      { type: 'lay', handId: 't3H' },
      { type: 'capture', handId: 'tKC', tableIds: ['tJS', 't2S', 't6C', 't5D', 't3H'] },
    ])).toEqual([171, 636]);
  });
});
