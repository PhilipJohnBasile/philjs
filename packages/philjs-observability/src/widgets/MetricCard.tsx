/**
 * MetricCard - Single metric display widget
 *
 * Displays a key metric with optional trend indicator,
 * sparkline, and comparison to previous period.
 */

import { memo } from 'philjs-core';
import { Sparkline } from '../charts/Sparkline';

// ============================================================================
// Types
// ============================================================================

export type TrendDirection = 'up' | 'down' | 'neutral';
export type MetricStatus = 'good' | 'warning' | 'critical' | 'neutral';

export interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  description?: string;
  trend?: {
    direction: TrendDirection;
    value: string;
    isPositive?: boolean; // Is upward trend good or bad?
  };
  sparklineData?: number[];
  status?: MetricStatus;
  icon?: string;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// ============================================================================
// Styles
// ============================================================================

const styles = {
  card: `
    background: linear-gradient(135deg, #1e1e3f 0%, #1a1a2e 100%);
    border: 1px solid #2a2a4a;
    border-radius: 12px;
    padding: 20px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    transition: all 0.2s ease;
    cursor: default;
  `,
  cardClickable: `
    cursor: pointer;
  `,
  cardHover: `
    border-color: #3a3a6a;
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  `,
  header: `
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
  `,
  titleContainer: `
    display: flex;
    align-items: center;
    gap: 8px;
  `,
  icon: `
    font-size: 18px;
    opacity: 0.7;
  `,
  title: `
    color: #8a8aaa;
    font-size: 13px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  `,
  statusDot: `
    width: 8px;
    height: 8px;
    border-radius: 50%;
    animation: pulse 2s ease-in-out infinite;
  `,
  valueContainer: `
    display: flex;
    align-items: baseline;
    gap: 6px;
    margin-bottom: 8px;
  `,
  value: `
    font-size: 32px;
    font-weight: 700;
    color: #ffffff;
    line-height: 1;
  `,
  valueSm: `
    font-size: 24px;
  `,
  valueLg: `
    font-size: 40px;
  `,
  unit: `
    font-size: 14px;
    color: #6a6a8a;
    font-weight: 500;
  `,
  footer: `
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 12px;
  `,
  description: `
    font-size: 12px;
    color: #6a6a8a;
  `,
  trend: `
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    font-weight: 600;
  `,
  trendUp: `
    color: #22c55e;
  `,
  trendDown: `
    color: #ef4444;
  `,
  trendNeutral: `
    color: #6a6a8a;
  `,
  trendIcon: `
    font-size: 14px;
  `,
  sparklineContainer: `
    margin-top: 16px;
  `,
};

// ============================================================================
// Status Colors
// ============================================================================

const statusColors: Record<MetricStatus, string> = {
  good: '#22c55e',
  warning: '#f59e0b',
  critical: '#ef4444',
  neutral: '#6a6a8a',
};

// ============================================================================
// Component
// ============================================================================

export function MetricCard(props: MetricCardProps) {
  const {
    title,
    value,
    unit,
    description,
    trend,
    sparklineData,
    status,
    icon,
    onClick,
    size = 'md',
    className = '',
  } = props;

  const getTrendStyles = () => {
    if (!trend) return '';
    const isGood = trend.isPositive !== undefined
      ? (trend.direction === 'up') === trend.isPositive
      : trend.direction === 'up';

    if (trend.direction === 'neutral') return styles.trendNeutral;
    return isGood ? styles.trendUp : styles.trendDown;
  };

  const getTrendIcon = () => {
    if (!trend) return '';
    switch (trend.direction) {
      case 'up': return '^';
      case 'down': return 'v';
      default: return '-';
    }
  };

  const getValueStyle = () => {
    switch (size) {
      case 'sm': return styles.value + styles.valueSm;
      case 'lg': return styles.value + styles.valueLg;
      default: return styles.value;
    }
  };

  const getSparklineColor = () => {
    if (status) return statusColors[status];
    if (trend?.direction === 'up') return trend.isPositive !== false ? '#22c55e' : '#ef4444';
    if (trend?.direction === 'down') return trend.isPositive === false ? '#22c55e' : '#ef4444';
    return '#6366f1';
  };

  return (
    <div
      style={styles.card + (onClick ? styles.cardClickable : '')}
      class={className}
      onClick={onClick}
    >
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.titleContainer}>
          {icon && <span style={styles.icon}>{icon}</span>}
          <span style={styles.title}>{title}</span>
        </div>
        {status && (
          <span
            style={styles.statusDot + `background: ${statusColors[status]};`}
            title={status}
          />
        )}
      </div>

      {/* Value */}
      <div style={styles.valueContainer}>
        <span style={getValueStyle()}>{value}</span>
        {unit && <span style={styles.unit}>{unit}</span>}
      </div>

      {/* Sparkline */}
      {sparklineData && sparklineData.length > 0 && (
        <div style={styles.sparklineContainer}>
          <Sparkline
            data={sparklineData}
            width={200}
            height={40}
            color={getSparklineColor()}
            showArea={true}
          />
        </div>
      )}

      {/* Footer */}
      {(description || trend) && (
        <div style={styles.footer}>
          {description && <span style={styles.description}>{description}</span>}
          {trend && (
            <span style={styles.trend + getTrendStyles()}>
              <span style={styles.trendIcon}>{getTrendIcon()}</span>
              {trend.value}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Compact Metric Card
// ============================================================================

export interface CompactMetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  status?: MetricStatus;
  className?: string;
}

export function CompactMetricCard(props: CompactMetricCardProps) {
  const { label, value, unit, status, className = '' } = props;

  return (
    <div
      style={`
        background: #1e1e3f;
        border: 1px solid #2a2a4a;
        border-radius: 8px;
        padding: 12px 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      `}
      class={className}
    >
      <span style="color: #8a8aaa; font-size: 12px; font-weight: 500;">{label}</span>
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style={`color: ${status ? statusColors[status] : '#ffffff'}; font-size: 16px; font-weight: 600;`}>
          {value}
        </span>
        {unit && <span style="color: #6a6a8a; font-size: 12px;">{unit}</span>}
      </div>
    </div>
  );
}

export default MetricCard;
