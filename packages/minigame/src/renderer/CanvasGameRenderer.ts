import type { GameState } from '@civ/core';
import type { CanvasLike } from '../platform/MiniGamePlatform';

export class CanvasGameRenderer {
  constructor(private readonly canvas: CanvasLike) {}

  render(state: GameState): void {
    const context = this.canvas.getContext('2d');
    if (!context) return;
    const player = state.players[state.currentPlayerIndex];
    context.fillStyle = '#1a1a2e';
    context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    context.fillStyle = '#ffffff';
    context.fillText(`Turn ${state.turn}: ${player.name} (${player.gold} gold)`, 32, 48);
  }
}
