export type SoundKind='select'|'deal'|'play'|'pass'|'combo'|'win'|'turn';
const hz=(midi:number)=>440*2**((midi-69)/12);
const clamp=(n:number)=>Number.isFinite(n)?Math.max(0,Math.min(1,n)):.5;
/** Original 8-bar lounge groove: no samples, external requests or autoplay. */
export class CardSound {
 private ctx:AudioContext|null=null;
 private master:GainNode|null=null;
 private fx:GainNode|null=null;
 private music:GainNode|null=null;
 private noises=new Map<number,AudioBuffer>();
 private voices=new Set<AudioScheduledSourceNode>();
 private musicVoices=new Set<AudioScheduledSourceNode>();
 private timer:ReturnType<typeof setInterval>|null=null;
 private nextBeat=0;
 private step=0;
 private unlocked=false;
 private disposed=false;
 private audible=true;
 private wantMusic=false;
 private inMatch=false;
 private soundEnabled=false;
 private effectsLevel=.65;
 private musicLevel=.28;
 get enabled(){return this.soundEnabled;}
 set enabled(on:boolean){this.soundEnabled=on;this.updateGains();this.syncMusic();}
 configure({music,effectsVolume,musicVolume,active,visible}:{music:boolean;effectsVolume:number;musicVolume:number;active:boolean;visible:boolean}){
  this.wantMusic=music;this.effectsLevel=clamp(effectsVolume);this.musicLevel=clamp(musicVolume);this.inMatch=active;this.audible=visible;
  this.updateGains();this.syncMusic();
  if(!visible){this.stopVoices(this.voices);if(this.ctx?.state==='running')void this.ctx.suspend().catch(()=>{});}
  else if(this.unlocked&&this.ctx?.state==='suspended')void this.ctx.resume().then(()=>this.syncMusic()).catch(()=>{});
 }
 unlock(){
  if(!this.enabled||this.disposed)return;
  try{
   if(!this.ctx){
    const Ctor=globalThis.AudioContext??(globalThis as unknown as {webkitAudioContext?:typeof AudioContext}).webkitAudioContext;if(!Ctor)return;
    const ctx=this.ctx=new Ctor();this.master=ctx.createGain();this.fx=ctx.createGain();this.music=ctx.createGain();
    const limiter=ctx.createDynamicsCompressor();limiter.threshold.value=-12;limiter.knee.value=12;limiter.ratio.value=5;limiter.attack.value=.004;limiter.release.value=.15;
    this.fx.connect(this.master);this.music.connect(this.master);this.master.connect(limiter);limiter.connect(ctx.destination);
    this.updateGains();
   }
   this.unlocked=true;void this.ctx.resume().then(()=>this.syncMusic()).catch(()=>{});this.syncMusic();
  }catch{/* Unsupported or denied audio never blocks a card action. */}
 }
 private gain(node:GainNode|null,value:number){if(!node||!this.ctx)return;node.gain.cancelScheduledValues(this.ctx.currentTime);node.gain.setTargetAtTime(value,this.ctx.currentTime,.025);}
 private updateGains(){this.gain(this.master,this.enabled&&this.audible ? .7 : 0);this.gain(this.fx,this.effectsLevel);this.gain(this.music,this.wantMusic?this.musicLevel:0);}
 private track(node:AudioScheduledSourceNode,music=false){
  const set=music?this.musicVoices:this.voices;set.add(node);node.onended=()=>{set.delete(node);node.disconnect();};
 }
 private stopVoices(set:Set<AudioScheduledSourceNode>){for(const n of set){try{n.stop();n.disconnect();}catch{/* Already ended. */}}set.clear();}
 private tone(frequency:number,at:number,length:number,volume:number,type:OscillatorType='sine',music=false,slide?:number){
  const ctx=this.ctx,bus=music?this.music:this.fx;if(!ctx||!bus||(this.voices.size+this.musicVoices.size)>96)return;
  const o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(frequency,at);if(slide)o.frequency.exponentialRampToValueAtTime(slide,at+length);
  g.gain.setValueAtTime(.0001,at);g.gain.exponentialRampToValueAtTime(Math.max(.001,volume),at+.006);g.gain.exponentialRampToValueAtTime(.0001,at+length);
  o.connect(g);g.connect(bus);this.track(o,music);o.onended=()=>{(music?this.musicVoices:this.voices).delete(o);o.disconnect();g.disconnect();};o.start(at);o.stop(at+length+.02);
 }
 private noise(at:number,length:number,volume:number,frequency:number,music=false){
  const ctx=this.ctx,bus=music?this.music:this.fx;if(!ctx||!bus||(this.voices.size+this.musicVoices.size)>=96)return;
  let buffer=this.noises.get(length);if(!buffer){buffer=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*length),ctx.sampleRate);const data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.pow(1-i/data.length,2.5);this.noises.set(length,buffer);}
  const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();source.buffer=buffer;filter.type='highpass';filter.frequency.value=frequency;gain.gain.value=volume;source.connect(filter);filter.connect(gain);gain.connect(bus);this.track(source,music);source.onended=()=>{(music?this.musicVoices:this.voices).delete(source);source.disconnect();filter.disconnect();gain.disconnect();};source.start(at);source.stop(at+length+.01);
 }
 play(kind:SoundKind){
  // Only explicit user gestures call unlock; remote/bot events cannot start audio.
  if(!this.enabled||!this.audible||!this.unlocked||this.effectsLevel<=0||this.ctx?.state!=='running')return;
  const t=this.ctx.currentTime;
  if(kind==='select'){this.noise(t,.045,.13,2400);this.tone(640,t,.045,.07,'sine',false,420);}
  if(kind==='pass'){this.noise(t,.09,.10,1600);this.tone(240,t,.11,.04,'sine',false,150);}
  if(kind==='turn'){this.tone(659.25,t,.11,.05);this.tone(987.77,t+.075,.14,.035);}
  if(kind==='play'){this.noise(t,.12,.3,1000);this.tone(105,t,.13,.16,'sine',false,48);}
  if(kind==='deal'){for(let i=0;i<16;i++)this.noise(t+i*.065,.045,.065,2200);}
  if(kind==='combo'){
   this.noise(t,.18,.28,900);this.tone(130,t,.21,.18,'sine',false,44);
   [52,59,62,66].forEach((n,i)=>this.tone(hz(n),t+i*.027,.28,.05,'triangle'));
  }
  if(kind==='win'){
   [64,67,71,74,76].forEach((n,i)=>this.tone(hz(n),t+i*.09,.4,.065,'triangle'));
   [40,52,59].forEach(n=>this.tone(hz(n),t+.35,.55,.07,'sine'));
  }
 }
 private syncMusic(){
  const should=this.enabled&&this.audible&&this.wantMusic&&this.musicLevel>0&&this.inMatch&&this.unlocked&&this.ctx?.state==='running';
  if(!should){if(this.timer!==null)clearInterval(this.timer);this.timer=null;this.stopVoices(this.musicVoices);return;}
  if(this.timer!==null||!this.ctx)return;
  this.nextBeat=this.ctx.currentTime+.06;this.schedule();this.timer=setInterval(()=>this.schedule(),80);
 }
 private schedule(){
  const ctx=this.ctx;if(!ctx||ctx.state!=='running')return;
  if(this.nextBeat<ctx.currentTime-.2){this.nextBeat=ctx.currentTime+.05;this.step=0;}
  const beat=60/104/2;
  while(this.nextBeat<ctx.currentTime+.16){
   const s=this.step%64,bar=Math.floor(s/8),part=s%8,t=this.nextBeat;
   const chords=[[52,55,59,62],[48,52,55,59],[45,48,52,55],[47,51,57,62]];
   const chord=chords[Math.floor(bar/2)],root=chord[0]-12;
   if(part===0||part===3||part===6)this.tone(hz(root+(part===6?7:0)),t,.18,.11,'triangle',true);
   if(part===1||part===5)chord.forEach(n=>{this.tone(hz(n+12),t,.22,.028,'sine',true);this.tone(hz(n+24),t,.1,.009,'sine',true);});
   if(part%2===0)this.noise(t,.045,.032,6200,true);
   if(part===2||part===6)this.noise(t,.09,.035,2500,true);
   if(part===0||part===4)this.tone(90,t,.11,.075,'sine',true,38);
   const melody=[[76,74,71,67],[76,74,71,67],[76,72,71,69],[75,74,69,66]];
   const note=melody[Math.floor(bar/2)][Math.floor(part/2)];if(bar%2===1&&part%2===0)this.tone(hz(note),t+.018,.18,.023,'triangle',true);
   this.step++;this.nextBeat+=beat;
  }
 }
 dispose(){this.disposed=true;this.unlocked=false;if(this.timer!==null)clearInterval(this.timer);this.timer=null;this.stopVoices(this.voices);this.stopVoices(this.musicVoices);void this.ctx?.close().catch(()=>{});this.ctx=null;this.noises.clear();}
}
