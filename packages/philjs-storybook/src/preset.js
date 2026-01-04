/**
 * PhilJS Storybook Preset
 *
 * Configures Storybook to work seamlessly with PhilJS components
 */
export const viteFinal = async (config) => {
    return {
        ...config,
        resolve: {
            ...config.resolve,
            alias: {
                ...config.resolve?.alias,
                'react': '@philjs/core',
                'react-dom': '@philjs/core',
                'react/jsx-runtime': '@philjs/core/jsx-runtime',
                'react/jsx-dev-runtime': '@philjs/core/jsx-dev-runtime',
            },
        },
        optimizeDeps: {
            ...config.optimizeDeps,
            include: [
                ...(config.optimizeDeps?.include || []),
                '@philjs/core',
                'philjs-router',
            ],
        },
        esbuild: {
            ...config.esbuild,
            jsxFactory: 'h',
            jsxFragment: 'Fragment',
            jsxInject: `import { h, Fragment } from '@philjs/core'`,
        },
    };
};
export const core = {
    builder: '@storybook/builder-vite',
};
export const framework = {
    name: 'philjs-storybook',
    options: {},
};
export const addons = [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-links',
    'philjs-storybook/addons/signal-inspector',
    'philjs-storybook/addons/route-tester',
    'philjs-storybook/addons/theme-switcher',
    'philjs-storybook/addons/viewport',
    'msw-storybook-addon',
];
export const typescript = {
    check: false,
    reactDocgen: false,
};
export const docs = {
    autodocs: 'tag',
};
/**
 * Main preset configuration
 */
export const presetConfig = {
    core,
    framework: framework,
    addons,
    typescript,
    docs,
};
export default presetConfig;
//# sourceMappingURL=preset.js.map