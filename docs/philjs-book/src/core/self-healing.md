# Self-Healing Runtime

PhilJS features a revolutionary **Self-Healing Runtime** (`@philjs/runtime`) that dramatically increases the resilience of your applications in production. Unlike other frameworks where a single error can crash the entire application (white screen of death), PhilJS uses advanced supervision strategies to recover gracefully.

## Core Features

### 1. Circuit Breakers

PhilJS implements the "Circuit Breaker" pattern for your components and data capabilities. If a component crashes repeatedly, the runtime "trips" the circuit and stops attempting to render that component, preventing a cascade of failures.

- **Closed State**: Normal operation.
- **Open State**: The component has failed too many times. Requests are blocked immediately.
- **Half-Open**: After a timeout, PhilJS attempts to render the component again. If successful, the circuit closes.

```tsx
import { useSelfHealing } from '@philjs/runtime';

// Configure circuit breaker for a risky component
useSelfHealing({
  componentId: 'StockTicker',
  circuitBreakerThreshold: 3, // Trip after 3 failures
  circuitBreakerTimeout: 30000, // Wait 30s before retrying
});
```

### 2. Predictive Failure Analysis

The runtime doesn't just react to errors; it *predicts* them using client-side heuristics and light machine learning patterns.

*   **Frequency Analysis**: Detects if error rates are accelerating.
*   **Proactive Action**: If the probability of failure exceeds 70%, PhilJS proactively isolates the component before it can crash the page.

### 3. Hot-Patching

In mission-critical scenarios, you can push "hot patches" to live clients without a full reload. If a specific component ID is flagged as broken, the runtime can swap its implementation with a safe version from the server.

### 4. Automatic State Checkpointing

PhilJS periodically saves snapshots of your component state (`@philjs/runtime` creates "checkpoints"). If a crash occurs, it can attempt to "Restore" the application to the last known good state (minus the crashing action), effectively "undoing" the crash.

## Configuration

You can configure the healing strategy globally or per-component.

```typescript
// philjs.config.ts
export default defineConfig({
  healing: {
    enabled: true,
    strategies: {
      'NetworkError': 'circuit-break',
      'TypeError': 'retry', // Retry 3 times with backoff
      'RenderError': 'isolate', // Replace with Error Boundary
    }
  }
});
```

## Strategies

*   **Retry**: Re-attempts the operation with exponential backoff.
*   **Fallback**: Swaps the component for a pre-registered Fallback UI.
*   **Isolate**: Removes the component from the DOM but keeps the rest of the app running.
*   **Restore**: Rolls back state to the last checkpoint.
*   **Hot-Patch**: Waiting for a live patch from the server.

This Self-Healing capability makes PhilJS the only framework suitable for **Category 1 Critical Applications** (Healthcare, Finance, Infrastructure) out of the box.
