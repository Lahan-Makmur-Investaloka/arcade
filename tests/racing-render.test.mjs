import test from 'node:test';
import assert from 'node:assert/strict';

test('published worker renders Racing without invoking WebGL on the server',async()=>{
  const {default:worker}=await import('../dist/server/index.js');
  const response=await worker.fetch(new Request('http://localhost/tekad-racing',{headers:{accept:'text/html'}}),{ASSETS:{fetch:async()=>new Response('',{status:404})}},{waitUntil(){},passThroughOnException(){}});
  assert.equal(response.status,200);const html=await response.text();
  assert.match(html,/Pelabuhan/);assert.match(html,/Sirkuit Neon/);assert.match(html,/Menyiapkan lintasan/);assert.match(html,/branding\/icon-192.png/);
  assert.doesNotMatch(html,/Prototype 01|MECHANICS TEST|TEST KART/);
});
