/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#2563eb',
          hover: '#1d4ed8',
          soft: '#eff6ff',
          border: '#bfdbfe',
        },
        ink: {
          DEFAULT: '#0a0a0a',
          secondary: '#404040',
          tertiary: '#737373',
          faint: '#a3a3a3',
        },
        surface: {
          DEFAULT: '#ffffff',
          muted: '#fafafa',
          sunken: '#f5f5f5',
        },
        line: {
          DEFAULT: '#e5e5e5',
          strong: '#d4d4d4',
        },
        night: {
          DEFAULT: '#0f0f10',
          surface: '#171718',
          raised: '#1e1e20',
          line: '#2a2a2d',
          text: '#ededed',
          secondary: '#a1a1a3',
          tertiary: '#6e6e72',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        mono: [
          'ui-monospace',
          'SFMono-Regular',
          'SF Mono',
          'JetBrains Mono',
          'Menlo',
          'Consolas',
          'monospace',
        ],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      boxShadow: {
        subtle: '0 1px 2px 0 rgb(0 0 0 / 0.04)',
        panel: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        drawer: '0 16px 48px -12px rgb(0 0 0 / 0.18)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          from: { opacity: '0', transform: 'translateX(12px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 180ms ease-out',
        'slide-in': 'slide-in 200ms ease-out',
      },
    },
  },
  plugins: [],
};
