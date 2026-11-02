'use client';

import { useEffect, useState, type ReactNode } from 'react';
import './arcade-intro.css';

const assets = ['/branding/icon-192.png', '/arcade-home/big-two-hero.webp'];
export default function ArcadeIntro({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [done, setDone] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [loaded, setLoaded] = useState(0);
  useEffect(() => {
    try { if (sessionStorage.getItem('tekad-arcade-intro-seen') === '1') { setDone(true); return; } } catch { /* Storage is optional. */ }
    setMounted(true);
    let cancelled = false, finished = false;
    const started = performance.now();
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let revealTimer: ReturnType<typeof setTimeout>;
    const images: HTMLImageElement[] = [];
    const finish = () => {
      if (cancelled || finished) return;
      finished = true;
      revealTimer = setTimeout(() => { if (!cancelled) setLeaving(true); }, Math.max(0, (reduceMotion ? 0 : 600) - (performance.now() - started)));
    };
    const deadline = setTimeout(finish, 3000);
    Promise.all(assets.map(src => new Promise<void>(resolve => {
      const img = new Image(); images.push(img);
      const settle = () => { img.onload = null; img.onerror = null; if (!cancelled) setLoaded(n => Math.min(assets.length, n + 1)); resolve(); };
      img.onload = settle; img.onerror = settle; img.src = src;
    }))).then(() => { clearTimeout(deadline); finish(); });
    return () => { cancelled = true; clearTimeout(deadline); clearTimeout(revealTimer); images.forEach(img => { img.onload = null; img.onerror = null; }); };
  }, []);
  useEffect(() => {
    if (!mounted || done) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [mounted, done]);
  useEffect(() => {
    if (!leaving) return;
    const timer = setTimeout(() => {
      try { sessionStorage.setItem('tekad-arcade-intro-seen', '1'); } catch { /* Entry still completes. */ }
      setDone(true);
    }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 300);
    return () => clearTimeout(timer);
  }, [leaving]);
  return <>
    {!done && <div className={`console-boot${leaving ? ' is-leaving' : ''}`} role="region" aria-label="Memuat TEKAD Arcade">
      <div className="console-boot-content">
        <img src="/branding/icon-192.png" width="88" height="88" alt="TEKAD Arcade" fetchPriority="high" />
        <div className="console-boot-wordmark" aria-hidden="true">TEKAD <span>ARCADE</span></div>
        <div className="console-boot-loading" role="progressbar" aria-label="Memuat arcade" aria-valuemin={0} aria-valuemax={assets.length} aria-valuenow={loaded}><i style={{transform:`scaleX(${loaded / assets.length})`}}/></div>
        <p role="status">{leaving ? 'Siap dimainkan' : 'Memuat arcade'}</p>
      </div>
      <button onClick={() => setLeaving(true)}>Lewati <span aria-hidden="true">→</span></button>
    </div>}
    <div inert={mounted && !done} aria-hidden={mounted && !done ? true : undefined}>{children}</div>
    <noscript><style>{`.console-boot{display:none!important}`}</style></noscript>
  </>;
}
