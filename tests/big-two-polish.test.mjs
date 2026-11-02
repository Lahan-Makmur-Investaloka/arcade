// Interaction audit for the new controls/cut-ins; this is not a visual browser test.
import test from 'node:test';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {build} from 'esbuild';
import React,{act} from 'react';
import {createGame,legalPlays,act as play,cardName,scores} from '../app/big-two/engine.ts';

test('five cast rotations: select, cancel, play five cards, show correct closeup, disable effects',{skip:!process.env.BIG_TWO_DOM_PATH},async()=>{
 const {parseHTML}=await import(process.env.BIG_TWO_DOM_PATH),{window}=parseHTML('<html><body><div id="app"></div></body></html>');
 const storage=new Map();Object.assign(globalThis,{window,document:window.document,HTMLElement:window.HTMLElement,Event:window.Event,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},matchMedia:()=>({matches:false,addEventListener(){},removeEventListener(){}}),IS_REACT_ACT_ENVIRONMENT:true});
 window.HTMLElement.prototype.getBoundingClientRect=function(){const hand=!!this.closest('.b2-hand'),index=this.parentElement?[...this.parentElement.children].indexOf(this):0;return{left:40+Math.max(0,index)*55,top:hand?600:250,width:this.matches('.b2-hand')?620:55,height:77};};
 const animations=new Set();window.HTMLElement.prototype.animate=function(frames,timing){const a={onfinish:null,cancel(){clearTimeout(this.timer);animations.delete(this)}};a.timer=setTimeout(()=>a.onfinish?.(),Number(timing.duration||0)+Number(timing.delay||0));animations.add(a);return a;};
 window.HTMLElement.prototype.showModal=function(){this.open=true};window.HTMLElement.prototype.close=function(){this.open=false};
 await build({entryPoints:[resolve('app/big-two/game.tsx')],outfile:resolve('.sites-runtime/big-two-polish-test.mjs'),bundle:true,format:'esm',platform:'node',jsx:'automatic',loader:{'.css':'empty'},plugins:[{name:'test-react',setup(b){b.onResolve({filter:/^react(\/.*)?$/},a=>({path:resolve('node_modules',a.path==='react/jsx-runtime'?'react/jsx-runtime.js':'react/index.js'),external:true}));b.onResolve({filter:/^next\/link$/},()=>({path:'link',namespace:'stub'}));b.onLoad({filter:/.*/,namespace:'stub'},()=>({contents:"import React from 'react';export default function Link(p){return React.createElement('a',p,p.children)}"}));}}]});
 const {default:Game}=await import(resolve('.sites-runtime/big-two-polish-test.mjs')),{createRoot}=await import('react-dom/client');
 let seed=42;const random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
 let fixture=null,combination=null;
 for(let attempt=0;attempt<12&&!fixture;attempt++){
  let game=createGame(random);
  for(let turn=0;turn<150&&game.winner===null;turn++){
   const choices=legalPlays(game.hands[game.turn],game.table,game.opening),five=choices.find(m=>m.cards.length===5);
   if(five&&game.sequence>0){fixture=game;combination=five.cards;break;}
   game=play(game,game.turn,choices[0]?.cards??[]);
  }
 }
 assert.ok(fixture&&combination,'valid live five-card fixture');
 const ids=['timmy','eldric','kirana','adelia','dylan'];
 const props=el=>el[Object.keys(el).find(k=>k.startsWith('__reactProps$'))];
 const click=async(el)=>{assert.ok(el);assert.ok(!el.disabled);await act(async()=>{props(el).onClick();await new Promise(r=>setTimeout(r,15));});};
 for(let character=0;character<5;character++){
  storage.clear();let g=fixture,revision=1;const you=g.turn,root=createRoot(document.getElementById('app'));let sends=0;
  const view=()=>({code:'TESTAB',revision,you,host:you,phase:'playing',round:1,expiresAt:Date.now()+3600000,serverTime:Date.now(),message:'',players:Array.from({length:4},(_,seat)=>({name:`Player ${seat}`,character:(character+seat-you+5)%5,ready:true,connected:true,lastSeen:Date.now(),total:0})),game:{hand:g.hands[you],counts:g.hands.map(h=>h.length),turn:g.turn,table:g.table,owner:g.owner,passes:g.passes,opening:g.opening,winner:g.winner,history:g.history,sequence:g.sequence,trick:g.trick,score:scores(g)}});
  const render=()=>root.render(React.createElement(Game,{online:{view:view(),pending:false,connected:true,onExit(){},async onAction(type,extra){assert.equal(type,'play');sends++;g=play(g,you,extra.cards);revision++;render();}}}));
  await act(async()=>render());
  const playButton=()=>document.querySelector('.b2-play');assert.ok(playButton().disabled);
  await click(document.querySelector(`button[aria-label="${cardName(combination[0])}"]`));
  assert.equal(document.querySelectorAll('.b2-hand [aria-pressed="true"]').length,1);
  await click(document.querySelector('[aria-label="Batalkan pilihan"]'));
  assert.equal(document.querySelectorAll('.b2-hand [aria-pressed="true"]').length,0);assert.ok(playButton().disabled);
  for(const card of combination)await click(document.querySelector(`button[aria-label="${cardName(card)}"]`));
  assert.equal(playButton().getAttribute('aria-label'),'Banting 5 kartu');assert.ok(!playButton().disabled);
  await click(playButton());assert.equal(sends,1);assert.equal(document.querySelectorAll('.b2-hand .b2-card').length,fixture.hands[you].length-5);
  assert.equal(document.querySelector('.b2-cutin-face'),null,'cut-in waits for the cards to land');
  await act(async()=>new Promise(r=>setTimeout(r,580)));
  const image=document.querySelector('.b2-cutin-face');assert.ok(image,`visible closeup for ${ids[character]}`);assert.equal(image.getAttribute('src'),`/big-two/art/${ids[character]}-cutin.webp`);
  assert.ok(document.querySelector('.b2-clear').disabled);
  await click(document.querySelector('[aria-label="Pengaturan"]'));
  await click([...document.querySelectorAll('[role="switch"]')].find(el=>el.textContent.includes('Animasi')));
  assert.equal(document.querySelector('.b2-cutin-face'),null,'effects OFF removes the new closeup');
  const music=[...document.querySelectorAll('[role="switch"]')].find(el=>el.textContent.includes('Musik meja'));
  await click(music);assert.equal(music.getAttribute('aria-checked'),'true');assert.equal(document.querySelector('[aria-label="Matikan suara"]').getAttribute('aria-pressed'),'true');
  await act(async()=>{props(document.getElementById('b2-effects-volume')).onChange({target:{value:'35'}});props(document.getElementById('b2-music-volume')).onChange({target:{value:'20'}});});
  const prefs=JSON.parse(storage.get('tekad-big-two-preferences-v1'));assert.equal(prefs.music,true);assert.equal(prefs.effectsVolume,.35);assert.equal(prefs.musicVolume,.2);
  await click([...document.querySelectorAll('[role="switch"]')].find(el=>el.textContent.startsWith('Suara')));assert.equal(document.getElementById('b2-effects-volume').disabled,true);assert.equal(document.getElementById('b2-music-volume').disabled,true);
  await act(async()=>root.unmount());assert.equal(animations.size,0,'all animations are released on unmount');
 }
});
