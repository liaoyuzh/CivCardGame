import {it,expect} from 'vitest';
import {createWebDemo,applyBeginnerFoodCommand} from '@civ/core';
import {openReform,buildFirePit} from '../../packages/core/src/rules/reform';

it('offers three distinct actions once and adds one permanent card for the next cycle',()=>{
  const state=createWebDemo({scene:'regular'});openReform(state);
  expect(new Set(state.reformOffers).size).toBe(3);
  const result=applyBeginnerFoodCommand(state,{type:'REFORM',mode:'discover',cardId:state.reformOffers[0]});
  expect(result.error).toBeUndefined();expect(result.state.permanentDeck.length).toBe(state.permanentDeck.length+1);
  expect(result.state.cycleDeck.length).toBe(state.cycleDeck.length);expect(result.state.reformOpen).toBe(false);
  expect(applyBeginnerFoodCommand(result.state,{type:'REFORM',mode:'discover',cardId:state.reformOffers[0]}).error).toBeDefined();
  result.state.phase='cycle-result';
  const next=applyBeginnerFoodCommand(result.state,{type:'CONTINUE_TUTORIAL'}).state;
  expect(next.cycleDeck.some(card=>card.id===result.state.permanentDeck.at(-1)!.id)).toBe(true);
});
it('fire pit grants three pool cards once; selecting consumes a pool copy and destruction removes all source cards',()=>{
  const state=createWebDemo({scene:'regular'});buildFirePit(state);buildFirePit(state);
  expect(state.availablePool).toHaveLength(3);expect(state.cycleDeck.some(card=>card.kind==='roast-food')).toBe(false);
  openReform(state);const selected=state.availablePool[0];
  let next=applyBeginnerFoodCommand(state,{type:'REFORM',mode:'available',cardId:selected.id}).state;
  expect(next.availablePool).toHaveLength(2);expect(next.permanentDeck.find(card=>card.id===selected.id)?.sourceBuildingId).toBe('fire-pit');
  next.phase='cycle-result';next=applyBeginnerFoodCommand(next,{type:'CONTINUE_TUTORIAL'}).state;
  next.hand=[selected];
  next=applyBeginnerFoodCommand(next,{type:'DESTROY_BUILDING',buildingId:'fire-pit'}).state;
  for(const list of [next.availablePool,next.permanentDeck,next.cycleDeck,next.hand])expect(list.some(card=>card.sourceBuildingId==='fire-pit')).toBe(false);
});
it('removing an already drawn card does not skip the next undrawn card and persists across cycles',()=>{
  let state=createWebDemo({scene:'regular'});const target=state.cycleDeck[0],nextCard=state.cycleDeck[5];openReform(state);
  state=applyBeginnerFoodCommand(state,{type:'REFORM',mode:'remove',cardId:target.id}).state;
  state=applyBeginnerFoodCommand(state,{type:'END_TUTORIAL_TURN'}).state;
  expect(state.hand[0].id).toBe(nextCard.id);
  state.phase='cycle-result';state=applyBeginnerFoodCommand(state,{type:'CONTINUE_TUTORIAL'}).state;
  expect(state.cycleDeck.some(card=>card.id.replace(/^c\d+-/,'')===target.id.replace(/^c\d+-/,''))).toBe(false);
});
