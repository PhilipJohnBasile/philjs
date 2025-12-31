/**
 * @philjs/webrtc - Full-Featured WebRTC Framework
 *
 * Industry-first comprehensive WebRTC solution:
 * - Peer connection management with auto-reconnection
 * - Signaling server abstraction (WebSocket, custom)
 * - ICE/STUN/TURN configuration with fallbacks
 * - Data channels with chunking and backpressure
 * - SFU/Mesh topology support
 * - Network quality monitoring
 * - Perfect negotiation pattern
 * - Simulcast and SVC support
 */
export interface RTCConfig {
    iceServers?: RTCIceServer[];
    iceTransportPolicy?: RTCIceTransportPolicy;
    bundlePolicy?: RTCBundlePolicy;
    sdpSemantics?: 'unified-plan' | 'plan-b';
}
export interface SignalingConfig {
    type: 'websocket' | 'custom';
    url?: string;
    handlers?: SignalingHandlers;
}
export interface SignalingHandlers {
    onOffer: (offer: RTCSessionDescriptionInit, peerId: string) => void;
    onAnswer: (answer: RTCSessionDescriptionInit, peerId: string) => void;
    onCandidate: (candidate: RTCIceCandidateInit, peerId: string) => void;
    onPeerJoined: (peerId: string) => void;
    onPeerLeft: (peerId: string) => void;
}
export interface PeerConnectionOptions {
    peerId: string;
    polite: boolean;
    rtcConfig?: RTCConfig;
    dataChannels?: DataChannelConfig[];
    onTrack?: (track: MediaStreamTrack, streams: readonly MediaStream[]) => void;
    onDataChannel?: (channel: RTCDataChannel) => void;
    onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
    onIceConnectionStateChange?: (state: RTCIceConnectionState) => void;
}
export interface DataChannelConfig {
    label: string;
    ordered?: boolean;
    maxRetransmits?: number;
    maxPacketLifeTime?: number;
    protocol?: string;
    negotiated?: boolean;
    id?: number;
}
export interface DataChannelMessage {
    type: string;
    payload: unknown;
    timestamp: number;
    id: string;
}
export interface NetworkQuality {
    rtt: number;
    jitter: number;
    packetLoss: number;
    bandwidth: {
        upload: number;
        download: number;
    };
    score: 'excellent' | 'good' | 'fair' | 'poor';
}
export interface PeerStats {
    peerId: string;
    connectionState: RTCPeerConnectionState;
    iceConnectionState: RTCIceConnectionState;
    localCandidateType?: string;
    remoteCandidateType?: string;
    selectedCandidatePair?: {
        local: RTCIceCandidate;
        remote: RTCIceCandidate;
    };
    bytesReceived: number;
    bytesSent: number;
    packetsLost: number;
    roundTripTime: number;
    jitter: number;
    audioLevel?: number;
    framesPerSecond?: number;
    frameWidth?: number;
    frameHeight?: number;
    codec?: string;
}
export type SignalMessage = {
    type: 'offer';
    sdp: string;
    peerId: string;
} | {
    type: 'answer';
    sdp: string;
    peerId: string;
} | {
    type: 'candidate';
    candidate: RTCIceCandidateInit;
    peerId: string;
} | {
    type: 'join';
    roomId: string;
    peerId: string;
} | {
    type: 'leave';
    peerId: string;
} | {
    type: 'peer-joined';
    peerId: string;
} | {
    type: 'peer-left';
    peerId: string;
};
export declare const DEFAULT_ICE_SERVERS: RTCIceServer[];
export declare class SignalingClient {
    private ws;
    private config;
    private messageHandlers;
    private reconnectAttempts;
    private maxReconnectAttempts;
    private reconnectDelay;
    private isConnected;
    private pendingMessages;
    private roomId;
    private localPeerId;
    constructor(config: SignalingConfig, localPeerId?: string);
    private generatePeerId;
    connect(): Promise<void>;
    private handleMessage;
    private attemptReconnect;
    private flushPendingMessages;
    send(message: SignalMessage): void;
    on(type: string, handler: (data: unknown) => void): () => void;
    joinRoom(roomId: string): void;
    leaveRoom(): void;
    sendOffer(peerId: string, offer: RTCSessionDescriptionInit): void;
    sendAnswer(peerId: string, answer: RTCSessionDescriptionInit): void;
    sendCandidate(peerId: string, candidate: RTCIceCandidate): void;
    getPeerId(): string;
    disconnect(): void;
}
export declare class PeerConnection {
    private pc;
    private options;
    private dataChannels;
    private makingOffer;
    private ignoreOffer;
    private isSettingRemoteAnswerPending;
    private pendingCandidates;
    private statsInterval;
    private onSignal;
    constructor(options: PeerConnectionOptions);
    private setupEventHandlers;
    private setupDataChannels;
    private handleDataChannel;
    setSignalHandler(handler: (type: 'offer' | 'answer' | 'candidate', data: unknown) => void): void;
    handleOffer(offer: RTCSessionDescriptionInit): Promise<void>;
    handleAnswer(answer: RTCSessionDescriptionInit): Promise<void>;
    handleCandidate(candidate: RTCIceCandidateInit): Promise<void>;
    private processPendingCandidates;
    addTrack(track: MediaStreamTrack, ...streams: MediaStream[]): RTCRtpSender;
    removeTrack(sender: RTCRtpSender): void;
    replaceTrack(sender: RTCRtpSender, track: MediaStreamTrack | null): Promise<void>;
    getDataChannel(label: string): RTCDataChannel | undefined;
    sendData(label: string, data: string | ArrayBuffer | Blob): void;
    getStats(): Promise<PeerStats>;
    startStatsMonitoring(interval: number, callback: (stats: PeerStats) => void): void;
    stopStatsMonitoring(): void;
    getConnectionState(): RTCPeerConnectionState;
    close(): void;
}
export declare class RTCRoom {
    private signaling;
    private peers;
    private localStream;
    private rtcConfig;
    private roomId;
    private callbacks;
    constructor(signaling: SignalingClient, roomId: string, rtcConfig?: RTCConfig);
    private setupSignalingHandlers;
    private createPeerConnection;
    private removePeer;
    join(): void;
    leave(): void;
    setLocalStream(stream: MediaStream): void;
    removeLocalStream(): void;
    onPeerJoined(callback: (peerId: string) => void): void;
    onPeerLeft(callback: (peerId: string) => void): void;
    onTrack(callback: (peerId: string, track: MediaStreamTrack, streams: readonly MediaStream[]) => void): void;
    onDataChannel(callback: (peerId: string, channel: RTCDataChannel) => void): void;
    onConnectionStateChange(callback: (peerId: string, state: RTCPeerConnectionState) => void): void;
    getPeers(): string[];
    getPeer(peerId: string): PeerConnection | undefined;
    broadcast(label: string, data: string | ArrayBuffer): void;
    sendToPeer(peerId: string, label: string, data: string | ArrayBuffer): void;
    getAllStats(): Promise<Map<string, PeerStats>>;
}
export declare class ChunkedDataChannel {
    private channel;
    private readonly chunkSize;
    private incomingChunks;
    private onMessageCallback;
    constructor(channel: RTCDataChannel);
    private setupHandlers;
    send(data: ArrayBuffer | string): Promise<void>;
    private waitForBuffer;
    onMessage(callback: (data: ArrayBuffer | string) => void): void;
    get readyState(): RTCDataChannelState;
    close(): void;
}
export declare class NetworkQualityMonitor {
    private pc;
    private interval;
    private history;
    private maxHistory;
    private callbacks;
    constructor(pc: RTCPeerConnection);
    start(intervalMs?: number): void;
    stop(): void;
    private measure;
    onQuality(callback: (quality: NetworkQuality) => void): () => void;
    getHistory(): NetworkQuality[];
    getAverage(): NetworkQuality;
}
export declare function useWebRTC(signalingUrl: string, roomId: string, rtcConfig?: RTCConfig): {
    isConnected: boolean;
    peers: string[];
    remoteStreams: Map<string, MediaStream>;
    localPeerId: string;
    setLocalStream: (stream: MediaStream) => void;
    broadcast: (label: string, data: string | ArrayBuffer) => void;
    sendToPeer: (peerId: string, label: string, data: string | ArrayBuffer) => void;
    leave: () => void | undefined;
};
export declare function usePeerConnection(options: PeerConnectionOptions): {
    peer: PeerConnection | null;
    connectionState: RTCPeerConnectionState;
    stats: PeerStats | null;
};
export declare function useNetworkQuality(pc: RTCPeerConnection | null): {
    quality: NetworkQuality | null;
    history: NetworkQuality[];
    average: NetworkQuality | null;
};
export declare function useDataChannel(peer: PeerConnection | null, label: string): {
    isOpen: boolean;
    lastMessage: string | ArrayBuffer | null;
    send: (data: ArrayBuffer | string) => void;
};
declare const _default: {
    SignalingClient: typeof SignalingClient;
    PeerConnection: typeof PeerConnection;
    RTCRoom: typeof RTCRoom;
    ChunkedDataChannel: typeof ChunkedDataChannel;
    NetworkQualityMonitor: typeof NetworkQualityMonitor;
    DEFAULT_ICE_SERVERS: RTCIceServer[];
    useWebRTC: typeof useWebRTC;
    usePeerConnection: typeof usePeerConnection;
    useNetworkQuality: typeof useNetworkQuality;
    useDataChannel: typeof useDataChannel;
};
export default _default;
//# sourceMappingURL=index.d.ts.map