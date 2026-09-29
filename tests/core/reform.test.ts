import {it,expect} from 'vitest';
import {createWebDemo,applyBeginnerFoodCommand,openResearchShop} from '@civ/core';
import {openReform,buildFirePit,destroyBuilding} from '../../packages/core/src/rules/reform';

it('discovery adds a single owned card to the top without waiting for a cycle',()=>{
  const state=createWebDemo({scene:'regular'});openReform(state);
  expect(new Set(state.reformOffers).size).toBe(3);
  const result=applyBeginnerFoodCommand(state,{type:'REFORM',mode:'discover',cardId:state.reformOffers[0]});
  expect(result.error).toBeUndefined();expect(result.state.permanentDeck.length).toBe(state.permanentDeck.length+1);
  expect(result.state.runtime!.drawPile[0].id).toBe(result.state.permanentDeck.at(-1)!.id);
  expect(result.state.reformOpen).toBe(false);
  expect(applyBeginnerFoodCommand(result.state,{type:'REFORM',mode:'discover',cardId:state.reformOffers[0]}).error).toBeDefined();
});

it('reform moves exactly one owned copy between active and reserve',()=>{
  let state=createWebDemo({scene:'regular'});const target=state.hand[0],count=state.permanentDeck.length;
  openReform(state);state=applyBeginnerFoodCommand(state,{type:'REFORM',mode:'remove',cardId:target.id}).state;
  expect(state.availablePool.map(card=>card.id)).toEqual([target.id]);
  expect([...state.hand,...state.runtime!.drawPile,...state.runtime!.discardPile].some(card=>card.id===target.id)).toBe(false);
  expect(state.permanentDeck.length+state.availablePool.length).toBe(count);
  openReform(state);state=applyBeginnerFoodCommand(state,{type:'REFORM',mode:'available',cardId:target.id}).state;
  expect(state.availablePool).toHaveLength(0);expect(state.permanentDeck).toHaveLength(count);
  expect(state.runtime!.drawPile[0].id).toBe(target.id);
  expect(new Set([...state.hand,...state.runtime!.drawPile,...state.runtime!.discardPile].map(card=>card.id)).size).toBe(count);
});

it('buildings unlock shop candidates without granting cards and damage preserves purchases',()=>{
  const state=createWebDemo({scene:'regular'}),count=state.permanentDeck.length;
  buildFirePit(state);buildFirePit(state);
  expect(state.availablePool).toHaveLength(0);expect(state.permanentDeck).toHaveLength(count);
  let offer;
  for(let i=0;i<100&&!offer;i++){openResearchShop(state);offer=state.researchOffers.find(item=>item.contentId==='roast-food');}
  expect(offer).toBeDefined();state.researchPoints=100;
  const result=applyBeginnerFoodCommand(state,{type:'BUY_RESEARCH_OFFER',offerId:offer!.id});
  const bought=result.state.permanentDeck.at(-1)!;destroyBuilding(result.state,'fire-pit');
  expect(result.state.runtime!.drawPile[0].id).toBe(bought.id);
  for(let i=0;i<20;i++){openResearchShop(result.state);expect(result.state.researchOffers.some(item=>item.contentId==='roast-food')).toBe(false);}
});
