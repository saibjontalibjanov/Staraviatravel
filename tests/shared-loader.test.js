import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
test('standalone Django deployment carries the same generated loader core and animation',()=>{
 for(const name of ['loadingManager.js','loaderLock.js','globe.js','globe.css']) assert.equal(readFileSync(new URL('../src/shared/'+name,import.meta.url),'utf8'),readFileSync(new URL('../django-backend/travel/static/shared/'+name,import.meta.url),'utf8'),name)
})
