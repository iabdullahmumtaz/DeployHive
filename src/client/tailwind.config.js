/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        hive: {
          bg: '#09090b',
          panel: '#18181b',
          border: '#27272a',
          accent: '#f97316',
          accentHover: '#fb923c',
          success: '#22c55e',
          warning: '#eab308',
          error: '#ef4444',
          muted: '#71717a',
        },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
};
