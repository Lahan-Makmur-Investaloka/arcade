"""Original Switch Run theme: Chase the Dawn. 150 BPM, D minor, 48 bars.
Render with Python/numpy, then encode the resulting WAV using ffmpeg.
All tones and percussion are synthesized here; no sampled recordings.
"""
import numpy as np
import wave
from pathlib import Path
SR=44100; BEAT=.4; BARS=48; LENGTH=BARS*4*BEAT; N=round(LENGTH*SR)
rng=np.random.default_rng(20260907)
mix=np.zeros((N,2),np.float32)
def add(sig,beat,amp=1,pan=0,echo=False):
    at=round(beat*BEAT*SR)
    def put(delay,g,p):
        ids=(at+round(delay*SR)+np.arange(len(sig)))%N
        mix[ids,0]+=sig*g*np.sqrt((1-p)/2)
        mix[ids,1]+=sig*g*np.sqrt((1+p)/2)
    put(0,amp,pan)
    if echo:
        put(.3,amp*.20,-pan);put(.6,amp*.09,pan)
def note(midi,dur,kind):
    t=np.arange(round(dur*SR))/SR; f=440*2**((midi-69)/12); phase=2*np.pi*f*t
    if kind=='lead':
        sig=sum(np.sin(phase*h+np.sin(2*np.pi*5*t)*.015*h)/h**1.6 for h in range(1,7))
        env=np.minimum(t/.009,1)*np.minimum((dur-t)/.055,1)*(.65+.35*np.exp(-t*9))
    elif kind=='bass':
        sig=np.sin(phase)+.32*np.sin(2*phase)+.12*np.sin(3*phase)
        env=np.minimum(t/.006,1)*np.minimum((dur-t)/.025,1)*np.exp(-t*2)
    elif kind=='pad':
        sig=(np.sin(phase)+.35*np.sin(phase*1.002)+.22*np.sin(phase*2))
        env=np.minimum(t/.13,1)*np.minimum((dur-t)/.2,1)
    else:
        sig=np.sin(phase)+.3*np.sin(phase*2)+.15*np.sin(phase*3)
        env=np.minimum(t/.003,1)*np.exp(-t*13)*np.minimum((dur-t)/.018,1)
    return (sig*np.maximum(env,0)).astype(np.float32)
def drum(kind):
    dur={'kick':.25,'snare':.18,'hat':.06,'open':.18,'crash':.8}[kind]
    t=np.arange(round(SR*dur))/SR; noise=rng.uniform(-1,1,len(t)); high=noise-np.roll(noise,1)
    if kind=='kick':return (np.sin(2*np.pi*(48*t+95*.023*(1-np.exp(-t/.023))))*np.exp(-t*19)+high*.07*np.exp(-t*160)).astype(np.float32)
    if kind=='snare':return (high*.30*np.exp(-t*24)+np.sin(2*np.pi*185*t)*.4*np.exp(-t*35)).astype(np.float32)
    return (high*np.exp(-t/ (dur/5))*.32*np.minimum(t/.001,1)).astype(np.float32)
# Dm – Bb – F – C, with a dominant A at the turnaround.
chords=[(38,[62,65,69]),(34,[62,65,70]),(41,[60,65,69]),(36,[60,64,67])]
hooks=[
 [74,None,77,76,74,None,69,72], [74,None,77,79,77,74,72,None],
 [77,None,81,79,77,None,76,74], [72,74,76,None,79,76,72,69],
 [74,77,81,None,79,77,74,None], [77,79,82,None,81,79,77,74],
 [77,None,81,84,81,79,77,76], [76,74,73,None,69,None,73,None]]
for bar in range(BARS):
    base=bar*4; root,tones=chords[bar%4]
    if bar%8==7:root,tones=33,[61,64,69]
    intro=bar<4; bridge=28<=bar<32; final=bar>=32
    for i,n in enumerate(tones):add(note(n,1.7,'pad'),base,.041,(-.65,0,.65)[i])
    for k in range(8):
        add(note(root+(12 if k in (3,7) else 0),.16,'bass'),base+k*.5,.16 if not bridge else .08)
        add(note(tones[[0,1,2,1,0,2,1,2][k]]+12,.19,'pluck'),base+k*.5+.25,.041 if intro or bridge else .027,(-1 if k%2 else 1)*.65,True)
    if not bridge:
        for k in range(4):add(drum('kick'),base+k,.38 if not intro else .26)
        for k in (1,3):add(drum('snare'),base+k,.25)
        for k in range(8):add(drum('open' if k==7 else 'hat'),base+k*.5,.11 if k%2 else .07,.25 if k%2 else -.25)
        if bar%8==7:
            for k in (3.25,3.5,3.75):add(drum('snare'),base+k,.10+(k-3)*.1,-.2)
    else:
        add(drum('kick'),base,.2)
    if bar in (4,12,20,32,40):add(drum('crash'),base,.16,.3)
    if not intro and not bridge:
        for k,n in enumerate(hooks[(bar-4)%8]):
            if n is not None:
                # Half-beat hook with longer notes at phrase openings.
                dur=.35 if k<7 and hooks[(bar-4)%8][k+1] is None else .18
                add(note(n,dur,'lead'),base+k*.5,.092 if final else .079,-.08,True)
                if final and bar%4<2:add(note(n-12,dur,'lead'),base+k*.5,.024,.2)
# Circular room reflections retain the tail across the loop boundary.
dry=mix.copy()
for delay,gain in ((.071,.10),(.113,.07),(.173,.04)):
    mix+=np.roll(dry,round(delay*SR),axis=0)[:,::-1]*gain
mix=np.tanh(mix*1.3)
mix*=.88/max(np.max(np.abs(mix)),.001)
out=Path('/tmp/switch-chase-the-dawn.wav')
with wave.open(str(out),'wb') as f:
    f.setnchannels(2);f.setsampwidth(2);f.setframerate(SR);f.writeframes((mix*32767).astype('<i2').tobytes())
print({'duration':LENGTH,'peak':float(np.max(np.abs(mix))),'rms':float(np.sqrt(np.mean(mix**2))),'seam_delta':float(np.max(np.abs(mix[0]-mix[-1]))),'wav':str(out)})
