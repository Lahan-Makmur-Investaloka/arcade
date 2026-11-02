import test from 'node:test';
import assert from 'node:assert/strict';
import {beastTouchesPlayer,shotHitsBeast} from '../app/switch-run/boss-collision.ts';
import {drawFrostWeather} from '../app/switch-run/frost-weather.ts';
const glacier={kind:'glacier',x:100,y:328,w:270,h:130,vx:-1};
const magma={kind:'magma',x:100,y:278,w:280,h:180,vx:-1};
test('upper platform shots miss glacier unless they reach its actual silhouette',()=>{
 assert.equal(shotHitsBeast(glacier,{x:235,y:300,radius:12}),false);
 assert.equal(shotHitsBeast(glacier,{x:235,y:390,radius:12}),true);
 assert.equal(shotHitsBeast(glacier,{x:110,y:340,radius:5}),false);
});
test('scorpion empty upper front is safe, physical tail is not, in both directions',()=>{
 for(const vx of [-1,1]){
  const e={...magma,vx};
  const rect=(x,y,w,h)=>({x:e.x+(vx>0?e.w-x-w:x),y:e.y+y,w,h});
  assert.equal(beastTouchesPlayer(e,rect(20,10,43,66)),false);
  assert.equal(beastTouchesPlayer(e,rect(200,11,12,12)),true);
  assert.equal(beastTouchesPlayer(e,rect(20,-80,43,66)),false);
 }
});
test('storm warning has text, active storm only draws weather',()=>{
 const calls=[];
 const ctx=new Proxy({}, {get:(_,key)=>(...args)=>calls.push([key,...args]),set:()=>true});
 drawFrostWeather(ctx,{warning:2,remaining:0,elapsed:0});
 assert.equal(calls.filter(c=>c[0]==='fillText').length,1);
 calls.length=0;
 drawFrostWeather(ctx,{warning:0,remaining:4,elapsed:2});
 assert.equal(calls.filter(c=>c[0]==='fillText').length,0);
 assert.ok(calls.some(c=>c[0]==='stroke'));
});
