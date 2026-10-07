import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {writeFileSync,unlinkSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import * as THREE from 'three';

const compiled=await build({stdin:{contents:`export * from './app/tekad-racing/harbor/course';export * from './app/tekad-racing/harbor/simulation';export * from './app/tekad-racing/harbor/drift';export * from './app/tekad-racing/harbor/drift-effect';export * from './app/tekad-racing/harbor/kart';export * from './app/tekad-racing/harbor/camera';export * from './app/tekad-racing/race-clock';`,resolveDir:process.cwd(),loader:'ts'},bundle:true,platform:'node',format:'esm',packages:'external',write:false});
const file=resolve('.sites-runtime/drift-test.mjs');writeFileSync(file,compiled.outputFiles[0].text);const lib=await import(pathToFileURL(file).href);unlinkSync(file);
const wide={length:10240,samples:Array.from({length:1024},(_,i)=>({x:0,y:0,z:i*10,tx:0,ty:0,tz:1,width:60}))};
const course=lib.createHarborCourse(),dt=lib.RACE_STEP;
const tick=(s,input,seconds,track=wide)=>{for(let i=0;i<Math.round(seconds/dt);i++)lib.stepHarbor(s,{...lib.freshHarborInput(),...input},track,dt);};
const charged=seconds=>{const s=lib.freshHarborState();s.speed=23;tick(s,{drift:true,right:true},seconds);return s;};

test('drift requires a fresh press, speed and direction; taps do not grant a turbo',()=>{
  for(const input of [{drift:true},{drift:true,right:true,brake:true}]){
    const s=lib.freshHarborState();tick(s,input,3);assert.equal(s.driftSide,0);assert.equal(s.driftCharge,0);assert.equal(s.boostRemaining,0);
  }
  const s=lib.freshHarborState();s.speed=23;tick(s,{drift:true,right:true},.2);assert.equal(s.driftSide,1);tick(s,{},dt);assert.equal(s.turboCount,0);
  const left=lib.freshHarborState();left.speed=23;tick(left,{drift:true,left:true},1);assert.equal(left.driftSide,-1);assert.ok(left.driftCharge>.5);
  const buffered=lib.freshHarborState();buffered.speed=23;tick(buffered,{drift:true},.1);tick(buffered,{drift:true,right:true},dt);assert.equal(buffered.driftSide,1,'two-thumb input has a short start buffer');
  const expired=lib.freshHarborState();expired.speed=23;tick(expired,{drift:true},.3);tick(expired,{drift:true,right:true},dt);assert.equal(expired.driftSide,0,'holding indefinitely does not auto-start a drift');
});

test('two charge levels release bounded boosts, preserve steering and expire smoothly',()=>{
  for(const [duration,tier] of [[1.1,1],[2,2]]){
    const s=charged(duration);assert.equal(lib.driftTier(s.driftCharge),tier);tick(s,{},dt);assert.equal(s.boostTier,tier);assert.equal(s.turboCount,1);assert.equal(s.driftSide,0);
    const old=s.speed;tick(s,{left:true},.3);assert.ok(s.speed>old);assert.ok(s.speed<=33);assert.ok(s.steering<0,'steering remains usable during boost');
    tick(s,{},2);assert.equal(s.boostRemaining,0);assert.equal(s.boostTier,0);assert.equal(s.turboCount,1);
    assert.ok(s.speed<=33&&s.speed>=23,'speed decays rather than snaps');
  }
});

test('countersteering controls drift width without reversing its chosen side',()=>{
  const tight=charged(.5),wideLine=structuredClone(tight);
  tick(tight,{drift:true,right:true},.5);tick(wideLine,{drift:true,left:true},.5);
  assert.equal(wideLine.driftSide,1);assert.ok(wideLine.lateralSpeed<tight.lateralSpeed);assert.ok(wideLine.heading<tight.heading);
});

test('braking, offroad, impact, recovery and finish cancel charge and active boosts',()=>{
  const narrow={...wide,samples:wide.samples.map(p=>({...p,width:11}))};
  for(const type of ['brake','offroad','impact','recover','finish'])for(const boosting of [false,true]){
    const s=charged(2);if(boosting)tick(s,{},dt);
    if(type==='recover')lib.recoverHarbor(s);
    else{if(type==='offroad')s.lateral=5;if(type==='impact')s.lateral=9;if(type==='finish')s.distance=narrow.length*3-.001;tick(s,{drift:!boosting,brake:type==='brake'},dt,narrow);}
    assert.equal(s.driftSide,0,type);assert.equal(s.driftCharge,0,type);assert.equal(s.boostRemaining,0,type);
  }
  const s=charged(2);lib.cancelDrift(s);tick(s,{drift:true,right:true},.5);assert.equal(s.driftSide,0,'held key cannot rearm cancelled drift');tick(s,{},dt);assert.equal(s.turboCount,0);
});

test('real Harbor has usable blue and gold drifts without leaving asphalt',()=>{
  const results=[];
  for(const tier of [1,2]){
    const s=lib.freshHarborState();s.speed=23;s.lateral=-3;
    for(let n=0;n<360&&lib.driftTier(s.driftCharge)<tier;n++)lib.stepHarbor(s,{...lib.freshHarborInput(),drift:true,right:s.lateral<-1,left:s.lateral>=-1&&s.heading>.07},course,dt);
    assert.equal(lib.driftTier(s.driftCharge),tier,JSON.stringify({tier,lateral:s.lateral,charge:s.driftCharge,heading:s.heading,offroad:s.offroad}));assert.equal(s.collisionCount,0);assert.equal(s.offroad,false);
    const charge=s.driftCharge;lib.stepHarbor(s,lib.freshHarborInput(),course,dt);assert.equal(s.boostTier,tier);
    results.push({tier,charge,distance:s.distance,lateral:s.lateral});
    tick(s,{left:true},.35,course);assert.ok(s.boostRemaining>0,'earned turbo survives steering out of the drift');assert.ok(s.speed>23);assert.equal(s.offroad,false);
  }
  console.log('Harbor drift release samples',results);
});

test('drift/boost cadence is deterministic across 15/30/60/120/144 Hz',()=>{
  const results=[];
  for(const fps of [15,30,60,120,144]){
    const s=lib.freshHarborState();s.speed=23;const clock=lib.createRaceClock(0);
    for(let frame=1;frame<=fps*6;frame++)for(let n=lib.advanceRaceClock(clock,frame*1000/fps,true);n>0;n--){
      lib.stepHarbor(s,{...lib.freshHarborInput(),drift:s.elapsed<2,right:s.elapsed<2},wide,dt);
    }
    results.push(s);
  }
  for(const s of results)assert.deepEqual(s,results[0]);assert.equal(results[0].turboCount,1);
});

test('effects use bounded pools, clear on reduced motion, and exhaust responds to turbo',()=>{
  const effect=lib.createDriftEffect(),s=charged(2),kart=lib.createTimmyKart();
  for(let i=0;i<120;i++)effect.update(s,wide,dt);
  assert.equal(effect.root.children.reduce((n,m)=>n+m.count,0),144);
  for(const mesh of effect.root.children)for(const v of mesh.instanceMatrix.array)assert.ok(Number.isFinite(v));
  effect.update(s,wide,0,true);const m=new THREE.Matrix4(),v=new THREE.Vector3();
  for(const mesh of effect.root.children)for(let i=0;i<mesh.count;i++){mesh.getMatrixAt(i,m);v.setFromMatrixScale(m);assert.ok(v.x===0||v.y===0||v.z===0);}
  tick(s,{},dt);kart.update(s,1);assert.equal(kart.root.getObjectByName('mini-turbo-exhaust').visible,true);kart.update(s,1,true);assert.equal(kart.root.getObjectByName('mini-turbo-exhaust').visible,false);
});

test('active turbo and its exhaust remain framed at racing speed in portrait and landscape',()=>{
  const kart=lib.createTimmyKart(),s=lib.freshHarborState();s.speed=33;s.boostRemaining=1;s.boostTier=2;kart.update(s,0);kart.root.updateMatrixWorld(true);
  const points=[];
  kart.root.traverseVisible(o=>{if(o.isMesh){o.geometry.computeBoundingBox();const b=o.geometry.boundingBox;for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z])points.push(new THREE.Vector3(x,y,z).applyMatrix4(o.matrixWorld));}});
  let worstX=0,worstY=0;const frame=new THREE.PerspectiveCamera(),transform=new THREE.Object3D();
  for(const aspect of [9/16,16/9])for(let n=0;n<48;n++)for(const side of [-1,0,1])for(const heading of [-.55,0,.55]){
    const distance=n/48*course.length,road=lib.sampleCourse(course,distance),pose={distance,lateral:side*(road.width/2-.85),heading,speed:33,lift:0},view=lib.chaseCameraTarget(course,pose,aspect);
    frame.aspect=aspect;frame.fov=view.fov;frame.position.copy(view.position);frame.lookAt(view.target.x,view.target.y,view.target.z);frame.updateProjectionMatrix();frame.updateMatrixWorld();
    const p=lib.sampleCourse(course,distance,pose.lateral);transform.position.set(p.x,p.y+.035,p.z);transform.rotation.set(-Math.atan2(p.ty,Math.hypot(p.tx,p.tz)),Math.atan2(p.tx,p.tz)+heading,0,'YXZ');transform.updateMatrixWorld();
    for(const point of points){const q=point.clone().applyMatrix4(transform.matrixWorld).project(frame);worstX=Math.max(worstX,Math.abs(q.x));worstY=Math.max(worstY,Math.abs(q.y));}
  }
  console.log({boostFraming:{worstX,worstY}});assert.ok(worstX<.98);assert.ok(worstY<.98);
});
