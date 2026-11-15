// Run only against the isolated fixtures created by browser_smoke_setup.py.
import assert from 'node:assert/strict'
import { readFile, mkdir } from 'node:fs/promises'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const backend = process.env.CRM_SMOKE_URL || 'http://127.0.0.1:8000'
const website = process.env.PUBLIC_SMOKE_URL || 'http://127.0.0.1:3000'
for (const url of [backend, website]) assert.ok(['127.0.0.1','localhost'].includes(new URL(url).hostname), 'Smoke tests must use loopback fixtures')
const fixture = JSON.parse(await readFile(new URL('../django-backend/.test-data/browser-fixture.json', import.meta.url)))
const output = new URL('../django-backend/.test-data/browser-results/', import.meta.url).pathname
await mkdir(output, { recursive:true })
const browser = await chromium.launch({headless:true, ...(process.env.CHROMIUM_PATH ? {executablePath:process.env.CHROMIUM_PATH}: {})})
const errors=[]
const context = await browser.newContext({ viewport:{width:1440,height:1000} })
const page = await context.newPage()
page.on('pageerror', error=>errors.push(error.message))
// Public production build uses the real cms URL. Forward public reads to the
// isolated Django server; this verifies browser URL resolution, not live hosting.
await context.route('https://cms.staraviatravel.com/api/**', async route=>{
 const url=new URL(route.request().url())
 assert.ok(['GET','HEAD'].includes(route.request().method()), 'No remote writes allowed in smoke test')
 const result=await context.request.get(`${backend}${url.pathname}${url.search}`)
 await route.fulfill({response:result,headers:{...result.headers(),'access-control-allow-origin':'*'}})
})
// No third-party requests are needed to validate local workflows.
await context.route(/https?:\/\/(?!127\.0\.0\.1|localhost|cms\.staraviatravel\.com)/, route=>route.abort())
async function login(username){
 await page.goto(`${backend}/`)
 await page.locator('[name=username]').fill(username)
 await page.locator('[name=password]').fill(fixture.password)
 await Promise.all([page.waitForURL(`${backend}/`),page.getByRole('button',{name:'Sign in',exact:false}).click()])
 await page.locator('.workspace-main').waitFor()
}
async function noOverflow(label){
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1), `${label}: document overflows viewport`)
}
try {
 await login(fixture.username)
 const sections=['dashboard','leads','calls','tickets','visitors','partners','offers','testimonials','faqs','telegram','subscribers','bookings','searches','team','settings','audit','account']
 for (const width of [1440,390]) {
  await page.setViewportSize({width,height:1000})
  for (const section of sections) {
   const response=await page.goto(`${backend}/?section=${section}`)
   assert.equal(response.status(),200,section)
   await noOverflow(`${section}/${width}`)
   assert.equal(await page.locator('.nav-item[aria-current=page]').count(),1)
  }
  await page.evaluate(()=>window.scrollTo(0,0))
  await page.screenshot({path:`${output}account-${width}.png`,fullPage:true,animations:'disabled'})
 }
 await page.getByRole('button',{name:'Open navigation',exact:true}).click()
 assert.equal(await page.locator('[data-menu]').getAttribute('aria-expanded'),'true')
 await page.waitForFunction(()=>document.querySelector('.sidebar').getBoundingClientRect().left>=-.5)
 await page.keyboard.press('Escape')
 assert.equal(await page.locator('[data-menu]').getAttribute('aria-expanded'),'false')
 await page.setViewportSize({width:1440,height:1000})
 await page.goto(`${backend}/?section=account`)
 for (const theme of ['emerald','ivory-gold','graphite','ocean','lavender']) {
  await page.locator(`[data-theme-choice="${theme}"]`).click()
  assert.equal(await page.locator('html').getAttribute('data-theme'),theme)
  await noOverflow(`theme ${theme}`)
 }
 await page.locator('[data-theme-choice=emerald]').click()
 await page.goto(`${backend}/?section=dashboard`)
 await page.locator('[data-collapse]').click()
 assert.ok(await page.locator('body').evaluate(element=>element.classList.contains('sidebar-collapsed')))
 await page.locator('[data-collapse]').click()
 await page.waitForFunction(()=>Math.abs(document.querySelector('.workspace-body').getBoundingClientRect().left-252)<.5)
 await page.screenshot({path:`${output}dashboard.png`,fullPage:true})
 await page.goto(`${backend}/?section=partners`)
 await page.locator('.logo-preview img').first().waitFor()
 await page.waitForFunction(()=>[...document.querySelectorAll('.logo-preview img')].every(image=>image.complete&&image.naturalWidth>0))
 assert.ok(await page.getByText('Browser partner fixture 3',{exact:true}).count()) // draft preview
 await page.screenshot({path:`${output}partners.png`,fullPage:true})
 // Validate a real CSRF-protected multipart upload and subsequent publication.
 await page.getByRole('link',{name:'Add partner',exact:false}).click()
 await page.locator('[name=name]').fill('Browser uploaded fixture')
 await page.locator('[name=logo]').setInputFiles(new URL('../django-backend/.test-data/media/partners/fixture-0.png',import.meta.url).pathname)
 await page.locator('[name=position]').fill('9')
 await page.locator('[name=published]').check()
 await Promise.all([page.waitForURL(`${backend}/?section=partners`),page.getByRole('button',{name:'Save changes',exact:true}).click()])
 assert.ok(await page.getByText('Browser uploaded fixture',{exact:true}).count())
 await page.goto(`${backend}/?section=leads`)
 await page.locator('.stage-form select').first().selectOption('contacted')
 await Promise.all([page.waitForURL(`${backend}/?section=leads&view=kanban`),page.locator('.stage-form button').first().click()])
 assert.ok(await page.locator('.pipeline-column').nth(1).getByText('Browser Fixture',{exact:false}).count())
 await page.screenshot({path:`${output}leads-board.png`,fullPage:true,animations:'disabled'})
 await page.getByRole('link',{name:'Table',exact:false}).click()
 await page.locator('.table-scroll').waitFor()
 await page.goto(`${backend}/?section=leads&lead=${fixture.leadId}`)
 for (const [button,dialog] of [['All Client Records','client-dialog'],['Passenger Details','passenger-dialog'],['Ticket Search','ticket-dialog']]) {
  await page.locator(`[data-dialog-open="${dialog}"]`).first().click()
  assert.ok(await page.locator(`#${dialog}`).evaluate(element=>element.open))
  await page.keyboard.press('Escape')
 }
 await page.locator('[data-dialog-open=passenger-dialog]').first().click()
 await page.locator('#passport-form .passport-row input').first().waitFor()
 await page.getByLabel('Given names',{exact:true}).fill('BROWSER')
 await page.getByLabel('Surname',{exact:true}).fill('FIXTURE')
 await page.getByLabel('Passport number',{exact:true}).fill('AA9876543')
 await page.getByLabel('Date of birth',{exact:true}).fill('1990-01-01')
 await page.getByLabel('Passport expiry',{exact:true}).fill('2035-01-01')
 await page.getByLabel('Nationality',{exact:true}).fill('Uzbekistan')
 await page.getByRole('button',{name:'Save passport details',exact:true}).click()
 await page.getByText('Passport details saved.',{exact:false}).waitFor()
 await page.keyboard.press('Escape')
 await page.screenshot({path:`${output}client.png`,fullPage:true})
 // Agents can read partner cards and previews, but not edit or administer users.
 await page.locator('button[aria-label="Sign out"]').click()
 await login(fixture.agent)
 await page.goto(`${backend}/?section=partners`)
 assert.equal(await page.getByRole('link',{name:'Add partner',exact:false}).count(),0)
 assert.equal((await context.request.get(`${backend}/?section=team`)).status(),403)
 await context.clearCookies()
 for (const path of ['/', '/about-us']) {
  await page.goto(`${website}${path}`)
  const strip=page.locator('.partners-section')
  await strip.waitFor()
  await strip.scrollIntoViewIfNeeded()
  await page.waitForFunction(()=>[...document.querySelectorAll('.partners-group:first-child .partner-logo img')].slice(0,4).every(image=>image.complete&&image.naturalWidth>0))
  await strip.locator('.partners-heading button').click()
  const image=strip.locator('img').nth(1)
  assert.ok((await image.getAttribute('src')).startsWith('https://cms.staraviatravel.com/api/partners/'))
  assert.equal(await image.evaluate(element=>getComputedStyle(element).filter),'grayscale(1)')
  await strip.locator('.partner-logo').nth(1).hover()
  await page.waitForTimeout(300)
  assert.equal(await image.evaluate(element=>getComputedStyle(element).filter),'grayscale(0)')
  assert.equal(await strip.getByAltText('Browser partner fixture 3',{exact:true}).count(),0)
  await strip.locator('.partners-heading button').click()
  await page.mouse.move(0,0)
  const track=strip.locator('.partners-track')
  const before=await track.evaluate(element=>getComputedStyle(element).transform)
  await page.waitForTimeout(200)
  const after=await track.evaluate(element=>getComputedStyle(element).transform)
  assert.notEqual(before,after,'Partner strip should scroll')
  await page.setViewportSize({width:390,height:844})
  await noOverflow(`public ${path} mobile`)
  await page.emulateMedia({reducedMotion:'reduce'})
  assert.equal(await track.evaluate(element=>getComputedStyle(element).animationName),'none')
  await page.screenshot({path:`${output}public-${path==='/'?'home':'about'}-mobile.png`,fullPage:false})
  await page.emulateMedia({reducedMotion:'no-preference'})
  await page.setViewportSize({width:1440,height:1000})
 }
 assert.deepEqual(errors,[],'Browser JavaScript errors')
 console.log('PASS: 17 CRM sections at desktop/mobile, five themes, navigation, upload, draft preview, role restrictions, pipeline updates, passport saving, client dialogs, and both public logo strips (production bundle; local API fixtures).')
} finally { await browser.close() }
