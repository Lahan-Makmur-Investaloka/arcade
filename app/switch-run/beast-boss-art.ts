import { BOSS_MASKS } from './boss-masks.mjs';
import type { FrostEnemy } from './frost-world';
let images:{glacier:HTMLImageElement;magma:HTMLImageElement}|undefined;
export function loadBeastBossArt(){if(!images){const glacier=new Image(),magma=new Image();glacier.src='/worlds/glacier-behemoth.png';magma.src='/worlds/magma-scorpion.png';images={glacier,magma};}return images;}
export function drawBeastBoss(ctx:CanvasRenderingContext2D,e:FrostEnemy,x:number,y:number){
 if(e.kind!=='glacier'&&e.kind!=='magma')return false;
 const img=loadBeastBossArt()[e.kind];if(!img.complete||!img.naturalWidth)return true;
 ctx.save();ctx.imageSmoothingEnabled=false;ctx.globalAlpha=e.hitCooldown>0?.65:1;
 ctx.translate(x+(e.vx>0?e.w:0),y);if(e.vx>0)ctx.scale(-1,1);
 const preparing=e.engaged&&(e.kind==='glacier'?e.phase<1.5:e.phase>1&&e.phase<2);
 ctx.shadowColor=e.kind==='glacier'?'#99eaff':'#ff8a39';ctx.shadowBlur=preparing?12:0;
 // Crop transparent margins to align visible feet and the collision rectangle.
 const frame=BOSS_MASKS[e.kind].frame;
 ctx.drawImage(img,frame[0],frame[1],frame[2],frame[3],0,0,e.w,e.h);ctx.restore();return true;
}
