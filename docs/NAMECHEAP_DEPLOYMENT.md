# Namecheap cPanel / Passenger deployment and rollback

This runbook targets the existing split-domain installation. **Do not apply these live changes until the owner approves the reviewed commit, the live traceback has been investigated, and a recoverable backup has been verified.** Local tests are not production verification. Keep `DEBUG=False` throughout. Never copy the local database or `.env` to production, reset passwords, or run `flush`.

## 1. Obtain evidence first — read-only commands

In cPanel Terminal:

```bash
source /home/starrbrg/virtualenv/staravia_api/3.12/bin/activate
cd /home/starrbrg/staravia_api
python --version
python manage.py check
python manage.py showmigrations
python manage.py migrate --plan
python manage.py check --database default
python manage.py check --deploy
```

If the reviewed `audit_database` command is not yet on the server, run it only after its source has been explicitly approved for upload. It performs SELECTs, introspection and SQLite integrity checks; it does not migrate/repair/create databases:

```bash
python manage.py audit_database --json
```

Do not treat the cloud workspace's database/migration results as the live server's results. Capture the actual engine and SQLite path (if applicable). No employee-profile model exists in this source: staff accounts use Django `auth.User`, `is_staff`, `is_active`, groups and permissions. Do not create an employee table speculatively.

Find the log path in **Setup Python App**, **Metrics → Errors**, or the application's `stderr.log`. Candidate locations include `/home/starrbrg/staravia_api/stderr.log` and the API domain's document root. Inspect locally:

```bash
find /home/starrbrg/staravia_api -maxdepth 3 -type f -name stderr.log -print
# Replace with the actual path shown by cPanel:
tail -n 100 /home/starrbrg/staravia_api/stderr.log
```

Reproduce one failed login and retain its timestamp, exception type and final stack frames. Redact passwords, tokens, cookies, database credentials, SQL values, customer names and passport data before sharing. Do **not** enable debug pages. This branch logs Django request exceptions to stderr; Passenger/cPanel owns log rotation and access control. Missing logs/tracebacks leave the reported login 500 undiagnosed; the verified source fixes are not evidence of its live cause.

## 2. Preserve the current release and database — approval required

Use **Setup Python App → Stop App** or a hosting-approved maintenance procedure before switching code/schema. Prevent intake writes while backing up and deploying. Confirm both the website and API traffic are covered by the maintenance window; merely stopping a background worker does not stop requests.

Store backups outside every domain's public document root. In cPanel Terminal:

```bash
umask 077
STARAVIA_RELEASE=$(date -u +%Y%m%dT%H%M%SZ)
STARAVIA_BACKUP=/home/starrbrg/backups/staravia-$STARAVIA_RELEASE
mkdir -p "$STARAVIA_BACKUP"
chmod 700 "$STARAVIA_BACKUP"
tar -czf "$STARAVIA_BACKUP/backend-files.tar.gz" -C /home/starrbrg staravia_api
tar -czf "$STARAVIA_BACKUP/frontend-files.tar.gz" -C /home/starrbrg public_html
```

These archives contain private configuration/data. Keep them private and never upload them to GitHub. Do not back up a running SQLite database by relying on `cp` or a tar archive alone.

**If the live audit confirms SQLite**, use its actual `sqlitePath`. The following path applies only when the live database is the default `data/db.sqlite3`. Upload the reviewed backup helper outside public roots, then run:

```bash
python /home/starrbrg/staravia-release/scripts/backup_sqlite.py \
  /home/starrbrg/staravia_api/data/db.sqlite3 \
  "$STARAVIA_BACKUP/database.sqlite3"
```

The helper opens the source read-only, uses SQLite's backup API, checks `integrity_check`, compares every table's row count, creates the backup with mode 0600, and refuses to overwrite existing files. A failed verification blocks deployment. Verify the archive listings privately with `tar -tzf`; restore the SQLite backup into a **separate temporary location** and run `audit_database` there using the reviewed code and an isolated `DATABASE_URL`. Never test restore over the live database.

For a live MySQL/MariaDB or PostgreSQL database, use the host's database backup facility/native consistent dump and verify a restore in a separate database before deployment. Do not switch database engines or install a guessed driver. Preserve the existing `DATABASE_URL`; supply the actual sanitized driver/connection exception if startup fails. No live engine other than the local workspace's SQLite has been verified.

## 3. Build frontend on a development/build machine

Check out the reviewed branch/commit; no server secrets are needed for Vite:

```bash
git clone --branch fix/namecheap-production-audit https://github.com/saibjontalibjanov/Staraviatravel.git staravia-release
cd staravia-release
npm ci
cp .env.example .env.production
# The file must contain only public build values:
# VITE_API_URL=https://api.staraviatravel.com
npm test
npm run build
python scripts/scan_secrets.py --history
```

If `.env.production` already exists, review/edit it rather than overwriting valid values. Production reads the repository-root `.env.production`; development reads `django-backend/.env`. API keys/signing/database/Telegram secrets belong only to the backend `.env` and must never have a `VITE_` prefix.

Upload the **contents of `dist/`**, not a containing `dist` directory, to `/home/starrbrg/public_html` after approval. Include its hidden `.htaccess`. First merge the provided SPA rewrite/file-denial rules with the backed-up existing `.htaccess`; preserve cPanel redirects, SSL and unrelated hosting rules. Do not upload `node_modules`, backend source, `.git`, databases, logs or environment files to `public_html`. Keep the old hashed assets available during the release transition so cached old HTML does not immediately break; remove obsolete assets after validation in a later approved cleanup.

Apache's rewrite fallback serves React deep links such as `/about-us`, `/search-results` and `/checkout/<token>`. The build uses the actual Django `/api/airports`, `/api/flights`, `/api/leads`, `/api/hot-flights`, `/api/faqs`, `/api/testimonials`, `/api/newsletter`, and `/api/checkouts/...` routes.

## 4. Update backend source — approval required

Upload the reviewed `django-backend` source contents to `/home/starrbrg/staravia_api` in the approved maintenance window. Preserve the live `.env`, `data/`, media, logs and virtual environment. Do not use `rsync --delete` against the application root. Compare the existing server files first: production may contain local changes absent from Git. Do not overlay the archived Strapi backend.

```bash
source /home/starrbrg/virtualenv/staravia_api/3.12/bin/activate
cd /home/starrbrg/staravia_api
python -m pip install -r requirements.txt
python -m pip check
```

The package pins are unchanged by this branch. Passenger uses `passenger_wsgi.py`, callable `application`; choose the existing Python 3.12 interpreter in **Setup Python App**. The entry point adds its own application directory to `sys.path` and imports Django once, regardless of working directory. Gunicorn, Docker, Redis and Celery services are not required on Namecheap. Do not overwrite a customized existing Passenger entry point before comparing it to this reviewed version.

Merge nonsecret production settings from `.env.namecheap.example` into the **existing** backend `.env`:

```env
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=api.staraviatravel.com
DJANGO_HTTPS_ONLY=True
CRM_ROOT_ENABLED=True
PUBLIC_WEBSITE_URL=https://staraviatravel.com
PUBLIC_BACKEND_URL=https://api.staraviatravel.com
CLIENT_ORIGINS=https://staraviatravel.com,https://www.staraviatravel.com
CSRF_TRUSTED_ORIGINS=https://api.staraviatravel.com
```

Preserve the existing Django signing secret, database URL, provider keys and Telegram settings. Do not generate a new signing secret or reset accounts as a troubleshooting shortcut. Secure/HttpOnly/Lax session cookies remain enabled. Staff login/CRM is same-origin on the API domain; public React requests do not need cross-origin staff cookies. CORS only permits the two public website origins, not arbitrary origins or `/office` staff routes.

Keep current verified proxy settings. Enable `TRUST_PROXY_HTTPS=True` only if Namecheap confirms its proxy overwrites `X-Forwarded-Proto`; otherwise use Passenger's correct HTTPS WSGI scheme. Do not enable arbitrary trusted proxy IP headers or disable HTTPS/CSRF to work around a redirect/login failure.

Review schema changes before applying anything:

```bash
python manage.py check
python manage.py showmigrations
python manage.py migrate --plan
python manage.py audit_database --json
```

**This branch introduces no migrations.** An older live release may still need existing migrations 0001–0004 or Django framework migrations. The owner must approve the actual plan after backup verification. Only then:

```bash
python manage.py migrate
python manage.py bootstrap_roles
python manage.py collectstatic --noinput
python manage.py check --deploy
python manage.py audit_database --json
```

`bootstrap_roles` updates Agents/Managers permissions but creates no accounts or passwords; review custom group assignments first. Do not run it blindly on customized roles. If the plan is empty, no schema migration is needed. Collecting static files is necessary: the CRM uses hashed WhiteNoise assets and its own backend favicon; it no longer depends on a frontend `dist` directory being present beside the deployed backend.

Existing media is public offer artwork, not passport data. Check the API domain's **actual** document root in cPanel. Arrange `/uploads/` to serve the existing backend `media/` through Apache/static mapping or a hosting-supported symlink. Never expose the application root, `.env`, `data/`, `.git` or logs. Do not assume a symlink works: Namecheap must allow it. Preserve all existing media and imported offer filenames; test a published offer image URL after deployment. This source deliberately does not use Django's development media server with `DEBUG=False`.

Restart through **Setup Python App → Restart**. If cPanel's documented mechanism is `tmp/restart.txt`, use it only for this application after confirming the configured app root. Do not restart unrelated apps or change the interpreter globally.

## 5. Verification — no real bookings/payments/messages during smoke tests

Public read-only checks from an unrestricted network:

```bash
curl -sS -o /dev/null -w '%{http_code}\n' https://staraviatravel.com/
curl -sS -o /dev/null -w '%{http_code}\n' https://staraviatravel.com/about-us
curl -sS -o /dev/null -w '%{http_code}\n' https://api.staraviatravel.com/
curl -sS -o /dev/null -w '%{http_code}\n' https://api.staraviatravel.com/office
curl -sS https://api.staraviatravel.com/api/airports | python -c 'import json,sys; d=json.load(sys.stdin); print(type(d).__name__, len(d))'
```

Expect root CRM login 200, `/office` redirect to `/office/`, airport JSON, React HTML/assets on the website domain, and no redirect loops. A 200 HTML response from an API path is a failure, not success.

With the owner's approved test account, verify invalid credentials are rejected, valid login opens the dashboard directly at `/`, reload/new-tab session persistence, logout, and protected-route denial. Keep an eye on Passenger stderr; never post live passwords/cookie headers in reports. Visit every permitted CRM section, check counts against the live database privately, view an unassigned lead, and test invalid IDs return 404 rather than 500. Staff form POSTs must still require CSRF.

In browser DevTools, confirm website requests target `https://api.staraviatravel.com/api/...`, CORS accepts the website origin, and no backend secrets enter the JS bundle. Verify airport autocomplete/IATA lookup, form required fields, all three languages, mobile/laptop layouts, and published offer images. Submit an explicitly approved test enquiry only if authorized; label and manage that record through the established business process. A real flight search can consume quota; use the owner's approved test procedure. Do not simulate successful provider responses on the live site.

Provider calls were mocked in local tests. CLICK charging/ticket issuance remain disabled, as before. Telegram requires its separate existing worker and credentials; do not start a live messaging worker just to test login. Shared hosting must provide a supported worker/cron process; `python manage.py telegram_worker --once` is available for an explicitly authorized delivery schedule.

## 6. Rollback

Keep intake paused while assessing a failed deployment. Roll back **code/frontend/static assets first**, using the verified release archives and preserving current `.env`, database and media. Do not extract an old backend tar archive wholesale over the live data directory. Restart this Passenger app and recheck login/API status.

This branch adds no schema migrations, so no schema downgrade is needed for its code-only rollback. If earlier pending migrations were separately approved/applied, use their reviewed reversal plan; do not guess reverse migration targets. A database restore is destructive to newer writes: it needs separate explicit approval and a reconciled plan for every post-backup enquiry, checkout and message. Restore to a separate path/database first, verify integrity/counts, preserve the current database for reconciliation, and only then perform an approved atomic switch. Never overwrite production with the cloud workspace database.
