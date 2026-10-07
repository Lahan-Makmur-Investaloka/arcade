import test from 'node:test';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {build} from 'esbuild';
import React,{act as reactAct} from 'react';
import {createGame,act,scores} from '../app/big-two/engine.ts';

// Bundle only the small policy module so production imports remain extensionless.
await build({entryPoints:[resolve('app/big-two/portrait/atmosphere.ts')],bundle:true,outfile:resolve('.sites-runtime/atmosphere-policy.mjs'),format:'esm',platform:'node'});
const {readPreferences,resultRows,moveSound}=await import(resolve('.sites-runtime/atmosphere-policy.mjs'));

test('portrait preferences are bounded and tolerate old or corrupted saves',()=>{
 assert.deepEqual(readPreferences(null),{sound:true,music:true,motion:true,effectsVolume:.65,musicVolume:.22});
 assert.deepEqual(readPreferences({sound:'yes',music:1,motion:false,effectsVolume:Infinity,musicVolume:-2}),{sound:true,music:true,motion:false,effectsVolume:.65,musicVolume:0});
 assert.equal(readPreferences({effectsVolume:9}).effectsVolume,1);
});
test('result rows use engine points, put winner first and preserve every seat',()=>{
 for(let winner=0;winner<4;winner++){
  const game=createGame(()=>.41);game.winner=winner;game.hands=Array.from({length:4},(_,seat)=>Array.from({length:seat===winner?0:[9,10,12,13][seat]},(_,i)=>i));
  const rows=resultRows(game);assert.equal(rows[0].seat,winner);assert.equal(rows.reduce((sum,r)=>sum+r.points,0),0);
  for(const row of rows)assert.equal(row.points,scores(game)[row.seat]);
 }
});
test('audio differentiates card actions without inventing an event on an empty history',()=>{
 const game=createGame(()=>.41);assert.equal(moveSound(game),null);
 const first=act(game,game.turn,[0]);assert.equal(moveSound(first),'play');
 assert.equal(moveSound(act(first,first.turn,[])),'pass');
 assert.equal(moveSound({...first,history:[{...first.history[0],cards:[0,4,8,12,16]}]}),'combo');
 assert.equal(moveSound({...first,winner:0}),'win');
});

test('portrait atmosphere: restore, muted history, final card, inspect result, reduced deal, pause and third pass',{skip:!process.env.BIG_TWO_DOM_PATH},async()=>{
 const {parseHTML}=await import(process.env.BIG_TWO_DOM_PATH);
 const {window}=parseHTML('<html><body><div id="app"></div></body></html>');
 const game=createGame(()=>.42);const seat=game.turn;game.hands=[...game.hands.slice(seat),...game.hands.slice(0,seat)];game.turn=0;
 const remaining=game.hands[0].filter(c=>c!==0);game.hands[0]=[0];game.played=remaining;game.opening=false;
 const store=new Map([['tekad-capsa-portrait-trial-v1',JSON.stringify(game)]]);
 const calls=[];globalThis.__portraitSoundCalls=calls;
 Object.assign(globalThis,{window,document:window.document,HTMLElement:window.HTMLElement,Event:window.Event,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},ResizeObserver:class{observe(){}disconnect(){}},Image:class{set src(v){queueMicrotask(()=>this.onload?.());}},IS_REACT_ACT_ENVIRONMENT:true});
 window.HTMLElement.prototype.showModal=function(){this.open=true;};window.HTMLElement.prototype.close=function(){this.open=false;};
 await build({entryPoints:[resolve('app/big-two/portrait/portrait-table.tsx')],bundle:true,outfile:resolve('.sites-runtime/atmosphere-dom-test.mjs'),format:'esm',platform:'node',jsx:'automatic',loader:{'.css':'empty'},plugins:[{name:'test-imports',setup(b){
  b.onResolve({filter:/^react(\/.*)?$/},a=>({path:resolve('node_modules',a.path==='react/jsx-runtime'?'react/jsx-runtime.js':'react/index.js'),external:true}));
  b.onResolve({filter:/^next\/link$/},()=>({path:'link',namespace:'stub'}));b.onLoad({filter:/^link$/,namespace:'stub'},()=>({contents:"import React from 'react';export default function Link(p){return React.createElement('a',p,p.children)}"}));
  b.onResolve({filter:/\/sound$/},()=>({path:'sound',namespace:'stub'}));b.onLoad({filter:/^sound$/,namespace:'stub'},()=>({contents:"export class CardSound {enabled=false;unlocked=false;configure(v){this.config=v;} unlock(){this.unlocked=true;} play(kind){if(this.enabled&&this.unlocked&&this.config?.visible)globalThis.__portraitSoundCalls.push(kind);} dispose(){globalThis.__portraitSoundCalls.push('disposed');}}"}));
 } }]});
 const {default:Table}=await import(resolve('.sites-runtime/atmosphere-dom-test.mjs'));const {createRoot}=await import('react-dom/client');
 let root=createRoot(document.getElementById('app'));
 const wait=async(ms=20)=>reactAct(async()=>{await new Promise(r=>setTimeout(r,ms));});
 const props=el=>el[Object.keys(el).find(k=>k.startsWith('__reactProps$'))];
 const click=async(el)=>{assert.ok(el);assert.ok(!el.disabled);await reactAct(async()=>props(el).onClick({preventDefault(){}}));};
 const button=name=>[...document.querySelectorAll('button')].find(b=>b.textContent===name||b.getAttribute('aria-label')===name);
 await reactAct(async()=>root.render(React.createElement(Table)));await wait();
 assert.equal(document.querySelector('.fp-dealing'),null,'restoring a hand must not deal again');assert.deepEqual(calls,[]);
 await click(button('Buka menu'));assert.ok(button('SuaraON'));await click(button('SuaraON'));await click(button('SuaraOFF'));await click(button('Tutup menu'));
 await click(document.querySelector('.fp-card-index [data-card="0"]'));await click(document.querySelector('.fp-banting'));
 assert.equal(document.querySelector('.fp-action-flair').dataset.action,'finish');
 assert.ok(!document.querySelector('.fp-round-result'),'result waits for release');await wait(700);
 assert.ok(document.querySelector('.fp-round-result').open);assert.equal(document.querySelectorAll('.wc-round-score tbody tr').length,4);assert.match(document.querySelector('.fp-round-result').textContent,/Menang!/);
 assert.equal(calls.filter(c=>c==='win').length,1,'one finish cue per live result');
 await click(button('Lihat meja'));assert.ok(!document.querySelector('.fp-round-result'));assert.ok(button('Lihat hasil ronde'));assert.equal(document.querySelectorAll('.fp-card-index button').length,0);
 await click(button('Lihat hasil ronde'));assert.ok(document.querySelector('.fp-round-result').open);assert.equal(calls.filter(c=>c==='win').length,1,'reopening results is silent');
 await reactAct(async()=>root.unmount());root=createRoot(document.getElementById('app'));const before=calls.length;
 await reactAct(async()=>root.render(React.createElement(Table)));await wait();assert.ok(document.querySelector('.fp-round-result').open);assert.equal(calls.length,before,'restored result has no historical fanfare');
 assert.equal(document.querySelector('.fp-action-flair'),null,'restored result does not replay its finishing cut-in');
 await click(button('Lihat meja'));await click(button('Buka menu'));await click(button('AnimasiON'));await click(button('Tutup menu'));await click(button('Lihat hasil ronde'));await click(button('Main lagi'));
 assert.ok(document.querySelector('.fp-dealing'));assert.ok(document.querySelector('.fp-still'));assert.ok(document.querySelector('.fp-banting').disabled);
 const saved=JSON.parse(store.get('tekad-capsa-portrait-trial-v1'));assert.equal(saved.hands.flat().length,52,'whole engine hand saved before visual delivery');
 await click(button('Buka menu'));await wait(260);assert.equal(document.querySelector('.fp-shell').dataset.dealCount,'0','paused reduced-motion deal stays put');
 await click(button('Tutup menu'));await wait(200);await wait(280);assert.ok(!document.querySelector('.fp-dealing'));assert.equal(document.querySelectorAll('.fp-card-index button').length,13);
 await reactAct(async()=>root.unmount());
 // Third pass: live cue must retain the outgoing pile until the reaction finishes.
 let passGame=createGame(()=>.42);const owner=passGame.turn;passGame.hands=[...passGame.hands.slice(owner),...passGame.hands.slice(0,owner)];passGame.turn=0;
 passGame=act(passGame,0,[0]);passGame=act(passGame,1,[]);passGame=act(passGame,2,[]);
 // Rotate seats so the user's pass is third and the original owner becomes seat 1.
 passGame={...passGame,hands:[passGame.hands[3],passGame.hands[0],passGame.hands[1],passGame.hands[2]],turn:0,owner:1,history:passGame.history.map(m=>({...m,seat:(m.seat+1)%4}))};
 store.set('tekad-capsa-portrait-trial-v1',JSON.stringify(passGame));root=createRoot(document.getElementById('app'));
 await reactAct(async()=>root.render(React.createElement(Table)));await wait();await click(button('Pass'));
 assert.ok(document.querySelector('.fp-clearing-pile'));assert.equal(JSON.parse(store.get('tekad-capsa-portrait-trial-v1')).table,null);await wait(700);
 assert.equal(document.querySelector('.fp-clearing-pile'),null);assert.match(document.querySelector('.fp-trick-open').textContent,/Tiga pass/);
 const seq=JSON.parse(store.get('tekad-capsa-portrait-trial-v1')).sequence;
 await reactAct(async()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
 await wait(1800);assert.equal(JSON.parse(store.get('tekad-capsa-portrait-trial-v1')).sequence,seq,'hidden tab never advances a bot');
 await reactAct(async()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));});
 await wait(1750);assert.equal(JSON.parse(store.get('tekad-capsa-portrait-trial-v1')).sequence,seq+1,'visible tab resumes exactly one bot turn');
 await reactAct(async()=>root.unmount());
 // A live five-card play uses the selected player's art and survives a motion
 // preference change without recreating the cut-in or detaching the thumb.
 const comboGame=createGame(()=>.42);const diamonds=Array.from({length:13},(_,i)=>i*4),rest=Array.from({length:52},(_,i)=>i).filter(c=>c%4!==0);
 comboGame.hands=[diamonds,rest.slice(0,13),rest.slice(13,26),rest.slice(26)];comboGame.turn=0;
 store.set('tekad-capsa-portrait-trial-v1',JSON.stringify(comboGame));store.set('tekad-capsa-portrait-player-v1','4');
 store.set('tekad-capsa-portrait-preferences-v2',JSON.stringify({sound:false,music:false,motion:true}));
 root=createRoot(document.getElementById('app'));await reactAct(async()=>root.render(React.createElement(Table)));await wait();
 const thumb=document.querySelector('.fp-grip-1.fp-thumb-front');
 for(const card of [0,4,8,12,16])await click(document.querySelector(`.fp-card-index [data-card="${card}"]`));
 await click(document.querySelector('.fp-banting'));
 const flair=document.querySelector('.fp-action-special');assert.ok(flair);assert.equal(flair.dataset.action,'straight-flush');assert.match(flair.querySelector('img').src,/dylan-cutin/);
 assert.equal(document.querySelectorAll('.fp-card-index button').length,8);assert.equal(document.querySelectorAll('.fp-pile .b2-card').length,5);
 await click(button('Buka menu'));await click(button('AnimasiON'));await wait(700);
 assert.equal(document.querySelector('.fp-action-special'),flair);assert.ok(document.querySelector('.fp-still'));assert.equal(document.querySelector('.fp-grip-1.fp-thumb-front'),thumb);
 await click(button('Tutup menu'));await wait(700);
 assert.equal(document.querySelector('.fp-action-flair'),null);assert.equal(document.querySelector('.fp-grip-1.fp-thumb-front'),thumb);assert.equal(thumb.style.visibility,'visible');
 await reactAct(async()=>root.unmount());root=createRoot(document.getElementById('app'));await reactAct(async()=>root.render(React.createElement(Table)));await wait();
 assert.equal(document.querySelector('.fp-action-flair'),null,'restored five-card table has no historical burst');assert.equal(document.querySelectorAll('.fp-pile .b2-card').length,5);
 await reactAct(async()=>root.unmount());
 // Kirana's preparation blocks bot actions; gifting survives refresh with 14 cards.
 const skillGame=createGame(()=>.42);const first=skillGame.turn;
 skillGame.hands=[...skillGame.hands.slice(first),...skillGame.hands.slice(0,first)];skillGame.turn=0;
 skillGame.kirana={phase:'choose',opening:null,gift:null,seen:null};
 store.set('tekad-capsa-portrait-trial-v1',JSON.stringify(skillGame));store.set('tekad-capsa-portrait-player-v1','2');
 root=createRoot(document.getElementById('app'));await reactAct(async()=>root.render(React.createElement(Table)));await wait();
 assert.ok(document.querySelector('.fp-skill-panel').open);assert.ok(document.querySelector('.fp-banting').disabled);
 await click([...document.querySelectorAll('.fp-skill-choice')].find(b=>b.textContent.includes('Lihat kartu tertinggi')));
 assert.equal(document.querySelectorAll('.fp-skill-reveal .b2-card').length,3);await click(button('Mulai ronde'));
 assert.equal(document.querySelector('.fp-skill-panel'),null);await click(document.querySelector('.fp-skill-trigger'));
 const giftCard=skillGame.hands[0].find(c=>c!==0);
 await click(document.querySelectorAll('.fp-skill-card-picker button')[skillGame.hands[0].indexOf(giftCard)]);
 await click(document.querySelectorAll('.fp-skill-targets button')[1]);await click(button('Berikan kartu'));
 let gifted=JSON.parse(store.get('tekad-capsa-portrait-trial-v1'));assert.equal(gifted.hands[2].length,14);assert.equal(gifted.hands[0].length,12);assert.ok(document.querySelector('.fp-skill-trigger').disabled);
 await reactAct(async()=>root.unmount());root=createRoot(document.getElementById('app'));await reactAct(async()=>root.render(React.createElement(Table)));await wait();
 assert.equal(document.querySelector('.fp-skill-panel'),null);assert.equal(document.querySelectorAll('.fp-card-index button').length,12);assert.ok(document.querySelector('.fp-skill-trigger').disabled);
 assert.equal(JSON.parse(store.get('tekad-capsa-portrait-trial-v1')).hands[2].length,14);
 await reactAct(async()=>root.unmount());delete globalThis.__portraitSoundCalls;
});
