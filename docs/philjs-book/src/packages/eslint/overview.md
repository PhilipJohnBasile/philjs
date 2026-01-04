# @philjs/eslint

ESLint rules and configuration for PhilJS applications with signal-specific linting and best practices.

## Installation

```bash
npm install @philjs/eslint eslint --save-dev
```

## Overview

`@philjs/eslint` provides ESLint rules for PhilJS:

- **Signal Rules**: Detect unused signals and improper usage
- **Effect Rules**: Ensure cleanup functions in effects
- **Performance Rules**: Identify expensive computations
- **Best Practices**: PhilJS-specific coding standards
- **TypeScript Support**: Full TypeScript integration

## Quick Start

```javascript
// eslint.config.js
import philjs from '@philjs/eslint';

export default [
  ...philjs.configs.recommended,
];
```

## Configuration Options

```javascript
import philjs from '@philjs/eslint';

export default [
  ...philjs.configs.recommended,
  {
    rules: {
      '@philjs/no-unused-signals': 'error',
      '@philjs/effect-cleanup-required': 'warn',
      '@philjs/prefer-memo-for-expensive': 'warn',
    },
  },
];
```

## Rules

### no-unused-signals

Detects signals that are created but never read:

```typescript
// Bad - signal created but never used
const count = createSignal(0); // Warning: Unused signal 'count'

// Good
const count = createSignal(0);
return <span>{count()}</span>;
```

### effect-cleanup-required

Ensures effects with subscriptions include cleanup:

```typescript
// Bad - no cleanup for interval
createEffect(() => {
  const id = setInterval(() => {}, 1000); // Warning: Effect needs cleanup
});

// Good
createEffect(() => {
  const id = setInterval(() => {}, 1000);
  return () => clearInterval(id);
});
```

### prefer-memo-for-expensive

Suggests memoization for expensive computations:

```typescript
// Warning - expensive in render
const result = items.filter(x => x.active).map(x => process(x));

// Good - memoized
const result = createMemo(() =>
  items.filter(x => x.active).map(x => process(x))
);
```

## Preset Configurations

```javascript
// Recommended (balanced)
philjs.configs.recommended

// Strict (all rules as errors)
philjs.configs.strict

// Performance (focus on optimization)
philjs.configs.performance
```

## See Also

- [@philjs/testing](../testing/overview.md) - Testing utilities
- [@philjs/core](../core/overview.md) - Core framework
