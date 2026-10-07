import * as THREE from "three";
import {sampleCourse,type Course} from "./course";
import {driftTier} from "./drift";
import type {HarborState} from "./simulation";

// Bounded pools: skid marks stay in world space; charge sparks leave rear tires.
// Geometry is deliberately small and opaque, with no additive screen flashes.
export function createDriftEffect(){
  const root=new THREE.Group();root.name="drift-effects";
  const marks=new THREE.InstancedMesh(new THREE.BoxGeometry(.19,.012,.38),new THREE.MeshBasicMaterial({color:0x28313a,transparent:true,opacity:.42,depthWrite:false}),96);
  const sparks=new THREE.InstancedMesh(new THREE.SphereGeometry(.04,4,3),new THREE.MeshBasicMaterial({color:0xffffff}),48);
  marks.frustumCulled=sparks.frustumCulled=false;root.add(marks,sparks);
  const trails=Array.from({length:96},()=>({position:new THREE.Vector3(),yaw:0,pitch:0,life:0}));
  const motes=Array.from({length:48},()=>({position:new THREE.Vector3(),velocity:new THREE.Vector3(),life:0,tier:0}));
  let markIndex=0,sparkIndex=0,markClock=0,sparkClock=0,initialized=false,visible=false;
  const dummy=new THREE.Object3D(),point=new THREE.Vector3(),blue=new THREE.Color(0x46ccff),gold=new THREE.Color(0xffbd40),white=new THREE.Color(0xaedce6);
  const update=(state:HarborState,course:Course,dt:number,reduced=false)=>{
    const active=state.driftSide!==0&&!state.offroad&&state.speed>10&&!reduced;
    if(initialized&&!visible&&!active)return;
    for(const t of trails)t.life=reduced?0:Math.max(0,t.life-dt);
    for(const m of motes){m.life=reduced?0:Math.max(0,m.life-dt);if(m.life>0){m.velocity.y-=3*dt;m.position.addScaledVector(m.velocity,dt);}}
    if(active&&dt>0){
      markClock+=dt;sparkClock+=dt;
      const road=sampleCourse(course,state.distance-1,state.lateral),yaw=Math.atan2(road.tx,road.tz)+state.heading;
      const emitMarks=markClock>=.025,emitSparks=sparkClock>=.035;
      if(emitMarks)markClock%=.025;if(emitSparks)sparkClock%=.035;
      for(const side of [-1,1]){
        point.set(road.x+Math.cos(yaw)*side*.95,road.y+.035,road.z-Math.sin(yaw)*side*.95);
        if(emitMarks){const t=trails[markIndex++%trails.length];t.position.copy(point);t.yaw=yaw;t.pitch=-Math.atan2(road.ty,Math.hypot(road.tx,road.tz));t.life=1.2;}
        if(emitSparks){const m=motes[sparkIndex++%motes.length];m.position.copy(point);m.position.y+=.13;m.velocity.set(-Math.sin(yaw)*2+side*.4,.8+(sparkIndex%3)*.2,-Math.cos(yaw)*2);m.life=.32;m.tier=driftTier(state.driftCharge);}
      }
    }else{markClock=0;sparkClock=0;}
    trails.forEach((t,i)=>{dummy.position.copy(t.position);dummy.rotation.set(t.pitch,t.yaw,0,"YXZ");dummy.scale.set(t.life>0?1:0,1,Math.min(1,t.life/.25));dummy.updateMatrix();marks.setMatrixAt(i,dummy.matrix);});
    motes.forEach((m,i)=>{dummy.position.copy(m.position);dummy.rotation.set(0,0,0);dummy.scale.setScalar(m.life>0?Math.min(1,m.life/.1):0);dummy.updateMatrix();sparks.setMatrixAt(i,dummy.matrix);sparks.setColorAt(i,m.tier===2?gold:m.tier===1?blue:white);});
    marks.instanceMatrix.needsUpdate=true;sparks.instanceMatrix.needsUpdate=true;if(sparks.instanceColor)sparks.instanceColor.needsUpdate=true;
    initialized=true;visible=trails.some(t=>t.life>0)||motes.some(m=>m.life>0);
  };
  return {root,update};
}
