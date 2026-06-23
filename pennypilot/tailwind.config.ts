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
        // ── Design-system tokens (dashboard) ─────────────────
        // Copper: the penny. Golden-brown, NOT red-orange.
        copper: {
          DEFAULT: '#B66E41',  // the brand penny
          bright:  '#E8A04C',  // high-score glow (≥ 80)
          dim:     '#8B5432',  // tarnished (< 45)
          50:  '#FDF8F2',
          100: '#FAF0E0',
          200: '#F3DAB8',
          300: '#E8C08B',
          400: '#DCA05E',
          500: '#C88440',
          600: '#B66E41',
          700: '#9A5A33',
          800: '#7E4727',
          900: '#62361D',
          950: '#3C1F0D',
        },
        // Paper: warm off-white. Not cold gray.
        paper: {
          DEFAULT: '#FAF6EF',
          card:    '#FFFFFF',
          muted:   '#F2EDE4',
        },
        // Status colors — used ONLY for confirmed/pending/expired/disputed
        sage:         '#4C7A5B',  // confirmed
        clay:         '#B5483B',  // expired / disputed
        'warm-amber': '#D99A2B',  // pending / candidate
        // ── Legacy tokens (existing pages keep working) ───────
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
          DEFAULT: '#1A1714',
          muted:   '#5C5450',
          faint:   '#9B918C',
        },
      },

      fontFamily: {
        sans:    ['var(--font-sans)', 'Inter', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Georgia', 'serif'],
        mono:    ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },

      borderRadius: {
        xl:   '1rem',
        '2xl':'1.25rem',
        '3xl':'1.5rem',
      },

      boxShadow: {
        card:         '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'card-hover': '0 4px 16px 0 rgb(0 0 0 / 0.10), 0 1px 4px -1px rgb(0 0 0 / 0.06)',
        penny:        '0 4px 14px 0 rgb(182 110 65 / 0.30)',
        copper:       '0 4px 14px 0 rgb(182 110 65 / 0.25)',
        'copper-glow':'0 0 16px 4px rgb(232 160 76 / 0.35)',
      },

      animation: {
        shimmer:     'shimmer 1.8s ease-in-out infinite',
        'slide-in':  'slide-in 0.2s ease-out',
        'fade-in':   'fade-in 0.15s ease-out',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
      },

      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-600px 0' },
          '100%': { backgroundPosition: '600px 0' },
        },
        'slide-in': {
          '0%':   { transform: 'translateY(-8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

export default config
