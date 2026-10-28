import type { Card, CaptureType } from './types.ts';
import { tablicValues } from './cards.ts';

export interface CaptureEval {
  type: CaptureType;
  groups: number;
  /** id-jevi nošenih karata sa stola, u redoslijedu pozicije na stolu */
  tableIds: string[];
  /** vrijednost karte iz ruke koja je korištena */
  value: number;
}

function popcount(x: number): number {
  let c = 0;
  while (x) { x &= x - 1; c++; }
  return c;
}

/** Za svaku masku podskupa karata: skup svih mogućih zbirova (asovi/divlje imaju više vrijednosti). */
function sumSets(cards: Card[], aceAny: boolean): Set<number>[] {
  const n = cards.length;
  const sums: Set<number>[] = new Array(1 << n);
  sums[0] = new Set([0]);
  const vals = cards.map(c => tablicValues(c, aceAny));
  for (let mask = 1; mask < 1 << n; mask++) {
    const low = mask & -mask;
    const i = 31 - Math.clz32(low);
    const prev = sums[mask ^ low]!;
    const s = new Set<number>();
    for (const p of prev) for (const v of vals[i]!) s.add(p + v);
    sums[mask] = s;
  }
  return sums;
}

/** Maksimalan broj grupa sa zbirom `v` u koje se maska može particionisati (-1 ako ne može). */
function bestGroups(n: number, sums: Set<number>[], v: number): Int8Array {
  const best = new Int8Array(1 << n).fill(-1);
  best[0] = 0;
  for (let mask = 1; mask < 1 << n; mask++) {
    const low = mask & -mask;
    const rest = mask ^ low;
    // podmaske od `rest`, svaka grupa sadrži najniži bit
    let sub = rest;
    let b = -1;
    for (;;) {
      const g = sub | low;
      if (sums[g]!.has(v)) {
        const r = best[mask ^ g]!;
        if (r >= 0 && r + 1 > b) b = r + 1;
      }
      if (sub === 0) break;
      sub = (sub - 1) & rest;
    }
    best[mask] = b;
  }
  return best;
}

function typeOf(groups: number, size: number): CaptureType {
  if (groups >= 3) return 'triple';
  if (groups === 2) return 'double';
  return size === 1 ? 'pair' : 'sum';
}

/** Validira izbor igrača. Ako ima više particija, bira onu s više grupa. */
export function evaluateSelection(hand: Card, selected: Card[], aceAny = false): CaptureEval | null {
  if (!selected.length || selected.length > 10) return null;
  const sums = sumSets(selected, aceAny);
  const full = (1 << selected.length) - 1;
  let res: CaptureEval | null = null;
  for (const v of tablicValues(hand, aceAny)) {
    const g = bestGroups(selected.length, sums, v)[full]!;
    if (g >= 1 && (!res || g > res.groups)) {
      res = { type: typeOf(g, selected.length), groups: g, tableIds: selected.map(c => c.id), value: v };
    }
  }
  return res;
}

/** Sve validne dodjele vrijednosti karte iz ruke za dati izbor (po jedna opcija po vrijednosti, s max grupa). */
export function evaluateOptions(hand: Card, selected: Card[], aceAny = false): CaptureEval[] {
  if (!selected.length || selected.length > 10) return [];
  const sums = sumSets(selected, aceAny);
  const full = (1 << selected.length) - 1;
  const out: CaptureEval[] = [];
  for (const v of tablicValues(hand, aceAny)) {
    const g = bestGroups(selected.length, sums, v)[full]!;
    if (g >= 1) out.push({ type: typeOf(g, selected.length), groups: g, tableIds: selected.map(c => c.id), value: v });
  }
  return out;
}

/** Validan izbor ako skrivene karte (Nestanak struje) mogu imati bilo koju vrijednost 1–14. */
export function plausibleSelection(hand: Card, selected: Card[], aceAny = false): boolean {
  const masked = selected.map(c => (c.faceDown ? { ...c, enhancement: 'wild' as const } : c));
  return evaluateOptions(hand, masked, aceAny).length > 0;
}

/** Sva validna nošenja za kartu iz ruke nad cijelim stolom. */
export function findCaptures(hand: Card, table: Card[], aceAny = false): CaptureEval[] {
  const n = table.length;
  if (!n) return [];
  const sums = sumSets(table, aceAny);
  const bestByMask = new Map<number, CaptureEval>();
  for (const v of tablicValues(hand, aceAny)) {
    const best = bestGroups(n, sums, v);
    for (let mask = 1; mask < 1 << n; mask++) {
      const g = best[mask]!;
      if (g < 1) continue;
      const prev = bestByMask.get(mask);
      if (prev && prev.groups >= g) continue;
      const ids: string[] = [];
      for (let i = 0; i < n; i++) if (mask & (1 << i)) ids.push(table[i]!.id);
      bestByMask.set(mask, { type: typeOf(g, popcount(mask)), groups: g, tableIds: ids, value: v });
    }
  }
  return [...bestByMask.values()];
}

/** Karte sa stola koje učestvuju u bilo kom validnom nošenju (za isticanje u UI-ju). */
export function capturableIds(hand: Card, table: Card[], aceAny = false): Set<string> {
  const out = new Set<string>();
  for (const c of findCaptures(hand, table, aceAny)) for (const id of c.tableIds) out.add(id);
  return out;
}

export function canCaptureAny(hand: Card[], table: Card[], aceAny = false): boolean {
  return hand.some(h => findCaptures(h, table, aceAny).length > 0);
}
