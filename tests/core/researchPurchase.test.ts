import {it,expect} from 'vitest';
import {createWebDemo,applyBeginnerFoodCommand,openResearchShop,ancientTechnologyTree,researchShopConfig,type BeginnerFoodState} from '@civ/core';
import {makeAction,blueprintBuilding,buildingCatalog,openReform} from '../../packages/core/src/rules/reform';
import cards from '../../packages/core/src/content/cards.json';
import resources from '../../packages/core/src/content/resources.json';
import events from '../../packages/core/src/content/events.json';
import actions from '../../packages/core/src/content/reform-pool.json';
import {rarityPick,nextRandom,rarityOf} from '../../packages/core/src/rules/rarity';

it('offers ten entries including three unique eligible technologies and seven actions before unlocks',()=>{
  const state=createWebDemo({scene:'regular'});openResearchShop(state);
  expect(state.researchOffers).toHaveLength(10);
  const techs=state.researchOffers.filter(item=>item.type==='technology');expect(techs).toHaveLength(3);
  expect(new Set(techs.map(item=>item.contentId)).size).toBe(3);
  expect(techs.every(item=>ancientTechnologyTree.technologies.find(tech=>tech.id===item.contentId)!.prerequisites.length===0)).toBe(true);
  expect(state.researchOffers.filter(item=>item.type==='action')).toHaveLength(7);
});
it('only purchases shown entries, checks funds, and never refreshes after a purchase',()=>{
  const initial=createWebDemo({scene:'regular'});openResearchShop(initial);
  const tech=initial.researchOffers.find(item=>item.type==='technology')!;
  initial.researchPoints=0;
  expect(applyBeginnerFoodCommand(initial,{type:'BUY_RESEARCH_OFFER',offerId:tech.id}).error).toBeDefined();
  initial.researchPoints=100;
  const result=applyBeginnerFoodCommand(initial,{type:'BUY_RESEARCH_OFFER',offerId:tech.id});expect(result.error).toBeUndefined();
  expect(result.state.researchedTechnologyIds).toContain(tech.contentId);expect(initial.researchedTechnologyIds).toHaveLength(0);
  expect(result.state.researchPoints).toBe(100-tech.cost);expect(result.state.researchOpen).toBe(true);
  expect(result.state.researchOffers.map(item=>item.id)).toEqual(initial.researchOffers.map(item=>item.id));
  expect(applyBeginnerFoodCommand(result.state,{type:'BUY_RESEARCH_OFFER',offerId:tech.id}).error).toBeDefined();
  expect(applyBeginnerFoodCommand(result.state,{type:'BUY_TECHNOLOGY',technologyId:'writing'}).error).toBeDefined();
  const action=result.state.researchOffers.find(item=>item.type==='action')!;
  const purchased=applyBeginnerFoodCommand(result.state,{type:'BUY_RESEARCH_OFFER',offerId:action.id}).state;
  expect(purchased.permanentDeck.at(-1)!.kind).toBe(action.contentId);
  expect(purchased.runtime!.drawPile[0].id).toBe(purchased.permanentDeck.at(-1)!.id);
  const closed=applyBeginnerFoodCommand(purchased,{type:'CLOSE_RESEARCH'}).state;
  expect(closed.researchOffers).toHaveLength(0);
  expect(applyBeginnerFoodCommand(closed,{type:'BUY_RESEARCH_OFFER',offerId:action.id}).error).toBeDefined();
});
it('honors configured counts and fills missing technologies with ordinary slots',()=>{
  const old={...researchShopConfig};
  try{
    researchShopConfig.offerCount=6;researchShopConfig.technologyCount=1;
    const state=createWebDemo({scene:'regular'});openResearchShop(state);
    expect(state.researchOffers).toHaveLength(6);expect(state.researchOffers.filter(item=>item.type==='technology')).toHaveLength(1);
    state.researchedTechnologyIds=ancientTechnologyTree.technologies.map(tech=>tech.id);openResearchShop(state);
    expect(state.researchOffers).toHaveLength(6);expect(state.researchOffers.some(item=>item.type==='technology')).toBe(false);
  }finally{Object.assign(researchShopConfig,old);}
});
it('purchases and consumes every blueprint, unlocking shop actions without granting copies',()=>{
  const chance=researchShopConfig.blueprintChance;
  try{
    researchShopConfig.blueprintChance=1;
    for(const tech of ancientTechnologyTree.technologies){
      let state=createWebDemo({scene:'regular'});state.researchedTechnologyIds=[tech.id];state.researchPoints=100;
      openResearchShop(state);const offer=state.researchOffers.find(item=>item.contentId===tech.unlockBlueprint)!;
      expect(offer).toBeDefined();expect(offer.type).toBe('blueprint');
      state=applyBeginnerFoodCommand(state,{type:'BUY_RESEARCH_OFFER',offerId:offer.id}).state;
      const blueprint=state.permanentDeck.find(card=>card.kind===tech.unlockBlueprint)!;
      expect(state.runtime!.drawPile[0].id).toBe(blueprint.id);
      state=applyBeginnerFoodCommand(state,{type:'CLOSE_RESEARCH'}).state;
      state=applyBeginnerFoodCommand(state,{type:'END_TUTORIAL_TURN'}).state;
      expect(state.hand.some(card=>card.id===blueprint.id)).toBe(true);
      const hammers=state.hammers;
      const built=applyBeginnerFoodCommand(state,{type:'PLAY_TUTORIAL_CARD',cardId:blueprint.id});expect(built.error).toBeUndefined();state=built.state;
      expect(state.hammers).toBe(hammers-blueprint.cost);
      const id=blueprintBuilding(blueprint.kind)!;
      expect(state.buildings.some(item=>item.id===id)).toBe(true);
      expect(state.permanentDeck.some(card=>card.id===blueprint.id)).toBe(false);
      expect(state.cycleDeck.some(card=>card.id===blueprint.id)).toBe(false);
      expect(state.availablePool).toHaveLength(0);
      const actionId=buildingCatalog.find(item=>item.id===id)!.availableCards[0].cardId;
      let found=false;
      for(let attempt=0;attempt<100&&!found;attempt++){
        openResearchShop(state);found=state.researchOffers.some(item=>item.contentId===actionId);
      }
      expect(found).toBe(true);
      const actionOffer=state.researchOffers.find(item=>item.contentId===actionId)!;
      state=applyBeginnerFoodCommand(state,{type:'BUY_RESEARCH_OFFER',offerId:actionOffer.id}).state;
      const bought=state.permanentDeck.at(-1)!;
      state=applyBeginnerFoodCommand(state,{type:'CLOSE_RESEARCH'}).state;
      state=applyBeginnerFoodCommand(state,{type:'DESTROY_BUILDING',buildingId:id}).state;
      expect(state.permanentDeck.some(card=>card.id===bought.id)).toBe(true);
      expect(state.runtime!.drawPile.some(card=>card.id===bought.id)).toBe(true);

    }
  }finally{researchShopConfig.blueprintChance=chance;}
});
it('all content has valid rarity and all ten discoverable actions resolve',()=>{
  for(const item of [...Object.values(cards),...Object.values(resources),...Object.values(events),...buildingCatalog,...ancientTechnologyTree.technologies])expect(()=>rarityOf(item.rarity)).not.toThrow();
  expect(actions).toHaveLength(10);
  for(const id of actions){
    const state=createWebDemo({scene:'regular'});state.hammers=10;
    const card=makeAction(state,id as keyof typeof cards);state.hand=[card];
    expect(applyBeginnerFoodCommand(state,{type:'PLAY_TUTORIAL_CARD',cardId:card.id}).error).toBeUndefined();
  }
});
it('rarity sampling strongly favors white and blue instead of forcing rare cards into every shop',()=>{
  const seed={reformSeed:12345};const pool=actions.map(id=>cards[id as keyof typeof cards]);const counts={white:0,blue:0,gold:0,red:0};
  for(let i=0;i<10000;i++)counts[rarityOf(rarityPick(pool,()=>nextRandom(seed)).rarity)]++;
  expect(counts.white+counts.blue).toBeGreaterThan(9700);expect(counts.gold).toBeLessThan(300);expect(counts.red).toBeLessThan(30);expect(counts.red).toBeGreaterThan(0);
});
