# @philjs/collab

Real-time collaboration features for React applications. Enables multiple users to work together with live cursors, presence awareness, and synchronized state.

## Installation

```bash
npm install @philjs/collab
# or
yarn add @philjs/collab
# or
pnpm add @philjs/collab
```

## Basic Usage

```tsx
import { CollabProvider, usePresence, useSyncedState } from '@philjs/collab';

function App() {
  return (
    <CollabProvider roomId="my-room" userId="user-123">
      <CollaborativeEditor />
    </CollabProvider>
  );
}

function CollaborativeEditor() {
  const { users, cursors } = usePresence();
  const [content, setContent] = useSyncedState('content', '');

  return (
    <div>
      <div>Users online: {users.length}</div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
    </div>
  );
}
```

## Features

- **Real-time Sync** - Automatic state synchronization across clients
- **Presence Awareness** - See who is online and their activity
- **Live Cursors** - Display collaborator cursor positions
- **Conflict Resolution** - CRDT-based conflict-free data types
- **Room Management** - Create and manage collaboration rooms
- **User Permissions** - Role-based access control for rooms
- **Offline Support** - Queue changes when disconnected
- **WebSocket Transport** - Low-latency real-time communication
- **History** - Undo/redo with collaborative awareness
- **Typing Indicators** - Show when users are actively editing
- **Comments** - Threaded comments and annotations
- **Version History** - Track and restore previous versions

## Hooks

| Hook | Description |
|------|-------------|
| `usePresence` | Access online users and cursors |
| `useSyncedState` | Synchronized state across clients |
| `useSyncedMap` | Collaborative key-value store |
| `useSyncedList` | Collaborative array/list |
| `useRoom` | Room connection and status |

## License

MIT
