/**
 * ComponentRenderPanel - Component render times visualization
 *
 * Displays React/PhilJS component render times, helping identify
 * slow components and performance bottlenecks.
 */

import { signal, memo, effect } from 'philjs-core';
import { TimeSeriesChart, type TimeSeries } from '../charts/TimeSeriesChart';
import { Sparkline } from '../charts/Sparkline';
import { FlameGraph, type FlameGraphNode } from '../charts/FlameGraph';

// ============================================================================
// Types
// ============================================================================

export interface ComponentRenderData {
  id: string;
  componentName: string;
  renderCount: number;
  totalRenderTime: number;
  averageRenderTime: number;
  lastRenderTime: number;
  lastRenderTimestamp: number;
  renderHistory: number[];
  children?: ComponentRenderData[];
  parentId?: string;
  path: string;
  wasted: number;  // Time spent on unnecessary re-renders
  selfTime: number; // Excluding children
  status: 'fast' | 'normal' | 'slow' | 'critical';
}

export interface RenderProfile {
  id: string;
  timestamp: number;
  duration: number;
  componentTree: ComponentRenderData;
  triggeredBy?: string;
  commitType: 'mount' | 'update' | 'unmount';
}

export interface ComponentRenderPanelProps {
  components: ComponentRenderData[];
  profiles?: RenderProfile[];
  onComponentSelect?: (component: ComponentRenderData) => void;
  onProfileSelect?: (profile: RenderProfile) => void;
  showFilters?: boolean;
  refreshInterval?: number;
  onRefresh?: () => Promise<ComponentRenderData[]>;
  thresholds?: {
    fast: number;    // < 5ms
    normal: number;  // < 16ms
    slow: number;    // < 50ms
    // > 50ms = critical
  };
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
  tabs: `
    display: flex;
    gap: 4px;
    padding: 4px;
    background: #1a1a2e;
    border-radius: 8px;
  `,
  tab: `
    padding: 6px 16px;
    border-radius: 6px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    color: #8a8aaa;
    background: transparent;
    border: none;
  `,
  tabActive: `
    background: #2a2a4e;
    color: #e0e0ff;
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
  `,
  componentList: `
    flex: 1;
    overflow-y: auto;
    padding: 0;
  `,
  listHeader: `
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1fr 1fr 100px;
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
  headerCell: `
    display: flex;
    align-items: center;
    cursor: pointer;
    gap: 4px;
  `,
  componentRow: `
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1fr 1fr 100px;
    align-items: center;
    padding: 12px 20px;
    border-bottom: 1px solid #0a0a15;
    cursor: pointer;
    transition: background 0.2s ease;
  `,
  componentRowHover: `
    background: rgba(99, 102, 241, 0.05);
  `,
  componentRowSelected: `
    background: rgba(99, 102, 241, 0.1);
    border-left: 3px solid #6366f1;
    padding-left: 17px;
  `,
  componentName: `
    display: flex;
    align-items: center;
    gap: 8px;
  `,
  componentIcon: `
    width: 24px;
    height: 24px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 700;
    flex-shrink: 0;
  `,
  componentLabel: `
    color: #e0e0ff;
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  `,
  componentPath: `
    color: #6a6a8a;
    font-size: 11px;
    margin-top: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  `,
  cellValue: `
    font-size: 13px;
    color: #e0e0ff;
    font-family: 'SF Mono', 'Monaco', monospace;
  `,
  statusBadge: `
    display: inline-flex;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
  `,
  sparklineCell: `
    display: flex;
    justify-content: flex-end;
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
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 8px;
  `,
  detailPath: `
    color: #6a6a8a;
    font-size: 12px;
    font-family: 'SF Mono', 'Monaco', monospace;
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
    padding: 12px;
    background: #1a1a2e;
    border-radius: 8px;
  `,
  detailLabel: `
    color: #6a6a8a;
    font-size: 11px;
  `,
  detailValue: `
    color: #e0e0ff;
    font-size: 18px;
    font-weight: 600;
  `,
  detailUnit: `
    color: #8a8aaa;
    font-size: 12px;
    margin-left: 4px;
  `,
  chart: `
    margin-top: 12px;
    padding: 16px;
    background: #1a1a2e;
    border-radius: 8px;
  `,
  chartTitle: `
    color: #e0e0ff;
    font-size: 12px;
    font-weight: 500;
    margin-bottom: 12px;
  `,
  recommendations: `
    margin-top: 20px;
    padding: 16px;
    background: #1a1a2e;
    border-radius: 8px;
  `,
  recommendation: `
    display: flex;
    gap: 12px;
    padding: 12px 0;
    border-bottom: 1px solid #2a2a4a;
  `,
  recommendationLast: `
    border-bottom: none;
  `,
  recommendationIcon: `
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    flex-shrink: 0;
  `,
  recommendationContent: `
    flex: 1;
  `,
  recommendationTitle: `
    color: #e0e0ff;
    font-size: 13px;
    font-weight: 500;
    margin-bottom: 4px;
  `,
  recommendationText: `
    color: #6a6a8a;
    font-size: 12px;
    line-height: 1.4;
  `,
  flameContainer: `
    padding: 20px;
    overflow: auto;
  `,
  profileList: `
    flex: 1;
    overflow-y: auto;
  `,
  profileItem: `
    padding: 16px 20px;
    border-bottom: 1px solid #1a1a2e;
    cursor: pointer;
    transition: background 0.2s ease;
  `,
  profileItemHover: `
    background: rgba(99, 102, 241, 0.05);
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
// Status Colors
// ============================================================================

const statusColors = {
  fast: { bg: '#22c55e22', text: '#22c55e' },
  normal: { bg: '#3b82f622', text: '#3b82f6' },
  slow: { bg: '#f59e0b22', text: '#f59e0b' },
  critical: { bg: '#ef444422', text: '#ef4444' },
};

// ============================================================================
// Helper Functions
// ============================================================================

function formatDuration(ms: number): string {
  if (ms < 0.01) return '<0.01ms';
  if (ms < 1) return `${(ms * 1000).toFixed(0)}us`;
  if (ms < 1000) return `${ms.toFixed(2)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function getComponentStatus(
  avgTime: number,
  thresholds: { fast: number; normal: number; slow: number }
): ComponentRenderData['status'] {
  if (avgTime < thresholds.fast) return 'fast';
  if (avgTime < thresholds.normal) return 'normal';
  if (avgTime < thresholds.slow) return 'slow';
  return 'critical';
}

function flattenComponents(
  components: ComponentRenderData[],
  depth = 0
): Array<ComponentRenderData & { depth: number }> {
  const result: Array<ComponentRenderData & { depth: number }> = [];

  for (const component of components) {
    result.push({ ...component, depth });
    if (component.children) {
      result.push(...flattenComponents(component.children, depth + 1));
    }
  }

  return result;
}

function componentToFlameNode(component: ComponentRenderData): FlameGraphNode {
  return {
    id: component.id,
    name: component.componentName,
    value: component.totalRenderTime,
    children: component.children?.map(componentToFlameNode) || [],
  };
}

function generateRecommendations(component: ComponentRenderData): Array<{
  title: string;
  description: string;
  type: 'warning' | 'info' | 'tip';
}> {
  const recommendations = [];

  if (component.averageRenderTime > 16) {
    recommendations.push({
      title: 'Render time exceeds frame budget',
      description: 'This component takes longer than 16ms to render, which can cause jank. Consider memoization or breaking into smaller components.',
      type: 'warning' as const,
    });
  }

  if (component.wasted > component.totalRenderTime * 0.3) {
    recommendations.push({
      title: 'High wasted render time',
      description: `${((component.wasted / component.totalRenderTime) * 100).toFixed(0)}% of render time is wasted on unnecessary re-renders. Use memo() or useMemo() hooks.`,
      type: 'warning' as const,
    });
  }

  if (component.renderCount > 50 && component.renderHistory.length > 0) {
    const recentAvg = component.renderHistory.slice(-10).reduce((a, b) => a + b, 0) / 10;
    const oldAvg = component.renderHistory.slice(0, 10).reduce((a, b) => a + b, 0) / 10;
    if (recentAvg > oldAvg * 1.5) {
      recommendations.push({
        title: 'Render times increasing',
        description: 'Recent renders are taking longer. Check for memory leaks or growing data structures.',
        type: 'info' as const,
      });
    }
  }

  if (component.children && component.children.length > 20) {
    recommendations.push({
      title: 'Many child components',
      description: 'Consider virtualization or lazy loading for components with many children.',
      type: 'tip' as const,
    });
  }

  return recommendations;
}

// ============================================================================
// Component
// ============================================================================

export function ComponentRenderPanel(props: ComponentRenderPanelProps) {
  const {
    components,
    profiles = [],
    onComponentSelect,
    onProfileSelect,
    showFilters = true,
    refreshInterval = 0,
    onRefresh,
    thresholds = { fast: 5, normal: 16, slow: 50 },
    className = '',
  } = props;

  const currentComponents = signal(components);
  const searchQuery = signal('');
  const statusFilter = signal<ComponentRenderData['status'] | 'all'>('all');
  const sortBy = signal<'name' | 'renders' | 'total' | 'avg'>('total');
  const sortOrder = signal<'asc' | 'desc'>('desc');
  const selectedComponent = signal<ComponentRenderData | null>(null);
  const selectedProfile = signal<RenderProfile | null>(null);
  const hoveredId = signal<string | null>(null);
  const activeTab = signal<'list' | 'flame' | 'profiles'>('list');
  const isLoading = signal(false);

  // Auto-refresh
  if (onRefresh && refreshInterval > 0) {
    effect(() => {
      const interval = setInterval(async () => {
        isLoading.set(true);
        try {
          const newComponents = await onRefresh();
          currentComponents.set(newComponents);
        } finally {
          isLoading.set(false);
        }
      }, refreshInterval);

      return () => clearInterval(interval);
    });
  }

  // Flatten and filter components
  const filteredComponents = memo(() => {
    let result = flattenComponents(currentComponents());

    // Filter by status
    if (statusFilter() !== 'all') {
      result = result.filter(c => c.status === statusFilter());
    }

    // Filter by search
    if (searchQuery()) {
      const query = searchQuery().toLowerCase();
      result = result.filter(c =>
        c.componentName.toLowerCase().includes(query) ||
        c.path.toLowerCase().includes(query)
      );
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortBy()) {
        case 'name':
          cmp = a.componentName.localeCompare(b.componentName);
          break;
        case 'renders':
          cmp = a.renderCount - b.renderCount;
          break;
        case 'total':
          cmp = a.totalRenderTime - b.totalRenderTime;
          break;
        case 'avg':
          cmp = a.averageRenderTime - b.averageRenderTime;
          break;
      }
      return sortOrder() === 'desc' ? -cmp : cmp;
    });

    return result;
  });

  // Stats
  const stats = memo(() => {
    const all = flattenComponents(currentComponents());
    const totalRenders = all.reduce((sum, c) => sum + c.renderCount, 0);
    const totalTime = all.reduce((sum, c) => sum + c.totalRenderTime, 0);
    const slowComponents = all.filter(c => c.status === 'slow' || c.status === 'critical').length;
    const wastedTime = all.reduce((sum, c) => sum + c.wasted, 0);

    return {
      componentCount: all.length,
      totalRenders,
      totalTime,
      slowComponents,
      wastedTime,
      wastedPercent: totalTime > 0 ? (wastedTime / totalTime) * 100 : 0,
    };
  });

  const handleSort = (field: typeof sortBy extends { (): infer T } ? T : never) => {
    if (sortBy() === field) {
      sortOrder.set(sortOrder() === 'asc' ? 'desc' : 'asc');
    } else {
      sortBy.set(field);
      sortOrder.set('desc');
    }
  };

  const handleComponentClick = (component: ComponentRenderData) => {
    selectedComponent.set(component);
    onComponentSelect?.(component);
  };

  const handleRefresh = async () => {
    if (!onRefresh) return;
    isLoading.set(true);
    try {
      const newComponents = await onRefresh();
      currentComponents.set(newComponents);
    } finally {
      isLoading.set(false);
    }
  };

  const renderComponentDetail = (component: ComponentRenderData) => {
    const recommendations = generateRecommendations(component);
    const colors = statusColors[component.status];

    return (
      <div style={styles.detailPanel}>
        <div style={styles.detailHeader}>
          <div style={styles.detailTitle}>{component.componentName}</div>
          <div style={styles.detailPath}>{component.path}</div>
        </div>

        {/* Status */}
        <div style={styles.detailSection}>
          <span
            style={styles.statusBadge + `background: ${colors.bg}; color: ${colors.text};`}
          >
            {component.status}
          </span>
        </div>

        {/* Metrics */}
        <div style={styles.detailSection}>
          <div style={styles.detailSectionTitle}>Render Metrics</div>
          <div style={styles.detailGrid}>
            <div style={styles.detailItem}>
              <span style={styles.detailLabel}>Total Renders</span>
              <span style={styles.detailValue}>{component.renderCount}</span>
            </div>
            <div style={styles.detailItem}>
              <span style={styles.detailLabel}>Total Time</span>
              <span style={styles.detailValue}>
                {formatDuration(component.totalRenderTime)}
              </span>
            </div>
            <div style={styles.detailItem}>
              <span style={styles.detailLabel}>Average Time</span>
              <span style={styles.detailValue + `color: ${colors.text};`}>
                {formatDuration(component.averageRenderTime)}
              </span>
            </div>
            <div style={styles.detailItem}>
              <span style={styles.detailLabel}>Last Render</span>
              <span style={styles.detailValue}>
                {formatDuration(component.lastRenderTime)}
              </span>
            </div>
            <div style={styles.detailItem}>
              <span style={styles.detailLabel}>Self Time</span>
              <span style={styles.detailValue}>
                {formatDuration(component.selfTime)}
              </span>
            </div>
            <div style={styles.detailItem}>
              <span style={styles.detailLabel}>Wasted Time</span>
              <span style={styles.detailValue + (component.wasted > 0 ? 'color: #f59e0b;' : '')}>
                {formatDuration(component.wasted)}
              </span>
            </div>
          </div>
        </div>

        {/* Render History Chart */}
        {component.renderHistory.length > 1 && (
          <div style={styles.chart}>
            <div style={styles.chartTitle}>Render Time History</div>
            <Sparkline
              data={component.renderHistory.slice(-50)}
              width={320}
              height={60}
              color={colors.text}
              showArea={true}
            />
          </div>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div style={styles.recommendations}>
            <div style={styles.detailSectionTitle}>Recommendations</div>
            {recommendations.map((rec, i) => {
              const typeColors = {
                warning: { bg: '#f59e0b22', text: '#f59e0b' },
                info: { bg: '#3b82f622', text: '#3b82f6' },
                tip: { bg: '#22c55e22', text: '#22c55e' },
              };
              const colors = typeColors[rec.type];

              return (
                <div
                  style={styles.recommendation +
                    (i === recommendations.length - 1 ? styles.recommendationLast : '')}
                >
                  <div
                    style={styles.recommendationIcon + `background: ${colors.bg}; color: ${colors.text};`}
                  >
                    {rec.type === 'warning' ? '!' : rec.type === 'info' ? 'i' : '*'}
                  </div>
                  <div style={styles.recommendationContent}>
                    <div style={styles.recommendationTitle}>{rec.title}</div>
                    <div style={styles.recommendationText}>{rec.description}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Children */}
        {component.children && component.children.length > 0 && (
          <div style={styles.detailSection}>
            <div style={styles.detailSectionTitle}>
              Children ({component.children.length})
            </div>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              {component.children.slice(0, 10).map(child => {
                const childColors = statusColors[child.status];
                return (
                  <div
                    style={`
                      display: flex;
                      justify-content: space-between;
                      align-items: center;
                      padding: 8px 12px;
                      background: #1a1a2e;
                      border-radius: 6px;
                      cursor: pointer;
                    `}
                    onClick={() => handleComponentClick(child)}
                  >
                    <span style="color: #e0e0ff; font-size: 13px;">{child.componentName}</span>
                    <span style={`color: ${childColors.text}; font-size: 12px;`}>
                      {formatDuration(child.averageRenderTime)}
                    </span>
                  </div>
                );
              })}
              {component.children.length > 10 && (
                <div style="color: #6a6a8a; font-size: 12px; text-align: center; padding: 8px;">
                  +{component.children.length - 10} more
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderList = () => (
    <div style={styles.componentList}>
      {/* Header */}
      <div style={styles.listHeader}>
        <div style={styles.headerCell} onClick={() => handleSort('name')}>
          Component {sortBy() === 'name' && (sortOrder() === 'asc' ? '^' : 'v')}
        </div>
        <div style={styles.headerCell} onClick={() => handleSort('renders')}>
          Renders {sortBy() === 'renders' && (sortOrder() === 'asc' ? '^' : 'v')}
        </div>
        <div style={styles.headerCell} onClick={() => handleSort('total')}>
          Total {sortBy() === 'total' && (sortOrder() === 'asc' ? '^' : 'v')}
        </div>
        <div style={styles.headerCell} onClick={() => handleSort('avg')}>
          Avg {sortBy() === 'avg' && (sortOrder() === 'asc' ? '^' : 'v')}
        </div>
        <div style={styles.headerCell}>Status</div>
        <div style={styles.headerCell}>Trend</div>
      </div>

      {/* Components */}
      {filteredComponents().length === 0 ? (
        <div style={styles.emptyState}>
          <div style="font-size: 16px; margin-bottom: 8px; color: #8a8aaa;">
            No components to display
          </div>
          <div style="font-size: 13px;">
            {searchQuery() ? 'Try adjusting your search or filters' : 'Component render data will appear here'}
          </div>
        </div>
      ) : (
        filteredComponents().map(component => {
          const colors = statusColors[component.status];
          const isHovered = hoveredId() === component.id;
          const isSelected = selectedComponent()?.id === component.id;

          return (
            <div
              style={styles.componentRow +
                (isHovered ? styles.componentRowHover : '') +
                (isSelected ? styles.componentRowSelected : '')}
              onClick={() => handleComponentClick(component)}
              onMouseEnter={() => hoveredId.set(component.id)}
              onMouseLeave={() => hoveredId.set(null)}
            >
              <div style={styles.componentName}>
                <span
                  style={styles.componentIcon + `background: ${colors.bg}; color: ${colors.text};`}
                >
                  {component.componentName.charAt(0)}
                </span>
                <div>
                  <div style={styles.componentLabel}>{component.componentName}</div>
                  <div style={styles.componentPath}>{component.path}</div>
                </div>
              </div>
              <div style={styles.cellValue}>{component.renderCount}</div>
              <div style={styles.cellValue}>{formatDuration(component.totalRenderTime)}</div>
              <div style={styles.cellValue + `color: ${colors.text};`}>
                {formatDuration(component.averageRenderTime)}
              </div>
              <div>
                <span
                  style={styles.statusBadge + `background: ${colors.bg}; color: ${colors.text};`}
                >
                  {component.status}
                </span>
              </div>
              <div style={styles.sparklineCell}>
                {component.renderHistory.length > 1 && (
                  <Sparkline
                    data={component.renderHistory.slice(-20)}
                    width={80}
                    height={24}
                    color={colors.text}
                  />
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  const renderFlameGraph = () => {
    if (currentComponents().length === 0) {
      return (
        <div style={styles.emptyState}>
          <div style="font-size: 16px; margin-bottom: 8px; color: #8a8aaa;">
            No component data available
          </div>
        </div>
      );
    }

    // Create a root node that contains all top-level components
    const rootNode: FlameGraphNode = {
      id: 'root',
      name: 'Application',
      value: currentComponents().reduce((sum, c) => sum + c.totalRenderTime, 0),
      selfValue: 0,
      children: currentComponents().map(componentToFlameNode),
    };

    return (
      <div style={styles.flameContainer}>
        <FlameGraph
          root={rootNode}
          width={800}
          height={400}
          onNodeClick={(node) => {
            const component = flattenComponents(currentComponents())
              .find(c => c.id === node.id);
            if (component) {
              handleComponentClick(component);
            }
          }}
        />
      </div>
    );
  };

  return (
    <div style={styles.panel} class={className}>
      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>Component Render Times</h2>
        <div style={styles.controls}>
          {showFilters && (
            <>
              <input
                type="text"
                placeholder="Search components..."
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
                <option value="fast">Fast</option>
                <option value="normal">Normal</option>
                <option value="slow">Slow</option>
                <option value="critical">Critical</option>
              </select>
            </>
          )}
          <div style={styles.tabs}>
            <button
              style={styles.tab + (activeTab() === 'list' ? styles.tabActive : '')}
              onClick={() => activeTab.set('list')}
            >
              List
            </button>
            <button
              style={styles.tab + (activeTab() === 'flame' ? styles.tabActive : '')}
              onClick={() => activeTab.set('flame')}
            >
              Flame Graph
            </button>
          </div>
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
          <span style={styles.statValue}>{stats().componentCount}</span>
          <span style={styles.statLabel}>Components</span>
        </div>
        <div style={styles.stat}>
          <span style={styles.statValue}>{stats().totalRenders}</span>
          <span style={styles.statLabel}>Total Renders</span>
        </div>
        <div style={styles.stat}>
          <span style={styles.statValue}>{formatDuration(stats().totalTime)}</span>
          <span style={styles.statLabel}>Total Time</span>
        </div>
        <div style={styles.stat}>
          <span style={styles.statValue + (stats().slowComponents > 0 ? 'color: #f59e0b;' : '')}>
            {stats().slowComponents}
          </span>
          <span style={styles.statLabel}>Slow Components</span>
        </div>
        <div style={styles.stat}>
          <span style={styles.statValue + (stats().wastedPercent > 20 ? 'color: #ef4444;' : '')}>
            {stats().wastedPercent.toFixed(0)}%
          </span>
          <span style={styles.statLabel}>Wasted</span>
        </div>
      </div>

      {/* Content */}
      <div style={styles.content}>
        {activeTab() === 'list' && renderList()}
        {activeTab() === 'flame' && renderFlameGraph()}

        {/* Detail Panel */}
        {selectedComponent() && activeTab() === 'list' && renderComponentDetail(selectedComponent()!)}
      </div>
    </div>
  );
}

export default ComponentRenderPanel;
