# @philjs/jobs

Background job processing and scheduling for PhilJS with queues, retries, and monitoring.

## Installation

```bash
npm install @philjs/jobs
```

## Features

- **Job Queues** - In-memory and Redis-backed queues
- **Scheduling** - Cron-based job scheduling
- **Retries** - Automatic retry with backoff
- **Middleware** - Validation, logging, rate limiting
- **Monitoring** - Job metrics and health checks
- **TypeScript** - Full type safety

## Quick Start

```typescript
import { defineJob, createQueue, Scheduler } from '@philjs/jobs';

// Define a job
const emailJob = defineJob({
  name: 'sendEmail',
  handler: async (ctx) => {
    const { to, subject, body } = ctx.payload;
    await sendEmail(to, subject, body);
    return { sent: true };
  },
});

// Create a queue
const queue = createQueue({ concurrency: 5 });

// Enqueue a job
await queue.enqueue(emailJob, {
  to: 'user@example.com',
  subject: 'Hello',
  body: 'Welcome!',
});

// Process jobs
queue.process();
```

## Defining Jobs

### Basic Job Definition

```typescript
import { defineJob } from '@philjs/jobs';

const processOrderJob = defineJob({
  name: 'processOrder',
  handler: async (ctx) => {
    const { orderId } = ctx.payload;

    // Process the order
    const order = await fetchOrder(orderId);
    await processPayment(order);
    await shipOrder(order);

    return { processed: true, orderId };
  },
});
```

### Job Options

```typescript
const jobWithOptions = defineJob({
  name: 'importantTask',
  handler: async (ctx) => {
    // Task logic
  },
  options: {
    timeout: 30000,        // 30 second timeout
    retries: 3,            // Retry up to 3 times
    retryDelay: 1000,      // 1 second between retries
    backoff: 'exponential', // 'linear' | 'exponential'
    priority: 1,           // Lower = higher priority
  },
});
```

### Job Hooks

```typescript
const jobWithHooks = defineJob({
  name: 'trackedJob',
  handler: async (ctx) => {
    await doWork(ctx.payload);
  },
  hooks: {
    beforeRun: async (ctx) => {
      console.log('Starting job:', ctx.jobId);
    },
    afterRun: async (ctx, result) => {
      console.log('Job completed:', result);
    },
    onError: async (ctx, error) => {
      console.error('Job failed:', error);
      await notifyAdmin(error);
    },
    onRetry: async (ctx, attempt) => {
      console.log(`Retry attempt ${attempt}`);
    },
  },
});
```

### Job Context

```typescript
interface JobContext<T> {
  jobId: string;
  payload: T;
  attempt: number;
  maxAttempts: number;
  enqueuedAt: Date;
  startedAt: Date;
  signal: AbortSignal;  // For cancellation
}

const job = defineJob({
  name: 'contextAwareJob',
  handler: async (ctx) => {
    console.log('Job ID:', ctx.jobId);
    console.log('Attempt:', ctx.attempt, 'of', ctx.maxAttempts);
    console.log('Payload:', ctx.payload);

    // Check if cancelled
    if (ctx.signal.aborted) {
      return { cancelled: true };
    }

    // Long-running work with cancellation support
    for (const item of items) {
      if (ctx.signal.aborted) break;
      await processItem(item);
    }

    return { processed: items.length };
  },
});
```

## Job Middleware

### Built-in Middleware

```typescript
import {
  createValidationMiddleware,
  createLoggingMiddleware,
  createRateLimitMiddleware,
  createRetryMiddleware,
  composeMiddleware,
} from '@philjs/jobs';

// Validation
const validateEmail = createValidationMiddleware((payload) => {
  if (!payload.to || !payload.subject) {
    throw new Error('Missing required fields');
  }
});

// Logging
const logger = createLoggingMiddleware({
  onStart: (ctx) => console.log(`[${ctx.jobId}] Starting`),
  onComplete: (ctx, result) => console.log(`[${ctx.jobId}] Done:`, result),
  onError: (ctx, error) => console.error(`[${ctx.jobId}] Failed:`, error),
});

// Rate limiting
const rateLimit = createRateLimitMiddleware({
  maxPerSecond: 10,
  maxPerMinute: 100,
});

// Retry logic
const retry = createRetryMiddleware({
  maxAttempts: 3,
  delay: 1000,
  backoff: 'exponential',
});

// Compose middleware
const middleware = composeMiddleware([
  validateEmail,
  logger,
  rateLimit,
  retry,
]);

const emailJob = defineJob({
  name: 'sendEmail',
  handler: async (ctx) => {
    await sendEmail(ctx.payload);
  },
  middleware,
});
```

### Custom Middleware

```typescript
import type { JobMiddleware } from '@philjs/jobs';

const customMiddleware: JobMiddleware = async (ctx, next) => {
  // Before job runs
  console.log('Before:', ctx.jobId);

  try {
    // Run the job
    const result = await next();

    // After job succeeds
    console.log('After:', result);
    return result;
  } catch (error) {
    // Handle errors
    console.error('Error:', error);
    throw error;
  }
};
```

## Job Queues

### In-Memory Queue

```typescript
import { createQueue, InMemoryQueue } from '@philjs/jobs';

const queue = createQueue({
  concurrency: 5,           // Process 5 jobs at once
  pollInterval: 1000,       // Check for new jobs every 1s
});

// Or explicitly use InMemoryQueue
const memoryQueue = new InMemoryQueue({
  concurrency: 5,
});
```

### Redis Queue

```typescript
import { RedisQueue } from '@philjs/jobs';

const queue = new RedisQueue({
  redis: {
    host: 'localhost',
    port: 6379,
    password: 'secret',
  },
  queueName: 'my-jobs',
  concurrency: 10,
});
```

### Enqueueing Jobs

```typescript
// Basic enqueue
await queue.enqueue(myJob, { data: 'payload' });

// With options
await queue.enqueue(myJob, { data: 'payload' }, {
  delay: 5000,          // Wait 5 seconds before processing
  priority: 1,          // Higher priority
  maxAttempts: 5,       // Override default retries
  timeout: 60000,       // 60 second timeout
  uniqueKey: 'order-123', // Deduplicate by key
});

// Schedule for later
await queue.enqueue(myJob, payload, {
  runAt: new Date('2024-12-25T00:00:00Z'),
});
```

### Processing Jobs

```typescript
// Start processing
queue.process();

// Process specific job types
queue.process(emailJob);
queue.process([emailJob, orderJob, reportJob]);

// Stop processing
queue.stop();

// Graceful shutdown (waits for active jobs)
await queue.shutdown();
```

### Queue Statistics

```typescript
const stats = await queue.stats();

console.log({
  pending: stats.pending,
  processing: stats.processing,
  completed: stats.completed,
  failed: stats.failed,
  delayed: stats.delayed,
});
```

## Job Scheduler

### Creating a Scheduler

```typescript
import { Scheduler, CronPatterns } from '@philjs/jobs';

const scheduler = new Scheduler({
  queue,  // Your job queue
  timezone: 'America/New_York',
});
```

### Scheduling Jobs

```typescript
// Every minute
scheduler.schedule('cleanupTemp', '* * * * *', cleanupJob, {});

// Every hour
scheduler.schedule('hourlyReport', '0 * * * *', reportJob, {});

// Daily at midnight
scheduler.schedule('dailyBackup', '0 0 * * *', backupJob, {});

// Every Monday at 9am
scheduler.schedule('weeklyDigest', '0 9 * * 1', digestJob, {});

// Using pre-built patterns
scheduler.schedule('everyMinute', CronPatterns.EVERY_MINUTE, job, {});
scheduler.schedule('everyHour', CronPatterns.EVERY_HOUR, job, {});
scheduler.schedule('daily', CronPatterns.DAILY_MIDNIGHT, job, {});
scheduler.schedule('weekly', CronPatterns.WEEKLY_MONDAY, job, {});
```

### Cron Patterns

```typescript
import { CronPatterns } from '@philjs/jobs';

CronPatterns.EVERY_MINUTE;     // '* * * * *'
CronPatterns.EVERY_5_MINUTES;  // '*/5 * * * *'
CronPatterns.EVERY_15_MINUTES; // '*/15 * * * *'
CronPatterns.EVERY_30_MINUTES; // '*/30 * * * *'
CronPatterns.EVERY_HOUR;       // '0 * * * *'
CronPatterns.EVERY_6_HOURS;    // '0 */6 * * *'
CronPatterns.EVERY_12_HOURS;   // '0 */12 * * *'
CronPatterns.DAILY_MIDNIGHT;   // '0 0 * * *'
CronPatterns.DAILY_NOON;       // '0 12 * * *'
CronPatterns.WEEKLY_MONDAY;    // '0 0 * * 1'
CronPatterns.MONTHLY_FIRST;    // '0 0 1 * *'
```

### Managing Scheduled Jobs

```typescript
// Get all scheduled jobs
const jobs = scheduler.getScheduledJobs();

// Remove a scheduled job
scheduler.unschedule('dailyBackup');

// Pause scheduling
scheduler.pause('hourlyReport');

// Resume scheduling
scheduler.resume('hourlyReport');

// Get next run time
const nextRun = scheduler.getNextRunTime('dailyBackup');
```

### Schedule Options

```typescript
scheduler.schedule('myJob', '0 * * * *', job, payload, {
  timezone: 'UTC',
  runOnStart: true,        // Run immediately on schedule creation
  allowConcurrent: false,  // Prevent overlapping runs
  maxRuns: 100,            // Stop after 100 runs
  endDate: new Date('2025-12-31'),
});
```

## Job Monitoring

### Creating a Monitor

```typescript
import { Monitor } from '@philjs/jobs';

const monitor = new Monitor({
  queue,
  metricsInterval: 60000,  // Collect metrics every minute
  retention: 86400000,     // Keep metrics for 24 hours
});

monitor.start();
```

### Job Metrics

```typescript
const metrics = monitor.getMetrics();

console.log({
  totalJobs: metrics.totalJobs,
  successfulJobs: metrics.successfulJobs,
  failedJobs: metrics.failedJobs,
  averageDuration: metrics.averageDuration,
  throughput: metrics.throughput,  // Jobs per minute
  errorRate: metrics.errorRate,
});
```

### Job Details

```typescript
// Get specific job
const job = await monitor.getJob('job-id-123');

console.log({
  id: job.id,
  name: job.name,
  status: job.status,
  payload: job.payload,
  result: job.result,
  error: job.error,
  attempts: job.attempts,
  createdAt: job.createdAt,
  startedAt: job.startedAt,
  completedAt: job.completedAt,
  duration: job.duration,
});

// Get recent jobs
const recentJobs = await monitor.getRecentJobs({
  limit: 50,
  status: 'failed',
  jobName: 'sendEmail',
});
```

### System Health

```typescript
const health = await monitor.getSystemHealth();

console.log({
  status: health.status,        // 'healthy' | 'degraded' | 'unhealthy'
  queueDepth: health.queueDepth,
  activeWorkers: health.activeWorkers,
  errorRate: health.errorRate,
  memoryUsage: health.memoryUsage,
  lastHeartbeat: health.lastHeartbeat,
});
```

### Events

```typescript
monitor.on('jobCompleted', (job) => {
  console.log('Job completed:', job.id);
});

monitor.on('jobFailed', (job, error) => {
  console.error('Job failed:', job.id, error);
  alertOps(job, error);
});

monitor.on('queueBacklog', (depth) => {
  console.warn('Queue backlog:', depth);
});

monitor.on('healthChanged', (health) => {
  if (health.status !== 'healthy') {
    alertOps(health);
  }
});
```

## Types Reference

```typescript
// Job definition
interface JobDefinition<T, R> {
  name: string;
  handler: JobHandler<T, R>;
  options?: JobOptions;
  hooks?: JobHooks<T, R>;
  middleware?: JobMiddleware;
}

// Job context
interface JobContext<T> {
  jobId: string;
  payload: T;
  attempt: number;
  maxAttempts: number;
  enqueuedAt: Date;
  startedAt: Date;
  signal: AbortSignal;
}

// Job options
interface JobOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  backoff?: 'linear' | 'exponential';
  priority?: number;
}

// Enqueue options
interface EnqueueOptions {
  delay?: number;
  runAt?: Date;
  priority?: number;
  maxAttempts?: number;
  timeout?: number;
  uniqueKey?: string;
}

// Queue stats
interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  delayed: number;
}

// Job metrics
interface JobMetrics {
  totalJobs: number;
  successfulJobs: number;
  failedJobs: number;
  averageDuration: number;
  throughput: number;
  errorRate: number;
}
```

## API Reference

### Functions

| Function | Description |
|----------|-------------|
| `defineJob(options)` | Create a job definition |
| `createQueue(options?)` | Create a job queue |
| `createValidationMiddleware(fn)` | Create validation middleware |
| `createLoggingMiddleware(options)` | Create logging middleware |
| `createRateLimitMiddleware(options)` | Create rate limit middleware |
| `createRetryMiddleware(options)` | Create retry middleware |
| `composeMiddleware(middlewares)` | Compose multiple middlewares |

### Classes

| Class | Description |
|-------|-------------|
| `InMemoryQueue` | In-memory job queue |
| `RedisQueue` | Redis-backed job queue |
| `Scheduler` | Cron-based job scheduler |
| `Monitor` | Job monitoring and metrics |

### Constants

| Constant | Description |
|----------|-------------|
| `CronPatterns` | Pre-built cron expressions |
| `Timezones` | Common timezone identifiers |

## Example: Email Queue System

```typescript
import { defineJob, createQueue, Scheduler, Monitor } from '@philjs/jobs';

// Define email job
const sendEmailJob = defineJob({
  name: 'sendEmail',
  handler: async (ctx) => {
    const { to, subject, body, template } = ctx.payload;

    const html = template ? await renderTemplate(template, ctx.payload) : body;

    await emailService.send({ to, subject, html });

    return { sent: true, to };
  },
  options: {
    retries: 3,
    retryDelay: 5000,
    timeout: 30000,
  },
  hooks: {
    onError: async (ctx, error) => {
      await logEmailError(ctx.payload.to, error);
    },
  },
});

// Create queue
const queue = createQueue({ concurrency: 10 });

// Create monitor
const monitor = new Monitor({ queue });
monitor.start();

// Create scheduler
const scheduler = new Scheduler({ queue });

// Schedule daily digest
scheduler.schedule('dailyDigest', '0 8 * * *', sendEmailJob, {
  to: 'subscribers',
  subject: 'Daily Digest',
  template: 'daily-digest',
});

// Start processing
queue.process();

// API to send email
export async function queueEmail(to: string, subject: string, body: string) {
  return queue.enqueue(sendEmailJob, { to, subject, body });
}

// API to check status
export async function getJobStatus(jobId: string) {
  return monitor.getJob(jobId);
}
```
