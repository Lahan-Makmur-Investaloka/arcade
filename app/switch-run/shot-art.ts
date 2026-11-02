import { drawDetailTile } from './detail-art';
type ShotVisual = { x: number; y: number; vx: number; vy?:number; life: number; radius: number; color: string; kind: string };

// Visual layers share the real velocity, including left-facing attacks.
export function drawShot(ctx: CanvasRenderingContext2D, s: ShotVisual, camera: number, now: number) {
 const x=Math.floor(s.x-camera),y=Math.floor(s.y);
 if(x < -s.radius-100 || x > 1060+s.radius)return;
 ctx.save();ctx.globalAlpha=Math.max(0,Math.min(1,s.life*4));ctx.translate(x,y);
 ctx.strokeStyle=s.color;ctx.fillStyle=s.color;ctx.lineCap='round';
 if(s.kind==='pulse'){
  for(let i=0;i<3;i++){ctx.globalAlpha=Math.max(0,s.life)*(.8-i*.18);ctx.lineWidth=i===0?4:2;ctx.beginPath();ctx.arc(0,0,Math.max(2,s.radius-i*10),0,Math.PI*2);ctx.stroke();}
  ctx.globalAlpha=Math.min(1,s.life*2);ctx.fillStyle='#eafff0';
  for(let i=0;i<8;i++){const a=i*Math.PI/4+now*.0006;ctx.fillRect(Math.cos(a)*s.radius-2,Math.sin(a)*s.radius-2,4,4);}
 }else{
  ctx.rotate(Math.atan2(s.vy??0,s.vx||1));
  if(s.kind==='slash'){
   for(let i=0;i<3;i++){ctx.globalAlpha=Math.min(1,s.life*4)*(1-i*.25);ctx.lineWidth=8-i*2;ctx.beginPath();ctx.arc(-i*9,0,s.radius, -.95,.95);ctx.stroke();}
   ctx.strokeStyle='#fff0d9';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,s.radius,-.8,.8);ctx.stroke();
  }else{
   const r=s.kind==='shield'?22:9;
   for(let i=4;i>0;i--){ctx.globalAlpha=.12+(4-i)*.1;ctx.fillStyle=s.color;ctx.beginPath();ctx.ellipse(-i*10,0,r*(1-i*.13),r*(1-i*.16),0,0,Math.PI*2);ctx.fill();}
   ctx.globalAlpha=Math.min(1,s.life*4);ctx.shadowColor=s.color;ctx.shadowBlur=10;
   if(s.kind==='shield')drawDetailTile(ctx,3,-49,-16,60,32);
   else {ctx.fillStyle=s.color;ctx.beginPath();ctx.moveTo(17,0);ctx.lineTo(-7,-7);ctx.lineTo(-16,0);ctx.lineTo(-7,7);ctx.closePath();ctx.fill();ctx.fillStyle='#fff5d3';ctx.fillRect(-6,-2,15,4);}
  }
 }
 ctx.restore();
}
