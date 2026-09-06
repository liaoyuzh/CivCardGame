import center from '../content/buildings/tribal-center.json';

export function populationOutput(population:number,rate:number):number {
  if(!Number.isFinite(rate)||rate<0)throw new Error('每人口比例必须是非负有限数');
  return Math.ceil(population*rate);
}
export function baseFoodDemand(population:number):number{return populationOutput(population,center.foodPerPopulation);}
export function growthFoodDemand(demand:number):number{return demand+populationOutput(demand,center.populationGrowthSurplusRatio);}
export const centerRates={foodPerPopulation:center.foodPerPopulation,researchPerPopulation:center.researchPerPopulation};
populationOutput(1,center.foodPerPopulation);
populationOutput(1,center.researchPerPopulation);
populationOutput(1,center.populationGrowthSurplusRatio);
