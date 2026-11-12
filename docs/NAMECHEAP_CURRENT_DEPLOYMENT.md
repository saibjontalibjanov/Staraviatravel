# Deploy current main: www.staraviatravel.com + cms.staraviatravel.com

Current call center: **+998 91 023 57 37** (`+998910235737`). Updated 2026-11-12.

The public React website and Django CRM/API are separate applications. This guide updates an existing Namecheap installation; it does not replace live data or secrets. No deployment was performed by this code change.

## 1. Back up and identify the existing application

In cPanel, note:

- Domains → the real document root for `www.staraviatravel.com`.
- Setup Python App → existing application root, Python version, activation command and startup settings.
- Actual database engine/location and current `/uploads/` → `media/` mapping.

Back up frontend files and `.htaccess`, backend code, private `.env`, media and a consistent database snapshot. Keep backups outside public document roots. For SQLite use a verified consistent backup such as `scripts/backup_sqlite.py`, not an unverified copy of an actively written file. Review the existing detailed [backup/recovery runbook](NAMECHEAP_DEPLOYMENT.md). Pause intake writes for the backend/schema update.

## 2. Pull main on the laptop

PowerShell in the repository root:

```powershell
git status
git fetch origin
git switch main
git pull --ff-only origin main
```

Preserve local changes before switching/updating. Do not use a destructive reset to bypass an error. Use Node.js 22 or another compatible newer version and a supported Python installation for packaging.

## 3. Set the frontend backend address and build

Edit repository-root `.env.production` (beside `package.json`):

```env
VITE_API_URL=https://cms.staraviatravel.com
```

Only public settings belong in this file; keep private API keys in the server backend `.env`.

```powershell
npm ci
npm test
npm run build
python -c "import shutil; shutil.make_archive('staravia-frontend', 'zip', 'dist')"
git archive --format=zip --output=staravia-backend.zip HEAD django-backend
```

The frontend ZIP has the **contents** of `dist/` at its root, including `.htaccess`. The backend ZIP has a containing `django-backend/` folder. Git archive includes committed source, not the ignored local `.env`, SQLite database or virtualenv. `npm run build` also synchronizes shared CRM loader assets before packaging.

## 4. Prepare cms and HTTPS

If not already configured:

1. Add a DNS A record for `cms` pointing to the Namecheap hosting IP. Use the DNS service actually managing the domain.
2. In cPanel Domains, add `cms.staraviatravel.com` with its own document root, not the website's shared `public_html`.
3. Activate a valid SSL certificate for `cms.staraviatravel.com`. Keep valid certificates for the website's `www` and non-www names too.
4. In Setup Python App, point the **existing** Django application URL to the root of `cms.staraviatravel.com`. Preserve its application root and virtualenv. Startup: `passenger_wsgi.py`; entry point: `application`. Use the existing compatible interpreter (Python 3.12 has been tested).

If the application URL cannot be edited, ask Namecheap to change the URL while preserving the application, virtualenv, environment, database and media mapping. Do not delete the existing application/data to change its hostname. Do not expose the Django application root as a public directory.

## 5. Upload backend code during the maintenance window

Stop the application through the hosting's existing maintenance procedure. Upload/extract `staravia-backend.zip` into a **private staging directory**. Copy the extracted `django-backend/` contents into the existing application folder, comparing customized server files first.

Preserve the server's `.env`, `data/`, `media/`, virtualenv and logs. Never upload the laptop `.env`, database, `.venv` or `.git` into the live app/public site. Do not use a delete-mirroring command against the application root.

Edit selected values in the **existing server backend `.env`**:

```env
DJANGO_DEBUG=False
DJANGO_HTTPS_ONLY=True
DJANGO_ALLOWED_HOSTS=cms.staraviatravel.com,api.staraviatravel.com
PUBLIC_WEBSITE_URL=https://www.staraviatravel.com
PUBLIC_BACKEND_URL=https://cms.staraviatravel.com
CLIENT_ORIGINS=https://www.staraviatravel.com
CSRF_TRUSTED_ORIGINS=https://cms.staraviatravel.com,https://api.staraviatravel.com
PHONE_BRIDGE_LINE=+998910235737
```

Keep existing `DJANGO_SECRET_KEY`, `DATABASE_URL`, SerpAPI/Telegram keys and `PHONE_BRIDGE_TOKEN` unchanged. A present `PHONE_BRIDGE_LINE` overrides the source default, so update it explicitly if it still contains the previous business number. Updating this setting does not change a physical SIM number or rewrite historical call records. Leaving the phone bridge token empty keeps phone ingestion disabled; the website/CRM still work.

CRM now opens at `/`; no `CRM_ROOT_ENABLED` environment flag is needed. Keep verified proxy settings unchanged. Do not disable HTTPS/CSRF or trust arbitrary proxy headers to work around an environment issue.

## 6. Install/check/migrate/static/restart

Use the **exact virtualenv activation command from Setup Python App**, then enter its actual application directory. The path below is an example, not a known account path:

```bash
cd /home/YOUR_CPANEL_USERNAME/staravia_api
python -m pip install -r requirements.txt
python -m pip check
python manage.py check
python manage.py showmigrations
python manage.py migrate --plan
```

After backup verification and review of the actual pending plan:

```bash
python manage.py migrate
python manage.py bootstrap_roles
python manage.py collectstatic --noinput
python manage.py check --deploy
python manage.py audit_database --json
```

`bootstrap_roles` updates standard Agents/Managers permissions; review custom roles before using it. No new administrator/password is needed when an existing account works. Current migrations include partner/visitor `0005` and phone-history `0006_phonecall_phonecallevent`; only unapplied migrations run. This phone-number update adds no migration.

Keep `/uploads/` mapped to the persistent backend `media/` on the new hostname using hosting-supported configuration. Do not rely on Django DEBUG media serving in production.

Start/restart **this** Python application through Setup Python App. Verify:

- `https://cms.staraviatravel.com/`: CRM login.
- `https://cms.staraviatravel.com/api/partners`: JSON, not frontend HTML.
- `https://cms.staraviatravel.com/_health`: empty HTTP 204.
- Existing login, client records, images and private checkout.

`/office` is a backwards-compatible redirect to `/`; staff operations remain protected. Investigate deployment-check warnings and Passenger logs without enabling public debug pages or sharing secrets.

## 7. Upload frontend after cms works

In File Manager, open the **actual website document root** identified in step 1. Upload/extract `staravia-frontend.zip` there. Correct layout:

```text
website-document-root/
  index.html
  boot-recovery.js
  .htaccess
  assets/
  media/
  pictures/
  ...all other build files...
```

Do not place a containing `dist/` folder between the document root and `index.html`. Include all build files, including QR and video assets. Enable Show Hidden Files in File Manager and merge the built `.htaccess` rules with existing SSL/cPanel rules, preserving the backup. Keep old hashed assets during the transition for already-open/cached pages.

No backend source, `.env`, database or `node_modules` belongs in the public website root. Rebuilding is mandatory when `VITE_API_URL` changes; editing a backend `.env` cannot change a previously compiled frontend API address.

## 8. Final checks and optional phone/Telegram integration

- Ensure `staraviatravel.com` redirects to `https://www.staraviatravel.com` preserving paths/query strings; do not apply that redirect to cms.
- Hard refresh and clear the relevant CDN cache if used. Verify DevTools Network requests go to `https://cms.staraviatravel.com/api/...`.
- Check all three languages, the new `+998 91 023 57 37` contact links, the new QR, direct About/Business Class routes, offers/images and loaders.
- If Telegram is enabled, reconnect/check its webhook from the new CRM Integrations screen. Keep the token unchanged.
- Huawei phone history still requires the explicitly configured phone automation bridge; see [phone setup](PHONE_BRIDGE.md). Uploading source does not pair a handset automatically.
- Keep the old api hostname/service available until old clients, integrations and cached frontend builds are accounted for. A DNS record alone does not keep the old application working; avoid a blanket API 301 redirect that may break POSTs.

## Rollback

Use the previous reviewed frontend/backend/static release while preserving current secrets, database and media. Do not restore an old database over newer leads/calls or reverse call-table migrations containing real records without a separately reviewed recovery plan. Do not reset accounts or delete the database to resolve a deployment error.
