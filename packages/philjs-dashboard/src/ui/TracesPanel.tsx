/**
 * Traces Panel Component
 * Visualizes distributed traces and spans
 */

import React, { useState, useMemo, useCallback } from 'react';
import type { Span, SpanKind, SpanStatusCode } from '../collector/tracing';
import { useDashboard } from './Dashboard';

// ============================================================================
// Types
// ============================================================================

export interface TracesPanelProps {
  /** Override spans from context */
  spans?: Span[];
  /** Filter by service name */
  serviceName?: string;
  /** Maximum traces to display */
  maxTraces?: number;
  /** Custom className */
  className?: string;
  /** On span click callback */
  onSpanClick?: (span: Span) => void;
}

export interface TraceGroup {
  traceId: string;
  spans: Span[];
  rootSpan: Span | null;
  totalDuration: number;
  spanCount: number;
  services: Set<string>;
  hasErrors: boolean;
  startTime: number;
}

// ============================================================================
// Constants
// ============================================================================

const KIND_COLORS: Record<SpanKind, string> = {
  internal: '#6b7280',
  server: '#3b82f6',
  client: '#8b5cf6',
  producer: '#22c55e',
  consumer: '#f59e0b',
};

const STATUS_COLORS: Record<SpanStatusCode, string> = {
  unset: '#6b7280',
  ok: '#22c55e',
  error: '#ef4444',
};

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
    marginBottom: '8px',
  },
  title: {
    fontSize: '16px',
    fontWeight: 600,
    color: 'var(--dashboard-text, #333)',
  },
  filters: {
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
  select: {
    padding: '8px 12px',
    border: '1px solid var(--dashboard-border, #e0e0e0)',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: 'var(--dashboard-input-bg, #fff)',
    cursor: 'pointer',
  },
  traceList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  traceCard: {
    backgroundColor: 'var(--dashboard-card-bg, #fff)',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'box-shadow 0.2s ease',
  },
  traceHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    borderBottom: '1px solid var(--dashboard-border, #e0e0e0)',
  },
  traceTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--dashboard-text, #333)',
    fontFamily: 'monospace',
  },
  traceMeta: {
    display: 'flex',
    gap: '16px',
    fontSize: '12px',
    color: 'var(--dashboard-text-secondary, #666)',
  },
  traceTimeline: {
    padding: '16px',
    backgroundColor: 'var(--dashboard-bg, #f5f5f5)',
  },
  spanRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 0',
    gap: '12px',
    borderBottom: '1px solid var(--dashboard-border, #e0e0e0)',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  },
  spanName: {
    width: '200px',
    fontSize: '13px',
    fontWeight: 500,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  spanBar: {
    flex: 1,
    height: '24px',
    position: 'relative' as const,
    backgroundColor: 'var(--dashboard-bg, #e5e7eb)',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  spanBarFill: {
    position: 'absolute' as const,
    top: 0,
    height: '100%',
    borderRadius: '4px',
    minWidth: '2px',
  },
  spanDuration: {
    width: '80px',
    fontSize: '12px',
    color: 'var(--dashboard-text-secondary, #666)',
    textAlign: 'right' as const,
  },
  badge: {
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
  },
  detail: {
    padding: '16px',
    backgroundColor: 'var(--dashboard-card-bg, #fff)',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  detailHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
  },
  detailSection: {
    marginBottom: '16px',
  },
  detailLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--dashboard-text-secondary, #666)',
    marginBottom: '4px',
    textTransform: 'uppercase' as const,
  },
  detailValue: {
    fontSize: '14px',
    color: 'var(--dashboard-text, #333)',
    fontFamily: 'monospace',
  },
  attributeTable: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: '13px',
  },
  attributeRow: {
    borderBottom: '1px solid var(--dashboard-border, #e0e0e0)',
  },
  attributeKey: {
    padding: '8px',
    fontWeight: 500,
    color: 'var(--dashboard-text-secondary, #666)',
    width: '200px',
  },
  attributeValue: {
    padding: '8px',
    fontFamily: 'monospace',
    wordBreak: 'break-all' as const,
  },
  noData: {
    padding: '40px',
    textAlign: 'center' as const,
    color: 'var(--dashboard-text-secondary, #666)',
    backgroundColor: 'var(--dashboard-card-bg, #fff)',
    borderRadius: '8px',
  },
  closeButton: {
    padding: '4px 12px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: 'var(--dashboard-bg, #f5f5f5)',
    cursor: 'pointer',
    fontSize: '12px',
  },
};

// ============================================================================
// Utility Functions
// ============================================================================

function groupSpansByTrace(spans: Span[]): TraceGroup[] {
  const traceMap = new Map<string, Span[]>();

  for (const span of spans) {
    const existing = traceMap.get(span.traceId) || [];
    existing.push(span);
    traceMap.set(span.traceId, existing);
  }

  const groups: TraceGroup[] = [];

  for (const [traceId, traceSpans] of traceMap) {
    const sortedSpans = [...traceSpans].sort((a, b) => a.startTime - b.startTime);
    const rootSpan = sortedSpans.find((s) => !s.parentSpanId) || sortedSpans[0];

    const startTimes = sortedSpans.map((s) => s.startTime);
    const endTimes = sortedSpans.map((s) => s.startTime + (s.duration || 0));
    const minStart = Math.min(...startTimes);
    const maxEnd = Math.max(...endTimes);

    const services = new Set(sortedSpans.map((s) => s.resource.serviceName));
    const hasErrors = sortedSpans.some((s) => s.status.code === 'error');

    groups.push({
      traceId,
      spans: sortedSpans,
      rootSpan,
      totalDuration: maxEnd - minStart,
      spanCount: sortedSpans.length,
      services,
      hasErrors,
      startTime: minStart,
    });
  }

  return groups.sort((a, b) => b.startTime - a.startTime);
}

function formatDuration(ms: number): string {
  if (ms < 1) return '<1ms';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString();
}

// ============================================================================
// Sub-components
// ============================================================================

interface SpanBadgeProps {
  kind: SpanKind;
}

function SpanKindBadge({ kind }: SpanBadgeProps): JSX.Element {
  return (
    <span
      style={{
        ...styles.badge,
        backgroundColor: `${KIND_COLORS[kind]}20`,
        color: KIND_COLORS[kind],
      }}
    >
      {kind}
    </span>
  );
}

interface StatusBadgeProps {
  status: SpanStatusCode;
}

function StatusBadge({ status }: StatusBadgeProps): JSX.Element {
  return (
    <span
      style={{
        ...styles.badge,
        backgroundColor: `${STATUS_COLORS[status]}20`,
        color: STATUS_COLORS[status],
      }}
    >
      {status}
    </span>
  );
}

interface TraceTimelineProps {
  spans: Span[];
  totalDuration: number;
  onSpanClick?: (span: Span) => void;
}

function TraceTimeline({
  spans,
  totalDuration,
  onSpanClick,
}: TraceTimelineProps): JSX.Element {
  const minStartTime = Math.min(...spans.map((s) => s.startTime));

  return (
    <div style={styles.traceTimeline}>
      {spans.map((span) => {
        const startOffset = ((span.startTime - minStartTime) / totalDuration) * 100;
        const width = ((span.duration || 0) / totalDuration) * 100;

        return (
          <div
            key={span.spanId}
            style={styles.spanRow}
            onClick={() => onSpanClick?.(span)}
          >
            <div style={styles.spanName} title={span.name}>
              {span.name}
            </div>
            <div style={styles.spanBar}>
              <div
                style={{
                  ...styles.spanBarFill,
                  left: `${startOffset}%`,
                  width: `${Math.max(width, 1)}%`,
                  backgroundColor:
                    span.status.code === 'error'
                      ? STATUS_COLORS.error
                      : KIND_COLORS[span.kind],
                }}
              />
            </div>
            <div style={styles.spanDuration}>
              {formatDuration(span.duration || 0)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface TraceCardProps {
  trace: TraceGroup;
  isExpanded: boolean;
  onToggle: () => void;
  onSpanClick?: (span: Span) => void;
}

function TraceCard({
  trace,
  isExpanded,
  onToggle,
  onSpanClick,
}: TraceCardProps): JSX.Element {
  return (
    <div style={styles.traceCard}>
      <div style={styles.traceHeader} onClick={onToggle}>
        <div>
          <div style={styles.traceTitle}>
            {trace.rootSpan?.name || trace.traceId.substring(0, 16)}
          </div>
          <div style={{ ...styles.traceMeta, marginTop: '4px' }}>
            <span>Trace ID: {trace.traceId.substring(0, 16)}...</span>
            <span>{formatTimestamp(trace.startTime)}</span>
          </div>
        </div>
        <div style={styles.traceMeta}>
          <span>{trace.spanCount} spans</span>
          <span>{formatDuration(trace.totalDuration)}</span>
          {trace.hasErrors && <StatusBadge status="error" />}
        </div>
      </div>

      {isExpanded && (
        <TraceTimeline
          spans={trace.spans}
          totalDuration={trace.totalDuration}
          onSpanClick={onSpanClick}
        />
      )}
    </div>
  );
}

interface SpanDetailProps {
  span: Span;
  onClose: () => void;
}

function SpanDetail({ span, onClose }: SpanDetailProps): JSX.Element {
  return (
    <div style={styles.detail}>
      <div style={styles.detailHeader}>
        <div>
          <h3 style={{ margin: 0, marginBottom: '8px' }}>{span.name}</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <SpanKindBadge kind={span.kind} />
            <StatusBadge status={span.status.code} />
          </div>
        </div>
        <button style={styles.closeButton} onClick={onClose}>
          Close
        </button>
      </div>

      <div style={styles.detailSection}>
        <div style={styles.detailLabel}>Identifiers</div>
        <table style={styles.attributeTable}>
          <tbody>
            <tr style={styles.attributeRow}>
              <td style={styles.attributeKey}>Trace ID</td>
              <td style={styles.attributeValue}>{span.traceId}</td>
            </tr>
            <tr style={styles.attributeRow}>
              <td style={styles.attributeKey}>Span ID</td>
              <td style={styles.attributeValue}>{span.spanId}</td>
            </tr>
            {span.parentSpanId && (
              <tr style={styles.attributeRow}>
                <td style={styles.attributeKey}>Parent Span ID</td>
                <td style={styles.attributeValue}>{span.parentSpanId}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={styles.detailSection}>
        <div style={styles.detailLabel}>Timing</div>
        <table style={styles.attributeTable}>
          <tbody>
            <tr style={styles.attributeRow}>
              <td style={styles.attributeKey}>Start Time</td>
              <td style={styles.attributeValue}>{span.startTime.toFixed(2)}ms</td>
            </tr>
            <tr style={styles.attributeRow}>
              <td style={styles.attributeKey}>Duration</td>
              <td style={styles.attributeValue}>
                {formatDuration(span.duration || 0)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={styles.detailSection}>
        <div style={styles.detailLabel}>Resource</div>
        <table style={styles.attributeTable}>
          <tbody>
            <tr style={styles.attributeRow}>
              <td style={styles.attributeKey}>Service Name</td>
              <td style={styles.attributeValue}>{span.resource.serviceName}</td>
            </tr>
            {span.resource.serviceVersion && (
              <tr style={styles.attributeRow}>
                <td style={styles.attributeKey}>Service Version</td>
                <td style={styles.attributeValue}>{span.resource.serviceVersion}</td>
              </tr>
            )}
            {span.resource.environment && (
              <tr style={styles.attributeRow}>
                <td style={styles.attributeKey}>Environment</td>
                <td style={styles.attributeValue}>{span.resource.environment}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {Object.keys(span.attributes).length > 0 && (
        <div style={styles.detailSection}>
          <div style={styles.detailLabel}>Attributes</div>
          <table style={styles.attributeTable}>
            <tbody>
              {Object.entries(span.attributes).map(([key, value]) => (
                <tr key={key} style={styles.attributeRow}>
                  <td style={styles.attributeKey}>{key}</td>
                  <td style={styles.attributeValue}>{String(value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {span.events.length > 0 && (
        <div style={styles.detailSection}>
          <div style={styles.detailLabel}>Events ({span.events.length})</div>
          {span.events.map((event, index) => (
            <div key={index} style={{ marginBottom: '8px', fontSize: '13px' }}>
              <strong>{event.name}</strong> at {event.timestamp.toFixed(2)}ms
              {event.attributes && (
                <pre
                  style={{
                    margin: '4px 0',
                    padding: '8px',
                    backgroundColor: 'var(--dashboard-bg, #f5f5f5)',
                    borderRadius: '4px',
                    fontSize: '12px',
                    overflow: 'auto',
                  }}
                >
                  {JSON.stringify(event.attributes, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}

      {span.status.message && (
        <div style={styles.detailSection}>
          <div style={styles.detailLabel}>Status Message</div>
          <div style={styles.detailValue}>{span.status.message}</div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function TracesPanel({
  spans: propSpans,
  serviceName,
  maxTraces = 50,
  className,
  onSpanClick,
}: TracesPanelProps): JSX.Element {
  const dashboardContext = useDashboard();
  const allSpans = propSpans ?? dashboardContext?.data.spans ?? [];

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<SpanStatusCode | 'all'>('all');
  const [expandedTraces, setExpandedTraces] = useState<Set<string>>(new Set());
  const [selectedSpan, setSelectedSpan] = useState<Span | null>(null);

  const filteredSpans = useMemo(() => {
    return allSpans.filter((span) => {
      if (serviceName && span.resource.serviceName !== serviceName) {
        return false;
      }
      if (statusFilter !== 'all' && span.status.code !== statusFilter) {
        return false;
      }
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          span.name.toLowerCase().includes(query) ||
          span.traceId.toLowerCase().includes(query) ||
          span.spanId.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [allSpans, serviceName, statusFilter, searchQuery]);

  const traces = useMemo(() => {
    return groupSpansByTrace(filteredSpans).slice(0, maxTraces);
  }, [filteredSpans, maxTraces]);

  const toggleTrace = useCallback((traceId: string) => {
    setExpandedTraces((prev) => {
      const next = new Set(prev);
      if (next.has(traceId)) {
        next.delete(traceId);
      } else {
        next.add(traceId);
      }
      return next;
    });
  }, []);

  const handleSpanClick = useCallback(
    (span: Span) => {
      setSelectedSpan(span);
      onSpanClick?.(span);
    },
    [onSpanClick]
  );

  if (allSpans.length === 0) {
    return (
      <div className={className} style={styles.panel}>
        <div style={styles.noData}>
          No traces available. Start tracing to see distributed traces.
        </div>
      </div>
    );
  }

  return (
    <div className={className} style={styles.panel}>
      <div style={styles.header}>
        <span style={styles.title}>
          Traces ({traces.length} of {groupSpansByTrace(allSpans).length})
        </span>
        <div style={styles.filters}>
          <input
            type="text"
            placeholder="Search traces..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.input}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as SpanStatusCode | 'all')}
            style={styles.select}
          >
            <option value="all">All Status</option>
            <option value="ok">OK</option>
            <option value="error">Error</option>
            <option value="unset">Unset</option>
          </select>
        </div>
      </div>

      {selectedSpan ? (
        <SpanDetail span={selectedSpan} onClose={() => setSelectedSpan(null)} />
      ) : (
        <div style={styles.traceList}>
          {traces.map((trace) => (
            <TraceCard
              key={trace.traceId}
              trace={trace}
              isExpanded={expandedTraces.has(trace.traceId)}
              onToggle={() => toggleTrace(trace.traceId)}
              onSpanClick={handleSpanClick}
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

export {
  TraceCard,
  TraceTimeline,
  SpanDetail,
  SpanKindBadge,
  StatusBadge,
  groupSpansByTrace,
};
