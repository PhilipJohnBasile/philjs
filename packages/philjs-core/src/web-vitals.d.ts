/**
 * Web Vitals Monitoring
 *
 * Track and report Core Web Vitals and custom performance metrics:
 * - LCP (Largest Contentful Paint)
 * - FID (First Input Delay)
 * - CLS (Cumulative Layout Shift)
 * - FCP (First Contentful Paint)
 * - TTFB (Time to First Byte)
 * - INP (Interaction to Next Paint)
 * - Custom metrics
 */
import { type Signal } from './signals.js';
export interface WebVitalsMetric {
    /**
     * Metric name
     */
    name: 'LCP' | 'FID' | 'CLS' | 'FCP' | 'TTFB' | 'INP' | string;
    /**
     * Metric value
     */
    value: number;
    /**
     * Metric rating (good, needs-improvement, poor)
     */
    rating: 'good' | 'needs-improvement' | 'poor';
    /**
     * Delta from previous value
     */
    delta: number;
    /**
     * Unique ID
     */
    id: string;
    /**
     * Timestamp
     */
    timestamp: number;
    /**
     * Navigation type
     */
    navigationType: 'navigate' | 'reload' | 'back-forward' | 'prerender';
    /**
     * Additional metadata
     */
    metadata?: Record<string, any>;
}
export interface WebVitalsOptions {
    /**
     * Report callback
     */
    onReport?: (metric: WebVitalsMetric) => void;
    /**
     * Sampling rate (0-1)
     */
    samplingRate?: number;
    /**
     * Enable debug mode
     */
    debug?: boolean;
    /**
     * Custom thresholds
     */
    thresholds?: Partial<Record<string, [number, number]>>;
    /**
     * Report to analytics
     */
    analytics?: {
        provider: 'google-analytics' | 'custom';
        trackingId?: string;
        send?: (metric: WebVitalsMetric) => void;
    };
}
export interface PerformanceMetrics {
    lcp: Signal<WebVitalsMetric | null>;
    fid: Signal<WebVitalsMetric | null>;
    cls: Signal<WebVitalsMetric | null>;
    fcp: Signal<WebVitalsMetric | null>;
    ttfb: Signal<WebVitalsMetric | null>;
    inp: Signal<WebVitalsMetric | null>;
}
export declare class WebVitalsMonitor {
    private options;
    private metrics;
    private observers;
    lcp: Signal<WebVitalsMetric | null>;
    fid: Signal<WebVitalsMetric | null>;
    cls: Signal<WebVitalsMetric | null>;
    fcp: Signal<WebVitalsMetric | null>;
    ttfb: Signal<WebVitalsMetric | null>;
    inp: Signal<WebVitalsMetric | null>;
    constructor(options?: WebVitalsOptions);
    private init;
    /**
     * Observe Largest Contentful Paint
     */
    private observeLCP;
    /**
     * Observe First Input Delay
     */
    private observeFID;
    /**
     * Observe Cumulative Layout Shift
     */
    private observeCLS;
    /**
     * Observe First Contentful Paint
     */
    private observeFCP;
    /**
     * Observe Time to First Byte
     */
    private observeTTFB;
    /**
     * Observe Interaction to Next Paint
     */
    private observeINP;
    /**
     * Report metric
     */
    private reportMetric;
    /**
     * Get rating based on thresholds
     */
    private getRating;
    /**
     * Get navigation type
     */
    private getNavigationType;
    /**
     * Send metric to analytics
     */
    private sendToAnalytics;
    /**
     * Report all metrics
     */
    reportAll(): void;
    /**
     * Get all metrics
     */
    getMetrics(): WebVitalsMetric[];
    /**
     * Get metric by name
     */
    getMetric(name: string): WebVitalsMetric | undefined;
    /**
     * Clear all metrics
     */
    clear(): void;
    /**
     * Disconnect all observers
     */
    disconnect(): void;
    /**
     * Generate unique ID
     */
    private generateId;
    /**
     * Debug log
     */
    private log;
}
/**
 * Initialize Web Vitals monitoring
 */
export declare function initWebVitals(options?: WebVitalsOptions): WebVitalsMonitor;
/**
 * Get Web Vitals monitor instance
 */
export declare function getWebVitalsMonitor(): WebVitalsMonitor | null;
/**
 * Report Web Vitals to callback
 */
export declare function reportWebVitals(callback: (metric: WebVitalsMetric) => void): void;
/**
 * Get current Web Vitals metrics
 */
export declare function getWebVitalsMetrics(): PerformanceMetrics;
declare global {
    function gtag(...args: any[]): void;
}
//# sourceMappingURL=web-vitals.d.ts.map