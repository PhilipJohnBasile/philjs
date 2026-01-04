# @philjs/runtime - Self-Healing Runtime

The `@philjs/runtime` package provides a unique self-healing runtime with automatic error recovery capabilities. Unlike traditional error handling that simply catches and logs errors, this runtime actively detects, diagnoses, and heals application failures in real-time.

## Installation

```bash
npm install @philjs/runtime
# or
pnpm add @philjs/runtime
# or
bun add @philjs/runtime
```

## Package Exports

| Export | Description |
|--------|-------------|
| `@philjs/runtime` | Main entry point |
| `@philjs/runtime/self-healing` | Self-healing runtime engine and utilities |

## Features

The self-healing runtime provides the following unique capabilities:

| Feature | Description |
|---------|-------------|
| **Automatic Error Recovery** | Smart retry strategies with exponential backoff and jitter |
| **Graceful Degradation** | Automatically fall back to simpler component versions |
| **Circuit Breaker Pattern** | Prevent cascade failures by isolating failing services |
| **Hot-Patching** | Apply fixes to components in production without page reload |
| **State Checkpoints** | Automatic state snapshots for point-in-time recovery |
| **Predictive Failure Detection** | ML-based pattern analysis to predict failures before they occur |
| **Self-Correcting Memory** | Automatic cleanup and memory management during recovery |

## Quick Start

```typescript
import {
  initSelfHealing,
  useSelfHealing,
  withSelfHealing
} from '@philjs/runtime/self-healing';

// Initialize the runtime with custom configuration
const runtime = initSelfHealing({
  maxRetries: 3,
  enablePrediction: true,
  circuitBreakerThreshold: 5,
});

// Use the self-healing hook in a component
function MyComponent() {
  const { saveState, handleError, predict } = useSelfHealing('my-component', {
    fallback: () => <FallbackComponent />,
    onHealed: (result) => console.log('Component healed:', result),
  });

  // Save state for potential restoration
  saveState({ data: 'important data' });

  // Check for potential failures
  const prediction = predict();
  if (prediction.probability > 0.5) {
    console.warn('High failure probability detected');
  }
}
```

## Architecture

```
@philjs/runtime
├── Self-Healing Engine
│   ├── SelfHealingRuntime   - Core runtime class
│   ├── Error Detection      - Global and component error capture
│   ├── Strategy Selection   - Smart healing strategy selection
│   └── Recovery Execution   - Apply healing strategies
│
├── Healing Strategies
│   ├── retry              - Retry with exponential backoff
│   ├── fallback           - Use fallback component
│   ├── isolate            - Isolate failing component
│   ├── restore            - Restore from checkpoint
│   ├── degrade            - Graceful degradation
│   ├── hot-patch          - Apply hot-patch fix
│   └── circuit-break      - Circuit breaker pattern
│
├── State Management
│   ├── Checkpoints        - State snapshots
│   ├── Component States   - Per-component state tracking
│   └── Error History      - Error pattern analysis
│
├── Prediction Engine
│   ├── Pattern Analysis   - Error frequency analysis
│   ├── Failure Prediction - ML-based prediction
│   └── Preemptive Action  - Suggested preventive actions
│
└── Integration
    ├── useSelfHealing()   - Component hook
    ├── withSelfHealing()  - Higher-order function
    └── ErrorBoundary      - Error boundary creator
```

## Configuration

The `HealingConfig` interface provides comprehensive control over the runtime behavior:

```typescript
interface HealingConfig {
  /** Enable self-healing features (default: true) */
  enabled: boolean;

  /** Maximum retry attempts (default: 3) */
  maxRetries: number;

  /** Base delay for exponential backoff in ms (default: 100) */
  baseDelay: number;

  /** Maximum delay cap in ms (default: 10000) */
  maxDelay: number;

  /** Enable automatic checkpointing (default: true) */
  enableCheckpoints: boolean;

  /** Checkpoint interval in ms (default: 30000) */
  checkpointInterval: number;

  /** Enable predictive failure detection (default: true) */
  enablePrediction: boolean;

  /** Circuit breaker threshold - failures before opening (default: 5) */
  circuitBreakerThreshold: number;

  /** Circuit breaker reset timeout in ms (default: 30000) */
  circuitBreakerTimeout: number;

  /** Enable hot-patching (default: true) */
  enableHotPatch: boolean;

  /** Log healing events to console (default: true) */
  logEvents: boolean;

  /** Custom healing strategies per error type */
  strategies: Map<string, HealingStrategy>;
}
```

### Configuration Options Explained

| Option | Default | Description |
|--------|---------|-------------|
| `enabled` | `true` | Master switch for self-healing features |
| `maxRetries` | `3` | Number of retry attempts before trying another strategy |
| `baseDelay` | `100` | Starting delay for exponential backoff (doubles each retry) |
| `maxDelay` | `10000` | Maximum delay between retries (10 seconds cap) |
| `enableCheckpoints` | `true` | Automatically save state snapshots for recovery |
| `checkpointInterval` | `30000` | How often to create automatic checkpoints (30 seconds) |
| `enablePrediction` | `true` | Use ML patterns to predict failures |
| `circuitBreakerThreshold` | `5` | Failures required to open circuit breaker |
| `circuitBreakerTimeout` | `30000` | Time before circuit breaker enters half-open state |
| `enableHotPatch` | `true` | Allow hot-patching components without reload |
| `logEvents` | `true` | Log healing events for debugging |
| `strategies` | See below | Custom error type to strategy mapping |

### Default Error Strategies

```typescript
const DEFAULT_STRATEGIES = new Map([
  ['TypeError', 'retry'],           // Retry type errors
  ['ReferenceError', 'fallback'],   // Use fallback for reference errors
  ['NetworkError', 'circuit-break'], // Circuit break for network issues
  ['RenderError', 'isolate'],       // Isolate render failures
  ['StateError', 'restore'],        // Restore state on state errors
]);
```

## Usage Examples

### Initializing the Runtime

```typescript
import { initSelfHealing } from '@philjs/runtime/self-healing';

// Basic initialization with defaults
const runtime = initSelfHealing();

// Custom configuration
const runtime = initSelfHealing({
  maxRetries: 5,
  enablePrediction: true,
  circuitBreakerThreshold: 3,
  strategies: new Map([
    ['CustomError', 'fallback'],
    ['APIError', 'circuit-break'],
  ]),
});
```

### Using the useSelfHealing Hook

The `useSelfHealing` hook provides component-level self-healing capabilities:

```typescript
import { useSelfHealing } from '@philjs/runtime/self-healing';

function DataFetcher({ url }: { url: string }) {
  const { saveState, handleError, predict } = useSelfHealing('data-fetcher', {
    // Fallback component when recovery fails
    fallback: () => ({ type: 'error', message: 'Data unavailable' }),

    // Called when recovery fails completely
    onError: (error) => {
      console.error('Unrecoverable error:', error);
      analytics.trackError(error);
    },

    // Called when healing succeeds
    onHealed: (result) => {
      console.log(`Healed using ${result.strategy} after ${result.retries} retries`);
    },
  });

  async function fetchData() {
    try {
      const response = await fetch(url);
      const data = await response.json();

      // Save state for potential restoration
      saveState({ data, fetchedAt: Date.now() });

      return data;
    } catch (error) {
      // Let the runtime handle the error
      const result = await handleError(error as Error);

      if (result.success) {
        // Retry the operation
        return fetchData();
      }

      throw error;
    }
  }

  // Proactive failure prediction
  const prediction = predict();
  if (prediction.probability > 0.7) {
    console.warn('High failure risk:', prediction.factors);
    // Consider preemptive action
  }

  return fetchData();
}
```

### Registering Fallback Components

```typescript
import { getSelfHealingRuntime } from '@philjs/runtime/self-healing';

const runtime = getSelfHealingRuntime();

// Register a fallback for a specific component
runtime.registerFallback('user-profile', () => {
  return {
    type: 'fallback-profile',
    name: 'Guest User',
    avatar: '/default-avatar.png',
  };
});

// Register fallback with JSX
runtime.registerFallback('product-card', () => (
  <div className="product-card-fallback">
    <p>Product temporarily unavailable</p>
    <button onClick={() => window.location.reload()}>
      Retry
    </button>
  </div>
));
```

### Creating and Restoring Checkpoints

```typescript
import {
  initSelfHealing,
  getSelfHealingRuntime
} from '@philjs/runtime/self-healing';

const runtime = initSelfHealing({
  enableCheckpoints: true,
  checkpointInterval: 15000, // Every 15 seconds
});

// Manually save component state
runtime.saveState('shopping-cart', {
  items: [
    { id: 1, name: 'Widget', quantity: 2 },
    { id: 2, name: 'Gadget', quantity: 1 },
  ],
  total: 149.99,
});

// Create a manual checkpoint with metadata
const checkpoint = runtime.createCheckpoint({
  reason: 'before-checkout',
  userId: currentUser.id,
});

console.log('Created checkpoint:', checkpoint.id);
// Output: Created checkpoint: cp_1704307200000_abc123

// Later, restore from checkpoint
async function recoverFromError() {
  // Restore the most recent checkpoint
  const restored = await runtime.restoreCheckpoint();

  if (restored) {
    console.log('State restored successfully');
  }

  // Or restore a specific checkpoint
  await runtime.restoreCheckpoint('cp_1704307200000_abc123');
}
```

### Using the Circuit Breaker Pattern

```typescript
import { initSelfHealing } from '@philjs/runtime/self-healing';

const runtime = initSelfHealing({
  circuitBreakerThreshold: 3, // Open after 3 failures
  circuitBreakerTimeout: 30000, // Try again after 30s
});

// Subscribe to circuit breaker events
runtime.onEvent((event) => {
  if (event.type === 'circuit-opened') {
    console.warn(`Circuit opened for ${event.componentId}`);
    notifyOperationsTeam(event);
  }

  if (event.type === 'circuit-closed') {
    console.log(`Circuit recovered for ${event.componentId}`);
  }
});

// Handle errors - circuit breaker activates automatically
async function callExternalService(serviceId: string) {
  try {
    return await externalAPI.call();
  } catch (error) {
    const result = await runtime.handleError(error as Error, {
      componentId: serviceId,
      componentName: 'External Service',
    });

    if (result.strategy === 'circuit-break') {
      // Circuit is now open, use cached data
      return getCachedResponse(serviceId);
    }

    throw error;
  }
}
```

### Predictive Failure Detection

```typescript
import { getSelfHealingRuntime } from '@philjs/runtime/self-healing';

const runtime = getSelfHealingRuntime();

// Predict potential failures
function checkComponentHealth(componentId: string) {
  const prediction = runtime.predictFailure(componentId);

  console.log('Failure Prediction:', {
    probability: `${(prediction.probability * 100).toFixed(1)}%`,
    confidence: `${(prediction.confidence * 100).toFixed(1)}%`,
    suggestedAction: prediction.suggestedAction,
    factors: prediction.factors,
  });

  // Take preemptive action based on prediction
  if (prediction.probability > 0.7 && prediction.confidence > 0.5) {
    switch (prediction.suggestedAction) {
      case 'circuit-break':
        // Preemptively switch to backup service
        activateBackupService(componentId);
        break;
      case 'fallback':
        // Switch to fallback component before failure
        preloadFallback(componentId);
        break;
      case 'degrade':
        // Reduce functionality preemptively
        enableDegradedMode(componentId);
        break;
    }
  }

  return prediction;
}

// Subscribe to prediction warnings
runtime.onEvent((event) => {
  if (event.type === 'prediction-warning' && event.prediction) {
    alertDashboard({
      component: event.componentId,
      riskLevel: event.prediction.probability,
      factors: event.prediction.factors,
    });
  }
});
```

### Hot-Patching Components

```typescript
import { getSelfHealingRuntime } from '@philjs/runtime/self-healing';

const runtime = getSelfHealingRuntime();

// Register a hot-patch for a component
runtime.registerHotPatch('broken-feature', () => {
  // This code runs when the component needs patching

  // Fix DOM issues
  const element = document.getElementById('feature-container');
  if (element) {
    element.innerHTML = '<p>Feature temporarily simplified</p>';
  }

  // Reset problematic state
  localStorage.removeItem('feature-cache');

  // Reinitialize with safe defaults
  window.featureConfig = { safeMode: true };
});

// The patch is automatically applied when errors occur
// and 'hot-patch' strategy is selected
```

### Using withSelfHealing Higher-Order Function

```typescript
import { withSelfHealing } from '@philjs/runtime/self-healing';

// Original component function
function UserProfile({ userId }: { userId: string }) {
  const user = fetchUserSync(userId); // May throw
  return (
    <div className="profile">
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}

// Fallback component
function ProfileFallback() {
  return (
    <div className="profile profile--fallback">
      <h1>User Profile</h1>
      <p>Unable to load profile. Please try again.</p>
    </div>
  );
}

// Wrap with self-healing
const SelfHealingUserProfile = withSelfHealing(
  UserProfile,
  'user-profile',
  ProfileFallback
);

// Use the wrapped component
function App() {
  return <SelfHealingUserProfile userId="123" />;
}
```

### Creating Error Boundaries

```typescript
import { createHealingErrorBoundary } from '@philjs/runtime/self-healing';

const boundary = createHealingErrorBoundary({
  fallback: () => (
    <div className="error-page">
      <h1>Something went wrong</h1>
      <button onClick={() => window.location.reload()}>
        Reload Page
      </button>
    </div>
  ),

  onError: (error, context) => {
    console.error('Boundary caught error:', {
      error: error.message,
      component: context.componentName,
      severity: context.severity,
      occurrences: context.occurrences,
    });

    // Send to error tracking service
    errorTracker.capture(error, context);
  },

  strategies: new Map([
    ['ChunkLoadError', 'retry'],   // Retry lazy-loaded chunks
    ['HydrationError', 'restore'], // Restore on hydration errors
  ]),
});

// Use the boundary to catch errors
async function handleComponentError(error: Error, componentId: string) {
  const result = await boundary.catch(error, componentId);

  if (!result.success) {
    return boundary.getFallback();
  }
}
```

### Subscribing to Healing Events

```typescript
import { initSelfHealing, HealingEvent } from '@philjs/runtime/self-healing';

const runtime = initSelfHealing();

// Subscribe to all healing events
const unsubscribe = runtime.onEvent((event: HealingEvent) => {
  switch (event.type) {
    case 'error-detected':
      console.log('Error detected:', event.error?.message);
      break;

    case 'healing-started':
      console.log(`Starting healing with ${event.strategy} strategy`);
      break;

    case 'healing-succeeded':
      console.log('Healing succeeded:', {
        strategy: event.result?.strategy,
        duration: event.result?.duration,
        retries: event.result?.retries,
      });
      break;

    case 'healing-failed':
      console.error('Healing failed:', event.error?.message);
      break;

    case 'checkpoint-created':
      console.log('Checkpoint created at', new Date(event.timestamp));
      break;

    case 'checkpoint-restored':
      console.log('State restored from checkpoint');
      break;

    case 'circuit-opened':
      console.warn('Circuit breaker opened for', event.componentId);
      break;

    case 'circuit-closed':
      console.log('Circuit breaker closed for', event.componentId);
      break;

    case 'hot-patch-applied':
      console.log('Hot-patch applied to', event.componentId);
      break;

    case 'prediction-warning':
      console.warn('Failure predicted:', event.prediction);
      break;
  }
});

// Cleanup when done
unsubscribe();
```

### Getting Runtime Statistics

```typescript
import { getSelfHealingRuntime } from '@philjs/runtime/self-healing';

const runtime = getSelfHealingRuntime();

function displayHealthDashboard() {
  const stats = runtime.getStats();

  console.log('Self-Healing Runtime Statistics:');
  console.log('================================');
  console.log(`Total Errors: ${stats.totalErrors}`);
  console.log(`Healed Errors: ${stats.healedErrors}`);
  console.log(`Checkpoints: ${stats.checkpointCount}`);
  console.log(`Hot-Patches: ${stats.hotPatchCount}`);

  console.log('\nCircuit Breaker States:');
  for (const [componentId, state] of stats.circuitBreakerStates) {
    console.log(`  ${componentId}: ${state.state} (${state.failures} failures)`);
  }
}
```

## API Reference

### Types

#### HealingStrategy

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

#### ErrorSeverity

```typescript
type ErrorSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
```

Severity levels are automatically determined based on error type:
- `critical`: SecurityError, DataCorruptionError
- `high`: TypeError, ReferenceError
- `medium`: NetworkError (default)
- `low`: ValidationError
- `info`: Informational errors

#### ErrorContext

```typescript
interface ErrorContext {
  /** Error that occurred */
  error: Error;
  /** Component that threw the error */
  componentId: string;
  /** Component name */
  componentName: string;
  /** Error severity */
  severity: ErrorSeverity;
  /** Error timestamp */
  timestamp: number;
  /** Stack trace */
  stack?: string;
  /** Component state at time of error */
  componentState?: unknown;
  /** Number of times this error has occurred */
  occurrences: number;
  /** Additional context */
  metadata?: Record<string, unknown>;
}
```

#### HealingResult

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

#### Checkpoint

```typescript
interface Checkpoint {
  /** Unique checkpoint ID */
  id: string;
  /** Timestamp */
  timestamp: number;
  /** Component states */
  states: Map<string, unknown>;
  /** DOM snapshot (lightweight) */
  domHash?: string;
  /** Router state */
  routerState?: unknown;
  /** Custom data */
  metadata?: Record<string, unknown>;
}
```

#### CircuitBreakerState

```typescript
interface CircuitBreakerState {
  /** Current state */
  state: 'closed' | 'open' | 'half-open';
  /** Failure count */
  failures: number;
  /** Last failure timestamp */
  lastFailure: number;
  /** When circuit opened */
  openedAt?: number;
  /** Success count in half-open state */
  halfOpenSuccesses: number;
}
```

#### FailurePrediction

```typescript
interface FailurePrediction {
  /** Probability of failure (0-1) */
  probability: number;
  /** Predicted time to failure (ms) */
  timeToFailure?: number;
  /** Suggested preemptive action */
  suggestedAction: HealingStrategy;
  /** Confidence score (0-1) */
  confidence: number;
  /** Factors contributing to prediction */
  factors: string[];
}
```

#### HealingEvent

```typescript
interface HealingEvent {
  type: HealingEventType;
  timestamp: number;
  componentId?: string;
  strategy?: HealingStrategy;
  error?: Error;
  result?: HealingResult;
  prediction?: FailurePrediction;
}

type HealingEventType =
  | 'error-detected'
  | 'healing-started'
  | 'healing-succeeded'
  | 'healing-failed'
  | 'checkpoint-created'
  | 'checkpoint-restored'
  | 'circuit-opened'
  | 'circuit-closed'
  | 'hot-patch-applied'
  | 'prediction-warning';
```

### Classes

#### SelfHealingRuntime

The main runtime class for self-healing functionality.

```typescript
class SelfHealingRuntime {
  constructor(config?: Partial<HealingConfig>);

  // Error handling
  handleError(error: Error, context: Partial<ErrorContext>): Promise<HealingResult>;

  // Fallback management
  registerFallback(componentId: string, fallback: () => unknown): void;

  // Hot-patching
  registerHotPatch(componentId: string, patch: Function): void;

  // State management
  saveState(componentId: string, state: unknown): void;

  // Checkpoints
  createCheckpoint(metadata?: Record<string, unknown>): Checkpoint;
  restoreCheckpoint(checkpointId?: string): Promise<boolean>;

  // Prediction
  predictFailure(componentId: string): FailurePrediction;

  // Events
  onEvent(handler: HealingEventHandler): () => void;

  // Statistics
  getStats(): RuntimeStats;

  // Cleanup
  destroy(): void;
}
```

### Functions

#### initSelfHealing

Initialize the global self-healing runtime.

```typescript
function initSelfHealing(config?: Partial<HealingConfig>): SelfHealingRuntime;
```

#### getSelfHealingRuntime

Get the global self-healing runtime instance.

```typescript
function getSelfHealingRuntime(): SelfHealingRuntime | null;
```

#### resetSelfHealing

Reset the global runtime (primarily for testing).

```typescript
function resetSelfHealing(): void;
```

#### useSelfHealing

Hook for component-level self-healing.

```typescript
function useSelfHealing(
  componentId: string,
  options?: {
    fallback?: () => unknown;
    onError?: (error: Error) => void;
    onHealed?: (result: HealingResult) => void;
  }
): {
  saveState: (state: unknown) => void;
  handleError: (error: Error) => Promise<HealingResult>;
  predict: () => FailurePrediction;
};
```

#### withSelfHealing

Higher-order function to wrap components with self-healing.

```typescript
function withSelfHealing<T extends (...args: any[]) => any>(
  component: T,
  componentId: string,
  fallback?: () => ReturnType<T>
): T;
```

#### createHealingErrorBoundary

Create a self-healing error boundary.

```typescript
function createHealingErrorBoundary(options?: {
  fallback?: () => unknown;
  onError?: (error: Error, context: ErrorContext) => void;
  strategies?: Map<string, HealingStrategy>;
}): {
  componentId: string;
  catch: (error: Error, componentId: string) => Promise<HealingResult>;
  getFallback: () => unknown;
};
```

## Best Practices

### 1. Use Appropriate Strategies for Error Types

Configure custom strategies based on your application's error patterns:

```typescript
initSelfHealing({
  strategies: new Map([
    // Network errors - use circuit breaker to prevent cascade
    ['NetworkError', 'circuit-break'],
    ['FetchError', 'circuit-break'],

    // State errors - restore from checkpoint
    ['StateCorruptionError', 'restore'],
    ['HydrationMismatchError', 'restore'],

    // Transient errors - retry with backoff
    ['TimeoutError', 'retry'],
    ['RateLimitError', 'retry'],

    // Component errors - use fallback
    ['RenderError', 'fallback'],
    ['ComponentError', 'fallback'],

    // Critical errors - isolate immediately
    ['SecurityError', 'isolate'],
  ]),
});
```

### 2. Always Provide Fallback Components

Register meaningful fallbacks for critical components:

```typescript
runtime.registerFallback('checkout-form', () => (
  <div className="checkout-fallback">
    <p>Checkout is temporarily unavailable.</p>
    <button onClick={() => saveCartAndRetry()}>
      Save cart and try again
    </button>
  </div>
));
```

### 3. Save State Regularly

Save component state frequently for better recovery:

```typescript
function FormComponent() {
  const { saveState } = useSelfHealing('form');

  const [formData, setFormData] = useState({});

  // Save state on every change
  useEffect(() => {
    saveState(formData);
  }, [formData, saveState]);
}
```

### 4. Monitor Predictions Proactively

Use failure predictions to prevent issues:

```typescript
function HealthMonitor() {
  const runtime = getSelfHealingRuntime();

  useEffect(() => {
    const interval = setInterval(() => {
      const prediction = runtime?.predictFailure('critical-service');

      if (prediction && prediction.probability > 0.6) {
        activateBackupService();
        notifyOpsTeam(prediction);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);
}
```

### 5. Use Event Handlers for Observability

Subscribe to events for monitoring and alerting:

```typescript
runtime.onEvent((event) => {
  // Send to observability platform
  opentelemetry.span('self-healing-event', {
    type: event.type,
    component: event.componentId,
    strategy: event.strategy,
    success: event.result?.success,
  });

  // Alert on critical events
  if (event.type === 'circuit-opened') {
    pagerduty.alert({
      severity: 'warning',
      summary: `Circuit breaker opened for ${event.componentId}`,
    });
  }
});
```

### 6. Clean Up Resources

Always destroy the runtime when unmounting:

```typescript
function App() {
  useEffect(() => {
    const runtime = initSelfHealing();

    return () => {
      runtime.destroy();
    };
  }, []);
}
```

### 7. Test Recovery Paths

Write tests for your recovery scenarios:

```typescript
import { initSelfHealing, resetSelfHealing } from '@philjs/runtime/self-healing';

describe('Self-Healing', () => {
  beforeEach(() => resetSelfHealing());
  afterEach(() => resetSelfHealing());

  it('should recover from network errors', async () => {
    const runtime = initSelfHealing();
    runtime.registerFallback('api-client', () => ({ cached: true }));

    const result = await runtime.handleError(
      new Error('NetworkError'),
      { componentId: 'api-client' }
    );

    expect(result.success).toBe(true);
  });
});
```

## Comparison with Error Boundaries

| Feature | Error Boundaries | Self-Healing Runtime |
|---------|-----------------|---------------------|
| Error Catching | Yes | Yes |
| Automatic Recovery | No | Yes |
| Multiple Strategies | No | 7 strategies |
| Circuit Breaker | No | Yes |
| State Checkpoints | No | Yes |
| Failure Prediction | No | Yes |
| Hot-Patching | No | Yes |
| Event System | Limited | Full event bus |
| Statistics | No | Built-in stats |

## Next Steps

- [Circuit Breaker Patterns](./circuit-breaker.md) - Deep dive into circuit breakers
- [Checkpoints and Recovery](./checkpoints.md) - State management and restoration
- [Predictive Analysis](./prediction.md) - ML-based failure prediction
- [Production Monitoring](./monitoring.md) - Observability integration
