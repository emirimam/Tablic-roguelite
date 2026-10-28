import { describe, expect, it } from 'vitest';
import { evaluateSelection, evaluateOptions, findCaptures, canCaptureAny, plausibleSelection } from './capture.ts';
import { tablicValues, cardChips, makeDeck } from './cards.ts';
import { DECK } from './data.ts';
import { createRng, int } from './rng.ts';
import { C } from './testutil.ts';
import type { Card, Rank, Suit } from './types.ts';

describe('vrijednosti karata', () => {
  it('as vrijedi 1 ili 11, figure 12/13/14', () => {
    expect(tablicValues(C('AH'))).toEqual([1, 11]);
    expect(tablicValues(C('JH'))).toEqual([12]);
    expect(tablicValues(C('QH'))).toEqual([13]);
    expect(tablicValues(C('KH'))).toEqual([14]);
  });
  it('divlja karta i Mađioničar daju 1–14', () => {
    expect(tablicValues(C('5H', { enhancement: 'wild' })).length).toBe(14);
    expect(tablicValues(C('AH'), true).length).toBe(14);
  });
  it('chips: as 11, figure 10, 10♦ +20, 2♣ +15', () => {
    expect(cardChips(C('AS'))).toBe(11);
    expect(cardChips(C('KS'))).toBe(10);
    expect(cardChips(C('10D'))).toBe(30);
    expect(cardChips(C('2C'))).toBe(17);
    expect(cardChips(C('10H'))).toBe(10);
  });
  it('špilovi: klasični 52, polovni 40, asovski 52 s 8 asova i bez dvojki', () => {
    expect(makeDeck(DECK.deck_classic!).length).toBe(52);
    expect(makeDeck(DECK.deck_short!).length).toBe(40);
    const aces = makeDeck(DECK.deck_aces!);
    expect(aces.length).toBe(52);
    expect(aces.filter(c => c.rank === 1).length).toBe(8);
    expect(aces.some(c => c.rank === 2)).toBe(false);
    expect(new Set(aces.map(c => c.id)).size).toBe(52);
  });
});

describe('validacija nošenja', () => {
  it('Par: ista vrijednost', () => {
    expect(evaluateSelection(C('7C'), [C('7H')])?.type).toBe('pair');
  });
  it('Zbir: jedna grupa od 2+ karte', () => {
    expect(evaluateSelection(C('10C'), [C('3H'), C('7D')])?.type).toBe('sum');
  });
  it('Dupla i Trostruka', () => {
    expect(evaluateSelection(C('9H'), [C('9C'), C('4D'), C('5H')])?.type).toBe('double');
    expect(evaluateSelection(C('10H'), [C('3H'), C('7D'), C('4C'), C('6S'), C('10S')])).toMatchObject({ type: 'triple', groups: 3 });
  });
  it('dvije grupe od po jedne karte su Dupla, ne Par (K3)', () => {
    expect(evaluateSelection(C('7S'), [C('7H'), C('7D')])?.type).toBe('double');
  });
  it('primjer iz GDD §3.2: 10 nosi 3+7, 4+6, 10, a K ostaje', () => {
    const table = [C('3H'), C('7D'), C('4C'), C('6S'), C('10S'), C('KD')];
    const opts = findCaptures(C('10H'), table);
    const all = opts.find(o => o.tableIds.length === 5);
    expect(all?.groups).toBe(3);
    expect(opts.some(o => o.tableIds.includes('tKD'))).toBe(false);
  });
  it('nevalidan izbor', () => {
    expect(evaluateSelection(C('10H'), [C('3H'), C('6D')])).toBeNull();
    expect(evaluateSelection(C('10H'), [C('3H'), C('7D'), C('2S')])).toBeNull();
    expect(evaluateSelection(C('5H'), [])).toBeNull();
  });
  it('as na stolu: 1 za zbir, 11 za par sa jedanaest', () => {
    expect(evaluateSelection(C('KD'), [C('AS'), C('7D'), C('6C')])?.type).toBe('sum');
    expect(evaluateSelection(C('AH'), [C('9S'), C('2H')])?.value).toBe(11);
    expect(evaluateSelection(C('AH'), [C('AS')])?.type).toBe('pair');
  });
  it('as u ruci ima jednu vrijednost za cijelo nošenje (K1)', () => {
    // 1 i 11 u istom nošenju nije dozvoljeno: A ne može nositi {A} i {9,2} odjednom kao različite vrijednosti
    const ev = evaluateSelection(C('AH'), [C('AS'), C('9S'), C('2H')]);
    expect(ev?.groups).toBe(2); // A(11) nosi A(11) + {9,2} = 11
    expect(evaluateSelection(C('AH'), [C('2S'), C('9S'), C('AC')])?.value).toBe(11);
  });
  it('evaluateOptions daje opciju za svaku moguću vrijednost asa', () => {
    const opts = evaluateOptions(C('AH'), [C('AS')]);
    expect(opts.map(o => o.value).sort((a, b) => a - b)).toEqual([1, 11]);
  });
  it('divlja karta na stolu može biti bilo šta', () => {
    expect(evaluateSelection(C('KH'), [C('3S', { enhancement: 'wild' })])?.type).toBe('pair');
  });
  it('Mađioničar: as nosi bilo koju vrijednost', () => {
    expect(evaluateSelection(C('AH'), [C('8S')], true)?.type).toBe('pair');
    expect(evaluateSelection(C('AH'), [C('8S')], false)).toBeNull();
  });
  it('skrivena karta je "plauzibilna" za bilo koju vrijednost (K5)', () => {
    expect(plausibleSelection(C('KH'), [C('3S', { faceDown: true })])).toBe(true);
  });
  it('canCaptureAny', () => {
    expect(canCaptureAny([C('2H'), C('3S')], [C('9C'), C('KD')])).toBe(false);
    expect(canCaptureAny([C('2H'), C('KS')], [C('9C'), C('KD')])).toBe(true);
  });
});

describe('property: findCaptures i evaluateSelection se slažu', () => {
  it('svaka opcija iz findCaptures je validna particija (500 nasumičnih stolova)', () => {
    const rng = createRng('PROP');
    const suits: Suit[] = ['C', 'D', 'H', 'S'];
    for (let t = 0; t < 500; t++) {
      const n = 1 + int(rng, 'p', 8);
      const table: Card[] = [];
      for (let i = 0; i < n; i++) table.push({ id: 'x' + i, suit: suits[int(rng, 'p', 4)]!, rank: (1 + int(rng, 'p', 13)) as Rank });
      const hand: Card = { id: 'h', suit: 'H', rank: (1 + int(rng, 'p', 13)) as Rank };
      for (const opt of findCaptures(hand, table)) {
        const sel = table.filter(c => opt.tableIds.includes(c.id));
        const ev = evaluateSelection(hand, sel);
        expect(ev).not.toBeNull();
        expect(ev!.groups).toBe(opt.groups);
        // zbir mora biti djeljiv vrijednošću (bez asova)
        if (!sel.some(c => c.rank === 1) && hand.rank !== 1) {
          const sum = sel.reduce((a, c) => a + (c.rank >= 11 ? c.rank + 1 : c.rank), 0);
          expect(sum % opt.value).toBe(0);
          expect(sum / opt.value).toBe(opt.groups);
        }
      }
    }
  });
});
