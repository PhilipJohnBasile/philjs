# Self-Healing Features

The `@philjs/runtime` package provides a comprehensive self-healing system that automatically detects, diagnoses, and recovers from errors in your application. This document covers the healing strategies, error handling mechanisms, and advanced recovery patterns.

## Healing Strategies

The self-healing runtime supports seven distinct healing strategies, each designed for specific error scenarios:

```typescript
type HealingStrategy =
  | 'retry'           // Retry with exponential backoff
  | 'fallback'        // Use fallback component
  | 'isolate'         // Isolate failing component
  | 'restore'         // Restore from checkpoint
  | 'degrade'         // Graceful degradation
  | 'hot-patch'       // Hot-patch the component
  | 'circuit-break';  // Circuit breaker pattern
```

### Strategy Overview

| Strategy | Use Case | Behavior |
|----------|----------|----------|
| `retry` | Transient errors (network timeouts, rate limits) | Retry with exponential backoff and jitter |
| `fallback` | Component render failures | Swap to a pre-registered fallback component |
| `isolate` | Critical/security errors | Unmount and isolate the failing component |
| `restore` | State corruption | Restore component state from checkpoint |
| `degrade` | Performance issues | Reduce functionality while maintaining core features |
| `hot-patch` | Known bugs in production | Apply a registered fix without page reload |
| `circuit-break` | Repeated failures | Stop requests to prevent cascade failures |

## The handleError Method

The `handleError` method is the core of the self-healing system. It accepts an error and context, determines the appropriate strategy, and applies the healing action.

### Method Signature

```typescript
async handleError(
  error: Error,
  context: Partial<ErrorContext>
): Promise<HealingResult>
```

### Parameters

```typescript
interface ErrorContext {
  /** Component that threw the error */
  componentId: string;
  /** Component display name */
  componentName: string;
  /** Error severity level */
  severity: ErrorSeverity;
  /** Error timestamp */
  timestamp: number;
  /** Stack trace */
  stack?: string;
  /** Component state at time of error */
  componentState?: unknown;
  /** Number of times this error has occurred */
  occurrences: number;
  /** Additional context data */
  metadata?: Record<string, unknown>;
}

type ErrorSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
```

### Return Value

```typescript
interface HealingResult {
  /** Whether healing was successful */
  success: boolean;
  /** Strategy that was applied */
  strategy: HealingStrategy;
  /** Time taken to heal (ms) */
  duration: number;
  /** Any data returned from healing */
  data?: unknown;
  /** Error if healing failed */
  error?: Error;
  /** Number of retries performed */
  retries: number;
}
```

### Basic Usage

```typescript
import { initSelfHealing } from '@philjs/runtime/self-healing';

const runtime = initSelfHealing();

async function riskyOperation() {
  try {
    await fetchData();
  } catch (error) {
    const result = await runtime.handleError(error as Error, {
      componentId: 'data-fetcher',
      componentName: 'DataFetcher',
      metadata: { url: '/api/data' },
    });

    if (result.success) {
      console.log(`Recovered using ${result.strategy} strategy`);
      return riskyOperation(); // Retry the operation
    }

    throw error; // Re-throw if recovery failed
  }
}
```

### Error Handling Flow

When `handleError` is called, the runtime follows this sequence:

1. **Create Error Context**: Build a complete `ErrorContext` from the provided partial context
2. **Record Error**: Store the error in history for pattern analysis
3. **Check Circuit Breaker**: If circuit is open, immediately return failure
4. **Determine Strategy**: Select the appropriate healing strategy based on error type and severity
5. **Apply Strategy**: Execute the selected healing action
6. **Update Circuit Breaker**: Increment failures on failure, reset on success
7. **Emit Events**: Notify subscribers of healing progress and results

```typescript
// The internal flow
async handleError(error: Error, context: Partial<ErrorContext>): Promise<HealingResult> {
  // 1. Create full error context
  const fullContext = this.createErrorContext(error, context);

  // 2. Emit error-detected event
  this.emit({ type: 'error-detected', timestamp: Date.now(), error });

  // 3. Record for pattern analysis
  this.recordError(fullContext);

  // 4. Check circuit breaker
  if (this.isCircuitOpen(fullContext.componentId)) {
    return {
      success: false,
      strategy: 'circuit-break',
      duration: 0,
      retries: 0,
      error: new Error('Circuit breaker is open'),
    };
  }

  // 5. Determine and apply strategy
  const strategy = this.determineStrategy(fullContext);
  this.emit({ type: 'healing-started', timestamp: Date.now(), strategy });

  const result = await this.applyStrategy(strategy, fullContext);

  // 6-7. Update state and emit result
  if (result.success) {
    this.resetCircuitBreaker(fullContext.componentId);
    this.emit({ type: 'healing-succeeded', result });
  } else {
    this.incrementCircuitBreaker(fullContext.componentId);
    this.emit({ type: 'healing-failed', result });
  }

  return result;
}
```

## Retry with Backoff

The `retry` strategy attempts to recover from transient errors by retrying the operation with exponential backoff and jitter.

### How It Works

1. Wait for the base delay period
2. Attempt recovery
3. If failed, double the delay (with jitter) and retry
4. Continue until `maxRetries` is reached or recovery succeeds

### Configuration

```typescript
const runtime = initSelfHealing({
  maxRetries: 3,        // Maximum retry attempts (default: 3)
  baseDelay: 100,       // Starting delay in ms (default: 100)
  maxDelay: 10000,      // Maximum delay cap in ms (default: 10000)
});
```

### Backoff Calculation

The delay follows an exponential pattern with random jitter to prevent thundering herd:

```typescript
// Delay calculation formula
delay = Math.min(baseDelay * 2^retryCount + random(0, 100), maxDelay)
```

Example delays with `baseDelay: 100`:
- Retry 1: ~200ms (100 * 2 + jitter)
- Retry 2: ~400ms (200 * 2 + jitter)
- Retry 3: ~800ms (400 * 2 + jitter)
- ...capped at maxDelay (10000ms)

### Usage Example

```typescript
import { initSelfHealing } from '@philjs/runtime/self-healing';

const runtime = initSelfHealing({
  maxRetries: 5,
  baseDelay: 200,
  maxDelay: 5000,
  strategies: new Map([
    ['TimeoutError', 'retry'],
    ['NetworkError', 'retry'],
    ['RateLimitError', 'retry'],
  ]),
});

async function fetchWithRetry(url: string) {
  try {
    const response = await fetch(url);
    return response.json();
  } catch (error) {
    const result = await runtime.handleError(error as Error, {
      componentId: 'api-client',
      metadata: { url },
    });

    if (result.success) {
      console.log(`Recovered after ${result.retries} retries`);
      return fetchWithRetry(url);
    }

    throw new Error(`Failed after ${result.retries} retries: ${error}`);
  }
}
```

## Fallback Components

The `fallback` strategy swaps a failing component with a pre-registered alternative, ensuring the application remains functional.

### Registering Fallbacks

```typescript
import { initSelfHealing } from '@philjs/runtime/self-healing';

const runtime = initSelfHealing();

// Register a simple data fallback
runtime.registerFallback('user-profile', () => ({
  type: 'fallback',
  name: 'Guest User',
  avatar: '/default-avatar.png',
}));

// Register a JSX fallback
runtime.registerFallback('product-gallery', () => (
  <div className="gallery-fallback">
    <p>Gallery temporarily unavailable</p>
    <button onClick={() => window.location.reload()}>
      Refresh Page
    </button>
  </div>
));

// Register a functional fallback with retry capability
runtime.registerFallback('checkout-form', () => {
  return {
    component: 'SimplifiedCheckout',
    props: {
      onRetry: () => {
        runtime.handleError(new Error('Manual retry'), {
          componentId: 'checkout-form',
        });
      },
    },
  };
});
```

### Fallback Selection

When the `fallback` strategy is selected:

1. Look up the registered fallback for the component
2. If found, execute the fallback function and return its result
3. If not found, use a generic error fallback

```typescript
// Generic fallback when no specific fallback is registered
{
  type: 'generic-error-fallback',
  message: 'Component temporarily unavailable'
}
```

### Using with useSelfHealing Hook

```typescript
import { useSelfHealing } from '@philjs/runtime/self-healing';

function DataTable({ data }: { data: Item[] }) {
  const { handleError } = useSelfHealing('data-table', {
    // Inline fallback registration
    fallback: () => (
      <div className="table-fallback">
        <p>Unable to render table</p>
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </div>
    ),
    onHealed: (result) => {
      if (result.strategy === 'fallback') {
        analytics.track('table-fallback-used');
      }
    },
  });

  try {
    return <ComplexTable data={data} />;
  } catch (error) {
    handleError(error as Error);
    return null; // Fallback will be rendered
  }
}
```

## Hot-Patching

Hot-patching allows you to apply fixes to components in production without requiring a page reload. This is particularly useful for:

- Fixing known bugs discovered after deployment
- Applying temporary workarounds while a proper fix is developed
- Adjusting component behavior based on runtime conditions

### Registering Hot-Patches

```typescript
import { getSelfHealingRuntime } from '@philjs/runtime/self-healing';

const runtime = getSelfHealingRuntime();

// Register a hot-patch that fixes a DOM issue
runtime.registerHotPatch('broken-carousel', () => {
  // Fix incorrect DOM structure
  const container = document.getElementById('carousel-container');
  if (container) {
    container.style.overflow = 'hidden';
    container.querySelectorAll('.slide').forEach((slide, index) => {
      (slide as HTMLElement).style.transform = `translateX(${index * 100}%)`;
    });
  }
});

// Register a hot-patch that resets corrupted state
runtime.registerHotPatch('form-wizard', () => {
  // Clear problematic cached data
  localStorage.removeItem('form-wizard-state');
  sessionStorage.removeItem('form-wizard-step');

  // Reset to safe defaults
  window.__FORM_WIZARD_STATE__ = {
    step: 0,
    data: {},
    errors: [],
  };
});

// Register a hot-patch with external fix loading
runtime.registerHotPatch('chart-renderer', async () => {
  // Dynamically load a fix module
  const fix = await import('/fixes/chart-renderer-fix.js');
  fix.apply();
});
```

### Enabling Hot-Patches

Hot-patching must be explicitly enabled in the configuration:

```typescript
const runtime = initSelfHealing({
  enableHotPatch: true, // Default: true
  strategies: new Map([
    ['ChartError', 'hot-patch'],
    ['CarouselError', 'hot-patch'],
  ]),
});
```

### Hot-Patch Workflow

1. **Error Occurs**: A component throws an error
2. **Strategy Selection**: The runtime selects `hot-patch` based on error type
3. **Patch Lookup**: Find the registered patch for the component
4. **Patch Execution**: Run the patch function
5. **Event Emission**: Emit `hot-patch-applied` event on success

```typescript
// Monitor hot-patch events
runtime.onEvent((event) => {
  if (event.type === 'hot-patch-applied') {
    console.log(`Hot-patch applied to ${event.componentId}`);

    // Track for later analysis
    analytics.track('hot-patch-applied', {
      component: event.componentId,
      timestamp: event.timestamp,
    });
  }
});
```

### Security Considerations

Hot-patching executes arbitrary code at runtime. Follow these best practices:

1. **Validate Patches**: Only register patches from trusted sources
2. **Audit Logging**: Log all patch applications for security review
3. **Disable in Sensitive Contexts**: Consider disabling hot-patching for security-critical components

```typescript
const runtime = initSelfHealing({
  enableHotPatch: process.env.NODE_ENV !== 'production' ||
                  process.env.ALLOW_HOT_PATCH === 'true',
});
```

## Circuit Breaker Pattern

The circuit breaker pattern prevents cascade failures by stopping requests to a failing service after a threshold of failures is reached.

### Circuit Breaker States

```typescript
interface CircuitBreakerState {
  /** Current state of the circuit */
  state: 'closed' | 'open' | 'half-open';
  /** Number of consecutive failures */
  failures: number;
  /** Timestamp of last failure */
  lastFailure: number;
  /** When the circuit was opened */
  openedAt?: number;
  /** Successful requests in half-open state */
  halfOpenSuccesses: number;
}
```

| State | Description | Behavior |
|-------|-------------|----------|
| `closed` | Normal operation | Requests pass through, failures are counted |
| `open` | Circuit tripped | All requests immediately fail |
| `half-open` | Testing recovery | Limited requests allowed to test if service recovered |

### State Transitions

```
     +---------+
     |         |
     v         |
+--------+     | Success
| CLOSED |-----+
+--------+
     |
     | Failures >= threshold
     v
+--------+
|  OPEN  |
+--------+
     |
     | Timeout elapsed
     v
+-----------+
| HALF-OPEN |
+-----------+
     |         |
     | 3 Successes | Failure
     v         |
+--------+     |
| CLOSED |<----+
+--------+     |
               v
           +--------+
           |  OPEN  |
           +--------+
```

### Configuration

```typescript
const runtime = initSelfHealing({
  circuitBreakerThreshold: 5,    // Failures before opening (default: 5)
  circuitBreakerTimeout: 30000,  // Time before half-open state (default: 30000ms)
});
```

### Usage Example

```typescript
import { initSelfHealing } from '@philjs/runtime/self-healing';

const runtime = initSelfHealing({
  circuitBreakerThreshold: 3,
  circuitBreakerTimeout: 60000, // 1 minute
  strategies: new Map([
    ['NetworkError', 'circuit-break'],
    ['ServiceUnavailableError', 'circuit-break'],
  ]),
});

// Subscribe to circuit events
runtime.onEvent((event) => {
  switch (event.type) {
    case 'circuit-opened':
      console.warn(`Circuit OPEN for ${event.componentId}`);
      notifyOpsTeam({
        severity: 'warning',
        message: `Service ${event.componentId} circuit breaker opened`,
      });
      break;

    case 'circuit-closed':
      console.log(`Circuit CLOSED for ${event.componentId}`);
      notifyOpsTeam({
        severity: 'info',
        message: `Service ${event.componentId} recovered`,
      });
      break;
  }
});

// Handle errors with circuit breaker protection
async function callExternalAPI(serviceId: string) {
  try {
    return await externalService.call();
  } catch (error) {
    const result = await runtime.handleError(error as Error, {
      componentId: serviceId,
      componentName: 'External Service',
    });

    if (!result.success && result.strategy === 'circuit-break') {
      // Circuit is open, use cached or default data
      console.log('Using cached response due to open circuit');
      return getCachedResponse(serviceId);
    }

    throw error;
  }
}
```

### Monitoring Circuit Breaker State

```typescript
function displayCircuitBreakerStatus() {
  const stats = runtime.getStats();

  console.log('Circuit Breaker Status:');
  for (const [componentId, state] of stats.circuitBreakerStates) {
    console.log(`  ${componentId}:`);
    console.log(`    State: ${state.state}`);
    console.log(`    Failures: ${state.failures}`);
    console.log(`    Last Failure: ${new Date(state.lastFailure).toISOString()}`);
    if (state.openedAt) {
      console.log(`    Opened At: ${new Date(state.openedAt).toISOString()}`);
    }
    if (state.state === 'half-open') {
      console.log(`    Half-Open Successes: ${state.halfOpenSuccesses}/3`);
    }
  }
}
```

## Graceful Degradation

The `degrade` strategy reduces application functionality while maintaining core features. This is useful when:

- A component is consuming too many resources
- Non-critical features are failing repeatedly
- The application needs to operate in a resource-constrained environment

### How Degradation Works

When degradation is triggered:

1. Non-essential features are disabled (animations, effects, real-time updates)
2. The component continues to function with reduced capabilities
3. The degradation is logged for monitoring

```typescript
// Example degradation result
{
  success: true,
  strategy: 'degrade',
  duration: 5,
  retries: 0,
  data: {
    degraded: true,
    reducedFeatures: ['animations', 'effects', 'real-time-updates']
  }
}
```

### Implementing Degraded Mode

```typescript
import { useSelfHealing } from '@philjs/runtime/self-healing';

function RichDataGrid({ data }: { data: Item[] }) {
  const [degradedMode, setDegradedMode] = useState(false);

  const { handleError } = useSelfHealing('data-grid', {
    onHealed: (result) => {
      if (result.strategy === 'degrade') {
        setDegradedMode(true);
        const features = result.data as { reducedFeatures: string[] };
        console.log('Disabled features:', features.reducedFeatures);
      }
    },
  });

  if (degradedMode) {
    // Render simplified version
    return (
      <table className="simple-grid">
        <thead>
          <tr>
            {Object.keys(data[0] || {}).map(key => (
              <th key={key}>{key}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              {Object.values(row).map((val, j) => (
                <td key={j}>{String(val)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  // Render full-featured version
  return (
    <VirtualizedDataGrid
      data={data}
      enableAnimations
      enableDragAndDrop
      enableRealTimeUpdates
      onError={handleError}
    />
  );
}
```

## Component Isolation

The `isolate` strategy unmounts and isolates a failing component to prevent it from affecting the rest of the application. This is the safest strategy for critical or security-related errors.

### When to Use Isolation

- Security errors that could compromise the application
- Data corruption that could spread to other components
- Infinite loops or runaway renders
- Memory leaks in specific components

### Configuration

```typescript
const runtime = initSelfHealing({
  strategies: new Map([
    ['SecurityError', 'isolate'],
    ['DataCorruptionError', 'isolate'],
    ['RenderError', 'isolate'],
    ['InfiniteLoopError', 'isolate'],
  ]),
});
```

### Isolation Result

```typescript
// Example isolation result
{
  success: true,
  strategy: 'isolate',
  duration: 2,
  retries: 0,
  data: {
    isolated: true,
    componentId: 'vulnerable-widget'
  }
}
```

### Handling Isolated Components

```typescript
runtime.onEvent((event) => {
  if (event.type === 'healing-succeeded' && event.strategy === 'isolate') {
    const { componentId } = event.result?.data as { componentId: string };

    // Log for security review
    securityLogger.log({
      event: 'component-isolated',
      componentId,
      timestamp: event.timestamp,
      reason: event.error?.message,
    });

    // Notify operations team
    alertSystem.trigger({
      severity: 'high',
      title: 'Component Isolated',
      message: `${componentId} was isolated due to: ${event.error?.message}`,
    });
  }
});
```

## Custom Strategy Configuration

Configure custom strategies for specific error types:

```typescript
const runtime = initSelfHealing({
  strategies: new Map([
    // Network errors
    ['NetworkError', 'circuit-break'],
    ['FetchError', 'retry'],
    ['TimeoutError', 'retry'],

    // State errors
    ['StateCorruptionError', 'restore'],
    ['HydrationMismatchError', 'restore'],

    // Component errors
    ['RenderError', 'fallback'],
    ['ChunkLoadError', 'retry'],

    // Security errors
    ['SecurityError', 'isolate'],
    ['XSSError', 'isolate'],

    // Custom application errors
    ['PaymentError', 'fallback'],
    ['AuthError', 'circuit-break'],
    ['ValidationError', 'retry'],
  ]),
});
```

### Default Strategies

If no custom strategy is configured, the runtime uses severity-based selection:

| Severity | Default Strategy |
|----------|------------------|
| `critical` | `isolate` |
| `high` | `retry` (then `fallback` after 2 occurrences) |
| `medium` | `retry` (then `degrade` after `maxRetries`) |
| `low` | `retry` |
| `info` | `retry` |

### Severity Determination

Severity is automatically determined based on error type:

```typescript
// Internal severity mapping
function determineSeverity(error: Error): ErrorSeverity {
  switch (error.name) {
    case 'SecurityError':
    case 'DataCorruptionError':
      return 'critical';
    case 'TypeError':
    case 'ReferenceError':
      return 'high';
    case 'NetworkError':
      return 'medium';
    case 'ValidationError':
      return 'low';
    default:
      return 'medium';
  }
}
```

## Event System

The self-healing runtime provides a comprehensive event system for monitoring and observability.

### Event Types

```typescript
type HealingEventType =
  | 'error-detected'       // Error caught by the runtime
  | 'healing-started'      // Healing process initiated
  | 'healing-succeeded'    // Recovery successful
  | 'healing-failed'       // Recovery failed
  | 'checkpoint-created'   // State checkpoint saved
  | 'checkpoint-restored'  // State restored from checkpoint
  | 'circuit-opened'       // Circuit breaker opened
  | 'circuit-closed'       // Circuit breaker closed
  | 'hot-patch-applied'    // Hot-patch executed
  | 'prediction-warning';  // High failure probability detected
```

### Subscribing to Events

```typescript
import { initSelfHealing, HealingEvent } from '@philjs/runtime/self-healing';

const runtime = initSelfHealing();

const unsubscribe = runtime.onEvent((event: HealingEvent) => {
  // Event structure
  const {
    type,           // Event type
    timestamp,      // When the event occurred
    componentId,    // Affected component
    strategy,       // Strategy used (if applicable)
    error,          // Error object (if applicable)
    result,         // HealingResult (if applicable)
    prediction,     // FailurePrediction (if applicable)
  } = event;

  // Handle event
  switch (type) {
    case 'error-detected':
      errorTracker.capture(error);
      break;
    case 'healing-succeeded':
      metrics.increment('healing.success', { strategy });
      break;
    case 'healing-failed':
      metrics.increment('healing.failure', { strategy });
      alertIfCritical(event);
      break;
  }
});

// Cleanup
unsubscribe();
```

### Integration with Observability

```typescript
// OpenTelemetry integration
runtime.onEvent((event) => {
  const span = tracer.startSpan(`self-healing.${event.type}`);
  span.setAttributes({
    'component.id': event.componentId,
    'healing.strategy': event.strategy,
    'healing.success': event.result?.success,
    'healing.duration': event.result?.duration,
  });
  span.end();
});

// DataDog integration
runtime.onEvent((event) => {
  datadogRum.addAction('self-healing-event', {
    type: event.type,
    component: event.componentId,
    strategy: event.strategy,
    success: event.result?.success,
  });
});
```

## Next Steps

- [Checkpoints and Recovery](./checkpoints.md) - State snapshots and restoration
- [Failure Prediction](./prediction.md) - ML-based failure prediction
- [Overview](./overview.md) - Complete package overview
