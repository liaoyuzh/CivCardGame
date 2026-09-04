import type { Player } from './Player';

export type GamePhase = 'lobby' | 'setup' | 'main' | 'battle' | 'end';

export interface GameState {
  phase: GamePhase;
  players: Player[];
  currentPlayerIndex: number;
  turn: number;
  winnerId?: string;
}

export function createInitialGameState(players: Player[]): GameState {
  if (players.length < 2) {
    throw new Error('A game requires at least two players.');
  }

  return {
    phase: 'main',
    players: players.map(clonePlayer),
    currentPlayerIndex: 0,
    turn: 1,
  };
}

export function cloneGameState(state: GameState): GameState {
  return {
    ...state,
    players: state.players.map(clonePlayer),
  };
}

function clonePlayer(player: Player): Player {
  return {
    ...player,
    hand: player.hand.map((card) => ({ ...card, abilities: card.abilities ? [...card.abilities] : undefined })),
    deck: player.deck.map((card) => ({ ...card, abilities: card.abilities ? [...card.abilities] : undefined })),
    discard: player.discard.map((card) => ({ ...card, abilities: card.abilities ? [...card.abilities] : undefined })),
  };
}
