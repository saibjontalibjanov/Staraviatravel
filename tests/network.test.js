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

test('blocking metadata stays out of fetch and concurrent request bodies keep independent tokens',async()=>{
 const {loadingManager}=await import('../src/shared/loadingManager.js')
 const original=globalThis.fetch;const releases=[]
 globalThis.fetch=(_url,options)=>{assert.equal('blockingLoader' in options,false);return new Promise(resolve=>releases.push(()=>resolve(new Response('{}'))))}
 try{
  const a=fetchWithTimeout('/a',{blockingLoader:true}),b=fetchWithTimeout('/b',{blockingLoader:true})
  assert.equal(loadingManager.getSnapshot().count,2)
  releases[0]();await a;assert.equal(loadingManager.getSnapshot().count,1)
  releases[1]();await b;assert.equal(loadingManager.getSnapshot().count,0)
 }finally{globalThis.fetch=original;loadingManager.clear()}
})
test('nonblocking background requests and null-body HTTP statuses do not lock or break the API client',async()=>{
 const {loadingManager}=await import('../src/shared/loadingManager.js'),original=globalThis.fetch
 globalThis.fetch=async()=>new Response(null,{status:204})
 try{const response=await fetchWithTimeout('/background');assert.equal(response.status,204);assert.equal(loadingManager.getSnapshot().count,0)}finally{globalThis.fetch=original}
})

test('HTTP failures, offline errors, cancellation and deadlines always release blocking requests',async()=>{
 const {loadingManager}=await import('../src/shared/loadingManager.js'),original=globalThis.fetch
 try{
  for(const status of [400,401,403,404,500]){
   globalThis.fetch=async()=>new Response('{"error":"fixture"}',{status})
   const result=await fetchWithTimeout('/failure',{blockingLoader:true})
   assert.equal(result.status,status);assert.equal(loadingManager.getSnapshot().count,0)
  }
  globalThis.fetch=async()=>{throw new TypeError('Offline fixture')}
  await assert.rejects(fetchWithTimeout('/offline',{blockingLoader:true}));assert.equal(loadingManager.getSnapshot().count,0)
  globalThis.fetch=(_url,{signal})=>new Promise((resolve,reject)=>{if(signal.aborted)reject(signal.reason);else signal.addEventListener('abort',()=>reject(signal.reason),{once:true})})
  await assert.rejects(fetchWithTimeout('/timeout',{blockingLoader:true,timeoutMs:10}),error=>error.name==='TimeoutError')
  assert.equal(loadingManager.getSnapshot().count,0)
  const controller=new AbortController(),pending=fetchWithTimeout('/cancel',{blockingLoader:true,signal:controller.signal});controller.abort();await assert.rejects(pending);assert.equal(loadingManager.getSnapshot().count,0)
 }finally{globalThis.fetch=original;loadingManager.clear()}
})
