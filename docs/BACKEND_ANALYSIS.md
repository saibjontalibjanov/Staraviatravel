# Frontend/backend analysis and migration map

The public site is React 18/Vite 5 with Uzbek as the default language, Russian and English alternatives, and React routes `/`, `/about-us`, `/business-class`, `/search-results`, `/checkout/:token`. The homepage and About page share navigation/video assets. Frontend API calls are centralized through `src/lib/api.js`; media helpers resolve relative uploaded images.

| Existing Strapi function | Django replacement | Frontend connection |
| --- | --- | --- |
| Lead intake/lifecycle, six-digit IDs | `Lead`, `services/leads.py`, `validation.lead_input` | Existing callback, quote and booking forms POST `/api/leads`; response shape retained. |
| Lead sidebar, widget and detail editor | Custom green `/office/` dashboard + `section=leads` | Staff sessions, filtering, ownership/status/notes, private client records. |
| Private passport JSON | `Lead.passport_details`, guarded office API/editor | Checkout names are derived from saved passports; document fields never enter public checkout JSON. |
| SerpAPI flight service + local airport catalogue | `services/flights.py`, bundled airport JSON | Public and staff searches share normalized results, cabins, passenger counts and safe errors. |
| Short-lived provider fare quotes | `FareQuote` linked to lead | Staff chooses a fare; source price is stored server-side, not trusted from the client. |
| Checkout service and admin creator | `Checkout`, `services/checkouts.py` | Random token/hash, expiry/revocation, immutable snapshots, private profit, integer minor-unit totals and explicit UZS rate. |
| Public checkout and billing endpoint | Same public API route shapes | Existing three-language React checkout displays total, itinerary, baggage, lead ID and passport names. Billing contact is verified and saved, not charged. |
| Published/draft hot-flight cards and uploads | `HotFlight`, staff CMS and media storage | `/api/hot-flights` keeps `{data:[...]}` and media URL fields; unpublished rows stay private. |
| Newsletter subscribers | `NewsletterSubscriber` + manager CSV export | Validated normalized idempotent opt-in; no public list. |
| Telegram inbox, lead linking and configuration | Custom workspace inbox + permissioned API | Incoming secret-verified/deduplicated webhooks; text replies queued with submission IDs. |
| Telegram persistent outbox interval | Separate Django `telegram_worker` command | Atomic claims, 429 backoff, acknowledged delivery and explicitly retried uncertain sends. |
| Content Manager booking/search records | `Booking`, `SavedSearch`, workspace CRUD | Preserves protected legacy records; these are not public flight-search results. |
| Admin users and role permissions | Django users/groups and staff sessions | One unified custom UI, CSRF, staff login, Agents/Managers groups, superuser-only staff management. Old passwords are not copied. |
| Strapi environment/JWT configuration | `django-backend/.env` | New Django secret, same provider keys; no Strapi build or JWT dependency. |

The old backend's stock email/Cloud admin scaffolding was not connected to website functionality. The migrated app does not claim to send newsletters, receipts, payment confirmations or issue airline tickets. CLICK was discussed but not implemented in Strapi; that remains disabled pending a complete verified payment integration.

Strapi code is retained under `legacy/` only as an audit/rollback reference. The active build, development proxy, API services, worker, database migrations and admin UI all use Django. No active frontend test/import requires the archived Node backend.
