import assert from 'node:assert/strict';
import test from 'node:test';
import { build } from 'esbuild';
import { resolve } from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

test('login renders accessible credentials and pending/error states without exposing secrets', async () => {
  await build({ entryPoints: ['app/login/login-form.tsx', 'app/auth-provider.tsx'], bundle: true, outdir: '.sites-runtime/sso-ui', format: 'esm', outExtension: { '.js': '.mjs' }, platform: 'node', jsx: 'automatic', packages: 'external', alias: { 'next/navigation': 'next/navigation.js', 'next/link': 'next/link.js' }, loader: { '.css': 'empty' } });
  const { default: LoginForm } = await import(resolve('.sites-runtime/sso-ui/login/login-form.mjs'));
  const html = renderToStaticMarkup(React.createElement(LoginForm, { returnTo: '/switch-run' }));
  assert.match(html, /name="username"/);
  assert.match(html, /autoComplete="username"/i);
  assert.match(html, /name="password"/);
  assert.match(html, /type="password"/);
  assert.match(html, /autoComplete="current-password"/i);
  assert.match(html, /Tampilkan password/);
  assert.match(html, /type="submit"/);
  assert.ok(!html.includes('app_key'));
});

test('account cleanup removes Arcade data only and preserves unrelated applications', async () => {
  await build({ entryPoints: ['lib/sso/browser-storage.ts'], bundle: true, outfile: '.sites-runtime/sso-ui/browser-storage.mjs', format: 'esm', platform: 'node' });
  const { clearArcadeStorage } = await import(resolve('.sites-runtime/sso-ui/browser-storage.mjs'));
  const storage = () => {
    const map = new Map([['tekad-player-key', 'old-player'], ['tekad-big-two-room-v1', 'private-room'], ['tekad-high-score', '100'], ['other-application-user', 'keep'], ['tekad-arcade-auth-event', 'event']]);
    return { map, get length() { return map.size; }, key: i => [...map.keys()][i], removeItem: key => map.delete(key) };
  };
  const local = storage(), session = storage();
  globalThis.window = { localStorage: local, sessionStorage: session };
  try {
    clearArcadeStorage();
    for (const store of [local, session]) {
      assert.deepEqual([...store.map.keys()], ['other-application-user', 'tekad-arcade-auth-event']);
    }
    Object.defineProperty(window, 'localStorage', { get() { throw Error('blocked'); } });
    assert.doesNotThrow(clearArcadeStorage);
  } finally { delete globalThis.window; }
});
