  /** @type {import('tailwindcss').Config} */
  module.exports = {
    content: [
      "./src/**/*.{html,ts}"
    ],
    theme: {
      extend: {
        colors: {
          primary: {
            50:  '#f0f9ff',
            100: '#e0f2fe',
            500: '#0ea5e9',
            600: '#0284c7',
            700: '#0369a1',
          },
          surface: {
            50:  '#f8fafc',
            100: '#f1f5f9',
            800: '#1e293b',
            900: '#0f172a',
          },
          success: '#22c55e',
          danger:  '#ef4444',
          warning: '#f59e0b',
        },
        fontFamily: {
          sans: ['Inter', 'sans-serif'],
        }
      },
    },
    plugins: [
      require('@tailwindcss/typography'),
    ],
  }