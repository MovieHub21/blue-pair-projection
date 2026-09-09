import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: { 950:'#060B17', 900:'#0A1229', 800:'#101B3B', 700:'#172552', 600:'#22346E', 500:'#2E4488' },
        gold: { 50:'#FBF6E9', 100:'#F5E9C6', 300:'#E4C578', 400:'#D6B15A', 500:'#C79A3E', 600:'#A87D2C' },
        cream: { 50:'#FBF9F4', 100:'#F5F1E6' },
        ink: '#12172A'
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        body: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(6,11,23,.05), 0 18px 40px -18px rgba(6,11,23,.35)',
        pop: '0 30px 70px -20px rgba(6,11,23,.5)'
      },
      borderRadius: { xl2: '1.25rem' }
    },
  },
  plugins: [],
}
export default config
