/**
 * Theme Decorator
 *
 * Wraps stories with theme context
 */
export type ThemeMode = 'light' | 'dark' | 'system';
export interface WithThemeOptions {
    defaultTheme?: ThemeMode;
    themes?: Record<string, Record<string, string>>;
}
/**
 * Decorator that provides theme context to stories
 */
export declare function withTheme(options?: WithThemeOptions): (storyFn: () => any, context: any) => any;
//# sourceMappingURL=with-theme.d.ts.map