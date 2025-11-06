/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Christmas red
        primary: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#dc2626',
          600: '#b91c1c',
          700: '#991b1b',
          800: '#7f1d1d',
          900: '#5c1515',
        },
        // Christmas green
        green: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        // Gold/amber for accents
        gold: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        // Snow white
        snow: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
        }
      },
      fontFamily: {
        'pixel': ['"Press Start 2P"', 'monospace'],
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'pixel': '4px 4px 0px 0px',
        'pixel-sm': '2px 2px 0px 0px',
        'pixel-lg': '6px 6px 0px 0px',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
