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
        brand: {
          50:  '#fef9ec',
          100: '#fdf0c8',
          200: '#fae08d',
          300: '#f7c84a',
          400: '#f4b020',
          500: '#e89408',
          600: '#cc7204',
          700: '#a85207',
          800: '#89400d',
          900: '#71350f',
        },
      },
    },
  },
  plugins: [],
}

export default config
