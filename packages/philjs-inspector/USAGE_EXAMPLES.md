# PhilJS Inspector - Usage Examples

## Quick Start

### 1. Browser Console Usage

Once your app is running, open the browser console and type:

```javascript
// Enable inspector
window.__PHILJS_INSPECTOR__.enable();

// Now hover over any component to see the bounding box!
```

### 2. In Your App

```typescript
// src/main.ts
import { initInspector } from 'philjs-inspector';

// Initialize on app startup (dev only)
if (import.meta.env.DEV) {
  initInspector();

  // Auto-enable in development
  window.__PHILJS_INSPECTOR__.enable({
    showMetrics: true,
    enableKeyboard: true,
  });
}
```

## Interactive Examples

### Example 1: Inspect a Todo List Component

```tsx
// TodoList.tsx
import { signal } from 'philjs-core';

function TodoList() {
  const todos = signal([
    { id: 1, text: 'Learn PhilJS', done: false },
    { id: 2, text: 'Build app', done: false },
  ]);

  return (
    <div data-component-name="TodoList">
      <h2>My Todos</h2>
      <ul>
        {todos().map(todo => (
          <TodoItem key={todo.id} todo={todo} />
        ))}
      </ul>
    </div>
  );
}

function TodoItem({ todo }) {
  return (
    <li
      data-component-name="TodoItem"
      data-props={JSON.stringify({ id: todo.id })}
    >
      {todo.text}
    </li>
  );
}
```

**Try it:**
1. Press `Ctrl+Shift+I` to enable inspector
2. Hover over the `<h2>` - see "h2" highlighted
3. Hover over a todo item - see "TodoItem" highlighted
4. Click on a todo item to see its props in the tooltip
5. Use arrow keys to navigate between components

### Example 2: Debug Performance Issues

```tsx
// SlowComponent.tsx
import { signal, memo } from 'philjs-core';
import { updateComponentMetrics } from 'philjs-inspector';

function SlowComponent() {
  const data = signal(generateLargeData());

  // Expensive computation
  const processedData = memo(() => {
    const start = performance.now();
    const result = expensiveOperation(data());
    const duration = performance.now() - start;

    // Track performance
    updateComponentMetrics(
      document.querySelector('[data-component-name="SlowComponent"]'),
      duration
    );

    return result;
  });

  return (
    <div data-component-name="SlowComponent">
      {/* Component content */}
    </div>
  );
}
```

**Try it:**
1. Enable inspector
2. Click on the slow component
3. Check the Performance section in the tooltip
4. See render count and timing

### Example 3: Navigate Component Hierarchy

```tsx
// App.tsx
function App() {
  return (
    <div data-component-name="App">
      <Header />
      <main data-component-name="MainContent">
        <Sidebar />
        <Content>
          <Article />
        </Content>
      </main>
      <Footer />
    </div>
  );
}
```

**Try it:**
1. Enable inspector with `Ctrl+Shift+I`
2. Click on `<Article />` component
3. Press `Left Arrow` to jump to parent (`Content`)
4. Press `Left Arrow` again to jump to `MainContent`
5. Press `Right Arrow` to jump back to first child
6. Check the breadcrumb at the top showing: `App > MainContent > Content > Article`

### Example 4: Search Components

```tsx
// Large app with many components
function Dashboard() {
  return (
    <div>
      <UserProfile />
      <UserSettings />
      <UserActivity />
      <DataChart />
      <DataTable />
      <DataExport />
    </div>
  );
}
```

**Try it:**
1. Press `Ctrl+F` to open search
2. Type "User" - see all User* components highlighted
3. Use arrow keys to navigate results
4. Press Enter to select
5. Press Escape to close search

### Example 5: Track Signals

```tsx
// Counter.tsx
import { signal } from 'philjs-core';
import { registerSignal } from 'philjs-inspector';

function Counter() {
  const count = signal(0);
  const doubled = memo(() => count() * 2);

  // Register signals for inspector
  if (import.meta.env.DEV) {
    registerSignal(count, 'count', 'signal');
    registerSignal(doubled, 'doubled', 'memo');
  }

  return (
    <div
      data-component-name="Counter"
      data-signals={JSON.stringify(['count', 'doubled'])}
    >
      <p>Count: {count()}</p>
      <p>Doubled: {doubled()}</p>
      <button onClick={() => count.set(c => c + 1)}>
        Increment
      </button>
    </div>
  );
}
```

**Try it:**
1. Enable inspector
2. Click on the Counter component
3. See "Signals" section in tooltip showing current values
4. Click the button and see values update in real-time

### Example 6: Island Architecture Debugging

```tsx
// Page.tsx
function ProductPage() {
  return (
    <div data-component-name="ProductPage">
      {/* Static content - no JS */}
      <ProductHeader title="Amazing Product" />

      {/* Interactive island - JS loaded */}
      <AddToCartButton island product={product} />

      {/* Another island */}
      <ProductReviews island productId={123} />

      {/* Static content again */}
      <ProductDescription text="..." />
    </div>
  );
}
```

**Try it:**
1. Enable inspector
2. Hover over components
3. Islands show **[Island]** badge in green
4. Click to see hydration status
5. Check which components are hydrated vs static

### Example 7: IDE Integration

```tsx
// vite.config.ts
export default {
  plugins: [
    {
      name: 'add-source-locations',
      transform(code, id) {
        if (!id.includes('node_modules') && /\.(tsx|jsx)$/.test(id)) {
          // Add source location metadata
          return {
            code: code.replace(
              /data-component-name="([^"]+)"/g,
              `data-component-name="$1" data-source="${id}"`
            ),
            map: null,
          };
        }
      },
    },
  ],
};

// App setup
window.__PHILJS_OPEN_IN_IDE__ = (url) => {
  // Send to dev server endpoint
  fetch('/__open-in-editor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
};
```

**Try it:**
1. Enable inspector
2. Click on any component
3. See source location in tooltip
4. Click the source link - opens in your IDE!

## Keyboard Shortcuts Reference

| Shortcut | Action | Example |
|----------|--------|---------|
| `Ctrl+Shift+I` | Toggle inspector | Turn inspector on/off |
| `Ctrl+F` | Search components | Find all "Button" components |
| `Arrow Up` | Previous component | Navigate to component above |
| `Arrow Down` | Next component | Navigate to component below |
| `Arrow Left` | Parent component | Jump to parent in hierarchy |
| `Arrow Right` | Child component | Jump to first child |
| `Escape` | Close/Disable | Close tooltip or disable inspector |

## Advanced Usage

### Custom Component Metadata

```tsx
function MyComponent({ userId, userName }) {
  return (
    <div
      data-component-name="MyComponent"
      data-props={JSON.stringify({ userId, userName })}
      data-signals={JSON.stringify(['userSignal', 'dataSignal'])}
      data-source="/src/components/MyComponent.tsx:15:1"
    >
      {/* content */}
    </div>
  );
}
```

### Programmatic Control

```typescript
// Get inspector instance
const inspector = window.__PHILJS_INSPECTOR__;

// Check state
if (inspector.isEnabled()) {
  console.log('Inspector is active');
}

// Get all components
const components = inspector.getComponents();
console.log(`Found ${components.length} components`);

// Filter islands only
const islands = components.filter(c => c.isIsland);
console.log(`Found ${islands.length} islands`);
```

### Integration with Testing

```typescript
// e2e-test.spec.ts
test('component inspection', async ({ page }) => {
  await page.goto('/');

  // Enable inspector
  await page.evaluate(() => {
    window.__PHILJS_INSPECTOR__.enable();
  });

  // Get component info
  const components = await page.evaluate(() => {
    return window.__PHILJS_INSPECTOR__.getComponents();
  });

  expect(components.length).toBeGreaterThan(0);
});
```

## Tips & Tricks

1. **Quick Enable**: Bookmark this to enable with one click:
   ```javascript
   javascript:window.__PHILJS_INSPECTOR__?.enable()
   ```

2. **Console Shortcut**: Add to your browser console snippets:
   ```javascript
   // Enable inspector
   window.$i = window.__PHILJS_INSPECTOR__;
   $i.enable();
   ```

3. **Debug Mode**: Enable with full metrics:
   ```javascript
   window.__PHILJS_INSPECTOR__.enable({
     showMetrics: true,
     enableKeyboard: true,
   });
   ```

4. **Export Component List**: Get all components as JSON:
   ```javascript
   const components = window.__PHILJS_INSPECTOR__.getComponents();
   console.log(JSON.stringify(components, null, 2));
   ```

5. **Find Slow Components**: Filter by render time:
   ```javascript
   const slow = window.__PHILJS_INSPECTOR__
     .getComponents()
     .filter(c => c.renderTime > 16)
     .sort((a, b) => b.renderTime - a.renderTime);
   console.table(slow);
   ```
