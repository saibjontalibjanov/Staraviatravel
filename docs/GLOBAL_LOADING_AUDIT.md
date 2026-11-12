# Global loader, call center and repository audit

Date: 2026-11-10 (client timezone: Asia/Tashkent). Changes are local/repository work; no production deployment or live database mutation.

## Implemented architecture

The old initial-only counter and separate search animation were removed. `src/shared/loadingManager.js` is the canonical token-based manager for the public React app and server-rendered Django CRM. Each qualifying request owns one unique token. Completing, cancelling, timing out or cleaning up one token cannot complete another request. Snapshots are stable for React `useSyncExternalStore`; subscriptions, owner callbacks and timers are cleaned up. A manual owner timeout unlocks and shows a recovery notice instead of claiming success. Measurable progress can be supplied through `progress(token, value)`; otherwise the gold bar is indeterminate, with no invented percentages.

`WebsiteLoader` renders through a portal into `document.body`. A native modal dialog puts the overlay in the browser's top layer, above existing native CRM dialogs as well as ordinary popup elements. `inert` and `aria-busy` block underlying application interaction; scroll styles, previous inert/busy attributes and appropriate focus targets are restored. There are no permanent document keyboard blockers. Escape cannot dismiss active work. Fast ordinary operations have a 180 ms visibility delay; initial bootstrap can appear immediately. All work finishing triggers a short 220 ms fade, then DOM removal. New work during fade cancels dismissal without losing the original lock state.

The original globe-reference HTML was not provided. After the user's explicit instruction to build it from the prompt, a lightweight original CSS/SVG animation was created: rotating meridians, navy globe, gold plane in a continuous tilted orbit with front/back depth, white background and gold progress. The nose follows the orbital tangent. No WebGL, external image/animation service or new runtime dependency is used. Reduced motion provides a static globe/plane and non-animated indicator. This is not claimed to be a pixel-identical port of an unavailable file.

The initial loader no longer waits for video, optional fonts, lazy images, analytics or autocomplete. The existing sharp adaptive videos and poster behavior remain intact. `AppErrorBoundary` aborts owned work/unlocks on render failure, and a separate external boot-recovery script gives a retry link if the main module cannot initialize at all.

## Operations integrated

| Area | Behavior |
|---|---|
| Bootstrap | Immediate short initialization token; critical requests own their own deadlines |
| Home hot offers / Business Class offers | Blocking data request, including route-driven selected offer changes and retry |
| Flight search results | Blocking availability request; 45-second bound, abort on unmount/navigation |
| Lead / callback / booking applications | Blocking save, existing duplicate-click guard, abort cleanup, no automatic retry |
| Private checkout | Blocking private booking load and billing save; existing payment controls remain disabled |
| Testimonial submission | Blocking explicit save with cancellation cleanup; reading reviews stays local |
| Django CRM | Critical JS API POST/PUT mutations/searches, native form submission, same-origin workspace navigation |
| Optional/background work | FAQ/review/partner reads, newsletter, airport autocomplete, analytics, video and polling retain local/background behavior |

No hotel, registration or active payment processor exists in this source; none was invented or reintroduced. Existing Django staff login/password/account flows keep session/CSRF protection. Native form navigation remains a normal browser POST; the loader does not change the payload, add retries or assert that a timed-out write was not saved. CRM timeout notices tell staff to check the record before resubmitting.

## Existing API architecture and fixes

The application uses Fetch through `apiFetch`/`fetchWithTimeout`; no Axios/Query migration was introduced. Explicit `blockingLoader: true` metadata is removed before calling Fetch. Background requests do not acquire tokens. Existing request abort signals are retained, and deadlines cover response-body download, not just headers.

The old client buffered `response.clone().arrayBuffer()`, retaining a tee and potentially two body copies. The new code buffers once and returns a readable Response, preserving status/statusText/headers, including null-body statuses 204/205/304. HTTP status failures remain failures for callers to display. This client is for JSON application APIs, not streaming media.

Hot offer effects now abort when unmounted instead of updating a departed page. Business Class clears stale offers on retry/selection change and shows an actionable error instead of silently retaining a previous offer after failure. Lead/review submissions also have owner cancellation cleanup. The CRM API wrapper rejects a malformed successful JSON response rather than allowing an empty result to be treated as a successful save.

## Django deployment packaging

Django is deployed separately from the Vite source tree on the existing hosting. `scripts/sync-loader-assets.mjs` mirrors the four canonical shared files into `django-backend/travel/static/shared/`; these generated copies are committed so a backend-only deployment remains self-contained. `npm run build` runs the sync through `prebuild`; `tests/shared-loader.test.js` prevents drift. This is one implementation with generated delivery copies, not two independent loading systems. The normal `collectstatic` procedure includes the files without changing static directory/proxy configuration.

## Call center and QR

All public call-center surfaces now use `src/lib/contact.js`:

- Updated on 2026-11-11: number **+998910235737**, display **+998 91 023 57 37**.
- Telephone: `tel:+998910235737`.
- Existing WhatsApp links: `https://wa.me/998910235737` (this changes the destination, not a claim that the number has an active WhatsApp account).
- Navbar/mobile menu, TopBar, footer, homepage contact section and callback popup are updated.
- QR PNG/SVG: `public/pictures/popup-pictures/call-center-qr-v4.{png,svg}`. Payload: **`tel:+998910235737`**.

QR generation/independent decoding used temporary tooling outside the project. No QR library is needed at runtime or added to project dependencies. An independent decoder read both the PNG and a screenshot of the QR at its actual 96 px popup size. The versioned filename prevents stale cached QR images. Generic billing country-code selectors and sample customer phone placeholders were not changed into company contact details.

## Validation

- **38 frontend tests passed**: concurrent token ownership, safe duplicate cleanup, stable snapshots/StrictMode-like start-stop-start, cancellation/timeout callbacks, real/indeterminate progress, error callbacks, shared delivery copies, HTTP 400/401/403/404/500, offline/cancel/deadline cleanup, body timeouts and null-body responses, plus existing booking/i18n/search tests.
- **72 Django tests passed** across authentication/CSRF/CORS, permissions, private checkout, lead/passport/content contracts, flight/Telegram mocks, database audit and migration/import behavior.
- `makemigrations --check --dry-run`: no changes. No schema or business-record migration is introduced.
- Read-only `audit_database --json` against a new isolated SQLite fixture DB: healthy connection/integrity, zero foreign-key violations, no missing tables/columns/pending migrations. This does not describe the live database.
- The existing **workspace-local** `django-backend/data/db.sqlite3` was also audited. It initially lacked the three tables from existing migration `0005_partner_websitevisitor_websitepageview`. A new private SQLite backup was verified for integrity and matching per-table row counts, then only that known local file received migration 0005. The follow-up audit was healthy (no missing tables/columns, pending migrations or foreign-key violations). Backup: `/tmp/staravia-global-audit/pre-existing-local-db-before-0005.sqlite3`. This local database is ignored by Git; no remote/live database was contacted. Laptop/hosting databases are not updated by pulling Git.
- `collectstatic` against an isolated destination: successful, including all shared loader modules/CSS. The backend remains independently deployable.
- Production Vite build: passed (93 modules, approximately 432 KB JS / 136 KB gzip). No lint or TypeScript script is configured; no lint/type-check pass is invented. Modified standalone JS modules also passed syntax checks.
- Chromium desktop/compact-laptop and mobile: initial critical request gating, exact full-viewport coverage under 80% laptop zoom, search navigation, Escape/background interaction blocking, HTTP 500 recovery, true React StrictMode dev mounting, overlapping requests, fast-request suppression, timeout recovery, previous overflow/inert and focus restoration.
- Additional browser checks: browser back/unmount cancellation, missing-main-module recovery, forced React render error boundary, call-center links and QR. Public APIs/fonts used controlled fixtures; no live provider calls or real applications were submitted.
- CRM browser checks used a disposable local database/user: real CSRF login/session, native submit-event acquisition, original native modal top layer, fade re-entry, shared static modules and genuine search API error recovery with provider credentials empty. No outbound notifications were sent.

Browser checks used Chromium; Safari/Firefox/Edge and real hosting/network behavior are not certified here. The implementation uses native dialog/inert supported by current browsers; older browsers may require a separately reviewed compatibility layer. Automated/repository audits cannot establish that every possible production defect is absent.

## Deployment and review

1. Review the commit and existing [Namecheap deployment runbook](NAMECHEAP_DEPLOYMENT.md). No deployment was performed.
2. Pull the reviewed branch, run `npm ci`, `npm test`, and `npm run build`; deploy the reviewed `dist/` contents through the existing process. Include `boot-recovery.js` and both versioned QR assets; preserve hosting `.htaccess` and media.
3. Deploy the changed Django templates/static files and run the normal `python manage.py collectstatic --noinput` and approved restart procedure. Keep existing `.env`, credentials, proxy rules and databases untouched. No new migration file is introduced. The existing migration 0005 must already be applied; review `migrate --plan` and back up the actual target database before any separately approved migration.
4. Check public search/error/checkout/callback flows and CRM login/search/save against the actual approved environment. A dismissing loader proves completion of the frontend lifecycle, not ticket issuance, payment success or certainty about a cancelled server write.
5. Roll back using the previous frontend/static/template release if needed. No financial API or payment integration was added.

## Source files changed

- `README.md`
- `django-backend/travel/static/office/global-loader.js`
- `django-backend/travel/static/office/office.js`
- `django-backend/travel/static/shared/globe.css`
- `django-backend/travel/static/shared/globe.js`
- `django-backend/travel/static/shared/loaderLock.js`
- `django-backend/travel/static/shared/loadingManager.js`
- `django-backend/travel/templates/office/base.html`
- `docs/GLOBAL_LOADING_AUDIT.md`
- `docs/VIDEO_PERFORMANCE.md`
- `index.html`
- `package.json`
- `public/boot-recovery.js`
- `public/pictures/popup-pictures/call-center-qr-v2.png`
- `public/pictures/popup-pictures/call-center-qr-v2.svg`
- `scripts/sync-loader-assets.mjs`
- `src/components/AppErrorBoundary.jsx`
- `src/components/BackgroundVideo.jsx`
- `src/components/Footer.jsx`
- `src/components/HotDeals.jsx`
- `src/components/MainNavbar.jsx`
- `src/components/PhonePopup.jsx`
- `src/components/Testimonials.jsx`
- `src/components/TopBar.jsx`
- `src/components/WebsiteLoader.jsx`
- `src/components/checkout/BillingContact.jsx`
- `src/components/loader/GlobeAnimation.jsx`
- `src/hooks/useLeadSubmission.js`
- `src/i18n/messages.json`
- `src/index.css`
- `src/lib/contact.js`
- `src/lib/initialLoading.js`
- `src/lib/leads.js`
- `src/lib/network.js`
- `src/main.jsx`
- `src/pages/BusinessClass.jsx`
- `src/pages/Checkout.jsx`
- `src/pages/Home.jsx`
- `src/pages/SearchResults.jsx`
- `src/pages/TakeoffProgressLoader.jsx`
- `src/shared/globe.css`
- `src/shared/globe.js`
- `src/shared/loaderLock.js`
- `src/shared/loadingManager.js`
- `tests/initial-loading.test.js`
- `tests/network.test.js`
- `tests/shared-loader.test.js`
