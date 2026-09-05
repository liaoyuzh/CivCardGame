import {describe,expect,it} from 'vitest';
import {applyBeginnerFoodCommand,createBeginnerFoodDemo,createCycleDeck,totalFood,totalFoodDemand,type BeginnerFoodState} from '@civ/core';

function playHand(state:BeginnerFoodState):BeginnerFoodState{
  while(state.hand.length){const result=applyBeginnerFoodCommand(state,{type:'PLAY_TUTORIAL_CARD',cardId:state.hand[0].id});expect(result.error).toBeUndefined();state=result.state;}
  return state;
}
describe('beginner food demo',()=>{
  it('generates nine cycle cards and spends building uses only on successful gathering',()=>{
    const initial=createBeginnerFoodDemo();
    expect(initial.buildings[0].remainingUses).toBe(40);
    expect(initial.cycleDeck.filter(card=>card.sourceBuildingId)).toHaveLength(9);
    const next=applyBeginnerFoodCommand(initial,{type:'PLAY_TUTORIAL_CARD',cardId:initial.hand[0].id}).state;
    expect(next.buildings[0].remainingUses).toBe(39);
    expect(initial.buildings[0].remainingUses).toBe(40);
    const rejected=applyBeginnerFoodCommand(next,{type:'PLAY_TUTORIAL_CARD',cardId:initial.hand[0].id});
    expect(rejected.error).toBeDefined();expect(rejected.state.buildings[0].remainingUses).toBe(39);
    const search=next.hand.find(card=>card.kind==='search-food')!;
    expect(applyBeginnerFoodCommand(next,{type:'PLAY_TUTORIAL_CARD',cardId:search.id}).state.buildings[0].remainingUses).toBe(39);
  });
  it('caps generated cards by remaining uses and stops generation after removal or exhaustion',()=>{
    const building={...createBeginnerFoodDemo().buildings[0],remainingUses:4};
    expect(createCycleDeck(5,[building]).filter(card=>card.sourceBuildingId)).toHaveLength(4);
    expect(createCycleDeck(6,[{...building,remainingUses:0}])).toHaveLength(1);
    expect(createCycleDeck(6,[])).toHaveLength(1);
  });
  it('teaches surplus population growth in cycle one',()=>{
    let state=playHand(createBeginnerFoodDemo());
    state=applyBeginnerFoodCommand(state,{type:'END_TUTORIAL_TURN'}).state;
    state=playHand(state);
    expect(totalFood(state)).toBe(10);
    expect(state.buildings[0].remainingUses).toBe(31);
    state=applyBeginnerFoodCommand(state,{type:'END_TUTORIAL_TURN'}).state;
    expect(state.population).toBe(6);expect(state.phase).toBe('cycle-result');expect(totalFood(state)).toBe(0);
  });
  it('scripts injury demand and wild meat in cycle two',()=>{
    let state=playHand(createBeginnerFoodDemo());state=applyBeginnerFoodCommand(state,{type:'END_TUTORIAL_TURN'}).state;state=playHand(state);state=applyBeginnerFoodCommand(state,{type:'END_TUTORIAL_TURN'}).state;
    state=applyBeginnerFoodCommand(state,{type:'CONTINUE_TUTORIAL'}).state;state=playHand(state);
    expect(state.cycleDeck.filter(card=>card.sourceBuildingId)).toHaveLength(9);
    expect(state.extraFoodDemand).toBe(6);expect(totalFoodDemand(state)).toBe(12);expect(state.hammers).toBe(1);
    state=applyBeginnerFoodCommand(state,{type:'END_TUTORIAL_TURN'}).state;state=playHand(state);
    expect(totalFood(state)).toBe(12);expect(state.sickWorkersNextCycle).toBe(1);
    expect(state.buildings[0].remainingUses).toBe(22);
    state=applyBeginnerFoodCommand(state,{type:'END_TUTORIAL_TURN'}).state;
    expect(state.population).toBe(6);expect(state.phase).toBe('cycle-result');
  });
});
