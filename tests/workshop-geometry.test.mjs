import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdir} from 'node:fs/promises';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import sharp from 'sharp';
const root=new URL('../',import.meta.url);
const output=new URL('.sites-runtime/qa/tile-geometry.mjs',root);
await mkdir(new URL('.sites-runtime/qa/',root),{recursive:true});
await build({entryPoints:[new URL('app/eldrics-workshop/circuit-tile.tsx',root).pathname],outfile:output.pathname,bundle:true,format:'esm',platform:'node',jsx:'automatic',external:['react','react/jsx-runtime']});
const {default:Tile}=await import(output.href);
const rotate=m=>((m<<1)&15)|(m>>3);
const style='<style>.ws-conduit path{fill:none}.ws-pipe-shadow,.ws-pipe-shell,.ws-pipe-groove,.ws-pipe-glass{stroke:none}.ws-pipe-energy{fill:none;stroke:#00ffff;stroke-width:8}.ws-contact,.ws-terminal,.ws-tile-dots,.ws-junction{display:none}</style>';
test('Rendered SVG ports stay centered at phone and desktop sizes after every rotation',async()=>{
 for(const size of [44,96,240])for(let base=1;base<16;base++)for(let turn=0;turn<4;turn++){
  const rotation=turn+4;let mask=base;for(let t=0;t<turn;t++)mask=rotate(mask);
  const level={size:1,source:0,targets:[],tiles:[{mask:base,kind:'wire',fixed:false}]};
  const markup=renderToStaticMarkup(React.createElement(Tile,{level,index:0,rotation,mask,lit:true,leak:false,disabled:false,onTurn(){},guide:false,entry:-1}));
  assert.ok(markup.includes(`transform="rotate(${rotation*90} 50 50)"`));
  assert.ok(!markup.includes('style="transform:'));
  const svg=markup.match(/<svg[\s\S]*?<\/svg>/)[0].replace('<svg ',`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" `).replace('</svg>',style+'</svg>');
  const {data,info}=await sharp(Buffer.from(svg)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const mid=Math.floor(size/2),points=[[mid,1],[size-2,mid],[mid,size-2],[1,mid]];
  points.forEach(([x,y],direction)=>{const at=(y*info.width+x)*4;const cyan=data[at]<90&&data[at+1]>180&&data[at+2]>180&&data[at+3]>160;assert.equal(cyan,!!(mask&(1<<direction)),`size ${size}, mask ${base}, rotation ${rotation}, direction ${direction}`);});
 }
});
