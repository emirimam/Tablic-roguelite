// Pomoćne funkcije za testove i simulator (ne koristi ih igra).
import { apply, newRun, previewCapture, scriptedCard, type Action, type GameEvent } from './run.ts';
import { computeRules } from './rules.ts';
import { findCaptures } from './capture.ts';
import type { Card, RegularInstance, RoundState, RunState } from './types.ts';

export const C = (k: string, extra: Partial<Card> = {}): Card => ({ ...scriptedCard(k), ...extra });

export function runWith(opts: { regulars?: string[]; boss?: string; roundIndex?: 0 | 1 | 2; seed?: string } = {}): RunState {
  const run = newRun({ seed: opts.seed ?? 'TESTSEED', seeded: true, deckId: 'deck_classic', stakeLevel: 0 });
  run.regulars = (opts.regulars ?? []).map((id, i): RegularInstance => ({ id, uid: 'u' + i, counters: {} }));
  if (opts.roundIndex !== undefined) run.roundIndex = opts.roundIndex;
  if (opts.boss) { run.roundIndex = 2; run.bossForAnte = opts.boss; }
  return run;
}

/** Postavi rundu s tačno zadanim kartama (bez miješanja). */
export function setRound(run: RunState, table: Card[], hand: Card[], draw: Card[] = [], patch: Partial<RoundState> = {}): RunState {
  run.phase = 'round';
  const rules = computeRules(run, run.roundIndex === 2);
  run.round = {
    table, hand, drawPile: draw, pile: [],
    capturesLeft: rules.captures, laysLeft: rules.lays,
    score: 0, target: 1e9, boss: run.roundIndex === 2 ? run.bossForAnte : undefined,
    capturesMade: 0, laysMade: 0, tablas: 0, bestCapture: 0, flags: {},
    ...patch,
  };
  return run;
}

export function act(run: RunState, a: Action): { state: RunState; events: GameEvent[] } {
  return apply(run, a);
}

/** Greedy bot: najveće nošenje; ako ga nema, spusti kartu s najmanjom vrijednošću. */
export function greedyAction(run: RunState): Action {
  const r = run.round!;
  const rules = computeRules(run);
  let best: { a: Action; s: number } | null = null;
  for (const h of r.hand) {
    for (const opt of findCaptures(h, r.table.filter(c => !c.faceDown), rules.aceAny)) {
      const p = previewCapture(run, h.id, opt.tableIds);
      if (p && (!best || p.total > best.s)) best = { a: { type: 'capture', handId: h.id, tableIds: opt.tableIds }, s: p.total };
    }
  }
  if (best) return best.a;
  const low = [...r.hand].sort((a, b) => a.rank - b.rank)[0]!;
  return { type: 'lay', handId: low.id };
}
