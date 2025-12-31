/**
 * Job Queue System
 *
 * Redis-backed job queue with in-memory fallback for development.
 */
/**
 * In-memory queue implementation (for development)
 */
export class InMemoryQueue {
    jobs = new Map();
    definitions = new Map();
    processing = false;
    paused = false;
    concurrency;
    activeJobs = new Set();
    constructor(options = {}) {
        this.concurrency = options.concurrency || 1;
    }
    async enqueue(job, payload, options = {}) {
        const jobId = options.jobId || this.generateJobId();
        const now = new Date();
        const queueJob = {
            id: jobId,
            name: job.name,
            payload,
            status: options.delay ? 'delayed' : 'waiting',
            progress: 0,
            attemptsMade: 0,
            createdAt: now,
        };
        this.jobs.set(jobId, queueJob);
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
    async process() {
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
    async stop() {
        this.processing = false;
        // Wait for active jobs to complete
        while (this.activeJobs.size > 0) {
            await this.sleep(100);
        }
    }
    async getJob(jobId) {
        return this.jobs.get(jobId) || null;
    }
    async getStats() {
        const stats = {
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
    async removeJob(jobId) {
        return this.jobs.delete(jobId);
    }
    async retryJob(jobId) {
        const job = this.jobs.get(jobId);
        if (!job || job.status !== 'failed') {
            return false;
        }
        job.status = 'waiting';
        delete job.error;
        return true;
    }
    async clear() {
        this.jobs.clear();
        this.definitions.clear();
    }
    async pause() {
        this.paused = true;
    }
    async resume() {
        this.paused = false;
    }
    async isPaused() {
        return this.paused;
    }
    getNextJob() {
        const waitingJobs = Array.from(this.jobs.values())
            .filter(j => j.status === 'waiting')
            .sort((a, b) => {
            // Sort by creation time (FIFO - oldest first)
            return a.createdAt.getTime() - b.createdAt.getTime();
        });
        return waitingJobs[0] || null;
    }
    async processJob(job) {
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
        const context = {
            jobId: job.id,
            attemptsMade: job.attemptsMade,
            timestamp: Date.now(),
            updateProgress: async (progress) => {
                job.progress = progress;
                if (definition.hooks.onProgress) {
                    await definition.hooks.onProgress(progress, context);
                }
            },
            log: (...args) => {
                console.log(`[Job ${job.id}]`, ...args);
            },
        };
        try {
            // Execute onBefore hook
            if (definition.hooks.onBefore) {
                await definition.hooks.onBefore(job.payload, context);
            }
            // Execute middleware chain and handler
            const result = await this.executeWithMiddleware(definition, job.payload, context);
            job.result = result;
            job.status = 'completed';
            job.finishedAt = new Date();
            job.progress = 100;
            // Execute onComplete hook
            if (definition.hooks.onComplete) {
                await definition.hooks.onComplete(result, context);
            }
        }
        catch (error) {
            job.attemptsMade++;
            const maxAttempts = definition.options.attempts || 3;
            if (job.attemptsMade < maxAttempts) {
                // Retry with backoff
                const backoff = definition.options.backoff || {
                    type: 'exponential',
                    delay: 1000,
                };
                const delay = backoff.type === 'exponential'
                    ? backoff.delay * Math.pow(2, job.attemptsMade - 1)
                    : backoff.delay;
                job.status = 'delayed';
                setTimeout(() => {
                    const j = this.jobs.get(job.id);
                    if (j && j.status === 'delayed') {
                        j.status = 'waiting';
                    }
                }, delay);
            }
            else {
                job.status = 'failed';
                job.error = error;
                job.finishedAt = new Date();
                // Execute onFail hook
                if (definition.hooks.onFail) {
                    await definition.hooks.onFail(error, context);
                }
            }
        }
        finally {
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
    async executeWithMiddleware(definition, payload, context) {
        let index = 0;
        const middleware = definition.middleware;
        const dispatch = async () => {
            if (index >= middleware.length) {
                return definition.handler(payload, context);
            }
            const mw = middleware[index++];
            return mw(payload, context, dispatch);
        };
        return dispatch();
    }
    generateJobId() {
        return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
/**
 * Redis-backed queue implementation (using BullMQ)
 */
export class RedisQueue {
    options;
    queue;
    worker;
    definitions = new Map();
    BullMQ;
    processing = false;
    constructor(options = {}) {
        this.options = options;
    }
    async ensureInitialized() {
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
        }
        catch (error) {
            throw new Error('BullMQ is not installed. Install with: npm install bullmq ioredis');
        }
    }
    async enqueue(job, payload, options = {}) {
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
    async process() {
        await this.ensureInitialized();
        if (this.processing) {
            return;
        }
        this.processing = true;
        this.worker = new this.BullMQ.Worker(this.options.name || 'philjs-jobs', async (bullJob) => {
            const definition = this.definitions.get(bullJob.name);
            if (!definition) {
                throw new Error(`Job definition not found: ${bullJob.name}`);
            }
            const context = {
                jobId: bullJob.id,
                attemptsMade: bullJob.attemptsMade,
                timestamp: Date.now(),
                updateProgress: async (progress) => {
                    await bullJob.updateProgress(progress);
                    if (definition.hooks.onProgress) {
                        await definition.hooks.onProgress(progress, context);
                    }
                },
                log: (...args) => {
                    console.log(`[Job ${bullJob.id}]`, ...args);
                },
            };
            try {
                // Execute onBefore hook
                if (definition.hooks.onBefore) {
                    await definition.hooks.onBefore(bullJob.data, context);
                }
                // Execute middleware chain and handler
                const result = await this.executeWithMiddleware(definition, bullJob.data, context);
                // Execute onComplete hook
                if (definition.hooks.onComplete) {
                    await definition.hooks.onComplete(result, context);
                }
                return result;
            }
            catch (error) {
                // Execute onFail hook
                if (definition.hooks.onFail) {
                    await definition.hooks.onFail(error, context);
                }
                throw error;
            }
            finally {
                // Execute onFinally hook
                if (definition.hooks.onFinally) {
                    await definition.hooks.onFinally(context);
                }
            }
        }, {
            connection: this.options.redis || {
                host: 'localhost',
                port: 6379,
            },
            concurrency: this.options.concurrency || 1,
        });
    }
    async stop() {
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
    async getJob(jobId) {
        await this.ensureInitialized();
        const bullJob = await this.queue.getJob(jobId);
        if (!bullJob) {
            return null;
        }
        return this.bullJobToJob(bullJob);
    }
    async getStats() {
        await this.ensureInitialized();
        const counts = await this.queue.getJobCounts();
        return {
            waiting: counts.waiting || 0,
            active: counts.active || 0,
            completed: counts.completed || 0,
            failed: counts.failed || 0,
            delayed: counts.delayed || 0,
            total: (counts.waiting || 0) +
                (counts.active || 0) +
                (counts.completed || 0) +
                (counts.failed || 0) +
                (counts.delayed || 0),
        };
    }
    async removeJob(jobId) {
        await this.ensureInitialized();
        const job = await this.queue.getJob(jobId);
        if (!job) {
            return false;
        }
        await job.remove();
        return true;
    }
    async retryJob(jobId) {
        await this.ensureInitialized();
        const job = await this.queue.getJob(jobId);
        if (!job) {
            return false;
        }
        await job.retry();
        return true;
    }
    async clear() {
        await this.ensureInitialized();
        await this.queue.drain();
        await this.queue.clean(0, 0, 'completed');
        await this.queue.clean(0, 0, 'failed');
    }
    async pause() {
        await this.ensureInitialized();
        await this.queue.pause();
    }
    async resume() {
        await this.ensureInitialized();
        await this.queue.resume();
    }
    async isPaused() {
        await this.ensureInitialized();
        return this.queue.isPaused();
    }
    bullJobToJob(bullJob) {
        const job = {
            id: bullJob.id,
            name: bullJob.name,
            payload: bullJob.data,
            status: this.mapBullStatus(bullJob),
            progress: bullJob.progress || 0,
            attemptsMade: bullJob.attemptsMade || 0,
            createdAt: new Date(bullJob.timestamp),
        };
        // Only set optional properties if they have values (for exactOptionalPropertyTypes)
        if (bullJob.returnvalue !== undefined)
            job.result = bullJob.returnvalue;
        if (bullJob.failedReason)
            job.error = new Error(bullJob.failedReason);
        if (bullJob.processedOn)
            job.processedAt = new Date(bullJob.processedOn);
        if (bullJob.finishedOn)
            job.finishedAt = new Date(bullJob.finishedOn);
        return job;
    }
    mapBullStatus(bullJob) {
        if (bullJob.isCompleted())
            return 'completed';
        if (bullJob.isFailed())
            return 'failed';
        if (bullJob.isActive())
            return 'active';
        if (bullJob.isDelayed())
            return 'delayed';
        return 'waiting';
    }
    async executeWithMiddleware(definition, payload, context) {
        let index = 0;
        const middleware = definition.middleware;
        const dispatch = async () => {
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
export function createQueue(options = {}) {
    if (options.redis) {
        return new RedisQueue(options);
    }
    return new InMemoryQueue(options);
}
//# sourceMappingURL=queue.js.map