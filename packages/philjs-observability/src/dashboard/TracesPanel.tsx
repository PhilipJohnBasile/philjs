/**
 * TracesPanel - Display distributed traces with waterfall view
 *
 * Comprehensive trace visualization with waterfall diagrams,
 * flame graphs, and detailed span information.
 */

import { signal, memo } from 'philjs-core';
import type { Span } from '../index';
import { FlameGraph, spansToFlameGraph, type FlameGraphNode } from '../charts/FlameGraph';

// ============================================================================
// Types
// ============================================================================

export interface Trace {
  traceId: string;
  spans: Span[];
  rootSpan: Span;
  duration: number;
  status: 'ok' | 'error' | 'unset';
  serviceName: string;
  timestamp: number;
}

export interface TracesPanelProps {
  traces: Trace[];
  onTraceSelect?: (trace: Trace) => void;
  onSpanSelect?: (span: Span) => void;
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
  content: `
    display: flex;
    flex: 1;
    overflow: hidden;
  `,
  traceList: `
    width: 400px;
    border-right: 1px solid #1a1a2e;
    overflow-y: auto;
  `,
  traceItem: `
    padding: 16px 20px;
    border-bottom: 1px solid #1a1a2e;
    cursor: pointer;
    transition: background 0.2s ease;
  `,
  traceItemHover: `
    background: rgba(99, 102, 241, 0.05);
  `,
  traceItemActive: `
    background: rgba(99, 102, 241, 0.1);
    border-left: 3px solid #6366f1;
    padding-left: 17px;
  `,
  traceHeader: `
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 8px;
  `,
  traceName: `
    color: #e0e0ff;
    font-size: 14px;
    font-weight: 500;
    word-break: break-all;
  `,
  traceDuration: `
    color: #8a8aaa;
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;
    margin-left: 12px;
  `,
  traceMeta: `
    display: flex;
    gap: 16px;
    font-size: 11px;
    color: #6a6a8a;
  `,
  traceStatus: `
    display: inline-flex;
    align-items: center;
    gap: 4px;
  `,
  statusDot: `
    width: 6px;
    height: 6px;
    border-radius: 50%;
  `,
  traceDetail: `
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
  detailTitle: `
    color: #ffffff;
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 8px;
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
  viewToggle: `
    display: flex;
    gap: 4px;
    padding: 4px;
    background: #1a1a2e;
    border-radius: 8px;
    margin-bottom: 24px;
  `,
  viewButton: `
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    color: #8a8aaa;
    background: transparent;
    border: none;
  `,
  viewButtonActive: `
    background: #2a2a4e;
    color: #e0e0ff;
  `,
  waterfall: `
    background: #1a1a2e;
    border-radius: 12px;
    padding: 20px;
  `,
  waterfallHeader: `
    display: flex;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid #2a2a4a;
    font-size: 11px;
    color: #6a6a8a;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  `,
  waterfallHeaderName: `
    width: 300px;
    flex-shrink: 0;
  `,
  waterfallHeaderTimeline: `
    flex: 1;
    display: flex;
    justify-content: space-between;
  `,
  spanRow: `
    display: flex;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid #1a1a2e;
    cursor: pointer;
    transition: background 0.2s ease;
  `,
  spanRowHover: `
    background: rgba(99, 102, 241, 0.05);
  `,
  spanName: `
    width: 300px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 8px;
  `,
  spanIndent: `
    display: inline-block;
    width: 16px;
    height: 1px;
    background: #2a2a4a;
  `,
  spanLabel: `
    color: #e0e0ff;
    font-size: 13px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  `,
  spanTimeline: `
    flex: 1;
    position: relative;
    height: 24px;
  `,
  spanBar: `
    position: absolute;
    height: 16px;
    top: 4px;
    border-radius: 3px;
    min-width: 2px;
  `,
  spanBarOk: `
    background: linear-gradient(90deg, #6366f1, #818cf8);
  `,
  spanBarError: `
    background: linear-gradient(90deg, #ef4444, #f87171);
  `,
  spanDuration: `
    position: absolute;
    right: 0;
    top: 4px;
    font-size: 11px;
    color: #8a8aaa;
  `,
  spanDetails: `
    background: #1a1a2e;
    border-radius: 12px;
    padding: 20px;
    margin-top: 16px;
  `,
  spanDetailsTitle: `
    color: #ffffff;
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 16px;
  `,
  spanDetailsGrid: `
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  `,
  spanDetailsItem: `
    display: flex;
    flex-direction: column;
    gap: 4px;
  `,
  spanDetailsLabel: `
    font-size: 11px;
    color: #6a6a8a;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  `,
  spanDetailsValue: `
    font-size: 13px;
    color: #e0e0ff;
  `,
  spanAttributes: `
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #2a2a4a;
  `,
  spanAttributesTitle: `
    font-size: 12px;
    color: #8a8aaa;
    margin-bottom: 12px;
  `,
  spanAttribute: `
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid #1a1a2e;
    font-size: 12px;
  `,
  spanAttributeKey: `
    color: #6a6a8a;
  `,
  spanAttributeValue: `
    color: #e0e0ff;
    max-width: 300px;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: right;
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

function formatDuration(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`;
  if (ms >= 1) return `${ms.toFixed(2)}ms`;
  return `${(ms * 1000).toFixed(0)}us`;
}

function formatTimestamp(ts: number): string {
  const date = new Date(ts);
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
  } as any);
}

function getSpanDepth(span: Span, spans: Span[]): number {
  let depth = 0;
  let current = span;
  while (current.parentSpanId) {
    const parent = spans.find(s => s.spanId === current.parentSpanId);
    if (!parent) break;
    current = parent;
    depth++;
  }
  return depth;
}

function sortSpansByTime(spans: Span[]): Span[] {
  return [...spans].sort((a, b) => a.startTime - b.startTime);
}

// ============================================================================
// Component
// ============================================================================

export function TracesPanel(props: TracesPanelProps) {
  const {
    traces,
    onTraceSelect,
    onSpanSelect,
    showFilters = true,
    className = '',
  } = props;

  const selectedTrace = signal<Trace | null>(null);
  const selectedSpan = signal<Span | null>(null);
  const searchQuery = signal('');
  const statusFilter = signal<'all' | 'ok' | 'error'>('all');
  const viewMode = signal<'waterfall' | 'flamegraph'>('waterfall');
  const hoveredTraceId = signal<string | null>(null);
  const hoveredSpanId = signal<string | null>(null);

  // Filter traces
  const filteredTraces = memo(() => {
    let result = traces;

    if (searchQuery()) {
      const query = searchQuery().toLowerCase();
      result = result.filter(t =>
        t.rootSpan.name.toLowerCase().includes(query) ||
        t.traceId.toLowerCase().includes(query) ||
        t.serviceName.toLowerCase().includes(query)
      );
    }

    if (statusFilter() !== 'all') {
      result = result.filter(t => t.status === statusFilter());
    }

    return result.sort((a, b) => b.timestamp - a.timestamp);
  });

  const handleTraceClick = (trace: Trace) => {
    selectedTrace.set(trace);
    selectedSpan.set(null);
    onTraceSelect?.(trace);
  };

  const handleSpanClick = (span: Span) => {
    selectedSpan.set(span);
    onSpanSelect?.(span);
  };

  const renderWaterfall = (trace: Trace) => {
    const spans = sortSpansByTime(trace.spans);
    const traceStart = trace.rootSpan.startTime;
    const traceDuration = trace.duration;

    // Generate timeline markers
    const timelineMarkers = [0, 0.25, 0.5, 0.75, 1].map(fraction => ({
      label: formatDuration(fraction * traceDuration),
      position: fraction * 100,
    }));

    return (
      <div style={styles.waterfall}>
        {/* Header */}
        <div style={styles.waterfallHeader}>
          <div style={styles.waterfallHeaderName}>Span Name</div>
          <div style={styles.waterfallHeaderTimeline}>
            {timelineMarkers.map(m => (
              <span style={`position: absolute; left: ${m.position}%; transform: translateX(-50%);`}>
                {m.label}
              </span>
            ))}
          </div>
        </div>

        {/* Spans */}
        {spans.map(span => {
          const depth = getSpanDepth(span, spans);
          const spanStart = ((span.startTime - traceStart) / traceDuration) * 100;
          const spanWidth = (((span.endTime || Date.now()) - span.startTime) / traceDuration) * 100;
          const isHovered = hoveredSpanId() === span.spanId;
          const isSelected = selectedSpan()?.spanId === span.spanId;

          return (
            <div
              style={styles.spanRow + (isHovered || isSelected ? styles.spanRowHover : '')}
              onClick={() => handleSpanClick(span)}
              onMouseEnter={() => hoveredSpanId.set(span.spanId)}
              onMouseLeave={() => hoveredSpanId.set(null)}
            >
              <div style={styles.spanName}>
                {Array.from({ length: depth }).map(() => (
                  <span style={styles.spanIndent} />
                ))}
                <span
                  style={styles.statusDot + `background: ${span.status === 'error' ? '#ef4444' : '#22c55e'};`}
                />
                <span style={styles.spanLabel} title={span.name}>
                  {span.name}
                </span>
              </div>
              <div style={styles.spanTimeline}>
                <div
                  style={styles.spanBar +
                    (span.status === 'error' ? styles.spanBarError : styles.spanBarOk) +
                    `left: ${spanStart}%; width: ${Math.max(spanWidth, 0.5)}%;`}
                />
                <span style={styles.spanDuration}>
                  {formatDuration((span.endTime || Date.now()) - span.startTime)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderFlameGraph = (trace: Trace) => {
    const root = spansToFlameGraph(trace.spans);
    if (!root) return <div style={styles.emptyState}>Unable to build flame graph</div>;

    return (
      <FlameGraph
        root={root}
        width={800}
        height={400}
        onNodeClick={(node) => {
          if (node.span) handleSpanClick(node.span);
        }}
      />
    );
  };

  const renderSpanDetails = (span: Span) => (
    <div style={styles.spanDetails}>
      <div style={styles.spanDetailsTitle}>{span.name}</div>

      <div style={styles.spanDetailsGrid}>
        <div style={styles.spanDetailsItem}>
          <span style={styles.spanDetailsLabel}>Span ID</span>
          <span style={styles.spanDetailsValue}>{span.spanId}</span>
        </div>
        <div style={styles.spanDetailsItem}>
          <span style={styles.spanDetailsLabel}>Parent Span ID</span>
          <span style={styles.spanDetailsValue}>{span.parentSpanId || 'None (root)'}</span>
        </div>
        <div style={styles.spanDetailsItem}>
          <span style={styles.spanDetailsLabel}>Status</span>
          <span style={styles.spanDetailsValue + `color: ${span.status === 'error' ? '#ef4444' : '#22c55e'};`}>
            {span.status}
          </span>
        </div>
        <div style={styles.spanDetailsItem}>
          <span style={styles.spanDetailsLabel}>Duration</span>
          <span style={styles.spanDetailsValue}>
            {formatDuration((span.endTime || Date.now()) - span.startTime)}
          </span>
        </div>
        <div style={styles.spanDetailsItem}>
          <span style={styles.spanDetailsLabel}>Start Time</span>
          <span style={styles.spanDetailsValue}>{formatTimestamp(span.startTime)}</span>
        </div>
        <div style={styles.spanDetailsItem}>
          <span style={styles.spanDetailsLabel}>End Time</span>
          <span style={styles.spanDetailsValue}>
            {span.endTime ? formatTimestamp(span.endTime) : 'In progress'}
          </span>
        </div>
      </div>

      {Object.keys(span.attributes).length > 0 && (
        <div style={styles.spanAttributes}>
          <div style={styles.spanAttributesTitle}>Attributes</div>
          {Object.entries(span.attributes).map(([key, value]) => (
            <div style={styles.spanAttribute}>
              <span style={styles.spanAttributeKey}>{key}</span>
              <span style={styles.spanAttributeValue}>{String(value)}</span>
            </div>
          ))}
        </div>
      )}

      {span.events.length > 0 && (
        <div style={styles.spanAttributes}>
          <div style={styles.spanAttributesTitle}>Events ({span.events.length})</div>
          {span.events.map(event => (
            <div style={styles.spanAttribute}>
              <span style={styles.spanAttributeKey}>{event.name}</span>
              <span style={styles.spanAttributeValue}>{formatTimestamp(event.timestamp)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div style={styles.panel} class={className}>
      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>Traces</h2>
        <div style={styles.controls}>
          {showFilters && (
            <>
              <input
                type="text"
                placeholder="Search traces..."
                style={styles.searchInput}
                value={searchQuery()}
                onInput={(e: InputEvent) => searchQuery.set((e.target as HTMLInputElement).value)}
              />
              <select
                style={styles.select}
                value={statusFilter()}
                onChange={(e: Event) => statusFilter.set((e.target as HTMLSelectElement).value as any)}
              >
                <option value="all">All Status</option>
                <option value="ok">OK</option>
                <option value="error">Error</option>
              </select>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={styles.content}>
        {/* Trace List */}
        <div style={styles.traceList}>
          {filteredTraces().length === 0 ? (
            <div style={styles.emptyState}>
              <div style="font-size: 14px; margin-bottom: 8px;">No traces found</div>
              <div style="font-size: 12px;">
                {searchQuery() ? 'Try adjusting your search' : 'Traces will appear here'}
              </div>
            </div>
          ) : (
            filteredTraces().map(trace => {
              const isHovered = hoveredTraceId() === trace.traceId;
              const isSelected = selectedTrace()?.traceId === trace.traceId;

              return (
                <div
                  style={styles.traceItem +
                    (isHovered ? styles.traceItemHover : '') +
                    (isSelected ? styles.traceItemActive : '')}
                  onClick={() => handleTraceClick(trace)}
                  onMouseEnter={() => hoveredTraceId.set(trace.traceId)}
                  onMouseLeave={() => hoveredTraceId.set(null)}
                >
                  <div style={styles.traceHeader}>
                    <span style={styles.traceName}>{trace.rootSpan.name}</span>
                    <span style={styles.traceDuration}>{formatDuration(trace.duration)}</span>
                  </div>
                  <div style={styles.traceMeta}>
                    <span style={styles.traceStatus}>
                      <span
                        style={styles.statusDot + `background: ${trace.status === 'error' ? '#ef4444' : '#22c55e'};`}
                      />
                      {trace.status}
                    </span>
                    <span>{trace.spans.length} spans</span>
                    <span>{trace.serviceName}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Trace Detail */}
        <div style={styles.traceDetail}>
          {!selectedTrace() ? (
            <div style={styles.detailEmpty}>
              <div style="font-size: 16px; margin-bottom: 8px; color: #8a8aaa;">
                Select a trace to view details
              </div>
              <div style="font-size: 13px;">
                Click on a trace from the list to see its waterfall view
              </div>
            </div>
          ) : (
            <>
              {/* Detail Header */}
              <div style={styles.detailHeader}>
                <div style={styles.detailTitle}>{selectedTrace()!.rootSpan.name}</div>
                <div style={styles.detailMeta}>
                  <div style={styles.detailMetaItem}>
                    <span style={styles.detailMetaLabel}>Trace ID</span>
                    <span style={styles.detailMetaValue}>{selectedTrace()!.traceId.slice(0, 16)}...</span>
                  </div>
                  <div style={styles.detailMetaItem}>
                    <span style={styles.detailMetaLabel}>Duration</span>
                    <span style={styles.detailMetaValue}>{formatDuration(selectedTrace()!.duration)}</span>
                  </div>
                  <div style={styles.detailMetaItem}>
                    <span style={styles.detailMetaLabel}>Spans</span>
                    <span style={styles.detailMetaValue}>{selectedTrace()!.spans.length}</span>
                  </div>
                  <div style={styles.detailMetaItem}>
                    <span style={styles.detailMetaLabel}>Service</span>
                    <span style={styles.detailMetaValue}>{selectedTrace()!.serviceName}</span>
                  </div>
                </div>
              </div>

              {/* View Toggle */}
              <div style={styles.viewToggle}>
                <button
                  style={styles.viewButton + (viewMode() === 'waterfall' ? styles.viewButtonActive : '')}
                  onClick={() => viewMode.set('waterfall')}
                >
                  Waterfall
                </button>
                <button
                  style={styles.viewButton + (viewMode() === 'flamegraph' ? styles.viewButtonActive : '')}
                  onClick={() => viewMode.set('flamegraph')}
                >
                  Flame Graph
                </button>
              </div>

              {/* Visualization */}
              {viewMode() === 'waterfall'
                ? renderWaterfall(selectedTrace()!)
                : renderFlameGraph(selectedTrace()!)}

              {/* Selected Span Details */}
              {selectedSpan() && renderSpanDetails(selectedSpan()!)}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default TracesPanel;
