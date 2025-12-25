/**
 * NetworkWaterfallPanel - Resource loading timeline visualization
 *
 * Displays network requests in a waterfall chart showing DNS, connect,
 * TTFB, content download, and total time for each resource.
 */

import { signal, memo, effect } from 'philjs-core';

// ============================================================================
// Types
// ============================================================================

export interface ResourceTiming {
  id: string;
  name: string;
  url: string;
  initiatorType: 'script' | 'link' | 'img' | 'css' | 'fetch' | 'xmlhttprequest' | 'navigation' | 'other';
  startTime: number;
  duration: number;
  transferSize: number;
  encodedBodySize: number;
  decodedBodySize: number;

  // Timing breakdown
  dns: number;        // domainLookupEnd - domainLookupStart
  connect: number;    // connectEnd - connectStart
  ssl: number;        // connectEnd - secureConnectionStart
  ttfb: number;       // responseStart - requestStart
  download: number;   // responseEnd - responseStart

  // Status
  cached: boolean;
  failed: boolean;
  statusCode?: number;
  mimeType?: string;
}

export interface NetworkWaterfallPanelProps {
  resources: ResourceTiming[];
  onResourceSelect?: (resource: ResourceTiming) => void;
  showFilters?: boolean;
  refreshInterval?: number;
  onRefresh?: () => Promise<ResourceTiming[]>;
  className?: string;
}

export interface ResourceGroup {
  type: ResourceTiming['initiatorType'];
  resources: ResourceTiming[];
  totalSize: number;
  totalDuration: number;
  count: number;
}

// ============================================================================
// Styles
// ============================================================================

const styles = {
  panel: `
    background: #0f0f1a;
    border-radius: 12px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    display: flex;
    flex-direction: column;
    height: 100%;
  `,
  header: `
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid #1a1a2e;
  `,
  title: `
    color: #ffffff;
    font-size: 18px;
    font-weight: 600;
  `,
  controls: `
    display: flex;
    gap: 12px;
    align-items: center;
  `,
  searchInput: `
    background: #1a1a2e;
    border: 1px solid #2a2a4a;
    border-radius: 6px;
    color: #e0e0ff;
    padding: 8px 12px;
    font-size: 13px;
    width: 200px;
    outline: none;
  `,
  select: `
    background: #1a1a2e;
    border: 1px solid #2a2a4a;
    border-radius: 6px;
    color: #e0e0ff;
    padding: 8px 12px;
    font-size: 13px;
    cursor: pointer;
    outline: none;
  `,
  button: `
    background: #2a2a4e;
    border: 1px solid #3a3a6e;
    border-radius: 6px;
    color: #e0e0ff;
    padding: 8px 16px;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s ease;
  `,
  statsBar: `
    display: flex;
    gap: 24px;
    padding: 16px 24px;
    background: #1a1a2e;
    border-bottom: 1px solid #2a2a4a;
  `,
  stat: `
    display: flex;
    flex-direction: column;
    gap: 4px;
  `,
  statValue: `
    font-size: 24px;
    font-weight: 700;
    color: #ffffff;
  `,
  statLabel: `
    font-size: 11px;
    color: #6a6a8a;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  `,
  content: `
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  `,
  waterfallContainer: `
    flex: 1;
    overflow-y: auto;
    padding: 0;
  `,
  waterfallHeader: `
    display: flex;
    align-items: center;
    padding: 12px 20px;
    background: #1a1a2e;
    border-bottom: 1px solid #2a2a4a;
    font-size: 11px;
    color: #6a6a8a;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    position: sticky;
    top: 0;
    z-index: 10;
  `,
  headerName: `
    width: 300px;
    flex-shrink: 0;
  `,
  headerSize: `
    width: 80px;
    flex-shrink: 0;
    text-align: right;
  `,
  headerTime: `
    width: 80px;
    flex-shrink: 0;
    text-align: right;
  `,
  headerWaterfall: `
    flex: 1;
    display: flex;
    justify-content: space-between;
    margin-left: 20px;
    position: relative;
  `,
  timeMarker: `
    color: #4a4a6a;
    font-size: 10px;
  `,
  resourceRow: `
    display: flex;
    align-items: center;
    padding: 8px 20px;
    border-bottom: 1px solid #0a0a15;
    cursor: pointer;
    transition: background 0.2s ease;
    min-height: 40px;
  `,
  resourceRowHover: `
    background: rgba(99, 102, 241, 0.05);
  `,
  resourceRowSelected: `
    background: rgba(99, 102, 241, 0.1);
    border-left: 3px solid #6366f1;
    padding-left: 17px;
  `,
  resourceRowFailed: `
    background: rgba(239, 68, 68, 0.05);
  `,
  resourceName: `
    width: 300px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 10px;
  `,
  resourceIcon: `
    width: 20px;
    height: 20px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: 600;
    flex-shrink: 0;
  `,
  resourceUrl: `
    color: #e0e0ff;
    font-size: 13px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
  `,
  resourceSize: `
    width: 80px;
    flex-shrink: 0;
    text-align: right;
    font-size: 12px;
    color: #8a8aaa;
  `,
  resourceTime: `
    width: 80px;
    flex-shrink: 0;
    text-align: right;
    font-size: 12px;
    color: #8a8aaa;
  `,
  resourceWaterfall: `
    flex: 1;
    height: 16px;
    margin-left: 20px;
    position: relative;
  `,
  waterfallBar: `
    position: absolute;
    height: 8px;
    top: 4px;
    border-radius: 2px;
    min-width: 2px;
  `,
  waterfallSegment: `
    position: absolute;
    height: 100%;
    top: 0;
    border-radius: 2px;
  `,
  cachedBadge: `
    font-size: 9px;
    padding: 1px 4px;
    background: #22c55e22;
    color: #22c55e;
    border-radius: 3px;
    margin-left: 6px;
  `,
  failedBadge: `
    font-size: 9px;
    padding: 1px 4px;
    background: #ef444422;
    color: #ef4444;
    border-radius: 3px;
    margin-left: 6px;
  `,
  detailPanel: `
    width: 400px;
    border-left: 1px solid #1a1a2e;
    overflow-y: auto;
    padding: 20px;
    background: #0f0f1a;
  `,
  detailHeader: `
    margin-bottom: 20px;
  `,
  detailTitle: `
    color: #ffffff;
    font-size: 14px;
    font-weight: 600;
    word-break: break-all;
    margin-bottom: 8px;
  `,
  detailUrl: `
    color: #6a6a8a;
    font-size: 12px;
    word-break: break-all;
  `,
  detailSection: `
    margin-bottom: 20px;
  `,
  detailSectionTitle: `
    color: #8a8aaa;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 12px;
  `,
  detailGrid: `
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  `,
  detailItem: `
    display: flex;
    flex-direction: column;
    gap: 4px;
  `,
  detailLabel: `
    color: #6a6a8a;
    font-size: 11px;
  `,
  detailValue: `
    color: #e0e0ff;
    font-size: 13px;
    font-weight: 500;
  `,
  timingBreakdown: `
    display: flex;
    flex-direction: column;
    gap: 8px;
  `,
  timingRow: `
    display: flex;
    align-items: center;
    gap: 12px;
  `,
  timingLabel: `
    width: 80px;
    color: #8a8aaa;
    font-size: 12px;
  `,
  timingBar: `
    flex: 1;
    height: 12px;
    background: #1a1a2e;
    border-radius: 2px;
    overflow: hidden;
  `,
  timingBarFill: `
    height: 100%;
    border-radius: 2px;
  `,
  timingValue: `
    width: 60px;
    text-align: right;
    color: #e0e0ff;
    font-size: 12px;
  `,
  emptyState: `
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    color: #6a6a8a;
    text-align: center;
  `,
  legend: `
    display: flex;
    gap: 16px;
    padding: 12px 24px;
    border-top: 1px solid #1a1a2e;
    font-size: 11px;
  `,
  legendItem: `
    display: flex;
    align-items: center;
    gap: 6px;
    color: #8a8aaa;
  `,
  legendDot: `
    width: 10px;
    height: 10px;
    border-radius: 2px;
  `,
};

// ============================================================================
// Resource Type Colors & Icons
// ============================================================================

const resourceTypeConfig: Record<ResourceTiming['initiatorType'], { color: string; bg: string; icon: string }> = {
  navigation: { color: '#6366f1', bg: '#6366f122', icon: 'N' },
  script: { color: '#f59e0b', bg: '#f59e0b22', icon: 'JS' },
  link: { color: '#3b82f6', bg: '#3b82f622', icon: 'CSS' },
  css: { color: '#3b82f6', bg: '#3b82f622', icon: 'CSS' },
  img: { color: '#22c55e', bg: '#22c55e22', icon: 'IMG' },
  fetch: { color: '#8b5cf6', bg: '#8b5cf622', icon: 'XHR' },
  xmlhttprequest: { color: '#8b5cf6', bg: '#8b5cf622', icon: 'XHR' },
  other: { color: '#6a6a8a', bg: '#6a6a8a22', icon: '?' },
};

const timingColors = {
  dns: '#22c55e',
  connect: '#3b82f6',
  ssl: '#8b5cf6',
  ttfb: '#f59e0b',
  download: '#6366f1',
};

// ============================================================================
// Helper Functions
// ============================================================================

function formatBytes(bytes: number): string {
  if (bytes === 0) return '-';
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
}

function formatDuration(ms: number): string {
  if (ms < 1) return '<1ms';
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function getResourceName(url: string): string {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    const name = path.split('/').filter(Boolean).pop() || urlObj.hostname;
    return name.length > 40 ? name.slice(0, 37) + '...' : name;
  } catch {
    return url.slice(0, 40);
  }
}

function groupResourcesByType(resources: ResourceTiming[]): ResourceGroup[] {
  const groups = new Map<ResourceTiming['initiatorType'], ResourceGroup>();

  for (const resource of resources) {
    if (!groups.has(resource.initiatorType)) {
      groups.set(resource.initiatorType, {
        type: resource.initiatorType,
        resources: [],
        totalSize: 0,
        totalDuration: 0,
        count: 0,
      });
    }

    const group = groups.get(resource.initiatorType)!;
    group.resources.push(resource);
    group.totalSize += resource.transferSize;
    group.totalDuration += resource.duration;
    group.count++;
  }

  return Array.from(groups.values()).sort((a, b) => b.totalSize - a.totalSize);
}

// ============================================================================
// Component
// ============================================================================

export function NetworkWaterfallPanel(props: NetworkWaterfallPanelProps) {
  const {
    resources,
    onResourceSelect,
    showFilters = true,
    refreshInterval = 0,
    onRefresh,
    className = '',
  } = props;

  const currentResources = signal(resources);
  const searchQuery = signal('');
  const typeFilter = signal<ResourceTiming['initiatorType'] | 'all'>('all');
  const selectedResource = signal<ResourceTiming | null>(null);
  const hoveredId = signal<string | null>(null);
  const sortBy = signal<'time' | 'duration' | 'size'>('time');
  const isLoading = signal(false);

  // Auto-refresh
  if (onRefresh && refreshInterval > 0) {
    effect(() => {
      const interval = setInterval(async () => {
        isLoading.set(true);
        try {
          const newResources = await onRefresh();
          currentResources.set(newResources);
        } finally {
          isLoading.set(false);
        }
      }, refreshInterval);

      return () => clearInterval(interval);
    });
  }

  // Filter and sort resources
  const filteredResources = memo(() => {
    let result = currentResources();

    // Filter by type
    if (typeFilter() !== 'all') {
      result = result.filter(r => r.initiatorType === typeFilter());
    }

    // Filter by search
    if (searchQuery()) {
      const query = searchQuery().toLowerCase();
      result = result.filter(r =>
        r.name.toLowerCase().includes(query) ||
        r.url.toLowerCase().includes(query)
      );
    }

    // Sort
    switch (sortBy()) {
      case 'duration':
        return [...result].sort((a, b) => b.duration - a.duration);
      case 'size':
        return [...result].sort((a, b) => b.transferSize - a.transferSize);
      default:
        return [...result].sort((a, b) => a.startTime - b.startTime);
    }
  });

  // Stats
  const stats = memo(() => {
    const all = currentResources();
    const totalSize = all.reduce((sum, r) => sum + r.transferSize, 0);
    const totalDuration = all.length > 0
      ? Math.max(...all.map(r => r.startTime + r.duration)) - Math.min(...all.map(r => r.startTime))
      : 0;
    const cachedCount = all.filter(r => r.cached).length;
    const failedCount = all.filter(r => r.failed).length;

    return {
      totalRequests: all.length,
      totalSize,
      totalDuration,
      cachedCount,
      failedCount,
    };
  });

  // Timeline scale
  const timelineScale = memo(() => {
    const all = filteredResources();
    if (all.length === 0) return { min: 0, max: 1000, markers: [0, 250, 500, 750, 1000] };

    const min = Math.min(...all.map(r => r.startTime));
    const max = Math.max(...all.map(r => r.startTime + r.duration));
    const range = max - min || 1000;

    const markers = [0, 0.25, 0.5, 0.75, 1].map(f => min + f * range);

    return { min, max, range, markers };
  });

  const handleResourceClick = (resource: ResourceTiming) => {
    selectedResource.set(resource);
    onResourceSelect?.(resource);
  };

  const handleRefresh = async () => {
    if (!onRefresh) return;
    isLoading.set(true);
    try {
      const newResources = await onRefresh();
      currentResources.set(newResources);
    } finally {
      isLoading.set(false);
    }
  };

  const renderWaterfallBar = (resource: ResourceTiming) => {
    const scale = timelineScale();
    const range = scale.range || 1;
    const left = ((resource.startTime - scale.min) / range) * 100;
    const width = (resource.duration / range) * 100;

    // Calculate segment widths as percentages of total duration
    const totalTime = resource.duration || 1;
    const segments = [
      { key: 'dns', value: resource.dns, color: timingColors.dns },
      { key: 'connect', value: resource.connect, color: timingColors.connect },
      { key: 'ssl', value: resource.ssl, color: timingColors.ssl },
      { key: 'ttfb', value: resource.ttfb, color: timingColors.ttfb },
      { key: 'download', value: resource.download, color: timingColors.download },
    ];

    let cumulative = 0;

    return (
      <div style={styles.resourceWaterfall}>
        <div
          style={styles.waterfallBar + `left: ${left}%; width: ${Math.max(width, 0.5)}%;`}
        >
          {segments.map(seg => {
            if (seg.value <= 0) return null;
            const segLeft = (cumulative / totalTime) * 100;
            const segWidth = (seg.value / totalTime) * 100;
            cumulative += seg.value;

            return (
              <div
                style={styles.waterfallSegment + `
                  left: ${segLeft}%;
                  width: ${segWidth}%;
                  background: ${seg.color};
                `}
                title={`${seg.key}: ${formatDuration(seg.value)}`}
              />
            );
          })}
        </div>
      </div>
    );
  };

  const renderResourceDetail = (resource: ResourceTiming) => {
    const maxTiming = Math.max(resource.dns, resource.connect, resource.ssl, resource.ttfb, resource.download, 1);

    return (
      <div style={styles.detailPanel}>
        <div style={styles.detailHeader}>
          <div style={styles.detailTitle}>{getResourceName(resource.url)}</div>
          <div style={styles.detailUrl}>{resource.url}</div>
        </div>

        {/* General Info */}
        <div style={styles.detailSection}>
          <div style={styles.detailSectionTitle}>General</div>
          <div style={styles.detailGrid}>
            <div style={styles.detailItem}>
              <span style={styles.detailLabel}>Type</span>
              <span style={styles.detailValue}>{resource.initiatorType}</span>
            </div>
            <div style={styles.detailItem}>
              <span style={styles.detailLabel}>Status</span>
              <span style={styles.detailValue + (resource.failed ? 'color: #ef4444;' : 'color: #22c55e;')}>
                {resource.failed ? 'Failed' : resource.statusCode || 'OK'}
              </span>
            </div>
            <div style={styles.detailItem}>
              <span style={styles.detailLabel}>MIME Type</span>
              <span style={styles.detailValue}>{resource.mimeType || '-'}</span>
            </div>
            <div style={styles.detailItem}>
              <span style={styles.detailLabel}>Cached</span>
              <span style={styles.detailValue}>{resource.cached ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </div>

        {/* Size */}
        <div style={styles.detailSection}>
          <div style={styles.detailSectionTitle}>Size</div>
          <div style={styles.detailGrid}>
            <div style={styles.detailItem}>
              <span style={styles.detailLabel}>Transfer Size</span>
              <span style={styles.detailValue}>{formatBytes(resource.transferSize)}</span>
            </div>
            <div style={styles.detailItem}>
              <span style={styles.detailLabel}>Encoded Size</span>
              <span style={styles.detailValue}>{formatBytes(resource.encodedBodySize)}</span>
            </div>
            <div style={styles.detailItem}>
              <span style={styles.detailLabel}>Decoded Size</span>
              <span style={styles.detailValue}>{formatBytes(resource.decodedBodySize)}</span>
            </div>
            <div style={styles.detailItem}>
              <span style={styles.detailLabel}>Compression</span>
              <span style={styles.detailValue}>
                {resource.encodedBodySize > 0
                  ? `${((1 - resource.encodedBodySize / resource.decodedBodySize) * 100).toFixed(0)}%`
                  : '-'}
              </span>
            </div>
          </div>
        </div>

        {/* Timing Breakdown */}
        <div style={styles.detailSection}>
          <div style={styles.detailSectionTitle}>Timing Breakdown</div>
          <div style={styles.timingBreakdown}>
            {[
              { label: 'DNS', value: resource.dns, color: timingColors.dns },
              { label: 'Connect', value: resource.connect, color: timingColors.connect },
              { label: 'SSL', value: resource.ssl, color: timingColors.ssl },
              { label: 'TTFB', value: resource.ttfb, color: timingColors.ttfb },
              { label: 'Download', value: resource.download, color: timingColors.download },
            ].map(item => (
              <div style={styles.timingRow}>
                <span style={styles.timingLabel}>{item.label}</span>
                <div style={styles.timingBar}>
                  <div
                    style={styles.timingBarFill + `
                      width: ${(item.value / maxTiming) * 100}%;
                      background: ${item.color};
                    `}
                  />
                </div>
                <span style={styles.timingValue}>{formatDuration(item.value)}</span>
              </div>
            ))}
            <div style={styles.timingRow + 'padding-top: 8px; border-top: 1px solid #2a2a4a;'}>
              <span style={styles.timingLabel + 'font-weight: 600;'}>Total</span>
              <div style={styles.timingBar} />
              <span style={styles.timingValue + 'font-weight: 600;'}>{formatDuration(resource.duration)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={styles.panel} class={className}>
      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>Network Waterfall</h2>
        <div style={styles.controls}>
          {showFilters && (
            <>
              <input
                type="text"
                placeholder="Filter resources..."
                style={styles.searchInput}
                value={searchQuery()}
                onInput={(e: InputEvent) => searchQuery.set((e.target as HTMLInputElement).value)}
              />
              <select
                style={styles.select}
                value={typeFilter()}
                onChange={(e: Event) => typeFilter.set((e.target as HTMLSelectElement).value as any)}
              >
                <option value="all">All Types</option>
                <option value="script">Scripts</option>
                <option value="link">Stylesheets</option>
                <option value="img">Images</option>
                <option value="fetch">Fetch/XHR</option>
                <option value="other">Other</option>
              </select>
              <select
                style={styles.select}
                value={sortBy()}
                onChange={(e: Event) => sortBy.set((e.target as HTMLSelectElement).value as any)}
              >
                <option value="time">Sort by Time</option>
                <option value="duration">Sort by Duration</option>
                <option value="size">Sort by Size</option>
              </select>
            </>
          )}
          {onRefresh && (
            <button style={styles.button} onClick={handleRefresh} disabled={isLoading()}>
              {isLoading() ? 'Loading...' : 'Refresh'}
            </button>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      <div style={styles.statsBar}>
        <div style={styles.stat}>
          <span style={styles.statValue}>{stats().totalRequests}</span>
          <span style={styles.statLabel}>Requests</span>
        </div>
        <div style={styles.stat}>
          <span style={styles.statValue}>{formatBytes(stats().totalSize)}</span>
          <span style={styles.statLabel}>Transferred</span>
        </div>
        <div style={styles.stat}>
          <span style={styles.statValue}>{formatDuration(stats().totalDuration)}</span>
          <span style={styles.statLabel}>Total Time</span>
        </div>
        <div style={styles.stat}>
          <span style={styles.statValue + 'color: #22c55e;'}>{stats().cachedCount}</span>
          <span style={styles.statLabel}>Cached</span>
        </div>
        {stats().failedCount > 0 && (
          <div style={styles.stat}>
            <span style={styles.statValue + 'color: #ef4444;'}>{stats().failedCount}</span>
            <span style={styles.statLabel}>Failed</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div style={styles.content}>
        <div style="display: flex; flex: 1; overflow: hidden;">
          {/* Waterfall */}
          <div style={styles.waterfallContainer + 'flex: 1;'}>
            {/* Header */}
            <div style={styles.waterfallHeader}>
              <div style={styles.headerName}>Name</div>
              <div style={styles.headerSize}>Size</div>
              <div style={styles.headerTime}>Time</div>
              <div style={styles.headerWaterfall}>
                {timelineScale().markers.map((time, i) => (
                  <span style={styles.timeMarker}>
                    {formatDuration(time)}
                  </span>
                ))}
              </div>
            </div>

            {/* Resources */}
            {filteredResources().length === 0 ? (
              <div style={styles.emptyState}>
                <div style="font-size: 16px; margin-bottom: 8px; color: #8a8aaa;">
                  No resources to display
                </div>
                <div style="font-size: 13px;">
                  {searchQuery() ? 'Try adjusting your search or filters' : 'Network resources will appear here'}
                </div>
              </div>
            ) : (
              filteredResources().map(resource => {
                const config = resourceTypeConfig[resource.initiatorType];
                const isHovered = hoveredId() === resource.id;
                const isSelected = selectedResource()?.id === resource.id;

                return (
                  <div
                    style={styles.resourceRow +
                      (isHovered ? styles.resourceRowHover : '') +
                      (isSelected ? styles.resourceRowSelected : '') +
                      (resource.failed ? styles.resourceRowFailed : '')}
                    onClick={() => handleResourceClick(resource)}
                    onMouseEnter={() => hoveredId.set(resource.id)}
                    onMouseLeave={() => hoveredId.set(null)}
                  >
                    <div style={styles.resourceName}>
                      <span
                        style={styles.resourceIcon + `background: ${config.bg}; color: ${config.color};`}
                      >
                        {config.icon}
                      </span>
                      <span style={styles.resourceUrl} title={resource.url}>
                        {getResourceName(resource.url)}
                      </span>
                      {resource.cached && <span style={styles.cachedBadge}>cached</span>}
                      {resource.failed && <span style={styles.failedBadge}>failed</span>}
                    </div>
                    <div style={styles.resourceSize}>{formatBytes(resource.transferSize)}</div>
                    <div style={styles.resourceTime}>{formatDuration(resource.duration)}</div>
                    {renderWaterfallBar(resource)}
                  </div>
                );
              })
            )}
          </div>

          {/* Detail Panel */}
          {selectedResource() && renderResourceDetail(selectedResource()!)}
        </div>
      </div>

      {/* Legend */}
      <div style={styles.legend}>
        {Object.entries(timingColors).map(([key, color]) => (
          <div style={styles.legendItem}>
            <span style={styles.legendDot + `background: ${color};`} />
            <span>{key.toUpperCase()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default NetworkWaterfallPanel;
