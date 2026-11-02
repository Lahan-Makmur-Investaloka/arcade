import {memo,useEffect,useRef} from 'react';
import {type Level} from './engine';
import {pipePath,energyPath,tileLabel} from './presentation';
export default memo(function CircuitTile({level,index,rotation,mask,lit,leak,disabled,onTurn,guide,entry}:{level:Level;index:number;rotation:number;mask:number;lit:boolean;leak:boolean;disabled:boolean;onTurn:(i:number)=>void;guide:boolean;entry:number}){
 const animation=useRef<SVGAnimateTransformElement|null>(null),previousRotation=useRef(rotation);
 useEffect(()=>{
  if(previousRotation.current===rotation)return;
  const previous=previousRotation.current;previousRotation.current=rotation;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const el=animation.current;if(!el||typeof el.beginElement!=='function')return;
  // Both the resting transform and animation pivot use SVG viewBox units.
  el.setAttribute('from',`${previous*90} 50 50`);
  el.setAttribute('to',`${rotation*90} 50 50`);
  el.beginElement();
 },[rotation]);
 const tile=level.tiles[index],base=tile.mask,terminal=tile.kind==='source'||tile.kind==='machine';
 return <button type="button" className={`ws-tile ws-${tile.kind}${lit?' is-powered':''}${leak?' is-broken':''}${guide?' ws-guide-tile':''}`} disabled={tile.fixed||disabled} onClick={()=>onTurn(index)} aria-label={tileLabel(level,index,mask)} data-cell={index} data-mask={mask}>
  <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" className="ws-tile-svg">
   <defs><linearGradient id={`metal-${index}`} x1="0" x2="1" y1="0" y2="1"><stop stopColor="#fbdd9d"/><stop offset=".3" stopColor="#b28a4d"/><stop offset=".6" stopColor="#77572d"/><stop offset="1" stopColor="#ceb97d"/></linearGradient></defs>
   {tile.kind==='block'?<g className="ws-block-symbol"><path d="M28 28L72 72M72 28L28 72"/><rect x="14" y="14" width="72" height="72" rx="10"/></g>:<>
   <g className="ws-conduit" transform={`rotate(${rotation*90} 50 50)`}>
    <animateTransform ref={animation} attributeName="transform" type="rotate" dur="0.2s" begin="indefinite" fill="remove"/>
    {[0,1,2,3].filter(d=>base&(1<<d)).map(d=><g key={d} transform={`rotate(${d*90} 50 50)`}><rect className="ws-contact" x="35" y="-3" width="30" height="14" rx="2" fill={`url(#metal-${index})`}/><path d="M39 0V9M44 0V9M50 0V9M56 0V9M61 0V9" stroke="#4b3620" strokeWidth="1.5"/></g>)}
    <path className="ws-pipe-shadow" d={pipePath(base)}/><path className="ws-pipe-shell" d={pipePath(base)} stroke={`url(#metal-${index})`}/><path className="ws-pipe-groove" d={pipePath(base)}/><path className="ws-pipe-glass" d={pipePath(base)}/><path className="ws-pipe-energy" d={energyPath(base,entry<0?-1:(entry-rotation%4+4)%4)}/>
    {base!==5&&base!==10&&[0,1,2,3].filter(d=>base&(1<<d)).length>=3&&<circle className="ws-junction" cx="50" cy="50" r="10"/>}
   </g>
   {terminal&&<g className="ws-terminal"><circle className="ws-terminal-rim" cx="50" cy="50" r="30" fill={`url(#metal-${index})`}/><circle className="ws-terminal-dark" cx="50" cy="50" r="24"/><circle className="ws-terminal-core" cx="50" cy="50" r="17"/>{tile.kind==='source'?<path className="ws-bolt" d="M54 35L42 52H50L47 65L59 47H51Z"/>:<text className="ws-terminal-number" x="50" y="56" textAnchor="middle">{level.targets.indexOf(index)+1}</text>}</g>}
   {!terminal&&<g className="ws-tile-dots"><circle cx="9" cy="9" r="2"/><circle cx="91" cy="91" r="2"/></g>}
   </>}
  </svg>
  {guide&&<span className="ws-tap-cue" aria-hidden="true">↻</span>}
 </button>;
});
