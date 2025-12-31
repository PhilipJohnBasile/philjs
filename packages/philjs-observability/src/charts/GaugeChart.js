/**
 * Gauge Charts - Circular progress/value indicators
 */
function getColorForValue(value, thresholds, defaultColor) {
    if (!thresholds || thresholds.length === 0) {
        return defaultColor || '#4a90d9';
    }
    const sorted = [...thresholds].sort((a, b) => b.value - a.value);
    for (const threshold of sorted) {
        if (value >= threshold.value) {
            return threshold.color;
        }
    }
    return defaultColor || '#4a90d9';
}
/**
 * GaugeChart - Full circular gauge
 */
export function GaugeChart(props) {
    const { value, min = 0, max = 100, width = 200, height = 200, color, backgroundColor = '#e0e0e0', showValue = true, label, unit = '', thresholds, className = '', } = props;
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(cx, cy) - 10;
    const strokeWidth = 15;
    const innerRadius = radius - strokeWidth / 2;
    const percentage = Math.min(Math.max((value - min) / (max - min), 0), 1);
    const circumference = 2 * Math.PI * innerRadius;
    const dashOffset = circumference * (1 - percentage * 0.75); // 270 degrees
    const gaugeColor = getColorForValue(value, thresholds, color);
    // Start at 135 degrees (bottom-left), sweep 270 degrees
    const startAngle = 135;
    const endAngle = startAngle + 270 * percentage;
    return `
    <svg width="${width}" height="${height}" class="${className}" xmlns="http://www.w3.org/2000/svg">
      <!-- Background arc -->
      <circle
        cx="${cx}"
        cy="${cy}"
        r="${innerRadius}"
        fill="none"
        stroke="${backgroundColor}"
        stroke-width="${strokeWidth}"
        stroke-dasharray="${circumference * 0.75} ${circumference * 0.25}"
        stroke-dashoffset="${-circumference * 0.375}"
        transform="rotate(0, ${cx}, ${cy})"
      />
      <!-- Value arc -->
      <circle
        cx="${cx}"
        cy="${cy}"
        r="${innerRadius}"
        fill="none"
        stroke="${gaugeColor}"
        stroke-width="${strokeWidth}"
        stroke-dasharray="${circumference * 0.75 * percentage} ${circumference}"
        stroke-dashoffset="${-circumference * 0.375}"
        stroke-linecap="round"
        transform="rotate(0, ${cx}, ${cy})"
      />
      ${showValue ? `<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle" font-size="24" font-weight="bold">${value}${unit}</text>` : ''}
      ${label ? `<text x="${cx}" y="${cy + 25}" text-anchor="middle" font-size="12" fill="#666">${label}</text>` : ''}
    </svg>
  `;
}
/**
 * MiniGauge - Compact circular progress
 */
export function MiniGauge(props) {
    const { value, max = 100, size = 40, color = '#4a90d9', backgroundColor = '#e0e0e0', strokeWidth = 4, className = '', } = props;
    const cx = size / 2;
    const cy = size / 2;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const percentage = Math.min(Math.max(value / max, 0), 1);
    const dashOffset = circumference * (1 - percentage);
    return `
    <svg width="${size}" height="${size}" class="${className}" xmlns="http://www.w3.org/2000/svg">
      <circle
        cx="${cx}"
        cy="${cy}"
        r="${radius}"
        fill="none"
        stroke="${backgroundColor}"
        stroke-width="${strokeWidth}"
      />
      <circle
        cx="${cx}"
        cy="${cy}"
        r="${radius}"
        fill="none"
        stroke="${color}"
        stroke-width="${strokeWidth}"
        stroke-dasharray="${circumference}"
        stroke-dashoffset="${dashOffset}"
        stroke-linecap="round"
        transform="rotate(-90, ${cx}, ${cy})"
      />
    </svg>
  `;
}
/**
 * HalfGauge - Semi-circular gauge
 */
export function HalfGauge(props) {
    const { value, min = 0, max = 100, width = 200, height = 120, color = '#4a90d9', backgroundColor = '#e0e0e0', showValue = true, label, unit = '', className = '', } = props;
    const cx = width / 2;
    const cy = height - 10;
    const radius = Math.min(cx, height) - 20;
    const strokeWidth = 12;
    const innerRadius = radius - strokeWidth / 2;
    const percentage = Math.min(Math.max((value - min) / (max - min), 0), 1);
    const circumference = Math.PI * innerRadius; // Half circle
    const dashOffset = circumference * (1 - percentage);
    return `
    <svg width="${width}" height="${height}" class="${className}" xmlns="http://www.w3.org/2000/svg">
      <!-- Background arc -->
      <path
        d="M ${cx - innerRadius} ${cy} A ${innerRadius} ${innerRadius} 0 0 1 ${cx + innerRadius} ${cy}"
        fill="none"
        stroke="${backgroundColor}"
        stroke-width="${strokeWidth}"
      />
      <!-- Value arc -->
      <path
        d="M ${cx - innerRadius} ${cy} A ${innerRadius} ${innerRadius} 0 0 1 ${cx + innerRadius} ${cy}"
        fill="none"
        stroke="${color}"
        stroke-width="${strokeWidth}"
        stroke-dasharray="${circumference}"
        stroke-dashoffset="${dashOffset}"
        stroke-linecap="round"
      />
      ${showValue ? `<text x="${cx}" y="${cy - 10}" text-anchor="middle" font-size="20" font-weight="bold">${value}${unit}</text>` : ''}
      ${label ? `<text x="${cx}" y="${cy + 10}" text-anchor="middle" font-size="11" fill="#666">${label}</text>` : ''}
    </svg>
  `;
}
//# sourceMappingURL=GaugeChart.js.map