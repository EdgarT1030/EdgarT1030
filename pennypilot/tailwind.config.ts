import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        copper: {
          50:  '#fdf6ee',
          100: '#fae9d3',
          200: '#f4d0a6',
          300: '#ecaf6f',
          400: '#e38440',
          500: '#dc641e',
          600: '#ce4d14',
          700: '#ab3812',
          800: '#892f16',
          900: '#6f2915',
          950: '#3c1208',
        },
        penny: {
          DEFAULT: '#b45309',
          light:   '#fef3c7',
          dark:    '#78350f',
        },
        surface: {
          DEFAULT: '#faf9f7',
          card:    '#ffffff',
          muted:   '#f5f3ef',
        },
        ink: {
          DEFAULT: '#1c1917',
          muted:   '#78716c',
          faint:   '#a8a29e',
        },
      },
      fontFamily: {
        sans: ['Inter var', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl:  '1rem',
        '2xl': '1.25rem',
      },
      boxShadow: {
        card:       '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'card-hover': '0 4px 16px 0 rgb(0 0 0 / 0.10), 0 1px 4px -1px rgb(0 0 0 / 0.06)',
        'penny':    '0 4px 14px 0 rgb(180 83 9 / 0.25)',
      },
      animation: {
        shimmer: 'shimmer 1.8s ease-in-out infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-600px 0' },
          '100%': { backgroundPosition: '600px 0' },
        },
      },
    },
  },
  plugins: [],
}

export default config
