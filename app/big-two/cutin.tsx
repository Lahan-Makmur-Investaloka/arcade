import {ART_ROOT} from './art';

/** A landscape close-up is used instead of enlarging a full-body portrait. */
export function CutIn({id,name,label,seat}:{id:string;name:string;label:string;seat:number}){
 return <div className={`b2-cutin b2-cutin-${seat} b2-cutin-closeup`} aria-hidden="true">
  <div className="b2-cutin-ink"/>
  <img className="b2-cutin-face" src={`${ART_ROOT}${id}-cutin.webp`} srcSet={`${ART_ROOT}${id}-cutin-480.webp 480w, ${ART_ROOT}${id}-cutin.webp 960w`} sizes="(max-width:700px) 70vw, 480px" width="1536" height="1024" alt="" decoding="async" draggable={false}/>
  <div className="b2-cutin-copy"><span>{name}</span><strong>{label}</strong></div>
 </div>;
}
