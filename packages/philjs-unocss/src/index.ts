/**
 * UnoCSS Preset for PhilJS
 * 
 * Provides PhilJS-specific utilities and shortcuts.
 */

import type { Preset } from 'unocss';

export interface PhilJSPresetOptions {
    /** Prefix for PhilJS utilities */
    prefix?: string;
    /** Enable dark mode support */
    darkMode?: boolean;
    /** Custom theme colors */
    colors?: Record<string, string>;
}

/**
 * UnoCSS preset for PhilJS applications
 * 
 * @example
 * ```ts
 * // uno.config.ts
 * import { defineConfig } from 'unocss';
 * import { presetPhilJS } from '@philjs/unocss';
 * 
 * export default defineConfig({
 *   presets: [
 *     presetPhilJS({
 *       darkMode: true,
 *       colors: {
 *         primary: '#3b82f6',
 *         secondary: '#8b5cf6',
 *       },
 *     }),
 *   ],
 * });
 * ```
 */
export function presetPhilJS(options: PhilJSPresetOptions = {}): Preset {
    const { prefix = 'phil-', darkMode = true, colors = {} } = options;

    return {
        name: '@philjs/unocss',

        theme: {
            colors: {
                primary: colors.primary || '#3b82f6',
                secondary: colors.secondary || '#8b5cf6',
                accent: colors.accent || '#06b6d4',
                success: colors.success || '#22c55e',
                warning: colors.warning || '#f59e0b',
                error: colors.error || '#ef4444',
                ...colors,
            },
        },

        rules: [
            // Signal-aware animations
            [`${prefix}signal-pulse`, { animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }],
            [`${prefix}signal-spin`, { animation: 'spin 1s linear infinite' }],

            // Loading states
            [`${prefix}loading`, { opacity: '0.5', 'pointer-events': 'none' }],
            [`${prefix}skeleton`, {
                background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                'background-size': '200% 100%',
                animation: 'shimmer 1.5s infinite',
            }],

            // Island markers
            [`${prefix}island`, { '--philjs-island': '1' }],
            [`${prefix}hydrated`, { '--philjs-hydrated': '1' }],

            // Responsive containers
            [/^${prefix}container-(\w+)$/, ([, size]) => {
                const sizes: Record<string, string> = {
                    sm: '640px',
                    md: '768px',
                    lg: '1024px',
                    xl: '1280px',
                    '2xl': '1536px',
                };
                return { 'max-width': sizes[size] || size, 'margin-left': 'auto', 'margin-right': 'auto' };
            }],
        ],

        shortcuts: {
            // Button variants
            [`${prefix}btn`]: 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2',
            [`${prefix}btn-primary`]: `${prefix}btn bg-primary text-white hover:bg-primary/90`,
            [`${prefix}btn-secondary`]: `${prefix}btn bg-secondary text-white hover:bg-secondary/90`,
            [`${prefix}btn-outline`]: `${prefix}btn border border-input bg-transparent hover:bg-accent`,
            [`${prefix}btn-ghost`]: `${prefix}btn hover:bg-accent hover:text-accent-foreground`,

            // Card
            [`${prefix}card`]: 'rounded-lg border bg-white shadow-sm dark:bg-gray-800',
            [`${prefix}card-header`]: 'flex flex-col space-y-1.5 p-6',
            [`${prefix}card-content`]: 'p-6 pt-0',
            [`${prefix}card-footer`]: 'flex items-center p-6 pt-0',

            // Form elements
            [`${prefix}input`]: 'flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2',
            [`${prefix}label`]: 'text-sm font-medium leading-none',

            // Layout
            [`${prefix}container`]: 'mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8',
            [`${prefix}section`]: 'py-12 md:py-16 lg:py-20',

            // Flex utilities
            [`${prefix}center`]: 'flex items-center justify-center',
            [`${prefix}between`]: 'flex items-center justify-between',
            [`${prefix}stack`]: 'flex flex-col gap-4',
            [`${prefix}row`]: 'flex flex-row gap-4',
        },

        preflights: [
            {
                getCSS: () => `
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `,
            },
        ],
    };
}

export default presetPhilJS;
