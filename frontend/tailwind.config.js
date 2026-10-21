/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        inter: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        display: ['Cinzel', '"Cormorant Garamond"', 'serif'],
        sans: ['Inter', '"Plus Jakarta Sans"', 'Montserrat', 'system-ui', '-apple-system', 'sans-serif'],
        body: ['Inter', '"Plus Jakarta Sans"', 'Montserrat', 'system-ui', '-apple-system', 'sans-serif'],
        script: ['"Alex Brush"', 'cursive'],
      },
      letterSpacing: {
        tighter: '-0.03em',
        tight: '-0.015em',
        normal: '0',
        wide: '0.04em',
        wider: '0.08em',
        widest: '0.16em',
        luxury: '0.22em',
        monumental: '0.28em',
      },
      colors: {
        brand: {
          burgundy: '#450817',
          'burgundy-dark': '#28030B',
          'burgundy-light': '#6A1B2B',
          white: '#FFFFFF',
          gold: '#C6A15B',
          'gold-light': '#E4D1A3',
          text: '#241B1D',
          muted: '#777174',
          border: '#EAE5E6',
          surface: '#FAF9F8',
        },
        theme: {
          bg: 'var(--bg-main)',
          main: 'var(--bg-main)',
          surface: 'var(--surface)',
          secondary: 'var(--bg-secondary)',
          sidebar: 'var(--bg-sidebar)',
          header: 'var(--bg-header)',
          card: 'var(--bg-card)',
          elevated: 'var(--bg-elevated)',
          primary: 'var(--primary)',
          'primary-hover': 'var(--primary-hover)',
          accent: 'var(--accent)',
          text: 'var(--text-main)',
          muted: 'var(--text-secondary)',
          border: 'var(--border-color)',
          input: 'var(--input-background)',
          gold: 'var(--gold-primary)',
          'gold-highlight': 'var(--gold-highlight)',
          'gold-secondary': 'var(--gold-secondary)',
          success: 'var(--status-success)',
          warning: 'var(--status-warning)',
          danger: 'var(--status-danger)',
          info: 'var(--status-info)',
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
        },
        burgundy: {
          DEFAULT: '#702638',
          dark: '#541C2A',
          deep: '#431420',
          light: '#8B3247',
        },
        rosegold: {
          DEFAULT: '#C69A8B',
          light: '#DFC0B5',
          dark: '#A87A6B',
          soft: '#E8D5CE',
        },
        cream: {
          DEFAULT: '#FAF5F0',
          soft: '#FAF5F0',
          blush: '#F0E4DF',
          taupe: '#E5D5D0',
        },
        plum: {
          DEFAULT: '#34252A',
          charcoal: '#34252A',
        }
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #f5e3a9 0%, #d4af37 50%, #aa8022 100%)',
        'gold-shimmer': 'linear-gradient(90deg, transparent, rgba(245, 227, 169, 0.4), transparent)',
        'dark-vignette': 'radial-gradient(ellipse at center, rgba(15,15,18,0) 0%, rgba(8,8,9,0.95) 100%)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.96)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        slideRight: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        goldShimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in': 'scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-right': 'slideRight 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'gold-shimmer': 'goldShimmer 3s infinite linear',
      },
      zIndex: {
        'page': '0',
        'sticky-bar': '40',
        'sticky-header': '50',
        'dropdown': '100',
        'floating': '200',
        'backdrop': '1100',
        'drawer': '1200',
        'modal': '1300',
        'toast': '1400',
        'loader': '1500',
      }
    },
  },
  plugins: [],
};

