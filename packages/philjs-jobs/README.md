# @philjs/jobs

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D24-brightgreen)](https://nodejs.org)
[![TypeScript Version](https://img.shields.io/badge/typescript-%3E%3D6-blue)](https://www.typescriptlang.org)
[![ESM Only](https://img.shields.io/badge/module-ESM%20only-yellow)](https://nodejs.org/api/esm.html)

**Background job processing and scheduling for PhilJS** - RedwoodJS-style job queue system with Redis support, cron scheduling, and comprehensive monitoring.

## Requirements

- **Node.js 24** or higher
- **TypeScript 6** or higher
- **ESM only** - CommonJS is not supported

## Features

- **Flexible Job Queue**: Redis-backed (BullMQ) or in-memory queue for development
- **Type-Safe Job Definitions**: Define jobs with full TypeScript type safety
- **Cron Scheduling**: Schedule recurring jobs with timezone support
- **Job Lifecycle Hooks**: Execute code at different stages of job processing
- **Middleware System**: Add validation, logging, rate limiting, and custom logic
- **Job Monitoring**: Track metrics, health status, and generate dashboards
- **Retry Logic**: Automatic retries with exponential backoff
- **Progress Tracking**: Update and monitor job progress in real-time
- **Priority Queues**: Process high-priority jobs first
- **Concurrency Control**: Limit concurrent job execution
- **Job History**: Track scheduled job execution history

## Installation

```bash
pnpm add @philjs/jobs
```

For Redis support (optional):

```bash
pnpm add bullmq ioredis
```

## Quick Start

```typescript
import { defineJob, createQueue } from '@philjs/jobs';

// Define a job
const sendEmailJob = defineJob({
  name: 'send-email',
  handler: async (payload: { to: string; subject: string }, ctx) => {
    // Send email
    await ctx.updateProgress(50);
    await sendEmail(payload);
    await ctx.updateProgress(100);

    return { sent: true };
  },
  attempts: 3,
  backoff: { type: 'exponential', delay: 1000 },
});

// Create queue
const queue = createQueue({ concurrency: 5 });

// Enqueue job
await queue.enqueue(sendEmailJob, {
  to: 'user@example.com',
  subject: 'Welcome!',
});

// Process jobs
await queue.process();
```

## Core Concepts

### 1. Job Definitions

Define type-safe jobs with handlers, options, and hooks:

```typescript
const imageProcessingJob = defineJob({
  name: 'image-processing',
  handler: async (payload: { imageUrl: string }, ctx) => {
    ctx.log('Processing image...');

    // Update progress
    await ctx.updateProgress(25);

    // Process image
    const result = await processImage(payload.imageUrl);

    await ctx.updateProgress(100);

    return result;
  },

  // Job options
  attempts: 3,
  backoff: { type: 'exponential', delay: 2000 },
  priority: 10,
  timeout: 60000,

  // Lifecycle hooks
  onBefore: async (payload, ctx) => {
    console.log('Job starting:', ctx.jobId);
  },
  onComplete: async (result, ctx) => {
    console.log('Job completed:', result);
  },
  onFail: async (error, ctx) => {
    console.error('Job failed:', error);
  },
  onProgress: async (progress, ctx) => {
    console.log(`Progress: ${progress}%`);
  },
});
```

### 2. Job Queue

Create and manage job queues:

```typescript
// In-memory queue (development)
const devQueue = createQueue({
  concurrency: 3,
});

// Redis queue (production)
const prodQueue = createQueue({
  name: 'my-app-jobs',
  redis: {
    host: 'localhost',
    port: 6379,
    password: 'secret',
  },
  concurrency: 10,
  defaultJobOptions: {
    attempts: 3,
    removeOnComplete: 100,
  },
});

// Enqueue jobs
const job = await queue.enqueue(myJob, payload, {
  priority: 5,
  delay: 5000, // Delay 5 seconds
});

// Start processing
await queue.process();

// Get statistics
const stats = await queue.getStats();
console.log(stats);

// Pause/resume
await queue.pause();
await queue.resume();

// Stop queue
await queue.stop();
```

### 3. Job Scheduling

Schedule recurring jobs with cron expressions:

```typescript
import { Scheduler, CronPatterns, Timezones } from '@philjs/jobs';

const scheduler = new Scheduler(queue);

// Schedule daily backup at 2 AM
scheduler.schedule(backupJob, {
  cron: CronPatterns.at(2, 0),
  timezone: Timezones.UTC,
  payload: { database: 'production' },
  onSchedule: (scheduledAt) => {
    console.log('Backup scheduled for:', scheduledAt);
  },
});

// Schedule weekly cleanup
scheduler.schedule(cleanupJob, {
  cron: CronPatterns.WEEKLY,
  payload: { olderThan: 30 },
  maxRuns: 10, // Only run 10 times
});

// Schedule one-time job
scheduler.scheduleOnce(
  reportJob,
  { reportType: 'monthly' },
  new Date('2024-02-01T00:00:00Z')
);

// Start scheduler
scheduler.start();

// Manage schedules
scheduler.pause(scheduleId);
scheduler.resume(scheduleId);
scheduler.remove(scheduleId);

// Get scheduled jobs
const jobs = scheduler.getAllScheduledJobs();
const history = scheduler.getJobHistory();
```

### 4. Job Middleware

Add custom logic with middleware:

```typescript
import {
  createValidationMiddleware,
  createLoggingMiddleware,
  createRateLimitMiddleware,
  composeMiddleware,
} from '@philjs/jobs';

const processPaymentJob = defineJob({
  name: 'process-payment',
  handler: async (payload, ctx) => {
    // Process payment
    return { success: true };
  },
  middleware: [
    // Validate payload
    createValidationMiddleware(
      (payload) => payload.amount > 0 && payload.currency,
      'Invalid payment data'
    ),

    // Log execution
    createLoggingMiddleware(),

    // Rate limit
    createRateLimitMiddleware(100), // Max 100 per minute

    // Custom middleware
    async (payload, ctx, next) => {
      // Pre-processing
      const result = await next();
      // Post-processing
      return result;
    },
  ],
});

// Compose multiple middleware
const composedMiddleware = composeMiddleware(
  middleware1,
  middleware2,
  middleware3
);
```

### 5. Job Monitoring

Monitor jobs and track metrics:

```typescript
import { Monitor } from '@philjs/jobs';

const monitor = new Monitor(queue, scheduler, {
  metricsInterval: 60000, // Collect every minute
  healthCheckInterval: 30000, // Check every 30 seconds
  healthThresholds: {
    queueDepthWarning: 100,
    errorRateWarning: 0.1,
  },
});

// Start monitoring
monitor.start();

// Get current metrics
const metrics = await monitor.getMetrics();
console.log(metrics);
// {
//   totalJobs: 1000,
//   completedJobs: 950,
//   failedJobs: 50,
//   successRate: 0.95,
//   throughput: 16.7,
//   ...
// }

// Check health
const health = await monitor.getHealth();
console.log(health.status); // 'healthy' | 'degraded' | 'critical'
console.log(health.issues); // Array of issues

// Get job details
const jobDetails = await monitor.getJobDetails(jobId);

// Retry failed jobs
await monitor.retryJob(jobId);
await monitor.retryAllFailed();

// Export metrics
const json = await monitor.exportMetrics();

// Generate HTML dashboard
const html = await monitor.generateDashboard();
```

## Cron Patterns

Common cron patterns are available:

```typescript
import { CronPatterns } from '@philjs/jobs';

CronPatterns.EVERY_MINUTE        // '* * * * *'
CronPatterns.EVERY_5_MINUTES     // '*/5 * * * *'
CronPatterns.EVERY_15_MINUTES    // '*/15 * * * *'
CronPatterns.EVERY_30_MINUTES    // '*/30 * * * *'
CronPatterns.EVERY_HOUR          // '0 * * * *'
CronPatterns.DAILY               // '0 0 * * *'
CronPatterns.DAILY_NOON          // '0 12 * * *'
CronPatterns.WEEKLY              // '0 0 * * 0'
CronPatterns.MONTHLY             // '0 0 1 * *'
CronPatterns.YEARLY              // '0 0 1 1 *'

// Custom patterns
CronPatterns.at(14, 30)          // '30 14 * * *' - 2:30 PM
CronPatterns.everyMinutes(15)    // '*/15 * * * *'
CronPatterns.everyHours(6)       // '0 */6 * * *'
CronPatterns.weekday(1, 9, 0)    // '0 9 * * 1' - Monday at 9 AM
CronPatterns.weekdays(9, 0)      // '0 9 * * 1-5' - Weekdays at 9 AM
CronPatterns.weekends(10, 0)     // '0 10 * * 0,6' - Weekends at 10 AM
```

## Timezones

Common timezone identifiers:

```typescript
import { Timezones } from '@philjs/jobs';

Timezones.UTC
Timezones.NEW_YORK      // 'America/New_York'
Timezones.CHICAGO       // 'America/Chicago'
Timezones.DENVER        // 'America/Denver'
Timezones.LOS_ANGELES   // 'America/Los_Angeles'
Timezones.LONDON        // 'Europe/London'
Timezones.PARIS         // 'Europe/Paris'
Timezones.TOKYO         // 'Asia/Tokyo'
Timezones.SHANGHAI      // 'Asia/Shanghai'
Timezones.SYDNEY        // 'Australia/Sydney'
```

## Advanced Examples

### Video Transcoding Pipeline

```typescript
const videoTranscodingJob = defineJob({
  name: 'video-transcoding',
  handler: async (payload: { videoId: string; format: string }, ctx) => {
    await ctx.updateProgress(10);

    // Download video
    const video = await downloadVideo(payload.videoId);
    await ctx.updateProgress(30);

    // Transcode
    const transcoded = await transcode(video, payload.format);
    await ctx.updateProgress(70);

    // Upload
    const url = await upload(transcoded);
    await ctx.updateProgress(100);

    return { url };
  },
  timeout: 600000, // 10 minutes
  attempts: 2,
  priority: 8,
});

// Enqueue with high priority
await queue.enqueue(videoTranscodingJob,
  { videoId: 'vid_123', format: 'mp4' },
  { priority: 10 }
);
```

### Email Campaign

```typescript
const emailCampaignJob = defineJob({
  name: 'email-campaign',
  handler: async (payload: { recipients: string[]; template: string }, ctx) => {
    const total = payload.recipients.length;

    for (let i = 0; i < total; i++) {
      await sendEmail(payload.recipients[i], payload.template);
      await ctx.updateProgress((i + 1) / total * 100);
    }

    return { sent: total };
  },
  middleware: [
    createRateLimitMiddleware(1000), // Max 1000 emails per minute
    createLoggingMiddleware(),
  ],
});
```

### Data Synchronization

```typescript
// Schedule hourly sync
scheduler.schedule(syncJob, {
  cron: CronPatterns.EVERY_HOUR,
  timezone: Timezones.UTC,
  payload: { source: 'external-api' },
  onComplete: async () => {
    console.log('Sync completed successfully');
  },
});

// Schedule nightly backup
scheduler.schedule(backupJob, {
  cron: CronPatterns.at(3, 0), // 3 AM
  timezone: Timezones.NEW_YORK,
  payload: { database: 'production' },
  endDate: new Date('2025-12-31'), // Stop at end of year
});
```

## API Reference

### `defineJob(options)`

Define a type-safe job.

**Parameters:**
- `name` (string): Unique job name
- `handler` (function): Job handler function
- `attempts` (number): Max retry attempts (default: 3)
- `backoff` (object): Retry backoff strategy
- `priority` (number): Job priority (default: 0)
- `timeout` (number): Job timeout in milliseconds
- `concurrency` (number): Max concurrent executions
- `middleware` (array): Middleware functions
- `onBefore`, `onComplete`, `onFail`, `onProgress`, `onFinally`: Lifecycle hooks

### `createQueue(options)`

Create a job queue.

**Parameters:**
- `name` (string): Queue name
- `redis` (object): Redis connection config (optional)
- `concurrency` (number): Worker concurrency (default: 1)
- `defaultJobOptions` (object): Default job options

**Methods:**
- `enqueue(job, payload, options)`: Add job to queue
- `process()`: Start processing jobs
- `stop()`: Stop processing
- `pause()`: Pause queue
- `resume()`: Resume queue
- `getJob(jobId)`: Get job by ID
- `getStats()`: Get queue statistics
- `removeJob(jobId)`: Remove a job
- `retryJob(jobId)`: Retry a failed job
- `clear()`: Clear all jobs

### `Scheduler`

Schedule recurring and one-time jobs.

**Methods:**
- `schedule(job, options)`: Schedule recurring job
- `scheduleOnce(job, payload, date)`: Schedule one-time job
- `start()`: Start scheduler
- `stop()`: Stop scheduler
- `pause(scheduleId)`: Pause a schedule
- `resume(scheduleId)`: Resume a schedule
- `remove(scheduleId)`: Remove a schedule
- `getScheduledJob(scheduleId)`: Get schedule by ID
- `getAllScheduledJobs()`: Get all schedules
- `getJobHistory(scheduleId?)`: Get execution history

### `Monitor`

Monitor jobs and collect metrics.

**Methods:**
- `start()`: Start monitoring
- `stop()`: Stop monitoring
- `getMetrics()`: Get current metrics
- `getMetricsHistory()`: Get metrics history
- `getHealth()`: Get system health
- `getJobDetails(jobId)`: Get job details
- `retryJob(jobId)`: Retry a failed job
- `retryAllFailed()`: Retry all failed jobs
- `exportMetrics()`: Export metrics as JSON
- `generateDashboard()`: Generate HTML dashboard

## Environment Variables

For Redis configuration:

```bash
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=secret
REDIS_DB=0
```

## Best Practices

1. **Use Redis in Production**: In-memory queue is for development only
2. **Set Appropriate Timeouts**: Prevent jobs from hanging indefinitely
3. **Monitor Your Jobs**: Use the monitoring system to track health
4. **Handle Errors Gracefully**: Use lifecycle hooks to log and recover
5. **Use Middleware**: Add validation, logging, and rate limiting
6. **Set Job Priorities**: Process critical jobs first
7. **Clean Up Completed Jobs**: Use `removeOnComplete` to prevent memory issues
8. **Use Exponential Backoff**: For better retry behavior
9. **Track Progress**: Update progress for long-running jobs
10. **Test Locally**: Use in-memory queue for testing

## Testing

```bash
npm test
```

Run with coverage:

```bash
npm test -- --coverage
```

## Examples

See the `examples/` directory for complete examples:

- `basic-usage.ts` - Basic job queue usage
- `scheduling.ts` - Cron scheduling
- `middleware.ts` - Middleware patterns
- `monitoring.ts` - Job monitoring and dashboards
- `redis-backend.ts` - Production Redis setup

<!-- API_SNAPSHOT_START -->
## API Snapshot

This section is generated from the package source. Run `node scripts/generate-package-atlas.mjs` to refresh.

### Entry Points
- Export keys: ., ./queue, ./scheduler, ./monitor, ./job
- Source files: packages/philjs-jobs/src/index.ts, packages/philjs-jobs/src/queue.ts, packages/philjs-jobs/src/scheduler.ts, packages/philjs-jobs/src/monitor.ts, packages/philjs-jobs/src/job.ts

### Public API
- Direct exports: CronPatterns, DefineJobOptions, EnqueueOptions, IQueue, InMemoryQueue, Job, JobContext, JobDefinition, JobDetail, JobHandler, JobHooks, JobMetrics, JobMiddleware, JobOptions, JobRun, MetricsSnapshot, Monitor, MonitorOptions, QueueOptions, QueueStats, RedisQueue, ScheduleOptions, ScheduledJob, Scheduler, SystemHealth, Timezones, composeMiddleware, createLoggingMiddleware, createQueue, createRateLimitMiddleware, createRetryMiddleware, createValidationMiddleware, defineJob
- Re-exported names: CronPatterns, DefineJobOptions, EnqueueOptions, IQueue, InMemoryQueue, Job, JobContext, JobDefinition, JobDetail, JobHandler, JobHooks, JobMetrics, JobMiddleware, JobMonitor, JobOptions, JobRun, JobScheduler, MetricsSnapshot, Monitor, MonitorOptions, QueueOptions, QueueStats, RedisQueue, ScheduleOptions, ScheduledJob, Scheduler, SystemHealth, Timezones, composeMiddleware, createJobQueue, createLoggingMiddleware, createQueue, createRateLimitMiddleware, createRetryMiddleware, createValidationMiddleware, defineJob
- Re-exported modules: ./job.js, ./monitor.js, ./queue.js, ./scheduler.js
<!-- API_SNAPSHOT_END -->

## License

MIT

## Contributing

Contributions are welcome! Please read our contributing guidelines.

## Support

- Documentation: https://philjs.dev/docs/jobs
- Issues: https://github.com/philjs/philjs/issues
- Discord: https://discord.gg/philjs
