/**
 * PhilJS Tailwind Preset
 *
 * Default design tokens and configurations for PhilJS applications.
 */

import type { Config } from 'tailwindcss';

export interface PhilJSPresetOptions {
  /** Base font family */
  fontFamily?: string;
  /** Primary color palette */
  primaryColor?: string;
  /** Enable dark mode colors */
  darkMode?: boolean;
  /** Custom color palette */
  colors?: Record<string, string | Record<string, string>>;
  /** Border radius scale */
  borderRadius?: 'sharp' | 'rounded' | 'pill';
  /** Spacing scale multiplier */
  spacingScale?: number;
}

export function philjsPreset(options: PhilJSPresetOptions = {}): Partial<Config> {
  const {
    fontFamily = 'Inter, system-ui, sans-serif',
    primaryColor = 'blue',
    darkMode = true,
    colors = {},
    borderRadius = 'rounded',
    spacingScale = 1,
  } = options;

  const radiusScale = {
    sharp: {
      sm: '0.125rem',
      DEFAULT: '0.25rem',
      md: '0.375rem',
      lg: '0.5rem',
      xl: '0.75rem',
      '2xl': '1rem',
      '3xl': '1.5rem',
      full: '9999px',
    },
    rounded: {
      sm: '0.25rem',
      DEFAULT: '0.375rem',
      md: '0.5rem',
      lg: '0.75rem',
      xl: '1rem',
      '2xl': '1.5rem',
      '3xl': '2rem',
      full: '9999px',
    },
    pill: {
      sm: '0.5rem',
      DEFAULT: '0.75rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
      '2xl': '3rem',
      '3xl': '4rem',
      full: '9999px',
    },
  };

  return {
    theme: {
      extend: {
        colors: {
          // Primary color based on option
          primary: {
            50: `var(--color-primary-50, hsl(var(--primary-50)))`,
            100: `var(--color-primary-100, hsl(var(--primary-100)))`,
            200: `var(--color-primary-200, hsl(var(--primary-200)))`,
            300: `var(--color-primary-300, hsl(var(--primary-300)))`,
            400: `var(--color-primary-400, hsl(var(--primary-400)))`,
            500: `var(--color-primary-500, hsl(var(--primary-500)))`,
            600: `var(--color-primary-600, hsl(var(--primary-600)))`,
            700: `var(--color-primary-700, hsl(var(--primary-700)))`,
            800: `var(--color-primary-800, hsl(var(--primary-800)))`,
            900: `var(--color-primary-900, hsl(var(--primary-900)))`,
            950: `var(--color-primary-950, hsl(var(--primary-950)))`,
          },
          // Semantic colors
          background: 'hsl(var(--background))',
          foreground: 'hsl(var(--foreground))',
          card: {
            DEFAULT: 'hsl(var(--card))',
            foreground: 'hsl(var(--card-foreground))',
          },
          popover: {
            DEFAULT: 'hsl(var(--popover))',
            foreground: 'hsl(var(--popover-foreground))',
          },
          muted: {
            DEFAULT: 'hsl(var(--muted))',
            foreground: 'hsl(var(--muted-foreground))',
          },
          accent: {
            DEFAULT: 'hsl(var(--accent))',
            foreground: 'hsl(var(--accent-foreground))',
          },
          destructive: {
            DEFAULT: 'hsl(var(--destructive))',
            foreground: 'hsl(var(--destructive-foreground))',
          },
          border: 'hsl(var(--border))',
          input: 'hsl(var(--input))',
          ring: 'hsl(var(--ring))',
          // Custom colors
          ...colors,
        },
        fontFamily: {
          sans: [fontFamily],
          mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        },
        borderRadius: radiusScale[borderRadius],
        spacing: {
          '4.5': `${1.125 * spacingScale}rem`,
          '5.5': `${1.375 * spacingScale}rem`,
          '6.5': `${1.625 * spacingScale}rem`,
          '7.5': `${1.875 * spacingScale}rem`,
          '8.5': `${2.125 * spacingScale}rem`,
          '9.5': `${2.375 * spacingScale}rem`,
        },
        boxShadow: {
          'philjs-sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
          'philjs': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
          'philjs-md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          'philjs-lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
          'philjs-xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        },
        animation: {
          'fade-in': 'fade-in 0.2s ease-out',
          'fade-out': 'fade-out 0.2s ease-in',
          'slide-in': 'slide-in 0.2s ease-out',
          'slide-out': 'slide-out 0.2s ease-in',
          'scale-in': 'scale-in 0.2s ease-out',
          'scale-out': 'scale-out 0.2s ease-in',
          'spin-slow': 'spin 3s linear infinite',
          'pulse-slow': 'pulse 3s ease-in-out infinite',
          'bounce-slow': 'bounce 2s infinite',
        },
        keyframes: {
          'fade-in': {
            '0%': { opacity: '0' },
            '100%': { opacity: '1' },
          },
          'fade-out': {
            '0%': { opacity: '1' },
            '100%': { opacity: '0' },
          },
          'slide-in': {
            '0%': { transform: 'translateY(-10px)', opacity: '0' },
            '100%': { transform: 'translateY(0)', opacity: '1' },
          },
          'slide-out': {
            '0%': { transform: 'translateY(0)', opacity: '1' },
            '100%': { transform: 'translateY(-10px)', opacity: '0' },
          },
          'scale-in': {
            '0%': { transform: 'scale(0.95)', opacity: '0' },
            '100%': { transform: 'scale(1)', opacity: '1' },
          },
          'scale-out': {
            '0%': { transform: 'scale(1)', opacity: '1' },
            '100%': { transform: 'scale(0.95)', opacity: '0' },
          },
        },
        transitionDuration: {
          '250': '250ms',
          '350': '350ms',
          '400': '400ms',
        },
      },
    },
  };
}

export function createPhilJSPreset(options: PhilJSPresetOptions = {}): Partial<Config> {
  return philjsPreset(options);
}

export default philjsPreset;
