# Ipak Yo‘li payment integration — implementation and handover report

## Readiness: foundation implemented; bank connection unavailable

**Neither sandbox nor live bank payments are operational.** No official merchant API specification was supplied or present in the repository. The account, Merchant ID and credentials described by the owner do not establish the bank protocol. No endpoints, request field names, authentication methods or webhook signature algorithms were invented.

`travel/payments/provider.py` contains an explicitly unimplemented `IpakProvider`. Its `available()` is always false, even when credentials and `IPAK_PAYMENT_MODE=production` are set. Creation/webhook/verification return unavailable rather than simulating payment. Automated tests use a patched in-memory fake provider only. No real payment, refund, webhook registration or production deployment was attempted.

## Existing architecture inspected

- React 18 + Vite, React Router, Tailwind and existing premium off-white/gold checkout CSS. Public routes include Home, Business Class, About, Search Results and private `/checkout/:token` pages. Existing language context supports Uzbek, Russian and English.
- Django 5.2, one existing `travel` application, Django `auth.User` with staff flags/groups/permissions and CSRF-protected CRM sessions. CRM uses the existing configurable root or `/office/`, not a new authentication system.
- Database selection is through `dj_database_url` and `DATABASE_URL`; default is SQLite (`data/db.sqlite3`), PostgreSQL is supported by deployment dependencies/configuration. Production engine/data were not inspected or changed. Tests use isolated SQLite.
- Leads hold passenger/travel information. FareQuote feeds agent-created Checkout snapshots. Checkout already stores immutable server-calculated integer minor units, currency, private link token/hash, expiration, billing contact and **private agent pricing/profit**. Checkout is the payment order in this implementation. Existing Booking records have no checkout relationship; no speculative customer/booking matching or rewriting was added.
- Existing `payment_method` legacy lead data is retained; CLICK variables were reserved, with no working card processor. Checkout payments were previously always disabled.
- Existing environment loader, CORS, Django CSRF/session middleware, capability links, rate buckets, private response headers, cPanel/Passenger deployment and optional Docker/PostgreSQL configuration are retained. Proxy/web server configuration is unchanged.

## Implemented backend

- Additive migration `0006_checkout_payment_status_payment_paymentevent_and_more` adds `Checkout.payment_status` (default unpaid) and Payment, PaymentEvent and PaymentNotice tables. Existing leads/passports/checkouts remain intact.
- Payment has a UUID, a persisted sandbox/production mode, order/request references, immutable amount/currency snapshot, unique optional bank transaction reference, hosted URL/session expiry, verification/payment timestamps, payment status and separate manual issuance status.
- Uniqueness constraints prevent duplicate request processing and more than one creating/pending/unknown/succeeded payment per checkout. Bank create requests must eventually use the immutable payment UUID as the merchant idempotency reference.
- Server checkout pricing is authoritative. Create only accepts `requestId` and `termsAccepted`; supplied amount/currency/order/card fields are rejected. Saved billing and accepted terms are required. Profit remains private; the client sees the agreed all-inclusive total. There is no separately agreed fee breakdown in the existing order schema, so no fee or profit breakdown was fabricated.
- Atomic local updates and lock ordering protect status transitions. Bank calls take place outside database locks. A timeout/malformed response becomes **unknown**, blocking blind new charges until reconciled. Browser retries reuse their request reference.
- Only `apply_verified()` can set paid. It checks the merchant order UUID, exact amount/currency, immutable checkout pricing and bank reference from a normalized bank API lookup. Redirects and webhook status claims alone cannot mark paid. Confirmed success never downgrades on delayed failure/pending messages.
- Authenticated notification adapter contract, bounded raw webhook body, hashed replay IDs and idempotent transaction history. Duplicate events cannot update another order. The final adapter must verify the bank's actual signature/merchant/timestamp/replay protocol before returning a normalized notification. **Actual cryptographic verification is not implemented without those rules.**
- Local session expiration removes the hosted payment URL, but does not prove the bank session unpaid. It remains blocked until official lookup confirms expired/failed/cancelled. Late verified success is retained even after checkout expiry/revocation; private access to revoked/deleted-lead links remains denied.
- `reconcile_payments` performs status-only reconciliation for pending/creating/unknown payments (or one explicit UUID). It fails before any request with the unimplemented adapter. No cron/worker is started automatically.
- Audits/history contain internal references, status and timestamps; raw bank payloads/card credentials are not stored. No refund endpoint is enabled; refunds require documented bank support and separately reviewed authorization/idempotency rules.

## Routes and authorization

| Route | Purpose | Authorization |
|---|---|---|
| `POST /api/payments/create/` | Initiate/reuse order payment | `Authorization: Bearer <private-checkout-token>` |
| `GET /api/payments/status/<uuid>/` | Read persisted verified/local state | Same order's Bearer capability |
| `POST /api/payments/status/<uuid>/verify/` | Official bank status lookup through adapter | Same capability; rate limited |
| `POST /api/payments/webhook/` | Bank notification + independent status lookup | Bank verification adapter; unavailable today |
| Existing CRM `?section=payments` | Records, verification, manual issuance | Staff session + permissions; writes require CSRF |

Public payment writes deliberately ignore cookie/session authentication and require a non-simple Bearer Authorization header; CORS remains restricted to configured frontend origins. A UUID or browser query parameter grants no access. Existing checkout-link capability design is reused; do not share links publicly. Payment/checkout responses are private/no-store/noindex with no-referrer. Tokens/credentials must also be redacted in infrastructure access logs; no proxy config was changed here.

Hosted URL validation requires HTTPS, no userinfo/fragment/control characters, and an exact server-side origin allowlist. Browser code adds an HTTPS sanity check. The actual bank transport must use HTTPS, verified TLS, bounded timeouts, sanitized errors and no automatic redirect following.

## React checkout and result pages

- Reuses the existing booking/passenger/itinerary summary, billing form, fare terms and gold/off-white styling. Agent payment instructions are preserved. No PAN, CVV or card-authentication inputs are added.
- Pay button remains disabled until server capabilities are enabled, billing is saved and terms are accepted. Supported methods are rendered only from the verified provider capabilities; Uzcard/Humo/Visa/Mastercard support is not assumed.
- Keeps idempotency references and private payment access in per-tab `sessionStorage`, never in bank return URLs. Successful create hands off to the bank-hosted URL. Uncertain results use a status page instead of encouraging another charge.
- `/payment/success`, `/payment/failed`, `/payment/pending`, `/payment/cancelled` all use the same backend-authoritative result component. The URL path cannot select the displayed result. Confirmed payment requires stored paid/verified timestamps. Missing per-tab access shows an unverified message; the original active checkout can restore access via its status link.
- A receipt/status link is available on a checkout that has a payment. Closing a browser tab clears the per-tab receipt capability. Never embed a private checkout token into a bank return/query parameter.
- Uzbek, Russian and English text; mobile and desktop layouts. Payment confirmation explicitly says ticket issuance is a separate manual step.

## CRM behavior

- New Payments navigation section requires `travel.view_payment`; records show checkout/order ID, customer/lead, amount, currency, provider, payment status, bank reference, paid timestamp, issuance state and transaction history.
- Recent payments and in-app confirmation notices appear on Overview for authorized staff. Each existing active staff account with payment-view permission gets one persisted notice on first confirmation. No external emails/Telegram messages are sent.
- Confirmation marks Checkout paid and Payment ready for **manual** issuance. Only `travel.issue_paid_ticket` can mark issued, with explicit `ISSUED` form confirmation after actual external ticket issuance. This action records issuance; it does not call an airline API.
- Managers receive payment permissions through the existing role bootstrap. Agents receive read-only payment access; reconcile/issuance remain separate permissions. New staff can still see the authorized recent-payments list even if they joined after an earlier notice.

## Environment — one existing backend `.env`

Add placeholders from `django-backend/.env.example` to the existing private `django-backend/.env`; do not replace that file or change unrelated keys:

```env
IPAK_MERCHANT_ID=
IPAK_API_KEY=
IPAK_API_BASE_URL=
IPAK_WEBHOOK_SECRET=
IPAK_PAYMENT_MODE=sandbox
IPAK_HOSTED_CHECKOUT_ORIGINS=
```

These names are internal configuration, **not confirmed bank API field names**. `IPAK_HOSTED_CHECKOUT_ORIGINS` is comma-separated exact HTTPS origins, with no wildcard or path. Each payment retains its original mode and cannot be reconciled using the other mode. Keep sandbox and production credentials in separate deployment environments/private `.env` files; do not mix accounts or point tests at live credentials. Public website/backend origins continue to use existing `PUBLIC_WEBSITE_URL` and `PUBLIC_BACKEND_URL`. No secrets belong in `VITE_*`, React, Git, screenshots or logs. Credentials alone do not activate the stub.

## Required bank information

1. Official merchant API specification/version, sandbox endpoint and test credentials/cards.
2. Hosted checkout create/status/cancel/expiry APIs; authentication, request signing and merchant/order/idempotency semantics.
3. Server notification signature algorithm, canonical raw bytes/headers, timestamp window, unique event ID/retry behavior, acknowledgment requirements, merchant binding and key rotation procedures.
4. Supported card schemes and currencies under this exact merchant agreement, minor-unit conventions, settlement/foreign-exchange rules and any bank fees.
5. Exact allowed hosted checkout/return origins, URL lifetimes, test scenarios, production onboarding/IP restrictions and TLS requirements.
6. Reliable status lookup by immutable merchant order reference after an uncertain create. If unsupported, a documented bank-side reconciliation/manual-review procedure is required before retrying.
7. Refund/partial-refund support, authorization requirements and merchant-agreement approval. Refunds stay disabled until separately implemented and tested.

After those are supplied, implement the isolated adapter, add official signed webhook fixtures and sandbox contract tests, verify currency/method capabilities and complete bank certification. Do not set `implemented=True` based on credentials alone.

## Validation and limits

- Automated backend payment tests mock the bank boundary: successful/failed/pending/cancelled/expired, duplicate notification/initiation, invalid authentication, incorrect order, pricing manipulation, bank timeout/uncertain creation, lookup failure, amount/currency/reference mismatch, cross-order replay, permissions, CSRF, CRM paid/issuance sync, notices, expiry/revocation and unavailable/refund behavior.
- Frontend unit tests cover confirmed-only presentation and hosted URL/UUID validation. Browser checks use API/font fixtures for desktop/mobile checkout gating, payment handoff, all result states, forged-success URLs and missing capabilities. They are **not** tests of Ipak Yo‘li's cryptography or live bank services.
- Migration apply/reverse was checked against existing lead/checkout fixtures in isolated in-memory SQLite. Production/PostgreSQL concurrency, real bank signatures, actual settlement, delivery/retries, provider quotas and live proxy behavior remain unverified.
- The repository has no configured lint script. Vite build, Django system checks, Python test imports, test suites and Git whitespace checks are used; no lint result is invented.

See `IPAK_PAYMENT_REPORT.md` for final run results and the source-file inventory.

## Deployment after owner approval only

1. Review this branch/commit and the bank-readiness limitation. Deploying the unavailable foundation is different from approving live money movement.
2. Use the existing [Namecheap backup/deployment runbook](NAMECHEAP_DEPLOYMENT.md). Record the actual database engine/path, back up the database/media/config privately, verify recovery and retain the previous release. Never copy the cloud SQLite fixture/database or `.env` into production.
3. In the backend virtualenv, review `python manage.py migrate --plan`, then apply `python manage.py migrate` only after approval. Run `python manage.py bootstrap_roles`, `python manage.py check`, and `python manage.py collectstatic --noinput` through the existing deployment process. No user/password resets or database deletion are required.
4. Keep sandbox mode, actual bank adapter unavailable, and existing HTTPS/CORS/CSRF/proxy/service configuration. Run the existing backend restart procedure. Do not overwrite Nginx/Apache/Passenger configurations or production secrets.
5. Frontend: `npm ci`, `npm test`, `npm run build`; deploy reviewed `dist/` contents using the existing hosting procedure. Retain current media and `.htaccess` rules. Confirm direct payment-result routes fall back to the SPA and payment APIs remain no-store.
6. Smoke-test with non-sensitive fixture orders in a separate sandbox environment. Confirm ordinary leads, passports, checkout, CRM/login and languages still work. Payment controls should say unavailable with the current adapter.
7. Only after official adapter implementation, bank sandbox certification and a **separate explicit owner approval**, configure live credentials, bank callback registration, exact HTTPS origins, reconciliation scheduling and payment monitoring. No live activation is included in this change.

### Rollback

- Stop new initiation and scheduled bank operations; retain webhook/status/reconciliation capability for any existing in-flight payments once an actual provider is introduced. Disabling a button cannot cancel a bank transaction.
- Revert frontend/backend application code through the existing reviewed release process and restore its static assets. Leave additive payment tables and the defaulted checkout field in place; old code can ignore them.
- **Do not reverse migration 0006 if any real payment/event/notice rows exist.** Reversal deletes financial history. Do not restore an older DB over newer payments. Reconcile financial records and plan a forward fix instead.
- A schema reversal is only for an empty disposable/sandbox database or a separately approved, verified empty payment installation. The isolated rollback test does not authorize dropping live financial tables.
