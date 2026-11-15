# Partner logos and CRM interface release

Prepared 2026-11-15. Branch: `fix/partner-logos-crm-design`.
No production deployment or Telegram delivery was performed.

## Findings and scope of verification

Base application commit: `6c2b7994aae63ec4ffef9a1d73cf17685da1ebe4`.
Design reference: `saibjontalibjanov/New-CRM-system`, default branch `main`,
commit `82f8350fcbf4bdd743f49cf17333942c6a0a184a`. Its remote HEAD was checked
on 2026-11-15. This is the latest revision of the supplied repository at that
check, not a claim about any other unpublished Lovable project.

The confirmed **repository defect** is that `/api/partners` returned
`Partner.logo.url`, normally `/uploads/partners/<filename>`. Django stores the
upload in `MEDIA_ROOT/partners/`, but its `/uploads/` URL pattern only exists in
DEBUG mode. Passenger/WhiteNoise does not automatically serve that directory.
A regression test verifies that a real, correctly saved image exists in storage
and its old URL returns 404 under production settings, while the new endpoint
returns the correct image bytes. A missing Apache mapping is sufficient to
produce the reported symptom.

The CRM multipart form, model field, API `{data:[...]}` shape and React parsing
are consistent. `mediaUrl()` already prefixes root-relative URLs with the
configured API origin. Both Home and About use the same `Partners` component.
Its grayscale/hover colors, negative horizontal animation, placement, mobile
sizes, pause control and reduced-motion rules were retained and browser-tested.
The production `.env.example` also pointed at the older `api` hostname; it now
uses `cms.staraviatravel.com`. An existing build must be rebuilt to change its
origin.

**Live host diagnosis is incomplete.** Requests to the public website and CMS
were denied by the cloud egress proxy (HTTP CONNECT 403), before reaching the
servers. The running policy does not yet include these destinations. Domain
additions were saved in the environment draft. There is no cPanel/filesystem
access in this task, so production upload existence, ownership, permissions,
Apache mapping, HTTPS behavior and the currently deployed API/build cannot be
claimed as inspected. Do not treat the local reproduction as proof of the
specific current production HTTP response.

## Implemented behavior

- Public partner JSON now uses `/api/partners/<id>/logo?v=<updated timestamp>`.
  This opens the model's configured Django storage; it requires no public
  filesystem alias. GET/HEAD only, verified PNG/JPEG/WebP content, nosniff,
  missing/unreadable files return 404. Every request checks publication and
  responses use no-store so unpublishing is respected on subsequent requests.
- `/office/partners/<id>/logo` previews both drafts and published uploads only
  for active staff with `travel.view_partner`. CRM cards and edit forms use
  this route, including existing upload previews. Raw partner paths are blocked
  in Django even in development. Apache aliases must also be restricted as
  described below. No file or database migration/reimport is needed.
- Upload replacement preserves old files. Editing metadata preserves existing
  storage names, even if that file is absent in this machine. New uploads are
  validated server-side for size, format and safe website URLs.
- The reference's five palettes, self-hosted Inter and JetBrains Mono, compact
  topbar, line icons, 252/72px navigation, responsive drawer, focus handling,
  content cards, filters, badges, tables, forms, dialogs and account appearance
  controls are integrated into the existing Django workspace.
- Partners/offers/testimonials/FAQs have card views with real publication state,
  filtered database queries, permission-controlled editing and CSRF-protected
  forms. FAQs retain all three translations and ordering.
- Leads have Kanban/table views, with permission-checked and validated status
  changes, real customer/contact/agent data and audit events. Pagination and
  filters apply to both views. Board counts explicitly describe the current
  page. The existing four stored statuses are preserved: New, Contacted,
  Qualified and Closed. The reference's six demo stages are not silently
  substituted for historical production statuses.
- Overview uses actual client/subscriber/checkout counts, recorded visitor
  trends and lead-source counts. It does not substitute demo revenue, budgets,
  exchange rates, payment status or fares for data the backend does not store.
- Account profile name/email writes update only the logged-in Django user.
  Password changes retain Django validation and session handling. Appearance
  is the only state kept in browser localStorage.
- All 17 sections share the interface. Existing client detail, passport,
  flight-provider search, checkout/PNR, phone matching, Telegram delivery,
  visitor analytics, content, team and integration handlers remain active.
  The CRM still opens at backend `/`. There is no iframe or second auth system.
  This base revision had no `CRM_REACT_ENABLED` behavior to preserve or toggle.

This is a server-rendered adaptation of the reference, not a port of its demo
React state store. Layouts accommodate real backend fields and the existing
client-checkout dialogs. Demo-only financial reports, notifications, currency
conversion, six-stage records and payment actions have not been presented as
working features. Existing flight search still needs the server's real provider
configuration; Telegram still needs its configured worker for actual delivery.

## Repeatable local validation

Use Python 3.12+ and Node 24. From repository root:

```bash
npm ci --cache /tmp/staravia-npm-cache
npm test
VITE_API_URL=https://cms.staraviatravel.com npm run build
cd django-backend
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
# Only if the local .env does not exist; never overwrite an existing one:
test -f .env || .venv/bin/python scripts/setup_env.py
.venv/bin/python manage.py test travel --settings=config.test_settings
.venv/bin/python manage.py check
.venv/bin/python manage.py makemigrations --check --dry-run
.venv/bin/python manage.py collectstatic --noinput
```

Backend tests use an isolated in-memory database and mocked external providers.
The added tests cover file bytes, old production 404, publication/unpublication,
GET/HEAD, private previews/roles, invalid and missing files, preserved uploads,
content queries, profile permissions/validation/CSRF and pipeline writes.

For browser tests, prepare **only** the isolated fixture settings:

```bash
# django-backend; creates only .test-data/browser.sqlite3 and .test-data/media
.venv/bin/python scripts/browser_smoke_setup.py
.venv/bin/python manage.py runserver 127.0.0.1:8000 --noreload --settings=config.browser_test_settings
# Another terminal, repository root, after the production build above:
npm run preview -- --host 127.0.0.1 --port 3000
# Another terminal, with Playwright available to Node:
node tests/browser-smoke.mjs
```

If Playwright/Chromium is supplied elsewhere, set `PLAYWRIGHT_MODULE` to its
absolute `index.mjs` and `CHROMIUM_PATH` to the browser executable. On this cloud
machine they were `/opt/codex/cua_node/lib/node_modules/playwright/index.mjs` and
`/usr/bin/chromium`. The script refuses non-loopback application URLs. It
forwards public production-bundle API reads to the isolated backend, blocks
other external browser requests, and never runs a Telegram worker. It checks
all 17 sections at 1440px/390px, palettes, navigation, a real multipart upload,
draft previews, permission restrictions, pipeline/table actions, client dialogs,
passport saving and both public partner strips. Screenshots stay under ignored
`django-backend/.test-data/browser-results/`. These fixtures are not production
records and are excluded from Git archives.

## Namecheap deployment: existing application

These instructions are for a human deployment after review. The application
root is `/home/starrbrg/staravia_cms/`. Preserve its existing Python Passenger
application, virtualenv, users, `.env`, database and media. Never delete/recreate
the app to perform this update.

1. Record the current release/commit, cPanel Python activation command, Passenger
   startup file/callable, database engine/path and the actual website document
   root from Domains. Export the current cPanel settings privately. The public
   document root is not assumed to be `public_html`.
2. Schedule a maintenance window. Pause writes and existing background workers
   using their current supervision. Do not send test Telegram replies or change
   webhooks. Leave DNS/certificates and working integrations intact.
3. Create a new private backup directory **outside** public document roots:

   ```bash
   umask 077
   release_backup=/home/starrbrg/private_backups/staravia-$(date +%Y%m%d-%H%M%S)
   mkdir -p "$release_backup"
   cd /home/starrbrg/staravia_cms
   cp -p .env "$release_backup/backend.env"
   tar -czf "$release_backup/media.tgz" media
   tar --exclude='./.env' --exclude='./data' --exclude='./media' --exclude='./.venv' --exclude='./venv' --exclude='./logs' -czf "$release_backup/backend-files.tgz" .
   ```

   Back up the actual website document root, including `.htaccess` and old
   assets, to this private directory as well. Activate the **existing** Python
   virtualenv using the exact command shown in Setup Python App, and run
   `python manage.py audit_database --json` to verify the actual database.
   If it confirms the default SQLite file, use the repository backup helper
   from the checked-out release/staging directory:

   ```bash
   python /path/to/release/scripts/backup_sqlite.py /home/starrbrg/staravia_cms/data/db.sqlite3 "$release_backup/database.sqlite3"
   ```

   Substitute the actual SQLite source if configured elsewhere. For PostgreSQL
   use the host's consistent database backup/restore facility instead. Verify
   backup integrity and that restoration is possible before continuing. Do not
   copy a live SQLite file as the only backup or put backups in public storage.
4. On the build machine, check out the reviewed release commit on
   `fix/partner-logos-crm-design`, preserving local changes. Build/package:

   ```bash
   npm ci
   npm test
   VITE_API_URL=https://cms.staraviatravel.com npm run build
   python3 -c "import shutil; shutil.make_archive('/tmp/staravia-frontend', 'zip', 'dist')"
   git archive --format=zip --output=/tmp/staravia-backend.zip HEAD django-backend scripts/backup_sqlite.py
   ```

   The frontend ZIP has `index.html` at its root. Backend ZIP has a
   `django-backend/` container. It contains only committed files, no local
   secrets, media, database, fixture data or virtualenv. Use the release commit,
   not a subsequently changed branch tip.
5. Upload/extract the backend archive into a new **private staging** directory.
   Compare any server customizations. Copy the staged `django-backend/` contents
   into `/home/starrbrg/staravia_cms/`, without deleting unmatched files. Do not
   copy local `.env`, media, database or virtualenv directories. Include all new
   templates, CSS, fonts and licenses. Keep `passenger_wsgi.py`, callable
   `application`, and the existing Python 3.12+ virtualenv configured in cPanel.
6. In the existing server `.env`, verify these selected public/deployment values;
   keep all secrets, database bindings and provider keys unchanged:

   ```dotenv
   DJANGO_DEBUG=False
   DJANGO_HTTPS_ONLY=True
   DJANGO_ALLOWED_HOSTS=cms.staraviatravel.com,api.staraviatravel.com
   PUBLIC_WEBSITE_URL=https://www.staraviatravel.com
   PUBLIC_BACKEND_URL=https://cms.staraviatravel.com
   CLIENT_ORIGINS=https://www.staraviatravel.com,https://staraviatravel.com
   CSRF_TRUSTED_ORIGINS=https://cms.staraviatravel.com,https://api.staraviatravel.com
   ```

   Keep verified proxy settings unchanged. Do not set `CRM_REACT_ENABLED` or
   `CRM_ROOT_ENABLED` to enable the interface; the existing root routing applies.
7. Restrict direct partner media before exposing the release. The new endpoint
   reads files privately and needs no Apache `/uploads/partners/` alias. If an
   existing alias/symlink still exposes that directory, remove that exposure
   without removing files, or add this rule **before** Passenger/frontend
   rewrites in the CMS document root's existing `.htaccess`:

   ```apache
   RewriteEngine On
   RewriteRule ^uploads/partners(?:/|$) - [F,L,NC]
   ```

   Check alternate aliases to the same files too. If Apache serves media from a
   separate path/host, ask Namecheap to deny that partner directory there. Keep
   needed legacy media outside it working. Do not enable DEBUG or chmod 777.
   The Passenger account needs traversal/read access to the media directory and
   read access to logo files; repair ownership through cPanel/Namecheap if it
   does not. Keep uploads persistent and outside the public application source.
8. In the activated existing virtualenv, from the application root:

   ```bash
   cd /home/starrbrg/staravia_cms
   python -m pip install -r requirements.txt
   python -m pip check
   python manage.py check
   python manage.py showmigrations
   python manage.py migrate --plan
   ```

   This release adds **no schema migration**. If the server predates existing
   migrations, review its pending plan and backup first, then apply the existing
   migrations once. Do not reimport data or create replacement staff accounts.
   Run `bootstrap_roles` only if the existing standard Agents/Managers groups
   need their current permissions refreshed; review custom role changes first.

   ```bash
   python manage.py collectstatic --noinput
   python manage.py check --deploy
   python manage.py audit_database --json
   ```

   Investigate deployment warnings against real hosting settings; do not turn
   off CSRF/TLS protections to hide them. Restart this application through Setup
   Python App (or its existing Passenger restart mechanism).
9. Before uploading the public build, verify backend HTTPS/login and health
   (`/_health` returns 204), then inspect `/api/partners`. Every published logo URL
   must return 200 with an image MIME type. Draft IDs must return 404 publicly;
   protected previews must require staff permission. Confirm raw draft upload
   URLs return 403/404 without cookies. Confirm existing database/media counts
   and records remain intact. Upload one controlled logo via CRM only if a real
   content edit is intended; do not manufacture production business records.
10. Upload/extract the frontend ZIP **contents** into the actual website document
    root from step 1. Merge `.htaccess` with cPanel SSL rules, preserving backups.
    Keep older hashed assets while cached pages may reference them. No backend
    code, `.env`, database or virtualenv belongs in this public directory.
11. Hard-refresh Home and About on desktop/mobile. Check DevTools requests use
    `https://cms.staraviatravel.com/api/partners/<id>/logo`, correct MIME/200,
    grayscale/hover color, leftward scrolling, pause and reduced motion. Verify
    staff roles, validation errors, client/passport/PNR flows, existing phone
    matching, real flight search and existing Telegram history/delivery status.
    Do not click Send/Connect webhook as a smoke test. Verify no unexpected
    provider requests or fabricated values. Resume pre-existing workers only
    after approving the release; that can send previously queued real messages.

## Rollback

1. Pause writes/workers again. Preserve logs and a new consistent database/media
   snapshot if any production writes occurred after deployment. Do not overwrite
   newer customer records with an old database just to revert appearance.
2. Restore the previous backend **code and static files** from the verified
   `backend-files.tgz` backup into private staging, then copy them back to the
   existing app root. Preserve current `.env`, database, uploads and virtualenv.
   This release has no schema migration, so rolling back its code does not need
   database rollback. If older unrelated migrations were applied, handle their
   recovery separately from this release, under maintenance and a verified plan.
3. Use the existing virtualenv, reinstall the previous pinned requirements only
   if they changed, run `collectstatic --noinput`, and restart Passenger. Restore
   prior cPanel settings only if they were deliberately changed and recorded.
4. Restore the previous public `index.html`, assets and merged `.htaccess` from
   the frontend backup. Keep any still-referenced hashed files. Invalidate the
   relevant CDN/browser caches. Recheck login, health, counts and existing data.
5. Keep direct draft media restricted. The old application used direct partner
   URLs, so reverting the API can reintroduce missing logos; do not reopen all
   draft uploads publicly to conceal that. Prefer a reviewed backend hotfix if
   a UI-only rollback is needed. Resume workers only after the rollback check.
6. Restore the database/media backup only for a confirmed data-loss recovery,
   after preserving newer writes and reviewing a reconciliation plan. Never
   delete live data as a routine code rollback.

## Recorded local results

- Backend: **103 tests passed**; isolated database, mocked external providers.
- Frontend: **40 tests passed**, no skipped/cancelled tests.
- Browser: **passed** for all 17 sections at desktop/mobile widths, five themes,
  real fixture upload/passport/status writes, protected draft previews and both
  public strips, including cross-origin image URLs, hover, motion and reduced
  motion. Production public bundle with isolated API forwarding, not live CMS.
- Production frontend build, pip dependency check, Django system check,
  migration consistency check and `collectstatic`: **passed**.
- No new schema migration. Existing migration/role setup was exercised only on
  local development/fixture databases. The reusable install script was rerun.
- Production file permissions, HTTP responses, real flight-provider inventory,
  production phone ingestion and Telegram delivery: **not exercised**.
