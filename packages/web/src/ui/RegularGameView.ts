import {globalConfig,totalFood,totalFoodDemand,buildingCatalog,rarityNames,rarityOf,type BeginnerFoodState,type BeginnerFoodCommand} from '@civ/core';
import {showReform} from './ReformView';
import {showResearchShop} from './ResearchShopView';
import {showTechnologyTree} from './TechnologyTreeView';
import cards from '../../../core/src/content/cards.json';

export class RegularGameView {
  private expanded='';
  constructor(private root:HTMLElement,private dispatch:(command:BeginnerFoodCommand)=>void){}

  render(state:BeginnerFoodState,error?:string):void {
    const runtime=state.runtime!,food=totalFood(state),demand=totalFoodDemand(state);
    const groups=new Map<string,{name:string;active:number;reserve:number}>();
    for(const [list,key] of [[state.permanentDeck,'active'],[state.availablePool,'reserve']] as const){
      for(const card of list){const group=groups.get(card.kind)??{name:card.name,active:0,reserve:0};group[key]++;groups.set(card.kind,group);}
    }
    this.root.innerHTML=`<main class="game-shell">
      <header class="topbar"><div><span class="eyebrow">文明初生 · 自由模式</span><h1>文明卡牌</h1></div><div class="header-actions"><button class="ghost" data-action="technology">科技树</button><button class="ghost" data-action="reset">重新开始</button></div></header>
      <section class="indicator-bar" aria-label="文明指标">
        ${this.indicator('👥',state.population,`每人口每回合消耗 ${globalConfig.FoodConsumptionPerPop} 食物，总需求向上取整。`)}
        ${this.indicator('🔨',state.hammers,`基础 ${globalConfig.BaseHammersPerTurn} 锤，不随人口增加。`)}
        ${this.indicator('🍖',food,`库存 ${food}；本回合需 ${demand}。剩余食物保留。`)}
        ${this.indicator('🔬',state.researchPoints,'科研商店使用瓶子购买。')}
        ${this.indicator('💰',runtime.gold,'贸易商店使用金币购买外域卡牌。')}
        ${this.indicator('⌛',runtime.turn,'每回合结束结算供养；洗牌不影响供养。')}
      </section>
      <aside class="crisis"><b>本回合口粮 ${demand}</b><span>${food>=demand?`库存足够，供养后剩余 ${food-demand}`:`还缺 ${demand-food} 食物`}。人口增长会额外消耗盈余口粮。</span></aside>
      ${error?`<div class="error" role="alert">${error}</div>`:''}
      <div class="game-workspace"><div class="game-main">
        <section class="panel hand-panel"><div class="section-title"><h2>手牌</h2><small>抽牌堆 ${runtime.drawPile.length} · 弃牌堆 ${runtime.discardPile.length}</small></div><div class="cards">
          ${state.hand.map(card=>`<button class="action-card rarity-${card.rarity}" data-card="${card.id}" ${card.cost>state.hammers||state.phase!=='action'?'disabled':''}><span class="cost">${card.cost} 🔨 · ${rarityNames[rarityOf(card.rarity)]}</span><span class="card-art">${this.cardIcon(card.kind)}</span><b>${card.name}</b><small>${card.description}</small></button>`).join('')||'<p class="empty">没有手牌，可以结束回合。</p>'}
        </div></section>
        <section class="view-controls">${['卡组','建筑','记录'].map(label=>`<button class="panel-toggle" data-panel="${label}">${label}${label==='卡组'?` · 使用中 ${state.permanentDeck.length} / 备用 ${state.availablePool.length}`:''}</button>`).join('')}</section>
        ${this.expanded==='卡组'?`<section class="panel"><h2>已拥有卡牌</h2><p>购买和改革调入的牌放在抽牌堆顶；未出手牌在回合末弃掉。抽牌堆空时洗回弃牌堆。</p><div class="building-list">${[...groups.values()].map(group=>`<article class="resource-stack"><div><b>${group.name}</b><small>拥有 ${group.active+group.reserve} · 使用中 ${group.active} · 备用 ${group.reserve}</small></div></article>`).join('')||'暂无卡牌'}</div><p>弃牌堆：${runtime.discardPile.map(card=>card.name).join('、')||'空'}</p></section>`:''}
        ${this.expanded==='建筑'?`<section class="panel"><h2>建筑</h2>${state.buildings.map(building=>{const definition=buildingCatalog.find(item=>item.id===building.id);return `<article class="resource-stack"><div><b>${building.name}</b><small>${definition?`科研候选：${definition.availableCards.map(entry=>cards[entry.cardId as keyof typeof cards].name).join('、')}`:building.id==='berry-bush'?'科研候选：采集浆果':'回合末提供人口科研收益'}。损坏不影响已拥有的牌。</small></div><button class="ghost" data-destroy="${building.id}">模拟损坏</button></article>`;}).join('')||'暂无建筑'}</section>`:''}
        ${this.expanded==='记录'?`<section class="panel chronicle"><h2>事件记录</h2>${state.log.slice(0,60).map(entry=>`<article class="log ${entry.tone}"><div><b>${entry.title}</b><p>${entry.detail}</p></div></article>`).join('')}</section>`:''}
        <section class="next-step"><h2>${state.phase==='complete'?state.resultMessage:`第 ${runtime.turn} 回合`}</h2>${state.phase==='complete'?'<button class="primary" data-action="reset">重新开始</button>':'<button class="primary" data-action="end">结束回合 · 结算供养</button>'}</section>
      </div></div></main>`;
    this.root.querySelectorAll<HTMLElement>('[data-card]').forEach(node=>node.onclick=()=>this.dispatch({type:'PLAY_TUTORIAL_CARD',cardId:node.dataset.card!}));
    this.root.querySelectorAll<HTMLElement>('[data-panel]').forEach(node=>node.onclick=()=>{this.expanded=this.expanded===node.dataset.panel?'':node.dataset.panel!;this.render(state,error);});
    this.root.querySelectorAll<HTMLElement>('[data-destroy]').forEach(node=>node.onclick=()=>this.dispatch({type:'DESTROY_BUILDING',buildingId:node.dataset.destroy!}));
    this.root.querySelectorAll<HTMLElement>('[data-action="reset"]').forEach(node=>node.onclick=()=>this.dispatch({type:'RESET_TUTORIAL'}));
    this.root.querySelector<HTMLElement>('[data-action="end"]')?.addEventListener('click',()=>this.dispatch({type:'END_TUTORIAL_TURN'}));
    this.root.querySelector<HTMLElement>('[data-action="technology"]')?.addEventListener('click',()=>showTechnologyTree(this.root,false,()=>{},state.researchPoints,state.researchedTechnologyIds));
    if(state.reformOpen)showReform(this.root,state,this.dispatch);
    if(state.researchOpen)showResearchShop(this.root,state,this.dispatch);
  }
  private cardIcon(kind:string):string{return kind.startsWith('build-')?'🏗️':kind==='research'?'🔬':kind==='reform'?'📜':kind==='trade'||kind==='barter-goods'?'💰':kind==='gather-berries'?'🍒':kind==='cultivate-grain'?'🌾':'🧭';}
  private indicator(icon:string,value:number,title:string):string{return `<div class="indicator" title="${title}"><span class="indicator-icon">${icon}</span><b>${value}</b></div>`;}
}
