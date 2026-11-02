import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {writeFileSync,mkdirSync,unlinkSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import * as THREE from 'three';

mkdirSync('.sites-runtime',{recursive:true});
const compiled=await build({stdin:{contents:`export * from './app/tekad-racing/harbor/course'; export * from './app/tekad-racing/harbor/simulation'; export * from './app/tekad-racing/harbor/world'; export * from './app/tekad-racing/harbor/kart'; export * from './app/tekad-racing/race-clock';`,resolveDir:process.cwd(),loader:'ts'},bundle:true,platform:'node',format:'esm',packages:'external',write:false});
const path=resolve('.sites-runtime/harbor-test.mjs');writeFileSync(path,compiled.outputFiles[0].text);
const lib=await import(pathToFileURL(path).href);unlinkSync(path);
const course=lib.createHarborCourse();
const straight={length:10240,samples:Array.from({length:1024},(_,i)=>({x:0,y:0,z:i*10,tx:0,ty:0,tz:1,width:40}))};
const drive=(state,input,seconds,track=straight)=>{for(let i=0;i<Math.round(seconds/lib.RACE_STEP);i++)lib.stepHarbor(state,input,track,lib.RACE_STEP);};

test('progressive acceleration and brake priority have bounded stopping distance',()=>{
  const state=lib.freshHarborState(),input=lib.freshHarborInput();input.throttle=true;
  drive(state,input,1);const first=state.speed;drive(state,input,1);const second=state.speed;
  assert.ok(first>8&&first<11);assert.ok(second-first<first,'acceleration tapers with speed');
  drive(state,input,5);assert.equal(state.speed,28);
  const initial=state.distance;input.brake=true;drive(state,input,2);
  assert.equal(state.speed,0,'braking overrides held gas');
  const stopping=state.distance-initial;assert.ok(stopping>19&&stopping<22,`stopping ${stopping}`);
  const stopped=state.distance;drive(state,input,2);assert.equal(state.distance,stopped,'no creep with held brake');
  console.log(`100.8 km/h braking distance: ${stopping.toFixed(2)}m on straight dry track`);
});

test('steering changes heading before moving sideways and releases smoothly',()=>{
  const idle=lib.freshHarborState(),input=lib.freshHarborInput();input.right=true;input.brake=true;
  drive(idle,input,1);assert.equal(idle.heading,0);assert.equal(idle.lateral,0,'no stationary strafing');
  const right=lib.freshHarborState();right.speed=23;input.brake=false;
  drive(right,input,.35);assert.ok(right.heading>0);assert.ok(right.lateralSpeed>0);assert.ok(right.lateral>0);
  const heading=right.heading,velocity=right.lateralSpeed;input.right=false;
  drive(right,input,lib.RACE_STEP);assert.ok(right.lateralSpeed>velocity*.85,'release must not snap velocity to zero');
  drive(right,input,1);assert.ok(Math.abs(right.heading)<heading*.12,'heading settles after release');
  const left=lib.freshHarborState(),mirror=lib.freshHarborState();left.speed=mirror.speed=23;
  drive(left,{...lib.freshHarborInput(),left:true},.5);drive(mirror,{...lib.freshHarborInput(),right:true},.5);
  assert.ok(Math.abs(left.lateral+mirror.lateral)<1e-8);assert.ok(Math.abs(left.heading+mirror.heading)<1e-8);
});

test('road re-entry restores speed gradually and recovery clears all motion',()=>{
  const state=lib.freshHarborState();state.speed=28;state.lateral=5;
  const narrow={...straight,samples:straight.samples.map(p=>({...p,width:10}))};
  drive(state,lib.freshHarborInput(),1,narrow);assert.ok(state.offroad);assert.ok(state.speed<=18.1);
  state.lateral=0;const slow=state.speed;drive(state,lib.freshHarborInput(),lib.RACE_STEP,narrow);assert.ok(state.speed>slow&&state.speed<slow+.1);
  state.heading=.3;state.lateralSpeed=4;state.braking=true;lib.recoverHarbor(state);
  assert.equal(state.heading,0);assert.equal(state.lateralSpeed,0);assert.equal(state.braking,false);
});

test('one closed course drives map, elevation and lateral placement without seam jumps',()=>{
  assert.ok(course.length>650&&course.length<1000,`length ${course.length}`);
  const a=lib.sampleCourse(course,0),b=lib.sampleCourse(course,course.length),before=lib.sampleCourse(course,course.length-.01);
  assert.ok(Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z)<1e-6);
  assert.ok(Math.hypot(a.x-before.x,a.y-before.y,a.z-before.z)<.011);
  const map=lib.courseMap(course);assert.ok(map.path.endsWith('Z'));
  for(let i=0;i<course.samples.length;i++){
    const distance=i/course.samples.length*course.length,p=lib.sampleCourse(course,distance),offset=lib.sampleCourse(course,distance,2),m=map.point(p);
    assert.ok(Math.abs(Math.hypot(offset.x-p.x,offset.z-p.z)-2)<1e-7);
    assert.ok(m.x>=9.99&&m.x<=110.01&&m.y>=9.99&&m.y<=110.01);
    assert.ok(p.width>=9.4&&p.width<=11.1);
  }
  assert.ok(Math.max(...course.samples.map(p=>p.y))>7.9,'real bridge elevation');
});

test('full three-lap simulation is cadence-independent and recovery never grants progress',()=>{
  const results=[];
  for(const fps of [15,30,60,120]){
    const state=lib.freshHarborState(),clock=lib.createRaceClock(0),input=lib.freshHarborInput();
    let frame=0;
    while(!state.finished&&frame<fps*600){
      const steps=lib.advanceRaceClock(clock,++frame*1000/fps,true);
      for(let i=0;i<steps;i++){
        // Repeatable driver; not a claim of measured human handling quality.
        input.left=state.lateral>.3;input.right=state.lateral<-.3;
        lib.stepHarbor(state,input,course,lib.RACE_STEP);
      }
    }
    assert.ok(state.finished);assert.equal(state.lap,3);assert.equal(state.distance,course.length*3);results.push(state.elapsed);
  }
  assert.deepEqual(results,[results[0],results[0],results[0],results[0]]);
  const state=lib.freshHarborState();state.distance=course.length*.8;state.elapsed=35;state.lateral=5;state.speed=20;
  lib.recoverHarbor(state);assert.equal(state.distance,course.length*.8);assert.equal(state.elapsed,35);assert.equal(state.lateral,0);assert.equal(state.recoveries,1);
  console.log(`Harbor length ${course.length.toFixed(1)}m; deterministic 3-lap time ${results[0].toFixed(2)}s`);
});

test('road collision, braking and articulated scene geometry remain finite',()=>{
  const state=lib.freshHarborState(),input=lib.freshHarborInput();input.right=true;
  let hit=false;
  for(let i=0;i<120*15;i++){lib.stepHarbor(state,input,course,lib.RACE_STEP);hit ||= state.impact>0;assert.ok(Number.isFinite(state.distance));}
  assert.ok(hit);assert.ok(Math.abs(state.lateral)<=lib.sampleCourse(course,state.distance).width/2+.7);
  input.brake=true;input.right=false;for(let i=0;i<120*3;i++)lib.stepHarbor(state,input,course,lib.RACE_STEP);assert.equal(state.speed,0);
  const world=lib.createHarborWorld(course),kart=lib.createTimmyKart();state.steering=.8;state.speed=20;state.wheelAngle=1.5;kart.update(state,10);world.update(10);
  assert.equal(kart.wheels.length,4);assert.notEqual(kart.wheels.find(w=>w.front).pivot.rotation.y,0);assert.notEqual(kart.driver.rotation.z,0);
  let meshes=0,instances=0;
  for(const root of [world.root,kart.root])root.traverse(o=>{
    if(o instanceof THREE.Mesh){meshes++;if(o instanceof THREE.InstancedMesh)instances+=o.count;
      for(const attribute of Object.values(o.geometry.attributes))for(const value of attribute.array)assert.ok(Number.isFinite(value));
      o.geometry.computeBoundingSphere();assert.ok(Number.isFinite(o.geometry.boundingSphere.radius));
    }
  });
  assert.ok(world.root.getObjectByName('barrier-left'));assert.ok(world.root.getObjectByName('barrier-right'));
  assert.ok(meshes<160,`mesh budget ${meshes}`);
  console.log(`Scene objects: ${meshes} mesh batches, ${instances} instanced props`);
});
