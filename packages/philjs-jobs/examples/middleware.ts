/**
 * Middleware Example
 *
 * Demonstrates job middleware for validation, logging, and rate limiting.
 */

import {
  defineJob,
  createQueue,
  createValidationMiddleware,
  createLoggingMiddleware,
  createRateLimitMiddleware,
  composeMiddleware,
  type JobMiddleware,
} from '@philjs/jobs';

// Custom authentication middleware
const createAuthMiddleware = (apiKey: string): JobMiddleware => {
  return async (payload: any, ctx, next) => {
    if (payload.apiKey !== apiKey) {
      throw new Error('Unauthorized: Invalid API key');
    }

    ctx.log('Authentication successful');
    return next();
  };
};

// Custom retry middleware with specific error handling
const createSmartRetryMiddleware = (): JobMiddleware => {
  return async (payload: any, ctx, next) => {
    try {
      return await next();
    } catch (error) {
      const err = error as Error;

      // Don't retry validation errors
      if (err.message.includes('Validation') || err.message.includes('Invalid')) {
        ctx.log('Validation error - not retrying');
        throw error;
      }

      // Retry network errors
      if (err.message.includes('Network') || err.message.includes('Timeout')) {
        ctx.log('Network error - will retry with backoff');
        throw error;
      }

      // For other errors, throw immediately
      throw error;
    }
  };
};

// Custom metrics middleware
const createMetricsMiddleware = (): JobMiddleware => {
  const metrics = new Map<string, { count: number; totalTime: number }>();

  return async (payload: any, ctx, next) => {
    const startTime = Date.now();
    const jobName = 'current-job'; // In real scenario, get from context

    try {
      const result = await next();
      const duration = Date.now() - startTime;

      // Update metrics
      const current = metrics.get(jobName) || { count: 0, totalTime: 0 };
      metrics.set(jobName, {
        count: current.count + 1,
        totalTime: current.totalTime + duration,
      });

      const avgTime = (current.totalTime + duration) / (current.count + 1);
      ctx.log(`Job metrics - Count: ${current.count + 1}, Avg time: ${avgTime.toFixed(2)}ms`);

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      ctx.log(`Job failed after ${duration}ms`);
      throw error;
    }
  };
};

// Define a job with validation
const processPaymentJob = defineJob({
  name: 'process-payment',
  handler: async (
    payload: {
      apiKey: string;
      amount: number;
      currency: string;
      customerId: string;
    },
    ctx
  ) => {
    ctx.log(`Processing payment: ${payload.amount} ${payload.currency}`);

    await ctx.updateProgress(50);
    await new Promise(resolve => setTimeout(resolve, 1000));

    await ctx.updateProgress(100);

    return {
      transactionId: `txn_${Date.now()}`,
      amount: payload.amount,
      currency: payload.currency,
      status: 'completed',
    };
  },
  middleware: [
    createAuthMiddleware('secret-key-123'),
    createValidationMiddleware(
      (payload: any) => {
        if (!payload.amount || payload.amount <= 0) {
          return false;
        }
        if (!payload.currency || payload.currency.length !== 3) {
          return false;
        }
        if (!payload.customerId) {
          return false;
        }
        return true;
      },
      'Invalid payment payload'
    ),
    createLoggingMiddleware(),
    createMetricsMiddleware(),
  ],
});

// Define a rate-limited job
const sendNotificationJob = defineJob({
  name: 'send-notification',
  handler: async (payload: { userId: string; message: string }, ctx) => {
    ctx.log(`Sending notification to user ${payload.userId}`);

    await new Promise(resolve => setTimeout(resolve, 500));

    return { sent: true, userId: payload.userId };
  },
  middleware: [
    createRateLimitMiddleware(10), // Max 10 per minute
    createLoggingMiddleware(),
  ],
});

// Define a job with composed middleware
const complexJob = defineJob({
  name: 'complex-job',
  handler: async (payload: any, ctx) => {
    ctx.log('Executing complex job');
    await new Promise(resolve => setTimeout(resolve, 800));
    return { success: true };
  },
  middleware: composeMiddleware(
    createLoggingMiddleware(),
    createMetricsMiddleware(),
    createSmartRetryMiddleware()
  ),
});

async function main() {
  console.log('Starting middleware example...\n');

  const queue = createQueue({ concurrency: 3 });

  // Example 1: Valid payment
  console.log('--- Example 1: Valid Payment ---');
  const validPayment = await queue.enqueue(processPaymentJob, {
    apiKey: 'secret-key-123',
    amount: 99.99,
    currency: 'USD',
    customerId: 'cus_123',
  });
  console.log(`Enqueued valid payment: ${validPayment.id}\n`);

  // Example 2: Invalid payment (wrong API key)
  console.log('--- Example 2: Invalid API Key ---');
  try {
    await queue.enqueue(processPaymentJob, {
      apiKey: 'wrong-key',
      amount: 50.0,
      currency: 'USD',
      customerId: 'cus_456',
    });
  } catch (error) {
    console.log(`Expected error during enqueue validation\n`);
  }

  // Example 3: Invalid payment (validation failure)
  console.log('--- Example 3: Invalid Amount ---');
  const invalidPayment = await queue.enqueue(processPaymentJob, {
    apiKey: 'secret-key-123',
    amount: -10, // Invalid
    currency: 'USD',
    customerId: 'cus_789',
  });
  console.log(`Enqueued invalid payment: ${invalidPayment.id}\n`);

  // Example 4: Rate-limited notifications
  console.log('--- Example 4: Rate-Limited Notifications ---');
  const notifications = [];
  for (let i = 0; i < 15; i++) {
    notifications.push(
      queue.enqueue(sendNotificationJob, {
        userId: `user_${i}`,
        message: `Message ${i}`,
      })
    );
  }
  await Promise.all(notifications);
  console.log(`Enqueued 15 notifications (some may hit rate limit)\n`);

  // Example 5: Complex job with composed middleware
  console.log('--- Example 5: Complex Job ---');
  const complex = await queue.enqueue(complexJob, { data: 'test' });
  console.log(`Enqueued complex job: ${complex.id}\n`);

  // Start processing
  console.log('Starting job processing...\n');
  await queue.process();

  // Wait for jobs to complete
  await new Promise(resolve => setTimeout(resolve, 10000));

  // Get statistics
  const stats = await queue.getStats();
  console.log('\n--- Final Statistics ---');
  console.log(`Total: ${stats.total}`);
  console.log(`Completed: ${stats.completed}`);
  console.log(`Failed: ${stats.failed}`);
  console.log(`Active: ${stats.active}`);
  console.log(`Waiting: ${stats.waiting}`);

  // Stop the queue
  await queue.stop();
  console.log('\nQueue stopped.');
}

main().catch(console.error);
