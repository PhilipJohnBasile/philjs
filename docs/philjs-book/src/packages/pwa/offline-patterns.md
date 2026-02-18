# Offline Patterns

Building a robust offline experience goes beyond just caching files. `@philjs/pwa` provides primitives for handling data synchronization and user interactions when the network is unavailable.

## Background Sync

Background Sync allows you to defer actions until the user has a stable connection. This is critical for features like sending messages, uploading photos, or saving form data.

### Usage

1. **Register Sync**: When the user performs an action offline, register a sync tag.

```typescript
import { usePWA } from '@philjs/pwa';

function SendMessage() {
  const pwa = usePWA();

  const handleSend = async (msg) => {
    try {
      await api.send(msg);
    } catch (err) {
      // If offline, save to IndexedDB and register sync
      await db.messages.add({ msg, status: 'pending' });
      await pwa.registerBackgroundSync('sync-messages');
    }
  };
}
```

2. **Handle Sync in SW**: The generated Service Worker will fire a `sync` event when connectivity returns.

```typescript
// In your custom SW code or via config
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-messages') {
    event.waitUntil(flushMessageQueue());
  }
});
```

## Periodic Sync

Useful for fetching fresh content in the background (e.g., news feeds) potentially *before* the user opens the app.

```typescript
// Request periodic sync (requires permission)
await pwa.registerPeriodicSync('update-news', 24 * 60 * 60 * 1000); // 1 day
```

## Optimistic UI

For the best user experience, update the UI immediately, assuming the network request will succeed.

1. **Update Local State**: Reflect the change instantly.
2. **Queue Request**: Send the API request.
3. **Revert on Failure**: If specific error occurs (that isn't just "offline"), roll back the UI state.

PhilJS Signals make this pattern efficient:

```typescript
const todos = signal([]);

function addTodo(text) {
  // 1. Optimistic update
  const tempId = crypto.randomUUID();
  todos.set(prev => [...prev, { id: tempId, text, pending: true }]);

  // 2. Perform action
  api.addTodo(text)
    .then(serverTodo => {
      // 3. Confirm
      todos.set(prev => prev.map(t => t.id === tempId ? serverTodo : t));
    })
    .catch(() => {
      // 4. Rollback (if not just offline)
      todos.set(prev => prev.filter(t => t.id !== tempId));
    });
}
```

## Offline Fallbacks

The `generateServiceWorker` config allows you to specify a dedicated offline page for navigation requests.

```typescript
await generateServiceWorker({
  // ...
  offlineFallback: '/offline.html'
});
```

This ensures the user never sees the browser's "No Internet" dinosaur, maintaining your app's branding even in the worst conditions.
