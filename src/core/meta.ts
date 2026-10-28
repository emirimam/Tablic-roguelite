import { DECKS, REG, STAKES } from './data.ts';
import type { GameEvent } from './run.ts';
import type { RunState } from './types.ts';

export interface Settings {
  lang: 'bs' | 'en';
  music: number;
  sfx: number;
  speed: 1 | 2 | 4;
  shake: boolean;
  reducedMotion: boolean;
  colorblind: boolean;
  crt: boolean;
  textScale: 1 | 1.25 | 1.5;
}

export interface MetaState {
  version: number;
  unlockedDecks: string[];
  stakeUnlocked: number;
  achievements: string[];
  seen: { regulars: string[]; bosses: string[] };
  stats: { runs: number; wins: number; bestCapture: number; totalTablas: number; furthestAnte: number; regularPicks: Record<string, number>; cupsUsedTotal: number };
  winsByStake: number[];
  raftDecks: string[];
  settings: Settings;
  tutorialDone: boolean;
  goalSeen: boolean;
  classic: { played: number; won: number; lost: number };
}

export const META_VERSION = 1;

export function newMeta(lang: 'bs' | 'en' = 'bs'): MetaState {
  return {
    version: META_VERSION,
    unlockedDecks: ['deck_classic'],
    stakeUnlocked: 0,
    achievements: [],
    seen: { regulars: [], bosses: [] },
    stats: { runs: 0, wins: 0, bestCapture: 0, totalTablas: 0, furthestAnte: 1, regularPicks: {}, cupsUsedTotal: 0 },
    winsByStake: [],
    raftDecks: [],
    settings: { lang, music: 0.5, sfx: 0.8, speed: 1, shake: true, reducedMotion: false, colorblind: false, crt: false, textScale: 1 },
    tutorialDone: false,
    goalSeen: false,
    classic: { played: 0, won: 0, lost: 0 },
  };
}

export interface MetaResult { meta: MetaState; achievements: string[]; unlocks: string[] }

/** Čista funkcija: nova meta + lista novih dostignuća i otključavanja. Seedovane partije i tutorijal ne otključavaju ništa. */
export function processEvents(metaIn: MetaState, prev: RunState, next: RunState, events: GameEvent[]): MetaResult {
  const meta = structuredClone(metaIn);
  const ach: string[] = [];
  const unl: string[] = [];
  const counts = next.tutorial === undefined;
  const award = next.seeded || !counts ? () => {} : (id: string) => { if (!meta.achievements.includes(id)) { meta.achievements.push(id); ach.push(id); } };
  const unlockDeck = next.seeded || !counts ? () => {} : (id: string) => { if (!meta.unlockedDecks.includes(id)) { meta.unlockedDecks.push(id); unl.push(id); } };

  for (const e of events) {
    switch (e.type) {
      case 'captured': {
        award('first_capture');
        if (counts) meta.stats.bestCapture = Math.max(meta.stats.bestCapture, e.result.total);
        if (e.tabla) { award('first_tabla'); if (counts) meta.stats.totalTablas++; }
        if (e.result.total >= 10000) award('capture_10k');
        if (e.result.total >= 1_000_000) award('capture_1m');
        if (e.tabla && (prev.round?.tablas ?? 0) + 1 >= 5) award('tablas_5_round');
        if (e.captureType === 'triple' && e.groups >= 4) award('triple_4_groups');
        break;
      }
      case 'regularAdded': {
        if (!meta.seen.regulars.includes(e.id)) meta.seen.regulars.push(e.id);
        if (counts) meta.stats.regularPicks[e.id] = (meta.stats.regularPicks[e.id] ?? 0) + 1;
        const rares = next.regulars.filter(r => { const d = REG[r.id]; return d && (d.rarity === 'rare' || d.rarity === 'legendary'); }).length;
        if (rares >= 5) award('rare_5');
        break;
      }
      case 'bossDefeated': {
        award('first_boss');
        if (!meta.seen.bosses.includes(e.id)) meta.seen.bosses.push(e.id);
        if (prev.ante >= 2) unlockDeck('deck_kafana');
        break;
      }
      case 'consumableUsed': {
        if (counts) meta.stats.cupsUsedTotal += e.id.startsWith('cup_') ? 1 : 0;
        if (e.id === 'mead') award('use_mead');
        break;
      }
      case 'runWon': {
        if (counts) meta.stats.wins++;
        award('win_run');
        unlockDeck('deck_short');
        const lvl = next.stakeLevel;
        if (!next.seeded && counts) {
          meta.stakeUnlocked = Math.min(STAKES.length - 1, Math.max(meta.stakeUnlocked, lvl + 1));
          meta.winsByStake[lvl] = (meta.winsByStake[lvl] ?? 0) + 1;
        }
        const stakeAch = ['', 'win_restaurant', 'win_hotel', 'win_casino', 'win_raft'];
        for (let i = 1; i <= lvl; i++) award(stakeAch[i]!);
        if (lvl >= 4 && !next.seeded && counts) {
          if (!meta.raftDecks.includes(next.deckId)) meta.raftDecks.push(next.deckId);
          if (meta.raftDecks.length >= 3) award('win_raft_3_decks');
        }
        if (next.deckId !== 'deck_classic') award('win_' + next.deckId);
        if (!next.stats.hadRare) award('win_no_rares');
        if (next.stats.lays === 0) award('win_no_lay');
        break;
      }
    }
  }
  if (next.money >= 30) unlockDeck('deck_merchant');
  if (next.stats.tablas >= 10) unlockDeck('deck_aces');
  if (meta.stats.cupsUsedTotal >= 30) unlockDeck('deck_lucky');
  if (next.stats.glassBroken >= 5) award('glass_5');
  if (next.endless && next.ante >= 12) award('endless_12');
  if (counts) meta.stats.furthestAnte = Math.max(meta.stats.furthestAnte, next.ante);
  if (next.round?.boss && !meta.seen.bosses.includes(next.round.boss)) meta.seen.bosses.push(next.round.boss);
  return { meta, achievements: ach, unlocks: unl };
}

export function deckOrder(): string[] { return DECKS.map(d => d.id); }
