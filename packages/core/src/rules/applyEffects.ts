import resources from '../content/resources.json';
import events from '../content/events.json';
import {openReform,buildFirePit} from './reform';
import type { BeginnerFoodState, TutorialLogEntry } from '../tutorial/BeginnerFoodDemo';

type Effect = { type:string; resourceId?:string; quantity?:number; amount?:number; pool?:string };

export function addContentLog(state:BeginnerFoodState,log:{tone:string;title:string;detail:string}):void{
  if(!['info','good','warning'].includes(log.tone))throw new Error(`Invalid log tone: ${log.tone}`);
  state.log.unshift({id:state.nextLogId++,tone:log.tone as TutorialLogEntry['tone'],title:log.title,detail:log.detail.replace(/\{population\}/g,String(state.population))});
}

export function applyEvent(state:BeginnerFoodState,eventId:string):void{
  if(!Object.prototype.hasOwnProperty.call(events,eventId))throw new Error(`Unknown event: ${eventId}`);
  const event=events[eventId as keyof typeof events];
  applyEffects(state,event.effects);
  addContentLog(state,event.log);
}

export function applyEffects(state:BeginnerFoodState,effects:readonly Effect[],resolveEvent?:(pool:string)=>string):void{
  for(const effect of effects){
    switch(effect.type){
      case 'open-reform': openReform(state);break;
      case 'build-fire-pit': buildFirePit(state);break;
      case 'gain-research': state.researchPoints+=nonnegativeInteger(effect.amount);break;
      case 'gain-hammers': state.hammers+=nonnegativeInteger(effect.amount);break;
      case 'reduce-food-demand': state.extraFoodDemand=Math.max(-state.population,state.extraFoodDemand-nonnegativeInteger(effect.amount));break;
      case 'roast-food': if(state.foodResources[0])state.foodResources[0].food++;break;
      case 'open-research': state.researchOpen=true;break;
      case 'gain-resource': {
        if(!effect.resourceId||!Object.prototype.hasOwnProperty.call(resources,effect.resourceId))throw new Error(`Unknown resource: ${effect.resourceId}`);
        const quantity=nonnegativeInteger(effect.quantity);
        const kind=effect.resourceId as keyof typeof resources;
        for(let i=0;i<quantity;i++)state.foodResources.push({id:`food-${state.cycle}-${state.playedThisCycle}-${state.foodResources.length}`,kind,...resources[kind]});
        break;
      }
      case 'set-food-demand': state.extraFoodDemand=nonnegativeInteger(effect.amount);break;
      case 'set-sick-workers': state.sickWorkersNextCycle=nonnegativeInteger(effect.amount);break;
      case 'trigger-event': {
        if(!effect.pool||!resolveEvent)throw new Error(`Missing event resolver for pool: ${effect.pool}`);
        applyEvent(state,resolveEvent(effect.pool));break;
      }
      default: throw new Error(`Unknown effect: ${effect.type}`);
    }
  }
}

function nonnegativeInteger(value:number|undefined):number{
  if(value===undefined||!Number.isInteger(value)||value<0)throw new Error(`Expected nonnegative integer: ${value}`);
  return value;
}
