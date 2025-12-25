import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/content/**/*.{md,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        accent: {
          50: '#fdf4ff',
          100: '#fae8ff',
          200: '#f5d0fe',
          300: '#f0abfc',
          400: '#e879f9',
          500: '#d946ef',
          600: '#c026d3',
          700: '#a21caf',
          800: '#86198f',
          900: '#701a75',
          950: '#4a044e',
        },
        surface: {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b',
          950: '#09090b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      typography: (theme: (path: string) => string) => ({
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: theme('colors.surface.700'),
            a: {
              color: theme('colors.primary.600'),
              '&:hover': {
                color: theme('colors.primary.500'),
              },
            },
            'h1, h2, h3, h4': {
              color: theme('colors.surface.900'),
            },
            code: {
              color: theme('colors.accent.600'),
              backgroundColor: theme('colors.surface.100'),
              padding: '0.25rem 0.375rem',
              borderRadius: '0.25rem',
              fontWeight: '500',
            },
            'code::before': { content: '""' },
            'code::after': { content: '""' },
            pre: {
              backgroundColor: theme('colors.surface.900'),
              color: theme('colors.surface.100'),
              borderRadius: '0.5rem',
            },
            'pre code': {
              backgroundColor: 'transparent',
              padding: 0,
            },
          },
        },
        dark: {
          css: {
            color: theme('colors.surface.300'),
            a: {
              color: theme('colors.primary.400'),
              '&:hover': {
                color: theme('colors.primary.300'),
              },
            },
            'h1, h2, h3, h4': {
              color: theme('colors.surface.100'),
            },
            code: {
              color: theme('colors.accent.400'),
              backgroundColor: theme('colors.surface.800'),
            },
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};

export default config;
