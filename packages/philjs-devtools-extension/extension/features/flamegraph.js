/**
 * PhilJS DevTools - Flamegraph
 * Flame chart showing where time is spent in signal updates
 */

export class Flamegraph {
  constructor(container) {
    this.container = container;
    this.canvas = null;
    this.ctx = null;
    this.data = [];
    this.width = 0;
    this.height = 0;
    this.hoveredFrame = null;
    this.selectedFrame = null;
    this.colors = this.generateColors();

    this.init();
  }

  init() {
    // Clear container
    this.container.innerHTML = '';

    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.cursor = 'pointer';
    this.canvas.style.border = '1px solid var(--border)';
    this.canvas.style.borderRadius = '4px';

    this.ctx = this.canvas.getContext('2d');
    this.container.appendChild(this.canvas);

    // Create tooltip
    this.tooltip = document.createElement('div');
    this.tooltip.style.position = 'absolute';
    this.tooltip.style.display = 'none';
    this.tooltip.style.background = 'rgba(0, 0, 0, 0.9)';
    this.tooltip.style.color = '#fff';
    this.tooltip.style.padding = '8px 12px';
    this.tooltip.style.borderRadius = '4px';
    this.tooltip.style.fontSize = '12px';
    this.tooltip.style.pointerEvents = 'none';
    this.tooltip.style.zIndex = '1000';
    this.tooltip.style.whiteSpace = 'pre-line';
    this.container.style.position = 'relative';
    this.container.appendChild(this.tooltip);

    // Update dimensions
    this.updateDimensions();

    // Setup events
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('click', (e) => this.handleClick(e));
    this.canvas.addEventListener('mouseleave', () => this.handleMouseLeave());

    // Handle resize
    window.addEventListener('resize', () => {
      this.updateDimensions();
      this.render();
    });
  }

  updateDimensions() {
    const rect = this.container.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = this.width * window.devicePixelRatio;
    this.canvas.height = this.height * window.devicePixelRatio;
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  generateColors() {
    return [
      '#3b82f6', '#60a5fa', '#2563eb', '#1d4ed8',
      '#10b981', '#34d399', '#059669', '#047857',
      '#f59e0b', '#fbbf24', '#d97706', '#b45309',
      '#ef4444', '#f87171', '#dc2626', '#b91c1c',
      '#8b5cf6', '#a78bfa', '#7c3aed', '#6d28d9',
      '#ec4899', '#f472b6', '#db2777', '#be185d'
    ];
  }

  updateData(performanceData) {
    // Transform performance data into flamegraph format
    // Each frame represents a signal update or component render
    this.data = this.buildFlameData(performanceData);
    this.render();
  }

  buildFlameData(performanceData) {
    // Build hierarchical structure from flat performance data
    const frames = [];
    let currentTime = 0;

    performanceData.forEach((entry, index) => {
      const frame = {
        id: `frame-${index}`,
        name: entry.name || entry.componentName || entry.signal || 'Unknown',
        start: currentTime,
        duration: entry.duration || 0,
        end: currentTime + (entry.duration || 0),
        depth: entry.depth || 0,
        type: entry.type || 'signal',
        details: entry,
        children: []
      };

      currentTime += frame.duration;
      frames.push(frame);
    });

    // Calculate max depth
    this.maxDepth = Math.max(...frames.map(f => f.depth), 0) + 1;

    return frames;
  }

  render() {
    if (!this.ctx) return;

    // Clear canvas
    this.ctx.clearRect(0, 0, this.width, this.height);

    if (this.data.length === 0) {
      this.renderEmpty();
      return;
    }

    // Calculate total duration
    const totalDuration = Math.max(...this.data.map(f => f.end));
    const frameHeight = 20;
    const frameSpacing = 2;

    // Render frames
    this.data.forEach(frame => {
      const x = (frame.start / totalDuration) * this.width;
      const width = (frame.duration / totalDuration) * this.width;
      const y = frame.depth * (frameHeight + frameSpacing);

      // Skip if too small
      if (width < 0.5) return;

      // Determine color
      const colorIndex = this.hashString(frame.name) % this.colors.length;
      const color = this.colors[colorIndex];

      // Draw frame
      this.ctx.fillStyle = color;

      // Highlight if hovered or selected
      if (this.hoveredFrame === frame.id) {
        this.ctx.fillStyle = this.lightenColor(color, 30);
      } else if (this.selectedFrame === frame.id) {
        this.ctx.fillStyle = this.lightenColor(color, 20);
      }

      this.ctx.fillRect(x, y, width, frameHeight);

      // Draw border
      this.ctx.strokeStyle = '#fff';
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(x, y, width, frameHeight);

      // Draw text if wide enough
      if (width > 30) {
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '11px sans-serif';
        this.ctx.textBaseline = 'middle';

        const text = this.truncateText(frame.name, width - 4);
        this.ctx.fillText(text, x + 2, y + frameHeight / 2);
      }

      // Store frame bounds for hit testing
      frame.bounds = { x, y, width, height: frameHeight };
    });

    // Draw time axis
    this.drawTimeAxis(totalDuration);
  }

  drawTimeAxis(totalDuration) {
    const axisY = this.height - 30;
    const axisHeight = 20;

    // Background
    this.ctx.fillStyle = 'var(--bg-secondary)';
    this.ctx.fillRect(0, axisY, this.width, axisHeight);

    // Draw tick marks and labels
    const numTicks = 10;
    this.ctx.fillStyle = 'var(--text-secondary)';
    this.ctx.font = '10px sans-serif';
    this.ctx.textAlign = 'center';

    for (let i = 0; i <= numTicks; i++) {
      const x = (i / numTicks) * this.width;
      const time = (i / numTicks) * totalDuration;

      // Tick mark
      this.ctx.strokeStyle = 'var(--border-dark)';
      this.ctx.beginPath();
      this.ctx.moveTo(x, axisY);
      this.ctx.lineTo(x, axisY + 5);
      this.ctx.stroke();

      // Label
      this.ctx.fillText(this.formatTime(time), x, axisY + 15);
    }
  }

  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Find hovered frame
    const frame = this.data.find(f => {
      if (!f.bounds) return false;
      return x >= f.bounds.x &&
             x <= f.bounds.x + f.bounds.width &&
             y >= f.bounds.y &&
             y <= f.bounds.y + f.bounds.height;
    });

    if (frame) {
      this.hoveredFrame = frame.id;
      this.showTooltip(frame, e.clientX, e.clientY);
    } else {
      this.hoveredFrame = null;
      this.hideTooltip();
    }

    this.render();
  }

  handleClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Find clicked frame
    const frame = this.data.find(f => {
      if (!f.bounds) return false;
      return x >= f.bounds.x &&
             x <= f.bounds.x + f.bounds.width &&
             y >= f.bounds.y &&
             y <= f.bounds.y + f.bounds.height;
    });

    if (frame) {
      this.selectedFrame = frame.id;
      this.dispatchEvent('frameClick', frame);
      this.render();
    }
  }

  handleMouseLeave() {
    this.hoveredFrame = null;
    this.hideTooltip();
    this.render();
  }

  showTooltip(frame, x, y) {
    const content = `${frame.name}
Duration: ${this.formatTime(frame.duration)}
Start: ${this.formatTime(frame.start)}
End: ${this.formatTime(frame.end)}
Type: ${frame.type}`;

    this.tooltip.textContent = content;
    this.tooltip.style.display = 'block';
    this.tooltip.style.left = `${x + 10}px`;
    this.tooltip.style.top = `${y + 10}px`;
  }

  hideTooltip() {
    this.tooltip.style.display = 'none';
  }

  renderEmpty() {
    this.ctx.fillStyle = 'var(--text-tertiary)';
    this.ctx.font = '14px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('No performance data to display', this.width / 2, this.height / 2);
    this.ctx.fillText('Start recording to see flamegraph', this.width / 2, this.height / 2 + 20);
  }

  truncateText(text, maxWidth) {
    this.ctx.font = '11px sans-serif';
    const metrics = this.ctx.measureText(text);

    if (metrics.width <= maxWidth) {
      return text;
    }

    let truncated = text;
    while (truncated.length > 0 && this.ctx.measureText(truncated + '...').width > maxWidth) {
      truncated = truncated.slice(0, -1);
    }

    return truncated + '...';
  }

  formatTime(ms) {
    if (ms < 1) {
      return `${(ms * 1000).toFixed(0)}μs`;
    } else if (ms < 1000) {
      return `${ms.toFixed(2)}ms`;
    } else {
      return `${(ms / 1000).toFixed(2)}s`;
    }
  }

  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  }

  lightenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255))
      .toString(16).slice(1);
  }

  dispatchEvent(eventName, detail) {
    const event = new CustomEvent(eventName, { detail });
    this.container.dispatchEvent(event);
  }

  clear() {
    this.data = [];
    this.selectedFrame = null;
    this.hoveredFrame = null;
    this.render();
  }

  destroy() {
    this.container.innerHTML = '';
  }
}
