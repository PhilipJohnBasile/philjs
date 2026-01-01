# Cost Tracking

PhilJS includes a powerful cost tracking system that estimates cloud deployment costs per route in real-time. This unique feature helps you optimize your application's cloud spending before it becomes a problem.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
- [Supported Providers](#supported-providers)
- [Complete Examples](#complete-examples)
- [Cost Optimization](#cost-optimization)
- [Best Practices](#best-practices)
- [Advanced Usage](#advanced-usage)

## Overview

The PhilJS cost tracking system provides:

- **Real-Time Cost Estimation**: Track costs as your app runs
- **Multi-Cloud Support**: AWS, GCP, Azure, Cloudflare, Vercel pricing
- **Route-Level Analysis**: See which routes are most expensive
- **Automatic Optimization Suggestions**: Get actionable cost-saving recommendations
- **Monthly Projections**: Predict your cloud bill
- **Custom Pricing Models**: Use your own negotiated rates

### Why Cost Tracking Matters

Cloud costs can spiral out of control without proper monitoring. PhilJS cost tracking helps you:

- **Catch expensive routes early** - Before they drain your budget
- **Optimize based on data** - Not guesswork
- **Set cost budgets** - Alert when routes exceed limits
- **Compare cloud providers** - Make informed decisions

```typescript
import { costTracker } from '@philjs/core';

// Track a route's resource usage
costTracker.trackRoute('/api/expensive', {
  computeTime: 250,        // 250ms compute
  memoryUsed: 512,         // 512MB RAM
  dataTransfer: 100,       // 100KB transferred
  invocations: 1,
  dbQueries: 5
});

// Get cost estimate
const estimate = costTracker.estimateCost('/api/expensive');
console.log(`Cost per request: $${estimate.total.toFixed(6)}`);
console.log(`Monthly projection: $${estimate.monthlyProjection.toFixed(2)}`);
// Optimization suggestions automatically included!
```

## Quick Start

### 1. Configure Provider

```typescript
import { costTracker } from '@philjs/core';

// Set your cloud provider (default is Cloudflare)
costTracker.setProvider('aws');
// Options: 'aws', 'gcp', 'azure', 'cloudflare', 'vercel'
```

### 2. Track Route Metrics

```typescript
// In your middleware or route handler
costTracker.trackRoute('/api/users', {
  computeTime: 150,      // Milliseconds
  memoryUsed: 256,       // MB
  dataTransfer: 50,      // KB
  invocations: 1,
  dbQueries: 3,
  cacheHits: 2,
  cacheMisses: 1
});
```

### 3. Get Cost Estimates

```typescript
const estimate = costTracker.estimateCost('/api/users');

console.log('Cost Breakdown:');
console.log(`  Compute: $${estimate.breakdown.compute.toFixed(6)}`);
console.log(`  Memory: $${estimate.breakdown.memory.toFixed(6)}`);
console.log(`  Data Transfer: $${estimate.breakdown.dataTransfer.toFixed(6)}`);
console.log(`  Database: $${estimate.breakdown.database?.toFixed(6) || 0}`);
console.log(`  Total: $${estimate.total.toFixed(6)} per request`);
console.log(`  Per 1000 requests: $${estimate.perThousandRequests.toFixed(4)}`);
console.log(`  Monthly projection: $${estimate.monthlyProjection.toFixed(2)}`);
```

## API Reference

### `CostTracker` Class

The main cost tracking manager.

#### `setProvider(provider: CloudProvider): void`

Set the cloud provider for cost calculations.

**Parameters:**
- `provider: CloudProvider`: One of 'aws', 'gcp', 'azure', 'cloudflare', 'vercel'

**Example:**
```typescript
costTracker.setProvider('cloudflare');
```

#### `setCustomPricing(pricing: any): void`

Set custom pricing model (e.g., your negotiated rates).

**Parameters:**
- `pricing: object`: Custom pricing structure matching the provider format

**Example:**
```typescript
costTracker.setCustomPricing({
  lambda: {
    compute: 0.00001,  // Custom GB-second rate
    requests: 0.15 / 1_000_000,
    dataTransfer: 0.05 / 1024
  }
});
```

#### `trackRoute(route: string, metrics: CostMetrics): void`

Track resource usage for a route.

**Parameters:**
- `route: string`: Route path (e.g., '/api/users')
- `metrics: CostMetrics`: Resource usage metrics

**CostMetrics Type:**
```typescript
type CostMetrics = {
  computeTime: number;        // Compute time in milliseconds
  memoryUsed: number;         // Memory in MB
  dataTransfer: number;       // Data transferred in KB
  invocations: number;        // Number of invocations
  dbQueries?: number;         // Database queries
  cacheHits?: number;         // Cache hits
  cacheMisses?: number;       // Cache misses
  externalApiCalls?: number;  // External API calls
};
```

**Example:**
```typescript
costTracker.trackRoute('/api/posts', {
  computeTime: 200,
  memoryUsed: 512,
  dataTransfer: 75,
  invocations: 1,
  dbQueries: 4,
  cacheHits: 1,
  cacheMisses: 0
});
```

#### `estimateCost(route: string): CostEstimate`

Calculate cost estimate for a route based on tracked metrics.

**Returns:** `CostEstimate` object

**CostEstimate Type:**
```typescript
type CostEstimate = {
  total: number;                    // Total estimated cost in USD
  breakdown: {
    compute: number;
    memory: number;
    dataTransfer: number;
    database?: number;
    cache?: number;
    externalApis?: number;
  };
  perThousandRequests: number;      // Cost per 1000 requests
  monthlyProjection: number;        // Projected monthly cost
  optimizations: Array<{
    category: string;
    potentialSavings: number;
    suggestion: string;
    difficulty: 'easy' | 'medium' | 'hard';
  }>;
};
```

**Example:**
```typescript
const estimate = costTracker.estimateCost('/api/posts');

if (estimate.total > 0.001) {  // More than $0.001 per request
  console.warn('Expensive route detected!');
  estimate.optimizations.forEach(opt => {
    console.log(`💡 ${opt.suggestion} (saves $${opt.potentialSavings.toFixed(4)})`);
  });
}
```

#### `getCostTrends(route: string, days?: number): CostTrend[]`

Get cost trends over time.

**Parameters:**
- `route: string`: Route path
- `days?: number`: Number of days to analyze (default: 30)

**Returns:** Array of daily cost data

**Example:**
```typescript
const trends = costTracker.getCostTrends('/api/users', 7);
trends.forEach(day => {
  console.log(`${day.date}: $${day.cost.toFixed(4)}`);
});
```

#### `exportCostData(): object`

Export all cost data for analysis or reporting.

**Returns:** Object with route metrics and estimates

**Example:**
```typescript
const data = costTracker.exportCostData();
console.log(JSON.stringify(data, null, 2));

// Save to file
await fs.writeFile('cost-report.json', JSON.stringify(data, null, 2));
```

### `costTracker` Instance

Global cost tracker instance, pre-configured and ready to use.

```typescript
import { costTracker } from '@philjs/core';
```

## Supported Providers

### AWS Lambda

```typescript
costTracker.setProvider('aws');

// AWS pricing includes:
// - Compute: $0.0000166667 per GB-second
// - Requests: $0.20 per 1M requests
// - Data transfer: $0.09 per GB
// - DynamoDB: $0.25/$1.25 per 1M read/writes
```

### Google Cloud Functions

```typescript
costTracker.setProvider('gcp');

// GCP pricing includes:
// - Compute: $0.0000025 per 100ms
// - Requests: $0.40 per 1M requests
// - Data transfer: $0.12 per GB
```

### Azure Functions

```typescript
costTracker.setProvider('azure');

// Azure pricing includes:
// - Compute: $0.000016 per GB-second
// - Requests: $0.20 per 1M requests
// - Data transfer: $0.087 per GB
```

### Cloudflare Workers

```typescript
costTracker.setProvider('cloudflare');

// Cloudflare pricing includes:
// - Compute: $0.00001 per millisecond
// - Requests: $0.50 per 1M requests
// - Data transfer: FREE! (0 egress cost)
// - KV: $0.50/$5 per 1M read/writes
```

### Vercel Functions

```typescript
costTracker.setProvider('vercel');

// Vercel pricing includes:
// - Compute: $0.0000002 per millisecond
// - Requests: $0.60 per 1M requests
// - Data transfer: $0.15 per GB
```

## Complete Examples

### Example 1: Middleware Integration

```typescript
import { costTracker } from '@philjs/core';

export async function costTrackingMiddleware(
  request: Request,
  next: () => Promise<Response>
): Promise<Response> {
  const startTime = Date.now();
  const startMemory = process.memoryUsage().heapUsed;

  const response = await next();

  const endTime = Date.now();
  const endMemory = process.memoryUsage().heapUsed;

  const url = new URL(request.url);
  costTracker.trackRoute(url.pathname, {
    computeTime: endTime - startTime,
    memoryUsed: Math.round((endMemory / 1024 / 1024)), // Convert to MB
    dataTransfer: parseInt(response.headers.get('content-length') || '0') / 1024, // Convert to KB
    invocations: 1
  });

  // Add cost headers for debugging
  const estimate = costTracker.estimateCost(url.pathname);
  response.headers.set('X-Cost-Estimate', estimate.total.toFixed(6));
  response.headers.set('X-Monthly-Projection', estimate.monthlyProjection.toFixed(2));

  return response;
}
```

### Example 2: Database Query Tracking

```typescript
import { costTracker } from '@philjs/core';

class CostAwareDatabase {
  private queryCount = 0;
  private cacheHits = 0;
  private cacheMisses = 0;

  async query(sql: string, params: any[], route: string) {
    this.queryCount++;

    // Check cache
    const cacheKey = `${sql}:${JSON.stringify(params)}`;
    const cached = cache.get(cacheKey);

    if (cached) {
      this.cacheHits++;
      return cached;
    }

    this.cacheMisses++;

    // Execute query
    const result = await db.query(sql, params);
    cache.set(cacheKey, result);

    // Track metrics
    costTracker.trackRoute(route, {
      computeTime: 50, // Estimate
      memoryUsed: 256,
      dataTransfer: JSON.stringify(result).length / 1024,
      invocations: 1,
      dbQueries: 1,
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses
    });

    return result;
  }
}
```

### Example 3: Cost Budget Alerts

```typescript
import { costTracker } from '@philjs/core';
import { signal } from '@philjs/core';

const costAlerts = signal<Array<{
  route: string;
  cost: number;
  budget: number;
  exceeded: boolean;
}>>([]);

const ROUTE_BUDGETS = {
  '/api/users': 0.0001,       // $0.0001 per request
  '/api/analytics': 0.0005,   // $0.0005 per request
  '/api/reports': 0.001       // $0.001 per request
};

function checkCostBudgets() {
  const alerts: typeof costAlerts extends signal<infer T> ? T : never = [];

  for (const [route, budget] of Object.entries(ROUTE_BUDGETS)) {
    const estimate = costTracker.estimateCost(route);

    if (estimate.total > budget) {
      alerts.push({
        route,
        cost: estimate.total,
        budget,
        exceeded: true
      });

      console.error(
        `⚠️ Cost budget exceeded for ${route}!`,
        `Actual: $${estimate.total.toFixed(6)}, Budget: $${budget.toFixed(6)}`
      );

      // Send alert
      sendAlert({
        type: 'cost_budget_exceeded',
        route,
        cost: estimate.total,
        budget,
        optimizations: estimate.optimizations
      });
    }
  }

  costAlerts.set(alerts);
}

// Check budgets every 5 minutes
setInterval(checkCostBudgets, 5 * 60 * 1000);
```

### Example 4: Cost Dashboard Component

```typescript
import { signal, effect } from '@philjs/core';
import { costTracker } from '@philjs/core';

function CostDashboard() {
  const routes = signal<string[]>([]);
  const estimates = signal<Map<string, any>>(new Map());

  effect(() => {
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      const data = costTracker.exportCostData();
      routes.set(Object.keys(data));

      const newEstimates = new Map();
      for (const route of Object.keys(data)) {
        newEstimates.set(route, costTracker.estimateCost(route));
      }
      estimates.set(newEstimates);
    }, 30000);

    return () => clearInterval(interval);
  });

  return (
    <div class="cost-dashboard">
      <h2>Cost Dashboard</h2>

      <div class="summary">
        <div class="stat">
          <h3>Total Routes</h3>
          <p>{routes().length}</p>
        </div>
        <div class="stat">
          <h3>Estimated Monthly Cost</h3>
          <p>${
            Array.from(estimates().values())
              .reduce((sum, est) => sum + est.monthlyProjection, 0)
              .toFixed(2)
          }</p>
        </div>
      </div>

      <table class="routes-table">
        <thead>
          <tr>
            <th>Route</th>
            <th>Cost/Request</th>
            <th>Monthly Projection</th>
            <th>Optimizations</th>
          </tr>
        </thead>
        <tbody>
          {routes().map(route => {
            const est = estimates().get(route);
            return (
              <tr>
                <td>{route}</td>
                <td>${est.total.toFixed(6)}</td>
                <td>${est.monthlyProjection.toFixed(2)}</td>
                <td>
                  {est.optimizations.length > 0 ? (
                    <button onClick={() => showOptimizations(route, est.optimizations)}>
                      {est.optimizations.length} suggestions
                    </button>
                  ) : (
                    <span>None</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
```

### Example 5: Cloud Provider Comparison

```typescript
import { CostTracker } from '@philjs/core';

async function compareProviders(route: string, metrics: any) {
  const providers: Array<'aws' | 'gcp' | 'azure' | 'cloudflare' | 'vercel'> = [
    'aws', 'gcp', 'azure', 'cloudflare', 'vercel'
  ];

  const results = [];

  for (const provider of providers) {
    const tracker = new CostTracker(provider);
    tracker.trackRoute(route, metrics);
    const estimate = tracker.estimateCost(route);

    results.push({
      provider,
      costPerRequest: estimate.total,
      monthlyProjection: estimate.monthlyProjection,
      perThousandRequests: estimate.perThousandRequests
    });
  }

  // Sort by cost (cheapest first)
  results.sort((a, b) => a.costPerRequest - b.costPerRequest);

  console.log('Provider Comparison:');
  results.forEach((r, i) => {
    console.log(
      `${i + 1}. ${r.provider.toUpperCase()}: ` +
      `$${r.costPerRequest.toFixed(6)}/req, ` +
      `$${r.monthlyProjection.toFixed(2)}/month`
    );
  });

  return results;
}

// Example usage
const metrics = {
  computeTime: 200,
  memoryUsed: 512,
  dataTransfer: 100,
  invocations: 1,
  dbQueries: 5
};

compareProviders('/api/heavy-route', metrics);
// Output:
// 1. CLOUDFLARE: $0.000008/req, $240.00/month
// 2. GCP: $0.000012/req, $360.00/month
// 3. AWS: $0.000015/req, $450.00/month
// ...
```

## Cost Optimization

The cost tracker automatically generates optimization suggestions. Here's how to act on them:

### 1. Reduce Compute Time

```typescript
// Suggestion: "Consider optimizing algorithm complexity or using caching"

// Before: O(n²) algorithm
function findDuplicates(items: any[]) {
  const dupes = [];
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      if (items[i].id === items[j].id) dupes.push(items[i]);
    }
  }
  return dupes;
}

// After: O(n) with Set
function findDuplicates(items: any[]) {
  const seen = new Set();
  return items.filter(item => {
    if (seen.has(item.id)) return true;
    seen.add(item.id);
    return false;
  });
}

// Result: 70% reduction in compute time, 70% cost savings
```

### 2. Optimize Memory Usage

```typescript
// Suggestion: "Reduce memory usage by streaming data"

// Before: Load entire file into memory
async function processLargeFile(path: string) {
  const data = await fs.readFile(path, 'utf-8'); // 500MB file!
  return data.split('\n').map(processLine);
}

// After: Stream processing
async function processLargeFile(path: string) {
  const stream = fs.createReadStream(path);
  const results = [];

  for await (const line of stream) {
    results.push(processLine(line));
  }

  return results;
}

// Result: 95% reduction in memory, 40% cost savings
```

### 3. Enable Compression

```typescript
// Suggestion: "Enable compression, use CDN, or reduce payload size"

import { gzip } from 'zlib';
import { promisify } from 'util';

const gzipAsync = promisify(gzip);

async function compressResponse(data: any): Promise<Buffer> {
  const json = JSON.stringify(data);
  return await gzipAsync(json);
}

// In your route:
const data = await fetchData();
const compressed = await compressResponse(data);

return new Response(compressed, {
  headers: {
    'Content-Type': 'application/json',
    'Content-Encoding': 'gzip'
  }
});

// Result: 80% reduction in data transfer, 80% savings on egress
```

### 4. Implement Caching

```typescript
// Suggestion: "Batch queries, use caching, or denormalize data"

const cache = new Map();

async function getCachedData(key: string) {
  // Check cache first
  if (cache.has(key)) {
    return cache.get(key);
  }

  // Fetch if not cached
  const data = await fetchFromDatabase(key);
  cache.set(key, data);

  // Set expiration
  setTimeout(() => cache.delete(key), 5 * 60 * 1000); // 5 minutes

  return data;
}

// Result: 90% reduction in DB queries, 50% cost savings
```

### 5. Batch Database Queries

```typescript
// Suggestion: "Batch queries to reduce database calls"

// Before: N+1 query problem
async function getUsersWithPosts() {
  const users = await db.query('SELECT * FROM users');

  for (const user of users) {
    user.posts = await db.query('SELECT * FROM posts WHERE user_id = ?', [user.id]);
  }

  return users;
}

// After: Single query with JOIN
async function getUsersWithPosts() {
  const result = await db.query(`
    SELECT
      u.*,
      JSON_AGG(p.*) as posts
    FROM users u
    LEFT JOIN posts p ON p.user_id = u.id
    GROUP BY u.id
  `);

  return result;
}

// Result: 90% fewer queries, 45% cost savings
```

## Best Practices

### 1. Track All Routes

```typescript
// Set up global middleware
app.use(async (req, res, next) => {
  const start = Date.now();

  await next();

  costTracker.trackRoute(req.path, {
    computeTime: Date.now() - start,
    memoryUsed: process.memoryUsage().heapUsed / 1024 / 1024,
    dataTransfer: res.get('content-length') / 1024 || 0,
    invocations: 1
  });
});
```

### 2. Set Cost Budgets Per Route

```typescript
const budgets = {
  '/api/users': 0.0001,
  '/api/expensive-ml': 0.01
};

function enforeBudgets() {
  for (const [route, budget] of Object.entries(budgets)) {
    const est = costTracker.estimateCost(route);
    if (est.total > budget) {
      // Alert or throttle
    }
  }
}
```

### 3. Review Optimizations Regularly

```typescript
// Generate weekly report
function generateCostReport() {
  const data = costTracker.exportCostData();

  for (const [route, info] of Object.entries(data)) {
    console.log(`\n${route}:`);
    info.estimate.optimizations.forEach(opt => {
      console.log(`  - ${opt.suggestion} (saves $${opt.potentialSavings.toFixed(4)})`);
    });
  }
}

// Run weekly
setInterval(generateCostReport, 7 * 24 * 60 * 60 * 1000);
```

### 4. Use Custom Pricing for Accuracy

```typescript
// Use your actual negotiated rates
costTracker.setCustomPricing({
  lambda: {
    compute: 0.00001234, // Your actual rate
    requests: 0.18 / 1_000_000
  }
});
```

### 5. Monitor Trends

```typescript
// Detect cost regressions
const lastWeekCost = costTracker.getCostTrends('/api/users', 7);
const avgCost = lastWeekCost.reduce((sum, day) => sum + day.cost, 0) / 7;

const today = costTracker.estimateCost('/api/users');

if (today.total > avgCost * 1.5) {
  console.error('Cost spike detected! 50% increase from average');
}
```

## Advanced Usage

### Custom Metrics

```typescript
import { CostTracker, type CostMetrics } from '@philjs/core';

// Extend metrics with custom data
interface ExtendedMetrics extends CostMetrics {
  aiTokens?: number;
  imageProcessing?: number;
}

const customTracker = new CostTracker('aws');

customTracker.trackRoute('/api/ai-image', {
  computeTime: 500,
  memoryUsed: 1024,
  dataTransfer: 500,
  invocations: 1,
  aiTokens: 1000,          // Custom metric
  imageProcessing: 1       // Custom metric
} as ExtendedMetrics);
```

### Integration with Monitoring Tools

```typescript
// Send cost data to Datadog, Prometheus, etc.
import { costTracker } from '@philjs/core';

setInterval(() => {
  const data = costTracker.exportCostData();

  for (const [route, info] of Object.entries(data)) {
    // Send to monitoring
    statsd.gauge('route.cost', info.estimate.total, [`route:${route}`]);
    statsd.gauge('route.monthly_projection', info.estimate.monthlyProjection, [`route:${route}`]);
  }
}, 60000); // Every minute
```

### Cost-Based Auto-Scaling

```typescript
function shouldScaleDown(route: string): boolean {
  const estimate = costTracker.estimateCost(route);

  // Scale down if monthly projection exceeds budget
  const monthlyBudget = 1000; // $1000
  return estimate.monthlyProjection > monthlyBudget * 0.8; // 80% threshold
}

// In your infrastructure code
if (shouldScaleDown('/api/heavy')) {
  // Reduce instance count or switch to cheaper compute
  scaleDown();
}
```

## Related Documentation

- [AI Integration](./ai-integration.md) - Track AI API costs
- [Performance Budgets](../performance/performance-budgets.md) - Set performance limits
- [Usage Analytics](./usage-analytics.md) - Optimize based on usage
- [DevTools](./devtools.md) - Debug cost issues

## Troubleshooting

### Issue: Inaccurate Cost Estimates

**Solution:** Use custom pricing for your actual rates:
```typescript
costTracker.setCustomPricing({
  lambda: {
    compute: YOUR_ACTUAL_RATE,
    requests: YOUR_ACTUAL_RATE
  }
});
```

### Issue: High Memory Costs

**Solution:** Profile memory usage:
```typescript
console.log('Memory before:', process.memoryUsage().heapUsed);
await yourFunction();
console.log('Memory after:', process.memoryUsage().heapUsed);
// Identify memory leaks
```

### Issue: Unexpected Data Transfer Costs

**Solution:** Audit response sizes:
```typescript
const responseSize = JSON.stringify(data).length;
console.log('Response size:', responseSize / 1024, 'KB');

if (responseSize > 100 * 1024) { // > 100KB
  // Consider compression or pagination
}
```

---

**Next Steps:**
- Set up [Usage Analytics](./usage-analytics.md) to identify unused code
- Configure [Performance Budgets](../performance/performance-budgets.md)
- Explore [DevTools](./devtools.md) for debugging


