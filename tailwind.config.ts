import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: '#081A33',
        accent: '#3E8EF0',
        bg: '#F7F8FB',
        line: '#E7EBF2',
        positive: '#2FAE6B',
        amber: '#B9832A',
      },
      fontFamily: {
        display: ['var(--font-bebas)', 'sans-serif'],
        body: ['var(--font-montserrat)', 'sans-serif'],
        quote: ['var(--font-cormorant)', 'serif'],
      },
      borderRadius: {
        card: '10px',
      },
    },
  },
  plugins: [],
};

export default config;
