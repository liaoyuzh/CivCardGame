import type { Card } from './Card';

export interface Player {
  id: string;
  name: string;
  hand: Card[];
  deck: Card[];
  discard: Card[];
  gold: number;
}
