export type TutorialActionKind = 'gather-berries' | 'search-food';
export type FoodKind = 'berries' | 'hazelnuts' | 'wild-meat';
export interface TutorialActionCard { id:string; kind:TutorialActionKind; name:string; cost:number; description:string; }
export interface FoodResource { id:string; kind:FoodKind; name:string; food:number; consequence?:string; }
export interface TutorialLogEntry { id:number; tone:'info'|'good'|'warning'; title:string; detail:string; }
export interface BeginnerFoodState {
  cycle:number; turnInCycle:number; population:number; hammers:number; hand:TutorialActionCard[];
  foodResources:FoodResource[]; extraFoodDemand:number; sickWorkersNextCycle:number; playedThisCycle:number;
  phase:'action'|'cycle-result'|'complete'; resultMessage?:string; log:TutorialLogEntry[]; nextLogId:number;
}
export type BeginnerFoodCommand = {type:'PLAY_TUTORIAL_CARD';cardId:string}|{type:'END_TUTORIAL_TURN'}|{type:'CONTINUE_TUTORIAL'}|{type:'RESET_TUTORIAL'};
export interface BeginnerFoodResult { state:BeginnerFoodState; error?:string; }

const berry=(id:string):TutorialActionCard=>({id,kind:'gather-berries',name:'采集浆果',cost:1,description:'获得 1 张「浆果」资源卡。'});
const search=(id:string):TutorialActionCard=>({id,kind:'search-food',name:'搜寻食物',cost:1,description:'生成并结算 1 张「食物」事件。'});
function handFor(cycle:number,turn:number):TutorialActionCard[]{
  return turn===1
    ? [berry(`c${cycle}-b1`),berry(`c${cycle}-b2`),search(`c${cycle}-s`),berry(`c${cycle}-b3`),berry(`c${cycle}-b4`)]
    : [berry(`c${cycle}-b5`),berry(`c${cycle}-b6`),berry(`c${cycle}-b7`),berry(`c${cycle}-b8`),berry(`c${cycle}-b9`)];
}
export function createBeginnerFoodDemo():BeginnerFoodState{return {cycle:1,turnInCycle:1,population:5,hammers:5,hand:handFor(1,1),foodResources:[],extraFoodDemand:0,sickWorkersNextCycle:0,playedThisCycle:0,phase:'action',log:[{id:1,tone:'info',title:'第一个生产周期',detail:'打出行动牌获取食物。每个人口每回合提供 1 锤。'}],nextLogId:2};}
export function totalFood(state:BeginnerFoodState):number{return state.foodResources.reduce((sum,item)=>sum+item.food,0);}
export function totalFoodDemand(state:BeginnerFoodState):number{return state.population+state.extraFoodDemand;}

export function applyBeginnerFoodCommand(state:BeginnerFoodState,command:BeginnerFoodCommand):BeginnerFoodResult{
  if(command.type==='RESET_TUTORIAL')return {state:createBeginnerFoodDemo()};
  const next=clone(state);
  if(command.type==='CONTINUE_TUTORIAL'){
    if(next.phase!=='cycle-result')return {state,error:'当前没有等待继续的周期结算。'};
    if(next.cycle>=2){next.phase='complete';return {state:next};}
    next.cycle++;next.turnInCycle=1;next.hammers=next.population;next.hand=handFor(next.cycle,1);next.foodResources=[];next.extraFoodDemand=0;next.playedThisCycle=0;next.resultMessage=undefined;next.phase='action';
    addLog(next,'info','第二个生产周期',`人口 ${next.population}，所以每回合有 ${next.population} 锤。留意多出的劳动力。`);return {state:next};
  }
  if(next.phase!=='action')return {state,error:'请先处理当前周期结算。'};
  if(command.type==='PLAY_TUTORIAL_CARD'){
    const index=next.hand.findIndex(card=>card.id===command.cardId),card=next.hand[index];
    if(!card)return {state,error:'这张牌不在手牌中。'};if(card.cost>next.hammers)return {state,error:'锤子不足。'};
    next.hammers-=card.cost;next.hand.splice(index,1);next.playedThisCycle++;
    if(card.kind==='gather-berries'){
      addFood(next,'berries','浆果',1);addLog(next,'good','采集浆果','获得 1 食物。浆果作为实体资源进入食物区。');
      if(next.cycle===2&&next.playedThisCycle===10){addFood(next,'wild-meat','野猪尸体',3,'食用后，下个生产周期 1 人口无法劳动。');next.sickWorkersNextCycle=1;addLog(next,'warning','偶遇事件：发现野猪尸体','最后一次采集翻面触发事件。获得 3 食物，但食用会使下周期少 1 锤。');}
    }else if(next.cycle===1){addFood(next,'hazelnuts','榛子',1);addLog(next,'good','食物事件：树洞里的储粮','你发现动物储藏的坚果，获得 1 食物。');}
    else{next.extraFoodDemand=6;addLog(next,'warning','食物事件：伤员救治','本生产周期结束时额外支付 6 食物。当前预计仍缺 3 食物。');}
    return {state:next};
  }
  if(next.hand.length>0)return {state,error:'请先打完本回合的手牌。'};
  if(next.turnInCycle===1){next.turnInCycle=2;next.hammers=next.population;next.hand=handFor(next.cycle,2);addLog(next,'info',`第 ${next.cycle} 周期 · 第 2 回合`,'抽取剩余 5 张行动牌。');return {state:next};}
  return resolveCycle(next);
}
function resolveCycle(next:BeginnerFoodState):BeginnerFoodResult{
  const food=totalFood(next),demand=totalFoodDemand(next),surplus=food-demand;
  if(surplus<0)return {state:next,error:`仍缺少 ${Math.abs(surplus)} 食物，无法结束生产周期。`};
  if(surplus>0){next.population++;next.resultMessage=`支付 ${demand} 食物后盈余 ${surplus}，人口 +1。剩余食物随后清零。`;addLog(next,'good','人口增长',next.resultMessage);}
  else{next.resultMessage=`支付 ${demand} 食物后没有盈余，人口保持 ${next.population}。剩余食物清零。`;addLog(next,'warning','仅完成供养',next.resultMessage);}
  next.foodResources=[];next.phase='cycle-result';return {state:next};
}
function addFood(next:BeginnerFoodState,kind:FoodKind,name:string,food:number,consequence?:string):void{next.foodResources.push({id:`food-${next.cycle}-${next.playedThisCycle}-${next.foodResources.length}`,kind,name,food,consequence});}
function addLog(next:BeginnerFoodState,tone:TutorialLogEntry['tone'],title:string,detail:string):void{next.log.unshift({id:next.nextLogId++,tone,title,detail});}
function clone(state:BeginnerFoodState):BeginnerFoodState{return {...state,hand:state.hand.map(card=>({...card})),foodResources:state.foodResources.map(item=>({...item})),log:state.log.map(entry=>({...entry}))};}
