// Klasični Tablić 1 na 1 protiv kompjutera, po tradicionalnim pravilima.
// - 52 karte; na početku dijeljenja 4 karte na sto i po 6 u ruke; kad se ruke isprazne, dijeli se po 6 dok ima karata.
// - Na potezu: nosi (ista vrijednost ili zbir, više grupa) ili spusti kartu na sto.
// - Bodovi: svaka 10, J, Q, K, A = 1; 10♦ = 2; 2♣ = 1 (ukupno 22). Najviše karata (27+) = 3. Svaka Tabla = 1
//   (Tabla posljednjim potezom dijeljenja se ne računa). Karte koje ostanu na stolu nosi igrač koji je zadnji nosio.
import type { Card } from './types.ts';
import { makeDeck } from './cards.ts';
import { DECK, RULES } from './data.ts';
import { evaluateSelection, findCaptures } from './capture.ts';
import { createRng, shuffle, type RngState } from './rng.ts';

export type Seat = 0 | 1; // 0 = igrač, 1 = kompjuter

export interface MoveInfo { player: Seat; kind: 'capture' | 'lay'; card: Card; captured: Card[]; tabla: boolean; points: number }

export interface DealResult {
  cardPoints: [number, number];
  mostCards: [number, number];
  tablas: [number, number];
  cardsCount: [number, number];
  total: [number, number];
}

export interface ClassicState {
  version: 1;
  seed: string;
  rng: RngState;
  /** 0 = jedno dijeljenje, inače igra se do tog broja bodova */
  target: number;
  dealNo: number;
  starter: Seat;
  drawPile: Card[];
  table: Card[];
  hands: [Card[], Card[]];
  piles: [Card[], Card[]];
  tablas: [number, number];
  scores: [number, number];
  lastCapturer: Seat | null;
  turn: Seat;
  phase: 'play' | 'dealEnd' | 'matchEnd';
  bestLeft: number;
  lastMove?: MoveInfo;
  dealResult?: DealResult;
}

export type ClassicAction =
  | { type: 'capture'; handId: string; tableIds: string[] }
  | { type: 'lay'; handId: string }
  | { type: 'ai' }
  | { type: 'useBest' }
  | { type: 'nextDeal' };

export type ClassicEvent =
  | { type: 'move'; move: MoveInfo }
  | { type: 'dealt' }
  | { type: 'dealEnd'; result: DealResult }
  | { type: 'matchEnd'; winner: Seat | null }
  | { type: 'error'; key: string };

/** Tradicionalni bodovi karte. */
export function classicPoints(c: Card): number {
  if (c.rank === 10 && c.suit === 'D') return 2;
  if (c.rank === 2 && c.suit === 'C') return 1;
  if (c.rank === 10 || c.rank >= 11 || c.rank === 1) return 1;
  return 0;
}

export function newClassic(seed: string, target: number): ClassicState {
  const s: ClassicState = {
    version: 1, seed, rng: createRng(seed), target, dealNo: 0, starter: 1,
    drawPile: [], table: [], hands: [[], []], piles: [[], []], tablas: [0, 0], scores: [0, 0],
    lastCapturer: null, turn: 0, phase: 'play', bestLeft: 0,
  };
  startDeal(s);
  return s;
}

function startDeal(s: ClassicState) {
  s.dealNo++;
  s.starter = (s.starter === 0 ? 1 : 0) as Seat; // prvo dijeljenje počinje igrač
  s.drawPile = shuffle(s.rng, 'deal', makeDeck(DECK.deck_classic!));
  s.table = s.drawPile.splice(0, 4);
  s.hands = [[], []];
  dealHands(s);
  s.piles = [[], []];
  s.tablas = [0, 0];
  s.lastCapturer = null;
  s.turn = s.starter;
  s.phase = 'play';
  s.bestLeft = RULES.classicBestPerDeal;
  s.lastMove = undefined;
  s.dealResult = undefined;
}

function dealHands(s: ClassicState) {
  for (let i = 0; i < 6; i++) for (const p of [s.starter, s.starter === 0 ? 1 : 0] as Seat[]) {
    const c = s.drawPile.shift();
    if (c) s.hands[p].push(c);
  }
}

function other(p: Seat): Seat { return p === 0 ? 1 : 0; }

function doMove(s: ClassicState, p: Seat, a: { type: 'capture'; handId: string; tableIds: string[] } | { type: 'lay'; handId: string }, events: ClassicEvent[]): string | null {
  const hand = s.hands[p];
  const idx = hand.findIndex(c => c.id === a.handId);
  if (idx < 0) return 'err.invalid';
  const card = hand[idx]!;
  if (a.type === 'capture') {
    const sel = s.table.filter(c => a.tableIds.includes(c.id));
    if (!sel.length || sel.length !== a.tableIds.length || !evaluateSelection(card, sel)) return 'err.invalid';
    hand.splice(idx, 1);
    s.table = s.table.filter(c => !a.tableIds.includes(c.id));
    s.piles[p].push(card, ...sel);
    s.lastCapturer = p;
    const lastMoveOfDeal = !s.drawPile.length && !s.hands[0].length && !s.hands[1].length;
    const tabla = s.table.length === 0 && !lastMoveOfDeal;
    if (tabla) s.tablas[p]++;
    const points = [card, ...sel].reduce((x, c) => x + classicPoints(c), 0) + (tabla ? 1 : 0);
    s.lastMove = { player: p, kind: 'capture', card, captured: sel, tabla, points };
  } else {
    hand.splice(idx, 1);
    s.table.push(card);
    s.lastMove = { player: p, kind: 'lay', card, captured: [], tabla: false, points: 0 };
  }
  events.push({ type: 'move', move: s.lastMove });
  s.turn = other(p);
  if (!s.hands[0].length && !s.hands[1].length) {
    if (s.drawPile.length) { dealHands(s); events.push({ type: 'dealt' }); }
    else endDeal(s, events);
  }
  return null;
}

function endDeal(s: ClassicState, events: ClassicEvent[]) {
  if (s.table.length && s.lastCapturer !== null) { s.piles[s.lastCapturer].push(...s.table); s.table = []; }
  const cardPoints: [number, number] = [0, 1].map(p => s.piles[p as Seat].reduce((x, c) => x + classicPoints(c), 0)) as [number, number];
  const cardsCount: [number, number] = [s.piles[0].length, s.piles[1].length];
  const mostCards: [number, number] = [cardsCount[0] > 26 ? 3 : 0, cardsCount[1] > 26 ? 3 : 0];
  const total: [number, number] = [cardPoints[0] + mostCards[0] + s.tablas[0], cardPoints[1] + mostCards[1] + s.tablas[1]];
  s.dealResult = { cardPoints, mostCards, tablas: [...s.tablas], cardsCount, total };
  s.scores = [s.scores[0] + total[0], s.scores[1] + total[1]];
  events.push({ type: 'dealEnd', result: s.dealResult });
  const done = s.target === 0 || (Math.max(...s.scores) >= s.target && s.scores[0] !== s.scores[1]);
  if (done) {
    s.phase = 'matchEnd';
    const winner: Seat | null = s.scores[0] === s.scores[1] ? null : s.scores[0] > s.scores[1] ? 0 : 1;
    events.push({ type: 'matchEnd', winner });
  } else s.phase = 'dealEnd';
}

/** Vrijednost nošenja za AI i za dugme NAJBOLJE: bodovi su najvažniji, pa Tabla, pa broj karata. */
function captureValue(s: ClassicState, card: Card, sel: Card[]): number {
  const pts = [card, ...sel].reduce((x, c) => x + classicPoints(c), 0);
  const tabla = sel.length === s.table.length ? 1 : 0;
  return pts * 10 + tabla * 14 + (sel.length + 1) * 2;
}

export function bestMove(s: ClassicState, p: Seat): { type: 'capture'; handId: string; tableIds: string[]; value: number } | null {
  let best: { type: 'capture'; handId: string; tableIds: string[]; value: number } | null = null;
  for (const h of s.hands[p]) {
    for (const o of findCaptures(h, s.table)) {
      const sel = s.table.filter(c => o.tableIds.includes(c.id));
      const v = captureValue(s, h, sel);
      if (!best || v > best.value) best = { type: 'capture', handId: h.id, tableIds: o.tableIds, value: v };
    }
  }
  return best;
}

/** AI potez: najbolje nošenje; inače spusti kartu koja protivniku najmanje pomaže. */
export function aiMove(s: ClassicState): { type: 'capture'; handId: string; tableIds: string[] } | { type: 'lay'; handId: string } {
  const p = s.turn;
  const cap = bestMove(s, p);
  if (cap) return { type: 'capture', handId: cap.handId, tableIds: cap.tableIds };
  let best: { id: string; pen: number } | null = null;
  for (const h of s.hands[p]) {
    const after = [...s.table, h];
    let pen = classicPoints(h) * 6 + (h.rank === 1 ? 2 : 0);
    // da li protivnik nekom kartom može očistiti cijeli sto (Tabla)?
    for (let r = 1; r <= 13; r++) if (evaluateSelection({ id: 'x', suit: 'H', rank: r as Card['rank'] }, after)) { pen += 8; break; }
    pen += h.rank >= 11 ? 0.5 : h.rank / 30; // čuvaj sitne karte za zbirove
    if (!best || pen < best.pen) best = { id: h.id, pen };
  }
  return { type: 'lay', handId: best!.id };
}

export function applyClassic(prev: ClassicState, action: ClassicAction): { state: ClassicState; events: ClassicEvent[] } {
  const s = structuredClone(prev);
  const events: ClassicEvent[] = [];
  const err = (key: string) => ({ state: prev, events: [{ type: 'error', key } as ClassicEvent] });
  switch (action.type) {
    case 'capture':
    case 'lay': {
      if (s.phase !== 'play' || s.turn !== 0) return err('err.phase');
      const e = doMove(s, 0, action, events);
      if (e) return err(e);
      break;
    }
    case 'ai': {
      if (s.phase !== 'play' || s.turn !== 1) return err('err.phase');
      const e = doMove(s, 1, aiMove(s), events);
      if (e) return err(e);
      break;
    }
    case 'useBest': {
      if (s.phase !== 'play' || s.turn !== 0) return err('err.phase');
      if (s.bestLeft <= 0) return err('err.noBest');
      s.bestLeft--;
      break;
    }
    case 'nextDeal': {
      if (s.phase !== 'dealEnd') return err('err.phase');
      startDeal(s);
      events.push({ type: 'dealt' });
      break;
    }
  }
  return { state: s, events };
}
