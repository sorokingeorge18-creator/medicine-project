/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      colors: {
        canvas: '#F1EFE9',
        surface: '#FFFFFF',
        line: {
          DEFAULT: '#E2DED5',
          subtle: '#EDEAE4',
          strong: '#C5BFB4',
        },
        ink: {
          DEFAULT: '#111318',
          2: '#4A525F',
          3: '#868E99',
          4: '#B8BFC9',
        },
        brand: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
          light: '#EBF2FF',
          muted: '#BFDBFE',
        },
        positive: {
          DEFAULT: '#15803D',
          hover: '#166534',
          light: '#F0FDF4',
          muted: '#86EFAC',
        },
        negative: {
          DEFAULT: '#DC2626',
          light: '#FEF2F2',
        },
        caution: {
          DEFAULT: '#B45309',
          light: '#FFFBEB',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.04)',
        'card-md': '0 4px 12px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.04)',
        toast: '0 8px 28px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
        input: '0 1px 2px rgba(0,0,0,0.04)',
      },
      borderRadius: {
        sm: '6px',
        DEFAULT: '8px',
        md: '10px',
        lg: '12px',
        xl: '16px',
      },
    },
  },
  plugins: [],
}
