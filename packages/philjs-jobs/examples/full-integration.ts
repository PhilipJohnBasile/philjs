/**
 * Full Integration Example
 *
 * Complete example showing all features working together.
 */

import {
  defineJob,
  createQueue,
  Scheduler,
  Monitor,
  CronPatterns,
  Timezones,
  createValidationMiddleware,
  createLoggingMiddleware,
  type JobContext,
} from '@philjs/jobs';

// ============================================================================
// Job Definitions
// ============================================================================

// User registration job
const registerUserJob = defineJob({
  name: 'register-user',
  handler: async (
    payload: {
      email: string;
      name: string;
      plan: 'free' | 'pro';
    },
    ctx
  ) => {
    ctx.log(`Registering user: ${payload.email}`);

    // Create user account
    await ctx.updateProgress(25);
    await new Promise(resolve => setTimeout(resolve, 500));

    // Send welcome email
    await ctx.updateProgress(50);
    await new Promise(resolve => setTimeout(resolve, 500));

    // Setup default settings
    await ctx.updateProgress(75);
    await new Promise(resolve => setTimeout(resolve, 500));

    // Complete
    await ctx.updateProgress(100);

    return {
      userId: `user_${Date.now()}`,
      email: payload.email,
      plan: payload.plan,
    };
  },
  middleware: [
    createValidationMiddleware(
      (p: any) => p.email && p.name && ['free', 'pro'].includes(p.plan),
      'Invalid user registration data'
    ),
    createLoggingMiddleware(),
  ],
  attempts: 3,
  priority: 10,
  onComplete: (result, ctx) => {
    console.log(`✓ User registered: ${result.email} (${result.userId})`);
  },
});

// Payment processing job
const processPaymentJob = defineJob({
  name: 'process-payment',
  handler: async (
    payload: {
      userId: string;
      amount: number;
      currency: string;
    },
    ctx
  ) => {
    ctx.log(`Processing payment: ${payload.amount} ${payload.currency}`);

    // Validate payment
    await ctx.updateProgress(20);
    await new Promise(resolve => setTimeout(resolve, 300));

    // Process with payment gateway
    await ctx.updateProgress(60);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update user account
    await ctx.updateProgress(90);
    await new Promise(resolve => setTimeout(resolve, 300));

    await ctx.updateProgress(100);

    return {
      transactionId: `txn_${Date.now()}`,
      amount: payload.amount,
      currency: payload.currency,
      status: 'completed',
    };
  },
  attempts: 5,
  backoff: { type: 'exponential', delay: 2000 },
  priority: 15, // High priority
  timeout: 30000,
  onFail: (error, ctx) => {
    console.error(`✗ Payment failed for job ${ctx.jobId}:`, error.message);
    // Could send alert to admin here
  },
});

// Daily analytics job
const generateAnalyticsJob = defineJob({
  name: 'generate-analytics',
  handler: async (payload: { date: string }, ctx) => {
    ctx.log(`Generating analytics for ${payload.date}`);

    // Collect data
    await ctx.updateProgress(20);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Process data
    await ctx.updateProgress(50);
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate reports
    await ctx.updateProgress(80);
    await new Promise(resolve => setTimeout(resolve, 1000));

    await ctx.updateProgress(100);

    return {
      date: payload.date,
      users: Math.floor(Math.random() * 1000),
      revenue: Math.floor(Math.random() * 50000),
      conversions: Math.floor(Math.random() * 100),
    };
  },
});

// Database backup job
const backupDatabaseJob = defineJob({
  name: 'backup-database',
  handler: async (payload: { database: string }, ctx) => {
    ctx.log(`Starting backup: ${payload.database}`);

    // Create snapshot
    await ctx.updateProgress(30);
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Compress
    await ctx.updateProgress(60);
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Upload to cloud storage
    await ctx.updateProgress(90);
    await new Promise(resolve => setTimeout(resolve, 1000));

    await ctx.updateProgress(100);

    return {
      database: payload.database,
      size: `${Math.floor(Math.random() * 500)}MB`,
      url: `/backups/${payload.database}-${Date.now()}.sql.gz`,
    };
  },
  timeout: 300000, // 5 minutes
});

// Cleanup old data job
const cleanupDataJob = defineJob({
  name: 'cleanup-data',
  handler: async (payload: { olderThan: number }, ctx) => {
    ctx.log(`Cleaning up data older than ${payload.olderThan} days`);

    await new Promise(resolve => setTimeout(resolve, 1000));

    const filesDeleted = Math.floor(Math.random() * 100);
    const spaceSaved = Math.floor(Math.random() * 5);

    return {
      filesDeleted,
      spaceSaved: `${spaceSaved}GB`,
    };
  },
});

// ============================================================================
// Main Application
// ============================================================================

async function main() {
  console.log('\n========================================');
  console.log('PhilJS Jobs - Full Integration Example');
  console.log('========================================\n');

  // -------------------------------------------------------------------------
  // 1. Setup Queue, Scheduler, and Monitor
  // -------------------------------------------------------------------------

  console.log('--- Initializing Systems ---\n');

  const queue = createQueue({
    name: 'app-queue',
    concurrency: 5,
  });

  const scheduler = new Scheduler(queue);
  const monitor = new Monitor(queue, scheduler, {
    metricsInterval: 10000,
    healthCheckInterval: 5000,
  });

  console.log('✓ Queue initialized');
  console.log('✓ Scheduler initialized');
  console.log('✓ Monitor initialized\n');

  // -------------------------------------------------------------------------
  // 2. Schedule Recurring Jobs
  // -------------------------------------------------------------------------

  console.log('--- Scheduling Recurring Jobs ---\n');

  // Daily analytics at 1 AM
  scheduler.schedule(generateAnalyticsJob, {
    cron: CronPatterns.at(1, 0),
    timezone: Timezones.UTC,
    payload: { date: new Date().toISOString().split('T')[0] },
    onSchedule: (scheduledAt) => {
      console.log(`📊 Analytics scheduled for: ${scheduledAt.toLocaleString()}`);
    },
  });

  console.log('✓ Scheduled daily analytics generation');

  // Weekly database backup on Sunday at 3 AM
  scheduler.schedule(backupDatabaseJob, {
    cron: CronPatterns.weekday(0, 3, 0),
    timezone: Timezones.UTC,
    payload: { database: 'production' },
    onSchedule: (scheduledAt) => {
      console.log(`💾 Backup scheduled for: ${scheduledAt.toLocaleString()}`);
    },
  });

  console.log('✓ Scheduled weekly database backup');

  // Monthly cleanup on 1st day at 4 AM
  scheduler.schedule(cleanupDataJob, {
    cron: CronPatterns.MONTHLY,
    timezone: Timezones.UTC,
    payload: { olderThan: 90 },
    onComplete: () => {
      console.log('✓ Monthly cleanup completed');
    },
  });

  console.log('✓ Scheduled monthly cleanup\n');

  // -------------------------------------------------------------------------
  // 3. Start Systems
  // -------------------------------------------------------------------------

  console.log('--- Starting Systems ---\n');

  monitor.start();
  scheduler.start();
  await queue.process();

  console.log('✓ All systems running\n');

  // -------------------------------------------------------------------------
  // 4. Enqueue On-Demand Jobs
  // -------------------------------------------------------------------------

  console.log('--- Enqueueing On-Demand Jobs ---\n');

  // Register new users
  const users = [
    { email: 'alice@example.com', name: 'Alice', plan: 'pro' as const },
    { email: 'bob@example.com', name: 'Bob', plan: 'free' as const },
    { email: 'charlie@example.com', name: 'Charlie', plan: 'pro' as const },
  ];

  for (const user of users) {
    await queue.enqueue(registerUserJob, user);
  }

  console.log(`✓ Enqueued ${users.length} user registrations`);

  // Process payments
  const payments = [
    { userId: 'user_001', amount: 99.99, currency: 'USD' },
    { userId: 'user_002', amount: 149.99, currency: 'USD' },
  ];

  for (const payment of payments) {
    await queue.enqueue(processPaymentJob, payment, {
      priority: 20, // Very high priority
    });
  }

  console.log(`✓ Enqueued ${payments.length} payments`);

  // Schedule immediate backup
  scheduler.scheduleOnce(
    backupDatabaseJob,
    { database: 'staging' },
    new Date(Date.now() + 2000)
  );

  console.log('✓ Scheduled immediate staging backup\n');

  // -------------------------------------------------------------------------
  // 5. Monitor Jobs in Real-Time
  // -------------------------------------------------------------------------

  console.log('--- Monitoring Jobs ---\n');

  let iterations = 0;
  const maxIterations = 6; // Monitor for ~60 seconds

  const monitoringInterval = setInterval(async () => {
    iterations++;

    console.log('\n=== System Status ===');
    console.log(`Time: ${new Date().toLocaleTimeString()}\n`);

    // Queue stats
    const stats = await queue.getStats();
    console.log('Queue:');
    console.log(`  Waiting: ${stats.waiting}`);
    console.log(`  Active: ${stats.active}`);
    console.log(`  Completed: ${stats.completed}`);
    console.log(`  Failed: ${stats.failed}`);

    // Metrics
    const metrics = await monitor.getMetrics();
    console.log('\nMetrics:');
    console.log(`  Total Jobs: ${metrics.totalJobs}`);
    console.log(`  Success Rate: ${(metrics.successRate * 100).toFixed(1)}%`);
    console.log(`  Throughput: ${metrics.throughput.toFixed(2)} jobs/min`);
    console.log(`  Avg Processing Time: ${metrics.averageProcessingTime.toFixed(0)}ms`);

    // Health
    const health = await monitor.getHealth();
    console.log('\nHealth:');
    console.log(`  Status: ${health.status.toUpperCase()}`);
    console.log(`  Queue Depth: ${health.queueDepth}`);
    console.log(`  Error Rate: ${(health.errorRate * 100).toFixed(1)}%`);

    if (health.issues.length > 0) {
      console.log('\n  Issues:');
      health.issues.forEach(issue => console.log(`    - ${issue}`));
    }

    // Scheduled jobs
    const scheduledJobs = scheduler.getAllScheduledJobs();
    console.log('\nScheduled Jobs:');
    scheduledJobs.forEach(job => {
      console.log(`  ${job.jobName}: ${job.runsCount} runs`);
    });

    console.log('\n====================');

    if (iterations >= maxIterations) {
      clearInterval(monitoringInterval);
    }
  }, 10000);

  // -------------------------------------------------------------------------
  // 6. Wait and Generate Reports
  // -------------------------------------------------------------------------

  // Wait for monitoring to complete
  await new Promise(resolve => setTimeout(resolve, maxIterations * 10000 + 1000));

  console.log('\n--- Generating Final Report ---\n');

  // Export metrics
  const metricsJson = await monitor.exportMetrics();
  console.log('✓ Metrics exported (JSON)');

  // Generate dashboard
  const dashboard = await monitor.generateDashboard();
  console.log('✓ Dashboard generated (HTML)');

  // Final statistics
  const finalStats = await queue.getStats();
  const finalMetrics = await monitor.getMetrics();

  console.log('\n=== Final Summary ===');
  console.log(`Total Jobs Processed: ${finalStats.total}`);
  console.log(`Successful: ${finalStats.completed}`);
  console.log(`Failed: ${finalStats.failed}`);
  console.log(`Success Rate: ${(finalMetrics.successRate * 100).toFixed(1)}%`);
  console.log(`Average Processing Time: ${finalMetrics.averageProcessingTime.toFixed(0)}ms`);
  console.log('====================\n');

  // -------------------------------------------------------------------------
  // 7. Cleanup
  // -------------------------------------------------------------------------

  console.log('--- Shutting Down ---\n');

  monitor.stop();
  scheduler.stop();
  await queue.stop();

  console.log('✓ Monitor stopped');
  console.log('✓ Scheduler stopped');
  console.log('✓ Queue stopped');

  console.log('\n========================================');
  console.log('Example completed successfully!');
  console.log('========================================\n');
}

// Run the example
main().catch((error) => {
  console.error('\n❌ Error:', error);
  process.exit(1);
});
