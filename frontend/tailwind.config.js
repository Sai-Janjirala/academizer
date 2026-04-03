/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F8FAFC',
        card: '#FFFFFF',
        accent: '#2563EB',
        'text-primary': '#0F172A',
        'text-secondary': '#64748B',
        border: '#E2E8F0',
        'inverted-bg': '#0F172A',
        'inverted-text': '#FFFFFF',
        mint: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
        },
        coral: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
        },
        butter: '#fff7d6',
        lilac: '#ede9fe',
      },
      backgroundImage: {
        'main-gradient': 'linear-gradient(165deg, #f8fafc 0%, #eef2ff 28%, #fdf4ff 55%, #fff7ed 85%, #f0fdfa 100%)',
        'sidebar-gradient': 'linear-gradient(180deg, #ffffff 0%, #f5f3ff 45%, #ecfeff 100%)',
        'student-portal-gradient': 'linear-gradient(145deg, #fdf4ff 0%, #e0f2fe 35%, #fef9c3 70%, #fce7f3 100%)',
        'landing-gradient': 'linear-gradient(165deg, #faf5ff 0%, #e0f2fe 25%, #fffbeb 55%, #fdf2f8 85%, #ecfeff 100%)',
        'auth-gradient': 'linear-gradient(145deg, #eef2ff 0%, #fce7f3 40%, #fef3c7 100%)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '50%': { transform: 'translate(20px, -16px)' },
        },
        'float-slower': {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '50%': { transform: 'translate(-24px, 12px)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out forwards',
        'fade-up': 'fade-up 0.55s ease-out forwards',
        'float-slow': 'float-slow 14s ease-in-out infinite',
        'float-slower': 'float-slower 18s ease-in-out infinite',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['"Playfair Display"', 'serif'],
      },
    },
  },
  plugins: [],
}
