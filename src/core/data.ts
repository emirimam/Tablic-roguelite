// Jedinstveno mjesto gdje core čita data/*.json (data-driven sadržaj).
import regularsJson from '../../data/regulars.json' with { type: 'json' };
import brandiesJson from '../../data/brandies.json' with { type: 'json' };
import cupsJson from '../../data/cups.json' with { type: 'json' };
import bossesJson from '../../data/bosses.json' with { type: 'json' };
import vouchersJson from '../../data/vouchers.json' with { type: 'json' };
import packsJson from '../../data/packs.json' with { type: 'json' };
import decksJson from '../../data/decks.json' with { type: 'json' };
import stakesJson from '../../data/stakes.json' with { type: 'json' };
import antesJson from '../../data/antes.json' with { type: 'json' };
import rulesJson from '../../data/rules.json' with { type: 'json' };
import achievementsJson from '../../data/achievements.json' with { type: 'json' };
import type { EnhId, Rarity, Suit } from './types.ts';

export interface RegularDef { id: string; rarity: Rarity; cost: number; icon: string; params: Record<string, number | string> }
export interface BrandyDef { id: string; target: 'pair' | 'sum' | 'double' | 'triple' | 'tabla' | 'all'; cost: number; packOnly?: boolean; packChance?: number }
export interface CupDef { id: string; cost: number; max: number; min?: number; enh?: EnhId; suit?: Suit; rankUp?: number; destroy?: boolean; mirror?: boolean; moneyCap?: number; copyLast?: boolean }
export interface BossDef { id: string; minAnte: number; icon: string; final?: boolean; captures?: number; hand?: number; lays?: number; faceDown?: number; money?: number; targetMul?: number }
export interface VoucherDef { id: string; cost: number; icon: string; discount?: number; interestCap?: number }
export interface PackDef { id: string; kind: 'regulars' | 'brandy' | 'cups' | 'cards' | 'mega'; options: number; picks: number; cost: number; weight: number; icon: string; cards?: number; enhChance?: number; sealChance?: number }
export interface DeckDef { id: string; unlock: string; color: string; captures?: number; money?: number; aces?: boolean; short?: boolean; hand?: number; cups?: number }
export interface StakeDef { id: string; bossNoMoney?: boolean; targetMul?: number; lays?: number; shopExtra?: number }
export interface AchievementDef { id: string; icon: string }

export const REGULARS = regularsJson as RegularDef[];
export const BRANDIES = brandiesJson as BrandyDef[];
export const CUPS = cupsJson as CupDef[];
export const BOSSES = bossesJson as BossDef[];
export const VOUCHERS = vouchersJson as VoucherDef[];
export const PACKS = packsJson as PackDef[];
export const DECKS = decksJson as DeckDef[];
export const STAKES = stakesJson as StakeDef[];
export const ANTES = antesJson as { targets: number[][]; endlessGrowth: number };
export const RULES = rulesJson;
export const ACHIEVEMENTS = achievementsJson as AchievementDef[];

function index<T extends { id: string }>(arr: T[]): Record<string, T> {
  return Object.fromEntries(arr.map(x => [x.id, x]));
}
export const REG = index(REGULARS);
export const BRANDY = index(BRANDIES);
export const CUP = index(CUPS);
export const BOSS = index(BOSSES);
export const VOUCHER = index(VOUCHERS);
export const PACK = index(PACKS);
export const DECK = index(DECKS);

export function regDef(id: string): RegularDef {
  const d = REG[id];
  if (!d) throw new Error('Unknown regular ' + id);
  return d;
}
export function num(def: RegularDef, key: string): number {
  const v = def.params[key];
  return typeof v === 'number' ? v : 0;
}
