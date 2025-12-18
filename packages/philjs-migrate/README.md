# philjs-migrate

Migration codemods to convert React, Vue, and Svelte applications to PhilJS.

## Installation

```bash
pnpm add -D philjs-migrate
```

Or use directly with npx:

```bash
npx philjs-migrate
```

## Usage

### Command Line

Migrate your entire project:

```bash
philjs-migrate --from react --source ./src --output ./migrated
```

Analyze before migrating:

```bash
philjs-migrate --from vue --source ./src --analyze-only
```

### Supported Frameworks

- **React** - Convert React components to PhilJS
- **Vue** - Transform Vue 3 components to PhilJS
- **Svelte** - Migrate Svelte components to PhilJS

## CLI Options

```
Options:
  --from <framework>     Source framework (react, vue, svelte)
  --source <dir>         Source directory to migrate
  --output <dir>         Output directory (default: source_philjs)
  --analyze-only         Analyze without transforming files
  --dry-run              Preview changes without writing files
  --report <file>        Generate migration report JSON file
  --help                 Display help information
```

## Examples

### Migrating from React

```bash
# Basic migration
philjs-migrate --from react --source ./src

# With analysis report
philjs-migrate --from react --source ./src --report migration-report.json

# Dry run to preview changes
philjs-migrate --from react --source ./src --dry-run
```

**Before (React):**
```tsx
import { useState, useEffect } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    console.log('Count changed:', count);
  }, [count]);

  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  );
}
```

**After (PhilJS):**
```tsx
import { signal, effect } from 'philjs-core';

function Counter() {
  const count = signal(0);

  effect(() => {
    console.log('Count changed:', count());
  });

  return (
    <button onClick={() => count.set(c => c + 1)}>
      Count: {count()}
    </button>
  );
}
```

### Migrating from Vue

```bash
philjs-migrate --from vue --source ./src/components
```

**Before (Vue):**
```vue
<script setup>
import { ref, computed } from 'vue';

const count = ref(0);
const doubled = computed(() => count.value * 2);

function increment() {
  count.value++;
}
</script>

<template>
  <button @click="increment">
    Count: {{ count }} (Doubled: {{ doubled }})
  </button>
</template>
```

**After (PhilJS):**
```tsx
import { signal, memo } from 'philjs-core';

function Counter() {
  const count = signal(0);
  const doubled = memo(() => count() * 2);

  const increment = () => count.set(c => c + 1);

  return (
    <button onClick={increment}>
      Count: {count()} (Doubled: {doubled()})
    </button>
  );
}
```

### Migrating from Svelte

```bash
philjs-migrate --from svelte --source ./src
```

**Before (Svelte):**
```svelte
<script>
  let count = 0;
  $: doubled = count * 2;

  function increment() {
    count += 1;
  }
</script>

<button on:click={increment}>
  Count: {count} (Doubled: {doubled})
</button>
```

**After (PhilJS):**
```tsx
import { signal, memo } from 'philjs-core';

function Counter() {
  const count = signal(0);
  const doubled = memo(() => count() * 2);

  const increment = () => count.set(c => c + 1);

  return (
    <button onClick={increment}>
      Count: {count()} (Doubled: {doubled()})
    </button>
  );
}
```

## Programmatic API

Use the migration tools programmatically in Node.js:

```typescript
import { migrate, analyzeProject, generateReport } from 'philjs-migrate';

// Analyze a project
const analysis = await analyzeProject({
  framework: 'react',
  source: './src'
});

console.log('Components to migrate:', analysis.componentCount);
console.log('Estimated complexity:', analysis.complexity);

// Perform migration
const result = await migrate({
  framework: 'react',
  source: './src',
  output: './migrated',
  dryRun: false
});

// Generate detailed report
const report = generateReport(result);
console.log('Migration complete:', report.summary);
```

### Framework-Specific Transforms

```typescript
import { ReactTransform } from 'philjs-migrate/react';
import { VueTransform } from 'philjs-migrate/vue';
import { SvelteTransform } from 'philjs-migrate/svelte';

// Use specific transformer
const reactTransform = new ReactTransform();
const code = await reactTransform.transform(sourceCode);
```

## API

### Functions

- `migrate(options)` - Migrate project from another framework
- `analyzeProject(options)` - Analyze project before migration
- `generateReport(result)` - Generate detailed migration report

### Transforms

- `ReactTransform` - React to PhilJS transformation
- `VueTransform` - Vue to PhilJS transformation
- `SvelteTransform` - Svelte to PhilJS transformation

### Options

```typescript
interface MigrationOptions {
  framework: 'react' | 'vue' | 'svelte';
  source: string;
  output?: string;
  dryRun?: boolean;
  analyze?: boolean;
}
```

## Migration Patterns

### State Management

| Framework | Before | PhilJS |
|-----------|--------|--------|
| React | `useState()` | `signal()` |
| Vue | `ref()` | `signal()` |
| Svelte | `let x = ...` | `signal()` |

### Computed Values

| Framework | Before | PhilJS |
|-----------|--------|--------|
| React | `useMemo()` | `memo()` |
| Vue | `computed()` | `memo()` |
| Svelte | `$: x = ...` | `memo()` |

### Side Effects

| Framework | Before | PhilJS |
|-----------|--------|--------|
| React | `useEffect()` | `effect()` |
| Vue | `watch()` / `watchEffect()` | `effect()` |
| Svelte | `$: { ... }` | `effect()` |

## Limitations

- Manual review recommended for complex state management patterns
- Custom hooks/composables may need manual adaptation
- Context/provide-inject patterns require manual migration
- Third-party library integrations need review

## Post-Migration Steps

1. Review generated code for accuracy
2. Update dependencies in package.json
3. Install PhilJS packages
4. Run tests and fix any issues
5. Update build configuration

## Documentation

For more information, see the [PhilJS migration guide](../../docs/migration).

## License

MIT
