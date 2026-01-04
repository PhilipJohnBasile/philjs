/**
 * @philjs/nexus - Hooks
 *
 * React-style hooks for Nexus features, integrated with PhilJS signals
 */
import type { NexusConfig, SyncStatus, PresenceState, NexusEvent } from './types.js';
import { NexusApp } from './nexus-app.js';
/**
 * Initialize the global Nexus app
 */
export declare function initNexus(config: NexusConfig): NexusApp;
/**
 * Get the global Nexus app instance
 */
export declare function getNexusApp(): NexusApp;
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
export declare function useNexusDocument<T = unknown>(id: string): {
    data: () => T | undefined;
    set: (value: T) => Promise<void>;
    update: (path: string, value: unknown) => Promise<void>;
    loading: () => boolean;
    error: () => Error | null;
};
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
export declare function useNexusCollection<T extends {
    id?: string;
} = {
    id?: string;
}>(name: string): {
    items: () => T[];
    get: (id: string) => Promise<T | undefined>;
    add: (item: T) => Promise<string>;
    update: (id: string, updates: Partial<T>) => Promise<void>;
    remove: (id: string) => Promise<void>;
    query: (filter: (item: T) => boolean) => Promise<T[]>;
    loading: () => boolean;
    error: () => Error | null;
};
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
export declare function useNexusAI(): {
    generate: (prompt: string, options?: {
        systemPrompt?: string;
        temperature?: number;
    }) => Promise<string>;
    result: () => string | null;
    loading: () => boolean;
    error: () => Error | null;
    usage: () => {
        tokens: number;
        cost: number;
    };
};
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
export declare function useNexusAIStream(): {
    stream: (prompt: string) => Promise<void>;
    content: () => string;
    loading: () => boolean;
    error: () => Error | null;
};
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
export declare function useNexusPresence(): {
    users: () => PresenceState[];
    updateCursor: (position: {
        x: number;
        y: number;
        documentId?: string;
    }) => void;
    setTyping: (typing: boolean) => void;
};
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
export declare function useNexusSync(): {
    status: () => SyncStatus;
    sync: () => Promise<void>;
    isOnline: () => boolean;
};
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
export declare function useNexusEvents(callback: (event: NexusEvent) => void): () => void;
//# sourceMappingURL=hooks.d.ts.map