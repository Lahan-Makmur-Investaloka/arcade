import './transitions.css';

/** A decorative reveal during the existing deal, never a second gameplay timer. */
export function RoundEntrance({enabled,character,round}:{enabled:boolean;character:string;round?:number}){
 if(!enabled)return null;
 return <div className="wc-round-entrance" aria-hidden="true">
  <div className="wc-shutter wc-shutter-back"/><div className="wc-shutter wc-shutter-front"/>
  <div className="wc-entrance-copy"><span>{round?`ROUND ${String(round).padStart(2,'0')}`:'NEW ROUND'} / {character}</span><strong>LET’S<br/><em>PLAY.</em></strong><i>♠ ♦ ♣ ♥</i></div>
 </div>;
}
