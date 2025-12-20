/**
 * @philjs/jobs
 *
 * Background job processing and scheduling for PhilJS.
 */

// Export job definitions
export {
  defineJob,
  createValidationMiddleware,
  createLoggingMiddleware,
  createRateLimitMiddleware,
  createRetryMiddleware,
  composeMiddleware,
  type JobContext,
  type JobOptions,
  type JobHooks,
  type JobHandler,
  type JobMiddleware,
  type JobDefinition,
  type DefineJobOptions,
} from './job.js';

// Export queue
export {
  createQueue,
  InMemoryQueue,
  RedisQueue,
  type QueueOptions,
  type EnqueueOptions,
  type Job,
  type QueueStats,
  type IQueue,
} from './queue.js';

// Export scheduler
export {
  Scheduler,
  CronPatterns,
  Timezones,
  type ScheduleOptions,
  type ScheduledJob,
  type JobRun,
} from './scheduler.js';

// Export monitor
export {
  Monitor,
  type JobMetrics,
  type JobDetail,
  type SystemHealth,
  type MonitorOptions,
  type MetricsSnapshot,
} from './monitor.js';

// Re-export for convenience
export { createQueue as createJobQueue };
export { Scheduler as JobScheduler };
export { Monitor as JobMonitor };
