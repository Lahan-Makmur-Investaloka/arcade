import {RANKS,SUITS,cardName,rank,suit,type Card as CardId} from './engine';
import type {CSSProperties} from 'react';
import {ART_ROOT} from './art';
import {PIP_LAYOUTS} from './pips';

export function Face({card}:{card:CardId}){
 const r=RANKS[rank(card)],s=SUITS[suit(card)],court=['J','Q','K'].includes(r),ace=r==='A';
 return <>
  <span className="b2-card-corner"><b>{r}</b><i>{s}</i></span>
  {court?<span className={`b2-court-art b2-court-${r.toLowerCase()}`} aria-hidden="true"><img src={`${ART_ROOT}court-${r.toLowerCase()}-engraved.webp`} alt="" width="384" height="576" decoding="async" draggable={false}/></span>
   :ace?<span className="b2-ace-art b2-body-pip" aria-hidden="true"><img src={`${ART_ROOT}ace-${['diamond','club','heart','spade'][suit(card)]}.webp`} alt="" width="512" height="512" decoding="async" draggable={false}/></span>
   :<span className={`b2-pips b2-pips-${r.toLowerCase()}`} aria-hidden="true">{PIP_LAYOUTS[r].map(([x,y],i)=><i key={i} className={`b2-body-pip${y>50?' is-inverted':''}`} style={{left:`${x}%`,top:`${y}%`}}>{s}</i>)}</span>}
  <span className="b2-card-corner b2-corner-bottom" aria-hidden="true"><b>{r}</b><i>{s}</i></span>
 </>;
}
export function Card({card,selected=false,onClick,disabled=false,index=0}:{card:CardId;selected?:boolean;onClick?:()=>void;disabled?:boolean;index?:number}){
 const classes=`b2-card ${suit(card)===0||suit(card)===2?'b2-red':''}${selected?' is-selected':''}${rank(card)>=8&&rank(card)<=10?' b2-court-card':''}${rank(card)===11?' b2-ace-card':''}`;
 return onClick?<button type="button" className={classes} data-card={card} data-rank={RANKS[rank(card)]} style={{'--i':index} as CSSProperties} aria-label={cardName(card)} aria-pressed={selected} onClick={onClick} disabled={disabled}><Face card={card}/></button>:<div className={classes} data-card={card} data-rank={RANKS[rank(card)]} style={{'--i':index} as CSSProperties} aria-label={cardName(card)}><Face card={card}/></div>;
}
