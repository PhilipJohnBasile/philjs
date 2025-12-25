/**
 * Profiler Panel - Component render profiling
 *
 * Provides React Profiler-like functionality:
 * - Flame graph visualization
 * - Render timing breakdown
 * - Component render counts
 * - Why did this render analysis
 * - Commit information
 */

export interface RenderInfo {
  id: string;
  componentName: string;
  phase: 'mount' | 'update' | 'unmount';
  actualDuration: number;
  baseDuration: number;
  startTime: number;
  commitTime: number;
  interactions: string[];
  renderCount: number;
  changedProps?: string[];
  changedState?: string[];
  parentId?: string;
}

export interface CommitInfo {
  id: string;
  timestamp: number;
  duration: number;
  renders: RenderInfo[];
  interactions: string[];
  priorityLevel: 'immediate' | 'user-blocking' | 'normal' | 'low' | 'idle';
}

export interface ProfilerPanelProps {
  commits: CommitInfo[];
  selectedCommit?: string;
  onCommitSelect?: (commitId: string) => void;
  onRenderSelect?: (renderId: string) => void;
  recording?: boolean;
  onRecordToggle?: () => void;
}

/**
 * Profiler Panel for render analysis
 */
export class ProfilerPanel {
  private container: HTMLElement | null = null;
  private commits: CommitInfo[] = [];
  private selectedCommit: string | null = null;
  private selectedRender: string | null = null;
  private viewMode: 'flamegraph' | 'ranked' | 'timeline' = 'flamegraph';
  private recording = false;
  private onCommitSelect?: (commitId: string) => void;
  private onRenderSelect?: (renderId: string) => void;
  private onRecordToggle?: () => void;

  constructor(options: Partial<ProfilerPanelProps> = {}) {
    this.commits = options.commits || [];
    this.selectedCommit = options.selectedCommit || null;
    this.recording = options.recording || false;
    this.onCommitSelect = options.onCommitSelect;
    this.onRenderSelect = options.onRenderSelect;
    this.onRecordToggle = options.onRecordToggle;
  }

  /**
   * Mount the panel
   */
  mount(container: HTMLElement): void {
    this.container = container;
    this.render();
  }

  /**
   * Unmount the panel
   */
  unmount(): void {
    if (this.container) {
      this.container.innerHTML = '';
      this.container = null;
    }
  }

  /**
   * Add a commit
   */
  addCommit(commit: CommitInfo): void {
    this.commits.push(commit);
    if (this.commits.length > 100) {
      this.commits.shift();
    }
    this.render();
  }

  /**
   * Clear all commits
   */
  clearCommits(): void {
    this.commits = [];
    this.selectedCommit = null;
    this.selectedRender = null;
    this.render();
  }

  /**
   * Set recording state
   */
  setRecording(recording: boolean): void {
    this.recording = recording;
    this.render();
  }

  /**
   * Render the panel
   */
  private render(): void {
    if (!this.container) return;

    const html = `
      <div class="philjs-profiler-panel">
        <div class="profiler-toolbar">
          <button class="record-btn ${this.recording ? 'recording' : ''}" data-action="toggle-record">
            <span class="record-icon"></span>
            ${this.recording ? 'Stop' : 'Start'} Profiling
          </button>
          <button class="action-btn" data-action="clear" title="Clear">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
          <div class="view-toggle">
            <button class="view-btn ${this.viewMode === 'flamegraph' ? 'active' : ''}" data-view="flamegraph">
              Flamegraph
            </button>
            <button class="view-btn ${this.viewMode === 'ranked' ? 'active' : ''}" data-view="ranked">
              Ranked
            </button>
            <button class="view-btn ${this.viewMode === 'timeline' ? 'active' : ''}" data-view="timeline">
              Timeline
            </button>
          </div>
        </div>

        <div class="profiler-content">
          ${this.commits.length === 0
            ? this.renderEmptyState()
            : this.renderCommits()
          }
        </div>

        ${this.selectedRender ? this.renderDetails() : ''}
      </div>
      <style>
        .philjs-profiler-panel {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 12px;
          color: #e0e0e0;
          background: #1e1e1e;
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        .profiler-toolbar {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-bottom: 1px solid #333;
          background: #252525;
        }
        .record-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: #333;
          border: 1px solid #444;
          border-radius: 4px;
          color: #e0e0e0;
          cursor: pointer;
          font-size: 12px;
        }
        .record-btn:hover {
          background: #3a3a3a;
        }
        .record-btn.recording {
          background: #cc3333;
          border-color: #dd4444;
        }
        .record-icon {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #888;
        }
        .record-btn.recording .record-icon {
          background: #ff4444;
          animation: pulse 1s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .action-btn {
          background: transparent;
          border: none;
          color: #888;
          cursor: pointer;
          padding: 6px;
          border-radius: 3px;
        }
        .action-btn:hover {
          background: #333;
          color: #e0e0e0;
        }
        .view-toggle {
          margin-left: auto;
          display: flex;
          background: #2a2a2a;
          border-radius: 4px;
          overflow: hidden;
        }
        .view-btn {
          background: transparent;
          border: none;
          color: #888;
          padding: 6px 12px;
          cursor: pointer;
          font-size: 11px;
        }
        .view-btn:hover {
          color: #e0e0e0;
        }
        .view-btn.active {
          background: #007acc;
          color: #fff;
        }
        .profiler-content {
          flex: 1;
          overflow: auto;
        }
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #888;
          text-align: center;
          padding: 20px;
        }
        .empty-state-icon {
          font-size: 48px;
          margin-bottom: 16px;
          opacity: 0.5;
        }
        .commits-timeline {
          display: flex;
          padding: 12px;
          gap: 4px;
          overflow-x: auto;
          border-bottom: 1px solid #333;
        }
        .commit-bar {
          width: 8px;
          min-width: 8px;
          background: #4fc3f7;
          border-radius: 2px;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .commit-bar:hover {
          opacity: 0.8;
        }
        .commit-bar.selected {
          background: #007acc;
          box-shadow: 0 0 0 2px #007acc44;
        }
        .commit-bar.slow {
          background: #ffb74d;
        }
        .commit-bar.very-slow {
          background: #f44336;
        }
        .flamegraph {
          padding: 12px;
        }
        .flame-row {
          display: flex;
          margin-bottom: 2px;
        }
        .flame-bar {
          height: 20px;
          display: flex;
          align-items: center;
          padding: 0 4px;
          font-size: 10px;
          color: #fff;
          cursor: pointer;
          border-radius: 2px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          transition: filter 0.2s;
        }
        .flame-bar:hover {
          filter: brightness(1.2);
        }
        .flame-bar.selected {
          box-shadow: 0 0 0 2px #fff;
        }
        .flame-bar.fast { background: #4caf50; }
        .flame-bar.normal { background: #ff9800; }
        .flame-bar.slow { background: #f44336; }
        .ranked-list {
          padding: 12px;
        }
        .ranked-item {
          display: flex;
          align-items: center;
          padding: 8px;
          border-radius: 4px;
          margin-bottom: 4px;
          cursor: pointer;
        }
        .ranked-item:hover {
          background: #2a2a2a;
        }
        .ranked-item.selected {
          background: #264f78;
        }
        .ranked-rank {
          width: 24px;
          font-weight: bold;
          color: #888;
        }
        .ranked-name {
          flex: 1;
          font-weight: 500;
        }
        .ranked-duration {
          font-family: 'Fira Code', monospace;
          color: #b5cea8;
        }
        .ranked-bar {
          width: 100px;
          height: 4px;
          background: #333;
          border-radius: 2px;
          margin-left: 12px;
          overflow: hidden;
        }
        .ranked-bar-fill {
          height: 100%;
          border-radius: 2px;
        }
        .details-panel {
          border-top: 1px solid #333;
          padding: 12px;
          background: #252525;
          max-height: 200px;
          overflow-y: auto;
        }
        .details-panel h4 {
          margin: 0 0 12px 0;
          font-size: 13px;
          font-weight: 500;
        }
        .detail-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }
        .detail-item {
          background: #2a2a2a;
          padding: 8px;
          border-radius: 4px;
        }
        .detail-label {
          font-size: 10px;
          color: #888;
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        .detail-value {
          font-family: 'Fira Code', monospace;
          font-size: 14px;
        }
        .why-render {
          margin-top: 12px;
          padding: 8px;
          background: #2a2a2a;
          border-radius: 4px;
        }
        .why-render-title {
          font-weight: 500;
          margin-bottom: 8px;
        }
        .why-render-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 0;
          color: #ffb74d;
        }
      </style>
    `;

    this.container.innerHTML = html;
    this.attachEventListeners();
  }

  /**
   * Render empty state
   */
  private renderEmptyState(): string {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">⏱️</div>
        <p>No profiling data yet</p>
        <p style="font-size: 11px;">Click "Start Profiling" to record component renders</p>
      </div>
    `;
  }

  /**
   * Render commits
   */
  private renderCommits(): string {
    const maxDuration = Math.max(...this.commits.map(c => c.duration));

    const timeline = `
      <div class="commits-timeline">
        ${this.commits.map(commit => {
          const height = Math.max(10, (commit.duration / maxDuration) * 60);
          const speedClass = commit.duration > 50 ? 'very-slow' : commit.duration > 16 ? 'slow' : '';
          const isSelected = commit.id === this.selectedCommit;
          return `
            <div class="commit-bar ${speedClass} ${isSelected ? 'selected' : ''}"
                 style="height: ${height}px"
                 data-commit="${commit.id}"
                 title="${commit.duration.toFixed(2)}ms - ${commit.renders.length} components">
            </div>
          `;
        }).join('')}
      </div>
    `;

    let content = '';
    const selectedCommit = this.commits.find(c => c.id === this.selectedCommit);

    if (selectedCommit) {
      if (this.viewMode === 'flamegraph') {
        content = this.renderFlamegraph(selectedCommit);
      } else if (this.viewMode === 'ranked') {
        content = this.renderRanked(selectedCommit);
      } else {
        content = this.renderTimeline(selectedCommit);
      }
    }

    return timeline + content;
  }

  /**
   * Render flamegraph view
   */
  private renderFlamegraph(commit: CommitInfo): string {
    const maxDuration = Math.max(...commit.renders.map(r => r.actualDuration));

    // Build tree structure
    const roots = commit.renders.filter(r => !r.parentId);

    const renderFlameNode = (render: RenderInfo, depth: number): string => {
      const children = commit.renders.filter(r => r.parentId === render.id);
      const widthPercent = (render.actualDuration / maxDuration) * 100;
      const speedClass = render.actualDuration > 16 ? 'slow' : render.actualDuration > 8 ? 'normal' : 'fast';
      const isSelected = render.id === this.selectedRender;

      return `
        <div class="flame-row" style="padding-left: ${depth * 2}px;">
          <div class="flame-bar ${speedClass} ${isSelected ? 'selected' : ''}"
               style="width: ${Math.max(widthPercent, 5)}%"
               data-render="${render.id}"
               title="${render.componentName}: ${render.actualDuration.toFixed(2)}ms">
            ${render.componentName} (${render.actualDuration.toFixed(1)}ms)
          </div>
        </div>
        ${children.map(c => renderFlameNode(c, depth + 1)).join('')}
      `;
    };

    return `
      <div class="flamegraph">
        ${roots.map(r => renderFlameNode(r, 0)).join('')}
      </div>
    `;
  }

  /**
   * Render ranked view
   */
  private renderRanked(commit: CommitInfo): string {
    const sorted = [...commit.renders].sort((a, b) => b.actualDuration - a.actualDuration);
    const maxDuration = sorted[0]?.actualDuration || 1;

    return `
      <div class="ranked-list">
        ${sorted.map((render, i) => {
          const widthPercent = (render.actualDuration / maxDuration) * 100;
          const speedClass = render.actualDuration > 16 ? 'slow' : render.actualDuration > 8 ? 'normal' : 'fast';
          const isSelected = render.id === this.selectedRender;

          return `
            <div class="ranked-item ${isSelected ? 'selected' : ''}" data-render="${render.id}">
              <span class="ranked-rank">#${i + 1}</span>
              <span class="ranked-name">${render.componentName}</span>
              <span class="ranked-duration">${render.actualDuration.toFixed(2)}ms</span>
              <div class="ranked-bar">
                <div class="ranked-bar-fill flame-bar ${speedClass}" style="width: ${widthPercent}%"></div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  /**
   * Render timeline view
   */
  private renderTimeline(commit: CommitInfo): string {
    const startTime = Math.min(...commit.renders.map(r => r.startTime));
    const endTime = Math.max(...commit.renders.map(r => r.commitTime));
    const totalTime = endTime - startTime || 1;

    return `
      <div class="flamegraph">
        ${commit.renders.map(render => {
          const left = ((render.startTime - startTime) / totalTime) * 100;
          const width = (render.actualDuration / totalTime) * 100;
          const speedClass = render.actualDuration > 16 ? 'slow' : render.actualDuration > 8 ? 'normal' : 'fast';
          const isSelected = render.id === this.selectedRender;

          return `
            <div class="flame-row">
              <div class="flame-bar ${speedClass} ${isSelected ? 'selected' : ''}"
                   style="margin-left: ${left}%; width: ${Math.max(width, 2)}%"
                   data-render="${render.id}"
                   title="${render.componentName}: ${render.actualDuration.toFixed(2)}ms">
                ${render.componentName}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  /**
   * Render details panel
   */
  private renderDetails(): string {
    const commit = this.commits.find(c => c.id === this.selectedCommit);
    const render = commit?.renders.find(r => r.id === this.selectedRender);
    if (!render) return '';

    return `
      <div class="details-panel">
        <h4>${render.componentName}</h4>
        <div class="detail-grid">
          <div class="detail-item">
            <div class="detail-label">Actual Duration</div>
            <div class="detail-value">${render.actualDuration.toFixed(2)}ms</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Base Duration</div>
            <div class="detail-value">${render.baseDuration.toFixed(2)}ms</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Render Phase</div>
            <div class="detail-value">${render.phase}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Render Count</div>
            <div class="detail-value">${render.renderCount}</div>
          </div>
        </div>
        ${render.changedProps?.length || render.changedState?.length ? `
          <div class="why-render">
            <div class="why-render-title">Why did this render?</div>
            ${render.changedProps?.map(prop => `
              <div class="why-render-item">
                <span>📦</span> Props changed: <strong>${prop}</strong>
              </div>
            `).join('') || ''}
            ${render.changedState?.map(state => `
              <div class="why-render-item">
                <span>🔄</span> State changed: <strong>${state}</strong>
              </div>
            `).join('') || ''}
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Attach event listeners
   */
  private attachEventListeners(): void {
    if (!this.container) return;

    // Record toggle
    this.container.querySelector('[data-action="toggle-record"]')?.addEventListener('click', () => {
      this.recording = !this.recording;
      this.onRecordToggle?.();
      this.render();
    });

    // Clear
    this.container.querySelector('[data-action="clear"]')?.addEventListener('click', () => {
      this.clearCommits();
    });

    // View mode
    this.container.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.viewMode = (btn as HTMLElement).dataset.view as any;
        this.render();
      });
    });

    // Commit selection
    this.container.querySelectorAll('.commit-bar').forEach(bar => {
      bar.addEventListener('click', () => {
        const commitId = (bar as HTMLElement).dataset.commit!;
        this.selectedCommit = commitId;
        this.selectedRender = null;
        this.onCommitSelect?.(commitId);
        this.render();
      });
    });

    // Render selection
    this.container.querySelectorAll('[data-render]').forEach(el => {
      el.addEventListener('click', () => {
        const renderId = (el as HTMLElement).dataset.render!;
        this.selectedRender = renderId;
        this.onRenderSelect?.(renderId);
        this.render();
      });
    });
  }
}

export function createProfilerPanel(options?: Partial<ProfilerPanelProps>): ProfilerPanel {
  return new ProfilerPanel(options);
}
