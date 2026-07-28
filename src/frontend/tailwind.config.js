/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './features/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        forest: 'var(--forest)',
        mint: 'var(--mint)',
        'mint-dark': 'var(--mint-dark)',
        'mint-soft': 'var(--mint-soft)',
        cream: 'var(--cream)',
        peach: 'var(--peach)',
        coral: 'var(--coral)',
        ink: 'var(--ink)',
        'ink-soft': 'var(--ink-soft)',
        line: 'var(--line)',
        canvas: 'var(--canvas)',
      },
    },
  },
  plugins: [],
};
