import {kartCenterLimit} from "./bounds";

export type ContactState={lateral:number;heading:number;lateralSpeed:number;speed:number;contactSide:number;impact:number;impactStrength:number;collisionCount:number;collisionCooldown:number};

export function resolveBarrierContact(state:ContactState,width:number,dt:number) {
  const limit=kartCenterLimit(width,state.heading);
  if(Math.abs(state.lateral)<limit){
    if(Math.abs(state.lateral)<limit-.16)state.contactSide=0;
    return;
  }
  const side=Math.sign(state.lateral)||1;
  const normalSpeed=Math.max(0,side*state.lateralSpeed);
  const newContact=state.contactSide!==side;
  state.lateral=side*limit;
  if(newContact&&state.collisionCooldown<=0&&state.speed>.3){
    const severity=Math.min(1,normalSpeed/8);
    state.speed*=1-(.08+severity*.36);
    state.impactStrength=Math.max(.12,severity);
    state.impact=.45;state.collisionCooldown=.5;state.collisionCount++;
    // A small inward deflection reads as contact without bouncing across lanes.
    state.lateralSpeed=-side*Math.min(.8,normalSpeed*.1);
  }else if(normalSpeed>0)state.lateralSpeed=0;
  state.contactSide=side;
  if(side*state.heading>0)state.heading*=Math.exp(-12*dt);
  // Continuous scraping has bounded drag, not repeated 45% speed cuts.
  state.speed=Math.max(0,state.speed-.8*dt);
}
