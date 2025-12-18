/**
 * PhilJS UI - Spinner & Progress Components
 */
export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export interface SpinnerProps {
    size?: SpinnerSize;
    color?: string;
    thickness?: string;
    speed?: string;
    label?: string;
    className?: string;
}
export declare function Spinner(props: SpinnerProps): import("philjs-core").JSXElement;
/**
 * Progress Bar
 */
export type ProgressSize = 'xs' | 'sm' | 'md' | 'lg';
export type ProgressColor = 'blue' | 'green' | 'red' | 'yellow' | 'purple';
export interface ProgressProps {
    value: number;
    max?: number;
    size?: ProgressSize;
    color?: ProgressColor;
    showValue?: boolean;
    striped?: boolean;
    animated?: boolean;
    label?: string;
    className?: string;
}
export declare function Progress(props: ProgressProps): import("philjs-core").JSXElement;
/**
 * Circular Progress
 */
export interface CircularProgressProps {
    value: number;
    max?: number;
    size?: number;
    thickness?: number;
    color?: string;
    trackColor?: string;
    showValue?: boolean;
    className?: string;
}
export declare function CircularProgress(props: CircularProgressProps): import("philjs-core").JSXElement;
/**
 * Skeleton Loader
 */
export interface SkeletonProps {
    variant?: 'text' | 'circular' | 'rectangular';
    width?: string | number;
    height?: string | number;
    className?: string;
}
export declare function Skeleton(props: SkeletonProps): import("philjs-core").JSXElement;
//# sourceMappingURL=Spinner.d.ts.map