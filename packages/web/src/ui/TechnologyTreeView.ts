import {ancientTechnologyTree,technologyLayers} from '@civ/core';

export function showTechnologyTree(root:HTMLElement,research:boolean,onClose:()=>void,researchPoints=0,researchedIds:readonly string[]=[],onPurchase?:(id:string)=>void):void {
  const dialog=document.createElement('dialog');
  dialog.className='technology-dialog';
  dialog.setAttribute('aria-label',research?'科研':'远古科技树');
  const heading=document.createElement('h2');heading.textContent=research?'科研 · 远古时代':'科技树 · 远古时代';
  const note=document.createElement('p');note.textContent=research?`现有 ${researchPoints} 科研。请选择一项科技购买；本次科研最多研发一项，购买后返回文明。关闭也会结束本次科研。`:'免费浏览。打出科研卡后可购买科技；多个前置需全部完成。';
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
      const definition=ancientTechnologyTree.technologies.find(item=>item.id===tech.id)!;
      const completed=researchedIds.includes(tech.id),unlocked=tech.prerequisites.every(id=>researchedIds.includes(id));
      const status=document.createElement('p');status.textContent=`${definition.cost} 科研 · ${completed?'已研发':!unlocked?'前置未满足':researchPoints<definition.cost?'科研不足':'可研发'}`;node.append(status);
      if(research){
        const buy=document.createElement('button');buy.className='ghost';buy.textContent=completed?'已研发':`研发 ${tech.name}`;
        buy.disabled=completed||!unlocked||researchPoints<definition.cost||!onPurchase;
        buy.onclick=()=>onPurchase?.(tech.id);node.append(buy);
      }
    }
    tree.append(column);
  }
  dialog.append(heading,note,close,tree);root.append(dialog);
  dialog.addEventListener('close',()=>{dialog.remove();onClose();},{once:true});
  dialog.showModal();close.focus();
}
