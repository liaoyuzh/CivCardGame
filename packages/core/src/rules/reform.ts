import cards from '../content/cards.json';
import unknownPool from '../content/reform-pool.json';
import firePit from '../content/buildings/fire-pit.json';
import ancientBuildings from '../content/buildings/ancient.json';
import {rarityPick,nextRandom} from './rarity';
import type {BeginnerFoodState,TutorialActionCard,TutorialActionKind} from '../tutorial/BeginnerFoodDemo';

export function makeAction(state:BeginnerFoodState,kind:TutorialActionKind,sourceBuildingId?:string):TutorialActionCard {
  const {name,cost,description,rarity}=cards[kind];
  return {id:`owned-${state.nextCardId++}`,kind,name,cost,description,rarity,sourceBuildingId};
}
export function openReform(state:BeginnerFoodState):void {
  state.reformOpen=true;
  let pool=unknownPool.map(id=>({id:id as TutorialActionKind,rarity:cards[id as TutorialActionKind].rarity}));
  state.reformOffers=[];
  for(let i=0;i<3&&pool.length;i++){
    const chosen=rarityPick(pool,()=>nextRandom(state));state.reformOffers.push(chosen.id);
    pool=pool.filter(item=>item.id!==chosen.id);
  }
}
export const buildingCatalog=[firePit,...ancientBuildings];
export function blueprintBuilding(kind:TutorialActionKind):string|undefined {
  const effect=cards[kind].effects.find(effect=>effect.type==='build-building');
  return effect&&'buildingId' in effect&&typeof effect.buildingId==='string'?effect.buildingId:undefined;
}
export function buildBuilding(state:BeginnerFoodState,id:string):void {
  const definition=buildingCatalog.find(building=>building.id===id);
  if(!definition)throw new Error(`未知建筑：${id}`);
  if(state.buildings.some(building=>building.id===id))return;
  state.buildings.push({id:definition.id,name:definition.name,rarity:definition.rarity,remainingUses:null,totalUses:null,cardsPerCycle:0});
  for(const entry of definition.availableCards)for(let i=0;i<entry.count;i++)state.availablePool.push(makeAction(state,entry.cardId as TutorialActionKind,id));
}
export function buildFirePit(state:BeginnerFoodState):void {
  buildBuilding(state,'fire-pit');
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
