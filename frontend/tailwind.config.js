/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── Design token system ──────────────────────────────────────
        // Canvas (dark backgrounds)
        canvas: {
          DEFAULT: '#08090e',
          1: '#0d0e18',
          2: '#111320',
          3: '#181b2e',
          raised: '#1e2138',
        },
        // Accent — cyan
        cyan: {
          DEFAULT: '#00d9ff',
          dim: 'rgba(0,217,255,0.12)',
          glow: 'rgba(0,217,255,0.25)',
        },
        // Accent — violet
        violet: {
          DEFAULT: '#7c3aed',
          bright: '#8b5cf6',
          dim: 'rgba(124,58,237,0.15)',
          glow: 'rgba(139,92,246,0.3)',
        },
        // Semantic
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#f43f5e',
        // Text scale
        'text-1': '#f8fafc',
        'text-2': '#cbd5e1',
        'text-3': '#64748b',
        'text-4': '#334155',
        // Borders
        border: {
          DEFAULT: 'rgba(255,255,255,0.06)',
          focus: 'rgba(124,58,237,0.5)',
          cyan: 'rgba(0,217,255,0.3)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        '2xl': '24px',
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(0,217,255,0.15)',
        'glow-violet': '0 0 20px rgba(139,92,246,0.2)',
        'card': '0 4px 24px rgba(0,0,0,0.4)',
        'card-hover': '0 8px 32px rgba(0,0,0,0.6)',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #7c3aed, #00d9ff)',
        'gradient-subtle': 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(0,217,255,0.05))',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
