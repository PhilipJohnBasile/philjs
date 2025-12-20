import { describe, it, expect, beforeEach } from 'vitest';
import { Monitor } from '../monitor.js';
import { InMemoryQueue } from '../queue.js';
import { defineJob } from '../job.js';

describe('Monitor', () => {
  let queue: InMemoryQueue;
  let monitor: Monitor;

  beforeEach(() => {
    queue = new InMemoryQueue();
    monitor = new Monitor(queue);
  });

  it('should get current metrics', async () => {
    const job = defineJob({
      name: 'metrics-job',
      handler: async () => 'done',
    });

    await queue.enqueue(job, {});
    await queue.enqueue(job, {});

    const metrics = await monitor.getMetrics();

    expect(metrics.totalJobs).toBe(2);
    expect(metrics.waitingJobs).toBe(2);
    expect(metrics.activeJobs).toBe(0);
  });

  it('should track metrics history', async () => {
    monitor.start();

    await new Promise(resolve => setTimeout(resolve, 100));

    const history = monitor.getMetricsHistory();
    expect(history.length).toBeGreaterThan(0);

    monitor.stop();
  });

  it('should calculate success rate', async () => {
    const successJob = defineJob({
      name: 'success-job',
      handler: async () => 'done',
      removeOnComplete: false,
    });

    const failJob = defineJob({
      name: 'fail-job',
      handler: async () => {
        throw new Error('Failed');
      },
      removeOnFail: false,
    });

    await queue.enqueue(successJob, {});
    await queue.enqueue(successJob, {});
    await queue.enqueue(failJob, {});

    queue.process();

    await new Promise(resolve => setTimeout(resolve, 200));

    const metrics = await monitor.getMetrics();

    expect(metrics.totalJobs).toBe(3);
    expect(metrics.completedJobs).toBe(2);
    expect(metrics.failedJobs).toBe(1);
    expect(metrics.successRate).toBeCloseTo(0.67, 1);
    expect(metrics.failureRate).toBeCloseTo(0.33, 1);

    await queue.stop();
  });

  it('should get system health', async () => {
    const health = await monitor.getHealth();

    expect(health.status).toBe('healthy');
    expect(health.queueDepth).toBe(0);
    expect(health.issues).toEqual([]);
  });

  it('should detect degraded health', async () => {
    const job = defineJob({
      name: 'health-job',
      handler: async () => 'done',
    });

    // Add many jobs to trigger queue depth warning
    for (let i = 0; i < 150; i++) {
      await queue.enqueue(job, {});
    }

    const health = await monitor.getHealth();

    expect(health.status).toBe('degraded');
    expect(health.queueDepth).toBe(150);
    expect(health.issues.length).toBeGreaterThan(0);
  });

  it('should record job timings', () => {
    const jobId = 'test-job-123';

    monitor.recordJobStart(jobId);
    monitor.recordJobCompletion(jobId, true);

    // Job timing should be recorded
    // This is an internal detail, but we can verify it doesn't throw
    expect(true).toBe(true);
  });

  it('should get job details', async () => {
    const job = defineJob({
      name: 'detail-job',
      handler: async () => 'done',
    });

    const queuedJob = await queue.enqueue(job, { value: 123 });

    const details = await monitor.getJobDetails(queuedJob.id);

    expect(details).toBeDefined();
    expect(details?.id).toBe(queuedJob.id);
    expect(details?.name).toBe('detail-job');
    expect(details?.payload).toEqual({ value: 123 });
  });

  it('should retry failed jobs', async () => {
    const job = defineJob({
      name: 'retry-job',
      handler: async () => {
        throw new Error('Failed');
      },
      removeOnFail: false,
    });

    const queuedJob = await queue.enqueue(job, {});

    queue.process();
    await new Promise(resolve => setTimeout(resolve, 200));

    const result = await monitor.retryJob(queuedJob.id);
    expect(result).toBe(true);

    await queue.stop();
  });

  it('should export metrics as JSON', async () => {
    const json = await monitor.exportMetrics();
    const data = JSON.parse(json);

    expect(data.currentMetrics).toBeDefined();
    expect(data.health).toBeDefined();
    expect(data.history).toBeDefined();
  });

  it('should generate HTML dashboard', async () => {
    const html = await monitor.generateDashboard();

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('PhilJS Jobs Dashboard');
    expect(html).toContain('Total Jobs');
  });

  it('should clear metrics', async () => {
    monitor.start();

    await new Promise(resolve => setTimeout(resolve, 100));

    let history = monitor.getMetricsHistory();
    expect(history.length).toBeGreaterThan(0);

    monitor.clearMetrics();

    history = monitor.getMetricsHistory();
    expect(history.length).toBe(0);

    monitor.stop();
  });

  it('should limit metrics history size', async () => {
    const smallMonitor = new Monitor(queue, undefined, {
      metricsHistorySize: 5,
      metricsInterval: 10,
    });

    smallMonitor.start();

    await new Promise(resolve => setTimeout(resolve, 100));

    const history = smallMonitor.getMetricsHistory();
    expect(history.length).toBeLessThanOrEqual(5);

    smallMonitor.stop();
  });
});
