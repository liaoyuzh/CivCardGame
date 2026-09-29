import {rarityNames,rarityOf,type BeginnerFoodState,type BeginnerFoodCommand} from '@civ/core';

export function showResearchShop(root:HTMLElement,state:BeginnerFoodState,dispatch:(command:BeginnerFoodCommand)=>void):void {
  const trade=state.runtime?.shop==='trade';
  const currency=trade?'金币':'瓶子';
  const balance=trade?state.runtime!.gold:state.researchPoints;
  const dialog=document.createElement('dialog');dialog.className='technology-dialog';dialog.setAttribute('aria-label',trade?'贸易商店':'科研商店');
  const heading=document.createElement('h2');heading.textContent=`${trade?'贸易':'科研'}商店 · ${balance} ${currency}`;
  const note=document.createElement('p');note.textContent=state.runtime?`${trade?'外域供应不受本地科技限制。':'科技与建筑影响候选。'}本次候选固定，购买后不补货；新牌直接加入抽牌堆顶。`:'本次候选固定，购买后不补货。蓝图和行动牌下周期开始抽取。';
  const close=document.createElement('button');close.className='ghost';close.textContent=trade?'结束贸易':'结束科研';close.onclick=()=>dialog.close();
  const grid=document.createElement('div');grid.className='shop-grid';
  for(const offer of state.researchOffers){
    const node=document.createElement('article');node.className=`shop-card rarity-${offer.rarity}`;
    const type=document.createElement('small');type.textContent=`${rarityNames[rarityOf(offer.rarity)]} · ${{technology:'科技',blueprint:'建筑蓝图',action:'行动卡'}[offer.type]}`;
    const name=document.createElement('h3');name.textContent=offer.name;
    const description=document.createElement('p');description.textContent=offer.description;
    const buy=document.createElement('button');buy.className='ghost';buy.textContent=offer.purchased?'已售出':`购买 · ${offer.cost} ${currency}`;
    buy.disabled=offer.purchased||offer.cost>balance;buy.onclick=()=>dispatch({type:'BUY_RESEARCH_OFFER',offerId:offer.id});
    const owned=document.createElement('small');
    if(offer.type!=='technology'){const active=state.permanentDeck.filter(card=>card.kind===offer.contentId).length,reserve=state.availablePool.filter(card=>card.kind===offer.contentId).length;owned.textContent=`已拥有 ${active+reserve} · 使用中 ${active} · 备用 ${reserve}`;}
    const source=document.createElement('small');source.textContent=offer.source?`来源：${offer.source}`:'';
    node.append(type,name,source,description,owned,buy);grid.append(node);
  }
  dialog.append(heading,note,close,grid);root.append(dialog);
  dialog.addEventListener('close',()=>{dialog.remove();dispatch({type:'CLOSE_RESEARCH'});},{once:true});
  dialog.showModal();close.focus();
}
