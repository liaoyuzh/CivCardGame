import {afterEach,expect,it} from 'vitest';
import {createWebDemo,applyBeginnerFoodCommand,globalConfig,totalFood,totalFoodDemand,drawCards,openTradeShop,openResearchShop} from '@civ/core';
import {makeAction} from '../../packages/core/src/rules/reform';
import {applyEffects} from '../../packages/core/src/rules/applyEffects';

const defaults={...globalConfig};
afterEach(()=>Object.assign(globalConfig,defaults));
function game(count=12){return createWebDemo({scene:'regular',customSetup:'test',setups:{test:{buildings:[],deck:[{cardId:'gather-berries',count}]}}});}
function stock(state:ReturnType<typeof game>,food:number){state.foodResources=[{id:'stock',kind:'grain',name:'库存',food}];}

it('charges every turn with a 50-card deck and retains food; washing never settles food',()=>{
  const state=game(50);stock(state,5);
  const result=applyBeginnerFoodCommand(state,{type:'END_TUTORIAL_TURN'});
  expect(result.error).toBeUndefined();expect(result.state.population).toBe(5);
  expect(result.state.runtime!.turn).toBe(2);expect(totalFood(result.state)).toBe(0);
  expect(result.state.runtime!.drawPile).toHaveLength(40);
  expect(totalFood(state)).toBe(5);expect(state.runtime!.turn).toBe(1);
  const small=game(1);const food=totalFood(small);
  const played=applyBeginnerFoodCommand(small,{type:'PLAY_TUTORIAL_CARD',cardId:small.hand[0].id}).state;
  drawCards(played,5);expect(played.hand).toHaveLength(1);
  expect(played.runtime!.turn).toBe(1);expect(totalFood(played)).toBe(food+1);
});

it('rounds global consumption over population, supports zero and rejects invalid coefficients',()=>{
  const state=game();globalConfig.FoodConsumptionPerPop=0.3;
  expect(totalFoodDemand(state)).toBe(2);
  globalConfig.FoodConsumptionPerPop=2;
  applyEffects(state,[{type:'reduce-food-demand',amount:8}]);expect(totalFoodDemand(state)).toBe(2);
  state.extraFoodDemand=0;globalConfig.FoodConsumptionPerPop=0;expect(totalFoodDemand(state)).toBe(0);
  for(const invalid of [-1,NaN,Infinity]){globalConfig.FoodConsumptionPerPop=invalid;expect(()=>totalFoodDemand(state)).toThrow();}
});

it('retains partial food and spends growth surplus rather than reusing it',()=>{
  const state=game();stock(state,10);
  const next=applyBeginnerFoodCommand(state,{type:'END_TUTORIAL_TURN'}).state;
  expect(next.population).toBe(6);expect(totalFood(next)).toBe(4);
  expect(next.foodResources[0].id).toBe('stock');expect(totalFood(state)).toBe(10);
});

it('starvation works without a center and population zero terminates play',()=>{
  const state=game();state.foodResources=[];
  const next=applyBeginnerFoodCommand(state,{type:'END_TUTORIAL_TURN'}).state;
  expect(next.population).toBe(0);expect(next.phase).toBe('complete');
  expect(applyBeginnerFoodCommand(next,{type:'END_TUTORIAL_TURN'}).error).toBeDefined();
  expect(applyBeginnerFoodCommand(next,{type:'RESET_TUTORIAL'}).state.population).toBe(5);
});

it('discarded and unplayed cards recycle once without regenerating IDs',()=>{
  let state=game(7);const ids=state.permanentDeck.map(card=>card.id).sort();
  const waiting=state.runtime!.drawPile.map(card=>card.id);
  for(let turn=0;turn<8;turn++){
    stock(state,5);
    state=applyBeginnerFoodCommand(state,{type:'END_TUTORIAL_TURN'}).state;
    const zones=[...state.hand,...state.runtime!.drawPile,...state.runtime!.discardPile].map(card=>card.id);
    expect(zones.sort()).toEqual(ids);expect(state.hammers).toBe(5);
    if(turn===0)expect(state.hand.slice(0,2).map(card=>card.id)).toEqual(waiting);
  }
});

it('food modifiers and temporary cards end this turn; injuries last the next turn',()=>{
  let state=game();stock(state,4);
  applyEffects(state,[{type:'reduce-food-demand',amount:1},{type:'set-sick-workers',amount:2}]);
  const temporary=makeAction(state,'gather-berries');state.runtime!.discardPile.push(temporary);state.runtime!.temporaryCardIds.push(temporary.id);
  state=applyBeginnerFoodCommand(state,{type:'END_TUTORIAL_TURN'}).state;
  expect(state.population).toBe(5);expect(state.hammers).toBe(3);expect(state.extraFoodDemand).toBe(0);
  expect([...state.hand,...state.runtime!.drawPile,...state.runtime!.discardPile].some(card=>card.id===temporary.id)).toBe(false);
  stock(state,5);state=applyBeginnerFoodCommand(state,{type:'END_TUTORIAL_TURN'}).state;expect(state.hammers).toBe(5);
});

it('trade uses gold, includes locked foreign cards and does not unlock their technology',()=>{
  let state=game();state.runtime!.gold=100;
  let foreign;
  for(let i=0;i<100&&!foreign;i++){openTradeShop(state);foreign=state.researchOffers.find(offer=>offer.type==='blueprint');}
  expect(foreign).toBeDefined();const bottles=state.researchPoints;
  const bought=applyBeginnerFoodCommand(state,{type:'BUY_RESEARCH_OFFER',offerId:foreign!.id});expect(bought.error).toBeUndefined();state=bought.state;
  expect(state.runtime!.gold).toBe(100-foreign!.cost);expect(state.researchPoints).toBe(bottles);
  expect(state.researchedTechnologyIds).toHaveLength(0);expect(state.runtime!.drawPile[0].kind).toBe(foreign!.contentId);
  expect(applyBeginnerFoodCommand(state,{type:'BUY_RESEARCH_OFFER',offerId:foreign!.id}).error).toBeDefined();
  state=applyBeginnerFoodCommand(state,{type:'CLOSE_RESEARCH'}).state;
  openResearchShop(state);expect(state.researchOffers.some(offer=>offer.contentId===foreign!.contentId)).toBe(false);
});

it('research and trade require a card action; shop blocks turn and other actions',()=>{
  let state=game();const trade=makeAction(state,'trade');state.hand=[trade];state.permanentDeck.push(trade);
  state=applyBeginnerFoodCommand(state,{type:'PLAY_TUTORIAL_CARD',cardId:trade.id}).state;
  expect(state.runtime!.shop).toBe('trade');expect(state.hammers).toBe(4);
  expect(applyBeginnerFoodCommand(state,{type:'END_TUTORIAL_TURN'}).error).toBeDefined();
  const offer=state.researchOffers[0];state.runtime!.gold=0;
  expect(applyBeginnerFoodCommand(state,{type:'BUY_RESEARCH_OFFER',offerId:offer.id}).error).toBeDefined();
});
