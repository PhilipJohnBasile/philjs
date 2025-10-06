# Usage Analytics

PhilJS includes an intelligent usage analytics system that tracks component usage in production, identifies dead code, and provides actionable optimization suggestions. This unique feature helps you keep your codebase lean and efficient.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
- [Dead Code Detection](#dead-code-detection)
- [Optimization Suggestions](#optimization-suggestions)
- [Complete Examples](#complete-examples)
- [Best Practices](#best-practices)
- [Advanced Usage](#advanced-usage)

## Overview

The PhilJS usage analytics system provides:

- **Component Usage Tracking**: Know which components are actually used
- **Dead Code Detection**: Find components that are imported but never rendered
- **Prop Usage Analysis**: Discover which prop values are most common
- **Automatic Documentation**: Generate docs from real usage patterns
- **Dependency Graph**: Visualize component relationships
- **Optimization Suggestions**: Get actionable recommendations with auto-fix code

### Why Usage Analytics Matters

Most applications accumulate unused code over time. PhilJS analytics helps you:

- **Remove dead code** - Reduce bundle size by 20-30%
- **Optimize common patterns** - Set default props based on actual usage
- **Identify performance bottlenecks** - Find slow components
- **Understand dependencies** - Detect circular dependencies
- **Make data-driven decisions** - Refactor based on real usage, not assumptions

## Quick Start

### 1. Import and Use

```typescript
import { usageAnalytics } from 'philjs-core';

// Usage analytics is automatically enabled in development
// For production, explicitly enable:
if (import.meta.env.PROD) {
  // Analytics tracking happens automatically
}
```

### 2. Detect Dead Code

```typescript
import { usageAnalytics } from 'philjs-core';

// Get dead code report
const deadCode = usageAnalytics.detectDeadCode({
  inactivityThreshold: 30, // Days
  minConfidence: 0.7        // 70% confidence minimum
});

deadCode.forEach(report => {
  console.log(`🗑️ ${report.component}: ${report.suggestion}`);
  console.log(`   Confidence: ${(report.confidence * 100).toFixed(0)}%`);
  console.log(`   Reason: ${report.reason}`);
});
```

### 3. Get Optimization Suggestions

```typescript
const suggestions = usageAnalytics.generateOptimizations();

suggestions.forEach(opt => {
  console.log(`💡 ${opt.component}: ${opt.description}`);
  console.log(`   Impact: ${opt.impact}`);

  if (opt.autoFixAvailable && opt.codeChanges) {
    opt.codeChanges.forEach(change => {
      console.log(`   File: ${change.file}`);
      console.log(`   Before: ${change.before}`);
      console.log(`   After: ${change.after}`);
    });
  }
});
```

## API Reference

### `UsageAnalytics` Class

The main usage tracking manager.

#### `trackImport(component: string, importedBy: string, route?: string): void`

Track when a component is imported.

**Parameters:**
- `component: string`: Component name or path
- `importedBy: string`: File that imports this component
- `route?: string`: Optional route where it's used

**Example:**
```typescript
usageAnalytics.trackImport(
  'Button',
  'src/pages/Home.tsx',
  '/home'
);
```

#### `trackRender(component: string, props: object, renderTime: number, route: string): void`

Track when a component renders.

**Parameters:**
- `component: string`: Component name
- `props: object`: Props passed to component
- `renderTime: number`: Render time in milliseconds
- `route: string`: Current route

**Example:**
```typescript
const startTime = performance.now();
// ... component renders ...
const renderTime = performance.now() - startTime;

usageAnalytics.trackRender(
  'ProductCard',
  { id: 123, featured: true },
  renderTime,
  '/products'
);
```

#### `detectDeadCode(options?): DeadCodeReport[]`

Detect unused or dead code.

**Parameters:**
- `options?: object`
  - `inactivityThreshold?: number`: Days of inactivity (default: 30)
  - `minConfidence?: number`: Minimum confidence 0-1 (default: 0.7)

**Returns:** Array of `DeadCodeReport` objects

**DeadCodeReport Type:**
```typescript
type DeadCodeReport = {
  component: string;
  reason: 'never-rendered' | 'not-used-recently' | 'only-imported' | 'circular-dependency';
  lastUsed?: number;          // Timestamp
  importedBy: string[];       // Files that import this
  suggestion: string;         // What to do
  confidence: number;         // 0-1 confidence score
};
```

**Example:**
```typescript
const deadCode = usageAnalytics.detectDeadCode({
  inactivityThreshold: 60,   // 60 days
  minConfidence: 0.8         // 80% confidence
});

// High-confidence dead code
const definitelyDead = deadCode.filter(d => d.confidence > 0.9);
```

#### `generateOptimizations(): OptimizationSuggestion[]`

Generate optimization suggestions based on usage patterns.

**Returns:** Array of `OptimizationSuggestion` objects

**OptimizationSuggestion Type:**
```typescript
type OptimizationSuggestion = {
  component: string;
  type: 'default-prop' | 'split-component' | 'memo' | 'lazy-load' | 'remove-dependency';
  description: string;
  impact: 'high' | 'medium' | 'low';
  autoFixAvailable: boolean;
  codeChanges?: Array<{
    file: string;
    before: string;
    after: string;
  }>;
};
```

**Example:**
```typescript
const optimizations = usageAnalytics.generateOptimizations();

// High impact optimizations only
const highImpact = optimizations.filter(o => o.impact === 'high');

// Auto-fixable optimizations
const autoFixable = optimizations.filter(o => o.autoFixAvailable);
```

#### `getDependencyGraph(): { nodes: Node[], edges: Edge[] }`

Get component dependency graph for visualization.

**Returns:** Object with nodes and edges

**Example:**
```typescript
const graph = usageAnalytics.getDependencyGraph();

// Nodes: components
graph.nodes.forEach(node => {
  console.log(`${node.id}: ${node.size} bytes, ${node.active ? 'active' : 'inactive'}`);
});

// Edges: dependencies
graph.edges.forEach(edge => {
  console.log(`${edge.source} -> ${edge.target} (weight: ${edge.weight})`);
});
```

#### `generateDocumentation(component: string): string`

Generate automatic documentation from usage patterns.

**Parameters:**
- `component: string`: Component to document

**Returns:** Markdown documentation string

**Example:**
```typescript
const docs = usageAnalytics.generateDocumentation('Button');
console.log(docs);

// Output:
// # Button
//
// ## Usage Statistics
// - Imported: 45 times
// - Rendered: 1,234 times
// - Average render time: 2.3ms
// ...
```

#### `exportUsageData(): object`

Export all usage data for analysis.

**Returns:** Object with component usage data

**Example:**
```typescript
const data = usageAnalytics.exportUsageData();

// Save to file
await fs.writeFile(
  'usage-report.json',
  JSON.stringify(data, null, 2)
);
```

### `usageAnalytics` Instance

Global analytics instance, pre-configured and ready to use.

```typescript
import { usageAnalytics } from 'philjs-core';
```

## Dead Code Detection

### Detection Strategies

PhilJS uses multiple strategies to detect dead code:

#### 1. Never Rendered

Components that are imported but never actually render.

```typescript
// Component is imported...
import { UnusedButton } from './components/UnusedButton';

// ...but never used in JSX
function MyPage() {
  return <div>No button here!</div>;
}

// Detection:
const report = {
  component: 'UnusedButton',
  reason: 'never-rendered',
  confidence: 0.9,
  suggestion: 'Component imported 3 times but never rendered. Safe to remove.'
};
```

#### 2. Not Used Recently

Components that haven't been used in a specified time period.

```typescript
const report = {
  component: 'OldFeature',
  reason: 'not-used-recently',
  lastUsed: Date.now() - (90 * 24 * 60 * 60 * 1000), // 90 days ago
  confidence: 0.7,
  suggestion: 'Not used in 90 days. Consider removing or archiving.'
};
```

#### 3. Only Imported by Dead Code

Components only used by other unused components.

```typescript
// DeadComponent imports DeadDependency
// DeadComponent is never rendered
// Therefore DeadDependency is also dead

const report = {
  component: 'DeadDependency',
  reason: 'only-imported',
  importedBy: ['DeadComponent'],
  confidence: 0.8,
  suggestion: 'Only imported by components that are themselves unused.'
};
```

#### 4. Circular Dependencies

Components involved in circular dependency chains.

```typescript
// A imports B
// B imports C
// C imports A
// Circular dependency!

const report = {
  component: 'ComponentA',
  reason: 'circular-dependency',
  confidence: 0.6,
  suggestion: 'Part of circular dependency chain. Refactor to break cycle.'
};
```

### Custom Detection Rules

```typescript
function customDeadCodeDetection() {
  const data = usageAnalytics.exportUsageData();
  const customDead: DeadCodeReport[] = [];

  for (const [component, usage] of Object.entries(data)) {
    // Custom rule: Rendered < 10 times in 30 days
    if (usage.renderCount < 10) {
      customDead.push({
        component,
        reason: 'never-rendered',
        confidence: 0.85,
        importedBy: usage.importedBy,
        suggestion: 'Rarely used component (< 10 renders in 30 days). Consider removing.'
      });
    }

    // Custom rule: Large bundle but rarely used
    if (usage.bundleSize > 50000 && usage.renderCount < usage.importCount * 0.1) {
      customDead.push({
        component,
        reason: 'only-imported',
        confidence: 0.9,
        importedBy: usage.importedBy,
        suggestion: `Large component (${(usage.bundleSize / 1024).toFixed(1)}KB) rarely rendered.`
      });
    }
  }

  return customDead;
}
```

## Optimization Suggestions

### Types of Optimizations

#### 1. Default Props

Set default props based on most common values.

```typescript
// Analytics shows 85% of uses pass variant="primary"
{
  type: 'default-prop',
  component: 'Button',
  description: '85% of uses pass "primary" for prop "variant". Consider making it the default.',
  impact: 'low',
  autoFixAvailable: true,
  codeChanges: [{
    file: 'Button.tsx',
    before: 'function Button({ variant, ...props })',
    after: 'function Button({ variant = "primary", ...props })'
  }]
}
```

#### 2. Memoization

Memoize components with slow render times.

```typescript
// Average render time > 16ms (one frame)
{
  type: 'memo',
  component: 'ExpensiveChart',
  description: 'Average render time is 23.5ms. Consider memoization.',
  impact: 'high',
  autoFixAvailable: true,
  codeChanges: [{
    file: 'ExpensiveChart.tsx',
    before: 'export function ExpensiveChart',
    after: 'export const ExpensiveChart = memo(function ExpensiveChart'
  }]
}
```

#### 3. Lazy Loading

Lazy load large, infrequently used components.

```typescript
// Large bundle + rarely rendered
{
  type: 'lazy-load',
  component: 'AdminPanel',
  description: 'Large component (125KB) rarely rendered. Consider lazy loading.',
  impact: 'high',
  autoFixAvailable: true,
  codeChanges: [{
    file: 'App.tsx',
    before: 'import { AdminPanel } from "./AdminPanel"',
    after: 'const AdminPanel = lazy(() => import("./AdminPanel"))'
  }]
}
```

#### 4. Remove Dependencies

Remove unused component dependencies.

```typescript
{
  type: 'remove-dependency',
  component: 'Dashboard',
  description: 'Remove unused dependencies: Chart, Graph',
  impact: 'medium',
  autoFixAvailable: false  // Manual refactoring needed
}
```

### Applying Optimizations

```typescript
function applyOptimizations() {
  const suggestions = usageAnalytics.generateOptimizations();

  for (const suggestion of suggestions) {
    if (suggestion.autoFixAvailable && suggestion.codeChanges) {
      for (const change of suggestion.codeChanges) {
        // Read file
        let content = await fs.readFile(change.file, 'utf-8');

        // Apply change
        content = content.replace(change.before, change.after);

        // Write back
        await fs.writeFile(change.file, content);

        console.log(`✅ Applied ${suggestion.type} to ${suggestion.component}`);
      }
    } else {
      console.log(`⚠️ Manual fix needed for ${suggestion.component}: ${suggestion.description}`);
    }
  }
}
```

## Complete Examples

### Example 1: Automatic Dead Code Removal

```typescript
import { usageAnalytics } from 'philjs-core';
import fs from 'fs/promises';

async function removeDeadCode() {
  const deadCode = usageAnalytics.detectDeadCode({
    inactivityThreshold: 30,
    minConfidence: 0.9  // Only very confident
  });

  for (const report of deadCode) {
    if (report.reason === 'never-rendered') {
      console.log(`Removing ${report.component}...`);

      // Remove imports
      for (const file of report.importedBy) {
        let content = await fs.readFile(file, 'utf-8');

        // Remove import statement
        const importRegex = new RegExp(
          `import.*${report.component}.*from.*[;\n]`,
          'g'
        );
        content = content.replace(importRegex, '');

        await fs.writeFile(file, content);
      }

      console.log(`✅ Removed ${report.component} from ${report.importedBy.length} files`);
    }
  }
}
```

### Example 2: Usage Dashboard

```typescript
import { signal, effect } from 'philjs-core';
import { usageAnalytics } from 'philjs-core';

function UsageDashboard() {
  const components = signal<string[]>([]);
  const usageData = signal<Map<string, any>>(new Map());

  effect(() => {
    const data = usageAnalytics.exportUsageData();
    components.set(Object.keys(data));
    usageData.set(new Map(Object.entries(data)));
  });

  return (
    <div class="usage-dashboard">
      <h2>Component Usage Analytics</h2>

      <table>
        <thead>
          <tr>
            <th>Component</th>
            <th>Imports</th>
            <th>Renders</th>
            <th>Avg Render Time</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {components().map(name => {
            const usage = usageData().get(name);
            const status = usage.renderCount === 0 ? '🔴 Dead' :
                          usage.renderCount < 10 ? '⚠️ Rarely Used' :
                          '✅ Active';

            return (
              <tr>
                <td>{name}</td>
                <td>{usage.importCount}</td>
                <td>{usage.renderCount}</td>
                <td>{usage.avgRenderTime.toFixed(2)}ms</td>
                <td>{status}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div class="actions">
        <button onClick={() => showDeadCode()}>
          Show Dead Code
        </button>
        <button onClick={() => showOptimizations()}>
          Show Optimizations
        </button>
      </div>
    </div>
  );
}
```

### Example 3: Prop Usage Analysis

```typescript
import { usageAnalytics } from 'philjs-core';

function analyzePropsUsage(component: string) {
  const data = usageAnalytics.exportUsageData();
  const usage = data[component];

  if (!usage) {
    console.log('Component not found');
    return;
  }

  console.log(`\nProp Analysis for ${component}:`);

  for (const [propName, valueStats] of usage.propsUsage) {
    console.log(`\n  ${propName}:`);

    const sortedStats = Array.from(valueStats.values())
      .sort((a, b) => b.percentage - a.percentage);

    sortedStats.slice(0, 5).forEach(stat => {
      console.log(
        `    ${JSON.stringify(stat.value)}: ${stat.percentage.toFixed(1)}% ` +
        `(${stat.count} times)`
      );
    });

    // Suggest default prop if > 80% use same value
    const mostCommon = sortedStats[0];
    if (mostCommon.percentage > 80) {
      console.log(
        `    💡 Suggestion: Set default ${propName}=${JSON.stringify(mostCommon.value)}`
      );
    }
  }
}

// Usage:
analyzePropsUsage('Button');
// Output:
// Prop Analysis for Button:
//
//   variant:
//     "primary": 85.3% (234 times)
//     "secondary": 10.2% (28 times)
//     "danger": 4.5% (12 times)
//     💡 Suggestion: Set default variant="primary"
```

### Example 4: Performance Monitoring

```typescript
import { usageAnalytics } from 'philjs-core';

class PerformanceMonitor {
  private slowComponents = signal<Array<{ name: string; avgTime: number }>>([]);

  startMonitoring() {
    setInterval(() => {
      const data = usageAnalytics.exportUsageData();
      const slow: typeof this.slowComponents extends signal<infer T> ? T : never = [];

      for (const [name, usage] of Object.entries(data)) {
        if (usage.avgRenderTime > 16) { // > 1 frame (60fps)
          slow.push({
            name,
            avgTime: usage.avgRenderTime
          });
        }
      }

      // Sort by slowest first
      slow.sort((a, b) => b.avgTime - a.avgTime);
      this.slowComponents.set(slow);

      // Alert if critical
      if (slow.length > 0) {
        console.warn(`⚠️ ${slow.length} slow components detected`);
        slow.forEach(c => {
          console.warn(`  ${c.name}: ${c.avgTime.toFixed(2)}ms`);
        });
      }
    }, 30000); // Every 30 seconds
  }

  getSlowComponents() {
    return this.slowComponents;
  }
}

const monitor = new PerformanceMonitor();
monitor.startMonitoring();
```

### Example 5: Dependency Graph Visualization

```typescript
import { usageAnalytics } from 'philjs-core';

function visualizeDependencies() {
  const graph = usageAnalytics.getDependencyGraph();

  // Generate DOT format for Graphviz
  let dot = 'digraph G {\n';

  // Add nodes
  graph.nodes.forEach(node => {
    const color = node.active ? 'green' : 'red';
    const label = `${node.id}\\n${(node.size / 1024).toFixed(1)}KB`;
    dot += `  "${node.id}" [label="${label}", color=${color}];\n`;
  });

  // Add edges
  graph.edges.forEach(edge => {
    const weight = Math.max(1, Math.floor(edge.weight / 10));
    dot += `  "${edge.source}" -> "${edge.target}" [weight=${weight}];\n`;
  });

  dot += '}';

  // Save to file
  await fs.writeFile('dependencies.dot', dot);
  console.log('Saved to dependencies.dot - visualize with Graphviz');

  // Or detect circular dependencies
  const circular = detectCircular(graph);
  if (circular.length > 0) {
    console.warn('⚠️ Circular dependencies detected:');
    circular.forEach(cycle => console.warn(`  ${cycle.join(' -> ')}`));
  }
}

function detectCircular(graph: any): string[][] {
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const stack = new Set<string>();

  function dfs(node: string, path: string[] = []) {
    if (stack.has(node)) {
      // Found cycle
      const cycleStart = path.indexOf(node);
      cycles.push(path.slice(cycleStart).concat(node));
      return;
    }

    if (visited.has(node)) return;

    visited.add(node);
    stack.add(node);

    const edges = graph.edges.filter((e: any) => e.source === node);
    for (const edge of edges) {
      dfs(edge.target, [...path, node]);
    }

    stack.delete(node);
  }

  graph.nodes.forEach((node: any) => dfs(node.id));
  return cycles;
}
```

## Best Practices

### 1. Enable in Production with Sampling

```typescript
// Only track 10% of users to reduce overhead
if (import.meta.env.PROD) {
  const shouldTrack = Math.random() < 0.1;

  if (shouldTrack) {
    // Enable tracking
    (window as any).__PHILJS_ANALYTICS__ = true;
  }
}
```

### 2. Regular Dead Code Audits

```typescript
// Add to CI/CD pipeline
async function auditDeadCode() {
  const deadCode = usageAnalytics.detectDeadCode({
    minConfidence: 0.9
  });

  if (deadCode.length > 0) {
    console.error(`❌ Found ${deadCode.length} dead code issues`);
    process.exit(1);
  }
}
```

### 3. Privacy-First Tracking

```typescript
// Don't track sensitive prop values
const sanitizedProps = {
  ...props,
  password: '[REDACTED]',
  apiKey: '[REDACTED]',
  email: props.email ? '[EMAIL]' : undefined
};

usageAnalytics.trackRender(component, sanitizedProps, renderTime, route);
```

### 4. Optimize Based on Impact

```typescript
const suggestions = usageAnalytics.generateOptimizations();

// Focus on high-impact first
suggestions
  .filter(s => s.impact === 'high')
  .forEach(async s => {
    if (s.autoFixAvailable) {
      await applyOptimization(s);
    }
  });
```

### 5. Document from Usage

```typescript
// Generate docs for all components
const data = usageAnalytics.exportUsageData();

for (const component of Object.keys(data)) {
  const docs = usageAnalytics.generateDocumentation(component);
  await fs.writeFile(`docs/${component}.md`, docs);
}
```

## Advanced Usage

### Custom Analytics

```typescript
class CustomAnalytics extends UsageAnalytics {
  trackComponentError(component: string, error: Error) {
    // Track errors by component
    console.error(`Error in ${component}:`, error);
  }

  trackUserInteraction(component: string, interaction: string) {
    // Track user interactions
    console.log(`User ${interaction} on ${component}`);
  }
}

const customAnalytics = new CustomAnalytics();
```

### Integration with APM Tools

```typescript
// Send analytics to Datadog, New Relic, etc.
setInterval(() => {
  const data = usageAnalytics.exportUsageData();

  for (const [component, usage] of Object.entries(data)) {
    // Send metrics
    apm.gauge('component.render_count', usage.renderCount, {
      component
    });
    apm.gauge('component.avg_render_time', usage.avgRenderTime, {
      component
    });
  }
}, 60000); // Every minute
```

### Machine Learning Integration

```typescript
// Use ML to predict component removal candidates
async function mlDeadCodePrediction() {
  const data = usageAnalytics.exportUsageData();
  const features = Object.entries(data).map(([name, usage]) => ({
    name,
    features: [
      usage.importCount,
      usage.renderCount,
      usage.avgRenderTime,
      usage.bundleSize,
      usage.dependencies.length,
      usage.importedBy.length
    ]
  }));

  // Send to ML model
  const predictions = await fetch('/api/ml/predict-dead-code', {
    method: 'POST',
    body: JSON.stringify({ features })
  }).then(r => r.json());

  return predictions;
}
```

## Related Documentation

- [Cost Tracking](/docs/advanced/cost-tracking.md) - Monitor component costs
- [Performance Budgets](/docs/performance/performance-budgets.md) - Set performance limits
- [DevTools](/docs/advanced/devtools.md) - Debug component issues
- [Code Splitting](/docs/performance/code-splitting.md) - Optimize bundle size

## Troubleshooting

### Issue: False Positive Dead Code

**Solution:** Adjust confidence threshold:
```typescript
usageAnalytics.detectDeadCode({
  minConfidence: 0.95  // Increase to reduce false positives
});
```

### Issue: Performance Overhead

**Solution:** Use sampling in production:
```typescript
const trackingRate = 0.1; // 10% of requests
if (Math.random() < trackingRate) {
  usageAnalytics.trackRender(/* ... */);
}
```

### Issue: Privacy Concerns

**Solution:** Sanitize sensitive data:
```typescript
function sanitizeProps(props: any) {
  const sensitive = ['password', 'token', 'apiKey', 'secret'];
  const sanitized = { ...props };

  sensitive.forEach(key => {
    if (key in sanitized) {
      sanitized[key] = '[REDACTED]';
    }
  });

  return sanitized;
}
```

---

**Next Steps:**
- Set up [DevTools](/docs/advanced/devtools.md) for visual analytics
- Configure [Performance Budgets](/docs/performance/performance-budgets.md)
- Explore [Cost Tracking](/docs/advanced/cost-tracking.md)
