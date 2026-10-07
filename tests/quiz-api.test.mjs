import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {POST,GET} from '../app/api/quiz/route.ts';
const database=new DatabaseSync(':memory:');database.exec(readFileSync(new URL('../drizzle/0006_quiz_sessions.sql',import.meta.url),'utf8'));
globalThis.__TEKAD_DB__={prepare(sql){return{bind(...params){return wrap(sql,params)},...wrap(sql,[])}}};
function wrap(sql,params){return{async first(){return database.prepare(sql).get(...params)||null},async all(){return {results:database.prepare(sql).all(...params)}},async run(){return {meta:{changes:Number(database.prepare(sql).run(...params).changes)}}}};}
const key='a'.repeat(64);const call=async(data)=>{const response=await POST(new Request('https://test.local/api/quiz',{method:'POST',headers:{'Content-Type':'application/json','Origin':'https://test.local'},body:JSON.stringify({key,...data})}));return {status:response.status,...await response.json()}};
test('API start, retry, hidden keys, unauthorized owner, CAS, resume and leaderboard',async()=>{
 let r=await call({type:'start',name:'Tester'});assert.equal(r.status,200);let g=r.game;assert.equal(g.phase,'ready');assert.equal(g.question,null);
 const again=await call({type:'start',name:'Changed'});assert.equal(again.game.id,g.id);assert.equal(again.game.name,'Tester');
 r=await call({type:'next',id:g.id,revision:g.revision});assert.equal(r.status,200);g=r.game;assert.equal(g.phase,'active');assert.equal(g.question.correct,undefined);assert.equal(g.deck,undefined);
 const deadline=g.question.deadline;
 const stranger=await call({type:'sync',id:g.id,key:'b'.repeat(64)});assert.equal(stranger.status,404);
 const state=JSON.parse(database.prepare('SELECT state FROM quiz_sessions WHERE id=?').get(g.id).state);
 const action={type:'answer',id:g.id,revision:g.revision,choice:state.question.order.indexOf(0)};
 const results=await Promise.all([call(action),call(action)]);assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);
 r=await call({type:'sync',id:g.id});g=r.game;assert.equal(g.score,100);assert.equal(g.phase,'review');assert.equal(g.question.deadline,deadline);assert.equal(typeof g.question.correct,'number');assert.ok(g.question.explanation);
 r=await call({type:'walk',id:g.id,revision:g.revision});assert.equal(r.game.score,100);assert.equal(r.game.phase,'ended');
 const board=await (await GET()).json();assert.equal(board.rows.length,1);assert.equal(board.rows[0].score,100);assert.equal(board.rows[0].name,'Tester');
 const fresh=await call({type:'start',name:'Tester'});assert.notEqual(fresh.game.id,g.id);
});
test('API malformed requests and forged score cannot submit a result',async()=>{
 assert.equal((await call({type:'start',name:'<x>'})).status,400);
 assert.equal((await call({type:'start',name:'Tester',key:'oops'})).status,400);
 const r=await call({type:'start',name:'Tester'});const g=r.game;
 const fake=await call({type:'cheat',id:g.id,revision:g.revision,score:1000000});assert.equal(fake.status,400);assert.equal(fake.game.score,0);
 const foreign=await POST(new Request('https://test.local/api/quiz',{method:'POST',headers:{Origin:'https://other.local'},body:'{}'}));assert.equal(foreign.status,403);
});

test('leaderboard ranks score, furthest opened question, then time, including old runs and replacements',async()=>{
 const {createGame,advance}=await import('../lib/quiz/engine.mjs');
 database.exec('DELETE FROM quiz_sessions');
 function run(correct,openNext,delay,replace=false){let s=createGame('Fixture'),now=1000;
  for(let i=0;i<correct;i++){s=advance(s,{type:'next'},now);if(replace&&i===0)s=advance(s,{type:'help',helper:'adelia'},now+1);s=advance(s,{type:'answer',choice:s.question.order.indexOf(0)},now+delay);now+=delay+100;}
  if(openNext){s=advance(s,{type:'next'},now);s=advance(s,{type:'answer',choice:s.question.order.indexOf(1)},now+delay);}else s=advance(s,{type:'walk'},now);
  return s;
 }
 function insert(id,owner,s){database.prepare("INSERT INTO quiz_sessions(id,owner_hash,display_name,state,revision,status,score,elapsed_ms,created_at,updated_at) VALUES(?,?,?,?,0,'ended',?,?,1,1)").run(id,owner,id,JSON.stringify(s),s.score,s.elapsed);}
 insert('banked5','a',run(5,false,100,true));
 insert('failed6','b',run(5,true,100));
 insert('failed9slow','c',run(8,true,900));
 insert('failed9fast','d',run(8,true,200));
 insert('sameDeviceShallow','c',run(5,true,1));
 insert('higherScore','e',run(6,false,900));
 const board=await(await GET()).json();assert.deepEqual(board.rows.map(r=>r.name),['higherScore','failed9fast','failed9slow','failed6','banked5']);
 assert.deepEqual(board.rows.map(r=>r.reached),[6,9,9,6,5]);
});
