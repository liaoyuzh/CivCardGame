import cards from '../content/cards.json';
import resources from '../content/resources.json';
import scenario from '../content/scenarios/beginner-food.json';
import { applyEffects,applyEvent,addContentLog } from '../rules/applyEffects';
import {tribalCenter,triggerCenter} from '../rules/buildingTriggers';

export type TutorialActionKind = keyof typeof cards;
export type FoodKind = keyof typeof resources;
export interface TutorialActionCard { id:string; kind:TutorialActionKind; name:string; cost:number; description:string; sourceBuildingId?:string; }
export interface TutorialBuilding { id:string; name:string; remainingUses:number|null; totalUses:number|null; cardsPerCycle:number; }
export interface FoodResource { id:string; kind:FoodKind; name:string; food:number; consequence?:string; }
export interface TutorialLogEntry { id:number; tone:'info'|'good'|'warning'; title:string; detail:string; }
export interface BeginnerFoodState {
  buildings:TutorialBuilding[]; cycleDeck:TutorialActionCard[];
  researchOpen:boolean; sickWorkers:number;
  researchPoints:number;
  cycle:number; turnInCycle:number; population:number; hammers:number; hand:TutorialActionCard[];
  foodResources:FoodResource[]; extraFoodDemand:number; sickWorkersNextCycle:number; playedThisCycle:number;
  phase:'action'|'cycle-result'|'complete'; resultMessage?:string; log:TutorialLogEntry[]; nextLogId:number;
}
export type BeginnerFoodCommand = {type:'PLAY_TUTORIAL_CARD';cardId:string}|{type:'END_TUTORIAL_TURN'}|{type:'CONTINUE_TUTORIAL'}|{type:'RESET_TUTORIAL'}|{type:'CLOSE_RESEARCH'};
export interface BeginnerFoodResult { state:BeginnerFoodState; error?:string; }

export function createCycleDeck(cycle:number,buildings:TutorialBuilding[]):TutorialActionCard[]{
  const bush=buildings.find(building=>building.id==='berry-bush');
  let berriesLeft=bush?Math.min(bush.cardsPerCycle,bush.remainingUses??Infinity):0;
  const deck:TutorialActionCard[]=scenario.hands.flat().filter(entry=>entry.cardId!=='gather-berries'||berriesLeft-->0).map(entry=>{
    if(!Object.prototype.hasOwnProperty.call(cards,entry.cardId))throw new Error(`Unknown card: ${entry.cardId}`);
    const kind=entry.cardId as TutorialActionKind;
    const {name,cost,description}=cards[kind];
    return {id:`c${cycle}-${entry.id}`,kind,name,cost,description,...(kind==='gather-berries'?{sourceBuildingId:'berry-bush'}:{})};
  });
  if(cycle>=tribalCenter.organizationUnlockCycle&&buildings.some(building=>building.id===tribalCenter.id)){
    const organizationCards=(['research','reform'] as const).map(kind=>({id:`c${cycle}-${kind}`,kind,name:cards[kind].name,cost:cards[kind].cost,description:cards[kind].description,sourceBuildingId:tribalCenter.id}));
    deck.unshift(...organizationCards);
  }
  return deck;
}
export function createBeginnerFoodDemo():BeginnerFoodState{
  const buildings:TutorialBuilding[]=[{id:'berry-bush',name:'浆果丛',remainingUses:40,totalUses:40,cardsPerCycle:9},{id:tribalCenter.id,name:tribalCenter.name,remainingUses:null,totalUses:null,cardsPerCycle:0}];
  const cycleDeck=createCycleDeck(1,buildings);
  const state:BeginnerFoodState={researchPoints:0,researchOpen:false,sickWorkers:0,buildings,cycleDeck,cycle:1,turnInCycle:1,population:scenario.startingPopulation,hammers:scenario.startingPopulation,hand:cycleDeck.slice(0,5),foodResources:[],extraFoodDemand:0,sickWorkersNextCycle:0,playedThisCycle:0,phase:'action',log:[],nextLogId:1};
  addContentLog(state,scenario.cycles[0].log);return state;
}
export function totalFood(state:BeginnerFoodState):number{return state.foodResources.reduce((sum,item)=>sum+item.food,0);}
export function totalFoodDemand(state:BeginnerFoodState):number{return state.population+state.extraFoodDemand;}

export function applyBeginnerFoodCommand(state:BeginnerFoodState,command:BeginnerFoodCommand):BeginnerFoodResult{
  if(command.type==='RESET_TUTORIAL')return {state:createBeginnerFoodDemo()};
  const next=clone(state);
  if(command.type==='CLOSE_RESEARCH'){next.researchOpen=false;return {state:next};}
  if(next.researchOpen)return {state,error:'请先关闭科研界面。'};
  if(command.type==='CONTINUE_TUTORIAL'){
    if(next.phase!=='cycle-result')return {state,error:'当前没有等待继续的周期结算。'};
    if(next.cycle>=scenario.cycles.length){next.phase='complete';return {state:next};}
    next.cycle++;
    if(next.cycle===tribalCenter.organizationUnlockCycle){
      const center=next.buildings.find(building=>building.id===tribalCenter.id);
      if(center)center.cardsPerCycle=2;
      triggerCenter(next,'organization-unlocked');
    }
    next.sickWorkers=next.sickWorkersNextCycle;next.sickWorkersNextCycle=0;
    next.turnInCycle=1;next.hammers=Math.max(0,next.population-next.sickWorkers);next.cycleDeck=createCycleDeck(next.cycle,next.buildings);next.hand=next.cycleDeck.slice(0,5);next.foodResources=[];next.extraFoodDemand=0;next.playedThisCycle=0;next.resultMessage=undefined;next.phase='action';
    addContentLog(next,scenario.cycles[next.cycle-1].log);return {state:next};
  }
  if(next.phase!=='action')return {state,error:'请先处理当前周期结算。'};
  if(command.type==='PLAY_TUTORIAL_CARD'){
    const index=next.hand.findIndex(card=>card.id===command.cardId),card=next.hand[index];
    if(!card)return {state,error:'这张牌不在手牌中。'};if(card.cost>next.hammers)return {state,error:'锤子不足。'};
    if(card.sourceBuildingId){
      const building=next.buildings.find(item=>item.id===card.sourceBuildingId);
      if(!building||(building.remainingUses!==null&&building.remainingUses<=0))return {state,error:'该生产设施已耗尽。'};
      if(building.remainingUses!==null)building.remainingUses--;
    }
    next.hammers-=card.cost;next.hand.splice(index,1);next.playedThisCycle++;
    const definition=cards[card.kind];
    applyEffects(next,definition.effects,pool=>{
      if(pool!=='food')throw new Error(`Unknown scenario event pool: ${pool}`);
      return scenario.cycles[next.cycle-1].foodEvent;
    });
    if('log' in definition)addContentLog(next,definition.log);
    for(const trigger of scenario.triggers){
      if(trigger.cycle===next.cycle&&trigger.playedThisCycle===next.playedThisCycle&&trigger.cardId===card.kind)applyEvent(next,trigger.eventId);
    }
    return {state:next};
  }
  if(next.hand.length>0)return {state,error:'请先打完本回合的手牌。'};
  triggerCenter(next,'turn-end');
  if(next.turnInCycle*5<next.cycleDeck.length){next.turnInCycle++;next.hammers=Math.max(0,next.population-next.sickWorkers);next.hand=next.cycleDeck.slice((next.turnInCycle-1)*5,next.turnInCycle*5);addLog(next,'info',`第 ${next.cycle} 周期 · 第 ${next.turnInCycle} 回合`,`抽取剩余 ${next.hand.length} 张行动牌。`);return {state:next};}
  const error=triggerCenter(next,'cycle-end',()=>resolveCycle(next).error);
  if(error)return {state,error};
  next.phase='cycle-result';
  return {state:next};
}
function resolveCycle(next:BeginnerFoodState):BeginnerFoodResult{
  const food=totalFood(next),demand=totalFoodDemand(next),surplus=food-demand;
  if(surplus<0)return {state:next,error:`仍缺少 ${Math.abs(surplus)} 食物，无法结束生产周期。`};
  if(surplus>0){next.population++;next.resultMessage=`支付 ${demand} 食物后盈余 ${surplus}，人口 +1。剩余食物随后清零。`;addLog(next,'good','人口增长',next.resultMessage);}
  else{next.resultMessage=`支付 ${demand} 食物后没有盈余，人口保持 ${next.population}。剩余食物清零。`;addLog(next,'warning','仅完成供养',next.resultMessage);}
  next.foodResources=[];next.phase='cycle-result';return {state:next};
}
function addLog(next:BeginnerFoodState,tone:TutorialLogEntry['tone'],title:string,detail:string):void{next.log.unshift({id:next.nextLogId++,tone,title,detail});}
function clone(state:BeginnerFoodState):BeginnerFoodState{return {...state,buildings:state.buildings.map(building=>({...building})),cycleDeck:state.cycleDeck.map(card=>({...card})),hand:state.hand.map(card=>({...card})),foodResources:state.foodResources.map(item=>({...item})),log:state.log.map(entry=>({...entry}))};}
