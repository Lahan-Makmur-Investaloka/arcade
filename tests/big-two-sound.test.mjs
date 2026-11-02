import test from 'node:test';
import assert from 'node:assert/strict';
import {CardSound} from '../app/big-two/sound.ts';

class Param{
 value=0;events=[];
 setValueAtTime(v,t){this.value=v;this.events.push([v,t]);}
 linearRampToValueAtTime(v,t){this.setValueAtTime(v,t);}
 exponentialRampToValueAtTime(v,t){this.setValueAtTime(v,t);}
 setTargetAtTime(v,t){this.setValueAtTime(v,t);}
 cancelScheduledValues(){}
}
class Node{
 constructor(ctx,kind){this.ctx=ctx;this.kind=kind;this.gain=new Param();this.frequency=new Param();ctx.nodes.push(this);}
 connect(target){this.target=target;}
 disconnect(){this.disconnected=true;}
 start(at=0){this.started=at;this.ctx.starts.push(this);}
 stop(at){if(at===undefined){this.stopped=true;this.onended?.();}else this.end=at;}
}
class Context{
 static instances=[];
 constructor(){Context.instances.push(this);this.state='suspended';this.currentTime=0;this.sampleRate=8000;this.nodes=[];this.starts=[];this.destination={};}
 createGain(){return new Node(this,'gain');}
 createOscillator(){return new Node(this,'oscillator');}
 createBufferSource(){return new Node(this,'noise');}
 createBiquadFilter(){return new Node(this,'filter');}
 createDynamicsCompressor(){const n=new Node(this,'compressor');for(const k of ['threshold','knee','ratio','attack','release'])n[k]=new Param();return n;}
 createBuffer(_c,length){const data=new Float32Array(length);return{getChannelData:()=>data};}
 async resume(){this.state='running';}
 async suspend(){this.state='suspended';}
 async close(){this.state='closed';}
 advance(seconds){this.currentTime+=seconds;for(const n of this.nodes)if(!n.stopped&&n.end!==undefined&&n.end<=this.currentTime){n.stopped=true;n.onended?.();}}
}
const config={music:true,effectsVolume:.65,musicVolume:.28,active:true,visible:true};

test('audio lifecycle: explicit unlock, independent levels, pause, hide, mute and disposal',async()=>{
 const original=globalThis.AudioContext,interval=globalThis.setInterval,clear=globalThis.clearInterval;
 const schedules=new Map();let serial=0;
 globalThis.AudioContext=Context;globalThis.setInterval=fn=>{const id=++serial;schedules.set(id,fn);return id;};globalThis.clearInterval=id=>schedules.delete(id);
 const sound=new CardSound();
 try{
  sound.configure(config);sound.play('play');assert.equal(Context.instances.length,0,'default never autoplays');
  sound.enabled=true;sound.configure(config);sound.play('play');assert.equal(Context.instances.length,0,'restored preference still needs a gesture');
  sound.unlock();await Promise.resolve();const ctx=Context.instances.at(-1);
  assert.equal(ctx.state,'running');assert.equal(schedules.size,1);assert.ok(ctx.starts.length>0,'original music starts after unlock');
  const buses=ctx.nodes.filter(n=>n.kind==='gain').slice(0,3);assert.equal(buses[1].gain.value,.65);assert.equal(buses[2].gain.value,.28);
  for(const kind of ['select','deal','play','pass','combo','win','turn']){const before=ctx.starts.length;sound.play(kind);assert.ok(ctx.starts.length>before,kind);}
  sound.configure({...config,effectsVolume:0,musicVolume:.4});assert.equal(buses[1].gain.value,0);assert.equal(buses[2].gain.value,.4);
  sound.configure({...config,effectsVolume:0,musicVolume:0});assert.equal(schedules.size,0,'zero music volume releases the scheduler');const zeroCount=ctx.starts.length;sound.play('play');assert.equal(ctx.starts.length,zeroCount,'zero effect volume allocates no sources');
  sound.configure(config);
  sound.configure({...config,active:false});assert.equal(schedules.size,0,'menu/lobby cancels sequencer');
  sound.configure(config);assert.equal(schedules.size,1,'return resumes one sequencer');
  for(let i=0;i<600;i++){ctx.advance(.1);for(const fn of [...schedules.values()])fn();}
  assert.ok(ctx.nodes.filter(n=>['noise','oscillator'].includes(n.kind)&&!n.stopped).length<25,'bounded live voices over a minute');
  sound.configure({...config,visible:false});await Promise.resolve();assert.equal(ctx.state,'suspended');assert.equal(schedules.size,0);
  const hiddenCount=ctx.starts.length;sound.play('win');assert.equal(ctx.starts.length,hiddenCount,'hidden tab is silent');
  sound.configure(config);await Promise.resolve();assert.equal(schedules.size,1,'visibility resumes existing unlocked context');
  sound.enabled=false;assert.equal(buses[0].gain.value,0);assert.equal(schedules.size,0);
  const mutedCount=ctx.starts.length;sound.play('combo');assert.equal(ctx.starts.length,mutedCount);
  sound.enabled=true;sound.configure({...config,music:false});assert.equal(schedules.size,0,'music off preserves effects');sound.play('play');assert.ok(ctx.starts.length>mutedCount);
  sound.dispose();await Promise.resolve();assert.equal(ctx.state,'closed');assert.equal(schedules.size,0);sound.unlock();assert.equal(Context.instances.length,1);
 }finally{sound.dispose();globalThis.AudioContext=original;globalThis.setInterval=interval;globalThis.clearInterval=clear;}
});

test('unavailable audio and invalid persisted volumes never block gameplay',()=>{
 const original=globalThis.AudioContext;globalThis.AudioContext=class{constructor(){throw Error('not supported')}};
 try{const sound=new CardSound();sound.enabled=true;assert.doesNotThrow(()=>{sound.configure({...config,effectsVolume:NaN,musicVolume:Infinity});sound.unlock();sound.play('deal');sound.dispose();});}finally{globalThis.AudioContext=original;}
});
