import test from 'node:test';
import assert from 'node:assert/strict';
import {stat} from 'node:fs/promises';
test('published worker serves Big Two lobby with all seven bundled assets and Arcade entry',async()=>{
 const {default:worker}=await import('../dist/server/index.js');
 const env={ASSETS:{fetch:async()=>new Response('Not found',{status:404})}};
 const ctx={waitUntil(){},passThroughOnException(){}};
 const response=await worker.fetch(new Request('http://localhost/big-two',{headers:{accept:'text/html'}}),env,ctx);
 assert.equal(response.status,200);const html=await response.text();
 assert.match(html,/Pilih pemainmu/);assert.match(html,/Latihan melawan bot/);assert.match(html,/Main bersama/);assert.match(html,/Capsa Banting/);
 assert.ok(html.includes('/big-two/art/timmy-play.webp'));assert.ok(html.includes('/big-two/art/timmy-play-480.webp'));
 for(const name of ['timmy','eldric','kirana','adelia','dylan','cover'])assert.ok(html.includes(`/big-two/${name}.webp`),name);
 for(const name of ['timmy','eldric','kirana','adelia','dylan','cover','lounge'])assert.ok((await stat(`public/big-two/${name}.webp`)).size>10000,name);
 const home=await worker.fetch(new Request('http://localhost/',{headers:{accept:'text/html'}}),env,ctx);assert.equal(home.status,200);assert.match(await home.text(),/href="\/big-two"/);
});
