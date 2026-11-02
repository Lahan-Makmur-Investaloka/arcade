import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {writeFileSync,unlinkSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import * as THREE from 'three';

const result=await build({stdin:{contents:`export * from './app/tekad-racing/harbor/course';export * from './app/tekad-racing/harbor/simulation';export * from './app/tekad-racing/harbor/camera';export * from './app/tekad-racing/harbor/bounds';export * from './app/tekad-racing/harbor/collision';export * from './app/tekad-racing/harbor/world';export * from './app/tekad-racing/harbor/kart';export * from './app/tekad-racing/race-clock';`,resolveDir:process.cwd(),loader:'ts'},bundle:true,platform:'node',format:'esm',packages:'external',write:false});
const path=resolve('.sites-runtime/harbor-camera-tests.mjs');writeFileSync(path,result.outputFiles[0].text);const lib=await import(pathToFileURL(path).href);unlinkSync(path);
const course=lib.createHarborCourse();
const straight={length:10240,samples:Array.from({length:1024},(_,i)=>({x:0,y:0,z:i*10,tx:0,ty:0,tz:1,width:11}))};
// Box3.setFromObject includes invisible exhaust effects. Framing/physical-body
// checks must inspect visible meshes, while active VFX has its own stage-5 check.
const visibleBounds=root=>{const box=new THREE.Box3();root.updateMatrixWorld(true);root.traverseVisible(o=>{if(o.isMesh){o.geometry.computeBoundingBox();box.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld));}});return box;};

test('kart fits camera frame around the course at edges, headings and phone aspects',()=>{
  const kart=lib.createTimmyKart();const bounds=visibleBounds(kart.root);
  const corners=[];for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z])corners.push(new THREE.Vector3(x,y,z));
  let worstX=0,worstY=0,poses=0,worst=null;
  const frame=new THREE.PerspectiveCamera(),root=new THREE.Object3D();
  for(const aspect of [9/16,16/9,19.5/9])for(const speed of [0,28])for(let i=0;i<96;i++)for(const heading of [-.55,0,.55])for(const side of [-1,0,1]){
    const distance=course.length*i/96,width=lib.sampleCourse(course,distance).width,lateral=side*lib.kartCenterLimit(width,heading)*.98;
    const pose={distance,lateral,heading,speed,lift:0},view=lib.chaseCameraTarget(course,pose,aspect),p=lib.sampleCourse(course,distance,lateral);
    frame.aspect=aspect;frame.fov=view.fov;frame.near=.15;frame.far=700;frame.position.copy(view.position);frame.lookAt(view.target.x,view.target.y,view.target.z);frame.updateProjectionMatrix();frame.updateMatrixWorld();
    root.position.set(p.x,p.y+.035,p.z);root.rotation.set(-Math.atan2(p.ty,Math.hypot(p.tx,p.tz)),Math.atan2(p.tx,p.tz)+heading,0,'YXZ');root.updateMatrixWorld();
    for(const corner of corners){const projected=corner.clone().applyMatrix4(root.matrixWorld).project(frame);if(Math.abs(projected.x)>worstX){worstX=Math.abs(projected.x);worst={aspect,speed,i,side,heading};}worstY=Math.max(worstY,Math.abs(projected.y));assert.ok(projected.z>-1&&projected.z<1);}
    poses++;
  }
  console.log(JSON.stringify({cameraPoses:poses,worstX,worstY,worst}));
  assert.ok(worstX<.96,'kart must remain horizontally inside the viewport');assert.ok(worstY<.96,'kart must remain vertically inside the viewport');
});

test('camera has an unobstructed view of driver over bridge crests',()=>{
  const world=lib.createHarborWorld(course);world.root.updateMatrixWorld(true);
  const blockers=world.root.children;
  const ray=new THREE.Raycaster();let checks=0;
  for(let i=0;i<96;i++)for(const side of [-1,0,1]){
    const distance=i/96*course.length,p=lib.sampleCourse(course,distance),lateral=side*(p.width/2);
    const pose={distance,lateral,heading:0,speed:28,lift:0},camera=lib.chaseCameraTarget(course,pose,9/16),kart=lib.sampleCourse(course,distance,lateral);
    const from=new THREE.Vector3(camera.position.x,camera.position.y,camera.position.z),to=new THREE.Vector3(kart.x,kart.y+1.75,kart.z),direction=to.clone().sub(from);
    ray.set(from,direction.clone().normalize());ray.near=.05;ray.far=direction.length()-.1;
    assert.equal(ray.intersectObjects(blockers,true).length,0,`occlusion at sample ${i}, side ${side}`);checks++;
  }
  console.log(`Driver sightlines clear: ${checks}`);
});

test('camera smoothing is identical at 15/30/60/120/144 Hz and cannot move with zero dt',()=>{
  const results=[];
  for(const fps of [15,30,60,120,144]){
    const state=lib.freshHarborState(),camera=lib.freshChaseCamera(),clock=lib.createRaceClock(0);
    lib.stepChaseCamera(camera,course,lib.harborPose(state),16/9,0,false,true);
    for(let frame=1;frame<=fps*10;frame++){
      const steps=lib.advanceRaceClock(clock,frame*1000/fps,true);
      for(let tick=0;tick<steps;tick++){lib.stepHarbor(state,{left:state.lateral>.3,right:state.lateral<-.3,brake:false,throttle:true},course,lib.RACE_STEP);lib.stepChaseCamera(camera,course,lib.harborPose(state),16/9,lib.RACE_STEP);}
    }
    results.push(camera);
    const before=structuredClone(camera);for(let i=0;i<120;i++)lib.stepChaseCamera(camera,course,{...lib.harborPose(state),distance:state.distance+30},16/9,0);assert.deepEqual(camera,before);
  }
  for(const result of results)assert.deepEqual(result,results[0]);
});

test('moving camera keeps kart framed during weaving, scraping, recovery and braking',()=>{
  const kart=lib.createTimmyKart();const box=visibleBounds(kart.root),corners=[];
  for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z])corners.push(new THREE.Vector3(x,y,z));
  let worstX=0,worstY=0,observations=0;
  for(const aspect of [9/16,16/9]){
    const state=lib.freshHarborState(),camera=lib.freshChaseCamera(),projector=new THREE.PerspectiveCamera(),root=new THREE.Object3D();
    lib.stepChaseCamera(camera,course,lib.harborPose(state),aspect,0,false,true);
    for(let tick=0;tick<120*100;tick++){
      const time=tick/120,cycle=Math.floor(time/4)%4;
      const input={left:cycle===1||cycle===2,right:cycle===0,brake:time%17>15,throttle:time%17<15};
      if(tick===120*24||tick===120*65)lib.recoverHarbor(state);
      lib.stepHarbor(state,input,course,lib.RACE_STEP);const pose=lib.harborPose(state);lib.stepChaseCamera(camera,course,pose,aspect,lib.RACE_STEP);
      if(tick%6)continue;
      projector.aspect=aspect;projector.fov=camera.fov;projector.near=.15;projector.far=700;projector.position.copy(camera.position);projector.lookAt(camera.target.x,camera.target.y,camera.target.z);projector.updateProjectionMatrix();projector.updateMatrixWorld();
      const p=lib.sampleCourse(course,pose.distance,pose.lateral);root.position.set(p.x,p.y+.035+pose.lift,p.z);root.rotation.set(-Math.atan2(p.ty,Math.hypot(p.tx,p.tz)),Math.atan2(p.tx,p.tz)+pose.heading,0,'YXZ');root.updateMatrixWorld();
      for(const corner of corners){const q=corner.clone().applyMatrix4(root.matrixWorld).project(projector);worstX=Math.max(worstX,Math.abs(q.x));worstY=Math.max(worstY,Math.abs(q.y));}observations++;
    }
  }
  console.log(JSON.stringify({movingCameraObservations:observations,worstX,worstY}));
  assert.ok(worstX<.98);assert.ok(worstY<.98);
});

test('reduced-motion camera has no speed zoom and interpolation stays between fixed ticks',()=>{
  const pose={distance:300,lateral:2,heading:.3,speed:0,lift:0};
  const stopped=lib.chaseCameraTarget(course,pose,16/9,true),fast=lib.chaseCameraTarget(course,{...pose,speed:28},16/9,true);
  assert.equal(stopped.fov,fast.fov);assert.deepEqual(stopped.position,fast.position);
  const previous=lib.freshChaseCamera();lib.stepChaseCamera(previous,course,pose,16/9,0,false,true);
  const next=lib.copyChaseCamera(previous);lib.stepChaseCamera(next,course,{...pose,distance:301},16/9,lib.RACE_STEP);
  const midpoint=lib.interpolateChaseCamera(previous,next,.5);
  for(const axis of ['x','y','z'])assert.ok(Math.abs(midpoint.position[axis]-(previous.position[axis]+next.position[axis])/2)<1e-9);
});

test('glancing and hard contact differ; continuous scrape does not retrigger large penalties',()=>{
  const hit=(lateralSpeed)=>({...lib.freshHarborState(),lateral:7,heading:.3,speed:25,lateralSpeed});
  const glancing=hit(1),hard=hit(8);lib.resolveBarrierContact(glancing,11,lib.RACE_STEP);lib.resolveBarrierContact(hard,11,lib.RACE_STEP);
  assert.ok(glancing.speed>hard.speed+5);assert.equal(hard.collisionCount,1);
  for(let i=0;i<240;i++){hard.lateral=7;hard.lateralSpeed=4;hard.collisionCooldown=Math.max(0,hard.collisionCooldown-lib.RACE_STEP);lib.resolveBarrierContact(hard,11,lib.RACE_STEP);}
  assert.equal(hard.collisionCount,1,'one event for uninterrupted wall contact');assert.ok(hard.speed>10,'no repeated multiplicative speed collapse');
  hard.lateral=0;lib.resolveBarrierContact(hard,11,lib.RACE_STEP);hard.lateral=7;hard.lateralSpeed=8;lib.resolveBarrierContact(hard,11,lib.RACE_STEP);assert.equal(hard.collisionCount,2,'separation rearms next impact');
});

test('footprint remains behind both barrier faces through angled impacts and narrowing',()=>{
  for(const side of [-1,1]){
    const state=lib.freshHarborState();state.speed=28;
    const input={...lib.freshHarborInput(),left:side<0,right:side>0,throttle:true};
    for(let i=0;i<120*20;i++){
      lib.stepHarbor(state,input,course,lib.RACE_STEP);
      const width=lib.sampleCourse(course,state.distance).width;
      assert.ok(Math.abs(state.lateral)+lib.kartLateralExtent(state.heading)<=lib.barrierInnerEdge(width)-.08,'whole kart clears the barrier');
      assert.ok(Number.isFinite(state.speed)&&state.speed>=0);
    }
    assert.ok(state.speed>4,'held steering must not cause a repeated-impact standstill');
    input.left=side>0;input.right=side<0;
    for(let i=0;i<120;i++)lib.stepHarbor(state,input,course,lib.RACE_STEP);
    assert.equal(state.contactSide,0,'countersteering escapes contact');
  }
});

test('visible barriers use the same inner face as physics and kart mesh fits the declared footprint',()=>{
  const world=lib.createHarborWorld(course);
  for(const side of [-1,1]){
    const rail=world.root.getObjectByName(side<0?'barrier-left':'barrier-right'),vertices=rail.geometry.attributes.position;
    for(let i=0;i<=1024;i++){
      const distance=i/1024*course.length,p=lib.sampleCourse(course,distance),expected=lib.sampleCourse(course,distance,side*lib.barrierInnerEdge(p.width));
      assert.ok(Math.hypot(vertices.getX(i*4)-expected.x,vertices.getZ(i*4)-expected.z)<.00003);
    }
  }
  const kart=lib.createTimmyKart(),state=lib.freshHarborState();state.speed=28;
  for(const steering of [-1,0,1]){
    state.steering=steering;kart.update(state,0,true);const bounds=visibleBounds(kart.root);
    assert.ok(Math.max(Math.abs(bounds.min.x),Math.abs(bounds.max.x))<=lib.HARBOR_BOUNDS.kartHalfWidth+lib.HARBOR_BOUNDS.contactMargin);
    assert.ok(Math.max(Math.abs(bounds.min.z),Math.abs(bounds.max.z))<=lib.HARBOR_BOUNDS.kartHalfLength);
  }
});

test('recovery animates without advancing progress, freezes on pause, and rejects repeated activation',()=>{
  const state=lib.freshHarborState();state.distance=100;state.elapsed=8;state.lateral=5;state.heading=.4;
  assert.equal(lib.recoverHarbor(state),true);assert.equal(lib.recoverHarbor(state),false);assert.equal(state.recoveries,1);
  const first=lib.harborPose(state);assert.equal(first.lateral,5);
  for(let i=0;i<42;i++)lib.stepHarbor(state,lib.freshHarborInput(),course,lib.RACE_STEP);
  const mid=lib.harborPose(state);assert.ok(mid.lateral>0&&mid.lateral<5);assert.ok(mid.lift>.6);assert.equal(state.distance,100);
  const paused=structuredClone(state);const clock=lib.createRaceClock(0);assert.equal(lib.advanceRaceClock(clock,5000,false),0);assert.deepEqual(state,paused);
  for(let i=0;i<42;i++)lib.stepHarbor(state,lib.freshHarborInput(),course,lib.RACE_STEP);
  assert.equal(state.distance,100);assert.ok(state.elapsed>8.69&&state.elapsed<8.71);assert.ok(lib.harborPose(state).lateral<.001);
});
