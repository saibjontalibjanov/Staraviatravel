import test from 'node:test'
import assert from 'node:assert/strict'
import { createInitialLoadingState } from '../src/lib/initialLoading.js'
test('initial page stays pending until every independent resource settles',()=>{
 const state=createInitialLoadingState(),finished=[];const unsubscribe=state.subscribe(()=>finished.push(state.count()))
 const fonts=state.begin(),video=state.begin(),data=state.begin();assert.equal(state.count(),3)
 fonts();data();assert.equal(state.count(),1);video();assert.equal(state.count(),0)
 assert.deepEqual(finished,[1,2,3,2,1,0]);unsubscribe()
})
test('repeated cleanup and timed-out resources never leave a negative counter',()=>{
 const state=createInitialLoadingState(),done=state.begin();done();done();assert.equal(state.count(),0)
 const slow=state.begin();state.finish();slow();assert.equal(state.count(),0)
})
test('background requests never bring the full-page loader back after initial reveal',()=>{
 const state=createInitialLoadingState();state.finish();const background=state.begin();assert.equal(state.count(),0);background();assert.equal(state.count(),0)
})
