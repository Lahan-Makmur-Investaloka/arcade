import test from 'node:test';
import assert from 'node:assert/strict';
import {act,beats,chooseBotMove,classify,createGame,explainMove,legalPlays,penalty,restoreGame,scores} from '../app/big-two/engine.ts';
const C=(r,s=0)=>(['3','4','5','6','7','8','9','10','J','Q','K','A','2'].indexOf(String(r))*4+s);
const combo=cards=>{const result=classify(cards);assert.ok(result);return result;};
const rng=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};

test('deals all 52 unique cards evenly and 3 diamond starts',()=>{
 for(let n=1;n<20;n++){const g=createGame(rng(n));assert.deepEqual(g.hands.map(h=>h.length),[13,13,13,13]);assert.equal(new Set(g.hands.flat()).size,52);assert.ok(g.hands[g.turn].includes(0));assert.ok(restoreGame(JSON.parse(JSON.stringify(g))));}
});
test('card rank and suit ordering, pair tiebreak and triple',()=>{
 assert.ok(beats(combo([C('2')]),combo([C('A',3)])));
 assert.ok(beats(combo([C('3',3)]),combo([C('3',2)])));
 assert.ok(beats(combo([C('7',0),C('7',3)]),combo([C('7',1),C('7',2)])));
 assert.equal(combo([C('2',0),C('2',1),C('2',2)]).kind,'triple');
 assert.equal(classify([C('3'),C('4')]),null);
 assert.equal(classify([0,0]),null);assert.equal(classify([-1]),null);assert.equal(classify([52]),null);assert.equal(classify([1.5]),null);
});
test('all five-card categories and cross-category hierarchy',()=>{
 const straight=combo([C('3'),C('4',1),C('5'),C('6'),C('7')]);
 const flush=combo([C('3',1),C('5',1),C('8',1),C('J',1),C('2',1)]);
 const full=combo([C('4'),C('4',1),C('4',2),C('3'),C('3',1)]);
 const four=combo([C('3'),C('3',1),C('3',2),C('3',3),C('5')]);
 const sf=combo([C('3'),C('4'),C('5'),C('6'),C('7')]);
 assert.deepEqual([straight,flush,full,four,sf].map(c=>c.kind),['straight','flush','full-house','four-kind','straight-flush']);
 const combos=[straight,flush,full,four,sf];for(let i=1;i<combos.length;i++){assert.ok(beats(combos[i],combos[i-1]));assert.ok(!beats(combos[i-1],combos[i]));}
 assert.ok(!beats(sf,combo([C('3')])));assert.equal(classify([0,1,4,5]),null);
});
test('straight ace and two behavior is explicit, with no wrapping',()=>{
 const wheel=combo([C('A'),C('2'),C('3',1),C('4'),C('5')]);
 const six=combo([C('2'),C('3'),C('4',1),C('5'),C('6')]);
 const royal=combo([C('10'),C('J'),C('Q',1),C('K'),C('A')]);
 assert.ok(beats(six,wheel));assert.ok(beats(royal,six));
 assert.equal(classify([C('Q'),C('K'),C('A',1),C('2'),C('3')]),null);
 assert.equal(classify([C('J'),C('Q'),C('K',1),C('A'),C('2')]),null);
});
test('flush suit takes priority, full-house compares triple',()=>{
 const weakSpades=combo([C('3',3),C('5',3),C('7',3),C('9',3),C('J',3)]);
 const highHearts=combo([C('2',2),C('A',2),C('K',2),C('J',2),C('9',2)]);
 assert.ok(beats(weakSpades,highHearts));
 assert.ok(beats(combo([C('5'),C('5',1),C('5',2),C('3'),C('3',1)]),combo([C('4'),C('4',1),C('4',2),C('2'),C('2',1)])));
});
test('opening 3 diamond, ownership, turn and play sizes are enforced immutably',()=>{
 const g=createGame(rng(78)),original=JSON.stringify(g),s=g.turn;
 assert.throws(()=>act(g,(s+1)%4,[g.hands[(s+1)%4][0]]),/giliran/);
 assert.throws(()=>act(g,s,[]),/Pilih kartu/);
 assert.throws(()=>act(g,s,[g.hands[s].find(c=>c!==0)]),/3♦/);
 assert.throws(()=>act(g,s,[g.hands[(s+1)%4][0]]),/tangan/);
 const next=act(g,s,[0]);assert.equal(JSON.stringify(g),original);assert.equal(next.turn,(s+1)%4);assert.equal(next.hands[s].length,12);assert.equal(next.opening,false);
});
test('three consecutive passes return leadership and clear the table',()=>{
 let g=createGame(rng(22));const owner=g.turn;g=act(g,owner,[0]);
 for(let i=0;i<3;i++)g=act(g,g.turn,[]);
 assert.equal(g.turn,owner);assert.equal(g.table,null);assert.equal(g.owner,null);assert.equal(g.passes,0);assert.equal(g.trick,2);
 assert.throws(()=>act(g,g.turn,[]),/Pilih kartu/);
});
test('passing does not lock a player out and a response resets pass count',()=>{
 let g=createGame(rng(22));g=act(g,g.turn,[0]);g=act(g,g.turn,[]);const choice=legalPlays(g.hands[g.turn],g.table)[0];g=act(g,g.turn,choice.cards);assert.equal(g.passes,0);
});
test('scoring uses 1/2/3 multipliers and is zero-sum',()=>{
 assert.equal(penalty(9),9);assert.equal(penalty(10),20);assert.equal(penalty(12),24);assert.equal(penalty(13),39);
 assert.deepEqual(scores({hands:[[],Array(3),Array(10),Array(13)],winner:0}),[62,-3,-20,-39]);
});
test('corrupt saves fail closed',()=>{
 assert.equal(restoreGame(null),null);assert.equal(restoreGame({}),null);
 const g=createGame(rng(1));g.hands[0][0]=g.hands[1][0];assert.equal(restoreGame(g),null);
 const g2=createGame(rng(3));g2.turn=9;assert.equal(restoreGame(g2),null);
});
test('100 seeded four-bot rounds finish with legal moves, conserved cards and resumable state',()=>{
 for(let seed=0;seed<100;seed++){
  let g=createGame(rng(seed+1));let moves=0;
  while(g.winner===null&&moves<300){const seat=g.turn;const cards=chooseBotMove(g.hands[seat],g.table,g.opening,g.hands.filter((_,i)=>i!==seat).map(h=>h.length));assert.equal(explainMove(g,seat,cards),null);g=act(g,seat,cards);assert.equal(new Set([...g.hands.flat(),...g.played]).size,52);assert.ok(restoreGame(JSON.parse(JSON.stringify(g))));moves++;}
  assert.notEqual(g.winner,null,`seed ${seed} stalled`);assert.equal(g.hands[g.winner].length,0);assert.equal(scores(g).reduce((a,b)=>a+b,0),0);assert.throws(()=>act(g,g.turn,[]),/selesai/);
 }
});
