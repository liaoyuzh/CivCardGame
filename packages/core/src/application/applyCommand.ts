import type { GameCommand } from '../commands/GameCommand';
import type { GameEvent } from '../events/GameEvent';
import { cloneGameState, type GameState } from '../model/GameState';

export interface GameResult {
  state: GameState;
  events: GameEvent[];
}

export function applyCommand(state: GameState, command: GameCommand): GameResult {
  const next = cloneGameState(state);
  const activePlayer = next.players[next.currentPlayerIndex];

  if (next.phase === 'end') {
    return reject(state, command.type, 'The game has already ended.');
  }
  if (!activePlayer || activePlayer.id !== command.playerId) {
    return reject(state, command.type, 'It is not that player\'s turn.');
  }

  if (command.type === 'PLAY_CARD') {
    const cardIndex = activePlayer.hand.findIndex((card) => card.id === command.cardId);
    const card = activePlayer.hand[cardIndex];
    if (!card) return reject(state, command.type, 'Card is not in the player\'s hand.');
    if (card.cost > activePlayer.gold) return reject(state, command.type, 'Not enough gold.');

    activePlayer.gold -= card.cost;
    activePlayer.hand.splice(cardIndex, 1);
    activePlayer.discard.push(card);
    return { state: next, events: [{ type: 'CARD_PLAYED', playerId: activePlayer.id, card }] };
  }

  const endingPlayerId = activePlayer.id;
  next.currentPlayerIndex = (next.currentPlayerIndex + 1) % next.players.length;
  if (next.currentPlayerIndex === 0) next.turn += 1;
  const nextPlayer = next.players[next.currentPlayerIndex];
  nextPlayer.gold += 1;

  return {
    state: next,
    events: [{ type: 'TURN_ENDED', playerId: endingPlayerId, nextPlayerId: nextPlayer.id, turn: next.turn }],
  };
}

function reject(state: GameState, commandType: string, reason: string): GameResult {
  return { state, events: [{ type: 'COMMAND_REJECTED', commandType, reason }] };
}
