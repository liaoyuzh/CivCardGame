import {describe,it,expect} from 'vitest';
import {ancientTechnologyTree,technologyLayers,createBeginnerFoodDemo,applyBeginnerFoodCommand,type BeginnerFoodState} from '@civ/core';

describe('ancient research introduction',()=>{
  it('matches the visible names and prerequisite branches in the reference image',()=>{
    const techs=ancientTechnologyTree.technologies;
    const names=new Map(techs.map(tech=>[tech.id,tech.name]));
    expect(techs.map(tech=>[tech.name,tech.prerequisites.map(id=>names.get(id))])).toEqual([
      ['Fishery',[]],['Agriculture',[]],['Hunting',[]],
      ['Calendar',['Fishery']],['Pottery',['Agriculture']],['Animal Husbandry',['Hunting']],
      ['Bronze Working',[]],['Sailing',['Calendar']],['Writing',['Pottery']],
      ['The Wheel',['Animal Husbandry']],['Masonry',['Bronze Working']],['Iron Working',['Bronze Working']],
    ]);
  });
  it('validates editable dependencies including cycles and missing ids',()=>{
    expect(technologyLayers(ancientTechnologyTree.technologies).flat()).toHaveLength(12);
    expect(()=>technologyLayers([{id:'a',name:'a',prerequisites:['missing']}])).toThrow();
    expect(()=>technologyLayers([{id:'a',name:'a',prerequisites:['b']},{id:'b',name:'b',prerequisites:['a']}])).toThrow();
    expect(()=>technologyLayers([{id:'a',name:'a',prerequisites:[]},{id:'a',name:'a',prerequisites:[]}])).toThrow();
  });
  it('reaches cycle three, opens research for one hammer, and completes all three turns',()=>{
    let state=createBeginnerFoodDemo();
    function dispatch(command:Parameters<typeof applyBeginnerFoodCommand>[1]){
      const result=applyBeginnerFoodCommand(state,command);expect(result.error).toBeUndefined();state=result.state;
    }
    function finishCycle(){
      while(state.phase==='action'){
        while(state.hand.length){dispatch({type:'PLAY_TUTORIAL_CARD',cardId:state.hand[0].id});if(state.researchOpen)dispatch({type:'CLOSE_RESEARCH'});if(state.reformOpen)dispatch({type:'CLOSE_REFORM'});}
        dispatch({type:'END_TUTORIAL_TURN'});
      }
    }
    finishCycle();dispatch({type:'CONTINUE_TUTORIAL'});finishCycle();dispatch({type:'CONTINUE_TUTORIAL'});
    expect(state.cycle).toBe(3);expect(state.cycleDeck).toHaveLength(12);expect(state.hammers).toBe(5);
    expect(state.hand[0].kind).toBe('research');expect(state.buildings).toHaveLength(2);
    const previous:BeginnerFoodState=state;
    dispatch({type:'PLAY_TUTORIAL_CARD',cardId:state.hand[0].id});
    expect(state.hammers).toBe(4);expect(state.researchOpen).toBe(true);expect(previous.researchOpen).toBe(false);
    expect(applyBeginnerFoodCommand(state,{type:'END_TUTORIAL_TURN'}).error).toBeDefined();
    dispatch({type:'CLOSE_RESEARCH'});expect(state.hammers).toBe(4);
    finishCycle();expect(state.turnInCycle).toBe(3);expect(state.buildings[0].remainingUses).toBe(13);
    dispatch({type:'CONTINUE_TUTORIAL'});expect(state.phase).toBe('complete');
    dispatch({type:'RESET_TUTORIAL'});expect(state.buildings).toHaveLength(2);expect(state.researchOpen).toBe(false);expect(state.researchPoints).toBe(0);
  });
});
