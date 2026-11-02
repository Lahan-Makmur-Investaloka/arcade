/** Presentation observes committed public moves; it never gates the rules engine. */
export const MOTION={flight:420,stagger:32,deal:1450,cutin:1350,result:2100} as const;
export type MotionStamp={round:string;sequence:number};
export function isFreshMove(before:MotionStamp|null,after:MotionStamp,enabled:boolean){
 return enabled&&!!before&&before.round===after.round&&after.sequence===before.sequence+1;
}
export function landingDelay(count:number){return MOTION.flight+Math.max(0,Math.min(5,count)-1)*MOTION.stagger;}
