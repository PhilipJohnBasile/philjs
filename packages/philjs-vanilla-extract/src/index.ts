/**
 * PhilJS vanilla-extract Integration
 */

import { signal } from '@philjs/core';

export interface ThemeContract { colors: Record<string, string>; space: Record<string, string>; }

export function createPhilJSTheme<T extends ThemeContract>(contract: T) {
    const activeTheme = signal<T>(contract);

    return {
        theme: activeTheme,
        vars: contract,
        setTheme: (newTheme: Partial<T>) => activeTheme.update(t => ({ ...t, ...newTheme })),
    };
}

export function style(styles: Record<string, any>) {
    return styles; // In real impl, this would return a className
}

export function recipe(config: { base?: Record<string, any>; variants?: Record<string, Record<string, Record<string, any>>> }) {
    return (variantProps: Record<string, string>) => {
        // Return combined styles based on variants
        return config.base || {};
    };
}
