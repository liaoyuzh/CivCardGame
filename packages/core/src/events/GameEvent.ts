import type { Card } from '../model/Card';

export type GameEvent =
  | { type: 'CARD_PLAYED'; playerId: string; card: Card }
  | { type: 'TURN_ENDED'; playerId: string; nextPlayerId: string; turn: number }
  | { type: 'COMMAND_REJECTED'; commandType: string; reason: string };
