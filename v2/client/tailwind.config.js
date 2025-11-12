/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          primary: '#d4af37',
          secondary: '#f4e09a',
        },
        dark: {
          bg: '#1a1a1a',
          medium: '#2d2d2d',
          light: '#3a3a3a',
        },
        critical: '#ff6b35',
        fumble: '#ff3838',
      },
      fontFamily: {
        sans: ['Segoe UI', 'Tahoma', 'Geneva', 'Verdana', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
