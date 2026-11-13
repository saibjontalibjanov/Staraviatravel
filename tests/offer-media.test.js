import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeOffer, offerBackground } from '../src/lib/offers.js'
const resolve = value => value.startsWith('/') ? `https://cms.staraviatravel.com${value}` : value
test('CRM card and background images are resolved separately against the backend origin',()=>{
 const offer=normalizeOffer({id:7,image:{url:'/api/hot-flights/7/image?v=1'},background:{url:'/api/hot-flights/7/background?v=1'}},resolve)
 assert.equal(offer.image,'https://cms.staraviatravel.com/api/hot-flights/7/image?v=1')
 assert.equal(offerBackground(offer),'https://cms.staraviatravel.com/api/hot-flights/7/background?v=1')
})
test('imported media shapes and no-background fallback preserve existing offers',()=>{
 const offer=normalizeOffer({id:2,attributes:{title:'Imported',image:{data:{attributes:{url:'/uploads/card.png'}}},background:'https://images.example/background.jpg'}},resolve)
 assert.equal(normalizeOffer({id:5,background:'/uploads/background.png'},resolve).image,'https://cms.staraviatravel.com/uploads/background.png')
 assert.equal(offer.title,'Imported');assert.equal(offerBackground(offer),'https://images.example/background.jpg')
 assert.equal(offerBackground(normalizeOffer({id:3,image:'/uploads/card.png'},resolve)),'https://cms.staraviatravel.com/uploads/card.png')
 assert.equal(offerBackground(normalizeOffer({id:4},resolve),'fallback'),'fallback')
})
