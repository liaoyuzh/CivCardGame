import {it,expect} from 'vitest';
import center from '../../packages/core/src/content/buildings/tribal-center.json';
import {createWebDemo,totalFoodDemand,populationOutput} from '@civ/core';
import {triggerCenter} from '../../packages/core/src/rules/buildingTriggers';
import {applyEffects} from '../../packages/core/src/rules/applyEffects';

it('uses configured food and research ratios including fractions and demand reductions',()=>{
  const food=center.foodPerPopulation,research=center.researchPerPopulation;
  try{
    center.foodPerPopulation=2;center.researchPerPopulation=0.5;
    const state=createWebDemo({scene:'tutorial'});
    state.cycle=3;state.researchPoints=6;
    expect(totalFoodDemand(state)).toBe(10);
    triggerCenter(state,'turn-end');expect(state.researchPoints).toBe(9);
    applyEffects(state,[{type:'reduce-food-demand',amount:8}]);expect(totalFoodDemand(state)).toBe(2);
    triggerCenter(state,'cycle-end',undefined,[{timing:'cycle-end',type:'food-demand',amount:-10}]);
    expect(totalFoodDemand(state)).toBe(0);
    center.foodPerPopulation=0;expect(totalFoodDemand(state)).toBe(0);
  }finally{center.foodPerPopulation=food;center.researchPerPopulation=research;}
});
it('rounds the total and rejects invalid ratios',()=>{
  expect(populationOutput(5,0.5)).toBe(3);expect(populationOutput(5,0)).toBe(0);
  for(const rate of [-1,NaN,Infinity])expect(()=>populationOutput(5,rate)).toThrow();
});
