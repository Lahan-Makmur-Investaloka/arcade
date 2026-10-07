import * as THREE from "three";
import type {HarborState} from "./simulation";
import {createTimmyModel} from "./timmy-model";

export function createTimmyKart(){
  const model=createTimmyModel();
  const {chassis,driver,head,wheels,steeringWheel,liveryMaterial,brakeMaterial}=model;
  const boostMaterial=new THREE.MeshBasicMaterial({color:0x5edcff}),boostCore=new THREE.MeshBasicMaterial({color:0xe4faff});
  const exhaust=new THREE.Group();exhaust.name="mini-turbo-exhaust";exhaust.position.set(.6,.66,-1.46);chassis.add(exhaust);
  for(const [radius,length,mat] of [[.14,.95,boostMaterial],[.07,.72,boostCore]] as const){const plume=new THREE.Mesh(new THREE.ConeGeometry(radius,length,8),mat);plume.rotation.x=-Math.PI/2;plume.position.z=-length/2;exhaust.add(plume);}
  exhaust.visible=false;
  const update=(state:HarborState,time:number,reducedMotion=false)=>{
    const steering=state.steering*.36/(1+state.speed*.09);
    for(const wheel of wheels){wheel.pivot.rotation.y=wheel.front?steering:0;wheel.spin.rotation.x=state.wheelAngle;}
    steeringWheel.rotation.z=-steering*1.7;
    chassis.rotation.z=reducedMotion?0:-state.steering*Math.min(state.speed/25,1)*.07;
    chassis.position.y=reducedMotion?0:Math.sin(time*22)*Math.min(.023,state.speed*.001);
    driver.rotation.z=reducedMotion?0:-state.steering*.12-state.driftSide*.08;
    head.rotation.y=-state.steering*.2;
    chassis.rotation.x=reducedMotion?0:Math.max(-.05,Math.min(.075,-state.acceleration*.004))+(state.impact>0?Math.sin(time*28)*.045*state.impact:0);
    brakeMaterial.emissiveIntensity=state.braking?2:.35;
    exhaust.visible=state.boostRemaining>0&&!reducedMotion;exhaust.scale.set(1,1,.85+Math.sin(time*25)*.15);boostMaterial.color.setHex(state.boostTier===2?0xffb63e:0x5edcff);
  };
  const setLivery=(texture:THREE.Texture)=>{texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;liveryMaterial.map=texture;liveryMaterial.color.setHex(0xffffff);liveryMaterial.needsUpdate=true;};
  return {...model,update,setLivery};
}
