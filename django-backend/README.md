# Django backend and Staravia Workspace

Python 3.12+ · Django 5.2 LTS · SQLite locally / PostgreSQL in production. This is the active backend. There is no dependency on Strapi, its Node packages, admin build or JWT keys.

## Setup

Follow the [root setup guide](../README.md). All credentials/settings are in [one `.env` file](API_KEYS.md). Run migrations, `bootstrap_roles`, and `createsuperuser` before first use. No default admin password or public staff registration exists.

**Admin + CRM:** `/office/` · **Login:** `/office/login/` · **Logout:** POST `/office/logout/`. All sections share the same workspace URL with a `section` query parameter. Old `/admin` and `/admin/client=123456` links redirect to the protected workspace so existing bot notifications remain useful.

Agents can manage leads, passport records, current fare search, checkouts, private profit, and permitted Telegram conversations. Managers additionally manage website content, subscribers, integration settings and audit records. Only superusers manage staff accounts. Server permission checks apply to both HTML and JSON operations; hiding a menu is not the permission boundary. Staff writes require CSRF tokens. The backend stores no raw card details.

## API compatibility with the React website

| Route | Method / response |
| --- | --- |
| `/api/airports` | GET local airport catalogue array; no external catalogue dependency. |
| `/api/flights` | GET normalized Google Flights search result: `flights`, `search`, `currency`, `searchedAt`. Server-only provider key and timeout. |
| `/api/hot-flights` | GET published cards in `{data:[...]}` with media URLs. Draft queries cannot reveal unpublished records. |
| `/api/hot-flights/<id>` | GET a published card only. |
| `/api/leads` | POST `{data:{...}}`; 201 with `{data:{clientId,createdAt}}`. No public list/edit. Random unique six-digit references; whitelist validation. |
| `/api/newsletter` | POST `{data:{email,language}}`; idempotent `{subscribed:true}`. No public list. |
| `/api/checkouts/<token>` | GET active offer snapshot and final total. No internal fare/profit, passport document fields or stored billing contacts. |
| `/api/checkouts/<token>/billing` | POST validated contact details; full name must match a passport snapshot name. Does not charge or mark paid. |
| `/api/telegram/webhook` | POST verified Telegram bot updates; secret header and update deduplication. |
| `/api/bookings`, `/api/search-results` | GET/POST legacy records and GET/PUT/DELETE `/api/<kind>/<id>`; requires an authenticated, appropriately permitted staff session plus CSRF on writes. |
| `/office/api/...` | Session-authenticated, CSRF-protected staff operations used by the new workspace. |
| `/_health` | 204 process health check, no private information. |

Errors use `{error:{status,message}}` with sanitized provider failures. Public JSON submissions do not rely on staff cookies. Staff login/operations and private checkout responses use no-store and disallow indexing. Client checkout pages send no referrer; staff pages permit same-origin referrers for Django CSRF and block external referrers. Use ingress request limits as well as the shared database rate buckets. Set trusted proxy IP handling only if the proxy strips/overwrites incoming headers.

## Telegram worker

```sh
python manage.py telegram_worker
# For a scheduled one-shot run:
python manage.py telegram_worker --once
```

Run one or more supervised worker processes; messages are claimed with a conditional database update, preventing two workers from sending the same row. An interrupted/ambiguous send becomes `unknown`, requiring an explicit checked retry. Telegram rate-limit responses are backed off. `sent` is recorded only after Telegram acknowledges a message ID. The bot inbox supports text/captions and attachment labels, not downloading arbitrary attachments or importing personal account history. Webhook setup/check and replies are explicit staff actions; startup does not silently contact recipients.

## Production (single origin)

1. Configure the production values in `.env`: a strong secret, `DJANGO_DEBUG=False`, HTTPS, exact allowed hosts/origins, database URL and provider keys.
2. Build the React website at the repository root with `npm ci && npm run build`.
3. Run `python manage.py migrate`, `python manage.py bootstrap_roles`, `python manage.py collectstatic --noinput` and create the initial superuser interactively.
4. Run `gunicorn config.wsgi:application --bind 127.0.0.1:8000 --workers 3 --timeout 60` under a process supervisor, and run `telegram_worker` separately.
5. Put an HTTPS reverse proxy in front of Django. Forward `/api/`, `/office/`, and application requests to Django; serve `/uploads/` from the persistent media directory. WhiteNoise serves collected workspace assets and the built frontend assets from `dist/`. The Django fallback serves `dist/index.html` for React routes including `/about-us` and `/checkout/<token>`.
6. Only enable `TRUST_PROXY_HTTPS` / `TRUST_PROXY_CLIENT_IP` if the trusted proxy overwrites the corresponding headers and the Django port is not publicly exposed. Preserve media and database backups across deployments.
7. Run `python manage.py check --deploy` using your production environment.

For separate frontend hosting, set `VITE_API_URL` in the same `.env` before building. Serve `/office/` directly on the backend's HTTPS origin, or proxy `/office/` and `/static/` to it. Public API CORS does not grant staff cookie access across arbitrary origins.

A multi-stage [Dockerfile](../Dockerfile) builds the frontend and Python image without copying `.env`, legacy Node packages, local databases or uploads. [compose.yaml](../compose.yaml) provides PostgreSQL, web and worker services; run `docker compose --env-file django-backend/.env up --build -d` after configuring a strong URL-safe `POSTGRES_PASSWORD`. The web port binds only to localhost; connect your HTTPS reverse proxy and persistent `/uploads/` serving before publishing. Create a superuser with `docker compose --env-file django-backend/.env exec web python manage.py createsuperuser`. Never use development DEBUG/cookie settings for a public deployment.

## Tests

```sh
python manage.py test travel --settings=config.test_settings
python manage.py check
python manage.py makemigrations --check --dry-run
```

Tests use an isolated SQLite database and mocked provider calls. Coverage includes public response compatibility, input validation, server permissions/CSRF, exact totals and private profit, passport-bound billing, trip connections, token expiry/revocation, Telegram idempotency/outbox state, every workspace section, and a populated legacy SQLite/media import. Browser checks exercise the actual staff UI and the existing frontend with local provider fixtures, not real payment or airline inventory.

See [migration instructions](../docs/MIGRATION.md) before transferring live data. Database migrations and the importer are included; an actual hosted cutover still needs your production database/media backups and hosting configuration.


If an enterprise/cloud build proxy uses a custom certificate authority, the Dockerfile accepts an optional BuildKit secret containing a **trusted CA bundle**: `docker build --secret id=build_ca,src=/path/to/trusted-ca-bundle.pem .`. Both npm and pip keep TLS verification enabled. The CA bundle is used only during installation and is not copied into the final image. Ordinary builds do not need this option.

### CRM layout and website content

Each lead keeps **Client checkout** on its main page. The top-right **All Client Records**, **Passenger Details**, and **Ticket Search** buttons open accessible dialogs; **PNR** opens the checkout/payment-information editor. Selecting a priced ticket closes search and fills the checkout preview. Save passports before generating a link. The preview is a draft until the PNR form saves a checkout snapshot. Online payment availability is unchanged.

New website and manually entered leads are assigned randomly to active staff accounts. Updating a lead keeps its existing owner. If there are no active staff accounts, the lead remains unassigned. Source, status, assignment, airline, quoted price and payment preference are no longer editable client-record fields. Website booking enquiries require acceptance of terms, without a payment preference. Historical database fields remain for migration compatibility.

The About page includes a photo-free review form immediately after the journey contact banner. **Testimonials** in the CRM navigation lists submissions as unpublished drafts; managers can edit, approve, unpublish or delete them. Public reviews show only the approved name, review, language and rating. Submission is limited to five requests per hour per client IP. Agents can view these records; managers manage publication.

**Website FAQs** manages questions, answers, ordering and publication in Uzbek, Russian and English. All three translations are required. Migration `0004` seeds nine starter questions once; subsequent staff edits are preserved. The website reads published FAQs in its selected language and approved reviews through `GET /api/faqs?language=uz` and `GET /api/testimonials`. Reviews are submitted through `POST /api/testimonials` with `{ "data": { "name": "…", "text": "…", "rating": 5, "language": "uz" } }`; public submissions cannot approve themselves.

After updating an existing installation, run `python manage.py migrate`, `python manage.py bootstrap_roles`, `python manage.py collectstatic --noinput`, rebuild the frontend, and restart the app. API keys remain in the same backend `.env`; these features require no additional keys.
