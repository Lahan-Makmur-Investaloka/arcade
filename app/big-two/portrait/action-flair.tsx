import {LABELS,type Game} from '../engine';

/** Decoration follows a live reaction, never persisted history on its own. */
export function ActionFlair({game,sequence,name,character}:{game:Game;sequence:number;name:string;character:string}){
 const move=game.history.at(-1);
 if(!move||move.id!==sequence)return null;
 const finish=game.winner!==null;
 const combo=move.cards.length===5;
 const pass=move.kind==='pass';
 const label=finish?'KARTU HABIS!':pass?(move.newTrick?'MEJA TERBUKA':'PASS'):LABELS[move.kind as keyof typeof LABELS];
 return <div className={`fp-action-flair ${combo||finish?'fp-action-special':''} ${pass?'fp-action-pass':''}`} data-action={finish?'finish':move.kind} aria-hidden="true">
  <div className="fp-speed-lines"><i/><i/><i/></div>
  <div className="fp-action-banner">
   {(combo||finish)&&<img data-character={character} src={`/big-two/art/${character}-cutin-480.webp`} alt=""/>}
   <div><small>{name}{combo?' / 5 KARTU':''}</small><strong>{label}</strong></div>
   <span className="fp-action-star">✦</span>
  </div>
 </div>;
}
