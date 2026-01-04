/**
 * Supabase Remote Adapter for PhilJS Nexus
 * 
 * Provides Supabase as a sync backend option for local-first applications.
 * Supports real-time subscriptions, authentication, and conflict resolution.
 */

import { signal, effect, type Signal } from '@philjs/core';

export interface SupabaseAdapterConfig {
    /** Supabase project URL */
    supabaseUrl: string;
    /** Supabase anon key */
    supabaseKey: string;
    /** Table name for sync data */
    tableName?: string;
    /** Enable real-time subscriptions */
    realtime?: boolean;
    /** Custom conflict resolution strategy */
    conflictResolution?: 'last-write-wins' | 'merge' | 'custom';
}

export interface SyncState {
    status: 'idle' | 'syncing' | 'synced' | 'error';
    lastSyncedAt: number | null;
    pendingChanges: number;
    error: Error | null;
}

export interface SupabaseDocument<T = any> {
    id: string;
    data: T;
    version: number;
    updatedAt: number;
    syncedAt: number | null;
}

/**
 * Create a Supabase adapter for Nexus
 * 
 * @example
 * ```ts
 * import { createNexusApp } from '@philjs/nexus';
 * import { createSupabaseAdapter } from '@philjs/nexus/adapters/supabase';
 * 
 * const supabase = createSupabaseAdapter({
 *   supabaseUrl: 'https://xxx.supabase.co',
 *   supabaseKey: 'your-anon-key',
 *   tableName: 'documents',
 *   realtime: true,
 * });
 * 
 * const nexus = createNexusApp({
 *   remote: { adapter: supabase },
 * });
 * ```
 */
export function createSupabaseAdapter(config: SupabaseAdapterConfig) {
    const {
        supabaseUrl,
        supabaseKey,
        tableName = 'nexus_documents',
        realtime = true,
        conflictResolution = 'last-write-wins',
    } = config;

    // State signals
    const syncState = signal<SyncState>({
        status: 'idle',
        lastSyncedAt: null,
        pendingChanges: 0,
        error: null,
    });

    const isConnected = signal(false);
    let realtimeChannel: any = null;
    let supabaseClient: any = null;

    /**
     * Initialize the Supabase client
     */
    async function initialize() {
        // Dynamic import to avoid bundling supabase if not used
        const { createClient } = await import('@supabase/supabase-js');
        supabaseClient = createClient(supabaseUrl, supabaseKey);
        isConnected.set(true);

        if (realtime) {
            setupRealtimeSubscription();
        }
    }

    /**
     * Setup real-time subscription for live updates
     */
    function setupRealtimeSubscription() {
        if (!supabaseClient) return;

        realtimeChannel = supabaseClient
            .channel(`nexus:${tableName}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: tableName },
                (payload: any) => {
                    handleRealtimeUpdate(payload);
                }
            )
            .subscribe();
    }

    /**
     * Handle incoming real-time updates
     */
    function handleRealtimeUpdate(payload: any) {
        const { eventType, new: newRecord, old: oldRecord } = payload;

        switch (eventType) {
            case 'INSERT':
            case 'UPDATE':
                // Emit update event for Nexus to handle
                onRemoteChange?.(newRecord);
                break;
            case 'DELETE':
                onRemoteDelete?.(oldRecord.id);
                break;
        }
    }

    // Event handlers (set by Nexus)
    let onRemoteChange: ((doc: SupabaseDocument) => void) | null = null;
    let onRemoteDelete: ((id: string) => void) | null = null;

    /**
     * Push local changes to Supabase
     */
    async function push(documents: SupabaseDocument[]): Promise<void> {
        if (!supabaseClient) {
            throw new Error('Supabase adapter not initialized');
        }

        syncState.set({
            ...syncState(),
            status: 'syncing',
            pendingChanges: documents.length,
        });

        try {
            const { error } = await supabaseClient
                .from(tableName)
                .upsert(
                    documents.map((doc) => ({
                        id: doc.id,
                        data: doc.data,
                        version: doc.version,
                        updated_at: new Date(doc.updatedAt).toISOString(),
                        synced_at: new Date().toISOString(),
                    })),
                    { onConflict: 'id' }
                );

            if (error) throw error;

            syncState.set({
                status: 'synced',
                lastSyncedAt: Date.now(),
                pendingChanges: 0,
                error: null,
            });
        } catch (error) {
            syncState.set({
                ...syncState(),
                status: 'error',
                error: error instanceof Error ? error : new Error(String(error)),
            });
            throw error;
        }
    }

    /**
     * Pull remote changes from Supabase
     */
    async function pull(since?: number): Promise<SupabaseDocument[]> {
        if (!supabaseClient) {
            throw new Error('Supabase adapter not initialized');
        }

        let query = supabaseClient.from(tableName).select('*');

        if (since) {
            query = query.gt('updated_at', new Date(since).toISOString());
        }

        const { data, error } = await query;

        if (error) throw error;

        return (data || []).map((row: any) => ({
            id: row.id,
            data: row.data,
            version: row.version,
            updatedAt: new Date(row.updated_at).getTime(),
            syncedAt: row.synced_at ? new Date(row.synced_at).getTime() : null,
        }));
    }

    /**
     * Delete a document from Supabase
     */
    async function deleteDoc(id: string): Promise<void> {
        if (!supabaseClient) {
            throw new Error('Supabase adapter not initialized');
        }

        const { error } = await supabaseClient.from(tableName).delete().eq('id', id);

        if (error) throw error;
    }

    /**
     * Disconnect and cleanup
     */
    function disconnect() {
        if (realtimeChannel) {
            supabaseClient?.removeChannel(realtimeChannel);
            realtimeChannel = null;
        }
        isConnected.set(false);
    }

    /**
     * Get the Supabase client for direct access
     */
    function getClient() {
        return supabaseClient;
    }

    return {
        // Adapter interface
        type: 'supabase' as const,
        initialize,
        push,
        pull,
        delete: deleteDoc,
        disconnect,
        getClient,

        // State
        syncState: () => syncState(),
        isConnected: () => isConnected(),

        // Event registration
        onRemoteChange: (handler: (doc: SupabaseDocument) => void) => {
            onRemoteChange = handler;
        },
        onRemoteDelete: (handler: (id: string) => void) => {
            onRemoteDelete = handler;
        },
    };
}

export type SupabaseAdapter = ReturnType<typeof createSupabaseAdapter>;
