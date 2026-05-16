import { colors, fonts, radius, shadows } from '@dorsal/ui-tokens';
import forms from '@tailwindcss/forms';
import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

const config: Config = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './features/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors,
      borderRadius: radius,
      fontFamily: {
        sans: [fonts.sans, 'sans-serif'],
        mono: [fonts.mono, 'monospace'],
      },
      boxShadow: { card: shadows.card, elevated: shadows.elevated },
      transitionTimingFunction: { dorsal: 'cubic-bezier(0.4, 0, 0.2, 1)' },
    },
  },
  plugins: [animate, forms],
};

export default config;
