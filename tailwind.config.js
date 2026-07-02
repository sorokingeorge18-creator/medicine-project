/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Golos Text"', 'system-ui', 'sans-serif'],
        serif: ['"PT Serif"', 'Georgia', 'serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      colors: {
        canvas: '#F5F3ED',
        surface: '#FFFFFF',
        line: {
          DEFAULT: '#E6E2D8',
          subtle: '#EFECE4',
          strong: '#CCC6B8',
        },
        ink: {
          DEFAULT: '#171D2B',
          2: '#4A5265',
          3: '#83899A',
          4: '#B4BAC8',
        },
        brand: {
          DEFAULT: '#1F3A5F',
          hover: '#172C49',
          light: '#EDF1F7',
          muted: '#B9C7DB',
        },
        positive: {
          DEFAULT: '#2F6E45',
          hover: '#265A38',
          light: '#F0F6F1',
          muted: '#9CCBAA',
        },
        negative: {
          DEFAULT: '#B3372F',
          light: '#FBF0EE',
        },
        caution: {
          DEFAULT: '#96690F',
          light: '#FBF6E8',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(23,29,43,0.04), 0 8px 24px -12px rgba(23,29,43,0.10), 0 0 0 1px rgba(23,29,43,0.05)',
        'card-md': '0 2px 4px rgba(23,29,43,0.04), 0 16px 40px -16px rgba(23,29,43,0.14), 0 0 0 1px rgba(23,29,43,0.05)',
        toast: '0 12px 40px rgba(23,29,43,0.22), 0 2px 8px rgba(23,29,43,0.10)',
        input: 'inset 0 1px 2px rgba(23,29,43,0.03), 0 1px 0 rgba(255,255,255,0.6)',
        sheet: '0 1px 3px rgba(23,29,43,0.06), 0 12px 32px -14px rgba(23,29,43,0.16), 0 0 0 1px rgba(23,29,43,0.04)',
        'btn-dark': 'inset 0 1px 0 rgba(255,255,255,0.12), 0 2px 8px -2px rgba(23,29,43,0.35)',
      },
      borderRadius: {
        sm: '7px',
        DEFAULT: '9px',
        md: '11px',
        lg: '13px',
        xl: '18px',
        '2xl': '22px',
      },
    },
  },
  plugins: [],
}
