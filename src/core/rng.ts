// Seeded PRNG (sfc32) s nezavisnim streamovima po namjeni. Stanje je čisti JSON.

export interface RngState {
  seed: string;
  streams: Record<string, [number, number, number, number]>;
}

function cyrb128(str: string): [number, number, number, number] {
  let h1 = 1779033703, h2 = 3144134277, h3 = 1013904242, h4 = 2773480762;
  for (let i = 0; i < str.length; i++) {
    const k = str.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  h1 ^= h2 ^ h3 ^ h4; h2 ^= h1; h3 ^= h1; h4 ^= h1;
  return [h1 >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0];
}

export function createRng(seed: string): RngState {
  return { seed, streams: {} };
}

/** Sljedeći broj u [0, 1) iz imenovanog streama. Mutira `rng` (pozivati samo nad kloniranim stanjem). */
export function next(rng: RngState, stream: string): number {
  let s = rng.streams[stream];
  if (!s) {
    s = cyrb128(rng.seed + '::' + stream);
    rng.streams[stream] = s;
  }
  let [a, b, c, d] = s;
  a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
  const t = (((a + b) | 0) + d) | 0;
  d = (d + 1) | 0;
  a = b ^ (b >>> 9);
  b = (c + (c << 3)) | 0;
  c = (c << 21) | (c >>> 11);
  c = (c + t) | 0;
  rng.streams[stream] = [a >>> 0, b >>> 0, c >>> 0, d >>> 0];
  return (t >>> 0) / 4294967296;
}

export function int(rng: RngState, stream: string, maxExclusive: number): number {
  return Math.floor(next(rng, stream) * maxExclusive);
}

export function pick<T>(rng: RngState, stream: string, arr: readonly T[]): T {
  if (!arr.length) throw new Error('pick from empty array');
  return arr[int(rng, stream, arr.length)]!;
}

export function chance(rng: RngState, stream: string, oneIn: number): boolean {
  return int(rng, stream, oneIn) === 0;
}

export function weighted<K extends string>(rng: RngState, stream: string, weights: Partial<Record<K, number>>): K {
  const entries = Object.entries(weights) as [K, number][];
  const total = entries.reduce((a, [, w]) => a + w, 0);
  let r = next(rng, stream) * total;
  for (const [k, w] of entries) {
    r -= w;
    if (r < 0) return k;
  }
  return entries[entries.length - 1]![0];
}

export function shuffle<T>(rng: RngState, stream: string, arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = int(rng, stream, i + 1);
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

const SEED_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
/** Seed od 8 znakova iz broja (UI daje entropiju, core ostaje deterministički). */
export function seedFromNumber(n: number): string {
  let x = Math.abs(Math.floor(n)) || 1;
  let out = '';
  for (let i = 0; i < 8; i++) {
    out += SEED_ALPHABET[x % SEED_ALPHABET.length];
    x = Math.floor(x / SEED_ALPHABET.length) + (i + 1) * 7919;
  }
  return out;
}

export function normalizeSeed(s: string): string {
  return s.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
}
