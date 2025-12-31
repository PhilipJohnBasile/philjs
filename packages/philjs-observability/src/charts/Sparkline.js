/**
 * Sparkline Components - Compact inline charts
 */
/**
 * Sparkline - Simple line sparkline
 */
export function Sparkline(props) {
    const { data, width = 100, height = 30, color = '#4a90d9', strokeWidth = 1.5, showDots = false, className = '', } = props;
    if (data.length === 0) {
        return `<svg width="${width}" height="${height}" class="${className}"></svg>`;
    }
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const points = data.map((value, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((value - min) / range) * height;
        return { x, y };
    });
    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const dots = showDots
        ? points.map((p) => `<circle cx="${p.x}" cy="${p.y}" r="2" fill="${color}" />`).join('')
        : '';
    return `
    <svg width="${width}" height="${height}" class="${className}" xmlns="http://www.w3.org/2000/svg">
      <path d="${pathD}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" />
      ${dots}
    </svg>
  `;
}
/**
 * SparkBar - Bar sparkline
 */
export function SparkBar(props) {
    const { data, width = 100, height = 30, color = '#4a90d9', gap = 1, className = '', } = props;
    if (data.length === 0) {
        return `<svg width="${width}" height="${height}" class="${className}"></svg>`;
    }
    const max = Math.max(...data);
    const barWidth = (width - (data.length - 1) * gap) / data.length;
    const bars = data.map((value, i) => {
        const barHeight = (value / (max || 1)) * height;
        const x = i * (barWidth + gap);
        const y = height - barHeight;
        return `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${color}" />`;
    });
    return `
    <svg width="${width}" height="${height}" class="${className}" xmlns="http://www.w3.org/2000/svg">
      ${bars.join('')}
    </svg>
  `;
}
/**
 * SparkArea - Area sparkline with fill
 */
export function SparkArea(props) {
    const { data, width = 100, height = 30, fillColor = 'rgba(74, 144, 217, 0.3)', strokeColor = '#4a90d9', strokeWidth = 1.5, className = '', } = props;
    if (data.length === 0) {
        return `<svg width="${width}" height="${height}" class="${className}"></svg>`;
    }
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const points = data.map((value, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((value - min) / range) * height;
        return { x, y };
    });
    const lineD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaD = `${lineD} L ${width} ${height} L 0 ${height} Z`;
    return `
    <svg width="${width}" height="${height}" class="${className}" xmlns="http://www.w3.org/2000/svg">
      <path d="${areaD}" fill="${fillColor}" />
      <path d="${lineD}" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" />
    </svg>
  `;
}
//# sourceMappingURL=Sparkline.js.map