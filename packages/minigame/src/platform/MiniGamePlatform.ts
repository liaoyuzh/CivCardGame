export interface CanvasContextLike {
  fillStyle: string | object;
  fillRect(x: number, y: number, width: number, height: number): void;
  fillText(text: string, x: number, y: number): void;
}

export interface CanvasLike {
  width: number;
  height: number;
  getContext(type: '2d'): CanvasContextLike | null;
}

export interface TouchPoint {
  x: number;
  y: number;
}

export interface MiniGamePlatform {
  createCanvas(): CanvasLike;
  requestFrame(callback: () => void): number;
  onTouchStart(callback: (touch: TouchPoint) => void): void;
}
