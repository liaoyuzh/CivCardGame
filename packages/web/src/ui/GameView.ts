import type { GameCommand, GameState } from '@civ/core';

export class GameView {
  constructor(
    private readonly root: HTMLElement,
    private readonly dispatch: (command: GameCommand) => void,
  ) {}

  render(state: GameState): void {
    const player = state.players[state.currentPlayerIndex];
    this.root.replaceChildren();

    const title = document.createElement('h1');
    title.textContent = `Civ Card Game — Turn ${state.turn}`;
    const status = document.createElement('p');
    status.textContent = `${player.name}'s turn · ${player.gold} gold`;
    const hand = document.createElement('div');

    for (const card of player.hand) {
      const button = document.createElement('button');
      button.textContent = `${card.name} (${card.cost})`;
      button.disabled = card.cost > player.gold;
      button.onclick = () => this.dispatch({ type: 'PLAY_CARD', playerId: player.id, cardId: card.id });
      hand.appendChild(button);
    }

    const endTurn = document.createElement('button');
    endTurn.textContent = 'End turn';
    endTurn.onclick = () => this.dispatch({ type: 'END_TURN', playerId: player.id });
    this.root.append(title, status, hand, endTurn);
  }
}
