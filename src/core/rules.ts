import { BOSS, DECK, RULES, STAKES, VOUCHER } from './data.ts';
import type { Rules, RunState } from './types.ts';
import { REGULAR_HOOKS, resolveRegular } from './content/regulars.ts';

/** Pravila se uvijek računaju iz osnove (špil, uloga, investicije, gosti, gazda). Nikad se ne mutiraju trajno. */
export function computeRules(run: RunState, inBossRound = run.roundIndex === 2 && run.phase === 'round'): Rules {
  const r: Rules = {
    handSize: RULES.handSize,
    captures: RULES.captures,
    lays: RULES.lays,
    regularSlots: RULES.regularSlots,
    consumableSlots: RULES.consumableSlots,
    shopSlots: RULES.shopSlots,
    interestCap: RULES.interestCap,
    discount: 0,
    shopExtra: 0,
    sellBonus: 0,
    aceAny: false,
    brandyWeightMul: 1,
  };
  const deck = DECK[run.deckId];
  if (deck?.captures) r.captures += deck.captures;
  if (deck?.hand) r.handSize += deck.hand;
  for (let i = 0; i <= run.stakeLevel && i < STAKES.length; i++) {
    const s = STAKES[i]!;
    if (s.lays) r.lays += s.lays;
    if (s.shopExtra) r.shopExtra += s.shopExtra;
  }
  for (const v of run.vouchers) {
    switch (v) {
      case 'v_counter': r.shopSlots += 1; break;
      case 'v_discount': r.discount = VOUCHER[v]?.discount ?? 0.25; break;
      case 'v_overtime': r.captures += 1; break;
      case 'v_table': r.lays += 1; break;
      case 'v_hands': r.handSize += 1; break;
      case 'v_distillery': r.brandyWeightMul = 2; break;
      case 'v_annex': r.regularSlots += 1; break;
      case 'v_bank': r.interestCap = VOUCHER[v]?.interestCap ?? 10; break;
    }
  }
  for (const reg of run.regulars) if (reg.edition === 'negative') r.regularSlots += 1;
  run.regulars.forEach((_reg, i) => {
    const res = resolveRegular(run, i);
    res?.hooks.modifyRules?.(r, res.def);
  });
  if (inBossRound && run.bossForAnte) {
    const b = BOSS[run.bossForAnte];
    if (b?.captures !== undefined) r.captures = Math.min(r.captures, b.captures);
    if (b?.hand) r.handSize += b.hand;
    if (b?.lays !== undefined) r.lays = b.lays;
  }
  r.handSize = Math.max(1, r.handSize);
  r.captures = Math.max(1, r.captures);
  r.lays = Math.max(0, r.lays);
  return r;
}

export function hasHook(id: string, hook: keyof (typeof REGULAR_HOOKS)[string]): boolean {
  return !!REGULAR_HOOKS[id]?.[hook];
}
