/**
 * PhilJS DevTools - Performance Profiler
 */

import type { PerformanceMetrics, RenderMetrics } from '../types';

export class PerformanceProfiler {
  private metrics: PerformanceMetrics;
  private isRecording: boolean = false;
  private renderHistory: RenderMetrics[] = [];

  constructor() {
    this.metrics = {
      fps: 0,
      memory: { usedJSHeapSize: 0, totalJSHeapSize: 0, jsHeapSizeLimit: 0 },
      timing: { ttfb: 0, fcp: 0, lcp: 0, fid: 0, cls: 0, inp: 0 },
      renders: [],
      hydration: null,
    };
  }

  update(metrics: PerformanceMetrics): void {
    this.metrics = metrics;
    if (this.isRecording) {
      this.renderHistory.push(...metrics.renders);
    }
  }

  startRecording(): void {
    this.isRecording = true;
    this.renderHistory = [];
  }

  stopRecording(): void {
    this.isRecording = false;
  }

  clearHistory(): void {
    this.renderHistory = [];
  }

  render(): string {
    return `
      <div class="performance-profiler">
        <div class="profiler-toolbar">
          <button class="profiler-btn ${this.isRecording ? 'recording' : ''}" data-action="toggle-record">
            ${this.isRecording ? '⏹ Stop' : '⏺ Record'}
          </button>
          <button class="profiler-btn" data-action="clear">Clear</button>
        </div>

        <div class="profiler-overview">
          ${this.renderMetricsGrid()}
        </div>

        <div class="profiler-details">
          ${this.renderWebVitals()}
          ${this.renderRenderTimeline()}
          ${this.renderHydrationInfo()}
        </div>
      </div>
    `;
  }

  private renderMetricsGrid(): string {
    const { fps, memory } = this.metrics;
    const memoryUsage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit * 100) || 0;

    return `
      <div class="metrics-grid">
        <div class="metric-card ${fps < 30 ? 'warning' : fps < 50 ? 'caution' : ''}">
          <div class="metric-chart">
            <div class="fps-gauge" style="--fps: ${fps}"></div>
          </div>
          <div class="metric-value">${fps}</div>
          <div class="metric-label">FPS</div>
        </div>

        <div class="metric-card ${memoryUsage > 80 ? 'warning' : memoryUsage > 60 ? 'caution' : ''}">
          <div class="metric-chart">
            <div class="memory-bar" style="width: ${memoryUsage}%"></div>
          </div>
          <div class="metric-value">${(memory.usedJSHeapSize / 1024 / 1024).toFixed(1)}MB</div>
          <div class="metric-label">Memory</div>
        </div>

        <div class="metric-card">
          <div class="metric-value">${this.renderHistory.length}</div>
          <div class="metric-label">Total Renders</div>
        </div>

        <div class="metric-card">
          <div class="metric-value">${this.calculateAverageRenderTime().toFixed(2)}ms</div>
          <div class="metric-label">Avg Render</div>
        </div>
      </div>
    `;
  }

  private renderWebVitals(): string {
    const { timing } = this.metrics;
    const vitals = [
      { name: 'TTFB', value: timing.ttfb, threshold: { good: 800, needs: 1800 }, unit: 'ms' },
      { name: 'FCP', value: timing.fcp, threshold: { good: 1800, needs: 3000 }, unit: 'ms' },
      { name: 'LCP', value: timing.lcp, threshold: { good: 2500, needs: 4000 }, unit: 'ms' },
      { name: 'FID', value: timing.fid, threshold: { good: 100, needs: 300 }, unit: 'ms' },
      { name: 'CLS', value: timing.cls, threshold: { good: 0.1, needs: 0.25 }, unit: '' },
      { name: 'INP', value: timing.inp, threshold: { good: 200, needs: 500 }, unit: 'ms' },
    ];

    return `
      <section class="profiler-section">
        <h3>Core Web Vitals</h3>
        <div class="vitals-grid">
          ${vitals.map(vital => {
            const status = vital.value <= vital.threshold.good ? 'good' :
              vital.value <= vital.threshold.needs ? 'needs-improvement' : 'poor';

            return `
              <div class="vital-card ${status}">
                <div class="vital-name">${vital.name}</div>
                <div class="vital-value">${vital.value.toFixed(vital.unit === 'ms' ? 0 : 2)}${vital.unit}</div>
                <div class="vital-status">${status === 'good' ? '✓' : status === 'needs-improvement' ? '!' : '✗'}</div>
              </div>
            `;
          }).join('')}
        </div>
      </section>
    `;
  }

  private renderRenderTimeline(): string {
    const renders = this.isRecording ? this.renderHistory : this.metrics.renders;
    const recentRenders = renders.slice(-50);

    if (recentRenders.length === 0) {
      return `
        <section class="profiler-section">
          <h3>Render Timeline</h3>
          <div class="timeline-empty">
            ${this.isRecording
              ? 'Recording... Interact with the app to capture renders.'
              : 'Click Record to start capturing renders.'}
          </div>
        </section>
      `;
    }

    const maxDuration = Math.max(...recentRenders.map(r => r.duration), 16);

    return `
      <section class="profiler-section">
        <h3>Render Timeline</h3>
        <div class="render-timeline">
          ${recentRenders.map(render => {
            const width = (render.duration / maxDuration * 100);
            const isSlow = render.duration > 16;

            return `
              <div class="render-bar ${isSlow ? 'slow' : ''}" style="width: ${width}%">
                <span class="render-name">${render.componentName}</span>
                <span class="render-time">${render.duration.toFixed(2)}ms</span>
              </div>
            `;
          }).join('')}
        </div>
      </section>
    `;
  }

  private renderHydrationInfo(): string {
    const { hydration } = this.metrics;

    if (!hydration) {
      return '';
    }

    return `
      <section class="profiler-section">
        <h3>Hydration</h3>
        <div class="hydration-info">
          <dl>
            <dt>Total Time</dt>
            <dd>${hydration.totalTime.toFixed(2)}ms</dd>
            <dt>Components Hydrated</dt>
            <dd>${hydration.componentCount}</dd>
            <dt>Mismatches</dt>
            <dd class="${hydration.mismatchCount > 0 ? 'error' : ''}">${hydration.mismatchCount}</dd>
          </dl>

          ${hydration.mismatches.length > 0 ? `
            <div class="hydration-mismatches">
              <h4>Mismatches</h4>
              <ul>
                ${hydration.mismatches.map(m => `
                  <li>
                    <strong>${m.componentName}</strong>: ${m.type}
                    <br/>Expected: <code>${m.expected}</code>
                    <br/>Actual: <code>${m.actual}</code>
                  </li>
                `).join('')}
              </ul>
            </div>
          ` : ''}
        </div>
      </section>
    `;
  }

  private calculateAverageRenderTime(): number {
    const renders = this.isRecording ? this.renderHistory : this.metrics.renders;
    if (renders.length === 0) return 0;
    return renders.reduce((sum, r) => sum + r.duration, 0) / renders.length;
  }
}
