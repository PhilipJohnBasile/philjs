import { describe, it, expect, vi } from 'vitest';
import {
  defineJob,
  createValidationMiddleware,
  createLoggingMiddleware,
  createRateLimitMiddleware,
  composeMiddleware,
  type JobContext,
} from '../job.js';

describe('Job Definition', () => {
  it('should define a job with default options', () => {
    const job = defineJob({
      name: 'test-job',
      handler: async (payload: { message: string }) => {
        return { processed: payload.message };
      },
    });

    expect(job.name).toBe('test-job');
    expect(job.options.attempts).toBe(3);
    expect(job.options.backoff).toEqual({ type: 'exponential', delay: 1000 });
    expect(job.middleware).toEqual([]);
  });

  it('should define a job with custom options', () => {
    const job = defineJob({
      name: 'custom-job',
      handler: async (payload: { value: number }) => payload.value * 2,
      attempts: 5,
      priority: 10,
      timeout: 5000,
    });

    expect(job.options.attempts).toBe(5);
    expect(job.options.priority).toBe(10);
    expect(job.options.timeout).toBe(5000);
  });

  it('should define a job with lifecycle hooks', async () => {
    const onBefore = vi.fn();
    const onComplete = vi.fn();
    const onFail = vi.fn();

    const job = defineJob({
      name: 'hooked-job',
      handler: async (payload: { value: number }) => payload.value * 2,
      onBefore,
      onComplete,
      onFail,
    });

    expect(job.hooks.onBefore).toBe(onBefore);
    expect(job.hooks.onComplete).toBe(onComplete);
    expect(job.hooks.onFail).toBe(onFail);
  });

  it('should execute handler with context', async () => {
    let capturedContext: JobContext | null = null;

    const job = defineJob({
      name: 'context-job',
      handler: async (payload: { message: string }, ctx) => {
        capturedContext = ctx;
        return { message: payload.message };
      },
    });

    const mockContext: JobContext = {
      jobId: 'test-123',
      attemptsMade: 0,
      timestamp: Date.now(),
      updateProgress: vi.fn(),
      log: vi.fn(),
    };

    await job.handler({ message: 'test' }, mockContext);

    expect(capturedContext).toBe(mockContext);
  });
});

describe('Middleware', () => {
  it('should create validation middleware', async () => {
    const validate = (payload: { age: number }) => payload.age >= 18;
    const middleware = createValidationMiddleware(validate, 'Must be 18 or older');

    const mockContext: JobContext = {
      jobId: 'test-123',
      attemptsMade: 0,
      timestamp: Date.now(),
      updateProgress: vi.fn(),
      log: vi.fn(),
    };

    const next = vi.fn().mockResolvedValue('success');

    // Valid payload
    await middleware({ age: 21 }, mockContext, next);
    expect(next).toHaveBeenCalled();

    // Invalid payload
    await expect(
      middleware({ age: 16 }, mockContext, next)
    ).rejects.toThrow('Must be 18 or older');
  });

  it('should create logging middleware', async () => {
    const middleware = createLoggingMiddleware();
    const mockContext: JobContext = {
      jobId: 'test-123',
      attemptsMade: 0,
      timestamp: Date.now(),
      updateProgress: vi.fn(),
      log: vi.fn(),
    };

    const next = vi.fn().mockResolvedValue('result');

    await middleware({}, mockContext, next);

    expect(mockContext.log).toHaveBeenCalledWith('[test-123] Starting job');
    expect(mockContext.log).toHaveBeenCalledWith(
      expect.stringContaining('[test-123] Completed in')
    );
  });

  it('should create rate limit middleware', async () => {
    const middleware = createRateLimitMiddleware(2); // 2 per minute

    const mockContext: JobContext = {
      jobId: 'test-123',
      attemptsMade: 0,
      timestamp: Date.now(),
      updateProgress: vi.fn(),
      log: vi.fn(),
    };

    const next = vi.fn().mockResolvedValue('success');

    // First two calls should succeed
    await middleware({}, mockContext, next);
    await middleware({}, mockContext, next);

    // Third call should fail
    await expect(
      middleware({}, mockContext, next)
    ).rejects.toThrow('Rate limit exceeded');
  });

  it('should compose multiple middleware', async () => {
    const order: string[] = [];

    const middleware1 = async (payload: any, ctx: JobContext, next: () => Promise<any>) => {
      order.push('mw1-before');
      const result = await next();
      order.push('mw1-after');
      return result;
    };

    const middleware2 = async (payload: any, ctx: JobContext, next: () => Promise<any>) => {
      order.push('mw2-before');
      const result = await next();
      order.push('mw2-after');
      return result;
    };

    const composed = composeMiddleware(middleware1, middleware2);

    const mockContext: JobContext = {
      jobId: 'test-123',
      attemptsMade: 0,
      timestamp: Date.now(),
      updateProgress: vi.fn(),
      log: vi.fn(),
    };

    const next = vi.fn(async () => {
      order.push('handler');
      return 'result';
    });

    await composed({}, mockContext, next);

    expect(order).toEqual([
      'mw1-before',
      'mw2-before',
      'handler',
      'mw2-after',
      'mw1-after',
    ]);
  });
});
