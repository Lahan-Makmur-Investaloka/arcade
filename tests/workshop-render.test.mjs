import test from 'node:test';
import assert from 'node:assert/strict';
import {access} from 'node:fs/promises';
import worker from '../dist/server/index.js';
test('Arcade and Workshop serve the cinematic game and complete local assets',async()=>{
 for(const [path,expected] of [['/','Eldric’s Workshop'],['/eldrics-workshop','Aktifkan']]){
  const response=await worker.fetch(new Request('http://localhost'+path,{headers:{accept:'text/html'}}),{ASSETS:{fetch:async()=>new Response('Not found',{status:404})}},{waitUntil(){},passThroughOnException(){}});
  assert.equal(response.status,200);const html=await response.text();assert.ok(html.includes(expected));assert.ok(!html.includes('Internal Server Error'));
  if(path==='/eldrics-workshop'){assert.ok(html.includes('/workshop/eldric.webp'));assert.ok(html.includes('/workshop/scarab-active.webp'));assert.ok(html.includes('data-cell="4"'));}
 }
 for(const file of ['workshop','workshop-mobile','cover','eldric','metal','scarab','gyroscope','owl','reactor','scarab-active','gyroscope-active','owl-active','reactor-active'])await access(new URL('../public/workshop/'+file+'.webp',import.meta.url));
});
