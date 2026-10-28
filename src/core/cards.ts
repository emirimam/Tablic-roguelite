import type { Card, Rank, Suit } from './types.ts';
import { RULES, type DeckDef } from './data.ts';

export const SUITS: Suit[] = ['C', 'D', 'H', 'S'];
export const RANKS: Rank[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

export const isFace = (c: Card) => c.rank >= 11;

/** Moguće vrijednosti karte u Tabliću (as 1/11, J=12, Q=13, K=14, divlja 1–14). */
export function tablicValues(c: Card, aceAny = false): number[] {
  if (c.enhancement === 'wild') return range(1, 14);
  if (c.rank === 1) return aceAny ? range(1, 14) : [1, 11];
  if (c.rank >= 11) return [c.rank + 1];
  return [c.rank];
}

/** Chips vrijednost karte za bodovanje, uključujući tradicionalne bonuse 10♦ i 2♣. */
export function cardChips(c: Card): number {
  let v = c.rank === 1 ? 11 : c.rank >= 11 ? 10 : c.rank;
  if (c.rank === 10 && c.suit === 'D') v += RULES.cardBonus.bigTen;
  if (c.rank === 2 && c.suit === 'C') v += RULES.cardBonus.smallTwo;
  return v;
}

export function range(a: number, b: number): number[] {
  const out: number[] = [];
  for (let i = a; i <= b; i++) out.push(i);
  return out;
}

export function makeDeck(deck: DeckDef): Card[] {
  const cards: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      if (deck.short && rank >= 2 && rank <= 4) continue;
      if (deck.aces && rank === 2) continue;
      cards.push({ id: `${suit}${rank}`, suit, rank });
    }
  }
  if (deck.aces) {
    cards.push({ id: 'H1b', suit: 'H', rank: 1 }, { id: 'H1c', suit: 'H', rank: 1 });
    cards.push({ id: 'S1b', suit: 'S', rank: 1 }, { id: 'S1c', suit: 'S', rank: 1 });
  }
  return cards;
}

export const RANK_LABEL: Record<Rank, string> = { 1: 'A', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9', 10: '10', 11: 'J', 12: 'Q', 13: 'K' };
export const SUIT_SYMBOL: Record<Suit, string> = { C: '♣', D: '♦', H: '♥', S: '♠' };
export const cardLabel = (c: Card) => RANK_LABEL[c.rank] + SUIT_SYMBOL[c.suit];
