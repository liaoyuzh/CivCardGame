import {it,expect} from 'vitest';
import {createWebDemo,applyBeginnerFoodCommand} from '@civ/core';

it('custom setup uses exactly configured cards; buildings never add copies',()=>{
  const state=createWebDemo({scene:'regular',customSetup:'test',setups:{test:{buildings:['berry-bush','tribal-center','fire-pit'],deck:[{cardId:'search-food',count:2}]}}});
  expect(state.permanentDeck).toHaveLength(2);expect(state.hand).toHaveLength(2);
  expect(state.availablePool).toHaveLength(0);expect(state.runtime!.drawPile).toHaveLength(0);
  const next=applyBeginnerFoodCommand(state,{type:'END_TUTORIAL_TURN'}).state;
  expect(next.permanentDeck.map(card=>card.id)).toEqual(state.permanentDeck.map(card=>card.id));
  const reset=applyBeginnerFoodCommand(next,{type:'RESET_TUTORIAL'}).state;
  expect(reset.permanentDeck).toHaveLength(2);expect(reset.buildings).toHaveLength(3);expect(reset.runtime!.turn).toBe(1);
});

it('uses defaults only when no named setup is selected and rejects invalid content',()=>{
  const setups={empty:{buildings:[],deck:[]},later:{buildings:['berry-bush'],deck:[]}};
  expect(createWebDemo({scene:'regular',customSetup:null,setups}).permanentDeck).toHaveLength(12);
  expect(createWebDemo({scene:'regular',customSetup:'empty',setups}).hand).toHaveLength(0);
  expect(createWebDemo({scene:'regular',customSetup:'later',setups}).permanentDeck).toHaveLength(0);
  for(const name of ['missing','toString'])expect(()=>createWebDemo({scene:'regular',customSetup:name,setups})).toThrow('Unknown setup');
  expect(()=>createWebDemo({scene:'regular',customSetup:'bad',setups:{bad:{buildings:['bad'],deck:[]}}})).toThrow();
  expect(()=>createWebDemo({scene:'regular',customSetup:'bad',setups:{bad:{buildings:[],deck:[{cardId:'bad',count:1}]}}})).toThrow();
});

it('keeps the historical scripted tutorial explicit',()=>{
  const state=createWebDemo({scene:'tutorial'});
  expect(state.runtime).toBeUndefined();expect(state.cycleDeck).toHaveLength(10);expect(state.researchPoints).toBe(0);
});
