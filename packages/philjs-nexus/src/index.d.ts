/**
 * @philjs/nexus
 *
 * The Nexus Architecture: Local-first, AI-native, Collaborative
 *
 * Nexus unifies three paradigms into one cohesive framework:
 * - Local-first: CRDT-backed data with offline support and sync
 * - AI-native: Integrated LLM capabilities with guardrails
 * - Collaborative: Real-time presence, cursors, and multiplayer
 *
 * @example
 * ```typescript
 * import { createNexusApp } from '@philjs/nexus';
 *
 * // Create a Nexus app with all features
 * const app = createNexusApp({
 *   local: { adapter: 'indexeddb' },
 *   remote: { adapter: 'supabase', url: process.env.SUPABASE_URL! },
 *   ai: { provider: 'anthropic', apiKey: process.env.ANTHROPIC_KEY! },
 *   collab: { presence: true, cursors: true },
 * });
 *
 * // Connect to services
 * await app.connect();
 *
 * // Use documents (CRDT-backed, auto-synced)
 * const doc = app.useDocument('my-doc');
 * await doc.set({ title: 'Hello', content: 'World' });
 *
 * // Use AI (with caching and cost tracking)
 * const summary = await app.generate('Summarize this document');
 *
 * // Use collaboration (real-time presence)
 * const users = app.getPresence();
 * app.updateCursor({ documentId: 'my-doc', x: 100, y: 200 });
 * ```
 *
 * @packageDocumentation
 */
export { NexusApp, createNexusApp } from './nexus-app.js';
export { initNexus, getNexusApp, useNexusDocument, useNexusCollection, useNexusAI, useNexusAIStream, useNexusPresence, useNexusSync, useNexusEvents, } from './hooks.js';
export { SyncEngine, createSyncEngine, IndexedDBAdapter, MemoryAdapter, SupabaseSyncAdapter, type StorageAdapter, type RemoteSyncAdapter, type SyncChange, type SyncResult, type PendingChange, type SyncEngineConfig, } from './sync/index.js';
export type { NexusConfig, LocalConfig, RemoteConfig, RemoteAuthConfig, AIConfig, CollabConfig, CollabUser, DebugConfig, SyncStatus, SyncEvent, SyncEventListener, ConflictResolver, ConflictMetadata, NexusDocument, NexusCollection, AIGenerateOptions, AIGenerateResult, AIStreamChunk, PresenceState, CursorPosition, SelectionRange, NexusEvent, NexusEventListener, } from './types.js';
//# sourceMappingURL=index.d.ts.map