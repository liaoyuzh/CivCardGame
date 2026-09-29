import {rarityNames,rarityOf,type BeginnerFoodState,type BeginnerFoodCommand} from '@civ/core';
import cards from '../../../core/src/content/cards.json';

export function showReform(root:HTMLElement,state:BeginnerFoodState,dispatch:(command:BeginnerFoodCommand)=>void):void {
  const dialog=document.createElement('dialog');dialog.className='technology-dialog';dialog.setAttribute('aria-label','改革');
  const title=document.createElement('h2');title.textContent='改革 · 选择一种操作';
  const note=document.createElement('p');note.textContent=state.runtime?'调入牌放在抽牌堆顶；移出牌保留到备用区。每次改革完成一项操作。':'新增牌下周期加入抽取；删除立即生效。每次改革只完成一项操作。';
  dialog.append(title,note);
  function section(title:string){const heading=document.createElement('h3');heading.textContent=title;dialog.append(heading);}
  function choice(name:string,detail:string,mode:'discover'|'available'|'remove',id:string,rarity:string){
    const button=document.createElement('button');button.className=`ghost rarity-${rarity}`;button.style.margin='6px';button.textContent=`${rarityNames[rarityOf(rarity)]} · ${name} — ${detail}`;
    button.onclick=()=>dispatch({type:'REFORM',mode,cardId:id});dialog.append(button);
  }
  section('1 · 未知卡池：三选一');
  for(const kind of state.reformOffers)choice(cards[kind].name,cards[kind].description,'discover',kind,cards[kind].rarity);
  section(`2 · 可选卡池：${state.availablePool.length} 张`);
  for(const card of state.availablePool)choice(card.name,`${state.buildings.find(item=>item.id===card.sourceBuildingId)?.name??'独立行动'} · ${card.description}`,'available',card.id,card.rarity);
  if(!state.availablePool.length){const p=document.createElement('p');p.textContent='暂无备用牌。改革移出的牌会保留在这里。';dialog.append(p);}
  section(state.runtime?'3 · 移至备用区':'3 · 从卡组移除一张');
  const unique=new Map([...(state.runtime?[]:state.cycleDeck),...state.permanentDeck].map(card=>[card.id,card]));
  for(const card of unique.values())choice(card.name,card.sourceBuildingId?`来源：${state.buildings.find(item=>item.id===card.sourceBuildingId)?.name??'建筑'}`:'独立行动','remove',card.id,card.rarity);
  const close=document.createElement('button');close.className='ghost';close.textContent='放弃本次改革';close.onclick=()=>dialog.close();dialog.append(close);
  dialog.addEventListener('close',()=>{dialog.remove();dispatch({type:'CLOSE_REFORM'});},{once:true});root.append(dialog);dialog.showModal();close.focus();
}
