/**
 * @philjs/nexus - NexusApp
 *
 * The unified entry point for local-first, AI-native, collaborative applications
 */
import type { NexusConfig, NexusDocument, NexusCollection, SyncStatus, PresenceState, CursorPosition, AIGenerateOptions, AIGenerateResult, NexusEventListener } from './types.js';
/**
 * NexusApp - The unified Nexus application container
 *
 * @example
 * ```typescript
 * const app = createNexusApp({
 *   local: { adapter: 'indexeddb' },
 *   remote: { adapter: 'supabase', url: 'https://...' },
 *   ai: { provider: 'anthropic', apiKey: '...' },
 *   collab: { presence: true, cursors: true },
 * });
 *
 * await app.connect();
 *
 * // Use documents
 * const doc = app.useDocument('my-doc');
 * doc.set({ title: 'Hello', content: 'World' });
 *
 * // Use AI
 * const result = await app.generate('Summarize this document');
 *
 * // Use collaboration
 * const users = app.getPresence();
 * ```
 */
export declare class NexusApp {
    private config;
    private syncEngine;
    private connected;
    private listeners;
    private presence;
    private collabWs;
    private localUser;
    private aiCache;
    private tokenUsage;
    constructor(config: NexusConfig);
    /**
     * Connect to all configured services
     */
    connect(): Promise<void>;
    /**
     * Disconnect from all services
     */
    disconnect(): Promise<void>;
    /**
     * Check if connected
     */
    isConnected(): boolean;
    /**
     * Get or create a document
     */
    useDocument<T = unknown>(id: string): NexusDocument<T>;
    /**
     * Get or create a collection
     */
    useCollection<T extends {
        id?: string;
    } = {
        id?: string;
    }>(name: string): NexusCollection<T>;
    /**
     * Generate content using AI
     */
    generate(prompt: string, options?: AIGenerateOptions): Promise<AIGenerateResult>;
    /**
     * Stream AI response
     */
    generateStream(prompt: string, options?: AIGenerateOptions): AsyncGenerator<string, AIGenerateResult>;
    /**
     * Get AI usage statistics
     */
    getAIUsage(): {
        totalTokens: number;
        totalCost: number;
    };
    /**
     * Get all online users
     */
    getPresence(): PresenceState[];
    /**
     * Update local cursor position
     */
    updateCursor(position: CursorPosition): void;
    /**
     * Set typing indicator
     */
    setTyping(typing: boolean): void;
    /**
     * Get current sync status
     */
    getSyncStatus(): SyncStatus;
    /**
     * Manually trigger a sync
     */
    sync(): Promise<void>;
    /**
     * Subscribe to Nexus events
     */
    subscribe(listener: NexusEventListener): () => void;
    private connectCollab;
    private handleCollabMessage;
    private callAI;
    private callAIStream;
    private parseAnthropicResponse;
    private parseOpenAIResponse;
    private estimateCost;
    private getCacheKey;
    private setPath;
    private notifyCollectionSubscribers;
    private generateId;
    private generateColor;
    private emit;
}
/**
 * Create a new Nexus application
 */
export declare function createNexusApp(config: NexusConfig): NexusApp;
//# sourceMappingURL=nexus-app.d.ts.map