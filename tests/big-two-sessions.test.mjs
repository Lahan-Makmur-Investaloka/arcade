import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {POST as practice} from '../app/api/big-two/practice/route.ts';
import {POST as rooms} from '../app/api/big-two/route.ts';
import {createGame,act as move,chooseBotMove,scores} from '../app/big-two/engine.ts';
import {newRoom,joinRoom,transition,roomView} from '../lib/big-two/room.ts';
import {build} from 'esbuild';
import React,{act} from 'react';
const database=new DatabaseSync(':memory:');
for(const f of ['0007_brown_hammerhead.sql','0008_round_the_santerians.sql'])database.exec(readFileSync(new URL('../drizzle/'+f,import.meta.url),'utf8'));
globalThis.__TEKAD_DB__={prepare(sql){return {bind(...p){return wrap(sql,p)},...wrap(sql,[])}}};
function wrap(sql,p){return {async first(){return database.prepare(sql).get(...p)||null},async run(){return {meta:{changes:Number(database.prepare(sql).run(...p).changes)}}}};}
const owner='a'.repeat(64);
const call=async(data,token=owner)=>{const r=await practice(new Request('https://test.local/api/big-two/practice',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://test.local'},body:JSON.stringify({...data,token})}));return {status:r.status,...await r.json()};};
function finished(seed=1){let x=seed;const random=()=>((x=(x*1664525+1013904223)>>>0)/2**32);let g=createGame(random);for(let i=0;g.winner===null&&i<600;i++){const s=g.turn;g=move(g,s,chooseBotMove(g.hands[s],g.table,g.opening,g.hands.filter((_,j)=>j!==s).map(h=>h.length)));}assert.notEqual(g.winner,null);return g;}
test('practice sessions persist, count a completed round once, isolate owners and archive totals',async()=>{
 const id=crypto.randomUUID(),a=finished(2),b=finished(9);
 assert.equal((await call({type:'start',id,player:0})).status,200);
 assert.equal((await call({type:'record',id,round:1,game:createGame()})).status,400);
 const [one,two]=await Promise.all([call({type:'record',id,round:1,game:a}),call({type:'record',id,round:1,game:a})]);assert.equal(one.status,200);assert.equal(two.status,200);assert.equal(two.book.active.rounds.length,1);
 assert.equal((await call({type:'record',id,round:3,game:b})).status,409);
 assert.equal((await call({type:'record',id,round:1,game:b})).status,409);
 const second=await call({type:'record',id,round:2,game:b});assert.equal(second.status,200);assert.deepEqual(second.book.active.rounds.map(r=>r.points),[scores(a),scores(b)]);
 assert.equal((await call({type:'sync'},'b'.repeat(64))).book.active,null);
 const end=await call({type:'end',id});assert.equal(end.book.active,null);assert.equal(end.book.history[0].rounds.length,2);
 assert.equal((await call({type:'end',id})).book.history.length,1);assert.equal((await call({type:'record',id,round:2,game:b})).status,200,'lost final save acknowledgement is safe after end');
 assert.equal((await call({type:'record',id,round:3,game:b})).status,409);
 const next=await call({type:'start',id:crypto.randomUUID(),player:3});assert.equal(next.book.history.length,1);assert.equal(next.book.active.rounds.length,0);
 assert.equal((await call({type:'sync'})).book.history[0].id,id);
});
test('multiplayer summary uses server scores, retains departed players, ends only by host and remains readable after expiry',async()=>{
 let state=newRoom('h0','Alpha',0);for(let i=1;i<4;i++)state=joinRoom(state,'h'+i,'Player '+i,i);
 const now=Date.now(),seen=[now,now,now,now];
 for(let round=0;round<2;round++){
  if(round)state=transition(state,0,{type:'lobby'},now,seen,Math.random);
  for(let i=0;i<4;i++)state=transition(state,i,{type:'ready',ready:true},now,seen,Math.random);
  state=transition(state,0,{type:'start'},now,seen,Math.random);
  assert.throws(()=>transition(state,0,{type:'end-session'},now,seen,Math.random));
  for(let i=0;state.phase==='playing'&&i<600;i++){const g=state.game,s=g.turn;state=transition(state,s,{type:'play',cards:chooseBotMove(g.hands[s],g.table,g.opening,g.hands.filter((_,j)=>j!==s).map(h=>h.length))},now,seen,Math.random);}
  assert.equal(state.sessionStats.completed,round+1);assert.deepEqual(state.sessionStats.members.map(m=>m.total),state.totals);
 }
 assert.equal(state.sessionStats.members.reduce((s,m)=>s+m.wins,0),2);
 assert.throws(()=>transition(state,1,{type:'end-session'},now,seen,Math.random));
 state=transition(state,0,{type:'lobby'},now,seen,Math.random);state=transition(state,0,{type:'kick',seat:1},now,seen,Math.random);
 let view=roomView(state,0,{code:'ABCDEF',revision:1,expiresAt:now+1,seen},now);assert.equal(view.session.standings.find(p=>p.name==='Player 1').active,false);assert.ok(!JSON.stringify(view).includes('"hash"'));
 // Use the actual endpoint for end/retry/expiry reads with a legitimate capability hash.
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(owner))),b=>b.toString(16).padStart(2,'0')).join('');state.players[0].hash=hash;
 database.prepare('INSERT INTO big_two_rooms (code,creator_hash,state,revision,seen0,seen1,seen2,seen3,created_at,expires_at) VALUES (?,?,?,0,?,?,?,?,?,?)').run('ABCDEF',hash,JSON.stringify(state),now,now,now,now,now,now+86400000);
 const api=async b=>{const r=await rooms(new Request('https://test.local/api/big-two',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code:'ABCDEF',token:owner,...b})}));return {status:r.status,...await r.json()};};
 const end={type:'end-session',revision:0,requestId:crypto.randomUUID()};const result=await api(end);assert.equal(result.status,200);assert.equal(result.room.phase,'ended');assert.equal((await api(end)).replayed,true);
 database.prepare('UPDATE big_two_rooms SET expires_at=? WHERE code=?').run(now-1,'ABCDEF');assert.equal((await api({type:'sync'})).room.phase,'ended');
});
test('practice UI restores a completed round, shows totals, continues, ends and reopens history',{skip:!process.env.BIG_TWO_DOM_PATH},async()=>{
 const {parseHTML}=await import(process.env.BIG_TWO_DOM_PATH),{window}=parseHTML('<html><body><div id="app"></div></body></html>');
 const token='c'.repeat(64),id=crypto.randomUUID(),g=finished(5),storage=new Map();
 await call({type:'start',id,player:0},token);storage.set('tekad-big-two-record-owner-v1',token);storage.set('tekad-big-two-match-v1',JSON.stringify({game:g,player:0,seriesId:id,round:1}));
 Object.assign(globalThis,{window,document:window.document,HTMLElement:window.HTMLElement,Event:window.Event,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},matchMedia:()=>({matches:true,addEventListener(){},removeEventListener(){}}),IS_REACT_ACT_ENVIRONMENT:true});
 window.HTMLElement.prototype.showModal=function(){this.open=true;};window.HTMLElement.prototype.close=function(){this.open=false;};
 let lostReply=false;
 globalThis.fetch=async(url,options)=>{const r=await practice(new Request('https://test.local'+url,options));if(JSON.parse(options.body).type==='record'&&!lostReply){lostReply=true;throw new TypeError('connection lost after commit');}return r;};
 await build({entryPoints:['app/big-two/game.tsx'],outfile:'.sites-runtime/session-ui.mjs',bundle:true,format:'esm',platform:'node',jsx:'automatic',loader:{'.css':'empty'},plugins:[{name:'imports',setup(b){b.onResolve({filter:/^react(\/.*)?$/},a=>({path:resolve('node_modules',a.path==='react/jsx-runtime'?'react/jsx-runtime.js':'react/index.js'),external:true}));b.onResolve({filter:/^next\/link$/},()=>({path:'link',namespace:'stub'}));b.onLoad({filter:/.*/,namespace:'stub'},()=>({contents:"import React from 'react';export default function Link(p){return React.createElement('a',p,p.children)}"}));}}]});
 const {default:Game}=await import(resolve('.sites-runtime/session-ui.mjs')),{createRoot}=await import('react-dom/client');
 const props=e=>e[Object.keys(e).find(k=>k.startsWith('__reactProps$'))],button=text=>[...document.querySelectorAll('button')].find(b=>b.textContent.trim().startsWith(text));
 const wait=async(ms=25)=>act(async()=>{await new Promise(r=>setTimeout(r,ms));});const click=async text=>{const b=button(text);assert.ok(b,text);assert.ok(!b.disabled,text);await act(async()=>props(b).onClick());await wait();};
 let root=createRoot(document.getElementById('app'));await act(async()=>root.render(React.createElement(Game)));await wait();await click('Start Game');await wait(350);
 assert.ok(lostReply);await click('Coba simpan lagi');assert.equal(document.querySelectorAll('.b2-results .b2-session-score li').length,4);assert.match(document.querySelector('.b2-results').textContent,/1 ronde selesai/);
 assert.equal((await call({type:'sync'},token)).book.active.rounds.length,1);
 await act(async()=>root.unmount());root=createRoot(document.getElementById('app'));await act(async()=>root.render(React.createElement(Game)));await wait();await click('Start Game');await wait(350);assert.equal((await call({type:'sync'},token)).book.active.rounds.length,1,'refresh does not recount');
 await click('Main lagi');assert.equal(JSON.parse(storage.get('tekad-big-two-match-v1')).round,2);assert.equal(JSON.parse(storage.get('tekad-big-two-match-v1')).game.sequence,0);
 await click('Poin sesi');assert.match(document.querySelector('.b2-dialog').textContent,/1 ronde selesai/);await click('Tutup rekap');
 await act(async()=>props(document.querySelector('[aria-label="Kembali ke lobi"]')).onClick());await click('Ke lobi');await click('Akhiri sesi');await click('Ya, akhiri sesi');
 const book=(await call({type:'sync'},token)).book;assert.equal(book.active,null);assert.equal(book.history[0].rounds.length,1,'unfinished second round does not score');assert.equal(storage.has('tekad-big-two-match-v1'),false);
 await click('Tutup rekap');await click('Riwayat sesi');assert.equal(document.querySelectorAll('.b2-session-history>button').length,1);
 await act(async()=>root.unmount());
});
