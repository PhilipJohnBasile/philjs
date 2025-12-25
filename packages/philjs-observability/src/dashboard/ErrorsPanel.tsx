/**
 * ErrorsPanel - Error tracking panel
 *
 * Displays captured errors with grouping, stack traces,
 * and trend analysis.
 */

import { signal, memo } from 'philjs-core';
import { Sparkline } from '../charts/Sparkline';
import { TimeSeriesChart, type TimeSeries } from '../charts/TimeSeriesChart';

// ============================================================================
// Types
// ============================================================================

export interface TrackedError {
  id: string;
  type: string;
  message: string;
  stack?: string;
  timestamp: Date;
  count: number;
  firstSeen: Date;
  lastSeen: Date;
  context?: Record<string, any>;
  user?: {
    id: string;
    email?: string;
  };
  tags?: Record<string, string>;
  resolved?: boolean;
  occurrences: number[];
}

export interface ErrorGroup {
  fingerprint: string;
  type: string;
  message: string;
  errors: TrackedError[];
  totalCount: number;
  firstSeen: Date;
  lastSeen: Date;
  trend: number[];
  isNew: boolean;
  isRegression: boolean;
}

export interface ErrorsPanelProps {
  errors: TrackedError[];
  onErrorSelect?: (error: TrackedError) => void;
  onResolve?: (errorId: string) => void;
  onIgnore?: (errorId: string) => void;
  showFilters?: boolean;
  className?: string;
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
    width: 250px;
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
    display: flex;
    flex: 1;
    overflow: hidden;
  `,
  errorList: `
    width: 450px;
    border-right: 1px solid #1a1a2e;
    overflow-y: auto;
  `,
  errorItem: `
    padding: 16px 20px;
    border-bottom: 1px solid #1a1a2e;
    cursor: pointer;
    transition: background 0.2s ease;
  `,
  errorItemHover: `
    background: rgba(239, 68, 68, 0.05);
  `,
  errorItemActive: `
    background: rgba(239, 68, 68, 0.1);
    border-left: 3px solid #ef4444;
    padding-left: 17px;
  `,
  errorItemResolved: `
    opacity: 0.5;
  `,
  errorHeader: `
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 8px;
  `,
  errorType: `
    color: #ef4444;
    font-size: 13px;
    font-weight: 600;
  `,
  errorCount: `
    background: #4a1515;
    color: #f87171;
    font-size: 11px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 10px;
  `,
  errorMessage: `
    color: #e0e0ff;
    font-size: 13px;
    margin-bottom: 12px;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  `,
  errorMeta: `
    display: flex;
    justify-content: space-between;
    align-items: center;
  `,
  errorMetaLeft: `
    display: flex;
    gap: 12px;
    font-size: 11px;
    color: #6a6a8a;
  `,
  errorBadge: `
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: 600;
    text-transform: uppercase;
  `,
  errorBadgeNew: `
    background: #1e3a5f;
    color: #60a5fa;
  `,
  errorBadgeRegression: `
    background: #5c1a5c;
    color: #e879f9;
  `,
  errorDetail: `
    flex: 1;
    overflow-y: auto;
    padding: 24px;
  `,
  detailEmpty: `
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #6a6a8a;
    text-align: center;
  `,
  detailHeader: `
    margin-bottom: 24px;
  `,
  detailType: `
    color: #ef4444;
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 8px;
  `,
  detailMessage: `
    color: #ffffff;
    font-size: 18px;
    font-weight: 600;
    line-height: 1.4;
    margin-bottom: 16px;
  `,
  detailMeta: `
    display: flex;
    gap: 24px;
    flex-wrap: wrap;
  `,
  detailMetaItem: `
    display: flex;
    flex-direction: column;
    gap: 4px;
  `,
  detailMetaLabel: `
    font-size: 10px;
    color: #6a6a8a;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  `,
  detailMetaValue: `
    font-size: 13px;
    color: #e0e0ff;
    font-weight: 500;
  `,
  detailActions: `
    display: flex;
    gap: 8px;
    margin-top: 16px;
  `,
  detailButton: `
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
  `,
  detailButtonPrimary: `
    background: #22c55e;
    color: #ffffff;
  `,
  detailButtonSecondary: `
    background: #2a2a4e;
    color: #e0e0ff;
    border: 1px solid #3a3a6e;
  `,
  section: `
    margin-top: 24px;
    padding: 20px;
    background: #1a1a2e;
    border-radius: 12px;
  `,
  sectionTitle: `
    color: #ffffff;
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 16px;
  `,
  stackTrace: `
    font-family: 'SF Mono', 'Monaco', monospace;
    font-size: 12px;
    line-height: 1.6;
    color: #a0a0c0;
    white-space: pre-wrap;
    word-break: break-all;
    max-height: 300px;
    overflow-y: auto;
    padding: 16px;
    background: #0f0f1a;
    border-radius: 8px;
  `,
  stackLine: `
    display: block;
    padding: 2px 0;
  `,
  stackLineHighlight: `
    background: rgba(239, 68, 68, 0.1);
    color: #f87171;
  `,
  contextGrid: `
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  `,
  contextItem: `
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 12px;
    background: #0f0f1a;
    border-radius: 6px;
  `,
  contextKey: `
    font-size: 11px;
    color: #6a6a8a;
    text-transform: uppercase;
  `,
  contextValue: `
    font-size: 13px;
    color: #e0e0ff;
    word-break: break-all;
  `,
  tags: `
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  `,
  tag: `
    padding: 4px 10px;
    background: #2a2a4e;
    border-radius: 4px;
    font-size: 11px;
    color: #a0a0c0;
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
};

// ============================================================================
// Helper Functions
// ============================================================================

function groupErrors(errors: TrackedError[]): ErrorGroup[] {
  const groups = new Map<string, ErrorGroup>();

  for (const error of errors) {
    const fingerprint = `${error.type}:${error.message.slice(0, 100)}`;

    if (!groups.has(fingerprint)) {
      const now = Date.now();
      const dayAgo = now - 24 * 60 * 60 * 1000;
      const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

      groups.set(fingerprint, {
        fingerprint,
        type: error.type,
        message: error.message,
        errors: [],
        totalCount: 0,
        firstSeen: error.firstSeen,
        lastSeen: error.lastSeen,
        trend: [],
        isNew: error.firstSeen.getTime() > dayAgo,
        isRegression: false, // Would be calculated from historical data
      });
    }

    const group = groups.get(fingerprint)!;
    group.errors.push(error);
    group.totalCount += error.count;
    if (error.firstSeen < group.firstSeen) group.firstSeen = error.firstSeen;
    if (error.lastSeen > group.lastSeen) group.lastSeen = error.lastSeen;
    group.trend.push(...error.occurrences);
  }

  return Array.from(groups.values()).sort((a, b) => b.lastSeen.getTime() - a.lastSeen.getTime());
}

function formatTimeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  return date.toLocaleDateString();
}

function parseStackTrace(stack?: string): { file: string; line: string; isApp: boolean }[] {
  if (!stack) return [];

  return stack.split('\n')
    .filter(line => line.includes('at '))
    .map(line => {
      const match = line.match(/at (.+) \((.+):(\d+):\d+\)/) ||
                   line.match(/at (.+):(\d+):\d+/);
      if (match) {
        return {
          file: match[2] || match[1],
          line: match[3] || match[2],
          isApp: !line.includes('node_modules'),
        };
      }
      return { file: line.trim(), line: '', isApp: false };
    });
}

// ============================================================================
// Component
// ============================================================================

export function ErrorsPanel(props: ErrorsPanelProps) {
  const {
    errors,
    onErrorSelect,
    onResolve,
    onIgnore,
    showFilters = true,
    className = '',
  } = props;

  const searchQuery = signal('');
  const statusFilter = signal<'all' | 'unresolved' | 'resolved'>('unresolved');
  const selectedError = signal<TrackedError | null>(null);
  const hoveredFingerprint = signal<string | null>(null);

  // Group and filter errors
  const filteredGroups = memo(() => {
    let result = errors;

    // Filter by status
    if (statusFilter() === 'unresolved') {
      result = result.filter(e => !e.resolved);
    } else if (statusFilter() === 'resolved') {
      result = result.filter(e => e.resolved);
    }

    // Filter by search
    if (searchQuery()) {
      const query = searchQuery().toLowerCase();
      result = result.filter(e =>
        e.type.toLowerCase().includes(query) ||
        e.message.toLowerCase().includes(query) ||
        e.stack?.toLowerCase().includes(query)
      );
    }

    return groupErrors(result);
  });

  // Stats
  const stats = memo(() => {
    const unresolved = errors.filter(e => !e.resolved);
    const last24h = errors.filter(e => Date.now() - e.lastSeen.getTime() < 86400000);
    const totalCount = errors.reduce((sum, e) => sum + e.count, 0);

    return {
      totalErrors: unresolved.length,
      totalOccurrences: totalCount,
      last24h: last24h.reduce((sum, e) => sum + e.count, 0),
      criticalCount: unresolved.filter(e => e.count > 100).length,
    };
  });

  const handleErrorClick = (error: TrackedError) => {
    selectedError.set(error);
    onErrorSelect?.(error);
  };

  const handleResolve = (errorId: string) => {
    onResolve?.(errorId);
    selectedError.set(null);
  };

  const handleIgnore = (errorId: string) => {
    onIgnore?.(errorId);
    selectedError.set(null);
  };

  return (
    <div style={styles.panel} class={className}>
      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>Errors</h2>
        <div style={styles.controls}>
          {showFilters && (
            <>
              <input
                type="text"
                placeholder="Search errors..."
                style={styles.searchInput}
                value={searchQuery()}
                onInput={(e: InputEvent) => searchQuery.set((e.target as HTMLInputElement).value)}
              />
              <select
                style={styles.select}
                value={statusFilter()}
                onChange={(e: Event) => statusFilter.set((e.target as HTMLSelectElement).value as any)}
              >
                <option value="all">All Errors</option>
                <option value="unresolved">Unresolved</option>
                <option value="resolved">Resolved</option>
              </select>
            </>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      <div style={styles.statsBar}>
        <div style={styles.stat}>
          <span style={styles.statValue + 'color: #ef4444;'}>{stats().totalErrors}</span>
          <span style={styles.statLabel}>Unresolved</span>
        </div>
        <div style={styles.stat}>
          <span style={styles.statValue}>{stats().totalOccurrences}</span>
          <span style={styles.statLabel}>Total Occurrences</span>
        </div>
        <div style={styles.stat}>
          <span style={styles.statValue + 'color: #f59e0b;'}>{stats().last24h}</span>
          <span style={styles.statLabel}>Last 24h</span>
        </div>
        <div style={styles.stat}>
          <span style={styles.statValue + 'color: #ef4444;'}>{stats().criticalCount}</span>
          <span style={styles.statLabel}>Critical</span>
        </div>
      </div>

      {/* Content */}
      <div style={styles.content}>
        {/* Error List */}
        <div style={styles.errorList}>
          {filteredGroups().length === 0 ? (
            <div style={styles.emptyState}>
              <div style="font-size: 16px; margin-bottom: 8px; color: #22c55e;">
                No errors found
              </div>
              <div style="font-size: 13px;">
                {searchQuery() ? 'Try adjusting your search' : 'Your application is running smoothly'}
              </div>
            </div>
          ) : (
            filteredGroups().map(group => {
              const latestError = group.errors[0];
              const isHovered = hoveredFingerprint() === group.fingerprint;
              const isSelected = selectedError()?.id === latestError.id;

              return (
                <div
                  style={styles.errorItem +
                    (isHovered ? styles.errorItemHover : '') +
                    (isSelected ? styles.errorItemActive : '') +
                    (latestError.resolved ? styles.errorItemResolved : '')}
                  onClick={() => handleErrorClick(latestError)}
                  onMouseEnter={() => hoveredFingerprint.set(group.fingerprint)}
                  onMouseLeave={() => hoveredFingerprint.set(null)}
                >
                  <div style={styles.errorHeader}>
                    <span style={styles.errorType}>{group.type}</span>
                    <span style={styles.errorCount}>{group.totalCount}x</span>
                  </div>
                  <div style={styles.errorMessage}>{group.message}</div>
                  <div style={styles.errorMeta}>
                    <div style={styles.errorMetaLeft}>
                      <span>{formatTimeAgo(group.lastSeen)}</span>
                      <span>{group.errors.length} events</span>
                    </div>
                    <div style="display: flex; gap: 4px;">
                      {group.isNew && (
                        <span style={styles.errorBadge + styles.errorBadgeNew}>New</span>
                      )}
                      {group.isRegression && (
                        <span style={styles.errorBadge + styles.errorBadgeRegression}>Regression</span>
                      )}
                    </div>
                  </div>
                  {group.trend.length > 0 && (
                    <div style="margin-top: 12px;">
                      <Sparkline
                        data={group.trend.slice(-20)}
                        width={180}
                        height={24}
                        color="#ef4444"
                        showArea={true}
                      />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Error Detail */}
        <div style={styles.errorDetail}>
          {!selectedError() ? (
            <div style={styles.detailEmpty}>
              <div style="font-size: 16px; margin-bottom: 8px; color: #8a8aaa;">
                Select an error to view details
              </div>
              <div style="font-size: 13px;">
                Click on an error from the list to see its stack trace and context
              </div>
            </div>
          ) : (
            <>
              {/* Detail Header */}
              <div style={styles.detailHeader}>
                <div style={styles.detailType}>{selectedError()!.type}</div>
                <div style={styles.detailMessage}>{selectedError()!.message}</div>
                <div style={styles.detailMeta}>
                  <div style={styles.detailMetaItem}>
                    <span style={styles.detailMetaLabel}>Occurrences</span>
                    <span style={styles.detailMetaValue}>{selectedError()!.count}</span>
                  </div>
                  <div style={styles.detailMetaItem}>
                    <span style={styles.detailMetaLabel}>First Seen</span>
                    <span style={styles.detailMetaValue}>{selectedError()!.firstSeen.toLocaleDateString()}</span>
                  </div>
                  <div style={styles.detailMetaItem}>
                    <span style={styles.detailMetaLabel}>Last Seen</span>
                    <span style={styles.detailMetaValue}>{formatTimeAgo(selectedError()!.lastSeen)}</span>
                  </div>
                  {selectedError()!.user && (
                    <div style={styles.detailMetaItem}>
                      <span style={styles.detailMetaLabel}>Affected User</span>
                      <span style={styles.detailMetaValue}>
                        {selectedError()!.user!.email || selectedError()!.user!.id}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div style={styles.detailActions}>
                  {!selectedError()!.resolved && onResolve && (
                    <button
                      style={styles.detailButton + styles.detailButtonPrimary}
                      onClick={() => handleResolve(selectedError()!.id)}
                    >
                      Mark Resolved
                    </button>
                  )}
                  {onIgnore && (
                    <button
                      style={styles.detailButton + styles.detailButtonSecondary}
                      onClick={() => handleIgnore(selectedError()!.id)}
                    >
                      Ignore
                    </button>
                  )}
                </div>
              </div>

              {/* Stack Trace */}
              {selectedError()!.stack && (
                <div style={styles.section}>
                  <div style={styles.sectionTitle}>Stack Trace</div>
                  <div style={styles.stackTrace}>
                    {selectedError()!.stack!.split('\n').map((line, i) => {
                      const isAppCode = !line.includes('node_modules') && line.includes('at ');
                      return (
                        <span style={styles.stackLine + (isAppCode ? styles.stackLineHighlight : '')}>
                          {line}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Context */}
              {selectedError()!.context && Object.keys(selectedError()!.context!).length > 0 && (
                <div style={styles.section}>
                  <div style={styles.sectionTitle}>Context</div>
                  <div style={styles.contextGrid}>
                    {Object.entries(selectedError()!.context!).map(([key, value]) => (
                      <div style={styles.contextItem}>
                        <span style={styles.contextKey}>{key}</span>
                        <span style={styles.contextValue}>
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {selectedError()!.tags && Object.keys(selectedError()!.tags!).length > 0 && (
                <div style={styles.section}>
                  <div style={styles.sectionTitle}>Tags</div>
                  <div style={styles.tags}>
                    {Object.entries(selectedError()!.tags!).map(([key, value]) => (
                      <span style={styles.tag}>{key}: {value}</span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ErrorsPanel;
