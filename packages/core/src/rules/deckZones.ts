import type {BeginnerFoodState, TutorialActionCard} from '../tutorial/BeginnerFoodDemo';
import {nextRandom} from './rarity';

/** Runtime zones contain the same owned IDs; no periodic copies are generated. */
export interface DeckRuntime {
  turn:number;
  drawPile:TutorialActionCard[];
  discardPile:TutorialActionCard[];
  gold:number;
  shop:'research'|'trade';
  temporaryCardIds:string[];
}

export function shuffle(state:BeginnerFoodState, cards:TutorialActionCard[]):void {
  for(let i=cards.length-1;i>0;i--){
    const j=Math.floor(nextRandom(state)*(i+1));
    [cards[i],cards[j]]=[cards[j],cards[i]];
  }
}

export function drawCards(state:BeginnerFoodState,count:number):void {
  const runtime=state.runtime!;
  for(let i=0;i<count;i++){
    if(!runtime.drawPile.length){
      runtime.drawPile=runtime.discardPile.splice(0);
      shuffle(state,runtime.drawPile);
    }
    const card=runtime.drawPile.shift();
    if(!card)break;
    state.hand.push(card);
  }
}

export function addToDeck(state:BeginnerFoodState,card:TutorialActionCard):void {
  state.permanentDeck.push(card);
  if(state.runtime)state.runtime.drawPile.unshift(card);
}

export function removeFromZones(state:BeginnerFoodState,id:string):void {
  state.hand=state.hand.filter(card=>card.id!==id);
  if(state.runtime){
    state.runtime.drawPile=state.runtime.drawPile.filter(card=>card.id!==id);
    state.runtime.discardPile=state.runtime.discardPile.filter(card=>card.id!==id);
    state.runtime.temporaryCardIds=state.runtime.temporaryCardIds.filter(cardId=>cardId!==id);
  }
}
