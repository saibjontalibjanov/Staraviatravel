# Strapi → Django migration and cutover

The active backend is now `django-backend/`; the previous Node implementation is archived under `legacy/strapi-backend/`. No data, uploads, real `.env` files or staff passwords are included in Git. Moving tracked source files does not relocate an existing deployment's ignored `.tmp/data.db` or `.env`; use their actual filesystem locations.

## 1. Back up and pause the old application

Back up the production Strapi SQLite database, `public/uploads`, and its private `.env` before pulling/deploying changes. Stop Strapi and its Telegram worker before the final import/cutover so two systems cannot accept enquiries or send the same bot messages simultaneously. The importer itself opens the source database read-only and never deletes source files.

The repository's original default database is SQLite. This importer accepts that SQLite schema. A Strapi PostgreSQL/MySQL installation requires an appropriate export/conversion before using this SQLite-specific importer; do not point it at a non-SQLite database.

## 2. Prepare the new backend

Create/activate a Python virtual environment in `django-backend`, then:

```sh
pip install -r requirements.txt
python scripts/setup_env.py --from-strapi /backups/strapi/.env
python manage.py migrate
python manage.py bootstrap_roles
```

`setup_env.py` runs only if a Django `.env` does not exist yet. It imports compatible provider keys privately, maps `PUBLIC_STRAPI_URL` to `PUBLIC_BACKEND_URL`, and generates a new Django signing secret. It never prints keys or imports Strapi signing/JWT salts. If a Django `.env` already exists, edit it locally instead. Confirm public URLs, hosts, CORS and CSRF origins for the new deployment. All active API keys remain in this one backend `.env`.

## 3. Preview and apply the import

```sh
# Count-only dry-run; no database writes or upload copies
python manage.py import_strapi --database /backups/strapi/data.db --uploads /backups/strapi/uploads

# Apply to the currently configured Django database
python manage.py import_strapi --database /backups/strapi/data.db --uploads /backups/strapi/uploads --apply
```

Use a clean destination database for the first import. The importer refuses conflicting client references/subscriber identifiers rather than merging unrelated records. It is repeatable: records are tagged with a legacy source key; running it again skips already imported records and preserves edits made in Django. It will not silently replace an upload with a different file of the same name.

Preserved data:

- Lead references, contact fields, source/language, statuses, notes, itinerary hints, quoted prices, terms and private passport records.
- Fare quotes and lead relationships, with their source fares/search parameters and expiry.
- Checkout tokens/hashes, request references, frozen client snapshots, internal pricing/profit, billing contacts, total/currency, lead relationships, expiry and revocation. The existing public `/checkout/<token>` links continue to work when the public website/backend routing is switched to Django. Legacy snapshots gain their lead reference where possible.
- Published **and draft physical records** for website offers, bookings and saved searches; imported draft/published versions are separate staff records so unpublished source edits are not discarded. The public API only returns published offers. Review duplicate-version titles before publishing a former draft as a new offer.
- Offer media relationships and copied local upload files. External media URLs remain external references.
- Subscriber emails/languages, normalized to lowercase.
- Telegram chats, lead links, history, unread timestamps, message submission/update IDs, attempts and delivery states. Messages that were `sending` at migration time become `unknown` and are not automatically resent. Other pending records remain queued for the new worker.
- Original creation times where available. Audit records start in the new workspace; they are not fabricated from old admin logs.

The importer does **not** copy Strapi admin password hashes, roles/JWT sessions or provider credentials into database rows. Credentials belong in `.env`; accounts use Django's auth system.

## 4. Create accounts and verify

```sh
python manage.py createsuperuser
python manage.py test travel --settings=config.test_settings
python manage.py check
python manage.py collectstatic --noinput
```

Sign in to `/office/`, inspect imported counts and representative leads, passports, offer images, existing checkout links, statuses, billing contacts and inbox history. Create staff accounts in **Team access** with the Agents or Managers group. Inform staff that Strapi passwords/sessions do not carry across.

Build the public frontend with `npm ci` and `npm run build` at the repository root. Local Vite proxies `/api`, `/uploads`, `/office` and `/static` to Django on port 8000. In production configure the HTTPS proxy and persistent media paths; see the backend README.

## 5. Switch traffic and start the worker

Point the public API/admin routes at Django. Keep the same public website origin to preserve checkout links. Configure `PUBLIC_WEBSITE_URL` and `PUBLIC_BACKEND_URL` to the real HTTPS origins. For separate frontend hosting, rebuild with the public `VITE_API_URL` and allow only the website origins.

Start the Django web process and `python manage.py telegram_worker`. If the Telegram backend origin changed, connect/check the webhook in **Integrations**. This is an explicit administrator action, not an automatic startup operation. Verify an incoming bot message and a deliberately sent test reply in your own test chat before resuming normal operations.

Retain the original source backup until you verify the new deployment. Do not run both Telegram workers or continue editing the old database after the traffic switch. Rollback requires planning for any new data accepted by Django after cutover; the legacy source backup alone will not contain those new records.

## Validation performed in this workspace

The provided local Strapi database contained zero customer/content records. A read-only import of that database completed. Populated automated fixtures verify lead/quote/checkout relationships, existing tokens, exact amounts/private profit, passport JSON, draft/public content, media copies, subscriber normalization, Telegram in-flight state and repeatable imports without source changes. Live hosted data has not been accessed or altered.
