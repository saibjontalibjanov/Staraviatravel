import test from 'node:test'
import assert from 'node:assert/strict'
import { anonymousId, canTrack, publicPages, visitorId } from '../src/lib/visitors.js'
test('analytics respects consent and browser privacy controls',()=>{
 assert(!canTrack(null,null,false));assert(!canTrack('rejected',null,false));assert(!canTrack('accepted','1',false));assert(!canTrack('accepted',null,true));assert(canTrack('accepted',null,false));assert(!publicPages.includes('/checkout/private-token'));assert(!publicPages.includes('/office/'))
})
test('anonymous visitor ID is stable and invalid storage is repaired',()=>{
 const values=new Map(),storage={getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value)}
 const id=visitorId(storage);assert.match(id,/^[0-9a-f-]{36}$/);assert.equal(visitorId(storage),id);storage.setItem('staravia_visitor_id','bad');assert.notEqual(visitorId(storage),id)
 const unavailable={getItem(){throw Error('blocked')}};assert.equal(visitorId(unavailable),visitorId(unavailable))
})

test('anonymous ID still works on local HTTP browsers without randomUUID',()=>{
 const cryptoOriginal=globalThis.crypto
 try{Object.defineProperty(globalThis,'crypto',{configurable:true,value:{getRandomValues:array=>cryptoOriginal.getRandomValues(array)}});assert.match(anonymousId(),/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)}
 finally{Object.defineProperty(globalThis,'crypto',{configurable:true,value:cryptoOriginal})}
})
