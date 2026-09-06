import config from '../content/research-shop.json';
export type Rarity='white'|'blue'|'gold'|'red';
export const rarityNames:Record<Rarity,string>={white:'白',blue:'蓝',gold:'金',red:'红'};
export function rarityOf(value:string):Rarity {
  if(!Object.prototype.hasOwnProperty.call(rarityNames,value))throw new Error(`未知稀有度：${value}`);
  return value as Rarity;
}
export function nextRandom(state:{reformSeed:number}):number {
  state.reformSeed=(Math.imul(state.reformSeed,1664525)+1013904223)>>>0;
  return state.reformSeed/4294967296;
}
export function rarityPick<T extends {rarity:string}>(pool:readonly T[],random:()=>number):T {
  const tiers=(Object.keys(rarityNames) as Rarity[]).filter(rarity=>pool.some(item=>item.rarity===rarity)&&config.rarityWeights[rarity]>0);
  const total=tiers.reduce((sum,tier)=>sum+config.rarityWeights[tier],0);
  if(!total)throw new Error('没有可抽取的稀有度');
  let roll=random()*total;let chosen=tiers[tiers.length-1];
  for(const tier of tiers){roll-=config.rarityWeights[tier];if(roll<0){chosen=tier;break;}}
  const group=pool.filter(item=>item.rarity===chosen);
  return group[Math.min(group.length-1,Math.floor(random()*group.length))];
}
