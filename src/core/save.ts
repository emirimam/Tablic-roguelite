import { SAVE_VERSION } from './run.ts';
import { META_VERSION, newMeta, type MetaState } from './meta.ts';
import type { RunState } from './types.ts';

type Migration = (data: Record<string, unknown>) => Record<string, unknown>;

/** Lanac migracija: index N migrira iz verzije N u N+1. */
export const RUN_MIGRATIONS: Record<number, Migration> = {
  // v0 → v1: stare probne verzije nisu imale `uidCounter` ni `endless`.
  0: d => ({ ...d, uidCounter: (d.uidCounter as number) ?? 1000, endless: (d.endless as boolean) ?? false, version: 1 }),
};

export function serializeRun(run: RunState): string {
  return JSON.stringify(run);
}

export function deserializeRun(json: string): RunState | null {
  try {
    let d = JSON.parse(json) as Record<string, unknown>;
    if (!d || typeof d !== 'object') return null;
    let v = typeof d.version === 'number' ? d.version : 0;
    while (v < SAVE_VERSION) {
      const m = RUN_MIGRATIONS[v];
      if (!m) return null;
      d = m(d);
      v++;
    }
    if (v !== SAVE_VERSION || !Array.isArray(d.deck) || typeof d.phase !== 'string' || !d.rng) return null;
    return d as unknown as RunState;
  } catch {
    return null;
  }
}

export function deserializeMeta(json: string | null): MetaState {
  const base = newMeta();
  if (!json) return base;
  try {
    const d = JSON.parse(json) as Partial<MetaState>;
    if (!d || d.version !== META_VERSION) return base;
    return {
      ...base, ...d,
      stats: { ...base.stats, ...(d.stats ?? {}) },
      settings: { ...base.settings, ...(d.settings ?? {}) },
      seen: { ...base.seen, ...(d.seen ?? {}) },
      classic: { ...base.classic, ...(d.classic ?? {}) },
    };
  } catch {
    return base;
  }
}
