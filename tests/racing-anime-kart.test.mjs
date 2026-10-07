import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {writeFileSync,unlinkSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import * as T from 'three';
const result=await build({stdin:{contents:`export * from './app/tekad-racing/harbor/anime-kart';export * from './app/tekad-racing/harbor/anime-frames';export * from './app/tekad-racing/harbor/simulation';export * from './app/tekad-racing/harbor/camera';export * from './app/tekad-racing/harbor/course';`,resolveDir:process.cwd(),loader:'ts'},bundle:true,platform:'node',format:'esm',packages:'external',write:false});
const path=resolve('.sites-runtime/anime-tests.mjs');writeFileSync(path,result.outputFiles[0].text);const lib=await import(pathToFileURL(path).href);unlinkSync(path);

test('eight angles wrap consistently and have hysteresis at view boundaries',()=>{
  for(let i=0;i<8;i++)for(const turns of [-2,0,2])assert.equal(lib.animeViewIndex(i*Math.PI/4+turns*Math.PI*2),i);
  assert.equal(lib.animeViewIndex(Math.PI/8+.03,0),0);
  assert.equal(lib.animeViewIndex(Math.PI/8+.09,0),1);
  assert.equal(lib.animeViewIndex(-.01,0),0);
});

test('billboard faces the camera, maintains tire anchor, maps eight safe UVs and honors reduced motion',()=>{
  const kart=lib.createAnimeKart(),state=lib.freshHarborState(),camera=new T.PerspectiveCamera(60,16/9,.1,500),texture=new T.Texture();
  assert.equal(kart.body.visible,false);kart.setAtlas(texture);
  kart.root.position.set(20,4,30);kart.root.rotation.set(-.05,.8,0,'YXZ');kart.root.updateMatrixWorld(true);
  for(let i=0;i<8;i++){
    const a=i*Math.PI/4;camera.position.copy(kart.root.localToWorld(new T.Vector3(-Math.sin(a)*9,4,-Math.cos(a)*9)));camera.lookAt(kart.root.position);camera.updateMatrixWorld();
    kart.update(state,1,true,camera);kart.root.updateMatrixWorld(true);
    assert.equal(kart.root.userData.animeFrame,i);
    assert.ok(kart.body.getWorldQuaternion(new T.Quaternion()).angleTo(camera.quaternion)<1e-6);
    const tire=new T.Vector3(0,-.5,0).applyMatrix4(kart.body.matrixWorld),anchor=kart.root.localToWorld(new T.Vector3(0,.025,0));assert.ok(tire.distanceTo(anchor)<1e-6,'lowest artwork point stays on the road anchor');
    for(const n of [...texture.repeat.toArray(),...texture.offset.toArray()])assert.ok(n>=0&&n<=1);
    assert.ok(texture.repeat.x+texture.offset.x<=1.000001);assert.ok(texture.repeat.y+texture.offset.y<=1.000001);
  }
  state.speed=23;state.steering=.5;state.boostRemaining=1;kart.update(state,1,false,camera);assert.ok(kart.root.children[2].visible);
  kart.update(state,1,true,camera);assert.ok(!kart.root.children[2].visible);
  assert.equal(kart.root.children.length,3,'bounded three-mesh actor, no procedural character behind sprite');
});

test('actual sprite quad remains inside ready and chase views across phone and desktop ratios',()=>{
  const course=lib.createHarborCourse(),p=lib.sampleCourse(course,0),state=lib.freshHarborState();
  const kart=lib.createAnimeKart();kart.setAtlas(new T.Texture());kart.root.position.set(p.x,p.y+.035,p.z);kart.root.rotation.y=Math.atan2(p.tx,p.tz);
  for(const aspect of [320/430,390/510,9/16,1,1.15,16/9,19.5/9])for(const ready of [true,false]){
    const view=ready?lib.readyCameraTarget(course,aspect):lib.chaseCameraTarget(course,lib.harborPose(state),aspect);
    const c=new T.PerspectiveCamera(view.fov,aspect,.1,700);c.position.copy(view.position);c.lookAt(view.target.x,view.target.y,view.target.z);c.updateMatrixWorld();kart.update(state,0,true,c);kart.root.updateMatrixWorld(true);
    const attr=kart.body.geometry.attributes.position;
    for(let i=0;i<attr.count;i++){const point=new T.Vector3().fromBufferAttribute(attr,i).applyMatrix4(kart.body.matrixWorld).project(c);assert.ok(Math.abs(point.x)<.98&&Math.abs(point.y)<.98,JSON.stringify({aspect,ready,point}));}
  }
});
