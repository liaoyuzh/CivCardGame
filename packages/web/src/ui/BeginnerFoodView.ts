import { totalFood,totalFoodDemand,type BeginnerFoodCommand,type BeginnerFoodState } from '@civ/core';

export class BeginnerFoodView{
  constructor(private readonly root:HTMLElement,private readonly dispatch:(command:BeginnerFoodCommand)=>void){}
  render(state:BeginnerFoodState,error?:string):void{
    const food=totalFood(state),demand=totalFoodDemand(state);
    const berries=state.foodResources.filter(item=>item.kind==='berries').length;
    const special=state.foodResources.filter(item=>item.kind!=='berries');
    this.root.innerHTML=`<main class="game-shell">
      <header class="topbar"><div><span class="eyebrow">文明初生</span><h1>觅食者的第一个冬天</h1></div><button class="ghost" data-action="reset">重新开始</button></header>
      <section class="status-grid">${this.stat('人口',String(state.population),'每周期需要同量食物')}${this.stat('劳动力',`${state.hammers} 锤`,`本回合剩余 · 初始 ${state.population}`)}${this.stat('食物',`${food} / ${demand}`,state.extraFoodDemand?`含伤员救治 +${state.extraFoodDemand}`:'供养需求')}${this.stat('进度',`${state.cycle}–${state.turnInCycle}`,`生产周期 ${state.cycle} · 回合 ${state.turnInCycle}`)}</section>
      ${error?`<div class="error">${error}</div>`:''}
      ${state.extraFoodDemand?`<aside class="crisis"><b>伤员救治</b><span>本周期供养需求增加 ${state.extraFoodDemand}。你还需要 ${Math.max(0,demand-food)} 食物。</span></aside>`:''}
      <section class="table-area"><div class="panel hand-panel"><div class="section-title"><div><span>行动区</span><h2>手牌</h2></div><small>${state.hand.length} 张</small></div><div class="cards">
        ${state.hand.map(card=>`<button class="action-card ${card.kind}" data-card="${card.id}" ${card.cost>state.hammers||state.phase!=='action'?'disabled':''}><span class="cost">${card.cost} 🔨</span><span class="card-art">${card.kind==='gather-berries'?'🫐':'🧭'}</span><b>${card.name}</b><small>${card.description}</small></button>`).join('')||'<p class="empty">本回合行动已经完成。</p>'}
      </div></div><div class="panel resource-panel"><div class="section-title"><div><span>资源区</span><h2>本周期的食物</h2></div><small>周期末清零</small></div><div class="resources">
        ${berries?`<div class="resource-stack"><span>🫐</span><div><b>浆果 × ${berries}</b><small>${berries} 食物 · ${berries} 张资源卡</small></div></div>`:''}
        ${special.map(item=>`<div class="resource-stack special"><span>${item.kind==='hazelnuts'?'🌰':'🐗'}</span><div><b>${item.name}</b><small>${item.food} 食物${item.consequence?` · ${item.consequence}`:''}</small></div></div>`).join('')}
        ${!state.foodResources.length?'<p class="empty">打出行动牌来获取实体食物资源。</p>':''}</div><div class="supply-meter"><div style="width:${Math.min(100,food/Math.max(1,demand)*100)}%"></div></div><div class="supply-label"><span>当前 ${food}</span><span>需求 ${demand}</span></div></div></section>
      <section class="bottom-row"><div class="panel chronicle"><div class="section-title"><div><span>文明纪事</span><h2>最近发生</h2></div></div>${state.log.slice(0,4).map(entry=>`<article class="log ${entry.tone}"><i></i><div><b>${entry.title}</b><p>${entry.detail}</p></div></article>`).join('')}</div><div class="next-step">${this.nextStep(state)}</div></section>
    </main>`;
    this.root.querySelectorAll<HTMLElement>('[data-card]').forEach(button=>{button.onclick=()=>this.dispatch({type:'PLAY_TUTORIAL_CARD',cardId:button.dataset.card!});});
    this.root.querySelector<HTMLElement>('[data-action="end"]')?.addEventListener('click',()=>this.dispatch({type:'END_TUTORIAL_TURN'}));
    this.root.querySelector<HTMLElement>('[data-action="continue"]')?.addEventListener('click',()=>this.dispatch({type:'CONTINUE_TUTORIAL'}));
    this.root.querySelectorAll<HTMLElement>('[data-action="reset"]').forEach(button=>button.addEventListener('click',()=>this.dispatch({type:'RESET_TUTORIAL'})));
  }
  private stat(label:string,value:string,note:string):string{return `<div class="stat"><span>${label}</span><b>${value}</b><small>${note}</small></div>`;}
  private nextStep(state:BeginnerFoodState):string{
    if(state.phase==='cycle-result')return `<span class="eyebrow">周期结算</span><h2>${state.resultMessage}</h2><button class="primary" data-action="continue">${state.cycle===1?'进入第二周期':'完成演示'}</button>`;
    if(state.phase==='complete')return `<span class="eyebrow">演示完成</span><h2>你经历了增长、危机，以及带有代价的食物选择。</h2><button class="primary" data-action="reset">再玩一次</button>`;
    if(state.hand.length===0)return `<span class="eyebrow">下一步</span><h2>${state.turnInCycle===1?'本回合结束，抽取下一手牌。':'行动完成，进行周期供养。'}</h2><button class="primary" data-action="end">${state.turnInCycle===1?'结束回合':'结算生产周期'}</button>`;
    return `<span class="eyebrow">行动提示</span><h2>选择一张手牌，支付锤子并执行行动。</h2><p>搜寻会主动生成事件；采集也可能偶遇事件。</p>`;
  }
}
