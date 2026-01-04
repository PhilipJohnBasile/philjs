/**
 * PhilJS Theme System (Chakra-style)
 */

import { signal, memo } from '@philjs/core';

export interface ThemeConfig {
    colors?: Record<string, Record<number, string>>;
    fonts?: { heading?: string; body?: string; mono?: string };
    space?: Record<number, string>;
    radii?: Record<string, string>;
}

const defaultTheme: ThemeConfig = {
    colors: {
        gray: { 50: '#f7fafc', 100: '#edf2f7', 500: '#718096', 900: '#1a202c' },
        blue: { 50: '#ebf8ff', 500: '#3182ce', 600: '#2b6cb0' },
    },
    fonts: { heading: 'Inter, sans-serif', body: 'Inter, sans-serif', mono: 'monospace' },
    space: { 1: '0.25rem', 2: '0.5rem', 4: '1rem', 8: '2rem' },
    radii: { none: '0', sm: '0.125rem', md: '0.375rem', lg: '0.5rem', full: '9999px' },
};

const themeConfig = signal<ThemeConfig>(defaultTheme);
const colorMode = signal<'light' | 'dark'>('light');

export const theme = memo(() => themeConfig());
export function extendTheme(config: ThemeConfig) { themeConfig.update(t => ({ ...t, ...config })); }
export function useColorMode() { return { colorMode, toggle: () => colorMode.update(m => m === 'light' ? 'dark' : 'light') }; }
export function useTheme() { return theme(); }
