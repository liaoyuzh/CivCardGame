import type { GameEvent, GameState } from '@civ/core';
import { EventPanel } from './EventPanel';
import { StateViewer } from './StateViewer';

export class DebugPanel {
  private readonly eventPanel: EventPanel;
  private readonly stateViewer: StateViewer;

  constructor(parent: HTMLElement) {
    const container = document.createElement('aside');
    container.id = 'debug-panel';
    container.style.cssText = `
      position: fixed; top: 10px; right: 10px; width: 300px; height: 400px;
      background: rgba(0,0,0,0.8); color: #fff; font-family: monospace;
      font-size: 12px; z-index: 10000; border-radius: 8px; overflow: hidden;
    `;
    parent.appendChild(container);
    this.eventPanel = new EventPanel(container);
    this.stateViewer = new StateViewer(container);
  }

  render(state: GameState, events: GameEvent[]): void {
    this.stateViewer.updateState(state);
    events.forEach((event) => this.eventPanel.logEvent(event));
  }
}
