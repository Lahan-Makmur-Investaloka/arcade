import assert from 'node:assert/strict';
import test from 'node:test';
import { build } from 'esbuild';
import { Miniflare, createFetchMock } from 'miniflare';

test('upstream requests work in Cloudflare runtime and never follow credential-bearing redirects', async () => {
  const bundle = await build({ stdin: { contents: `
    import {LahansClient} from './lib/sso/client.ts';
    export default { async fetch(request) {
      const prefix = new URL(request.url).pathname === '/redirect' ? '/redirect' : '/v1';
      try {
        await new LahansClient({SSO_API_BASE_URL:'https://sso.example'+prefix,SSO_APP_NAME:'qa',SSO_APP_KEY:'dummy-key',SSO_APP_CODE:'qa-code'}).bootstrap('Web-qa');
        return Response.json({ok:true});
      } catch (e) { return Response.json({error:e.message}, {status:e.status ?? 500}); }
    }};`, resolveDir: process.cwd() }, bundle: true, write: false, format: 'esm', platform: 'browser' });
  const fetchMock = createFetchMock();
  fetchMock.disableNetConnect();
  const upstream = fetchMock.get('https://sso.example');
  const expires = new Date(Date.now() + 3_600_000).toISOString();
  upstream.intercept({ path: '/v1/token/auth', method: 'POST' }).reply(200, {
    message: { en: 'Success' }, data: { token: 'mock-token', token_expired: expires, refresh_token: 'mock-refresh', refresh_token_expired: expires },
  });
  upstream.intercept({ path: '/redirect/token/auth', method: 'POST' }).reply(302, '', { headers: { Location: 'https://other.example/collect' } });
  const worker = new Miniflare({ modules: true, compatibilityDate: '2026-05-15', script: bundle.outputFiles[0].text, fetchMock });
  try {
    const success = await worker.dispatchFetch('http://qa.local/');
    assert.equal(success.status, 200, await success.clone().text());
    assert.deepEqual(await success.json(), { ok: true });
    const redirected = await worker.dispatchFetch('http://qa.local/redirect');
    assert.equal(redirected.status, 502);
    fetchMock.assertNoPendingInterceptors();
  } finally { await worker.dispose(); }
});
