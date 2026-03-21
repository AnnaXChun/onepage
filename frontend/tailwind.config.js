/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // CSS variable references - defined in global.css :root
        background: 'var(--color-background)',
        surface: 'var(--color-surface)',
        'surface-elevated': 'var(--color-surface-elevated)',

        // Text colors
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-muted': 'var(--color-text-muted)',

        // Primary - Purple
        primary: 'var(--color-primary)',
        primaryhover: 'var(--color-primary-hover)',
        'primary-light': 'var(--color-primary-light)',

        // Accent - Blue-Purple
        accent: 'var(--color-accent)',
        accenthover: 'var(--color-accent-hover)',

        // Border
        border: 'var(--color-border)',
        'border-light': 'var(--color-border-light)',

        // Semantic
        success: 'var(--color-success)',
        error: 'var(--color-error)',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'fluid-xl': 'clamp(2.5rem, 5vw + 1rem, 4rem)',
        'fluid-lg': 'clamp(1.75rem, 3vw + 0.5rem, 2.5rem)',
        'fluid-md': 'clamp(1.25rem, 2vw + 0.5rem, 1.75rem)',
      },
      spacing: {
        'fluid-sm': 'clamp(0.5rem, 1vw, 1rem)',
        'fluid-md': 'clamp(1rem, 2vw, 2rem)',
        'fluid-lg': 'clamp(2rem, 4vw, 4rem)',
        'fluid-xl': 'clamp(3rem, 6vw, 6rem)',
      },
      animation: {
        'fade-in': 'fadeIn 500ms ease-out-quart forwards',
        'slide-up': 'slideUp 500ms ease-out-quart forwards',
        'scale-in': 'scaleIn 300ms ease-out-quart forwards',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.6' },
        },
      },
    },
  },
  plugins: [],
}
