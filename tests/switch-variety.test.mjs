import test from 'node:test';
import assert from 'node:assert/strict';
import {nextForestPattern,verdantSection} from '../app/switch-run/verdant-terrain.ts';
import {createFrostWeather,stepFrostWeather} from '../app/switch-run/frost-weather.ts';
const seeded=()=>{let seed=19;return()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);};
test('forest shuffle covers all eight patterns without adjacent repeats across bags',()=>{
 const rng=seeded(),state={bag:[],last:-1};let previous=-1;
 for(let b=0;b<40;b++){const seen=new Set();for(let i=0;i<8;i++){const n=nextForestPattern(state,rng);assert.notEqual(n,previous);previous=n;seen.add(n);}assert.equal(seen.size,8);}
});
test('varied forest sections retain a route within ordinary jump reach',()=>{
 const rng=seeded();let floor=458;
 for(let i=0;i<400;i++){
  const s=verdantSection(20000,floor,i%8,rng),p=s.platforms.filter(p=>!p.require).sort((a,b)=>a.x-b.x),reachable=new Set([0]);
  for(let j=1;j<p.length;j++)for(let k=0;k<j;k++)if(reachable.has(k)){
   const rise=p[k].y-p[j].y,disc=625**2-2*1750*rise;if(disc<0)continue;
   const reach=275*(625+Math.sqrt(disc))/1750+43;
   if(p[j].x-(p[k].x+p[k].w)<=reach){reachable.add(j);break;}
  }
  assert.ok(reachable.has(p.length-1),`pattern ${s.pattern} floor ${floor}`);assert.equal(s.end,21160);floor=s.floor;
 }
});
test('blizzard warns for two seconds, slows four seconds, then recovers and clears at arena/world exit',()=>{
 const s=createFrostWeather(),rng=seeded();assert.equal(stepFrostWeather(s,12,45000,rng),1);assert.equal(s.warning,2);
 assert.equal(stepFrostWeather(s,1,45000,rng),1);assert.equal(stepFrostWeather(s,1,45000,rng),.75);assert.equal(s.remaining,4);
 assert.equal(stepFrostWeather(s,3.5,45000,rng),.75);assert.equal(stepFrostWeather(s,.5,45000,rng),1);assert.ok(s.cooldown>=16&&s.cooldown<=30);
 for(const x of [10000,40000,58300,59000,60000]){s.remaining=3;s.warning=0;assert.equal(stepFrostWeather(s,.01,x,rng),1);assert.equal(s.remaining,0);}
});
