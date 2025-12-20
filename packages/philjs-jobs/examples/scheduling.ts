/**
 * Job Scheduling Example
 *
 * Demonstrates cron-based job scheduling with timezone support.
 */

import { defineJob, createQueue, Scheduler, CronPatterns, Timezones } from '@philjs/jobs';

// Define a backup job
const backupJob = defineJob({
  name: 'database-backup',
  handler: async (payload: { database: string }, ctx) => {
    ctx.log(`Starting backup for database: ${payload.database}`);

    await ctx.updateProgress(25);
    await new Promise(resolve => setTimeout(resolve, 1000));

    ctx.log('Creating snapshot...');
    await ctx.updateProgress(50);
    await new Promise(resolve => setTimeout(resolve, 1000));

    ctx.log('Compressing data...');
    await ctx.updateProgress(75);
    await new Promise(resolve => setTimeout(resolve, 1000));

    ctx.log('Upload to storage...');
    await ctx.updateProgress(100);

    return {
      database: payload.database,
      size: '125 MB',
      timestamp: new Date(),
    };
  },
  onComplete: (result, ctx) => {
    console.log(`✓ Backup completed for ${result.database}`);
  },
});

// Define a cleanup job
const cleanupJob = defineJob({
  name: 'cleanup-temp-files',
  handler: async (payload: { olderThan: number }, ctx) => {
    ctx.log(`Cleaning up files older than ${payload.olderThan} days`);

    // Simulate cleanup
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      filesDeleted: 42,
      spaceSaved: '2.3 GB',
    };
  },
  onComplete: (result) => {
    console.log(`✓ Cleanup: ${result.filesDeleted} files deleted, ${result.spaceSaved} saved`);
  },
});

// Define a report job
const generateReportJob = defineJob({
  name: 'generate-report',
  handler: async (payload: { reportType: string }, ctx) => {
    ctx.log(`Generating ${payload.reportType} report`);

    await new Promise(resolve => setTimeout(resolve, 800));

    return {
      reportType: payload.reportType,
      generatedAt: new Date(),
      url: '/reports/latest.pdf',
    };
  },
});

async function main() {
  console.log('Starting scheduling example...\n');

  const queue = createQueue({ concurrency: 3 });
  const scheduler = new Scheduler(queue);

  // Schedule daily backup at 2 AM
  const backupSchedule = scheduler.schedule(backupJob, {
    cron: CronPatterns.at(2, 0), // 2:00 AM
    timezone: Timezones.UTC,
    payload: { database: 'production' },
    onSchedule: (scheduledAt) => {
      console.log(`📅 Backup scheduled to run at: ${scheduledAt.toLocaleString()}`);
    },
  });

  console.log(`✓ Scheduled daily backup (ID: ${backupSchedule})`);

  // Schedule cleanup every week on Sunday
  const cleanupSchedule = scheduler.schedule(cleanupJob, {
    cron: CronPatterns.WEEKLY,
    payload: { olderThan: 30 },
    onSchedule: (scheduledAt) => {
      console.log(`📅 Cleanup scheduled to run at: ${scheduledAt.toLocaleString()}`);
    },
  });

  console.log(`✓ Scheduled weekly cleanup (ID: ${cleanupSchedule})`);

  // Schedule report generation every 15 minutes
  const reportSchedule = scheduler.schedule(generateReportJob, {
    cron: CronPatterns.EVERY_15_MINUTES,
    payload: { reportType: 'analytics' },
    maxRuns: 5, // Only run 5 times
    onSchedule: (scheduledAt) => {
      console.log(`📅 Report scheduled to run at: ${scheduledAt.toLocaleString()}`);
    },
    onComplete: () => {
      console.log('✓ Report generation schedule completed (max runs reached)');
    },
  });

  console.log(`✓ Scheduled report generation (ID: ${reportSchedule})\n`);

  // Schedule a one-time job
  const oneTimeSchedule = scheduler.scheduleOnce(
    generateReportJob,
    { reportType: 'monthly' },
    new Date(Date.now() + 5000) // 5 seconds from now
  );

  console.log(`✓ Scheduled one-time report (ID: ${oneTimeSchedule})\n`);

  // Start the scheduler and queue
  scheduler.start();
  await queue.process();

  console.log('Scheduler started. Monitoring scheduled jobs...\n');

  // Monitor for a while
  setInterval(() => {
    const jobs = scheduler.getAllScheduledJobs();
    console.log('\n--- Scheduled Jobs Status ---');
    jobs.forEach(job => {
      console.log(`${job.jobName}:`);
      console.log(`  Status: ${job.active ? 'Active' : 'Inactive'}`);
      console.log(`  Runs: ${job.runsCount}${job.maxRuns ? ` / ${job.maxRuns}` : ''}`);
      console.log(`  Next run: ${job.nextRun ? job.nextRun.toLocaleString() : 'N/A'}`);
    });
    console.log('----------------------------\n');
  }, 10000);

  // Run for 60 seconds then stop
  await new Promise(resolve => setTimeout(resolve, 60000));

  console.log('\nStopping scheduler and queue...');
  scheduler.stop();
  await queue.stop();

  // Show final history
  const history = scheduler.getJobHistory();
  console.log(`\nTotal job runs in history: ${history.length}`);
}

main().catch(console.error);
