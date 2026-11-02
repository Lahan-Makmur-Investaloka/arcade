import { LahansClient, SsoError, type SsoConfig, type SsoUser, type Tokens } from './client.ts';
import { isProtectedArcadePath, loginRedirect, normalizedPath } from '../sso-route-guard.ts';
import { safeReturnTo } from '../../app/login/safe-return-to.ts';

export interface SsoEnv extends SsoConfig { DB: D1Database }
interface SessionState { tokens: Tokens; user: SsoUser; checkedAt: number }
interface SessionRow { id_hash: string; state: string; expires_at: number; lock_until: number; lock_id: string | null; revision: number }
const cookieName = 'tekad_arcade_session';
const bootName = 'tekad_arcade_boot';
const bootTtl = 300_000;

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store', Vary: 'Cookie' } });
}

function cookie(request: Request, id: string, expires: number): string {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  // Cookie lifetime is capped to the backend expiry returned at login.
  return `${cookieName}=${id}; Path=/; HttpOnly; SameSite=Lax${secure}; Max-Age=${id ? Math.max(0, Math.floor((expires - Date.now()) / 1000)) : 0}`;
}

function readCookie(request: Request, name: string): string | undefined {
  return request.headers.get('cookie')?.split(';').map(p => p.trim()).find(p => p.startsWith(name + '='))?.slice(name.length + 1);
}

// The app token obtained by /api/auth/token waits for login in a sealed, HttpOnly cookie:
// the browser sees the request but never the token, and no pending row is stored.
function bootCookie(request: Request, value: string, maxAgeMs: number): string {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return `${bootName}=${value}; Path=/api/auth; HttpOnly; SameSite=Lax${secure}; Max-Age=${Math.max(0, Math.floor(maxAgeMs / 1000))}`;
}

const b64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64 = (text: string) => Uint8Array.from(atob(text.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));

async function bootKey(env: SsoEnv): Promise<CryptoKey> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('tekad-arcade-boot:' + env.SSO_APP_KEY));
  return crypto.subtle.importKey('raw', digest, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

async function sealTokens(env: SsoEnv, tokens: Tokens): Promise<{ value: string; maxAge: number }> {
  const exp = Math.min(tokens.tokenExpires, Date.now() + bootTtl);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new TextEncoder().encode(JSON.stringify({ tokens, exp }));
  const sealed = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await bootKey(env), data));
  return { value: `${b64(iv)}.${b64(sealed)}`, maxAge: exp - Date.now() };
}

async function openTokens(env: SsoEnv, value: string | undefined): Promise<Tokens | null> {
  try {
    const [iv, sealed] = (value ?? '').split('.');
    if (!iv || !sealed) return null;
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(iv) }, await bootKey(env), unb64(sealed));
    const { tokens, exp } = JSON.parse(new TextDecoder().decode(plain)) as { tokens: Tokens; exp: number };
    return exp > Date.now() && tokens.tokenExpires > Date.now() ? tokens : null;
  } catch { return null; }
}

async function sessionHash(request: Request): Promise<string | null> {
  const value = readCookie(request, cookieName);
  if (!value || !/^[a-f0-9]{64}$/.test(value)) return null;
  return hash(value);
}

async function hash(value: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
}

function randomId(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join('');
}

async function remove(db: D1Database, id: string): Promise<void> {
  await db.prepare('DELETE FROM arcade_auth_sessions WHERE id_hash=?').bind(id).run();
}

async function read(db: D1Database, id: string): Promise<SessionRow | null> {
  return db.prepare('SELECT * FROM arcade_auth_sessions WHERE id_hash=?').bind(id).first<SessionRow>();
}

async function checkSession(request: Request, env: SsoEnv, fetcher: typeof fetch, force: boolean): Promise<SessionState | null> {
  const id = await sessionHash(request);
  if (!id) return null;
  const deadline = Date.now() + 40_000;
  let firstRevision: number | undefined;
  while (Date.now() < deadline) {
    const row = await read(env.DB, id);
    if (!row) return null;
    if (row.expires_at <= Date.now()) {
      await env.DB.prepare('DELETE FROM arcade_auth_sessions WHERE id_hash=? AND revision=?').bind(id, row.revision).run();
      return null;
    }
    firstRevision ??= row.revision;
    const state = JSON.parse(row.state) as SessionState;
    if (state.tokens.tokenExpires > Date.now() && state.checkedAt > Date.now() - 30_000 && (!force || row.revision > firstRevision)) return state;
    const lock = randomId();
    const leased = await env.DB.prepare('UPDATE arcade_auth_sessions SET lock_id=?, lock_until=? WHERE id_hash=? AND lock_until<=? AND revision=? RETURNING id_hash')
      .bind(lock, Date.now() + 40_000, id, Date.now(), row.revision).first();
    if (!leased) { await new Promise(resolve => setTimeout(resolve, 100)); continue; }
    try {
      const client = new LahansClient(env, fetcher);
      state.checkedAt = 0;
      await client.renew(state.tokens);
      state.checkedAt = Date.now();
      const expires = Math.max(state.tokens.tokenExpires, state.tokens.refreshExpires);
      const updated = await env.DB.prepare('UPDATE arcade_auth_sessions SET state=?, expires_at=?, lock_until=0, lock_id=NULL, revision=revision+1 WHERE id_hash=? AND lock_id=? RETURNING id_hash')
        .bind(JSON.stringify(state), expires, id, lock).first();
      return updated ? state : null; // Logout may have deleted the row during the request.
    } catch (error) {
      if (error instanceof SsoError && error.status === 401) {
        await env.DB.prepare('DELETE FROM arcade_auth_sessions WHERE id_hash=? AND lock_id=?').bind(id, lock).run();
        return null;
      }
      // Persist a successfully rotated token even if the following profile call failed.
      await env.DB.prepare('UPDATE arcade_auth_sessions SET state=?, expires_at=?, lock_until=0, lock_id=NULL, revision=revision+1 WHERE id_hash=? AND lock_id=?')
        .bind(JSON.stringify(state), Math.max(state.tokens.tokenExpires, state.tokens.refreshExpires), id, lock).run();
      throw error;
    }
  }
  throw new SsoError(503, 'Verifikasi sesi sedang sibuk. Silakan coba lagi.');
}

export async function handleSso(request: Request, env: SsoEnv, fetcher: typeof fetch = fetch): Promise<Response | null> {
  const url = new URL(request.url);
  const path = normalizedPath(url.pathname);
  if (!path) return json({ error: 'Alamat tidak valid.' }, 400);
  const isAuth = path.startsWith('/api/auth/');
  const privateApi = /^\/api\/(?:big-two|quiz|leaderboard|live)(?:\/|$)/.test(path);
  const privatePage = isProtectedArcadePath(path);
  if (!isAuth && !privateApi && !privatePage && path !== '/login') return null;

  let clearBoot = false;
  try {
    if (isAuth) {
      if (['/api/auth/token', '/api/auth/login', '/api/auth/logout'].includes(path)) {
        if (request.method !== 'POST') return json({ error: 'Metode tidak diizinkan.' }, 405);
        if (request.headers.get('origin') !== url.origin || request.headers.get('sec-fetch-site') === 'cross-site') return json({ error: 'Asal permintaan tidak diizinkan.' }, 403);
      } else if (path !== '/api/auth/session') return json({ error: 'Endpoint tidak ditemukan.' }, 404);

      if (path === '/api/auth/logout') {
        const id = await sessionHash(request);
        if (id) {
          const row = await read(env.DB, id);
          await remove(env.DB, id); // Revoke before awaiting upstream, including an in-flight refresh.
          if (row) {
            try { await new LahansClient(env, fetcher).logout((JSON.parse(row.state) as SessionState).tokens); } catch { /* Local logout still succeeds. */ }
          }
        }
        // Leave only a revoked opaque pointer until expiry or the next login.
        // A late logout must never clear a newer account's shared browser cookie.
        return json({ ok: true });
      }

      if (path === '/api/auth/token') {
        const tokens = await new LahansClient(env, fetcher).bootstrap('Web-' + crypto.randomUUID());
        const sealed = await sealTokens(env, tokens);
        const response = json({ ok: true });
        response.headers.set('Set-Cookie', bootCookie(request, sealed.value, sealed.maxAge));
        return response;
      }

      if (path === '/api/auth/login') {
        if (!request.headers.get('content-type')?.startsWith('application/json')) return json({ error: 'Gunakan JSON.' }, 415);
        if (Number(request.headers.get('content-length')) > 8192) return json({ error: 'Input terlalu panjang.' }, 413);
        let input: { username?: unknown; password?: unknown; returnTo?: unknown };
        try {
          const text = await request.text();
          if (text.length > 8192) return json({ error: 'Input terlalu panjang.' }, 413);
          input = JSON.parse(text);
        } catch { return json({ error: 'Input tidak valid.' }, 400); }
        if (!input || typeof input.username !== 'string' || !input.username.trim() || input.username.length > 320 || typeof input.password !== 'string' || !input.password || input.password.length > 2048) {
          return json({ error: 'Isi username dan password yang valid.' }, 400);
        }
        const previous = await sessionHash(request);
        if (previous) await remove(env.DB, previous);
        const client = new LahansClient(env, fetcher);
        const sealed = readCookie(request, bootName);
        clearBoot = !!sealed; // A pending token is single-use, whether login succeeds or not.
        const tokens = await openTokens(env, sealed) ?? await client.bootstrap('Web-' + crypto.randomUUID());
        let user: SsoUser;
        try {
          user = await client.login(tokens, input.username.trim(), input.password);
        } catch (error) {
          try { await client.logout(tokens); } catch { /* Do not mask the original login error. */ }
          throw error;
        }
        const id = randomId();
        const expires = Math.max(tokens.tokenExpires, tokens.refreshExpires);
        // Prune expired rows during login; tokens and profiles never enter client storage.
        await env.DB.prepare('DELETE FROM arcade_auth_sessions WHERE expires_at<=?').bind(Date.now()).run();
        await env.DB.prepare('INSERT INTO arcade_auth_sessions (id_hash,state,expires_at) VALUES (?,?,?)')
          .bind(await hash(id), JSON.stringify({ tokens, user, checkedAt: Date.now() } satisfies SessionState), expires).run();
        const response = json({ user, returnTo: safeReturnTo(input.returnTo) });
        response.headers.set('Set-Cookie', cookie(request, id, expires));
        if (clearBoot) response.headers.append('Set-Cookie', bootCookie(request, '', 0));
        return response;
      }
      if (request.method !== 'GET') return json({ error: 'Metode tidak diizinkan.' }, 405);
    }

    const state = await checkSession(request, env, fetcher, path === '/api/auth/session');
    if (path === '/api/auth/session') {
      // Read responses must not overwrite a newer account's cookie when late.
      return json({ user: state?.user ?? null }, state ? 200 : 401);
    }
    if (path === '/login') {
      if (state) return new Response(null, { status: 302, headers: { Location: new URL(safeReturnTo(url.searchParams.get('returnTo')), url).href, 'Cache-Control': 'no-store' } });
      return null;
    }
    if (!state) {
      return privateApi ? json({ error: 'Sesi berakhir. Silakan masuk kembali.' }, 401) : loginRedirect(request)!;
    }
    // Cookie-authenticated mutations also need a same-origin request.
    if (privateApi && !['GET', 'HEAD', 'OPTIONS'].includes(request.method) && request.headers.get('origin') !== url.origin) return json({ error: 'Asal permintaan tidak diizinkan.' }, 403);
    return null;
  } catch (error) {
    // Never reflect upstream responses, SQL errors, credentials, or network details.
    const known = error instanceof SsoError;
    const failure = json({ error: known ? error.message : 'Layanan sesi belum tersedia. Silakan coba lagi.' }, known ? error.status : 503);
    if (clearBoot) failure.headers.set('Set-Cookie', bootCookie(request, '', 0));
    return failure;
  }
}
