import test from 'node:test';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {build} from 'esbuild';
import React,{act} from 'react';
import {createGame,act as play,legalPlays} from '../app/big-two/engine.ts';
import {isFreshMove,landingDelay,MOTION} from '../app/big-two/motion-policy.ts';

test('presentation policy ignores snapshots, duplicate responses, missed moves and other rooms',()=>{
 const stamp={round:'room:1',sequence:3};
 assert.equal(isFreshMove(null,stamp,true),false);
 assert.equal(isFreshMove(stamp,stamp,true),false);
 assert.equal(isFreshMove(stamp,{...stamp,sequence:4},true),true);
 assert.equal(isFreshMove(stamp,{...stamp,sequence:7},true),false);
 assert.equal(isFreshMove(stamp,{round:'room:2',sequence:4},true),false);
 assert.equal(isFreshMove(stamp,{...stamp,sequence:4},false),false);
 assert.equal(landingDelay(5),548);assert.ok(MOTION.result>landingDelay(5)+MOTION.cutin);
});

test('geometry-based presentation, cancellation, reconnect, reduced motion and table clear',{skip:!process.env.BIG_TWO_DOM_PATH},async()=>{
 const {parseHTML}=await import(process.env.BIG_TWO_DOM_PATH),{window}=parseHTML('<html><body><div id="app"></div></body></html>');
 Object.assign(globalThis,{window,document:window.document,HTMLElement:window.HTMLElement,Event:window.Event,IS_REACT_ACT_ENVIRONMENT:true});
 const animations=[];let viewportShift=0;
 window.HTMLElement.prototype.getBoundingClientRect=function(){
  let x=0,y=0,width=46,height=64;
  if(this.matches('.b2-hand')){x=40;y=600;width=620;height=70;}
  else if(this.matches('.b2-mini-hand')){const seat=Number(this.parentElement.className.match(/seat-(\d)/)[1]);x=[0,50,340,620][seat];y=100;width=50;height=28;}
  else if(this.matches('.b2-deck')){x=330;y=280;}
  else if(this.matches('.b2-pile')){x=300;y=280;width=this.children.length*60;height=77;}
  else if(this.matches('[data-card]')){const index=[...this.parentElement.children].indexOf(this);const hand=this.parentElement.matches('.b2-hand');x=(hand?40:300)+index*(hand?48:60);y=hand?600:280;width=hand?44:55;height=hand?62:77;}
  x+=viewportShift;return {x,y,left:x,top:y,width,height,right:x+width,bottom:y+height,toJSON(){return this;}};
 };
 window.HTMLElement.prototype.animate=function(frames,timing){const a={el:this,frames,timing,cancelled:false,onfinish:null,cancel(){this.cancelled=true;clearTimeout(this.timer)}};a.timer=setTimeout(()=>a.onfinish?.(),Number(timing.duration||0)+Number(timing.delay||0));animations.push(a);return a;};
 await build({stdin:{contents:`import React from 'react';import {useTableMotion} from './app/big-two/use-table-motion';export function Harness(props){const stage=useTableMotion({...props,handKey:props.game.hands[0].join(',')});return <main ref={stage.root}><div className="b2-opponents">{[1,2,3].map(n=><div className={'b2-seat-'+n} key={n}><div className="b2-mini-hand"/><div className="b2-opponent-status"/></div>)}</div><div className="b2-table"><div className="b2-table-play">{props.game.table&&<div className="b2-pile">{props.game.table.cards.map(c=><div className="b2-card" data-card={c} key={c}/>)}</div>}</div>{props.dealing&&<><div className="b2-deck"/><div className="b2-deal-flight">{Array.from({length:16},(_,i)=><i key={i}/>)}</div></>}</div><div className="b2-turn-banner"/><div className="b2-hand">{props.game.hands[0].map(c=><button data-card={c} key={c}/>)}</div><button className="b2-pass"/></main>}`,resolveDir:process.cwd(),loader:'tsx'},outfile:resolve('.sites-runtime/big-two-motion-test.mjs'),bundle:true,format:'esm',platform:'node',jsx:'automatic',plugins:[{name:'react',setup(b){b.onResolve({filter:/^react(\/.*)?$/},a=>({path:resolve('node_modules',a.path==='react/jsx-runtime'?'react/jsx-runtime.js':'react/index.js'),external:true}));}}]});
 const {Harness}=await import(resolve('.sites-runtime/big-two-motion-test.mjs')),{createRoot}=await import('react-dom/client');
 const root=createRoot(document.getElementById('app')),landed=[];let starts=0,deals=0;
 let game=createGame(()=>.42);game={...game,hands:Array.from({length:4},(_,i)=>game.hands[(game.turn+i)%4]),turn:0};
 let props={game,round:'practice',enabled:true,visible:true,paused:false,dealing:false,onStart(){starts++},onLand(...args){landed.push(args)},onDeal(){deals++}};
 const render=async(change={})=>{props={...props,...change};await act(async()=>root.render(React.createElement(Harness,props)));};
 const settle=async(ms=580)=>{await act(async()=>new Promise(r=>setTimeout(r,ms)));};
 const next=g=>play(g,g.turn,legalPlays(g.hands[g.turn],g.table,g.opening)[0]?.cards??[]);
 try{
  await render();assert.equal(animations.length,0);assert.equal(landed.length,0);
  game=play(game,0,[0]);await render({game});
  const fly=animations.find(a=>a.el.matches('.b2-pile [data-card="0"]'));assert.ok(fly);assert.match(fly.frames[0].transform,/translate\(-260px,320px\)/);assert.equal(landed.length,0,'cue waits for arrival');
  game={...game,hands:game.hands.map((h,i)=>i===0?[...h].reverse():h)};await render({game});assert.equal(fly.cancelled,false,'sorting the hand preserves an in-flight table action');
  await settle();assert.equal(landed.length,1);assert.equal(landed[0][0].cards[0],0);assert.equal(document.querySelectorAll('[data-flight]').length,0);
  const count=animations.length;await render({game:{...game}});assert.equal(animations.length,count);assert.equal(landed.length,1,'duplicate response is silent');
  game=next(game);await render({game});await render({enabled:false});await settle();assert.equal(landed.length,1,'turning effects off cancels pending visual cue');assert.ok(animations.every(a=>a.cancelled));
  game=next(game);await render({game});assert.equal(landed.length,2,'sound/event still works with reduced motion');
  await render({enabled:true,visible:false});game=next(game);await render({game});const hidden=landed.length;await render({visible:true});assert.equal(landed.length,hidden,'return does not replay hidden actions');
  const beforeJump=animations.length;game=next(next(next(game)));await render({game});assert.equal(landed.length,hidden);assert.equal(animations.length,beforeJump,'reconnect snapshots do not animate old moves or hands');
  await render({paused:true});game=next(game);await render({game});await render({paused:false});assert.equal(landed.length,hidden,'closing a menu does not replay remote moves');
  await render({paused:true});game=next(game);await render({game,paused:false});assert.equal(landed.length,hidden,'a single move received at reconnect is still a snapshot');
  game=next(game);await render({game});window.dispatchEvent(new window.Event('resize'));await settle();assert.equal(document.querySelectorAll('[data-flight]').length,0);assert.ok(animations.every(a=>a.cancelled));
  let fresh=createGame(()=>.42);fresh=play(fresh,fresh.turn,[0]);await render({game:fresh,round:'clear-test'});
  for(let n=0;n<3;n++){if(n===2){viewportShift=80;window.dispatchEvent(new window.Event('resize'));}fresh=play(fresh,fresh.turn,[]);await render({game:fresh});}
  const ghost=document.querySelector('.b2-clearing-pile');assert.ok(ghost,'third pass sweeps old public table');assert.equal(ghost.style.left,'380px','clearing uses the resized table position');assert.equal(ghost.getAttribute('aria-hidden'),'true');assert.equal(ghost.querySelectorAll('button').length,0);assert.equal(fresh.table,null);
  window.dispatchEvent(new window.Event('scroll'));assert.equal(document.querySelector('.b2-clearing-pile'),null);
  fresh=createGame(()=>.42);const beforeDeal=animations.length;await render({game:fresh,round:'deal-test',dealing:true});assert.equal(deals,1);assert.equal(animations.slice(beforeDeal).filter(a=>a.el.matches('.b2-deal-flight i')).length,16);assert.equal(document.querySelectorAll('.b2-deal-flight [data-card]').length,0,'backs never contain hidden card identities');
  await render({visible:false});assert.ok(animations.every(a=>a.cancelled));
 }finally{await act(async()=>root.unmount());for(const a of animations)a.cancel();}
});
