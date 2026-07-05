/** @type {import('tailwindcss').Config} */
// Palette maps to CSS variables injected from @ahla/shared in main.tsx,
// so the dashboard stays in lockstep with the mobile app's design tokens.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          900: 'var(--navy900)',
          800: 'var(--navy800)',
          700: 'var(--navy700)',
          600: 'var(--navy600)',
          500: 'var(--navy500)',
          300: 'var(--navy300)',
        },
        green: { DEFAULT: 'var(--green)', soft: 'var(--greenSoft)', dark: 'var(--greenDark)' },
        gold: { DEFAULT: 'var(--gold)', soft: 'var(--goldSoft)' },
        danger: { DEFAULT: 'var(--red)', soft: 'var(--redSoft)' },
        paper: { DEFAULT: 'var(--paper)', 2: 'var(--paper2)' },
        card: 'var(--card)',
        line: { DEFAULT: 'var(--line)', 2: 'var(--line2)' },
        ink: 'var(--ink)',
        slate: 'var(--slate)',
        muted: 'var(--muted)',
      },
      fontFamily: {
        sans: ['Cairo', 'Tajawal', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 20px rgba(20,40,74,.06)',
        raised: '0 8px 30px rgba(20,40,74,.10)',
      },
      borderRadius: {
        card: '20px',
      },
    },
  },
  plugins: [],
};
