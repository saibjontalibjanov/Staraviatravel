/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#D4A445',
          soft: '#E8C26A',
          dark: '#B78434'
        },
        ink: '#23201C',
        paper: '#Fdfcfb',
        surface: '#F8F9FA'
      },
      boxShadow: {
        soft: '0 20px 40px -15px rgba(0,0,0,0.1)',
        glow: '0 0 20px rgba(212,164,69,0.3)'
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        sans: ['Poppins', 'sans-serif']
      }
    },
  },
  plugins: [],
}
