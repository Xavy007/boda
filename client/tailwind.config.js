/** @type {import('tailwindcss').Config} */
const withVar = (name) => `rgb(var(${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta configurable desde EventSettings (variables CSS en canales RGB)
        ivory: withVar('--c-ivory'),
        sage: withVar('--c-sage'),
        gold: withVar('--c-gold'),
        ink: withVar('--c-ink'),
        paper: '#F3EDE3',
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        script: ['"Great Vibes"', 'cursive'],
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      height: { screen: '100svh', dscreen: '100dvh' },
      minHeight: { screen: '100svh', dscreen: '100dvh' },
      letterSpacing: { widest2: '0.32em' },
      boxShadow: {
        card: '0 1px 2px rgb(58 58 58 / 0.04), 0 12px 32px -12px rgb(58 58 58 / 0.18)',
        envelope: '0 30px 60px -20px rgb(58 40 20 / 0.35), 0 8px 20px -8px rgb(58 40 20 / 0.2)',
      },
    },
  },
  plugins: [],
};
