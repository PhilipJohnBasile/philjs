/**
 * BundleAnalysisPanel - Bundle size analysis and visualization
 *
 * Displays bundle composition, module sizes, and helps identify
 * opportunities for code splitting and optimization.
 */

import { signal, memo } from 'philjs-core';

// ============================================================================
// Types
// ============================================================================

export interface BundleModule {
  id: string;
  name: string;
  path: string;
  size: number;           // Uncompressed size in bytes
  gzipSize: number;       // Gzip compressed size
  brotliSize?: number;    // Brotli compressed size
  isEntryPoint: boolean;
  isDynamic: boolean;     // Dynamically imported
  dependencies: string[]; // Module IDs this depends on
  dependents: string[];   // Module IDs that depend on this
  source?: 'node_modules' | 'src' | 'vendor';
  packageName?: string;   // For node_modules
}

export interface BundleChunk {
  id: string;
  name: string;
  type: 'entry' | 'async' | 'vendor' | 'common';
  size: number;
  gzipSize: number;
  brotliSize?: number;
  modules: BundleModule[];
  isInitial: boolean;
}

export interface BundleAnalysis {
  timestamp: number;
  version?: string;
  totalSize: number;
  totalGzipSize: number;
  totalBrotliSize?: number;
  chunks: BundleChunk[];
  modules: BundleModule[];
  duplicates: Array<{
    name: string;
    instances: number;
    wastedBytes: number;
  }>;
  treeshaking: {
    removedExports: number;
    savedBytes: number;
  };
}

export interface BundleAnalysisPanelProps {
  analysis: BundleAnalysis;
  previousAnalysis?: BundleAnalysis;
  budgets?: {
    total?: number;     // Total bundle budget in bytes
    initial?: number;   // Initial load budget
    chunk?: number;     // Per-chunk budget
  };
  onModuleSelect?: (module: BundleModule) => void;
  onChunkSelect?: (chunk: BundleChunk) => void;
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
  version: `
    color: #6a6a8a;
    font-size: 12px;
    margin-left: 12px;
  `,
  controls: `
    display: flex;
    gap: 12px;
    align-items: center;
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
  statsGrid: `
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 16px;
    padding: 24px;
    border-bottom: 1px solid #1a1a2e;
  `,
  statCard: `
    background: linear-gradient(135deg, #1e1e3f 0%, #1a1a2e 100%);
    border: 1px solid #2a2a4a;
    border-radius: 12px;
    padding: 16px;
  `,
  statLabel: `
    color: #6a6a8a;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 8px;
  `,
  statValue: `
    font-size: 24px;
    font-weight: 700;
    color: #ffffff;
  `,
  statUnit: `
    color: #8a8aaa;
    font-size: 14px;
    font-weight: 400;
    margin-left: 4px;
  `,
  statChange: `
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    margin-top: 8px;
  `,
  statChangePositive: `
    color: #ef4444;
  `,
  statChangeNegative: `
    color: #22c55e;
  `,
  budgetBar: `
    margin-top: 8px;
    height: 4px;
    background: #2a2a4a;
    border-radius: 2px;
    overflow: hidden;
  `,
  budgetBarFill: `
    height: 100%;
    border-radius: 2px;
    transition: width 0.3s ease;
  `,
  content: `
    flex: 1;
    overflow: hidden;
    display: flex;
  `,
  mainArea: `
    flex: 1;
    overflow-y: auto;
    padding: 24px;
  `,
  section: `
    margin-bottom: 24px;
  `,
  sectionTitle: `
    color: #ffffff;
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  `,
  sectionCount: `
    background: #2a2a4e;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 11px;
    color: #8a8aaa;
  `,
  treemapContainer: `
    background: #1a1a2e;
    border-radius: 12px;
    padding: 20px;
    min-height: 300px;
  `,
  treemapTitle: `
    color: #ffffff;
    font-size: 13px;
    font-weight: 500;
    margin-bottom: 16px;
  `,
  treemap: `
    display: flex;
    flex-wrap: wrap;
    gap: 2px;
    min-height: 200px;
  `,
  treemapItem: `
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    cursor: pointer;
    transition: transform 0.2s ease, opacity 0.2s ease;
    overflow: hidden;
    text-align: center;
    padding: 4px;
  `,
  treemapItemHover: `
    transform: scale(1.02);
    z-index: 10;
  `,
  treemapLabel: `
    color: #ffffff;
    font-size: 10px;
    font-weight: 500;
    text-shadow: 0 1px 2px rgba(0,0,0,0.5);
    word-break: break-all;
  `,
  chunkList: `
    display: flex;
    flex-direction: column;
    gap: 12px;
  `,
  chunkItem: `
    background: #1a1a2e;
    border-radius: 8px;
    padding: 16px;
    cursor: pointer;
    transition: background 0.2s ease;
  `,
  chunkItemHover: `
    background: rgba(99, 102, 241, 0.1);
  `,
  chunkHeader: `
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
  `,
  chunkName: `
    color: #e0e0ff;
    font-size: 14px;
    font-weight: 500;
  `,
  chunkType: `
    font-size: 10px;
    padding: 2px 8px;
    border-radius: 4px;
    text-transform: uppercase;
    font-weight: 600;
  `,
  chunkMeta: `
    display: flex;
    gap: 24px;
    font-size: 12px;
    color: #8a8aaa;
  `,
  chunkSizeBar: `
    margin-top: 12px;
    height: 8px;
    background: #2a2a4a;
    border-radius: 4px;
    overflow: hidden;
  `,
  chunkSizeBarFill: `
    height: 100%;
    border-radius: 4px;
  `,
  moduleList: `
    display: flex;
    flex-direction: column;
    gap: 4px;
  `,
  moduleItem: `
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 16px;
    background: #1a1a2e;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.2s ease;
  `,
  moduleItemHover: `
    background: rgba(99, 102, 241, 0.1);
  `,
  moduleName: `
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-width: 0;
  `,
  moduleIcon: `
    width: 24px;
    height: 24px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: 600;
    flex-shrink: 0;
  `,
  moduleLabel: `
    color: #e0e0ff;
    font-size: 13px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  `,
  modulePath: `
    color: #6a6a8a;
    font-size: 11px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  `,
  moduleSize: `
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;
    flex-shrink: 0;
    margin-left: 16px;
  `,
  moduleSizeValue: `
    color: #e0e0ff;
    font-size: 13px;
    font-weight: 500;
    font-family: 'SF Mono', 'Monaco', monospace;
  `,
  moduleSizeGzip: `
    color: #6a6a8a;
    font-size: 11px;
    font-family: 'SF Mono', 'Monaco', monospace;
  `,
  duplicatesSection: `
    background: #f59e0b11;
    border: 1px solid #f59e0b44;
    border-radius: 12px;
    padding: 20px;
  `,
  duplicateItem: `
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 0;
    border-bottom: 1px solid #f59e0b22;
  `,
  duplicateItemLast: `
    border-bottom: none;
  `,
  duplicateName: `
    color: #fbbf24;
    font-size: 13px;
    font-weight: 500;
  `,
  duplicateInfo: `
    display: flex;
    gap: 16px;
    color: #8a8aaa;
    font-size: 12px;
  `,
  detailPanel: `
    width: 350px;
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
    margin-bottom: 4px;
  `,
  detailPath: `
    color: #6a6a8a;
    font-size: 11px;
    font-family: 'SF Mono', 'Monaco', monospace;
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
    font-size: 16px;
    font-weight: 600;
  `,
  dependencyList: `
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  `,
  dependencyTag: `
    padding: 4px 8px;
    background: #2a2a4e;
    border-radius: 4px;
    font-size: 11px;
    color: #a0a0c0;
    cursor: pointer;
    transition: background 0.2s ease;
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
// Colors
// ============================================================================

const sourceColors: Record<string, string> = {
  'node_modules': '#8b5cf6',
  'src': '#6366f1',
  'vendor': '#f59e0b',
};

const chunkTypeColors: Record<string, { bg: string; text: string }> = {
  entry: { bg: '#6366f122', text: '#6366f1' },
  async: { bg: '#22c55e22', text: '#22c55e' },
  vendor: { bg: '#f59e0b22', text: '#f59e0b' },
  common: { bg: '#3b82f622', text: '#3b82f6' },
};

// ============================================================================
// Helper Functions
// ============================================================================

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}

function formatBytesShort(bytes: number): { value: string; unit: string } {
  if (bytes === 0) return { value: '0', unit: 'B' };
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return {
    value: (bytes / Math.pow(1024, i)).toFixed(1),
    unit: units[i],
  };
}

function calculateChange(current: number, previous: number): { value: number; percent: number } {
  const value = current - previous;
  const percent = previous > 0 ? (value / previous) * 100 : 0;
  return { value, percent };
}

function getModuleName(path: string): string {
  const parts = path.split('/');
  const name = parts[parts.length - 1];
  return name.length > 30 ? name.slice(0, 27) + '...' : name;
}

function getPackageName(path: string): string | undefined {
  const match = path.match(/node_modules\/(@[^/]+\/[^/]+|[^/]+)/);
  return match ? match[1] : undefined;
}

// ============================================================================
// Component
// ============================================================================

export function BundleAnalysisPanel(props: BundleAnalysisPanelProps) {
  const {
    analysis,
    previousAnalysis,
    budgets,
    onModuleSelect,
    onChunkSelect,
    className = '',
  } = props;

  const activeTab = signal<'overview' | 'chunks' | 'modules'>('overview');
  const searchQuery = signal('');
  const sortBy = signal<'size' | 'gzip' | 'name'>('size');
  const filterSource = signal<'all' | 'node_modules' | 'src' | 'vendor'>('all');
  const selectedModule = signal<BundleModule | null>(null);
  const selectedChunk = signal<BundleChunk | null>(null);
  const hoveredModuleId = signal<string | null>(null);
  const hoveredChunkId = signal<string | null>(null);

  // Stats with comparison
  const stats = memo(() => {
    const totalChange = previousAnalysis
      ? calculateChange(analysis.totalSize, previousAnalysis.totalSize)
      : null;
    const gzipChange = previousAnalysis
      ? calculateChange(analysis.totalGzipSize, previousAnalysis.totalGzipSize)
      : null;

    return {
      totalSize: analysis.totalSize,
      totalGzipSize: analysis.totalGzipSize,
      totalBrotliSize: analysis.totalBrotliSize,
      chunkCount: analysis.chunks.length,
      moduleCount: analysis.modules.length,
      totalChange,
      gzipChange,
      duplicateWaste: analysis.duplicates.reduce((sum, d) => sum + d.wastedBytes, 0),
      treeshakingSaved: analysis.treeshaking.savedBytes,
    };
  });

  // Filtered and sorted modules
  const filteredModules = memo(() => {
    let result = [...analysis.modules];

    // Filter by source
    if (filterSource() !== 'all') {
      result = result.filter(m => m.source === filterSource());
    }

    // Filter by search
    if (searchQuery()) {
      const query = searchQuery().toLowerCase();
      result = result.filter(m =>
        m.name.toLowerCase().includes(query) ||
        m.path.toLowerCase().includes(query) ||
        m.packageName?.toLowerCase().includes(query)
      );
    }

    // Sort
    switch (sortBy()) {
      case 'gzip':
        return result.sort((a, b) => b.gzipSize - a.gzipSize);
      case 'name':
        return result.sort((a, b) => a.name.localeCompare(b.name));
      default:
        return result.sort((a, b) => b.size - a.size);
    }
  });

  // Top modules for treemap
  const topModules = memo(() => {
    return [...analysis.modules]
      .sort((a, b) => b.size - a.size)
      .slice(0, 50);
  });

  // Budget status
  const budgetStatus = memo(() => {
    if (!budgets) return null;

    const results: Array<{
      name: string;
      current: number;
      limit: number;
      percent: number;
      status: 'ok' | 'warning' | 'exceeded';
    }> = [];

    if (budgets.total) {
      const percent = (analysis.totalGzipSize / budgets.total) * 100;
      results.push({
        name: 'Total Bundle',
        current: analysis.totalGzipSize,
        limit: budgets.total,
        percent,
        status: percent > 100 ? 'exceeded' : percent > 80 ? 'warning' : 'ok',
      });
    }

    if (budgets.initial) {
      const initialSize = analysis.chunks
        .filter(c => c.isInitial)
        .reduce((sum, c) => sum + c.gzipSize, 0);
      const percent = (initialSize / budgets.initial) * 100;
      results.push({
        name: 'Initial Load',
        current: initialSize,
        limit: budgets.initial,
        percent,
        status: percent > 100 ? 'exceeded' : percent > 80 ? 'warning' : 'ok',
      });
    }

    return results;
  });

  const handleModuleClick = (module: BundleModule) => {
    selectedModule.set(module);
    selectedChunk.set(null);
    onModuleSelect?.(module);
  };

  const handleChunkClick = (chunk: BundleChunk) => {
    selectedChunk.set(chunk);
    selectedModule.set(null);
    onChunkSelect?.(chunk);
  };

  const renderTreemap = () => {
    const modules = topModules();
    const totalSize = modules.reduce((sum, m) => sum + m.size, 0);
    const containerWidth = 700;
    const containerHeight = 200;
    const totalArea = containerWidth * containerHeight;

    // Simple squarified treemap layout
    const items = modules.map(m => {
      const area = (m.size / totalSize) * totalArea;
      const width = Math.sqrt(area * 1.5);
      const height = area / width;
      const color = sourceColors[m.source || 'src'] || '#6366f1';

      return { module: m, width, height, color };
    });

    return (
      <div style={styles.treemapContainer}>
        <div style={styles.treemapTitle}>Bundle Composition (Top 50 Modules)</div>
        <div style={styles.treemap}>
          {items.map(({ module, width, height, color }) => {
            const isHovered = hoveredModuleId() === module.id;

            return (
              <div
                style={styles.treemapItem +
                  (isHovered ? styles.treemapItemHover : '') +
                  `
                  width: ${Math.max(width, 30)}px;
                  height: ${Math.max(height, 30)}px;
                  background: ${color}${isHovered ? 'dd' : 'aa'};
                `}
                onClick={() => handleModuleClick(module)}
                onMouseEnter={() => hoveredModuleId.set(module.id)}
                onMouseLeave={() => hoveredModuleId.set(null)}
                title={`${module.name}\n${formatBytes(module.size)}`}
              >
                {width > 50 && height > 30 && (
                  <span style={styles.treemapLabel}>
                    {getModuleName(module.name)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderChunks = () => (
    <div style={styles.chunkList}>
      {analysis.chunks.map(chunk => {
        const colors = chunkTypeColors[chunk.type];
        const isHovered = hoveredChunkId() === chunk.id;
        const maxSize = Math.max(...analysis.chunks.map(c => c.size));
        const sizePercent = (chunk.size / maxSize) * 100;

        return (
          <div
            style={styles.chunkItem + (isHovered ? styles.chunkItemHover : '')}
            onClick={() => handleChunkClick(chunk)}
            onMouseEnter={() => hoveredChunkId.set(chunk.id)}
            onMouseLeave={() => hoveredChunkId.set(null)}
          >
            <div style={styles.chunkHeader}>
              <div>
                <div style={styles.chunkName}>{chunk.name}</div>
                <span
                  style={styles.chunkType + `background: ${colors.bg}; color: ${colors.text};`}
                >
                  {chunk.type}
                </span>
              </div>
              <div style="text-align: right;">
                <div style="color: #e0e0ff; font-size: 16px; font-weight: 600;">
                  {formatBytes(chunk.size)}
                </div>
                <div style="color: #6a6a8a; font-size: 12px;">
                  {formatBytes(chunk.gzipSize)} gzip
                </div>
              </div>
            </div>
            <div style={styles.chunkMeta}>
              <span>{chunk.modules.length} modules</span>
              <span>{chunk.isInitial ? 'Initial load' : 'Async'}</span>
            </div>
            <div style={styles.chunkSizeBar}>
              <div
                style={styles.chunkSizeBarFill + `
                  width: ${sizePercent}%;
                  background: ${colors.text};
                `}
              />
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderModules = () => (
    <div style={styles.moduleList}>
      {filteredModules().slice(0, 100).map(module => {
        const isHovered = hoveredModuleId() === module.id;
        const color = sourceColors[module.source || 'src'] || '#6366f1';

        return (
          <div
            style={styles.moduleItem + (isHovered ? styles.moduleItemHover : '')}
            onClick={() => handleModuleClick(module)}
            onMouseEnter={() => hoveredModuleId.set(module.id)}
            onMouseLeave={() => hoveredModuleId.set(null)}
          >
            <div style={styles.moduleName}>
              <span
                style={styles.moduleIcon + `background: ${color}22; color: ${color};`}
              >
                {module.source === 'node_modules' ? 'NM' : module.source === 'vendor' ? 'V' : 'S'}
              </span>
              <div style="min-width: 0;">
                <div style={styles.moduleLabel}>{getModuleName(module.name)}</div>
                <div style={styles.modulePath}>{module.path}</div>
              </div>
            </div>
            <div style={styles.moduleSize}>
              <span style={styles.moduleSizeValue}>{formatBytes(module.size)}</span>
              <span style={styles.moduleSizeGzip}>{formatBytes(module.gzipSize)} gzip</span>
            </div>
          </div>
        );
      })}
      {filteredModules().length > 100 && (
        <div style="text-align: center; padding: 16px; color: #6a6a8a; font-size: 12px;">
          +{filteredModules().length - 100} more modules
        </div>
      )}
    </div>
  );

  const renderDetail = () => {
    if (selectedModule()) {
      const module = selectedModule()!;
      const color = sourceColors[module.source || 'src'] || '#6366f1';

      return (
        <div style={styles.detailPanel}>
          <div style={styles.detailHeader}>
            <div style={styles.detailTitle}>{module.name}</div>
            <div style={styles.detailPath}>{module.path}</div>
          </div>

          <div style={styles.detailSection}>
            <div style={styles.detailGrid}>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Size</span>
                <span style={styles.detailValue}>{formatBytes(module.size)}</span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Gzip</span>
                <span style={styles.detailValue}>{formatBytes(module.gzipSize)}</span>
              </div>
              {module.brotliSize && (
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Brotli</span>
                  <span style={styles.detailValue}>{formatBytes(module.brotliSize)}</span>
                </div>
              )}
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Source</span>
                <span style={styles.detailValue + `color: ${color};`}>
                  {module.source || 'unknown'}
                </span>
              </div>
            </div>
          </div>

          {module.packageName && (
            <div style={styles.detailSection}>
              <div style={styles.detailSectionTitle}>Package</div>
              <div style="color: #8b5cf6; font-size: 13px;">{module.packageName}</div>
            </div>
          )}

          <div style={styles.detailSection}>
            <div style={styles.detailSectionTitle}>Properties</div>
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
              {module.isEntryPoint && (
                <span style="padding: 4px 8px; background: #6366f122; color: #6366f1; border-radius: 4px; font-size: 11px;">
                  Entry Point
                </span>
              )}
              {module.isDynamic && (
                <span style="padding: 4px 8px; background: #22c55e22; color: #22c55e; border-radius: 4px; font-size: 11px;">
                  Dynamic Import
                </span>
              )}
            </div>
          </div>

          {module.dependencies.length > 0 && (
            <div style={styles.detailSection}>
              <div style={styles.detailSectionTitle}>
                Dependencies ({module.dependencies.length})
              </div>
              <div style={styles.dependencyList}>
                {module.dependencies.slice(0, 20).map(depId => {
                  const dep = analysis.modules.find(m => m.id === depId);
                  return (
                    <span
                      style={styles.dependencyTag}
                      onClick={() => dep && handleModuleClick(dep)}
                    >
                      {dep ? getModuleName(dep.name) : depId}
                    </span>
                  );
                })}
                {module.dependencies.length > 20 && (
                  <span style="color: #6a6a8a; font-size: 11px;">
                    +{module.dependencies.length - 20} more
                  </span>
                )}
              </div>
            </div>
          )}

          {module.dependents.length > 0 && (
            <div style={styles.detailSection}>
              <div style={styles.detailSectionTitle}>
                Used By ({module.dependents.length})
              </div>
              <div style={styles.dependencyList}>
                {module.dependents.slice(0, 20).map(depId => {
                  const dep = analysis.modules.find(m => m.id === depId);
                  return (
                    <span
                      style={styles.dependencyTag}
                      onClick={() => dep && handleModuleClick(dep)}
                    >
                      {dep ? getModuleName(dep.name) : depId}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      );
    }

    if (selectedChunk()) {
      const chunk = selectedChunk()!;
      const colors = chunkTypeColors[chunk.type];

      return (
        <div style={styles.detailPanel}>
          <div style={styles.detailHeader}>
            <div style={styles.detailTitle}>{chunk.name}</div>
            <span
              style={styles.chunkType + `background: ${colors.bg}; color: ${colors.text}; margin-top: 8px;`}
            >
              {chunk.type}
            </span>
          </div>

          <div style={styles.detailSection}>
            <div style={styles.detailGrid}>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Size</span>
                <span style={styles.detailValue}>{formatBytes(chunk.size)}</span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Gzip</span>
                <span style={styles.detailValue}>{formatBytes(chunk.gzipSize)}</span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Modules</span>
                <span style={styles.detailValue}>{chunk.modules.length}</span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Load</span>
                <span style={styles.detailValue}>{chunk.isInitial ? 'Initial' : 'Async'}</span>
              </div>
            </div>
          </div>

          <div style={styles.detailSection}>
            <div style={styles.detailSectionTitle}>Top Modules</div>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              {chunk.modules
                .sort((a, b) => b.size - a.size)
                .slice(0, 10)
                .map(module => (
                  <div
                    style={`
                      display: flex;
                      justify-content: space-between;
                      padding: 8px 12px;
                      background: #1a1a2e;
                      border-radius: 6px;
                      cursor: pointer;
                    `}
                    onClick={() => handleModuleClick(module)}
                  >
                    <span style="color: #e0e0ff; font-size: 12px; overflow: hidden; text-overflow: ellipsis;">
                      {getModuleName(module.name)}
                    </span>
                    <span style="color: #8a8aaa; font-size: 12px; flex-shrink: 0; margin-left: 8px;">
                      {formatBytes(module.size)}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  const totalFormatted = formatBytesShort(stats().totalSize);
  const gzipFormatted = formatBytesShort(stats().totalGzipSize);

  return (
    <div style={styles.panel} class={className}>
      {/* Header */}
      <div style={styles.header}>
        <div style="display: flex; align-items: center;">
          <h2 style={styles.title}>Bundle Analysis</h2>
          {analysis.version && <span style={styles.version}>v{analysis.version}</span>}
        </div>
        <div style={styles.controls}>
          <div style={styles.tabs}>
            <button
              style={styles.tab + (activeTab() === 'overview' ? styles.tabActive : '')}
              onClick={() => activeTab.set('overview')}
            >
              Overview
            </button>
            <button
              style={styles.tab + (activeTab() === 'chunks' ? styles.tabActive : '')}
              onClick={() => activeTab.set('chunks')}
            >
              Chunks
            </button>
            <button
              style={styles.tab + (activeTab() === 'modules' ? styles.tabActive : '')}
              onClick={() => activeTab.set('modules')}
            >
              Modules
            </button>
          </div>
          {activeTab() === 'modules' && (
            <>
              <input
                type="text"
                placeholder="Search modules..."
                style={styles.searchInput}
                value={searchQuery()}
                onInput={(e: InputEvent) => searchQuery.set((e.target as HTMLInputElement).value)}
              />
              <select
                style={styles.select}
                value={filterSource()}
                onChange={(e: Event) => filterSource.set((e.target as HTMLSelectElement).value as any)}
              >
                <option value="all">All Sources</option>
                <option value="node_modules">node_modules</option>
                <option value="src">Source</option>
                <option value="vendor">Vendor</option>
              </select>
              <select
                style={styles.select}
                value={sortBy()}
                onChange={(e: Event) => sortBy.set((e.target as HTMLSelectElement).value as any)}
              >
                <option value="size">Sort by Size</option>
                <option value="gzip">Sort by Gzip</option>
                <option value="name">Sort by Name</option>
              </select>
            </>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Total Size</div>
          <div style={styles.statValue}>
            {totalFormatted.value}
            <span style={styles.statUnit}>{totalFormatted.unit}</span>
          </div>
          {stats().totalChange && (
            <div style={styles.statChange + (
              stats().totalChange!.value > 0 ? styles.statChangePositive : styles.statChangeNegative
            )}>
              {stats().totalChange!.value > 0 ? '+' : ''}
              {formatBytes(stats().totalChange!.value)}
              ({stats().totalChange!.percent.toFixed(1)}%)
            </div>
          )}
        </div>

        <div style={styles.statCard}>
          <div style={styles.statLabel}>Gzip Size</div>
          <div style={styles.statValue}>
            {gzipFormatted.value}
            <span style={styles.statUnit}>{gzipFormatted.unit}</span>
          </div>
          {budgets?.total && (
            <div style={styles.budgetBar}>
              <div
                style={styles.budgetBarFill + `
                  width: ${Math.min((stats().totalGzipSize / budgets.total) * 100, 100)}%;
                  background: ${(stats().totalGzipSize / budgets.total) > 1 ? '#ef4444' :
                    (stats().totalGzipSize / budgets.total) > 0.8 ? '#f59e0b' : '#22c55e'};
                `}
              />
            </div>
          )}
        </div>

        <div style={styles.statCard}>
          <div style={styles.statLabel}>Chunks</div>
          <div style={styles.statValue}>{stats().chunkCount}</div>
          <div style={styles.statChange + 'color: #6a6a8a;'}>
            {analysis.chunks.filter(c => c.isInitial).length} initial
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statLabel}>Modules</div>
          <div style={styles.statValue}>{stats().moduleCount}</div>
          <div style={styles.statChange + 'color: #6a6a8a;'}>
            {analysis.modules.filter(m => m.source === 'node_modules').length} from npm
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statLabel}>Duplicates</div>
          <div style={styles.statValue + (stats().duplicateWaste > 0 ? 'color: #f59e0b;' : '')}>
            {analysis.duplicates.length}
          </div>
          {stats().duplicateWaste > 0 && (
            <div style={styles.statChange + 'color: #f59e0b;'}>
              {formatBytes(stats().duplicateWaste)} wasted
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={styles.content}>
        <div style={styles.mainArea}>
          {activeTab() === 'overview' && (
            <>
              {/* Treemap */}
              {renderTreemap()}

              {/* Duplicates Warning */}
              {analysis.duplicates.length > 0 && (
                <div style={styles.section}>
                  <div style={styles.sectionTitle}>
                    Duplicate Packages
                    <span style={styles.sectionCount}>{analysis.duplicates.length}</span>
                  </div>
                  <div style={styles.duplicatesSection}>
                    {analysis.duplicates.map((dup, i) => (
                      <div
                        style={styles.duplicateItem +
                          (i === analysis.duplicates.length - 1 ? styles.duplicateItemLast : '')}
                      >
                        <span style={styles.duplicateName}>{dup.name}</span>
                        <div style={styles.duplicateInfo}>
                          <span>{dup.instances} instances</span>
                          <span>{formatBytes(dup.wastedBytes)} wasted</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Chunks Overview */}
              <div style={styles.section}>
                <div style={styles.sectionTitle}>
                  Chunks
                  <span style={styles.sectionCount}>{analysis.chunks.length}</span>
                </div>
                {renderChunks()}
              </div>
            </>
          )}

          {activeTab() === 'chunks' && renderChunks()}
          {activeTab() === 'modules' && renderModules()}
        </div>

        {/* Detail Panel */}
        {(selectedModule() || selectedChunk()) && renderDetail()}
      </div>
    </div>
  );
}

export default BundleAnalysisPanel;
