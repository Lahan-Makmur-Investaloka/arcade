import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const source = fs.readFileSync(new URL('../app/switch-run/warden.ts', import.meta.url), 'utf8');
const compiled = ts.transpile(source, {module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022});
const {stepWarden,clampArenaPlayer,wardenStage,arenaSteps,ARENA_GATE,ARENA_LEFT,WARDEN_HP} = await import('data:text/javascript;base64,' + Buffer.from(compiled).toString('base64'));
const boss = () => ({x:9500,y:302,w:132,h:156,vx:-1,phase:0,hp:WARDEN_HP,maxHp:WARDEN_HP,alive:true});

test('gate contains either-speed movement and aerial overshoot', () => {
 for (const speed of [275,400,2000]) {
  let x = 9900;
  for(let frame=0;frame<300;frame++)x=clampArenaPlayer(x+speed/30,43);
  assert(x+43<=ARENA_GATE);assert(x<10000);
 }
 assert(clampArenaPlayer(-99999,43)>=ARENA_LEFT);
});

test('boss telegraphs every wave pair and stays inside arena over repeated cycles', () => {
 const b=boss();let volleys=0,chargeTime=0;
 for(let frame=0;frame<3600;frame++) {
  if(wardenStage(b.phase)==='charge')chargeTime+=1/60;
  const waves=stepWarden(b,frame%300<150?8724:9937,1/60);
  assert(b.x>=ARENA_LEFT+24);assert(b.x+b.w<=ARENA_GATE);
  if(waves.length){assert.equal(waves.length,2);assert(chargeTime>.7);assert(waves[0].vx<0&&waves[1].vx>0);assert(waves.every(w=>w.h<=16));volleys++;chargeTime=0;}
 }
 assert.equal(volleys,10);
});

test('boss can reach both ends of the full arena', () => {
 const b=boss();
 for(let i=0;i<12000;i++)stepWarden(b,ARENA_LEFT+24,1/60);
 assert.equal(b.x,ARENA_LEFT+24);
 for(let i=0;i<12000;i++)stepWarden(b,ARENA_GATE-43,1/60);
 assert.equal(b.x+b.w,ARENA_GATE);
});

test('air steps are reachable using normal jump and clear boss height', () => {
 const steps=arenaSteps(458), gravity=1750, jumpSpeed=625, speed=275;
 assert.equal(steps.length,5);
 const peak=jumpSpeed*jumpSpeed/(2*gravity);
 assert(458-steps[0].y<peak);
 assert(458-steps[0].y+peak>156+20);
 for(let i=1;i<steps.length;i++){
  const previous=steps[i-1],next=steps[i],rise=previous.y-next.y;
  assert(rise<peak);
  const landingTime=(jumpSpeed+Math.sqrt(jumpSpeed*jumpSpeed-2*gravity*rise))/gravity;
  assert(next.x-(previous.x+previous.w)<speed*landingTime);
 }
 assert(steps.every(p=>p.x>ARENA_LEFT&&p.x+p.w<ARENA_GATE&&p.y>171));
});

test('low-health phase is faster, and a defeated boss never attacks', () => {
 const normal=boss(),rage=boss();normal.phase=rage.phase=2.29;rage.hp=30;
 const normalWaves=stepWarden(normal,8800,.02),rageWaves=stepWarden(rage,8800,.02);
 assert(Math.abs(rageWaves[0].vx)>Math.abs(normalWaves[0].vx));
 rage.alive=false;const x=rage.x;
 for(let i=0;i<600;i++)assert.deepEqual(stepWarden(rage,8800,.033),[]);
 assert.equal(rage.x,x);
});
