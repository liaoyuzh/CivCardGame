import type { GameState } from '@civ/core';

export class StateViewer {
  private stateDisplay: HTMLElement;

  constructor(parent: HTMLElement) {
    const header = document.createElement('div');
    header.textContent = '状态查看器';
    header.style.cssText = 'padding: 8px; background: #333; font-weight: bold;';

    this.stateDisplay = document.createElement('pre');
    this.stateDisplay.style.cssText = 'height: calc(100% - 30px); overflow-y: auto; padding: 8px; margin: 0;';

    parent.appendChild(header);
    parent.appendChild(this.stateDisplay);
  }

  updateState(state: GameState): void {
    this.stateDisplay.textContent = JSON.stringify(state, null, 2);
  }
}
