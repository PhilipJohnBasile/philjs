/**
 * Gauge Charts - Circular progress/value indicators
 */
export interface GaugeChartProps {
    value: number;
    min?: number;
    max?: number;
    width?: number;
    height?: number;
    color?: string;
    backgroundColor?: string;
    showValue?: boolean;
    label?: string;
    unit?: string;
    thresholds?: {
        value: number;
        color: string;
    }[];
    className?: string;
}
export interface MiniGaugeProps {
    value: number;
    max?: number;
    size?: number;
    color?: string;
    backgroundColor?: string;
    strokeWidth?: number;
    className?: string;
}
export interface HalfGaugeProps {
    value: number;
    min?: number;
    max?: number;
    width?: number;
    height?: number;
    color?: string;
    backgroundColor?: string;
    showValue?: boolean;
    label?: string;
    unit?: string;
    className?: string;
}
/**
 * GaugeChart - Full circular gauge
 */
export declare function GaugeChart(props: GaugeChartProps): string;
/**
 * MiniGauge - Compact circular progress
 */
export declare function MiniGauge(props: MiniGaugeProps): string;
/**
 * HalfGauge - Semi-circular gauge
 */
export declare function HalfGauge(props: HalfGaugeProps): string;
//# sourceMappingURL=GaugeChart.d.ts.map