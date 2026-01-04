/**
 * Supabase Realtime integration for PhilJS Nexus
 * 
 * Provides presence and broadcast channels for collaborative features.
 */

import { signal, effect, type Signal } from '@philjs/core';

export interface RealtimeConfig {
    supabaseUrl: string;
    supabaseKey: string;
}

export interface PresenceState {
    [key: string]: {
        id: string;
        info: Record<string, any>;
        onlineAt: string;
    }[];
}

/**
 * Create Supabase Realtime integration for presence and broadcast
 * 
 * @example
 * ```ts
 * const realtime = createSupabaseRealtime({
 *   supabaseUrl: 'https://xxx.supabase.co',
 *   supabaseKey: 'your-anon-key',
 * });
 * 
 * await realtime.initialize();
 * 
 * // Join a room
 * const room = realtime.joinRoom('document:123');
 * 
 * // Track presence
 * room.trackPresence({ name: 'Alice', cursor: { x: 100, y: 200 } });
 * 
 * // Listen for presence updates
 * effect(() => {
 *   const users = room.presence();
 *   console.log('Online users:', users);
 * });
 * ```
 */
export function createSupabaseRealtime(config: RealtimeConfig) {
    const { supabaseUrl, supabaseKey } = config;

    let supabaseClient: any = null;
    const rooms = new Map<string, RealtimeRoom>();

    async function initialize() {
        const { createClient } = await import('@supabase/supabase-js');
        supabaseClient = createClient(supabaseUrl, supabaseKey);
    }

    function joinRoom(roomName: string): RealtimeRoom {
        if (rooms.has(roomName)) {
            return rooms.get(roomName)!;
        }

        const room = createRealtimeRoom(supabaseClient, roomName);
        rooms.set(roomName, room);
        return room;
    }

    function leaveRoom(roomName: string) {
        const room = rooms.get(roomName);
        if (room) {
            room.leave();
            rooms.delete(roomName);
        }
    }

    function leaveAll() {
        rooms.forEach((room) => room.leave());
        rooms.clear();
    }

    return {
        initialize,
        joinRoom,
        leaveRoom,
        leaveAll,
    };
}

interface RealtimeRoom {
    presence: () => PresenceState;
    trackPresence: (info: Record<string, any>) => void;
    broadcast: (event: string, payload: any) => void;
    onBroadcast: (event: string, handler: (payload: any) => void) => () => void;
    leave: () => void;
}

function createRealtimeRoom(client: any, roomName: string): RealtimeRoom {
    const presence = signal<PresenceState>({});
    const broadcastHandlers = new Map<string, Set<(payload: any) => void>>();

    const channel = client.channel(roomName)
        .on('presence', { event: 'sync' }, () => {
            presence.set(channel.presenceState());
        })
        .on('broadcast', { event: '*' }, (payload: any) => {
            const handlers = broadcastHandlers.get(payload.event);
            handlers?.forEach((handler) => handler(payload.payload));
        })
        .subscribe();

    function trackPresence(info: Record<string, any>) {
        channel.track(info);
    }

    function broadcast(event: string, payload: any) {
        channel.send({
            type: 'broadcast',
            event,
            payload,
        });
    }

    function onBroadcast(event: string, handler: (payload: any) => void) {
        if (!broadcastHandlers.has(event)) {
            broadcastHandlers.set(event, new Set());
        }
        broadcastHandlers.get(event)!.add(handler);

        return () => {
            broadcastHandlers.get(event)?.delete(handler);
        };
    }

    function leave() {
        client.removeChannel(channel);
        broadcastHandlers.clear();
    }

    return {
        presence: () => presence(),
        trackPresence,
        broadcast,
        onBroadcast,
        leave,
    };
}

export type SupabaseRealtime = ReturnType<typeof createSupabaseRealtime>;
