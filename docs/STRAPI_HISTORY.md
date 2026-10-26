# Archived Strapi history — not current setup

These notes describe the retired backend. Use the root README and `django-backend/README.md` for the current Django application.

# STARAVIA™ - Premium & Luxury Class Travel

A modern travel agency website built with **Vite + React + Tailwind CSS**, specializing in Business and First Class flight bookings.

## Tech Stack

- **React 18** - UI library
- **Vite 5** - Build tool & dev server
- **Tailwind CSS 3** - Utility-first CSS framework
- **React Router 6** - Client-side routing

## Getting Started

```bash
# Use Node 24 (see .nvmrc), then install the locked dependencies
npm ci

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── TopBar.jsx          # Sticky top navigation bar with logo, features, language selector
│   ├── Hero.jsx            # Hero section with video background, navbar, and search form
│   ├── SearchForm.jsx      # Flight search form with trip type, passengers, cabin class
│   ├── TrustBar.jsx        # Trust indicators bar (secure payment, 24/7 support, etc.)
│   ├── HotDeals.jsx        # Hot deals carousel section
│   ├── FAQ.jsx             # FAQ accordion section
│   ├── Footer.jsx          # Site footer with newsletter, links, social media
│   ├── FloatingButtons.jsx # Floating phone & scroll-to-top buttons
│   ├── PhonePopup.jsx      # Phone/callback popup modal
│   └── CookieBanner.jsx    # Cookie consent banner
├── pages/
│   ├── Home.jsx            # Main landing page (assembles all components)
│   └── SearchResults.jsx   # Flight search results page
├── App.jsx                 # Router configuration
├── main.jsx                # App entry point
└── index.css               # Global styles & Tailwind imports
public/
├── pictures/               # All static images
├── Cover800x312_darken_3mb.mp4  # Hero background video
├── STARAVIA.png            # Logo
└── STARAVIA1.png           # Alternate logo
```

## Features

- Responsive design (mobile-first)
- Video hero background
- Interactive flight search form
- Hot deals carousel
- Image carousels with navigation
- Testimonials carousel
- FAQ accordion
- Phone popup with QR code and callback request
- Cookie consent banner
- Language selector (EN, RU, UZ)
- Scroll-to-top button
- Search results page with filters

## Deployment

Build the project and serve the `dist` folder:

```bash
npm run build
```

Deploy to any static hosting (Vercel, Netlify, GitHub Pages, etc.)

## Website languages

Uzbek (`uz`) is the default. The navbar selector also offers Russian (`ru`) and English (`en`). The choice is shared across routes and stored locally as `staravia.language`; if storage is unavailable, switching still works for the current visit. Calendar labels follow the selected locale, while search parameters and ISO dates keep their original values.

Static interface translations live in `src/i18n/messages.json`. Use `useLanguage()` from `src/i18n/LanguageContext.jsx` and `t('English source text')` for new copy, adding an entry for each supported language. Airline names, airport data, and promotional content returned by Strapi retain the language supplied by the backend.

Run the language checks with Node.js 24:

```bash
node --test tests/language.test.js
npm run build
```

## Client applications and Leads

The callback popup, Business Class quote form, and flight booking popup send applications to `POST /api/leads`. Strapi saves a Lead and returns a unique, randomly generated six-digit `clientId`. The website displays that reference only after a successful save. Failed submissions preserve the form for retry; submit controls are disabled while a request is pending.

Run Strapi on port 1337 (`cd strapi-backend && npm run develop`) and Vite on port 3000 (`npm run dev` from the repository root). Vite forwards `/api/leads` to Strapi. For a separately deployed website, set the frontend's build-time `VITE_API_URL` to the Strapi origin and set Strapi's `CLIENT_ORIGINS` to the website origin(s). Alternatively, forward `/api/leads` through the same-origin web server. Rebuild the frontend after changing `VITE_API_URL`.

After rebuilding/restarting Strapi, sign in to the admin panel:

- **Leads** appears in the sidebar and as a homepage widget showing the latest applications. If an administrator has a saved dashboard layout, use **Add Widget → Leads** to add it to that layout.
- Client links use `/admin/client=123456`. They require an admin session and Content Manager read permission for Leads. The six-digit number is a reference, not an authentication credential.
- The Leads page supports search, status filtering, pagination, and automatic refresh every 15 seconds. Details include contact information, source, language, submission date, and any flight details/payment preference supplied.
- Use **Edit status and notes in Content Manager** to update an application. Statuses are `new`, `contacted`, `qualified`, and `closed`; the client ID remains unchanged.
- Give staff roles read permission for **Leads**, and update permission if they need to manage statuses/notes, under Strapi **Settings → Administration panel → Roles**. Super Admin already has access.

The public endpoint accepts `{ "data": { "source": "callback", "phone": "+998901234567", "language": "uz" } }`. Sources are `callback`, `quote`, and `booking`. Quotes/bookings also require `firstName`, `lastName`, and `email`; bookings require `paymentMethod` and `termsAccepted: true`. Flight prices are client-supplied quotes, not payment records. Internal status, notes, and IDs cannot be supplied by the public caller. There is no public endpoint to list or read client contact details.

Basic intake throttling allows 20 attempts per IP per 10 minutes in each Strapi process. Configure deployment ingress rate limits for multi-instance hosting and ensure the proxy passes client addresses correctly.

Validation:

```bash
node --test tests/language.test.js strapi-backend/tests/leads.test.js
npm run build
cd strapi-backend && npm run build
```

## Agent ticket search

Each Lead detail page (`/admin/client=123456`) includes **Search tickets**, prefilled from that application's airports, departure/return dates, adult passenger count, and cabin class. New website bookings save these fields explicitly. Callback and quote applications include valid itinerary details from the visitor's current search, when available. Older leads can prefill airport codes from their route text; agents enter any dates or other details that were never collected. Editing the search form does not change the saved application.

Agents can also open **Ticket Search** in the admin sidebar at `/admin/plugins/ticket-search` for an independent search. Airport-code suggestions use the repository's airport catalogue. Searches support one-way and round-trip itineraries, 1–9 adults, and Economy, Premium Economy, Business, or First Class. Results show the provider's USD price, flight legs, airlines, departure/arrival times, duration, and stops.

Configure `SERPAPI_KEY` securely **on the Strapi server**, using the existing SerpAPI Google Flights account. Do not put it in frontend `VITE_*` variables. Strapi needs HTTPS access to `serpapi.com`. Without a key, search shows a configuration error; there are no sample fares in the shipped application.

Super Admin has search access automatically. For other agent roles, grant **Search tickets** under the role's **Settings → Ticket Search** permissions, plus Content Manager **Leads → Read** to access lead details. Both airport suggestions and searches require an authenticated admin with search permission. The website and admin share the same backend provider integration.

Round-trip provider responses initially show outbound options. Agents must confirm return selection, the full fare, availability, and fare rules with the provider before quoting or issuing. This feature searches offers; it does not issue tickets or collect payment.

After pulling updates, rebuild/restart Strapi and rebuild the frontend. Run checks with:

```bash
node --test tests/*.test.js strapi-backend/tests/*.test.js
```

## Telegram in Strapi

The **Telegram** sidebar page (`/admin/plugins/telegram`) provides a shared bot inbox, text replies, verified lead links, and delivery status. Each new website application queues a lead notification with its six-digit client ID and an authenticated admin link. Telegram errors do not prevent the lead itself from being saved.

Configure these values securely on the Strapi server (never in frontend variables or committed `.env` files):

| Variable | Purpose |
| --- | --- |
| `TELEGRAM_BOT_TOKEN` | Bot token issued by Telegram's BotFather. |
| `TELEGRAM_WEBHOOK_SECRET` | A random 16–256 character secret containing letters, digits, `_` or `-`. Telegram sends this in its webhook authentication header. |
| `PUBLIC_STRAPI_URL` | Public HTTPS Strapi origin, for example `https://api.example.com`; used for the webhook and protected lead links. |
| `TELEGRAM_LEADS_CHAT_ID` | Numeric private/group chat ID that should receive lead notifications. Optional while connecting the inbox. |

Rebuild/restart Strapi after pulling this feature. Super Admin has access automatically. For staff roles, grant **Settings → Telegram → Read conversations** and, where needed, **Reply and link leads**. Only trusted administrators need **Configure webhook**. Linking conversations also requires Content Manager read permission for Leads.

In **Telegram → Connection**, click **Connect webhook**, then send a message to the bot to verify incoming delivery. Strapi must be publicly reachable over HTTPS at `/api/telegram/webhook`, and outbound HTTPS access to `api.telegram.org` must be allowed. Telegram supports one webhook per bot; connecting switches that bot's webhook to this Strapi server. **Check webhook** reports whether it points to this server and whether Telegram reports delivery errors.

A user must start the bot before it can send them private messages. For a notification group, add the bot to that group with permission to send messages. Send a message that Telegram delivers to the bot; the inbox displays the numeric chat ID. Set that ID as `TELEGRAM_LEADS_CHAT_ID` and restart Strapi to enable notifications for subsequent website applications. Group privacy settings determine which group messages Telegram delivers to the bot.

The inbox stores messages received after the webhook is connected; it does not import personal Telegram accounts or older account history. Text replies are supported. Attachments are represented by their type and caption; files are not downloaded. Agents can search conversations, load older messages, and manually link a conversation to a lead after verifying the client's identity. A six-digit reference alone is not identity verification.

Outgoing messages are saved in a database outbox and processed every three seconds. **Queued** means stored, **Sent** means Telegram acknowledged delivery, and failures remain visible. Incoming update IDs and outgoing submission IDs prevent duplicates. Rate-limited sends retry automatically. If a connection timeout leaves delivery uncertain, the message becomes **Delivery unconfirmed** and is not resent automatically. Check the Telegram chat before using **Retry delivery**; unconfirmed retries require explicit confirmation. New lead notifications are queued only when a bot token and notification destination are configured.

Run the backend and frontend checks with `node --test tests/*.test.js strapi-backend/tests/*.test.js`. End-to-end validation used a local Telegram API fixture and an isolated SQLite database; no real recipients were contacted.

## Website API and subscriptions

All website API calls use the build-time `VITE_API_URL` origin, or same-origin `/api` when it is empty. Vite proxies `/api` and `/uploads` to local Strapi during development. Production hosting must forward those paths to Strapi or provide a separate `VITE_API_URL` and allow the website origin in `CLIENT_ORIGINS`.

The public airport picker uses the same bundled airport catalogue as agent search. Published hot-flight cards are publicly readable; draft offers remain private, and content edits require authorization. Search requires actual airport codes and valid dates; missing fares are displayed as unavailable, and no old price is invented.

Newsletter submissions are stored as **Newsletter subscribers** in Strapi. `POST /api/newsletter` validates and normalizes email addresses, is idempotent, and exposes no public subscriber list. This stores opt-in subscriptions; it does not send a mailing campaign. Footer entries without configured destinations are marked as coming soon instead of linking to `#`.

### Private checkout pages for Leads

Open **Leads → Client → Client checkout pages** in Strapi. Each lead has a **Passport Details** editor, ticket search and checkout creator. Save the passport records, select **Use this fare for checkout** on a priced search result, review the itinerary, set a private profit, enter actual fare/refund conditions in the client's language, and select **Create checkout & generate link**. Copy or preview the long private URL and share it with that client. Creation does not send any message automatically.

Set `PUBLIC_WEBSITE_URL` on the **Strapi server** to the website's HTTPS origin, for example `https://your-website.example` (no path, query or credentials). `http://localhost:3000` is allowed for local development. The frontend serves `/checkout/<43-character-random-token>`; deploy with the same SPA fallback used for `/about-us` and configure the existing `/api` proxy or `VITE_API_URL`. Restrict Strapi CORS with `CLIENT_ORIGINS` if using separate origins. Rebuild/restart Strapi after deployment so its checkout schema and admin bundle are updated.

Admin roles require **Checkout → Create and revoke checkout links** and Content Manager read access to **Leads**. Super Admin receives the custom action automatically. Checkout storage has no public collection/list/write API; public operations read an active offer by its cryptographically random token and save a validated billing contact against that same active offer. The public response exposes an explicit booking snapshot, the six-digit client reference, passenger names/types, and the final total. It never returns passport numbers, dates of birth, passport expiry dates, nationality, stored billing contacts, internal notes, agent costs or profit. The private URL is a bearer credential: anyone holding it can view its booking. Server responses use `no-store`; the page disables indexing and sends no referrer. Keep checkout tokens out of analytics and restrict access to server/proxy access logs.

Created offers are snapshots, so edits to a lead do not silently change the client's price or conditions. Revoke an old link and create a new one to change an offer. The history shows up to the latest 100 offers per lead; revoked and expired links return the same unavailable response as unknown tokens. Repeated retries of a creation request use an idempotency reference to avoid duplicate offers. Deleting the associated lead makes the link unavailable.

The client page follows the supplied cream/gold checkout design and supports Uzbek, Russian and English. It initially uses the language chosen by the agent. Agent-written fare conditions remain in the language entered; they are not machine-translated. The total is the agent's final total in USD or UZS, without an invented currency conversion or tax breakdown.

**Payments are not connected.** This release presents the booking and fare terms, without collecting card details, reporting a paid status, issuing tickets or pretending to reserve inventory. The payment area explicitly explains its availability. A provider integration must verify the price server-side, create a hosted payment session, and verify signed payment webhooks before adding real payment/issuance behavior. No live payment provider was specified for this task.


#### Passport, itinerary and pricing workflow

1. In a lead, save **Passport Details** for every passenger: passport given names/surname, number, birth date, expiry, nationality, and adult/child/infant type. Names are derived from these saved fields, not the original enquiry name. Checkout and Lead-read permissions are required for passport access. Passport fields are hidden from generic Content Manager editing and public intake ignores them.
2. Search tickets for that lead. The search supports one-way, round-trip and multi-city (2–6 journeys). Select a priced fare with **Use this fare for checkout**. Strapi stores a short-lived, lead-scoped quote with the provider fare. Quotes expire after 30 minutes; search again if expired. Live provider calls require `SERPAPI_KEY`. Automated integration tests use local provider fixtures, not live airline inventory.
3. The selected fare fills the itinerary editor with the flight airports/cities, dates, local departure/arrival times, flight numbers, airline and class where returned by the provider. Agents can override these and the overall route title, choose the trip type, add/remove connecting flights, and add multi-city journeys. Missing information must be completed before checkout creation. Stops come from the actual segment count, and layover durations from consecutive arrivals/departures at the same connection airport. Individual flight duration is editable because airport times may be in different time zones. Round-trip returns must reverse the outbound endpoints; use multi-city for open-jaw itineraries. Google Flights can initially return only an outbound option for a round-trip or partial multi-city offer: agents must complete and verify every journey with the provider. This integration does not claim to book the fare or reserve inventory.
4. Use **Add checked baggage**, **Add cabin baggage**, or **Add personal item**, and specify the verified allowance and exactly whom/which flights it covers. No allowance is fabricated when the provider does not supply it.
5. Enter **Private profit** in the client currency. The server computes the total from the stored provider fare plus profit using integer minor units. USD is the provider currency; UZS requires an explicit agent-verified USD/UZS rate. The public response carries only the total, never cost/profit/source quote data. Agents must confirm that the fare and final total cover all saved passengers, journeys and baggage before generating a link; provider adult-count search results must be verified separately for children/infants. Client-facing payment instructions are editable separately: do not put internal pricing into this text.
6. On the client page, the booking badge shows the six-digit Lead ID. The itinerary includes flight times, dates, numbers, terminals where supplied, stops, layovers and seat classes. All passenger names come from the checkout's saved passport snapshot. Billing contact selects one of these names; the server rejects any different name. The billing form saves email, phone, country, city and address to the checkout without modifying pricing or charging a card. Agents can view submitted billing details in checkout history. No passport document identifiers or billing contact details are returned by the public GET endpoint.

Changing a lead's passports or a provider fare does not rewrite a previously shared offer. Revoke the old checkout and generate a new link to publish corrected names, itinerary, baggage or price. Existing older checkout links remain readable in their original format, but need to be recreated to gain passport-bound billing and detailed flight cards.


### Repairing an incomplete Strapi admin installation

If Vite reports `Could not resolve @strapi/admin/strapi-admin` and says `dist/admin/index.mjs` is missing, stop the Strapi process and run from the repository root:

```sh
git pull origin main
cd strapi-backend
npm run repair
npm run develop
```

Use Node 24 LTS (the repository includes `.nvmrc`; Node 20/22 are also supported). Run the commands inside **strapi-backend**, not the frontend folder. `repair` uses `npm ci --include=dev` with the committed lockfile and clears only generated backend caches/build output. It preserves `.env`, `.tmp/data.db`, custom database files and `public/uploads`. It refuses to run while the configured backend port is still in use. Do not run develop and production start from the same checkout at the same time.

The backend directly pins `@strapi/admin` to the same version as `@strapi/strapi`, and explicitly declares its custom admin icon dependency. `npm run doctor` checks matching package versions and both ESM and CommonJS admin entry files, including a nested admin copy under Strapi. This check runs before development, build and production start. It reports a broken install before the Vite/esbuild failure; it does not mark the missing module external or bypass the admin UI.

For production, use `npm run build` followed by `npm start` after repairing. Repair intentionally removes the old admin build, so production requires a fresh build. `npm test` at the repository root runs the frontend and backend regression tests; backend-only tests can be run with `npm test` inside strapi-backend.
