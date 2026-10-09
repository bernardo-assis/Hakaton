/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-green': '#064E3B',
        'brand-lime': '#B6F03F',
        'dark-text': '#111827',
        'gray-text': '#777D85',
        'bg-light': '#F6F7F7',
      },
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
