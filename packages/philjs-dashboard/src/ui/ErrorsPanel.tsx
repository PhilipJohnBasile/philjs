/**
 * Errors Panel Component
 * Displays error list, details, and grouping
 */

import React, { useState, useMemo, useCallback } from 'react';
import type { CapturedError, ErrorGroup, StackFrame, Breadcrumb } from '../collector/errors';
import { useDashboard } from './Dashboard';

// ============================================================================
// Types
// ============================================================================

export interface ErrorsPanelProps {
  /** Override errors from context */
  errors?: CapturedError[];
  /** Override error groups from context */
  errorGroups?: ErrorGroup[];
  /** View mode */
  viewMode?: 'list' | 'grouped';
  /** Maximum errors to display */
  maxErrors?: number;
  /** Custom className */
  className?: string;
  /** On error click callback */
  onErrorClick?: (error: CapturedError) => void;
}

export type ErrorSeverity = 'error' | 'warning' | 'info';

// ============================================================================
// Styles
// ============================================================================

const styles = {
  panel: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: '16px',
    fontWeight: 600,
    color: 'var(--dashboard-text, #333)',
  },
  controls: {
    display: 'flex',
    gap: '12px',
  },
  input: {
    padding: '8px 12px',
    border: '1px solid var(--dashboard-border, #e0e0e0)',
    borderRadius: '6px',
    fontSize: '14px',
    width: '200px',
  },
  toggleButton: {
    padding: '8px 16px',
    border: '1px solid var(--dashboard-border, #e0e0e0)',
    borderRadius: '6px',
    backgroundColor: 'var(--dashboard-input-bg, #fff)',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
  },
  toggleButtonActive: {
    backgroundColor: 'var(--dashboard-primary, #3b82f6)',
    color: '#fff',
    borderColor: 'var(--dashboard-primary, #3b82f6)',
  },
  list: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  errorCard: {
    backgroundColor: 'var(--dashboard-card-bg, #fff)',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    overflow: 'hidden',
    cursor: 'pointer',
    borderLeft: '4px solid #ef4444',
    transition: 'box-shadow 0.2s ease',
  },
  errorHeader: {
    padding: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  errorTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#ef4444',
    marginBottom: '4px',
  },
  errorMessage: {
    fontSize: '13px',
    color: 'var(--dashboard-text, #333)',
    wordBreak: 'break-word' as const,
  },
  errorMeta: {
    display: 'flex',
    gap: '16px',
    fontSize: '12px',
    color: 'var(--dashboard-text-secondary, #666)',
    marginTop: '8px',
  },
  badge: {
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 600,
    backgroundColor: '#fef2f2',
    color: '#ef4444',
  },
  groupCard: {
    backgroundColor: 'var(--dashboard-card-bg, #fff)',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    overflow: 'hidden',
    borderLeft: '4px solid #ef4444',
  },
  groupHeader: {
    padding: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    cursor: 'pointer',
  },
  groupStats: {
    display: 'flex',
    gap: '24px',
    fontSize: '12px',
    color: 'var(--dashboard-text-secondary, #666)',
  },
  statValue: {
    fontSize: '20px',
    fontWeight: 700,
    color: 'var(--dashboard-text, #333)',
  },
  statLabel: {
    fontSize: '11px',
    textTransform: 'uppercase' as const,
  },
  detail: {
    backgroundColor: 'var(--dashboard-card-bg, #fff)',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    overflow: 'hidden',
  },
  detailHeader: {
    padding: '16px',
    borderBottom: '1px solid var(--dashboard-border, #e0e0e0)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  detailTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#ef4444',
    marginBottom: '8px',
  },
  closeButton: {
    padding: '4px 12px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: 'var(--dashboard-bg, #f5f5f5)',
    cursor: 'pointer',
    fontSize: '12px',
  },
  section: {
    padding: '16px',
    borderBottom: '1px solid var(--dashboard-border, #e0e0e0)',
  },
  sectionTitle: {
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--dashboard-text-secondary, #666)',
    textTransform: 'uppercase' as const,
    marginBottom: '12px',
  },
  stackTrace: {
    fontFamily: 'monospace',
    fontSize: '12px',
    lineHeight: 1.6,
  },
  stackFrame: {
    padding: '8px',
    borderRadius: '4px',
    marginBottom: '4px',
    backgroundColor: 'var(--dashboard-bg, #f5f5f5)',
  },
  stackFrameInApp: {
    backgroundColor: '#fef3c7',
  },
  stackFunction: {
    fontWeight: 600,
    color: 'var(--dashboard-text, #333)',
  },
  stackLocation: {
    color: 'var(--dashboard-text-secondary, #666)',
  },
  breadcrumb: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '8px 0',
    borderBottom: '1px solid var(--dashboard-border, #e0e0e0)',
  },
  breadcrumbTime: {
    fontSize: '11px',
    color: 'var(--dashboard-text-secondary, #666)',
    width: '60px',
    flexShrink: 0,
  },
  breadcrumbIcon: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '10px',
    flexShrink: 0,
  },
  breadcrumbContent: {
    flex: 1,
    fontSize: '13px',
  },
  noData: {
    padding: '40px',
    textAlign: 'center' as const,
    color: 'var(--dashboard-text-secondary, #666)',
    backgroundColor: 'var(--dashboard-card-bg, #fff)',
    borderRadius: '8px',
  },
  contextPre: {
    margin: 0,
    padding: '12px',
    backgroundColor: 'var(--dashboard-bg, #f5f5f5)',
    borderRadius: '4px',
    fontSize: '12px',
    overflow: 'auto',
    fontFamily: 'monospace',
  },
};

// ============================================================================
// Utility Functions
// ============================================================================

function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}

function getBreadcrumbColor(type: Breadcrumb['type']): string {
  const colors: Record<Breadcrumb['type'], string> = {
    navigation: '#3b82f6',
    click: '#8b5cf6',
    console: '#f59e0b',
    xhr: '#22c55e',
    fetch: '#22c55e',
    dom: '#06b6d4',
    custom: '#6b7280',
  };
  return colors[type] || '#6b7280';
}

function getBreadcrumbIcon(type: Breadcrumb['type']): string {
  const icons: Record<Breadcrumb['type'], string> = {
    navigation: 'N',
    click: 'C',
    console: 'L',
    xhr: 'X',
    fetch: 'F',
    dom: 'D',
    custom: '*',
  };
  return icons[type] || '*';
}

// ============================================================================
// Sub-components
// ============================================================================

interface StackTraceViewProps {
  frames: StackFrame[];
}

function StackTraceView({ frames }: StackTraceViewProps): JSX.Element {
  if (frames.length === 0) {
    return <div style={{ color: '#666' }}>No stack trace available</div>;
  }

  return (
    <div style={styles.stackTrace}>
      {frames.map((frame, index) => (
        <div
          key={index}
          style={{
            ...styles.stackFrame,
            ...(frame.inApp ? styles.stackFrameInApp : {}),
          }}
        >
          <div style={styles.stackFunction}>
            {frame.functionName || '<anonymous>'}
          </div>
          <div style={styles.stackLocation}>
            {frame.fileName}
            {frame.lineNumber !== null && `:${frame.lineNumber}`}
            {frame.columnNumber !== null && `:${frame.columnNumber}`}
          </div>
        </div>
      ))}
    </div>
  );
}

interface BreadcrumbsViewProps {
  breadcrumbs: Breadcrumb[];
}

function BreadcrumbsView({ breadcrumbs }: BreadcrumbsViewProps): JSX.Element {
  if (breadcrumbs.length === 0) {
    return <div style={{ color: '#666' }}>No breadcrumbs recorded</div>;
  }

  const sortedBreadcrumbs = [...breadcrumbs].sort(
    (a, b) => b.timestamp - a.timestamp
  );

  return (
    <div>
      {sortedBreadcrumbs.map((crumb, index) => (
        <div key={index} style={styles.breadcrumb}>
          <div style={styles.breadcrumbTime}>
            {formatRelativeTime(crumb.timestamp)}
          </div>
          <div
            style={{
              ...styles.breadcrumbIcon,
              backgroundColor: getBreadcrumbColor(crumb.type),
              color: '#fff',
            }}
          >
            {getBreadcrumbIcon(crumb.type)}
          </div>
          <div style={styles.breadcrumbContent}>
            <div style={{ fontWeight: 500 }}>{crumb.category}</div>
            <div style={{ color: '#666' }}>{crumb.message}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

interface ErrorDetailProps {
  error: CapturedError;
  onClose: () => void;
}

function ErrorDetail({ error, onClose }: ErrorDetailProps): JSX.Element {
  return (
    <div style={styles.detail}>
      <div style={styles.detailHeader}>
        <div>
          <div style={styles.detailTitle}>{error.error.name}</div>
          <div style={styles.errorMessage}>{error.error.message}</div>
          <div style={styles.errorMeta}>
            <span>{formatTimestamp(error.timestamp)}</span>
            <span>{error.url}</span>
          </div>
        </div>
        <button style={styles.closeButton} onClick={onClose}>
          Close
        </button>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>Stack Trace</div>
        <StackTraceView frames={error.error.stack} />
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>
          Breadcrumbs ({error.breadcrumbs.length})
        </div>
        <BreadcrumbsView breadcrumbs={error.breadcrumbs} />
      </div>

      {error.context && Object.keys(error.context).length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Context</div>
          <pre style={styles.contextPre}>
            {JSON.stringify(error.context, null, 2)}
          </pre>
        </div>
      )}

      {Object.keys(error.tags).length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Tags</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
            {Object.entries(error.tags).map(([key, value]) => (
              <span
                key={key}
                style={{
                  padding: '4px 8px',
                  backgroundColor: 'var(--dashboard-bg, #f5f5f5)',
                  borderRadius: '4px',
                  fontSize: '12px',
                }}
              >
                <strong>{key}:</strong> {value}
              </span>
            ))}
          </div>
        </div>
      )}

      {error.user && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>User</div>
          <pre style={styles.contextPre}>
            {JSON.stringify(error.user, null, 2)}
          </pre>
        </div>
      )}

      <div style={{ ...styles.section, borderBottom: 'none' }}>
        <div style={styles.sectionTitle}>Additional Info</div>
        <table style={{ fontSize: '13px' }}>
          <tbody>
            <tr>
              <td style={{ padding: '4px 16px 4px 0', fontWeight: 500 }}>Error ID</td>
              <td style={{ fontFamily: 'monospace' }}>{error.id}</td>
            </tr>
            <tr>
              <td style={{ padding: '4px 16px 4px 0', fontWeight: 500 }}>Fingerprint</td>
              <td style={{ fontFamily: 'monospace' }}>{error.fingerprint}</td>
            </tr>
            {error.release && (
              <tr>
                <td style={{ padding: '4px 16px 4px 0', fontWeight: 500 }}>Release</td>
                <td>{error.release}</td>
              </tr>
            )}
            {error.environment && (
              <tr>
                <td style={{ padding: '4px 16px 4px 0', fontWeight: 500 }}>Environment</td>
                <td>{error.environment}</td>
              </tr>
            )}
            {error.traceId && (
              <tr>
                <td style={{ padding: '4px 16px 4px 0', fontWeight: 500 }}>Trace ID</td>
                <td style={{ fontFamily: 'monospace' }}>{error.traceId}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface ErrorCardProps {
  error: CapturedError;
  onClick: () => void;
}

function ErrorCard({ error, onClick }: ErrorCardProps): JSX.Element {
  return (
    <div style={styles.errorCard} onClick={onClick}>
      <div style={styles.errorHeader}>
        <div style={{ flex: 1 }}>
          <div style={styles.errorTitle}>{error.error.name}</div>
          <div style={styles.errorMessage}>{error.error.message}</div>
          <div style={styles.errorMeta}>
            <span>{formatRelativeTime(error.timestamp)}</span>
            <span>{error.url}</span>
          </div>
        </div>
        {error.environment && (
          <span style={styles.badge}>{error.environment}</span>
        )}
      </div>
    </div>
  );
}

interface ErrorGroupCardProps {
  group: ErrorGroup;
  isExpanded: boolean;
  onToggle: () => void;
  errors: CapturedError[];
  onErrorClick: (error: CapturedError) => void;
}

function ErrorGroupCard({
  group,
  isExpanded,
  onToggle,
  errors,
  onErrorClick,
}: ErrorGroupCardProps): JSX.Element {
  const groupErrors = errors.filter((e) => e.fingerprint === group.fingerprint);

  return (
    <div style={styles.groupCard}>
      <div style={styles.groupHeader} onClick={onToggle}>
        <div style={{ flex: 1 }}>
          <div style={styles.errorTitle}>{group.name}</div>
          <div style={styles.errorMessage}>{group.message}</div>
        </div>
        <div style={styles.groupStats}>
          <div style={{ textAlign: 'center' as const }}>
            <div style={styles.statValue}>{group.count}</div>
            <div style={styles.statLabel}>Events</div>
          </div>
          <div style={{ textAlign: 'center' as const }}>
            <div style={styles.statValue}>{group.usersAffected}</div>
            <div style={styles.statLabel}>Users</div>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div style={{ padding: '0 16px 16px' }}>
          <div style={styles.errorMeta}>
            <span>First seen: {formatRelativeTime(group.firstSeen)}</span>
            <span>Last seen: {formatRelativeTime(group.lastSeen)}</span>
          </div>
          <div style={{ marginTop: '16px' }}>
            <div style={styles.sectionTitle}>Recent occurrences</div>
            {groupErrors.slice(0, 5).map((error) => (
              <ErrorCard
                key={error.id}
                error={error}
                onClick={() => onErrorClick(error)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function ErrorsPanel({
  errors: propErrors,
  errorGroups: propGroups,
  viewMode: initialViewMode = 'list',
  maxErrors = 100,
  className,
  onErrorClick,
}: ErrorsPanelProps): JSX.Element {
  const dashboardContext = useDashboard();
  const allErrors = propErrors ?? dashboardContext?.data.errors ?? [];
  const allGroups = propGroups ?? dashboardContext?.data.errorGroups ?? [];

  const [viewMode, setViewMode] = useState<'list' | 'grouped'>(initialViewMode);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedError, setSelectedError] = useState<CapturedError | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const filteredErrors = useMemo(() => {
    if (!searchQuery) return allErrors.slice(0, maxErrors);

    const query = searchQuery.toLowerCase();
    return allErrors
      .filter(
        (error) =>
          error.error.name.toLowerCase().includes(query) ||
          error.error.message.toLowerCase().includes(query) ||
          error.url.toLowerCase().includes(query)
      )
      .slice(0, maxErrors);
  }, [allErrors, searchQuery, maxErrors]);

  const filteredGroups = useMemo(() => {
    if (!searchQuery) return allGroups;

    const query = searchQuery.toLowerCase();
    return allGroups.filter(
      (group) =>
        group.name.toLowerCase().includes(query) ||
        group.message.toLowerCase().includes(query)
    );
  }, [allGroups, searchQuery]);

  const handleErrorClick = useCallback(
    (error: CapturedError) => {
      setSelectedError(error);
      onErrorClick?.(error);
    },
    [onErrorClick]
  );

  const toggleGroup = useCallback((fingerprint: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(fingerprint)) {
        next.delete(fingerprint);
      } else {
        next.add(fingerprint);
      }
      return next;
    });
  }, []);

  if (allErrors.length === 0) {
    return (
      <div className={className} style={styles.panel}>
        <div style={styles.noData}>
          No errors captured. Errors will appear here when they occur.
        </div>
      </div>
    );
  }

  return (
    <div className={className} style={styles.panel}>
      <div style={styles.header}>
        <span style={styles.title}>
          Errors ({filteredErrors.length})
        </span>
        <div style={styles.controls}>
          <input
            type="text"
            placeholder="Search errors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.input}
          />
          <div style={{ display: 'flex' }}>
            <button
              style={{
                ...styles.toggleButton,
                borderRadius: '6px 0 0 6px',
                ...(viewMode === 'list' ? styles.toggleButtonActive : {}),
              }}
              onClick={() => setViewMode('list')}
            >
              List
            </button>
            <button
              style={{
                ...styles.toggleButton,
                borderRadius: '0 6px 6px 0',
                borderLeft: 'none',
                ...(viewMode === 'grouped' ? styles.toggleButtonActive : {}),
              }}
              onClick={() => setViewMode('grouped')}
            >
              Grouped
            </button>
          </div>
        </div>
      </div>

      {selectedError ? (
        <ErrorDetail
          error={selectedError}
          onClose={() => setSelectedError(null)}
        />
      ) : viewMode === 'list' ? (
        <div style={styles.list}>
          {filteredErrors.map((error) => (
            <ErrorCard
              key={error.id}
              error={error}
              onClick={() => handleErrorClick(error)}
            />
          ))}
        </div>
      ) : (
        <div style={styles.list}>
          {filteredGroups.map((group) => (
            <ErrorGroupCard
              key={group.fingerprint}
              group={group}
              isExpanded={expandedGroups.has(group.fingerprint)}
              onToggle={() => toggleGroup(group.fingerprint)}
              errors={allErrors}
              onErrorClick={handleErrorClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Exports
// ============================================================================

export { ErrorCard, ErrorGroupCard, ErrorDetail, StackTraceView, BreadcrumbsView };
