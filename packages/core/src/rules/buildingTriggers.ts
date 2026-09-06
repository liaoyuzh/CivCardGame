import center from '../content/buildings/tribal-center.json';
import type {BeginnerFoodState} from '../tutorial/BeginnerFoodDemo';
import {addContentLog} from './applyEffects';
import {baseFoodDemand,populationOutput} from './centerRates';

export type BuildingTiming='organization-unlocked'|'turn-end'|'cycle-end';
export interface BuildingEffect {
  timing:string; type:string; amount?:number; perPopulation?:boolean; fromCycle?:number;
}
export const tribalCenter=center;

/** Runs on a command's cloned state; the caller discards it if settlement fails. */
export function triggerCenter(state:BeginnerFoodState,timing:BuildingTiming,settleFood:()=>string|undefined=()=>undefined,effects:readonly BuildingEffect[]=center.effects):string|undefined {
  if(!state.buildings.some(building=>building.id===center.id))return;
  for(const effect of effects){
    if(effect.timing!==timing||(state.scene==='tutorial'&&state.cycle<(effect.fromCycle??1)))continue;
    const amount=effect.amount??0;
    if(!Number.isInteger(amount))throw new Error('建筑效果数值必须为整数');
    switch(effect.type){
      case 'research': {
        const delta=(effect.perPopulation?populationOutput(state.population,center.researchPerPopulation):0)+amount;
        const previous=state.researchPoints;
        state.researchPoints=Math.max(0,previous+delta);
        addContentLog(state,{tone:delta<0?'warning':'good',title:'部落中心 · 科研结算',detail:`科研 ${state.researchPoints-previous>=0?'+':''}${state.researchPoints-previous}，现有 ${state.researchPoints}。`});
        break;
      }
      case 'food-demand':
        state.extraFoodDemand=Math.max(-baseFoodDemand(state.population),state.extraFoodDemand+amount);
        if(amount)addContentLog(state,{tone:amount>0?'warning':'good',title:'部落中心 · 供养调整',detail:`本周期食物需求 ${amount>0?'+':''}${amount}。`});
        break;
      case 'settle-food': {const error=settleFood();if(error)return error;break;}
      default: throw new Error(`未知建筑效果：${effect.type}`);
    }
  }
}
