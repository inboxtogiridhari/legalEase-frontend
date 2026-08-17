/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
          950: '#172554',
        },
      },
      fontFamily: {
        sans:  ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        soft:       '0 4px 20px rgba(15,23,42,0.06)',
        'soft-lg':  '0 8px 32px rgba(15,23,42,0.08)',
        card:       '0 1px 4px rgba(15,23,42,0.04), 0 4px 16px rgba(15,23,42,0.05)',
        'card-hover':'0 4px 24px rgba(15,23,42,0.10)',
      },
    },
  },
  plugins: [],
};
