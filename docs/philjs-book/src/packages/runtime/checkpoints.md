# Checkpoints and State Recovery

The `@philjs/runtime` package provides a robust checkpointing system that automatically saves application state snapshots for point-in-time recovery. This enables the runtime to restore components to a known good state when errors occur.

## Overview

Checkpoints capture:
- Component states across the application
- Metadata about when and why the checkpoint was created
- Optional DOM hashes and router state

```typescript
interface Checkpoint {
  /** Unique checkpoint ID (e.g., 'cp_1704307200000_abc123') */
  id: string;
  /** Timestamp when checkpoint was created */
  timestamp: number;
  /** Component states at checkpoint time */
  states: Map<string, unknown>;
  /** Lightweight DOM snapshot hash */
  domHash?: string;
  /** Router state at checkpoint time */
  routerState?: unknown;
  /** Custom metadata */
  metadata?: Record<string, unknown>;
}
```

## Enabling Checkpoints

Checkpointing is enabled by default. Configure the behavior in the runtime initialization:

```typescript
import { initSelfHealing } from '@philjs/runtime/self-healing';

const runtime = initSelfHealing({
  enableCheckpoints: true,        // Enable checkpointing (default: true)
  checkpointInterval: 30000,      // Auto-checkpoint every 30 seconds (default)
});
```

### Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| `enableCheckpoints` | `true` | Enable automatic checkpointing |
| `checkpointInterval` | `30000` | Milliseconds between automatic checkpoints |

## Saving Component State

Before checkpoints can capture component state, you must explicitly save state using `saveState`:

```typescript
import { getSelfHealingRuntime, useSelfHealing } from '@philjs/runtime/self-healing';

// Using the runtime directly
const runtime = getSelfHealingRuntime();

function updateUserData(userData: UserData) {
  // Save state for potential recovery
  runtime?.saveState('user-profile', {
    user: userData,
    lastUpdated: Date.now(),
  });
}

// Using the useSelfHealing hook
function ShoppingCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const { saveState } = useSelfHealing('shopping-cart');

  // Save state whenever cart changes
  useEffect(() => {
    saveState({
      items,
      total: calculateTotal(items),
      savedAt: Date.now(),
    });
  }, [items, saveState]);

  return <CartDisplay items={items} />;
}
```

### State Cloning

The runtime uses `structuredClone` to create a deep copy of the state, ensuring:
- The original state is not affected by checkpoint operations
- State is isolated from subsequent mutations
- Complex objects (including nested structures) are properly copied

```typescript
// Internal implementation
saveState(componentId: string, state: unknown): void {
  this.componentStates.set(componentId, structuredClone(state));
}
```

**Note**: `structuredClone` cannot clone functions, DOM nodes, or certain browser-specific objects. Store only serializable data.

## Creating Checkpoints

### Automatic Checkpoints

When `enableCheckpoints` is true, the runtime automatically creates checkpoints at the configured interval:

```typescript
const runtime = initSelfHealing({
  enableCheckpoints: true,
  checkpointInterval: 15000, // Every 15 seconds
});

// Automatic checkpoints are created with { auto: true } metadata
// Only if there are component states to save
```

### Manual Checkpoints

Create checkpoints manually at important application points:

```typescript
import { getSelfHealingRuntime } from '@philjs/runtime/self-healing';

const runtime = getSelfHealingRuntime();

// Create a checkpoint before a critical operation
const checkpoint = runtime?.createCheckpoint({
  reason: 'before-checkout',
  transactionId: 'txn_123',
});

console.log('Created checkpoint:', checkpoint?.id);
// Output: Created checkpoint: cp_1704307200000_abc123
```

### Method Signature

```typescript
createCheckpoint(metadata?: Record<string, unknown>): Checkpoint
```

### Checkpoint ID Format

Checkpoint IDs follow the pattern: `cp_<timestamp>_<random>`

- `cp_`: Fixed prefix
- `<timestamp>`: Unix timestamp in milliseconds
- `<random>`: 7-character random string for uniqueness

Example: `cp_1704307200000_x7k9m2p`

### Checkpoint Retention

The runtime keeps only the **last 10 checkpoints** to manage memory:

```typescript
// Internal logic
createCheckpoint(metadata?: Record<string, unknown>): Checkpoint {
  const checkpoint: Checkpoint = {
    id: `cp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    timestamp: Date.now(),
    states: new Map(this.componentStates),
    ...(metadata !== undefined && { metadata }),
  };

  this.checkpoints.push(checkpoint);

  // Keep only last 10 checkpoints
  if (this.checkpoints.length > 10) {
    this.checkpoints.shift();
  }

  return checkpoint;
}
```

## Restoring from Checkpoints

### Restore Latest Checkpoint

Restore the most recent checkpoint:

```typescript
const runtime = getSelfHealingRuntime();

async function recoverFromError() {
  const restored = await runtime?.restoreCheckpoint();

  if (restored) {
    console.log('Successfully restored from latest checkpoint');
    // Re-render affected components with restored state
    forceRerender();
  } else {
    console.error('No checkpoint available for restoration');
  }
}
```

### Restore Specific Checkpoint

Restore a specific checkpoint by ID:

```typescript
async function restoreToKnownGoodState(checkpointId: string) {
  const restored = await runtime?.restoreCheckpoint(checkpointId);

  if (restored) {
    console.log(`Restored checkpoint: ${checkpointId}`);
  } else {
    console.error(`Checkpoint not found: ${checkpointId}`);
  }
}

// Usage
await restoreToKnownGoodState('cp_1704307200000_x7k9m2p');
```

### Method Signature

```typescript
restoreCheckpoint(checkpointId?: string): Promise<boolean>
```

**Returns**: `true` if restoration succeeded, `false` if checkpoint not found

### Restoration Process

When a checkpoint is restored:

1. Find the checkpoint (by ID or use the latest)
2. For each saved component state, update the runtime's state store
3. States are deep-cloned to prevent mutation
4. Emit `checkpoint-restored` event

```typescript
// Internal implementation
async restoreCheckpoint(checkpointId?: string): Promise<boolean> {
  const checkpoint = checkpointId
    ? this.checkpoints.find(cp => cp.id === checkpointId)
    : this.checkpoints[this.checkpoints.length - 1];

  if (!checkpoint) {
    return false;
  }

  // Restore component states
  for (const [componentId, state] of checkpoint.states) {
    this.componentStates.set(componentId, structuredClone(state));
  }

  this.emit({ type: 'checkpoint-restored', timestamp: Date.now() });

  return true;
}
```

## The Restore Healing Strategy

The `restore` strategy automatically restores from the latest checkpoint when state-related errors occur:

```typescript
const runtime = initSelfHealing({
  enableCheckpoints: true,
  strategies: new Map([
    ['StateError', 'restore'],
    ['StateCorruptionError', 'restore'],
    ['HydrationMismatchError', 'restore'],
  ]),
});
```

### How It Works

1. Error triggers the `restore` strategy
2. Runtime calls `restoreCheckpoint()` internally
3. Component states are restored from the latest checkpoint
4. `HealingResult` indicates success or failure

```typescript
// Result when restoration succeeds
{
  success: true,
  strategy: 'restore',
  duration: 15,
  retries: 0
}

// Result when no checkpoint available
{
  success: false,
  strategy: 'restore',
  duration: 2,
  retries: 0
}
```

## Checkpoint Events

Monitor checkpoint operations through the event system:

```typescript
runtime.onEvent((event) => {
  switch (event.type) {
    case 'checkpoint-created':
      console.log(`Checkpoint created at ${new Date(event.timestamp)}`);
      // Send to monitoring
      metrics.increment('checkpoint.created');
      break;

    case 'checkpoint-restored':
      console.log(`Checkpoint restored at ${new Date(event.timestamp)}`);
      // Alert operations team
      alertOps('State restored from checkpoint');
      metrics.increment('checkpoint.restored');
      break;
  }
});
```

## State Management Patterns

### Pattern 1: Save on Every Change

Best for: Form data, user preferences, critical application state

```typescript
function UserPreferences() {
  const [preferences, setPreferences] = useState(defaultPrefs);
  const { saveState } = useSelfHealing('user-preferences');

  const updatePreference = (key: string, value: unknown) => {
    setPreferences(prev => {
      const updated = { ...prev, [key]: value };
      saveState(updated); // Save immediately
      return updated;
    });
  };

  return <PreferenceEditor preferences={preferences} onChange={updatePreference} />;
}
```

### Pattern 2: Save at Intervals

Best for: Large, frequently changing data where saving on every change is expensive

```typescript
function DocumentEditor() {
  const [content, setContent] = useState('');
  const { saveState } = useSelfHealing('document-editor');

  // Debounced save
  useEffect(() => {
    const timeout = setTimeout(() => {
      saveState({ content, savedAt: Date.now() });
    }, 1000);

    return () => clearTimeout(timeout);
  }, [content, saveState]);

  return <Editor content={content} onChange={setContent} />;
}
```

### Pattern 3: Save at Critical Points

Best for: Multi-step workflows, checkout flows, wizards

```typescript
function CheckoutWizard() {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({});
  const runtime = getSelfHealingRuntime();

  const nextStep = () => {
    // Save checkpoint at each step transition
    runtime?.saveState('checkout-wizard', { step, formData });
    runtime?.createCheckpoint({
      reason: `checkout-step-${step}`,
      userId: currentUser.id,
    });

    setStep(s => s + 1);
  };

  const handleError = async (error: Error) => {
    const result = await runtime?.handleError(error, {
      componentId: 'checkout-wizard',
    });

    if (result?.strategy === 'restore') {
      // Refresh UI with restored state
      const restoredState = runtime?.componentStates.get('checkout-wizard');
      if (restoredState) {
        setStep(restoredState.step);
        setFormData(restoredState.formData);
      }
    }
  };

  return (
    <WizardSteps
      step={step}
      data={formData}
      onNext={nextStep}
      onError={handleError}
    />
  );
}
```

### Pattern 4: Selective State Saving

Best for: Large applications where not all state needs checkpoint protection

```typescript
function Dashboard() {
  const { saveState } = useSelfHealing('dashboard');

  // Only save critical state, not derived or cached data
  const saveCriticalState = () => {
    saveState({
      // Critical state that must survive recovery
      userSettings: settings,
      activeFilters: filters,
      selectedItems: selectedIds,

      // Don't include:
      // - Cached API responses (can be refetched)
      // - Computed values (can be recalculated)
      // - UI-only state (animations, hover states)
    });
  };

  useEffect(() => {
    saveCriticalState();
  }, [settings, filters, selectedIds]);
}
```

## Getting Checkpoint Information

### Current Checkpoint Count

```typescript
const stats = runtime.getStats();
console.log(`Active checkpoints: ${stats.checkpointCount}`);
```

### Listing All Checkpoints

The checkpoint array is internal, but you can track them via events:

```typescript
const checkpointHistory: Checkpoint[] = [];

runtime.onEvent((event) => {
  if (event.type === 'checkpoint-created') {
    // You would need to track checkpoints yourself
    // since there's no public API to list them
    checkpointHistory.push({
      id: `tracking-${Date.now()}`,
      timestamp: event.timestamp,
      states: new Map(),
    });
  }
});
```

## Best Practices

### 1. Save Serializable State Only

```typescript
// Good - serializable data
saveState({
  items: [{ id: 1, name: 'Widget' }],
  total: 99.99,
  userId: 'user_123',
});

// Bad - non-serializable data
saveState({
  items: items,
  onClick: handleClick,  // Functions can't be cloned
  ref: domRef,           // DOM refs can't be cloned
  socket: wsConnection,  // WebSocket can't be cloned
});
```

### 2. Create Checkpoints Before Risky Operations

```typescript
async function performRiskyOperation() {
  // Create checkpoint before risky operation
  const checkpoint = runtime?.createCheckpoint({
    reason: 'pre-risky-operation',
    operation: 'bulk-update',
  });

  try {
    await bulkUpdate(items);
  } catch (error) {
    // Restore if operation fails
    await runtime?.restoreCheckpoint(checkpoint?.id);
    throw error;
  }
}
```

### 3. Use Meaningful Metadata

```typescript
runtime?.createCheckpoint({
  reason: 'user-initiated-save',
  userId: currentUser.id,
  route: window.location.pathname,
  sessionId: sessionStorage.getItem('sessionId'),
  version: APP_VERSION,
});
```

### 4. Monitor Checkpoint Storage

```typescript
runtime.onEvent((event) => {
  if (event.type === 'checkpoint-created') {
    const stats = runtime.getStats();

    if (stats.checkpointCount >= 8) {
      console.warn('Approaching checkpoint limit (10)');
    }
  }
});
```

### 5. Test Recovery Paths

```typescript
import { initSelfHealing, resetSelfHealing } from '@philjs/runtime/self-healing';

describe('Checkpoint Recovery', () => {
  beforeEach(() => resetSelfHealing());
  afterEach(() => resetSelfHealing());

  it('should restore state from checkpoint', async () => {
    const runtime = initSelfHealing({ enableCheckpoints: true });

    // Save initial state
    runtime.saveState('test-component', { value: 'original' });
    runtime.createCheckpoint();

    // Modify state
    runtime.saveState('test-component', { value: 'modified' });

    // Restore checkpoint
    const restored = await runtime.restoreCheckpoint();
    expect(restored).toBe(true);

    // Verify restored state
    const state = runtime['componentStates'].get('test-component');
    expect(state).toEqual({ value: 'original' });
  });

  it('should handle missing checkpoint gracefully', async () => {
    const runtime = initSelfHealing({ enableCheckpoints: true });

    const restored = await runtime.restoreCheckpoint('nonexistent-id');
    expect(restored).toBe(false);
  });
});
```

## Limitations

1. **Memory Usage**: Checkpoints store full state copies; large states consume memory
2. **10 Checkpoint Limit**: Only the most recent 10 checkpoints are retained
3. **No Persistence**: Checkpoints are lost on page reload (in-memory only)
4. **Serializable Data Only**: Cannot checkpoint functions, DOM nodes, or non-cloneable objects
5. **Manual State Tracking**: Components must explicitly call `saveState`

## Next Steps

- [Self-Healing Features](./self-healing.md) - Healing strategies and error handling
- [Failure Prediction](./prediction.md) - ML-based failure prediction
- [Overview](./overview.md) - Complete package overview
