/**
 * Job Monitoring
 *
 * Job status tracking, progress reporting, and statistics.
 */

import type { IQueue, Job, QueueStats } from './queue.js';
import type { Scheduler, ScheduledJob, JobRun } from './scheduler.js';

export interface JobMetrics {
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  activeJobs: number;
  waitingJobs: number;
  delayedJobs: number;
  averageProcessingTime: number;
  successRate: number;
  failureRate: number;
  throughput: number; // Jobs per minute
}

export interface JobDetail extends Job {
  duration?: number;
  retries: number;
  logs?: string[];
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'critical';
  queueDepth: number;
  processingRate: number;
  errorRate: number;
  averageWaitTime: number;
  oldestWaitingJob?: Date;
  issues: string[];
}

export interface MonitorOptions {
  /** Metrics collection interval (ms) */
  metricsInterval?: number;
  /** Number of metrics snapshots to keep */
  metricsHistorySize?: number;
  /** Health check interval (ms) */
  healthCheckInterval?: number;
  /** Thresholds for health status */
  healthThresholds?: {
    queueDepthWarning?: number;
    queueDepthCritical?: number;
    errorRateWarning?: number;
    errorRateCritical?: number;
    processingRateWarning?: number;
  };
}

export interface MetricsSnapshot {
  timestamp: Date;
  metrics: JobMetrics;
  queueStats: QueueStats;
}

/**
 * Job Monitor
 */
export class Monitor {
  private metricsHistory: MetricsSnapshot[] = [];
  private metricsInterval?: NodeJS.Timeout;
  private healthCheckInterval?: NodeJS.Timeout;
  private options: Required<MonitorOptions>;
  private jobTimings = new Map<string, number>();
  private completionTimes: number[] = [];

  constructor(
    private queue: IQueue,
    private scheduler?: Scheduler,
    options: MonitorOptions = {}
  ) {
    this.options = {
      metricsInterval: options.metricsInterval || 60000, // 1 minute
      metricsHistorySize: options.metricsHistorySize || 100,
      healthCheckInterval: options.healthCheckInterval || 30000, // 30 seconds
      healthThresholds: {
        queueDepthWarning: 100,
        queueDepthCritical: 1000,
        errorRateWarning: 0.1, // 10%
        errorRateCritical: 0.25, // 25%
        processingRateWarning: 10, // jobs per minute
        ...options.healthThresholds,
      },
    };
  }

  /**
   * Start monitoring
   */
  start(): void {
    if (this.metricsInterval) {
      return;
    }

    // Start metrics collection
    this.metricsInterval = setInterval(() => {
      this.collectMetrics().catch(console.error);
    }, this.options.metricsInterval);

    // Collect initial metrics
    this.collectMetrics().catch(console.error);
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      delete this.metricsInterval;
    }
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      delete this.healthCheckInterval;
    }
  }

  /**
   * Get current metrics
   */
  async getMetrics(): Promise<JobMetrics> {
    const stats = await this.queue.getStats();

    const totalJobs = stats.total;
    const completedJobs = stats.completed;
    const failedJobs = stats.failed;

    const averageProcessingTime =
      this.completionTimes.length > 0
        ? this.completionTimes.reduce((a, b) => a + b, 0) / this.completionTimes.length
        : 0;

    const successRate = totalJobs > 0 ? completedJobs / totalJobs : 0;
    const failureRate = totalJobs > 0 ? failedJobs / totalJobs : 0;

    // Calculate throughput (jobs per minute)
    const throughput = this.calculateThroughput();

    return {
      totalJobs,
      completedJobs,
      failedJobs,
      activeJobs: stats.active,
      waitingJobs: stats.waiting,
      delayedJobs: stats.delayed,
      averageProcessingTime,
      successRate,
      failureRate,
      throughput,
    };
  }

  /**
   * Get metrics history
   */
  getMetricsHistory(): MetricsSnapshot[] {
    return [...this.metricsHistory];
  }

  /**
   * Get system health status
   */
  async getHealth(): Promise<SystemHealth> {
    const stats = await this.queue.getStats();
    const metrics = await this.getMetrics();
    const issues: string[] = [];

    // Determine status based on thresholds
    let status: SystemHealth['status'] = 'healthy';

    // Check queue depth
    const queueDepth = stats.waiting + stats.delayed;
    if (queueDepth >= this.options.healthThresholds.queueDepthCritical!) {
      status = 'critical';
      issues.push(`Critical queue depth: ${queueDepth} jobs waiting`);
    } else if (queueDepth >= this.options.healthThresholds.queueDepthWarning!) {
      if (status === 'healthy') status = 'degraded';
      issues.push(`High queue depth: ${queueDepth} jobs waiting`);
    }

    // Check error rate
    if (metrics.failureRate >= this.options.healthThresholds.errorRateCritical!) {
      status = 'critical';
      issues.push(`Critical error rate: ${(metrics.failureRate * 100).toFixed(1)}%`);
    } else if (metrics.failureRate >= this.options.healthThresholds.errorRateWarning!) {
      if (status === 'healthy') status = 'degraded';
      issues.push(`High error rate: ${(metrics.failureRate * 100).toFixed(1)}%`);
    }

    // Check processing rate
    if (
      metrics.throughput < this.options.healthThresholds.processingRateWarning! &&
      queueDepth > 0
    ) {
      if (status === 'healthy') status = 'degraded';
      issues.push(`Low processing rate: ${metrics.throughput.toFixed(1)} jobs/min`);
    }

    return {
      status,
      queueDepth,
      processingRate: metrics.throughput,
      errorRate: metrics.failureRate,
      averageWaitTime: metrics.averageProcessingTime,
      issues,
    };
  }

  /**
   * Get job details
   */
  async getJobDetails(jobId: string): Promise<JobDetail | null> {
    const job = await this.queue.getJob(jobId);
    if (!job) {
      return null;
    }

    const startTime = this.jobTimings.get(jobId);
    const duration =
      startTime && job.finishedAt
        ? job.finishedAt.getTime() - startTime
        : undefined;

    const result: JobDetail = {
      ...job,
      retries: job.attemptsMade,
    };
    if (duration !== undefined) {
      result.duration = duration;
    }
    return result;
  }

  /**
   * Get scheduled jobs overview
   */
  getScheduledJobsOverview(): ScheduledJob[] | null {
    if (!this.scheduler) {
      return null;
    }

    return this.scheduler.getAllScheduledJobs();
  }

  /**
   * Get job run history
   */
  getJobRunHistory(scheduleId?: string): JobRun[] | null {
    if (!this.scheduler) {
      return null;
    }

    return this.scheduler.getJobHistory(scheduleId);
  }

  /**
   * Retry a failed job
   */
  async retryJob(jobId: string): Promise<boolean> {
    return this.queue.retryJob(jobId);
  }

  /**
   * Retry all failed jobs
   */
  async retryAllFailed(): Promise<number> {
    await this.queue.getStats(); // Check queue is accessible
    let retried = 0;

    // This is a simplified implementation
    // In a real implementation, you'd iterate through failed jobs
    // For now, we'll return 0 as we don't have a way to list all jobs

    return retried;
  }

  /**
   * Record job start time
   */
  recordJobStart(jobId: string): void {
    this.jobTimings.set(jobId, Date.now());
  }

  /**
   * Record job completion
   */
  recordJobCompletion(jobId: string, _success: boolean): void {
    const startTime = this.jobTimings.get(jobId);
    if (startTime) {
      const duration = Date.now() - startTime;
      this.completionTimes.push(duration);

      // Keep only last 100 completion times
      if (this.completionTimes.length > 100) {
        this.completionTimes.shift();
      }

      this.jobTimings.delete(jobId);
    }
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metricsHistory = [];
    this.completionTimes = [];
    this.jobTimings.clear();
  }

  /**
   * Export metrics as JSON
   */
  async exportMetrics(): Promise<string> {
    const metrics = await this.getMetrics();
    const health = await this.getHealth();
    const history = this.getMetricsHistory();

    return JSON.stringify(
      {
        timestamp: new Date(),
        currentMetrics: metrics,
        health,
        history,
      },
      null,
      2
    );
  }

  /**
   * Generate HTML dashboard
   */
  async generateDashboard(): Promise<string> {
    const metrics = await this.getMetrics();
    const health = await this.getHealth();
    const stats = await this.queue.getStats();
    const scheduledJobs = this.getScheduledJobsOverview();

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PhilJS Jobs - Dashboard</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: #f5f5f5;
      padding: 20px;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
    }

    h1 {
      font-size: 32px;
      margin-bottom: 10px;
      color: #333;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #e0e0e0;
    }

    .health-badge {
      padding: 8px 16px;
      border-radius: 20px;
      font-weight: 600;
      font-size: 14px;
      text-transform: uppercase;
    }

    .health-healthy {
      background: #4caf50;
      color: white;
    }

    .health-degraded {
      background: #ff9800;
      color: white;
    }

    .health-critical {
      background: #f44336;
      color: white;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .card {
      background: white;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .card-title {
      font-size: 14px;
      color: #666;
      margin-bottom: 10px;
      text-transform: uppercase;
      font-weight: 600;
    }

    .card-value {
      font-size: 32px;
      font-weight: 700;
      color: #333;
    }

    .card-subtitle {
      font-size: 12px;
      color: #999;
      margin-top: 5px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      margin-top: 15px;
    }

    .stat-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .stat-label {
      color: #666;
      font-size: 14px;
    }

    .stat-value {
      color: #333;
      font-weight: 600;
      font-size: 14px;
    }

    .section-title {
      font-size: 20px;
      margin: 30px 0 15px;
      color: #333;
    }

    .issues-list {
      list-style: none;
      background: #fff3cd;
      border: 1px solid #ffc107;
      border-radius: 4px;
      padding: 15px 20px;
      margin-bottom: 20px;
    }

    .issues-list li {
      padding: 5px 0;
      color: #856404;
    }

    .issues-list li::before {
      content: "⚠ ";
      margin-right: 8px;
    }

    .refresh-btn {
      background: #2196f3;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
    }

    .refresh-btn:hover {
      background: #1976d2;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      background: white;
      border-radius: 8px;
      overflow: hidden;
    }

    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #f0f0f0;
    }

    th {
      background: #f5f5f5;
      font-weight: 600;
      color: #333;
      font-size: 14px;
    }

    td {
      color: #666;
      font-size: 14px;
    }

    .status-badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
    }

    .status-active {
      background: #e3f2fd;
      color: #1976d2;
    }

    .status-inactive {
      background: #f5f5f5;
      color: #999;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <h1>PhilJS Jobs Dashboard</h1>
        <p style="color: #666; margin-top: 5px;">Real-time job monitoring and statistics</p>
      </div>
      <div>
        <span class="health-badge health-${health.status}">${health.status}</span>
        <button class="refresh-btn" onclick="location.reload()">Refresh</button>
      </div>
    </div>

    ${health.issues.length > 0 ? `
    <ul class="issues-list">
      ${health.issues.map(issue => `<li>${issue}</li>`).join('')}
    </ul>
    ` : ''}

    <div class="grid">
      <div class="card">
        <div class="card-title">Total Jobs</div>
        <div class="card-value">${metrics.totalJobs}</div>
      </div>

      <div class="card">
        <div class="card-title">Success Rate</div>
        <div class="card-value">${(metrics.successRate * 100).toFixed(1)}%</div>
        <div class="card-subtitle">${metrics.completedJobs} completed</div>
      </div>

      <div class="card">
        <div class="card-title">Failure Rate</div>
        <div class="card-value">${(metrics.failureRate * 100).toFixed(1)}%</div>
        <div class="card-subtitle">${metrics.failedJobs} failed</div>
      </div>

      <div class="card">
        <div class="card-title">Throughput</div>
        <div class="card-value">${metrics.throughput.toFixed(1)}</div>
        <div class="card-subtitle">jobs per minute</div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">Queue Statistics</div>
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-label">Waiting</span>
          <span class="stat-value">${stats.waiting}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Active</span>
          <span class="stat-value">${stats.active}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Completed</span>
          <span class="stat-value">${stats.completed}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Failed</span>
          <span class="stat-value">${stats.failed}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Delayed</span>
          <span class="stat-value">${stats.delayed}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Avg Processing Time</span>
          <span class="stat-value">${metrics.averageProcessingTime.toFixed(0)}ms</span>
        </div>
      </div>
    </div>

    ${scheduledJobs && scheduledJobs.length > 0 ? `
    <h2 class="section-title">Scheduled Jobs</h2>
    <table>
      <thead>
        <tr>
          <th>Job Name</th>
          <th>Schedule</th>
          <th>Next Run</th>
          <th>Runs</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${scheduledJobs.map(job => `
        <tr>
          <td>${job.jobName}</td>
          <td><code>${job.cron || 'One-time'}</code></td>
          <td>${job.nextRun ? new Date(job.nextRun).toLocaleString() : 'N/A'}</td>
          <td>${job.runsCount}${job.maxRuns ? ` / ${job.maxRuns}` : ''}</td>
          <td>
            <span class="status-badge status-${job.active ? 'active' : 'inactive'}">
              ${job.active ? 'Active' : 'Inactive'}
            </span>
          </td>
        </tr>
        `).join('')}
      </tbody>
    </table>
    ` : ''}

    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #999; font-size: 14px;">
      Last updated: ${new Date().toLocaleString()}
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  private async collectMetrics(): Promise<void> {
    const metrics = await this.getMetrics();
    const queueStats = await this.queue.getStats();

    const snapshot: MetricsSnapshot = {
      timestamp: new Date(),
      metrics,
      queueStats,
    };

    this.metricsHistory.push(snapshot);

    // Trim history
    if (this.metricsHistory.length > this.options.metricsHistorySize) {
      this.metricsHistory.shift();
    }
  }

  private calculateThroughput(): number {
    if (this.metricsHistory.length < 2) {
      return 0;
    }

    const recent = this.metricsHistory[this.metricsHistory.length - 1]!;
    const previous = this.metricsHistory[0]!;

    const timeDiff =
      recent.timestamp.getTime() - previous.timestamp.getTime();
    const jobsDiff =
      recent.metrics.completedJobs - previous.metrics.completedJobs;

    if (timeDiff === 0) {
      return 0;
    }

    // Convert to jobs per minute
    return (jobsDiff / timeDiff) * 60000;
  }
}
