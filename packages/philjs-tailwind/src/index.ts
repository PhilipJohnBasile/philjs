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
export type { PhilJSPresetOptions } from './preset.js';

// Plugin
export { philjsTailwindPlugin, createPhilJSPlugin } from './plugin.js';
export type { PhilJSPluginOptions } from './plugin.js';

// Vite plugin
export { philjsTailwindVite } from './vite-plugin.js';
export type { PhilJSTailwindViteOptions } from './vite-plugin.js';

// Utilities
export {
  tw,
  cn,
  clsx,
  cva,
  twMerge,
  twJoin,
} from './utils.js';

// Types
export type {
  ClassValue,
  VariantProps,
} from './types.js';

/**
 * Quick setup for PhilJS + Tailwind
 */
export function createTailwindConfig(options: {
  content?: string[];
  darkMode?: 'class' | 'media' | ['class', string];
  theme?: Record<string, unknown>;
  plugins?: unknown[];
} = {}) {
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
