import { VERDANT_START } from "./verdant-world";
let assets: {enemies: HTMLImageElement; terrain: HTMLImageElement; obstacles: HTMLImageElement} | undefined;
export function loadCombatArt() {
  if (!assets) {
    const enemies = new Image(), terrain = new Image(), obstacles = new Image();
    enemies.src = "/worlds/earth-enemies.png"; terrain.src = "/worlds/terrain-tiles.png"; obstacles.src = "/worlds/obstacles.png";
    assets = {enemies, terrain, obstacles};
  }
  return assets;
}
export const EARTH_FRAMES: Record<string, number[]> = {
 crawler:[72,125,405,323], drone:[576,22,390,398], horned:[1050,25,415,424],
 titan:[8,476,500,520], colossus:[556,450,401,557], warden:[960,454,572,553],
};
export function drawEarthEnemy(ctx: CanvasRenderingContext2D, e: {kind:string;w:number;h:number;vx:number;hitCooldown:number}, x:number,y:number) {
 const img=loadCombatArt().enemies, f=EARTH_FRAMES[e.kind];
 if(!f || !img.complete || !img.naturalWidth) return false;
 ctx.save(); if(e.hitCooldown>0)ctx.globalAlpha=.55;
 ctx.translate(x+(e.vx>0?e.w:0),y);if(e.vx>0)ctx.scale(-1,1);
 ctx.drawImage(img,...f as [number,number,number,number],0,0,e.w,e.h);ctx.restore();return true;
}
export const OBSTACLE_FRAMES = [[28, 199, 575, 338], [651, 257, 578, 283], [29, 796, 574, 352], [658, 897, 563, 252]];
export function drawTerrain(ctx:CanvasRenderingContext2D,p:{x:number;y:number;w:number;h:number;require?:string;forest?:string;crumble?:number},sx:number) {
 const verdant=p.x>=VERDANT_START;
 ctx.save();ctx.beginPath();ctx.rect(sx,p.y,p.w,p.h);ctx.clip();
 if(p.forest==='bridge'){
   ctx.globalAlpha=p.crumble ? .65+Math.sin(p.crumble*36)*.25 : 1;
   ctx.fillStyle='#483c2a';ctx.fillRect(sx,p.y,p.w,p.h);
   ctx.fillStyle=p.crumble?'#ffc577':'#d7b87c';ctx.fillRect(sx,p.y,p.w,4);
   ctx.fillStyle='#172b24';for(let x=18;x<p.w;x+=22)ctx.fillRect(sx+x,p.y+4,4,p.h-4);
   ctx.restore();return true;
 }
 // Quiet solid surfaces keep attention on characters and obstacles.
 ctx.fillStyle=verdant?"#142a25":"#131d30";ctx.fillRect(sx,p.y,p.w,p.h);
 ctx.fillStyle=verdant?"#29443a":"#26354c";ctx.fillRect(sx,p.y,p.w,10);
 ctx.fillStyle=p.require?"#80ffac":verdant?"#94bc80":"#70cbd9";ctx.fillRect(sx,p.y,p.w,3);
 if(p.h>25){ctx.fillStyle=verdant?"#0e201c":"#0e1727";ctx.fillRect(sx,p.y+18,p.w,p.h-18);}
 ctx.restore();return true;
}
export function drawObstacle(ctx:CanvasRenderingContext2D,b:{x:number;y:number;w:number;h:number;kind:string},camera:number) {
 const x=Math.floor(b.x-camera); if(x+b.w< -80||x>1040)return;
 const verdant=b.x>=VERDANT_START, img=loadCombatArt().obstacles;
 ctx.save();
 if(b.kind==="wall"||b.kind==="hurdle") {
   if(img.complete&&img.naturalWidth){
     const f=OBSTACLE_FRAMES[(verdant?2:0)+(b.kind==="hurdle"?1:0)],tileW=b.kind==="wall"?92:b.w;
     ctx.beginPath();ctx.rect(x,b.y,b.w,b.h);ctx.clip();
     for(let offset=0;offset<b.w;offset+=tileW)ctx.drawImage(img,...f as [number,number,number,number],x+offset,b.y,tileW,b.h);
   } else {ctx.fillStyle=verdant?"#355848":"#273853";ctx.fillRect(x,b.y,b.w,b.h);}
 } else {
   const color=verdant?"#80ffd0":"#91e9ff";
   ctx.fillStyle=verdant?"#80ffd022":"#91e9ff22";ctx.fillRect(x-6,b.y,b.w+12,b.h);
   ctx.fillStyle=color;ctx.fillRect(x+Math.floor(b.w/2)-2,b.y,4,b.h);
   ctx.fillStyle="#607c91";ctx.fillRect(x-5,b.y,b.w+10,8);ctx.fillRect(x-5,b.y+b.h-8,b.w+10,8);
   ctx.fillStyle=color;for(let y=b.y+12;y<b.y+b.h-8;y+=18)ctx.fillRect(x,y,b.w,3);
 }
 ctx.restore();
}
