import type { RngState } from './rng.ts';

export type Suit = 'C' | 'D' | 'H' | 'S';
/** 1=A, 11=J, 12=Q, 13=K. Vrijednost u Tabliću: J=12, Q=13, K=14. */
export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;
export type EnhId = 'gold' | 'glass' | 'bonus' | 'mult' | 'wild' | 'steel';
export type SealId = 'red' | 'gold_seal' | 'blue';
export type EditionId = 'foil' | 'holo' | 'poly' | 'negative';
export type CaptureType = 'pair' | 'sum' | 'double' | 'triple';
export type LevelKey = CaptureType | 'tabla';
export type Rarity = 'common' | 'uncommon' | 'rare' | 'legendary';

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
  enhancement?: EnhId;
  seal?: SealId;
  edition?: EditionId;
  faceDown?: boolean;
}

export interface RegularInstance {
  id: string;
  uid: string;
  edition?: EditionId;
  counters: Record<string, number>;
  disabled?: boolean;
  /** plaćena cijena (prodaja vraća pola, DESIGN_REVIEW K28) */
  paid?: number;
}

export interface Rules {
  handSize: number;
  captures: number;
  lays: number;
  regularSlots: number;
  consumableSlots: number;
  shopSlots: number;
  interestCap: number;
  discount: number;
  shopExtra: number;
  sellBonus: number;
  aceAny: boolean;
  brandyWeightMul: number;
}

export interface RoundState {
  table: Card[];
  hand: Card[];
  drawPile: Card[];
  pile: Card[];
  capturesLeft: number;
  laysLeft: number;
  score: number;
  target: number;
  boss?: string;
  capturesMade: number;
  laysMade: number;
  tablas: number;
  bestCapture: number;
  flags: Record<string, number>;
  scripted?: boolean;
}

export type ShopItem =
  | { kind: 'regular'; id: string; edition?: EditionId; price: number; sold?: boolean }
  | { kind: 'brandy'; id: string; price: number; sold?: boolean }
  | { kind: 'cup'; id: string; price: number; sold?: boolean };

export interface ShopState {
  items: ShopItem[];
  packs: { id: string; price: number; sold?: boolean }[];
  rerollCost: number;
}

export type PackOption =
  | { kind: 'regular'; id: string; edition?: EditionId }
  | { kind: 'brandy'; id: string }
  | { kind: 'cup'; id: string }
  | { kind: 'card'; card: Card };

export interface PackState {
  id: string;
  options: PackOption[];
  picksLeft: number;
  cards: Card[]; // za Turu fildžana: 6 karata iz špila
  taken: number[];
}

export interface RunStats {
  captures: number;
  lays: number;
  tablas: number;
  bestCapture: number;
  glassBroken: number;
  cupsUsed: number;
  brandiesUsed: number;
  maxMoney: number;
  bossesBeaten: number;
  hadRare: boolean;
  regularCaptures: Record<string, number>;
}

export type Phase = 'map' | 'round' | 'cashout' | 'shop' | 'pack' | 'gameover' | 'won';

export interface CashoutLine { key: string; amount: number; params?: Record<string, string | number> }

export interface RunState {
  version: number;
  seed: string;
  seeded: boolean;
  rng: RngState;
  deckId: string;
  stakeId: string;
  stakeLevel: number;
  ante: number;
  roundIndex: 0 | 1 | 2;
  money: number;
  deck: Card[];
  regulars: RegularInstance[];
  consumables: string[];
  levels: Record<LevelKey, number>;
  vouchers: string[];
  anteVoucher?: string;
  anteVoucherBought?: boolean;
  usedBosses: string[];
  bossForAnte?: string;
  phase: Phase;
  round?: RoundState;
  shop?: ShopState;
  pack?: PackState;
  cashout?: CashoutLine[];
  stats: RunStats;
  lastConsumable?: string;
  endless: boolean;
  tutorial?: number;
  /** prva partija ikad: prvi Šank garantuje Konobara */
  firstRun?: boolean;
  uidCounter: number;
}
