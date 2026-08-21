/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        safety: {
          verySafe: '#10B981',   // Emerald
          lowRisk: '#84CC16',    // Lime
          moderate: '#F59E0B',   // Amber
          elevated: '#F97316',   // Orange
          highRisk: '#EF4444',   // Crimson Red
          unknown: '#6B7280',    // Grey
        },
        obsidian: {
          950: '#050811',
          900: '#0A0F1D',
          850: '#0E162B',
          800: '#141E38',
          700: '#1E293B',
          600: '#334155',
        },
        brand: {
          cyan: '#06B6D4',
          indigo: '#6366F1',
          violet: '#8B5CF6',
          emerald: '#10B981',
          amber: '#F59E0B',
          rose: '#F43F5E',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.45)',
        'glow-cyan': '0 0 25px rgba(6, 182, 212, 0.35)',
        'glow-indigo': '0 0 25px rgba(99, 102, 241, 0.35)',
        'glow-emerald': '0 0 25px rgba(16, 185, 129, 0.35)',
        'glow-amber': '0 0 25px rgba(245, 158, 11, 0.35)',
        'glow-red': '0 0 25px rgba(239, 68, 68, 0.40)',
      }
    },
  },
  plugins: [],
}
