/**
 * Job Queue System
 *
 * Redis-backed job queue with in-memory fallback for development.
 */
import type { JobDefinition } from './job.js';
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
    enqueue<TPayload, TResult>(job: JobDefinition<TPayload, TResult>, payload: TPayload, options?: EnqueueOptions): Promise<Job<TPayload, TResult>>;
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
export declare class InMemoryQueue implements IQueue {
    private jobs;
    private definitions;
    private processing;
    private paused;
    private concurrency;
    private activeJobs;
    constructor(options?: QueueOptions);
    enqueue<TPayload, TResult>(job: JobDefinition<TPayload, TResult>, payload: TPayload, options?: EnqueueOptions): Promise<Job<TPayload, TResult>>;
    process(): Promise<void>;
    stop(): Promise<void>;
    getJob<TPayload, TResult>(jobId: string): Promise<Job<TPayload, TResult> | null>;
    getStats(): Promise<QueueStats>;
    removeJob(jobId: string): Promise<boolean>;
    retryJob(jobId: string): Promise<boolean>;
    clear(): Promise<void>;
    pause(): Promise<void>;
    resume(): Promise<void>;
    isPaused(): Promise<boolean>;
    private getNextJob;
    private processJob;
    private executeWithMiddleware;
    private generateJobId;
    private sleep;
}
/**
 * Redis-backed queue implementation (using BullMQ)
 */
export declare class RedisQueue implements IQueue {
    private options;
    private queue;
    private worker;
    private definitions;
    private BullMQ;
    private processing;
    constructor(options?: QueueOptions);
    private ensureInitialized;
    enqueue<TPayload, TResult>(job: JobDefinition<TPayload, TResult>, payload: TPayload, options?: EnqueueOptions): Promise<Job<TPayload, TResult>>;
    process(): Promise<void>;
    stop(): Promise<void>;
    getJob<TPayload, TResult>(jobId: string): Promise<Job<TPayload, TResult> | null>;
    getStats(): Promise<QueueStats>;
    removeJob(jobId: string): Promise<boolean>;
    retryJob(jobId: string): Promise<boolean>;
    clear(): Promise<void>;
    pause(): Promise<void>;
    resume(): Promise<void>;
    isPaused(): Promise<boolean>;
    private bullJobToJob;
    private mapBullStatus;
    private executeWithMiddleware;
}
/**
 * Create a job queue
 *
 * Automatically selects Redis or in-memory implementation based on configuration.
 */
export declare function createQueue(options?: QueueOptions): IQueue;
//# sourceMappingURL=queue.d.ts.map