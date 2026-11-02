import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { highHeroSection, kiranaBossSteps } from '../app/switch-run/hero-terrain.ts';

test('high routes need Eldric and remain reachable during snow slowdown', () => {
  for (const dt of [1/120, 1/60, .033]) {
    for (const jump of [625, 820]) {
      let y=0, vy=-jump, peak=0;
      while(vy<0){vy+=1750*dt;y+=vy*dt;peak=Math.max(peak,-y);}
      assert.equal(peak>=150,jump===820);
    }
    // Run-up at the slowest World 3 speed, then jump near its edge.
    let x=280, y=458, vy=-820, landed=false;
    for(let t=0;t<1;t+=dt){const oldY=y;vy+=1750*dt;x+=275*.75*dt;y+=vy*dt;
      if(vy>=0&&oldY<=308+8&&y>=308&&x+43>360&&x<720){landed=true;break;}}
    assert.ok(landed);
  }
  for(const astral of [false,true])for(const floor of [310,330,458]){
    const s=highHeroSection(42000,floor,astral);
    assert.equal(s.platforms[1].y,floor-150);
    assert.equal(s.platforms[0].w,320);
    assert.equal(s.platforms[2].y,floor);
    assert.equal(s.end,s.platforms[2].x+s.platforms[2].w);
  }
});

test('each boss gets four upper Kirana-only steps inside its arena',()=>{
  for(const left of [18700,38700,58700,78700,98700]){
    const steps=kiranaBossSteps(left,458);
    assert.equal(steps.length,4);
    for(const p of steps){assert.equal(p.require,'kirana');assert.ok(p.x>=left&&p.x+p.w<left+1280);assert.ok(p.y<288);}
    assert.equal(steps[0].y-steps[1].y,55);
  }
});

test('contact no longer has a Timmy passive guard; active skill is retained',()=>{
  const source=readFileSync(new URL('../app/tekad-game.tsx',import.meta.url),'utf8');
  assert.ok(!source.includes('active === "timmy" && player.guard <= 0'));
  assert.ok(source.includes('if (touchingEnemy && player.invuln <= 0)'));
  assert.ok(source.includes('player.phaseGuard = 2.5; player.invuln = Math.max(player.invuln, 2.5)'));
  assert.equal((source.match(/platforms.push\(\.\.\.kiranaBossSteps/g)||[]).length,4); // shared late-world branch handles two bosses
});
