import type { CanvasLike, MiniGamePlatform, TouchPoint } from '@civ/minigame';

interface DouyinRuntime {
  createCanvas(): CanvasLike;
  requestAnimationFrame(callback: () => void): number;
  onTouchStart(callback: (event: { touches: Array<{ clientX: number; clientY: number }> }) => void): void;
}
declare const tt: DouyinRuntime;

export class TTAdapter implements MiniGamePlatform {
  createCanvas(): CanvasLike { return tt.createCanvas(); }
  requestFrame(callback: () => void): number { return tt.requestAnimationFrame(callback); }
  onTouchStart(callback: (touch: TouchPoint) => void): void {
    tt.onTouchStart((event) => {
      const touch = event.touches[0];
      if (touch) callback({ x: touch.clientX, y: touch.clientY });
    });
  }
}
