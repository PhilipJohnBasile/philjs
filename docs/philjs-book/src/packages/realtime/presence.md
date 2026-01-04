# Presence Tracking

Presence tracking allows you to see who's online and share live status information. The `@philjs/realtime` package provides `usePresence` for tracking users and `useCursors` for sharing live cursor positions.

## usePresence Hook

The `usePresence` hook tracks which users are online in a room and allows sharing arbitrary presence data.

### Basic Usage

```typescript
import { usePresence } from '@philjs/realtime';

const presence = usePresence({
  client,
  room: 'document-123',
  user: {
    id: 'user-1',
    name: 'Alice',
    avatar: '/avatars/alice.png',
  },
});

// See who's online
console.log('Users online:', presence.count());
console.log('Other users:', presence.others());
```

### Options

```typescript
interface UsePresenceOptions<T = any> {
  // WebSocket client instance
  client: WebSocketClient;

  // Room to track presence in
  room: string;

  // Current user's information
  user: User;

  // Initial presence data (optional)
  initialData?: T;

  // How often to broadcast presence in ms (default: 1000)
  syncInterval?: number;
}
```

### Return Value

```typescript
interface PresenceResult<T> {
  // Array of other users' presence states
  others: () => PresenceState<T>[];

  // Your current presence data
  myPresence: () => T | undefined;

  // Update your presence data
  updatePresence: (data: Partial<T>) => void;

  // Whether connected to server
  isConnected: () => boolean;

  // Total user count (including yourself)
  count: () => number;
}
```

### Presence Data Types

```typescript
interface User {
  id: string;
  name?: string;
  avatar?: string;
  color?: string;
  [key: string]: any;  // Custom properties allowed
}

interface PresenceState<T = any> {
  user: User;      // User info
  data: T;         // Custom presence data
  lastSeen: number; // Unix timestamp of last update
}
```

## Complete Presence Example

```typescript
import { signal, effect, memo } from '@philjs/core';
import { WebSocketClient, usePresence } from '@philjs/realtime';

// Define custom presence data
interface EditorPresence {
  cursorPosition: { line: number; column: number } | null;
  selection: { start: number; end: number } | null;
  currentFile: string | null;
  status: 'active' | 'idle' | 'away';
}

function CollaborativeEditor({ documentId }) {
  const client = new WebSocketClient({
    url: 'wss://api.example.com/ws',
  });

  const currentUser = {
    id: 'user-123',
    name: 'Alice',
    avatar: '/avatars/alice.png',
    color: '#4CAF50', // User's unique color
  };

  const presence = usePresence<EditorPresence>({
    client,
    room: documentId,
    user: currentUser,
    initialData: {
      cursorPosition: null,
      selection: null,
      currentFile: null,
      status: 'active',
    },
    syncInterval: 1000,
  });

  // Connect on mount
  effect(() => {
    client.connect();
    return () => client.disconnect();
  });

  // Track activity for idle status
  let idleTimeout: number | undefined;

  const markActive = () => {
    if (idleTimeout) clearTimeout(idleTimeout);
    presence.updatePresence({ status: 'active' });

    idleTimeout = setTimeout(() => {
      presence.updatePresence({ status: 'idle' });
    }, 60000); // 1 minute of inactivity
  };

  // Track cursor position
  const handleCursorMove = (line: number, column: number) => {
    presence.updatePresence({
      cursorPosition: { line, column },
    });
    markActive();
  };

  // Track selection
  const handleSelection = (start: number, end: number) => {
    presence.updatePresence({
      selection: { start, end },
    });
    markActive();
  };

  // Derived state: active users
  const activeUsers = memo(() =>
    presence.others().filter(p => p.data.status === 'active')
  );

  // Derived state: users in same file
  const usersInSameFile = memo(() => {
    const myFile = presence.myPresence()?.currentFile;
    if (!myFile) return [];
    return presence.others().filter(p => p.data.currentFile === myFile);
  });

  return (
    <div class="editor-container">
      <aside class="collaborators">
        <h3>Collaborators ({presence.count()})</h3>

        <ul class="user-list">
          {() => presence.others().map(other => (
            <li
              key={other.user.id}
              class={`user ${other.data.status}`}
            >
              <img
                src={other.user.avatar}
                alt={other.user.name}
                style={{ borderColor: other.user.color }}
              />
              <div class="user-info">
                <span class="name">{other.user.name}</span>
                <span class="file">{other.data.currentFile || 'No file'}</span>
              </div>
              <span class={`status-dot ${other.data.status}`} />
            </li>
          ))}
        </ul>
      </aside>

      <main class="editor">
        <CodeEditor
          onCursorMove={handleCursorMove}
          onSelection={handleSelection}
          onFileChange={(file) => {
            presence.updatePresence({ currentFile: file });
          }}
          remoteCursors={usersInSameFile()}
        />
      </main>
    </div>
  );
}
```

## useCursors Hook

The `useCursors` hook specifically tracks live cursor positions with built-in throttling for performance.

### Basic Usage

```typescript
import { useCursors } from '@philjs/realtime';

const { cursors, broadcast } = useCursors({
  client,
  room: 'canvas-123',
  user: currentUser,
  throttle: 50, // Broadcast at most every 50ms
});

// Broadcast my cursor position
document.addEventListener('mousemove', (e) => {
  broadcast(e.clientX, e.clientY);
});

// Get all cursors
console.log('Cursors:', cursors());
```

### Options

```typescript
interface UseCursorsOptions {
  // WebSocket client instance
  client: WebSocketClient;

  // Room to share cursors in
  room: string;

  // Current user info
  user: User;

  // Minimum ms between broadcasts (default: 50)
  throttle?: number;
}
```

### Cursor Types

```typescript
interface CursorPosition {
  x: number;
  y: number;
  timestamp: number;
}

interface CursorState extends CursorPosition {
  user: User;
}
```

### Return Value

```typescript
interface CursorsResult {
  // Array of other users' cursor positions
  cursors: () => CursorState[];

  // Broadcast your cursor position
  broadcast: (x: number, y: number) => void;
}
```

## Cursor Overlay Component

A complete example of rendering remote cursors:

```typescript
import { effect, signal, memo } from '@philjs/core';
import { useCursors } from '@philjs/realtime';

function CursorOverlay({ client, roomId, currentUser, containerRef }) {
  const { cursors, broadcast } = useCursors({
    client,
    room: roomId,
    user: currentUser,
    throttle: 50,
  });

  // Track mouse movement
  effect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      broadcast(x, y);
    };

    container.addEventListener('mousemove', handleMouseMove);
    return () => container.removeEventListener('mousemove', handleMouseMove);
  });

  // Smooth cursor animation
  const animatedCursors = memo(() => {
    return cursors().map(cursor => ({
      ...cursor,
      // Add CSS transform for smooth animation
      style: {
        transform: `translate(${cursor.x}px, ${cursor.y}px)`,
        backgroundColor: cursor.user.color || '#666',
        transition: 'transform 50ms ease-out',
      },
    }));
  });

  return (
    <div class="cursor-overlay" style={{ pointerEvents: 'none' }}>
      {() => animatedCursors().map(cursor => (
        <div
          key={cursor.user.id}
          class="remote-cursor"
          style={cursor.style}
        >
          {/* Cursor pointer */}
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill={cursor.user.color}
          >
            <path d="M0 0L20 8L12 12L8 20L0 0Z" />
          </svg>

          {/* User name label */}
          <span
            class="cursor-label"
            style={{ backgroundColor: cursor.user.color }}
          >
            {cursor.user.name}
          </span>
        </div>
      ))}
    </div>
  );
}
```

### Cursor Styling

```css
.cursor-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: none;
  z-index: 1000;
}

.remote-cursor {
  position: absolute;
  top: 0;
  left: 0;
  will-change: transform;
}

.cursor-label {
  position: absolute;
  left: 16px;
  top: 16px;
  padding: 2px 6px;
  border-radius: 4px;
  color: white;
  font-size: 12px;
  white-space: nowrap;
}
```

## Online Users List

A common pattern for showing who's online:

```typescript
import { memo, effect } from '@philjs/core';
import { usePresence } from '@philjs/realtime';

interface UserPresenceData {
  status: 'online' | 'away' | 'busy';
  statusMessage?: string;
}

function OnlineUsersList({ client, roomId }) {
  const presence = usePresence<UserPresenceData>({
    client,
    room: roomId,
    user: currentUser,
    initialData: { status: 'online' },
  });

  // Sort users by activity
  const sortedUsers = memo(() => {
    return [...presence.others()].sort((a, b) => {
      // Active users first
      if (a.data.status === 'online' && b.data.status !== 'online') return -1;
      if (b.data.status === 'online' && a.data.status !== 'online') return 1;

      // Then by last seen
      return b.lastSeen - a.lastSeen;
    });
  });

  // Check for stale presence (user might have crashed)
  const isStale = (lastSeen: number) => {
    return Date.now() - lastSeen > 10000; // 10 seconds
  };

  return (
    <div class="online-users">
      <header>
        <h3>Online</h3>
        <span class="count">{presence.count()}</span>
      </header>

      <ul>
        {/* Show current user first */}
        <li class="user current-user">
          <img src={currentUser.avatar} alt={currentUser.name} />
          <span class="name">{currentUser.name} (you)</span>
          <select
            value={presence.myPresence()?.status}
            onChange={(e) => {
              presence.updatePresence({
                status: e.target.value as UserPresenceData['status'],
              });
            }}
          >
            <option value="online">Online</option>
            <option value="away">Away</option>
            <option value="busy">Busy</option>
          </select>
        </li>

        {/* Other users */}
        {() => sortedUsers().map(other => (
          <li
            key={other.user.id}
            class={`user ${other.data.status} ${isStale(other.lastSeen) ? 'stale' : ''}`}
          >
            <img src={other.user.avatar} alt={other.user.name} />
            <div class="user-details">
              <span class="name">{other.user.name}</span>
              {other.data.statusMessage && (
                <span class="status-message">{other.data.statusMessage}</span>
              )}
            </div>
            <span class={`status-indicator ${other.data.status}`} />
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## Presence with Idle Detection

Automatically track user activity and set status:

```typescript
import { signal, effect } from '@philjs/core';
import { usePresence } from '@philjs/realtime';

interface ActivityPresence {
  status: 'active' | 'idle' | 'away';
  lastActivity: number;
}

function usePresenceWithActivityTracking(
  client: WebSocketClient,
  room: string,
  user: User
) {
  const presence = usePresence<ActivityPresence>({
    client,
    room,
    user,
    initialData: {
      status: 'active',
      lastActivity: Date.now(),
    },
  });

  const IDLE_TIMEOUT = 60000;    // 1 minute
  const AWAY_TIMEOUT = 300000;   // 5 minutes

  let idleTimer: number | undefined;
  let awayTimer: number | undefined;

  const updateActivity = () => {
    // Clear existing timers
    if (idleTimer) clearTimeout(idleTimer);
    if (awayTimer) clearTimeout(awayTimer);

    // Set active status
    presence.updatePresence({
      status: 'active',
      lastActivity: Date.now(),
    });

    // Set idle after 1 minute
    idleTimer = setTimeout(() => {
      presence.updatePresence({ status: 'idle' });
    }, IDLE_TIMEOUT);

    // Set away after 5 minutes
    awayTimer = setTimeout(() => {
      presence.updatePresence({ status: 'away' });
    }, AWAY_TIMEOUT);
  };

  // Track activity events
  effect(() => {
    const events = ['mousedown', 'keydown', 'mousemove', 'touchstart', 'scroll'];

    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    // Track visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        presence.updatePresence({ status: 'away' });
      } else {
        updateActivity();
      }
    });

    // Initialize
    updateActivity();

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
      if (idleTimer) clearTimeout(idleTimer);
      if (awayTimer) clearTimeout(awayTimer);
    };
  });

  return presence;
}
```

## Focus Indicator

Track what users are looking at:

```typescript
import { usePresence } from '@philjs/realtime';

interface FocusPresence {
  focusedElement: string | null;  // ID or selector
  scrollPosition: number;
  viewportHeight: number;
}

function useFocusPresence(client: WebSocketClient, room: string, user: User) {
  const presence = usePresence<FocusPresence>({
    client,
    room,
    user,
    initialData: {
      focusedElement: null,
      scrollPosition: 0,
      viewportHeight: window.innerHeight,
    },
    syncInterval: 500,
  });

  // Track focus
  effect(() => {
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      const id = target.id || target.getAttribute('data-focus-id');
      presence.updatePresence({ focusedElement: id });
    };

    const handleBlur = () => {
      presence.updatePresence({ focusedElement: null });
    };

    document.addEventListener('focusin', handleFocus);
    document.addEventListener('focusout', handleBlur);

    return () => {
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('focusout', handleBlur);
    };
  });

  // Track scroll
  effect(() => {
    const handleScroll = throttle(() => {
      presence.updatePresence({
        scrollPosition: window.scrollY,
        viewportHeight: window.innerHeight,
      });
    }, 200);

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  });

  return {
    presence,
    // Get users focused on a specific element
    getUsersFocusedOn: (elementId: string) =>
      presence.others().filter(p => p.data.focusedElement === elementId),

    // Get users viewing the same scroll area
    getUsersInViewport: () => {
      const myScroll = presence.myPresence()?.scrollPosition ?? 0;
      const myHeight = presence.myPresence()?.viewportHeight ?? 0;

      return presence.others().filter(p => {
        const theirScroll = p.data.scrollPosition;
        const theirHeight = p.data.viewportHeight;

        // Check if viewports overlap
        return (
          theirScroll < myScroll + myHeight &&
          theirScroll + theirHeight > myScroll
        );
      });
    },
  };
}
```

## Best Practices

### 1. Choose Appropriate Sync Intervals

```typescript
// High-frequency data (cursors): lower interval
const cursors = useCursors({ throttle: 50 });

// Status updates: standard interval
const presence = usePresence({ syncInterval: 1000 });

// Infrequent data: higher interval
const slowPresence = usePresence({ syncInterval: 5000 });
```

### 2. Clean Up Stale Presence

```typescript
const STALE_THRESHOLD = 10000; // 10 seconds

const activeUsers = memo(() => {
  const now = Date.now();
  return presence.others().filter(p => now - p.lastSeen < STALE_THRESHOLD);
});
```

### 3. Handle Reconnection

```typescript
effect(() => {
  const status = client.status();

  if (status === 'connected') {
    // Re-announce presence after reconnect
    presence.updatePresence({
      ...presence.myPresence(),
      reconnectedAt: Date.now(),
    });
  }
});
```

### 4. Minimize Presence Data

```typescript
// Bad: Large presence data
presence.updatePresence({
  fullDocument: largeDocument, // Don't do this!
  history: allHistory,
});

// Good: Minimal, relevant data
presence.updatePresence({
  currentSection: 'chapter-3',
  cursorOffset: 1234,
  status: 'editing',
});
```

### 5. User Colors

Assign distinct colors for visual identification:

```typescript
const COLORS = [
  '#E57373', '#F06292', '#BA68C8', '#9575CD',
  '#7986CB', '#64B5F6', '#4FC3F7', '#4DD0E1',
  '#4DB6AC', '#81C784', '#AED581', '#DCE775',
  '#FFF176', '#FFD54F', '#FFB74D', '#FF8A65',
];

function getColorForUser(userId: string): string {
  // Consistent color based on user ID
  const hash = userId.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);

  return COLORS[Math.abs(hash) % COLORS.length];
}
```

## Next Steps

- [Data Sync](./data-sync.md) - Synchronize shared state
- [Channels](./channels.md) - Broadcast channels and rooms
- [WebSockets](./websockets.md) - Low-level WebSocket client
