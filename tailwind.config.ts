import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Core blacks
        'forge-black': '#0D0D0D',
        forgeBlack: '#0D0D0D',
        'crucible-charcoal': '#1A1A1A',
        'anvil-gray': '#2A2A2A',
        deepBlack: '#050505',
        'deep-black': '#050505',
        
        // Gold palette - Premium/Metallic for Refinery
        steelGold: '#D4A84B',
        'steel-gold': '#D4A84B',
        'bright-gold': '#E8C060',
        brightGold: '#E8C060',
        'deep-gold': '#B8923F',
        deepGold: '#B8923F',
        goldLight: '#E8C874',
        'gold-light': '#E8C874',
        goldDark: '#A07830',
        'gold-dark': '#A07830',
        'platinum-gold': '#F0D58C',
        'metallic-gold': '#CFB53B',
        
        // Accent colors
        trashRed: '#C41E3A',
        'trash-red': '#C41E3A',
        'success-green': '#22C55E',
        
        // Neutrals
        paperWhite: '#F5F5F0',
        'paper-white': '#F5F5F0',
        'iron-white': '#F5F5F5',
        'ash-gray': '#A0A0A0',
        industrialGray: '#4A4A4A',
        'industrial-gray': '#4A4A4A',
      },
      fontFamily: {
        headline: ['Anton', 'sans-serif'],
        body: ['Work Sans', 'sans-serif'],
        accent: ['Permanent Marker', 'cursive'],
      },
      boxShadow: {
        'glow-gold': '0 0 20px rgba(212, 168, 75, 0.5)',
        'glow-gold-intense': '0 0 40px rgba(212, 168, 75, 0.8)',
        'glow-gold-subtle': '0 0 10px rgba(212, 168, 75, 0.3)',
        'glow-red': '0 0 20px rgba(196, 30, 58, 0.5)',
        'glow-premium': '0 0 30px rgba(240, 213, 140, 0.4)',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'fade-in': 'fade-in 0.3s ease-out',
        'golden-shine': 'golden-shine 3s linear infinite',
        'shimmer-premium': 'shimmer-premium 2.5s infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(212, 168, 75, 0.5)' },
          '50%': { boxShadow: '0 0 40px rgba(212, 168, 75, 0.8)' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(-10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'golden-shine': {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        'shimmer-premium': {
          '0%': { left: '-100%' },
          '100%': { left: '100%' },
        },
      },
      backgroundImage: {
        'gradient-gold': 'linear-gradient(180deg, #F0D58C 0%, #D4A84B 30%, #B8923F 70%, #A07830 100%)',
        'gradient-gold-text': 'linear-gradient(180deg, #F0D58C 0%, #D4A84B 50%, #B8923F 100%)',
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
};

export default config;
