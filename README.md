# STARAVIA™ - Premium & Luxury Class Travel

A modern travel agency website built with **Vite + React + Tailwind CSS**, specializing in Business and First Class flight bookings.

## Tech Stack

- **React 18** - UI library
- **Vite 5** - Build tool & dev server
- **Tailwind CSS 3** - Utility-first CSS framework
- **React Router 6** - Client-side routing

## Getting Started

```bash
# Install dependencies
npm install

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
