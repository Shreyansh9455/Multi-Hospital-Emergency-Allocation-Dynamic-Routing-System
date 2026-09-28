/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#080c16',
          secondary: '#0e1526',
          surface: '#141d33',
          card: 'rgba(20, 29, 51, 0.75)',
          border: 'rgba(255, 255, 255, 0.08)',
          cyan: '#00d2ff',
          emerald: '#00e599',
          crimson: '#ff3366',
          amber: '#ffb703',
          indigo: '#6366f1',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 25px rgba(0, 210, 255, 0.25)',
        'glow-emerald': '0 0 25px rgba(0, 229, 153, 0.25)',
        'glow-crimson': '0 0 25px rgba(255, 51, 102, 0.25)',
      },
    },
  },
  plugins: [],
}
