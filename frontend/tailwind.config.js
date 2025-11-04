/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dairy-themed color palette
        dairy: {
          50: '#fdfcfb',
          100: '#faf8f5',
          200: '#f5f1e9',
          300: '#ede5d6',
          400: '#e0d3ba',
          500: '#d4c2a0',
          600: '#c4af87',
          700: '#a8936d',
          800: '#8a7858',
          900: '#6d5f47',
        },
        milk: {
          white: '#FDFCFB',
          cream: '#FFF8E7',
          vanilla: '#FFF5D6',
        },
        'milk-white': '#FDFCFB',
        'milk-cream': '#FFF8E7',
        'milk-vanilla': '#FFF5D6',
        fresh: {
          mint: '#E8F5E9',
          green: '#4CAF50',
          lime: '#8BC34A',
        },
        'fresh-mint': '#E8F5E9',
        'fresh-green': '#4CAF50',
        'fresh-lime': '#8BC34A',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-dairy': 'linear-gradient(135deg, #FDFCFB 0%, #E2D1C3 100%)',
        'gradient-fresh': 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)',
      },
    },
  },
  plugins: [],
}
