/** One physical grip per fan. A card rotates about its lower edge, never a grid. */
export type FanCard={card:number;x:number;y:number;width:number;height:number;angle:number;selected:boolean;layer:number};
export type HandAnchor={x:number;y:number;size:number;column:0|1|2;row:0|1};
export const HAND_GRIPS=[[[0.69140625, 0.37109375], [0.6875, 0.330078125], [0.5, 0.4]], [[0.41015625, 0.310546875], [0.322265625, 0.251953125], [0.36, 0.4]]] as const;
export function handLayout(width:number,hand:readonly number[],selected:readonly number[],playing=false,stageHeight=218){
 const safeWidth=Math.max(280,Math.min(600,width));
 const cardWidth=Math.max(55,Math.min(78,safeWidth*.175));
 const height=cardWidth*1.48;
 const chosen=new Set(selected),left=hand.filter(c=>!chosen.has(c)),right=hand.filter(c=>chosen.has(c));
 const split=right.length>0;
 const y=Math.min(176,Math.max(118,stageHeight-16));
 const leftX=split?safeWidth*.34:safeWidth*.5,rightX=safeWidth*.77;
 const cards:FanCard[]=[];
 for(const [items,isRight] of [[left,false],[right,true]] as const){
  const spread=Math.min(isRight?64:132,Math.max(0,(items.length-1)*(isRight?16:12)));
  items.forEach((card,index)=>cards.push({card,x:isRight?rightX:leftX,y:isRight?y-27:y,width:cardWidth,height,angle:items.length===1?0:(index/(items.length-1)-.5)*spread,selected:isRight,layer:(isRight?30:10)+index}));
 }
 const size=safeWidth*.54;
 const hands:HandAnchor[]=[
  {x:split?leftX:leftX-22,y:y-height*.10,size,column:left.length?split?1:0:2,row:0},
  {x:playing?rightX:split?rightX:leftX+22,y:playing?y-47:split?y-27-height*.10:y-height*.10,size,column:playing||!hand.length?2:split?1:0,row:1},
 ];
 return {cards,hands,split};
}

/** Nearest exposed index gives the whole fan a forgiving touch surface. */
export function nearestCard(cards:readonly FanCard[],x:number,y:number):number|null{
 let result:number|null=null,best=72*72;
 for(const c of cards){
  const a=c.angle*Math.PI/180,u=-c.width*.40,v=-c.height+15;
  const cx=c.x+u*Math.cos(a)-v*Math.sin(a),cy=c.y+u*Math.sin(a)+v*Math.cos(a);
  const d=(x-cx)**2+(y-cy)**2;
  if(d<best){best=d;result=c.card;}
 }
 return result;
}
