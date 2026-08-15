/** @type {import('tailwindcss').Config} */
const navy = {
  50: '#eef4fa',
  100: '#d5e4f2',
  200: '#abc9e5',
  300: '#7aa8d4',
  400: '#4d86be',
  500: '#1B4F8A',
  600: '#164275',
  700: '#12355e',
  800: '#0e2948',
  900: '#0a1d33',
};

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: navy,
        blue: navy,
        accent: {
          50: '#fffbf0',
          100: '#fef2d6',
          200: '#fce5a8',
          300: '#fad575',
          400: '#f9c745',
          500: '#C9A227',
          600: '#db9b0c',
          700: '#b57908',
          800: '#945f0d',
          900: '#7a4e10',
        },
        green: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        chad: {
          blue: '#002664',
          yellow: '#FECB00',
          red: '#C60C30',
        }
      },
      fontFamily: {
        sans: ['"Outfit"', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 4px 30px rgba(27, 79, 138, 0.08)',
        'soft': '0 10px 40px -10px rgba(15, 23, 42, 0.12)',
      },
      opacity: {
        3: '0.03',
      },
    },
  },
  plugins: [],
}
