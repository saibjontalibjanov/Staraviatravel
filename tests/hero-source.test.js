import test from 'node:test'
import assert from 'node:assert/strict'
import { heroVideoSource } from '../src/lib/heroVideo.js'
test('normal connections receive higher quality desktop and mobile videos',()=>{
 assert.equal(heroVideoSource({downlink:10}),'/media/hero-desktop-v2.mp4')
 assert.equal(heroVideoSource({mobile:true,downlink:10}),'/media/hero-mobile-v2.mp4')
})
test('slow and restricted connections retain a lighter video or poster',()=>{
 assert.equal(heroVideoSource({downlink:1}),'/media/hero-desktop-v1.mp4')
 assert.equal(heroVideoSource({mobile:true,effectiveType:'3g'}),'/media/hero-mobile-v1.mp4')
 assert.equal(heroVideoSource({saveData:true}),null)
 assert.equal(heroVideoSource({reducedMotion:true}),null)
 assert.equal(heroVideoSource({effectiveType:'2g'}),null)
})
