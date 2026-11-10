// Django is deployed independently of the Vite source tree on cPanel.
// Mirror the canonical shared implementation, rather than maintaining two loaders.
import { mkdirSync, copyFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
const source = new URL('../src/shared/',import.meta.url)
const target = new URL('../django-backend/travel/static/shared/',import.meta.url)
mkdirSync(fileURLToPath(target),{recursive:true})
for(const name of ['loadingManager.js','loaderLock.js','globe.js','globe.css']) copyFileSync(new URL(name,source),new URL(name,target))
