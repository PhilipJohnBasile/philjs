/**
 * Performance Panel - Display component render performance metrics
 */

import type { ComponentNode, PerformanceInfo, RenderProfile } from './types.js';

export class PerformancePanel {
  private container: HTMLElement | null = null;
  private currentNode: ComponentNode | null = null;
  private renderProfiles: Map<string, RenderProfile[]> = new Map();
  private maxProfilesPerComponent: number = 100;
  private isRecording: boolean = false;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  public setNode(node: ComponentNode): void {
    this.currentNode = node;
    this.render();
  }

  public startRecording(): void {
    this.isRecording = true;
    this.renderProfiles.clear();
  }

  public stopRecording(): void {
    this.isRecording = false;
    this.render();
  }

  public recordRender(componentId: string, profile: RenderProfile): void {
    if (!this.isRecording) return;

    if (!this.renderProfiles.has(componentId)) {
      this.renderProfiles.set(componentId, []);
    }

    const profiles = this.renderProfiles.get(componentId)!;
    profiles.push(profile);

    if (profiles.length > this.maxProfilesPerComponent) {
      profiles.shift();
    }
  }

  private render(): void {
    if (!this.container) return;

    const node = this.currentNode;

    let html = '<div style="padding: 8px;">';

    // Recording controls
    html += `
      <div style="display: flex; gap: 8px; margin-bottom: 16px;">
        <button id="perf-record-btn" style="
          padding: 6px 12px;
          background: ${this.isRecording ? '#ef4444' : '#3b82f6'};
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 11px;
        ">
          ${this.isRecording ? '⏹ Stop Recording' : '⏺ Start Recording'}
        </button>
        <button id="perf-clear-btn" style="
          padding: 6px 12px;
          background: #374151;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 11px;
        ">
          Clear
        </button>
      </div>
    `;

    if (!node) {
      html += `
        <div style="padding: 16px; text-align: center; color: #888;">
          Select a component to view performance metrics
        </div>
      `;
    } else {
      // Component metrics
      html += this.renderComponentMetrics(node);

      // Render profiles
      const profiles = this.renderProfiles.get(node.id) || [];
      if (profiles.length > 0) {
        html += this.renderProfilesChart(profiles);
      }

      // Performance tips
      html += this.renderPerformanceTips(node);
    }

    html += '</div>';
    this.container.innerHTML = html;

    // Attach event listeners
    this.container.querySelector('#perf-record-btn')?.addEventListener('click', () => {
      if (this.isRecording) {
        this.stopRecording();
      } else {
        this.startRecording();
      }
      this.render();
    });

    this.container.querySelector('#perf-clear-btn')?.addEventListener('click', () => {
      this.renderProfiles.clear();
      this.render();
    });
  }

  private renderComponentMetrics(node: ComponentNode): string {
    const avgTime = node.averageRenderTime || node.lastRenderTime || 0;
    const renderCount = node.renderCount || 0;
    const isGood = avgTime < 16;
    const isOk = avgTime < 50;

    return `
      <div style="background: #2d2d2d; border-radius: 8px; padding: 12px; margin-bottom: 16px;">
        <div style="font-weight: 600; margin-bottom: 12px; color: #e5e5e5;">
          ${node.name}
        </div>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
          <div style="text-align: center;">
            <div style="font-size: 24px; font-weight: 600; color: ${isGood ? '#10b981' : isOk ? '#f59e0b' : '#ef4444'};">
              ${avgTime.toFixed(1)}ms
            </div>
            <div style="font-size: 10px; color: #888;">Avg Render Time</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 24px; font-weight: 600; color: #3b82f6;">
              ${renderCount}
            </div>
            <div style="font-size: 10px; color: #888;">Render Count</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 24px; font-weight: 600; color: #8b5cf6;">
              ${(renderCount * avgTime).toFixed(0)}ms
            </div>
            <div style="font-size: 10px; color: #888;">Total Time</div>
          </div>
        </div>
      </div>
    `;
  }

  private renderProfilesChart(profiles: RenderProfile[]): string {
    if (profiles.length === 0) return '';

    const maxDuration = Math.max(...profiles.map(p => p.duration), 16);
    const chartHeight = 100;
    const barWidth = Math.max(2, Math.floor(280 / profiles.length));

    const bars = profiles.map((profile, i) => {
      const height = (profile.duration / maxDuration) * chartHeight;
      const color = profile.duration < 16 ? '#10b981' : profile.duration < 50 ? '#f59e0b' : '#ef4444';

      return `
        <div style="
          width: ${barWidth}px;
          height: ${height}px;
          background: ${color};
          border-radius: 1px;
        " title="${profile.duration.toFixed(2)}ms (${profile.phase})"></div>
      `;
    }).join('');

    return `
      <div style="margin-bottom: 16px;">
        <div style="font-weight: 600; margin-bottom: 8px; color: #e5e5e5;">Render Timeline</div>
        <div style="background: #2d2d2d; border-radius: 4px; padding: 12px;">
          <div style="display: flex; align-items: flex-end; gap: 1px; height: ${chartHeight}px;">
            ${bars}
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 8px; font-size: 10px; color: #666;">
            <span>0ms</span>
            <span>${maxDuration.toFixed(1)}ms</span>
          </div>
        </div>
        <div style="display: flex; gap: 12px; margin-top: 8px; font-size: 10px;">
          <span><span style="color: #10b981;">●</span> &lt;16ms (good)</span>
          <span><span style="color: #f59e0b;">●</span> &lt;50ms (ok)</span>
          <span><span style="color: #ef4444;">●</span> &gt;50ms (slow)</span>
        </div>
      </div>
    `;
  }

  private renderPerformanceTips(node: ComponentNode): string {
    const tips: string[] = [];
    const avgTime = node.averageRenderTime || node.lastRenderTime || 0;
    const renderCount = node.renderCount || 0;

    if (avgTime > 50) {
      tips.push('Consider memoizing expensive computations');
      tips.push('Break down this component into smaller pieces');
    }

    if (renderCount > 10 && avgTime > 16) {
      tips.push('Component is re-rendering frequently - check for unnecessary state updates');
      tips.push('Consider using useMemo or useCallback for stable references');
    }

    if (node.signals.length > 5) {
      tips.push('Many signals detected - consider combining related state');
    }

    if (tips.length === 0) {
      tips.push('Performance looks good! No immediate issues detected.');
    }

    return `
      <div>
        <div style="font-weight: 600; margin-bottom: 8px; color: #e5e5e5; display: flex; align-items: center; gap: 6px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 16v-4"/>
            <path d="M12 8h.01"/>
          </svg>
          Performance Tips
        </div>
        <ul style="margin: 0; padding-left: 20px; color: #888; font-size: 11px; line-height: 1.6;">
          ${tips.map(tip => `<li>${tip}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  public getComponentStats(): Map<string, PerformanceInfo> {
    const stats = new Map<string, PerformanceInfo>();

    for (const [componentId, profiles] of this.renderProfiles) {
      const totalTime = profiles.reduce((sum, p) => sum + p.duration, 0);
      const avgTime = totalTime / profiles.length;

      stats.set(componentId, {
        componentId,
        componentName: componentId, // Would need to be looked up
        renderCount: profiles.length,
        totalRenderTime: totalTime,
        averageRenderTime: avgTime,
        lastRenderTime: profiles[profiles.length - 1]?.duration || 0,
        mountTime: profiles.find(p => p.phase === 'mount')?.duration || 0,
        rerendersTriggeredBy: [],
        memorizedProps: [],
        memorizedValues: []
      });
    }

    return stats;
  }
}
