import { generateId } from './utils.js';
/**
 * In-memory email queue implementation
 *
 * For production use, consider using:
 * - Redis-based queue (Bull, BullMQ)
 * - AWS SQS
 * - RabbitMQ
 * - PostgreSQL-based queue (graphile-worker)
 */
export class InMemoryQueue {
    options;
    jobs = new Map();
    processing = false;
    processingInterval = null;
    constructor(options = {}) {
        this.options = options;
        this.options = {
            maxConcurrency: 5,
            pollInterval: 1000,
            defaultMaxAttempts: 3,
            ...options,
        };
    }
    /**
     * Add an email to the queue
     */
    async enqueue(message, options = {}) {
        const id = generateId();
        const now = new Date();
        const job = {
            id,
            message,
            attempts: 0,
            maxAttempts: options.maxAttempts ?? this.options.defaultMaxAttempts ?? 3,
            status: 'pending',
            createdAt: now,
            nextAttempt: options.delay
                ? new Date(now.getTime() + options.delay)
                : now,
        };
        this.jobs.set(id, job);
        return id;
    }
    /**
     * Start processing the queue
     */
    async process(handler) {
        if (this.processing) {
            return;
        }
        this.processing = true;
        const processNext = async () => {
            const pendingJobs = this.getPendingJobs();
            // Process up to maxConcurrency jobs at once
            const batch = pendingJobs.slice(0, this.options.maxConcurrency);
            await Promise.all(batch.map(async (job) => {
                // Mark as processing
                job.status = 'processing';
                job.attempts++;
                job.lastAttempt = new Date();
                try {
                    const result = await handler(job);
                    if (result.success) {
                        job.status = 'completed';
                        job.completedAt = new Date();
                    }
                    else {
                        this.handleFailure(job, result.error);
                    }
                }
                catch (error) {
                    this.handleFailure(job, error instanceof Error ? error : new Error(String(error)));
                }
            }));
        };
        // Start polling
        this.processingInterval = setInterval(async () => {
            if (this.processing) {
                await processNext();
            }
        }, this.options.pollInterval);
        // Initial process
        await processNext();
    }
    /**
     * Stop processing
     */
    stop() {
        this.processing = false;
        if (this.processingInterval) {
            clearInterval(this.processingInterval);
            this.processingInterval = null;
        }
    }
    /**
     * Get a job by ID
     */
    async getJob(id) {
        return this.jobs.get(id) ?? null;
    }
    /**
     * Cancel a pending job
     */
    async cancel(id) {
        const job = this.jobs.get(id);
        if (job && job.status === 'pending') {
            this.jobs.delete(id);
            return true;
        }
        return false;
    }
    /**
     * Get queue statistics
     */
    async stats() {
        let pending = 0;
        let processing = 0;
        let completed = 0;
        let failed = 0;
        for (const job of this.jobs.values()) {
            switch (job.status) {
                case 'pending':
                    pending++;
                    break;
                case 'processing':
                    processing++;
                    break;
                case 'completed':
                    completed++;
                    break;
                case 'failed':
                    failed++;
                    break;
            }
        }
        return { pending, processing, completed, failed };
    }
    /**
     * Clear completed and failed jobs older than maxAge
     */
    cleanup(maxAge = 24 * 60 * 60 * 1000) {
        const cutoff = Date.now() - maxAge;
        let removed = 0;
        for (const [id, job] of this.jobs.entries()) {
            if ((job.status === 'completed' || job.status === 'failed') &&
                job.createdAt.getTime() < cutoff) {
                this.jobs.delete(id);
                removed++;
            }
        }
        return removed;
    }
    /**
     * Get all jobs (for debugging)
     */
    getAllJobs() {
        return Array.from(this.jobs.values());
    }
    getPendingJobs() {
        const now = new Date();
        const pending = [];
        for (const job of this.jobs.values()) {
            if (job.status === 'pending' &&
                (!job.nextAttempt || job.nextAttempt <= now)) {
                pending.push(job);
            }
        }
        // Sort by creation time (FIFO)
        return pending.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    }
    handleFailure(job, error) {
        if (error?.message) {
            job.error = error.message;
        }
        if (job.attempts >= job.maxAttempts) {
            job.status = 'failed';
        }
        else {
            // Schedule retry with exponential backoff
            const delay = Math.min(1000 * Math.pow(2, job.attempts), 60000 // Max 1 minute
            );
            job.status = 'pending';
            job.nextAttempt = new Date(Date.now() + delay);
        }
    }
}
/**
 * Create an in-memory queue
 */
export function createQueue(options) {
    return new InMemoryQueue(options);
}
//# sourceMappingURL=queue.js.map