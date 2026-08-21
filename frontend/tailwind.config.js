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
          highRisk: '#EF4444',   // Red
          unknown: '#6B7280',    // Grey
        },
        navy: {
          900: '#0B0F19',
          800: '#111827',
          700: '#1F2937',
          600: '#374151',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glow-emerald': '0 0 20px rgba(16, 185, 129, 0.35)',
        'glow-amber': '0 0 20px rgba(245, 158, 11, 0.35)',
        'glow-red': '0 0 20px rgba(239, 68, 68, 0.35)',
      }
    },
  },
  plugins: [],
}
