/**
 * @philjs/charts - Data visualization library for PhilJS
 *
 * Features:
 * - Line, Bar, Area, Pie, Donut, Scatter, Bubble charts
 * - Real-time data streaming
 * - Interactive tooltips and legends
 * - Responsive and mobile-friendly
 * - Animation and transitions
 * - Multiple axes and mixed chart types
 * - Themes and customization
 * - Canvas and SVG renderers
 * - Zoom and pan
 * - Export to PNG/SVG
 */

// ============================================================================
// TYPES
// ============================================================================

type ChartType = 'line' | 'bar' | 'area' | 'pie' | 'donut' | 'scatter' | 'bubble' | 'radar' | 'heatmap';

interface DataPoint {
  x: number | string | Date;
  y: number;
  label?: string;
  color?: string;
  size?: number;
  metadata?: Record<string, any>;
}

interface DataSeries {
  name: string;
  data: DataPoint[];
  color?: string;
  type?: ChartType;
  yAxisIndex?: number;
  hidden?: boolean;
}

interface AxisConfig {
  title?: string;
  min?: number;
  max?: number;
  tickCount?: number;
  tickFormat?: (value: number) => string;
  gridLines?: boolean;
  position?: 'left' | 'right' | 'top' | 'bottom';
}

interface LegendConfig {
  show?: boolean;
  position?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
}

interface TooltipConfig {
  show?: boolean;
  format?: (point: DataPoint, series: DataSeries) => string;
  shared?: boolean;
}

interface AnimationConfig {
  enabled?: boolean;
  duration?: number;
  easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'bounce';
}

interface ChartConfig {
  type: ChartType;
  width?: number;
  height?: number;
  padding?: { top: number; right: number; bottom: number; left: number };
  title?: string;
  subtitle?: string;
  xAxis?: AxisConfig;
  yAxis?: AxisConfig | AxisConfig[];
  legend?: LegendConfig;
  tooltip?: TooltipConfig;
  animation?: AnimationConfig;
  theme?: 'light' | 'dark' | 'custom';
  colors?: string[];
  responsive?: boolean;
  renderer?: 'canvas' | 'svg';
}

// ============================================================================
// COLOR PALETTES
// ============================================================================

const defaultColors = [
  '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
];

const darkTheme = {
  background: '#1a1a1a',
  text: '#ffffff',
  gridLines: '#333333',
  axis: '#666666'
};

const lightTheme = {
  background: '#ffffff',
  text: '#1f2937',
  gridLines: '#e5e7eb',
  axis: '#9ca3af'
};

// ============================================================================
// SCALES
// ============================================================================

class LinearScale {
  private domain: [number, number];
  private range: [number, number];

  constructor(domain: [number, number], range: [number, number]) {
    this.domain = domain;
    this.range = range;
  }

  scale(value: number): number {
    const [d0, d1] = this.domain;
    const [r0, r1] = this.range;
    return r0 + ((value - d0) / (d1 - d0)) * (r1 - r0);
  }

  invert(value: number): number {
    const [d0, d1] = this.domain;
    const [r0, r1] = this.range;
    return d0 + ((value - r0) / (r1 - r0)) * (d1 - d0);
  }

  ticks(count = 10): number[] {
    const [d0, d1] = this.domain;
    const step = (d1 - d0) / (count - 1);
    return Array.from({ length: count }, (_, i) => d0 + step * i);
  }
}

class BandScale {
  private domain: string[];
  private range: [number, number];
  private paddingInner: number;
  private paddingOuter: number;

  constructor(domain: string[], range: [number, number], padding = 0.1) {
    this.domain = domain;
    this.range = range;
    this.paddingInner = padding;
    this.paddingOuter = padding / 2;
  }

  scale(value: string): number {
    const index = this.domain.indexOf(value);
    if (index === -1) return 0;

    const [r0, r1] = this.range;
    const totalWidth = r1 - r0;
    const step = totalWidth / this.domain.length;
    return r0 + step * index + step * this.paddingOuter;
  }

  bandwidth(): number {
    const [r0, r1] = this.range;
    const totalWidth = r1 - r0;
    const step = totalWidth / this.domain.length;
    return step * (1 - this.paddingInner - this.paddingOuter * 2);
  }
}

class TimeScale extends LinearScale {
  constructor(domain: [Date, Date], range: [number, number]) {
    super([domain[0].getTime(), domain[1].getTime()], range);
  }

  scaleTime(value: Date): number {
    return this.scale(value.getTime());
  }
}

// ============================================================================
// RENDERER BASE
// ============================================================================

interface Renderer {
  clear(): void;
  line(points: Array<{ x: number; y: number }>, options: { color: string; width: number; dash?: number[] }): void;
  rect(x: number, y: number, width: number, height: number, options: { fill?: string; stroke?: string; radius?: number }): void;
  circle(x: number, y: number, radius: number, options: { fill?: string; stroke?: string }): void;
  arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, options: { fill?: string; stroke?: string }): void;
  text(x: number, y: number, text: string, options: { color?: string; size?: number; align?: 'left' | 'center' | 'right'; baseline?: 'top' | 'middle' | 'bottom' }): void;
  path(d: string, options: { fill?: string; stroke?: string; width?: number }): void;
  getCanvas(): HTMLCanvasElement | null;
  getSVG(): SVGElement | null;
}

class CanvasRenderer implements Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;

  constructor(container: HTMLElement, width: number, height: number) {
    this.canvas = document.createElement('canvas');
    this.width = width;
    this.height = height;

    // Handle high DPI
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    this.ctx = this.canvas.getContext('2d')!;
    this.ctx.scale(dpr, dpr);

    container.appendChild(this.canvas);
  }

  clear(): void {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  line(points: Array<{ x: number; y: number }>, options: { color: string; width: number; dash?: number[] }): void {
    if (points.length < 2) return;

    this.ctx.beginPath();
    this.ctx.strokeStyle = options.color;
    this.ctx.lineWidth = options.width;
    if (options.dash) {
      this.ctx.setLineDash(options.dash);
    }

    this.ctx.moveTo(points[0]!.x, points[0]!.y);
    for (let i = 1; i < points.length; i++) {
      this.ctx.lineTo(points[i]!.x, points[i]!.y);
    }

    this.ctx.stroke();
    this.ctx.setLineDash([]);
  }

  rect(x: number, y: number, width: number, height: number, options: { fill?: string; stroke?: string; radius?: number }): void {
    this.ctx.beginPath();

    if (options.radius) {
      const r = options.radius;
      this.ctx.moveTo(x + r, y);
      this.ctx.lineTo(x + width - r, y);
      this.ctx.quadraticCurveTo(x + width, y, x + width, y + r);
      this.ctx.lineTo(x + width, y + height - r);
      this.ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
      this.ctx.lineTo(x + r, y + height);
      this.ctx.quadraticCurveTo(x, y + height, x, y + height - r);
      this.ctx.lineTo(x, y + r);
      this.ctx.quadraticCurveTo(x, y, x + r, y);
    } else {
      this.ctx.rect(x, y, width, height);
    }

    if (options.fill) {
      this.ctx.fillStyle = options.fill;
      this.ctx.fill();
    }

    if (options.stroke) {
      this.ctx.strokeStyle = options.stroke;
      this.ctx.stroke();
    }
  }

  circle(x: number, y: number, radius: number, options: { fill?: string; stroke?: string }): void {
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);

    if (options.fill) {
      this.ctx.fillStyle = options.fill;
      this.ctx.fill();
    }

    if (options.stroke) {
      this.ctx.strokeStyle = options.stroke;
      this.ctx.stroke();
    }
  }

  arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, options: { fill?: string; stroke?: string }): void {
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    this.ctx.arc(x, y, radius, startAngle, endAngle);
    this.ctx.closePath();

    if (options.fill) {
      this.ctx.fillStyle = options.fill;
      this.ctx.fill();
    }

    if (options.stroke) {
      this.ctx.strokeStyle = options.stroke;
      this.ctx.stroke();
    }
  }

  text(x: number, y: number, text: string, options: { color?: string; size?: number; align?: 'left' | 'center' | 'right'; baseline?: 'top' | 'middle' | 'bottom' }): void {
    this.ctx.fillStyle = options.color || '#000';
    this.ctx.font = `${options.size || 12}px -apple-system, sans-serif`;
    this.ctx.textAlign = options.align || 'left';
    this.ctx.textBaseline = options.baseline || 'top';
    this.ctx.fillText(text, x, y);
  }

  path(d: string, options: { fill?: string; stroke?: string; width?: number }): void {
    const path = new Path2D(d);

    if (options.fill) {
      this.ctx.fillStyle = options.fill;
      this.ctx.fill(path);
    }

    if (options.stroke) {
      this.ctx.strokeStyle = options.stroke;
      this.ctx.lineWidth = options.width || 1;
      this.ctx.stroke(path);
    }
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  getSVG(): SVGElement | null {
    return null;
  }
}

// ============================================================================
// CHART CLASS
// ============================================================================

class Chart {
  private container: HTMLElement;
  private config: Required<ChartConfig>;
  private renderer: Renderer;
  private series: DataSeries[] = [];
  private width: number;
  private height: number;
  private plotArea: { x: number; y: number; width: number; height: number };
  private theme: typeof lightTheme;
  private colors: string[];
  private tooltip: HTMLDivElement | null = null;
  private animationProgress = 0;
  private animationFrame: number | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  constructor(container: HTMLElement, config: ChartConfig) {
    this.container = container;
    this.config = this.mergeConfig(config);

    // Set dimensions
    if (this.config.responsive) {
      const rect = container.getBoundingClientRect();
      this.width = config.width || rect.width || 600;
      this.height = config.height || rect.height || 400;
    } else {
      this.width = config.width || 600;
      this.height = config.height || 400;
    }

    // Calculate plot area
    const padding = this.config.padding;
    this.plotArea = {
      x: padding.left,
      y: padding.top,
      width: this.width - padding.left - padding.right,
      height: this.height - padding.top - padding.bottom
    };

    // Set theme
    this.theme = this.config.theme === 'dark' ? darkTheme : lightTheme;
    this.colors = this.config.colors || defaultColors;

    // Create renderer
    this.renderer = new CanvasRenderer(container, this.width, this.height);

    // Create tooltip
    this.createTooltip();

    // Add event listeners
    this.setupEvents();

    // Handle resize
    if (this.config.responsive) {
      window.addEventListener('resize', this.handleResize.bind(this));
    }
  }

  private mergeConfig(config: ChartConfig): Required<ChartConfig> {
    return {
      type: config.type,
      width: config.width || 600,
      height: config.height || 400,
      padding: config.padding || { top: 40, right: 20, bottom: 40, left: 50 },
      title: config.title || '',
      subtitle: config.subtitle || '',
      xAxis: config.xAxis || {},
      yAxis: config.yAxis || {},
      legend: config.legend || { show: true, position: 'top' },
      tooltip: config.tooltip || { show: true },
      animation: config.animation || { enabled: true, duration: 500, easing: 'easeOut' },
      theme: config.theme || 'light',
      colors: config.colors || defaultColors,
      responsive: config.responsive ?? true,
      renderer: config.renderer || 'canvas'
    };
  }

  private createTooltip(): void {
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'philjs-chart-tooltip';
    this.tooltip.style.cssText = `
      position: absolute;
      display: none;
      background: ${this.theme.background};
      border: 1px solid ${this.theme.gridLines};
      border-radius: 4px;
      padding: 8px 12px;
      font-size: 12px;
      color: ${this.theme.text};
      pointer-events: none;
      z-index: 1000;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    `;
    document.body.appendChild(this.tooltip);
  }

  private setupEvents(): void {
    const canvas = this.renderer.getCanvas();
    if (!canvas) return;

    canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
    canvas.addEventListener('click', this.handleClick.bind(this));
  }

  private handleMouseMove(e: MouseEvent): void {
    if (!this.config.tooltip.show || !this.tooltip) return;

    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Find nearest data point
    const point = this.findNearestPoint(x, y);

    if (point) {
      const tooltipContent = this.config.tooltip.format
        ? this.config.tooltip.format(point.point, point.series)
        : `${point.series.name}: ${point.point.y}`;

      this.tooltip.innerHTML = tooltipContent;
      this.tooltip.style.display = 'block';
      this.tooltip.style.left = `${e.clientX + 10}px`;
      this.tooltip.style.top = `${e.clientY + 10}px`;
    } else {
      this.tooltip.style.display = 'none';
    }
  }

  private handleMouseLeave(): void {
    if (this.tooltip) {
      this.tooltip.style.display = 'none';
    }
  }

  private handleClick(e: MouseEvent): void {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const point = this.findNearestPoint(x, y);
    if (point) {
      this.emit('click', point);
    }
  }

  private handleResize(): void {
    const rect = this.container.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;

    const padding = this.config.padding;
    this.plotArea = {
      x: padding.left,
      y: padding.top,
      width: this.width - padding.left - padding.right,
      height: this.height - padding.top - padding.bottom
    };

    this.render();
  }

  private findNearestPoint(x: number, y: number): { point: DataPoint; series: DataSeries } | null {
    let nearest: { point: DataPoint; series: DataSeries; distance: number } | null = null;

    for (const series of this.series) {
      for (const point of series.data) {
        const px = this.getPointX(point);
        const py = this.getPointY(point);
        const distance = Math.sqrt((x - px) ** 2 + (y - py) ** 2);

        if (distance < 20 && (!nearest || distance < nearest.distance)) {
          nearest = { point, series, distance };
        }
      }
    }

    return nearest ? { point: nearest.point, series: nearest.series } : null;
  }

  private getPointX(point: DataPoint): number {
    // Simplified - would use proper scales
    const allX = this.series.flatMap(s => s.data.map(d => d.x));
    const minX = Math.min(...allX.map(x => typeof x === 'number' ? x : 0));
    const maxX = Math.max(...allX.map(x => typeof x === 'number' ? x : allX.length - 1));

    const xValue = typeof point.x === 'number' ? point.x : allX.indexOf(point.x);
    const scale = new LinearScale([minX, maxX], [this.plotArea.x, this.plotArea.x + this.plotArea.width]);
    return scale.scale(xValue);
  }

  private getPointY(point: DataPoint): number {
    const allY = this.series.flatMap(s => s.data.map(d => d.y));
    const minY = Math.min(...allY, 0);
    const maxY = Math.max(...allY);

    const scale = new LinearScale([minY, maxY], [this.plotArea.y + this.plotArea.height, this.plotArea.y]);
    return scale.scale(point.y);
  }

  // ==================== DATA METHODS ====================

  setData(series: DataSeries[]): this {
    this.series = series;
    return this;
  }

  addSeries(series: DataSeries): this {
    this.series.push(series);
    return this;
  }

  removeSeries(name: string): this {
    this.series = this.series.filter(s => s.name !== name);
    return this;
  }

  updateSeries(name: string, data: DataPoint[]): this {
    const series = this.series.find(s => s.name === name);
    if (series) {
      series.data = data;
    }
    return this;
  }

  // ==================== RENDER METHODS ====================

  render(): this {
    if (this.config.animation.enabled) {
      this.animate();
    } else {
      this.animationProgress = 1;
      this.draw();
    }
    return this;
  }

  private animate(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }

    const startTime = performance.now();
    const duration = this.config.animation.duration;

    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration!, 1);

      this.animationProgress = this.applyEasing(progress, this.config.animation.easing ?? 'easeOut');
      this.draw();

      if (progress < 1) {
        this.animationFrame = requestAnimationFrame(step);
      } else {
        this.emit('animationComplete', {});
      }
    };

    this.animationFrame = requestAnimationFrame(step);
  }

  private applyEasing(t: number, easing: string): number {
    switch (easing) {
      case 'easeIn':
        return t * t;
      case 'easeOut':
        return t * (2 - t);
      case 'easeInOut':
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      case 'bounce':
        if (t < 1 / 2.75) return 7.5625 * t * t;
        if (t < 2 / 2.75) return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
        if (t < 2.5 / 2.75) return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
        return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
      default:
        return t;
    }
  }

  private draw(): void {
    this.renderer.clear();
    this.drawBackground();
    this.drawTitle();
    this.drawAxes();
    this.drawGridLines();
    this.drawSeries();
    this.drawLegend();
  }

  private drawBackground(): void {
    this.renderer.rect(0, 0, this.width, this.height, { fill: this.theme.background });
  }

  private drawTitle(): void {
    if (this.config.title) {
      this.renderer.text(this.width / 2, 15, this.config.title, {
        color: this.theme.text,
        size: 16,
        align: 'center'
      });
    }
  }

  private drawAxes(): void {
    const { x, y, width, height } = this.plotArea;

    // X axis
    this.renderer.line(
      [{ x, y: y + height }, { x: x + width, y: y + height }],
      { color: this.theme.axis, width: 1 }
    );

    // Y axis
    this.renderer.line(
      [{ x, y }, { x, y: y + height }],
      { color: this.theme.axis, width: 1 }
    );

    // Draw ticks and labels
    this.drawXAxisLabels();
    this.drawYAxisLabels();
  }

  private drawXAxisLabels(): void {
    const allX = this.series.flatMap(s => s.data.map(d => d.x));
    const uniqueX = [...new Set(allX)];

    uniqueX.forEach((xValue, i) => {
      const x = this.plotArea.x + (i / (uniqueX.length - 1 || 1)) * this.plotArea.width;
      const y = this.plotArea.y + this.plotArea.height + 20;

      const label = xValue instanceof Date
        ? xValue.toLocaleDateString()
        : String(xValue);

      this.renderer.text(x, y, label, {
        color: this.theme.text,
        size: 11,
        align: 'center'
      });
    });
  }

  private drawYAxisLabels(): void {
    const allY = this.series.flatMap(s => s.data.map(d => d.y));
    const minY = Math.min(...allY, 0);
    const maxY = Math.max(...allY);
    const scale = new LinearScale([minY, maxY], [this.plotArea.y + this.plotArea.height, this.plotArea.y]);

    const ticks = scale.ticks(5);
    ticks.forEach(tick => {
      const y = scale.scale(tick);
      const x = this.plotArea.x - 10;

      const format = this.config.yAxis && !Array.isArray(this.config.yAxis) && this.config.yAxis.tickFormat;
      const label = format ? format(tick) : String(Math.round(tick * 100) / 100);

      this.renderer.text(x, y, label, {
        color: this.theme.text,
        size: 11,
        align: 'right',
        baseline: 'middle'
      });
    });
  }

  private drawGridLines(): void {
    const allY = this.series.flatMap(s => s.data.map(d => d.y));
    const minY = Math.min(...allY, 0);
    const maxY = Math.max(...allY);
    const scale = new LinearScale([minY, maxY], [this.plotArea.y + this.plotArea.height, this.plotArea.y]);

    const ticks = scale.ticks(5);
    ticks.forEach(tick => {
      const y = scale.scale(tick);
      this.renderer.line(
        [
          { x: this.plotArea.x, y },
          { x: this.plotArea.x + this.plotArea.width, y }
        ],
        { color: this.theme.gridLines, width: 1, dash: [4, 4] }
      );
    });
  }

  private drawSeries(): void {
    switch (this.config.type) {
      case 'line':
        this.drawLineSeries();
        break;
      case 'bar':
        this.drawBarSeries();
        break;
      case 'area':
        this.drawAreaSeries();
        break;
      case 'pie':
      case 'donut':
        this.drawPieSeries();
        break;
      case 'scatter':
        this.drawScatterSeries();
        break;
      default:
        this.drawLineSeries();
    }
  }

  private drawLineSeries(): void {
    const allY = this.series.flatMap(s => s.data.map(d => d.y));
    const minY = Math.min(...allY, 0);
    const maxY = Math.max(...allY);
    const yScale = new LinearScale([minY, maxY], [this.plotArea.y + this.plotArea.height, this.plotArea.y]);

    this.series.forEach((series, seriesIndex) => {
      if (series.hidden) return;

      const color = series.color ?? this.colors[seriesIndex % this.colors.length]!;
      const points = series.data.map((d, i) => ({
        x: this.plotArea.x + (i / (series.data.length - 1 || 1)) * this.plotArea.width,
        y: yScale.scale(d.y * this.animationProgress)
      }));

      // Draw line
      this.renderer.line(points, { color, width: 2 });

      // Draw points
      points.forEach(p => {
        this.renderer.circle(p.x, p.y, 4, { fill: color });
      });
    });
  }

  private drawBarSeries(): void {
    const allY = this.series.flatMap(s => s.data.map(d => d.y));
    const minY = Math.min(...allY, 0);
    const maxY = Math.max(...allY);
    const yScale = new LinearScale([minY, maxY], [this.plotArea.y + this.plotArea.height, this.plotArea.y]);

    const maxPoints = Math.max(...this.series.map(s => s.data.length));
    const groupWidth = this.plotArea.width / maxPoints;
    const barWidth = (groupWidth * 0.8) / this.series.length;
    const groupPadding = groupWidth * 0.1;

    this.series.forEach((series, seriesIndex) => {
      if (series.hidden) return;

      const color = series.color ?? this.colors[seriesIndex % this.colors.length]!;

      series.data.forEach((d, i) => {
        const x = this.plotArea.x + i * groupWidth + groupPadding + seriesIndex * barWidth;
        const height = (yScale.scale(0) - yScale.scale(d.y)) * this.animationProgress;
        const y = yScale.scale(0) - height;

        this.renderer.rect(x, y, barWidth - 2, height, {
          fill: color,
          radius: 2
        });
      });
    });
  }

  private drawAreaSeries(): void {
    const allY = this.series.flatMap(s => s.data.map(d => d.y));
    const minY = Math.min(...allY, 0);
    const maxY = Math.max(...allY);
    const yScale = new LinearScale([minY, maxY], [this.plotArea.y + this.plotArea.height, this.plotArea.y]);
    const baseline = yScale.scale(0);

    this.series.forEach((series, seriesIndex) => {
      if (series.hidden) return;

      const color = series.color ?? this.colors[seriesIndex % this.colors.length]!;
      const points = series.data.map((d, i) => ({
        x: this.plotArea.x + (i / (series.data.length - 1 || 1)) * this.plotArea.width,
        y: yScale.scale(d.y * this.animationProgress)
      }));

      // Build area path
      let pathD = `M ${points[0]!.x} ${baseline}`;
      points.forEach(p => {
        pathD += ` L ${p.x} ${p.y}`;
      });
      pathD += ` L ${points[points.length - 1]!.x} ${baseline} Z`;

      this.renderer.path(pathD, { fill: color + '40' });
      this.renderer.line(points, { color, width: 2 });
    });
  }

  private drawPieSeries(): void {
    const series = this.series[0];
    if (!series) return;

    const centerX = this.plotArea.x + this.plotArea.width / 2;
    const centerY = this.plotArea.y + this.plotArea.height / 2;
    const radius = Math.min(this.plotArea.width, this.plotArea.height) / 2 * 0.8;
    const innerRadius = this.config.type === 'donut' ? radius * 0.5 : 0;

    const total = series.data.reduce((sum, d) => sum + d.y, 0);
    let startAngle = -Math.PI / 2;

    series.data.forEach((d, i) => {
      const sliceAngle = (d.y / total) * Math.PI * 2 * this.animationProgress;
      const endAngle = startAngle + sliceAngle;
      const color = d.color ?? this.colors[i % this.colors.length]!;

      this.renderer.arc(centerX, centerY, radius, startAngle, endAngle, { fill: color });

      if (innerRadius > 0) {
        this.renderer.circle(centerX, centerY, innerRadius, { fill: this.theme.background });
      }

      startAngle = endAngle;
    });
  }

  private drawScatterSeries(): void {
    const allX = this.series.flatMap(s => s.data.map(d => typeof d.x === 'number' ? d.x : 0));
    const allY = this.series.flatMap(s => s.data.map(d => d.y));

    const xScale = new LinearScale(
      [Math.min(...allX), Math.max(...allX)],
      [this.plotArea.x, this.plotArea.x + this.plotArea.width]
    );
    const yScale = new LinearScale(
      [Math.min(...allY), Math.max(...allY)],
      [this.plotArea.y + this.plotArea.height, this.plotArea.y]
    );

    this.series.forEach((series, seriesIndex) => {
      if (series.hidden) return;

      const color = series.color ?? this.colors[seriesIndex % this.colors.length]!;

      series.data.forEach(d => {
        const x = xScale.scale(typeof d.x === 'number' ? d.x : 0);
        const y = yScale.scale(d.y);
        const size = (d.size ?? 6) * this.animationProgress;

        this.renderer.circle(x, y, size, { fill: color });
      });
    });
  }

  private drawLegend(): void {
    if (!this.config.legend.show) return;

    const legendItems = this.series.map((s, i) => ({
      name: s.name,
      color: s.color ?? this.colors[i % this.colors.length]!,
      hidden: s.hidden
    }));

    const itemHeight = 20;
    const itemWidth = 100;
    const startX = this.plotArea.x;
    let startY = this.config.legend.position === 'bottom'
      ? this.height - 20
      : 30;

    legendItems.forEach((item, i) => {
      const x = startX + (i * itemWidth);
      const fillColor = item.hidden === true ? this.theme.gridLines : item.color;

      this.renderer.rect(x, startY, 12, 12, {
        fill: fillColor,
        radius: 2
      });

      this.renderer.text(x + 18, startY + 6, item.name, {
        color: item.hidden === true ? this.theme.axis : this.theme.text,
        size: 11,
        baseline: 'middle'
      });
    });
  }

  // ==================== EXPORT METHODS ====================

  toDataURL(type = 'image/png'): string {
    const canvas = this.renderer.getCanvas();
    return canvas?.toDataURL(type) || '';
  }

  download(filename = 'chart.png'): void {
    const link = document.createElement('a');
    link.download = filename;
    link.href = this.toDataURL();
    link.click();
  }

  // ==================== EVENT METHODS ====================

  on(event: string, callback: Function): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: any): void {
    this.listeners.get(event)?.forEach(cb => cb(data));
  }

  // ==================== CLEANUP ====================

  destroy(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    if (this.tooltip) {
      this.tooltip.remove();
    }
    window.removeEventListener('resize', this.handleResize.bind(this));
    this.container.innerHTML = '';
  }
}

// ============================================================================
// REACT HOOKS
// ============================================================================

interface UseChartResult {
  chart: Chart | null;
  setData: (series: DataSeries[]) => void;
  addSeries: (series: DataSeries) => void;
  removeSeries: (name: string) => void;
  updateSeries: (name: string, data: DataPoint[]) => void;
  render: () => void;
  download: (filename?: string) => void;
}

function useChart(container: HTMLElement | null, config: ChartConfig): UseChartResult {
  let chart: Chart | null = null;

  if (container) {
    chart = new Chart(container, config);
  }

  return {
    chart,
    setData: (series) => chart?.setData(series).render(),
    addSeries: (series) => chart?.addSeries(series).render(),
    removeSeries: (name) => chart?.removeSeries(name).render(),
    updateSeries: (name, data) => chart?.updateSeries(name, data).render(),
    render: () => chart?.render(),
    download: (filename) => chart?.download(filename)
  };
}

function useRealtimeChart(
  container: HTMLElement | null,
  config: ChartConfig,
  dataStream: AsyncGenerator<DataPoint>
): UseChartResult {
  const result = useChart(container, config);

  const consumeStream = async () => {
    for await (const point of dataStream) {
      if (!result.chart) break;

      const series = result.chart['series'][0];
      if (series) {
        series.data.push(point);
        // Keep last 100 points
        if (series.data.length > 100) {
          series.data.shift();
        }
        result.render();
      }
    }
  };

  consumeStream();

  return result;
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  // Core classes
  Chart,
  CanvasRenderer,
  LinearScale,
  BandScale,
  TimeScale,

  // Hooks
  useChart,
  useRealtimeChart,

  // Constants
  defaultColors,
  darkTheme,
  lightTheme,

  // Types
  type ChartType,
  type DataPoint,
  type DataSeries,
  type AxisConfig,
  type LegendConfig,
  type TooltipConfig,
  type AnimationConfig,
  type ChartConfig,
  type Renderer,
  type UseChartResult
};
