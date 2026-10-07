'use client';
import {WildCardsBrand} from './big-two/wild-cards-brand';

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import Link from 'next/link';
import { arcadeGames } from './arcade-catalog';
import './arcade-home.css';

const selectionKey = 'tekad-home-selected';
function GridIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><rect x="3" y="3" width="6" height="6" rx="1"/><rect x="15" y="3" width="6" height="6" rx="1"/><rect x="3" y="15" width="6" height="6" rx="1"/><rect x="15" y="15" width="6" height="6" rx="1"/></svg>; }
function Arrow({ back = false }: { back?: boolean }) { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" style={back ? {transform:'rotate(180deg)'} : undefined}><path d="m9 5 7 7-7 7"/></svg>; }

export default function ArcadeHome() {
  const [selected, setSelected] = useState(0);
  const [scene, setScene] = useState<{active:number; previous:number | null}>({active:0, previous:null});
  const artwork = scene.active, previousArtwork = scene.previous;
  const [catalogOpen, setCatalogOpen] = useState(false);
  const rail = useRef<HTMLDivElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const catalog = useRef<HTMLDialogElement>(null);
  const libraryButton = useRef<HTMLButtonElement>(null);
  const loaded = useRef(new Set([arcadeGames[0].artwork]));
  const selectedRef = useRef(0);
  const swipe = useRef<{x:number; y:number} | null>(null);
  const game = arcadeGames[selected];

  function select(index: number, focus = false) {
    const next = Math.max(0, Math.min(arcadeGames.length - 1, index));
    selectedRef.current = next;
    setSelected(next);
    try { sessionStorage.setItem(selectionKey, arcadeGames[next].id); } catch { /* Selection works without storage. */ }
    if (focus) tabs.current[next]?.focus({preventScroll:true});
  }

  useEffect(() => {
    const container = rail.current, target = tabs.current[selected];
    if (container && target) {
      const left = target.offsetLeft - container.offsetLeft - (container.clientWidth - target.offsetWidth) / 2;
      container.scrollTo?.({ left: Math.max(0, left), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    }
  }, [selected]);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(selectionKey);
      const index = arcadeGames.findIndex(item => item.id === stored);
      if (index > 0) select(index);
    } catch { /* Storage is optional. */ }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const image = new Image();
    const show = () => {
      if (cancelled) return;
      loaded.current.add(game.artwork);
      setScene(current => current.active === selected ? current : {active:selected, previous:current.active});
    };
    if (loaded.current.has(game.artwork)) show();
    else { image.onload = show; image.onerror = () => { if (!cancelled) { setScene({active:selected, previous:null}); } }; image.src = game.artwork; }
    return () => { cancelled = true; image.onload = null; image.onerror = null; };
  }, [selected, game.artwork]);

  useEffect(() => {
    if (previousArtwork === null) return;
    const timer = setTimeout(() => setScene(current => ({...current, previous:null})), 800);
    return () => clearTimeout(timer);
  }, [artwork, previousArtwork]);

  useEffect(() => {
    const dialog = catalog.current;
    if (!dialog) return;
    if (catalogOpen && !dialog.open) dialog.showModal();
    if (!catalogOpen && dialog.open) dialog.close();
    if (!catalogOpen) return;
    const before = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = before; };
  }, [catalogOpen]);

  function closeCatalog() { setCatalogOpen(false); libraryButton.current?.focus(); }
  function onKey(event: KeyboardEvent<HTMLButtonElement>) {
    let next = selected;
    if (event.key === 'ArrowRight') next = (selected + 1) % arcadeGames.length;
    else if (event.key === 'ArrowLeft') next = (selected - 1 + arcadeGames.length) % arcadeGames.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = arcadeGames.length - 1;
    else return;
    event.preventDefault(); select(next, true);
  }

  return <main className="console-home" style={{'--game-accent':game.accent} as CSSProperties}>
    <div className={`console-scenery${artwork !== selected ? ' is-changing' : ''}`} aria-hidden="true">
      {previousArtwork !== null && <img className="console-backdrop outgoing" src={arcadeGames[previousArtwork].artwork} alt="" style={{'--art-position':arcadeGames[previousArtwork].position,'--art-mobile-position':arcadeGames[previousArtwork].mobilePosition} as CSSProperties}/>}
      <img key={artwork} className="console-backdrop incoming" onError={event => { event.currentTarget.style.visibility = 'hidden'; }} src={arcadeGames[artwork].artwork} alt="" fetchPriority="high" style={{'--art-position':arcadeGames[artwork].position,'--art-mobile-position':arcadeGames[artwork].mobilePosition} as CSSProperties}/>
      <div className="console-shade"/><div className="console-grain"/>
    </div>
    <header className="console-header">
      <a className="console-brand" href="/" aria-label="TEKAD Arcade — beranda"><img src="/branding/icon-192.png" width="42" height="42" alt=""/><span>TEKAD <b>ARCADE</b></span></a>
      <span className="console-header-section">Game</span>
      <button ref={libraryButton} className="console-library-button" onClick={() => setCatalogOpen(true)} aria-haspopup="dialog"><GridIcon/><span>Semua game</span></button>
    </header>

    <section className="console-selector" aria-label="Pilih game">
      <div className="console-rail" ref={rail} role="tablist" aria-label="Game TEKAD">
        {arcadeGames.map((item, index) => <button key={item.id} ref={element => { tabs.current[index] = element; }} className={`console-tile${selected === index ? ' selected' : ''}`} id={`game-tab-${item.id}`} role="tab" aria-label={item.title} aria-selected={selected === index} aria-controls={selected === index ? "selected-game" : undefined} tabIndex={selected === index ? 0 : -1} onClick={() => select(index)} onKeyDown={onKey}>
          <span className="console-cover"><img src={item.cover} alt="" width="180" height="180" loading={index < 4 ? 'eager' : 'lazy'}/><span className="console-cover-shade"/><span className="console-cover-title">{item.title}</span></span>
          <span className="console-tile-caption">{item.title}</span>
        </button>)}
      </div>
      <div className="console-selection-meta"><span>{String(selected + 1).padStart(2, '0')} <i>/ {String(arcadeGames.length).padStart(2, '0')}</i></span><span className="console-swipe-hint">Geser & pilih game</span><div className="console-rail-controls"><button aria-label="Game sebelumnya" disabled={selected === 0} onClick={() => select(selected - 1)}><Arrow back/></button><button aria-label="Game berikutnya" disabled={selected === arcadeGames.length - 1} onClick={() => select(selected + 1)}><Arrow/></button></div></div>
    </section>

    <section id="selected-game" className="console-feature" role="tabpanel" aria-labelledby={`game-tab-${game.id}`} tabIndex={0} onTouchCancel={() => { swipe.current = null; }} onTouchStart={event => { swipe.current = event.touches.length === 1 ? {x:event.touches[0].clientX, y:event.touches[0].clientY} : null; }} onTouchEnd={event => {
      const start = swipe.current; swipe.current = null;
      if (!start || !event.changedTouches[0]) return;
      const dx = event.changedTouches[0].clientX - start.x, dy = event.changedTouches[0].clientY - start.y;
      if (Math.abs(dx) > 65 && Math.abs(dx) > Math.abs(dy) * 1.5) select(selectedRef.current + (dx < 0 ? 1 : -1));
    }}>
      <div className="console-feature-copy" key={game.id}>
        <p className="console-eyebrow"><span/>{game.subtitle}</p>
        <h1>{game.id==='big-two'?<WildCardsBrand/>:game.title}</h1>
        <div className="console-game-meta"><span>{game.genre}</span><i/><span>{game.players}</span>{game.chapter && <b>{game.chapter}</b>}</div>
        <p className="console-description">{game.description}</p>
        <p className="console-detail">{game.detail}</p>
        <div className="console-actions"><Link href={game.href} prefetch={false} className="console-play" aria-label={`Main ${game.title}`}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>Main<span aria-hidden="true">→</span></Link><span className="console-platform">TEKAD ORIGINAL</span></div>
      </div>
      <div className="console-feature-mark" aria-hidden="true"><span>{String(selected + 1).padStart(2, '0')}</span><i/>{game.genre}</div>
    </section>
    <footer className="console-footer"><span>TEKAD ARCADE</span><span>Pilih duniamu.</span><span className="console-key-hint"><kbd>←</kbd><kbd>→</kbd> Pilih game <i/> <kbd>Tab</kbd> Navigasi</span></footer>

    <dialog ref={catalog} className="console-catalog" aria-labelledby="catalog-title" onCancel={event => { event.preventDefault(); closeCatalog(); }} onClose={() => setCatalogOpen(false)} onClick={event => { if (event.target === event.currentTarget) closeCatalog(); }}>
      <div className="console-catalog-inner"><header><div><span>TEKAD ARCADE</span><h2 id="catalog-title">Semua game <small>{arcadeGames.length}</small></h2></div><button autoFocus aria-label="Tutup daftar game" onClick={closeCatalog}>×</button></header>
      <div className="console-catalog-grid">{arcadeGames.map(item => <a href={item.href} key={item.id} className="console-catalog-game"><img src={item.cover} alt="" width="320" height="180" loading="lazy"/><div><span>{item.genre}{item.chapter ? ` · ${item.chapter}` : ''}</span><h3>{item.title}</h3><p>{item.players}</p><b>Main <span aria-hidden="true">↗</span></b></div></a>)}</div></div>
    </dialog>
    <noscript><style>{`.console-selector,.console-feature,.console-footer,.console-library-button{display:none}.console-catalog{display:block;position:relative;inset:auto;width:100%;max-height:none;border:0;background:transparent}.console-catalog header button{display:none}.console-home{min-height:100vh}.console-catalog-inner{padding:24px}`}</style></noscript>
  </main>;
}
