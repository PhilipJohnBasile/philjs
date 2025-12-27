import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createQueue, InMemoryQueue } from '../queue.js';
import { defineJob } from '../job.js';

describe('Queue', () => {
  let queue: InMemoryQueue;

  beforeEach(() => {
    queue = new InMemoryQueue({ concurrency: 1 });
  });

  it('should enqueue a job', async () => {
    const job = defineJob({
      name: 'test-job',
      handler: async (payload: { value: number }) => payload.value * 2,
    });

    const queuedJob = await queue.enqueue(job, { value: 5 });

    expect(queuedJob.id).toBeDefined();
    expect(queuedJob.name).toBe('test-job');
    expect(queuedJob.status).toBe('waiting');
    expect(queuedJob.payload).toEqual({ value: 5 });
  });

  it('should process a job', async () => {
    const handler = vi.fn(async (payload: { value: number }) => payload.value * 2);

    const job = defineJob({
      name: 'test-job',
      handler,
    });

    const queuedJob = await queue.enqueue(job, { value: 5 });

    // Start processing
    queue.process();

    // Wait for job to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(handler).toHaveBeenCalledWith(
      { value: 5 },
      expect.objectContaining({
        jobId: queuedJob.id,
      })
    );

    await queue.stop();
  });

  it('should retry failed jobs', async () => {
    let attempts = 0;

    const job = defineJob({
      name: 'failing-job',
      handler: async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary failure');
        }
        return 'success';
      },
      attempts: 3,
      backoff: { type: 'fixed', delay: 10 },
    });

    await queue.enqueue(job, {});
    queue.process();

    // Wait for retries (increased timeout for CI)
    await new Promise(resolve => setTimeout(resolve, 1000));

    expect(attempts).toBe(3);

    await queue.stop();
  });

  it('should handle job priority', async () => {
    const processedOrder: string[] = [];

    const job = defineJob({
      name: 'priority-job',
      handler: async (payload: { id: string }) => {
        processedOrder.push(payload.id);
      },
    });

    // Enqueue jobs with different creation times
    await queue.enqueue(job, { id: 'job-1' });
    await new Promise(resolve => setTimeout(resolve, 20));
    await queue.enqueue(job, { id: 'job-2' });
    await new Promise(resolve => setTimeout(resolve, 20));
    await queue.enqueue(job, { id: 'job-3' });

    queue.process();

    // Wait for all jobs to complete
    await new Promise(resolve => setTimeout(resolve, 500));

    // Jobs should be processed in FIFO order (oldest first)
    expect(processedOrder.length).toBe(3);
    expect(processedOrder).toEqual(['job-1', 'job-2', 'job-3']);

    await queue.stop();
  });

  it('should execute lifecycle hooks', async () => {
    const onBefore = vi.fn();
    const onComplete = vi.fn();
    const onFinally = vi.fn();

    const job = defineJob({
      name: 'hooked-job',
      handler: async (payload: { value: number }) => payload.value * 2,
      onBefore,
      onComplete,
      onFinally,
    });

    await queue.enqueue(job, { value: 5 });
    queue.process();

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(onBefore).toHaveBeenCalled();
    expect(onComplete).toHaveBeenCalledWith(10, expect.any(Object));
    expect(onFinally).toHaveBeenCalled();

    await queue.stop();
  });

  it('should track job progress', async () => {
    const progressUpdates: number[] = [];

    const job = defineJob({
      name: 'progress-job',
      handler: async (payload: any, ctx) => {
        await ctx.updateProgress(25);
        await ctx.updateProgress(50);
        await ctx.updateProgress(75);
        await ctx.updateProgress(100);
      },
      onProgress: (progress) => {
        progressUpdates.push(progress);
      },
    });

    await queue.enqueue(job, {});
    queue.process();

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(progressUpdates).toEqual([25, 50, 75, 100]);

    await queue.stop();
  });

  it('should get queue statistics', async () => {
    const job = defineJob({
      name: 'stats-job',
      handler: async () => 'done',
    });

    await queue.enqueue(job, {});
    await queue.enqueue(job, {});

    const stats = await queue.getStats();

    expect(stats.waiting).toBe(2);
    expect(stats.total).toBe(2);
  });

  it('should pause and resume queue', async () => {
    const processedJobs: string[] = [];

    const job = defineJob({
      name: 'pausable-job',
      handler: async (payload: { id: string }) => {
        processedJobs.push(payload.id);
      },
    });

    await queue.enqueue(job, { id: 'job-1' });
    await queue.pause();
    await queue.enqueue(job, { id: 'job-2' });

    queue.process();
    await new Promise(resolve => setTimeout(resolve, 100));

    // No jobs should be processed while paused
    expect(processedJobs).toEqual([]);

    await queue.resume();
    await new Promise(resolve => setTimeout(resolve, 100));

    // Jobs should be processed after resume
    expect(processedJobs.length).toBeGreaterThan(0);

    await queue.stop();
  });

  it('should clear all jobs', async () => {
    const job = defineJob({
      name: 'clearable-job',
      handler: async () => 'done',
    });

    await queue.enqueue(job, {});
    await queue.enqueue(job, {});

    let stats = await queue.getStats();
    expect(stats.total).toBe(2);

    await queue.clear();

    stats = await queue.getStats();
    expect(stats.total).toBe(0);
  });

  it('should execute middleware chain', async () => {
    const order: string[] = [];

    const middleware1 = async (payload: any, ctx: any, next: () => Promise<any>) => {
      order.push('mw1');
      return next();
    };

    const middleware2 = async (payload: any, ctx: any, next: () => Promise<any>) => {
      order.push('mw2');
      return next();
    };

    const job = defineJob({
      name: 'middleware-job',
      handler: async () => {
        order.push('handler');
        return 'done';
      },
      middleware: [middleware1, middleware2],
    });

    await queue.enqueue(job, {});
    queue.process();

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(order).toEqual(['mw1', 'mw2', 'handler']);

    await queue.stop();
  });

  it('should handle delayed jobs', async () => {
    const job = defineJob({
      name: 'delayed-job',
      handler: async () => 'done',
    });

    const queuedJob = await queue.enqueue(job, {}, { delay: 100 });

    expect(queuedJob.status).toBe('delayed');

    // Wait for delay
    await new Promise(resolve => setTimeout(resolve, 150));

    const retrieved = await queue.getJob(queuedJob.id);
    expect(retrieved?.status).toBe('waiting');
  });
});

describe('Queue Factory', () => {
  it('should create in-memory queue by default', () => {
    const queue = createQueue();
    expect(queue).toBeInstanceOf(InMemoryQueue);
  });

  it('should create in-memory queue when no redis config', () => {
    const queue = createQueue({ concurrency: 5 });
    expect(queue).toBeInstanceOf(InMemoryQueue);
  });
});
