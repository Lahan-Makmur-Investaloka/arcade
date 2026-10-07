import test from 'node:test';import assert from 'node:assert/strict';import {build} from 'esbuild';import {readFileSync,writeFileSync,unlinkSync} from 'node:fs';import {resolve} from 'node:path';import {pathToFileURL} from 'node:url';import * as T from 'three';
const compiled=await build({stdin:{contents:`export * from './app/tekad-racing/harbor/kart';export * from './app/tekad-racing/harbor/kart-geometry';export * from './app/tekad-racing/harbor/simulation';export * from './app/tekad-racing/harbor/camera';export * from './app/tekad-racing/harbor/course';export * from './app/tekad-racing/harbor/world';`,resolveDir:process.cwd(),loader:'ts'},bundle:true,platform:'node',format:'esm',packages:'external',write:false});
const path=resolve('.sites-runtime/timmy-tests.mjs');writeFileSync(path,compiled.outputFiles[0].text);const lib=await import(pathToFileURL(path).href);unlinkSync(path);

test('sculpted kart has bounded mesh/triangle budgets and an outward-facing curved livery surface',()=>{
 const kart=lib.createTimmyKart();let meshes=0,triangles=0;const materials=new Set();
 kart.root.traverseVisible(m=>{if(!m.isMesh)return;meshes++;triangles+=(m.geometry.index?.count??m.geometry.attributes.position.count)/3;materials.add(m.material);
  for(const a of Object.values(m.geometry.attributes))for(const v of a.array)assert.ok(Number.isFinite(v));
 });
 assert.ok(meshes<=60);assert.ok(triangles<60000);assert.ok(materials.size<=16);
 const panel=kart.root.getObjectByName('curved-livery-panel'),normal=panel.geometry.attributes.normal,uv=panel.geometry.attributes.uv;
 assert.ok(panel,'texture is on a separate curved model surface');
 for(let i=0;i<normal.count;i++){assert.ok(normal.getY(i)>0,'hood normals face outward');assert.ok(uv.getX(i)>=0&&uv.getX(i)<=1&&uv.getY(i)>=0&&uv.getY(i)<=1);}
 const data=readFileSync('public/racing/timmy-livery-v1.webp');assert.equal(data.toString('ascii',8,12),'WEBP');assert.ok(data.length<32768);
 console.log({model:{meshes,triangles,materials:materials.size,liveryBytes:data.length}});
});

test('model retains wheel, chassis, driver and head pivots; livery maps to the existing material',()=>{
 const kart=lib.createTimmyKart(),state=lib.freshHarborState();state.speed=23;state.steering=.7;state.driftSide=1;state.wheelAngle=1.5;state.braking=true;state.boostRemaining=1;
 kart.update(state,1);assert.notEqual(kart.driver.rotation.z,0);assert.notEqual(kart.head.rotation.y,0);assert.notEqual(kart.steeringWheel.rotation.z,0);
 assert.equal(kart.wheels.length,4);for(const w of kart.wheels){assert.equal(w.spin.rotation.x,1.5);assert.equal(w.pivot.rotation.y!==0,w.front);}
 assert.equal(kart.arms.length,2);assert.equal(kart.eyes.length,2);for(const arm of kart.arms)assert.equal(arm.parent,kart.driver);for(const eye of kart.eyes)assert.equal(eye.parent,kart.head);
 assert.equal(kart.brakeMaterial.emissiveIntensity,2);assert.equal(kart.root.getObjectByName('mini-turbo-exhaust').visible,true);
 kart.update(state,1,true);assert.equal(kart.driver.rotation.z,0);assert.equal(kart.chassis.rotation.x,0);assert.equal(kart.chassis.position.y,0);assert.equal(kart.root.getObjectByName('mini-turbo-exhaust').visible,false);
 const texture=new T.Texture();kart.setLivery(texture);assert.equal(kart.liveryMaterial.map,texture);assert.equal(texture.colorSpace,T.SRGBColorSpace);assert.equal(kart.liveryMaterial.color.getHex(),0xffffff);
});

test('ready view frames the actual model and sees the driver in portrait and landscape',()=>{
 const course=lib.createHarborCourse(),world=lib.createHarborWorld(course),kart=lib.createTimmyKart(),p=lib.sampleCourse(course,0);world.root.updateMatrixWorld(true);
 kart.root.position.set(p.x,p.y+.035,p.z);kart.root.rotation.y=Math.atan2(p.tx,p.tz);kart.root.updateMatrixWorld(true);
 const points=[];kart.root.traverseVisible(m=>{if(m.isMesh){const a=m.geometry.attributes.position;for(let i=0;i<a.count;i+=3)points.push(new T.Vector3().fromBufferAttribute(a,i).applyMatrix4(m.matrixWorld));}});
 const rows=[];
 for(const aspect of [320/430,390/510,9/16,1,1.15,1.33,16/9,19.5/9]){
  const view=lib.readyCameraTarget(course,aspect),c=new T.PerspectiveCamera(view.fov,aspect,.1,700);c.position.copy(view.position);c.lookAt(view.target.x,view.target.y,view.target.z);c.updateMatrixWorld();
  const min=new T.Vector2(Infinity,Infinity),max=new T.Vector2(-Infinity,-Infinity);for(const p of points){const q=p.clone().project(c);min.x=Math.min(min.x,q.x);max.x=Math.max(max.x,q.x);min.y=Math.min(min.y,q.y);max.y=Math.max(max.y,q.y);}
  assert.ok(min.x>-.98&&max.x<.98&&min.y>-.98&&max.y<.98,JSON.stringify({aspect,min,max}));
  const head=kart.head.getWorldPosition(new T.Vector3()),direction=head.clone().sub(c.position),ray=new T.Raycaster(c.position,direction.clone().normalize(),.05,direction.length()-.1);assert.equal(ray.intersectObjects(world.root.children,true).length,0);
  rows.push({aspect,min:min.toArray(),max:max.toArray()});
 }
 console.log('Ready-view frame bounds',rows);
});
