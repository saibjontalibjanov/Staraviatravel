import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, statSync, existsSync } from 'node:fs'
function boxes(buffer, start=0, end=buffer.length) {
  const result=[]
  while(start+8<=end){let size=buffer.readUInt32BE(start),header=8;const type=buffer.toString('ascii',start+4,start+8);if(size===1){size=Number(buffer.readBigUInt64BE(start+8));header=16}if(size===0)size=end-start;if(size<header||start+size>end)throw new Error('Invalid MP4 atom');result.push({type,start,end:start+size,payload:start+header});start+=size}
  return result
}
test('published hero videos have streaming metadata first, no audio, and bounded sizes',()=>{
  for(const [name,limit] of [['hero-desktop-v1.mp4',12*1024*1024],['hero-mobile-v1.mp4',5*1024*1024]]){
    const file='public/media/'+name;assert(statSync(file).size<limit,name+' exceeds transfer budget')
    const buffer=readFileSync(file),top=boxes(buffer),moov=top.find(box=>box.type==='moov'),mdat=top.find(box=>box.type==='mdat');assert(moov&&mdat);assert(moov.start<mdat.start,name+' must start playing before the full file downloads')
    const tracks=boxes(buffer,moov.payload,moov.end).filter(box=>box.type==='trak');assert.equal(tracks.length,1,'decorative video must not contain unused audio')
    for(const track of tracks){const mdia=boxes(buffer,track.payload,track.end).find(box=>box.type==='mdia');const handler=boxes(buffer,mdia.payload,mdia.end).find(box=>box.type==='hdlr');assert.equal(buffer.toString('ascii',handler.payload+8,handler.payload+12),'vide')}
  }
  assert(statSync('public/media/hero-poster-v1.webp').size<80*1024)
  assert(!existsSync('public/Cover800x312_darken_3mb.mp4'),'the original master must not be copied into the public deployment')
})
