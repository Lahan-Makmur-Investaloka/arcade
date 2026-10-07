// Four React room clients + the actual API over SQLite. DOM/transport simulation, not browser QA.
import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {build} from 'esbuild';
import React,{act} from 'react';
import {POST} from '../app/api/big-two/route.ts';
import {chooseBotMove} from '../app/big-two/engine.ts';

test('four UI clients: completed round, lost play response, refresh, host recovery and rematch',{skip:!process.env.BIG_TWO_DOM_PATH,timeout:900000},async()=>{
 const {parseHTML}=await import(process.env.BIG_TWO_DOM_PATH),{window}=parseHTML('<html><body><div id="c0"></div><div id="c1"></div><div id="c2"></div><div id="c3"></div></body></html>');
 const storage=new Map();Object.assign(globalThis,{window,document:window.document,HTMLElement:window.HTMLElement,Event:window.Event,location:new URL('https://test.local/big-two'),localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},matchMedia:()=>({matches:true,addEventListener(){},removeEventListener(){}}),IS_REACT_ACT_ENVIRONMENT:true});
 window.HTMLElement.prototype.showModal=function(){this.open=true;this.setAttribute('open','');};window.HTMLElement.prototype.close=function(){this.open=false;this.removeAttribute('open');};
 const database=new DatabaseSync(':memory:');database.exec(readFileSync('drizzle/0007_brown_hammerhead.sql','utf8'));
 const wrap=(sql,p)=>({async first(){return database.prepare(sql).get(...p)||null},async run(){return{meta:{changes:Number(database.prepare(sql).run(...p).changes)}}}});
 globalThis.__TEKAD_DB__={prepare(sql){return{bind(...p){return wrap(sql,p)},...wrap(sql,[])}}};
 const keys=['a','b','c','d'].map(x=>x.repeat(64)),bodies=[];let lostToken=null,lost=false,failSync=false,forbidReady=true;
 const send=async b=>POST(new Request('https://test.local/api/big-two',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://test.local'},body:JSON.stringify(b)}));
 globalThis.fetch=async(_url,options)=>{const b=JSON.parse(options.body);bodies.push(b);if(failSync&&b.type==='sync')return Response.json({error:'Layanan sedang tidak tersedia.'},{status:503});if(forbidReady&&b.type==='ready'){forbidReady=false;const r=await send({type:'sync',code:b.code,token:b.token});const data=await r.json();return Response.json({...data,error:'Aksi ditolak; kursi tetap tersedia.'},{status:403});}const r=await send(b);if(b.type==='play'&&b.token===lostToken&&!lost){lost=true;return Response.json({error:'response lost after commit'},{status:503});}return r;};
 const api=async b=>{const r=await send({requestId:crypto.randomUUID(),...b});const data=await r.json();assert.equal(r.status,200,JSON.stringify(data));return data.room;};
 const created=await api({type:'create',token:keys[0],name:'ABCDEFGHIJKLMNOPQRST',character:0}),code=created.code;
 for(let i=1;i<4;i++)await api({type:'join',code,token:keys[i],name:`Friend ${i}`,character:i});
 await build({entryPoints:[resolve('app/big-two/multiplayer.tsx')],bundle:true,outfile:resolve('.sites-runtime/big-two-stage4.mjs'),format:'esm',platform:'node',jsx:'automatic',loader:{'.css':'empty'},plugins:[{name:'test-react',setup(b){b.onResolve({filter:/^react(\/.*)?$/},a=>({path:resolve('node_modules',a.path==='react/jsx-runtime'?'react/jsx-runtime.js':'react/index.js'),external:true}));b.onResolve({filter:/^next\/link$/},()=>({path:'link',namespace:'stub'}));b.onLoad({filter:/.*/,namespace:'stub'},()=>({contents:"import React from 'react';export default function Link(p){return React.createElement('a',p,p.children)}"}));}}]});
 const {default:Multiplayer}=await import(resolve('.sites-runtime/big-two-stage4.mjs')),{createRoot}=await import('react-dom/client');
 const roots=[],containers=keys.map((_,i)=>document.getElementById(`c${i}`));
 const props=e=>e[Object.keys(e).find(k=>k.startsWith('__reactProps$'))];
 const button=(i,text)=>[...containers[i].querySelectorAll('button')].find(b=>b.textContent.trim().startsWith(text));
 const wait=async ms=>{for(let n=0;n<ms;n+=20)await act(async()=>new Promise(r=>setTimeout(r,Math.min(20,ms-n))));};
 const click=async e=>{assert.ok(e,'control exists');assert.ok(!e.disabled,`enabled: ${e.textContent}`);await act(async()=>{props(e).onClick({preventDefault(){}});await new Promise(r=>setTimeout(r,10));});};
 const sync=async()=>{if(process.env.BIG_TWO_REAL_POLL){await wait(1600);return;}await act(async()=>{window.dispatchEvent(new window.Event('online'));await new Promise(r=>setTimeout(r,25));});};
 const mount=async i=>{storage.set('tekad-big-two-room-v1',JSON.stringify({token:keys[i],code,requestId:crypto.randomUUID(),name:i?`Friend ${i}`:'ABCDEFGHIJKLMNOPQRST',character:i,operation:i?'join':'create',joined:true}));roots[i]=createRoot(containers[i]);await act(async()=>{roots[i].render(React.createElement(Multiplayer,{onBack(){roots[i].unmount();roots[i]=null;}}));await new Promise(r=>setTimeout(r,10));});await wait(20);};
 let turns=0,refreshed=false,totals;const rounds=process.env.BIG_TWO_ENDURANCE?4:1;let expectedTotals=[0,0,0,0];
 try{
  for(let i=0;i<4;i++)await mount(i);
  await click(containers[0].querySelector('[aria-label="Keluarkan Friend 1"]'));
  const beforeConfirm=await api({type:'sync',code,token:keys[1]});await api({type:'character',code,token:keys[1],revision:beforeConfirm.revision,character:4});await sync();
  await click(button(0,'Ya, lanjutkan'));assert.ok(containers[0].textContent.includes('Periksa lagi'),'stale confirmation asks for review');assert.equal(bodies.filter(b=>b.type==='kick').length,0,'no kick against changed room');
  await click(button(0,'Saya siap'));assert.ok(containers[0].textContent.includes('Aksi ditolak'));assert.equal(containers[0].querySelectorAll('.b2-room-seat.occupied').length,4,'permission error with valid room must not evict player');await sync();assert.ok(containers[0].textContent.includes('Aksi ditolak'),'background poll does not erase action feedback');
  for(let i=0;i<4;i++){assert.equal(containers[i].querySelectorAll('.b2-room-seat.occupied').length,4);await click(button(i,'Saya siap'));await sync();}
  await click(button(0,'Bagikan kartu'));await sync();await wait(250);
  for(const c of containers)assert.equal(c.querySelectorAll('.b2-hand [data-card]').length,13);
  // A failed poll must disable action controls, and a successful poll restores the session.
  failSync=true;await sync();assert.ok(containers.every(c=>c.textContent.includes('Menyambungkan')));assert.ok(containers.every(c=>c.querySelector('.b2-play').disabled));failSync=false;await sync();
  for(let round=1;round<=rounds;round++){
  while(true){
   const first=await api({type:'sync',code,token:keys[0]});if(first.phase==='finished'){totals=first.players.map(p=>p.total);expectedTotals=expectedTotals.map((v,i)=>v+first.game.score[i]);assert.deepEqual(totals,expectedTotals,'cumulative scores count each round once');break;}
   const seat=first.game.turn,view=await api({type:'sync',code,token:keys[seat]});
   if(turns===3&&!refreshed){const hand=[...view.game.hand];await act(async()=>roots[seat].unmount());await mount(seat);assert.deepEqual([...containers[seat].querySelectorAll('.b2-hand [data-card]')].map(e=>Number(e.dataset.card)).sort((a,b)=>a-b),hand.sort((a,b)=>a-b));refreshed=true;}
   const cards=chooseBotMove(view.game.hand,view.game.table,view.game.opening,view.game.counts.filter((_,i)=>i!==seat));
   for(const card of cards)await click(containers[seat].querySelector(`.b2-hand [data-card="${card}"]`));
   const control=containers[seat].querySelector(cards.length?'.b2-play':'.b2-pass');assert.ok(!control.disabled);
   if(!lost)lostToken=keys[seat];
   const before=view.game.sequence,handler=props(control).onClick;
   await act(async()=>{handler();handler();await new Promise(r=>setTimeout(r,15));});
   if(containers[seat].textContent.includes('Konfirmasi belum diterima')){
    const requests=bodies.filter(b=>b.type==='play'&&b.token===keys[seat]);const original=requests.at(-1);await click(button(seat,'Coba lagi'));
    assert.equal(bodies.filter(b=>b.type==='play'&&b.token===keys[seat]).at(-1).requestId,original.requestId);
   }
   const after=await api({type:'sync',code,token:keys[seat]});assert.equal(after.game.sequence,before+1,'duplicate taps/retry commit once');
   await sync();assert.ok(++turns<600);
  }
  await wait(300);assert.ok(refreshed&&lost);assert.equal(totals.reduce((a,b)=>a+b,0),0);
  for(const c of containers){assert.equal(c.querySelectorAll('.b2-results .b2-session-score li').length,4);assert.ok(c.querySelector('.b2-results').open);}
  // Old host leaves at results. Another player can recover without escaping the modal.
  const oldHost=(round-1)%4,newHost=round%4;
  await click(button(oldHost,'Tutup meja'));assert.equal(roots[oldHost],null);
  if(process.env.BIG_TWO_REAL_POLL){assert.ok(!button(newHost,'Ambil alih host'),'no immediate takeover after close');await wait(62000);}else database.prepare(`UPDATE big_two_rooms SET seen${oldHost}=? WHERE code=?`).run(Date.now()-61000,code);await sync();
  const claim=button(newHost,'Ambil alih host');assert.ok(claim.closest('.b2-results'),'host recovery available inside modal');await click(claim);await sync();
  assert.ok(!button(newHost,'Lanjut ronde').disabled);await click(button(newHost,'Lanjut ronde'));await sync();
  for(let i=0;i<4;i++){if(i===oldHost)continue;assert.equal(containers[i].querySelector('.b2-results'),null);assert.match(containers[i].textContent,/Ronde selesai/);}
  await mount(oldHost);await sync();
  for(let i=0;i<4;i++){await click(button(i,'Saya siap'));await sync();}
  await click(button(newHost,'Bagikan kartu'));await sync();await wait(250);
  const next=await api({type:'sync',code,token:keys[newHost]});assert.equal(next.round,round+1);assert.deepEqual(next.players.map(p=>p.total),totals);assert.equal(next.game.sequence,0);
  for(const c of containers)assert.equal(c.querySelectorAll('.b2-hand [data-card]').length,13);
  console.log(JSON.stringify({clients:4,completedTurns:turns,lostPlayRetriedOnce:lost,refreshSameHand:refreshed,hostRecoveredInsideResults:true,rematchRound:next.round,heapMB:Math.round(process.memoryUsage().heapUsed/1048576)}));
  }
  const current=await api({type:'sync',code,token:keys[0]}),host=current.host,offline=(host+1)%4;
  database.prepare(`UPDATE big_two_rooms SET seen${offline}=? WHERE code=?`).run(Date.now()-61000,code);
  await api({type:'cancel',code,token:keys[host],revision:current.revision});await sync();
  await click(button(host,'Akhiri sesi'));await click(button(host,'Ya, lanjutkan'));await sync();
  for(const c of containers){assert.ok(c.querySelector('.b2-session-ended'),'each client receives session summary');assert.equal(c.querySelectorAll('.b2-session-ended li').length,4);}
  await act(async()=>roots[host].unmount());roots[host]=null;await mount(host);await sync();assert.ok(containers[host].querySelector('.b2-session-ended'),'ended session survives refresh');
 }finally{for(const root of roots)if(root)await act(async()=>root.unmount());database.close();}
});
