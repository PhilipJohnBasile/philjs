# Vue to PhilJS Migration Guide

This guide helps you migrate Vue 3 Composition API code to PhilJS.

## Quick Reference

| Vue 3 | PhilJS | Notes |
|:------|:-------|:------|
| `ref(value)` | `signal(value)` | State container |
| `reactive(obj)` | `signal(obj)` | Object state |
| `computed(() => x)` | `memo(() => x)` | Derived values |
| `watch(source, cb)` | `effect(() => { source(); cb(); })` | Side effects |
| `watchEffect(cb)` | `effect(cb)` | Auto-tracking effect |
| `myRef.value` | `mySignal()` | Read value |
| `myRef.value = x` | `mySignal.set(x)` | Write value |
| `onMounted(cb)` | `effect(cb)` | Lifecycle |
| `onUnmounted(cb)` | `onCleanup(cb)` inside effect | Cleanup |

## Running the Migration

```bash
# Install the migration CLI
pnpm add -D @philjs/migrate

# Migrate a single file
npx philjs-migrate --from vue src/components/MyComponent.vue

# Migrate a directory
npx philjs-migrate --from vue src/

# Preview changes without writing
npx philjs-migrate --from vue --dry-run src/
```

## Before/After Examples

### Basic State

**Vue 3:**
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
  <button @click="increment">{{ count }} × 2 = {{ doubled }}</button>
</template>
```

**PhilJS:**
```tsx
import { signal, memo } from '@philjs/core';

function Counter() {
  const count = signal(0);
  const doubled = memo(() => count() * 2);

  const increment = () => count.set(count() + 1);

  return (
    <button onClick={increment}>
      {count()} × 2 = {doubled()}
    </button>
  );
}
```

### Watchers

**Vue 3:**
```vue
<script setup>
import { ref, watch, watchEffect } from 'vue';

const searchTerm = ref('');
const results = ref([]);

watch(searchTerm, async (newTerm) => {
  results.value = await fetchResults(newTerm);
});

watchEffect(() => {
  console.log('Search term:', searchTerm.value);
});
</script>
```

**PhilJS:**
```tsx
import { signal, effect, resource } from '@philjs/core';

function Search() {
  const searchTerm = signal('');
  
  // Use resource for async data that depends on signals
  const results = resource(() => 
    searchTerm() ? fetchResults(searchTerm()) : Promise.resolve([])
  );

  // Simple effect for logging
  effect(() => {
    console.log('Search term:', searchTerm());
  });
  
  return (
    <div>
      <input 
        value={searchTerm()} 
        onInput={(e) => searchTerm.set(e.target.value)} 
      />
      <ul>
        {results()?.map(r => <li>{r.title}</li>)}
      </ul>
    </div>
  );
}
```

### Props and Emit

**Vue 3:**
```vue
<script setup>
const props = defineProps<{ title: string }>();
const emit = defineEmits<{ (e: 'update', value: string): void }>();
</script>
```

**PhilJS:**
```tsx
interface MyComponentProps {
  title: string;
  onUpdate?: (value: string) => void;
}

function MyComponent(props: MyComponentProps) {
  const handleClick = () => {
    props.onUpdate?.('new value');
  };
  
  return <div onClick={handleClick}>{props.title}</div>;
}
```

## Manual Steps After Migration

1. **Convert SFC templates to JSX** - The codemod migrates script, but templates need manual conversion
2. **Update event handlers** - `@click` → `onClick`, `@input` → `onInput`
3. **Review async patterns** - Consider using `resource` instead of manual `watch` + async
4. **Check for v-model** - Convert to controlled inputs with `value` + `onInput`
5. **Update component registration** - PhilJS uses direct function exports

## Common Gotchas

1. **Forgetting to call signals** - `count` → `count()` when reading
2. **Direct mutation** - Use `signal.set()` or `signal.update()` instead
3. **Missing cleanup** - Return cleanup functions from `effect()` when needed
