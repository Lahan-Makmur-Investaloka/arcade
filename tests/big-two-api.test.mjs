import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {POST} from '../app/api/big-two/route.ts';
import {chooseBotMove} from '../app/big-two/engine.ts';
const database=new DatabaseSync(':memory:');database.exec(readFileSync(new URL('../drizzle/0007_brown_hammerhead.sql',import.meta.url),'utf8'));
globalThis.__TEKAD_DB__={prepare(sql){return{bind(...params){return wrap(sql,params)},...wrap(sql,[])}}};
function wrap(sql,params){return{async first(){return database.prepare(sql).get(...params)||null},async run(){return {meta:{changes:Number(database.prepare(sql).run(...params).changes)}}}};}
const keys=Array.from({length:10},(_,i)=>(i+1).toString(16).repeat(64));
const call=async(data,headers={})=>{const response=await POST(new Request('https://test.local/api/big-two',{method:'POST',headers:{'Content-Type':'application/json','Origin':'https://test.local',...headers},body:JSON.stringify({token:keys[0],requestId:crypto.randomUUID(),...data})}));return {status:response.status,...await response.json()}};
function reset(){database.exec('DELETE FROM big_two_rooms; DELETE FROM big_two_limits');}
async function sync(code,seat=0){return call({type:'sync',code,token:keys[seat]});}
async function move(code,seat,type,extra={}){const r=await sync(code,seat);assert.equal(r.status,200);return call({type,code,token:keys[seat],revision:r.room.revision,...extra});}
async function lobby(){const create=await call({type:'create',name:'Player 0',character:0});assert.equal(create.status,200);const code=create.room.code;for(let i=1;i<4;i++){const r=await call({type:'join',code,token:keys[i],name:`Player ${i}`,character:0});assert.equal(r.status,200);}return code;}
async function start(code){for(let i=0;i<4;i++)assert.equal((await move(code,i,'ready',{ready:true})).status,200);const r=await move(code,0,'start');assert.equal(r.status,200);return r.room;}
test('four real seats, private hands, reconnect, host permissions and idempotent create/join',async()=>{
 reset();const code=await lobby();const first=await sync(code);assert.equal(first.room.players.length,4);assert.deepEqual(first.room.players.map(p=>p.character),[0,1,2,3]);
 const again=await call({type:'create',name:'Other name',character:4});assert.equal(again.room.code,code);assert.equal(again.room.players[0].name,'Player 0');
 const joinAgain=await call({type:'join',code,token:keys[1],name:'Player 1',character:0});assert.equal(joinAgain.room.you,1);
 assert.equal((await call({type:'join',code,token:keys[4],name:'Fifth',character:4})).status,409);
 assert.equal((await move(code,1,'start')).status,403);assert.equal((await move(code,0,'start')).status,400);
 let room=await start(code);assert.equal(room.phase,'playing');assert.equal(room.round,1);
 const hands=[];for(let i=0;i<4;i++){const r=await sync(code,i);assert.equal(r.status,200);assert.equal(r.room.you,i);assert.equal(r.room.game.hand.length,13);hands.push(...r.room.game.hand);
  const raw=JSON.stringify(r.room);for(const field of ['"hash"','"hands"','"receipts"','"creator_hash"','"token"'])assert.ok(!raw.includes(field),field);assert.ok(!raw.includes(keys[i]));
  assert.deepEqual(Object.keys(r.room.game).sort(),['counts','hand','history','opening','owner','passes','score','sequence','table','trick','turn','winner'].sort());
 }
 assert.equal(new Set(hands).size,52);
 assert.equal((await sync(code,5)).status,403);assert.equal((await move(code,0,'leave')).status,400);
 assert.equal((await call({type:'join',code,token:keys[4],name:'Late',character:4})).status,409);
 const before=await sync(code,2);await call({type:'away',code,token:keys[2]});assert.equal((await sync(code)).room.players[2].connected,true);const resumed=await sync(code,2);assert.deepEqual(resumed.room.game.hand,before.room.game.hand);assert.equal(resumed.room.players[2].connected,true);assert.equal(resumed.room.revision,before.room.revision);
});
test('simultaneous retries execute once; stale turns and hidden-card forgery are rejected',async()=>{
 reset();const code=await lobby();let room=await start(code),seat=room.game.turn;let actor=(await sync(code,seat)).room;
 const cards=chooseBotMove(actor.game.hand,actor.game.table,actor.game.opening,actor.game.counts.filter((_,i)=>i!==seat));const body={type:'play',code,token:keys[seat],requestId:crypto.randomUUID(),revision:actor.revision,cards};
 const results=await Promise.all([call(body),call(body)]);assert.deepEqual(results.map(r=>r.status),[200,200]);room=(await sync(code)).room;assert.equal(room.game.sequence,1);assert.equal(room.revision,actor.revision+1);
 const replay=await call(body);assert.equal(replay.replayed,true);assert.equal(replay.room.game.sequence,1);
 assert.equal((await call({...body,cards:[]})).status,409);
 assert.equal((await call({...body,requestId:crypto.randomUUID()})).status,409);
 assert.equal((await move(code,seat,'play',{cards:[]})).status,400);
 seat=room.game.turn;actor=(await sync(code,seat)).room;const stolen=Array.from({length:52},(_,i)=>i).find(c=>!actor.game.hand.includes(c));assert.equal((await move(code,seat,'play',{cards:[stolen]})).status,400);
 const simultaneous=await Promise.all([call({type:'play',code,token:keys[seat],revision:actor.revision,cards:[]}),call({type:'play',code,token:keys[seat],revision:actor.revision,cards:[]})]);assert.deepEqual(simultaneous.map(r=>r.status).sort(),[200,409]);
});
test('complete multiplayer rounds use only each client hand; scores count once and survive rematch',async()=>{
 reset();const code=await lobby();let expectedTotals=[0,0,0,0];
 for(let round=1;round<=3;round++){
  database.exec('DELETE FROM big_two_limits');let room=await start(code),steps=0,lastBody;
  while(room.phase==='playing'){
   const seat=room.game.turn;const actor=(await sync(code,seat)).room;
   const cards=chooseBotMove(actor.game.hand,actor.game.table,actor.game.opening,actor.game.counts.filter((_,i)=>i!==seat));lastBody={type:'play',code,token:keys[seat],revision:actor.revision,requestId:crypto.randomUUID(),cards};
   const next=await call(lastBody);assert.equal(next.status,200,JSON.stringify(next));room=next.room;assert.ok(++steps<600);
  }
  assert.equal(room.phase,'finished');assert.equal(room.round,round);assert.equal(room.game.counts[room.game.winner],0);assert.equal(room.game.score.reduce((a,b)=>a+b,0),0);
  expectedTotals=expectedTotals.map((v,i)=>v+room.game.score[i]);assert.deepEqual(room.players.map(p=>p.total),expectedTotals);
  const retried=await call(lastBody);assert.equal(retried.status,200);assert.deepEqual(retried.room.players.map(p=>p.total),expectedTotals);
  assert.equal((await move(code,1,'lobby')).status,403);const waiting=await move(code,0,'lobby');assert.equal(waiting.room.phase,'lobby');assert.equal(waiting.room.game,null);assert.ok(waiting.room.players.every(p=>!p.ready));assert.deepEqual(waiting.room.players.map(p=>p.total),expectedTotals);
 }
 const returning=expectedTotals.findIndex(n=>n!==0);
 assert.ok(returning>=0);
 assert.equal((await move(code,returning,'leave')).left,true);
 const rejoined=await call({type:'join',code,token:keys[returning],name:`Player ${returning}`,character:returning});
 assert.equal(rejoined.status,200);
 assert.equal(rejoined.room.players[rejoined.room.you].total,expectedTotals[returning],'returning member retains session points');
});
test('disconnect recovery: cancel only after one minute, host takeover, kick and replacement',async()=>{
 reset();const code=await lobby();await start(code);assert.equal((await move(code,0,'cancel')).status,400);assert.equal((await move(code,1,'claim-host')).status,400);
 database.prepare('UPDATE big_two_rooms SET seen0=? WHERE code=?').run(Date.now()-61000,code);let r=await move(code,1,'claim-host');assert.equal(r.status,200);assert.equal(r.room.host,1);
 r=await move(code,1,'cancel');assert.equal(r.status,200);assert.equal(r.room.phase,'lobby');assert.deepEqual(r.room.players.map(p=>p.total),[0,0,0,0]);
 assert.equal((await move(code,0,'kick',{seat:2})).status,403);assert.equal((await move(code,1,'kick',{seat:1})).status,400);assert.equal((await move(code,1,'kick',{seat:2})).status,200);assert.equal((await sync(code,2)).status,403);
 r=await call({type:'join',code,token:keys[4],name:'Replacement',character:4});assert.equal(r.status,200);assert.equal(r.room.you,2);assert.equal(r.room.players[2].ready,false);
 const host=(await sync(code,1)).room;const leave={type:'leave',code,token:keys[1],revision:host.revision,requestId:crypto.randomUUID()};assert.equal((await call(leave)).left,true);assert.equal((await call(leave)).left,true);assert.equal((await sync(code)).room.host,0);
});
test('room expiry, character conflicts, validation and hostile requests',async()=>{
 reset();assert.equal((await call({type:'create',name:'<script>',character:0})).status,400);assert.equal((await call({type:'create',name:'Player',character:8})).status,400);
 const code=await lobby();assert.equal((await move(code,0,'character',{character:1})).status,409);assert.equal((await move(code,0,'character',{character:4})).status,200);
 assert.equal((await call({type:'sync',code,token:'bad'})).status,401);assert.equal((await call({type:'sync',code},{Origin:'https://evil.local'})).status,403);
 assert.equal((await call({type:'sync',code,padding:'x'.repeat(9000)})).status,413);assert.equal((await move(code,0,'invented',{score:999999})).status,400);
 database.prepare('UPDATE big_two_rooms SET expires_at=? WHERE code=?').run(Date.now()-1,code);assert.equal((await sync(code)).status,410);
});

test('closing a table starts the offline grace period instead of allowing immediate cancellation',async()=>{
 reset();const code=await lobby();await start(code);
 const before=Date.now();await call({type:'away',code,token:keys[1]});
 const lastSeen=database.prepare('SELECT seen1 FROM big_two_rooms WHERE code=?').get(code).seen1;
 assert.ok(lastSeen>=before-4000,'away preserves a recent heartbeat');
 assert.equal((await move(code,0,'cancel')).status,400);
 await call({type:'away',code,token:keys[0]});
 assert.equal((await move(code,1,'claim-host')).status,400);
 const originalNow=Date.now;
 try{
  Date.now=()=>before+26000;
  const disconnected=await sync(code,2);assert.equal(disconnected.room.players[0].connected,false);
  assert.equal((await move(code,2,'claim-host')).status,400);
  Date.now=()=>before+61000;
  assert.equal((await move(code,2,'claim-host')).status,200);
  const cancelled=await move(code,2,'cancel');assert.equal(cancelled.status,200);assert.equal(cancelled.room.phase,'lobby');
  assert.deepEqual(cancelled.room.players.map(p=>p.total),[0,0,0,0]);
 }finally{Date.now=originalNow;}
});
