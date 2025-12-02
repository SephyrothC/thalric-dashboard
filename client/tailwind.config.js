/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Base Dark Theme
        dark: {
          bg: '#0f172a',      // Slate 900 - Deep background
          surface: '#1e293b', // Slate 800 - Card background
          medium: '#1e293b',  // Alias for surface (used in modals)
          light: '#334155',   // Slate 700 - Lighter surfaces
          border: '#334155',  // Slate 700 - Borders
          hover: '#334155',   // Slate 700 - Hover states
        },
        // Brand Colors
        gold: {
          dim: '#b45309',     // Amber 700 - Muted gold
          primary: '#f59e0b', // Amber 500 - Main accent
          glow: '#fcd34d',    // Amber 300 - Highlights
        },
        // Semantic Colors
        combat: {
          attack: '#ef4444',  // Red 500
          heal: '#10b981',    // Emerald 500
          magic: '#6366f1',   // Indigo 500
        }
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
        display: ['Cinzel', 'Segoe UI', 'serif'], // Suggestion for headers if font is added later
      },
      boxShadow: {
        'glow': '0 0 15px -3px rgba(245, 158, 11, 0.3)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.15)',
      }
    },
  },
  plugins: [],
}