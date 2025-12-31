/**
 * Job Scheduler
 *
 * Cron-based job scheduling with timezone support and job history tracking.
 */
import type { JobDefinition } from './job.js';
import type { IQueue, EnqueueOptions } from './queue.js';
export interface ScheduleOptions {
    /** Cron expression */
    cron: string;
    /** Timezone (e.g., 'America/New_York', 'Europe/London') */
    timezone?: string;
    /** Job payload */
    payload?: any;
    /** Additional enqueue options */
    enqueueOptions?: EnqueueOptions;
    /** Maximum number of runs (undefined = unlimited) */
    maxRuns?: number;
    /** Start date (when to start scheduling) */
    startDate?: Date;
    /** End date (when to stop scheduling) */
    endDate?: Date;
    /** Callback when job is scheduled */
    onSchedule?: (scheduledAt: Date) => void | Promise<void>;
    /** Callback when schedule is complete */
    onComplete?: () => void | Promise<void>;
}
export interface ScheduledJob {
    id: string;
    jobName: string;
    cron: string;
    timezone?: string;
    nextRun: Date | null;
    lastRun?: Date;
    runsCount: number;
    maxRuns?: number;
    active: boolean;
    createdAt: Date;
}
export interface JobRun {
    id: string;
    scheduledJobId: string;
    jobId: string;
    scheduledAt: Date;
    startedAt?: Date;
    finishedAt?: Date;
    status: 'scheduled' | 'running' | 'completed' | 'failed';
    error?: string;
}
/**
 * Job Scheduler
 */
export declare class Scheduler {
    private queue;
    private scheduledJobs;
    private jobDefinitions;
    private scheduleOptions;
    private timers;
    private jobHistory;
    private maxHistorySize;
    private running;
    constructor(queue: IQueue);
    /**
     * Schedule a recurring job
     */
    schedule<TPayload>(job: JobDefinition<TPayload>, options: ScheduleOptions): string;
    /**
     * Schedule a one-time job
     */
    scheduleOnce<TPayload>(job: JobDefinition<TPayload>, payload: TPayload, scheduledAt: Date, enqueueOptions?: EnqueueOptions): string;
    /**
     * Start the scheduler
     */
    start(): void;
    /**
     * Stop the scheduler
     */
    stop(): void;
    /**
     * Pause a scheduled job
     */
    pause(scheduleId: string): boolean;
    /**
     * Resume a paused scheduled job
     */
    resume(scheduleId: string): boolean;
    /**
     * Remove a scheduled job
     */
    remove(scheduleId: string): boolean;
    /**
     * Get a scheduled job
     */
    getScheduledJob(scheduleId: string): ScheduledJob | null;
    /**
     * Get all scheduled jobs
     */
    getAllScheduledJobs(): ScheduledJob[];
    /**
     * Get job history
     */
    getJobHistory(scheduleId?: string): JobRun[];
    /**
     * Clear job history
     */
    clearHistory(): void;
    /**
     * Set maximum history size
     */
    setMaxHistorySize(size: number): void;
    private scheduleNextRun;
    private executeScheduledJob;
    private calculateNextRun;
    private addToHistory;
    private trimHistory;
    private generateScheduleId;
    private generateJobRunId;
}
/**
 * Helper functions for common cron patterns
 */
export declare const CronPatterns: {
    /** Every minute */
    EVERY_MINUTE: string;
    /** Every 5 minutes */
    EVERY_5_MINUTES: string;
    /** Every 15 minutes */
    EVERY_15_MINUTES: string;
    /** Every 30 minutes */
    EVERY_30_MINUTES: string;
    /** Every hour */
    EVERY_HOUR: string;
    /** Every day at midnight */
    DAILY: string;
    /** Every day at noon */
    DAILY_NOON: string;
    /** Every week on Sunday at midnight */
    WEEKLY: string;
    /** Every month on the 1st at midnight */
    MONTHLY: string;
    /** Every year on January 1st at midnight */
    YEARLY: string;
    /**
     * Create a cron pattern for specific time
     */
    at(hour: number, minute?: number): string;
    /**
     * Create a cron pattern for every N minutes
     */
    everyMinutes(n: number): string;
    /**
     * Create a cron pattern for every N hours
     */
    everyHours(n: number): string;
    /**
     * Create a cron pattern for specific day of week
     */
    weekday(day: 0 | 1 | 2 | 3 | 4 | 5 | 6, hour?: number, minute?: number): string;
    /**
     * Create a cron pattern for weekdays (Mon-Fri)
     */
    weekdays(hour?: number, minute?: number): string;
    /**
     * Create a cron pattern for weekends (Sat-Sun)
     */
    weekends(hour?: number, minute?: number): string;
};
/**
 * Common timezone identifiers
 */
export declare const Timezones: {
    UTC: string;
    NEW_YORK: string;
    CHICAGO: string;
    DENVER: string;
    LOS_ANGELES: string;
    LONDON: string;
    PARIS: string;
    BERLIN: string;
    TOKYO: string;
    SHANGHAI: string;
    HONG_KONG: string;
    SINGAPORE: string;
    SYDNEY: string;
    MELBOURNE: string;
};
//# sourceMappingURL=scheduler.d.ts.map