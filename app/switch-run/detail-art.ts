let atlas:HTMLImageElement|undefined;
export function detailArt(){if(!atlas){atlas=new Image();atlas.src='/worlds/detail-atlas.png';}return atlas;}
// Tight production crops keep artwork aligned with pickup bounds.
const frames=[[72,162,491,430],[688,63,494,547],[133,740,364,380],[648,799,526,276]];
export function drawDetailTile(ctx:CanvasRenderingContext2D,cell:number,x:number,y:number,w:number,h:number){const img=detailArt();if(!img.complete||!img.naturalWidth)return false;const f=frames[cell];ctx.drawImage(img,...f as [number,number,number,number],x,y,w,h);return true;}
export function drawCoinDetail(ctx:CanvasRenderingContext2D,c:{x:number;y:number;phase:number},camera:number,now:number){const x=c.x-camera;if(x< -40||x>1000)return;const y=c.y+Math.sin(now/240+c.phase)*3,scale=.35+.65*Math.abs(Math.cos(now/430+c.phase));ctx.save();ctx.translate(x,y);ctx.scale(scale,1);drawDetailTile(ctx,2,-12,-12,24,24);ctx.restore();}
export function drawChestDetail(ctx:CanvasRenderingContext2D,c:{x:number;y:number;opened:boolean;phase:number},camera:number,now:number){const x=c.x-camera;if(x< -70||x>1030)return;ctx.save();ctx.globalAlpha=c.opened?.55:1;drawDetailTile(ctx,c.opened?1:0,x-3,c.y+(c.opened?-19:-8),48,c.opened?53:42);if(!c.opened){ctx.fillStyle='#b8ffe0';const t=now*.002+c.phase;ctx.globalAlpha=.55+.3*Math.sin(t);ctx.fillRect(x+20,c.y-11-Math.sin(t)*2,3,3);}ctx.restore();}
