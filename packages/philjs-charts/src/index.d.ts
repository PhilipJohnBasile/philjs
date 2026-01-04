/**
 * @philjs/charts - Data visualization library for PhilJS
 *
 * Features:
 * - Line, Bar, Area, Pie, Donut, Scatter, Bubble charts
 * - Real-time data streaming
 * - Interactive tooltips and legends
 * - Responsive and mobile-friendly
 * - Animation and transitions
 * - Multiple axes and mixed chart types
 * - Themes and customization
 * - Canvas and SVG renderers
 * - Zoom and pan
 * - Export to PNG/SVG
 */
type ChartType = 'line' | 'bar' | 'area' | 'pie' | 'donut' | 'scatter' | 'bubble' | 'radar' | 'heatmap';
interface DataPoint {
    x: number | string | Date;
    y: number;
    label?: string;
    color?: string;
    size?: number;
    metadata?: Record<string, any>;
}
interface DataSeries {
    name: string;
    data: DataPoint[];
    color?: string;
    type?: ChartType;
    yAxisIndex?: number;
    hidden?: boolean;
}
interface AxisConfig {
    title?: string;
    min?: number;
    max?: number;
    tickCount?: number;
    tickFormat?: (value: number) => string;
    gridLines?: boolean;
    position?: 'left' | 'right' | 'top' | 'bottom';
}
interface LegendConfig {
    show?: boolean;
    position?: 'top' | 'bottom' | 'left' | 'right';
    align?: 'start' | 'center' | 'end';
}
interface TooltipConfig {
    show?: boolean;
    format?: (point: DataPoint, series: DataSeries) => string;
    shared?: boolean;
}
interface AnimationConfig {
    enabled?: boolean;
    duration?: number;
    easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'bounce';
}
interface ChartConfig {
    type: ChartType;
    width?: number;
    height?: number;
    padding?: {
        top: number;
        right: number;
        bottom: number;
        left: number;
    };
    title?: string;
    subtitle?: string;
    xAxis?: AxisConfig;
    yAxis?: AxisConfig | AxisConfig[];
    legend?: LegendConfig;
    tooltip?: TooltipConfig;
    animation?: AnimationConfig;
    theme?: 'light' | 'dark' | 'custom';
    colors?: string[];
    responsive?: boolean;
    renderer?: 'canvas' | 'svg';
}
declare const defaultColors: string[];
declare const darkTheme: {
    background: string;
    text: string;
    gridLines: string;
    axis: string;
};
declare const lightTheme: {
    background: string;
    text: string;
    gridLines: string;
    axis: string;
};
declare class LinearScale {
    private domain;
    private range;
    constructor(domain: [number, number], range: [number, number]);
    scale(value: number): number;
    invert(value: number): number;
    ticks(count?: number): number[];
}
declare class BandScale {
    private domain;
    private range;
    private paddingInner;
    private paddingOuter;
    constructor(domain: string[], range: [number, number], padding?: number);
    scale(value: string): number;
    bandwidth(): number;
}
declare class TimeScale extends LinearScale {
    constructor(domain: [Date, Date], range: [number, number]);
    scaleTime(value: Date): number;
}
interface Renderer {
    clear(): void;
    line(points: Array<{
        x: number;
        y: number;
    }>, options: {
        color: string;
        width: number;
        dash?: number[];
    }): void;
    rect(x: number, y: number, width: number, height: number, options: {
        fill?: string;
        stroke?: string;
        radius?: number;
    }): void;
    circle(x: number, y: number, radius: number, options: {
        fill?: string;
        stroke?: string;
    }): void;
    arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, options: {
        fill?: string;
        stroke?: string;
    }): void;
    text(x: number, y: number, text: string, options: {
        color?: string;
        size?: number;
        align?: 'left' | 'center' | 'right';
        baseline?: 'top' | 'middle' | 'bottom';
    }): void;
    path(d: string, options: {
        fill?: string;
        stroke?: string;
        width?: number;
    }): void;
    getCanvas(): HTMLCanvasElement | null;
    getSVG(): SVGElement | null;
}
declare class CanvasRenderer implements Renderer {
    private canvas;
    private ctx;
    private width;
    private height;
    constructor(container: HTMLElement, width: number, height: number);
    clear(): void;
    line(points: Array<{
        x: number;
        y: number;
    }>, options: {
        color: string;
        width: number;
        dash?: number[];
    }): void;
    rect(x: number, y: number, width: number, height: number, options: {
        fill?: string;
        stroke?: string;
        radius?: number;
    }): void;
    circle(x: number, y: number, radius: number, options: {
        fill?: string;
        stroke?: string;
    }): void;
    arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, options: {
        fill?: string;
        stroke?: string;
    }): void;
    text(x: number, y: number, text: string, options: {
        color?: string;
        size?: number;
        align?: 'left' | 'center' | 'right';
        baseline?: 'top' | 'middle' | 'bottom';
    }): void;
    path(d: string, options: {
        fill?: string;
        stroke?: string;
        width?: number;
    }): void;
    getCanvas(): HTMLCanvasElement;
    getSVG(): SVGElement | null;
}
declare class Chart {
    private container;
    private config;
    private renderer;
    private series;
    private width;
    private height;
    private plotArea;
    private theme;
    private colors;
    private tooltip;
    private animationProgress;
    private animationFrame;
    private listeners;
    constructor(container: HTMLElement, config: ChartConfig);
    private mergeConfig;
    private createTooltip;
    private setupEvents;
    private handleMouseMove;
    private handleMouseLeave;
    private handleClick;
    private handleResize;
    private findNearestPoint;
    private getPointX;
    private getPointY;
    setData(series: DataSeries[]): this;
    addSeries(series: DataSeries): this;
    removeSeries(name: string): this;
    updateSeries(name: string, data: DataPoint[]): this;
    render(): this;
    private animate;
    private applyEasing;
    private draw;
    private drawBackground;
    private drawTitle;
    private drawAxes;
    private drawXAxisLabels;
    private drawYAxisLabels;
    private drawGridLines;
    private drawSeries;
    private drawLineSeries;
    private drawBarSeries;
    private drawAreaSeries;
    private drawPieSeries;
    private drawScatterSeries;
    private drawLegend;
    toDataURL(type?: string): string;
    download(filename?: string): void;
    on(event: string, callback: Function): () => void;
    private emit;
    destroy(): void;
}
interface UseChartResult {
    chart: Chart | null;
    setData: (series: DataSeries[]) => void;
    addSeries: (series: DataSeries) => void;
    removeSeries: (name: string) => void;
    updateSeries: (name: string, data: DataPoint[]) => void;
    render: () => void;
    download: (filename?: string) => void;
}
declare function useChart(container: HTMLElement | null, config: ChartConfig): UseChartResult;
declare function useRealtimeChart(container: HTMLElement | null, config: ChartConfig, dataStream: AsyncGenerator<DataPoint>): UseChartResult;
export { Chart, CanvasRenderer, LinearScale, BandScale, TimeScale, useChart, useRealtimeChart, defaultColors, darkTheme, lightTheme, type ChartType, type DataPoint, type DataSeries, type AxisConfig, type LegendConfig, type TooltipConfig, type AnimationConfig, type ChartConfig, type Renderer, type UseChartResult };
//# sourceMappingURL=index.d.ts.map