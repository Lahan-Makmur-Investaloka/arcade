export type FrostWeather={cooldown:number;warning:number;remaining:number;elapsed:number};
export const BLIZZARD_DURATION=4, BLIZZARD_SPEED=.75;
export function createFrostWeather():FrostWeather{return{cooldown:12,warning:0,remaining:0,elapsed:0};}
// Simulation time only: callers do not step while paused or choosing a reward.
export function stepFrostWeather(s:FrostWeather,dt:number,x:number,rng:()=>number){
 if(x<40450||x>=58300){s.warning=0;s.remaining=0;s.cooldown=12;return 1;}
 s.elapsed+=dt;
 if(s.remaining>0){s.remaining=Math.max(0,s.remaining-dt);if(s.remaining===0)s.cooldown=16+rng()*14;}
 else if(s.warning>0){s.warning=Math.max(0,s.warning-dt);if(s.warning===0)s.remaining=BLIZZARD_DURATION;}
 else{s.cooldown=Math.max(0,s.cooldown-dt);if(s.cooldown===0)s.warning=2;}
 return s.remaining>0?BLIZZARD_SPEED:1;
}
export function drawFrostWeather(ctx:CanvasRenderingContext2D,s:FrostWeather|undefined,w=960,h=540){
 if(!s||(!s.warning&&!s.remaining))return;
 ctx.save();
 if(s.remaining>0){ctx.fillStyle='#b4dbff12';ctx.fillRect(0,0,w,h);ctx.strokeStyle='#d4f2ff77';ctx.lineWidth=2;
  for(let i=0;i<46;i++){const x=((i*103-s.elapsed*260)%(w+80)+w+80)%(w+80)-40,y=(i*67+s.elapsed*90)%(h+40)-20;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-13,y+5);ctx.stroke();}}
 if(s.warning>0){ctx.fillStyle='#0c2139e8';ctx.fillRect(w/2-200,175,400,32);ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 14px monospace';ctx.fillStyle='#d4f3ff';
 ctx.fillText(`BADAI ES DATANG · ${Math.ceil(s.warning)} DETIK`,w/2,191); }ctx.restore();
}
