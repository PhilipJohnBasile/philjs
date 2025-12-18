# eslint-plugin-philjs

ESLint plugin for PhilJS - Detect anti-patterns and optimize signal usage.

## Installation

```bash
pnpm add -D eslint-plugin-philjs
```

## Usage

Add `philjs` to your ESLint configuration:

### Flat Config (ESLint 9+)

```javascript
import philjs from 'eslint-plugin-philjs';

export default [
  {
    plugins: {
      philjs
    },
    rules: {
      'philjs/no-unused-signals': 'error',
      'philjs/effect-cleanup-required': 'warn',
      'philjs/prefer-memo-for-expensive': 'warn'
    }
  }
];
```

### Legacy Config (.eslintrc)

```json
{
  "plugins": ["philjs"],
  "rules": {
    "philjs/no-unused-signals": "error",
    "philjs/effect-cleanup-required": "warn",
    "philjs/prefer-memo-for-expensive": "warn"
  }
}
```

### Recommended Configuration

Use the recommended preset for optimal PhilJS development:

```javascript
import philjs from 'eslint-plugin-philjs';

export default [
  philjs.configs.recommended
];
```

## Rules

### `no-unused-signals`

Detects signals that are created but never used. Helps prevent memory leaks and unnecessary reactivity.

```typescript
// Bad
const count = signal(0); // Signal created but never read

// Good
const count = signal(0);
console.log(count());
```

### `effect-cleanup-required`

Warns when effects might need cleanup functions to prevent memory leaks.

```typescript
// Bad
effect(() => {
  const interval = setInterval(() => {}, 1000);
  // Missing cleanup!
});

// Good
effect(() => {
  const interval = setInterval(() => {}, 1000);
  return () => clearInterval(interval);
});
```

### `prefer-memo-for-expensive`

Suggests using `memo()` for expensive computations that derive from signals.

```typescript
// Bad
const doubled = () => expensiveCalculation(count());

// Good
const doubled = memo(() => expensiveCalculation(count()));
```

## API

### Rules

- `no-unused-signals` - Detect unused signal declarations
- `effect-cleanup-required` - Ensure effects cleanup side effects
- `prefer-memo-for-expensive` - Recommend memoization for expensive computations

### Configurations

- `configs.recommended` - Recommended rule configuration for PhilJS projects

## Configuration Options

Each rule can be configured with severity levels:
- `'off'` or `0` - Disable the rule
- `'warn'` or `1` - Warning (doesn't affect exit code)
- `'error'` or `2` - Error (exits with error code)

## Examples

### Complete Setup

```javascript
// eslint.config.js
import philjs from 'eslint-plugin-philjs';
import typescriptParser from '@typescript-eslint/parser';

export default [
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
      }
    },
    plugins: {
      philjs
    },
    rules: {
      ...philjs.configs.recommended.rules,
      // Override specific rules
      'philjs/prefer-memo-for-expensive': 'off'
    }
  }
];
```

## Documentation

For more information about PhilJS best practices and patterns, see the [PhilJS documentation](../../docs).

## License

MIT
