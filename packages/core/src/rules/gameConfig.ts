export interface GameConfig {
  maxPlayers: number;
  handSize: number;
  deckSize: number;
  initialGold: number;
}

export const DEFAULT_GAME_CONFIG: GameConfig = {
  maxPlayers: 2,
  handSize: 5,
  deckSize: 30,
  initialGold: 3,
};
