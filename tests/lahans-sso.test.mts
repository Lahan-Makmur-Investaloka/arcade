import assert from 'node:assert/strict';
import test from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';

// The upstream boundary is controlled; the router, token client, SQL and cookies are real.
const origin = 'https://arcade.example';
const future = () => new Date(Date.now() + 3_600_000).toISOString();
const tokens = () => ({ token: 'access-secret', token_expired: future(), refresh_token: 'refresh-secret', refresh_token_expired: future() });
const account = (overrides: Record<string, unknown> = {}) => ({
  guid: 'user-a', employee_guid: 'employee-a', employee_fullname: 'Pemain A', full_name: 'Pemain A', status: 'active',
  nik: 'never-public', access: { has_access: true }, ...overrides,
});
const envelope = (data: unknown, status = 200, en = 'Success') => Response.json({ message: { en }, data }, { status });

async function fixture() {
  const { handleSso } = await import('../lib/sso/server.ts');
  const database = new DatabaseSync(':memory:');
  database.exec(readFileSync(new URL('../drizzle/0009_arcade_auth_sessions.sql', import.meta.url), 'utf8'));
  const db = { prepare(sql: string) {
    const statement = database.prepare(sql);
    const bound = (params: unknown[] = []) => ({
      bind: (...values: unknown[]) => bound(values),
      first: async () => statement.get(...params as never[]) ?? null,
      all: async () => ({ results: statement.all(...params as never[]), success: true }),
      run: async () => { const result = statement.run(...params as never[]); return { success: true, meta: { changes: Number(result.changes) } }; },
    });
    return bound();
  } } as unknown as D1Database;
  const calls: { path: string; method: string; headers: Headers; body: unknown }[] = [];
  let reply = (path: string): Response | Promise<Response> => {
    if (path.endsWith('/token/auth') || path.endsWith('/token/refresh')) return envelope(tokens());
    if (path.endsWith('/sso/auth/login')) return envelope(account());
    if (path.endsWith('/sso/auth/logout')) return envelope(null);
    throw new Error(`Unexpected upstream ${path}`);
  };
  const upstream = (async (input: string | URL | Request, init?: RequestInit) => {
    const request = new Request(input, init);
    const path = new URL(request.url).pathname;
    calls.push({ path, method: request.method, headers: request.headers, body: request.body ? await request.json() : null });
    assert.equal(new URL(request.url).origin, 'https://sso.example');
    return reply(path);
  }) as typeof fetch;
  const env = { DB: db, SSO_API_BASE_URL: 'https://sso.example/v1', SSO_APP_NAME: 'arcade', SSO_APP_KEY: 'app-secret', SSO_APP_CODE: 'arcade-code' };
  const request = (path: string, body?: unknown, cookie = '', extra: HeadersInit = {}) => new Request(origin + path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json', Origin: origin }), ...(cookie ? { Cookie: cookie } : {}), ...extra },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const run = (req: Request) => handleSso(req, env, upstream);
  const login = async () => {
    const response = (await run(request('/api/auth/login', { username: ' user@example.com ', password: 'password', returnTo: '/switch-run' })))!;
    assert.equal(response.status, 200, await response.clone().text());
    const cookie = response.headers.get('set-cookie')!.split(';')[0];
    return { response, cookie };
  };
  const expire = () => {
    const row = database.prepare('SELECT state FROM arcade_auth_sessions').get()!;
    const state = JSON.parse(row.state as string);
    state.tokens.tokenExpires = Date.now() - 1;
    database.prepare('UPDATE arcade_auth_sessions SET state=?').run(JSON.stringify(state));
  };
  return { database, env, calls, request, run, login, expire, reply: (fn: typeof reply) => { reply = fn; } };
}

test('bootstrap → SSO login with app code: only opaque cookie and minimal identity reach browser', async () => {
  const f = await fixture();
  const { response, cookie } = await f.login();
  assert.deepEqual(f.calls.map(c => [c.path, c.method]), [['/v1/token/auth', 'POST'], ['/v1/sso/auth/login', 'POST']]);
  assert.deepEqual(f.calls[1].body, { username: 'user@example.com', password: 'password' });
  assert.equal(f.calls[1].headers.get('token'), 'access-secret');
  assert.equal(f.calls[1].headers.get('x-sso-app-code'), 'arcade-code');
  const boot = f.calls[0].body as Record<string, string>;
  assert.equal(boot.app_key, 'app-secret'); assert.equal(boot.app_name, 'arcade'); assert.equal(boot.device_type, 'Web');
  assert.match(boot.device_id, /^Web-/);
  assert.match(response.headers.get('set-cookie')!, /HttpOnly/);
  assert.match(response.headers.get('set-cookie')!, /Secure/);
  assert.match(response.headers.get('set-cookie')!, /SameSite=Lax/);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const body = await response.text();
  for (const secret of ['access-secret', 'refresh-secret', 'app-secret', 'password', 'never-public']) assert.ok(!body.includes(secret));
  assert.equal((await f.run(f.request('/switch-run', undefined, cookie))), null);
  const session = (await f.run(f.request('/api/auth/session', undefined, cookie)))!;
  assert.deepEqual((await session.json()).user, { guid: 'user-a', employeeGuid: 'employee-a', fullname: 'Pemain A' });
  assert.equal((await f.run(f.request('/login?returnTo=%2Fswitch-run', undefined, cookie)))!.headers.get('location'), origin + '/switch-run');
});

test('empty credentials and cross-site login/logout are rejected before the upstream is contacted', async () => {
  const f = await fixture();
  assert.equal((await f.run(f.request('/api/auth/login', { username: '', password: '' })))!.status, 400);
  for (const path of ['/api/auth/login', '/api/auth/logout']) {
    assert.equal((await f.run(f.request(path, { username: 'u', password: 'p' }, '', { Origin: 'https://evil.example' })))!.status, 403);
    assert.equal((await f.run(f.request(path, {}, '', { Origin: '' })))!.status, 403);
  }
  assert.equal(f.calls.length, 0);
});

test('business failure, invalid bootstrap expiry, inactive, no-access and incomplete accounts cannot create a session', async () => {
  const accounts: Record<string, Record<string, unknown>> = {
    inactive: { status: 'inactive' }, noaccess: { access: { has_access: false } }, noflag: { access: {} }, incomplete: { guid: '' }, noname: { employee_fullname: '', full_name: ' ' },
  };
  for (const scenario of ['business', 'expiry', ...Object.keys(accounts)]) {
    const f = await fixture();
    f.reply(path => {
      if (path.endsWith('/token/auth')) return envelope({ ...tokens(), ...(scenario === 'expiry' ? { token_expired: 'tomorrow' } : {}) });
      if (path.endsWith('/sso/auth/login')) return envelope(account(accounts[scenario]), 200, scenario === 'business' ? 'Rejected' : 'Success');
      return envelope({});
    });
    const response = (await f.run(f.request('/api/auth/login', { username: 'u', password: 'p' })))!;
    assert.ok(response.status >= 400, scenario);
    if (scenario === 'inactive' || scenario === 'noaccess' || scenario === 'noflag') assert.equal(response.status, 403, scenario);
    assert.equal(f.database.prepare('SELECT count(*) AS n FROM arcade_auth_sessions').get()!.n, 0);
    assert.equal(response.headers.get('set-cookie'), null, 'failed login cannot change a newer account cookie');
  }
});

test('password errors do not refresh; 403 remains forbidden; repeated 401 retries are bounded', async () => {
  for (const [status, message, refreshes] of [[401, 'Password Not Match', 0], [401, 'Please login first', 0], [403, 'Forbidden', 0], [401, 'Expired', 1]] as const) {
    const f = await fixture();
    f.reply(path => path.includes('/token/') ? envelope(tokens()) : envelope({}, status, message));
    const response = (await f.run(f.request('/api/auth/login', { username: 'u', password: 'p' })))!;
    assert.equal(response.status, status);
    assert.equal(f.calls.filter(c => c.path.endsWith('/token/refresh')).length, refreshes);
    assert.ok(f.calls.filter(c => c.path.endsWith('/sso/auth/login')).length <= 3);
  }
});

test('concurrent expiry checks refresh once; rotated refresh token is persisted for the next refresh', async () => {
  const f = await fixture(); const { cookie } = await f.login(); f.expire();
  f.reply(async path => {
    if (path.endsWith('/token/refresh')) { await new Promise(r => setTimeout(r, 25)); return envelope({ ...tokens(), token: 'new-access', refresh_token: 'rotated-refresh' }); }
    throw new Error(`Unexpected upstream ${path}`);
  });
  const responses = await Promise.all(Array.from({ length: 4 }, () => f.run(f.request('/api/auth/session', undefined, cookie))));
  assert.ok(responses.every(r => r?.status === 200));
  assert.equal(f.calls.filter(c => c.path.endsWith('/token/refresh')).length, 1);
  assert.equal(JSON.parse(f.database.prepare('SELECT state FROM arcade_auth_sessions').get()!.state as string).tokens.token, 'new-access');
  f.expire(); await f.run(f.request('/api/auth/session', undefined, cookie));
  assert.equal(f.calls.findLast(c => c.path.endsWith('/token/refresh'))!.headers.get('refresh-token'), 'rotated-refresh');
});

test('failed refresh releases all waiters and cannot create an anonymous replacement session', async () => {
  const f = await fixture(); const { cookie } = await f.login(); f.expire();
  f.reply(() => envelope({}, 401, 'Invalid token'));
  const results = await Promise.all(Array.from({ length: 3 }, () => f.run(f.request('/api/auth/session', undefined, cookie))));
  assert.ok(results.every(r => r?.status === 401));
  assert.equal(f.calls.filter(c => c.path.endsWith('/token/auth')).length, 1);
  assert.equal(f.database.prepare('SELECT count(*) AS n FROM arcade_auth_sessions').get()!.n, 0);
});

test('a stale snapshot cannot acquire the lease after another Worker rotates tokens', async () => {
  const f = await fixture(); const { cookie } = await f.login(); f.expire();
  let resume!: () => void, entered!: () => void, held = false;
  const waiting = new Promise<void>(resolve => { resume = resolve; });
  const started = new Promise<void>(resolve => { entered = resolve; });
  const prepare = f.env.DB.prepare.bind(f.env.DB);
  f.env.DB.prepare = (sql: string) => {
    const statement = prepare(sql);
    if (!sql.startsWith('UPDATE arcade_auth_sessions SET lock_id=')) return statement;
    return { ...statement, bind(...values: unknown[]) {
      const bound = statement.bind(...values);
      return { ...bound, first: async () => {
        if (!held) { held = true; entered(); await waiting; }
        return bound.first();
      } };
    } } as typeof statement;
  };
  let refreshes = 0;
  f.reply(path => {
    if (path.endsWith('/token/refresh')) {
      refreshes++;
      return refreshes === 1 ? envelope({ ...tokens(), refresh_token: 'new-refresh' }) : envelope({}, 401, 'Invalid token');
    }
    throw new Error(`Unexpected upstream ${path}`);
  });
  const stale = f.run(f.request('/api/auth/session', undefined, cookie));
  await started;
  assert.equal((await f.run(f.request('/api/auth/session', undefined, cookie)))!.status, 200);
  resume();
  assert.equal((await stale)!.status, 200);
  assert.equal(refreshes, 1);
});

test('logout deletes server state despite upstream failure and an in-flight refresh cannot resurrect it', async () => {
  const f = await fixture(); const { cookie } = await f.login(); f.expire();
  let finish!: () => void; let started!: () => void;
  const pending = new Promise<void>(resolve => { finish = resolve; });
  const entered = new Promise<void>(resolve => { started = resolve; });
  f.reply(async path => {
    if (path.endsWith('/token/refresh')) { started(); await pending; return envelope(tokens()); }
    return envelope({}, 503, 'Unavailable');
  });
  const check = f.run(f.request('/api/auth/session', undefined, cookie)); await entered;
  const logout = (await f.run(f.request('/api/auth/logout', {}, cookie)))!;
  assert.equal(logout.status, 200);
  assert.equal(logout.headers.get('set-cookie'), null, 'late logout cannot clear a newer account cookie');
  const logoutCall = f.calls.findLast(c => c.path.endsWith('/sso/auth/logout'))!;
  assert.equal(logoutCall.method, 'POST');
  assert.equal(logoutCall.headers.get('x-sso-app-code'), 'arcade-code');
  finish(); assert.equal((await check)!.status, 401);
  const late = (await f.run(f.request('/api/auth/session', undefined, cookie)))!;
  assert.equal(late.headers.get('set-cookie'), null, 'a late account-A check must not delete a newer account-B cookie');
  assert.equal(f.database.prepare('SELECT count(*) AS n FROM arcade_auth_sessions').get()!.n, 0);
  assert.equal((await f.run(f.request('/switch-run', undefined, cookie)))!.status, 302);
});

test('game APIs, encoded game routes and RSC responses cannot bypass authentication', async () => {
  const f = await fixture();
  for (const path of ['/api/big-two', '/api/leaderboard/session', '/api/live/a', '/api/quiz', '/api/%62ig-two', '/api//quiz', '/api//big-two', '/api/quiz.rsc', '/api/live/a.rsc', '/api/quiz/']) {
    assert.equal((await f.run(f.request(path)))!.status, 401, path);
  }
  for (const path of ['/switch-run', '/%73witch-run', '/big-two.rsc', '/chronicles/', '/tangga-wawasan']) {
    assert.equal((await f.run(f.request(path)))!.status, 302, path);
  }
  assert.equal(await f.run(f.request('/')), null);
  assert.equal(await f.run(f.request('/branding/icon-192.png')), null);
});

test('network errors and missing configuration produce safe errors, never secrets or a fake session', async () => {
  const f = await fixture();
  f.reply(() => { throw Error('app-secret access-secret upstream internal details'); });
  const response = (await f.run(f.request('/api/auth/login', { username: 'u', password: 'p' })))!;
  assert.equal(response.status, 502); assert.ok(!(await response.text()).includes('secret'));
  f.env.SSO_APP_KEY = '';
  assert.equal((await f.run(f.request('/api/auth/login', { username: 'u', password: 'p' })))!.status, 503);
  f.env.SSO_APP_KEY = 'app-secret'; f.env.SSO_APP_CODE = '';
  assert.equal((await f.run(f.request('/api/auth/login', { username: 'u', password: 'p' })))!.status, 503);
});

test('two-step login: /api/auth/token seals the app token in an HttpOnly cookie that login consumes once', async () => {
  const f = await fixture();
  const step = (await f.run(f.request('/api/auth/token', {})))!;
  assert.equal(step.status, 200);
  const body = await step.text();
  assert.ok(!body.includes('access-secret') && !body.includes('refresh-secret'));
  const boot = step.headers.get('set-cookie')!;
  assert.match(boot, /^tekad_arcade_boot=/); assert.match(boot, /HttpOnly/); assert.match(boot, /Path=\/api\/auth/);
  assert.ok(!boot.includes('access-secret') && !boot.includes(btoa('access-secret')));
  const bootCookie = boot.split(';')[0];

  const login = (await f.run(f.request('/api/auth/login', { username: 'user@example.com', password: 'password' }, bootCookie)))!;
  assert.equal(login.status, 200, await login.clone().text());
  assert.deepEqual(f.calls.map(c => c.path), ['/v1/token/auth', '/v1/sso/auth/login'], 'login reuses the pending token');
  assert.equal(f.calls[1].headers.get('token'), 'access-secret');
  const cookies = login.headers.getSetCookie();
  assert.ok(cookies.some(c => c.startsWith('tekad_arcade_session=') && c.includes('HttpOnly')));
  assert.ok(cookies.some(c => c.startsWith('tekad_arcade_boot=;') && c.includes('Max-Age=0')), 'pending token is cleared');
});

test('pending token cookie is cleared after a failed login; a tampered one falls back to a fresh bootstrap', async () => {
  const f = await fixture();
  const boot = (await f.run(f.request('/api/auth/token', {})))!.headers.get('set-cookie')!.split(';')[0];
  f.reply(path => path.includes('/token/') ? envelope(tokens()) : path.endsWith('/sso/auth/login') ? envelope({}, 401, 'Password Not Match') : envelope(null));
  const failed = (await f.run(f.request('/api/auth/login', { username: 'u', password: 'p' }, boot)))!;
  assert.equal(failed.status, 401);
  assert.equal(failed.headers.getSetCookie().length, 1);
  assert.match(failed.headers.get('set-cookie')!, /^tekad_arcade_boot=;.*Max-Age=0/);
  assert.ok(f.calls.some(c => c.path.endsWith('/sso/auth/logout')), 'the unused app token is revoked');

  const g = await fixture();
  const before = g.calls.length;
  const response = (await g.run(g.request('/api/auth/login', { username: 'u', password: 'p' }, 'tekad_arcade_boot=AAAA.BBBB')))!;
  assert.equal(response.status, 200);
  assert.equal(g.calls.filter(c => c.path.endsWith('/token/auth')).length, before + 1);
});

test('/api/auth/token rejects cross-site and non-POST requests before contacting the upstream', async () => {
  const f = await fixture();
  assert.equal((await f.run(f.request('/api/auth/token', {}, '', { Origin: 'https://evil.example' })))!.status, 403);
  assert.equal((await f.run(f.request('/api/auth/token')))!.status, 405);
  assert.equal(f.calls.length, 0);
});
