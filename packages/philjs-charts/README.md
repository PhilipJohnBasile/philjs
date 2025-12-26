# @philjs/charts

A comprehensive chart library for React applications. Provides beautiful, responsive, and accessible chart components powered by modern rendering techniques.

## Installation

```bash
npm install @philjs/charts
# or
yarn add @philjs/charts
# or
pnpm add @philjs/charts
```

## Basic Usage

```tsx
import { LineChart, BarChart, PieChart } from '@philjs/charts';

function Dashboard() {
  const data = [
    { month: 'Jan', value: 400 },
    { month: 'Feb', value: 300 },
    { month: 'Mar', value: 600 },
  ];

  return (
    <div>
      <LineChart data={data} xKey="month" yKey="value" />
      <BarChart data={data} xKey="month" yKey="value" />
      <PieChart data={data} nameKey="month" valueKey="value" />
    </div>
  );
}
```

## Features

- **Line Charts** - Single and multi-series line visualizations
- **Bar Charts** - Vertical, horizontal, stacked, and grouped bars
- **Pie Charts** - Pie and donut charts with customizable segments
- **Area Charts** - Filled area charts with gradient support
- **Scatter Plots** - Point-based data visualization
- **Sparklines** - Compact inline charts for dashboards
- **Gauge Charts** - Circular progress and metric displays
- **Responsive** - Automatically adapts to container size
- **Animations** - Smooth transitions and entrance animations
- **Tooltips** - Interactive hover tooltips with customization
- **Legends** - Configurable chart legends
- **Themes** - Light/dark mode and custom theming support
- **Accessibility** - ARIA labels and keyboard navigation

## Chart Types

| Component | Description |
|-----------|-------------|
| `LineChart` | Time series and trend data |
| `BarChart` | Categorical comparisons |
| `PieChart` | Part-to-whole relationships |
| `AreaChart` | Volume over time |
| `ScatterChart` | Correlation analysis |
| `Sparkline` | Inline micro-charts |
| `GaugeChart` | Single metric display |

## License

MIT
