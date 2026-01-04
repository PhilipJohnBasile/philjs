/**
 * PhilJS Tailwind v4 Compatibility
 */

export const tailwindV4Plugin = {
    name: '@philjs/tailwind-v4',
    version: '4.0.0',

    // CSS-first configuration
    cssTheme: `
    @theme {
      --color-philjs-primary: #3b82f6;
      --color-philjs-secondary: #8b5cf6;
      --color-philjs-accent: #06b6d4;
      
      --font-philjs: 'Inter', system-ui, sans-serif;
      
      --animate-signal-pulse: signal-pulse 2s ease-in-out infinite;
    }
    
    @keyframes signal-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `,

    // Utilities
    utilities: {
        '.signal-reactive': { '--tw-signal-reactive': '1' },
        '.hydrated': { '[data-hydrated="true"]': {} },
    }
};

export function withPhilJS(config: any) {
    return {
        ...config,
        theme: {
            ...config.theme,
            extend: {
                ...config.theme?.extend,
                colors: {
                    ...config.theme?.extend?.colors,
                    philjs: {
                        primary: '#3b82f6',
                        secondary: '#8b5cf6',
                        accent: '#06b6d4',
                    }
                }
            }
        }
    };
}
