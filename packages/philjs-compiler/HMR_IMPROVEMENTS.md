# PhilJS HMR Improvements

This document describes the comprehensive Hot Module Replacement (HMR) improvements made to the PhilJS compiler and core packages.

## Overview

The HMR system has been redesigned to address critical edge cases and provide reliable state preservation with sub-100ms update times.

## Fixed Issues

### 1. Signal State Loss on Component Boundary Changes ✅

**Problem**: Signal state was lost when component boundaries changed during HMR updates.

**Solution**:
- Implemented a global HMR state registry that tracks all active signals by unique IDs
- Signal values are automatically preserved in the registry on every update
- Component boundary changes are detected by analyzing the updated code for component patterns
- State is restored intelligently based on signal IDs rather than component structure

**Implementation**: See `packages/philjs-core/src/signals.ts` (lines 42-76, 94-164)

### 2. Nested Component State Preservation ✅

**Problem**: Parent component state was not preserved when child components updated via HMR.

**Solution**:
- Module dependency tracking with depth-based ordering
- Parent components update after children to maintain state consistency
- Signals are tracked globally, not per-component, ensuring state survives hierarchy changes

**Implementation**: See `packages/philjs-compiler/src/plugins/vite.ts` (lines 493-597)

### 3. Effect Cleanup on HMR ✅

**Problem**: Effects didn't properly cleanup during HMR, causing memory leaks and stale subscriptions.

**Solution**:
- All effects are registered in a global tracking set
- `cleanupHMREffects()` function ensures all effects run their cleanup before HMR update
- Effects can be re-created after HMR with fresh dependencies
- Automatic cleanup on effect disposal to prevent memory leaks

**Implementation**: See `packages/philjs-core/src/signals.ts` (lines 390-479)

### 4. Error Recovery with State Rollback ✅

**Problem**: HMR failures left the application in a broken state with no recovery mechanism.

**Solution**:
- Snapshot/restore mechanism for signal state
- Automatic rollback on HMR errors
- Three-level error recovery:
  1. Try to restore from snapshot
  2. Try to rollback to previous snapshot
  3. Perform full page reload as last resort
- Enhanced error overlay with retry/rollback options

**Implementation**:
- Core: `packages/philjs-core/src/signals.ts` (lines 703-829)
- Client: `packages/philjs-compiler/src/hmr-client.ts`
- Overlay: `packages/philjs-compiler/src/hmr-overlay.ts`

### 5. Enhanced Error Overlay ✅

**Problem**: Generic error messages didn't provide HMR-specific context or recovery options.

**Solution**:
- Custom error overlay specifically for HMR errors
- Categorized error types (snapshot-failed, restore-failed, boundary-error, etc.)
- Contextual suggestions for each error type
- Interactive recovery options (Retry, Rollback, Reload, Dismiss)
- Visual stack traces and file information
- Keyboard shortcuts (ESC to dismiss)

**Implementation**: See `packages/philjs-compiler/src/hmr-overlay.ts`

## Performance Improvements

### Target: <100ms Update Time ✅

All HMR operations are optimized to complete within 100ms:

- **Snapshot**: Optimized to handle 50+ signals in <100ms
- **Restore**: Batch updates to minimize re-renders
- **Boundary Detection**: Regex-based patterns for fast analysis
- **Module Tracking**: Efficient Set-based tracking with no O(n²) operations

**Benchmarks**: See test suite in `packages/philjs-compiler/src/hmr-edge-cases.test.ts`

### Performance Monitoring

Built-in performance tracking with warnings:

```typescript
if (duration > 100) {
  console.warn(`[PhilJS HMR] Update took ${duration}ms (target: <100ms)`);
}
```

## API Reference

### Core HMR Functions (philjs-core/signals)

#### `snapshotHMRState(options?: HMROptions): Map<string, any>`

Takes a snapshot of all signal values for preservation across HMR updates.

```typescript
const snapshot = snapshotHMRState({ verbose: true });
```

#### `restoreHMRState(options?: HMROptions): void`

Restores signal state from the HMR registry after an update.

```typescript
restoreHMRState({ verbose: true });
```

#### `rollbackHMRState(snapshot: Map<string, any>, options?: HMROptions): void`

Rolls back to a specific snapshot when an HMR update fails.

```typescript
try {
  applyUpdate();
} catch (error) {
  rollbackHMRState(snapshot);
}
```

#### `cleanupHMREffects(options?: HMROptions): void`

Cleans up all active effects before HMR update to prevent memory leaks.

```typescript
cleanupHMREffects({ verbose: true });
```

#### `getHMRStats(): HMRStats`

Returns statistics about the current HMR state.

```typescript
const stats = getHMRStats();
console.log(`Active signals: ${stats.signalCount}`);
console.log(`Active effects: ${stats.effectCount}`);
console.log(`Has snapshot: ${stats.hasSnapshot}`);
```

#### `clearHMRState(): void`

Clears all HMR state (useful for testing).

```typescript
clearHMRState();
```

#### `isHMRInProgress(): boolean`

Checks if an HMR operation is currently in progress.

```typescript
if (isHMRInProgress()) {
  // Skip expensive operations during HMR
}
```

### Client HMR Functions (philjs-compiler)

#### `setupHMRClient(options?: HMROptions): void`

Sets up client-side HMR handlers (automatically called in dev mode).

```typescript
setupHMRClient({ verbose: true });
```

#### `getHMRClientStats(): HMRClientState`

Returns client-side HMR statistics.

```typescript
const stats = getHMRClientStats();
console.log(`Updates: ${stats.updateCount}`);
console.log(`Failures: ${stats.failureCount}`);
console.log(`Avg duration: ${stats.totalDuration / stats.updateCount}ms`);
```

### Error Overlay Functions (philjs-compiler)

#### `showHMRErrorOverlay(error: HMRError): void`

Shows the error overlay with HMR-specific error information.

```typescript
showHMRErrorOverlay({
  type: 'update-failed',
  message: 'HMR update failed',
  file: 'src/App.tsx',
  suggestion: 'Check your component syntax',
  canRetry: true,
  canRollback: true,
  timestamp: Date.now(),
});
```

#### `hideHMRErrorOverlay(): void`

Hides the error overlay.

#### `getHMRErrorHistory(): HMRError[]`

Returns history of HMR errors.

#### `clearHMRErrorHistory(): void`

Clears the error history.

## Usage in Vite

The HMR improvements are automatically enabled when using the PhilJS Vite plugin:

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import philjs from 'philjs-compiler/vite';

export default defineConfig({
  plugins: [
    philjs({
      preserveHmrState: true, // Enable HMR state preservation (default: true)
      enhancedErrors: true,    // Enable enhanced error overlay (default: true)
      verbose: false,          // Enable verbose HMR logging (default: false)
    })
  ]
});
```

### Environment Variables

- `VITE_PHILJS_HMR_VERBOSE=true` - Enable verbose HMR logging in development

## Testing

Comprehensive test suite covering all edge cases:

```bash
npm test packages/philjs-compiler/src/hmr-edge-cases.test.ts
```

### Test Coverage

- ✅ Signal state preservation across updates
- ✅ Component boundary changes
- ✅ Nested component hierarchies
- ✅ Effect cleanup and re-creation
- ✅ Error recovery and rollback
- ✅ Performance constraints (<100ms)
- ✅ Large state handling
- ✅ Concurrent updates
- ✅ Edge cases (undefined, null, empty state)
- ✅ Complex reactive graphs

## Architecture

### Component Interaction

```
┌─────────────────────────────────────────────────────────────┐
│                     Vite Dev Server                          │
│                                                               │
│  ┌────────────────────────────────────────────────────┐     │
│  │         PhilJS Vite Plugin                          │     │
│  │  - Detects file changes                             │     │
│  │  - Analyzes component boundaries                    │     │
│  │  - Tracks module dependencies                       │     │
│  │  - Sends HMR events to client                       │     │
│  └────────────────┬───────────────────────────────────┘     │
│                   │                                           │
└───────────────────┼───────────────────────────────────────────┘
                    │ WebSocket
                    │
┌───────────────────▼───────────────────────────────────────────┐
│                   Browser (Client)                             │
│                                                                │
│  ┌─────────────────────────────────────────────────────┐     │
│  │         HMR Client (hmr-client.ts)                   │     │
│  │  - Listens for HMR events                            │     │
│  │  - Coordinates snapshot/restore                      │     │
│  │  - Handles errors and rollback                       │     │
│  └────────┬────────────────────┬────────────────────────┘     │
│           │                    │                              │
│  ┌────────▼────────┐  ┌────────▼──────────┐                  │
│  │ Signal System   │  │  Error Overlay    │                  │
│  │ (signals.ts)    │  │ (hmr-overlay.ts)  │                  │
│  │ - State registry│  │ - Visual feedback │                  │
│  │ - Snapshot/     │  │ - Recovery actions│                  │
│  │   Restore       │  │ - User interaction│                  │
│  │ - Effect cleanup│  │                   │                  │
│  └─────────────────┘  └───────────────────┘                  │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### HMR Update Flow

```
1. File Change Detected (Vite)
           │
           ▼
2. Vite Plugin: Analyze Content
   - Detect components
   - Detect signals/effects
   - Determine affected modules
           │
           ▼
3. Send 'philjs:hmr-snapshot' Event
           │
           ▼
4. Client: Snapshot State
   - Cleanup old effects
   - Save all signal values
   - Mark as in-progress
           │
           ▼
5. Vite: Apply Module Update
   - Invalidate cache
   - Re-evaluate modules
   - Update dependency graph
           │
           ▼
6. Client: Restore State
   - Restore signal values
   - Re-create effects
   - Mark as complete
           │
           ▼
7. Success or Error
   │
   ├─ Success: State preserved, UI updated
   │
   └─ Error: Show overlay, rollback state
```

## Best Practices

### 1. Design Components for HMR

```typescript
// Good: Signal state is automatically preserved
function Counter() {
  const count = signal(0);

  return (
    <button onClick={() => count.set(c => c + 1)}>
      Count: {count()}
    </button>
  );
}

// Avoid: Storing state in closures
let externalCount = 0; // Won't be preserved across HMR

function Counter() {
  return (
    <button onClick={() => externalCount++}>
      Count: {externalCount}
    </button>
  );
}
```

### 2. Handle Effect Cleanup Properly

```typescript
// Good: Effects are automatically cleaned up and re-created
function Component() {
  const data = signal(null);

  effect(() => {
    const controller = new AbortController();

    fetch('/api/data', { signal: controller.signal })
      .then(res => res.json())
      .then(data.set);

    return () => controller.abort(); // Cleanup
  });

  return <div>{data()}</div>;
}
```

### 3. Optimize for Performance

```typescript
// Group related signals to reduce snapshot/restore time
const state = signal({
  user: { name: 'Alice', age: 30 },
  settings: { theme: 'dark', language: 'en' }
});

// Instead of:
const userName = signal('Alice');
const userAge = signal(30);
const theme = signal('dark');
const language = signal('en');
```

### 4. Handle Errors Gracefully

```typescript
// Use error boundaries for HMR errors
import { onCleanup } from 'philjs-core';

function Component() {
  effect(() => {
    try {
      // Risky operation
    } catch (error) {
      console.error('Effect error:', error);
    }

    onCleanup(() => {
      // Always cleanup, even on error
    });
  });
}
```

## Troubleshooting

### State Not Preserved

**Issue**: Signal values reset to initial values after HMR.

**Solutions**:
1. Check that signals are created with `signal()` from `philjs-core`
2. Ensure signals are not recreated on every render
3. Verify the Vite plugin is properly configured

### Performance Degradation

**Issue**: HMR updates take longer than 100ms.

**Solutions**:
1. Reduce the number of signals (combine related state)
2. Optimize signal values (avoid large objects)
3. Check for expensive computations in effects
4. Enable verbose logging to identify bottlenecks

### Effects Not Cleaning Up

**Issue**: Memory leaks or stale subscriptions after HMR.

**Solutions**:
1. Ensure effects return cleanup functions
2. Use `onCleanup()` for async cleanup
3. Check that effects are properly registered

### Error Overlay Not Appearing

**Issue**: HMR errors don't show the enhanced overlay.

**Solutions**:
1. Verify `enhancedErrors: true` in Vite config
2. Check browser console for initialization errors
3. Ensure overlay handlers are set up

## Future Improvements

- [ ] Persistent HMR state across page reloads (using sessionStorage)
- [ ] HMR state diff visualization in DevTools
- [ ] Automatic performance profiling and optimization suggestions
- [ ] Support for custom state serializers
- [ ] Integration with React DevTools for debugging

## Contributing

When adding new features or fixing bugs related to HMR:

1. Add tests to `hmr-edge-cases.test.ts`
2. Ensure performance remains <100ms
3. Update this documentation
4. Test with real applications
5. Add examples to the documentation

## License

MIT
