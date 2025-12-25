/**
 * LogsPanel - Searchable log viewer
 *
 * Real-time log viewer with filtering, search,
 * and log level highlighting.
 */

import { signal, memo, effect } from 'philjs-core';
import type { LogEntry, LogLevel } from '../index';

// ============================================================================
// Types
// ============================================================================

export interface LogsPanelProps {
  logs: LogEntry[];
  onRefresh?: () => Promise<LogEntry[]>;
  refreshInterval?: number;
  maxLogs?: number;
  showFilters?: boolean;
  showTimestamp?: boolean;
  showTraceId?: boolean;
  onLogClick?: (log: LogEntry) => void;
  className?: string;
}

// ============================================================================
// Styles
// ============================================================================

const styles = {
  panel: `
    background: #0f0f1a;
    border-radius: 12px;
    font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Mono', monospace;
    display: flex;
    flex-direction: column;
    height: 100%;
  `,
  header: `
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid #1a1a2e;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
  searchContainer: `
    position: relative;
    display: flex;
    align-items: center;
  `,
  searchInput: `
    background: #1a1a2e;
    border: 1px solid #2a2a4a;
    border-radius: 6px;
    color: #e0e0ff;
    padding: 8px 12px 8px 32px;
    font-size: 13px;
    width: 250px;
    outline: none;
    font-family: inherit;
  `,
  searchIcon: `
    position: absolute;
    left: 10px;
    color: #6a6a8a;
    font-size: 14px;
  `,
  levelFilters: `
    display: flex;
    gap: 4px;
    padding: 4px;
    background: #1a1a2e;
    border-radius: 6px;
  `,
  levelFilter: `
    padding: 4px 10px;
    border-radius: 4px;
    font-size: 11px;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
    text-transform: uppercase;
    font-weight: 600;
    letter-spacing: 0.5px;
  `,
  levelFilterActive: `
    opacity: 1;
  `,
  levelFilterInactive: `
    opacity: 0.4;
  `,
  actions: `
    display: flex;
    gap: 8px;
  `,
  button: `
    background: #2a2a4e;
    border: 1px solid #3a3a6e;
    border-radius: 6px;
    color: #e0e0ff;
    padding: 6px 12px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
  `,
  content: `
    flex: 1;
    overflow-y: auto;
    padding: 0;
  `,
  logRow: `
    display: flex;
    padding: 8px 20px;
    border-bottom: 1px solid #0a0a15;
    font-size: 12px;
    line-height: 1.5;
    transition: background 0.15s ease;
    cursor: pointer;
  `,
  logRowHover: `
    background: rgba(99, 102, 241, 0.05);
  `,
  logRowAlt: `
    background: rgba(255, 255, 255, 0.01);
  `,
  logTimestamp: `
    color: #6a6a8a;
    width: 100px;
    flex-shrink: 0;
    font-size: 11px;
  `,
  logLevel: `
    width: 60px;
    flex-shrink: 0;
    font-weight: 600;
    text-transform: uppercase;
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 3px;
    text-align: center;
    margin-right: 12px;
  `,
  logMessage: `
    flex: 1;
    color: #e0e0ff;
    word-break: break-word;
  `,
  logTraceId: `
    color: #6366f1;
    margin-left: 12px;
    font-size: 11px;
    opacity: 0.8;
    cursor: pointer;
  `,
  logContext: `
    color: #6a6a8a;
    margin-left: 8px;
    font-size: 11px;
  `,
  emptyState: `
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    color: #6a6a8a;
    text-align: center;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `,
  logDetail: `
    position: fixed;
    right: 20px;
    top: 100px;
    width: 400px;
    background: #1a1a2e;
    border: 1px solid #2a2a4a;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    z-index: 1000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `,
  logDetailHeader: `
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  `,
  logDetailTitle: `
    color: #ffffff;
    font-size: 14px;
    font-weight: 600;
  `,
  logDetailClose: `
    color: #6a6a8a;
    cursor: pointer;
    font-size: 18px;
    line-height: 1;
    padding: 4px;
  `,
  logDetailSection: `
    margin-bottom: 16px;
  `,
  logDetailLabel: `
    color: #6a6a8a;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 6px;
  `,
  logDetailValue: `
    color: #e0e0ff;
    font-size: 13px;
    background: #0f0f1a;
    padding: 12px;
    border-radius: 6px;
    word-break: break-all;
  `,
  logDetailContext: `
    font-family: 'SF Mono', 'Monaco', monospace;
    font-size: 11px;
    max-height: 200px;
    overflow-y: auto;
  `,
  stats: `
    display: flex;
    gap: 24px;
    padding: 12px 20px;
    background: #1a1a2e;
    border-bottom: 1px solid #2a2a4a;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `,
  stat: `
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
  `,
  statDot: `
    width: 8px;
    height: 8px;
    border-radius: 50%;
  `,
  statLabel: `
    color: #6a6a8a;
  `,
  statValue: `
    color: #e0e0ff;
    font-weight: 600;
  `,
  liveIndicator: `
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: #22c55e;
  `,
  liveIndicatorDot: `
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #22c55e;
    animation: livePulse 1.5s ease-in-out infinite;
  `,
};

// ============================================================================
// Level Colors
// ============================================================================

const levelColors: Record<LogLevel, { bg: string; text: string }> = {
  debug: { bg: '#2a2a4a', text: '#8a8aaa' },
  info: { bg: '#1e3a5f', text: '#60a5fa' },
  warn: { bg: '#4a3f0c', text: '#fbbf24' },
  error: { bg: '#4a1515', text: '#f87171' },
  fatal: { bg: '#5c1a5c', text: '#e879f9' },
};

// ============================================================================
// Component
// ============================================================================

export function LogsPanel(props: LogsPanelProps) {
  const {
    logs,
    onRefresh,
    refreshInterval = 5000,
    maxLogs = 1000,
    showFilters = true,
    showTimestamp = true,
    showTraceId = true,
    onLogClick,
    className = '',
  } = props;

  const currentLogs = signal(logs.slice(-maxLogs));
  const searchQuery = signal('');
  const selectedLevels = signal<Set<LogLevel>>(new Set(['debug', 'info', 'warn', 'error', 'fatal']));
  const selectedLog = signal<LogEntry | null>(null);
  const isLive = signal(true);
  const hoveredIndex = signal<number | null>(null);

  // Auto-refresh
  if (onRefresh && refreshInterval > 0) {
    effect(() => {
      if (!isLive()) return;

      const interval = setInterval(async () => {
        const newLogs = await onRefresh();
        currentLogs.set(newLogs.slice(-maxLogs));
      }, refreshInterval);

      return () => clearInterval(interval);
    });
  }

  // Filter logs
  const filteredLogs = memo(() => {
    let result = currentLogs();

    // Filter by level
    result = result.filter(log => selectedLevels().has(log.level));

    // Filter by search
    if (searchQuery()) {
      const query = searchQuery().toLowerCase();
      result = result.filter(log =>
        log.message.toLowerCase().includes(query) ||
        log.traceId?.toLowerCase().includes(query) ||
        JSON.stringify(log.context).toLowerCase().includes(query)
      );
    }

    return result;
  });

  // Stats
  const stats = memo(() => {
    const all = currentLogs();
    return {
      total: all.length,
      debug: all.filter(l => l.level === 'debug').length,
      info: all.filter(l => l.level === 'info').length,
      warn: all.filter(l => l.level === 'warn').length,
      error: all.filter(l => l.level === 'error').length,
      fatal: all.filter(l => l.level === 'fatal').length,
    };
  });

  const toggleLevel = (level: LogLevel) => {
    const newSet = new Set(selectedLevels());
    if (newSet.has(level)) {
      newSet.delete(level);
    } else {
      newSet.add(level);
    }
    selectedLevels.set(newSet);
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const handleLogClick = (log: LogEntry) => {
    selectedLog.set(log);
    onLogClick?.(log);
  };

  const clearLogs = () => {
    currentLogs.set([]);
  };

  return (
    <div style={styles.panel} class={className}>
      {/* Header */}
      <div style={styles.header}>
        <div style="display: flex; align-items: center; gap: 16px;">
          <h2 style={styles.title}>Logs</h2>
          {isLive() && (
            <div style={styles.liveIndicator}>
              <span style={styles.liveIndicatorDot} />
              Live
            </div>
          )}
        </div>
        <div style={styles.controls}>
          {showFilters && (
            <>
              <div style={styles.searchContainer}>
                <span style={styles.searchIcon}>?</span>
                <input
                  type="text"
                  placeholder="Search logs..."
                  style={styles.searchInput}
                  value={searchQuery()}
                  onInput={(e: InputEvent) => searchQuery.set((e.target as HTMLInputElement).value)}
                />
              </div>
              <div style={styles.levelFilters}>
                {(['debug', 'info', 'warn', 'error', 'fatal'] as LogLevel[]).map(level => {
                  const isActive = selectedLevels().has(level);
                  const colors = levelColors[level];
                  return (
                    <button
                      style={styles.levelFilter +
                        (isActive ? styles.levelFilterActive : styles.levelFilterInactive) +
                        `background: ${colors.bg}; color: ${colors.text};`}
                      onClick={() => toggleLevel(level)}
                    >
                      {level}
                    </button>
                  );
                })}
              </div>
            </>
          )}
          <div style={styles.actions}>
            <button
              style={styles.button + (isLive() ? 'background: #22c55e33;' : '')}
              onClick={() => isLive.set(!isLive())}
            >
              {isLive() ? 'Pause' : 'Resume'}
            </button>
            <button style={styles.button} onClick={clearLogs}>
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div style={styles.stats}>
        <div style={styles.stat}>
          <span style={styles.statLabel}>Total:</span>
          <span style={styles.statValue}>{stats().total}</span>
        </div>
        {(['error', 'warn', 'info', 'debug'] as LogLevel[]).map(level => {
          const count = stats()[level];
          if (count === 0) return null;
          return (
            <div style={styles.stat}>
              <span style={styles.statDot + `background: ${levelColors[level].text};`} />
              <span style={styles.statLabel}>{level}:</span>
              <span style={styles.statValue}>{count}</span>
            </div>
          );
        })}
      </div>

      {/* Logs */}
      <div style={styles.content}>
        {filteredLogs().length === 0 ? (
          <div style={styles.emptyState}>
            <div style="font-size: 16px; margin-bottom: 8px; color: #8a8aaa;">
              No logs to display
            </div>
            <div style="font-size: 13px;">
              {searchQuery() ? 'Try adjusting your search or filters' : 'Logs will appear here in real-time'}
            </div>
          </div>
        ) : (
          filteredLogs().map((log, index) => {
            const colors = levelColors[log.level];
            const isHovered = hoveredIndex() === index;
            const isAlt = index % 2 === 1;

            return (
              <div
                style={styles.logRow +
                  (isHovered ? styles.logRowHover : '') +
                  (isAlt && !isHovered ? styles.logRowAlt : '')}
                onClick={() => handleLogClick(log)}
                onMouseEnter={() => hoveredIndex.set(index)}
                onMouseLeave={() => hoveredIndex.set(null)}
              >
                {showTimestamp && (
                  <span style={styles.logTimestamp}>
                    {formatTimestamp(log.timestamp)}
                  </span>
                )}
                <span style={styles.logLevel + `background: ${colors.bg}; color: ${colors.text};`}>
                  {log.level}
                </span>
                <span style={styles.logMessage}>{log.message}</span>
                {log.context && Object.keys(log.context).length > 0 && (
                  <span style={styles.logContext}>
                    {JSON.stringify(log.context).slice(0, 50)}...
                  </span>
                )}
                {showTraceId && log.traceId && (
                  <span style={styles.logTraceId} title={log.traceId}>
                    [{log.traceId.slice(0, 8)}]
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Log Detail Panel */}
      {selectedLog() && (
        <div style={styles.logDetail}>
          <div style={styles.logDetailHeader}>
            <span style={styles.logDetailTitle}>Log Details</span>
            <span style={styles.logDetailClose} onClick={() => selectedLog.set(null)}>
              x
            </span>
          </div>

          <div style={styles.logDetailSection}>
            <div style={styles.logDetailLabel}>Level</div>
            <div style={`
              display: inline-block;
              padding: 4px 12px;
              border-radius: 4px;
              background: ${levelColors[selectedLog()!.level].bg};
              color: ${levelColors[selectedLog()!.level].text};
              font-weight: 600;
              text-transform: uppercase;
              font-size: 11px;
            `}>
              {selectedLog()!.level}
            </div>
          </div>

          <div style={styles.logDetailSection}>
            <div style={styles.logDetailLabel}>Timestamp</div>
            <div style={styles.logDetailValue}>
              {selectedLog()!.timestamp.toISOString()}
            </div>
          </div>

          <div style={styles.logDetailSection}>
            <div style={styles.logDetailLabel}>Message</div>
            <div style={styles.logDetailValue}>
              {selectedLog()!.message}
            </div>
          </div>

          {selectedLog()!.traceId && (
            <div style={styles.logDetailSection}>
              <div style={styles.logDetailLabel}>Trace ID</div>
              <div style={styles.logDetailValue}>
                {selectedLog()!.traceId}
              </div>
            </div>
          )}

          {selectedLog()!.spanId && (
            <div style={styles.logDetailSection}>
              <div style={styles.logDetailLabel}>Span ID</div>
              <div style={styles.logDetailValue}>
                {selectedLog()!.spanId}
              </div>
            </div>
          )}

          {selectedLog()!.context && Object.keys(selectedLog()!.context!).length > 0 && (
            <div style={styles.logDetailSection}>
              <div style={styles.logDetailLabel}>Context</div>
              <div style={styles.logDetailValue + styles.logDetailContext}>
                <pre style="margin: 0; white-space: pre-wrap;">
                  {JSON.stringify(selectedLog()!.context, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default LogsPanel;
