import config from './config/demo.json';
import { applyBeginnerFoodCommand, createWebDemo, type WebDemoConfig, type BeginnerFoodCommand, type BeginnerFoodState } from '@civ/core';
import { BeginnerFoodView } from './ui/BeginnerFoodView';
import './ui/beginner-food.css';

const root=document.querySelector<HTMLElement>('#app');
if(!root)throw new Error('Missing #app element.');
let state:BeginnerFoodState=createWebDemo(config as WebDemoConfig);
let error:string|undefined;
const view=new BeginnerFoodView(root,dispatch);
render();
function dispatch(command:BeginnerFoodCommand):void{const result=applyBeginnerFoodCommand(state,command);state=result.state;error=result.error;render();}
function render():void{view.render(state,error);}
