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
