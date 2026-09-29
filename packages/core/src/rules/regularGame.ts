import type {BeginnerFoodState,BeginnerFoodCommand,BeginnerFoodResult} from '../tutorial/BeginnerFoodDemo';
import cards from '../content/cards.json';
import {addToDeck,drawCards,shuffle} from './deckZones';
import {globalConfig,validateGlobalConfig,settleTurnFood} from './turnRules';
import {applyEffects} from './applyEffects';
import {makeAction,removeOwnedCard,destroyBuilding,blueprintBuilding} from './reform';
import {purchaseResearchOffer} from './researchShop';
import {triggerCenter} from './buildingTriggers';

export function initializeRegularGame(state:BeginnerFoodState):void {
  validateGlobalConfig();
  state.runtime={turn:1,drawPile:[...state.permanentDeck],discardPile:[],gold:globalConfig.StartingGold,shop:'research',temporaryCardIds:[]};
  state.hand=[];state.cycleDeck=[];
  state.hammers=globalConfig.BaseHammersPerTurn;
  state.buildings.forEach(building=>{building.remainingUses=null;building.totalUses=null;building.cardsPerCycle=0;});
  const food=Math.ceil(state.population*globalConfig.FoodConsumptionPerPop)*globalConfig.StartingFoodTurns;
  state.foodResources=food?[{id:'initial-food',kind:'grain',name:'储备口粮',food,rarity:'white'}]:[];
  shuffle(state,state.runtime.drawPile);drawCards(state,globalConfig.CardsPerTurn);
}

export function applyRegularCommand(original:BeginnerFoodState,state:BeginnerFoodState,command:BeginnerFoodCommand):BeginnerFoodResult {
  const runtime=state.runtime!;
  const fail=(error:string):BeginnerFoodResult=>({state:original,error});
  if(state.phase!=='action')return fail('游戏已结束，请重新开始。');
  if(command.type==='CLOSE_REFORM'){state.reformOpen=false;state.reformOffers=[];return {state};}
  if(command.type==='CLOSE_RESEARCH'){state.researchOpen=false;state.researchOffers=[];return {state};}
  if(command.type==='REFORM'){
    if(!state.reformOpen)return fail('请先打出改革卡。');
    if(command.mode==='discover'){
      if(!state.reformOffers.includes(command.cardId as keyof typeof cards))return fail('不在本次发现选项中。');
      addToDeck(state,makeAction(state,command.cardId as keyof typeof cards));
    }else if(command.mode==='available'){
      const card=state.availablePool.find(card=>card.id===command.cardId);
      if(!card)return fail('该牌不在备用区。');
      state.availablePool=state.availablePool.filter(item=>item.id!==card.id);addToDeck(state,card);
    }else{
      const card=state.permanentDeck.find(card=>card.id===command.cardId);
      if(!card)return fail('该牌不在使用中的卡组。');
      removeOwnedCard(state,card.id);state.availablePool.push(card);
    }
    state.reformOpen=false;state.reformOffers=[];
    state.log.unshift({id:state.nextLogId++,tone:'good',title:'改革完成',detail:command.mode==='remove'?'卡牌已移至备用区，仍然持有。':'卡牌已加入抽牌堆顶。'});
    return {state};
  }
  if(state.reformOpen)return fail('请先完成或关闭改革。');
  if(command.type==='BUY_RESEARCH_OFFER'||command.type==='BUY_TECHNOLOGY'){
    const id=command.type==='BUY_RESEARCH_OFFER'?command.offerId:state.researchOffers.find(item=>item.type==='technology'&&item.contentId===command.technologyId)?.id;
    if(!id)return fail('该商品不在本次候选中。');
    const error=purchaseResearchOffer(state,id);return error?fail(error):{state};
  }
  if(state.researchOpen)return fail('请先关闭商店。');
  if(command.type==='DESTROY_BUILDING'){
    if(!state.buildings.some(item=>item.id===command.buildingId))return fail('建筑不存在。');
    destroyBuilding(state,command.buildingId);return {state};
  }
  if(command.type==='PLAY_TUTORIAL_CARD'){
    const index=state.hand.findIndex(item=>item.id===command.cardId),card=state.hand[index];
    if(!card)return fail('这张牌不在手牌中。');
    if(card.cost>state.hammers)return fail('锤子不足。');
    if(card.kind==='roast-food'&&!state.foodResources.length)return fail('需要已有食物才能烧烤。');
    const building=blueprintBuilding(card.kind);
    if(building&&state.buildings.some(item=>item.id===building))return fail('该建筑已经建成。');
    state.hammers-=card.cost;state.hand.splice(index,1);state.playedThisCycle++;
    applyEffects(state,cards[card.kind].effects,()=> 'stored-nuts');
    if(building)removeOwnedCard(state,card.id);
    else runtime.discardPile.push(card);
    state.log.unshift({id:state.nextLogId++,tone:'info',title:card.name,detail:card.description});
    return {state};
  }
  if(command.type!=='END_TUTORIAL_TURN')return fail('当前模式使用普通回合，无需继续生产周期。');
  triggerCenter(state,'turn-end');
  settleTurnFood(state);
  runtime.discardPile.push(...state.hand);state.hand=[];
  // Temporary cards last until the end of the turn regardless of their current zone.
  const expired=new Set(runtime.temporaryCardIds);
  runtime.drawPile=runtime.drawPile.filter(card=>!expired.has(card.id));
  runtime.discardPile=runtime.discardPile.filter(card=>!expired.has(card.id));
  runtime.temporaryCardIds=[];
  state.extraFoodDemand=0;state.surplusResearch=false;
  if(state.population===0){state.phase='complete';state.resultMessage='人口归零，文明结束。';return {state};}
  state.sickWorkers=state.sickWorkersNextCycle;state.sickWorkersNextCycle=0;
  state.hammers=Math.max(0,globalConfig.BaseHammersPerTurn-state.sickWorkers);
  runtime.turn++;state.turnInCycle=runtime.turn;state.playedThisCycle=0;
  drawCards(state,globalConfig.CardsPerTurn);
  return {state};
}
