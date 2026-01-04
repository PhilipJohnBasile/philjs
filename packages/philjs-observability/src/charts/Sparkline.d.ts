/**
 * Sparkline Components - Compact inline charts
 */
export interface SparklineProps {
    data: number[];
    width?: number;
    height?: number;
    color?: string;
    strokeWidth?: number;
    showDots?: boolean;
    className?: string;
}
export interface SparkBarProps {
    data: number[];
    width?: number;
    height?: number;
    color?: string;
    gap?: number;
    className?: string;
}
export interface SparkAreaProps {
    data: number[];
    width?: number;
    height?: number;
    fillColor?: string;
    strokeColor?: string;
    strokeWidth?: number;
    className?: string;
}
/**
 * Sparkline - Simple line sparkline
 */
export declare function Sparkline(props: SparklineProps): string;
/**
 * SparkBar - Bar sparkline
 */
export declare function SparkBar(props: SparkBarProps): string;
/**
 * SparkArea - Area sparkline with fill
 */
export declare function SparkArea(props: SparkAreaProps): string;
//# sourceMappingURL=Sparkline.d.ts.map