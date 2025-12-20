import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Scheduler, CronPatterns } from '../scheduler.js';
import { InMemoryQueue } from '../queue.js';
import { defineJob } from '../job.js';

describe('Scheduler', () => {
  let queue: InMemoryQueue;
  let scheduler: Scheduler;

  beforeEach(() => {
    queue = new InMemoryQueue();
    scheduler = new Scheduler(queue);
  });

  it('should schedule a recurring job', () => {
    const job = defineJob({
      name: 'recurring-job',
      handler: async () => 'done',
    });

    const scheduleId = scheduler.schedule(job, {
      cron: CronPatterns.EVERY_MINUTE,
    });

    expect(scheduleId).toBeDefined();

    const scheduledJob = scheduler.getScheduledJob(scheduleId);
    expect(scheduledJob).toBeDefined();
    expect(scheduledJob?.jobName).toBe('recurring-job');
    expect(scheduledJob?.cron).toBe(CronPatterns.EVERY_MINUTE);
  });

  it('should schedule a one-time job', () => {
    const job = defineJob({
      name: 'one-time-job',
      handler: async () => 'done',
    });

    const scheduledAt = new Date(Date.now() + 1000);
    const scheduleId = scheduler.scheduleOnce(job, {}, scheduledAt);

    const scheduledJob = scheduler.getScheduledJob(scheduleId);
    expect(scheduledJob).toBeDefined();
    expect(scheduledJob?.maxRuns).toBe(1);
  });

  it('should execute scheduled jobs', async () => {
    const handler = vi.fn(async () => 'done');

    const job = defineJob({
      name: 'test-job',
      handler,
    });

    // Schedule job to run in 100ms
    scheduler.scheduleOnce(job, {}, new Date(Date.now() + 100));
    scheduler.start();
    queue.process();

    // Wait for job to execute
    await new Promise(resolve => setTimeout(resolve, 200));

    expect(handler).toHaveBeenCalled();

    scheduler.stop();
    await queue.stop();
  });

  it('should pause and resume scheduled jobs', () => {
    const job = defineJob({
      name: 'pausable-job',
      handler: async () => 'done',
    });

    const scheduleId = scheduler.schedule(job, {
      cron: CronPatterns.EVERY_MINUTE,
    });

    let scheduledJob = scheduler.getScheduledJob(scheduleId);
    expect(scheduledJob?.active).toBe(true);

    scheduler.pause(scheduleId);

    scheduledJob = scheduler.getScheduledJob(scheduleId);
    expect(scheduledJob?.active).toBe(false);

    scheduler.resume(scheduleId);

    scheduledJob = scheduler.getScheduledJob(scheduleId);
    expect(scheduledJob?.active).toBe(true);
  });

  it('should remove scheduled jobs', () => {
    const job = defineJob({
      name: 'removable-job',
      handler: async () => 'done',
    });

    const scheduleId = scheduler.schedule(job, {
      cron: CronPatterns.EVERY_MINUTE,
    });

    let scheduledJob = scheduler.getScheduledJob(scheduleId);
    expect(scheduledJob).toBeDefined();

    scheduler.remove(scheduleId);

    scheduledJob = scheduler.getScheduledJob(scheduleId);
    expect(scheduledJob).toBeNull();
  });

  it('should track job history', async () => {
    const job = defineJob({
      name: 'history-job',
      handler: async () => 'done',
    });

    const scheduleId = scheduler.scheduleOnce(job, {}, new Date(Date.now() + 50));
    scheduler.start();

    await new Promise(resolve => setTimeout(resolve, 150));

    const history = scheduler.getJobHistory(scheduleId);
    expect(history.length).toBeGreaterThan(0);

    scheduler.stop();
  });

  it('should respect max runs limit', async () => {
    let runCount = 0;

    const job = defineJob({
      name: 'limited-job',
      handler: async () => {
        runCount++;
        return 'done';
      },
    });

    // Schedule to run every 50ms, max 3 runs
    scheduler.schedule(job, {
      cron: '*/1 * * * * *', // Every second (using extended cron with seconds)
      maxRuns: 3,
    });

    scheduler.start();
    queue.process();

    // Wait for runs
    await new Promise(resolve => setTimeout(resolve, 4000));

    expect(runCount).toBeLessThanOrEqual(3);

    scheduler.stop();
    await queue.stop();
  });

  it('should execute onSchedule callback', async () => {
    const onSchedule = vi.fn();

    const job = defineJob({
      name: 'callback-job',
      handler: async () => 'done',
    });

    scheduler.scheduleOnce(job, {}, new Date(Date.now() + 50), {
      onSchedule,
    } as any);

    scheduler.start();

    await new Promise(resolve => setTimeout(resolve, 150));

    expect(onSchedule).toHaveBeenCalled();

    scheduler.stop();
  });

  it('should get all scheduled jobs', () => {
    const job1 = defineJob({
      name: 'job-1',
      handler: async () => 'done',
    });

    const job2 = defineJob({
      name: 'job-2',
      handler: async () => 'done',
    });

    scheduler.schedule(job1, { cron: CronPatterns.EVERY_MINUTE });
    scheduler.schedule(job2, { cron: CronPatterns.EVERY_HOUR });

    const allJobs = scheduler.getAllScheduledJobs();
    expect(allJobs).toHaveLength(2);
  });

  it('should clear job history', () => {
    const job = defineJob({
      name: 'history-job',
      handler: async () => 'done',
    });

    scheduler.scheduleOnce(job, {}, new Date(Date.now() + 50));
    scheduler.clearHistory();

    const history = scheduler.getJobHistory();
    expect(history).toHaveLength(0);
  });
});

describe('CronPatterns', () => {
  it('should provide common patterns', () => {
    expect(CronPatterns.EVERY_MINUTE).toBe('* * * * *');
    expect(CronPatterns.EVERY_HOUR).toBe('0 * * * *');
    expect(CronPatterns.DAILY).toBe('0 0 * * *');
    expect(CronPatterns.WEEKLY).toBe('0 0 * * 0');
  });

  it('should create custom time patterns', () => {
    expect(CronPatterns.at(14, 30)).toBe('30 14 * * *');
    expect(CronPatterns.everyMinutes(15)).toBe('*/15 * * * *');
    expect(CronPatterns.everyHours(6)).toBe('0 */6 * * *');
  });

  it('should create weekday patterns', () => {
    expect(CronPatterns.weekday(1, 9, 0)).toBe('0 9 * * 1'); // Monday at 9am
    expect(CronPatterns.weekdays(9, 0)).toBe('0 9 * * 1-5'); // Weekdays at 9am
    expect(CronPatterns.weekends(10, 0)).toBe('0 10 * * 0,6'); // Weekends at 10am
  });
});
