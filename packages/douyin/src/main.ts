import { createInitialGameState } from '@civ/core';
import { CanvasGameRenderer } from '@civ/minigame';
import { TTAdapter } from './platform/TTAdapter';

const adapter = new TTAdapter();
const canvas = adapter.createCanvas();
canvas.width = 1280;
canvas.height = 720;
const renderer = new CanvasGameRenderer(canvas);
const state = createInitialGameState([
  { id: 'player-1', name: 'Player 1', gold: 3, hand: [], deck: [], discard: [] },
  { id: 'player-2', name: 'Player 2', gold: 3, hand: [], deck: [], discard: [] },
]);

function frame(): void { renderer.render(state); adapter.requestFrame(frame); }
frame();
