/**
 * Job Monitoring
 *
 * Job status tracking, progress reporting, and statistics.
 */
import type { IQueue, Job, QueueStats } from './queue.js';
import type { Scheduler, ScheduledJob, JobRun } from './scheduler.js';
export interface JobMetrics {
    totalJobs: number;
    completedJobs: number;
    failedJobs: number;
    activeJobs: number;
    waitingJobs: number;
    delayedJobs: number;
    averageProcessingTime: number;
    successRate: number;
    failureRate: number;
    throughput: number;
}
export interface JobDetail extends Job {
    duration?: number;
    retries: number;
    logs?: string[];
}
export interface SystemHealth {
    status: 'healthy' | 'degraded' | 'critical';
    queueDepth: number;
    processingRate: number;
    errorRate: number;
    averageWaitTime: number;
    oldestWaitingJob?: Date;
    issues: string[];
}
export interface MonitorOptions {
    /** Metrics collection interval (ms) */
    metricsInterval?: number;
    /** Number of metrics snapshots to keep */
    metricsHistorySize?: number;
    /** Health check interval (ms) */
    healthCheckInterval?: number;
    /** Thresholds for health status */
    healthThresholds?: {
        queueDepthWarning?: number;
        queueDepthCritical?: number;
        errorRateWarning?: number;
        errorRateCritical?: number;
        processingRateWarning?: number;
    };
}
export interface MetricsSnapshot {
    timestamp: Date;
    metrics: JobMetrics;
    queueStats: QueueStats;
}
/**
 * Job Monitor
 */
export declare class Monitor {
    private queue;
    private scheduler?;
    private metricsHistory;
    private metricsInterval?;
    private healthCheckInterval?;
    private options;
    private jobTimings;
    private completionTimes;
    constructor(queue: IQueue, scheduler?: Scheduler | undefined, options?: MonitorOptions);
    /**
     * Start monitoring
     */
    start(): void;
    /**
     * Stop monitoring
     */
    stop(): void;
    /**
     * Get current metrics
     */
    getMetrics(): Promise<JobMetrics>;
    /**
     * Get metrics history
     */
    getMetricsHistory(): MetricsSnapshot[];
    /**
     * Get system health status
     */
    getHealth(): Promise<SystemHealth>;
    /**
     * Get job details
     */
    getJobDetails(jobId: string): Promise<JobDetail | null>;
    /**
     * Get scheduled jobs overview
     */
    getScheduledJobsOverview(): ScheduledJob[] | null;
    /**
     * Get job run history
     */
    getJobRunHistory(scheduleId?: string): JobRun[] | null;
    /**
     * Retry a failed job
     */
    retryJob(jobId: string): Promise<boolean>;
    /**
     * Retry all failed jobs
     */
    retryAllFailed(): Promise<number>;
    /**
     * Record job start time
     */
    recordJobStart(jobId: string): void;
    /**
     * Record job completion
     */
    recordJobCompletion(jobId: string, _success: boolean): void;
    /**
     * Clear all metrics
     */
    clearMetrics(): void;
    /**
     * Export metrics as JSON
     */
    exportMetrics(): Promise<string>;
    /**
     * Generate HTML dashboard
     */
    generateDashboard(): Promise<string>;
    private collectMetrics;
    private calculateThroughput;
}
//# sourceMappingURL=monitor.d.ts.map