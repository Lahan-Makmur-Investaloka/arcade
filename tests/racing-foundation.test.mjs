import test from 'node:test';
import assert from 'node:assert/strict';
import { advanceRaceClock, createRaceClock, RACE_STEP } from '../app/tekad-racing/race-clock.ts';

test('equal race time across 15, 30, 60 and 120 Hz, including uneven frames', () => {
  for (const fps of [15, 30, 60, 120]) {
    const clock = createRaceClock(0);
    let steps = 0;
    for (let i = 1; i <= fps * 10; i++) steps += advanceRaceClock(clock, i * 1000 / fps, true);
    assert.equal(steps, 1200, `${fps} Hz advances ten simulation seconds`);
  }
  const clock = createRaceClock(0);
  let steps = 0;
  for (const now of [13, 37, 91, 180, 240, 277, 405, 570, 730, 810, 940, 1000]) steps += advanceRaceClock(clock, now, true);
  assert.equal(steps * RACE_STEP, 1);
  assert.equal(advanceRaceClock(clock, 301000, false), 0);
  assert.equal(advanceRaceClock(clock, 301100, true), 12, 'resume does not simulate five paused minutes');
  assert.ok(advanceRaceClock(clock, 601100, true) <= 30, 'bounded recovery after long main-thread stall');
});

test('actual Racing React lifecycle: pause/resume, blur, touch cancellation, rematch, blocked storage', {skip: !process.env.RACING_DOM_PATH}, async () => {
  const {parseHTML} = await import(process.env.RACING_DOM_PATH);
  const {build} = await import('esbuild');
  const React = await import('react');
  const {window} = parseHTML('<html><body><div id="root"></div></body></html>');
  let now = 0, nextId = 0;
  const frames = new Map();
  const noop = () => {};
  const context = new Proxy({}, {get: (_, key) => key === 'createLinearGradient' ? () => ({addColorStop: noop}) : noop, set: () => true});
  window.HTMLCanvasElement.prototype.getContext = () => context;
  Object.assign(globalThis, {
    window, document: window.document, Element: window.Element, HTMLElement: window.HTMLElement,
    Event: window.Event, IS_REACT_ACT_ENVIRONMENT: true,
    localStorage: {getItem() {throw new Error('blocked');}, setItem() {throw new Error('blocked');}},
    Image: class {complete = true; naturalWidth = 760; naturalHeight = 950;},
    performance: {now: () => now},
    requestAnimationFrame: callback => { frames.set(++nextId, callback); return nextId; },
    cancelAnimationFrame: id => frames.delete(id),
  });
  const {createRoot} = await import('react-dom/client');
  const bundle = await build({entryPoints: ['app/tekad-racing/racing-game.tsx'], bundle: true, platform: 'node', format: 'esm', write: false, packages: 'external', jsx: 'automatic'});
  // Keep the compiled test module within the project for React module resolution.
  const {writeFileSync, unlinkSync} = await import('node:fs');
  const {pathToFileURL} = await import('node:url');
  const {resolve} = await import('node:path');
  const path = resolve('.sites-runtime/racing-test.mjs');
  writeFileSync(path, bundle.outputFiles[0].text);
  const Game = (await import(pathToFileURL(path).href)).default;
  const root = createRoot(document.getElementById('root'));
  const props = el => el[Object.keys(el).find(k => k.startsWith('__reactProps'))];
  const button = label => [...document.querySelectorAll('button')].find(b => b.textContent === label);
  const click = async label => {const el = button(label); assert.ok(el, label); assert.ok(!el.disabled, label); await React.act(async () => props(el).onClick());};
  const advance = async seconds => {
    await React.act(async () => {
      for (let i = 0; i < Math.round(seconds * 60); i++) {
        now += 1000 / 60;
        const callbacks = [...frames.values()]; frames.clear();
        for (const callback of callbacks) callback(now);
      }
    });
  };
  const time = () => document.querySelectorAll('.racing-hud strong')[2].textContent;
  try {
    await React.act(async () => root.render(React.createElement(Game)));
    assert.equal(document.querySelectorAll('.racing-character-select button').length, 5);
    await click('Mulai balapan');
    await advance(2);
    assert.notEqual(time(), '0:00.00');
    await click('Jeda');
    const pausedTime = time();
    assert.equal(document.querySelector('.racing-character-select'), null, 'cannot replace opponents while paused');
    await advance(3);
    assert.equal(time(), pausedTime);
    await click('Lanjut balapan');
    await advance(1);
    assert.ok(time() > pausedTime, 'resume continues instead of restarting');
    const left = document.querySelector('[aria-label="Belok kiri"]');
    left.setPointerCapture = noop;
    await React.act(async () => {
      props(left).onPointerDown({preventDefault: noop, currentTarget: left, pointerId: 1});
      props(left).onLostPointerCapture({preventDefault: noop, currentTarget: left, pointerId: 1});
      window.dispatchEvent(new window.Event('blur'));
    });
    assert.ok(document.querySelector('.racing-paused'));
    await click('Lanjut balapan');
    // Exercise a full race with denied localStorage; finish must still render.
    for (let i = 0; i < 400 && !document.querySelector('.finish'); i++) await advance(1);
    assert.ok(document.querySelector('.finish'), 'complete three laps');
    await click('Pilih pembalap');
    await click('ADELIA');
    await click('Mulai balapan');
    await advance(.2);
    assert.match(document.querySelector('.racing-statusbar').textContent, /ADELIA/);
    assert.ok(time() < '0:01.00', 'explicit new race starts at zero');
  } finally {
    await React.act(async () => root.unmount());
    unlinkSync(path);
    assert.equal(frames.size, 0, 'unmount cancels renderer');
  }
});
