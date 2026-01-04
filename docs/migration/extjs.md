# Migrating from Ext JS to PhilJS

Moving from Ext JS to PhilJS is a paradigm shift from a heavy, config-driven class hierarchy to a lightweight, functional, and composable architecture.

## Key Differences

- **Layouts**: Ext JS uses complex JS-based layout managers (`vbox`, `hbox`, `border`). PhilJS relies on standard CSS/Flexbox/Grid.
- **Data Stores**: Ext JS `Store` and `Model` are replaced by `@philjs/store` or simple signals + fetch.
- **Components**: No more `Ext.define`. Components are functions.

## Migration Path

### 1. Theming
Replace Ext JS themes (Triton, Aria, etc.) with `@philjs/antd` or `@philjs/material` for a similar enterprise look and feel without the bloat.

### 2. Data Layer
Migrate `Ext.data.Store` logic to PhilJS hooks or `@philjs/rquery` (React Query equivalent).

### 3. Grid Components
The `Ext.grid.Panel` is the hardest part. Use `@philjs/shadcn` Table or integrate `ag-grid` with PhilJS for feature parity (sorting, filtering, locking columns).

## Code Comparison

### Ext JS Store

```javascript
Ext.create('Ext.data.Store', {
    fields: ['name', 'email'],
    proxy: { type: 'ajax', url: '/users' }
});
```

### PhilJS

```typescript
import { createResource } from '@philjs/core';

const [users] = createResource(() => fetch('/users').then(r => r.json()));
```
