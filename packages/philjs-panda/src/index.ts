/**
 * PhilJS Panda CSS Integration
 */

export function defineConfig(config: {
    theme?: { extend?: Record<string, any> };
    patterns?: Record<string, any>;
}) {
    return {
        ...config,
        philjs: true,
    };
}

export const pandaPreset = {
    name: 'philjs-panda',
    theme: {
        tokens: {
            colors: {
                'philjs.primary': { value: '#3b82f6' },
                'philjs.secondary': { value: '#8b5cf6' },
            }
        }
    },
    utilities: {
        signal: {
            className: 'signal',
            values: { pulse: { animation: 'pulse 2s infinite' } }
        }
    }
};
