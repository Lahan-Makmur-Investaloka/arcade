// React interaction checks. This is not a browser layout or physical-device test.
// ARCADE_DOM_PATH must identify an existing linkedom installation.
import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {resolve} from 'node:path';
import {access} from 'node:fs/promises';
import React, {act} from 'react';

const domPath = process.env.ARCADE_DOM_PATH;
test('Console home: navigation, async artwork, recovery, dialog and touch', {skip: !domPath}, async () => {
  const {parseHTML} = await import(domPath);
  const {window} = parseHTML('<html><body><div id="app"></div></body></html>');
  const storage = new Map(), images = [], scrolls = [];
  let storageDenied = false;
  class FakeImage {
    set src(value) { this.url = value; images.push(this); }
  }
  Object.assign(globalThis, {window, document:window.document, HTMLElement:window.HTMLElement, Image:FakeImage, Event:window.Event,
    matchMedia:()=>({matches:true}), IS_REACT_ACT_ENVIRONMENT:true,
    sessionStorage:{getItem(key){if(storageDenied)throw new Error('denied');return storage.get(key) ?? null;},setItem(key,value){if(storageDenied)throw new Error('denied');storage.set(key,value);}}
  });
  window.HTMLElement.prototype.showModal = function(){this.open=true;};
  window.HTMLElement.prototype.close = function(){this.open=false;};
  window.HTMLElement.prototype.scrollTo = function(value){scrolls.push(value);};
  let focused = null;
  window.HTMLElement.prototype.focus = function(){focused=this;};
  const plugin = {name:'test-imports',setup(b){
    b.onResolve({filter:/^react(\/.*)?$/},args=>({path:resolve('node_modules',args.path==='react/jsx-runtime'?'react/jsx-runtime.js':'react/index.js'),external:true}));
    b.onResolve({filter:/^next\/link$/},()=>({path:'link',namespace:'stub'}));
    b.onLoad({filter:/.*/,namespace:'stub'},()=>({contents:"import React from 'react';export default function Link({prefetch,...p}){return React.createElement('a',p,p.children)}"}));
  }};
  await build({entryPoints:['app/arcade-home.tsx','app/arcade-intro.tsx'],bundle:true,outdir:'.sites-runtime/home-tests',format:'esm',outExtension:{'.js':'.mjs'},platform:'node',jsx:'automatic',loader:{'.css':'empty'},plugins:[plugin]});
  const {default:Home}=await import(resolve('.sites-runtime/home-tests/arcade-home.mjs'));
  const {default:Intro}=await import(resolve('.sites-runtime/home-tests/arcade-intro.mjs'));
  const {createRoot}=await import('react-dom/client');
  const props=el=>el[Object.keys(el).find(k=>k.startsWith('__reactProps$'))];
  const query=selector=>document.querySelector(selector);
  const tabs=()=>[...document.querySelectorAll('[role=tab]')];
  const selected=()=>tabs().findIndex(el=>el.getAttribute('aria-selected')==='true');
  const click=async el=>act(async()=>props(el).onClick({target:el,currentTarget:el,preventDefault(){}}));
  const key=async value=>act(async()=>props(tabs()[selected()]).onKeyDown({key:value,preventDefault(){}}));
  const title=()=>query('h1').textContent;
  let root=createRoot(query('#app'));
  await act(async()=>root.render(React.createElement(Home)));
  assert.equal(tabs().length,8);assert.equal(selected(),0);assert.equal(title(),'Capsa Banting');
  assert.equal(query('.console-play').getAttribute('href'),'/big-two');
  const routes=[...document.querySelectorAll('.console-catalog-game')].map(el=>el.getAttribute('href'));
  assert.deepEqual(routes,['/big-two','/eldrics-workshop','/sejuta-poin','/switch-run','/tekad-jrpg','/chronicles/','/tekad-racing','/jigsaw']);
  for(const img of document.querySelectorAll('img'))await access(resolve('public'+img.getAttribute('src')));
  await key('ArrowRight');assert.equal(selected(),1);assert.equal(focused,tabs()[1]);assert.equal(tabs().filter(el=>el.getAttribute('tabindex')==='0').length,1);
  const lateWorkshop=images.at(-1);assert.ok(lateWorkshop.url.includes('/workshop/'));
  const staleCallback=lateWorkshop.onload;
  await key('ArrowRight');assert.equal(selected(),2);const quiz=images.at(-1);
  await act(async()=>quiz.onload());assert.ok(query('.console-backdrop.incoming').getAttribute('src').includes('/quiz/'));
  await act(async()=>staleCallback());assert.ok(query('.console-backdrop.incoming').getAttribute('src').includes('/quiz/'),'obsolete request cannot replace current art');
  await key('End');assert.equal(selected(),7);assert.equal(query('.console-play').getAttribute('href'),'/jigsaw');
  await key('ArrowRight');assert.equal(selected(),0);await key('ArrowLeft');assert.equal(selected(),7);await key('Home');assert.equal(selected(),0);
  await click(tabs()[6]);const racing=images.at(-1);await act(async()=>racing.onerror());
  assert.equal(title(),'TEKAD Racing');assert.equal(query('.console-play').getAttribute('href'),'/tekad-racing','image failure does not block launch');
  const panel=query('[role=tabpanel]');
  const touch=async(start,end)=>act(async()=>{props(panel).onTouchStart({touches:[{clientX:start[0],clientY:start[1]}]});props(panel).onTouchEnd({changedTouches:[{clientX:end[0],clientY:end[1]}]});});
  await touch([200,100],[200,250]);assert.equal(selected(),6,'vertical scrolling does not select');
  await touch([250,150],[100,160]);assert.equal(selected(),7,'horizontal swipe selects next');
  await touch([250,150],[100,160]);assert.equal(selected(),7,'swipe clamps at final game');
  await click(query('.console-library-button'));assert.equal(query('dialog').open,true);assert.equal(document.body.style.overflow,'hidden');
  await act(async()=>props(query('dialog')).onCancel({preventDefault(){}}));assert.equal(query('dialog').open,false);assert.notEqual(document.body.style.overflow,'hidden');
  await click(query('.console-library-button'));await click(query('dialog'));assert.equal(query('dialog').open,false,'backdrop closes catalog');
  assert.equal(storage.get('tekad-home-selected'),'jigsaw');
  await act(async()=>root.unmount());root=createRoot(query('#app'));await act(async()=>root.render(React.createElement(Home)));assert.equal(selected(),7,'return to arcade restores selected game');
  await act(async()=>root.unmount());storage.set('tekad-home-selected','not-a-real-game');storageDenied=true;
  root=createRoot(query('#app'));await act(async()=>root.render(React.createElement(Home)));await click(tabs()[3]);assert.equal(selected(),3,'selection works when storage denied');
  await act(async()=>root.unmount());storageDenied=false;storage.clear();
  root=createRoot(query('#app'));await act(async()=>root.render(React.createElement(Intro,null,React.createElement('p',null,'Game menu'))));
  assert.ok(query('.console-boot'));assert.equal(document.body.style.overflow,'hidden');
  await act(async()=>{for(const img of images.slice(-2))img.onerror?.();await new Promise(r=>setTimeout(r,15));});
  await act(async()=>{await new Promise(r=>setTimeout(r,15));});
  assert.equal(query('.console-boot'),null,'failed assets still release intro');assert.notEqual(document.body.style.overflow,'hidden');assert.equal(storage.get('tekad-arcade-intro-seen'),'1');
  await act(async()=>root.unmount());
});
