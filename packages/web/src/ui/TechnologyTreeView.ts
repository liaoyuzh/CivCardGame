import {ancientTechnologyTree,technologyLayers,rarityNames,rarityOf} from '@civ/core';
import cards from '../../../core/src/content/cards.json';

export function showTechnologyTree(root:HTMLElement,_research:boolean,onClose:()=>void,researchPoints=0,researchedIds:readonly string[]=[]):void {
  const dialog=document.createElement('dialog');dialog.className='technology-dialog';dialog.setAttribute('aria-label','远古科技树');
  const heading=document.createElement('h2');heading.textContent='科技树 · 远古时代';
  const note=document.createElement('p');note.textContent=`现有 ${researchPoints} 科研。此处只浏览关系，打出科研卡后从随机商店购买。完成科技会解锁对应蓝图。`;
  const close=document.createElement('button');close.className='ghost';close.textContent='返回文明';close.onclick=()=>dialog.close();
  const tree=document.createElement('div');tree.className='technology-layers';
  for(const [index,layer] of technologyLayers(ancientTechnologyTree.technologies).entries()){
    const column=document.createElement('section');const title=document.createElement('h3');title.textContent=index===0?'起始科技':`第 ${index+1} 层`;column.append(title);
    for(const tech of layer){
      const definition=ancientTechnologyTree.technologies.find(item=>item.id===tech.id)!;
      const node=document.createElement('article');node.className=`technology-node rarity-${definition.rarity}`;
      const name=document.createElement('b');name.textContent=`${rarityNames[rarityOf(definition.rarity)]} · ${tech.name} · ${definition.cost} 科研`;
      const relation=document.createElement('p');relation.textContent=tech.prerequisites.length?`${tech.prerequisites.map(id=>ancientTechnologyTree.technologies.find(item=>item.id===id)!.name).join(' + ')} → ${tech.name}`:'无前置科技';
      const unlock=document.createElement('p');unlock.textContent=`解锁：${cards[definition.unlockBlueprint as keyof typeof cards].name}`;
      const status=document.createElement('small');status.textContent=researchedIds.includes(tech.id)?'已研发':tech.prerequisites.every(id=>researchedIds.includes(id))?'满足前置，可能出现在科研商店':'前置未满足';
      node.append(name,relation,unlock,status);column.append(node);
    }
    tree.append(column);
  }
  dialog.append(heading,note,close,tree);root.append(dialog);
  dialog.addEventListener('close',()=>{dialog.remove();onClose();},{once:true});dialog.showModal();close.focus();
}
