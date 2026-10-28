import { describe, expect, it } from 'vitest';
import { applyClassic, newClassic, classicPoints, aiMove, bestMove, type ClassicState } from './classic.ts';
import { makeDeck } from './cards.ts';
import { DECK } from './data.ts';
import { C } from './testutil.ts';

function playMatch(seed: string, target: number): ClassicState {
  let s = newClassic(seed, target);
  for (let i = 0; i < 2000 && s.phase !== 'matchEnd'; i++) {
    if (s.phase === 'dealEnd') { s = applyClassic(s, { type: 'nextDeal' }).state; continue; }
    if (s.turn === 1) { s = applyClassic(s, { type: 'ai' }).state; continue; }
    // igrač igra istom heuristikom kao AI
    const m = aiMove(s);
    const r = applyClassic(s, m);
    expect(r.events[0]?.type).not.toBe('error');
    s = r.state;
  }
  return s;
}

describe('klasični Tablić', () => {
  it('bodovi karata u špilu su ukupno 22', () => {
    expect(makeDeck(DECK.deck_classic!).reduce((a, c) => a + classicPoints(c), 0)).toBe(22);
    expect(classicPoints(C('10D'))).toBe(2);
    expect(classicPoints(C('2C'))).toBe(1);
    expect(classicPoints(C('5H'))).toBe(0);
  });
  it('dijeljenje: 4 na sto, po 6 u ruke, igrač počinje prvo dijeljenje', () => {
    const s = newClassic('DEAL', 101);
    expect(s.table.length).toBe(4);
    expect(s.hands[0].length).toBe(6);
    expect(s.hands[1].length).toBe(6);
    expect(s.drawPile.length).toBe(36);
    expect(s.turn).toBe(0);
  });
  it('nošenje, Tabla i +1 bod', () => {
    const s = newClassic('T', 101);
    s.table = [C('3H'), C('7D')];
    s.hands[0] = [C('10C'), C('2S')];
    const r = applyClassic(s, { type: 'capture', handId: 't10C', tableIds: ['t3H', 't7D'] });
    expect(r.state.tablas[0]).toBe(1);
    expect(r.state.lastMove).toMatchObject({ kind: 'capture', tabla: true, points: 2 });
    expect(r.state.turn).toBe(1);
  });
  it('nevalidno nošenje i potez van reda su greške', () => {
    const s = newClassic('E', 101);
    s.table = [C('3H')]; s.hands[0] = [C('9C')];
    expect(applyClassic(s, { type: 'capture', handId: 't9C', tableIds: ['t3H'] }).events[0]).toMatchObject({ type: 'error' });
    expect(applyClassic(s, { type: 'ai' }).events[0]).toMatchObject({ type: 'error' });
  });
  it('kraj dijeljenja: sve karte podijeljene, 22 boda + 3 za većinu karata, ostatak stola ide zadnjem koji je nosio', () => {
    const s = playMatch('ONEDEAL1', 0);
    expect(s.phase).toBe('matchEnd');
    const r = s.dealResult!;
    expect(r.cardsCount[0] + r.cardsCount[1]).toBe(52);
    expect(r.cardPoints[0] + r.cardPoints[1]).toBe(22);
    expect(r.mostCards[0] + r.mostCards[1]).toBe(r.cardsCount[0] === 26 ? 0 : 3);
    expect(s.table.length).toBe(0);
  });
  it('Tabla posljednjim potezom dijeljenja se ne računa', () => {
    const s = newClassic('LAST', 0);
    s.drawPile = []; s.hands = [[C('10C')], []]; s.table = [C('3H'), C('7D')];
    s.piles = [[], []];
    const r = applyClassic(s, { type: 'capture', handId: 't10C', tableIds: ['t3H', 't7D'] });
    expect(r.state.tablas[0]).toBe(0);
    expect(r.state.phase).toBe('matchEnd');
  });
  it('partija do 51 se završava i deterministička je', () => {
    const a = playMatch('MATCH51', 51), b = playMatch('MATCH51', 51);
    expect(a.phase).toBe('matchEnd');
    expect(Math.max(...a.scores)).toBeGreaterThanOrEqual(51);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
  it('NAJBOLJE: ograničeno po dijeljenju i bira nošenje s bodovima', () => {
    let s = newClassic('BESTC', 101);
    s.table = [C('5H'), C('KD'), C('2D')]; s.hands[0] = [C('KS'), C('7C')];
    expect(bestMove(s, 0)).toMatchObject({ handId: 'tKS', tableIds: ['tKD'] });
    s = applyClassic(s, { type: 'useBest' }).state;
    s = applyClassic(s, { type: 'useBest' }).state;
    expect(s.bestLeft).toBe(0);
    expect(applyClassic(s, { type: 'useBest' }).events[0]).toMatchObject({ key: 'err.noBest' });
  });
  it('AI uvijek pravi validan potez kroz 20 cijelih partija', () => {
    for (let i = 0; i < 20; i++) expect(playMatch('AI' + i, 101).phase).toBe('matchEnd');
  });
});
