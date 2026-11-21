/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        studio: {
          dark: '#1C0F18',
          surface: '#261521',
          card: '#311B2B',
          accent: '#D9A6B8',
          'accent-light': '#F2D3DF',
          muted: '#A892A0',
        }
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        calibri: ['Calibri', 'Candara', 'Segoe', '"Segoe UI"', 'Optima', 'Arial', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
