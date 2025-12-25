/**
 * StatusIndicator - Health status display widget
 *
 * Displays system health status with various visual styles
 * including dots, badges, and detailed status cards.
 */

import { signal, memo } from 'philjs-core';

// ============================================================================
// Types
// ============================================================================

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown' | 'maintenance';

export interface StatusIndicatorProps {
  status: HealthStatus;
  label?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
  className?: string;
}

export interface StatusCardProps {
  title: string;
  status: HealthStatus;
  description?: string;
  lastChecked?: Date;
  uptime?: number; // percentage
  latency?: number; // ms
  checks?: Array<{
    name: string;
    status: HealthStatus;
    message?: string;
  }>;
  className?: string;
}

export interface UptimeBarProps {
  data: Array<{ status: HealthStatus; timestamp: number }>;
  days?: number;
  className?: string;
}

// ============================================================================
// Styles
// ============================================================================

const styles = {
  indicator: `
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `,
  dot: `
    border-radius: 50%;
    flex-shrink: 0;
  `,
  dotSm: `
    width: 8px;
    height: 8px;
  `,
  dotMd: `
    width: 12px;
    height: 12px;
  `,
  dotLg: `
    width: 16px;
    height: 16px;
  `,
  dotAnimate: `
    animation: statusPulse 2s ease-in-out infinite;
  `,
  label: `
    font-weight: 500;
    text-transform: capitalize;
  `,
  labelSm: `
    font-size: 11px;
  `,
  labelMd: `
    font-size: 13px;
  `,
  labelLg: `
    font-size: 15px;
  `,
  card: `
    background: linear-gradient(135deg, #1e1e3f 0%, #1a1a2e 100%);
    border: 1px solid #2a2a4a;
    border-radius: 12px;
    padding: 20px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `,
  cardHeader: `
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  `,
  cardTitle: `
    color: #ffffff;
    font-size: 16px;
    font-weight: 600;
  `,
  cardDescription: `
    color: #6a6a8a;
    font-size: 13px;
    margin-bottom: 16px;
  `,
  cardStats: `
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-bottom: 16px;
    padding: 12px;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 8px;
  `,
  cardStat: `
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  `,
  cardStatValue: `
    color: #ffffff;
    font-size: 18px;
    font-weight: 600;
  `,
  cardStatLabel: `
    color: #6a6a8a;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  `,
  cardChecks: `
    border-top: 1px solid #2a2a4a;
    padding-top: 16px;
  `,
  cardChecksTitle: `
    color: #8a8aaa;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 12px;
  `,
  cardCheck: `
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid #2a2a4a;
  `,
  cardCheckLast: `
    border-bottom: none;
  `,
  cardCheckName: `
    color: #e0e0ff;
    font-size: 13px;
  `,
  cardCheckMessage: `
    color: #6a6a8a;
    font-size: 11px;
    margin-top: 2px;
  `,
  cardLastChecked: `
    color: #6a6a8a;
    font-size: 11px;
    text-align: right;
    margin-top: 12px;
  `,
  uptimeBar: `
    display: flex;
    gap: 2px;
    height: 32px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `,
  uptimeSegment: `
    flex: 1;
    border-radius: 2px;
    transition: opacity 0.2s ease;
    cursor: pointer;
  `,
  uptimeTooltip: `
    position: absolute;
    background: #2a2a4e;
    border: 1px solid #3a3a6e;
    border-radius: 6px;
    padding: 8px 12px;
    font-size: 11px;
    color: #e0e0ff;
    pointer-events: none;
    z-index: 100;
    white-space: nowrap;
  `,
};

// ============================================================================
// Status Colors
// ============================================================================

const statusColors: Record<HealthStatus, string> = {
  healthy: '#22c55e',
  degraded: '#f59e0b',
  unhealthy: '#ef4444',
  unknown: '#6a6a8a',
  maintenance: '#6366f1',
};

const statusLabels: Record<HealthStatus, string> = {
  healthy: 'Healthy',
  degraded: 'Degraded',
  unhealthy: 'Unhealthy',
  unknown: 'Unknown',
  maintenance: 'Maintenance',
};

// ============================================================================
// Status Indicator Component
// ============================================================================

export function StatusIndicator(props: StatusIndicatorProps) {
  const {
    status,
    label,
    showLabel = true,
    size = 'md',
    animate = true,
    className = '',
  } = props;

  const color = statusColors[status];
  const displayLabel = label || statusLabels[status];

  const getDotStyle = () => {
    let style = styles.dot + `background: ${color};`;
    switch (size) {
      case 'sm': style += styles.dotSm; break;
      case 'lg': style += styles.dotLg; break;
      default: style += styles.dotMd;
    }
    if (animate && status === 'healthy') {
      style += styles.dotAnimate;
    }
    return style;
  };

  const getLabelStyle = () => {
    let style = styles.label + `color: ${color};`;
    switch (size) {
      case 'sm': style += styles.labelSm; break;
      case 'lg': style += styles.labelLg; break;
      default: style += styles.labelMd;
    }
    return style;
  };

  return (
    <div style={styles.indicator} class={className}>
      <span style={getDotStyle()} />
      {showLabel && <span style={getLabelStyle()}>{displayLabel}</span>}
    </div>
  );
}

// ============================================================================
// Status Card Component
// ============================================================================

export function StatusCard(props: StatusCardProps) {
  const {
    title,
    status,
    description,
    lastChecked,
    uptime,
    latency,
    checks,
    className = '',
  } = props;

  const formatLastChecked = (date: Date) => {
    const diff = Date.now() - date.getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div style={styles.card} class={className}>
      <div style={styles.cardHeader}>
        <span style={styles.cardTitle}>{title}</span>
        <StatusIndicator status={status} size="lg" />
      </div>

      {description && (
        <p style={styles.cardDescription}>{description}</p>
      )}

      {(uptime !== undefined || latency !== undefined) && (
        <div style={styles.cardStats}>
          {uptime !== undefined && (
            <div style={styles.cardStat}>
              <span style={styles.cardStatValue + `color: ${uptime >= 99.9 ? '#22c55e' : uptime >= 99 ? '#f59e0b' : '#ef4444'};`}>
                {uptime.toFixed(2)}%
              </span>
              <span style={styles.cardStatLabel}>Uptime</span>
            </div>
          )}
          {latency !== undefined && (
            <div style={styles.cardStat}>
              <span style={styles.cardStatValue + `color: ${latency < 100 ? '#22c55e' : latency < 500 ? '#f59e0b' : '#ef4444'};`}>
                {latency}ms
              </span>
              <span style={styles.cardStatLabel}>Latency</span>
            </div>
          )}
          <div style={styles.cardStat}>
            <span style={styles.cardStatValue}>{statusLabels[status]}</span>
            <span style={styles.cardStatLabel}>Status</span>
          </div>
        </div>
      )}

      {checks && checks.length > 0 && (
        <div style={styles.cardChecks}>
          <div style={styles.cardChecksTitle}>Health Checks</div>
          {checks.map((check, i) => (
            <div style={styles.cardCheck + (i === checks.length - 1 ? styles.cardCheckLast : '')}>
              <div>
                <div style={styles.cardCheckName}>{check.name}</div>
                {check.message && <div style={styles.cardCheckMessage}>{check.message}</div>}
              </div>
              <StatusIndicator status={check.status} size="sm" showLabel={false} />
            </div>
          ))}
        </div>
      )}

      {lastChecked && (
        <div style={styles.cardLastChecked}>
          Last checked: {formatLastChecked(lastChecked)}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Uptime Bar Component
// ============================================================================

export function UptimeBar(props: UptimeBarProps) {
  const {
    data,
    days = 90,
    className = '',
  } = props;

  const hoveredIndex = signal<number | null>(null);
  const tooltipPos = signal<{ x: number; y: number } | null>(null);

  // Generate segments for each day
  const segments = [];
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  for (let i = days - 1; i >= 0; i--) {
    const dayStart = now - (i + 1) * dayMs;
    const dayEnd = now - i * dayMs;

    // Find status for this day
    const dayData = data.filter(d => d.timestamp >= dayStart && d.timestamp < dayEnd);
    let status: HealthStatus = 'unknown';

    if (dayData.length > 0) {
      // Use worst status of the day
      if (dayData.some(d => d.status === 'unhealthy')) status = 'unhealthy';
      else if (dayData.some(d => d.status === 'degraded')) status = 'degraded';
      else if (dayData.some(d => d.status === 'maintenance')) status = 'maintenance';
      else if (dayData.some(d => d.status === 'healthy')) status = 'healthy';
    }

    segments.push({ status, date: new Date(dayStart) });
  }

  const handleMouseEnter = (index: number, e: MouseEvent) => {
    hoveredIndex.set(index);
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    tooltipPos.set({ x: rect.left + rect.width / 2, y: rect.top - 10 });
  };

  const handleMouseLeave = () => {
    hoveredIndex.set(null);
    tooltipPos.set(null);
  };

  // Calculate uptime percentage
  const healthyDays = segments.filter(s => s.status === 'healthy').length;
  const uptimePercent = (healthyDays / segments.length) * 100;

  return (
    <div class={className}>
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="color: #8a8aaa; font-size: 12px;">{days} days ago</span>
        <span style="color: #8a8aaa; font-size: 12px;">Today</span>
      </div>

      <div style={styles.uptimeBar + 'position: relative;'}>
        {segments.map((segment, i) => (
          <div
            style={styles.uptimeSegment + `
              background: ${statusColors[segment.status]};
              opacity: ${hoveredIndex() === i ? 1 : 0.7};
            `}
            onMouseEnter={(e: MouseEvent) => handleMouseEnter(i, e)}
            onMouseLeave={handleMouseLeave}
          />
        ))}

        {hoveredIndex() !== null && tooltipPos() && (
          <div
            style={styles.uptimeTooltip + `
              left: ${tooltipPos()!.x}px;
              top: ${tooltipPos()!.y}px;
              transform: translate(-50%, -100%);
              position: fixed;
            `}
          >
            <div style={`color: ${statusColors[segments[hoveredIndex()!].status]}; font-weight: 600;`}>
              {statusLabels[segments[hoveredIndex()!].status]}
            </div>
            <div style="color: #8a8aaa; margin-top: 2px;">
              {segments[hoveredIndex()!].date.toLocaleDateString()}
            </div>
          </div>
        )}
      </div>

      <div style="display: flex; justify-content: space-between; margin-top: 8px;">
        <span style={`color: ${uptimePercent >= 99.9 ? '#22c55e' : '#f59e0b'}; font-size: 14px; font-weight: 600;`}>
          {uptimePercent.toFixed(2)}% uptime
        </span>
        <div style="display: flex; gap: 16px;">
          {['healthy', 'degraded', 'unhealthy'].map(status => (
            <span style="display: flex; align-items: center; gap: 4px; font-size: 11px; color: #6a6a8a;">
              <span style={`width: 8px; height: 8px; border-radius: 2px; background: ${statusColors[status as HealthStatus]};`} />
              {statusLabels[status as HealthStatus]}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default StatusIndicator;
