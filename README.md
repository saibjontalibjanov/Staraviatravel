# Staravia Travel - React Application

A modern, responsive travel booking website built with React, Vite, and Tailwind CSS. Converted from static HTML to a dynamic React application with full routing and state management.

## 🚀 Features

- **Modern React Architecture**: Built with React 18 and functional components with hooks
- **Fast Development**: Powered by Vite for lightning-fast HMR (Hot Module Replacement)
- **Responsive Design**: Fully responsive layout that works on all devices
- **Interactive UI**: 
  - Dynamic flight search form with date pickers and passenger selection
  - Mobile-friendly navigation menu
  - Language selector (English, Russian, Uzbek)
  - Interactive filters for flight search results
  - Smooth scrolling navigation
- **Routing**: Client-side routing with React Router DOM
- **Styling**: Tailwind CSS for utility-first styling with custom theme

## 📁 Project Structure

```
staravia-react/
├── public/                    # Static assets
│   ├── pictures/             # Images organized by category
│   │   ├── hot-deals-pictures/
│   │   ├── icons/
│   │   ├── nav-pictures/
│   │   ├── popup-pictures/
│   │   └── Trust-section-pictures/
│   ├── STARAVIA.png          # Logo
│   └── Cover800x312_darken_3mb.mp4  # Hero video
├── src/
│   ├── components/           # Reusable React components
│   │   ├── TopBar.jsx       # Top navigation bar with features
│   │   ├── Hero.jsx         # Hero section with video background
│   │   ├── SearchForm.jsx   # Flight search form
│   │   └── TrustBar.jsx     # Trust badges section
│   ├── pages/               # Page components
│   │   ├── Home.jsx         # Main landing page
│   │   └── SearchResults.jsx # Flight search results page
│   ├── App.jsx              # Main app component with routing
│   ├── main.jsx             # Application entry point
│   └── index.css            # Global styles and Tailwind imports
├── index.html               # HTML template
├── package.json             # Dependencies and scripts
├── tailwind.config.js       # Tailwind configuration
├── postcss.config.js        # PostCSS configuration
└── vite.config.js           # Vite configuration

```

## 🛠️ Technologies Used

- **React 18.3.1** - UI library
- **Vite 5.1.4** - Build tool and dev server
- **React Router DOM 6.22.0** - Client-side routing
- **Tailwind CSS 3.4.1** - Utility-first CSS framework
- **PostCSS & Autoprefixer** - CSS processing

## 📦 Installation

1. **Navigate to the project directory**:
   ```bash
   cd staravia-react
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

## 🚀 Running the Application

### Development Mode
Start the development server with hot module replacement:
```bash
npm run dev
```
The application will be available at `http://localhost:3000`

### Production Build
Create an optimized production build:
```bash
npm run build
```

### Preview Production Build
Preview the production build locally:
```bash
npm run preview
```

## 🎨 Custom Theme

The application uses a custom Tailwind theme with brand colors:

- **Gold**: `#D4A445` (primary brand color)
- **Gold Soft**: `#E8C26A`
- **Gold Dark**: `#B78434`
- **Ink**: `#23201C` (text color)
- **Paper**: `#Fdfcfb` (background)
- **Surface**: `#F8F9FA`

Custom fonts:
- **Display**: Playfair Display (serif)
- **Sans**: Poppins (sans-serif)

## 🧩 Key Components

### TopBar
- Sticky navigation bar with logo
- Feature highlights (Accredited Agency, 24/7 Service, Secure Payment)
- Language selector with flag icons
- Phone contact button

### Hero
- Full-screen video background
- Main navigation menu
- Flight search form
- Alliance logos (Star Alliance, SkyTeam, Oneworld)
- Trust badges

### SearchForm
- Trip type toggle (Round-Trip / One-Way)
- Origin and destination inputs with datalist
- Date pickers
- Passenger and cabin class selector
- Form validation and submission

### SearchResults
- Flight search summary
- Filter sidebar (price range, stops, airlines, departure times)
- Flight cards with detailed information
- Sorting options (cheapest, fastest, recommended)

## 📱 Responsive Features

- Mobile-friendly hamburger menu
- Collapsible filters on mobile
- Responsive grid layouts
- Touch-friendly interactive elements
- Optimized images and video

## 🔧 Configuration

### Vite Configuration
- React plugin enabled
- Dev server on port 3000
- Auto-open browser on start

### Tailwind Configuration
- Custom color palette
- Extended box shadows
- Custom font families
- Responsive breakpoints

## 🌐 Routes

- `/` - Home page (landing page with hero, deals, testimonials)
- `/search-results` - Flight search results page

## 📝 Notes

- All images are stored in the `/public/pictures` directory
- Video background is optimized for web (3MB)
- Flag icons loaded from CDN (flag-icons library)
- Google Fonts used for typography

## 🚀 Future Enhancements

- Add backend API integration for real flight data
- Implement user authentication
- Add booking and payment functionality
- Integrate with airline APIs
- Add more language translations
- Implement advanced filtering and sorting
- Add user reviews and ratings system

## 📞 Contact

Phone: +998 90 123 45 67
Website: [Staravia Travel](/)

---

Built with ❤️ using React and Vite
