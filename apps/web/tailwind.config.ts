import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: '#FBF6EC',
          dark: '#1B1812',
        },
        ink: {
          DEFAULT: '#2B241B',
          light: '#F2E9D8',
        },
        gold: {
          50: '#FBF3E4',
          100: '#F3E7D3',
          200: '#E7D3B0',
          300: '#D9C09B',
          400: '#C9A876',
          500: '#B8905A',
          600: '#96723F',
          700: '#725530',
          800: '#4E3A22',
          900: '#2E2213',
        },
        maroon: {
          500: '#8C1D28',
          600: '#701722',
          700: '#54101A',
        },
      },
      fontFamily: {
        heading: ['"Aref Ruqaa"', 'serif'],
        body: ['Cairo', 'Tajawal', 'sans-serif'],
        'heading-en': ['"Playfair Display"', 'serif'],
      },
      boxShadow: {
        book: '0 25px 60px -15px rgba(43, 36, 27, 0.45), 0 10px 20px -8px rgba(43, 36, 27, 0.3)',
        page: '0 2px 8px rgba(43, 36, 27, 0.08)',
        'page-lg': '0 10px 30px rgba(43, 36, 27, 0.12)',
      },
      backgroundImage: {
        'paper-texture':
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.02 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s ease-out both',
        shimmer: 'shimmer 2.5s linear infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
