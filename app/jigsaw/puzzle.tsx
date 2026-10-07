'use client';
import Link from 'next/link';
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { createGeometry, shuffled, readSave } from './geometry.mjs';
import './puzzle.css';
import { PUZZLES, type PuzzleImage } from './catalog';

const IDS = Array.from({length: 60}, (_, i) => i);
type Point = {x:number;y:number};
type Camera = Point & {zoom:number};
type Drag = {id:number;pointer:number;start:Point;point:Point;grab:Point;moved:boolean};
const clock = (n:number) => `${Math.floor(n / 60).toString().padStart(2,'0')}:${(n % 60).toString().padStart(2,'0')}`;
function Piece({id,prefix,photo,geometry}:{id:number;prefix:string;photo:string;geometry:ReturnType<typeof createGeometry>}) {
  const {CW,CH,COLS,WIDTH,HEIGHT,piecePath}=geometry;
  const path=piecePath(id);
  return <svg viewBox={`${id%COLS*CW-40} ${Math.floor(id/COLS)*CH-40} ${CW+80} ${CH+80}`} aria-hidden="true"><defs><clipPath id={`${prefix}-${id}`}><path d={path}/></clipPath></defs><image href={photo} width={WIDTH} height={HEIGHT} clipPath={`url(#${prefix}-${id})`}/><path d={path} fill="none" stroke="#fff9" strokeWidth="2"/></svg>;
}
export default function Puzzle() {
  const [active,setActive]=useState<PuzzleImage|null>(null);
  if(!active)return <main className="jigsaw-shell jigsaw-picker"><header className="jigsaw-header"><div><span className="jigsaw-eyebrow">TEKAD ARCADE / JIGSAW</span><h1>Pilih gambar untuk dimainkan</h1></div><Link href="/" className="jigsaw-back">Arcade</Link></header><p>60 keping per gambar. Progres sebelumnya akan dilanjutkan otomatis.</p><div className="jigsaw-gallery jigsaw-start-gallery">{PUZZLES.map(p=><button key={p.id} onClick={()=>setActive(p)}><img src={'/jigsaw/'+p.file} alt={p.title}/><span>{p.title}</span><small>Mainkan · 60 keping</small></button>)}</div></main>;
  return <PuzzleGame key={active.id} puzzle={active} onChoose={setActive}/>;
}
function PuzzleGame({puzzle,onChoose}:{puzzle:PuzzleImage;onChoose:(p:PuzzleImage)=>void}) {
  const geometry=createGeometry(...(puzzle.portrait?[6,10,1000,1500]:[10,6,1600,900]) as [number,number,number,number]);
  const {CW,CH,COLS,ROWS,WIDTH,HEIGHT,piecePath,edgePiece,canSnap}=geometry;
  const PATHS=IDS.map(piecePath), PHOTO='/jigsaw/'+puzzle.file, KEY='tekad-jigsaw-'+puzzle.id+'-v1';
  const [ready,setReady] = useState(false), [loaded,setLoaded] = useState(false), [error,setError] = useState(false);
  const [placed,setPlaced] = useState<number[]>([]), [order,setOrder] = useState<number[]>(IDS), [seconds,setSeconds] = useState(0);
  const [started,setStarted] = useState(false), [edges,setEdges] = useState(false), [selected,setSelected] = useState<number|null>(null);
  const [drag,setDrag] = useState<Drag|null>(null), dragRef = useRef<Drag|null>(null);
  const [camera,setCamera] = useState<Camera>({x:0,y:0,zoom:1}), camRef = useRef(camera);
  const [notice,setNotice] = useState('Pilih keping, lalu seret ke papan.'), [saveOk,setSaveOk] = useState(true);
  const [modal,setModal] = useState<'reference'|'restart'|'gallery'|null>(null);
  const board = useRef<SVGSVGElement>(null), tray = useRef<HTMLDivElement>(null), dialog = useRef<HTMLDialogElement>(null);
  const fingers = useRef(new Map<number,Point>()), pinch = useRef<{distance:number;center:Point;camera:Camera}|null>(null);
  const [cursor,setCursor] = useState(0);
  const completed = placed.length === 60;
  useEffect(() => {
    try { const s = readSave(localStorage.getItem(KEY)); if (s) {setPlaced(s.placed);setOrder(s.order);setSeconds(s.seconds);setNotice('Progres sebelumnya dipulihkan.');} else setOrder(shuffled()); } catch {setOrder(shuffled());setSaveOk(false);}
    setReady(true);
    const img = new Image(); img.onload = () => setLoaded(true); img.onerror = () => setError(true); img.src = PHOTO;
  }, []);
  useEffect(() => { if (!ready) return; try { localStorage.setItem(KEY,JSON.stringify({version:1,placed,order,seconds})); } catch {setSaveOk(false);} }, [ready,placed,order,seconds]);
  useEffect(() => {if (!started || completed || modal) return; const timer=setInterval(()=>{if(document.visibilityState==='visible')setSeconds(s=>s+1);},1000);return()=>clearInterval(timer);},[started,completed,modal]);
  useEffect(()=>{if(modal)dialog.current?.showModal();else dialog.current?.close();},[modal]);
  function updateCamera(c:Camera) {const z=Math.min(3,Math.max(1,c.zoom));const next={zoom:z,x:Math.min(WIDTH-WIDTH/z,Math.max(0,c.x)),y:Math.min(HEIGHT-HEIGHT/z,Math.max(0,c.y))};camRef.current=next;setCamera(next);}
  function zoomBy(factor:number) {const c=camRef.current;const z=Math.min(3,Math.max(1,c.zoom*factor));updateCamera({zoom:z,x:c.x+WIDTH/c.zoom/2-WIDTH/z/2,y:c.y+HEIGHT/c.zoom/2-HEIGHT/z/2});}
  function locate(p:Point) {const r=board.current!.getBoundingClientRect(), c=camRef.current;return{x:c.x+(p.x-r.left)/r.width*WIDTH/c.zoom,y:c.y+(p.y-r.top)/r.height*HEIGHT/c.zoom};}
  function place(id:number,p:Point) {
    if(placed.includes(id)||!loaded||modal)return;
    const r=board.current!.getBoundingClientRect();const pos=locate(p);
    if(p.x>=r.left&&p.x<=r.right&&p.y>=r.top&&p.y<=r.bottom&&canSnap(id,pos.x,pos.y)) {
      setPlaced(v=>v.includes(id)?v:[...v,id]);setSelected(null);setNotice(placed.length===59?'Lengkap! Semua 60 keping sudah tersusun.':'Pas! Keping terpasang.');
    } else setNotice('Belum pas. Coba posisi lain; keping kembali ke wadah.');
  }
  function startDrag(e:ReactPointerEvent<HTMLButtonElement>,id:number) {
    if(!loaded||e.button!==0||dragRef.current||!e.isPrimary)return;
    e.preventDefault();setStarted(true);setSelected(id);
    const bounds=e.currentTarget.querySelector('svg')!.getBoundingClientRect();
    const scale=Math.min(bounds.width/(CW+80),bounds.height/(CH+80));
    const grab={x:(e.clientX-bounds.left-bounds.width/2)/scale,y:(e.clientY-bounds.top-bounds.height/2)/scale};
    const p={x:e.clientX,y:e.clientY};const d={id,pointer:e.pointerId,start:p,point:p,grab,moved:false};dragRef.current=d;
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function dragCenter(d:Drag,p:Point) {
    const r=board.current!.getBoundingClientRect();
    const scale=r.width/WIDTH*camRef.current.zoom;
    return {x:p.x-d.grab.x*scale,y:p.y-d.grab.y*scale};
  }
  function moveDrag(e:ReactPointerEvent) {
    const d=dragRef.current;if(!d||d.pointer!==e.pointerId)return;
    const p={x:e.clientX,y:e.clientY};const next={...d,point:p,moved:d.moved||Math.hypot(p.x-d.start.x,p.y-d.start.y)>8};dragRef.current=next;setDrag(next.moved?next:null);
  }
  function endDrag(e:ReactPointerEvent) {
    const d=dragRef.current;if(!d||d.pointer!==e.pointerId)return;
    if(d.moved)place(d.id,dragCenter(d,{x:e.clientX,y:e.clientY}));
    dragRef.current=null;setDrag(null);
  }
  function cancelDrag(e:ReactPointerEvent) {
    if(dragRef.current?.pointer!==e.pointerId)return;
    dragRef.current=null;setDrag(null);
  }
  function boardDown(e:ReactPointerEvent<SVGSVGElement>) {
    if(dragRef.current)return;
    fingers.current.set(e.pointerId,{x:e.clientX,y:e.clientY});e.currentTarget.setPointerCapture(e.pointerId);
    if(fingers.current.size===2){const [a,b]=[...fingers.current.values()];pinch.current={distance:Math.hypot(a.x-b.x,a.y-b.y),center:{x:(a.x+b.x)/2,y:(a.y+b.y)/2},camera:{...camRef.current}};}
  }
  function boardMove(e:ReactPointerEvent<SVGSVGElement>) {
    if(!fingers.current.has(e.pointerId))return;fingers.current.set(e.pointerId,{x:e.clientX,y:e.clientY});
    const pin=pinch.current;if(!pin||fingers.current.size!==2)return;
    const[a,b]=[...fingers.current.values()],r=board.current!.getBoundingClientRect(),c=pin.camera;
    const z=Math.max(1,Math.min(3,c.zoom*Math.hypot(a.x-b.x,a.y-b.y)/Math.max(1,pin.distance)));
    updateCamera({zoom:z,x:c.x+(pin.center.x-r.left)/r.width*WIDTH/c.zoom-((a.x+b.x)/2-r.left)/r.width*WIDTH/z,y:c.y+(pin.center.y-r.top)/r.height*HEIGHT/c.zoom-((a.y+b.y)/2-r.top)/r.height*HEIGHT/z});
  }
  function boardUp(e:ReactPointerEvent<SVGSVGElement>) {
    const wasPinch=!!pinch.current;fingers.current.delete(e.pointerId);
    if(!fingers.current.size)pinch.current=null;
    if(!wasPinch&&selected!==null){setStarted(true);place(selected,{x:e.clientX,y:e.clientY});}
  }
  const remaining=order.filter(id=>!placed.includes(id)&&(!edges||edgePiece(id)));
  const rect=drag?board.current?.getBoundingClientRect():null;
  const ghostCenter=drag&&rect?dragCenter(drag,drag.point):null;
  return <main className="jigsaw-shell" onContextMenu={e=>e.preventDefault()} onDragStart={e=>e.preventDefault()}>
    <header className="jigsaw-header"><div><span className="jigsaw-eyebrow">TEKAD ARCADE / JIGSAW</span><h1>{puzzle.title}</h1></div><Link href="/" className="jigsaw-back">Arcade</Link></header>
    <div className="jigsaw-image-choice"><span>8 gambar · 60 keping</span><button onClick={()=>setModal('gallery')}>Ganti gambar</button></div>
    <section className="jigsaw-game" aria-label="Puzzle 60 keping">
      <div className="jigsaw-status"><div><strong>{placed.length}<span> / 60 keping</span></strong><progress value={placed.length} max={60} aria-label="Keping terpasang"/></div><time aria-label="Waktu bermain">{clock(seconds)}</time><button onClick={()=>setModal('reference')}>Lihat gambar</button></div>
      <div className="jigsaw-workspace"><div className={`jigsaw-board-column ${puzzle.portrait?'is-portrait':''}`}>
      <div className={`jigsaw-viewport ${completed?'is-complete':''}`} style={{marginInline:'auto'}}>
        {!loaded&&<div className="jigsaw-loading" role="status">{error?<><p>Gambar belum berhasil dimuat.</p><button onClick={()=>location.reload()}>Coba lagi</button></>:'Menyiapkan keping…'}</div>}
        <svg ref={board} viewBox={`${camera.x} ${camera.y} ${WIDTH/camera.zoom} ${HEIGHT/camera.zoom}`} className="jigsaw-board" style={{aspectRatio:`${WIDTH}/${HEIGHT}`}} aria-label="Papan puzzle. Pilih keping, gunakan panah untuk posisi, lalu Enter untuk memasang." role="application" tabIndex={0}
          onPointerDown={boardDown} onPointerMove={boardMove} onPointerUp={boardUp} onPointerCancel={e=>{fingers.current.delete(e.pointerId);pinch.current=null;}}
          onKeyDown={e=>{let next=cursor;if(e.key==='ArrowRight')next=Math.min(59,cursor+1);else if(e.key==='ArrowLeft')next=Math.max(0,cursor-1);else if(e.key==='ArrowDown')next=Math.min(59,cursor+COLS);else if(e.key==='ArrowUp')next=Math.max(0,cursor-COLS);else if(e.key==='Enter'&&selected!==null){if(selected===cursor){setPlaced(v=>v.includes(selected)?v:[...v,selected]);setSelected(null);setStarted(true);setNotice('Pas! Keping terpasang.');}else setNotice('Belum pas. Coba posisi lain.');e.preventDefault();return;}else return;e.preventDefault();setCursor(next);}}>
          <defs>{IDS.map(id=><clipPath id={`board-${id}`} key={id}><path d={PATHS[id]}/></clipPath>)}</defs>
          <rect width={WIDTH} height={HEIGHT} fill="#111d2e"/>
          {IDS.map(id=><path key={id} d={PATHS[id]} fill="none" stroke="#344356" strokeWidth="1.5"/>)}
          {placed.map(id=><g key={id}><image href={PHOTO} width={WIDTH} height={HEIGHT} clipPath={`url(#board-${id})`}/>{!completed&&<path d={PATHS[id]} fill="none" stroke="#0006" strokeWidth="1.3"/>}</g>)}
          {selected!==null&&<rect className="jigsaw-cursor" x={cursor%COLS*CW+3} y={Math.floor(cursor/COLS)*CH+3} width={CW-6} height={CH-6} fill="none" stroke="#ffcc58" strokeWidth="5"/>}
        </svg>
      </div>
      <div className="jigsaw-tools"><span>{COLS} × {ROWS} · tanpa rotasi</span><div><button aria-label="Perkecil papan" disabled={camera.zoom<=1} onClick={()=>zoomBy(1/1.4)}>−</button><button onClick={()=>updateCamera({x:0,y:0,zoom:1})}>{Math.round(camera.zoom*100)}%</button><button aria-label="Perbesar papan" disabled={camera.zoom>=3} onClick={()=>zoomBy(1.4)}>+</button></div></div>
      {camera.zoom>1&&<div className="jigsaw-pan"><span>Geser papan:</span>{[['←',-1,0],['↑',0,-1],['↓',0,1],['→',1,0]].map(([label,x,y])=><button key={String(label)} aria-label={`Geser papan ${label}`} onClick={()=>updateCamera({...camera,x:camera.x+Number(x)*CW,y:camera.y+Number(y)*CH})}>{label}</button>)}</div>}
      <p className="jigsaw-notice" role="status">{notice}</p>
      </div>
      {completed?<div className="jigsaw-win"><span>60 / 60</span><h2>Lengkap. Bersama.</h2><p>Semua keping tersusun menjadi gambar utuh. Waktu bermain {clock(seconds)}.</p><button onClick={()=>setModal('restart')}>Susun lagi</button></div>:<section className="jigsaw-tray-section" aria-label="Wadah keping">
        <div className="jigsaw-tray-header"><h2>Keping tersisa <span>{60-placed.length}</span></h2><button aria-pressed={edges} onClick={()=>setEdges(!edges)}>{edges?'✓ Pinggir saja':'Keping pinggir'}</button></div>
        <div className="jigsaw-tray" ref={tray}>{ready&&remaining.map(id=><button key={id} className={`jigsaw-piece ${selected===id?'selected':''}`} disabled={!loaded} aria-label={`Pilih keping ${id+1}${edgePiece(id)?', pinggir':''}`} aria-pressed={selected===id}
          onPointerDown={e=>startDrag(e,id)} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={cancelDrag} onLostPointerCapture={cancelDrag}
          onClick={e=>{if(e.detail===0){setSelected(id);setStarted(true);board.current?.focus();}}}><Piece id={id} prefix="tray" photo={PHOTO} geometry={geometry}/></button>)}</div>
        {!remaining.length&&<p>Semua keping pinggir terpasang. Matikan filter untuk melanjutkan.</p>}
        <div className="jigsaw-tray-nav"><button aria-label="Keping sebelumnya" onClick={()=>tray.current?.scrollBy({top:-240,behavior:'smooth'})}>↑</button><span>Keping lainnya</span><button aria-label="Keping berikutnya" onClick={()=>tray.current?.scrollBy({top:240,behavior:'smooth'})}>↓</button></div>
      </section>}
      </div><footer className="jigsaw-footer"><span>{saveOk?'Progres tersimpan di perangkat ini':'Penyimpanan perangkat tidak tersedia; jangan tutup halaman.'}</span><button onClick={()=>setModal('restart')}>Mulai ulang</button></footer>
    </section>
    <p className="jigsaw-help">Seret keping ke papan, atau ketuk keping lalu ketuk posisinya. Cubit dengan dua jari untuk zoom dan geser papan.</p>
    {drag&&rect&&ghostCenter&&<div className="jigsaw-drag" style={{left:ghostCenter.x,top:ghostCenter.y,width:rect.width/WIDTH*camera.zoom*(CW+80),height:rect.height/HEIGHT*camera.zoom*(CH+80)}}><Piece id={drag.id} prefix="drag" photo={PHOTO} geometry={geometry}/></div>}
    <dialog ref={dialog} className={`jigsaw-dialog ${modal==='gallery'?'jigsaw-gallery-dialog':''}`} onCancel={()=>setModal(null)} onClick={e=>{if(e.target===e.currentTarget)setModal(null);}}>
      {modal==='gallery'?<><div className="jigsaw-dialog-heading"><h2>Pilih gambar</h2><button autoFocus onClick={()=>setModal(null)}>Tutup</button></div><p>Progres setiap gambar tersimpan terpisah.</p><div className="jigsaw-gallery">{PUZZLES.map(p=><button key={p.id} aria-pressed={p.id===puzzle.id} onClick={()=>{if(p.id===puzzle.id)setModal(null);else onChoose(p);}}><img src={'/jigsaw/'+p.file} alt={p.title} loading="lazy"/><span>{p.title}</span>{p.id===puzzle.id&&<small>Sedang dimainkan</small>}</button>)}</div></>:modal==='reference'?<><div className="jigsaw-dialog-heading"><h2>Gambar utuh</h2><button autoFocus onClick={()=>setModal(null)}>Tutup</button></div><img src={PHOTO} alt={puzzle.title} width={WIDTH} height={HEIGHT}/></>:<><h2>Mulai dari awal?</h2><p>Progres puzzle dan waktu saat ini akan direset.</p><div className="jigsaw-dialog-actions"><button autoFocus onClick={()=>setModal(null)}>Batal</button><button onClick={()=>{setPlaced([]);setOrder(shuffled());setSeconds(0);setStarted(false);setSelected(null);setEdges(false);updateCamera({x:0,y:0,zoom:1});setNotice('Keping baru sudah diacak. Selamat menyusun!');setModal(null);}}>Ya, mulai ulang</button></div></>}
    </dialog>
  </main>;
}
