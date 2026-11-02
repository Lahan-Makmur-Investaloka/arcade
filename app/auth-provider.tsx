'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import type { SsoUser } from '../lib/sso/client';
import { isProtectedArcadePath } from '../lib/sso-route-guard';
import { announceAccountChange, authEventKey, authUserKey, clearArcadeStorage } from '../lib/sso/browser-storage';
import './auth.css';

type Status = 'checking' | 'ready' | 'anonymous' | 'unavailable';
interface Auth {
  user: SsoUser | null;
  status: Status;
  error: string;
  check: () => Promise<void>;
  signIn: (username: string, password: string, returnTo: string) => Promise<void>;
  signOut: () => Promise<void>;
}
const AuthContext = createContext<Auth | null>(null);
export const useAuth = () => useContext(AuthContext);

function loginDestination(): string {
  return '/login?returnTo=' + encodeURIComponent(window.location.pathname + window.location.search + window.location.hash);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<SsoUser | null>(null);
  const [status, setStatus] = useState<Status>('checking');
  const [error, setError] = useState('');
  const activeUser = useRef<SsoUser | null>(null);
  const version = useRef(0);
  const pending = useRef<AbortController | null>(null);
  const mutating = useRef(false);

  const check = useCallback(async () => {
    if (pending.current || mutating.current) return;
    const controller = new AbortController();
    pending.current = controller;
    const revision = version.current;
    try {
      const response = await fetch('/api/auth/session', { cache: 'no-store', signal: controller.signal });
      const data = await response.json();
      if (revision !== version.current || controller.signal.aborted) return;
      if (response.status === 401) {
        if (activeUser.current) { clearArcadeStorage(); announceAccountChange(null); }
        activeUser.current = null; setUser(null); setStatus('anonymous'); setError('');
        if (isProtectedArcadePath(window.location.pathname)) window.location.replace(loginDestination());
        return;
      }
      if (!response.ok || !data.user?.guid) throw new Error(data.error || 'Sesi belum dapat diperiksa. Coba lagi.');
      let prior: string | null = activeUser.current?.guid ?? null;
      try { prior ??= window.localStorage.getItem(authUserKey); } catch { /* Storage is optional. */ }
      if (prior && prior !== data.user.guid) clearArcadeStorage();
      if (activeUser.current && activeUser.current.guid !== data.user.guid && isProtectedArcadePath(window.location.pathname)) {
        // Unmount the old game's state before accepting a different account.
        window.location.replace(loginDestination()); return;
      }
      try { window.localStorage.setItem(authUserKey, data.user.guid); } catch { /* Storage is optional. */ }
      activeUser.current = data.user; setUser(data.user); setStatus('ready'); setError('');
    } catch (failure) {
      if (!controller.signal.aborted && revision === version.current) {
        setStatus('unavailable'); setError(failure instanceof Error ? failure.message : 'Sesi belum dapat diperiksa. Coba lagi.');
      }
    } finally { if (pending.current === controller) pending.current = null; }
  }, []);

  useEffect(() => {
    const initial = window.setTimeout(() => void check(), 0);
    const focus = () => { if (document.visibilityState !== 'hidden') void check(); };
    const storage = (event: StorageEvent) => {
      if (event.key === authEventKey) {
        version.current++; pending.current?.abort(); pending.current = null;
        clearArcadeStorage(); setUser(null); setStatus('checking');
        window.location.replace(isProtectedArcadePath(window.location.pathname) ? loginDestination() : window.location.href);
      }
    };
    const timer = window.setInterval(focus, 60_000);
    window.addEventListener('focus', focus);
    window.addEventListener('storage', storage);
    document.addEventListener('visibilitychange', focus);
    return () => {
      pending.current?.abort(); pending.current = null;
      window.clearTimeout(initial); window.clearInterval(timer); window.removeEventListener('focus', focus); window.removeEventListener('storage', storage);
      document.removeEventListener('visibilitychange', focus);
    };
  }, [check]);

  const signIn = async (username: string, password: string, returnTo: string) => {
    if (mutating.current) return;
    mutating.current = true;
    version.current++; pending.current?.abort(); pending.current = null;
    try {
      // Step 1 is visible in the Network tab; the app token itself stays in an HttpOnly cookie.
      const token = await fetch('/api/auth/token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      if (!token.ok) throw new Error((await token.json().catch(() => ({}))).error || 'Layanan login belum tersedia. Silakan coba lagi.');
      const response = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password, returnTo }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Belum berhasil masuk. Silakan coba lagi.');
      clearArcadeStorage(); announceAccountChange(data.user.guid);
      // A full navigation drops old game memory and avoids sharing cached RSC across accounts.
      window.location.replace(data.returnTo);
    } finally { mutating.current = false; }
  };

  const signOut = async () => {
    if (mutating.current) return;
    mutating.current = true;
    version.current++; pending.current?.abort(); pending.current = null;
    setStatus('checking'); setUser(null); activeUser.current = null;
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      if (!response.ok) throw Error('Belum berhasil keluar. Periksa koneksi lalu coba lagi.');
      clearArcadeStorage(); announceAccountChange(null); window.location.replace('/login');
    } catch {
      setError('Belum berhasil keluar. Periksa koneksi lalu coba lagi.'); setStatus('unavailable');
    } finally { mutating.current = false; }
  };

  const protectedPage = isProtectedArcadePath(pathname || '/');
  return <AuthContext.Provider value={{ user, status, error, check, signIn, signOut }}>
    {!protectedPage && status === 'unavailable' && <div className="auth-session-notice" role="alert">
      <span>{error}</span><button type="button" onClick={() => void check()}>Coba lagi</button><button type="button" onClick={() => void signOut()}>Log Out</button>
    </div>}
    {protectedPage && status !== 'ready' ? <main className="auth-gate" aria-busy={status === 'checking'}>
      <h1>{status === 'unavailable' ? 'Sesi belum dapat diperiksa' : 'Memeriksa akun Lahans…'}</h1>
      {error && <p role="alert">{error}</p>}
      {status === 'unavailable' && <button type="button" onClick={() => void check()}>Coba lagi</button>}
      <Link href="/">Kembali ke arcade</Link>
    </main> : children}
  </AuthContext.Provider>;
}

export function AuthControls() {
  const auth = useAuth();
  const [busy, setBusy] = useState(false);
  if (!auth?.user || auth.status !== 'ready') return <a className="console-login" href="/login?returnTo=%2F">Login</a>;
  return <div className="arcade-account">
    <span title={auth.user.fullname}>{auth.user.fullname}</span>
    <button className="console-login" type="button" disabled={busy} onClick={async () => { setBusy(true); try { await auth.signOut(); } finally { setBusy(false); } }}>{busy ? 'Logging out…' : 'Log Out'}</button>
  </div>;
}
