export const DRIFT = Object.freeze({minimumSpeed:11,firstCharge:.8,secondCharge:1.65,firstBoost:.7,secondBoost:1.15,boostSpeed:33,boostAcceleration:18});
export type DriftState = {driftSide:number;driftCharge:number;driftHeld:boolean;driftArm:number;driftCooldown:number;boostRemaining:number;boostTier:number;turboCount:number};
export const freshDriftState=():DriftState=>({driftSide:0,driftCharge:0,driftHeld:false,driftArm:0,driftCooldown:0,boostRemaining:0,boostTier:0,turboCount:0});
export const driftTier=(charge:number)=>charge+1e-8>=DRIFT.secondCharge?2:charge+1e-8>=DRIFT.firstCharge?1:0;
// Keep the held latch on cancellation. A fresh press is required to restart.
export function cancelDrift(state:DriftState,stopBoost=false){
  state.driftSide=0;state.driftCharge=0;state.driftArm=0;state.driftCooldown=.2;
  if(stopBoost){state.boostRemaining=0;state.boostTier=0;}
}
export function updateDrift(state:DriftState,input:{drift:boolean;brake:boolean},steer:number,speed:number,offroad:boolean,dt:number){
  state.driftCooldown=Math.max(0,state.driftCooldown-dt);
  state.boostRemaining=Math.max(0,state.boostRemaining-dt);
  if(state.boostRemaining===0)state.boostTier=0;
  // Two thumbs seldom land in precisely the same simulation tick.
  state.driftArm=Math.max(0,state.driftArm-dt);
  if(input.drift&&!state.driftHeld)state.driftArm=.22;
  const blocked=input.brake||offroad||speed<DRIFT.minimumSpeed;
  if(blocked)cancelDrift(state,true);
  if(state.driftSide&&!input.drift){
    const tier=driftTier(state.driftCharge);
    if(tier){state.boostRemaining=tier===2?DRIFT.secondBoost:DRIFT.firstBoost;state.boostTier=tier;state.turboCount++;}
    cancelDrift(state);
  }
  if(input.drift&&state.driftArm>0&&!blocked&&state.driftCooldown<=0&&steer!==0&&state.boostRemaining===0){
    state.driftSide=steer;state.driftCharge=0;state.driftArm=0;
  }
  if(!input.drift)state.driftArm=0;
  state.driftHeld=input.drift;
}
export function chargeDrift(state:DriftState,heading:number,lateralSpeed:number,dt:number){
  // Charge only while actually sliding in the chosen direction, never at rest
  // or by holding the drift key through a straight without steering.
  if(state.driftSide&&heading*state.driftSide>.04&&lateralSpeed*state.driftSide>.65)
    state.driftCharge=Math.min(DRIFT.secondCharge,state.driftCharge+dt);
}
