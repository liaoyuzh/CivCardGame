import {describe,it,expect} from 'vitest';
import {createBeginnerFoodDemo,applyBeginnerFoodCommand} from '@civ/core';
import {triggerCenter} from '../../packages/core/src/rules/buildingTriggers';

describe('tribal center settlement',()=>{
  it('gates research until cycle three and retains population-scaled gains',()=>{
    const state=createBeginnerFoodDemo();triggerCenter(state,'turn-end');expect(state.researchPoints).toBe(0);
    state.cycle=3;state.population=6;
    triggerCenter(state,'organization-unlocked');expect(state.researchPoints).toBe(6);
    triggerCenter(state,'turn-end');expect(state.researchPoints).toBe(12);
    state.population=7;triggerCenter(state,'turn-end');expect(state.researchPoints).toBe(19);
  });
  it('supports buffs and debuffs and clamps research and food demand at zero',()=>{
    const state=createBeginnerFoodDemo();state.researchPoints=2;
    triggerCenter(state,'cycle-end',undefined,[{timing:'cycle-end',type:'research',amount:-5},{timing:'cycle-end',type:'food-demand',amount:2}]);
    expect(state.researchPoints).toBe(0);expect(state.extraFoodDemand).toBe(2);
    triggerCenter(state,'cycle-end',undefined,[{timing:'cycle-end',type:'food-demand',amount:-20}]);
    expect(state.population+state.extraFoodDemand).toBe(0);
  });
  it('does not commit research when food settlement fails, or repeat completed settlement',()=>{
    const state=createBeginnerFoodDemo();state.cycle=3;state.hand=[];state.turnInCycle=2;
    const failed=applyBeginnerFoodCommand(state,{type:'END_TUTORIAL_TURN'});
    expect(failed.error).toBeDefined();expect(failed.state).toBe(state);expect(state.researchPoints).toBe(0);
    state.foodResources=[{id:'test',kind:'berries',name:'浆果',food:6}];
    const success=applyBeginnerFoodCommand(state,{type:'END_TUTORIAL_TURN'});
    expect(success.error).toBeUndefined();expect(success.state.researchPoints).toBe(5);expect(success.state.population).toBe(6);
    expect(applyBeginnerFoodCommand(success.state,{type:'END_TUTORIAL_TURN'}).state.researchPoints).toBe(5);
  });
  it('removing the center disables its effects',()=>{
    const state=createBeginnerFoodDemo();state.cycle=3;state.buildings=state.buildings.filter(building=>building.id!=='tribal-center');
    triggerCenter(state,'turn-end');expect(state.researchPoints).toBe(0);
  });
});
