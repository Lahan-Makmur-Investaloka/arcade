import test from 'node:test';
import assert from 'node:assert/strict';
import {stat} from 'node:fs/promises';
import {resolve} from 'node:path';
import {build} from 'esbuild';
import React,{act} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createGame,act as play,chooseBotMove,cardName} from '../app/big-two/engine.ts';

async function components(){
 await build({stdin:{contents:"export {default as Game} from './app/big-two/game.tsx';export {Card} from './app/big-two/card.tsx';export {CharacterArt} from './app/big-two/art.tsx';export {CutIn} from './app/big-two/cutin.tsx';",resolveDir:process.cwd(),loader:'tsx'},bundle:true,format:'esm',platform:'node',jsx:'automatic',outfile:resolve('.sites-runtime/big-two-art-test.mjs'),loader:{'.css':'empty'},plugins:[{name:'react-and-link',setup(b){b.onResolve({filter:/^react(\/.*)?$/},a=>({path:resolve('node_modules',a.path==='react/jsx-runtime'?'react/jsx-runtime.js':'react/index.js'),external:true}));b.onResolve({filter:/^next\/link$/},()=>({path:'link',namespace:'stub'}));b.onLoad({filter:/.*/,namespace:'stub'},()=>({contents:"import React from 'react';export default function Link(p){return React.createElement('a',p,p.children)}"}));}}]});
 return import(resolve('.sites-runtime/big-two-art-test.mjs'));
}
test('illustrated deck preserves all 52 accessible identities and only public court faces receive art',async()=>{
 const {Card}=await components();
 for(let id=0;id<52;id++){
  const html=renderToStaticMarkup(React.createElement(Card,{card:id,onClick(){}}));assert.ok(html.includes(`aria-label="${cardName(id)}"`));
  const r=Math.floor(id/4),court=r>=8&&r<=10;assert.equal(html.includes('b2-court-art'),court);assert.equal(html.includes('aria-pressed="false"'),true);
  if(!court){const expected=r<8?r+3:r===11?1:2;assert.equal((html.match(/class="[^"]*b2-body-pip/g)||[]).length,expected,`pip count for ${cardName(id)}`);assert.ok(!html.includes('b2-card-brand'));}
  if(r===11){assert.ok(html.includes(`/big-two/art/ace-${['diamond','club','heart','spade'][id%4]}.webp`));}
  if(court){const rank=['j','q','k'][r-8];assert.ok(html.includes(`/big-two/art/court-${rank}-engraved.webp`));assert.ok(html.includes('aria-hidden="true"'));}
 }
});
test('all five action/victory poses, responsive derivatives and deck assets are bundled',async()=>{
 const {CharacterArt}=await components();let total=0;
 for(const id of ['timmy','eldric','kirana','adelia','dylan'])for(const pose of ['play','win']){
  const html=renderToStaticMarkup(React.createElement(CharacterArt,{id,pose,portrait:true}));assert.ok(html.includes(`${id}-${pose}-240.webp 240w`));assert.ok(html.includes(`${id}-${pose}.webp 768w`));
  for(const suffix of ['', '-240','-480']){const file=await stat(`public/big-two/art/${id}-${pose}${suffix}.webp`);assert.ok(file.size>1000);total+=file.size;}
 }
 for(const id of ['court-j-engraved','court-q-engraved','court-k-engraved','deck-back','table-felt']){const file=await stat(`public/big-two/art/${id}.webp`);assert.ok(file.size>1000);total+=file.size;}
 for(const suffix of ['', '-240','-480'])assert.ok((await stat(`public/big-two/art/adelia-lobby${suffix}.webp`)).size>1000);
 assert.ok(total<4_500_000,`mobile artwork budget exceeded: ${total}`);
});
test('every character selector uses its own action pose and completed practice rounds show the matching victory art',{skip:!process.env.BIG_TWO_DOM_PATH},async()=>{
 const {parseHTML}=await import(process.env.BIG_TWO_DOM_PATH);const {window}=parseHTML('<html><body><div id="app"></div></body></html>'),storage=new Map();
 Object.assign(globalThis,{window,document:window.document,HTMLElement:window.HTMLElement,Event:window.Event,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},matchMedia:()=>({matches:true,addEventListener(){},removeEventListener(){}}),IS_REACT_ACT_ENVIRONMENT:true});
 window.HTMLElement.prototype.showModal=function(){this.open=true;};window.HTMLElement.prototype.close=function(){this.open=false;};
 const {createRoot}=await import('react-dom/client'),{Game}=await components();let root=createRoot(document.getElementById('app'));
 const props=el=>el[Object.keys(el).find(k=>k.startsWith('__reactProps$'))];
 const click=async(el)=>{assert.ok(el);await act(async()=>{props(el).onClick();await new Promise(r=>setTimeout(r,10));});};
 await act(async()=>root.render(React.createElement(Game)));
 for(const id of ['timmy','eldric','kirana','adelia','dylan']){
  const button=document.querySelector(`button[aria-label="Pilih ${id[0].toUpperCase()+id.slice(1)}"]`);await click(button);assert.equal(document.querySelector('.b2-selected-art').getAttribute('src'),`/big-two/art/${id}-${id==='adelia'?'lobby':'play'}.webp`);
  if(id==='adelia')assert.equal(button.querySelector('img').getAttribute('src'),'/big-two/adelia.webp','selector art is preserved');
 }
 await act(async()=>root.unmount());
 // Save a valid, engine-generated terminal match; render its result for all five cast rotations.
 let g=createGame();for(let i=0;g.winner===null&&i<600;i++){const s=g.turn;g=play(g,s,chooseBotMove(g.hands[s],g.table,g.opening,g.hands.filter((_,j)=>j!==s).map(h=>h.length)));}assert.notEqual(g.winner,null);
 const ids=['timmy','eldric','kirana','adelia','dylan'];
 for(let player=0;player<5;player++){
  storage.set('tekad-big-two-match-v1',JSON.stringify({game:g,player}));root=createRoot(document.getElementById('app'));await act(async()=>root.render(React.createElement(Game)));
  await click([...document.querySelectorAll('button')].find(b=>b.textContent.startsWith('Lanjutkan ronde')));await act(async()=>{await new Promise(r=>setTimeout(r,450));});
  assert.ok(document.querySelector('.b2-results').open);assert.equal(document.querySelector('.b2-result-art img').getAttribute('src'),`/big-two/art/${ids[(player+g.winner)%5]}-win.webp`);assert.equal(document.querySelectorAll('.b2-scoreboard>div').length,4);
  await act(async()=>root.unmount());
 }
});
test('all four ornate aces and all five complete closeup plates are present',async()=>{
 const {CutIn}=await components();let bytes=0;
 for(const suit of ['diamond','club','heart','spade']){const file=await stat(`public/big-two/art/ace-${suit}.webp`);assert.ok(file.size>1000);bytes+=file.size;}
 for(const id of ['timmy','eldric','kirana','adelia','dylan']){
  const html=renderToStaticMarkup(React.createElement(CutIn,{id,name:id,label:'Straight flush',seat:1}));
  assert.ok(html.includes(`${id}-cutin-480.webp 480w`));assert.ok(html.includes(`${id}-cutin.webp 960w`));assert.ok(html.includes('aria-hidden="true"'));
  for(const suffix of ['', '-480']){const file=await stat(`public/big-two/art/${id}-cutin${suffix}.webp`);assert.ok(file.size>1000);bytes+=file.size;}
 }
 assert.ok(bytes<1_500_000,`polish asset budget exceeded: ${bytes}`);
});
