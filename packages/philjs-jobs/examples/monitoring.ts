/**
 * Job Monitoring Example
 *
 * Demonstrates job monitoring, metrics collection, and health checks.
 */

import {
  defineJob,
  createQueue,
  Scheduler,
  Monitor,
  CronPatterns,
} from '@philjs/jobs';
import { writeFileSync } from 'fs';

// Define various jobs for monitoring
const fastJob = defineJob({
  name: 'fast-job',
  handler: async (payload: any, ctx) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return { processed: true };
  },
});

const slowJob = defineJob({
  name: 'slow-job',
  handler: async (payload: any, ctx) => {
    await ctx.updateProgress(25);
    await new Promise(resolve => setTimeout(resolve, 2000));
    await ctx.updateProgress(50);
    await new Promise(resolve => setTimeout(resolve, 2000));
    await ctx.updateProgress(75);
    await new Promise(resolve => setTimeout(resolve, 2000));
    await ctx.updateProgress(100);
    return { processed: true };
  },
  onProgress: (progress, ctx) => {
    console.log(`[${ctx.jobId}] Progress: ${progress}%`);
  },
});

const failingJob = defineJob({
  name: 'failing-job',
  handler: async () => {
    // Randomly fail
    if (Math.random() > 0.7) {
      throw new Error('Random failure occurred');
    }
    return { success: true };
  },
  attempts: 2,
  backoff: { type: 'fixed', delay: 500 },
  removeOnFail: false,
});

const imageProcessingJob = defineJob({
  name: 'image-processing',
  handler: async (payload: { imageUrl: string }, ctx) => {
    ctx.log(`Processing image: ${payload.imageUrl}`);

    await ctx.updateProgress(20);
    await new Promise(resolve => setTimeout(resolve, 500));

    ctx.log('Resizing...');
    await ctx.updateProgress(40);
    await new Promise(resolve => setTimeout(resolve, 500));

    ctx.log('Optimizing...');
    await ctx.updateProgress(60);
    await new Promise(resolve => setTimeout(resolve, 500));

    ctx.log('Uploading...');
    await ctx.updateProgress(80);
    await new Promise(resolve => setTimeout(resolve, 500));

    await ctx.updateProgress(100);

    return {
      originalUrl: payload.imageUrl,
      processedUrl: '/images/processed.jpg',
      sizeBefore: '2.5 MB',
      sizeAfter: '512 KB',
    };
  },
});

async function main() {
  console.log('Starting monitoring example...\n');

  // Create queue with monitoring
  const queue = createQueue({ concurrency: 5 });
  const scheduler = new Scheduler(queue);
  const monitor = new Monitor(queue, scheduler, {
    metricsInterval: 5000, // Collect metrics every 5 seconds
    healthCheckInterval: 3000, // Check health every 3 seconds
    healthThresholds: {
      queueDepthWarning: 50,
      queueDepthCritical: 100,
      errorRateWarning: 0.1,
      errorRateCritical: 0.25,
    },
  });

  // Start monitoring
  monitor.start();
  console.log('✓ Monitoring started\n');

  // Schedule a recurring job
  scheduler.schedule(fastJob, {
    cron: CronPatterns.EVERY_MINUTE,
    payload: {},
  });

  console.log('✓ Scheduled recurring fast job\n');

  // Start queue and scheduler
  scheduler.start();
  await queue.process();

  // Enqueue various jobs
  console.log('--- Enqueueing Jobs ---\n');

  // Fast jobs
  for (let i = 0; i < 10; i++) {
    await queue.enqueue(fastJob, { id: i });
  }
  console.log('✓ Enqueued 10 fast jobs');

  // Slow jobs
  for (let i = 0; i < 3; i++) {
    await queue.enqueue(slowJob, { id: i });
  }
  console.log('✓ Enqueued 3 slow jobs');

  // Failing jobs
  for (let i = 0; i < 20; i++) {
    await queue.enqueue(failingJob, { id: i });
  }
  console.log('✓ Enqueued 20 potentially failing jobs');

  // Image processing jobs
  for (let i = 0; i < 5; i++) {
    await queue.enqueue(imageProcessingJob, {
      imageUrl: `https://example.com/image${i}.jpg`,
    });
  }
  console.log('✓ Enqueued 5 image processing jobs\n');

  // Monitor metrics periodically
  const metricsInterval = setInterval(async () => {
    console.log('\n=== Current Metrics ===');

    const metrics = await monitor.getMetrics();
    console.log(`Total Jobs: ${metrics.totalJobs}`);
    console.log(`Completed: ${metrics.completedJobs} (${(metrics.successRate * 100).toFixed(1)}%)`);
    console.log(`Failed: ${metrics.failedJobs} (${(metrics.failureRate * 100).toFixed(1)}%)`);
    console.log(`Active: ${metrics.activeJobs}`);
    console.log(`Waiting: ${metrics.waitingJobs}`);
    console.log(`Delayed: ${metrics.delayedJobs}`);
    console.log(`Avg Processing Time: ${metrics.averageProcessingTime.toFixed(0)}ms`);
    console.log(`Throughput: ${metrics.throughput.toFixed(2)} jobs/min`);

    const health = await monitor.getHealth();
    console.log(`\nSystem Health: ${health.status.toUpperCase()}`);
    console.log(`Queue Depth: ${health.queueDepth}`);
    console.log(`Processing Rate: ${health.processingRate.toFixed(2)} jobs/min`);
    console.log(`Error Rate: ${(health.errorRate * 100).toFixed(1)}%`);

    if (health.issues.length > 0) {
      console.log('\n⚠️  Issues:');
      health.issues.forEach(issue => console.log(`  - ${issue}`));
    }

    console.log('=====================\n');
  }, 10000);

  // Monitor scheduled jobs
  const scheduleInterval = setInterval(() => {
    const scheduled = monitor.getScheduledJobsOverview();
    if (scheduled && scheduled.length > 0) {
      console.log('\n--- Scheduled Jobs ---');
      scheduled.forEach(job => {
        console.log(`${job.jobName}: ${job.runsCount} runs, next: ${job.nextRun?.toLocaleString() || 'N/A'}`);
      });
      console.log('---------------------\n');
    }
  }, 15000);

  // Wait for jobs to process
  await new Promise(resolve => setTimeout(resolve, 30000));

  // Export metrics
  console.log('\n--- Exporting Metrics ---');
  const metricsJson = await monitor.exportMetrics();
  writeFileSync('job-metrics.json', metricsJson);
  console.log('✓ Metrics exported to job-metrics.json');

  // Generate HTML dashboard
  const dashboard = await monitor.generateDashboard();
  writeFileSync('job-dashboard.html', dashboard);
  console.log('✓ Dashboard generated: job-dashboard.html');

  // Get detailed job information
  console.log('\n--- Job Details ---');
  const stats = await queue.getStats();
  if (stats.total > 0) {
    // This is simplified - in real use you'd track job IDs
    console.log(`Total jobs processed: ${stats.total}`);
  }

  // Show metrics history
  const history = monitor.getMetricsHistory();
  console.log(`\nMetrics snapshots collected: ${history.length}`);

  if (history.length > 0) {
    const latest = history[history.length - 1];
    console.log(`Latest snapshot: ${latest.timestamp.toLocaleString()}`);
  }

  // Retry failed jobs
  console.log('\n--- Retrying Failed Jobs ---');
  const retriedCount = await monitor.retryAllFailed();
  console.log(`Retried ${retriedCount} failed jobs`);

  // Wait a bit more for retries
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Final statistics
  console.log('\n=== Final Statistics ===');
  const finalMetrics = await monitor.getMetrics();
  console.log(`Total Jobs: ${finalMetrics.totalJobs}`);
  console.log(`Completed: ${finalMetrics.completedJobs}`);
  console.log(`Failed: ${finalMetrics.failedJobs}`);
  console.log(`Success Rate: ${(finalMetrics.successRate * 100).toFixed(1)}%`);

  const finalHealth = await monitor.getHealth();
  console.log(`\nFinal Health Status: ${finalHealth.status.toUpperCase()}`);
  console.log('========================\n');

  // Cleanup
  clearInterval(metricsInterval);
  clearInterval(scheduleInterval);

  console.log('Stopping monitor, scheduler, and queue...');
  monitor.stop();
  scheduler.stop();
  await queue.stop();

  console.log('✓ All systems stopped');
  console.log('\nOpen job-dashboard.html in your browser to view the dashboard!');
}

main().catch(console.error);
