import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {resolve} from 'node:path';
import {act,restoreGame,scores,penalty} from '../app/big-two/engine.ts';
await build({entryPoints:[resolve('app/big-two/portrait/kirana-skills.ts')],bundle:true,outfile:resolve('.sites-runtime/kirana-test.mjs'),format:'esm',platform:'node'});
const {newSkillGame,openingSkill,finishPeek,giveCard,giftReason,restoreSkillGame}=await import(resolve('.sites-runtime/kirana-test.mjs'));
const conserve=g=>assert.equal(new Set([...g.hands.flat(),...g.played]).size,52);
test('Kirana chooses only one opening skill; shuffle resets all hands and opening owner',()=>{
 const g=newSkillGame(true,()=>.4),n=openingSkill(g,'shuffle',()=>.7);
 assert.notDeepEqual(n.hands,g.hands);assert.deepEqual(n.hands.map(h=>h.length),[13,13,13,13]);assert.equal(n.turn,n.hands.findIndex(h=>h.includes(0)));conserve(n);
 assert.throws(()=>openingSkill(n,'peek'));assert.equal(restoreSkillGame(JSON.parse(JSON.stringify(n)),true).kirana.opening,'shuffle');
 assert.equal(newSkillGame(false).kirana,undefined);
});
test('peek reveals exactly the three highest cards and waits for explicit round start',()=>{
 const g=newSkillGame(true,()=>.4),n=openingSkill(g,'peek');assert.deepEqual(n.kirana.seen,g.hands.slice(1).map(h=>Math.max(...h)));assert.deepEqual(n.hands,g.hands);assert.equal(n.kirana.phase,'peek');
 assert.equal(restoreSkillGame(JSON.parse(JSON.stringify(n)),true).kirana.phase,'peek');assert.equal(finishPeek(n).kirana.phase,'ready');assert.throws(()=>openingSkill(n,'shuffle'));
});
test('gift is once per round, preserves turn/table, supports 14-card save without widening Classic',()=>{
 let g=openingSkill(newSkillGame(true,()=>.4),'skip');const seat=g.turn;g={...g,hands:[...g.hands.slice(seat),...g.hands.slice(0,seat)],turn:0};
 const card=g.hands[0].find(c=>c!==0),n=giveCard(g,card,2);assert.equal(n.hands[0].length,12);assert.equal(n.hands[2].length,14);assert.equal(n.turn,0);assert.equal(n.table,g.table);assert.equal(n.sequence,g.sequence);conserve(n);
 assert.equal(restoreGame(JSON.parse(JSON.stringify(n))),null);assert.ok(restoreSkillGame(JSON.parse(JSON.stringify(n)),true));assert.equal(restoreSkillGame(n,false),null);assert.throws(()=>giveCard(n,n.hands[0][0],1));
 const played=act(n,0,[0]);assert.ok(played.kirana.gift);assert.ok(restoreSkillGame(JSON.parse(JSON.stringify(played)),true));
 assert.equal(penalty(14),42);assert.equal(scores({...n,winner:0,hands:[[],...n.hands.slice(1)]}).reduce((a,b)=>a+b),0);
});
test('gift rejects opening three, last card, wrong turn, invalid targets and absent cards',()=>{
 let g=openingSkill(newSkillGame(true,()=>.4),'skip');const seat=g.turn;g={...g,hands:[...g.hands.slice(seat),...g.hands.slice(0,seat)],turn:0};
 assert.match(giftReason(g,0,1),/3♦/);assert.throws(()=>giveCard(g,99,1));assert.throws(()=>giveCard(g,g.hands[0][1],0));assert.throws(()=>giveCard({...g,turn:1},g.hands[0][1],1));
 assert.throws(()=>giveCard({...g,opening:false,hands:[[5],...g.hands.slice(1)]},5,1));
 assert.equal(restoreSkillGame({...g,kirana:{...g.kirana,gift:{card:90,target:8}}},true),null);
});
