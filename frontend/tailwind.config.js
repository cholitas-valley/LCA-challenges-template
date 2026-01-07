/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        plant: {
          healthy: {
            light: '#86efac',
            DEFAULT: '#22c55e',
            dark: '#15803d',
          },
          warning: {
            light: '#fde047',
            DEFAULT: '#eab308',
            dark: '#a16207',
          },
          danger: {
            light: '#fca5a5',
            DEFAULT: '#ef4444',
            dark: '#b91c1c',
          },
        },
      },
    },
  },
  plugins: [],
}
