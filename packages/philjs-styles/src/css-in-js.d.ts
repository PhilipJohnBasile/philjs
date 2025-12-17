/**
 * PhilJS CSS-in-JS
 *
 * Runtime CSS-in-JS with theming support.
 */
import type { CSSProperties, Theme, ThemeConfig } from './types';
/**
 * Create a theme configuration
 */
export declare function createTheme(config: ThemeConfig): Theme;
/**
 * Get the current theme
 */
export declare function useTheme(): Theme;
/**
 * Set the current theme
 */
export declare function setTheme(theme: Theme | Partial<Theme>): void;
/**
 * Subscribe to theme changes
 */
export declare function subscribeToTheme(callback: (theme: Theme) => void): () => void;
/**
 * Theme Provider component
 */
export declare function ThemeProvider(props: {
    theme?: Theme | ThemeConfig;
    children: any;
}): any;
/**
 * Create a styled component factory
 */
export declare function createStyled<ComponentProps extends object = {}>(Component: string | ((props: ComponentProps) => any)): (stylesOrFactory: CSSProperties | ((props: ComponentProps & {
    theme: Theme;
}) => CSSProperties)) => (props: ComponentProps & {
    className?: string;
    children?: any;
}) => any;
//# sourceMappingURL=css-in-js.d.ts.map