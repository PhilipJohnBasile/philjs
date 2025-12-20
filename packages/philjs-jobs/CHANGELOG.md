# Changelog

All notable changes to @philjs/jobs will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2024-12-19

### Added

#### Job Queue System
- `defineJob()` factory for type-safe job definitions
- `createQueue()` for creating job queues
- `InMemoryQueue` implementation for development
- `RedisQueue` implementation with BullMQ support
- Job lifecycle hooks (onBefore, onComplete, onFail, onProgress, onFinally)
- Retry logic with exponential and fixed backoff strategies
- Job priority system
- Concurrency control
- Progress tracking with `updateProgress()`
- Job status tracking (waiting, active, completed, failed, delayed)

#### Middleware System
- `createValidationMiddleware()` for payload validation
- `createLoggingMiddleware()` for execution logging
- `createRateLimitMiddleware()` for rate limiting
- `createRetryMiddleware()` for conditional retries
- `composeMiddleware()` for combining multiple middleware
- Full middleware chain support with async/await

#### Job Scheduling
- `Scheduler` class for cron-based scheduling
- Recurring job scheduling with cron expressions
- One-time job scheduling with `scheduleOnce()`
- Timezone support for all scheduled jobs
- Maximum runs limit
- Start/end date constraints
- Job history tracking
- Pause/resume scheduled jobs
- `CronPatterns` helper with common patterns
- `Timezones` helper with common timezone identifiers

#### Job Monitoring
- `Monitor` class for metrics collection
- Real-time job metrics (throughput, success rate, etc.)
- Queue statistics tracking
- System health checks with configurable thresholds
- Job details retrieval
- Failed job retry functionality
- Metrics history with configurable retention
- JSON metrics export
- HTML dashboard generation
- Progress reporting

#### Examples
- Basic usage example
- Scheduling example with cron patterns
- Middleware example with validation and rate limiting
- Monitoring example with metrics and dashboards
- Redis backend example for production
- Full integration example showing all features

#### Documentation
- Comprehensive README with API reference
- Quick start guide
- TypeScript type definitions
- Inline JSDoc comments
- Usage examples for all features

#### Testing
- Comprehensive test suite with Vitest
- Unit tests for job definitions
- Unit tests for queue operations
- Unit tests for scheduler
- Unit tests for monitor
- Mock implementations for testing
- Test coverage configuration

### Features

- **Type Safety**: Full TypeScript support with strict types
- **Flexible Backend**: Switch between in-memory and Redis without code changes
- **Production Ready**: Battle-tested BullMQ integration for Redis
- **Developer Friendly**: In-memory queue for local development
- **Scalable**: Designed for high-throughput production workloads
- **Observable**: Rich monitoring and metrics collection
- **Extensible**: Powerful middleware system for custom logic
- **Reliable**: Automatic retries with configurable backoff
- **Scheduled**: Cron-based scheduling with timezone awareness

### Dependencies

- `cron-parser`: ^4.9.0 (required)
- `bullmq`: ^5.0.0 (optional peer dependency)
- `ioredis`: ^5.0.0 (optional peer dependency)

### Notes

This is the initial release of @philjs/jobs, providing a complete background job processing solution inspired by RedwoodJS's job system but built from the ground up for PhilJS.

The package is designed to work seamlessly with the PhilJS ecosystem while remaining usable as a standalone library.

[2.0.0]: https://github.com/philjs/philjs/releases/tag/jobs-v2.0.0
