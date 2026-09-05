import {it,expect} from 'vitest';
import {createBeginnerFoodDemo,applyBeginnerFoodCommand} from '@civ/core';

it('requires a research session, funds, and prerequisites; purchases exactly one technology',()=>{
  const state=createBeginnerFoodDemo();state.researchPoints=30;
  const buy=(id:string)=>applyBeginnerFoodCommand(state,{type:'BUY_TECHNOLOGY',technologyId:id});
  expect(buy('pottery').error).toBeDefined();state.researchOpen=true;
  expect(buy('writing').error).toBeDefined();expect(buy('unknown').error).toBeDefined();
  state.researchPoints=5;expect(buy('pottery').error).toBeDefined();expect(state.researchPoints).toBe(5);
  state.researchPoints=30;
  const purchased=buy('pottery').state;
  expect(purchased.researchPoints).toBe(24);expect(purchased.researchedTechnologyIds).toEqual(['pottery']);expect(state.researchedTechnologyIds).toEqual([]);
  expect(purchased.researchOpen).toBe(false);
  expect(applyBeginnerFoodCommand(purchased,{type:'BUY_TECHNOLOGY',technologyId:'writing'}).error).toBeDefined();
  purchased.researchOpen=true;
  expect(applyBeginnerFoodCommand(purchased,{type:'BUY_TECHNOLOGY',technologyId:'pottery'}).error).toBeDefined();
  const writing=applyBeginnerFoodCommand(purchased,{type:'BUY_TECHNOLOGY',technologyId:'writing'});
  expect(writing.error).toBeUndefined();expect(writing.state.researchPoints).toBe(6);
  expect(writing.state.researchedTechnologyIds).toEqual(['pottery','writing']);
  expect(applyBeginnerFoodCommand(writing.state,{type:'RESET_TUTORIAL'}).state.researchedTechnologyIds).toEqual([]);
});
