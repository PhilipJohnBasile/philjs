/**
 * PhilJS DevTools - Performance Profiler
 */
import type { PerformanceMetrics } from '../types';
export declare class PerformanceProfiler {
    private metrics;
    private isRecording;
    private renderHistory;
    constructor();
    update(metrics: PerformanceMetrics): void;
    startRecording(): void;
    stopRecording(): void;
    clearHistory(): void;
    render(): string;
    private renderMetricsGrid;
    private renderWebVitals;
    private renderRenderTimeline;
    private renderHydrationInfo;
    private calculateAverageRenderTime;
}
//# sourceMappingURL=PerformanceProfiler.d.ts.map