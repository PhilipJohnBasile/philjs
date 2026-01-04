/**
 * PhilJS Tailwind Integration
 *
 * Official Tailwind CSS integration with:
 * - PhilJS preset with design tokens
 * - Tailwind plugin for PhilJS utilities
 * - Vite plugin for optimizations
 * - IntelliSense support
 */
export { philjsPreset, createPhilJSPreset } from './preset.js';
export type { PhilJSPresetOptions } from './preset.js';
export { philjsTailwindPlugin, createPhilJSPlugin } from './plugin.js';
export type { PhilJSPluginOptions } from './plugin.js';
export { philjsTailwindVite } from './vite-plugin.js';
export type { PhilJSTailwindViteOptions } from './vite-plugin.js';
export { tw, cn, clsx, cva, twMerge, twJoin, } from './utils.js';
export type { ClassValue, VariantProps, } from './types.js';
/**
 * Quick setup for PhilJS + Tailwind
 */
export declare function createTailwindConfig(options?: {
    content?: string[];
    darkMode?: 'class' | 'media' | ['class', string];
    theme?: Record<string, unknown>;
    plugins?: unknown[];
}): {
    content: string[];
    darkMode: "class" | "media" | ["class", string];
    presets: any[];
    theme: {
        extend: Record<string, unknown>;
    };
    plugins: any[];
};
//# sourceMappingURL=index.d.ts.map