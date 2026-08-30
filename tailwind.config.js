/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'Menlo', 'monospace'],
      },
      colors: {
        // Base surfaces
        'bg-base':     '#090D0B',
        'surface-1':   '#111714',
        'surface-2':   '#171F1B',
        'surface-3':   '#1C2621',

        // Borders
        'border-primary': '#28332D',
        'border-subtle':  '#1C2520',

        // Text
        'text-primary':   '#F3F6F4',
        'text-secondary': '#9AA7A0',
        'text-muted':     '#66736C',

        // Semantic
        'live':      '#2DD4A8',
        'forecast':  '#9B8AFB',
        'terrain':   '#C8A96B',
        'safe':      '#2DD4A8',
        'watch':     '#E8C45A',
        'high':      '#F28B4B',
        'critical':  '#EF5B5B',
      },
      borderRadius: {
        'sm':   '12px',
        'md':   '16px',
        'lg':   '18px',
        'xl':   '20px',
        '2xl':  '24px',
        '3xl':  '28px',
        '4xl':  '32px',
        '5xl':  '36px',
        '6xl':  '40px',
      },
      spacing: {
        '1':  '4px',
        '2':  '8px',
        '3':  '12px',
        '4':  '16px',
        '6':  '24px',
        '8':  '32px',
        '10': '40px',
        '12': '48px',
        '16': '64px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.6s ease forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
