/**
 * PhilJS Tailwind Integration
 *
 * Official Tailwind CSS integration with:
 * - PhilJS preset with design tokens
 * - Tailwind plugin for PhilJS utilities
 * - Vite plugin for optimizations
 * - IntelliSense support
 */
// Preset
export { philjsPreset, createPhilJSPreset } from './preset.js';
// Plugin
export { philjsTailwindPlugin, createPhilJSPlugin } from './plugin.js';
// Vite plugin
export { philjsTailwindVite } from './vite-plugin.js';
// Utilities
export { tw, cn, clsx, cva, twMerge, twJoin, } from './utils.js';
/**
 * Quick setup for PhilJS + Tailwind
 */
export function createTailwindConfig(options = {}) {
    const { philjsPreset } = require('./preset');
    const { philjsTailwindPlugin } = require('./plugin');
    return {
        content: options.content || [
            './src/**/*.{js,ts,jsx,tsx}',
            './index.html',
        ],
        darkMode: options.darkMode || 'class',
        presets: [philjsPreset()],
        theme: {
            extend: options.theme || {},
        },
        plugins: [
            philjsTailwindPlugin(),
            ...(options.plugins || []),
        ],
    };
}
//# sourceMappingURL=index.js.map