/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'heat-rise': 'heat-rise 4s infinite ease-out',
        'shimmer': 'shimmer 2.5s infinite linear',
        'shake': 'shake 0.3s ease-in-out infinite',
      },
      keyframes: {
        'heat-rise': {
          '0%': { transform: 'translateY(0) scaleY(1)', opacity: '0.1' },
          '50%': { transform: 'translateY(-40px) scaleY(1.2)', opacity: '0.25' },
          '100%': { transform: 'translateY(-80px) scaleY(1.4)', opacity: '0' },
        },
        'shimmer': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-10px)' },
          '75%': { transform: 'translateX(10px)' },
        },
      },
    },
  },
  plugins: [],
}
