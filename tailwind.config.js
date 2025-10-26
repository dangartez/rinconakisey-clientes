/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#E11D48', // A vibrant pink/rose
        'primary-light': '#F87171',
        'secondary': '#0F172A', // A deep navy blue
        'light-bg': '#F8FAFC', // A very light gray for backgrounds
        'light-text': '#64748B',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}