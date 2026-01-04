/**
 * Histogram - Bar chart for distribution visualization
 */
export interface HistogramBucket {
    label: string;
    value: number;
    color?: string;
}
export interface HistogramProps {
    buckets: HistogramBucket[];
    width?: number;
    height?: number;
    barColor?: string;
    showValues?: boolean;
    showLabels?: boolean;
    xAxisLabel?: string;
    yAxisLabel?: string;
    className?: string;
}
export declare function Histogram(props: HistogramProps): string;
//# sourceMappingURL=Histogram.d.ts.map