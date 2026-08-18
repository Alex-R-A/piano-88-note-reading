import colors from 'tailwindcss/colors.js';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Headings, figures and anything meant to feel engraved.
        display: ['"Cormorant Garamond"', 'ui-serif', 'Georgia', 'serif'],
        // Interface text.
        sans: ['Jost', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Warm near-black through warm greys, taken off the ebony keys.
        ink: {
          50: '#f7f3ec',
          100: '#ece6dc',
          200: '#ded7cd',
          300: '#c3bbb1',
          400: '#9c948b',
          500: '#6f675f',
          600: '#57504a',
          700: '#3a3430',
          800: '#231f1c',
          900: '#151312',
        },
        // Key-top whites, used for page and card surfaces.
        ivory: {
          DEFAULT: '#faf7f1',
          50: '#fdfbf7',
          100: '#f7f2e9',
          200: '#efe8db',
        },
        // Piano hardware: pedals, hinges, the plate. The single accent.
        brass: {
          100: '#f6efdd',
          200: '#eddfc0',
          300: '#e0c795',
          400: '#d0b070',
          500: '#bd9a4c',
          600: '#a5843a',
          700: '#8a6d2b',
          800: '#6b5420',
          900: '#4a3a14',
        },
        // Damper felt, for the strip above the mini keyboards.
        felt: {
          600: '#94393b',
          700: '#7a2e30',
        },
        // The stats table tints are pinned by name in AnalyticsScreen tests,
        // so warm the shades in place rather than renaming the classes.
        red: { ...colors.red, 50: '#fbeeec' },
        amber: { ...colors.amber, 50: '#faf1de' },
        emerald: { ...colors.emerald, 50: '#eaf2ea' },
      },
      boxShadow: {
        // Soft, warm-tinted elevation. Neutral black shadows go grey and
        // muddy against an ivory ground.
        card: '0 1px 2px rgba(58, 52, 48, 0.05), 0 8px 24px -12px rgba(58, 52, 48, 0.18)',
        lift: '0 2px 4px rgba(58, 52, 48, 0.06), 0 18px 40px -18px rgba(58, 52, 48, 0.28)',
        key: '0 1px 0 rgba(255, 255, 255, 0.7) inset, 0 1px 3px rgba(58, 52, 48, 0.16)',
      },
    },
  },
  plugins: [],
}
