import * as THREE from "three";
import type {HarborState} from "./simulation";
import {ANIME_FRAMES,ANIME_ATLAS_SIZE} from "./anime-frames";

const TAU=Math.PI*2, STEP=Math.PI/4;
/** Rear, rear-left, left, front-left, front, front-right, right, rear-right. */
export function animeViewIndex(angle:number,previous=-1){
  const wrapped=((angle%TAU)+TAU)%TAU;
  if(previous>=0){
    const delta=Math.atan2(Math.sin(wrapped-previous*STEP),Math.cos(wrapped-previous*STEP));
    // A small dead band prevents rapid view flicker at an angular boundary.
    if(Math.abs(delta)<STEP*.5+.07)return previous;
  }
  return Math.round(wrapped/STEP)%8;
}

export function createAnimeKart(){
  const root=new THREE.Group();root.name="timmy-anime-kart";
  const material=new THREE.MeshBasicMaterial({transparent:true,alphaTest:.5,depthWrite:true,side:THREE.DoubleSide,toneMapped:false});
  const body=new THREE.Mesh(new THREE.PlaneGeometry(1,1),material);body.name="timmy-anime-billboard";body.visible=false;root.add(body);
  // Ground contact remains spatial, independently of the camera-facing artwork.
  const shadowMaterial=new THREE.MeshBasicMaterial({color:0x101d28,transparent:true,opacity:.24,depthWrite:false});
  const shadow=new THREE.Mesh(new THREE.CircleGeometry(1,32),shadowMaterial);shadow.rotation.x=-Math.PI/2;shadow.scale.set(1.0,1.4,1);shadow.position.y=.018;root.add(shadow);
  const boostMaterial=new THREE.MeshBasicMaterial({color:0x5edcff});
  const exhaust=new THREE.Mesh(new THREE.ConeGeometry(.13,.8,8),boostMaterial);exhaust.rotation.x=-Math.PI/2;exhaust.position.set(0,.36,-1.65);exhaust.visible=false;root.add(exhaust);
  const localCamera=new THREE.Vector3(),up=new THREE.Vector3(),inverse=new THREE.Quaternion(),worldRotation=new THREE.Quaternion();
  let frame=-1;
  const setAtlas=(texture:THREE.Texture)=>{
    texture.colorSpace=THREE.SRGBColorSpace;texture.minFilter=THREE.LinearFilter;texture.magFilter=THREE.LinearFilter;
    texture.generateMipmaps=false;texture.wrapS=texture.wrapT=THREE.ClampToEdgeWrapping;
    material.map=texture;material.needsUpdate=true;body.visible=true;frame=-1;
  };
  const update=(state:HarborState,time:number,reducedMotion:boolean,camera:THREE.Camera)=>{
    root.updateWorldMatrix(true,false);
    localCamera.copy(camera.position);root.worldToLocal(localCamera);
    const next=animeViewIndex(Math.atan2(-localCamera.x,-localCamera.z),frame);
    if(material.map&&next!==frame){
      frame=next;
      const [x,y,w,h]=ANIME_FRAMES[frame],[aw,ah]=ANIME_ATLAS_SIZE;
      material.map.repeat.set(w/aw,h/ah);material.map.offset.set(x/aw,1-(y+h)/ah);
      body.scale.set(2.3*w/h,2.3,1);
    }
    root.getWorldQuaternion(worldRotation);inverse.copy(worldRotation).invert();
    body.quaternion.copy(inverse).multiply(camera.quaternion);
    const lean=reducedMotion?0:-state.steering*Math.min(state.speed/25,1)*.035;
    body.rotateZ(lean);
    const bob=reducedMotion?0:Math.sin(time*20)*Math.min(.015,state.speed*.0007);
    // Anchor the lowest opaque tire pixels on the road, even with camera pitch.
    up.set(0,1,0).applyQuaternion(body.quaternion);
    body.position.copy(up.multiplyScalar(1.15));body.position.y+=.025+bob;
    shadowMaterial.opacity=state.recovering>0?.14:.24;
    exhaust.visible=state.boostRemaining>0&&!reducedMotion;
    exhaust.scale.y=.85+Math.sin(time*25)*.15;
    boostMaterial.color.setHex(state.boostTier===2?0xffb63e:0x5edcff);
    root.userData.animeFrame=frame;
  };
  return {root,body,material,setAtlas,update};
}
