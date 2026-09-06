import {rarityNames,rarityOf,type BeginnerFoodState,type BeginnerFoodCommand} from '@civ/core';

export function showResearchShop(root:HTMLElement,state:BeginnerFoodState,dispatch:(command:BeginnerFoodCommand)=>void):void {
  const dialog=document.createElement('dialog');dialog.className='technology-dialog';dialog.setAttribute('aria-label','科研商店');
  const heading=document.createElement('h2');heading.textContent=`科研商店 · ${state.researchPoints} 科研`;
  const note=document.createElement('p');note.textContent='本次候选固定，购买后不补货。可以继续购买，关闭后结束本次科研。蓝图和行动牌下周期开始抽取。';
  const close=document.createElement('button');close.className='ghost';close.textContent='结束科研';close.onclick=()=>dialog.close();
  const grid=document.createElement('div');grid.className='shop-grid';
  for(const offer of state.researchOffers){
    const node=document.createElement('article');node.className=`shop-card rarity-${offer.rarity}`;
    const type=document.createElement('small');type.textContent=`${rarityNames[rarityOf(offer.rarity)]} · ${{technology:'科技',blueprint:'建筑蓝图',action:'行动卡'}[offer.type]}`;
    const name=document.createElement('h3');name.textContent=offer.name;
    const description=document.createElement('p');description.textContent=offer.description;
    const buy=document.createElement('button');buy.className='ghost';buy.textContent=offer.purchased?'已售出':`购买 · ${offer.cost} 科研`;
    buy.disabled=offer.purchased||offer.cost>state.researchPoints;buy.onclick=()=>dispatch({type:'BUY_RESEARCH_OFFER',offerId:offer.id});
    node.append(type,name,description,buy);grid.append(node);
  }
  dialog.append(heading,note,close,grid);root.append(dialog);
  dialog.addEventListener('close',()=>{dialog.remove();dispatch({type:'CLOSE_RESEARCH'});},{once:true});
  dialog.showModal();close.focus();
}
