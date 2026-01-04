# @philjs/charts

The `@philjs/charts` package provides a complete data visualization library for PhilJS applications with support for multiple chart types, animations, interactivity, and real-time data streaming.

## Installation

```bash
npm install @philjs/charts
```

## Features

- **Multiple Chart Types** - Line, Bar, Area, Pie, Donut, Scatter, Bubble, Radar, Heatmap
- **Real-time Streaming** - Live data visualization with auto-scrolling
- **Interactive** - Tooltips, legends, click events, hover states
- **Animations** - Smooth transitions with multiple easing functions
- **Canvas & SVG** - High-performance Canvas renderer with SVG support
- **Responsive** - Auto-resize with window changes
- **Themes** - Light and dark themes with customization
- **Export** - Download charts as PNG/SVG

## Quick Start

```typescript
import { Chart } from '@philjs/charts';

// Create a line chart
const container = document.getElementById('chart')!;

const chart = new Chart(container, {
  type: 'line',
  width: 800,
  height: 400,
  title: 'Monthly Sales',
  animation: { enabled: true, duration: 500 },
});

chart.setData([
  {
    name: 'Revenue',
    data: [
      { x: 'Jan', y: 1200 },
      { x: 'Feb', y: 1900 },
      { x: 'Mar', y: 1500 },
      { x: 'Apr', y: 2200 },
      { x: 'May', y: 2800 },
      { x: 'Jun', y: 2400 },
    ],
  },
]).render();
```

---

## Chart Types

### Line Chart

```typescript
import { Chart } from '@philjs/charts';

const chart = new Chart(container, {
  type: 'line',
  title: 'Temperature Over Time',
});

chart.setData([
  {
    name: 'Temperature',
    data: [
      { x: 0, y: 20 },
      { x: 1, y: 22 },
      { x: 2, y: 25 },
      { x: 3, y: 23 },
      { x: 4, y: 21 },
    ],
    color: '#3b82f6',
  },
]).render();
```

### Bar Chart

```typescript
const chart = new Chart(container, {
  type: 'bar',
  title: 'Sales by Category',
});

chart.setData([
  {
    name: 'Q1 Sales',
    data: [
      { x: 'Electronics', y: 4500 },
      { x: 'Clothing', y: 3200 },
      { x: 'Food', y: 2800 },
      { x: 'Books', y: 1500 },
    ],
    color: '#22c55e',
  },
  {
    name: 'Q2 Sales',
    data: [
      { x: 'Electronics', y: 5200 },
      { x: 'Clothing', y: 3800 },
      { x: 'Food', y: 3100 },
      { x: 'Books', y: 1800 },
    ],
    color: '#3b82f6',
  },
]).render();
```

### Area Chart

```typescript
const chart = new Chart(container, {
  type: 'area',
  title: 'Network Traffic',
});

chart.setData([
  {
    name: 'Incoming',
    data: Array.from({ length: 24 }, (_, i) => ({
      x: i,
      y: Math.random() * 100 + 50,
    })),
    color: '#8b5cf6',
  },
  {
    name: 'Outgoing',
    data: Array.from({ length: 24 }, (_, i) => ({
      x: i,
      y: Math.random() * 80 + 30,
    })),
    color: '#06b6d4',
  },
]).render();
```

### Pie Chart

```typescript
const chart = new Chart(container, {
  type: 'pie',
  title: 'Market Share',
});

chart.setData([
  {
    name: 'Market Share',
    data: [
      { x: 'Product A', y: 35, color: '#3b82f6' },
      { x: 'Product B', y: 25, color: '#22c55e' },
      { x: 'Product C', y: 20, color: '#f59e0b' },
      { x: 'Product D', y: 15, color: '#ef4444' },
      { x: 'Others', y: 5, color: '#8b5cf6' },
    ],
  },
]).render();
```

### Donut Chart

```typescript
const chart = new Chart(container, {
  type: 'donut',
  title: 'Budget Allocation',
});

chart.setData([
  {
    name: 'Budget',
    data: [
      { x: 'Marketing', y: 30000 },
      { x: 'Development', y: 45000 },
      { x: 'Operations', y: 25000 },
      { x: 'Support', y: 15000 },
    ],
  },
]).render();
```

### Scatter Chart

```typescript
const chart = new Chart(container, {
  type: 'scatter',
  title: 'Height vs Weight',
});

chart.setData([
  {
    name: 'Male',
    data: [
      { x: 170, y: 70, size: 8 },
      { x: 175, y: 75, size: 8 },
      { x: 180, y: 80, size: 8 },
      { x: 185, y: 85, size: 8 },
    ],
    color: '#3b82f6',
  },
  {
    name: 'Female',
    data: [
      { x: 155, y: 55, size: 8 },
      { x: 160, y: 58, size: 8 },
      { x: 165, y: 62, size: 8 },
      { x: 170, y: 65, size: 8 },
    ],
    color: '#ec4899',
  },
]).render();
```

---

## Configuration

### Chart Configuration

```typescript
import { Chart } from '@philjs/charts';
import type { ChartConfig } from '@philjs/charts';

const config: ChartConfig = {
  // Chart type (required)
  type: 'line',

  // Dimensions
  width: 800,
  height: 400,

  // Padding
  padding: {
    top: 40,
    right: 20,
    bottom: 40,
    left: 50,
  },

  // Titles
  title: 'Chart Title',
  subtitle: 'Subtitle text',

  // Axes
  xAxis: {
    title: 'X Axis Label',
    gridLines: true,
  },
  yAxis: {
    title: 'Y Axis Label',
    min: 0,
    max: 100,
    tickCount: 5,
    tickFormat: (v) => `$${v}`,
  },

  // Legend
  legend: {
    show: true,
    position: 'top', // 'top' | 'bottom' | 'left' | 'right'
    align: 'center',
  },

  // Tooltip
  tooltip: {
    show: true,
    shared: false,
    format: (point, series) => `${series.name}: ${point.y}`,
  },

  // Animation
  animation: {
    enabled: true,
    duration: 500,
    easing: 'easeOut', // 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'bounce'
  },

  // Theme
  theme: 'light', // 'light' | 'dark' | 'custom'

  // Custom colors
  colors: ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'],

  // Responsive
  responsive: true,

  // Renderer
  renderer: 'canvas', // 'canvas' | 'svg'
};

const chart = new Chart(container, config);
```

### Axis Configuration

```typescript
import type { AxisConfig } from '@philjs/charts';

const xAxisConfig: AxisConfig = {
  // Axis title
  title: 'Time',

  // Value range
  min: 0,
  max: 100,

  // Tick configuration
  tickCount: 10,
  tickFormat: (value) => `${value}%`,

  // Grid lines
  gridLines: true,

  // Position
  position: 'bottom', // 'left' | 'right' | 'top' | 'bottom'
};

const yAxisConfig: AxisConfig = {
  title: 'Value',
  min: 0,
  tickFormat: (value) => `$${value.toFixed(2)}`,
  gridLines: true,
  position: 'left',
};
```

### Multiple Y Axes

```typescript
const chart = new Chart(container, {
  type: 'line',
  yAxis: [
    {
      title: 'Revenue',
      position: 'left',
      tickFormat: (v) => `$${v}`,
    },
    {
      title: 'Units',
      position: 'right',
      tickFormat: (v) => `${v} units`,
    },
  ],
});

chart.setData([
  {
    name: 'Revenue',
    yAxisIndex: 0,
    data: [{ x: 1, y: 1000 }, { x: 2, y: 1500 }],
  },
  {
    name: 'Units Sold',
    yAxisIndex: 1,
    data: [{ x: 1, y: 50 }, { x: 2, y: 75 }],
  },
]).render();
```

---

## Data Format

### Data Point

```typescript
import type { DataPoint } from '@philjs/charts';

const point: DataPoint = {
  // X value (number, string, or Date)
  x: 10, // or 'January' or new Date()

  // Y value (required)
  y: 100,

  // Optional label
  label: 'Q1 Revenue',

  // Optional custom color
  color: '#3b82f6',

  // Optional size (for scatter/bubble)
  size: 12,

  // Optional metadata
  metadata: {
    category: 'sales',
    region: 'north',
  },
};
```

### Data Series

```typescript
import type { DataSeries } from '@philjs/charts';

const series: DataSeries = {
  // Series name (required)
  name: 'Revenue',

  // Data points (required)
  data: [
    { x: 'Jan', y: 1000 },
    { x: 'Feb', y: 1200 },
    { x: 'Mar', y: 1100 },
  ],

  // Optional color
  color: '#3b82f6',

  // Optional type override (for mixed charts)
  type: 'bar',

  // Y axis index (for multiple axes)
  yAxisIndex: 0,

  // Hide from chart
  hidden: false,
};
```

---

## Scales

### Linear Scale

```typescript
import { LinearScale } from '@philjs/charts';

// Create scale with domain and range
const scale = new LinearScale([0, 100], [0, 800]);

// Scale a value
const pixelX = scale.scale(50); // 400

// Invert (get data value from pixel)
const dataX = scale.invert(400); // 50

// Generate tick values
const ticks = scale.ticks(10);
// [0, 11.11, 22.22, ..., 100]
```

### Band Scale

For categorical data (bar charts):

```typescript
import { BandScale } from '@philjs/charts';

// Create scale with categories
const scale = new BandScale(
  ['A', 'B', 'C', 'D'],
  [0, 800],
  0.1 // padding
);

// Get position for category
const x = scale.scale('B'); // Position for category B

// Get bar width
const width = scale.bandwidth(); // Width of each bar
```

### Time Scale

For date/time data:

```typescript
import { TimeScale } from '@philjs/charts';

// Create scale with date range
const scale = new TimeScale(
  [new Date('2024-01-01'), new Date('2024-12-31')],
  [0, 800]
);

// Scale a date
const x = scale.scaleTime(new Date('2024-06-15'));
```

---

## Themes

### Built-in Themes

```typescript
import { Chart, lightTheme, darkTheme } from '@philjs/charts';

// Light theme (default)
const lightChart = new Chart(container, {
  type: 'line',
  theme: 'light',
});

// Dark theme
const darkChart = new Chart(container, {
  type: 'line',
  theme: 'dark',
});

// Access theme colors
console.log(darkTheme);
// {
//   background: '#1a1a1a',
//   text: '#ffffff',
//   gridLines: '#333333',
//   axis: '#666666'
// }
```

### Custom Colors

```typescript
import { Chart, defaultColors } from '@philjs/charts';

// Use custom color palette
const chart = new Chart(container, {
  type: 'bar',
  colors: [
    '#1e3a8a', // dark blue
    '#166534', // dark green
    '#9f1239', // dark red
    '#7c2d12', // dark orange
    '#581c87', // dark purple
  ],
});

// Default color palette
console.log(defaultColors);
// ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', ...]
```

---

## Animation

### Animation Configuration

```typescript
import type { AnimationConfig } from '@philjs/charts';

const animation: AnimationConfig = {
  // Enable/disable animation
  enabled: true,

  // Duration in milliseconds
  duration: 500,

  // Easing function
  easing: 'easeOut',
};

// Available easing functions:
// - 'linear': Constant speed
// - 'easeIn': Start slow, end fast
// - 'easeOut': Start fast, end slow
// - 'easeInOut': Slow at both ends
// - 'bounce': Bouncy effect
```

### Animation Events

```typescript
const chart = new Chart(container, {
  type: 'line',
  animation: { enabled: true, duration: 1000 },
});

chart.on('animationComplete', () => {
  console.log('Animation finished!');
});

chart.setData(data).render();
```

---

## Interactivity

### Tooltips

```typescript
import type { TooltipConfig } from '@philjs/charts';

const chart = new Chart(container, {
  type: 'line',
  tooltip: {
    // Show tooltips
    show: true,

    // Share tooltip across all series
    shared: true,

    // Custom format function
    format: (point, series) => {
      return `
        <strong>${series.name}</strong><br/>
        Value: ${point.y.toLocaleString()}<br/>
        ${point.label || ''}
      `;
    },
  },
});
```

### Click Events

```typescript
const chart = new Chart(container, { type: 'bar' });

// Listen for click events
const unsubscribe = chart.on('click', ({ point, series }) => {
  console.log(`Clicked ${series.name}: ${point.y}`);

  // Access metadata
  if (point.metadata) {
    console.log('Metadata:', point.metadata);
  }
});

// Later, unsubscribe
unsubscribe();
```

### Legend Interaction

```typescript
const chart = new Chart(container, {
  type: 'line',
  legend: { show: true, position: 'top' },
});

// Toggle series visibility
chart.series.forEach((series) => {
  series.hidden = !series.hidden;
});
chart.render();
```

---

## Data Management

### Setting Data

```typescript
// Set all series at once
chart.setData([
  { name: 'Series 1', data: [...] },
  { name: 'Series 2', data: [...] },
]).render();
```

### Adding Series

```typescript
// Add a new series
chart.addSeries({
  name: 'New Series',
  data: [
    { x: 1, y: 10 },
    { x: 2, y: 20 },
  ],
  color: '#ff0000',
}).render();
```

### Updating Series

```typescript
// Update existing series data
chart.updateSeries('Revenue', [
  { x: 'Jan', y: 1500 },
  { x: 'Feb', y: 2000 },
  { x: 'Mar', y: 1800 },
]).render();
```

### Removing Series

```typescript
// Remove series by name
chart.removeSeries('Old Series').render();
```

---

## React Hooks

### useChart

```typescript
import { useChart } from '@philjs/charts';
import type { ChartConfig, DataSeries } from '@philjs/charts';

function SalesChart() {
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    chart,
    setData,
    addSeries,
    removeSeries,
    updateSeries,
    render,
    download,
  } = useChart(containerRef.current, {
    type: 'line',
    width: 800,
    height: 400,
    title: 'Sales Dashboard',
  });

  useEffect(() => {
    setData([
      {
        name: 'Revenue',
        data: salesData,
      },
    ]);
  }, [salesData]);

  return (
    <div>
      <div ref={containerRef} />
      <button onClick={() => download('sales-chart.png')}>
        Download Chart
      </button>
    </div>
  );
}
```

### useRealtimeChart

For streaming data visualization:

```typescript
import { useRealtimeChart } from '@philjs/charts';
import type { DataPoint } from '@philjs/charts';

// Create data stream generator
async function* createDataStream(): AsyncGenerator<DataPoint> {
  while (true) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    yield {
      x: Date.now(),
      y: Math.random() * 100,
    };
  }
}

function RealtimeChart() {
  const containerRef = useRef<HTMLDivElement>(null);
  const dataStream = createDataStream();

  const { chart } = useRealtimeChart(
    containerRef.current,
    {
      type: 'line',
      width: 800,
      height: 300,
      title: 'Live Data',
      animation: { enabled: false }, // Disable for real-time
    },
    dataStream
  );

  return <div ref={containerRef} />;
}
```

---

## Export

### Download as PNG

```typescript
// Download with default filename
chart.download();

// Download with custom filename
chart.download('my-chart.png');
```

### Get Data URL

```typescript
// Get base64 data URL
const dataUrl = chart.toDataURL();

// Use in image element
const img = new Image();
img.src = dataUrl;

// Get specific format
const pngUrl = chart.toDataURL('image/png');
const jpegUrl = chart.toDataURL('image/jpeg');
```

---

## Canvas Renderer

### High DPI Support

The Canvas renderer automatically handles high DPI displays:

```typescript
import { CanvasRenderer } from '@philjs/charts';

// Renderer handles devicePixelRatio automatically
const renderer = new CanvasRenderer(container, 800, 400);

// Canvas is scaled for crisp rendering on Retina displays
```

### Renderer API

```typescript
import type { Renderer } from '@philjs/charts';

interface Renderer {
  // Clear canvas
  clear(): void;

  // Draw line through points
  line(
    points: Array<{ x: number; y: number }>,
    options: { color: string; width: number; dash?: number[] }
  ): void;

  // Draw rectangle
  rect(
    x: number,
    y: number,
    width: number,
    height: number,
    options: { fill?: string; stroke?: string; radius?: number }
  ): void;

  // Draw circle
  circle(
    x: number,
    y: number,
    radius: number,
    options: { fill?: string; stroke?: string }
  ): void;

  // Draw arc (for pie charts)
  arc(
    x: number,
    y: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    options: { fill?: string; stroke?: string }
  ): void;

  // Draw text
  text(
    x: number,
    y: number,
    text: string,
    options: {
      color?: string;
      size?: number;
      align?: 'left' | 'center' | 'right';
      baseline?: 'top' | 'middle' | 'bottom';
    }
  ): void;

  // Draw SVG path
  path(
    d: string,
    options: { fill?: string; stroke?: string; width?: number }
  ): void;

  // Get underlying canvas
  getCanvas(): HTMLCanvasElement | null;

  // Get underlying SVG (if SVG renderer)
  getSVG(): SVGElement | null;
}
```

---

## Types Reference

```typescript
// Chart type
type ChartType =
  | 'line'
  | 'bar'
  | 'area'
  | 'pie'
  | 'donut'
  | 'scatter'
  | 'bubble'
  | 'radar'
  | 'heatmap';

// Data point
interface DataPoint {
  x: number | string | Date;
  y: number;
  label?: string;
  color?: string;
  size?: number;
  metadata?: Record<string, any>;
}

// Data series
interface DataSeries {
  name: string;
  data: DataPoint[];
  color?: string;
  type?: ChartType;
  yAxisIndex?: number;
  hidden?: boolean;
}

// Axis configuration
interface AxisConfig {
  title?: string;
  min?: number;
  max?: number;
  tickCount?: number;
  tickFormat?: (value: number) => string;
  gridLines?: boolean;
  position?: 'left' | 'right' | 'top' | 'bottom';
}

// Legend configuration
interface LegendConfig {
  show?: boolean;
  position?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
}

// Tooltip configuration
interface TooltipConfig {
  show?: boolean;
  format?: (point: DataPoint, series: DataSeries) => string;
  shared?: boolean;
}

// Animation configuration
interface AnimationConfig {
  enabled?: boolean;
  duration?: number;
  easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'bounce';
}

// Chart configuration
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

// useChart result
interface UseChartResult {
  chart: Chart | null;
  setData: (series: DataSeries[]) => void;
  addSeries: (series: DataSeries) => void;
  removeSeries: (name: string) => void;
  updateSeries: (name: string, data: DataPoint[]) => void;
  render: () => void;
  download: (filename?: string) => void;
}
```

---

## Best Practices

### 1. Use Appropriate Chart Types

```typescript
// Good - bar chart for categorical comparison
new Chart(container, { type: 'bar' }).setData([...]);

// Good - line chart for trends over time
new Chart(container, { type: 'line' }).setData([...]);

// Good - pie chart for part-to-whole relationships
new Chart(container, { type: 'pie' }).setData([...]);

// Avoid - pie chart with too many slices
// Use bar chart instead for many categories
```

### 2. Provide Clear Labels

```typescript
const chart = new Chart(container, {
  type: 'line',
  title: 'Monthly Revenue Growth',
  xAxis: {
    title: 'Month',
  },
  yAxis: {
    title: 'Revenue ($)',
    tickFormat: (v) => `$${v.toLocaleString()}`,
  },
});
```

### 3. Handle Responsive Design

```typescript
const chart = new Chart(container, {
  type: 'line',
  responsive: true, // Auto-resize with container
});

// Container should have defined dimensions
// .chart-container { width: 100%; height: 400px; }
```

### 4. Clean Up Resources

```typescript
function ChartComponent() {
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    chartRef.current = new Chart(container, config);

    return () => {
      // Clean up on unmount
      chartRef.current?.destroy();
    };
  }, []);
}
```

---

## API Reference

### Chart Class

| Method | Description |
|--------|-------------|
| `new Chart(container, config)` | Create chart instance |
| `setData(series)` | Set all data series |
| `addSeries(series)` | Add a series |
| `removeSeries(name)` | Remove series by name |
| `updateSeries(name, data)` | Update series data |
| `render()` | Render the chart |
| `on(event, callback)` | Subscribe to events |
| `toDataURL(type?)` | Get base64 image |
| `download(filename?)` | Download as image |
| `destroy()` | Clean up resources |

### Scales

| Export | Description |
|--------|-------------|
| `LinearScale` | Continuous numeric scale |
| `BandScale` | Categorical scale |
| `TimeScale` | Date/time scale |

### Hooks

| Export | Description |
|--------|-------------|
| `useChart` | Create and manage chart |
| `useRealtimeChart` | Real-time streaming chart |

### Constants

| Export | Description |
|--------|-------------|
| `defaultColors` | Default color palette |
| `lightTheme` | Light theme colors |
| `darkTheme` | Dark theme colors |

---

## Next Steps

- [Data Visualization Patterns](../../patterns/data-visualization.md)
- [@philjs/graphql](../graphql/overview.md)
- [Performance: Canvas](../../performance/canvas.md)
