export type CardType = 'unit' | 'spell' | 'building' | 'token';

export interface Card {
  id: string;
  name: string;
  type: CardType;
  cost: number;
  rarity?: 'white' | 'blue' | 'gold' | 'red';
  attack?: number;
  health?: number;
  abilities?: string[];
}
