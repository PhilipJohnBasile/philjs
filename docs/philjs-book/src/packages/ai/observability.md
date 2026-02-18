# Observability

The `@philjs/ai` package provides a robust observability layer to track token usage, costs, latency, and errors across all your AI operations.

## Features

- **Cost Tracking**: Built-in pricing models for OpenAI, Anthropic, and Google Gemini.
- **Budgeting**: Set daily or monthly spending limits with alerts.
- **Latency Metrics**: Track P95/P99 latency for your AI calls.
- **Exporters**: Pluggable architecture for sending telemetry to Console, Files, or HTTP endpoints.

## Usage

Wrap any AI provider with `createObservableProvider` to start collecting metrics.

```typescript
import { createObservableProvider, ConsoleExporter } from '@philjs/ai';
import { anthropicProvider } from '@philjs/ai/providers';

const observableProvider = createObservableProvider(anthropicProvider, {
  // Enable debug logging
  debug: true,
  
  // Set budget limits
  budget: {
    dailyLimit: 10, // $10/day
    onWarning: (usage) => console.warn('Approaching budget limit:', usage.totalCost),
    onLimitExceeded: (usage) => console.error('Budget exceeded!'),
  },

  // Export telemetry
  exporters: [new ConsoleExporter()],
});

// Use transparently
const response = await observableProvider.generateCompletion('Analyze this data...');
```

## Metrics

You can access real-time metrics directly from the provider instance.

```typescript
const metrics = observableProvider.getMetrics();

console.log({
  totalCalls: metrics.totalCalls,
  totalCost: `$${metrics.totalCost.toFixed(4)}`,
  avgLatency: `${metrics.avgLatency.toFixed(0)}ms`,
  errors: metrics.errors,
  tokensByModel: metrics.tokensByModel
});
```

## Configuration

### ObservabilityConfig

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `debug` | `boolean` | `false` | Log events to console |
| `budget` | `AIBudget` | - | Cost and token limits |
| `exporters` | `TelemetryExporter[]` | `[]` | Destinations for telemetry events |
| `sampleRate` | `number` | `1.0` | Probability (0-1) to record an event |
| `includeContent` | `boolean` | `false` | Include full prompt/response text in logs |
| `batchSize` | `number` | `100` | Number of events to queue before flushing |
| `flushInterval` | `number` | `10000` | Max time (ms) to hold events |

### AIBudget

| Option | Type | Description |
|--------|------|-------------|
| `dailyLimit` | `number` | Max USD cost per day |
| `monthlyLimit` | `number` | Max USD cost per month |
| `maxTokensPerRequest` | `number` | Hard limit on tokens per call |
| `dailyTokenLimit` | `number` | Max tokens per day |
| `onWarning` | `(usage, limit) => void` | Callback at 80% usage |
| `onLimitExceeded` | `(usage, limit) => void` | Callback when limit hit |

## Custom Exporters

Implement the `TelemetryExporter` interface to send data to your own observability platform (e.g., Datadog, Honeycomb).

```typescript
import { TelemetryExporter, AIEvent } from '@philjs/ai';

class MyCryptoExporter implements TelemetryExporter {
  async export(events: AIEvent[]): Promise<void> {
    await sendToMyService(events.map(e => ({
      ...e,
      source: 'philjs-ai'
    })));
  }

  async flush(): Promise<void> {
    // Flush any internal buffers
  }
}
```
