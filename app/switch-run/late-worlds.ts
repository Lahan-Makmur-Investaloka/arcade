import { drawBossHealth } from "./boss-health";
import type { IcePlatform, FrostEnemy, SkyHazard } from './frost-world';
export const EMBER_START=60000, ASTRAL_START=80000, FINISH=100000;
export const lateBossBounds=(kind:string)=>kind==='magma'?{left:78700,entry:79000,gate:79980}:{left:98700,entry:99000,gate:99980};
export const CHEAT_TARGETS:Record<string,number>={'45451':18500,'45452':38500,'45453':58500,'45454':78500,'45415':98500};
let art:{ember:HTMLImageElement;astral:HTMLImageElement;atlas:HTMLImageElement;expanded:HTMLImageElement}|undefined;
export function lateArt(){if(!art){const ember=new Image(),astral=new Image(),atlas=new Image(),expanded=new Image();ember.src='/worlds/ember-background.png';astral.src='/worlds/astral-background.png';atlas.src='/worlds/late-enemies.png';expanded.src='/worlds/late-enemies-expanded.png';art={ember,astral,atlas,expanded};}return art;}
export function drawLateBackground(ctx:CanvasRenderingContext2D,camera:number,now:number,w:number,h:number,astral:boolean){
 const img=astral?lateArt().astral:lateArt().ember;ctx.fillStyle=astral?'#160d30':'#251011';ctx.fillRect(0,0,w,h);
 if(img.complete&&img.naturalWidth){const tw=h*img.naturalWidth/img.naturalHeight,offset=(camera*.1)%tw,index=Math.floor(camera*.1/tw);for(let i=-1;i<Math.ceil(w/tw)+1;i++){ctx.save();ctx.translate(i*tw-offset,0);if((index+i)%2){ctx.translate(tw,0);ctx.scale(-1,1);}ctx.drawImage(img,0,0,tw+1,h);ctx.restore();}}
 for(let i=0;i<22;i++){ctx.fillStyle=astral?'#b7c6ff88':'#ffa75488';ctx.fillRect((i*83-camera*.25+w*100)%w,(i*61-now*.02+h*100)%h,2,3);}
}
export function drawLatePlatform(ctx:CanvasRenderingContext2D,p:IcePlatform,x:number){if(p.gone&&p.gone>0)return;ctx.save();ctx.globalAlpha=p.crumble?.65:1;ctx.fillStyle=p.biome==='astral'?'#281f49':'#342425';ctx.fillRect(x,p.y,p.w,p.h);ctx.fillStyle=p.biome==='astral'?'#b7a4ff':'#ffb15b';ctx.fillRect(x,p.y,p.w,5);if(p.conveyor){ctx.fillStyle='#cc8544';for(let i=12;i<p.w;i+=28)ctx.fillRect(x+i,p.y+10,12,3);}if(p.ice==='crumble'){ctx.strokeStyle='#ffd49a';ctx.beginPath();ctx.moveTo(x+p.w*.45,p.y+3);ctx.lineTo(x+p.w*.52,p.y+10);ctx.lineTo(x+p.w*.46,p.y+18);ctx.stroke();}if(p.conveyor){ctx.fillStyle='#ffe0ac';ctx.font='16px sans-serif';ctx.fillText(p.conveyor>0?'› › ›':'‹ ‹ ‹',x+p.w/2-25,p.y+21);}if(p.ice==='lift'){ctx.fillStyle='#dccfff';ctx.font='16px sans-serif';ctx.fillText('↕',x+p.w/2-5,p.y+19);}ctx.restore();}
export function lateSection(start:number,floor:number,rng:()=>number){
 const astral=start>=ASTRAL_START,pattern=Math.floor(rng()*4),count=3+Math.floor(rng()*3),biome=astral?'astral' as const:'ember' as const;
 const platforms:IcePlatform[]=[{x:start,y:floor,w:180,h:570-floor,biome}],traps:{x:number;floor:number;triggered:boolean;kind?:'vent'|'beam'}[]=[];
 let x=start+180,y=floor;
 for(let i=0;i<count;i++){
  const delta=pattern===0?(i%2?-35:35):pattern===1?(i<count/2?-35:35):(Math.floor(rng()*3)-1)*35;
  y=Math.max(330,Math.min(458,y+delta));x+=pattern===2?85:astral?45:25;
  const width=pattern===2?180:astral?150:205;
  const ice=astral?(pattern===0?'lift':pattern===1?'crumble':i%2?'lift':undefined):pattern===1&&i%2===1?'crumble':pattern===3&&i%2===0?'lift':undefined;
  platforms.push({x,y,w:width,h:ice||astral?20:570-y,biome,ice,baseY:y,phase:0,conveyor:!astral&&!ice?(i%2?-55:55):undefined});
  // Telegraph traps only on stable ground; moving/falling landings stay clear.
  if(!ice&&i%2===(astral?0:1))traps.push({x:x+width*.65,floor:y,triggered:false,kind:astral?'beam':'vent'});
  x+=width;
 }
 x+=35;platforms.push({x,y,w:360,h:570-y,biome});
 return{platforms,traps,end:x+360,floor:y,landing:x,pattern};
}
export type LateKind='emberbeetle'|'firebat'|'furnacesentry'|'astralwisp'|'riftspider'|'astralsentinel';
export function spawnLateEnemies(section:ReturnType<typeof lateSection>,astral:boolean,rng:()=>number):(FrostEnemy&{kind:LateKind})[]{
 const choices:LateKind[]=astral?['astralwisp','riftspider','astralsentinel']:['emberbeetle','firebat','furnacesentry'];
 const kind=choices[Math.floor(rng()*choices.length)],flying=['firebat','astralwisp','astralsentinel'].includes(kind),heavy=['furnacesentry','astralsentinel'].includes(kind),h=heavy?78:54,w=heavy?68:62;
 const homeY=section.floor-h-(flying?95:0),hp=heavy?7:kind==='riftspider'?4:5;
 const result:(FrostEnemy&{kind:LateKind})[]=[{kind,x:section.landing+150,y:homeY,homeY,w,h,vx:heavy?20:kind==='riftspider'?80:60,alive:true,phase:0,hp,maxHp:hp,hitCooldown:0,patrolLeft:section.landing+15,patrolRight:section.end-15}];
 if(rng()<.45){const perch=section.platforms[1];const kind:LateKind=astral?'astralwisp':'firebat',homeY=perch.y-145;result.push({kind,x:perch.x+35,y:homeY,homeY,w:58,h:48,vx:55,alive:true,phase:0,hp:3,maxHp:3,hitCooldown:0,patrolLeft:perch.x,patrolRight:perch.x+perch.w});}
 return result;
}
export const isLateEnemy=(kind:string)=>['emberbeetle','astralwisp','magma','sovereign','firebat','furnacesentry','riftspider','astralsentinel'].includes(kind);
export function drawLateEnemy(ctx:CanvasRenderingContext2D,e:FrostEnemy,x:number,y:number){
 if(!isLateEnemy(e.kind))return false;
 const extra=['firebat','furnacesentry','riftspider','astralsentinel'].indexOf(e.kind),img=extra>=0?lateArt().expanded:lateArt().atlas;
 if(!img.complete||!img.naturalWidth)return true;
 const cell=extra>=0?extra:e.kind==='emberbeetle'?0:e.kind==='magma'?1:e.kind==='astralwisp'?2:3;
 const frames=extra>=0?[[50,90,575,490],[640,80,580,510],[60,705,560,455],[690,605,530,605]]:[[25,215,520,345],[600,15,640,560],[165,670,305,500],[565,578,679,665]],f=frames[cell];
 ctx.save();ctx.globalAlpha=e.hitCooldown>0?.6:1;
 const charging=['furnacesentry','astralsentinel'].includes(e.kind)&&e.phase%4>3.2;
 if(charging){ctx.shadowColor=e.kind==='furnacesentry'?'#ffae60':'#cba4ff';ctx.shadowBlur=12;}
 ctx.translate(x+(e.vx>0?e.w:0),y);if(e.vx>0)ctx.scale(-1,1);
 const pulse=e.kind==='firebat'?Math.sin(e.phase*12)*.06:e.kind==='riftspider'?Math.sin(e.phase*14)*.025:0;
 ctx.translate(0,e.h*pulse);ctx.drawImage(img,f[0],f[1],f[2],f[3],0,0,e.w,e.h*(1-pulse));ctx.restore();return true;
}
export function stepLateEnemy(e:FrostEnemy,dt:number,px=e.x,py=e.y):SkyHazard[]{
 const before=e.phase;e.phase+=dt;const cycle=e.phase%4;
 const multiplier=e.kind==='riftspider'?(cycle<2.7?.3:1.8):e.kind==='emberbeetle'&&cycle<1?.4:1;
 e.x+=e.vx*dt*multiplier;
 if(e.x<(e.patrolLeft??e.x)){e.x=e.patrolLeft!;e.vx=Math.abs(e.vx);}
 if(e.x+e.w>(e.patrolRight??e.x+e.w)){e.x=e.patrolRight!-e.w;e.vx=-Math.abs(e.vx);}
 if(['astralwisp','astralsentinel','firebat'].includes(e.kind))e.y=(e.homeY??e.y)+Math.sin(e.phase*(e.kind==='firebat'?2:1.4))*(e.kind==='firebat'?55:25);
 if(['furnacesentry','astralsentinel'].includes(e.kind)&&Math.floor(before/4)!==Math.floor(e.phase/4)&&Math.abs(px-e.x)<650){
  const x=e.x+e.w/2,y=e.y+e.h/2,dx=px-x,dy=py+24-y,len=Math.hypot(dx,dy)||1;
  return[{x,y,w:22,h:22,vx:dx/len*155,vy:dy/len*155,warning:.75,life:4.5,kind:e.kind==='furnacesentry'?'fireball':'starbolt',floor:e.y+e.h}];
 }
 return [];
}
export function stepLateBoss(e:FrostEnemy,px:number,py:number,dt:number):SkyHazard[]{
 const before=e.phase;e.phase=(before+dt)%10;const b=lateBossBounds(e.kind),out:SkyHazard[]=[];e.vx=e.vx||110;e.x+=e.vx*dt;if(e.x<=b.left){e.x=b.left;e.vx=Math.abs(e.vx);}if(e.x+e.w>=b.gate){e.x=b.gate-e.w;e.vx=-Math.abs(e.vx);}e.y=e.kind==='magma'?458-e.h:190+Math.sin(e.phase*.628)*65;
 if(before<2&&e.phase>=2){if(e.kind==='magma'){for(const offset of [-170,0,170])out.push({x:Math.max(b.left+30,Math.min(b.gate-70,px+offset)),y:348,w:44,h:110,vx:0,vy:0,warning:1.3,life:2.8,kind:'vent',floor:458});}else{for(const offset of [-150,150])out.push({x:Math.max(b.left+30,Math.min(b.gate-60,px+offset)),y:90,w:32,h:368,vx:0,vy:0,warning:1.5,life:2.4,kind:'beam',floor:458});}}
 if(before<6&&e.phase>=6){const x=e.x+e.w/2,y=e.y+e.h/2,dx=px-x,dy=py-y,len=Math.hypot(dx,dy)||1;out.push({x,y,w:30,h:30,vx:dx/len*180,vy:dy/len*180,warning:.8,life:5,kind:e.kind==='magma'?'fireball':'starbolt',floor:540});}
 return out;
}
export function drawLateFight(ctx:CanvasRenderingContext2D,e:FrostEnemy|undefined,camera:number){if(!e?.alive||!e.engaged)return;const b=lateBossBounds(e.kind);ctx.save();ctx.fillStyle=e.kind==='magma'?'#ffae6088':'#cbb0ff88';ctx.fillRect(b.gate-camera,0,4,540);drawBossHealth(ctx,e,e.kind==='magma'?'MAGMA SCORPION':'ASTRAL SOVEREIGN',e.kind==='magma'?'#ffae60':'#b6a8ff');ctx.font='bold 11px monospace';ctx.fillText(e.phase<4?(e.kind==='magma'?'SEMBURAN LAVA · NAIK KE STEP':'PILAR ENERGI · HINDARI TANDA !'):e.phase<7?'PROYEKTIL · TERUS BERGERAK':'SERANG SEKARANG',480,158);ctx.restore();}
