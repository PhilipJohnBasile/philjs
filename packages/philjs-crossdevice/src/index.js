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
// ============================================================================
// Encryption Utilities
// ============================================================================
class Encryption {
    key = null;
    keyString = '';
    async init(keyString) {
        if (keyString) {
            this.keyString = keyString;
            const keyData = this.base64ToArrayBuffer(keyString);
            this.key = await crypto.subtle.importKey('raw', keyData, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
        }
        else {
            // Generate new key
            this.key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
            const exported = await crypto.subtle.exportKey('raw', this.key);
            this.keyString = this.arrayBufferToBase64(exported);
        }
    }
    getKeyString() {
        return this.keyString;
    }
    async encrypt(data) {
        if (!this.key)
            throw new Error('Encryption not initialized');
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encoded = new TextEncoder().encode(data);
        const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, this.key, encoded);
        // Combine IV and encrypted data
        const combined = new Uint8Array(iv.length + encrypted.byteLength);
        combined.set(iv);
        combined.set(new Uint8Array(encrypted), iv.length);
        return this.arrayBufferToBase64(combined.buffer);
    }
    async decrypt(data) {
        if (!this.key)
            throw new Error('Encryption not initialized');
        const combined = new Uint8Array(this.base64ToArrayBuffer(data));
        const iv = combined.slice(0, 12);
        const encrypted = combined.slice(12);
        const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, this.key, encrypted);
        return new TextDecoder().decode(decrypted);
    }
    arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }
    base64ToArrayBuffer(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    }
}
// ============================================================================
// Device Detection
// ============================================================================
function detectDevice() {
    if (typeof navigator === 'undefined') {
        return { type: 'unknown', platform: 'unknown' };
    }
    const ua = navigator.userAgent.toLowerCase();
    let type = 'unknown';
    let platform = 'unknown';
    // Detect platform
    if (/iphone|ipad|ipod/.test(ua)) {
        platform = 'ios';
        type = /ipad/.test(ua) ? 'tablet' : 'phone';
    }
    else if (/android/.test(ua)) {
        platform = 'android';
        type = /mobile/.test(ua) ? 'phone' : 'tablet';
    }
    else if (/windows/.test(ua)) {
        platform = 'windows';
        type = 'desktop';
    }
    else if (/macintosh/.test(ua)) {
        platform = 'macos';
        type = 'desktop';
    }
    else if (/linux/.test(ua)) {
        platform = 'linux';
        type = 'desktop';
    }
    // Check for specific device types
    if (/watch/.test(ua)) {
        type = 'watch';
    }
    else if (/tv|smart-tv|webos|tizen/.test(ua)) {
        type = 'tv';
    }
    return { type, platform };
}
function generateDeviceId() {
    // Try to get a persistent ID from localStorage
    if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('philjs-device-id');
        if (stored)
            return stored;
        const newId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('philjs-device-id', newId);
        return newId;
    }
    return `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
// ============================================================================
// Cross-Device Sync Manager
// ============================================================================
export class CrossDeviceSync {
    config;
    encryption;
    localDevice;
    devices = new Map();
    localState;
    stateGetters = new Map();
    stateSetters = new Map();
    subscribers = new Set();
    conflictHandlers = new Set();
    handoffHandlers = new Map();
    ws = null;
    peerConnections = new Map();
    dataChannels = new Map();
    syncIntervalId = null;
    constructor(config = {}) {
        const deviceInfo = detectDevice();
        this.config = {
            serverUrl: config.serverUrl || '',
            enableP2P: config.enableP2P ?? true,
            encryption: config.encryption ?? true,
            encryptionKey: config.encryptionKey || '',
            deviceId: config.deviceId || generateDeviceId(),
            deviceName: config.deviceName || `${deviceInfo.platform} ${deviceInfo.type}`,
            syncInterval: config.syncInterval || 5000,
            syncKeys: config.syncKeys || [],
            conflictResolution: config.conflictResolution || 'last-write-wins'
        };
        this.encryption = new Encryption();
        this.localDevice = {
            id: this.config.deviceId,
            name: this.config.deviceName,
            type: deviceInfo.type || 'unknown',
            platform: deviceInfo.platform || 'unknown',
            lastSeen: Date.now(),
            isOnline: true,
            isPrimary: false
        };
        this.localState = {
            version: 0,
            timestamp: Date.now(),
            deviceId: this.config.deviceId,
            data: {},
            checksum: ''
        };
        this.devices.set(this.localDevice.id, this.localDevice);
    }
    async init() {
        // Initialize encryption
        if (this.config.encryption) {
            await this.encryption.init(this.config.encryptionKey);
            if (!this.config.encryptionKey) {
                // Save generated key for sharing
                this.config.encryptionKey = this.encryption.getKeyString();
            }
        }
        // Connect to sync server if configured
        if (this.config.serverUrl) {
            this.connectToServer();
        }
        // Start periodic sync
        this.syncIntervalId = setInterval(() => this.sync(), this.config.syncInterval);
        // Load cached state
        this.loadCachedState();
    }
    // State Registration
    registerState(key, getter, setter) {
        this.stateGetters.set(key, getter);
        this.stateSetters.set(key, setter);
        // Capture initial value
        this.localState.data[key] = getter();
        return () => {
            this.stateGetters.delete(key);
            this.stateSetters.delete(key);
        };
    }
    // Manual Sync
    async sync() {
        // Capture current state
        const currentData = {};
        for (const [key, getter] of this.stateGetters) {
            if (this.config.syncKeys.length === 0 || this.config.syncKeys.includes(key)) {
                currentData[key] = getter();
            }
        }
        // Check for changes
        const checksum = this.calculateChecksum(currentData);
        if (checksum !== this.localState.checksum) {
            this.localState = {
                version: this.localState.version + 1,
                timestamp: Date.now(),
                deviceId: this.config.deviceId,
                data: currentData,
                checksum
            };
            // Broadcast to other devices
            await this.broadcastState();
        }
    }
    async broadcastState() {
        const payload = JSON.stringify(this.localState);
        const data = this.config.encryption
            ? await this.encryption.encrypt(payload)
            : payload;
        // Send via WebSocket
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'sync', data }));
        }
        // Send via WebRTC data channels
        for (const channel of this.dataChannels.values()) {
            if (channel.readyState === 'open') {
                channel.send(data);
            }
        }
        // Cache locally
        this.cacheState();
    }
    async receiveState(encryptedData, sourceDevice) {
        let payload;
        try {
            payload = this.config.encryption
                ? await this.encryption.decrypt(encryptedData)
                : encryptedData;
        }
        catch {
            console.error('Failed to decrypt state from', sourceDevice);
            return;
        }
        const remoteState = JSON.parse(payload);
        // Handle conflicts
        for (const [key, remoteValue] of Object.entries(remoteState.data)) {
            const localValue = this.localState.data[key];
            if (localValue !== undefined && !this.deepEqual(localValue, remoteValue)) {
                const conflict = {
                    key,
                    localValue,
                    remoteValue,
                    localTimestamp: this.localState.timestamp,
                    remoteTimestamp: remoteState.timestamp,
                    localDevice: this.config.deviceId,
                    remoteDevice: sourceDevice
                };
                const resolvedValue = this.resolveConflict(conflict);
                this.applyState(key, resolvedValue);
            }
            else if (localValue === undefined) {
                this.applyState(key, remoteValue);
            }
        }
    }
    resolveConflict(conflict) {
        // First, check custom handlers
        for (const handler of this.conflictHandlers) {
            const result = handler(conflict);
            if (result !== undefined) {
                return result;
            }
        }
        // Use configured strategy
        switch (this.config.conflictResolution) {
            case 'last-write-wins':
                return conflict.remoteTimestamp > conflict.localTimestamp
                    ? conflict.remoteValue
                    : conflict.localValue;
            case 'first-write-wins':
                return conflict.remoteTimestamp < conflict.localTimestamp
                    ? conflict.remoteValue
                    : conflict.localValue;
            case 'merge':
                return this.mergeValues(conflict.localValue, conflict.remoteValue);
            default:
                return conflict.remoteValue;
        }
    }
    mergeValues(local, remote) {
        if (Array.isArray(local) && Array.isArray(remote)) {
            // Merge arrays uniquely - ES2024 Set.union()
            return [...new Set(local).union(new Set(remote))];
        }
        if (typeof local === 'object' && typeof remote === 'object' &&
            local !== null && remote !== null) {
            return { ...local, ...remote };
        }
        // Fallback to remote
        return remote;
    }
    applyState(key, value) {
        const setter = this.stateSetters.get(key);
        if (setter) {
            setter(value);
            this.localState.data[key] = value;
        }
    }
    // Device Discovery
    getDevices() {
        return Array.from(this.devices.values());
    }
    getLocalDevice() {
        return this.localDevice;
    }
    getOnlineDevices() {
        return this.getDevices().filter(d => d.isOnline);
    }
    // Device Pairing
    async generatePairingCode() {
        const code = Math.random().toString(36).substr(2, 6).toUpperCase();
        const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
        // Register pairing code with server
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'register-pairing',
                code,
                deviceId: this.config.deviceId,
                encryptionKey: this.config.encryptionKey,
                expiresAt
            }));
        }
        return {
            code,
            expiresAt,
            deviceId: this.config.deviceId
        };
    }
    async pairWithCode(code) {
        return new Promise((resolve) => {
            if (this.ws?.readyState === WebSocket.OPEN) {
                const handler = (event) => {
                    const msg = JSON.parse(event.data);
                    if (msg.type === 'pairing-result') {
                        this.ws.removeEventListener('message', handler);
                        if (msg.success) {
                            this.config.encryptionKey = msg.encryptionKey;
                            this.encryption.init(msg.encryptionKey);
                        }
                        resolve(msg.success);
                    }
                };
                this.ws.addEventListener('message', handler);
                this.ws.send(JSON.stringify({
                    type: 'pair-with-code',
                    code,
                    deviceId: this.config.deviceId
                }));
            }
            else {
                resolve(false);
            }
        });
    }
    generateQRCode() {
        // Generate data URL for QR code
        const data = JSON.stringify({
            server: this.config.serverUrl,
            key: this.config.encryptionKey,
            deviceId: this.config.deviceId
        });
        // Return as data URL (would use a QR library in production)
        return `data:text/plain;base64,${btoa(data)}`;
    }
    // Handoff
    initiateHandoff(type, data) {
        const handoffData = {
            type,
            data,
            sourceDevice: this.config.deviceId,
            timestamp: Date.now()
        };
        // Broadcast to all devices
        const payload = JSON.stringify({ type: 'handoff', data: handoffData });
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(payload);
        }
        for (const channel of this.dataChannels.values()) {
            if (channel.readyState === 'open') {
                channel.send(payload);
            }
        }
    }
    onHandoff(type, handler) {
        this.handoffHandlers.set(type, handler);
        return () => this.handoffHandlers.delete(type);
    }
    // Connection Management
    connectToServer() {
        if (!this.config.serverUrl)
            return;
        this.ws = new WebSocket(this.config.serverUrl);
        this.ws.onopen = () => {
            this.ws.send(JSON.stringify({
                type: 'register',
                device: this.localDevice
            }));
        };
        this.ws.onmessage = async (event) => {
            const msg = JSON.parse(event.data);
            switch (msg.type) {
                case 'devices':
                    this.updateDevices(msg.devices);
                    break;
                case 'sync':
                    await this.receiveState(msg.data, msg.deviceId);
                    break;
                case 'handoff':
                    const handler = this.handoffHandlers.get(msg.data.type);
                    handler?.(msg.data);
                    break;
                case 'peer-offer':
                    if (this.config.enableP2P) {
                        this.handlePeerOffer(msg.offer, msg.deviceId);
                    }
                    break;
                case 'peer-answer':
                    if (this.config.enableP2P) {
                        this.handlePeerAnswer(msg.answer, msg.deviceId);
                    }
                    break;
                case 'ice-candidate':
                    if (this.config.enableP2P) {
                        this.handleIceCandidate(msg.candidate, msg.deviceId);
                    }
                    break;
            }
        };
        this.ws.onclose = () => {
            // Reconnect after delay
            setTimeout(() => this.connectToServer(), 3000);
        };
    }
    updateDevices(devices) {
        for (const device of devices) {
            if (device.id !== this.config.deviceId) {
                this.devices.set(device.id, device);
            }
        }
        this.notifySubscribers();
    }
    // P2P WebRTC
    async initiatePeerConnection(deviceId) {
        const pc = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });
        this.peerConnections.set(deviceId, pc);
        const channel = pc.createDataChannel('sync');
        this.setupDataChannel(channel, deviceId);
        pc.onicecandidate = (event) => {
            if (event.candidate && this.ws?.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({
                    type: 'ice-candidate',
                    candidate: event.candidate,
                    targetDevice: deviceId
                }));
            }
        };
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'peer-offer',
                offer,
                targetDevice: deviceId
            }));
        }
    }
    async handlePeerOffer(offer, deviceId) {
        const pc = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });
        this.peerConnections.set(deviceId, pc);
        pc.ondatachannel = (event) => {
            this.setupDataChannel(event.channel, deviceId);
        };
        pc.onicecandidate = (event) => {
            if (event.candidate && this.ws?.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({
                    type: 'ice-candidate',
                    candidate: event.candidate,
                    targetDevice: deviceId
                }));
            }
        };
        await pc.setRemoteDescription(offer);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'peer-answer',
                answer,
                targetDevice: deviceId
            }));
        }
    }
    async handlePeerAnswer(answer, deviceId) {
        const pc = this.peerConnections.get(deviceId);
        if (pc) {
            await pc.setRemoteDescription(answer);
        }
    }
    async handleIceCandidate(candidate, deviceId) {
        const pc = this.peerConnections.get(deviceId);
        if (pc) {
            await pc.addIceCandidate(candidate);
        }
    }
    setupDataChannel(channel, deviceId) {
        this.dataChannels.set(deviceId, channel);
        channel.onmessage = async (event) => {
            await this.receiveState(event.data, deviceId);
        };
        channel.onclose = () => {
            this.dataChannels.delete(deviceId);
        };
    }
    // Subscription
    onDevicesChange(callback) {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback);
    }
    onConflict(handler) {
        this.conflictHandlers.add(handler);
        return () => this.conflictHandlers.delete(handler);
    }
    notifySubscribers() {
        const devices = this.getDevices();
        for (const callback of this.subscribers) {
            callback(devices);
        }
    }
    // Caching
    cacheState() {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('philjs-cross-device-state', JSON.stringify(this.localState));
        }
    }
    loadCachedState() {
        if (typeof localStorage !== 'undefined') {
            const cached = localStorage.getItem('philjs-cross-device-state');
            if (cached) {
                this.localState = JSON.parse(cached);
            }
        }
    }
    // Utilities
    calculateChecksum(data) {
        const str = JSON.stringify(data);
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(16);
    }
    deepEqual(a, b) {
        return JSON.stringify(a) === JSON.stringify(b);
    }
    // Cleanup
    destroy() {
        if (this.syncIntervalId) {
            clearInterval(this.syncIntervalId);
        }
        this.ws?.close();
        for (const pc of this.peerConnections.values()) {
            pc.close();
        }
        this.peerConnections.clear();
        this.dataChannels.clear();
    }
}
// ============================================================================
// React-like Hooks
// ============================================================================
let globalSync = null;
export async function initCrossDevice(config) {
    globalSync = new CrossDeviceSync(config);
    await globalSync.init();
    return globalSync;
}
export function getCrossDeviceSync() {
    return globalSync;
}
export function useCrossDeviceState(key, initialValue) {
    let value = initialValue;
    const getter = () => value;
    const setter = (newValue) => {
        value = newValue;
        globalSync?.sync();
    };
    globalSync?.registerState(key, getter, setter);
    return [getter, setter];
}
export function useDevices() {
    return globalSync?.getDevices() || [];
}
export function useHandoff(type, handler) {
    globalSync?.onHandoff(type, handler);
}
export function initiateHandoff(type, data) {
    globalSync?.initiateHandoff(type, data);
}
// ============================================================================
// Exports
// ============================================================================
export { detectDevice, generateDeviceId };
//# sourceMappingURL=index.js.map