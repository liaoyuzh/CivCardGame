import config from '../content/global-config.json';
import type {BeginnerFoodState} from '../tutorial/BeginnerFoodDemo';

export const globalConfig=config;

export function validateGlobalConfig():void {
  for(const [key,value] of Object.entries(config)){
    if(!Number.isFinite(value)||value<0)throw new Error(`全局配置 ${key} 必须为非负有限数`);
    if(!['FoodConsumptionPerPop','PopulationGrowthSurplusRatio'].includes(key)&&!Number.isInteger(value))throw new Error(`全局配置 ${key} 必须为整数`);
  }
  if(config.CardsPerTurn<1||config.TradeOfferCount<1)throw new Error('抽牌数与贸易候选数必须至少为 1');
}

export function turnFoodDemand(state:BeginnerFoodState):number {
  validateGlobalConfig();
  return Math.max(0,Math.ceil(state.population*config.FoodConsumptionPerPop)+state.extraFoodDemand);
}

/** Consume exact food value, preserving partially used resources and their IDs. */
export function consumeFood(state:BeginnerFoodState,amount:number):void {
  for(const item of state.foodResources){
    const used=Math.min(item.food,amount);item.food-=used;amount-=used;
    if(amount===0)break;
  }
  state.foodResources=state.foodResources.filter(item=>item.food>0);
}

export function settleTurnFood(state:BeginnerFoodState):void {
  const food=state.foodResources.reduce((sum,item)=>sum+item.food,0);
  const demand=turnFoodDemand(state);
  consumeFood(state,demand);
  let detail=`消耗 ${Math.min(food,demand)} / ${demand} 食物。`;
  if(food<demand){
    const loss=Math.min(state.population,(demand-food)*config.StarvationLossPerMissingFood);
    state.population-=loss;detail+=`人口 -${loss}。`;
  }else if(demand>0){
    // Growth spends the required surplus instead of reusing the same stock each turn.
    const growthCost=Math.max(1,Math.ceil(demand*config.PopulationGrowthSurplusRatio));
    if(food-demand>=growthCost){consumeFood(state,growthCost);state.population++;detail+=`额外消耗 ${growthCost} 食物，人口 +1。`;}
  }
  if(state.surplusResearch){
    const surplus=state.foodResources.reduce((sum,item)=>sum+item.food,0);
    state.researchPoints+=surplus;state.foodResources=[];detail+=`剩余 ${surplus} 食物转为科研。`;
  }
  state.resultMessage=detail;
  state.log.unshift({id:state.nextLogId++,tone:food<demand?'warning':'good',title:'回合供养',detail});
}
