/**
 * Redis Backend Example
 *
 * Demonstrates using Redis/BullMQ for production-grade job processing.
 */

import { defineJob, createQueue, Monitor } from '@philjs/jobs';

// Define jobs
const videoTranscodingJob = defineJob({
  name: 'video-transcoding',
  handler: async (
    payload: {
      videoId: string;
      inputFormat: string;
      outputFormat: string;
    },
    ctx
  ) => {
    ctx.log(`Starting transcoding: ${payload.videoId}`);
    ctx.log(`Converting from ${payload.inputFormat} to ${payload.outputFormat}`);

    // Simulate transcoding stages
    await ctx.updateProgress(10);
    await new Promise(resolve => setTimeout(resolve, 1000));

    ctx.log('Analyzing video...');
    await ctx.updateProgress(30);
    await new Promise(resolve => setTimeout(resolve, 2000));

    ctx.log('Transcoding video...');
    await ctx.updateProgress(60);
    await new Promise(resolve => setTimeout(resolve, 3000));

    ctx.log('Transcoding audio...');
    await ctx.updateProgress(80);
    await new Promise(resolve => setTimeout(resolve, 1000));

    ctx.log('Finalizing...');
    await ctx.updateProgress(100);

    return {
      videoId: payload.videoId,
      outputUrl: `/videos/${payload.videoId}.${payload.outputFormat}`,
      duration: '5m 23s',
      size: '142 MB',
    };
  },
  attempts: 3,
  backoff: { type: 'exponential', delay: 5000 },
  timeout: 300000, // 5 minutes
  priority: 5,
  onComplete: (result, ctx) => {
    console.log(`✓ Video ${result.videoId} transcoded successfully`);
    console.log(`  Output: ${result.outputUrl}`);
  },
  onFail: (error, ctx) => {
    console.error(`✗ Transcoding failed for job ${ctx.jobId}:`, error.message);
  },
  onProgress: (progress, ctx) => {
    console.log(`[${ctx.jobId}] Transcoding progress: ${progress}%`);
  },
});

const emailCampaignJob = defineJob({
  name: 'email-campaign',
  handler: async (
    payload: {
      campaignId: string;
      recipients: string[];
      template: string;
    },
    ctx
  ) => {
    ctx.log(`Sending campaign ${payload.campaignId} to ${payload.recipients.length} recipients`);

    const sent = [];
    const failed = [];

    for (let i = 0; i < payload.recipients.length; i++) {
      try {
        // Simulate email sending
        await new Promise(resolve => setTimeout(resolve, 100));
        sent.push(payload.recipients[i]);

        const progress = ((i + 1) / payload.recipients.length) * 100;
        await ctx.updateProgress(progress);
      } catch (error) {
        failed.push(payload.recipients[i]);
      }
    }

    return {
      campaignId: payload.campaignId,
      sent: sent.length,
      failed: failed.length,
      total: payload.recipients.length,
    };
  },
  attempts: 2,
  removeOnComplete: 100, // Keep last 100 completed jobs
  removeOnFail: false, // Keep failed jobs for analysis
});

async function main() {
  console.log('Starting Redis backend example...\n');

  // Create queue with Redis backend
  // NOTE: This requires Redis to be running and BullMQ/ioredis to be installed
  const queue = createQueue({
    name: 'philjs-production-queue',
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
    },
    concurrency: 10,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: 50,
      removeOnFail: false,
    },
  });

  // Create monitor
  const monitor = new Monitor(queue);
  monitor.start();

  console.log('✓ Connected to Redis');
  console.log('✓ Queue and monitor initialized\n');

  // Enqueue video transcoding jobs
  console.log('--- Enqueueing Video Transcoding Jobs ---');
  const videoJobs = [
    { videoId: 'vid_001', inputFormat: 'mov', outputFormat: 'mp4' },
    { videoId: 'vid_002', inputFormat: 'avi', outputFormat: 'webm' },
    { videoId: 'vid_003', inputFormat: 'mkv', outputFormat: 'mp4' },
  ];

  for (const video of videoJobs) {
    const job = await queue.enqueue(
      videoTranscodingJob,
      video,
      {
        priority: 10, // High priority
      }
    );
    console.log(`✓ Enqueued video transcoding: ${job.id}`);
  }

  // Enqueue email campaign jobs
  console.log('\n--- Enqueueing Email Campaign Jobs ---');
  const campaignJobs = [
    {
      campaignId: 'camp_001',
      recipients: Array.from({ length: 100 }, (_, i) => `user${i}@example.com`),
      template: 'newsletter',
    },
    {
      campaignId: 'camp_002',
      recipients: Array.from({ length: 50 }, (_, i) => `subscriber${i}@example.com`),
      template: 'promotion',
    },
  ];

  for (const campaign of campaignJobs) {
    const job = await queue.enqueue(
      emailCampaignJob,
      campaign,
      {
        priority: 5, // Medium priority
      }
    );
    console.log(`✓ Enqueued email campaign: ${job.id}`);
  }

  // Start processing
  console.log('\n--- Starting Job Processing ---\n');
  await queue.process();

  // Monitor progress
  const monitorInterval = setInterval(async () => {
    const metrics = await monitor.getMetrics();
    const health = await monitor.getHealth();

    console.log('\n=== Queue Status ===');
    console.log(`Health: ${health.status.toUpperCase()}`);
    console.log(`Queue Depth: ${health.queueDepth}`);
    console.log(`Active: ${metrics.activeJobs}`);
    console.log(`Completed: ${metrics.completedJobs}`);
    console.log(`Failed: ${metrics.failedJobs}`);
    console.log(`Throughput: ${metrics.throughput.toFixed(2)} jobs/min`);
    console.log('==================\n');
  }, 10000);

  // Wait for jobs to complete
  console.log('Processing jobs... (this may take a while)\n');
  await new Promise(resolve => setTimeout(resolve, 60000));

  // Get final statistics
  console.log('\n=== Final Statistics ===');
  const finalMetrics = await monitor.getMetrics();
  console.log(`Total Jobs: ${finalMetrics.totalJobs}`);
  console.log(`Completed: ${finalMetrics.completedJobs}`);
  console.log(`Failed: ${finalMetrics.failedJobs}`);
  console.log(`Success Rate: ${(finalMetrics.successRate * 100).toFixed(1)}%`);
  console.log(`Avg Processing Time: ${finalMetrics.averageProcessingTime.toFixed(0)}ms`);
  console.log('=======================\n');

  // Cleanup
  clearInterval(monitorInterval);
  monitor.stop();
  await queue.stop();

  console.log('✓ Queue stopped and disconnected from Redis');
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
  process.exit(1);
});

main().catch((error) => {
  if (error.message.includes('BullMQ is not installed')) {
    console.error('\n❌ Redis backend requires BullMQ and ioredis');
    console.error('Install with: npm install bullmq ioredis\n');
  } else if (error.message.includes('ECONNREFUSED')) {
    console.error('\n❌ Could not connect to Redis');
    console.error('Make sure Redis is running on localhost:6379');
    console.error('Or set REDIS_HOST and REDIS_PORT environment variables\n');
  } else {
    console.error('Error:', error);
  }
  process.exit(1);
});
