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
