// tailwind.config.js

import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // === PALETTE DISDEASY (Colori Esatti Logo) ===
        primary: {
          50: '#e8f0f7',   // Blu ultra chiaro
          100: '#d1e1ef',
          200: '#a3c3df',
          300: '#75a5cf',
          400: '#4787bf',
          500: '#1969af',  // Blu medio
          600: '#0D417D',  // ✅ BLU LOGO (principale)
          700: '#0a3463',
          800: '#08274a',
          900: '#051a31',
          950: '#030d18',
        },
        secondary: {
          50: '#e6f7f5',   // Verde/Turchese ultra chiaro
          100: '#ccefeb',
          200: '#99dfd7',
          300: '#66cfc3',
          400: '#33bfaf',
          500: '#00C4B4',  // ✅ VERDE/TURCHESE LOGO (principale)
          600: '#00a89a',
          700: '#008c80',
          800: '#007066',
          900: '#00544d',
          950: '#003833',
        },
        // === MANTIENI success, warning, danger, dark invariati ===
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        dark: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-primary': 'linear-gradient(135deg, #0D417D 0%, #00C4B4 100%)',  // ✅ Blu → Verde (opzionale)
        'gradient-primary-reverse': 'linear-gradient(135deg, #00C4B4 0%, #0D417D 100%)',  // ✅ Verde/Turchese → Blu
        'gradient-success': 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 196, 180, 0.15)',  // ✅ Aggiornato con verde logo
        'glass-hover': '0 8px 32px 0 rgba(0, 196, 180, 0.25)',  // ✅ Aggiornato con verde logo
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 191, 165, 0.15)',
        'glass-hover': '0 8px 32px 0 rgba(0, 191, 165, 0.25)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.4s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'bounce-subtle': 'bounceSubtle 0.6s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [
    forms,
  ],
}

export default config;