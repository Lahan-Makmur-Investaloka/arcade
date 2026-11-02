import assert from 'node:assert/strict';
import test from 'node:test';
import {levels,rotate,trace} from '../app/eldrics-workshop/engine.ts';
test('All 20 authored levels are solvable by rotating unlocked tiles',()=>{
 assert.equal(levels.length,20);
 for(const [n,l] of levels.entries()){
  const solved=l.tiles.map((t,i)=>{if(t.fixed)return t.mask;let m=t.mask;for(let r=0;r<4;r++){if(m===l.solution[i])return m;m=rotate(m);}if(l.solution[i]===0)return t.mask;throw Error(`Unreachable tile ${i} in level ${n+1}`);});
  assert.ok(trace(l,solved).success,`Level ${n+1}`);
  assert.equal(trace(l,l.tiles.map(t=>t.mask)).success,false);
  assert.equal(l.targets.length,n<10?1:n<15?2:3);
  const broken=[...solved];broken[l.source]=0;assert.equal(trace(l,broken).success,false);
  assert.equal(new Set(trace(l,solved).layers.flat()).size,trace(l,solved).layers.flat().length);
 }
});
test('Disconnected source reports leak and four turns restore each mask',()=>{
 const l=levels[0],m=l.tiles.map(t=>t.mask);m[4]=5;
 assert.deepEqual(trace(l,m).leaks,[3]);
 for(let mask=0;mask<16;mask++)assert.equal(rotate(rotate(rotate(rotate(mask)))),mask);
});

test('Energy enters each reached tile through a reciprocal open connection',()=>{
 for(const l of levels){const result=trace(l,l.solution);for(const [cell,direction] of Object.entries(result.entries))assert.ok(l.solution[Number(cell)]&(1<<direction));assert.equal(Object.keys(result.entries).length,result.layers.flat().length-1);}
});
