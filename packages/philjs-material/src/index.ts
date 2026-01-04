/**
 * PhilJS Material Design Theme
 */

import { signal, memo } from '@philjs/core';

export type ThemeMode = 'light' | 'dark' | 'system';

const themeMode = signal<ThemeMode>('system');

const lightColors = {
    primary: '#6750A4',
    onPrimary: '#FFFFFF',
    secondary: '#625B71',
    surface: '#FFFBFE',
    background: '#FFFBFE',
    error: '#B3261E',
};

const darkColors = {
    primary: '#D0BCFF',
    onPrimary: '#381E72',
    secondary: '#CCC2DC',
    surface: '#1C1B1F',
    background: '#1C1B1F',
    error: '#F2B8B5',
};

export const theme = memo(() => {
    const mode = themeMode();
    const systemDark = typeof window !== 'undefined'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
        : false;
    return (mode === 'dark' || (mode === 'system' && systemDark)) ? darkColors : lightColors;
});

export function setThemeMode(mode: ThemeMode) { themeMode.set(mode); }
export function useTheme() { return { theme, mode: themeMode, setMode: setThemeMode }; }
