import type { EmailQueue, EmailQueueJob, EmailMessage, EmailResult, QueueOptions, QueueStats } from './types.js';
/**
 * In-memory email queue implementation
 *
 * For production use, consider using:
 * - Redis-based queue (Bull, BullMQ)
 * - AWS SQS
 * - RabbitMQ
 * - PostgreSQL-based queue (graphile-worker)
 */
export declare class InMemoryQueue implements EmailQueue {
    private options;
    private jobs;
    private processing;
    private processingInterval;
    constructor(options?: {
        maxConcurrency?: number;
        pollInterval?: number;
        defaultMaxAttempts?: number;
    });
    /**
     * Add an email to the queue
     */
    enqueue(message: EmailMessage, options?: QueueOptions): Promise<string>;
    /**
     * Start processing the queue
     */
    process(handler: (job: EmailQueueJob) => Promise<EmailResult>): Promise<void>;
    /**
     * Stop processing
     */
    stop(): void;
    /**
     * Get a job by ID
     */
    getJob(id: string): Promise<EmailQueueJob | null>;
    /**
     * Cancel a pending job
     */
    cancel(id: string): Promise<boolean>;
    /**
     * Get queue statistics
     */
    stats(): Promise<QueueStats>;
    /**
     * Clear completed and failed jobs older than maxAge
     */
    cleanup(maxAge?: number): number;
    /**
     * Get all jobs (for debugging)
     */
    getAllJobs(): EmailQueueJob[];
    private getPendingJobs;
    private handleFailure;
}
/**
 * Create an in-memory queue
 */
export declare function createQueue(options?: ConstructorParameters<typeof InMemoryQueue>[0]): InMemoryQueue;
//# sourceMappingURL=queue.d.ts.map