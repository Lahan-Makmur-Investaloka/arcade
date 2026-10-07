// Small synthesized interaction sounds. No downloaded audio or background autoplay.
export class WorkshopSound {
  private context:AudioContext|null=null;
  private voices=new Set<OscillatorNode>();
  enabled=false;
  async unlock(){if(!this.enabled)return;try{this.context??=new AudioContext();if(this.context.state==='suspended')await this.context.resume();}catch{/* Sound is optional. */}}
  private tone(frequency:number,length:number,volume:number,type:OscillatorType='sine',delay=0,end?:number){
    const ctx=this.context;if(!this.enabled||!ctx||ctx.state!=='running')return;
    const start=ctx.currentTime+delay,osc=ctx.createOscillator(),gain=ctx.createGain();osc.type=type;osc.frequency.setValueAtTime(frequency,start);if(end)osc.frequency.exponentialRampToValueAtTime(end,start+length);
    gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(volume,start+.012);gain.gain.exponentialRampToValueAtTime(.0001,start+length);osc.connect(gain);gain.connect(ctx.destination);osc.start(start);osc.stop(start+length+.025);this.voices.add(osc);osc.onended=()=>{this.voices.delete(osc);osc.disconnect();gain.disconnect();};
  }
  turn(){this.tone(440,.045,.022,'triangle',0,150);this.tone(1600,.028,.009,'sine');}
  charge(){this.tone(90,.65,.035,'sine',0,380);this.tone(180,.6,.012,'triangle',.03,760);}
  step(n:number){this.tone(220+n*16,.11,.011,'sine');}
  success(){[392,494,587,784].forEach((f,i)=>this.tone(f,.65,.035,'sine',i*.12));}
  fail(){this.tone(180,.2,.025,'triangle',0,100);}
  stop(){this.voices.forEach(v=>{try{v.stop();}catch{}});this.voices.clear();}
  dispose(){this.stop();void this.context?.close().catch(()=>{});this.context=null;}
}
