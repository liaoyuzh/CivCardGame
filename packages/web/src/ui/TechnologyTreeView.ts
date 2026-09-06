import {ancientTechnologyTree,technologyLayers,rarityNames,rarityOf} from '@civ/core';
import cards from '../../../core/src/content/cards.json';

export function showTechnologyTree(root:HTMLElement,_research:boolean,onClose:()=>void,researchPoints=0,researchedIds:readonly string[]=[]):void {
  const technologies=ancientTechnologyTree.technologies;
  const layers=technologyLayers(technologies);
  const researched=new Set(researchedIds);
  const dialog=document.createElement('dialog');dialog.className='technology-dialog';dialog.setAttribute('aria-label','远古科技树');
  const header=document.createElement('header');header.className='technology-header';
  const heading=document.createElement('h2');heading.textContent='科技树 · 远古时代';
  const close=document.createElement('button');close.className='ghost';close.textContent='返回文明';close.onclick=()=>dialog.close();
  header.append(heading,close);
  const note=document.createElement('p');note.className='technology-note';note.textContent=`现有 ${researchPoints} 科研 · 已研发 ${technologies.filter(tech=>researched.has(tech.id)).length} / ${technologies.length}。打出科研卡后在商店购买科技，完成研发解锁对应蓝图。`;
  const legend=document.createElement('div');legend.className='technology-legend';
  for(const [state,label] of [['researched','✓ 已研发'],['available','○ 前置已满足'],['locked','· 尚未解锁']]){
    const item=document.createElement('span');item.className=state;item.textContent=label;legend.append(item);
  }
  const hint=document.createElement('span');hint.textContent='从左向右解锁 · 多条入线表示需要全部前置 · 可滚动查看';legend.append(hint);
  const viewport=document.createElement('div');viewport.className='technology-viewport';viewport.tabIndex=0;viewport.setAttribute('aria-label','科技关系图，可使用方向键滚动');
  const tree=document.createElement('div');tree.className='technology-tree';
  // Allocate each primary branch its own rows; keep every prerequisite as a visible edge.
  const positions=new Map<string,{x:number;y:number}>();
  const depths=new Map(layers.flatMap((layer,depth)=>layer.map(tech=>[tech.id,depth] as const)));
  let row=0;
  function place(id:string):number {
    const children=technologies.filter(tech=>tech.prerequisites[0]===id);
    const rows=children.map(tech=>place(tech.id));
    const center=rows.length?(rows[0]+rows[rows.length-1])/2:row++;
    positions.set(id,{x:24+depths.get(id)!*330,y:56+center*150});
    return center;
  }
  technologies.filter(tech=>!tech.prerequisites.length).forEach(tech=>place(tech.id));
  const width=Math.max(620,layers.length*330-40),height=56+row*150;
  tree.style.width=`${width}px`;tree.style.height=`${height}px`;
  layers.forEach((_,index)=>{
    const label=document.createElement('div');label.className='technology-layer-title';label.style.left=`${24+index*330}px`;label.textContent=index===0?'01 / 起始科技':`${String(index+1).padStart(2,'0')} / 进阶科技`;tree.append(label);
  });
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.classList.add('technology-connections');svg.setAttribute('width',String(width));svg.setAttribute('height',String(height));svg.setAttribute('aria-hidden','true');
  for(const tech of technologies){
    const target=positions.get(tech.id)!;
    for(const prerequisite of tech.prerequisites){
      const source=positions.get(prerequisite)!;
      const x=source.x+240,y=source.y+64,endY=target.y+64,middle=(x+target.x)/2;
      const path=document.createElementNS(svg.namespaceURI,'path');
      path.setAttribute('d',`M ${x} ${y} H ${middle} V ${endY} H ${target.x} m -7 -4 l 7 4 -7 4`);
      path.setAttribute('class',researched.has(prerequisite)?'satisfied':'pending');svg.append(path);
    }
  }
  tree.append(svg);
  for(const tech of technologies){
    const state=researched.has(tech.id)?'researched':tech.prerequisites.every(id=>researched.has(id))?'available':'locked';
    const position=positions.get(tech.id)!;
    const node=document.createElement('article');node.className=`technology-node ${state}`;node.style.left=`${position.x}px`;node.style.top=`${position.y}px`;
    const meta=document.createElement('div');meta.className='technology-node-meta';
    const rarity=document.createElement('span');rarity.textContent=rarityNames[rarityOf(tech.rarity)];
    const cost=document.createElement('span');cost.textContent=`${tech.cost} 科研`;meta.append(rarity,cost);
    const name=document.createElement('h3');name.textContent=tech.name;
    const unlock=document.createElement('p');unlock.textContent=`解锁：${cards[tech.unlockBlueprint as keyof typeof cards].name}`;
    const status=document.createElement('small');status.textContent=state==='researched'?'✓ 已研发':state==='available'?'○ 前置已满足 · 可进入商店':'· 尚未解锁';
    const relation=tech.prerequisites.map(id=>technologies.find(item=>item.id===id)!.name).join('、');
    node.title=relation?`需要全部前置科技：${relation}`:'无前置科技';node.setAttribute('aria-label',`${tech.name}，${tech.cost} 科研，${status.textContent}，${node.title}，${unlock.textContent}`);
    node.append(meta,name,unlock,status);tree.append(node);
  }
  viewport.append(tree);dialog.append(header,note,legend,viewport);root.append(dialog);
  dialog.addEventListener('close',()=>{dialog.remove();onClose();},{once:true});dialog.showModal();close.focus();
}
