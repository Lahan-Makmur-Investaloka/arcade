import test from 'node:test';
import assert from 'node:assert/strict';
import {QUESTIONS} from '../lib/quiz/questions.mjs';
import {createGame,advance,publicGame,POINTS} from '../lib/quiz/engine.mjs';
const open=(s=createGame('Tester'),n=1000)=>advance(s,{type:'next'},n);
const answer=(s,n=1500,correct=true)=>advance(s,{type:'answer',choice:s.question.order.indexOf(correct?0:1)},n);
test('450 complete, unique questions: 200 easy, 150 medium, 100 hard; distinct answers and safe primary links',()=>{
 assert.equal(QUESTIONS.length,450);assert.equal(new Set(QUESTIONS.map(q=>q.id)).size,450);assert.equal(new Set(QUESTIONS.map(q=>q.text)).size,450);
 for(const t of [1,2,3])assert.equal(QUESTIONS.filter(q=>q.tier===t).length,({1:200,2:150,3:100})[t]);
 for(const q of QUESTIONS){assert.equal(new Set(q.options).size,4);for(const v of [q.text,q.hint,q.explanation,...q.options])assert.ok(typeof v==='string'&&v.length>0,q.id);if(q.source.url)assert.ok(q.source.url.startsWith('https://'));}
});
test('new game has 15 distinct questions in increasing tiers; active response hides answer and deck',()=>{
 const s=open();assert.equal(new Set(s.deck).size,15);s.deck.forEach((id,i)=>assert.equal(QUESTIONS.find(q=>q.id===id).tier,Math.floor(i/5)+1));
 const p=publicGame(s,1000);assert.equal(p.question.correct,undefined);assert.equal(p.question.explanation,undefined);assert.equal(p.deck,undefined);assert.equal(p.question.order,undefined);assert.equal(p.question.id,undefined);assert.equal(p.question.deadline,16000);
});
test('15 correct answers reach 1m; checkpoints and durations are correct',()=>{
 let s=createGame('Tester'),now=1000;
 for(let i=0;i<15;i++){s=open(s,now);assert.equal(s.question.deadline-now,(i<5?15:i<10?20:25)*1000);s=answer(s,now+500);assert.equal(s.score,POINTS[i]);assert.equal(s.safe,i<4?0:i<9?1000:32000);assert.equal(publicGame(s,now+500).question.correct,s.question.order.indexOf(0));now+=2000;}
 assert.equal(s.phase,'ended');assert.equal(s.result.kind,'win');assert.equal(s.elapsed,7500);
});
test('wrong answers and timeouts return only last safe score at all levels',()=>{
 let s=createGame('Tester'),now=1000;
 for(let i=0;i<15;i++){const a=open(s,now);const expected=i<5?0:i<10?1000:32000;assert.equal(answer(a,now+500,false).score,expected);const expired=advance(a,{type:'answer',choice:a.question.order.indexOf(0)},a.question.deadline);assert.equal(expired.result.kind,'timeout');assert.equal(expired.score,expected);s=answer(a,now+500);now+=2000;}
});
test('deadline survives serialization, sync, and attempted late lifeline',()=>{
 let s=open();const deadline=s.question.deadline;s=JSON.parse(JSON.stringify(s));s=advance(s,{type:'sync'},14000);assert.equal(s.question.deadline,deadline);s=advance(s,{type:'help',helper:'adelia'},deadline);assert.equal(s.phase,'ended');assert.equal(s.result.kind,'timeout');assert.equal(s.used.length,0);
});
test('50:50 retains correct answer and cannot be replayed',()=>{let s=open();s=advance(s,{type:'help',helper:'timmy'},1100);assert.equal(s.question.removed.length,2);assert.ok(!s.question.removed.includes(s.question.order.indexOf(0)));assert.throws(()=>advance(s,{type:'help',helper:'timmy'},1200));assert.throws(()=>advance(s,{type:'answer',choice:s.question.removed[0]},1200));});
test('hint and simulated voting return only their expected effects',()=>{let s=open();s=advance(s,{type:'help',helper:'eldric'},1100);assert.ok(s.question.hint);s=advance(s,{type:'help',helper:'kirana'},1200);assert.equal(s.question.vote.reduce((a,b)=>a+b,0),100);assert.equal(s.question.deadline,26000);});
test('replace gives unseen same-tier question, reset timer, accounts prior elapsed',()=>{let s=open();const id=s.question.id;s=advance(s,{type:'help',helper:'adelia'},6000);assert.notEqual(s.question.id,id);assert.ok(!s.deck.includes(s.question.id));assert.equal(s.question.deadline,26000);assert.equal(s.elapsed,5000);assert.equal(QUESTIONS.find(q=>q.id===s.question.id).tier,1);assert.ok(s.used.includes('adelia'));});
test('second chance activation adds 5s; retry itself does not extend timer',()=>{let s=open();s=advance(s,{type:'help',helper:'dylan'},1100);s=answer(s,2000,false);assert.equal(s.phase,'active');assert.equal(s.question.second,false);assert.equal(s.question.retried,true);assert.equal(s.question.deadline,21000);assert.equal(publicGame(s,2000).question.correct,undefined);s=answer(s,3000,true);assert.equal(s.phase,'review');assert.equal(s.elapsed,2000);});
test('second wrong answer ends session; timeout wins over an armed helper',()=>{let s=open();s=advance(s,{type:'help',helper:'dylan'},1100);const armed=structuredClone(s);s=answer(s,2000,false);s=advance(s,{type:'answer',choice:s.question.order.indexOf(2)},3000);assert.equal(s.result.kind,'wrong');assert.equal(advance(armed,{type:'answer',choice:armed.question.order.indexOf(0)},21000).result.kind,'timeout');});
test('walk keeps earned score; review has no timer; zero progress can exit',()=>{let s=answer(open());s=advance(s,{type:'sync'},99999999);assert.equal(s.phase,'review');s=advance(s,{type:'walk'},99999999);assert.equal(s.score,100);assert.equal(s.elapsed,500);assert.equal(advance(createGame('Tester'),{type:'walk'},1000).phase,'ended');});
test('invalid choices and unknown actions never mutate original state',()=>{const s=open(),copy=JSON.stringify(s);for(const choice of [-1,4,NaN,'0',null,1.5])assert.throws(()=>advance(s,{type:'answer',choice},1100));assert.throws(()=>advance(s,{type:'cheat',score:1000000},1100));assert.equal(JSON.stringify(s),copy);});
test('all helpers can be combined and run survives arbitrary syncs',()=>{for(let k=0;k<100;k++){let s=open();s=advance(s,{type:'help',helper:'dylan'},1100);s=answer(s,1200,false);s=advance(s,{type:'help',helper:'timmy'},1300);s=advance(s,{type:'help',helper:'kirana'},1400);assert.equal(s.question.vote.reduce((a,b)=>a+b,0),100);s=advance(s,{type:'help',helper:'adelia'},1500);s=advance(s,{type:'help',helper:'eldric'},1600);s=answer(s,2000);assert.equal(s.score,100);assert.equal(s.used.length,5);assert.equal(s.elapsed,1000);}});

test('each successful helper grants exactly 5 seconds; duplicate and sync grant none',()=>{for(const helper of ['timmy','eldric','kirana','dylan']){const s=open();const used=advance(s,{type:'help',helper},2000);assert.equal(used.question.deadline,s.question.deadline+5000);assert.equal(publicGame(used,2000).question.duration,20);assert.equal(advance(used,{type:'sync'},3000).question.deadline,21000);assert.throws(()=>advance(used,{type:'help',helper},3000));}});
