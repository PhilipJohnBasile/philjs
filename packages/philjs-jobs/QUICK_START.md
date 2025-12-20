# Quick Start Guide

Get up and running with @philjs/jobs in 5 minutes.

## Installation

```bash
npm install @philjs/jobs
```

## 1. Define a Job

```typescript
import { defineJob } from '@philjs/jobs';

const sendEmailJob = defineJob({
  name: 'send-email',
  handler: async (payload: { to: string; subject: string }, ctx) => {
    // Your job logic here
    await sendEmail(payload.to, payload.subject);
    return { sent: true };
  },
});
```

## 2. Create a Queue

```typescript
import { createQueue } from '@philjs/jobs';

const queue = createQueue({ concurrency: 5 });
```

## 3. Enqueue and Process

```typescript
// Enqueue a job
await queue.enqueue(sendEmailJob, {
  to: 'user@example.com',
  subject: 'Welcome!',
});

// Start processing
await queue.process();
```

## 4. Schedule Recurring Jobs (Optional)

```typescript
import { Scheduler, CronPatterns } from '@philjs/jobs';

const scheduler = new Scheduler(queue);

scheduler.schedule(sendEmailJob, {
  cron: CronPatterns.DAILY,
  payload: { to: 'admin@example.com', subject: 'Daily Report' },
});

scheduler.start();
```

## 5. Monitor Jobs (Optional)

```typescript
import { Monitor } from '@philjs/jobs';

const monitor = new Monitor(queue, scheduler);
monitor.start();

// Get metrics
const metrics = await monitor.getMetrics();
console.log(metrics);

// Generate dashboard
const html = await monitor.generateDashboard();
```

## Common Patterns

### Retry Failed Jobs

```typescript
const job = defineJob({
  name: 'my-job',
  handler: async (payload, ctx) => {
    // ...
  },
  attempts: 3,
  backoff: { type: 'exponential', delay: 1000 },
});
```

### Track Progress

```typescript
const job = defineJob({
  name: 'long-job',
  handler: async (payload, ctx) => {
    await ctx.updateProgress(25);
    // ... do work
    await ctx.updateProgress(50);
    // ... do more work
    await ctx.updateProgress(100);
  },
});
```

### Add Validation

```typescript
import { createValidationMiddleware } from '@philjs/jobs';

const job = defineJob({
  name: 'validated-job',
  handler: async (payload, ctx) => {
    // ...
  },
  middleware: [
    createValidationMiddleware(
      (p) => p.amount > 0,
      'Amount must be positive'
    ),
  ],
});
```

### Lifecycle Hooks

```typescript
const job = defineJob({
  name: 'hooked-job',
  handler: async (payload, ctx) => {
    // ...
  },
  onBefore: async (payload, ctx) => {
    console.log('Starting job');
  },
  onComplete: async (result, ctx) => {
    console.log('Job completed:', result);
  },
  onFail: async (error, ctx) => {
    console.error('Job failed:', error);
  },
});
```

## Production Setup with Redis

```typescript
const queue = createQueue({
  name: 'production-queue',
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: 6379,
    password: process.env.REDIS_PASSWORD,
  },
  concurrency: 10,
});
```

## Next Steps

- Read the [full documentation](./README.md)
- Check out [examples](./examples/)
- Learn about [middleware](./README.md#4-job-middleware)
- Explore [cron patterns](./README.md#cron-patterns)

## Need Help?

- [GitHub Issues](https://github.com/philjs/philjs/issues)
- [Documentation](https://philjs.dev/docs/jobs)
- [Discord](https://discord.gg/philjs)
