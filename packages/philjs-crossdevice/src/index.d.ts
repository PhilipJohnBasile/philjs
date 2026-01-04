/**
 * @philjs/crossdevice - Cross-Device State Synchronization
 *
 * Seamless state sync across all your devices:
 * - Real-time sync between phone, tablet, desktop
 * - Offline-first with automatic conflict resolution
 * - Secure end-to-end encryption
 * - Selective state sharing
 * - Device presence and handoff
 * - QR code pairing
 * - Works without cloud (P2P optional)
 *
 * LIKE APPLE CONTINUITY, BUT FOR YOUR APP STATE.
 */
export interface CrossDeviceConfig {
    /** Sync server URL (optional - can work P2P) */
    serverUrl?: string;
    /** Enable P2P sync (WebRTC) */
    enableP2P?: boolean;
    /** Enable end-to-end encryption */
    encryption?: boolean;
    /** Encryption key (auto-generated if not provided) */
    encryptionKey?: string;
    /** Device identifier */
    deviceId?: string;
    /** Device name */
    deviceName?: string;
    /** Sync interval in ms (for polling fallback) */
    syncInterval?: number;
    /** State keys to sync (empty = all) */
    syncKeys?: string[];
    /** Conflict resolution strategy */
    conflictResolution?: 'last-write-wins' | 'first-write-wins' | 'merge' | 'custom';
}
export interface Device {
    id: string;
    name: string;
    type: 'phone' | 'tablet' | 'desktop' | 'watch' | 'tv' | 'unknown';
    platform: 'ios' | 'android' | 'windows' | 'macos' | 'linux' | 'web' | 'unknown';
    lastSeen: number;
    isOnline: boolean;
    isPrimary: boolean;
}
export interface SyncState {
    version: number;
    timestamp: number;
    deviceId: string;
    data: Record<string, unknown>;
    checksum: string;
}
export interface SyncConflict {
    key: string;
    localValue: unknown;
    remoteValue: unknown;
    localTimestamp: number;
    remoteTimestamp: number;
    localDevice: string;
    remoteDevice: string;
}
export interface HandoffData {
    type: string;
    data: unknown;
    sourceDevice: string;
    timestamp: number;
}
export interface PairingInfo {
    code: string;
    expiresAt: number;
    deviceId: string;
}
declare function detectDevice(): Partial<Device>;
declare function generateDeviceId(): string;
export declare class CrossDeviceSync {
    private config;
    private encryption;
    private localDevice;
    private devices;
    private localState;
    private stateGetters;
    private stateSetters;
    private subscribers;
    private conflictHandlers;
    private handoffHandlers;
    private ws;
    private peerConnections;
    private dataChannels;
    private syncIntervalId;
    constructor(config?: CrossDeviceConfig);
    init(): Promise<void>;
    registerState<T>(key: string, getter: () => T, setter: (value: T) => void): () => void;
    sync(): Promise<void>;
    private broadcastState;
    private receiveState;
    private resolveConflict;
    private mergeValues;
    private applyState;
    getDevices(): Device[];
    getLocalDevice(): Device;
    getOnlineDevices(): Device[];
    generatePairingCode(): Promise<PairingInfo>;
    pairWithCode(code: string): Promise<boolean>;
    generateQRCode(): string;
    initiateHandoff(type: string, data: unknown): void;
    onHandoff(type: string, handler: (data: HandoffData) => void): () => void;
    private connectToServer;
    private updateDevices;
    private initiatePeerConnection;
    private handlePeerOffer;
    private handlePeerAnswer;
    private handleIceCandidate;
    private setupDataChannel;
    onDevicesChange(callback: (devices: Device[]) => void): () => void;
    onConflict(handler: (conflict: SyncConflict) => unknown): () => void;
    private notifySubscribers;
    private cacheState;
    private loadCachedState;
    private calculateChecksum;
    private deepEqual;
    destroy(): void;
}
export declare function initCrossDevice(config?: CrossDeviceConfig): Promise<CrossDeviceSync>;
export declare function getCrossDeviceSync(): CrossDeviceSync | null;
export declare function useCrossDeviceState<T>(key: string, initialValue: T): [() => T, (value: T) => void];
export declare function useDevices(): Device[];
export declare function useHandoff(type: string, handler: (data: HandoffData) => void): void;
export declare function initiateHandoff(type: string, data: unknown): void;
export { detectDevice, generateDeviceId };
//# sourceMappingURL=index.d.ts.map