import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {transformSync} from 'esbuild';
const engine=transformSync(fs.readFileSync('app/big-two/engine.ts','utf8'),{loader:'ts',format:'esm'}).code;
const engineUrl='data:text/javascript;base64,'+Buffer.from(engine).toString('base64');
const skills=transformSync(fs.readFileSync('app/big-two/portrait/skills.ts','utf8'),{loader:'ts',format:'esm'}).code.replace('"../engine"',JSON.stringify(engineUrl));
const {activateSkill}=await import('data:text/javascript;base64,'+Buffer.from(skills).toString('base64'));
const {createGame,act,restoreGame}=await import(engineUrl);
const unused={used:false,message:''};
function fixture(){let g=createGame(()=>.5);g=act(g,g.turn,[0]);return {...g,turn:0};}
test('skills preserve all 52 unique cards and save restoration',()=>{for(let p=0;p<5;p++){const g=fixture(),before=JSON.stringify(g);const r=activateSkill(g,p,[g.hands[0][0]],unused,()=>.2);assert.equal(JSON.stringify(g),before);assert.ok(restoreGame(structuredClone(r.game)));assert.equal(new Set([...r.game.hands.flat(),...r.game.played]).size,52);if(!r.error){assert.equal(r.state.used,true);assert.ok(activateSkill(r.game,p,[r.game.hands[0][0]],r.state).error);}}});
test('opening, other turns and final card cannot be bypassed',()=>{let g=createGame(()=>.5);g.turn=0;assert.ok(activateSkill(g,0,[],unused).error);g=fixture();assert.ok(activateSkill({...g,turn:2},4,[g.hands[0][0]],unused).error);assert.ok(activateSkill({...g,hands:[[g.hands[0][0]],...g.hands.slice(1)]},4,[g.hands[0][0]],unused).error);});
test('Adapt upgrades matching rank and failed skill stays available',()=>{let g=fixture();g.hands=[[4,8],[5,12],[6,16],[7,20]];const r=activateSkill(g,3,[4],unused);assert.equal(r.error,undefined);assert.deepEqual(r.game.hands[0],[7,8]);assert.deepEqual(r.game.hands[3],[4,20]);assert.ok(activateSkill(g,3,[8],unused).error);assert.equal(unused.used,false);});
