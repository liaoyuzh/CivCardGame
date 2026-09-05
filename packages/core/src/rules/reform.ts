import cards from '../content/cards.json';
import unknownPool from '../content/reform-pool.json';
import firePit from '../content/buildings/fire-pit.json';
import type {BeginnerFoodState,TutorialActionCard,TutorialActionKind} from '../tutorial/BeginnerFoodDemo';

export function makeAction(state:BeginnerFoodState,kind:TutorialActionKind,sourceBuildingId?:string):TutorialActionCard {
  const {name,cost,description}=cards[kind];
  return {id:`owned-${state.nextCardId++}`,kind,name,cost,description,sourceBuildingId};
}
export function openReform(state:BeginnerFoodState):void {
  state.reformOpen=true;
  const pool=[...unknownPool] as TutorialActionKind[];
  for(let i=pool.length-1;i>0;i--){
    state.reformSeed=(Math.imul(state.reformSeed,1664525)+1013904223)>>>0;
    const j=state.reformSeed%(i+1);[pool[i],pool[j]]=[pool[j],pool[i]];
  }
  state.reformOffers=pool.slice(0,3);
}
export function buildFirePit(state:BeginnerFoodState):void {
  if(state.buildings.some(building=>building.id==='fire-pit'))return;
  state.buildings.push({id:firePit.id,name:firePit.name,remainingUses:null,totalUses:null,cardsPerCycle:0});
  for(const entry of firePit.availableCards)for(let i=0;i<entry.count;i++)state.availablePool.push(makeAction(state,entry.cardId as TutorialActionKind,firePit.id));
}
export function removeOwnedCard(state:BeginnerFoodState,id:string):void {
  const boundary=state.turnInCycle*5-state.removedDrawnCards;
  const index=state.cycleDeck.findIndex(card=>card.id===id);
  if(index>=0&&index<boundary)state.removedDrawnCards++;
  state.cycleDeck=state.cycleDeck.filter(card=>card.id!==id);
  state.hand=state.hand.filter(card=>card.id!==id);
  state.permanentDeck=state.permanentDeck.filter(card=>card.id!==id);
  if(id.startsWith('c'))state.excludedCycleCards.push(id.replace(/^c\d+-/,''));
}
export function destroyBuilding(state:BeginnerFoodState,id:string):void {
  state.buildings=state.buildings.filter(building=>building.id!==id);
  const ids=new Set([...state.cycleDeck,...state.permanentDeck].filter(card=>card.sourceBuildingId===id).map(card=>card.id));
  ids.forEach(cardId=>removeOwnedCard(state,cardId));
  state.availablePool=state.availablePool.filter(card=>card.sourceBuildingId!==id);
}
