import {makeAction,buildBuilding,buildingCatalog,blueprintBuilding,removeOwnedCard,destroyBuilding} from '../rules/reform';
import {purchaseResearchOffer,type ResearchOffer} from '../rules/researchShop';
import cards from '../content/cards.json';
import resources from '../content/resources.json';
import scenario from '../content/scenarios/beginner-food.json';
import { applyEffects,applyEvent,addContentLog } from '../rules/applyEffects';
import {tribalCenter,triggerCenter} from '../rules/buildingTriggers';
import {ancientTechnologyTree} from './TechnologyTree';
import {baseFoodDemand,growthFoodDemand} from '../rules/centerRates';

export type TutorialActionKind = keyof typeof cards;
export type FoodKind = keyof typeof resources;
export interface TutorialActionCard { id:string; kind:TutorialActionKind; name:string; cost:number; rarity:string; description:string; sourceBuildingId?:string; }
export interface TutorialBuilding { id:string; name:string; rarity:string; remainingUses:number|null; totalUses:number|null; cardsPerCycle:number; }
export interface FoodResource { id:string; kind:FoodKind; name:string; food:number; rarity?:string; consequence?:string; }
export interface TutorialLogEntry { id:number; tone:'info'|'good'|'warning'; title:string; detail:string; }
export interface BeginnerFoodState {
  researchOffers:ResearchOffer[]; surplusResearch:boolean;
  reformOpen:boolean; reformOffers:TutorialActionKind[]; reformSeed:number; nextCardId:number; permanentDeck:TutorialActionCard[]; availablePool:TutorialActionCard[]; excludedCycleCards:string[]; removedDrawnCards:number;
  scene:'tutorial'|'regular'; startingSetup?:RegularSetup;
  buildings:TutorialBuilding[]; cycleDeck:TutorialActionCard[];
  researchOpen:boolean; sickWorkers:number;
  researchPoints:number; researchedTechnologyIds:string[];
  cycle:number; turnInCycle:number; population:number; hammers:number; hand:TutorialActionCard[];
  foodResources:FoodResource[]; extraFoodDemand:number; sickWorkersNextCycle:number; playedThisCycle:number;
  phase:'action'|'cycle-result'|'complete'; resultMessage?:string; log:TutorialLogEntry[]; nextLogId:number;
}
export interface RegularSetup { buildings:string[]; deck:{cardId:string;count:number}[]; }
export interface WebDemoConfig { scene:'tutorial'|'regular'; customSetup?:string|null; setups?:Record<string,RegularSetup>; }
export const defaultRegularSetup:RegularSetup={buildings:['berry-bush','tribal-center'],deck:[{cardId:'search-food',count:1}]};
export function createWebDemo(config:WebDemoConfig):BeginnerFoodState {
  if(config.scene==='tutorial')return createBeginnerFoodDemo();
  if(config.scene!=='regular')throw new Error('Scene must be regular or tutorial');
  let setup=defaultRegularSetup;
  if(config.customSetup!==undefined&&config.customSetup!==null){
    if(typeof config.customSetup!=='string'||!config.setups||!Object.prototype.hasOwnProperty.call(config.setups,config.customSetup))throw new Error(`Unknown setup: ${String(config.customSetup)}`);
    setup=config.setups[config.customSetup];
  }
  if(!setup||typeof setup!=='object')throw new Error('Invalid setup');
  if(!Array.isArray(setup.buildings)||!Array.isArray(setup.deck))throw new Error('Setup requires buildings and deck arrays');
  if(new Set(setup.buildings).size!==setup.buildings.length||setup.buildings.some(id=>!['berry-bush','tribal-center',...buildingCatalog.map(item=>item.id)].includes(id)))throw new Error('Unknown or duplicate starting building');
  if(setup.deck.some(entry=>!Object.prototype.hasOwnProperty.call(cards,entry.cardId)||!Number.isInteger(entry.count)||entry.count<0||entry.count>100))throw new Error('Invalid deck entry: use an existing cardId and count from 0 to 100');
  const state=createBeginnerFoodDemo();state.scene='regular';
  state.startingSetup={buildings:[...setup.buildings],deck:setup.deck.map(entry=>({...entry}))};
  state.buildings=state.buildings.filter(building=>setup.buildings.includes(building.id));
  const center=state.buildings.find(building=>building.id===tribalCenter.id);if(center)center.cardsPerCycle=2;
  state.permanentDeck=[];
  for(const entry of setup.deck)for(let i=0;i<entry.count;i++)state.permanentDeck.push(makeAction(state,entry.cardId as TutorialActionKind));
  for(const id of setup.buildings)if(buildingCatalog.some(building=>building.id===id))buildBuilding(state,id);
  state.log=[];state.nextLogId=1;
  triggerCenter(state,'organization-unlocked');
  state.cycleDeck=regularDeck(state);state.hand=state.cycleDeck.slice(0,5);
  addLog(state,'info','文明启程','生产设施已就绪。合理分配劳动力，发展科技并完成周期供养。');
  return state;
}
function regularDeck(state:BeginnerFoodState):TutorialActionCard[]{
  const deck=createCycleDeck(tribalCenter.organizationUnlockCycle,state.buildings).filter(card=>card.sourceBuildingId).map(card=>({...card,id:card.id.replace(/^c\d+-/,`c${state.cycle}-`)})).filter(card=>!state.excludedCycleCards.includes(card.id.replace(/^c\d+-/,'')));
  deck.push(...state.permanentDeck.map(card=>({...card})));
  // Reproducible shuffle for the demo; avoids tutorial's prescribed hand order.
  let seed=state.cycle*104729+deck.length;
  for(let i=deck.length-1;i>0;i--){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const j=seed%(i+1);[deck[i],deck[j]]=[deck[j],deck[i]];}
  return deck;
}
export type BeginnerFoodCommand = {type:'PLAY_TUTORIAL_CARD';cardId:string}|{type:'END_TUTORIAL_TURN'}|{type:'CONTINUE_TUTORIAL'}|{type:'RESET_TUTORIAL'}|{type:'CLOSE_RESEARCH'}|{type:'BUY_RESEARCH_OFFER';offerId:string}|{type:'BUY_TECHNOLOGY';technologyId:string}|{type:'CLOSE_REFORM'}|{type:'REFORM';mode:'discover'|'available'|'remove';cardId:string}|{type:'DESTROY_BUILDING';buildingId:string};
export interface BeginnerFoodResult { state:BeginnerFoodState; error?:string; }

export function createCycleDeck(cycle:number,buildings:TutorialBuilding[]):TutorialActionCard[]{
  const bush=buildings.find(building=>building.id==='berry-bush');
  let berriesLeft=bush?Math.min(bush.cardsPerCycle,bush.remainingUses??Infinity):0;
  const deck:TutorialActionCard[]=scenario.hands.flat().filter(entry=>entry.cardId!=='gather-berries'||berriesLeft-->0).map(entry=>{
    if(!Object.prototype.hasOwnProperty.call(cards,entry.cardId))throw new Error(`Unknown card: ${entry.cardId}`);
    const kind=entry.cardId as TutorialActionKind;
    const {name,cost,description,rarity}=cards[kind];
    return {id:`c${cycle}-${entry.id}`,kind,name,cost,description,rarity,...(kind==='gather-berries'?{sourceBuildingId:'berry-bush'}:{})};
  });
  if(cycle>=tribalCenter.organizationUnlockCycle&&buildings.some(building=>building.id===tribalCenter.id)){
    const organizationCards=(['research','reform'] as const).map(kind=>({id:`c${cycle}-${kind}`,kind,name:cards[kind].name,cost:cards[kind].cost,rarity:cards[kind].rarity,description:cards[kind].description,sourceBuildingId:tribalCenter.id}));
    deck.unshift(...organizationCards);
  }
  return deck;
}
export function createBeginnerFoodDemo():BeginnerFoodState{
  const buildings:TutorialBuilding[]=[{id:'berry-bush',name:'浆果丛',rarity:'white',remainingUses:40,totalUses:40,cardsPerCycle:9},{id:tribalCenter.id,name:tribalCenter.name,rarity:tribalCenter.rarity,remainingUses:null,totalUses:null,cardsPerCycle:0}];
  const cycleDeck=createCycleDeck(1,buildings).map(card=>card.sourceBuildingId?card:{...card,id:'tutorial-search'});
  const state:BeginnerFoodState={researchOffers:[],surplusResearch:false,reformOpen:false,reformOffers:[],reformSeed:12345,nextCardId:1,permanentDeck:[],availablePool:[],excludedCycleCards:[],removedDrawnCards:0,scene:'tutorial',researchedTechnologyIds:[],researchPoints:0,researchOpen:false,sickWorkers:0,buildings,cycleDeck,cycle:1,turnInCycle:1,population:scenario.startingPopulation,hammers:scenario.startingPopulation,hand:cycleDeck.slice(0,5),foodResources:[],extraFoodDemand:0,sickWorkersNextCycle:0,playedThisCycle:0,phase:'action',log:[],nextLogId:1};
  state.permanentDeck=cycleDeck.filter(card=>!card.sourceBuildingId).map(card=>({...card,id:'tutorial-search'}));
  addContentLog(state,scenario.cycles[0].log);return state;
}
export function totalFood(state:BeginnerFoodState):number{return state.foodResources.reduce((sum,item)=>sum+item.food,0);}
export function totalFoodDemand(state:BeginnerFoodState):number{return Math.max(0,baseFoodDemand(state.population)+state.extraFoodDemand);}

export function applyBeginnerFoodCommand(state:BeginnerFoodState,command:BeginnerFoodCommand):BeginnerFoodResult{
  if(command.type==='RESET_TUTORIAL')return {state:createWebDemo({scene:state.scene,...(state.startingSetup?{customSetup:'restart',setups:{restart:state.startingSetup}}:{})})};
  const next=clone(state);
  if(command.type==='DESTROY_BUILDING'){
    if(next.phase!=='action'||next.researchOpen||next.reformOpen)return {state,error:'当前不能移除建筑。'};
    if(!next.buildings.some(building=>building.id===command.buildingId))return {state,error:'建筑不存在。'};
    destroyBuilding(next,command.buildingId);return {state:next};
  }
  if(command.type==='CLOSE_REFORM'){next.reformOpen=false;next.reformOffers=[];return {state:next};}
  if(command.type==='REFORM'){
    if(!next.reformOpen||next.phase!=='action')return {state,error:'请先打出改革卡。'};
    if(command.mode==='discover'){
      if(!next.reformOffers.includes(command.cardId as TutorialActionKind))return {state,error:'不在本次发现选项中。'};
      next.permanentDeck.push(makeAction(next,command.cardId as TutorialActionKind));
    }else if(command.mode==='available'){
      const card=next.availablePool.find(card=>card.id===command.cardId);
      if(!card)return {state,error:'该牌不在可选卡池中。'};
      next.availablePool=next.availablePool.filter(item=>item.id!==card.id);next.permanentDeck.push(card);
    }else{
      if(![...next.cycleDeck,...next.permanentDeck].some(card=>card.id===command.cardId))return {state,error:'该牌不在卡组中。'};
      removeOwnedCard(next,command.cardId);
    }
    next.reformOpen=false;next.reformOffers=[];
    addLog(next,'good','改革完成',command.mode==='remove'?'已移除一张牌。':'新行动已加入卡组，下周期开始抽取。');
    return {state:next};
  }
  if(next.reformOpen)return {state,error:'请先完成或关闭改革。'};
  if(command.type==='CLOSE_RESEARCH'){next.researchOpen=false;next.researchOffers=[];return {state:next};}
  if(command.type==='BUY_TECHNOLOGY'||command.type==='BUY_RESEARCH_OFFER'){
    const id=command.type==='BUY_RESEARCH_OFFER'?command.offerId:next.researchOffers.find(offer=>offer.type==='technology'&&offer.contentId===command.technologyId)?.id;
    if(!id)return {state,error:'该科技不在本次商店候选中。'};
    const error=purchaseResearchOffer(next,id);return error?{state,error}:{state:next};
  }
  if(next.researchOpen)return {state,error:'请先关闭科研界面。'};
  if(command.type==='CONTINUE_TUTORIAL'){
    if(next.phase!=='cycle-result')return {state,error:'当前没有等待继续的周期结算。'};
    if(next.scene==='tutorial'&&next.cycle>=scenario.cycles.length){next.phase='complete';return {state:next};}
    next.cycle++;
    if(next.scene==='tutorial'&&next.cycle===tribalCenter.organizationUnlockCycle){
      const center=next.buildings.find(building=>building.id===tribalCenter.id);
      if(center)center.cardsPerCycle=2;
      triggerCenter(next,'organization-unlocked');
    }
    next.sickWorkers=next.sickWorkersNextCycle;next.sickWorkersNextCycle=0;
    next.removedDrawnCards=0;
    next.surplusResearch=false;
    next.turnInCycle=1;next.hammers=Math.max(0,next.population-next.sickWorkers);next.cycleDeck=next.scene==='regular'?regularDeck(next):createCycleDeck(next.cycle,next.buildings).map(card=>card.sourceBuildingId?card:{...card,id:'tutorial-search'}).filter(card=>card.sourceBuildingId?!next.excludedCycleCards.includes(card.id.replace(/^c\d+-/,'')):next.permanentDeck.some(item=>item.id===card.id)).concat(next.permanentDeck.filter(card=>card.id!=='tutorial-search').map(card=>({...card})));next.hand=next.cycleDeck.slice(0,5);next.foodResources=[];next.extraFoodDemand=0;next.playedThisCycle=0;next.resultMessage=undefined;next.phase='action';
    if(next.scene==='tutorial')addContentLog(next,scenario.cycles[next.cycle-1].log);
    else addLog(next,'info',`生产周期 ${next.cycle}`,'新的周期行动牌已生成。');
    return {state:next};
  }
  if(next.phase!=='action')return {state,error:'请先处理当前周期结算。'};
  if(command.type==='PLAY_TUTORIAL_CARD'){
    const index=next.hand.findIndex(card=>card.id===command.cardId),card=next.hand[index];
    if(!card)return {state,error:'这张牌不在手牌中。'};if(card.cost>next.hammers)return {state,error:'锤子不足。'};
    if(card.kind==='roast-food'&&!next.foodResources.length)return {state,error:'需要一张食物才能烧烤。'};
    const buildingId=blueprintBuilding(card.kind);
    if(buildingId&&next.buildings.some(building=>building.id===buildingId))return {state,error:'该建筑已经建成。'};
    if(card.sourceBuildingId){
      const building=next.buildings.find(item=>item.id===card.sourceBuildingId);
      if(!building||(building.remainingUses!==null&&building.remainingUses<=0))return {state,error:'该生产设施已耗尽。'};
      if(building.remainingUses!==null)building.remainingUses--;
    }
    next.hammers-=card.cost;next.hand.splice(index,1);next.playedThisCycle++;
    const definition=cards[card.kind];
    applyEffects(next,definition.effects,pool=>{
      if(pool!=='food')throw new Error(`Unknown scenario event pool: ${pool}`);
      return next.scene==='regular'?'stored-nuts':scenario.cycles[next.cycle-1].foodEvent;
    });
    if(buildingId)removeOwnedCard(next,card.id);
    addLog(next,'info',card.name,card.description);
    for(const trigger of scenario.triggers){
      if(next.scene==='tutorial'&&trigger.cycle===next.cycle&&trigger.playedThisCycle===next.playedThisCycle&&trigger.cardId===card.kind)applyEvent(next,trigger.eventId);
    }
    return {state:next};
  }
  if(next.scene==='tutorial'&&next.hand.length>0)return {state,error:'请先打完本回合的手牌。'};
  next.hand=[];
  triggerCenter(next,'turn-end');
  if(next.turnInCycle*5-next.removedDrawnCards<next.cycleDeck.length){next.turnInCycle++;next.hammers=Math.max(0,next.population-next.sickWorkers);next.hand=next.cycleDeck.slice((next.turnInCycle-1)*5-next.removedDrawnCards,next.turnInCycle*5-next.removedDrawnCards);addLog(next,'info',`第 ${next.cycle} 周期 · 第 ${next.turnInCycle} 回合`,`抽取剩余 ${next.hand.length} 张行动牌。`);return {state:next};}
  const error=triggerCenter(next,'cycle-end',()=>resolveCycle(next).error);
  if(error)return {state,error};
  if(!next.buildings.some(building=>building.id===tribalCenter.id)){next.foodResources=[];next.resultMessage='周期结束；没有部落中心，不触发供养与人口增长。';}
  next.phase='cycle-result';
  return {state:next};
}
function resolveCycle(next:BeginnerFoodState):BeginnerFoodResult{
  const food=totalFood(next),demand=totalFoodDemand(next),surplus=food-demand;
  if(surplus>0&&next.surplusResearch){next.researchPoints+=surplus;addLog(next,'good','试验新法',`盈余食物转化为 ${surplus} 科研。`);}
  if(surplus<0){
    const lostPopulation=Math.min(next.population,Math.abs(surplus));
    next.population-=lostPopulation;
    next.resultMessage=`食物短缺 ${Math.abs(surplus)}，人口 -${lostPopulation}，剩余 ${next.population}。已消耗现有食物，继续下一周期。`;
    addLog(next,'warning','供养不足',next.resultMessage);
    next.foodResources=[];next.phase='cycle-result';return {state:next};
  }
  if(food>=growthFoodDemand(demand)&&surplus>0){next.population++;next.resultMessage=`支付 ${demand} 食物后盈余 ${surplus}，达到增长门槛，人口 +1。剩余食物随后清零。`;addLog(next,'good','人口增长',next.resultMessage);}
  else{next.resultMessage=`支付 ${demand} 食物后盈余 ${surplus}，未达到增长门槛（需 ${growthFoodDemand(demand)} 食物且有盈余），人口保持 ${next.population}。剩余食物清零。`;addLog(next,'warning','仅完成供养',next.resultMessage);}
  next.foodResources=[];next.phase='cycle-result';return {state:next};
}
function addLog(next:BeginnerFoodState,tone:TutorialLogEntry['tone'],title:string,detail:string):void{next.log.unshift({id:next.nextLogId++,tone,title,detail});}
function clone(state:BeginnerFoodState):BeginnerFoodState{return {...state,researchOffers:state.researchOffers.map(offer=>({...offer})),permanentDeck:state.permanentDeck.map(card=>({...card})),availablePool:state.availablePool.map(card=>({...card})),reformOffers:[...state.reformOffers],excludedCycleCards:[...state.excludedCycleCards],researchedTechnologyIds:[...state.researchedTechnologyIds],buildings:state.buildings.map(building=>({...building})),cycleDeck:state.cycleDeck.map(card=>({...card})),hand:state.hand.map(card=>({...card})),foodResources:state.foodResources.map(item=>({...item})),log:state.log.map(entry=>({...entry}))};}
