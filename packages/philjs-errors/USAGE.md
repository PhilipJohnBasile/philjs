# PhilJS Enhanced Error System - Usage Guide

This guide shows how to use the enhanced error system in your PhilJS application.

## Installation

The enhanced error system is part of the `philjs-errors` package:

```bash
npm install philjs-errors
```

## Quick Start

### 1. Enable the Error Overlay (Development)

Add this to your app's entry point:

```typescript
import { initErrorOverlay } from 'philjs-errors/src/index-enhanced';

if (process.env.NODE_ENV === 'development') {
  initErrorOverlay();
}
```

Now when errors occur in development, you'll see a beautiful overlay with:
- Error code and description
- Actionable suggestions with code examples
- Links to documentation
- Filtered stack traces showing only your code

### 2. Set Up Error Tracking (Production)

```typescript
import {
  initErrorTracking,
  createSentryTracker,
} from 'philjs-errors';

if (process.env.NODE_ENV === 'production') {
  initErrorTracking(createSentryTracker(), {
    dsn: 'your-sentry-dsn',
    environment: 'production',
    sampleRate: 1.0,
  });
}
```

### 3. Use Error Boundaries

Wrap your app in error boundaries to gracefully handle runtime errors:

```typescript
import { ErrorBoundary } from 'philjs-core';

function App() {
  return (
    <ErrorBoundary
      fallback={(error, retry) => (
        <div className="error-container">
          <h1>Oops! Something went wrong</h1>
          <p>{error.message}</p>
          <button onClick={retry}>Try Again</button>
        </div>
      )}
    >
      <YourApp />
    </ErrorBoundary>
  );
}
```

## Specific Error Types

### Signal Errors

The system automatically detects common signal errors:

```typescript
import { signal, batch } from 'philjs-core';

// ❌ Bad: Will throw PHIL-001
const count = signal(0);
count.set(count() + 1);

// ✅ Good: Use peek() or updater function
count.set(count.peek() + 1);
// or
count.set(prev => prev + 1);

// ❌ Bad: Will warn about PHIL-003
firstName.set('John');
lastName.set('Doe');
age.set(30);

// ✅ Good: Batch updates
batch(() => {
  firstName.set('John');
  lastName.set('Doe');
  age.set(30);
});
```

### SSR/Hydration Errors

Guard against hydration mismatches:

```typescript
import { guardBrowserAPI, hydrationSafe } from 'philjs-errors/src/index-enhanced';

// ❌ Bad: Crashes on server
const width = window.innerWidth;

// ✅ Good: Guarded access
const width = guardBrowserAPI('window', () => window.innerWidth, 0);

// ✅ Good: Hydration-safe value
const timestamp = hydrationSafe(
  props.serverTimestamp,
  () => new Date().toISOString()
);
```

### Router Errors

Validate routes and navigation:

```typescript
import {
  registerRoute,
  validateRoutePattern,
  buildPath,
} from 'philjs-errors/src/index-enhanced';

// Register routes for 404 detection
registerRoute('/users/:id');
registerRoute('/posts/:slug');
registerRoute('*'); // Catch-all

// Validate route patterns
const validation = validateRoutePattern('/users/:id');
if (!validation.isValid) {
  console.error('Invalid route:', validation.errors);
}

// Build paths safely
const userPath = buildPath('/users/:id', { id: '123' }); // '/users/123'

// This will throw PHIL-201 (missing parameter)
// buildPath('/users/:id', {}); // ❌ Missing 'id'
```

### Compiler Errors

Enhance build-time errors:

```typescript
import {
  enhanceCompilerError,
  formatCompilerError,
} from 'philjs-errors/src/index-enhanced';

try {
  // Compile code
} catch (error) {
  const enhanced = enhanceCompilerError(error, {
    code: sourceCode,
    filePath: file.path,
    line: error.line,
    column: error.column,
  });

  console.error(formatCompilerError(enhanced, sourceCode));
}
```

## Error Codes Reference

All PhilJS errors have codes in the format `PHIL-XXX`:

### Signal Errors (PHIL-001 to PHIL-099)
- **PHIL-001:** Signal Read During Update
- **PHIL-002:** Circular Signal Dependency
- **PHIL-003:** Signal Updated Outside Batch
- **PHIL-004:** Effect Missing Cleanup
- **PHIL-005:** Memo Returning Undefined

### SSR/Hydration Errors (PHIL-100 to PHIL-199)
- **PHIL-100:** Hydration Mismatch
- **PHIL-101:** Browser API Called During SSR
- **PHIL-102:** Missing SSR Data

### Router Errors (PHIL-200 to PHIL-299)
- **PHIL-200:** Invalid Route Pattern
- **PHIL-201:** Missing Route Parameter
- **PHIL-202:** Route Not Found

### Compiler Errors (PHIL-300 to PHIL-399)
- **PHIL-300:** Invalid JSX Syntax
- **PHIL-301:** Unsupported Feature
- **PHIL-302:** Optimization Warning

### Component Errors (PHIL-400 to PHIL-499)
- **PHIL-400:** Component Render Error
- **PHIL-401:** Invalid Props

### Runtime Errors (PHIL-500 to PHIL-599)
- **PHIL-500:** Null Reference Error
- **PHIL-501:** Async Operation Error

For detailed explanations and solutions, see [Error Codes Documentation](../../docs/troubleshooting/error-codes.md).

## Advanced Usage

### Manual Error Creation

```typescript
import { createPhilJSError } from 'philjs-errors/src/index-enhanced';

const error = createPhilJSError('PHIL-001', {
  signalName: 'count',
});

throw error;
```

### Enhanced Stack Traces

```typescript
import { enhanceErrorStack, formatStackTrace } from 'philjs-errors/src/index-enhanced';

try {
  // Your code
} catch (error) {
  // Enhance stack trace to hide framework internals
  enhanceErrorStack(error);

  // Format for display
  const formatted = formatStackTrace(error, {
    showFramework: false,
    showNodeModules: false,
    highlightUserCode: true,
  });

  console.log(formatted);
}
```

### Error Statistics

```typescript
import {
  getSignalErrorStats,
  getSSRErrorStats,
  getRouterErrorStats,
  getCompilerErrorStats,
} from 'philjs-errors/src/index-enhanced';

// Get error statistics for monitoring
console.log('Signal errors:', getSignalErrorStats());
console.log('SSR errors:', getSSRErrorStats());
console.log('Router errors:', getRouterErrorStats());
console.log('Compiler warnings:', getCompilerErrorStats());
```

### Custom Error Handling

```typescript
import { captureError } from 'philjs-errors';

try {
  await riskyOperation();
} catch (error) {
  captureError(error, {
    component: 'UserProfile',
    route: '/users/123',
    extra: {
      userId: '123',
      operation: 'updateProfile',
    },
    tags: {
      feature: 'user-management',
      priority: 'high',
    },
  });

  // Re-throw or handle
  throw error;
}
```

## Integration with Build Tools

### Vite

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import philjs from 'philjs-compiler/plugins/vite';

export default defineConfig({
  plugins: [
    philjs({
      enhancedErrors: true, // Enable enhanced compiler errors
    }),
  ],
});
```

### Webpack

```javascript
// webpack.config.js
const PhilJSPlugin = require('philjs-compiler/plugins/webpack');

module.exports = {
  plugins: [
    new PhilJSPlugin({
      enhancedErrors: true,
    }),
  ],
};
```

## Best Practices

### 1. Always Use Error Boundaries

Wrap major sections of your app in error boundaries:

```typescript
<ErrorBoundary name="MainLayout">
  <Header />
  <ErrorBoundary name="Content">
    <Routes />
  </ErrorBoundary>
  <Footer />
</ErrorBoundary>
```

### 2. Add Context to Errors

Provide meaningful context when capturing errors:

```typescript
captureError(error, {
  component: componentName,
  extra: {
    userId: user?.id,
    currentRoute: router.currentRoute(),
  },
});
```

### 3. Use Type Safety

Leverage TypeScript for compile-time error prevention:

```typescript
interface UserProps {
  id: string;
  name: string;
  email?: string;
}

function UserCard({ id, name, email }: UserProps) {
  // TypeScript ensures you handle all cases
  return <div>...</div>;
}
```

### 4. Monitor Error Rates

Set up alerts for unusual error rates:

```typescript
const stats = getSignalErrorStats();

if (stats.effectsWithoutCleanup > 10) {
  console.warn('High number of effects without cleanup - potential memory leak');
}
```

### 5. Test Error Scenarios

Write tests for error cases:

```typescript
import { expect, test } from 'vitest';
import { signal } from 'philjs-core';

test('should throw PHIL-001 when reading signal during update', () => {
  const count = signal(0);

  expect(() => {
    count.set(count() + 1);
  }).toThrow(/PHIL-001/);
});
```

## Troubleshooting

### Error overlay not showing?

Make sure you've initialized it in development mode:

```typescript
if (process.env.NODE_ENV === 'development') {
  initErrorOverlay();
}
```

### Stack traces show framework code?

Use `enhanceErrorStack` to filter them out:

```typescript
import { enhanceErrorStack } from 'philjs-errors/src/index-enhanced';

enhanceErrorStack(error);
```

### Not seeing error codes?

Make sure you're using PhilJS error functions:

```typescript
import { createPhilJSError } from 'philjs-errors/src/index-enhanced';

// This has error codes
throw createPhilJSError('PHIL-001', context);

// This doesn't
throw new Error('Something went wrong');
```

## Learn More

- [Error Codes Reference](../../docs/troubleshooting/error-codes.md)
- [Error Boundary API](../../docs/api-reference/core.md#errorboundary)
- [Signal Best Practices](../../docs/best-practices/state-management.md)
- [SSR Guide](../../docs/advanced/ssr.md)
