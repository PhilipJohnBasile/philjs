/**
 * Color palettes and utilities for PhilJS Charts
 */
export declare const defaultPalette: string[];
export declare const colorBlindSafePalette: string[];
export declare const divergingPalette: {
    negative: string[];
    neutral: string;
    positive: string[];
};
export declare const sequentialPalettes: {
    blues: string[];
    greens: string[];
    oranges: string[];
    purples: string[];
    reds: string[];
};
export interface ChartTheme {
    name: string;
    colors: string[];
    background: string;
    text: string;
    grid: string;
    axis: string;
    tooltip: {
        background: string;
        text: string;
        border: string;
    };
}
export declare const lightTheme: ChartTheme;
export declare const darkTheme: ChartTheme;
export declare function adjustForDarkMode(color: string): string;
export declare function hexToRgba(hex: string, alpha: number): string;
export declare function generateGradient(startColor: string, endColor: string, steps: number): string[];
export declare function getContrastColor(backgroundColor: string): string;
export declare function createColorScale(domain: [number, number], palette: string[]): (value: number) => string;
//# sourceMappingURL=colors.d.ts.map