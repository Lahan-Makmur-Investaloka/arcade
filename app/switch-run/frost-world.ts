import { drawBossHealth } from "./boss-health";
export const FROST_START = 40_000;
export const BLOOM_LEFT = 38_700, BLOOM_ENTRY = 39_000, BLOOM_GATE = FROST_START - 20;
export type IcePlatform = {x:number;y:number;w:number;h:number;biome?:'ember'|'astral';conveyor?:number;ice?:'solid'|'crumble'|'lift';baseY?:number;phase?:number;crumble?:number;gone?:number;dy?:number};
export type SkyHazard = {x:number;y:number;w:number;h:number;vx:number;vy:number;life:number;warning:number;kind:'seed'|'root'|'icicle'|'vent'|'beam'|'fireball'|'starbolt';floor:number};
export type FrostEnemy = {kind:string;x:number;y:number;w:number;h:number;vx:number;phase:number;homeY?:number;patrolLeft?:number;patrolRight?:number;hitCooldown:number;hp:number;maxHp:number;alive:boolean;engaged?:boolean};
let art: {background:HTMLImageElement;atlas:HTMLImageElement;boss:HTMLImageElement}|undefined;
export function loadFrostArt(){if(!art){const background=new Image(),atlas=new Image(),boss=new Image();background.src='/worlds/frost-background.png';atlas.src='/worlds/frost-atlas.png';boss.src='/worlds/bloom-sovereign.png';art={background,atlas,boss};}return art;}
export const isFrostEnemy=(k:string)=>['icewolf','crystal','frostgolem'].includes(k);
export function drawFrostBackground(ctx:CanvasRenderingContext2D,camera:number,now:number,w:number,h:number){
 const img=loadFrostArt().background;ctx.fillStyle='#071629';ctx.fillRect(0,0,w,h);
 if(img.complete&&img.naturalWidth){const tw=h*img.naturalWidth/img.naturalHeight,scroll=camera*.12,offset=scroll%tw,index=Math.floor(scroll/tw);for(let i=-1;i<Math.ceil(w/tw)+1;i++){ctx.save();ctx.translate(i*tw-offset,0);if((index+i)%2){ctx.translate(tw,0);ctx.scale(-1,1)}ctx.drawImage(img,0,0,tw+1,h);ctx.restore();}}
 ctx.fillStyle='#06122366';ctx.fillRect(0,h*.64,w,h*.36);
 for(let i=0;i<35;i++){const x=((i*103-camera*.4-now*.014)%(w+60)+w+60)%(w+60)-30,y=(i*71+now*.024)%(h+30);ctx.fillStyle=i%3?'#c4edff88':'#ffffffbb';ctx.fillRect(x,y,2,2);}
}
export function frostTile(ctx:CanvasRenderingContext2D,cell:number,x:number,y:number,w:number,h:number){const img=loadFrostArt().atlas;if(!img.complete||!img.naturalWidth)return false;const frames=[[24,134,488,339],[601,131,366,297],[1039,35,472,453],[27,696,473,186],[687,567,166,388],[1038,692,472,217]];const f=frames[cell];ctx.drawImage(img,f[0],f[1],f[2],f[3],x,y,w,h);return true;}
export function drawIcePlatform(ctx:CanvasRenderingContext2D,p:IcePlatform,x:number){
 if(p.gone&&p.gone>0)return;
 ctx.save();if(p.crumble)ctx.globalAlpha=.65+Math.sin(p.crumble*36)*.25;
 if(p.h>30){ctx.fillStyle='#11263c';ctx.fillRect(x,p.y,p.w,p.h);ctx.fillStyle='#284a68';ctx.fillRect(x,p.y,p.w,12);}
 frostTile(ctx,p.ice==='lift'?5:3,x,p.y-7,p.w,p.h>30?32:30);
 ctx.fillStyle=p.ice==='crumble'?'#f7c38c':p.ice==='lift'?'#c7aaff':'#a4efff';ctx.fillRect(x,p.y,p.w,3);
 if(p.ice==='crumble'){ctx.strokeStyle='#f7c38c';ctx.beginPath();ctx.moveTo(x+p.w*.4,p.y+3);ctx.lineTo(x+p.w*.5,p.y+10);ctx.lineTo(x+p.w*.43,p.y+19);ctx.stroke();}
 ctx.restore();
}
export function stepIcePlatforms(list:IcePlatform[],dt:number,player:{x:number;y:number;w:number;h:number;grounded:boolean}){
 for(const p of list){p.dy=0;if(p.ice==='lift'){const old=p.y;p.phase=(p.phase||0)+dt;p.y=(p.baseY??p.y)+Math.sin(p.phase)*42;p.dy=p.y-old;}
 if(p.gone&&p.gone>0){p.gone=Math.max(0,p.gone-dt);if(p.gone===0)p.crumble=0;continue;}
 if(p.crumble){p.crumble+=dt;if(p.crumble>=.8){p.gone=3;p.crumble=0;}}
 if(p.ice==='crumble'&&!p.gone&&!p.crumble&&player.grounded&&Math.abs(player.y+player.h-p.y)<4&&player.x+player.w>p.x&&player.x<p.x+p.w)p.crumble=.001;
 }
}
export function stepFrostEnemy(e:FrostEnemy,dt:number){e.phase+=dt;const base=Math.abs(e.vx);const speed=e.kind==='icewolf'?(e.phase%3<1.1?.3:1.5):e.kind==='frostgolem'?.65:1;e.x+=e.vx*speed*dt;if(e.x<(e.patrolLeft??e.x)){e.x=e.patrolLeft!;e.vx=base}if(e.x+e.w>(e.patrolRight??(e.x+e.w))){e.x=e.patrolRight!-e.w;e.vx=-base}if(e.kind==='crystal')e.y=(e.homeY??e.y)+Math.sin(e.phase*1.4)*28;}
export function drawNewEnemy(ctx:CanvasRenderingContext2D,e:FrostEnemy,x:number,y:number){if(e.kind!=='bloom'&&e.kind!=='glacier'&&!isFrostEnemy(e.kind))return false;ctx.save();ctx.globalAlpha=e.hitCooldown>0?.6:1;
 if(e.kind==='bloom'){const img=loadFrostArt().boss;if(img.complete&&img.naturalWidth)ctx.drawImage(img,x,y,e.w,e.h);}
 else{if(e.kind==='glacier'){ctx.shadowColor='#91dbff';ctx.shadowBlur=e.engaged&&e.phase<1.5?16:5;}ctx.translate(x+(e.vx>0?e.w:0),y);if(e.vx>0)ctx.scale(-1,1);frostTile(ctx,e.kind==='icewolf'?0:e.kind==='crystal'?1:2,0,0,e.w,e.h);}
 ctx.restore();return true;
}
export const bloomStage=(phase:number)=>phase%8<2?'seeds':phase%8<4.5?'roots':'recover';
export function stepBloom(e:FrostEnemy,playerX:number,dt:number):SkyHazard[]{const before=e.phase%8;e.phase=(e.phase+dt)%8;const phase=e.phase;e.vx=e.vx<0?-144:144;e.x+=e.vx*dt;if(e.x<=BLOOM_LEFT){e.x=BLOOM_LEFT;e.vx=Math.abs(e.vx);}else if(e.x+e.w>=BLOOM_GATE){e.x=BLOOM_GATE-e.w;e.vx=-Math.abs(e.vx);}const targetY=phase<4.5?135:265;e.y+=(targetY+Math.sin(phase/8*Math.PI*4)*10-e.y)*Math.min(1,dt*3.2);
 const out:SkyHazard[]=[];const rage=e.hp<e.maxHp/2;
 for(const at of [0.3])if(before<at&&phase>=at){for(const offset of rage?[-100,0,100]:[-65,65])out.push({x:Math.max(BLOOM_LEFT+30,Math.min(BLOOM_GATE-30,playerX+offset)),y:110,w:24,h:34,vx:0,vy:260,warning:1,life:4,kind:'seed',floor:458});}
 for(const at of [2.3])if(before<at&&phase>=at){for(const offset of [-170,0,170])out.push({x:Math.max(BLOOM_LEFT+24,Math.min(BLOOM_GATE-50,playerX+offset)),y:458-90,w:42,h:90,vx:0,vy:0,warning:1.1,life:2.3,kind:'root',floor:458});}
 return out;}
export function stepSkyHazards(list:SkyHazard[],dt:number){for(const h of list){h.life-=dt;if(h.warning>0){h.warning=Math.max(0,h.warning-dt);continue;}h.x+=h.vx*dt;h.y+=h.vy*dt;if(h.kind!=='root'&&h.y>h.floor)h.life=0;}}
export function drawSkyHazards(ctx:CanvasRenderingContext2D,list:SkyHazard[],camera:number){ctx.save();for(const h of list){if(h.life<=0)continue;const x=h.x-camera;if(h.warning>0){ctx.fillStyle=h.kind==='icicle'?'#9cedff66':'#ffbc6688';ctx.fillRect(x-8,h.floor-5,h.w+16,5);ctx.font='bold 18px monospace';ctx.textAlign='center';ctx.fillStyle='#fff0af';ctx.fillText('!',x+h.w/2,h.floor-18);if(h.kind==='icicle')frostTile(ctx,4,x,h.y,h.w,h.h);continue;}if(['vent','beam','fireball','starbolt'].includes(h.kind)){ctx.fillStyle=h.kind==='vent'||h.kind==='fireball'?'#ff9d48':'#bda5ff';ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=12;if(h.kind==='fireball'||h.kind==='starbolt'){ctx.save();ctx.translate(x+h.w/2,h.y+h.h/2);ctx.rotate(Math.atan2(h.vy,h.vx));for(let i=3;i>0;i--){ctx.globalAlpha=.12+(3-i)*.12;ctx.beginPath();ctx.ellipse(-i*8,0,h.w*.45,h.h*.3,0,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;ctx.beginPath();ctx.ellipse(0,0,h.w*.5,h.h*.5,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff4db';ctx.beginPath();ctx.arc(2,0,h.w*.2,0,Math.PI*2);ctx.fill();ctx.restore();}else{ctx.globalAlpha=.3;ctx.fillRect(x-5,h.y,h.w+10,h.h);ctx.globalAlpha=1;ctx.fillRect(x+4,h.y,h.w-8,h.h);ctx.fillStyle='#fff1d2';ctx.fillRect(x+h.w*.42,h.y,Math.max(3,h.w*.16),h.h);}ctx.shadowBlur=0;}else if(h.kind==='icicle')frostTile(ctx,4,x,h.y,h.w,h.h);else if(h.kind==='root'){ctx.fillStyle='#67f7bd44';ctx.fillRect(x-6,h.y-6,h.w+12,h.h+6);const rootArt=loadFrostArt().boss;if(rootArt.complete&&rootArt.naturalWidth)ctx.drawImage(rootArt,450,870,520,380,x-12,h.y,h.w+24,h.h);else{ctx.fillStyle='#a1f3a0';ctx.fillRect(x,h.y,h.w,h.h);}}else{ctx.fillStyle='#efb5ff';ctx.beginPath();ctx.arc(x+h.w/2,h.y+h.h/2,h.w/2,0,Math.PI*2);ctx.fill();}}ctx.restore();}
export function drawBloomFight(ctx:CanvasRenderingContext2D,boss:FrostEnemy|undefined,camera:number){if(!boss?.alive||!boss.engaged)return;ctx.save();ctx.fillStyle='#80ffbf66';ctx.fillRect(BLOOM_GATE-camera,0,5,540);drawBossHealth(ctx,boss,'BLOOM SOVEREIGN','#9eefaa');ctx.font='bold 11px monospace';ctx.fillText(bloomStage(boss.phase)==='recover'?'BOSS TURUN · TERUS SERANG':bloomStage(boss.phase)==='seeds'?'BENIH JATUH · HINDARI TANDA !':'AKAR MUNCUL · LOMPAT KE PLATFORM',480,159);ctx.restore();}
