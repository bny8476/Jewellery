/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        display: ['Cinzel', '"Cormorant Garamond"', 'serif'],
        sans: ['Montserrat', 'system-ui', 'sans-serif'],
      },
      colors: {
        theme: {
          bg: 'var(--bg-main)',
          secondary: 'var(--bg-secondary)',
          card: 'var(--bg-card)',
          elevated: 'var(--bg-elevated)',
          text: 'var(--text-main)',
          muted: 'var(--text-secondary)',
          border: 'var(--border-color)',
          gold: 'var(--gold-primary)',
          'gold-highlight': 'var(--gold-highlight)',
        },
        gold: {
          50: '#fdfbf5',
          100: '#f8f4e2',
          200: '#f1e6bf',
          300: '#e5d392',
          400: '#d7be66',
          500: '#c5a044', // Champagne Gold
          600: '#ad8433',
          700: '#8c6529',
          800: '#725127',
          900: '#5f4324',
        },
        charcoal: {
          950: '#080809',
          900: '#0f0f12',
          850: '#141418',
          800: '#1a1a20',
          700: '#26262e',
        }
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #f5e3a9 0%, #d4af37 50%, #aa8022 100%)',
        'gold-shimmer': 'linear-gradient(90deg, transparent, rgba(245, 227, 169, 0.4), transparent)',
        'dark-vignette': 'radial-gradient(ellipse at center, rgba(15,15,18,0) 0%, rgba(8,8,9,0.95) 100%)',
      }
    },
  },
  plugins: [],
};

