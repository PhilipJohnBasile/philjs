/**
 * Hollow Design Tokens
 * CSS custom properties for theming
 */
/**
 * Color tokens
 */
export declare const colors: {
    readonly primary: "#3b82f6";
    readonly primaryForeground: "#ffffff";
    readonly secondary: "#f1f5f9";
    readonly secondaryForeground: "#0f172a";
    readonly success: "#22c55e";
    readonly successForeground: "#ffffff";
    readonly warning: "#f59e0b";
    readonly warningForeground: "#ffffff";
    readonly error: "#ef4444";
    readonly errorForeground: "#ffffff";
    readonly info: "#3b82f6";
    readonly infoForeground: "#ffffff";
    readonly text: "#0f172a";
    readonly textMuted: "#64748b";
    readonly textInverse: "#ffffff";
    readonly background: "#ffffff";
    readonly backgroundMuted: "#f8fafc";
    readonly border: "#e2e8f0";
    readonly borderFocus: "#3b82f6";
    readonly ring: "#3b82f680";
    readonly shadow: "rgba(0, 0, 0, 0.1)";
};
/**
 * Typography tokens
 */
export declare const typography: {
    readonly fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif";
    readonly fontFamilyMono: "ui-monospace, SFMono-Regular, \"SF Mono\", Menlo, Monaco, Consolas, monospace";
    readonly fontSize: {
        readonly xs: "0.75rem";
        readonly sm: "0.875rem";
        readonly md: "1rem";
        readonly lg: "1.125rem";
        readonly xl: "1.25rem";
        readonly '2xl': "1.5rem";
        readonly '3xl': "1.875rem";
        readonly '4xl': "2.25rem";
    };
    readonly fontWeight: {
        readonly normal: "400";
        readonly medium: "500";
        readonly semibold: "600";
        readonly bold: "700";
    };
    readonly lineHeight: {
        readonly tight: "1.25";
        readonly normal: "1.5";
        readonly relaxed: "1.75";
    };
};
/**
 * Spacing tokens
 */
export declare const spacing: {
    readonly 0: "0";
    readonly px: "1px";
    readonly 0.5: "0.125rem";
    readonly 1: "0.25rem";
    readonly 1.5: "0.375rem";
    readonly 2: "0.5rem";
    readonly 2.5: "0.625rem";
    readonly 3: "0.75rem";
    readonly 3.5: "0.875rem";
    readonly 4: "1rem";
    readonly 5: "1.25rem";
    readonly 6: "1.5rem";
    readonly 7: "1.75rem";
    readonly 8: "2rem";
    readonly 9: "2.25rem";
    readonly 10: "2.5rem";
    readonly 12: "3rem";
    readonly 14: "3.5rem";
    readonly 16: "4rem";
};
/**
 * Border radius tokens
 */
export declare const borderRadius: {
    readonly none: "0";
    readonly sm: "0.25rem";
    readonly md: "0.375rem";
    readonly lg: "0.5rem";
    readonly xl: "0.75rem";
    readonly '2xl': "1rem";
    readonly full: "9999px";
};
/**
 * Shadow tokens
 */
export declare const shadows: {
    readonly sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)";
    readonly md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)";
    readonly lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)";
    readonly xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)";
};
/**
 * Transition tokens
 */
export declare const transitions: {
    readonly fast: "100ms";
    readonly normal: "200ms";
    readonly slow: "300ms";
    readonly easing: "cubic-bezier(0.4, 0, 0.2, 1)";
};
/**
 * Z-index tokens
 */
export declare const zIndex: {
    readonly dropdown: "1000";
    readonly sticky: "1020";
    readonly fixed: "1030";
    readonly overlay: "1040";
    readonly modal: "1050";
    readonly popover: "1060";
    readonly tooltip: "1070";
};
/**
 * All tokens combined
 */
export declare const tokens: {
    readonly colors: {
        readonly primary: "#3b82f6";
        readonly primaryForeground: "#ffffff";
        readonly secondary: "#f1f5f9";
        readonly secondaryForeground: "#0f172a";
        readonly success: "#22c55e";
        readonly successForeground: "#ffffff";
        readonly warning: "#f59e0b";
        readonly warningForeground: "#ffffff";
        readonly error: "#ef4444";
        readonly errorForeground: "#ffffff";
        readonly info: "#3b82f6";
        readonly infoForeground: "#ffffff";
        readonly text: "#0f172a";
        readonly textMuted: "#64748b";
        readonly textInverse: "#ffffff";
        readonly background: "#ffffff";
        readonly backgroundMuted: "#f8fafc";
        readonly border: "#e2e8f0";
        readonly borderFocus: "#3b82f6";
        readonly ring: "#3b82f680";
        readonly shadow: "rgba(0, 0, 0, 0.1)";
    };
    readonly typography: {
        readonly fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif";
        readonly fontFamilyMono: "ui-monospace, SFMono-Regular, \"SF Mono\", Menlo, Monaco, Consolas, monospace";
        readonly fontSize: {
            readonly xs: "0.75rem";
            readonly sm: "0.875rem";
            readonly md: "1rem";
            readonly lg: "1.125rem";
            readonly xl: "1.25rem";
            readonly '2xl': "1.5rem";
            readonly '3xl': "1.875rem";
            readonly '4xl': "2.25rem";
        };
        readonly fontWeight: {
            readonly normal: "400";
            readonly medium: "500";
            readonly semibold: "600";
            readonly bold: "700";
        };
        readonly lineHeight: {
            readonly tight: "1.25";
            readonly normal: "1.5";
            readonly relaxed: "1.75";
        };
    };
    readonly spacing: {
        readonly 0: "0";
        readonly px: "1px";
        readonly 0.5: "0.125rem";
        readonly 1: "0.25rem";
        readonly 1.5: "0.375rem";
        readonly 2: "0.5rem";
        readonly 2.5: "0.625rem";
        readonly 3: "0.75rem";
        readonly 3.5: "0.875rem";
        readonly 4: "1rem";
        readonly 5: "1.25rem";
        readonly 6: "1.5rem";
        readonly 7: "1.75rem";
        readonly 8: "2rem";
        readonly 9: "2.25rem";
        readonly 10: "2.5rem";
        readonly 12: "3rem";
        readonly 14: "3.5rem";
        readonly 16: "4rem";
    };
    readonly borderRadius: {
        readonly none: "0";
        readonly sm: "0.25rem";
        readonly md: "0.375rem";
        readonly lg: "0.5rem";
        readonly xl: "0.75rem";
        readonly '2xl': "1rem";
        readonly full: "9999px";
    };
    readonly shadows: {
        readonly sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)";
        readonly md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)";
        readonly lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)";
        readonly xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)";
    };
    readonly transitions: {
        readonly fast: "100ms";
        readonly normal: "200ms";
        readonly slow: "300ms";
        readonly easing: "cubic-bezier(0.4, 0, 0.2, 1)";
    };
    readonly zIndex: {
        readonly dropdown: "1000";
        readonly sticky: "1020";
        readonly fixed: "1030";
        readonly overlay: "1040";
        readonly modal: "1050";
        readonly popover: "1060";
        readonly tooltip: "1070";
    };
};
/**
 * CSS custom properties string for injection
 */
export declare const designTokensCSS: string;
/**
 * Create a theme with custom token overrides
 */
export declare function createTheme(overrides: Partial<typeof tokens>): string;
//# sourceMappingURL=tokens.d.ts.map