import test from 'node:test'
import assert from 'node:assert/strict'
import { createLoadingManager } from '../src/shared/loadingManager.js'
function fixture() {
 const timers = new Map(); let id = 0
 const manager = createLoadingManager({ setTimer(fn) { timers.set(++id,fn); return id }, clearTimer(key) { timers.delete(key) } })
 return { manager, timers }
}
test('overlapping operations release exactly their own token and cleanup is idempotent',()=>{
 const {manager,timers}=fixture(),a=manager.start(),b=manager.start()
 manager.stop(a);manager.stop(a);assert.equal(manager.getSnapshot().count,1)
 manager.stop(b);assert.equal(manager.getSnapshot().count,0);assert.equal(timers.size,0)
})
test('subscribers and stable snapshots support useSyncExternalStore and StrictMode re-entry',()=>{
 const {manager}=fixture();let calls=0;const unsubscribe=manager.subscribe(()=>calls++)
 assert.equal(manager.getSnapshot(),manager.getSnapshot())
 const first=manager.start();manager.stop(first);const second=manager.start();manager.stop(second)
 assert.equal(calls,4);unsubscribe();const third=manager.start();manager.stop(third);assert.equal(calls,4)
})
test('deadline aborts the owner and always unlocks; explicit cancellation also cleans timers',()=>{
 const {manager,timers}=fixture();let aborted=0
 manager.start({onTimeout:()=>aborted++});[...timers.values()][0]()
 assert.equal(aborted,1);assert.equal(manager.getSnapshot().count,0);assert.equal(manager.getSnapshot().timeout,true)
 manager.dismissTimeout();assert.equal(manager.getSnapshot().timeout,false)
 manager.start({onCancel:()=>aborted++});manager.clear();assert.equal(aborted,2);assert.equal(timers.size,0)
})
test('progress is indeterminate unless every active operation has measurable progress',()=>{
 const {manager}=fixture(),a=manager.start(),b=manager.start({immediate:true})
 manager.progress(a,50);assert.equal(manager.getSnapshot().progress,null)
 manager.progress(b,100);assert.equal(manager.getSnapshot().progress,75);assert.equal(manager.getSnapshot().immediate,true)
 manager.stop(b);assert.equal(manager.getSnapshot().progress,50);manager.stop(a)
})
test('a throwing cancellation or timeout owner cannot strand other operations',()=>{
 const {manager,timers}=fixture()
 manager.start({onCancel:()=>{throw new Error('fixture')}});manager.start();manager.clear();assert.equal(manager.getSnapshot().count,0)
 manager.start({onTimeout:()=>{throw new Error('fixture')}});[...timers.values()][0]();assert.equal(manager.getSnapshot().count,0)
})
