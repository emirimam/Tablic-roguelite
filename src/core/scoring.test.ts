import { describe, expect, it } from 'vitest';
import { scoreCapture, type ScoreResult } from './scoring.ts';
import { computeRules } from './rules.ts';
import { evaluateSelection } from './capture.ts';
import { C, runWith, setRound } from './testutil.ts';
import type { Card, RunState } from './types.ts';

function score(run: RunState, hand: Card, sel: Card[], held: Card[] = [], tableExtra: Card[] = []): ScoreResult {
  setRound(run, [...sel, ...tableExtra], [hand, ...held]);
  const ev = evaluateSelection(hand, sel, computeRules(run).aceAny)!;
  return scoreCapture({ run, round: run.round!, rules: computeRules(run), type: ev.type, groups: ev.groups, handCard: hand, tableCards: sel, held, tabla: tableExtra.length === 0, preview: true });
}
const noTabla = [C('KC')]; // dodatna karta na stolu da ne bude Tabla

describe('golden: bazno bodovanje (GDD §5)', () => {
  it('Par 7/7 = (10+7+7)×1 = 24', () => expect(score(runWith(), C('7C'), [C('7H')], [], noTabla).total).toBe(24));
  it('Zbir 10 = 3+7 → (20+10+3+7)×2 = 80', () => expect(score(runWith(), C('10C'), [C('3H'), C('7D')], [], noTabla).total).toBe(80));
  it('Dupla 9 → (30+9+9+4+5)×3 = 171', () => expect(score(runWith(), C('9H'), [C('9C'), C('4D'), C('5H')], [], noTabla).total).toBe(171));
  it('Trostruka 10 → (50+10+10+3+7+4+6)×4 = 360', () => expect(score(runWith(), C('10H'), [C('3H'), C('7D'), C('4C'), C('6S'), C('10S')], [], noTabla).total).toBe(360));
  it('Velika desetka: 10♦ nosi 10♠ → (10+30+10)×1 = 50', () => expect(score(runWith(), C('10D'), [C('10S')], [], noTabla).total).toBe(50));
  it('Dupla + Tabla (tutorijal 3): 106 × 6 = 636', () => expect(score(runWith(), C('KC'), [C('JS'), C('2S'), C('6C'), C('5D'), C('3H')]).total).toBe(636));
  it('level 2 Par: (20+7+7)×2 = 68', () => { const r = runWith(); r.levels.pair = 2; expect(score(r, C('7C'), [C('7H')], [], noTabla).total).toBe(68); });
  it('Tabla level 2: +65 chips i ×2,5', () => {
    const r = runWith(); r.levels.tabla = 2;
    // Zbir + Tabla: (20+10+3+7+65) × (2×2,5) = 105 × 5 = 525
    expect(score(r, C('10C'), [C('3H'), C('7D')]).total).toBe(525);
  });
});

describe('golden: poboljšanja, pečati, edicije', () => {
  it('Bonus karta +30 chips → 54', () => expect(score(runWith(), C('7C', { enhancement: 'bonus' }), [C('7H')], [], noTabla).total).toBe(54));
  it('Mult karta +4 mult → 24×5 = 120', () => expect(score(runWith(), C('7C', { enhancement: 'mult' }), [C('7H')], [], noTabla).total).toBe(120));
  it('Staklena ×2 → 48', () => expect(score(runWith(), C('7C', { enhancement: 'glass' }), [C('7H')], [], noTabla).total).toBe(48));
  it('Crveni pečat ponavlja kartu → 10+7+7+7 = 31', () => expect(score(runWith(), C('7C'), [C('7H', { seal: 'red' })], [], noTabla).total).toBe(31));
  it('Staklena s crvenim pečatom = ×4 (K13)', () => expect(score(runWith(), C('7C', { enhancement: 'glass', seal: 'red' }), [C('7H')], [], noTabla).total).toBe(31 * 4));
  it('Čelična u ruci ×1,5 → 36', () => expect(score(runWith(), C('7C'), [C('7H')], [C('2S', { enhancement: 'steel' })], noTabla).total).toBe(36));
  it('Folija +50, Holo +10, Polikrom ×1,5', () => {
    expect(score(runWith(), C('7C', { edition: 'foil' }), [C('7H')], [], noTabla).total).toBe(74);
    expect(score(runWith(), C('7C', { edition: 'holo' }), [C('7H')], [], noTabla).total).toBe(24 * 11);
    expect(score(runWith(), C('7C', { edition: 'poly' }), [C('7H')], [], noTabla).total).toBe(36);
  });
  it('Zlatna karta i zlatni pečat daju pare', () => {
    expect(score(runWith(), C('7C', { enhancement: 'gold', seal: 'gold_seal' }), [C('7H')], [], noTabla).money).toBe(6);
  });
});

describe('golden: gosti i redoslijed', () => {
  it('Konobar: 24 × 5 = 120', () => expect(score(runWith({ regulars: ['waiter'] }), C('7C'), [C('7H')], [], noTabla).total).toBe(120));
  it('Zaljubljeni: +3 mult za ♥ → 24 × 4 = 96', () => expect(score(runWith({ regulars: ['lover'] }), C('7C'), [C('7H')], [], noTabla).total).toBe(96));
  it('Kum ×1,5 na Duplu: 57 × 4,5 = 256', () => expect(score(runWith({ regulars: ['godfather'] }), C('9H'), [C('9C'), C('4D'), C('5H')], [], noTabla).total).toBe(256));
  it('redoslijed gostiju je bitan: Konobar pa Kum ≠ Kum pa Konobar', () => {
    const a = score(runWith({ regulars: ['waiter', 'godfather'] }), C('9H'), [C('9C'), C('4D'), C('5H')], [], noTabla).total;
    const b = score(runWith({ regulars: ['godfather', 'waiter'] }), C('9H'), [C('9C'), C('4D'), C('5H')], [], noTabla).total;
    expect(a).toBe(Math.floor(57 * 10.5));
    expect(b).toBe(Math.floor(57 * 8.5));
  });
  it('Matematičar ne radi na Paru, radi na Zbiru', () => {
    expect(score(runWith({ regulars: ['mathematician'] }), C('7C'), [C('7H')], [], noTabla).total).toBe(24);
    expect(score(runWith({ regulars: ['mathematician'] }), C('10C'), [C('3H'), C('7D')], [], noTabla).total).toBe(40 * 10);
  });
  it('Penzioner +40 na Par, Student +60 za tačno 3 karte', () => {
    expect(score(runWith({ regulars: ['pensioner'] }), C('7C'), [C('7H')], [], noTabla).total).toBe(64);
    expect(score(runWith({ regulars: ['student'] }), C('KC'), [C('3H'), C('5D'), C('6S')], [], noTabla).total).toBe((20 + 10 + 14 + 60) * 2);
  });
  it('Stari majstor: figure se retriggeruju 2 puta (K12)', () => {
    // K nosi K: (10 + 10×3 + 10×3) × 1 = 70
    expect(score(runWith({ regulars: ['old_master'] }), C('KC'), [C('KH')], [], [C('2S')]).total).toBe(70);
  });
  // Zbir + Tabla: chips 20+10+3+7+40 = 80; mult 2 × 3 (Gazdarica) × 2 (Tabla) = 12
  it('Gazdarica ×3 na Tabli', () => expect(score(runWith({ regulars: ['landlady'] }), C('10C'), [C('3H'), C('7D')]).total).toBe(960));
  it('Dvojnik kopira gosta desno', () => {
    expect(score(runWith({ regulars: ['double', 'waiter'] }), C('7C'), [C('7H')], [], noTabla).total).toBe(24 * 9);
    expect(score(runWith({ regulars: ['waiter', 'double'] }), C('7C'), [C('7H')], [], noTabla).total).toBe(24 * 5);
  });
  it('Kraljica kafane: ×1,5 za svaku Damu u ruci', () => {
    expect(score(runWith({ regulars: ['queen_of_kafana'] }), C('7C'), [C('7H')], [C('QS'), C('QD')], noTabla).total).toBe(Math.floor(24 * 2.25));
  });
  it('Đedo: +60 chips ako u ruci nema figura', () => {
    expect(score(runWith({ regulars: ['grandpa'] }), C('7C'), [C('7H')], [C('2S')], noTabla).total).toBe(84);
    expect(score(runWith({ regulars: ['grandpa'] }), C('7C'), [C('7H')], [C('JS')], noTabla).total).toBe(24);
  });
});

describe('golden: gazde', () => {
  it('Inspekcija: ♣ ne daju chips', () => expect(score(runWith({ boss: 'inspection' }), C('7C'), [C('7H')], [], noTabla).total).toBe(17));
  it('Penzija: figure ne daju chips ni efekte', () => expect(score(runWith({ boss: 'retirement', regulars: ['charmer'] }), C('KC'), [C('KH')], [], noTabla).total).toBe(10));
  it('Ruža na stolu: Tabla bez bonusa', () => expect(score(runWith({ boss: 'rose_on_table' }), C('10C'), [C('3H'), C('7D')]).total).toBe(80));
  it('Škrti gazda: Par boduje 0', () => expect(score(runWith({ boss: 'stingy' }), C('7C'), [C('7H')], [], noTabla).total).toBe(0));
  it('Privatna proslava: prvo nošenje 0', () => expect(score(runWith({ boss: 'private_party' }), C('7C'), [C('7H')], [], noTabla).total).toBe(0));
});

describe('ScoreStep pipeline', () => {
  it('prvi korak je bazni tip, koraci čuvaju tekuće stanje', () => {
    const r = score(runWith({ regulars: ['waiter'] }), C('7C'), [C('7H')], [], noTabla);
    expect(r.steps[0]!.source.kind).toBe('base');
    const last = r.steps[r.steps.length - 1]!;
    expect(last.chips * last.mult).toBe(r.total);
    expect(r.steps.map(s => s.source.kind)).toEqual(['base', 'card', 'card', 'regular']);
  });
  it('preview ne mijenja brojače gostiju koji rastu', () => {
    const run = runWith({ regulars: ['collector'] });
    score(run, C('7C'), [C('7H')], [], noTabla);
    expect(run.regulars[0]!.counters.chips ?? 0).toBe(0);
  });
});
