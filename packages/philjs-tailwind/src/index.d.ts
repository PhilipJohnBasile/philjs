/**
 * PhilJS Tailwind Integration
 *
 * Official Tailwind CSS integration with:
 * - PhilJS preset with design tokens
 * - Tailwind plugin for PhilJS utilities
 * - Vite plugin for optimizations
 * - IntelliSense support
 */
export { philjsPreset, createPhilJSPreset } from './preset';
export type { PhilJSPresetOptions } from './preset';
export { philjsTailwindPlugin, createPhilJSPlugin } from './plugin';
export type { PhilJSPluginOptions } from './plugin';
export { philjsTailwindVite } from './vite-plugin';
export type { PhilJSTailwindViteOptions } from './vite-plugin';
export { tw, cn, clsx, cva, twMerge, twJoin, } from './utils';
export type { ClassValue, VariantProps, } from './types';
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