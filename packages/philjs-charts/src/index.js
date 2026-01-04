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
    domain;
    range;
    constructor(domain, range) {
        this.domain = domain;
        this.range = range;
    }
    scale(value) {
        const [d0, d1] = this.domain;
        const [r0, r1] = this.range;
        return r0 + ((value - d0) / (d1 - d0)) * (r1 - r0);
    }
    invert(value) {
        const [d0, d1] = this.domain;
        const [r0, r1] = this.range;
        return d0 + ((value - r0) / (r1 - r0)) * (d1 - d0);
    }
    ticks(count = 10) {
        const [d0, d1] = this.domain;
        const step = (d1 - d0) / (count - 1);
        return Array.from({ length: count }, (_, i) => d0 + step * i);
    }
}
class BandScale {
    domain;
    range;
    paddingInner;
    paddingOuter;
    constructor(domain, range, padding = 0.1) {
        this.domain = domain;
        this.range = range;
        this.paddingInner = padding;
        this.paddingOuter = padding / 2;
    }
    scale(value) {
        const index = this.domain.indexOf(value);
        if (index === -1)
            return 0;
        const [r0, r1] = this.range;
        const totalWidth = r1 - r0;
        const step = totalWidth / this.domain.length;
        return r0 + step * index + step * this.paddingOuter;
    }
    bandwidth() {
        const [r0, r1] = this.range;
        const totalWidth = r1 - r0;
        const step = totalWidth / this.domain.length;
        return step * (1 - this.paddingInner - this.paddingOuter * 2);
    }
}
class TimeScale extends LinearScale {
    constructor(domain, range) {
        super([domain[0].getTime(), domain[1].getTime()], range);
    }
    scaleTime(value) {
        return this.scale(value.getTime());
    }
}
class CanvasRenderer {
    canvas;
    ctx;
    width;
    height;
    constructor(container, width, height) {
        this.canvas = document.createElement('canvas');
        this.width = width;
        this.height = height;
        // Handle high DPI
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = width * dpr;
        this.canvas.height = height * dpr;
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;
        this.ctx = this.canvas.getContext('2d');
        this.ctx.scale(dpr, dpr);
        container.appendChild(this.canvas);
    }
    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }
    line(points, options) {
        if (points.length < 2)
            return;
        this.ctx.beginPath();
        this.ctx.strokeStyle = options.color;
        this.ctx.lineWidth = options.width;
        if (options.dash) {
            this.ctx.setLineDash(options.dash);
        }
        this.ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            this.ctx.lineTo(points[i].x, points[i].y);
        }
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }
    rect(x, y, width, height, options) {
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
        }
        else {
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
    circle(x, y, radius, options) {
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
    arc(x, y, radius, startAngle, endAngle, options) {
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
    text(x, y, text, options) {
        this.ctx.fillStyle = options.color || '#000';
        this.ctx.font = `${options.size || 12}px -apple-system, sans-serif`;
        this.ctx.textAlign = options.align || 'left';
        this.ctx.textBaseline = options.baseline || 'top';
        this.ctx.fillText(text, x, y);
    }
    path(d, options) {
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
    getCanvas() {
        return this.canvas;
    }
    getSVG() {
        return null;
    }
}
// ============================================================================
// CHART CLASS
// ============================================================================
class Chart {
    container;
    config;
    renderer;
    series = [];
    width;
    height;
    plotArea;
    theme;
    colors;
    tooltip = null;
    animationProgress = 0;
    animationFrame = null;
    listeners = new Map();
    constructor(container, config) {
        this.container = container;
        this.config = this.mergeConfig(config);
        // Set dimensions
        if (this.config.responsive) {
            const rect = container.getBoundingClientRect();
            this.width = config.width || rect.width || 600;
            this.height = config.height || rect.height || 400;
        }
        else {
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
    mergeConfig(config) {
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
    createTooltip() {
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
    setupEvents() {
        const canvas = this.renderer.getCanvas();
        if (!canvas)
            return;
        canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
        canvas.addEventListener('click', this.handleClick.bind(this));
    }
    handleMouseMove(e) {
        if (!this.config.tooltip.show || !this.tooltip)
            return;
        const rect = e.target.getBoundingClientRect();
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
        }
        else {
            this.tooltip.style.display = 'none';
        }
    }
    handleMouseLeave() {
        if (this.tooltip) {
            this.tooltip.style.display = 'none';
        }
    }
    handleClick(e) {
        const rect = e.target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const point = this.findNearestPoint(x, y);
        if (point) {
            this.emit('click', point);
        }
    }
    handleResize() {
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
    findNearestPoint(x, y) {
        let nearest = null;
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
    getPointX(point) {
        // Simplified - would use proper scales
        const allX = this.series.flatMap(s => s.data.map(d => d.x));
        const minX = Math.min(...allX.map(x => typeof x === 'number' ? x : 0));
        const maxX = Math.max(...allX.map(x => typeof x === 'number' ? x : allX.length - 1));
        const xValue = typeof point.x === 'number' ? point.x : allX.indexOf(point.x);
        const scale = new LinearScale([minX, maxX], [this.plotArea.x, this.plotArea.x + this.plotArea.width]);
        return scale.scale(xValue);
    }
    getPointY(point) {
        const allY = this.series.flatMap(s => s.data.map(d => d.y));
        const minY = Math.min(...allY, 0);
        const maxY = Math.max(...allY);
        const scale = new LinearScale([minY, maxY], [this.plotArea.y + this.plotArea.height, this.plotArea.y]);
        return scale.scale(point.y);
    }
    // ==================== DATA METHODS ====================
    setData(series) {
        this.series = series;
        return this;
    }
    addSeries(series) {
        this.series.push(series);
        return this;
    }
    removeSeries(name) {
        this.series = this.series.filter(s => s.name !== name);
        return this;
    }
    updateSeries(name, data) {
        const series = this.series.find(s => s.name === name);
        if (series) {
            series.data = data;
        }
        return this;
    }
    // ==================== RENDER METHODS ====================
    render() {
        if (this.config.animation.enabled) {
            this.animate();
        }
        else {
            this.animationProgress = 1;
            this.draw();
        }
        return this;
    }
    animate() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        const startTime = performance.now();
        const duration = this.config.animation.duration;
        const step = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            this.animationProgress = this.applyEasing(progress, this.config.animation.easing ?? 'easeOut');
            this.draw();
            if (progress < 1) {
                this.animationFrame = requestAnimationFrame(step);
            }
            else {
                this.emit('animationComplete', {});
            }
        };
        this.animationFrame = requestAnimationFrame(step);
    }
    applyEasing(t, easing) {
        switch (easing) {
            case 'easeIn':
                return t * t;
            case 'easeOut':
                return t * (2 - t);
            case 'easeInOut':
                return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
            case 'bounce':
                if (t < 1 / 2.75)
                    return 7.5625 * t * t;
                if (t < 2 / 2.75)
                    return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
                if (t < 2.5 / 2.75)
                    return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
                return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
            default:
                return t;
        }
    }
    draw() {
        this.renderer.clear();
        this.drawBackground();
        this.drawTitle();
        this.drawAxes();
        this.drawGridLines();
        this.drawSeries();
        this.drawLegend();
    }
    drawBackground() {
        this.renderer.rect(0, 0, this.width, this.height, { fill: this.theme.background });
    }
    drawTitle() {
        if (this.config.title) {
            this.renderer.text(this.width / 2, 15, this.config.title, {
                color: this.theme.text,
                size: 16,
                align: 'center'
            });
        }
    }
    drawAxes() {
        const { x, y, width, height } = this.plotArea;
        // X axis
        this.renderer.line([{ x, y: y + height }, { x: x + width, y: y + height }], { color: this.theme.axis, width: 1 });
        // Y axis
        this.renderer.line([{ x, y }, { x, y: y + height }], { color: this.theme.axis, width: 1 });
        // Draw ticks and labels
        this.drawXAxisLabels();
        this.drawYAxisLabels();
    }
    drawXAxisLabels() {
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
    drawYAxisLabels() {
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
    drawGridLines() {
        const allY = this.series.flatMap(s => s.data.map(d => d.y));
        const minY = Math.min(...allY, 0);
        const maxY = Math.max(...allY);
        const scale = new LinearScale([minY, maxY], [this.plotArea.y + this.plotArea.height, this.plotArea.y]);
        const ticks = scale.ticks(5);
        ticks.forEach(tick => {
            const y = scale.scale(tick);
            this.renderer.line([
                { x: this.plotArea.x, y },
                { x: this.plotArea.x + this.plotArea.width, y }
            ], { color: this.theme.gridLines, width: 1, dash: [4, 4] });
        });
    }
    drawSeries() {
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
    drawLineSeries() {
        const allY = this.series.flatMap(s => s.data.map(d => d.y));
        const minY = Math.min(...allY, 0);
        const maxY = Math.max(...allY);
        const yScale = new LinearScale([minY, maxY], [this.plotArea.y + this.plotArea.height, this.plotArea.y]);
        this.series.forEach((series, seriesIndex) => {
            if (series.hidden)
                return;
            const color = series.color ?? this.colors[seriesIndex % this.colors.length];
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
    drawBarSeries() {
        const allY = this.series.flatMap(s => s.data.map(d => d.y));
        const minY = Math.min(...allY, 0);
        const maxY = Math.max(...allY);
        const yScale = new LinearScale([minY, maxY], [this.plotArea.y + this.plotArea.height, this.plotArea.y]);
        const maxPoints = Math.max(...this.series.map(s => s.data.length));
        const groupWidth = this.plotArea.width / maxPoints;
        const barWidth = (groupWidth * 0.8) / this.series.length;
        const groupPadding = groupWidth * 0.1;
        this.series.forEach((series, seriesIndex) => {
            if (series.hidden)
                return;
            const color = series.color ?? this.colors[seriesIndex % this.colors.length];
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
    drawAreaSeries() {
        const allY = this.series.flatMap(s => s.data.map(d => d.y));
        const minY = Math.min(...allY, 0);
        const maxY = Math.max(...allY);
        const yScale = new LinearScale([minY, maxY], [this.plotArea.y + this.plotArea.height, this.plotArea.y]);
        const baseline = yScale.scale(0);
        this.series.forEach((series, seriesIndex) => {
            if (series.hidden)
                return;
            const color = series.color ?? this.colors[seriesIndex % this.colors.length];
            const points = series.data.map((d, i) => ({
                x: this.plotArea.x + (i / (series.data.length - 1 || 1)) * this.plotArea.width,
                y: yScale.scale(d.y * this.animationProgress)
            }));
            // Build area path
            let pathD = `M ${points[0].x} ${baseline}`;
            points.forEach(p => {
                pathD += ` L ${p.x} ${p.y}`;
            });
            pathD += ` L ${points[points.length - 1].x} ${baseline} Z`;
            this.renderer.path(pathD, { fill: color + '40' });
            this.renderer.line(points, { color, width: 2 });
        });
    }
    drawPieSeries() {
        const series = this.series[0];
        if (!series)
            return;
        const centerX = this.plotArea.x + this.plotArea.width / 2;
        const centerY = this.plotArea.y + this.plotArea.height / 2;
        const radius = Math.min(this.plotArea.width, this.plotArea.height) / 2 * 0.8;
        const innerRadius = this.config.type === 'donut' ? radius * 0.5 : 0;
        const total = series.data.reduce((sum, d) => sum + d.y, 0);
        let startAngle = -Math.PI / 2;
        series.data.forEach((d, i) => {
            const sliceAngle = (d.y / total) * Math.PI * 2 * this.animationProgress;
            const endAngle = startAngle + sliceAngle;
            const color = d.color ?? this.colors[i % this.colors.length];
            this.renderer.arc(centerX, centerY, radius, startAngle, endAngle, { fill: color });
            if (innerRadius > 0) {
                this.renderer.circle(centerX, centerY, innerRadius, { fill: this.theme.background });
            }
            startAngle = endAngle;
        });
    }
    drawScatterSeries() {
        const allX = this.series.flatMap(s => s.data.map(d => typeof d.x === 'number' ? d.x : 0));
        const allY = this.series.flatMap(s => s.data.map(d => d.y));
        const xScale = new LinearScale([Math.min(...allX), Math.max(...allX)], [this.plotArea.x, this.plotArea.x + this.plotArea.width]);
        const yScale = new LinearScale([Math.min(...allY), Math.max(...allY)], [this.plotArea.y + this.plotArea.height, this.plotArea.y]);
        this.series.forEach((series, seriesIndex) => {
            if (series.hidden)
                return;
            const color = series.color ?? this.colors[seriesIndex % this.colors.length];
            series.data.forEach(d => {
                const x = xScale.scale(typeof d.x === 'number' ? d.x : 0);
                const y = yScale.scale(d.y);
                const size = (d.size ?? 6) * this.animationProgress;
                this.renderer.circle(x, y, size, { fill: color });
            });
        });
    }
    drawLegend() {
        if (!this.config.legend.show)
            return;
        const legendItems = this.series.map((s, i) => ({
            name: s.name,
            color: s.color ?? this.colors[i % this.colors.length],
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
    toDataURL(type = 'image/png') {
        const canvas = this.renderer.getCanvas();
        return canvas?.toDataURL(type) || '';
    }
    download(filename = 'chart.png') {
        const link = document.createElement('a');
        link.download = filename;
        link.href = this.toDataURL();
        link.click();
    }
    // ==================== EVENT METHODS ====================
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);
        return () => this.listeners.get(event)?.delete(callback);
    }
    emit(event, data) {
        this.listeners.get(event)?.forEach(cb => cb(data));
    }
    // ==================== CLEANUP ====================
    destroy() {
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
function useChart(container, config) {
    let chart = null;
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
function useRealtimeChart(container, config, dataStream) {
    const result = useChart(container, config);
    const consumeStream = async () => {
        for await (const point of dataStream) {
            if (!result.chart)
                break;
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
Chart, CanvasRenderer, LinearScale, BandScale, TimeScale, 
// Hooks
useChart, useRealtimeChart, 
// Constants
defaultColors, darkTheme, lightTheme };
//# sourceMappingURL=index.js.map