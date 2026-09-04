import {describe,expect,it} from 'vitest';
import {applyBeginnerFoodCommand,createBeginnerFoodDemo,totalFood,totalFoodDemand,type BeginnerFoodState} from '@civ/core';

function playHand(state:BeginnerFoodState):BeginnerFoodState{
  while(state.hand.length){const result=applyBeginnerFoodCommand(state,{type:'PLAY_TUTORIAL_CARD',cardId:state.hand[0].id});expect(result.error).toBeUndefined();state=result.state;}
  return state;
}
describe('beginner food demo',()=>{
  it('teaches surplus population growth in cycle one',()=>{
    let state=playHand(createBeginnerFoodDemo());
    state=applyBeginnerFoodCommand(state,{type:'END_TUTORIAL_TURN'}).state;
    state=playHand(state);
    expect(totalFood(state)).toBe(10);
    state=applyBeginnerFoodCommand(state,{type:'END_TUTORIAL_TURN'}).state;
    expect(state.population).toBe(6);expect(state.phase).toBe('cycle-result');expect(totalFood(state)).toBe(0);
  });
  it('scripts injury demand and wild meat in cycle two',()=>{
    let state=playHand(createBeginnerFoodDemo());state=applyBeginnerFoodCommand(state,{type:'END_TUTORIAL_TURN'}).state;state=playHand(state);state=applyBeginnerFoodCommand(state,{type:'END_TUTORIAL_TURN'}).state;
    state=applyBeginnerFoodCommand(state,{type:'CONTINUE_TUTORIAL'}).state;state=playHand(state);
    expect(state.extraFoodDemand).toBe(6);expect(totalFoodDemand(state)).toBe(12);expect(state.hammers).toBe(1);
    state=applyBeginnerFoodCommand(state,{type:'END_TUTORIAL_TURN'}).state;state=playHand(state);
    expect(totalFood(state)).toBe(12);expect(state.sickWorkersNextCycle).toBe(1);
    state=applyBeginnerFoodCommand(state,{type:'END_TUTORIAL_TURN'}).state;
    expect(state.population).toBe(6);expect(state.phase).toBe('cycle-result');
  });
});
