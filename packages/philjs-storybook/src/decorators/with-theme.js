/**
 * Theme Decorator
 *
 * Wraps stories with theme context
 */
import { signal } from '@philjs/core';
/**
 * Decorator that provides theme context to stories
 */
export function withTheme(options = {}) {
    const { defaultTheme = 'light', themes = {} } = options;
    return (storyFn, context) => {
        const theme$ = signal(defaultTheme);
        // Apply theme styles
        const applyTheme = (mode) => {
            const themeVars = themes[mode];
            if (themeVars) {
                const root = document.documentElement;
                for (const key of Object.keys(themeVars)) {
                    const value = themeVars[key];
                    if (value !== undefined) {
                        root.style.setProperty(`--${key}`, value);
                    }
                }
            }
        };
        // Apply initial theme
        applyTheme(defaultTheme);
        // Attach theme utilities to context
        if (context && context.parameters) {
            context.parameters['theme'] = {
                current: theme$,
                setTheme: (mode) => {
                    theme$.set(mode);
                    applyTheme(mode);
                },
            };
        }
        return storyFn();
    };
}
//# sourceMappingURL=with-theme.js.map