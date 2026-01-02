/**
 * Type definitions for PhilJS Charts
 */

import type { ChartTheme } from './utils/colors.js';
import type { AnimationConfig } from './utils/animations.js';

// Signal type from @philjs/core
export interface Signal<T> {
  (): T;
  set: (value: T) => void;
}

// Base chart props
export interface BaseChartProps {
  /** Width of the chart (number for pixels, string for CSS value) */
  width?: number | string;
  /** Height of the chart (number for pixels, string for CSS value) */
  height?: number | string;
  /** Enable responsive sizing */
  responsive?: boolean;
  /** Margin around the chart */
  margin?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  /** Theme configuration */
  theme?: ChartTheme | 'light' | 'dark';
  /** Animation configuration */
  animation?: AnimationConfig | boolean;
  /** CSS class name */
  className?: string;
  /** Inline styles */
  style?: Record<string, string | number>;
  /** ARIA label for accessibility */
  ariaLabel?: string;
  /** Title for the chart */
  title?: string;
}

// Data point types
export interface DataPoint {
  [key: string]: unknown;
}

export interface NumericDataPoint {
  x: number;
  y: number;
  [key: string]: unknown;
}

export interface CategoryDataPoint {
  name: string;
  value: number;
  [key: string]: unknown;
}

export interface TimeSeriesDataPoint {
  timestamp: Date | number | string;
  value: number;
  [key: string]: unknown;
}

// Series configuration
export interface Series {
  name: string;
  dataKey: string;
  color?: string;
  type?: 'line' | 'bar' | 'area';
  hidden?: boolean;
}

// Axis configuration
export interface AxisConfig {
  dataKey?: string;
  label?: string;
  type?: 'number' | 'category' | 'time';
  domain?: [number | 'auto', number | 'auto'];
  tickCount?: number;
  tickFormat?: (value: unknown) => string;
  hide?: boolean;
  grid?: boolean;
}

// Legend configuration
export interface LegendConfig {
  show?: boolean;
  position?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  onClick?: (series: Series) => void;
}

// Tooltip configuration
export interface TooltipConfig {
  show?: boolean;
  formatter?: (label: string, value: unknown, payload?: unknown) => string;
  cursor?: boolean | { stroke?: string; strokeWidth?: number };
}

// Chart-specific props
export interface LineChartProps extends BaseChartProps {
  data: DataPoint[] | Signal<DataPoint[]>;
  xAxis?: AxisConfig;
  yAxis?: AxisConfig;
  series?: Series[];
  curve?: 'linear' | 'monotone' | 'step' | 'natural';
  showDots?: boolean;
  dotSize?: number;
  strokeWidth?: number;
  area?: boolean;
  areaOpacity?: number;
  legend?: LegendConfig;
  tooltip?: TooltipConfig;
  onDataPointClick?: (data: DataPoint, index: number) => void;
}

export interface BarChartProps extends BaseChartProps {
  data: DataPoint[] | Signal<DataPoint[]>;
  xAxis?: AxisConfig;
  yAxis?: AxisConfig;
  series?: Series[];
  layout?: 'vertical' | 'horizontal';
  stacked?: boolean;
  barGap?: number;
  barSize?: number;
  radius?: number | [number, number, number, number];
  legend?: LegendConfig;
  tooltip?: TooltipConfig;
  onBarClick?: (data: DataPoint, index: number) => void;
}

export interface PieChartProps extends BaseChartProps {
  data: CategoryDataPoint[] | Signal<CategoryDataPoint[]>;
  dataKey?: string;
  nameKey?: string;
  innerRadius?: number | string;
  outerRadius?: number | string;
  startAngle?: number;
  endAngle?: number;
  paddingAngle?: number;
  label?: boolean | ((entry: CategoryDataPoint) => string);
  labelLine?: boolean;
  legend?: LegendConfig;
  tooltip?: TooltipConfig;
  onSliceClick?: (data: CategoryDataPoint, index: number) => void;
}

export interface ScatterChartProps extends BaseChartProps {
  data: NumericDataPoint[] | Signal<NumericDataPoint[]>;
  xAxis?: AxisConfig;
  yAxis?: AxisConfig;
  xDataKey?: string;
  yDataKey?: string;
  sizeDataKey?: string;
  colorDataKey?: string;
  shape?: 'circle' | 'square' | 'triangle' | 'diamond';
  size?: number;
  legend?: LegendConfig;
  tooltip?: TooltipConfig;
  onPointClick?: (data: NumericDataPoint, index: number) => void;
}

export interface RadarChartProps extends BaseChartProps {
  data: DataPoint[] | Signal<DataPoint[]>;
  dataKey?: string;
  categories: string[];
  series?: Series[];
  startAngle?: number;
  outerRadius?: number | string;
  gridType?: 'polygon' | 'circle';
  fillOpacity?: number;
  legend?: LegendConfig;
  tooltip?: TooltipConfig;
}

export interface HeatmapProps extends BaseChartProps {
  data: HeatmapDataPoint[] | Signal<HeatmapDataPoint[]>;
  xCategories: string[];
  yCategories: string[];
  xDataKey?: string;
  yDataKey?: string;
  valueDataKey?: string;
  colorScale?: string[];
  cellBorderWidth?: number;
  cellBorderColor?: string;
  showLabels?: boolean;
  tooltip?: TooltipConfig;
  onCellClick?: (data: HeatmapDataPoint) => void;
}

export interface HeatmapDataPoint {
  x: string | number;
  y: string | number;
  value: number;
  [key: string]: unknown;
}

export interface TreemapProps extends BaseChartProps {
  data: TreemapNode[] | Signal<TreemapNode[]>;
  dataKey?: string;
  aspectRatio?: number;
  colorBy?: 'value' | 'depth' | 'category';
  showLabels?: boolean;
  nestedAnimation?: boolean;
  tooltip?: TooltipConfig;
  onNodeClick?: (node: TreemapNode) => void;
}

export interface TreemapNode {
  name: string;
  value?: number;
  children?: TreemapNode[];
  color?: string;
  [key: string]: unknown;
}

export interface SankeyProps extends BaseChartProps {
  data: SankeyData | Signal<SankeyData>;
  nodeWidth?: number;
  nodePadding?: number;
  nodeAlign?: 'left' | 'right' | 'center' | 'justify';
  linkOpacity?: number;
  nodeBorderRadius?: number;
  showLabels?: boolean;
  tooltip?: TooltipConfig;
  onNodeClick?: (node: SankeyNode) => void;
  onLinkClick?: (link: SankeyLink) => void;
}

export interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

export interface SankeyNode {
  name: string;
  color?: string;
  [key: string]: unknown;
}

export interface SankeyLink {
  source: number | string;
  target: number | string;
  value: number;
  color?: string;
  [key: string]: unknown;
}

export interface GaugeProps extends BaseChartProps {
  value: number | Signal<number>;
  min?: number;
  max?: number;
  startAngle?: number;
  endAngle?: number;
  innerRadius?: number | string;
  outerRadius?: number | string;
  segments?: GaugeSegment[];
  showValue?: boolean;
  valueFormat?: (value: number) => string;
  label?: string;
  pointer?: boolean;
  pointerColor?: string;
  trackColor?: string;
}

export interface GaugeSegment {
  value: number;
  color: string;
  label?: string;
}

export interface SparklineProps {
  data: number[] | Signal<number[]>;
  width?: number;
  height?: number;
  type?: 'line' | 'bar' | 'area';
  color?: string;
  fillColor?: string;
  strokeWidth?: number;
  showMinMax?: boolean;
  showLast?: boolean;
  animation?: boolean;
  className?: string;
  style?: Record<string, string | number>;
}

export interface DashboardProps extends BaseChartProps {
  columns?: number;
  gap?: number;
  children?: unknown;
  onLayoutChange?: (layout: DashboardLayout) => void;
  draggable?: boolean;
  resizable?: boolean;
}

export interface DashboardLayout {
  items: DashboardItem[];
}

export interface DashboardItem {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

// Export formats
export type ExportFormat = 'png' | 'svg' | 'jpeg' | 'webp';

export interface ExportOptions {
  format?: ExportFormat;
  quality?: number;
  scale?: number;
  backgroundColor?: string;
  filename?: string;
}
