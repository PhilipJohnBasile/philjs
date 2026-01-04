# Tutorial: Collaborative Canvas

Build a Figma-like design tool using PhilJS Nexus.

## 1. Setup Nexus
Connect to the synchronization server.

```typescript
import { createNexus } from '@philjs/nexus';

const nexus = createNexus({
  roomId: 'canvas-1',
  auth: { userId: 'user-1' }
});
```

## 2. Shared State
Define the canvas state as a CRDT.

```typescript
const shapes = nexus.createMap('shapes');

function addRect(x, y) {
  const id = crypto.randomUUID();
  shapes.set(id, { x, y, type: 'rect', color: 'blue' });
}
```

## 3. Real-time Cursors
Show where other users are pointing.

```tsx
export function Cursors() {
  const others = useOthers(); // Hooks into Nexus presence
  
  return (
    <>
      {others.map(user => (
        <Cursor key={user.id} x={user.pointer.x} y={user.pointer.y} />
      ))}
    </>
  );
}
```
