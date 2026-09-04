import type { GameEvent } from '@civ/core';

export class EventPanel {
  private eventList: HTMLElement;

  constructor(parent: HTMLElement) {
    const header = document.createElement('div');
    header.textContent = '事件日志';
    header.style.cssText = 'padding: 8px; background: #333; font-weight: bold;';

    this.eventList = document.createElement('div');
    this.eventList.style.cssText = 'height: calc(100% - 30px); overflow-y: auto; padding: 4px;';

    parent.appendChild(header);
    parent.appendChild(this.eventList);
  }

  logEvent(event: GameEvent): void {
    const item = document.createElement('div');
    item.style.cssText = 'border-bottom: 1px solid #444; padding: 4px;';
    item.textContent = `${event.type}: ${JSON.stringify(event).slice(0, 140)}`;
    this.eventList.insertBefore(item, this.eventList.firstChild);

    if (this.eventList.children.length > 50) {
      this.eventList.removeChild(this.eventList.lastChild!);
    }
  }
}
