import {ancientTechnologyTree,technologyLayers} from '@civ/core';

export function showTechnologyTree(root:HTMLElement,research:boolean,onClose:()=>void,researchPoints=0):void {
  const dialog=document.createElement('dialog');
  dialog.className='technology-dialog';
  dialog.setAttribute('aria-label',research?'科研':'远古科技树');
  const heading=document.createElement('h2');heading.textContent=research?'科研 · 远古时代':'科技树 · 远古时代';
  const note=document.createElement('p');note.textContent=research?`已消耗 1 锤进入科研。现有 ${researchPoints} 科研，可跨周期积攒。当前开放科技名称与前置关系预览，研发功能尚未开放。`:'免费浏览。箭头表示前置科技 → 后续科技；多个前置需全部完成。';
  const close=document.createElement('button');close.className='ghost';close.textContent='返回文明';close.onclick=()=>dialog.close();
  const tree=document.createElement('div');tree.className='technology-layers';
  for(const [index,layer] of technologyLayers(ancientTechnologyTree.technologies).entries()){
    const column=document.createElement('section');column.className='technology-layer';
    const title=document.createElement('h3');title.textContent=index===0?'起始科技':`第 ${index+1} 层`;column.append(title);
    for(const tech of layer){
      const node=document.createElement('article');node.className='technology-node';
      const name=document.createElement('b');name.textContent=tech.name;
      const relation=document.createElement('p');relation.textContent=tech.prerequisites.length?`${tech.prerequisites.map(id=>ancientTechnologyTree.technologies.find(item=>item.id===id)!.name).join(' + ')} → ${tech.name}`:'无前置科技';
      const successors=ancientTechnologyTree.technologies.filter(item=>item.prerequisites.includes(tech.id));
      const next=document.createElement('small');next.textContent=successors.length?`通向：${successors.map(item=>item.name).join('、')}`:'本次远古科技树的末端';
      node.append(name,relation,next);column.append(node);
    }
    tree.append(column);
  }
  dialog.append(heading,note,close,tree);root.append(dialog);
  dialog.addEventListener('close',()=>{dialog.remove();onClose();},{once:true});
  dialog.showModal();close.focus();
}
