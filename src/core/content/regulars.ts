import { num, regDef, CUPS, type RegularDef } from '../data.ts';
import { isFace } from '../cards.ts';
import { pick } from '../rng.ts';
import type { RegularInstance, RunState } from '../types.ts';
import type { Hooks } from './hooks.ts';

const suitMult: Hooks = {
  onCardScored: (_c, _i, d, card) => (card.suit === d.params.suit ? { mult: num(d, 'mult') } : null),
};

/** Registar ponašanja. Metapodaci i brojke su u data/regulars.json. */
export const REGULAR_HOOKS: Record<string, Hooks> = {
  waiter: { onCapture: (_c, _i, d) => ({ mult: num(d, 'mult') }) },
  lover: suitMult,
  jeweler: suitMult,
  gardener: suitMult,
  miner: suitMult,
  pensioner: { onCapture: (c, _i, d) => (c.type === 'pair' ? { chips: num(d, 'chips') } : null) },
  mathematician: { onCapture: (c, _i, d) => (c.type !== 'pair' ? { mult: num(d, 'mult') } : null) },
  student: { onCapture: (c, _i, d) => (c.tableCards.length === num(d, 'count') ? { chips: num(d, 'chips') } : null) },
  taxi_driver: { onRoundEnd: (_r, _i, d) => num(d, 'money') },
  accordionist: { onCapture: (c, _i, d) => (c.round.laysLeft > 0 ? { mult: num(d, 'mult') * c.round.laysLeft } : null) },
  fisherman: { onCardScored: (_c, _i, d, card) => (card.rank === 10 ? { chips: num(d, 'chips') } : null) },
  charmer: { onCardScored: (_c, _i, d, card) => (isFace(card) ? { mult: num(d, 'mult') } : null) },
  grandpa: { onCapture: (c, _i, d) => (c.held.some(isFace) ? null : { chips: num(d, 'chips') }) },
  porter: {
    onLay: (_r, _ro, inst, d) => { inst.counters.chips = (inst.counters.chips ?? 0) + num(d, 'chips'); },
    onCapture: (_c, inst) => (inst.counters.chips ? { chips: inst.counters.chips } : null),
  },
  fortune_teller: {
    onBossDefeated: (run, _i, _d, rules) => {
      if (run.consumables.length < rules.consumableSlots) run.consumables.push(pick(run.rng, 'shop', CUPS.filter(c => c.id !== 'cup_sun')).id);
    },
  },
  merchant: { modifyRules: (r, d) => { r.shopSlots += num(d, 'slots'); } },
  godfather: { onCapture: (c, _i, d) => (c.type === 'double' || c.type === 'triple' ? { xMult: num(d, 'xmult') } : null) },
  neighbor: { onCapture: (c, _i, d) => (c.tablaBonus ? { mult: num(d, 'mult') } : null) },
  magician: { modifyRules: r => { r.aceAny = true; } },
  baker: { modifyRules: (r, d) => { r.captures += num(d, 'captures'); } },
  tailor: { modifyRules: (r, d) => { r.handSize += num(d, 'hand'); } },
  gambler: { onCapture: (c, _i, d) => (c.roll(num(d, 'chance')) ? { xMult: num(d, 'xmult') } : null) },
  smuggler: {
    onSell: (_r, _i, d) => num(d, 'money'),
    modifyRules: (r, d) => { r.sellBonus += num(d, 'sell'); },
  },
  teacher: {
    onCapture: (_c, inst) => (inst.counters.mult ? { mult: inst.counters.mult } : null),
    afterScore: (c, inst, d) => {
      inst.counters.cards = (inst.counters.cards ?? 0) + c.tableCards.length + 1;
      inst.counters.mult = Math.floor((inst.counters.cards ?? 0) / num(d, 'per')) * num(d, 'mult');
    },
  },
  collector: {
    onCapture: (_c, inst) => (inst.counters.chips ? { chips: inst.counters.chips } : null),
    afterScore: (c, inst, d) => { inst.counters.chips = (inst.counters.chips ?? 0) + num(d, 'chips') * (c.tableCards.length + 1); },
  },
  landlady: { onCapture: (c, _i, d) => (c.tablaBonus ? { xMult: num(d, 'xmult') } : null) },
  cafe_owner: { onCapture: (c, _i, d) => { const x = 1 + num(d, 'per') * c.run.stats.tablas; return x > 1 ? { xMult: x } : null; } },
  double: {},
  drunkard: {
    onCapture: (_c, _i, d) => ({ xMult: num(d, 'xmult') }),
    modifyRules: (r, d) => { r.captures += num(d, 'captures'); },
  },
  big_ten: {
    onCardScored: (_c, _i, d, card) => ((card.rank === 10 && card.suit === 'D') || (card.rank === 2 && card.suit === 'C') ? { xMult: num(d, 'xmult') } : null),
  },
  old_master: { retrigger: (_c, _i, d, card) => (isFace(card) ? num(d, 'retrigger') : 0) },
  queen_of_kafana: { onHeldCard: (_c, _i, d, card) => (card.rank === 12 ? { xMult: num(d, 'xmult') } : null) },
  legend: {
    onCapture: (_c, inst) => { const x = inst.counters.x ?? 1; return x > 1 ? { xMult: x } : null; },
    afterScore: (c, inst, d) => { if (c.tabla) inst.counters.x = (inst.counters.x ?? 1) + num(d, 'per'); },
  },
};

export interface ResolvedRegular {
  hooks: Hooks;
  def: RegularDef;
  /** instanca čiji se brojači čitaju (kod Dvojnika: original) */
  inst: RegularInstance;
  /** uid gosta koji se prikazuje kao izvor efekta */
  uid: string;
  /** Dvojnik: kopija ne povećava brojače originala (DESIGN_REVIEW K19) */
  isCopy: boolean;
}

const NOT_COPYABLE = new Set(['double', 'magician']);

/** Hookovi i definicija koji važe za gosta na poziciji `i` (Dvojnik kopira gosta desno). */
export function resolveRegular(run: RunState, i: number): ResolvedRegular | null {
  const inst = run.regulars[i];
  if (!inst || inst.disabled) return null;
  if (inst.id === 'double') {
    const right = run.regulars[i + 1];
    if (!right || NOT_COPYABLE.has(right.id) || right.disabled) return null;
    return { hooks: REGULAR_HOOKS[right.id] ?? {}, def: regDef(right.id), inst: right, uid: inst.uid, isCopy: true };
  }
  return { hooks: REGULAR_HOOKS[inst.id] ?? {}, def: regDef(inst.id), inst, uid: inst.uid, isCopy: false };
}
