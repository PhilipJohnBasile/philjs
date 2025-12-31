/**
 * Generate comparison charts from benchmark results.
 */
import type { FullBenchmarkReport, BenchmarkResult } from '../types.js';
export interface ChartData {
    labels: string[];
    datasets: {
        label: string;
        data: number[];
        backgroundColor?: string;
        borderColor?: string;
    }[];
}
export interface ComparisonData {
    philjs: FullBenchmarkReport;
    frameworks: Record<string, any>;
}
/**
 * Load framework comparison data.
 */
export declare function loadComparisonData(frameworksPath?: string): Promise<Record<string, any>>;
/**
 * Generate comparison chart data.
 */
export declare function generateComparisonChart(philjsResults: BenchmarkResult[], frameworkData: Record<string, any>, benchmarkName: string): ChartData;
/**
 * Generate multiple comparison charts.
 */
export declare function generateAllComparisonCharts(philjsResults: BenchmarkResult[], frameworkData: Record<string, any>): Record<string, ChartData>;
/**
 * Generate Chart.js configuration.
 */
export declare function generateChartJsConfig(chartData: ChartData, options?: {
    title?: string;
    yAxisLabel?: string;
    type?: 'bar' | 'line' | 'radar';
}): string;
/**
 * Generate HTML page with all comparison charts.
 */
export declare function generateComparisonHTML(charts: Record<string, ChartData>, philjsResults: BenchmarkResult[], frameworkData: Record<string, any>): string;
/**
 * Generate and save comparison charts.
 */
export declare function generateAndSaveCharts(philjsReport: FullBenchmarkReport, outputDir: string, frameworksPath?: string): Promise<void>;
/**
 * Generate markdown comparison table.
 */
export declare function generateComparisonMarkdown(philjsResults: BenchmarkResult[], frameworkData: Record<string, any>): string;
//# sourceMappingURL=chart-generator.d.ts.map