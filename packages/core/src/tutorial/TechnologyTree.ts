import ancient from '../content/technologies/ancient.json';

export interface Technology { id:string; name:string; prerequisites:string[]; }
export function technologyLayers(technologies:readonly Technology[]):Technology[][] {
  const ids=new Set(technologies.map(tech=>tech.id));
  if(ids.size!==technologies.length)throw new Error('科技 id 重复');
  if(technologies.some(tech=>tech.prerequisites.some(id=>!ids.has(id))))throw new Error('科技前置不存在');
  const done=new Set<string>(),layers:Technology[][]=[];
  while(done.size<technologies.length){
    const layer=technologies.filter(tech=>!done.has(tech.id)&&tech.prerequisites.every(id=>done.has(id)));
    if(!layer.length)throw new Error('科技树包含循环依赖');
    layers.push(layer);layer.forEach(tech=>done.add(tech.id));
  }
  return layers;
}
export const ancientTechnologyTree=ancient;
if(ancient.technologies.some(tech=>!Number.isInteger(tech.cost)||tech.cost<=0))throw new Error('科技价格必须为正整数');
technologyLayers(ancient.technologies);
