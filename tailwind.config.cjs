/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#1f0534',
        'surface-container-lowest': '#1a012f',
        'surface-container-low': '#280f3d',
        'surface-container': '#2d1341',
        'surface-container-high': '#381e4d',
        'surface-container-highest': '#432958',
        'surface-bright': '#482e5d',
        'surface-variant': '#432958',
        'outline-variant': '#4c4450',
        'on-surface': '#f2daff',
        'on-surface-variant': '#cfc2d2',
        primary: '#e3b5ff',
        'primary-container': '#4f0f77',
        secondary: '#ffafd1',
        'secondary-container': '#93025e',
        error: '#ffb4ab',
      },
      fontFamily: {
        body: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        headline: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        label: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        editorial: '0 40px 80px -22px rgba(79, 15, 119, 0.22)',
        ambient: '0 22px 64px rgba(17, 3, 32, 0.34)',
      },
    },
  },
  plugins: [],
};
