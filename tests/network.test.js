import test from 'node:test'
import assert from 'node:assert/strict'
import { fetchWithTimeout } from '../src/lib/network.js'
test('stalled API calls time out and retain a usable retry path',async()=>{
 const original=globalThis.fetch
 globalThis.fetch=(_url,{signal})=>new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(signal.reason),{once:true}))
 try{await assert.rejects(fetchWithTimeout('/api/flights',{timeoutMs:10}),error=>error.name==='TimeoutError')}
 finally{globalThis.fetch=original}
})
test('caller abort signals still cancel the bounded request',async()=>{
 const original=globalThis.fetch,controller=new AbortController()
 globalThis.fetch=(_url,{signal})=>new Promise((resolve,reject)=>{if(signal.aborted)reject(signal.reason);else signal.addEventListener('abort',()=>reject(signal.reason),{once:true})})
 try{const pending=fetchWithTimeout('/api/airports',{signal:controller.signal});controller.abort();await assert.rejects(pending,error=>error.name==='AbortError')}
 finally{globalThis.fetch=original}
})
test('a stalled response body is bounded and completed JSON remains readable',async()=>{
 const original=globalThis.fetch
 try{
  globalThis.fetch=async()=>new Response(JSON.stringify({ok:true}),{headers:{'Content-Type':'application/json'}})
  assert.deepEqual(await(await fetchWithTimeout('/api/example')).json(),{ok:true})
  globalThis.fetch=async(_url,{signal})=>new Response(new ReadableStream({start(controller){signal.addEventListener('abort',()=>controller.error(signal.reason),{once:true})}}))
  await assert.rejects(fetchWithTimeout('/api/example',{timeoutMs:10}),error=>error.name==='TimeoutError')
 }finally{globalThis.fetch=original}
})
