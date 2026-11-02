// Real-duration practice round: opt in because this exercises the actual bot/motion timers.
import test from 'node:test';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {build} from 'esbuild';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {POST as practice} from '../app/api/big-two/practice/route.ts';
import React,{act} from 'react';
import {chooseBotMove,classify} from '../app/big-two/engine.ts';

test('complete practice round with real timers, pause/hide, duplicate taps and rematch',{skip:!process.env.BIG_TWO_SOAK||!process.env.BIG_TWO_DOM_PATH,timeout:300000},async()=>{
 const {parseHTML}=await import(process.env.BIG_TWO_DOM_PATH),{window}=parseHTML('<html><body><div id="app"></div></body></html>');
 const storage=new Map(),animations=new Set();let hidden=false;
 const database=new DatabaseSync(':memory:');for(const file of ['0007_brown_hammerhead.sql','0008_round_the_santerians.sql'])database.exec(readFileSync('drizzle/'+file,'utf8'));
 const wrap=(sql,p)=>({async first(){return database.prepare(sql).get(...p)||null},async run(){return {meta:{changes:Number(database.prepare(sql).run(...p).changes)}}}});
 globalThis.__TEKAD_DB__={prepare(sql){return {bind(...p){return wrap(sql,p)},...wrap(sql,[])}}};globalThis.fetch=async(url,options)=>practice(new Request('https://test.local'+url,options));
 Object.assign(globalThis,{window,document:window.document,HTMLElement:window.HTMLElement,Event:window.Event,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},matchMedia:()=>({matches:false,addEventListener(){},removeEventListener(){}}),IS_REACT_ACT_ENVIRONMENT:true});
 Object.defineProperty(document,'hidden',{configurable:true,get:()=>hidden});
 window.HTMLElement.prototype.showModal=function(){this.open=true};window.HTMLElement.prototype.close=function(){this.open=false};
 window.HTMLElement.prototype.getBoundingClientRect=function(){
  const inHand=!!this.closest('.b2-hand'),i=this.parentElement?[...this.parentElement.children].indexOf(this):0;
  const x=(inHand?40:300)+Math.max(0,i)*48,y=inHand?600:280,width=this.matches('.b2-hand')?620:55,height=77;
  return{x,y,left:x,top:y,width,height,right:x+width,bottom:y+height,toJSON(){return this;}};
 };
 window.HTMLElement.prototype.animate=function(_frames,timing){const a={onfinish:null,cancel(){clearTimeout(this.timer);animations.delete(this)}};a.timer=setTimeout(()=>a.onfinish?.(),Number(timing.duration||0)+Number(timing.delay||0));animations.add(a);return a;};
 await build({entryPoints:[resolve('app/big-two/game.tsx')],outfile:resolve('.sites-runtime/big-two-soak.mjs'),bundle:true,format:'esm',platform:'node',jsx:'automatic',loader:{'.css':'empty'},plugins:[{name:'react-link',setup(b){b.onResolve({filter:/^react(\/.*)?$/},a=>({path:resolve('node_modules',a.path==='react/jsx-runtime'?'react/jsx-runtime.js':'react/index.js'),external:true}));b.onResolve({filter:/^next\/link$/},()=>({path:'link',namespace:'stub'}));b.onLoad({filter:/.*/,namespace:'stub'},()=>({contents:"import React from 'react';export default function Link(p){return React.createElement('a',p,p.children)}"}));}}]});
 const {default:Game}=await import(resolve('.sites-runtime/big-two-soak.mjs')),{createRoot}=await import('react-dom/client');
 const root=createRoot(document.getElementById('app'));
 const props=el=>el[Object.keys(el).find(k=>k.startsWith('__reactProps$'))];
 const click=async el=>{assert.ok(el);assert.ok(!el.disabled);await act(async()=>props(el).onClick());};
 const wait=async ms=>{for(let elapsed=0;elapsed<ms;elapsed+=40)await act(async()=>new Promise(r=>setTimeout(r,Math.min(40,ms-elapsed))));};
 const saved=()=>JSON.parse(storage.get('tekad-big-two-match-v1')).game;
 let paused=false,backgrounded=false,plays=0,reported=-1;
 try{
  await act(async()=>root.render(React.createElement(Game)));
  await wait(60);
  await click([...document.querySelectorAll('button')].find(b=>b.textContent.startsWith('Start Game')));await wait(60);
  assert.ok(document.querySelector('.b2-deal-overlay'));await wait(1500);assert.ok(!document.querySelector('.b2-deal-overlay'),'deal overlay finished');
  const started=Date.now();
  while(!document.querySelector('.b2-results')){
   assert.ok(Date.now()-started<260000,'round should complete within bounded test time');
   const current=saved();
   if(current.sequence!==reported&&current.sequence%10===0){reported=current.sequence;console.log(JSON.stringify({turn:reported,heapMB:Math.round(process.memoryUsage().heapUsed/1048576),liveAnimations:animations.size}));}
   if(current.winner!==null){await wait(2200);continue;}
   if(current.sequence>=4&&!paused){
    await click(document.querySelector('[aria-label="Informasi permainan"]'));const seq=saved().sequence;await wait(1400);assert.equal(saved().sequence,seq,'bots pause in menu');await click(document.querySelector('[aria-label="Tutup"]'));paused=true;
   }
   if(current.sequence>=8&&!backgrounded){
    await act(async()=>{hidden=true;document.dispatchEvent(new window.Event('visibilitychange'));});const seq=saved().sequence;await wait(1400);assert.equal(saved().sequence,seq,'bots pause while hidden');await act(async()=>{hidden=false;document.dispatchEvent(new window.Event('visibilitychange'));});backgrounded=true;
   }
   const cards=[...document.querySelectorAll('.b2-hand [data-card]')];
   if(cards.length&&!cards[0].disabled){
    const hand=cards.map(c=>Number(c.getAttribute('data-card'))),pile=[...document.querySelectorAll('.b2-table .b2-pile [data-card]')].map(c=>Number(c.getAttribute('data-card')));
    const table=pile.length?classify(pile):null,opening=saved().opening;
    const counts=[...document.querySelectorAll('.b2-opponent-info>span')].map(el=>parseInt(el.textContent,10));
    const chosen=chooseBotMove(hand,table,opening,counts);
    if(chosen.length){await act(async()=>{for(const c of chosen)props(document.querySelector(`.b2-hand [data-card="${c}"]`)).onClick();});}
    const button=document.querySelector(chosen.length?'.b2-play':'.b2-pass'),handler=props(button).onClick,seq=saved().sequence;
    await act(async()=>{handler();handler();});assert.equal(saved().sequence,seq+1,'double tap commits once');plays++;
   }else await wait(120);
  }
  assert.ok(paused&&backgrounded);assert.ok(plays>0);assert.ok(saved().winner!==null);assert.equal(document.querySelectorAll('.b2-results .b2-session-score li').length,4);assert.ok(!document.querySelector('.b2-cutin'),'result follows completed cut-in');
  const resultSequence=saved().sequence;
  await click([...document.querySelectorAll('.b2-results button')].find(el=>el.textContent.startsWith('Main lagi')));await wait(60);assert.equal(saved().sequence,0);assert.ok(!document.querySelector('.b2-results'),'old result closed');assert.ok(!document.querySelector('.b2-clearing-pile'),'old pile removed');assert.ok(document.querySelector('.b2-deal-overlay'));
  await click(document.querySelector('[aria-label="Kembali ke lobi"]'));await click([...document.querySelectorAll('.b2-leave button')].find(el=>el.textContent==='Ke lobi'));assert.ok(document.querySelector('.b2-lobby'));assert.equal(animations.size,0,'leaving cleans active animations');
  console.log(JSON.stringify({turns:resultSequence,ownActions:plays,menuPause:paused,hiddenPause:backgrounded,rematch:true}));
 }finally{await act(async()=>root.unmount());for(const a of animations)a.cancel();database.close();}
});
