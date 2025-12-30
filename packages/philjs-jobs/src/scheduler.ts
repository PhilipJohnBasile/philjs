/**
 * Job Scheduler
 *
 * Cron-based job scheduling with timezone support and job history tracking.
 */

import { parseExpression } from 'cron-parser';
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
export class Scheduler {
  private scheduledJobs = new Map<string, ScheduledJob>();
  private jobDefinitions = new Map<string, JobDefinition>();
  private scheduleOptions = new Map<string, ScheduleOptions>();
  private timers = new Map<string, NodeJS.Timeout>();
  private jobHistory: JobRun[] = [];
  private maxHistorySize = 1000;
  private running = false;

  constructor(private queue: IQueue) {}

  /**
   * Schedule a recurring job
   */
  schedule<TPayload>(
    job: JobDefinition<TPayload>,
    options: ScheduleOptions
  ): string {
    const scheduleId = this.generateScheduleId();

    // Validate cron expression
    try {
      const parserOptions: { currentDate: Date; tz?: string } = {
        currentDate: options.startDate || new Date(),
      };
      if (options.timezone !== undefined) {
        parserOptions.tz = options.timezone;
      }
      parseExpression(options.cron, parserOptions);
    } catch (error) {
      throw new Error(`Invalid cron expression: ${options.cron}`);
    }

    // Build scheduledJob excluding undefined optional properties (for exactOptionalPropertyTypes)
    const scheduledJob: ScheduledJob = {
      id: scheduleId,
      jobName: job.name,
      cron: options.cron,
      nextRun: this.calculateNextRun(options),
      runsCount: 0,
      active: true,
      createdAt: new Date(),
    };
    if (options.timezone !== undefined) scheduledJob.timezone = options.timezone;
    if (options.maxRuns !== undefined) scheduledJob.maxRuns = options.maxRuns;

    this.scheduledJobs.set(scheduleId, scheduledJob);
    this.jobDefinitions.set(job.name, job);
    this.scheduleOptions.set(scheduleId, options);

    if (this.running) {
      this.scheduleNextRun(scheduleId);
    }

    return scheduleId;
  }

  /**
   * Schedule a one-time job
   */
  scheduleOnce<TPayload>(
    job: JobDefinition<TPayload>,
    payload: TPayload,
    scheduledAt: Date,
    enqueueOptions?: EnqueueOptions
  ): string {
    const scheduleId = this.generateScheduleId();

    const scheduledJob: ScheduledJob = {
      id: scheduleId,
      jobName: job.name,
      cron: '',
      nextRun: scheduledAt,
      runsCount: 0,
      maxRuns: 1,
      active: true,
      createdAt: new Date(),
    };

    this.scheduledJobs.set(scheduleId, scheduledJob);
    this.jobDefinitions.set(job.name, job);
    // Build schedule options excluding undefined values (for exactOptionalPropertyTypes)
    const scheduleOpts: ScheduleOptions = {
      cron: '',
      payload,
      maxRuns: 1,
    };
    if (enqueueOptions !== undefined) scheduleOpts.enqueueOptions = enqueueOptions;
    this.scheduleOptions.set(scheduleId, scheduleOpts);

    if (this.running) {
      this.scheduleNextRun(scheduleId);
    }

    return scheduleId;
  }

  /**
   * Start the scheduler
   */
  start(): void {
    if (this.running) {
      return;
    }

    this.running = true;

    // Schedule all active jobs
    for (const scheduleId of this.scheduledJobs.keys()) {
      this.scheduleNextRun(scheduleId);
    }
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    this.running = false;

    // Clear all timers
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
  }

  /**
   * Pause a scheduled job
   */
  pause(scheduleId: string): boolean {
    const scheduledJob = this.scheduledJobs.get(scheduleId);
    if (!scheduledJob) {
      return false;
    }

    scheduledJob.active = false;
    const timer = this.timers.get(scheduleId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(scheduleId);
    }

    return true;
  }

  /**
   * Resume a paused scheduled job
   */
  resume(scheduleId: string): boolean {
    const scheduledJob = this.scheduledJobs.get(scheduleId);
    if (!scheduledJob) {
      return false;
    }

    scheduledJob.active = true;
    scheduledJob.nextRun = this.calculateNextRun(
      this.scheduleOptions.get(scheduleId)!,
      scheduledJob.lastRun
    );

    if (this.running) {
      this.scheduleNextRun(scheduleId);
    }

    return true;
  }

  /**
   * Remove a scheduled job
   */
  remove(scheduleId: string): boolean {
    const timer = this.timers.get(scheduleId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(scheduleId);
    }

    this.scheduledJobs.delete(scheduleId);
    this.scheduleOptions.delete(scheduleId);

    return true;
  }

  /**
   * Get a scheduled job
   */
  getScheduledJob(scheduleId: string): ScheduledJob | null {
    return this.scheduledJobs.get(scheduleId) || null;
  }

  /**
   * Get all scheduled jobs
   */
  getAllScheduledJobs(): ScheduledJob[] {
    return Array.from(this.scheduledJobs.values());
  }

  /**
   * Get job history
   */
  getJobHistory(scheduleId?: string): JobRun[] {
    if (scheduleId) {
      return this.jobHistory.filter(run => run.scheduledJobId === scheduleId);
    }
    return [...this.jobHistory];
  }

  /**
   * Clear job history
   */
  clearHistory(): void {
    this.jobHistory = [];
  }

  /**
   * Set maximum history size
   */
  setMaxHistorySize(size: number): void {
    this.maxHistorySize = size;
    this.trimHistory();
  }

  private scheduleNextRun(scheduleId: string): void {
    const scheduledJob = this.scheduledJobs.get(scheduleId);
    if (!scheduledJob || !scheduledJob.active || !scheduledJob.nextRun) {
      return;
    }

    const options = this.scheduleOptions.get(scheduleId)!;

    // Check if we've reached the max runs
    if (options.maxRuns && scheduledJob.runsCount >= options.maxRuns) {
      scheduledJob.active = false;
      if (options.onComplete) {
        options.onComplete();
      }
      return;
    }

    // Check if we've passed the end date
    if (options.endDate && scheduledJob.nextRun > options.endDate) {
      scheduledJob.active = false;
      if (options.onComplete) {
        options.onComplete();
      }
      return;
    }

    const now = new Date();
    const delay = Math.max(0, scheduledJob.nextRun.getTime() - now.getTime());

    const timer = setTimeout(async () => {
      await this.executeScheduledJob(scheduleId);
    }, delay);

    this.timers.set(scheduleId, timer);
  }

  private async executeScheduledJob(scheduleId: string): Promise<void> {
    const scheduledJob = this.scheduledJobs.get(scheduleId);
    if (!scheduledJob) {
      return;
    }

    const options = this.scheduleOptions.get(scheduleId)!;
    const jobDefinition = this.jobDefinitions.get(scheduledJob.jobName);
    if (!jobDefinition) {
      console.error(`Job definition not found: ${scheduledJob.jobName}`);
      return;
    }

    // Create job run record
    const jobRun: JobRun = {
      id: this.generateJobRunId(),
      scheduledJobId: scheduleId,
      jobId: '',
      scheduledAt: scheduledJob.nextRun!,
      status: 'scheduled',
    };

    this.addToHistory(jobRun);

    try {
      // Enqueue the job
      const job = await this.queue.enqueue(
        jobDefinition,
        options.payload,
        options.enqueueOptions
      );

      jobRun.jobId = job.id;
      jobRun.status = 'running';
      jobRun.startedAt = new Date();

      if (options.onSchedule) {
        await options.onSchedule(scheduledJob.nextRun!);
      }

      // Update scheduled job
      scheduledJob.lastRun = scheduledJob.nextRun!;
      scheduledJob.runsCount++;

      // Calculate next run
      if (options.cron) {
        scheduledJob.nextRun = this.calculateNextRun(options, scheduledJob.lastRun);
      } else {
        scheduledJob.nextRun = null;
        scheduledJob.active = false;
      }

      // Schedule next run
      if (scheduledJob.active && scheduledJob.nextRun) {
        this.scheduleNextRun(scheduleId);
      } else if (options.onComplete) {
        await options.onComplete();
      }
    } catch (error) {
      jobRun.status = 'failed';
      jobRun.error = (error as Error).message;
      console.error(`Failed to schedule job ${scheduleId}:`, error);
    }
  }

  private calculateNextRun(
    options: ScheduleOptions,
    currentDate?: Date
  ): Date | null {
    if (!options.cron) {
      return null;
    }

    try {
      const parserOptions: { currentDate: Date; tz?: string } = {
        currentDate: currentDate || options.startDate || new Date(),
      };
      if (options.timezone !== undefined) {
        parserOptions.tz = options.timezone;
      }
      const interval = parseExpression(options.cron, parserOptions);

      const next = interval.next().toDate();

      // Check if next run is before end date
      if (options.endDate && next > options.endDate) {
        return null;
      }

      return next;
    } catch (error) {
      console.error(`Failed to calculate next run for ${options.cron}:`, error);
      return null;
    }
  }

  private addToHistory(jobRun: JobRun): void {
    this.jobHistory.unshift(jobRun);
    this.trimHistory();
  }

  private trimHistory(): void {
    if (this.jobHistory.length > this.maxHistorySize) {
      this.jobHistory = this.jobHistory.slice(0, this.maxHistorySize);
    }
  }

  private generateScheduleId(): string {
    return `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateJobRunId(): string {
    return `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Helper functions for common cron patterns
 */
export const CronPatterns = {
  /** Every minute */
  EVERY_MINUTE: '* * * * *',
  /** Every 5 minutes */
  EVERY_5_MINUTES: '*/5 * * * *',
  /** Every 15 minutes */
  EVERY_15_MINUTES: '*/15 * * * *',
  /** Every 30 minutes */
  EVERY_30_MINUTES: '*/30 * * * *',
  /** Every hour */
  EVERY_HOUR: '0 * * * *',
  /** Every day at midnight */
  DAILY: '0 0 * * *',
  /** Every day at noon */
  DAILY_NOON: '0 12 * * *',
  /** Every week on Sunday at midnight */
  WEEKLY: '0 0 * * 0',
  /** Every month on the 1st at midnight */
  MONTHLY: '0 0 1 * *',
  /** Every year on January 1st at midnight */
  YEARLY: '0 0 1 1 *',

  /**
   * Create a cron pattern for specific time
   */
  at(hour: number, minute = 0): string {
    return `${minute} ${hour} * * *`;
  },

  /**
   * Create a cron pattern for every N minutes
   */
  everyMinutes(n: number): string {
    return `*/${n} * * * *`;
  },

  /**
   * Create a cron pattern for every N hours
   */
  everyHours(n: number): string {
    return `0 */${n} * * *`;
  },

  /**
   * Create a cron pattern for specific day of week
   */
  weekday(day: 0 | 1 | 2 | 3 | 4 | 5 | 6, hour = 0, minute = 0): string {
    return `${minute} ${hour} * * ${day}`;
  },

  /**
   * Create a cron pattern for weekdays (Mon-Fri)
   */
  weekdays(hour = 0, minute = 0): string {
    return `${minute} ${hour} * * 1-5`;
  },

  /**
   * Create a cron pattern for weekends (Sat-Sun)
   */
  weekends(hour = 0, minute = 0): string {
    return `${minute} ${hour} * * 0,6`;
  },
};

/**
 * Common timezone identifiers
 */
export const Timezones = {
  UTC: 'UTC',
  // Americas
  NEW_YORK: 'America/New_York',
  CHICAGO: 'America/Chicago',
  DENVER: 'America/Denver',
  LOS_ANGELES: 'America/Los_Angeles',
  // Europe
  LONDON: 'Europe/London',
  PARIS: 'Europe/Paris',
  BERLIN: 'Europe/Berlin',
  // Asia
  TOKYO: 'Asia/Tokyo',
  SHANGHAI: 'Asia/Shanghai',
  HONG_KONG: 'Asia/Hong_Kong',
  SINGAPORE: 'Asia/Singapore',
  // Australia
  SYDNEY: 'Australia/Sydney',
  MELBOURNE: 'Australia/Melbourne',
};
