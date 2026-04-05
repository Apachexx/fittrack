/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        fittrack: {
          'primary':         '#f97316',
          'primary-content': '#ffffff',
          'secondary':       '#3b82f6',
          'accent':          '#e11d48',
          'neutral':         '#1e2a3a',
          'base-100':        '#080C14',
          'base-200':        '#0d1117',
          'base-300':        '#111f2e',
          'base-content':    '#e2e8f0',
        },
      },
    ],
    darkTheme: 'fittrack',
    logs: false,
  },
};
