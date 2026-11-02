// Real React + real Three scene/simulation; WebGL transport mocked. Not GPU QA.
import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {writeFileSync,unlinkSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import React,{act} from 'react';

test('Harbor UI: loading, start, held touch release, pause, resume, recovery, context failure and retry', {skip:!process.env.RACING_DOM_PATH},async()=>{
  const {parseHTML}=await import(process.env.RACING_DOM_PATH),{window}=parseHTML('<html><body><div id="root"></div></body></html>');
  let now=0,uid=0,neon=0;const frames=new Map();
  Object.assign(globalThis,{window,document:window.document,Element:window.Element,HTMLElement:window.HTMLElement,Event:window.Event,IS_REACT_ACT_ENVIRONMENT:true,performance:{now:()=>now},requestAnimationFrame:f=>{frames.set(++uid,f);return uid;},cancelAnimationFrame:id=>frames.delete(id),ResizeObserver:class{observe(){}disconnect(){}},__harborRenders:0,__harborDisposed:0,__harborFail:false,__harborTextureJobs:[]});
  window.matchMedia=()=>({matches:false});window.HTMLCanvasElement.prototype.getBoundingClientRect=()=>({width:960,height:540});
  window.HTMLElement.prototype.setPointerCapture=()=>{};
  const {createRoot}=await import('react-dom/client');
  const bundle=await build({entryPoints:['app/tekad-racing/harbor/harbor-game.tsx'],bundle:true,platform:'node',format:'esm',packages:'external',jsx:'automatic',loader:{'.css':'empty'},write:false,plugins:[{name:'mock-gpu-only',setup(b){
    b.onResolve({filter:/^three$/},args=>args.namespace==='gpu-test'?{path:'three',external:true}:args.importer.endsWith('/runtime.ts')?{path:'mock-three',namespace:'gpu-test'}:undefined);
    b.onLoad({filter:/.*/,namespace:'gpu-test'},()=>({loader:'js',contents:`export * from 'three'; import {Texture} from 'three'; export class TextureLoader { load(url,onLoad,onProgress,onError){const texture=new Texture();const job={url,texture,disposed:0,complete:()=>onLoad(texture),fail:()=>onError()};texture.addEventListener('dispose',()=>job.disposed++);globalThis.__harborTextureJobs.push(job);return texture;} } export class WebGLRenderer { constructor(){if(globalThis.__harborFail)throw new Error('GPU unavailable');this.shadowMap={};}setPixelRatio(){}setSize(){}render(scene,camera){globalThis.__harborRenders++;globalThis.__harborAtlas=scene.getObjectByName('timmy-anime-billboard')?.material.map;globalThis.__harborCamera=[...camera.position.toArray(),...camera.quaternion.toArray(),camera.fov];}dispose(){globalThis.__harborDisposed++;}forceContextLoss(){} }`}));
  }}]});
  const path=resolve('.sites-runtime/harbor-ui-test.mjs');writeFileSync(path,bundle.outputFiles[0].text);const Game=(await import(pathToFileURL(path).href)).default;
  const root=createRoot(document.getElementById('root'));
  const props=el=>el[Object.keys(el).find(k=>k.startsWith('__reactProps'))];
  const button=label=>[...document.querySelectorAll('button')].find(b=>b.textContent===label);
  const click=async label=>{const b=button(label);assert.ok(b,label);assert.ok(!b.disabled,label);await act(async()=>props(b).onClick());};
  const advance=async seconds=>{await act(async()=>{for(let i=0;i<seconds*60;i++){now+=1000/60;const callbacks=[...frames.values()];frames.clear();for(const f of callbacks)f(now);}});};
  const value=selector=>document.querySelector(selector)?.textContent;
  try{
    await act(async()=>{root.render(React.createElement(Game,{onNeon:()=>neon++}));await new Promise(r=>setTimeout(r,10));});
    assert.ok(button('Menyiapkan lintasan…').disabled,'race waits for its character artwork');await advance(.1);assert.ok(globalThis.__harborRenders>0);
    const atlasJob=globalThis.__harborTextureJobs[0];assert.equal(atlasJob.url,'/racing/timmy-anime-atlas-v1.webp');await act(async()=>atlasJob.complete());await advance(.1);assert.equal(globalThis.__harborAtlas,atlasJob.texture,'loaded atlas reaches the real billboard material');assert.ok(!button('Mulai latihan').disabled);
    await click('Mulai latihan');await advance(2);const before=value('.harbor-time strong');assert.notEqual(before,'0:00.00');
    const throttle=document.querySelector('[aria-label="Gas ekstra"]');await act(async()=>props(throttle).onPointerDown({preventDefault(){},currentTarget:throttle,pointerId:1}));await advance(3);
    assert.equal(value('.harbor-speed strong'),'101');await act(async()=>props(throttle).onLostPointerCapture({preventDefault(){},currentTarget:throttle,pointerId:1}));await advance(1);assert.ok(Number(value('.harbor-speed strong'))<101);await advance(1);assert.equal(value('.harbor-speed strong'),'83');
    const beforePauseCamera=[...globalThis.__harborCamera];await click('Ⅱ');const paused=value('.harbor-time strong');await advance(3);assert.equal(value('.harbor-time strong'),paused);assert.deepEqual(globalThis.__harborCamera,beforePauseCamera,'pause freezes the displayed camera instead of snapping to its target');
    await click('Lanjut latihan');await advance(1);assert.ok(value('.harbor-time strong')>paused);
    await click('Kembali ke jalur');assert.equal(value('.harbor-speed strong'),'0');
    await act(async()=>window.dispatchEvent(new window.Event('blur')));assert.ok(button('Lanjut latihan'));
    await click('Lanjut latihan');await advance(.1);
    const oldCanvas=document.querySelector('canvas');await act(async()=>oldCanvas.dispatchEvent(new window.Event('webglcontextlost',{cancelable:true})));assert.match(document.querySelector('[role="alert"]').textContent,/terhenti/);
    globalThis.__harborFail=true;await click('Coba lagi');assert.match(document.querySelector('[role="alert"]').textContent,/belum bisa dibuka/);assert.ok(globalThis.__harborDisposed>0);
    globalThis.__harborFail=false;await click('Coba lagi');assert.ok(button('Menyiapkan lintasan…'));assert.notEqual(document.querySelector('canvas'),oldCanvas);
    await act(async()=>globalThis.__harborTextureJobs.at(-1).fail());assert.match(document.querySelector('[role="alert"]').textContent,/Gambar Timmy/);
    await click('Coba lagi');await act(async()=>globalThis.__harborTextureJobs.at(-1).complete());assert.ok(button('Mulai latihan'));
    await click('Mulai latihan');
    const key=async(type,code)=>{await act(async()=>{const event=new window.Event(type,{cancelable:true});Object.defineProperty(event,'code',{value:code});window.dispatchEvent(event);});};
    await key('keydown','KeyW');await key('keydown','ArrowUp');await advance(5);
    assert.equal(value('.harbor-speed strong'),'101');
    await key('keyup','KeyW');await advance(.25);assert.equal(value('.harbor-speed strong'),'101','releasing W preserves held ArrowUp');
    await key('keyup','ArrowUp');await advance(1.5);assert.equal(value('.harbor-speed strong'),'83','last source release returns to cruise');
    const restart=async()=>{await click('Ⅱ');await click('Ulang dari awal');await advance(2);};
    await restart();await key('keydown','KeyD');await key('keydown','ShiftLeft');await advance(1.1);
    assert.match(value('.harbor-drift-meter strong'),/TURBO I SIAP/,'charged drift is visible in the HUD');
    await key('keydown','ShiftRight');await key('keyup','ShiftLeft');await advance(.05);
    assert.equal(document.querySelector('.harbor-control-drift').getAttribute('aria-pressed'),'true','second Shift source keeps drift held');
    await key('keyup','ShiftRight');await key('keyup','KeyD');await advance(.05);assert.equal(value('.harbor-drift-meter strong'),'MINI-TURBO');
    const boostTime=value('.harbor-drift-meter span');await click('Ⅱ');await advance(2);assert.equal(value('.harbor-drift-meter span'),boostTime,'pause freezes active boost duration');
    await click('Lanjut latihan');await advance(.05);assert.equal(value('.harbor-drift-meter strong'),'MINI-TURBO');
    await click('Kembali ke jalur');assert.equal(document.querySelector('.harbor-drift-meter'),null,'recovery clears turbo');await advance(.8);
    await restart();await key('keydown','KeyD');
    const driftButton=document.querySelector('.harbor-control-drift'),touch={preventDefault(){},currentTarget:driftButton,pointerId:5};
    await act(async()=>props(driftButton).onPointerDown(touch));await advance(1.2);assert.match(value('.harbor-drift-meter strong'),/SIAP/);
    await act(async()=>props(driftButton).onPointerCancel(touch));await advance(.05);assert.equal(document.querySelector('.harbor-drift-meter'),null,'cancelled touch cannot cash in a charged turbo');await key('keyup','KeyD');
    await restart();await key('keydown','KeyD');await key('keydown','ShiftLeft');await advance(1.1);await click('Ⅱ');await click('Lanjut latihan');await advance(.1);
    assert.equal(document.querySelector('.harbor-drift-meter'),null,'pause cancels charge without triggering a release reward');await key('keyup','ShiftLeft');await key('keyup','KeyD');
    await click('Sirkuit Neon');assert.equal(neon,1);
  }finally{await act(async()=>root.unmount());unlinkSync(path);assert.equal(frames.size,0);for(const job of globalThis.__harborTextureJobs){assert.ok(job.disposed>=1,'texture disposed on scene exit');const count=job.disposed;job.complete();assert.equal(job.disposed,count+1,'late image completion is discarded after disposal');}assert.equal(frames.size,0);}
});
