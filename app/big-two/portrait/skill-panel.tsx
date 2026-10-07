import {useEffect,useRef,useState} from 'react';
import {cardName,RANKS,SUITS,rank,suit} from '../engine';
import {Card} from '../card';
import {giftReason,type SkillGame} from './kirana-skills';
import './skills.css';
type Props={game:SkillGame;names:string[];mode:'opening'|'gift'|'info';onOpening:(choice:'shuffle'|'peek'|'skip')=>void;onStart:()=>void;onGift:(card:number,target:number)=>void;onClose:()=>void};
export function SkillPanel({game,names,mode,onOpening,onStart,onGift,onClose}:Props){
 const dialog=useRef<HTMLDialogElement>(null),[card,setCard]=useState<number|null>(null),[target,setTarget]=useState<number|null>(null);
 useEffect(()=>{const d=dialog.current,previous=document.activeElement as HTMLElement;d?.showModal();return()=>{d?.close();previous?.focus();};},[]);
 const peek=mode==='opening'&&game.kirana?.phase==='peek';
 return <dialog ref={dialog} className="fp-skill-panel" aria-labelledby="skill-title" onCancel={e=>{if(mode==='opening')e.preventDefault();else onClose();}}>
  <header><span>KIRANA / KOLABORATIF</span>{mode!=='opening'&&<button aria-label="Tutup skill" onClick={onClose}>×</button>}</header>
  <h2 id="skill-title">{mode==='info'?'Skill Kirana':mode==='gift'?'Berbagi kartu':peek?'Kartu tertinggi':'Your advantage.'}</h2>
  {mode==='opening'&&!peek&&<><p>Pilih satu sebelum ronde dimulai.</p><details><summary>Kartumu · {game.hands[0].length}</summary><div className="fp-skill-hand">{game.hands[0].map(c=><span key={c} className={suit(c)%2===0?'red':''}>{RANKS[rank(c)]}{SUITS[suit(c)]}</span>)}</div></details><button className="fp-skill-choice" onClick={()=>onOpening('shuffle')}><b>Kocok ulang</b><small>Bagikan ulang semua kartu, satu kali.</small></button><button className="fp-skill-choice" onClick={()=>onOpening('peek')}><b>Lihat kartu tertinggi</b><small>Satu kartu tertinggi dari setiap lawan.</small></button><button className="fp-skill-secondary" onClick={()=>onOpening('skip')}>Mulai tanpa skill pembukaan</button></>}
  {peek&&<><div className="fp-skill-reveal">{game.kirana!.seen!.map((c,i)=><div key={i}><span>{names[i+1]}</span><Card card={c}/><small>{cardName(c)}</small></div>)}</div><button className="fp-skill-confirm" onClick={onStart}>Mulai ronde</button></>}
  {mode==='gift'&&<><p>Pilih satu kartu dan satu lawan.</p><div className="fp-skill-card-picker" role="group" aria-label="Kartu untuk diberikan">{game.hands[0].map(c=><button key={c} className={suit(c)%2===0?'red':''} aria-label={`Berikan ${cardName(c)}`} aria-pressed={card===c} disabled={game.opening&&c===0} onClick={()=>setCard(c)}>{RANKS[rank(c)]}<span>{SUITS[suit(c)]}</span></button>)}</div><div className="fp-skill-targets" role="group" aria-label="Lawan penerima">{names.slice(1).map((name,i)=><button key={i} aria-pressed={target===i+1} onClick={()=>setTarget(i+1)}><b>{name}</b><small>{game.hands[i+1].length} kartu</small></button>)}</div><button className="fp-skill-confirm" disabled={card===null||target===null||!!giftReason(game,card,target)} onClick={()=>{if(card!==null&&target!==null)onGift(card,target);}}>Berikan kartu</button><button className="fp-skill-secondary" onClick={onClose}>Batal</button></>}
  {mode==='info'&&<><p><b>Sebelum ronde:</b> pilih kocok ulang seluruh 52 kartu atau lihat kartu tertinggi ketiga lawan. Hanya satu pilihan per ronde.</p><p><b>Saat giliranmu:</b> berikan satu kartu kepada satu lawan, satu kali per ronde. Setelah itu kamu tetap boleh bermain.</p><p>Kartu terakhir harus dibanting ke meja. Sebelum pembukaan, 3♦ tidak dapat diberikan. Sisa 13 kartu atau lebih mendapat penalti ×3.</p><button className="fp-skill-confirm" onClick={onClose}>Mengerti</button></>}
 </dialog>;
}
