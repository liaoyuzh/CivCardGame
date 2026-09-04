export type GameCommand =
  | { type: 'PLAY_CARD'; playerId: string; cardId: string }
  | { type: 'END_TURN'; playerId: string };
