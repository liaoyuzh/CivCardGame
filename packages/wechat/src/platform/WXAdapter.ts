import type { CanvasLike, MiniGamePlatform, TouchPoint } from '@civ/minigame';

interface WeixinRuntime {
  createCanvas(): CanvasLike;
  requestAnimationFrame(callback: () => void): number;
  onTouchStart(callback: (event: { touches: Array<{ clientX: number; clientY: number }> }) => void): void;
}

declare const wx: WeixinRuntime;

export class WXAdapter implements MiniGamePlatform {
  createCanvas(): CanvasLike {
    return wx.createCanvas();
  }

  requestFrame(callback: () => void): number {
    return wx.requestAnimationFrame(callback);
  }

  onTouchStart(callback: (touch: TouchPoint) => void): void {
    wx.onTouchStart((event) => {
      const touch = event.touches[0];
      if (touch) callback({ x: touch.clientX, y: touch.clientY });
    });
  }
}
