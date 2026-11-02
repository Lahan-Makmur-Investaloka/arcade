import {ART} from './presentation';
export type ArtPose='idle'|'play'|'win'|'lobby';
export const ART_ROOT=`${ART}art/`;
/** Character identity is shared between practice and multiplayer; names never choose asset URLs. */
export function CharacterArt({id,pose='idle',className='',portrait=false,eager=false,priority=false,alt='',sizes}:{id:string;pose?:ArtPose;className?:string;portrait?:boolean;eager?:boolean;priority?:boolean;alt?:string;sizes?:string}){
 const original=pose==='idle';const file=`${ART_ROOT}${id}-${pose}`;
 return <img key={file} className={`b2-portrait ${original?'':'b2-character-art'} ${className}`} src={original?`${ART}${id}.webp`:`${file}.webp`} srcSet={original?undefined:`${file}-240.webp 240w, ${file}-480.webp 480w, ${file}.webp 768w`} sizes={original?undefined:sizes??(portrait?'(max-width:700px) 75vw, 560px':'(max-width:700px) 70px, 120px')} alt={alt} width="768" height="1024" loading={eager?'eager':'lazy'} fetchPriority={priority?'high':undefined} decoding="async" draggable={false}/>;
}
