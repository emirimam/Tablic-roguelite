import { describe, expect, it } from 'vitest';
import bs from './bs.json';
import en from './en.json';
import { REGULARS, BRANDIES, CUPS, BOSSES, VOUCHERS, PACKS, DECKS, STAKES, ACHIEVEMENTS } from '../core/data.ts';
import { REGULAR_HOOKS } from '../core/content/regulars.ts';
import { TUTORIAL } from '../core/tutorial.ts';

describe('i18n i konzistentnost sadržaja', () => {
  it('bs i en imaju iste ključeve', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(bs).sort());
  });
  it('svaki sadržaj iz data/ ima ime i opis na oba jezika', () => {
    const keys: string[] = [];
    REGULARS.forEach(r => keys.push(`regular.${r.id}.name`, `regular.${r.id}.desc`));
    BRANDIES.forEach(r => keys.push(`brandy.${r.id}.name`, `brandy.${r.id}.desc`));
    CUPS.forEach(r => keys.push(`cup.${r.id}.name`, `cup.${r.id}.desc`));
    BOSSES.forEach(r => keys.push(`boss.${r.id}.name`, `boss.${r.id}.desc`));
    VOUCHERS.forEach(r => keys.push(`voucher.${r.id}.name`, `voucher.${r.id}.desc`));
    PACKS.forEach(r => keys.push(`pack.${r.id}.name`, `pack.${r.id}.desc`));
    DECKS.forEach(r => keys.push(`deck.${r.id}.name`, `deck.${r.id}.desc`, `deck.${r.id}.unlock`));
    STAKES.forEach(r => keys.push(`stake.${r.id}.name`, `stake.${r.id}.desc`));
    ACHIEVEMENTS.forEach(r => keys.push(`ach.${r.id}.name`, `ach.${r.id}.desc`));
    TUTORIAL.forEach((r, i) => r.steps.forEach((_s, j) => keys.push(`tut.${i}.${j}`)));
    for (const k of keys) {
      expect(bs, k).toHaveProperty([k]);
      expect(en, k).toHaveProperty([k]);
    }
  });
  it('svaki gost iz JSON-a ima hook implementaciju i obrnuto', () => {
    expect(Object.keys(REGULAR_HOOKS).sort()).toEqual(REGULARS.map(r => r.id).sort());
  });
  it('opisi gostiju koriste samo parametre koji postoje u JSON-u', () => {
    for (const r of REGULARS) {
      for (const dict of [bs, en] as Record<string, string>[]) {
        const params = [...(dict[`regular.${r.id}.desc`] ?? '').matchAll(/\{(\w+)\}/g)].map(m => m[1]!);
        for (const p of params) expect(r.params, `${r.id}.${p}`).toHaveProperty([p]);
      }
    }
  });
  it('33 gosta, 12 gazda, 15 fildžana, 6 rakija, 8 investicija, 24 dostignuća', () => {
    expect(REGULARS.length).toBe(33);
    expect(BOSSES.length).toBe(12);
    expect(CUPS.length).toBe(15);
    expect(BRANDIES.length).toBe(6);
    expect(VOUCHERS.length).toBe(8);
    expect(ACHIEVEMENTS.length).toBe(24);
  });
});
