
export type ChartType = 'area' | 'bar' | 'line' | 'pie' | 'radar' | 'radialBar' | 'scatter';

export interface ChartProps {
    type: ChartType;
    data: any[];
    width?: number | string;
    height?: number | string;
    xAxisKey?: string;
    series?: Array<{ key: string, color?: string }>;
}

export function Chart(props: ChartProps) {
    const width = props.width || '100%';
    const height = props.height || 400;

    // Emulate Recharts ResponsiveContainer behavior
    return \`<div class="phil-chart-container" style="width: \${width}; height: \${height}; position: relative;">
    <div class="recharts-wrapper">
      Mock \${props.type.toUpperCase()} Chart
      Points: \${props.data.length}
      Series: \${props.series?.map(s => s.key).join(', ') || 'Auto'}
    </div>
  </div>\`;
}
