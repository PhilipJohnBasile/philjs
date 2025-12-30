/**
 * Remote Storage Module
 * Send data to backend API with batching, retry logic, and compression
 */

import pako from 'pako';
import type { MetricsSnapshot } from '../collector/metrics.js';
import type { Span } from '../collector/tracing.js';
import type { CapturedError } from '../collector/errors.js';

// ============================================================================
// Types
// ============================================================================

export type DataType = 'metrics' | 'spans' | 'errors';

export interface BatchItem<T = unknown> {
  type: DataType;
  data: T;
  timestamp: number;
  id: string;
}

export interface BatchPayload {
  batchId: string;
  timestamp: number;
  items: BatchItem[];
  metadata: {
    clientId: string;
    sessionId: string;
    environment: string;
    release?: string;
  };
}

export interface RemoteStorageConfig {
  /** API endpoint URL */
  endpoint: string;
  /** API key for authentication */
  apiKey?: string;
  /** Custom headers */
  headers?: Record<string, string>;
  /** Batch size before sending */
  batchSize?: number;
  /** Flush interval in milliseconds */
  flushInterval?: number;
  /** Enable compression */
  compression?: boolean;
  /** Maximum retry attempts */
  maxRetries?: number;
  /** Retry delay in milliseconds */
  retryDelay?: number;
  /** Exponential backoff multiplier */
  backoffMultiplier?: number;
  /** Maximum retry delay */
  maxRetryDelay?: number;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Callback on successful send */
  onSuccess?: (batchId: string, itemCount: number) => void;
  /** Callback on send error */
  onError?: (error: Error, batch: BatchPayload) => void;
  /** Client ID */
  clientId?: string;
  /** Session ID */
  sessionId?: string;
  /** Environment */
  environment?: string;
  /** Release version */
  release?: string;
}

export interface RetryState {
  attempts: number;
  nextRetryTime: number;
  batch: BatchPayload;
}

// ============================================================================
// Remote Storage Manager
// ============================================================================

export class RemoteStorageManager {
  private config: Required<Omit<RemoteStorageConfig, 'apiKey' | 'release'>> & {
    apiKey?: string;
    release?: string;
  };
  private queue: BatchItem[] = [];
  private retryQueue: RetryState[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private retryTimer: ReturnType<typeof setInterval> | null = null;
  private isFlushing = false;
  private isDestroyed = false;

  constructor(config: RemoteStorageConfig) {
    const baseConfig = {
      endpoint: config.endpoint,
      headers: config.headers ?? {},
      batchSize: config.batchSize ?? 50,
      flushInterval: config.flushInterval ?? 10000,
      compression: config.compression ?? true,
      maxRetries: config.maxRetries ?? 3,
      retryDelay: config.retryDelay ?? 1000,
      backoffMultiplier: config.backoffMultiplier ?? 2,
      maxRetryDelay: config.maxRetryDelay ?? 30000,
      timeout: config.timeout ?? 30000,
      onSuccess: config.onSuccess ?? (() => {}),
      onError: config.onError ?? (() => {}),
      clientId: config.clientId ?? this.generateClientId(),
      sessionId: config.sessionId ?? this.generateSessionId(),
      environment: config.environment ?? 'production',
    } as typeof this.config;
    if (config.apiKey !== undefined) {
      baseConfig.apiKey = config.apiKey;
    }
    if (config.release !== undefined) {
      baseConfig.release = config.release;
    }
    this.config = baseConfig;

    this.startFlushTimer();
    this.startRetryTimer();
  }

  // ============================================================================
  // Public API
  // ============================================================================

  /**
   * Send metrics snapshot
   */
  sendMetrics(metrics: MetricsSnapshot): void {
    this.addToQueue('metrics', metrics);
  }

  /**
   * Send span
   */
  sendSpan(span: Span): void {
    this.addToQueue('spans', span);
  }

  /**
   * Send multiple spans
   */
  sendSpans(spans: Span[]): void {
    spans.forEach((span) => this.addToQueue('spans', span));
  }

  /**
   * Send error
   */
  sendError(error: CapturedError): void {
    this.addToQueue('errors', error);
  }

  /**
   * Force flush all queued items
   */
  async flush(): Promise<void> {
    if (this.queue.length === 0) return;
    await this.flushBatch();
  }

  /**
   * Get queue status
   */
  getStatus(): {
    queueSize: number;
    retryQueueSize: number;
    isFlushing: boolean;
  } {
    return {
      queueSize: this.queue.length,
      retryQueueSize: this.retryQueue.length,
      isFlushing: this.isFlushing,
    };
  }

  /**
   * Update session ID
   */
  setSessionId(sessionId: string): void {
    this.config.sessionId = sessionId;
  }

  /**
   * Update release version
   */
  setRelease(release: string): void {
    this.config.release = release;
  }

  /**
   * Destroy the manager
   */
  async destroy(): Promise<void> {
    this.isDestroyed = true;

    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    if (this.retryTimer) {
      clearInterval(this.retryTimer);
      this.retryTimer = null;
    }

    // Final flush
    await this.flush();
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private generateClientId(): string {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('philjs-dashboard-client-id');
      if (stored) return stored;

      const newId = `client-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      localStorage.setItem('philjs-dashboard-client-id', newId);
      return newId;
    }
    return `client-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  private generateBatchId(): string {
    return `batch-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  private generateItemId(): string {
    return `item-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  private addToQueue<T>(type: DataType, data: T): void {
    if (this.isDestroyed) return;

    this.queue.push({
      type,
      data,
      timestamp: Date.now(),
      id: this.generateItemId(),
    });

    if (this.queue.length >= this.config.batchSize) {
      this.flushBatch().catch(console.error);
    }
  }

  private async flushBatch(): Promise<void> {
    if (this.isFlushing || this.queue.length === 0) return;

    this.isFlushing = true;

    const items = this.queue.splice(0, this.config.batchSize);
    const batch = this.createBatch(items);

    try {
      await this.sendBatch(batch);
      this.config.onSuccess(batch.batchId, items.length);
    } catch (error) {
      this.handleSendError(error as Error, batch);
    } finally {
      this.isFlushing = false;
    }
  }

  private createBatch(items: BatchItem[]): BatchPayload {
    const metadata: BatchPayload['metadata'] = {
      clientId: this.config.clientId,
      sessionId: this.config.sessionId,
      environment: this.config.environment,
    };
    if (this.config.release !== undefined) {
      metadata.release = this.config.release;
    }
    return {
      batchId: this.generateBatchId(),
      timestamp: Date.now(),
      items,
      metadata,
    };
  }

  private async sendBatch(batch: BatchPayload, retryAttempt = 0): Promise<void> {
    const headers: Record<string, string> = {
      'Content-Type': this.config.compression
        ? 'application/octet-stream'
        : 'application/json',
      ...this.config.headers,
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    if (this.config.compression) {
      headers['Content-Encoding'] = 'gzip';
    }

    headers['X-Batch-Id'] = batch.batchId;
    headers['X-Retry-Attempt'] = String(retryAttempt);

    let body: BodyInit = JSON.stringify(batch);

    if (this.config.compression) {
      const compressed = pako.gzip(body);
      body = new Blob([compressed], { type: 'application/octet-stream' });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers,
        body,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private handleSendError(error: Error, batch: BatchPayload): void {
    console.error('[RemoteStorage] Send failed:', error.message);

    // Add to retry queue
    const existingRetry = this.retryQueue.find(
      (r) => r.batch.batchId === batch.batchId
    );

    if (existingRetry) {
      existingRetry.attempts++;
      if (existingRetry.attempts >= this.config.maxRetries) {
        // Max retries exceeded, drop the batch
        this.retryQueue = this.retryQueue.filter(
          (r) => r.batch.batchId !== batch.batchId
        );
        this.config.onError(error, batch);
        return;
      }

      existingRetry.nextRetryTime = this.calculateNextRetryTime(
        existingRetry.attempts
      );
    } else {
      this.retryQueue.push({
        attempts: 1,
        nextRetryTime: this.calculateNextRetryTime(1),
        batch,
      });
    }
  }

  private calculateNextRetryTime(attempts: number): number {
    const delay = Math.min(
      this.config.retryDelay * Math.pow(this.config.backoffMultiplier, attempts - 1),
      this.config.maxRetryDelay
    );
    // Add jitter
    const jitter = delay * 0.2 * Math.random();
    return Date.now() + delay + jitter;
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      if (!this.isDestroyed) {
        this.flushBatch().catch(console.error);
      }
    }, this.config.flushInterval);
  }

  private startRetryTimer(): void {
    this.retryTimer = setInterval(() => {
      if (this.isDestroyed) return;
      this.processRetryQueue().catch(console.error);
    }, 1000);
  }

  private async processRetryQueue(): Promise<void> {
    const now = Date.now();
    const readyRetries = this.retryQueue.filter((r) => r.nextRetryTime <= now);

    for (const retry of readyRetries) {
      try {
        await this.sendBatch(retry.batch, retry.attempts);
        // Success - remove from retry queue
        this.retryQueue = this.retryQueue.filter(
          (r) => r.batch.batchId !== retry.batch.batchId
        );
        this.config.onSuccess(retry.batch.batchId, retry.batch.items.length);
      } catch (error) {
        this.handleSendError(error as Error, retry.batch);
      }
    }
  }
}

// ============================================================================
// Beacon API for Page Unload
// ============================================================================

export class BeaconSender {
  private endpoint: string;
  private apiKey?: string;
  private pendingData: BatchItem[] = [];

  constructor(endpoint: string, apiKey?: string) {
    this.endpoint = endpoint;
    if (apiKey !== undefined) {
      this.apiKey = apiKey;
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.sendBeacon();
        }
      });

      window.addEventListener('pagehide', () => {
        this.sendBeacon();
      });
    }
  }

  queue<T>(type: DataType, data: T): void {
    this.pendingData.push({
      type,
      data,
      timestamp: Date.now(),
      id: `beacon-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    });
  }

  private sendBeacon(): void {
    if (this.pendingData.length === 0) return;

    const payload = JSON.stringify({
      items: this.pendingData,
      timestamp: Date.now(),
      apiKey: this.apiKey,
    });

    // Use sendBeacon for reliable delivery during page unload
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' });
      navigator.sendBeacon(this.endpoint, blob);
    }

    this.pendingData = [];
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let defaultRemoteStorage: RemoteStorageManager | null = null;

export function getRemoteStorage(config?: RemoteStorageConfig): RemoteStorageManager {
  if (!defaultRemoteStorage) {
    if (!config) {
      throw new Error('RemoteStorageManager must be initialized with a config first');
    }
    defaultRemoteStorage = new RemoteStorageManager(config);
  }
  return defaultRemoteStorage;
}

export function initRemoteStorage(config: RemoteStorageConfig): RemoteStorageManager {
  if (defaultRemoteStorage) {
    console.warn('[RemoteStorage] Already initialized, returning existing instance');
    return defaultRemoteStorage;
  }
  defaultRemoteStorage = new RemoteStorageManager(config);
  return defaultRemoteStorage;
}

export async function resetRemoteStorage(): Promise<void> {
  if (defaultRemoteStorage) {
    await defaultRemoteStorage.destroy();
    defaultRemoteStorage = null;
  }
}

// ============================================================================
// Combined Storage Manager
// ============================================================================

export interface CombinedStorageConfig {
  local?: {
    enabled: boolean;
  };
  remote?: RemoteStorageConfig;
  beacon?: {
    enabled: boolean;
    endpoint?: string;
  };
}

export class CombinedStorageManager {
  private remote: RemoteStorageManager | null = null;
  private beacon: BeaconSender | null = null;
  private localEnabled: boolean;

  constructor(config: CombinedStorageConfig) {
    this.localEnabled = config.local?.enabled ?? false;

    if (config.remote) {
      this.remote = new RemoteStorageManager(config.remote);
    }

    if (config.beacon?.enabled && config.remote) {
      this.beacon = new BeaconSender(
        config.beacon.endpoint ?? config.remote.endpoint,
        config.remote.apiKey
      );
    }
  }

  sendMetrics(metrics: MetricsSnapshot): void {
    if (this.remote) {
      this.remote.sendMetrics(metrics);
    }
    if (this.beacon) {
      this.beacon.queue('metrics', metrics);
    }
  }

  sendSpan(span: Span): void {
    if (this.remote) {
      this.remote.sendSpan(span);
    }
    if (this.beacon) {
      this.beacon.queue('spans', span);
    }
  }

  sendError(error: CapturedError): void {
    if (this.remote) {
      this.remote.sendError(error);
    }
    if (this.beacon) {
      this.beacon.queue('errors', error);
    }
  }

  async flush(): Promise<void> {
    if (this.remote) {
      await this.remote.flush();
    }
  }

  async destroy(): Promise<void> {
    if (this.remote) {
      await this.remote.destroy();
    }
  }
}
