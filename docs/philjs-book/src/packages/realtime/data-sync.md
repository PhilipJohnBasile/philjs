# Real-Time Data Synchronization

The `@philjs/realtime` package provides `useSharedState` for synchronizing state across all users in a room. This enables collaborative applications where multiple users can edit the same data simultaneously.

## useSharedState Hook

The `useSharedState` hook creates a synchronized state object that stays in sync across all connected clients.

### Basic Usage

```typescript
import { useSharedState } from '@philjs/realtime';

interface DocumentState {
  title: string;
  content: string;
  lastEditor: string;
}

const shared = useSharedState<DocumentState>({
  client,
  room: 'document-123',
  initialState: {
    title: 'Untitled',
    content: '',
    lastEditor: '',
  },
});

// Read state (signals)
shared.state();         // Full state object
shared.get('title');    // Get specific field
shared.version();       // Current version number

// Update state
shared.set('title', 'My Document');
shared.merge({ title: 'New Title', lastEditor: 'Alice' });
```

### Options

```typescript
interface SharedStateOptions<T> {
  // WebSocket client instance
  client: WebSocketClient;

  // Room to sync state in
  room: string;

  // Initial state (used before sync)
  initialState: T;
}
```

### Return Value

```typescript
interface SharedStateResult<T> {
  // Full state object (signal)
  state: () => T;

  // Get a specific key's value
  get: <K extends keyof T>(key: K) => T[K];

  // Set a specific key's value
  set: <K extends keyof T>(key: K, value: T[K]) => void;

  // Merge partial state
  merge: (partial: Partial<T>) => void;

  // Current version number (signal)
  version: () => number;
}
```

## Complete Example: Collaborative Document

```typescript
import { signal, effect, memo } from '@philjs/core';
import { WebSocketClient, useSharedState, usePresence } from '@philjs/realtime';

interface DocumentState {
  title: string;
  content: string;
  theme: 'light' | 'dark';
  fontSize: number;
  lastEditor: string;
  lastEditTime: number;
}

function CollaborativeDocument({ documentId }) {
  const client = new WebSocketClient({
    url: 'wss://api.example.com/ws',
  });

  const currentUser = {
    id: 'user-123',
    name: 'Alice',
  };

  // Shared document state
  const doc = useSharedState<DocumentState>({
    client,
    room: documentId,
    initialState: {
      title: 'Untitled Document',
      content: '',
      theme: 'light',
      fontSize: 14,
      lastEditor: '',
      lastEditTime: 0,
    },
  });

  // Presence for showing who's editing
  const presence = usePresence({
    client,
    room: documentId,
    user: currentUser,
    initialData: { section: 'body' },
  });

  // Connect
  effect(() => {
    client.connect();
    return () => client.disconnect();
  });

  // Track edits
  const updateContent = (newContent: string) => {
    doc.merge({
      content: newContent,
      lastEditor: currentUser.name,
      lastEditTime: Date.now(),
    });
  };

  // Derived state
  const editedRecently = memo(() => {
    return Date.now() - doc.state().lastEditTime < 5000;
  });

  return (
    <div
      class="document"
      style={{
        backgroundColor: doc.get('theme') === 'dark' ? '#1a1a1a' : '#ffffff',
        fontSize: `${doc.get('fontSize')}px`,
      }}
    >
      <header class="toolbar">
        <input
          type="text"
          value={doc.get('title')}
          onInput={(e) => doc.set('title', e.target.value)}
          class="title-input"
        />

        <div class="settings">
          <select
            value={doc.get('theme')}
            onChange={(e) => doc.set('theme', e.target.value as 'light' | 'dark')}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>

          <input
            type="range"
            min="12"
            max="24"
            value={doc.get('fontSize')}
            onInput={(e) => doc.set('fontSize', parseInt(e.target.value))}
          />
        </div>

        <div class="collaborators">
          {() => presence.others().map(p => (
            <img
              key={p.user.id}
              src={p.user.avatar}
              alt={p.user.name}
              title={p.user.name}
            />
          ))}
        </div>
      </header>

      <main>
        <textarea
          value={doc.get('content')}
          onInput={(e) => updateContent(e.target.value)}
          onFocus={() => presence.updatePresence({ section: 'body' })}
        />
      </main>

      <footer>
        {() => editedRecently() && (
          <span class="edit-indicator">
            {doc.get('lastEditor')} is editing...
          </span>
        )}
        <span class="version">v{doc.version()}</span>
      </footer>
    </div>
  );
}
```

## State Synchronization Protocol

The shared state system uses a simple protocol for synchronization:

### Message Types

```typescript
// Update a single field
{ type: 'state:update', payload: { key: 'title', value: 'New Title', version: 5 } }

// Merge multiple fields
{ type: 'state:merge', payload: { data: { title: 'X', content: 'Y' }, version: 6 } }

// Full state sync (on connect)
{ type: 'state:sync', payload: { data: { ...fullState }, version: 6 } }

// Request sync
{ type: 'state:sync:request', payload: {} }
```

### Version-Based Conflict Resolution

The system uses version numbers for basic conflict resolution:

```typescript
// Only apply updates with higher versions
client.on('state:update', (update) => {
  if (update.version > currentVersion()) {
    applyUpdate(update);
  }
});
```

## Optimistic Updates

Updates are applied locally immediately for responsiveness:

```typescript
function useOptimisticSharedState<T>(options: SharedStateOptions<T>) {
  const shared = useSharedState(options);
  const pendingUpdates = signal<Map<keyof T, any>>(new Map());

  const optimisticSet = <K extends keyof T>(key: K, value: T[K]) => {
    // Apply optimistically
    pendingUpdates.set(new Map(pendingUpdates()).set(key, value));

    // Send to server
    shared.set(key, value);

    // Clear pending after brief delay
    setTimeout(() => {
      const pending = new Map(pendingUpdates());
      pending.delete(key);
      pendingUpdates.set(pending);
    }, 100);
  };

  const getValue = <K extends keyof T>(key: K): T[K] => {
    // Return pending value if exists
    if (pendingUpdates().has(key)) {
      return pendingUpdates().get(key);
    }
    return shared.get(key);
  };

  return { ...shared, set: optimisticSet, get: getValue };
}
```

## Collaborative List Editing

Handling arrays in shared state:

```typescript
interface TodoState {
  items: Array<{
    id: string;
    text: string;
    completed: boolean;
    createdBy: string;
  }>;
  filter: 'all' | 'active' | 'completed';
}

function CollaborativeTodoList({ listId }) {
  const todos = useSharedState<TodoState>({
    client,
    room: listId,
    initialState: {
      items: [],
      filter: 'all',
    },
  });

  const addTodo = (text: string) => {
    const newItem = {
      id: crypto.randomUUID(),
      text,
      completed: false,
      createdBy: currentUser.name,
    };

    todos.set('items', [...todos.get('items'), newItem]);
  };

  const toggleTodo = (id: string) => {
    const items = todos.get('items').map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    todos.set('items', items);
  };

  const deleteTodo = (id: string) => {
    const items = todos.get('items').filter(item => item.id !== id);
    todos.set('items', items);
  };

  // Filtered items
  const filteredItems = memo(() => {
    const filter = todos.get('filter');
    const items = todos.get('items');

    switch (filter) {
      case 'active':
        return items.filter(i => !i.completed);
      case 'completed':
        return items.filter(i => i.completed);
      default:
        return items;
    }
  });

  return (
    <div class="todo-list">
      <AddTodoForm onAdd={addTodo} />

      <ul>
        {() => filteredItems().map(item => (
          <li key={item.id} class={item.completed ? 'completed' : ''}>
            <input
              type="checkbox"
              checked={item.completed}
              onChange={() => toggleTodo(item.id)}
            />
            <span>{item.text}</span>
            <small>by {item.createdBy}</small>
            <button onClick={() => deleteTodo(item.id)}>Delete</button>
          </li>
        ))}
      </ul>

      <footer>
        <FilterButtons
          current={todos.get('filter')}
          onChange={(f) => todos.set('filter', f)}
        />
      </footer>
    </div>
  );
}
```

## Real-Time Dashboard

Shared state works great for live dashboards:

```typescript
interface DashboardState {
  layout: 'grid' | 'list';
  widgets: Widget[];
  dateRange: { start: string; end: string };
  refreshInterval: number;
}

interface Widget {
  id: string;
  type: 'chart' | 'metric' | 'table';
  position: { x: number; y: number; w: number; h: number };
  config: Record<string, any>;
}

function CollaborativeDashboard({ dashboardId }) {
  const dashboard = useSharedState<DashboardState>({
    client,
    room: dashboardId,
    initialState: {
      layout: 'grid',
      widgets: [],
      dateRange: {
        start: '2024-01-01',
        end: '2024-12-31',
      },
      refreshInterval: 30000,
    },
  });

  // Update widget position (from drag and drop)
  const moveWidget = (widgetId: string, position: Widget['position']) => {
    const widgets = dashboard.get('widgets').map(w =>
      w.id === widgetId ? { ...w, position } : w
    );
    dashboard.set('widgets', widgets);
  };

  // Update widget config
  const configureWidget = (widgetId: string, config: Record<string, any>) => {
    const widgets = dashboard.get('widgets').map(w =>
      w.id === widgetId ? { ...w, config: { ...w.config, ...config } } : w
    );
    dashboard.set('widgets', widgets);
  };

  // Add new widget
  const addWidget = (type: Widget['type']) => {
    const newWidget: Widget = {
      id: crypto.randomUUID(),
      type,
      position: { x: 0, y: 0, w: 2, h: 2 },
      config: {},
    };
    dashboard.set('widgets', [...dashboard.get('widgets'), newWidget]);
  };

  return (
    <div class="dashboard">
      <header>
        <DateRangePicker
          value={dashboard.get('dateRange')}
          onChange={(range) => dashboard.set('dateRange', range)}
        />

        <select
          value={dashboard.get('layout')}
          onChange={(e) => dashboard.set('layout', e.target.value as DashboardState['layout'])}
        >
          <option value="grid">Grid</option>
          <option value="list">List</option>
        </select>

        <AddWidgetButton onAdd={addWidget} />
      </header>

      <main class={`layout-${dashboard.get('layout')}`}>
        {() => dashboard.get('widgets').map(widget => (
          <WidgetContainer
            key={widget.id}
            widget={widget}
            onMove={(pos) => moveWidget(widget.id, pos)}
            onConfigure={(config) => configureWidget(widget.id, config)}
          />
        ))}
      </main>
    </div>
  );
}
```

## Multiplayer Game State

Shared state for real-time games:

```typescript
interface GameState {
  board: ('X' | 'O' | null)[];
  currentPlayer: 'X' | 'O';
  winner: 'X' | 'O' | 'draw' | null;
  players: {
    X: { id: string; name: string } | null;
    O: { id: string; name: string } | null;
  };
  moveHistory: Array<{ player: 'X' | 'O'; position: number }>;
}

function TicTacToe({ gameId }) {
  const game = useSharedState<GameState>({
    client,
    room: gameId,
    initialState: {
      board: Array(9).fill(null),
      currentPlayer: 'X',
      winner: null,
      players: { X: null, O: null },
      moveHistory: [],
    },
  });

  const mySymbol = memo(() => {
    const players = game.get('players');
    if (players.X?.id === currentUser.id) return 'X';
    if (players.O?.id === currentUser.id) return 'O';
    return null;
  });

  const isMyTurn = memo(() => {
    return game.get('currentPlayer') === mySymbol();
  });

  // Join as player
  const joinGame = () => {
    const players = game.get('players');

    if (!players.X) {
      game.set('players', {
        ...players,
        X: { id: currentUser.id, name: currentUser.name },
      });
    } else if (!players.O) {
      game.set('players', {
        ...players,
        O: { id: currentUser.id, name: currentUser.name },
      });
    }
  };

  // Make a move
  const makeMove = (position: number) => {
    if (!isMyTurn()) return;
    if (game.get('board')[position]) return;
    if (game.get('winner')) return;

    const board = [...game.get('board')];
    const player = game.get('currentPlayer');
    board[position] = player;

    const moveHistory = [
      ...game.get('moveHistory'),
      { player, position },
    ];

    const winner = checkWinner(board);

    game.merge({
      board,
      currentPlayer: player === 'X' ? 'O' : 'X',
      winner,
      moveHistory,
    });
  };

  // Reset game
  const resetGame = () => {
    game.merge({
      board: Array(9).fill(null),
      currentPlayer: 'X',
      winner: null,
      moveHistory: [],
    });
  };

  return (
    <div class="tic-tac-toe">
      <header>
        <PlayerSlot
          symbol="X"
          player={game.get('players').X}
          isCurrentTurn={game.get('currentPlayer') === 'X'}
        />
        <span class="vs">VS</span>
        <PlayerSlot
          symbol="O"
          player={game.get('players').O}
          isCurrentTurn={game.get('currentPlayer') === 'O'}
        />
      </header>

      {() => !mySymbol() && (
        <button onClick={joinGame}>Join Game</button>
      )}

      <div class="board">
        {() => game.get('board').map((cell, i) => (
          <button
            key={i}
            class={`cell ${cell || ''}`}
            onClick={() => makeMove(i)}
            disabled={!isMyTurn() || !!cell || !!game.get('winner')}
          >
            {cell}
          </button>
        ))}
      </div>

      {() => game.get('winner') && (
        <div class="game-over">
          <h2>
            {game.get('winner') === 'draw'
              ? "It's a draw!"
              : `${game.get('winner')} wins!`}
          </h2>
          <button onClick={resetGame}>Play Again</button>
        </div>
      )}

      <aside class="history">
        <h3>Move History</h3>
        <ol>
          {() => game.get('moveHistory').map((move, i) => (
            <li key={i}>
              {move.player} played position {move.position + 1}
            </li>
          ))}
        </ol>
      </aside>
    </div>
  );
}

function checkWinner(board: (string | null)[]): 'X' | 'O' | 'draw' | null {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6], // diagonals
  ];

  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a] as 'X' | 'O';
    }
  }

  if (board.every(cell => cell !== null)) {
    return 'draw';
  }

  return null;
}
```

## Server-Side State Management

For the server, you need to handle state synchronization:

```typescript
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });
const roomStates = new Map<string, { data: any; version: number }>();

wss.on('connection', (ws) => {
  ws.on('message', (data) => {
    const message = JSON.parse(data.toString());

    switch (message.type) {
      case 'state:sync:request': {
        const room = message.room;
        const state = roomStates.get(room) || { data: {}, version: 0 };

        ws.send(JSON.stringify({
          type: 'state:sync',
          payload: state,
        }));
        break;
      }

      case 'state:update': {
        const room = message.room;
        const state = roomStates.get(room) || { data: {}, version: 0 };

        // Apply update
        state.data[message.payload.key] = message.payload.value;
        state.version = message.payload.version;
        roomStates.set(room, state);

        // Broadcast to room
        broadcastToRoom(room, message);
        break;
      }

      case 'state:merge': {
        const room = message.room;
        const state = roomStates.get(room) || { data: {}, version: 0 };

        // Merge updates
        state.data = { ...state.data, ...message.payload.data };
        state.version = message.payload.version;
        roomStates.set(room, state);

        // Broadcast to room
        broadcastToRoom(room, message);
        break;
      }
    }
  });
});
```

## Best Practices

### 1. Keep State Flat

```typescript
// Bad: Deeply nested state
interface BadState {
  users: {
    [id: string]: {
      profile: {
        settings: {
          theme: string;
        };
      };
    };
  };
}

// Good: Flat state
interface GoodState {
  userProfiles: Map<string, Profile>;
  userSettings: Map<string, Settings>;
  theme: string;
}
```

### 2. Use Immutable Updates

```typescript
// Bad: Mutating state
const items = shared.get('items');
items.push(newItem); // Don't mutate!
shared.set('items', items);

// Good: Immutable update
shared.set('items', [...shared.get('items'), newItem]);
```

### 3. Debounce Frequent Updates

```typescript
import { debounce } from '@philjs/core';

// For text input, debounce updates
const updateContent = debounce((content: string) => {
  doc.set('content', content);
}, 300);

<textarea onInput={(e) => updateContent(e.target.value)} />
```

### 4. Handle Offline State

```typescript
function useOfflineAwareSharedState<T>(options: SharedStateOptions<T>) {
  const shared = useSharedState(options);
  const localChanges = signal<Partial<T>>({});

  // Queue changes when offline
  const safeSet = <K extends keyof T>(key: K, value: T[K]) => {
    if (options.client.status() !== 'connected') {
      localChanges.set({ ...localChanges(), [key]: value });
      return;
    }
    shared.set(key, value);
  };

  // Sync local changes on reconnect
  effect(() => {
    if (options.client.status() === 'connected') {
      const changes = localChanges();
      if (Object.keys(changes).length > 0) {
        shared.merge(changes);
        localChanges.set({});
      }
    }
  });

  return { ...shared, set: safeSet };
}
```

### 5. Validate State Changes

```typescript
const validateStateChange = <T>(
  state: T,
  key: keyof T,
  value: any
): boolean => {
  // Add your validation logic
  switch (key) {
    case 'title':
      return typeof value === 'string' && value.length <= 200;
    case 'items':
      return Array.isArray(value) && value.length <= 1000;
    default:
      return true;
  }
};

// Use in set
const safeSet = <K extends keyof T>(key: K, value: T[K]) => {
  if (!validateStateChange(shared.state(), key, value)) {
    console.warn('Invalid state change rejected');
    return;
  }
  shared.set(key, value);
};
```

## Next Steps

- [Presence](./presence.md) - Track who's online
- [Channels](./channels.md) - Broadcast channels and rooms
- [WebSockets](./websockets.md) - Low-level WebSocket client
- [Y.js Integration](../collab/overview.md) - Full CRDT support for text editing
