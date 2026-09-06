import {showReform} from './ReformView';
import {centerRates,totalFood,totalFoodDemand,buildingCatalog,rarityNames,rarityOf,type BeginnerFoodCommand,type BeginnerFoodState} from '@civ/core';
import {showTechnologyTree} from './TechnologyTreeView';
import {showResearchShop} from './ResearchShopView';

export class BeginnerFoodView{
  private buildingsExpanded=false;
  private deckExpanded=false;
  private logExpanded=false;
  private showCycleCards=true;

  constructor(private readonly root:HTMLElement,private readonly dispatch:(command:BeginnerFoodCommand)=>void){}

  render(state:BeginnerFoodState,error?:string):void{
    const food=totalFood(state),demand=totalFoodDemand(state);
    const labor=Math.max(0,state.population-state.sickWorkers);
    const foodPercent=demand===0?100:Math.min(100,food/demand*100);
    const foodTooltip=this.foodTooltip(state,food,demand);
    this.root.innerHTML=`<main class="game-shell">
      <header class="topbar"><div><span class="eyebrow">${state.scene==='tutorial'?'文明初生 · 教学':'文明初生 · 自由模式'}</span><h1>文明卡牌</h1></div><div class="header-actions"><button class="ghost" data-action="technology">科技树</button><button class="ghost" data-action="reset">重新开始</button></div></header>
      <section class="indicator-bar" aria-label="文明指标">
        ${this.indicator('👥',String(state.population),`人口：${state.population}。每周期每人口需要 ${centerRates.foodPerPopulation} 食物，总量向上取整。`)}
        ${this.indicator('🔨',String(state.hammers),`劳动力：本回合剩余 ${state.hammers}，可用 ${labor}。`)}
        <div class="indicator food-indicator ${food>=demand?'sufficient':'shortage'}" title="${foodTooltip}" aria-label="${foodTooltip}"><span class="indicator-icon" aria-hidden="true">🍖</span><b>${food}</b><span class="food-demand">/ ${demand}</span><div class="indicator-meter" role="progressbar" aria-label="食物供养进度" aria-valuemin="0" aria-valuemax="${demand}" aria-valuenow="${food}"><i style="width:${foodPercent}%"></i></div></div>
        ${(state.scene==='regular'||state.cycle>=3)?this.indicator('🔬',String(state.researchPoints),`科研：${state.researchPoints}，可跨周期保留。部落中心每回合每人口产出 ${centerRates.researchPerPopulation}，总量向上取整。`):''}
        ${this.indicator('⌛',`${state.cycle}–${state.turnInCycle}`,`生产周期 ${state.cycle}，回合 ${state.turnInCycle}。`)}
      </section>
      ${error?`<div class="error">${error}</div>`:''}
      ${state.extraFoodDemand?`<aside class="crisis"><b>供养调整</b><span>本周期食物需求调整 ${state.extraFoodDemand}，仍需 ${Math.max(0,demand-food)} 食物。</span></aside>`:''}
      <div class="game-workspace ${this.logExpanded?'with-log':''}"><div class="game-main">
        <section class="panel hand-panel"><div class="section-title"><div><span>行动区</span><h2>手牌</h2></div><small>${state.hand.length} 张</small></div><div class="cards">
          ${state.hand.map(card=>`<button class="action-card ${card.kind} rarity-${card.rarity}" data-card="${card.id}" ${card.cost>state.hammers||state.phase!=='action'?'disabled':''}><span class="cost">${card.cost} 🔨 · ${rarityNames[rarityOf(card.rarity)]}</span><span class="card-art">${this.cardIcon(card.kind)}</span><b>${card.name}</b><small>${card.description}</small></button>`).join('')||'<p class="empty">本回合行动已经完成。</p>'}
        </div><div class="supply-meter hammer-meter" role="progressbar" aria-label="本回合剩余锤子" aria-valuemin="0" aria-valuemax="${labor}" aria-valuenow="${state.hammers}"><div style="width:${Math.min(100,state.hammers/Math.max(1,labor)*100)}%"></div></div><div class="supply-label"><span>剩余 ${state.hammers} 🔨</span><span>本回合 ${labor} 🔨</span></div></section>
        <section class="view-controls" aria-label="辅助面板">${this.toggleButton('buildings','🏛️',`建筑 ${state.buildings.length}`,this.buildingsExpanded)}${this.toggleButton('deck','🂠',`卡组 ${state.cycleDeck.length}`,this.deckExpanded)}${this.toggleButton('log','📜','事件记录',this.logExpanded)}</section>
        ${this.buildingsExpanded?this.buildingsPanel(state):''}${this.deckExpanded?this.deckPanel(state):''}
        <section class="next-step">${this.nextStep(state)}</section>
      </div>${this.logExpanded?this.logPanel(state):''}</div>
    </main>`;
    this.bind(state,error);
    if(state.reformOpen)showReform(this.root,state,this.dispatch);
    if(state.researchOpen)showResearchShop(this.root,state,this.dispatch);
  }

  private indicator(icon:string,value:string,tooltip:string):string{return `<div class="indicator" title="${tooltip}" aria-label="${tooltip}"><span class="indicator-icon" aria-hidden="true">${icon}</span><b>${value}</b></div>`;}
  private toggleButton(action:string,icon:string,label:string,expanded:boolean):string{return `<button class="panel-toggle ${expanded?'active':''}" data-action="${action}" aria-expanded="${expanded}"><span aria-hidden="true">${icon}</span>${label}<i aria-hidden="true">${expanded?'▴':'▾'}</i></button>`;}

  private buildingsPanel(state:BeginnerFoodState):string{return `<section class="panel collapsible-panel" id="buildings-panel"><h2>建筑池</h2><div class="building-list">${state.buildings.map(building=>{
    const definition=buildingCatalog.find(item=>item.id===building.id);
    const detail=definition?`建成时提供 ${definition.availableCards.reduce((sum,item)=>sum+item.count,0)} 张行动到可选池；损坏移除全部来源牌。`:building.id==='tribal-center'?'提供科研与改革；结算人口科研与供养。':`剩余 ${building.remainingUses} / ${building.totalUses} 次，每周期最多 ${building.cardsPerCycle} 张。`;
    return `<article class="resource-stack rarity-${building.rarity}"><div><b>${building.name} · ${rarityNames[rarityOf(building.rarity)]}</b><small>${detail}</small></div></article>`;
  }).join('')||'<p class="empty">目前没有建筑。</p>'}</div>${state.buildings.some(item=>item.id==='fire-pit')?'<button class="ghost danger-action" data-action="damage-fire">模拟火塘损坏</button>':''}</section>`;}

  private deckPanel(state:BeginnerFoodState):string{return `<section class="panel collapsible-panel" id="deck-panel"><div class="deck-toolbar"><h2>本周期完整卡组</h2><label><input type="checkbox" role="switch" data-action="cycle-cards" ${this.showCycleCards?'checked':''}> 显示建筑来源牌</label></div><p class="deck-note">本周期卡组包含已打出与待抽取的牌；新增牌下周期进入。</p><div class="deck-cards">${state.cycleDeck.filter(card=>this.showCycleCards||!card.sourceBuildingId).map(card=>`<article class="deck-card rarity-${card.rarity}"><span>${this.cardIcon(card.kind)}</span><b>${card.name}</b><small>${rarityNames[rarityOf(card.rarity)]} · ${card.cost} 锤 · ${this.cardSource(card.sourceBuildingId)}</small></article>`).join('')||'<p class="empty">当前筛选下没有卡牌。</p>'}</div><p class="deck-note">下周期新增：${state.permanentDeck.filter(card=>!state.cycleDeck.some(item=>item.id===card.id)).map(card=>card.name).join('、')||'无'}</p></section>`;}

  private logPanel(state:BeginnerFoodState):string{return `<aside class="panel chronicle" id="log-panel"><div class="section-title"><div><span>文明纪事</span><h2>事件记录</h2></div><small>${state.log.length} 条</small></div>${state.log.map(entry=>`<article class="log ${entry.tone}"><i></i><div><b>${entry.title}</b><p>${entry.detail}</p></div></article>`).join('')||'<p class="empty">尚无事件。</p>'}</aside>`;}

  private foodTooltip(state:BeginnerFoodState,food:number,demand:number):string{const groups=new Map<string,{name:string;count:number;food:number}>();for(const item of state.foodResources){const group=groups.get(item.kind)??{name:item.name,count:0,food:0};group.count++;group.food+=item.food;groups.set(item.kind,group);}const breakdown=[...groups.values()].map(item=>`${item.name} ×${item.count} = ${item.food}`).join('，')||'暂无食物';return `食物：${food} / ${demand}。${food>=demand?'当前足够供养':'当前不足供养'}。${breakdown}`;}
  private cardIcon(kind:string):string{return kind.startsWith('build-')?'🏗️':kind==='gather-berries'?'🫐':kind==='research'?'🔬':kind==='reform'?'📜':kind==='roast-food'?'🔥':'🧭';}
  private cardSource(id?:string):string{return id==='tribal-center'?'部落中心':id==='berry-bush'?'浆果丛':buildingCatalog.find(item=>item.id===id)?.name??'常驻卡';}

  private bind(state:BeginnerFoodState,error?:string):void{
    this.root.querySelectorAll<HTMLElement>('[data-card]').forEach(button=>button.onclick=()=>this.dispatch({type:'PLAY_TUTORIAL_CARD',cardId:button.dataset.card!}));
    this.root.querySelector<HTMLElement>('[data-action="buildings"]')?.addEventListener('click',()=>{this.buildingsExpanded=!this.buildingsExpanded;this.render(state,error);});
    this.root.querySelector<HTMLElement>('[data-action="deck"]')?.addEventListener('click',()=>{this.deckExpanded=!this.deckExpanded;this.render(state,error);});
    this.root.querySelector<HTMLElement>('[data-action="log"]')?.addEventListener('click',()=>{this.logExpanded=!this.logExpanded;this.render(state,error);});
    this.root.querySelector<HTMLInputElement>('[data-action="cycle-cards"]')?.addEventListener('change',event=>{this.showCycleCards=(event.target as HTMLInputElement).checked;this.render(state,error);});
    this.root.querySelector<HTMLElement>('[data-action="end"]')?.addEventListener('click',()=>this.dispatch({type:'END_TUTORIAL_TURN'}));
    this.root.querySelector<HTMLElement>('[data-action="continue"]')?.addEventListener('click',()=>this.dispatch({type:'CONTINUE_TUTORIAL'}));
    this.root.querySelectorAll<HTMLElement>('[data-action="reset"]').forEach(button=>button.addEventListener('click',()=>this.dispatch({type:'RESET_TUTORIAL'})));
    this.root.querySelector<HTMLElement>('[data-action="technology"]')?.addEventListener('click',()=>showTechnologyTree(this.root,false,()=>this.root.querySelector<HTMLElement>('[data-action="technology"]')?.focus(),state.researchPoints,state.researchedTechnologyIds));
    this.root.querySelector<HTMLElement>('[data-action="damage-fire"]')?.addEventListener('click',()=>this.dispatch({type:'DESTROY_BUILDING',buildingId:'fire-pit'}));
  }

  private nextStep(state:BeginnerFoodState):string{
    if(state.phase==='cycle-result')return `<span class="eyebrow">周期结算</span><h2>${state.resultMessage}</h2><button class="primary" data-action="continue">${(state.scene==='regular'||state.cycle<3)?`进入第 ${state.cycle+1} 周期`:'完成演示'}</button>`;
    if(state.phase==='complete')return `<span class="eyebrow">演示完成</span><h2>${state.resultMessage??'演示完成'}</h2><button class="primary" data-action="reset">再玩一次</button>`;
    const hasNext=state.turnInCycle*5-state.removedDrawnCards<state.cycleDeck.length;
    if(state.hand.length===0||state.scene==='regular')return `<span class="eyebrow">下一步</span><h2>${hasNext?'本回合结束，抽取下一手牌。':'行动完成，进行周期供养。'}</h2><button class="primary" data-action="end">${hasNext?'结束回合':'结算生产周期'}</button>`;
    return `<span class="eyebrow">行动提示</span><h2>选择一张手牌，支付锤子并执行行动。</h2><p>搜寻会主动生成事件；采集也可能偶遇事件。</p>`;
  }
}
