# StaraviaTravel — Django backend & unified CRM

The travel website uses React/Vite for its public pages and **Python Django 5.2 LTS** for every active backend function. Strapi is no longer needed to install, build or run the application. Its previous implementation is archived under `legacy/` for migration/reference only.

## Your admin and CRM link

**`https://your-domain.com/office/`** is the single protected admin/CRM workspace. Local backend: **http://localhost:8000/office/**. The green interface includes the dashboard, client directory, passports, ticket search, private checkouts/profit, website offers, Telegram, subscribers, booking records, staff access and activity log. It uses Django staff sessions, CSRF protection and permission groups; there are no shipped default passwords.

## Start locally

Python 3.12+ and Node 24 LTS are recommended. From the repository root:

```sh
cd django-backend
python -m venv .venv
```

Activate it with `source .venv/bin/activate` on macOS/Linux, or `.venv\Scripts\activate` on Windows. Then:

```sh
pip install -r requirements.txt
python scripts/setup_env.py
python manage.py migrate
python manage.py bootstrap_roles
python manage.py createsuperuser
python manage.py runserver 0.0.0.0:8000
```

In another terminal at the repository root:

```sh
npm ci
npm run dev
```

Open **http://localhost:3000** for the website and **http://localhost:8000/office/** for the workspace. Vite also forwards `/office/` to Django, so **http://localhost:3000/office/** works locally. Keep the same hostname (`localhost` or `127.0.0.1`) during a session. Stop the old Strapi process/worker before using the Django bot integration.

## One `.env` for API keys

All active settings and API keys belong in **`django-backend/.env`**. `scripts/setup_env.py` creates it with a random Django secret and never prints or replaces secrets. See [API_KEYS.md](django-backend/API_KEYS.md) for every setting and provider key. `.env` is ignored by Git. Never put secrets in README files, frontend source, or a `VITE_*` variable.

The frontend reads its optional **public** `VITE_API_URL` setting from this same file at build time; only `VITE_*` values enter the browser bundle. Leave it empty for same-origin hosting. A separately hosted website can set it to `https://api.your-domain.com` and list the website in `CLIENT_ORIGINS`.

## Daily workflow

1. Website callbacks, quote requests and booking enquiries arrive in **Leads & CRM**, each with a randomly generated unique six-digit reference. Agents can assign ownership, change status, keep notes and search/filter clients.
2. Save **Passport details** for every traveller. Document numbers, nationality, birth/expiry dates remain staff-only.
3. Search one-way, round-trip or multi-city tickets. Select a current priced fare; its flight information fills an editable itinerary. Complete and verify any missing return flights, terminals or provider details.
4. Add checked/cabin/personal baggage allowances and the agent's **private profit**. The server computes the total from the stored fare, an explicit exchange rate for UZS if applicable, and profit. Only the final total is sent to the client.
5. Generate a long private `/checkout/<token>` link. The client sees their Lead ID, flight details, passport names, fare conditions and total in Uzbek, Russian or English. Billing contact names must match a saved passport passenger on the server. Revoke/recreate a link to change an existing offer.
6. Manage the website's published offer cards, images and subscribers in the same workspace. Subscriber CSV export requires the appropriate permission. The newsletter stores opt-ins; it does not send campaigns.
7. Use the Telegram inbox to read bot messages, link a chat to a verified client and queue replies. Run `python manage.py telegram_worker` as a separate supervised process for notifications/replies. Webhooks are configured from **Integrations** after the public HTTPS URL and secrets are set.

The CRM also retains the old protected booking and saved-search records. Managers can edit website content and inspect the audit log; only a superuser can create/deactivate staff. Agents can change their own password in **My account**.

## Migrating existing Strapi data

See [docs/MIGRATION.md](docs/MIGRATION.md). The repeatable read-only importer preserves six-digit references, passport JSON, existing checkout tokens/expiry/revocation, quote relationships, subscribers, offer media and Telegram history/delivery state. Run a dry-run before importing a copy of your production SQLite database and uploads. Staff accounts/passwords must be created in Django; Strapi password hashes and JWT secrets are not reused.

The local database supplied in this workspace contained no client/content records. The importer is covered by populated fixtures; it must still be run against your actual hosted database during cutover.

## Checks and deployment

```sh
# Repository root: frontend regression checks and production build
npm test
npm run build

# django-backend, activated Python environment
python manage.py test travel --settings=config.test_settings
python manage.py check
python manage.py makemigrations --check --dry-run
python manage.py collectstatic --noinput
```

See [django-backend/README.md](django-backend/README.md) for API routes, production deployment, Docker/PostgreSQL and permission details. [docs/BACKEND_ANALYSIS.md](docs/BACKEND_ANALYSIS.md) maps the previous Strapi functions to their Django replacements.

**Payments:** the existing project had checkout offers and billing-contact storage, not a completed CLICK integration. This migration preserves that behavior: no fake payment success, no card collection, no ticket issuance. Live CLICK payments require the complete merchant configuration and a verified callback implementation before enabling a pay button.
