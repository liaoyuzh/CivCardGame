import {it,expect} from 'vitest';
import {createWebDemo,applyBeginnerFoodCommand,type BeginnerFoodState} from '@civ/core';

it('custom setup generates exactly one set of building cards each cycle and on reset',()=>{
  let state=createWebDemo({scene:'regular',customSetup:'test',setups:{test:{buildings:['berry-bush','tribal-center'],deck:[{cardId:'search-food',count:2}]}}});
  function check(state:BeginnerFoodState){
    expect(state.cycleDeck).toHaveLength(13);
    expect(state.cycleDeck.filter(card=>card.kind==='research'&&card.sourceBuildingId==='tribal-center')).toHaveLength(1);
    expect(state.cycleDeck.filter(card=>card.kind==='reform'&&card.sourceBuildingId==='tribal-center')).toHaveLength(1);
    expect(state.cycleDeck.filter(card=>card.kind==='gather-berries'&&card.sourceBuildingId==='berry-bush')).toHaveLength(9);
    expect(state.cycleDeck.filter(card=>!card.sourceBuildingId).map(card=>card.kind)).toEqual(['search-food','search-food']);
    expect(new Set(state.cycleDeck.map(card=>card.id)).size).toBe(13);
  }
  check(state);
  state=finish(state);expect(state.buildings.find(building=>building.id==='berry-bush')!.remainingUses).toBe(31);
  state=applyBeginnerFoodCommand(state,{type:'CONTINUE_TUTORIAL'}).state;check(state);
  check(applyBeginnerFoodCommand(state,{type:'RESET_TUTORIAL'}).state);
  state=finish(state);state.buildings=state.buildings.filter(building=>building.id!=='tribal-center');
  state=applyBeginnerFoodCommand(state,{type:'CONTINUE_TUTORIAL'}).state;
  expect(state.cycleDeck.some(card=>card.kind==='research'||card.kind==='reform')).toBe(false);
});

it('keeps named setups inactive until selected and rejects missing names',()=>{
  const setups={empty:{buildings:[],deck:[]},later:{buildings:['berry-bush'],deck:[]}};
  expect(createWebDemo({scene:'regular',customSetup:null,setups}).cycleDeck).toHaveLength(12);
  expect(createWebDemo({scene:'regular',setups}).cycleDeck).toHaveLength(12);
  expect(createWebDemo({scene:'regular',customSetup:'empty',setups}).cycleDeck).toHaveLength(0);
  expect(createWebDemo({scene:'regular',customSetup:'later',setups}).cycleDeck).toHaveLength(9);
  expect(()=>createWebDemo({scene:'regular',customSetup:'missing',setups})).toThrow('Unknown setup');
  expect(()=>createWebDemo({scene:'regular',customSetup:'toString',setups})).toThrow('Unknown setup');
});

function finish(state:BeginnerFoodState){
  while(state.phase==='action'){
    for(const card of [...state.hand]){
      if(card.cost<=state.hammers){state=applyBeginnerFoodCommand(state,{type:'PLAY_TUTORIAL_CARD',cardId:card.id}).state;if(state.researchOpen)state=applyBeginnerFoodCommand(state,{type:'CLOSE_RESEARCH'}).state;if(state.reformOpen)state=applyBeginnerFoodCommand(state,{type:'CLOSE_REFORM'}).state;}
    }
    const result=applyBeginnerFoodCommand(state,{type:'END_TUTORIAL_TURN'});expect(result.error).toBeUndefined();state=result.state;
  }
  return state;
}
it('continues regular play after berry exhaustion and repeated food shortages',()=>{
  let state=createWebDemo({scene:'regular'});
  for(let i=0;i<25;i++){
    state=finish(state);expect(state.phase).toBe('cycle-result');
    expect(state.population).toBeGreaterThanOrEqual(0);
    state=applyBeginnerFoodCommand(state,{type:'CONTINUE_TUTORIAL'}).state;
    expect(state.phase).toBe('action');
  }
  expect(state.cycle).toBe(26);expect(state.buildings[0].remainingUses).toBe(0);
});
it('can continue with an empty regular deck',()=>{
  let state=createWebDemo({scene:'regular',customSetup:'empty',setups:{empty:{buildings:[],deck:[]}}});
  for(let i=0;i<10;i++){
    state=finish(state);expect(state.phase).toBe('cycle-result');
    state=applyBeginnerFoodCommand(state,{type:'CONTINUE_TUTORIAL'}).state;
  }
  expect(state.cycle).toBe(11);expect(state.phase).toBe('action');
});
it('starts regular with active buildings and continues beyond tutorial length without scripted crises',()=>{
  let state=createWebDemo({scene:'regular'});
  expect(state.researchPoints).toBe(6);expect(state.cycleDeck).toHaveLength(12);
  for(let cycle=1;cycle<=3;cycle++){
    state=finish(state);expect(state.extraFoodDemand).toBe(0);expect(state.sickWorkersNextCycle).toBe(0);expect(state.phase).toBe('cycle-result');
    state=applyBeginnerFoodCommand(state,{type:'CONTINUE_TUTORIAL'}).state;
  }
  expect(state.cycle).toBe(4);expect(state.phase).toBe('action');
  const reset=applyBeginnerFoodCommand(state,{type:'RESET_TUTORIAL'}).state;expect(reset.scene).toBe('regular');expect(reset.researchPoints).toBe(6);
});
it('replaces default setup and preserves it on reset and cycle regeneration',()=>{
  let state=createWebDemo({scene:'regular',customSetup:'custom',setups:{custom:{buildings:[],deck:[{cardId:'reform',count:7}]}}});
  expect(state.buildings).toEqual([]);expect(state.cycleDeck).toHaveLength(7);expect(state.researchPoints).toBe(0);
  state=finish(state);state=applyBeginnerFoodCommand(state,{type:'CONTINUE_TUTORIAL'}).state;expect(state.cycleDeck).toHaveLength(7);
  expect(applyBeginnerFoodCommand(state,{type:'RESET_TUTORIAL'}).state.cycleDeck).toHaveLength(7);
});
it('validates custom content and keeps tutorial unchanged',()=>{
  expect(()=>createWebDemo({scene:'regular',customSetup:'custom',setups:{custom:{buildings:['bad'],deck:[]}}})).toThrow();
  expect(()=>createWebDemo({scene:'regular',customSetup:'custom',setups:{custom:{buildings:[],deck:[{cardId:'bad',count:1}]}}})).toThrow();
  expect(()=>createWebDemo({scene:'regular',customSetup:'custom',setups:{custom:{buildings:[],deck:[{cardId:'research',count:-1}]}}})).toThrow();
  const tutorial=createWebDemo({scene:'tutorial',customSetup:'unused',setups:{unused:{buildings:[],deck:[]}}});expect(tutorial.cycleDeck).toHaveLength(10);expect(tutorial.researchPoints).toBe(0);
});
