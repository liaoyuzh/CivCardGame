import {showReform} from './ReformView';
import { totalFood,totalFoodDemand,type BeginnerFoodCommand,type BeginnerFoodState } from '@civ/core';
import {showTechnologyTree} from './TechnologyTreeView';

export class BeginnerFoodView{
  private deckExpanded=false;
  private showCycleCards=true;
  constructor(private readonly root:HTMLElement,private readonly dispatch:(command:BeginnerFoodCommand)=>void){}
  render(state:BeginnerFoodState,error?:string):void{
    const food=totalFood(state),demand=totalFoodDemand(state);
    const labor=Math.max(0,state.population-state.sickWorkers);
    const berries=state.foodResources.filter(item=>item.kind==='berries').length;
    const berryFood=state.foodResources.filter(item=>item.kind==='berries').reduce((sum,item)=>sum+item.food,0);
    const special=state.foodResources.filter(item=>item.kind!=='berries');
    this.root.innerHTML=`<main class="game-shell">
      <header class="topbar"><div><span class="eyebrow">文明初生</span><h1>文明卡牌</h1></div><div><button class="ghost" data-action="technology">科技树</button> <button class="ghost" data-action="reset">重新开始</button></div></header>
      <section class="status-grid">${this.stat('人口',String(state.population),'每周期需要同量食物')}${this.stat('劳动力',`${state.hammers} 锤`,`本回合剩余 · 可用 ${labor}`)}${this.stat('食物',`${food} / ${demand}`,state.extraFoodDemand?`含伤员救治 +${state.extraFoodDemand}`:'供养需求')}${this.stat('进度',`${state.cycle}–${state.turnInCycle}`,`生产周期 ${state.cycle} · 回合 ${state.turnInCycle}`)}</section>
      ${(state.scene==='regular'||state.cycle>=3)?this.stat('科研',String(state.researchPoints),'可跨周期保留 · 部落中心在回合末结算'):''}${error?`<div class="error">${error}</div>`:''}
      <section class="panel building-panel"><div class="section-title"><div><span>生产设施</span><h2>建筑池</h2></div><button class="ghost" data-action="deck" aria-expanded="${this.deckExpanded}" aria-controls="cycle-deck">${this.deckExpanded?'收起':'展开'}卡组 · ${state.cycleDeck.length} 张</button></div>
        ${state.buildings.map(building=>`<article class="resource-stack"><span>${building.id==='tribal-center'?'🏛️':'🌿'}</span><div><b>${building.name} · 已建成</b><small>${building.id==='fire-pit'?'建成提供烧烤食物 ×3 至可选卡池；损坏时移除全部来源牌':building.remainingUses===null?((state.scene==='regular'||state.cycle>=3)?'周期开始：科研 ×1、改革 ×1；回合末：按人口积攒科研；周期末：供养、增长、清理':'周期末：供养、增长、食物清理；第三周期开启科研与改革'):`剩余 ${building.remainingUses} / ${building.totalUses} 次采集 · 每周期最多提供 ${building.cardsPerCycle} 张采集浆果`}</small></div></article>`).join('')}
        <div id="cycle-deck" ${this.deckExpanded?'':'hidden'}><div class="deck-toolbar"><b>本周期完整卡组</b><label><input type="checkbox" role="switch" data-action="cycle-cards" ${this.showCycleCards?'checked':''}> 显示周期卡牌</label></div><p class="deck-note">包含已打出、手牌和待抽取的牌。显示开关不影响实际抽牌。</p><div class="deck-cards">${state.cycleDeck.filter(card=>this.showCycleCards||!card.sourceBuildingId).map(card=>`<article class="deck-card"><span>${card.kind==='gather-berries'?'🫐':card.kind==='research'?'🔬':card.kind==='reform'?'📜':'🧭'}</span><b>${card.name}</b><small>${card.cost} 锤 · ${card.sourceBuildingId==='tribal-center'?'周期卡 · 部落中心':card.sourceBuildingId==='fire-pit'?'来源 · 火塘':card.sourceBuildingId?'周期卡 · 浆果丛':'常驻卡'}</small></article>`).join('')}</div></div>
      </section>
      ${state.buildings.some(item=>item.id==='fire-pit')?'<button class="ghost" data-action="damage-fire">模拟火塘损坏</button>':''}${state.extraFoodDemand?`<aside class="crisis"><b>供养调整</b><span>本周期食物需求调整 ${state.extraFoodDemand}。你还需要 ${Math.max(0,demand-food)} 食物。</span></aside>`:''}
      <section class="table-area"><div class="panel hand-panel"><div class="section-title"><div><span>行动区</span><h2>手牌</h2></div><small>${state.hand.length} 张</small></div><div class="cards">
        ${state.hand.map(card=>`<button class="action-card ${card.kind}" data-card="${card.id}" ${card.cost>state.hammers||state.phase!=='action'?'disabled':''}><span class="cost">${card.cost} 🔨</span><span class="card-art">${card.kind==='gather-berries'?'🫐':card.kind==='research'?'🔬':card.kind==='reform'?'📜':'🧭'}</span><b>${card.name}</b><small>${card.description}</small></button>`).join('')||'<p class="empty">本回合行动已经完成。</p>'}
      </div><div class="supply-meter hammer-meter" role="progressbar" aria-label="本回合剩余锤子" aria-valuemin="0" aria-valuemax="${labor}" aria-valuenow="${state.hammers}"><div style="width:${Math.min(100,state.hammers/Math.max(1,labor)*100)}%"></div></div><div class="supply-label"><span>剩余 ${state.hammers} 🔨</span><span>本回合 ${labor} 🔨</span></div></div><div class="panel resource-panel"><div class="section-title"><div><span>资源区</span><h2>本周期的食物</h2></div><small>周期末清零</small></div><div class="resources">
        ${berries?`<div class="resource-stack"><span>🫐</span><div><b>浆果 × ${berries}</b><small>${berryFood} 食物 · ${berries} 张资源卡</small></div></div>`:''}
        ${special.map(item=>`<div class="resource-stack special"><span>${item.kind==='hazelnuts'?'🌰':'🐗'}</span><div><b>${item.name}</b><small>${item.food} 食物${item.consequence?` · ${item.consequence}`:''}</small></div></div>`).join('')}
        ${!state.foodResources.length?'<p class="empty">打出行动牌来获取实体食物资源。</p>':''}</div><div class="supply-meter"><div style="width:${Math.min(100,food/Math.max(1,demand)*100)}%"></div></div><div class="supply-label"><span>当前 ${food}</span><span>需求 ${demand}</span></div></div></section>
      <section class="bottom-row"><div class="panel chronicle"><div class="section-title"><div><span>文明纪事</span><h2>最近发生</h2></div></div>${state.log.slice(0,4).map(entry=>`<article class="log ${entry.tone}"><i></i><div><b>${entry.title}</b><p>${entry.detail}</p></div></article>`).join('')}</div><div class="next-step">${this.nextStep(state)}</div></section>
    </main>`;
    this.root.querySelectorAll<HTMLElement>('[data-card]').forEach(button=>{button.onclick=()=>this.dispatch({type:'PLAY_TUTORIAL_CARD',cardId:button.dataset.card!});});
    this.root.querySelector<HTMLElement>('[data-action="deck"]')?.addEventListener('click',()=>{this.deckExpanded=!this.deckExpanded;this.render(state,error);this.root.querySelector<HTMLElement>('[data-action="deck"]')?.focus();});
    this.root.querySelector<HTMLInputElement>('[data-action="cycle-cards"]')?.addEventListener('change',event=>{this.showCycleCards=(event.target as HTMLInputElement).checked;this.render(state,error);this.root.querySelector<HTMLInputElement>('[data-action="cycle-cards"]')?.focus();});
    this.root.querySelector<HTMLElement>('[data-action="end"]')?.addEventListener('click',()=>this.dispatch({type:'END_TUTORIAL_TURN'}));
    this.root.querySelector<HTMLElement>('[data-action="continue"]')?.addEventListener('click',()=>this.dispatch({type:'CONTINUE_TUTORIAL'}));
    this.root.querySelectorAll<HTMLElement>('[data-action="reset"]').forEach(button=>button.addEventListener('click',()=>this.dispatch({type:'RESET_TUTORIAL'})));
    this.root.querySelector<HTMLElement>('[data-action="technology"]')?.addEventListener('click',()=>showTechnologyTree(this.root,false,()=>this.root.querySelector<HTMLElement>('[data-action="technology"]')?.focus(),state.researchPoints,state.researchedTechnologyIds));
    this.root.querySelector<HTMLElement>('[data-action=damage-fire]')?.addEventListener('click',()=>this.dispatch({type:'DESTROY_BUILDING',buildingId:'fire-pit'}));
    if(state.reformOpen)showReform(this.root,state,this.dispatch);
    if(state.researchOpen)showTechnologyTree(this.root,true,()=>this.dispatch({type:'CLOSE_RESEARCH'}),state.researchPoints,state.researchedTechnologyIds,id=>this.dispatch({type:'BUY_TECHNOLOGY',technologyId:id}));
  }
  private stat(label:string,value:string,note:string):string{return `<div class="stat"><span>${label}</span><b>${value}</b><small>${note}</small></div>`;}
  private nextStep(state:BeginnerFoodState):string{
    if(state.phase==='cycle-result')return `<span class="eyebrow">周期结算</span><h2>${state.resultMessage}</h2><button class="primary" data-action="continue">${(state.scene==='regular'||state.cycle<3)?`进入第 ${state.cycle+1} 周期`:'完成演示'}</button>`;
    if(state.phase==='complete')return `<span class="eyebrow">演示完成</span><h2>${state.resultMessage??'演示完成'}</h2><button class="primary" data-action="reset">再玩一次</button>`;
    if(state.hand.length===0||state.scene==='regular')return `<span class="eyebrow">下一步</span><h2>${state.turnInCycle*5-state.removedDrawnCards<state.cycleDeck.length?'本回合结束，抽取下一手牌。':'行动完成，进行周期供养。'}</h2><button class="primary" data-action="end">${state.turnInCycle*5-state.removedDrawnCards<state.cycleDeck.length?'结束回合':'结算生产周期'}</button>`;
    return `<span class="eyebrow">行动提示</span><h2>选择一张手牌，支付锤子并执行行动。</h2><p>搜寻会主动生成事件；采集也可能偶遇事件。</p>`;
  }
}
