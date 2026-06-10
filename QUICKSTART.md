# Quick Start Guide - Staravia Travel React App

## 🎯 Get Started in 3 Steps

### Step 1: Install Dependencies
```bash
cd staravia-react
npm install
```

This will install all required packages:
- React and React DOM
- React Router DOM for navigation
- Vite for fast development
- Tailwind CSS for styling
- And other dependencies

### Step 2: Run the Development Server
```bash
npm run dev
```

The app will start at **http://localhost:3000**

Your browser should open automatically. If not, manually navigate to the URL.

### Step 3: Explore the Application

**Home Page** (`/`)
- Hero section with video background and flight search
- Trust badges and features
- Special offers section
- Testimonials
- Call-to-action sections

**Search Results Page** (`/search-results`)
- Click "Search" on the home page form
- View available flights
- Filter by price, stops, airlines, and time
- Select flights and see details

## 🎨 Key Features to Test

### ✅ Navigation
- [ ] Click navigation links in hero (HOME, BUSINESS CLASS, etc.)
- [ ] Test mobile hamburger menu (resize browser to mobile view)
- [ ] Test smooth scrolling to sections

### ✅ Search Form
- [ ] Toggle between Round-Trip and One-Way
- [ ] Select departure city (try typing "Toshkent")
- [ ] Select destination city
- [ ] Pick a departure date
- [ ] Click passenger/cabin selector
- [ ] Adjust passenger count (+/- buttons)
- [ ] Select different cabin classes
- [ ] Submit the form (redirects to search results)

### ✅ Top Bar Features
- [ ] Hover over "ACCREDITED", "24/7", and "SECURE" badges
- [ ] Click language selector (dropdown with flags)
- [ ] Change language (English, Russian, Uzbek)
- [ ] Click phone number to call

### ✅ Search Results Page
- [ ] View flight cards with details
- [ ] Adjust price range filter
- [ ] Toggle stops filter (Non-stop, 1 Stop)
- [ ] Change sort order (Cheapest, Fastest, Recommended)
- [ ] Click "Select" on a flight
- [ ] Click "Modify" to return to home page

### ✅ Responsive Design
- [ ] Resize browser to mobile size (< 768px)
- [ ] Test tablet size (768px - 1024px)
- [ ] Test desktop size (> 1024px)
- [ ] Check all interactive elements work on touch

## 🔧 Development Tips

### Hot Module Replacement (HMR)
Vite provides instant updates. Just save your files and see changes immediately without refreshing!

### Component Structure
```
src/
├── components/     ← Reusable UI components
├── pages/         ← Full page components
└── index.css      ← Global styles
```

### Adding New Features
1. Create new component in `src/components/`
2. Import and use in page components
3. Add routing in `src/App.jsx` if needed

### Styling
- Use Tailwind utility classes
- Custom colors: `text-gold`, `bg-ink`, etc.
- Custom fonts: `font-display`, `font-sans`

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Use a different port
npm run dev -- --port 3001
```

### Dependencies Error
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Styling Not Working
Make sure Tailwind is properly configured:
```bash
# Verify these files exist:
# - tailwind.config.js
# - postcss.config.js
# - src/index.css (with @tailwind directives)
```

### Video Not Playing
The video file is large (90MB). Ensure:
- File exists in `public/Cover800x312_darken_3mb.mp4`
- Browser supports MP4 format
- No network restrictions blocking local files

## 📦 Building for Production

```bash
# Create optimized build
npm run build

# Preview production build
npm run preview
```

The build will be in the `dist/` folder, ready to deploy!

## 🚀 Deployment Options

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm run build
# Drag and drop the dist/ folder to Netlify
```

### GitHub Pages
```bash
# Add to vite.config.js:
# base: '/repository-name/'
npm run build
# Push dist/ folder to gh-pages branch
```

## ✨ Next Steps

1. **Customize Content**: Edit text and images in components
2. **Add Backend**: Connect to real flight API
3. **User Accounts**: Add authentication
4. **Booking Flow**: Implement payment gateway
5. **Email Notifications**: Add booking confirmations
6. **Reviews System**: Let users rate flights

## 📞 Need Help?

- Check `README.md` for detailed documentation
- Review component files for examples
- Check React documentation: https://react.dev
- Check Vite documentation: https://vitejs.dev
- Check Tailwind CSS: https://tailwindcss.com

---

Happy coding! 🎉
