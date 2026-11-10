# StarAviaTravel production audit — 2026-11-02

## 1. Reported post-login HTTP 500: root cause status

**Unresolved on production: no production traceback, server filesystem, SSH/cPanel connection, or production credentials were available.** The live `/home/starrbrg/...` paths are not mounted here. Read-only HTTPS attempts to `staraviatravel.com`, `api.staraviatravel.com`, `/office` and `/api/airports` failed at the workspace network/proxy layer before an origin HTTP response. This does not mean the live websites are down.

The original local login → dashboard flow passed after supplying the normal CSRF Origin in the isolated HTTPS test. The reported live post-login exception was therefore **not reproduced** on the matching local schema. No database root cause is assumed. A sanitized traceback from Passenger `stderr.log`/cPanel application logs is required, with the exception type and final stack frames from one failed login. Do not turn on production debug pages.

## 2. Verified defects and exact fixes

| Reproduced defect | Evidence before fix | Implemented fix |
|---|---|---|
| Airport catalogue depends on OS text encoding | `UnicodeDecodeError` importing flights under `LC_ALL=C`, `PYTHONUTF8=0`, `PYTHONCOERCECLOCALE=0` | Explicit `read_text(encoding='utf-8')`; regression startup test |
| Unassigned lead crashes detail view | `VariableDoesNotExist: Failed lookup for key [username] in None` | Guard `assigned_to` before using its username fallback |
| Invalid record/chat IDs crash staff pages | `ValueError: Field 'id' expected a number but got 'bad'` | Validate positive, bounded ASCII numeric IDs; return 404, including invalid team-account references and a reproduced Unicode-digit pagination cursor failure |
| Split-domain production build lacks API origin | Original API fallback was empty and Vite read only backend env directory | Production reads root `.env.production`, with public root `.env.example`; compiled origin verified as `https://api.staraviatravel.com` |
| Dedicated backend root serves frontend/fails when adjacent dist absent | Original root handler selected the React frontend | `CRM_ROOT_ENABLED=True` renders existing login/dashboard directly at `/`; retains `/office` aliases, safe login/logout targets, same layout and no-store headers |
| Backend favicon depends on separate frontend build directory | Original `/staravia-mark.png` existed only in public frontend artifacts | Use same logo through collected backend static assets |
| No source Passenger entry point / Apache SPA fallback | Files absent from repository | Added portable `passenger_wsgi.py` and frontend `.htaccess`; production files must be compared before approved upload |
| Stalled requests keep forms/loaders pending indefinitely | Fetch calls had no deadlines | Public API header/body timeout, preserved abort signals, 45-second flight/staff timeout, existing retry/error UI retained |

These fixes are confirmed local defects or deployment gaps. They are **not** presented as the proven cause of the production post-login 500. No redesign, schema migration, account reset, or live edit was made.

## 3. Database engine and health

Actual audited workspace database: **SQLite**, Django backend `django.db.backends.sqlite3`, file `/workspace/Staraviatravel/django-backend/data/db.sqlite3`.

Read-only audit passed: connection, all managed model tables/columns, SQLite quick integrity check, zero foreign-key violations, and writable DB file/parent directory. Local counts: users 0, groups 2, sessions 0, leads 0, checkouts 0, bookings 0, saved searches 0, audit events 0. This is a development database, **not** the commercial production database. No production health/engine result is available.

Added `python manage.py audit_database --json`: reads schema/counts/migration history, refuses to create a missing SQLite database, prints no passwords or customer records, exits nonzero on detected problems, and never repairs/applies migrations. Added a separately invoked exclusive-create SQLite backup helper, validated only against an isolated temporary database.

## 4. Migration status

Workspace: all Django auth/contenttypes/session migrations and travel migrations 0001–0004 applied; `migrate --plan` has no operations. `makemigrations --check --dry-run`: no changes. **This branch adds no schema migrations.** Production status remains unknown until server diagnostics are supplied. Do not automatically run production migrations. Review the live plan, verify a recoverable backup and obtain approval first.

## 5. CRM audit

Automated checks cover valid/invalid login, CSRF enforcement, staff/active restrictions, session persistence, root/dashboard rendering, external-next rejection, POST-only logout, legacy `/office` aliases, secure-cookie settings, role/permission boundaries, client records, passports, checkouts/private profit/billing validation, booking and saved-search CRUD, website offers, subscriber access, testimonials, FAQs, Telegram validation/outbox behavior, invalid IDs, and unassigned clients.

A local HTTPS browser run used `DEBUG=False`, real secure session/CSRF cookies, the actual Passenger WSGI callable under a local WSGI runner, collected manifest assets, and an isolated database. All existing CRM section pages rendered. Passport save → ticket search → PNR → private checkout → billing completed. Login/session reload/logout worked at `/`. Third-party flight responses were mocked; no real tickets, payments or Telegram messages were sent. cPanel's actual Passenger process remains untested.

Staff uses built-in `auth.User`/groups, not an employee-profile table. Existing shared team visibility/business logic was preserved; no unrelated CRM features were added.

## 6. React website audit

Production build succeeds. Tested home, About, Business Class, Search Results, private checkout and unknown-route handling, along with 375/768/1440-pixel browser widths. Website callback enquiry, booking enquiry without a payment preference, review submission, fare display, checkout billing and three-language regression tests passed. Existing design, branding, navbar, compact-laptop scale and pop-up layouts were preserved. No browser JavaScript exceptions occurred in the verified flow.

Added an Apache SPA rewrite template for Namecheap. Its real deployed behavior and interaction with existing cPanel rules require the approved rollout; the local browser static server reproduced deep-link fallback behavior but was not a live Apache instance.

## 7. API integration

Root production `.env.production` contains **only public** `VITE_API_URL=https://api.staraviatravel.com` and is ignored by Git. Root `.env.example` documents reconstruction; actual keys remain in the backend `.env`. Development still supports backend env plus Vite proxy.

All public React API calls share timeouts and the existing API service layer. Production compiled requests were observed using the intended API origin and were redirected **only within the isolated browser test** to the local HTTPS backend. Unit tests confirm only the main/www website origins receive public-API CORS, arbitrary origins are rejected, staff routes are not cross-origin, and cross-origin staff credentials are not enabled. API responses came from actual Django routes; provider fixtures were confined to local tests.

## 8. Security findings and controls

No credential/authentication/CSRF bypass was introduced. Secure/HttpOnly/Lax staff cookies and production `DEBUG=False` remain. Existing validation, ORM queries, escaped templates/React output, image validation, API field whitelists, private checkout tokens, public-data minimization and role checks remain in place and covered by the test suite. API keys stay server-side. Request exception tracebacks go to private stderr rather than public pages.

`.gitignore` now also covers general Python environments, SQLite/database files, keys, certificate containers, backups and exports. Pre-commit baseline reachable-history scan: **482 source blobs**, no potential secret findings with the documented heuristic scanner. Its first pass falsely matched blank env assignments across newlines; restricting whitespace to a single line corrected that scanner defect. No actual secret was detected. Staged source was scanned again before publication. Binary/media blobs and very large blobs are excluded from the heuristic scan; this is not a guarantee against every possible secret format.

The final browser bundle was checked for the current backend's nonempty signing/provider/token/password values; none were present. Database credentials/customer records/logs/private keys/backups were not staged. The copied static logo is the existing public brand image.

## 9. Validation results

| Check | Result |
|---|---|
| Django full isolated suite | **64 passed** |
| Node regression suite | **23 passed**, including timeout/body cancellation and isolated backup safety |
| `manage.py check` / `check --database default` | Passed |
| `check --deploy` with explicit production HTTPS/host/origin settings | Passed, no issues |
| `showmigrations`, `migrate --plan` | Local migrations applied; empty plan |
| `makemigrations --check --dry-run` | No changes |
| `audit_database --json` | Local SQLite healthy; zero FK violations |
| ASCII-locale startup | Passed after UTF-8 fix |
| `pip check` | No broken requirements |
| `npm run build` | Passed; intended API origin and `dist/.htaccess` verified |
| `collectstatic --noinput` | Passed; actual production manifest assets exercised in browser |
| Staff JavaScript syntax / Git diff whitespace | Passed |
| HTTPS browser smoke with isolated data | Passed; all CRM sections and key public-to-private workflows |
| Actual production login/database/provider/cPanel runtime | **Not verified — access/logs unavailable** |

Runtime: Python 3.12.14, Django 5.2.18, Node v24.19.0, npm 11.9.0. Dependency pins were not changed. The suite intentionally exercises provider failures; an expected sanitized `/api/flights` error log during those cases is not an unexpected test failure.

## 10. Modified/uploaded files

The complete source lives on the existing repository. The exact changed-source manifest is appended below. No generated `dist`, virtual environment, database, credentials, logs, test fixture credentials or backup artifacts are uploaded.

## 11. Repository

https://github.com/saibjontalibjanov/Staraviatravel

## 12. Branch and commit

Review branch: **`fix/namecheap-production-audit`**. No merge to `main` and no force-push. The confirmed commit hash is provided in the delivery response; obtain it after checkout with `git rev-parse HEAD`. This report cannot embed its own future commit hash.

## 13. Namecheap deployment commands

Use [NAMECHEAP_DEPLOYMENT.md](NAMECHEAP_DEPLOYMENT.md) for the exact existing `/home/starrbrg` paths, evidence collection, backup verification, Vite build/upload, safe `.env` merge, Passenger startup, static/media setup, migration approval boundary, restart and smoke tests. No Docker/Redis/Celery/VPS is required. GitHub upload authorizes source review; it does not authorize production deployment.

## 14. Remaining blockers

1. Supply the sanitized **actual post-login exception traceback**, timestamp and relevant deployed source/version details. The primary reported production problem cannot be attributed or declared fixed without this evidence.
2. Obtain read-only production database/migration/permission diagnostics and compare deployed source against the reviewed branch.
3. Review/approve the code and actual deployment/migration plan; verify backups/restore before any live mutation.
4. Confirm API-domain static/media mappings, Passenger HTTPS scheme/forwarded headers, both website origins, DNS/SSL and existing `.htaccess` behavior on Namecheap.
5. Run the approved live login/dashboard/session/module/API smoke procedure. Provider quotas, Telegram delivery scheduling and real flight behavior remain untested. CLICK payment charging/issuance remains disabled as before; this task does not add a payment integration.

## 15. Rollback

See the runbook's rollback section. Keep verified private release/database backups. Restore reviewed code/frontend/static artifacts without overwriting current `.env`, data or media, then restart only the affected Passenger app. This branch has no schema migration to reverse. If other migrations/data writes have occurred, a DB restore requires separate approval and reconciliation of all post-backup records; never overwrite live data with the local test/development database.

### Changed-source manifest

- `.env.example`
- `.gitignore`
- `README.md`
- `django-backend/.env.example`
- `django-backend/.env.namecheap.example`
- `django-backend/API_KEYS.md`
- `django-backend/README.md`
- `django-backend/config/settings.py`
- `django-backend/config/urls.py`
- `django-backend/passenger_wsgi.py`
- `django-backend/travel/management/commands/audit_database.py`
- `django-backend/travel/middleware.py`
- `django-backend/travel/office.py`
- `django-backend/travel/services/flights.py`
- `django-backend/travel/static/office/office.js`
- `django-backend/travel/static/office/staravia-mark.png`
- `django-backend/travel/templates/office/base.html`
- `django-backend/travel/templates/office/login.html`
- `django-backend/travel/templates/office/telegram.html`
- `django-backend/travel/templates/office/workspace.html`
- `django-backend/travel/tests/test_database_audit.py`
- `django-backend/travel/tests/test_production_auth.py`
- `docs/NAMECHEAP_DEPLOYMENT.md`
- `docs/PRODUCTION_AUDIT_2026-11-02.md`
- `public/.htaccess`
- `scripts/backup_sqlite.py`
- `scripts/scan_secrets.py`
- `src/components/FAQ.jsx`
- `src/components/Footer.jsx`
- `src/components/HotDeals.jsx`
- `src/components/SearchForm.jsx`
- `src/components/Testimonials.jsx`
- `src/components/checkout/BillingContact.jsx`
- `src/lib/api.js`
- `src/lib/leads.js`
- `src/lib/network.js`
- `src/pages/BusinessClass.jsx`
- `src/pages/Checkout.jsx`
- `src/pages/SearchResults.jsx`
- `tests/backup.test.js`
- `tests/network.test.js`
- `vite.config.js`
