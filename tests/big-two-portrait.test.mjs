import test from 'node:test';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {build} from 'esbuild';
import React,{act as reactAct} from 'react';
import {createGame,act,chooseBotMove,restoreGame} from '../app/big-two/engine.ts';
import {moodFor,poseFor} from '../app/big-two/portrait/expressions.ts';
import {handLayout,nearestCard} from '../app/big-two/portrait/hand-layout.ts';
import {CHARACTERS,tableCast,playerIndex} from '../app/big-two/portrait/characters.ts';

test('each playable character has three different opponents and valid persisted identity',()=>{
 for(let i=0;i<5;i++){const cast=tableCast(i);assert.equal(cast[0],CHARACTERS[i]);assert.equal(new Set(cast.map(c=>c.id)).size,4);}
 assert.deepEqual(tableCast(0).map(c=>c.id),['timmy','eldric','kirana','adelia']);
 for(const value of [-1,5,1.5,'4',null])assert.equal(playerIndex(value),0);
});

test('portrait mood switches at three, including simultaneous confident players',()=>{
 assert.deepEqual([0,1,2,3].map(i=>moodFor([13,9,4,5],i)),['normal','normal','normal','normal']);
 assert.deepEqual([0,1,2,3].map(i=>moodFor([3,3,4,8],i)),['smug','smug','anxious','anxious']);
 assert.equal(moodFor([1,7,2,4],2),'smug');
 assert.equal(moodFor([0,7,8,4],1),'normal');
});

test('choosing and action poses override anxious and smug resting expressions',()=>{
 for(const counts of [[3,9,8,7],[9,3,8,7]]){
  assert.equal(poseFor({counts,seat:1,choosing:true}),'choose');
  assert.equal(poseFor({counts,seat:1,choosing:true,action:'play'}),'play');
  assert.equal(poseFor({counts,seat:1,choosing:true,action:'pass'}),'pass');
  assert.equal(poseFor({counts,seat:1}),counts[1]<=3?'smug':'anxious');
 }
});

test('all card corners fit portrait widths while each fan retains its grip pivot',()=>{
 const hand=Array.from({length:13},(_,i)=>i);
 for(const width of [320,360,375,390,430,460])for(let total=1;total<=13;total++)for(let n=0;n<=Math.min(5,total);n++){
  const cards=hand.slice(0,total),chosen=cards.slice(0,n),layout=handLayout(width,cards,chosen,false,136);
  assert.equal(layout.cards.length,total);
  for(const c of layout.cards){
   const angle=c.angle*Math.PI/180;
   for(const [x,y] of [[-c.width/2,0],[c.width/2,0],[-c.width/2,-c.height],[c.width/2,-c.height]]){
    const projectedX=c.x+x*Math.cos(angle)-y*Math.sin(angle);
    assert.ok(projectedX>=4&&projectedX<=width-4,`${width}px / ${total} cards / ${n} chosen / ${projectedX}`);
   }
   assert.ok(c.y<=120,'compact screens keep pivot above controls');
  }
  const leftPivots=layout.cards.filter(c=>!c.selected).map(c=>`${c.x}:${c.y}`);
  const rightPivots=layout.cards.filter(c=>c.selected).map(c=>`${c.x}:${c.y}`);
  assert.ok(new Set(leftPivots).size<=1);assert.ok(new Set(rightPivots).size<=1);
 }
});

test('both hands remain empty after the last card is played',()=>{
 for(const playing of [true,false]){
  const layout=handLayout(320,[],[],playing,136);
  assert.equal(layout.cards.length,0);
  assert.deepEqual(layout.hands.map(h=>h.column),[2,2]);
 }
});

test('touch targeting resolves every exposed index across fan sizes',()=>{
 for(const width of [320,390,460])for(const n of [0,1,5]){
  const hand=Array.from({length:13},(_,i)=>i),layout=handLayout(width,hand,hand.slice(0,n));
  for(const c of layout.cards){const a=c.angle*Math.PI/180,u=-c.width*.40,v=-c.height+15;
   const x=c.x+u*Math.cos(a)-v*Math.sin(a),y=c.y+u*Math.sin(a)+v*Math.cos(a);
   assert.equal(nearestCard(layout.cards,x,y),c.card);
  }
  assert.equal(nearestCard(layout.cards,-200,-200),null);
 }
});

test('portrait interaction: split hand, cancel, legal play, compact paused menu and persistent player identity',{skip:!process.env.BIG_TWO_DOM_PATH},async()=>{
 const {parseHTML}=await import(process.env.BIG_TWO_DOM_PATH);
 const {window}=parseHTML('<html><body><div id="app"></div></body></html>');
 let game=createGame(()=>.42);const first=game.turn;game={...game,hands:[...game.hands.slice(first),...game.hands.slice(0,first)],turn:0};
 const store=new Map([['tekad-capsa-portrait-trial-v1',JSON.stringify(game)]]);
 Object.assign(globalThis,{window,document:window.document,HTMLElement:window.HTMLElement,Event:window.Event,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},ResizeObserver:class{observe(){}disconnect(){}},Image:class{set src(v){queueMicrotask(()=>this.onload?.());}},IS_REACT_ACT_ENVIRONMENT:true});
 window.HTMLElement.prototype.showModal=function(){this.open=true;};window.HTMLElement.prototype.close=function(){this.open=false;};
 await build({entryPoints:[resolve('app/big-two/portrait/portrait-table.tsx')],bundle:true,outfile:resolve('.sites-runtime/portrait-test.mjs'),format:'esm',platform:'node',jsx:'automatic',loader:{'.css':'empty'},plugins:[{name:'test-imports',setup(b){b.onResolve({filter:/^react(\/.*)?$/},args=>({path:resolve('node_modules',args.path==='react/jsx-runtime'?'react/jsx-runtime.js':'react/index.js'),external:true}));b.onResolve({filter:/^next\/link$/},()=>({path:'link',namespace:'stub'}));b.onLoad({filter:/.*/,namespace:'stub'},()=>({contents:"import React from 'react';export default function Link(p){return React.createElement('a',p,p.children)}"}));}}]});
 const {default:Table}=await import(resolve('.sites-runtime/portrait-test.mjs'));const {createRoot}=await import('react-dom/client');
 const root=createRoot(document.getElementById('app'));
 const wait=async(ms=20)=>reactAct(async()=>{await new Promise(r=>setTimeout(r,ms));});
 const props=el=>el[Object.keys(el).find(k=>k.startsWith('__reactProps$'))];
 const click=async(el)=>{assert.ok(el);assert.ok(!el.disabled);await reactAct(async()=>{props(el).onClick({preventDefault(){}});});};
 const button=name=>[...document.querySelectorAll('button')].find(b=>b.textContent===name||b.getAttribute('aria-label')===name);
 await reactAct(async()=>root.render(React.createElement(Table)));await wait();
 assert.equal(document.querySelector('.fp-action-flair'),null,'restored state never invents a live visual reaction');
 assert.equal(document.querySelectorAll('.fp-fan .b2-card').length,13);
 await click(document.querySelector('.fp-card-index [data-card="0"]'));assert.equal(document.querySelectorAll('.fp-card-slot.picked').length,1);assert.ok(document.querySelector('.fp-split'));
 await click(button('Batal'));assert.equal(document.querySelectorAll('.picked').length,0);
 const surface=()=>document.querySelector('.fp-fan');
 const pointer={button:0,pointerId:1,clientX:0,clientY:0,preventDefault(){},target:{closest:()=>({dataset:{card:'0'}})},currentTarget:{setPointerCapture(){},getBoundingClientRect:()=>({left:0,top:0})}};
 await reactAct(async()=>props(surface()).onPointerDown(pointer));assert.ok(document.querySelector('.fp-touch-preview'));
 await reactAct(async()=>props(surface()).onPointerUp(pointer));
 await click(document.querySelector('.fp-card-index [data-card="0"]'));
 assert.equal(document.querySelectorAll('.picked').length,1,'pointer release selects once; compatibility click does not toggle it off');
 await click(button('Batal'));await wait(520);
 await reactAct(async()=>props(surface()).onPointerDown(pointer));
 await reactAct(async()=>props(surface()).onPointerCancel());
 assert.equal(document.querySelectorAll('.picked').length,0,'cancelled gesture does not choose a card');
 assert.equal(document.querySelectorAll('.fp-touch-preview').length,0);

 const rightThumb=document.querySelector('.fp-grip-1.fp-thumb-front');
 const rightPalm=document.querySelector('.fp-grip-1.fp-hand-behind');
 await click(document.querySelector('.fp-card-index [data-card="0"]'));await click(document.querySelector('.fp-banting'));
 const actionFlair=document.querySelector('.fp-action-flair');
 assert.equal(actionFlair.dataset.action,'single');assert.equal(actionFlair.getAttribute('aria-hidden'),'true','decoration does not duplicate live turn announcements');
 assert.equal(document.querySelector('.fp-grip-1.fp-thumb-front'),rightThumb,'release keeps the thumb mounted on the same animation timeline');
 assert.equal(rightThumb.style.visibility,'hidden','open release pose hides the foreground thumb');
 for(const key of ['left','top','width','height','backgroundPosition'])assert.equal(rightThumb.style[key],rightPalm.style[key]);
 assert.equal(document.querySelectorAll('.fp-fan .b2-card').length,12);assert.equal(document.querySelectorAll('.fp-pile .b2-card').length,1);
 assert.equal(restoreGame(JSON.parse(store.get('tekad-capsa-portrait-trial-v1'))).sequence,1);
 await click(button('Buka menu'));await wait(1700);assert.equal(JSON.parse(store.get('tekad-capsa-portrait-trial-v1')).sequence,1,'menu freezes bot and reaction');
 assert.equal(document.querySelector('.fp-player-picker'),null);
 assert.equal(button('Lihat ekspresi karakter'),undefined);
 assert.equal(document.querySelector('.fp-action-flair'),actionFlair);
 await click(button('Lanjut bermain'));await wait(700);
 assert.equal(document.querySelector('.fp-action-flair'),null,'action decoration leaves with the release reaction');
 assert.equal(document.querySelector('.fp-grip-1.fp-thumb-front'),rightThumb,'return reuses the thumb so its position transitions with the palm');
 assert.equal(rightThumb.style.visibility,'visible');
 for(const key of ['left','top','width','height','backgroundPosition'])assert.equal(rightThumb.style[key],rightPalm.style[key]);
 await wait(1900);
 assert.equal(JSON.parse(store.get('tekad-capsa-portrait-trial-v1')).sequence,2,'one bot turn after resume');
 await reactAct(async()=>root.unmount());
 const restoredRoot=createRoot(document.getElementById('app'));
 await reactAct(async()=>restoredRoot.render(React.createElement(Table)));await wait();
 assert.equal(document.querySelector('.fp-hands').dataset.player,'timmy','player identity survives reload');
 assert.ok(document.querySelector('.fp-grip-art').style.backgroundImage.includes('hands-v3.webp'));
 assert.equal(document.querySelectorAll('.fp-seat').length,4);
 await reactAct(async()=>restoredRoot.unmount());
 // An old Skill URL cannot activate provisional skills or bypass Classic recovery.
 window.location={search:'?mode=skill&character=dylan',pathname:'/big-two/portrait'};
 const legacyRoot=createRoot(document.getElementById('app'));
 await reactAct(async()=>legacyRoot.render(React.createElement(Table)));await wait();
 assert.equal(document.querySelector('.fp-hands').dataset.player,'timmy');
 assert.equal(button('Buka skill karakter'),undefined);
 assert.match(document.querySelector('.fp-header').textContent,/CLASSIC/);
 await reactAct(async()=>legacyRoot.unmount());
 // Fresh entry uses the chosen character, removes the one-shot flag, then resumes on reload.
 window.location.search='?character=dylan&start=1';
 window.history={replaceState(_state,_title,url){window.location.search=url.slice(url.indexOf('?'));}};
 const freshRoot=createRoot(document.getElementById('app'));
 await reactAct(async()=>freshRoot.render(React.createElement(Table)));await wait();
 assert.equal(document.querySelector('.fp-hands').dataset.player,'dylan');
 assert.equal(new URLSearchParams(window.location.search).has('start'),false);
 const freshSave=store.get('tekad-capsa-portrait-trial-v1');
 assert.equal(JSON.parse(freshSave).sequence,0);
 assert.equal(store.get('tekad-capsa-portrait-player-v1'),'4');
 await reactAct(async()=>freshRoot.unmount());
 const reloadRoot=createRoot(document.getElementById('app'));
 await reactAct(async()=>reloadRoot.render(React.createElement(Table)));await wait();
 assert.equal(document.querySelector('.fp-hands').dataset.player,'dylan');
 assert.equal(store.get('tekad-capsa-portrait-trial-v1'),freshSave);
 assert.equal(document.querySelector('.fp-dealing'),null,'refresh does not redeal a saved round');
 await reactAct(async()=>reloadRoot.unmount());
});
