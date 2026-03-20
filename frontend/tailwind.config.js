/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Base colors - OKLCH with purple tint
        background: 'oklch(12% 0.02 280)',
        surface: 'oklch(18% 0.02 280)',
        surfaceElevated: 'oklch(22% 0.02 280)',

        // Text colors
        textPrimary: 'oklch(95% 0.01 280)',
        textSecondary: 'oklch(75% 0.02 280)',
        textMuted: 'oklch(55% 0.02 280)',

        // Primary - Purple
        primary: 'oklch(65% 0.18 280)',
        primaryHover: 'oklch(70% 0.2 280)',
        primaryLight: 'oklch(80% 0.15 280)',

        // Accent - Blue-Purple
        accent: 'oklch(75% 0.15 200)',
        accentHover: 'oklch(80% 0.18 200)',

        // Border
        border: 'oklch(30% 0.02 280)',
        borderLight: 'oklch(40% 0.02 280)',

        // Semantic
        success: 'oklch(70% 0.15 150)',
        error: 'oklch(65% 0.18 20)',
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
