import type { Card, CaptureType, RegularInstance, RoundState, Rules, RunState } from '../types.ts';
import type { RegularDef } from '../data.ts';

export interface Effect { chips?: number; mult?: number; xMult?: number; money?: number; retrigger?: number }

export interface CaptureCtx {
  run: RunState;
  round: RoundState;
  rules: Rules;
  type: CaptureType;
  groups: number;
  handCard: Card;
  tableCards: Card[];
  held: Card[];
  tabla: boolean;
  /** Tabla daje bonus (false kod gazde Ruža na stolu, ali se Tabla i dalje broji). */
  tablaBonus: boolean;
  preview: boolean;
  /** Šansa 1 u N iz 'scoring' streama; u preview modu uvijek false (ne otkrivamo sreću unaprijed). */
  roll(oneIn: number): boolean;
}

export interface Hooks {
  onCardScored?(ctx: CaptureCtx, inst: RegularInstance, def: RegularDef, card: Card): Effect | null;
  retrigger?(ctx: CaptureCtx, inst: RegularInstance, def: RegularDef, card: Card): number;
  onHeldCard?(ctx: CaptureCtx, inst: RegularInstance, def: RegularDef, card: Card): Effect | null;
  onCapture?(ctx: CaptureCtx, inst: RegularInstance, def: RegularDef): Effect | null;
  afterScore?(ctx: CaptureCtx, inst: RegularInstance, def: RegularDef): void;
  onLay?(run: RunState, round: RoundState, inst: RegularInstance, def: RegularDef, card: Card): void;
  onRoundEnd?(run: RunState, inst: RegularInstance, def: RegularDef): number;
  onSell?(run: RunState, inst: RegularInstance, def: RegularDef): number;
  onBossDefeated?(run: RunState, inst: RegularInstance, def: RegularDef, rules: Rules): void;
  modifyRules?(rules: Rules, def: RegularDef): void;
}
