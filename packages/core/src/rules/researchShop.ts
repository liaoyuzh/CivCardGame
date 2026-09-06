import config from '../content/research-shop.json';
import cards from '../content/cards.json';
import actions from '../content/reform-pool.json';
import {ancientTechnologyTree} from '../tutorial/TechnologyTree';
import type {BeginnerFoodState,TutorialActionKind} from '../tutorial/BeginnerFoodDemo';
import {blueprintBuilding,makeAction} from './reform';
import {nextRandom,rarityPick,rarityOf} from './rarity';

export interface ResearchOffer { id:string; type:'technology'|'blueprint'|'action'; contentId:string; name:string; rarity:string; cost:number; description:string; purchased:boolean; }
export const researchShopConfig=config;
export function validateShopConfig():void {
  if(!Number.isInteger(config.offerCount)||config.offerCount<1||config.offerCount>100||!Number.isInteger(config.technologyCount)||config.technologyCount<0||config.technologyCount>config.offerCount)throw new Error('科研商店槽位配置无效');
  if(!Number.isFinite(config.blueprintChance)||config.blueprintChance<0||config.blueprintChance>1)throw new Error('蓝图比例必须在 0 和 1 之间');
  for(const weight of Object.values(config.rarityWeights))if(!Number.isFinite(weight)||weight<=0)throw new Error('稀有度权重必须为正有限数');
  for(const card of Object.values(cards)){rarityOf(card.rarity);if(!Number.isInteger(card.researchCost)||card.researchCost<0)throw new Error('科研价格无效');}
}
export function openResearchShop(state:BeginnerFoodState):void {
  validateShopConfig();state.researchOpen=true;state.researchOffers=[];
  const random=()=>nextRandom(state);
  let technologies=ancientTechnologyTree.technologies.filter(tech=>!state.researchedTechnologyIds.includes(tech.id)&&tech.prerequisites.every(id=>state.researchedTechnologyIds.includes(id)));
  function add(type:ResearchOffer['type'],contentId:string,name:string,rarity:string,cost:number,description:string){state.researchOffers.push({id:`offer-${state.nextCardId++}`,type,contentId,name,rarity,cost,description,purchased:false});}
  for(let i=0;i<config.technologyCount&&technologies.length;i++){
    const tech=rarityPick(technologies,random);technologies=technologies.filter(item=>item.id!==tech.id);
    add('technology',tech.id,tech.name,tech.rarity,tech.cost,`解锁 ${cards[tech.unlockBlueprint as TutorialActionKind].name}`);
  }
  let blueprints=ancientTechnologyTree.technologies.filter(tech=>state.researchedTechnologyIds.includes(tech.id)).map(tech=>tech.unlockBlueprint as TutorialActionKind).filter(kind=>{
    const building=blueprintBuilding(kind);
    return !state.buildings.some(item=>item.id===building)&&!state.permanentDeck.some(card=>card.kind===kind);
  }).map(id=>({id,...cards[id]}));
  const actionPool=actions.map(id=>({id:id as TutorialActionKind,...cards[id as TutorialActionKind]}));
  while(state.researchOffers.length<config.offerCount){
    const blueprint=blueprints.length>0&&random()<config.blueprintChance;
    const selected=rarityPick(blueprint?blueprints:actionPool,random);
    add(blueprint?'blueprint':'action',selected.id,selected.name,selected.rarity,selected.researchCost,selected.description);
    if(blueprint)blueprints=blueprints.filter(item=>item.id!==selected.id);
  }
}
export function purchaseResearchOffer(state:BeginnerFoodState,id:string):string|undefined {
  if(!state.researchOpen||state.phase!=='action')return '请先打出科研卡。';
  const offer=state.researchOffers.find(item=>item.id===id);
  if(!offer||offer.purchased)return '该候选不在商店中或已经售出。';
  if(state.researchPoints<offer.cost)return '科研点数不足。';
  if(offer.type==='technology'){
    const tech=ancientTechnologyTree.technologies.find(item=>item.id===offer.contentId);
    if(!tech||state.researchedTechnologyIds.includes(tech.id)||!tech.prerequisites.every(id=>state.researchedTechnologyIds.includes(id)))return '科技前置未满足或已经研发。';
    state.researchedTechnologyIds.push(tech.id);
  }else{
    const kind=offer.contentId as TutorialActionKind;
    if(offer.type==='blueprint'){
      const unlocked=ancientTechnologyTree.technologies.some(tech=>tech.unlockBlueprint===kind&&state.researchedTechnologyIds.includes(tech.id));
      if(!unlocked||state.buildings.some(item=>item.id===blueprintBuilding(kind))||state.permanentDeck.some(card=>card.kind===kind))return '蓝图尚未解锁或已拥有。';
    }
    state.permanentDeck.push(makeAction(state,kind));
  }
  state.researchPoints-=offer.cost;offer.purchased=true;
  state.log.unshift({id:state.nextLogId++,tone:'good',title:`购买：${offer.name}`,detail:`消耗 ${offer.cost} 科研。${offer.type==='technology'?'蓝图已解锁，下次科研可能出现。':'已加入卡组，下周期开始抽取。'}`});
}
