/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class', // Enable dark mode with class strategy
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#fffdea',
          100: '#fdf6c8',
          200: '#f9e78f',
          300: '#f4d25a',
          400: '#e9ba38',
          500: '#d89f0c',
          600: '#b88007',
          700: '#926008',
          800: '#774d0c',
          900: '#5f3f0e',
        },
        ink: '#1f2933',
        cream: '#f8f5f0',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 20px 45px -20px rgba(184, 138, 0, 0.4)',
      },
    },
  },
  plugins: [],
}