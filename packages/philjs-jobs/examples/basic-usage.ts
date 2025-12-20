/**
 * Basic Usage Example
 *
 * Demonstrates the fundamental concepts of the PhilJS Jobs system.
 */

import { defineJob, createQueue } from '@philjs/jobs';

// Define a simple email job
const sendEmailJob = defineJob({
  name: 'send-email',
  handler: async (payload: { to: string; subject: string; body: string }, ctx) => {
    ctx.log(`Sending email to ${payload.to}`);

    // Simulate email sending
    await ctx.updateProgress(50);
    await new Promise(resolve => setTimeout(resolve, 1000));

    ctx.log(`Email sent successfully to ${payload.to}`);
    await ctx.updateProgress(100);

    return { sent: true, timestamp: new Date() };
  },
  attempts: 3,
  backoff: { type: 'exponential', delay: 1000 },
  onComplete: (result, ctx) => {
    console.log(`✓ Email job ${ctx.jobId} completed:`, result);
  },
  onFail: (error, ctx) => {
    console.error(`✗ Email job ${ctx.jobId} failed:`, error.message);
  },
});

// Create a queue
const queue = createQueue({ concurrency: 5 });

// Enqueue jobs
async function main() {
  console.log('Starting basic example...\n');

  // Enqueue a job
  const job1 = await queue.enqueue(sendEmailJob, {
    to: 'user@example.com',
    subject: 'Welcome!',
    body: 'Thanks for signing up!',
  });

  console.log(`Enqueued job: ${job1.id}`);

  // Enqueue another job with custom options
  const job2 = await queue.enqueue(
    sendEmailJob,
    {
      to: 'admin@example.com',
      subject: 'Daily Report',
      body: 'Here is your daily report...',
    },
    {
      priority: 10, // Higher priority
      delay: 2000, // Delay by 2 seconds
    }
  );

  console.log(`Enqueued high-priority job: ${job2.id}\n`);

  // Start processing jobs
  console.log('Starting job processing...');
  await queue.process();

  // Wait for jobs to complete
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Get queue statistics
  const stats = await queue.getStats();
  console.log('\nQueue Statistics:');
  console.log(`- Total: ${stats.total}`);
  console.log(`- Completed: ${stats.completed}`);
  console.log(`- Failed: ${stats.failed}`);
  console.log(`- Active: ${stats.active}`);
  console.log(`- Waiting: ${stats.waiting}`);

  // Stop the queue
  await queue.stop();
  console.log('\nQueue stopped.');
}

main().catch(console.error);
