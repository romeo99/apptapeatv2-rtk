/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'UberMove',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif'
        ],
      },
      colors: {
        'emerald': {
          500: '#10B981',
        },
        'yellow': {
          400: '#FBBF24',
        }
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.25rem',
      },
      boxShadow: {
        'custom': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
      fontSize: {
        'heading-xl': ['36px', '44px'],
        'heading-lg': ['28px', '36px'], 
        'heading-md': ['24px', '32px'],
        'heading-sm': ['20px', '28px'],
        'body-lg': ['18px', '28px'],
        'body-md': ['16px', '24px'],
        'body-sm': ['14px', '20px'],
      },
      fontWeight: {
        normal: '400',
        medium: '500', 
        semibold: '600',
        bold: '800',
      },
    },
  },
  plugins: [],
};