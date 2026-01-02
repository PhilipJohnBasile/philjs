/**
 * @philjs/nexus - Hooks
 *
 * React-style hooks for Nexus features, integrated with PhilJS signals
 */

import type {
  NexusConfig,
  NexusDocument,
  NexusCollection,
  SyncStatus,
  PresenceState,
  AIGenerateResult,
  NexusEvent,
} from './types.js';
import { NexusApp, createNexusApp } from './nexus-app.js';

// ============================================================================
// Global App Instance Management
// ============================================================================

let globalApp: NexusApp | null = null;

/**
 * Initialize the global Nexus app
 */
export function initNexus(config: NexusConfig): NexusApp {
  globalApp = createNexusApp(config);
  return globalApp;
}

/**
 * Get the global Nexus app instance
 */
export function getNexusApp(): NexusApp {
  if (!globalApp) {
    throw new Error('Nexus not initialized. Call initNexus() first.');
  }
  return globalApp;
}

// ============================================================================
// Document Hooks
// ============================================================================

/**
 * Hook to use a Nexus document with reactive updates
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const { data, set, loading } = useNexusDocument<Note>('notes/123');
 *
 *   return (
 *     <div>
 *       {loading() ? 'Loading...' : data()?.title}
 *       <button onClick={() => set({ title: 'New Title' })}>Update</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useNexusDocument<T = unknown>(id: string): {
  data: () => T | undefined;
  set: (value: T) => Promise<void>;
  update: (path: string, value: unknown) => Promise<void>;
  loading: () => boolean;
  error: () => Error | null;
} {
  const app = getNexusApp();
  const doc = app.useDocument<T>(id);

  // State management (would integrate with @philjs/core signals in real impl)
  let currentData: T | undefined;
  let isLoading = true;
  let currentError: Error | null = null;
  const listeners = new Set<() => void>();

  // Subscribe to document changes
  doc.subscribe((value) => {
    currentData = value;
    isLoading = false;
    for (const listener of listeners) {
      listener();
    }
  });

  return {
    data: () => currentData,
    set: async (value: T) => {
      try {
        await doc.set(value);
      } catch (e) {
        currentError = e as Error;
      }
    },
    update: async (path: string, value: unknown) => {
      try {
        await doc.update(path, value);
      } catch (e) {
        currentError = e as Error;
      }
    },
    loading: () => isLoading,
    error: () => currentError,
  };
}

/**
 * Hook to use a Nexus collection with reactive updates
 *
 * @example
 * ```typescript
 * function NotesList() {
 *   const { items, add, remove, loading } = useNexusCollection<Note>('notes');
 *
 *   return (
 *     <ul>
 *       {items().map(note => (
 *         <li key={note.id}>
 *           {note.title}
 *           <button onClick={() => remove(note.id)}>Delete</button>
 *         </li>
 *       ))}
 *       <button onClick={() => add({ title: 'New Note' })}>Add</button>
 *     </ul>
 *   );
 * }
 * ```
 */
export function useNexusCollection<T extends { id?: string } = { id?: string }>(name: string): {
  items: () => T[];
  get: (id: string) => Promise<T | undefined>;
  add: (item: T) => Promise<string>;
  update: (id: string, updates: Partial<T>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  query: (filter: (item: T) => boolean) => Promise<T[]>;
  loading: () => boolean;
  error: () => Error | null;
} {
  const app = getNexusApp();
  const collection = app.useCollection<T>(name);

  let currentItems: T[] = [];
  let isLoading = true;
  let currentError: Error | null = null;

  collection.subscribe((items) => {
    currentItems = items;
    isLoading = false;
  });

  return {
    items: () => currentItems,
    get: (id: string) => collection.get(id),
    add: async (item: T) => {
      try {
        return await collection.add(item);
      } catch (e) {
        currentError = e as Error;
        throw e;
      }
    },
    update: async (id: string, updates: Partial<T>) => {
      try {
        await collection.update(id, updates);
      } catch (e) {
        currentError = e as Error;
        throw e;
      }
    },
    remove: async (id: string) => {
      try {
        await collection.delete(id);
      } catch (e) {
        currentError = e as Error;
        throw e;
      }
    },
    query: (filter: (item: T) => boolean) => collection.query(filter),
    loading: () => isLoading,
    error: () => currentError,
  };
}

// ============================================================================
// AI Hooks
// ============================================================================

/**
 * Hook for AI text generation
 *
 * @example
 * ```typescript
 * function SummarizeButton({ text }: { text: string }) {
 *   const { generate, result, loading, error } = useNexusAI();
 *
 *   return (
 *     <div>
 *       <button
 *         onClick={() => generate(`Summarize: ${text}`)}
 *         disabled={loading()}
 *       >
 *         {loading() ? 'Generating...' : 'Summarize'}
 *       </button>
 *       {result() && <p>{result()}</p>}
 *       {error() && <p style="color: red">{error().message}</p>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useNexusAI(): {
  generate: (prompt: string, options?: { systemPrompt?: string; temperature?: number }) => Promise<string>;
  result: () => string | null;
  loading: () => boolean;
  error: () => Error | null;
  usage: () => { tokens: number; cost: number };
} {
  const app = getNexusApp();

  let currentResult: string | null = null;
  let isLoading = false;
  let currentError: Error | null = null;
  let currentUsage = { tokens: 0, cost: 0 };

  return {
    generate: async (prompt: string, options?) => {
      isLoading = true;
      currentError = null;

      try {
        const result = await app.generate(prompt, options);
        currentResult = result.content;
        currentUsage = {
          tokens: result.usage.totalTokens,
          cost: result.cost,
        };
        return result.content;
      } catch (e) {
        currentError = e as Error;
        throw e;
      } finally {
        isLoading = false;
      }
    },
    result: () => currentResult,
    loading: () => isLoading,
    error: () => currentError,
    usage: () => currentUsage,
  };
}

/**
 * Hook for streaming AI responses
 *
 * @example
 * ```typescript
 * function ChatMessage({ prompt }: { prompt: string }) {
 *   const { stream, content, loading } = useNexusAIStream();
 *
 *   useEffect(() => {
 *     stream(prompt);
 *   }, [prompt]);
 *
 *   return <div>{loading() ? '...' : content()}</div>;
 * }
 * ```
 */
export function useNexusAIStream(): {
  stream: (prompt: string) => Promise<void>;
  content: () => string;
  loading: () => boolean;
  error: () => Error | null;
} {
  const app = getNexusApp();

  let currentContent = '';
  let isLoading = false;
  let currentError: Error | null = null;

  return {
    stream: async (prompt: string) => {
      isLoading = true;
      currentContent = '';
      currentError = null;

      try {
        const generator = app.generateStream(prompt);

        for await (const chunk of generator) {
          currentContent += chunk;
        }
      } catch (e) {
        currentError = e as Error;
        throw e;
      } finally {
        isLoading = false;
      }
    },
    content: () => currentContent,
    loading: () => isLoading,
    error: () => currentError,
  };
}

// ============================================================================
// Collaboration Hooks
// ============================================================================

/**
 * Hook for real-time presence
 *
 * @example
 * ```typescript
 * function UserList() {
 *   const { users, updateCursor, setTyping } = useNexusPresence();
 *
 *   return (
 *     <div onMouseMove={(e) => updateCursor({ x: e.clientX, y: e.clientY })}>
 *       <ul>
 *         {users().map(user => (
 *           <li key={user.id} style={{ color: user.color }}>
 *             {user.name} {user.typing && '(typing...)'}
 *           </li>
 *         ))}
 *       </ul>
 *     </div>
 *   );
 * }
 * ```
 */
export function useNexusPresence(): {
  users: () => PresenceState[];
  updateCursor: (position: { x: number; y: number; documentId?: string }) => void;
  setTyping: (typing: boolean) => void;
} {
  const app = getNexusApp();

  let currentUsers: PresenceState[] = [];

  app.subscribe((event) => {
    if (event.type === 'presence-update') {
      currentUsers = event.users;
    }
  });

  return {
    users: () => currentUsers,
    updateCursor: (position) => {
      app.updateCursor({
        documentId: position.documentId || 'default',
        x: position.x,
        y: position.y,
      });
    },
    setTyping: (typing) => {
      app.setTyping(typing);
    },
  };
}

// ============================================================================
// Sync Hooks
// ============================================================================

/**
 * Hook for sync status
 *
 * @example
 * ```typescript
 * function SyncIndicator() {
 *   const { status, sync, isOnline } = useNexusSync();
 *
 *   return (
 *     <div>
 *       {!isOnline() && <span>Offline</span>}
 *       {status().state === 'syncing' && <span>Syncing...</span>}
 *       {status().pendingChanges > 0 && (
 *         <span>{status().pendingChanges} pending</span>
 *       )}
 *       <button onClick={sync}>Sync Now</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useNexusSync(): {
  status: () => SyncStatus;
  sync: () => Promise<void>;
  isOnline: () => boolean;
} {
  const app = getNexusApp();

  return {
    status: () => app.getSyncStatus(),
    sync: () => app.sync(),
    isOnline: () => app.getSyncStatus().isOnline,
  };
}

// ============================================================================
// Event Hook
// ============================================================================

/**
 * Hook for subscribing to Nexus events
 *
 * @example
 * ```typescript
 * function EventLogger() {
 *   useNexusEvents((event) => {
 *     console.log('Nexus event:', event);
 *   });
 *
 *   return null;
 * }
 * ```
 */
export function useNexusEvents(callback: (event: NexusEvent) => void): () => void {
  const app = getNexusApp();
  return app.subscribe(callback);
}
