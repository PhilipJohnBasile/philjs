/**
 * PhilJS Tailwind Plugin
 *
 * Custom utilities and components for PhilJS applications.
 */

import plugin from 'tailwindcss/plugin';

export interface PhilJSPluginOptions {
  /** Add signal-related utilities */
  signals?: boolean;
  /** Add component base styles */
  components?: boolean;
  /** Add animation utilities */
  animations?: boolean;
  /** Add form utilities */
  forms?: boolean;
  /** Add typography utilities */
  typography?: boolean;
}

export function philjsTailwindPlugin(options: PhilJSPluginOptions = {}) {
  const {
    signals = true,
    components = true,
    animations = true,
    forms = true,
    typography = true,
  } = options;

  return plugin(
    function ({ addUtilities, addComponents, addBase, matchUtilities, theme }) {
      // Base styles
      addBase({
        ':root': {
          '--background': '0 0% 100%',
          '--foreground': '222.2 84% 4.9%',
          '--card': '0 0% 100%',
          '--card-foreground': '222.2 84% 4.9%',
          '--popover': '0 0% 100%',
          '--popover-foreground': '222.2 84% 4.9%',
          '--primary-50': '213.8 100% 96.9%',
          '--primary-100': '214.3 94.6% 92.7%',
          '--primary-200': '213.3 96.9% 87.3%',
          '--primary-300': '211.7 96.4% 78.4%',
          '--primary-400': '213.1 93.9% 67.8%',
          '--primary-500': '217.2 91.2% 59.8%',
          '--primary-600': '221.2 83.2% 53.3%',
          '--primary-700': '224.3 76.3% 48%',
          '--primary-800': '225.9 70.7% 40.2%',
          '--primary-900': '224.4 64.3% 32.9%',
          '--primary-950': '226.2 55.3% 18.4%',
          '--muted': '210 40% 96.1%',
          '--muted-foreground': '215.4 16.3% 46.9%',
          '--accent': '210 40% 96.1%',
          '--accent-foreground': '222.2 47.4% 11.2%',
          '--destructive': '0 84.2% 60.2%',
          '--destructive-foreground': '210 40% 98%',
          '--border': '214.3 31.8% 91.4%',
          '--input': '214.3 31.8% 91.4%',
          '--ring': '221.2 83.2% 53.3%',
          '--radius': '0.5rem',
        },
        '.dark': {
          '--background': '222.2 84% 4.9%',
          '--foreground': '210 40% 98%',
          '--card': '222.2 84% 4.9%',
          '--card-foreground': '210 40% 98%',
          '--popover': '222.2 84% 4.9%',
          '--popover-foreground': '210 40% 98%',
          '--muted': '217.2 32.6% 17.5%',
          '--muted-foreground': '215 20.2% 65.1%',
          '--accent': '217.2 32.6% 17.5%',
          '--accent-foreground': '210 40% 98%',
          '--destructive': '0 62.8% 30.6%',
          '--destructive-foreground': '210 40% 98%',
          '--border': '217.2 32.6% 17.5%',
          '--input': '217.2 32.6% 17.5%',
          '--ring': '224.3 76.3% 48%',
        },
        '*': {
          borderColor: 'hsl(var(--border))',
        },
        body: {
          backgroundColor: 'hsl(var(--background))',
          color: 'hsl(var(--foreground))',
        },
      });

      // Signal utilities
      if (signals) {
        addUtilities({
          '.signal-loading': {
            opacity: '0.5',
            pointerEvents: 'none',
          },
          '.signal-error': {
            borderColor: 'hsl(var(--destructive))',
          },
          '.signal-success': {
            borderColor: 'hsl(142 76% 36%)',
          },
          '.signal-pending': {
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          },
        });
      }

      // Component base styles
      if (components) {
        addComponents({
          '.btn': {
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 'var(--radius)',
            fontSize: '0.875rem',
            fontWeight: '500',
            transition: 'colors 0.2s',
            '&:focus-visible': {
              outline: 'none',
              ring: '2px',
              ringOffset: '2px',
            },
            '&:disabled': {
              pointerEvents: 'none',
              opacity: '0.5',
            },
          },
          '.btn-primary': {
            backgroundColor: 'hsl(var(--primary-500))',
            color: 'white',
            '&:hover': {
              backgroundColor: 'hsl(var(--primary-600))',
            },
          },
          '.btn-secondary': {
            backgroundColor: 'hsl(var(--muted))',
            color: 'hsl(var(--foreground))',
            '&:hover': {
              backgroundColor: 'hsl(var(--accent))',
            },
          },
          '.btn-outline': {
            border: '1px solid hsl(var(--border))',
            backgroundColor: 'transparent',
            '&:hover': {
              backgroundColor: 'hsl(var(--accent))',
            },
          },
          '.btn-ghost': {
            backgroundColor: 'transparent',
            '&:hover': {
              backgroundColor: 'hsl(var(--accent))',
            },
          },
          '.btn-sm': {
            height: '2rem',
            paddingLeft: '0.75rem',
            paddingRight: '0.75rem',
          },
          '.btn-md': {
            height: '2.5rem',
            paddingLeft: '1rem',
            paddingRight: '1rem',
          },
          '.btn-lg': {
            height: '3rem',
            paddingLeft: '1.5rem',
            paddingRight: '1.5rem',
          },
          '.card': {
            backgroundColor: 'hsl(var(--card))',
            color: 'hsl(var(--card-foreground))',
            borderRadius: 'var(--radius)',
            border: '1px solid hsl(var(--border))',
            boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
          },
          '.input': {
            display: 'flex',
            width: '100%',
            borderRadius: 'var(--radius)',
            border: '1px solid hsl(var(--input))',
            backgroundColor: 'transparent',
            padding: '0.5rem 0.75rem',
            fontSize: '0.875rem',
            '&:focus': {
              outline: 'none',
              ring: '2px',
              ringColor: 'hsl(var(--ring))',
            },
            '&:disabled': {
              cursor: 'not-allowed',
              opacity: '0.5',
            },
          },
          '.badge': {
            display: 'inline-flex',
            alignItems: 'center',
            borderRadius: '9999px',
            padding: '0.125rem 0.625rem',
            fontSize: '0.75rem',
            fontWeight: '500',
          },
        });
      }

      // Animation utilities
      if (animations) {
        addUtilities({
          '.animate-in': {
            animationDuration: '150ms',
            animationTimingFunction: 'ease-out',
            animationFillMode: 'both',
          },
          '.animate-out': {
            animationDuration: '150ms',
            animationTimingFunction: 'ease-in',
            animationFillMode: 'both',
          },
          '.slide-in-from-top': {
            '--tw-enter-translate-y': '-100%',
          },
          '.slide-in-from-bottom': {
            '--tw-enter-translate-y': '100%',
          },
          '.slide-in-from-left': {
            '--tw-enter-translate-x': '-100%',
          },
          '.slide-in-from-right': {
            '--tw-enter-translate-x': '100%',
          },
          '.zoom-in': {
            '--tw-enter-scale': '0',
          },
          '.zoom-in-50': {
            '--tw-enter-scale': '0.5',
          },
          '.zoom-in-75': {
            '--tw-enter-scale': '0.75',
          },
          '.zoom-in-90': {
            '--tw-enter-scale': '0.9',
          },
          '.zoom-in-95': {
            '--tw-enter-scale': '0.95',
          },
        });
      }

      // Form utilities
      if (forms) {
        addUtilities({
          '.form-group': {
            marginBottom: '1rem',
          },
          '.form-label': {
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: '500',
            marginBottom: '0.375rem',
          },
          '.form-helper': {
            fontSize: '0.75rem',
            color: 'hsl(var(--muted-foreground))',
            marginTop: '0.25rem',
          },
          '.form-error': {
            fontSize: '0.75rem',
            color: 'hsl(var(--destructive))',
            marginTop: '0.25rem',
          },
        });
      }

      // Typography utilities
      if (typography) {
        addUtilities({
          '.text-balance': {
            textWrap: 'balance',
          },
          '.text-pretty': {
            textWrap: 'pretty',
          },
          '.truncate-2': {
            display: '-webkit-box',
            '-webkit-line-clamp': '2',
            '-webkit-box-orient': 'vertical',
            overflow: 'hidden',
          },
          '.truncate-3': {
            display: '-webkit-box',
            '-webkit-line-clamp': '3',
            '-webkit-box-orient': 'vertical',
            overflow: 'hidden',
          },
        });
      }

      // Dynamic utilities
      matchUtilities(
        {
          'animate-delay': (value) => ({
            animationDelay: value,
          }),
          'animate-duration': (value) => ({
            animationDuration: value,
          }),
        },
        {
          values: theme('transitionDelay'),
        }
      );
    },
    {
      theme: {
        extend: {},
      },
    }
  );
}

export function createPhilJSPlugin(options: PhilJSPluginOptions = {}) {
  return philjsTailwindPlugin(options);
}

export default philjsTailwindPlugin;
