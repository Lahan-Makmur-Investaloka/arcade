'use client';

import { useRef, useState, type FormEvent } from 'react';
import { useAuth } from '../auth-provider';

export default function LoginForm({ returnTo }: { returnTo: string }) {
  const auth = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submitting = useRef(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const data = new FormData(event.currentTarget);
    const username = String(data.get('username') ?? '').trim();
    const password = String(data.get('password') ?? '');
    if (!username || !password) { setError('Isi username dan password terlebih dahulu.'); return; }
    submitting.current = true; setBusy(true); setError('');
    try {
      if (!auth) throw Error('Layanan login belum siap. Muat ulang halaman lalu coba lagi.');
      await auth.signIn(username, password, returnTo);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Belum berhasil masuk. Silakan coba lagi.');
    } finally { submitting.current = false; setBusy(false); }
  }

  return <form className="login-form" onSubmit={submit} aria-busy={busy} noValidate>
    <div className="login-field">
      <label htmlFor="sso-username">Email atau username</label>
      <input id="sso-username" name="username" type="text" autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="nama@perusahaan.id" required autoFocus maxLength={320} disabled={busy} aria-invalid={error ? true : undefined} aria-describedby="sso-status" />
    </div>
    <div className="login-field">
      <label htmlFor="sso-password">Password</label>
      <div className="login-password">
        <input id="sso-password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Masukkan password" required maxLength={2048} disabled={busy} aria-invalid={error ? true : undefined} aria-describedby="sso-status" />
        <button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'} aria-pressed={showPassword} disabled={busy} title={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {showPassword
              ? <><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C5 20 1 12 1 12a18.5 18.5 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.1 9.1 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" /><path d="m1 1 22 22" /></>
              : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>}
          </svg>
        </button>
      </div>
    </div>
    <p id="sso-status" className={error ? 'login-status login-error' : 'login-status'} role={error ? 'alert' : 'status'}>{error || (busy ? 'Memverifikasi akun Lahans Anda…' : '')}</p>
    <button className="login-sso-button" type="submit" disabled={busy}>
      {busy && <span className="login-spinner" aria-hidden="true" />}
      <span>{busy ? 'Memeriksa akun…' : 'Masuk dengan SSO Lahans'}</span>
    </button>
  </form>;
}
