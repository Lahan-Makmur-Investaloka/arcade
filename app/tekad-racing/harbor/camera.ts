import {sampleCourse,type Course} from "./course";
import {barrierInnerEdge} from "./bounds";

type Point={x:number;y:number;z:number};
export type HarborPose={distance:number;lateral:number;heading:number;speed:number;lift:number};
export type ChaseCamera={position:Point;target:Point;fov:number;ready:boolean};
export const freshChaseCamera=():ChaseCamera=>({position:{x:0,y:0,z:0},target:{x:0,y:0,z:0},fov:60,ready:false});
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));

export function readyCameraTarget(course:Course,aspect:number,compact=aspect<1.2){
  const p=sampleCourse(course,0),portrait=compact;
  const along=portrait?7.2:6.2,across=portrait?4.1:4.6;
  const position={x:p.x+p.tx*along+p.tz*across,y:p.y+3.4,z:p.z+p.tz*along-p.tx*across};
  // Leave space for the existing start panel: left on desktop, below on phones.
  const dx=p.x-position.x,dz=p.z-position.z,length=Math.hypot(dx,dz);
  const offset=portrait?0:1.6;
  const target={x:p.x+dz/length*offset,y:p.y+(portrait?-.55:.9),z:p.z-dx/length*offset};
  return {position,target,fov:portrait?46:43};
}

export function chaseCameraTarget(course:Course,pose:HarborPose,aspect:number,reducedMotion=false) {
  const speed=clamp(pose.speed/28,0,1);
  const portrait=clamp((1.1-aspect)/.6,0,1);
  const distance=8.1+portrait*1.4+(reducedMotion?0:speed*.6);
  const center=sampleCourse(course,pose.distance);
  // Keep the camera corridor inside the road rather than outside a barrier.
  const corridor=barrierInnerEdge(center.width)-.7;
  const lateral=clamp(pose.lateral*.9,-corridor,corridor);
  const behind=sampleCourse(course,pose.distance-distance,lateral);
  const ahead=sampleCourse(course,pose.distance+5.8+speed*1.3,pose.lateral*.85+pose.heading*.65);
  const position={x:behind.x,y:Math.max(center.y+3.4,behind.y+4.0)+portrait*.35,z:behind.z};
  const target={x:ahead.x,y:ahead.y+1.0+(reducedMotion?0:pose.lift*.3),z:ahead.z};
  // Clear intervening uphill road. At the kart end the sightline is above the
  // driver; solving for the camera height avoids crest occlusion.
  const kart=sampleCourse(course,pose.distance,pose.lateral);
  for(let i=1;i<8;i++){
    const t=i/8;
    const ground=sampleCourse(course,pose.distance-distance*(1-t)).y;
    position.y=Math.max(position.y,(ground+.6-(kart.y+1.7+pose.lift)*t)/(1-t));
  }
  return {position,target,fov:60+portrait*7+(reducedMotion?0:speed*2)};
}

/** Advance only on fixed simulation ticks. Pausing never snaps the camera. */
export function stepChaseCamera(camera:ChaseCamera,course:Course,pose:HarborPose,aspect:number,dt:number,reducedMotion=false,snap=false) {
  const desired=chaseCameraTarget(course,pose,aspect,reducedMotion);
  const direct=snap||!camera.ready;
  const movement=direct?1:1-Math.exp(-8.5*Math.max(0,dt));
  const aim=direct?1:1-Math.exp(-10*Math.max(0,dt));
  for(const axis of ["x","y","z"] as const){
    camera.position[axis]+=(desired.position[axis]-camera.position[axis])*movement;
    camera.target[axis]+=(desired.target[axis]-camera.target[axis])*aim;
  }
  camera.fov+=(desired.fov-camera.fov)*(direct?1:1-Math.exp(-3*Math.max(0,dt)));
  camera.ready=true;
  return camera;
}

export function copyChaseCamera(camera:ChaseCamera):ChaseCamera {
  return {position:{...camera.position},target:{...camera.target},fov:camera.fov,ready:camera.ready};
}

export function interpolateChaseCamera(previous:ChaseCamera,current:ChaseCamera,alpha:number):ChaseCamera {
  const mix=(a:number,b:number)=>a+(b-a)*clamp(alpha,0,1);
  return {position:{x:mix(previous.position.x,current.position.x),y:mix(previous.position.y,current.position.y),z:mix(previous.position.z,current.position.z)},target:{x:mix(previous.target.x,current.target.x),y:mix(previous.target.y,current.target.y),z:mix(previous.target.z,current.target.z)},fov:mix(previous.fov,current.fov),ready:current.ready};
}
