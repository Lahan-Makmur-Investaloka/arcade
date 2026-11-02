import { HARBOR_LAPS, sampleCourse, type Course } from "./course";
import {resolveBarrierContact} from "./collision";
import {HARBOR_BOUNDS} from "./bounds";
import type {HarborPose} from "./camera";
import {DRIFT,freshDriftState,updateDrift,chargeDrift,cancelDrift,type DriftState} from "./drift";

export type HarborInput = { left: boolean; right: boolean; brake: boolean; throttle: boolean; drift:boolean };
export type HarborState = DriftState & { distance: number; lateral: number; speed: number; steering: number; heading: number; lateralSpeed: number; acceleration: number; braking: boolean; elapsed: number; lap: number; checkpoint: number; offroad: boolean; impact: number; impactStrength:number; contactSide:number; collisionCooldown:number; collisionCount:number; wheelAngle: number; finished: boolean; recoveries: number; recovering:number; recoveryStartLateral:number; recoveryStartHeading:number };
export const freshHarborInput = (): HarborInput => ({left:false,right:false,brake:false,throttle:false,drift:false});
export const freshHarborState = (): HarborState => ({...freshDriftState(),distance:0,lateral:0,speed:0,steering:0,heading:0,lateralSpeed:0,acceleration:0,braking:false,elapsed:0,lap:1,checkpoint:0,offroad:false,impact:0,impactStrength:0,contactSide:0,collisionCooldown:0,collisionCount:0,wheelAngle:0,finished:false,recoveries:0,recovering:0,recoveryStartLateral:0,recoveryStartHeading:0});
const clamp = (n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));

export const HARBOR_HANDLING = Object.freeze({cruise:23,maximum:28,brake:19,wheelbase:1.7,roadAssist:.7});
// Assisted arcade bicycle model in course coordinates. Heading and lateral
// velocity carry momentum; the road assist is explicit, not a hidden autopilot.
export function stepHarbor(state: HarborState, input: HarborInput, course: Course, dt: number) {
  if (state.finished || dt <= 0) return;
  const road=sampleCourse(course,state.distance);
  state.elapsed+=dt;
  if(state.recovering>0){state.recovering=Math.max(0,state.recovering-dt);return;}
  state.impact=Math.max(0,state.impact-dt);
  state.collisionCooldown=Math.max(0,state.collisionCooldown-dt);
  const steer=(input.right?1:0)-(input.left?1:0);
  state.offroad=Math.abs(state.lateral)>road.width/2-.8;
  updateDrift(state,input,steer,state.speed,state.offroad,dt);
  const effectiveSteer=state.driftSide?state.driftSide*.5+steer*.5:steer;
  state.steering+=(effectiveSteer-state.steering)*(1-Math.exp(-(effectiveSteer===0?11:7)*dt));
  state.braking=input.brake;
  const target=input.brake?0:state.offroad?10:state.boostRemaining>0?DRIFT.boostSpeed:input.throttle?HARBOR_HANDLING.maximum:HARBOR_HANDLING.cruise;
  const previousSpeed=state.speed;
  const drive=state.boostRemaining>0?DRIFT.boostAcceleration:11*(1-.57*Math.min(1,state.speed/HARBOR_HANDLING.maximum));
  const slowdown=input.brake?HARBOR_HANDLING.brake:state.offroad?10:4.5;
  state.speed+=clamp(target-state.speed,-slowdown*dt,drive*dt);
  state.acceleration=(state.speed-previousSpeed)/dt;
  const look=sampleCourse(course,state.distance+4);
  const curvature=Math.atan2(road.tz*look.tx-road.tx*look.tz,road.tx*look.tx+road.tz*look.tz)/4;
  const wheelLimit=.36/(1+state.speed*.09);
  const yawRate=state.speed/HARBOR_HANDLING.wheelbase*Math.tan(state.steering*wheelLimit);
  const alignment=state.driftSide?3.6:steer===0?4.5:2.5;
  state.heading=clamp(state.heading+(yawRate-curvature*state.speed*(1-HARBOR_HANDLING.roadAssist)-state.heading*alignment)*dt,-.55,.55);
  const grip=state.offroad?4:input.brake?10:state.driftSide?2.7:8;
  state.lateralSpeed+=(state.speed*Math.sin(state.heading)-state.lateralSpeed)*(1-Math.exp(-grip*dt));
  if(state.speed<.02){state.speed=0;state.lateralSpeed=0;}
  state.lateral+=state.lateralSpeed*dt;
  const safeWidth=Math.min(road.width,sampleCourse(course,state.distance+HARBOR_BOUNDS.kartHalfLength).width,sampleCourse(course,state.distance-HARBOR_BOUNDS.kartHalfLength).width);
  resolveBarrierContact(state,safeWidth,dt);
  state.offroad=Math.abs(state.lateral)>road.width/2-.8;
  if(state.offroad||state.contactSide!==0)cancelDrift(state,true);
  else chargeDrift(state,state.heading,state.lateralSpeed,dt);
  const oldDistance=state.distance;
  const alongRoad=state.speed*Math.cos(state.heading)/clamp(1-state.lateral*curvature,.7,1.3);
  state.distance=Math.min(course.length*HARBOR_LAPS,state.distance+alongRoad*dt);
  state.wheelAngle=(state.wheelAngle+state.speed*dt/.38)%(Math.PI*2);
  const oldQuarter=Math.floor(oldDistance/(course.length/4));
  const newQuarter=Math.floor((state.distance+1e-8)/(course.length/4));
  if(newQuarter>oldQuarter)state.checkpoint=newQuarter%4;
  state.lap=Math.min(HARBOR_LAPS,1+Math.floor(state.distance/course.length));
  if(state.distance>=course.length*HARBOR_LAPS){state.finished=true;state.speed=0;state.lateralSpeed=0;state.acceleration=0;state.braking=false;cancelDrift(state,true);}
}

export function recoverHarbor(state: HarborState) {
  // Never advance distance or reset elapsed time when recovering.
  if(state.finished||state.recovering>0)return false;
  state.recovering=.7;state.recoveryStartLateral=state.lateral;state.recoveryStartHeading=state.heading;
  state.lateral=0;state.speed=0;state.steering=0;state.heading=0;state.lateralSpeed=0;state.acceleration=0;state.braking=false;state.impact=0;state.offroad=false;state.recoveries++;
  state.contactSide=0;state.impactStrength=0;state.collisionCooldown=0;
  cancelDrift(state,true);
  return true;
}

export function harborPose(state:HarborState):HarborPose {
  const progress=1-state.recovering/.7;
  const remaining=1-progress*progress*(3-2*progress);
  return {distance:state.distance,lateral:state.recovering>0?state.recoveryStartLateral*remaining:state.lateral,heading:state.recovering>0?state.recoveryStartHeading*remaining:state.heading,speed:state.speed,lift:state.recovering>0?Math.sin(progress*Math.PI)*.7:0};
}
