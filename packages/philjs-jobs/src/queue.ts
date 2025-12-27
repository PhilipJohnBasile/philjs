/**
 * Job Queue System
 *
 * Redis-backed job queue with in-memory fallback for development.
 */

import type { JobDefinition, JobContext } from './job.js';

export interface QueueOptions {
  /** Queue name */
  name?: string;
  /** Redis connection (if using Redis backend) */
  redis?: {
    host?: string;
    port?: number;
    password?: string;
    db?: number;
    maxRetriesPerRequest?: number;
  };
  /** Default job options */
  defaultJobOptions?: {
    attempts?: number;
    backoff?: {
      type: 'fixed' | 'exponential';
      delay: number;
    };
    priority?: number;
    removeOnComplete?: boolean | number;
    removeOnFail?: boolean | number;
  };
  /** Worker concurrency */
  concurrency?: number;
}

export interface EnqueueOptions {
  /** Job ID (auto-generated if not provided) */
  jobId?: string;
  /** Job priority */
  priority?: number;
  /** Delay before processing */
  delay?: number;
  /** Number of retry attempts */
  attempts?: number;
  /** Backoff strategy */
  backoff?: {
    type: 'fixed' | 'exponential';
    delay: number;
  };
  /** Job timeout */
  timeout?: number;
}

export interface Job<TPayload = any, TResult = any> {
  id: string;
  name: string;
  payload: TPayload;
  status: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed';
  progress: number;
  attemptsMade: number;
  result?: TResult;
  error?: Error;
  createdAt: Date;
  processedAt?: Date;
  finishedAt?: Date;
}

export interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  total: number;
}

/**
 * Abstract queue interface
 */
export interface IQueue {
  /** Add a job to the queue */
  enqueue<TPayload, TResult>(
    job: JobDefinition<TPayload, TResult>,
    payload: TPayload,
    options?: EnqueueOptions
  ): Promise<Job<TPayload, TResult>>;

  /** Process jobs from the queue */
  process(): Promise<void>;

  /** Stop processing jobs */
  stop(): Promise<void>;

  /** Get job by ID */
  getJob<TPayload, TResult>(jobId: string): Promise<Job<TPayload, TResult> | null>;

  /** Get queue statistics */
  getStats(): Promise<QueueStats>;

  /** Remove a job from the queue */
  removeJob(jobId: string): Promise<boolean>;

  /** Retry a failed job */
  retryJob(jobId: string): Promise<boolean>;

  /** Clear all jobs from the queue */
  clear(): Promise<void>;

  /** Pause the queue */
  pause(): Promise<void>;

  /** Resume the queue */
  resume(): Promise<void>;

  /** Check if queue is paused */
  isPaused(): Promise<boolean>;
}

/**
 * In-memory queue implementation (for development)
 */
export class InMemoryQueue implements IQueue {
  private jobs = new Map<string, Job>();
  private definitions = new Map<string, JobDefinition>();
  private processing = false;
  private paused = false;
  private concurrency: number;
  private activeJobs = new Set<string>();

  constructor(options: QueueOptions = {}) {
    this.concurrency = options.concurrency || 1;
  }

  async enqueue<TPayload, TResult>(
    job: JobDefinition<TPayload, TResult>,
    payload: TPayload,
    options: EnqueueOptions = {}
  ): Promise<Job<TPayload, TResult>> {
    const jobId = options.jobId || this.generateJobId();
    const now = new Date();

    const queueJob: Job<TPayload, TResult> = {
      id: jobId,
      name: job.name,
      payload,
      status: options.delay ? 'delayed' : 'waiting',
      progress: 0,
      attemptsMade: 0,
      createdAt: now,
    };

    this.jobs.set(jobId, queueJob as Job);
    this.definitions.set(job.name, job);

    // Schedule delayed job
    if (options.delay) {
      setTimeout(() => {
        const j = this.jobs.get(jobId);
        if (j && j.status === 'delayed') {
          j.status = 'waiting';
        }
      }, options.delay);
    }

    return queueJob;
  }

  async process(): Promise<void> {
    if (this.processing) {
      return;
    }

    this.processing = true;

    while (this.processing) {
      if (this.paused) {
        await this.sleep(100);
        continue;
      }

      // Process jobs up to concurrency limit
      while (this.activeJobs.size < this.concurrency) {
        const job = this.getNextJob();
        if (!job) {
          break;
        }

        this.processJob(job).catch(console.error);
      }

      await this.sleep(100);
    }
  }

  async stop(): Promise<void> {
    this.processing = false;

    // Wait for active jobs to complete
    while (this.activeJobs.size > 0) {
      await this.sleep(100);
    }
  }

  async getJob<TPayload, TResult>(jobId: string): Promise<Job<TPayload, TResult> | null> {
    return (this.jobs.get(jobId) as Job<TPayload, TResult>) || null;
  }

  async getStats(): Promise<QueueStats> {
    const stats: QueueStats = {
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
      total: this.jobs.size,
    };

    for (const job of this.jobs.values()) {
      stats[job.status]++;
    }

    return stats;
  }

  async removeJob(jobId: string): Promise<boolean> {
    return this.jobs.delete(jobId);
  }

  async retryJob(jobId: string): Promise<boolean> {
    const job = this.jobs.get(jobId);
    if (!job || job.status !== 'failed') {
      return false;
    }

    job.status = 'waiting';
    job.error = undefined;
    return true;
  }

  async clear(): Promise<void> {
    this.jobs.clear();
    this.definitions.clear();
  }

  async pause(): Promise<void> {
    this.paused = true;
  }

  async resume(): Promise<void> {
    this.paused = false;
  }

  async isPaused(): Promise<boolean> {
    return this.paused;
  }

  private getNextJob(): Job | null {
    const waitingJobs = Array.from(this.jobs.values())
      .filter(j => j.status === 'waiting')
      .sort((a, b) => {
        // Sort by creation time (FIFO - oldest first)
        return a.createdAt.getTime() - b.createdAt.getTime();
      });

    return waitingJobs[0] || null;
  }

  private async processJob(job: Job): Promise<void> {
    this.activeJobs.add(job.id);
    job.status = 'active';
    job.processedAt = new Date();

    const definition = this.definitions.get(job.name);
    if (!definition) {
      job.status = 'failed';
      job.error = new Error(`Job definition not found: ${job.name}`);
      job.finishedAt = new Date();
      this.activeJobs.delete(job.id);
      return;
    }

    const context: JobContext = {
      jobId: job.id,
      attemptsMade: job.attemptsMade,
      timestamp: Date.now(),
      updateProgress: async (progress: number) => {
        job.progress = progress;
        if (definition.hooks.onProgress) {
          await definition.hooks.onProgress(progress, context);
        }
      },
      log: (...args: any[]) => {
        console.log(`[Job ${job.id}]`, ...args);
      },
    };

    try {
      // Execute onBefore hook
      if (definition.hooks.onBefore) {
        await definition.hooks.onBefore(job.payload, context);
      }

      // Execute middleware chain and handler
      const result = await this.executeWithMiddleware(
        definition,
        job.payload,
        context
      );

      job.result = result;
      job.status = 'completed';
      job.finishedAt = new Date();
      job.progress = 100;

      // Execute onComplete hook
      if (definition.hooks.onComplete) {
        await definition.hooks.onComplete(result, context);
      }
    } catch (error) {
      job.attemptsMade++;
      const maxAttempts = definition.options.attempts || 3;

      if (job.attemptsMade < maxAttempts) {
        // Retry with backoff
        const backoff = definition.options.backoff || {
          type: 'exponential',
          delay: 1000,
        };
        const delay =
          backoff.type === 'exponential'
            ? backoff.delay * Math.pow(2, job.attemptsMade - 1)
            : backoff.delay;

        job.status = 'delayed';
        setTimeout(() => {
          const j = this.jobs.get(job.id);
          if (j && j.status === 'delayed') {
            j.status = 'waiting';
          }
        }, delay);
      } else {
        job.status = 'failed';
        job.error = error as Error;
        job.finishedAt = new Date();

        // Execute onFail hook
        if (definition.hooks.onFail) {
          await definition.hooks.onFail(error as Error, context);
        }
      }
    } finally {
      // Execute onFinally hook
      if (definition.hooks.onFinally) {
        await definition.hooks.onFinally(context);
      }

      this.activeJobs.delete(job.id);

      // Clean up completed/failed jobs
      if (job.status === 'completed' && definition.options.removeOnComplete) {
        setTimeout(() => this.jobs.delete(job.id), 1000);
      }
    }
  }

  private async executeWithMiddleware(
    definition: JobDefinition,
    payload: any,
    context: JobContext
  ): Promise<any> {
    let index = 0;
    const middleware = definition.middleware;

    const dispatch = async (): Promise<any> => {
      if (index >= middleware.length) {
        return definition.handler(payload, context);
      }

      const mw = middleware[index++];
      return mw(payload, context, dispatch);
    };

    return dispatch();
  }

  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Redis-backed queue implementation (using BullMQ)
 */
export class RedisQueue implements IQueue {
  private queue: any;
  private worker: any;
  private definitions = new Map<string, JobDefinition>();
  private BullMQ: any;
  private processing = false;

  constructor(private options: QueueOptions = {}) {}

  private async ensureInitialized(): Promise<void> {
    if (this.queue) {
      return;
    }

    try {
      // Dynamically import BullMQ (optional peer dependency)
      this.BullMQ = await import('bullmq');

      const connection = this.options.redis || {
        host: 'localhost',
        port: 6379,
      };

      this.queue = new this.BullMQ.Queue(this.options.name || 'philjs-jobs', {
        connection,
        defaultJobOptions: this.options.defaultJobOptions,
      });
    } catch (error) {
      throw new Error(
        'BullMQ is not installed. Install with: npm install bullmq ioredis'
      );
    }
  }

  async enqueue<TPayload, TResult>(
    job: JobDefinition<TPayload, TResult>,
    payload: TPayload,
    options: EnqueueOptions = {}
  ): Promise<Job<TPayload, TResult>> {
    await this.ensureInitialized();

    this.definitions.set(job.name, job);

    const bullJob = await this.queue.add(job.name, payload, {
      jobId: options.jobId,
      priority: options.priority ?? job.options.priority,
      delay: options.delay ?? job.options.delay,
      attempts: options.attempts ?? job.options.attempts,
      backoff: options.backoff ?? job.options.backoff,
      timeout: options.timeout ?? job.options.timeout,
      removeOnComplete: job.options.removeOnComplete,
      removeOnFail: job.options.removeOnFail,
    });

    return this.bullJobToJob(bullJob);
  }

  async process(): Promise<void> {
    await this.ensureInitialized();

    if (this.processing) {
      return;
    }

    this.processing = true;

    this.worker = new this.BullMQ.Worker(
      this.options.name || 'philjs-jobs',
      async (bullJob: any) => {
        const definition = this.definitions.get(bullJob.name);
        if (!definition) {
          throw new Error(`Job definition not found: ${bullJob.name}`);
        }

        const context: JobContext = {
          jobId: bullJob.id,
          attemptsMade: bullJob.attemptsMade,
          timestamp: Date.now(),
          updateProgress: async (progress: number) => {
            await bullJob.updateProgress(progress);
            if (definition.hooks.onProgress) {
              await definition.hooks.onProgress(progress, context);
            }
          },
          log: (...args: any[]) => {
            console.log(`[Job ${bullJob.id}]`, ...args);
          },
        };

        try {
          // Execute onBefore hook
          if (definition.hooks.onBefore) {
            await definition.hooks.onBefore(bullJob.data, context);
          }

          // Execute middleware chain and handler
          const result = await this.executeWithMiddleware(
            definition,
            bullJob.data,
            context
          );

          // Execute onComplete hook
          if (definition.hooks.onComplete) {
            await definition.hooks.onComplete(result, context);
          }

          return result;
        } catch (error) {
          // Execute onFail hook
          if (definition.hooks.onFail) {
            await definition.hooks.onFail(error as Error, context);
          }
          throw error;
        } finally {
          // Execute onFinally hook
          if (definition.hooks.onFinally) {
            await definition.hooks.onFinally(context);
          }
        }
      },
      {
        connection: this.options.redis || {
          host: 'localhost',
          port: 6379,
        },
        concurrency: this.options.concurrency || 1,
      }
    );
  }

  async stop(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
      this.worker = null;
    }
    if (this.queue) {
      await this.queue.close();
      this.queue = null;
    }
    this.processing = false;
  }

  async getJob<TPayload, TResult>(jobId: string): Promise<Job<TPayload, TResult> | null> {
    await this.ensureInitialized();

    const bullJob = await this.queue.getJob(jobId);
    if (!bullJob) {
      return null;
    }

    return this.bullJobToJob(bullJob);
  }

  async getStats(): Promise<QueueStats> {
    await this.ensureInitialized();

    const counts = await this.queue.getJobCounts();

    return {
      waiting: counts.waiting || 0,
      active: counts.active || 0,
      completed: counts.completed || 0,
      failed: counts.failed || 0,
      delayed: counts.delayed || 0,
      total:
        (counts.waiting || 0) +
        (counts.active || 0) +
        (counts.completed || 0) +
        (counts.failed || 0) +
        (counts.delayed || 0),
    };
  }

  async removeJob(jobId: string): Promise<boolean> {
    await this.ensureInitialized();

    const job = await this.queue.getJob(jobId);
    if (!job) {
      return false;
    }

    await job.remove();
    return true;
  }

  async retryJob(jobId: string): Promise<boolean> {
    await this.ensureInitialized();

    const job = await this.queue.getJob(jobId);
    if (!job) {
      return false;
    }

    await job.retry();
    return true;
  }

  async clear(): Promise<void> {
    await this.ensureInitialized();

    await this.queue.drain();
    await this.queue.clean(0, 0, 'completed');
    await this.queue.clean(0, 0, 'failed');
  }

  async pause(): Promise<void> {
    await this.ensureInitialized();
    await this.queue.pause();
  }

  async resume(): Promise<void> {
    await this.ensureInitialized();
    await this.queue.resume();
  }

  async isPaused(): Promise<boolean> {
    await this.ensureInitialized();
    return this.queue.isPaused();
  }

  private bullJobToJob(bullJob: any): Job {
    return {
      id: bullJob.id,
      name: bullJob.name,
      payload: bullJob.data,
      status: this.mapBullStatus(bullJob),
      progress: bullJob.progress || 0,
      attemptsMade: bullJob.attemptsMade || 0,
      result: bullJob.returnvalue,
      error: bullJob.failedReason ? new Error(bullJob.failedReason) : undefined,
      createdAt: new Date(bullJob.timestamp),
      processedAt: bullJob.processedOn ? new Date(bullJob.processedOn) : undefined,
      finishedAt: bullJob.finishedOn ? new Date(bullJob.finishedOn) : undefined,
    };
  }

  private mapBullStatus(bullJob: any): Job['status'] {
    if (bullJob.isCompleted()) return 'completed';
    if (bullJob.isFailed()) return 'failed';
    if (bullJob.isActive()) return 'active';
    if (bullJob.isDelayed()) return 'delayed';
    return 'waiting';
  }

  private async executeWithMiddleware(
    definition: JobDefinition,
    payload: any,
    context: JobContext
  ): Promise<any> {
    let index = 0;
    const middleware = definition.middleware;

    const dispatch = async (): Promise<any> => {
      if (index >= middleware.length) {
        return definition.handler(payload, context);
      }

      const mw = middleware[index++];
      return mw(payload, context, dispatch);
    };

    return dispatch();
  }
}

/**
 * Create a job queue
 *
 * Automatically selects Redis or in-memory implementation based on configuration.
 */
export function createQueue(options: QueueOptions = {}): IQueue {
  if (options.redis) {
    return new RedisQueue(options);
  }
  return new InMemoryQueue(options);
}
