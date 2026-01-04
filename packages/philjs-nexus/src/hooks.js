/**
 * @philjs/nexus - Hooks
 *
 * React-style hooks for Nexus features, integrated with PhilJS signals
 */
import { NexusApp, createNexusApp } from './nexus-app.js';
// ============================================================================
// Global App Instance Management
// ============================================================================
let globalApp = null;
/**
 * Initialize the global Nexus app
 */
export function initNexus(config) {
    globalApp = createNexusApp(config);
    return globalApp;
}
/**
 * Get the global Nexus app instance
 */
export function getNexusApp() {
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
export function useNexusDocument(id) {
    const app = getNexusApp();
    const doc = app.useDocument(id);
    // State management (would integrate with @philjs/core signals in real impl)
    let currentData;
    let isLoading = true;
    let currentError = null;
    const listeners = new Set();
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
        set: async (value) => {
            try {
                await doc.set(value);
            }
            catch (e) {
                currentError = e;
            }
        },
        update: async (path, value) => {
            try {
                await doc.update(path, value);
            }
            catch (e) {
                currentError = e;
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
export function useNexusCollection(name) {
    const app = getNexusApp();
    const collection = app.useCollection(name);
    let currentItems = [];
    let isLoading = true;
    let currentError = null;
    collection.subscribe((items) => {
        currentItems = items;
        isLoading = false;
    });
    return {
        items: () => currentItems,
        get: (id) => collection.get(id),
        add: async (item) => {
            try {
                return await collection.add(item);
            }
            catch (e) {
                currentError = e;
                throw e;
            }
        },
        update: async (id, updates) => {
            try {
                await collection.update(id, updates);
            }
            catch (e) {
                currentError = e;
                throw e;
            }
        },
        remove: async (id) => {
            try {
                await collection.delete(id);
            }
            catch (e) {
                currentError = e;
                throw e;
            }
        },
        query: (filter) => collection.query(filter),
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
export function useNexusAI() {
    const app = getNexusApp();
    let currentResult = null;
    let isLoading = false;
    let currentError = null;
    let currentUsage = { tokens: 0, cost: 0 };
    return {
        generate: async (prompt, options) => {
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
            }
            catch (e) {
                currentError = e;
                throw e;
            }
            finally {
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
export function useNexusAIStream() {
    const app = getNexusApp();
    let currentContent = '';
    let isLoading = false;
    let currentError = null;
    return {
        stream: async (prompt) => {
            isLoading = true;
            currentContent = '';
            currentError = null;
            try {
                const generator = app.generateStream(prompt);
                for await (const chunk of generator) {
                    currentContent += chunk;
                }
            }
            catch (e) {
                currentError = e;
                throw e;
            }
            finally {
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
export function useNexusPresence() {
    const app = getNexusApp();
    let currentUsers = [];
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
export function useNexusSync() {
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
export function useNexusEvents(callback) {
    const app = getNexusApp();
    return app.subscribe(callback);
}
//# sourceMappingURL=hooks.js.map