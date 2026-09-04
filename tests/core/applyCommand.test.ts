import { describe, expect, it } from 'vitest';
import { applyCommand, createInitialGameState, type Player } from '@civ/core';

function players(): Player[] {
  return [
    { id: 'p1', name: 'One', gold: 3, deck: [], discard: [], hand: [
      { id: 'unit', name: 'Unit', type: 'unit', cost: 2 },
    ] },
    { id: 'p2', name: 'Two', gold: 3, deck: [], discard: [], hand: [] },
  ];
}

describe('applyCommand', () => {
  it('plays a card without mutating the previous state', () => {
    const state = createInitialGameState(players());
    const result = applyCommand(state, { type: 'PLAY_CARD', playerId: 'p1', cardId: 'unit' });
    expect(state.players[0].hand).toHaveLength(1);
    expect(result.state.players[0].hand).toHaveLength(0);
    expect(result.state.players[0].gold).toBe(1);
    expect(result.events[0].type).toBe('CARD_PLAYED');
  });

  it('advances turns and rejects out-of-turn commands', () => {
    const state = createInitialGameState(players());
    const rejected = applyCommand(state, { type: 'END_TURN', playerId: 'p2' });
    expect(rejected.state).toBe(state);
    expect(rejected.events[0].type).toBe('COMMAND_REJECTED');
    const result = applyCommand(state, { type: 'END_TURN', playerId: 'p1' });
    expect(result.state.currentPlayerIndex).toBe(1);
    expect(result.state.players[1].gold).toBe(4);
  });
});
