/**
 * PhilJS ISR Time-Based Revalidation Scheduler
 *
 * Automatically schedules and triggers revalidation based on time intervals.
 * Supports both periodic scanning and precise scheduling.
 */

import type { CacheManager } from './cache.js';
import { isStale } from './cache.js';
import type { ISRConfig, ISRLogger } from './config.js';
import type { RevalidationManager, RevalidationResult } from './revalidate.js';

/**
 * Scheduled task entry
 */
export interface ScheduledTask {
  /** Path to revalidate */
  path: string;
  /** When the task should run (Unix timestamp) */
  scheduledAt: number;
  /** Priority (higher = sooner when multiple due) */
  priority: number;
  /** Number of times rescheduled */
  rescheduleCount: number;
  /** Last execution time (for performance tracking) */
  lastDuration?: number | undefined;
}

/**
 * Scheduler configuration
 */
export interface SchedulerConfig {
  /** How often to scan for stale entries (ms) */
  scanInterval?: number;
  /** Maximum paths to revalidate per scan */
  maxPerScan?: number;
  /** Enable precise scheduling (vs periodic scanning) */
  preciseScheduling?: boolean;
  /** Minimum gap between same-path revalidations (ms) */
  minRevalidateGap?: number;
  /** Enable automatic start */
  autoStart?: boolean;
}

/**
 * Scheduler status
 */
export interface SchedulerStatus {
  /** Whether the scheduler is running */
  running: boolean;
  /** Number of scheduled tasks */
  scheduledCount: number;
  /** Next scheduled execution time */
  nextExecution?: number | undefined;
  /** Total revalidations performed */
  totalRevalidations: number;
  /** Average revalidation time (ms) */
  averageRevalidationTime: number;
  /** Last scan time */
  lastScanTime?: number | undefined;
}

/**
 * Time-based revalidation scheduler
 */
export class RevalidationScheduler {
  private cache: CacheManager;
  private revalidator: RevalidationManager;
  private config: ISRConfig;
  private schedulerConfig: Required<SchedulerConfig>;
  private logger: ISRLogger;

  // Scheduling state
  private scheduled: Map<string, ScheduledTask> = new Map();
  private running: boolean = false;
  private scanTimer: ReturnType<typeof setTimeout> | undefined;
  private precisTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();

  // Statistics
  private totalRevalidations: number = 0;
  private revalidationTimes: number[] = [];
  private lastScanTime: number | undefined;

  constructor(
    cache: CacheManager,
    revalidator: RevalidationManager,
    config: ISRConfig,
    schedulerConfig: SchedulerConfig = {}
  ) {
    this.cache = cache;
    this.revalidator = revalidator;
    this.config = config;
    this.schedulerConfig = {
      scanInterval: schedulerConfig.scanInterval ?? 60000, // 1 minute
      maxPerScan: schedulerConfig.maxPerScan ?? 10,
      preciseScheduling: schedulerConfig.preciseScheduling ?? false,
      minRevalidateGap: schedulerConfig.minRevalidateGap ?? 5000, // 5 seconds
      autoStart: schedulerConfig.autoStart ?? false,
    };
    this.logger = config.logger ?? this.createDefaultLogger();

    if (this.schedulerConfig.autoStart) {
      this.start();
    }
  }

  /**
   * Start the scheduler
   */
  start(): void {
    if (this.running) {
      this.logger.warn('Scheduler already running');
      return;
    }

    this.running = true;
    this.logger.info('Scheduler started');

    if (this.schedulerConfig.preciseScheduling) {
      // Build initial schedule from cache
      this.buildSchedule();
    } else {
      // Start periodic scanning
      this.startScanLoop();
    }
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    this.running = false;

    // Clear scan timer
    if (this.scanTimer) {
      clearTimeout(this.scanTimer);
      this.scanTimer = undefined;
    }

    // Clear precise timers
    for (const timer of this.precisTimers.values()) {
      clearTimeout(timer);
    }
    this.precisTimers.clear();

    this.logger.info('Scheduler stopped');
  }

  /**
   * Schedule a path for revalidation
   */
  schedule(path: string, revalidateAt: number, priority: number = 0): void {
    const existingTask = this.scheduled.get(path);

    const task: ScheduledTask = {
      path,
      scheduledAt: revalidateAt,
      priority,
      rescheduleCount: existingTask ? existingTask.rescheduleCount + 1 : 0,
      lastDuration: existingTask?.lastDuration,
    };

    this.scheduled.set(path, task);

    if (this.schedulerConfig.preciseScheduling && this.running) {
      this.setupPreciseTimer(task);
    }

    this.logger.debug(`Scheduled: ${path} at ${new Date(revalidateAt).toISOString()}`);
  }

  /**
   * Unschedule a path
   */
  unschedule(path: string): void {
    this.scheduled.delete(path);

    const timer = this.precisTimers.get(path);
    if (timer) {
      clearTimeout(timer);
      this.precisTimers.delete(path);
    }

    this.logger.debug(`Unscheduled: ${path}`);
  }

  /**
   * Get the next scheduled time for a path
   */
  getScheduledTime(path: string): number | undefined {
    return this.scheduled.get(path)?.scheduledAt;
  }

  /**
   * Check if a path is scheduled
   */
  isScheduled(path: string): boolean {
    return this.scheduled.has(path);
  }

  /**
   * Get scheduler status
   */
  getStatus(): SchedulerStatus {
    let nextExecution: number | undefined;
    for (const task of this.scheduled.values()) {
      if (!nextExecution || task.scheduledAt < nextExecution) {
        nextExecution = task.scheduledAt;
      }
    }

    const avgTime =
      this.revalidationTimes.length > 0
        ? this.revalidationTimes.reduce((a, b) => a + b, 0) / this.revalidationTimes.length
        : 0;

    return {
      running: this.running,
      scheduledCount: this.scheduled.size,
      nextExecution,
      totalRevalidations: this.totalRevalidations,
      averageRevalidationTime: Math.round(avgTime),
      lastScanTime: this.lastScanTime,
    };
  }

  /**
   * Get all scheduled tasks
   */
  getAllScheduled(): ScheduledTask[] {
    return Array.from(this.scheduled.values()).sort(
      (a, b) => a.scheduledAt - b.scheduledAt
    );
  }

  /**
   * Trigger a manual scan
   */
  async scan(): Promise<RevalidationResult[]> {
    return this.runScan();
  }

  /**
   * Build schedule from cache entries
   */
  private async buildSchedule(): Promise<void> {
    const keys = await this.cache.keys();
    const now = Date.now();

    for (const path of keys) {
      const meta = await this.cache.getAdapter().getMeta(path);
      if (!meta || meta.revalidateInterval === 0) {
        continue; // Skip entries that don't revalidate
      }

      const nextRevalidate = meta.revalidatedAt + meta.revalidateInterval * 1000;

      // Only schedule if in the future
      if (nextRevalidate > now) {
        this.schedule(path, nextRevalidate);
      } else {
        // Already stale, schedule for immediate revalidation
        this.schedule(path, now + Math.random() * 5000, 1); // Spread load
      }
    }

    this.logger.info(`Built schedule with ${this.scheduled.size} entries`);
  }

  /**
   * Start periodic scan loop
   */
  private startScanLoop(): void {
    const runScanLoop = async () => {
      if (!this.running) {
        return;
      }

      try {
        await this.runScan();
      } catch (error) {
        this.logger.error('Scan loop error', { error });
      }

      // Schedule next scan
      this.scanTimer = setTimeout(runScanLoop, this.schedulerConfig.scanInterval);
    };

    // Start with a small delay
    this.scanTimer = setTimeout(runScanLoop, 1000);
  }

  /**
   * Run a cache scan for stale entries
   */
  private async runScan(): Promise<RevalidationResult[]> {
    this.lastScanTime = Date.now();
    const results: RevalidationResult[] = [];

    try {
      const keys = await this.cache.keys();
      const staleEntries: Array<{ path: string; staleSince: number }> = [];

      // Find stale entries
      for (const path of keys) {
        const entry = await this.cache.get(path, { includeStale: true });
        if (entry && isStale(entry)) {
          const staleSince = entry.meta.revalidatedAt + entry.meta.revalidateInterval * 1000;
          staleEntries.push({ path, staleSince });
        }
      }

      // Sort by staleness (oldest first)
      staleEntries.sort((a, b) => a.staleSince - b.staleSince);

      // Revalidate up to max
      const toRevalidate = staleEntries.slice(0, this.schedulerConfig.maxPerScan);
      this.logger.debug(`Scan found ${staleEntries.length} stale, revalidating ${toRevalidate.length}`);

      for (const { path } of toRevalidate) {
        const result = await this.executeRevalidation(path);
        results.push(result);
      }
    } catch (error) {
      this.logger.error('Scan error', { error });
    }

    return results;
  }

  /**
   * Setup a precise timer for a task
   */
  private setupPreciseTimer(task: ScheduledTask): void {
    // Clear existing timer
    const existingTimer = this.precisTimers.get(task.path);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const now = Date.now();
    const delay = Math.max(0, task.scheduledAt - now);

    const timer = setTimeout(async () => {
      this.precisTimers.delete(task.path);

      if (!this.running) {
        return;
      }

      await this.executeRevalidation(task.path);
    }, delay);

    this.precisTimers.set(task.path, timer);
  }

  /**
   * Execute revalidation and update stats/schedule
   */
  private async executeRevalidation(path: string): Promise<RevalidationResult> {
    const startTime = Date.now();

    try {
      const result = await this.revalidator.revalidatePath(path);
      const duration = Date.now() - startTime;

      // Update statistics
      this.totalRevalidations++;
      this.revalidationTimes.push(duration);
      if (this.revalidationTimes.length > 100) {
        this.revalidationTimes.shift();
      }

      // Update task duration
      const task = this.scheduled.get(path);
      if (task) {
        task.lastDuration = duration;
      }

      // Reschedule for next revalidation
      const meta = await this.cache.getAdapter().getMeta(path);
      if (meta && meta.revalidateInterval > 0) {
        const nextRevalidate = Date.now() + meta.revalidateInterval * 1000;
        this.schedule(path, nextRevalidate);
      } else {
        this.unschedule(path);
      }

      return result;
    } catch (error) {
      this.logger.error(`Scheduled revalidation failed: ${path}`, { error });
      return {
        path,
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Create default logger
   */
  private createDefaultLogger(): ISRLogger {
    const level = this.config.logLevel ?? 'info';
    const levels = ['debug', 'info', 'warn', 'error', 'silent'];
    const currentLevel = levels.indexOf(level);
    const shouldLog = (msgLevel: string) => levels.indexOf(msgLevel) >= currentLevel;

    return {
      debug: (msg, meta) => shouldLog('debug') && console.debug(`[ISR:Scheduler] ${msg}`, meta || ''),
      info: (msg, meta) => shouldLog('info') && console.info(`[ISR:Scheduler] ${msg}`, meta || ''),
      warn: (msg, meta) => shouldLog('warn') && console.warn(`[ISR:Scheduler] ${msg}`, meta || ''),
      error: (msg, meta) => shouldLog('error') && console.error(`[ISR:Scheduler] ${msg}`, meta || ''),
    };
  }
}

/**
 * Create a scheduler with default configuration
 */
export function createScheduler(
  cache: CacheManager,
  revalidator: RevalidationManager,
  config: ISRConfig,
  schedulerConfig?: SchedulerConfig
): RevalidationScheduler {
  return new RevalidationScheduler(cache, revalidator, config, schedulerConfig);
}

/**
 * Calculate when a path should be revalidated based on its config
 */
export function calculateNextRevalidation(
  lastRevalidatedAt: number,
  revalidateInterval: number
): number {
  return lastRevalidatedAt + revalidateInterval * 1000;
}

/**
 * Check if revalidation is due
 */
export function isRevalidationDue(
  lastRevalidatedAt: number,
  revalidateInterval: number
): boolean {
  const now = Date.now();
  const nextRevalidation = calculateNextRevalidation(lastRevalidatedAt, revalidateInterval);
  return now >= nextRevalidation;
}
