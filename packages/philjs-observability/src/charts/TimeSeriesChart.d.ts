/**
 * TimeSeriesChart - Line chart for time-series data visualization
 */
export interface DataPoint {
    timestamp: number;
    value: number;
    label?: string;
}
export interface TimeSeries {
    name: string;
    data: DataPoint[];
    color?: string;
    strokeWidth?: number;
}
export interface TimeSeriesChartProps {
    series: TimeSeries[];
    width?: number;
    height?: number;
    showLegend?: boolean;
    showGrid?: boolean;
    showTooltip?: boolean;
    xAxisLabel?: string;
    yAxisLabel?: string;
    timeFormat?: string;
    className?: string;
}
export declare function TimeSeriesChart(props: TimeSeriesChartProps): string;
//# sourceMappingURL=TimeSeriesChart.d.ts.map