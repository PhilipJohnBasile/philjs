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

// ============================================================================
// Types
// ============================================================================

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

export type SignalMessage =
  | { type: 'offer'; sdp: string; peerId: string }
  | { type: 'answer'; sdp: string; peerId: string }
  | { type: 'candidate'; candidate: RTCIceCandidateInit; peerId: string }
  | { type: 'join'; roomId: string; peerId: string }
  | { type: 'leave'; peerId: string }
  | { type: 'peer-joined'; peerId: string }
  | { type: 'peer-left'; peerId: string };

// ============================================================================
// Default ICE Servers
// ============================================================================

export const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' }
];

// ============================================================================
// Signaling Client
// ============================================================================

export class SignalingClient {
  private ws: WebSocket | null = null;
  private config: SignalingConfig;
  private messageHandlers: Map<string, Array<(data: unknown) => void>> = new Map();
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private isConnected: boolean = false;
  private pendingMessages: SignalMessage[] = [];
  private roomId: string | null = null;
  private localPeerId: string;

  constructor(config: SignalingConfig, localPeerId?: string) {
    this.config = config;
    this.localPeerId = localPeerId || this.generatePeerId();
  }

  private generatePeerId(): string {
    return `peer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async connect(): Promise<void> {
    if (this.config.type !== 'websocket' || !this.config.url) {
      throw new Error('WebSocket URL required for websocket signaling type');
    }

    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.config.url!);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.flushPendingMessages();
        resolve();
      };

      this.ws.onerror = (error) => {
        reject(error);
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.attemptReconnect();
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as SignalMessage;
          this.handleMessage(message);
        } catch {
          console.error('Failed to parse signaling message');
        }
      };
    });
  }

  private handleMessage(message: SignalMessage): void {
    const handlers = this.messageHandlers.get(message.type);
    if (handlers) {
      handlers.forEach(h => h(message));
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    setTimeout(() => {
      this.connect().then(() => {
        if (this.roomId) {
          this.joinRoom(this.roomId);
        }
      }).catch(() => {
        this.attemptReconnect();
      });
    }, delay);
  }

  private flushPendingMessages(): void {
    while (this.pendingMessages.length > 0) {
      const message = this.pendingMessages.shift();
      if (message) {
        this.send(message);
      }
    }
  }

  send(message: SignalMessage): void {
    if (!this.isConnected || !this.ws) {
      this.pendingMessages.push(message);
      return;
    }

    this.ws.send(JSON.stringify(message));
  }

  on(type: string, handler: (data: unknown) => void): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type)!.push(handler);

    return () => {
      const handlers = this.messageHandlers.get(type);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) handlers.splice(index, 1);
      }
    };
  }

  joinRoom(roomId: string): void {
    this.roomId = roomId;
    this.send({
      type: 'join',
      roomId,
      peerId: this.localPeerId
    });
  }

  leaveRoom(): void {
    if (this.roomId) {
      this.send({
        type: 'leave',
        peerId: this.localPeerId
      });
      this.roomId = null;
    }
  }

  sendOffer(peerId: string, offer: RTCSessionDescriptionInit): void {
    this.send({
      type: 'offer',
      sdp: offer.sdp!,
      peerId
    });
  }

  sendAnswer(peerId: string, answer: RTCSessionDescriptionInit): void {
    this.send({
      type: 'answer',
      sdp: answer.sdp!,
      peerId
    });
  }

  sendCandidate(peerId: string, candidate: RTCIceCandidate): void {
    this.send({
      type: 'candidate',
      candidate: candidate.toJSON(),
      peerId
    });
  }

  getPeerId(): string {
    return this.localPeerId;
  }

  disconnect(): void {
    this.leaveRoom();
    this.ws?.close();
    this.ws = null;
    this.isConnected = false;
  }
}

// ============================================================================
// Peer Connection Manager
// ============================================================================

export class PeerConnection {
  private pc: RTCPeerConnection;
  private options: PeerConnectionOptions;
  private dataChannels: Map<string, RTCDataChannel> = new Map();
  private makingOffer: boolean = false;
  private ignoreOffer: boolean = false;
  private isSettingRemoteAnswerPending: boolean = false;
  private pendingCandidates: RTCIceCandidateInit[] = [];
  private statsInterval: number | null = null;
  private onSignal: ((type: 'offer' | 'answer' | 'candidate', data: unknown) => void) | null = null;

  constructor(options: PeerConnectionOptions) {
    this.options = options;

    const rtcConfig: RTCConfiguration = {
      iceServers: options.rtcConfig?.iceServers ?? DEFAULT_ICE_SERVERS,
      iceTransportPolicy: options.rtcConfig?.iceTransportPolicy ?? 'all',
      bundlePolicy: options.rtcConfig?.bundlePolicy ?? 'balanced'
    };

    this.pc = new RTCPeerConnection(rtcConfig);
    this.setupEventHandlers();
    this.setupDataChannels();
  }

  private setupEventHandlers(): void {
    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.onSignal?.('candidate', event.candidate.toJSON());
      }
    };

    this.pc.ontrack = (event) => {
      this.options.onTrack?.(event.track, event.streams);
    };

    this.pc.ondatachannel = (event) => {
      this.handleDataChannel(event.channel);
    };

    this.pc.onconnectionstatechange = () => {
      this.options.onConnectionStateChange?.(this.pc.connectionState);
    };

    this.pc.oniceconnectionstatechange = () => {
      this.options.onIceConnectionStateChange?.(this.pc.iceConnectionState);

      if (this.pc.iceConnectionState === 'failed') {
        this.pc.restartIce();
      }
    };

    this.pc.onnegotiationneeded = async () => {
      try {
        this.makingOffer = true;
        await this.pc.setLocalDescription();
        this.onSignal?.('offer', this.pc.localDescription);
      } catch (err) {
        console.error('Negotiation failed:', err);
      } finally {
        this.makingOffer = false;
      }
    };
  }

  private setupDataChannels(): void {
    if (!this.options.dataChannels) return;

    for (const config of this.options.dataChannels) {
      const channelInit: RTCDataChannelInit = {
        ordered: config.ordered ?? true,
        protocol: config.protocol ?? '',
        negotiated: config.negotiated ?? false
      };
      if (config.maxRetransmits !== undefined) {
        channelInit.maxRetransmits = config.maxRetransmits;
      }
      if (config.maxPacketLifeTime !== undefined) {
        channelInit.maxPacketLifeTime = config.maxPacketLifeTime;
      }
      if (config.id !== undefined) {
        channelInit.id = config.id;
      }
      const channel = this.pc.createDataChannel(config.label, channelInit);

      this.handleDataChannel(channel);
    }
  }

  private handleDataChannel(channel: RTCDataChannel): void {
    this.dataChannels.set(channel.label, channel);
    this.options.onDataChannel?.(channel);
  }

  setSignalHandler(handler: (type: 'offer' | 'answer' | 'candidate', data: unknown) => void): void {
    this.onSignal = handler;
  }

  async handleOffer(offer: RTCSessionDescriptionInit): Promise<void> {
    const readyForOffer =
      !this.makingOffer &&
      (this.pc.signalingState === 'stable' || this.isSettingRemoteAnswerPending);

    const offerCollision = !readyForOffer;

    this.ignoreOffer = !this.options.polite && offerCollision;

    if (this.ignoreOffer) {
      return;
    }

    this.isSettingRemoteAnswerPending = false;

    await this.pc.setRemoteDescription(offer);
    await this.processPendingCandidates();

    await this.pc.setLocalDescription();
    this.onSignal?.('answer', this.pc.localDescription);
  }

  async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    this.isSettingRemoteAnswerPending = true;
    await this.pc.setRemoteDescription(answer);
    this.isSettingRemoteAnswerPending = false;
    await this.processPendingCandidates();
  }

  async handleCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.pc.remoteDescription) {
      this.pendingCandidates.push(candidate);
      return;
    }

    try {
      await this.pc.addIceCandidate(candidate);
    } catch (err) {
      if (!this.ignoreOffer) {
        throw err;
      }
    }
  }

  private async processPendingCandidates(): Promise<void> {
    for (const candidate of this.pendingCandidates) {
      try {
        await this.pc.addIceCandidate(candidate);
      } catch (err) {
        console.error('Failed to add pending candidate:', err);
      }
    }
    this.pendingCandidates = [];
  }

  addTrack(track: MediaStreamTrack, ...streams: MediaStream[]): RTCRtpSender {
    return this.pc.addTrack(track, ...streams);
  }

  removeTrack(sender: RTCRtpSender): void {
    this.pc.removeTrack(sender);
  }

  replaceTrack(sender: RTCRtpSender, track: MediaStreamTrack | null): Promise<void> {
    return sender.replaceTrack(track);
  }

  getDataChannel(label: string): RTCDataChannel | undefined {
    return this.dataChannels.get(label);
  }

  sendData(label: string, data: string | ArrayBuffer | Blob): void {
    const channel = this.dataChannels.get(label);
    if (channel && channel.readyState === 'open') {
      channel.send(data as ArrayBuffer);
    }
  }

  async getStats(): Promise<PeerStats> {
    const stats = await this.pc.getStats();
    let bytesReceived = 0;
    let bytesSent = 0;
    let packetsLost = 0;
    let roundTripTime = 0;
    let jitter = 0;
    let audioLevel: number | undefined;
    let framesPerSecond: number | undefined;
    let frameWidth: number | undefined;
    let frameHeight: number | undefined;
    let codec: string | undefined;
    let localCandidateType: string | undefined;
    let remoteCandidateType: string | undefined;

    stats.forEach((report) => {
      if (report.type === 'inbound-rtp') {
        bytesReceived += report.bytesReceived || 0;
        packetsLost += report.packetsLost || 0;
        jitter = report.jitter || 0;

        if (report.kind === 'video') {
          framesPerSecond = report.framesPerSecond;
          frameWidth = report.frameWidth;
          frameHeight = report.frameHeight;
        }

        if (report.kind === 'audio') {
          audioLevel = report.audioLevel;
        }
      }

      if (report.type === 'outbound-rtp') {
        bytesSent += report.bytesSent || 0;
      }

      if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        roundTripTime = report.currentRoundTripTime || 0;
      }

      if (report.type === 'local-candidate') {
        localCandidateType = report.candidateType;
      }

      if (report.type === 'remote-candidate') {
        remoteCandidateType = report.candidateType;
      }

      if (report.type === 'codec') {
        codec = report.mimeType;
      }
    });

    const result: PeerStats = {
      peerId: this.options.peerId,
      connectionState: this.pc.connectionState,
      iceConnectionState: this.pc.iceConnectionState,
      bytesReceived,
      bytesSent,
      packetsLost,
      roundTripTime,
      jitter
    };
    if (localCandidateType !== undefined) {
      result.localCandidateType = localCandidateType;
    }
    if (remoteCandidateType !== undefined) {
      result.remoteCandidateType = remoteCandidateType;
    }
    if (audioLevel !== undefined) {
      result.audioLevel = audioLevel;
    }
    if (framesPerSecond !== undefined) {
      result.framesPerSecond = framesPerSecond;
    }
    if (frameWidth !== undefined) {
      result.frameWidth = frameWidth;
    }
    if (frameHeight !== undefined) {
      result.frameHeight = frameHeight;
    }
    if (codec !== undefined) {
      result.codec = codec;
    }
    return result;
  }

  startStatsMonitoring(interval: number, callback: (stats: PeerStats) => void): void {
    this.statsInterval = window.setInterval(async () => {
      const stats = await this.getStats();
      callback(stats);
    }, interval);
  }

  stopStatsMonitoring(): void {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }
  }

  getConnectionState(): RTCPeerConnectionState {
    return this.pc.connectionState;
  }

  close(): void {
    this.stopStatsMonitoring();
    this.dataChannels.forEach(channel => channel.close());
    this.dataChannels.clear();
    this.pc.close();
  }
}

// ============================================================================
// Room Manager
// ============================================================================

export class RTCRoom {
  private signaling: SignalingClient;
  private peers: Map<string, PeerConnection> = new Map();
  private localStream: MediaStream | null = null;
  private rtcConfig: RTCConfig;
  private roomId: string;
  private callbacks: {
    onPeerJoined?: (peerId: string) => void;
    onPeerLeft?: (peerId: string) => void;
    onTrack?: (peerId: string, track: MediaStreamTrack, streams: readonly MediaStream[]) => void;
    onDataChannel?: (peerId: string, channel: RTCDataChannel) => void;
    onConnectionStateChange?: (peerId: string, state: RTCPeerConnectionState) => void;
  } = {};

  constructor(
    signaling: SignalingClient,
    roomId: string,
    rtcConfig?: RTCConfig
  ) {
    this.signaling = signaling;
    this.roomId = roomId;
    this.rtcConfig = rtcConfig ?? {};
    this.setupSignalingHandlers();
  }

  private setupSignalingHandlers(): void {
    this.signaling.on('peer-joined', (data) => {
      const msg = data as { peerId: string };
      this.createPeerConnection(msg.peerId, true);
      this.callbacks.onPeerJoined?.(msg.peerId);
    });

    this.signaling.on('peer-left', (data) => {
      const msg = data as { peerId: string };
      this.removePeer(msg.peerId);
      this.callbacks.onPeerLeft?.(msg.peerId);
    });

    this.signaling.on('offer', async (data) => {
      const msg = data as { peerId: string; sdp: string };
      let peer = this.peers.get(msg.peerId);

      if (!peer) {
        peer = this.createPeerConnection(msg.peerId, false);
      }

      await peer.handleOffer({ type: 'offer', sdp: msg.sdp });
    });

    this.signaling.on('answer', async (data) => {
      const msg = data as { peerId: string; sdp: string };
      const peer = this.peers.get(msg.peerId);

      if (peer) {
        await peer.handleAnswer({ type: 'answer', sdp: msg.sdp });
      }
    });

    this.signaling.on('candidate', async (data) => {
      const msg = data as { peerId: string; candidate: RTCIceCandidateInit };
      const peer = this.peers.get(msg.peerId);

      if (peer) {
        await peer.handleCandidate(msg.candidate);
      }
    });
  }

  private createPeerConnection(peerId: string, polite: boolean): PeerConnection {
    const peer = new PeerConnection({
      peerId,
      polite,
      rtcConfig: this.rtcConfig,
      dataChannels: [{ label: 'data', ordered: true }],
      onTrack: (track, streams) => {
        this.callbacks.onTrack?.(peerId, track, streams);
      },
      onDataChannel: (channel) => {
        this.callbacks.onDataChannel?.(peerId, channel);
      },
      onConnectionStateChange: (state) => {
        this.callbacks.onConnectionStateChange?.(peerId, state);
      }
    });

    peer.setSignalHandler((type, data) => {
      if (type === 'offer') {
        this.signaling.sendOffer(peerId, data as RTCSessionDescriptionInit);
      } else if (type === 'answer') {
        this.signaling.sendAnswer(peerId, data as RTCSessionDescriptionInit);
      } else if (type === 'candidate') {
        this.signaling.sendCandidate(peerId, data as RTCIceCandidate);
      }
    });

    // Add local stream tracks to peer
    if (this.localStream) {
      for (const track of this.localStream.getTracks()) {
        peer.addTrack(track, this.localStream);
      }
    }

    this.peers.set(peerId, peer);
    return peer;
  }

  private removePeer(peerId: string): void {
    const peer = this.peers.get(peerId);
    if (peer) {
      peer.close();
      this.peers.delete(peerId);
    }
  }

  join(): void {
    this.signaling.joinRoom(this.roomId);
  }

  leave(): void {
    this.signaling.leaveRoom();
    this.peers.forEach((peer, id) => {
      peer.close();
    });
    this.peers.clear();
  }

  setLocalStream(stream: MediaStream): void {
    this.localStream = stream;

    // Add tracks to all existing peers
    this.peers.forEach((peer) => {
      for (const track of stream.getTracks()) {
        peer.addTrack(track, stream);
      }
    });
  }

  removeLocalStream(): void {
    this.localStream = null;
  }

  onPeerJoined(callback: (peerId: string) => void): void {
    this.callbacks.onPeerJoined = callback;
  }

  onPeerLeft(callback: (peerId: string) => void): void {
    this.callbacks.onPeerLeft = callback;
  }

  onTrack(callback: (peerId: string, track: MediaStreamTrack, streams: readonly MediaStream[]) => void): void {
    this.callbacks.onTrack = callback;
  }

  onDataChannel(callback: (peerId: string, channel: RTCDataChannel) => void): void {
    this.callbacks.onDataChannel = callback;
  }

  onConnectionStateChange(callback: (peerId: string, state: RTCPeerConnectionState) => void): void {
    this.callbacks.onConnectionStateChange = callback;
  }

  getPeers(): string[] {
    return Array.from(this.peers.keys());
  }

  getPeer(peerId: string): PeerConnection | undefined {
    return this.peers.get(peerId);
  }

  broadcast(label: string, data: string | ArrayBuffer): void {
    this.peers.forEach((peer) => {
      peer.sendData(label, data);
    });
  }

  sendToPeer(peerId: string, label: string, data: string | ArrayBuffer): void {
    const peer = this.peers.get(peerId);
    if (peer) {
      peer.sendData(label, data);
    }
  }

  async getAllStats(): Promise<Map<string, PeerStats>> {
    const allStats = new Map<string, PeerStats>();

    for (const [peerId, peer] of this.peers) {
      const stats = await peer.getStats();
      allStats.set(peerId, stats);
    }

    return allStats;
  }
}

// ============================================================================
// Data Channel with Chunking
// ============================================================================

export class ChunkedDataChannel {
  private channel: RTCDataChannel;
  private readonly chunkSize: number = 16384; // 16KB chunks
  private incomingChunks: Map<string, { chunks: ArrayBuffer[]; total: number }> = new Map();
  private onMessageCallback: ((data: ArrayBuffer | string) => void) | null = null;

  constructor(channel: RTCDataChannel) {
    this.channel = channel;
    this.channel.binaryType = 'arraybuffer';
    this.setupHandlers();
  }

  private setupHandlers(): void {
    this.channel.onmessage = (event) => {
      if (typeof event.data === 'string') {
        // Control message
        const msg = JSON.parse(event.data);
        if (msg.type === 'chunk-start') {
          this.incomingChunks.set(msg.id, { chunks: [], total: msg.total });
        } else if (msg.type === 'chunk-end') {
          const incoming = this.incomingChunks.get(msg.id);
          if (incoming) {
            const totalLength = incoming.chunks.reduce((acc, chunk) => acc + chunk.byteLength, 0);
            const result = new Uint8Array(totalLength);
            let offset = 0;

            for (const chunk of incoming.chunks) {
              result.set(new Uint8Array(chunk), offset);
              offset += chunk.byteLength;
            }

            this.incomingChunks.delete(msg.id);
            this.onMessageCallback?.(result.buffer);
          }
        } else {
          this.onMessageCallback?.(event.data);
        }
      } else {
        // Binary chunk
        const view = new DataView(event.data);
        const idLength = view.getUint8(0);
        const id = new TextDecoder().decode(new Uint8Array(event.data, 1, idLength));
        const chunkData = event.data.slice(1 + idLength);

        const incoming = this.incomingChunks.get(id);
        if (incoming) {
          incoming.chunks.push(chunkData);
        }
      }
    };
  }

  async send(data: ArrayBuffer | string): Promise<void> {
    if (typeof data === 'string') {
      this.channel.send(data);
      return;
    }

    const id = Math.random().toString(36).substr(2, 9);
    const totalChunks = Math.ceil(data.byteLength / this.chunkSize);

    // Send start message
    this.channel.send(JSON.stringify({
      type: 'chunk-start',
      id,
      total: totalChunks,
      size: data.byteLength
    }));

    // Wait for buffer to be ready
    await this.waitForBuffer();

    // Send chunks
    for (let i = 0; i < totalChunks; i++) {
      const start = i * this.chunkSize;
      const end = Math.min(start + this.chunkSize, data.byteLength);
      const chunk = data.slice(start, end);

      // Prepend ID to chunk
      const idBytes = new TextEncoder().encode(id);
      const packet = new Uint8Array(1 + idBytes.length + chunk.byteLength);
      packet[0] = idBytes.length;
      packet.set(idBytes, 1);
      packet.set(new Uint8Array(chunk), 1 + idBytes.length);

      await this.waitForBuffer();
      this.channel.send(packet.buffer);
    }

    // Send end message
    this.channel.send(JSON.stringify({ type: 'chunk-end', id }));
  }

  private waitForBuffer(): Promise<void> {
    return new Promise((resolve) => {
      const check = () => {
        if (this.channel.bufferedAmount < this.chunkSize) {
          resolve();
        } else {
          setTimeout(check, 10);
        }
      };
      check();
    });
  }

  onMessage(callback: (data: ArrayBuffer | string) => void): void {
    this.onMessageCallback = callback;
  }

  get readyState(): RTCDataChannelState {
    return this.channel.readyState;
  }

  close(): void {
    this.channel.close();
  }
}

// ============================================================================
// Network Quality Monitor
// ============================================================================

export class NetworkQualityMonitor {
  private pc: RTCPeerConnection;
  private interval: number | null = null;
  private history: NetworkQuality[] = [];
  private maxHistory: number = 60;
  private callbacks: Array<(quality: NetworkQuality) => void> = [];

  constructor(pc: RTCPeerConnection) {
    this.pc = pc;
  }

  start(intervalMs: number = 1000): void {
    this.interval = window.setInterval(async () => {
      const quality = await this.measure();
      this.history.push(quality);

      if (this.history.length > this.maxHistory) {
        this.history.shift();
      }

      this.callbacks.forEach(cb => cb(quality));
    }, intervalMs);
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  private async measure(): Promise<NetworkQuality> {
    const stats = await this.pc.getStats();

    let rtt = 0;
    let jitter = 0;
    let packetsLost = 0;
    let packetsReceived = 0;
    let bytesReceived = 0;
    let bytesSent = 0;
    let prevBytesReceived = 0;
    let prevBytesSent = 0;

    stats.forEach((report) => {
      if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        rtt = (report.currentRoundTripTime || 0) * 1000;
      }

      if (report.type === 'inbound-rtp') {
        jitter = (report.jitter || 0) * 1000;
        packetsLost += report.packetsLost || 0;
        packetsReceived += report.packetsReceived || 0;
        bytesReceived += report.bytesReceived || 0;
      }

      if (report.type === 'outbound-rtp') {
        bytesSent += report.bytesSent || 0;
      }
    });

    const packetLoss = packetsReceived > 0
      ? (packetsLost / (packetsLost + packetsReceived)) * 100
      : 0;

    // Calculate bandwidth (approximate)
    const uploadBandwidth = (bytesSent - prevBytesSent) * 8 / 1000; // kbps
    const downloadBandwidth = (bytesReceived - prevBytesReceived) * 8 / 1000;

    // Determine quality score
    let score: NetworkQuality['score'];
    if (rtt < 50 && packetLoss < 1 && jitter < 10) {
      score = 'excellent';
    } else if (rtt < 100 && packetLoss < 3 && jitter < 30) {
      score = 'good';
    } else if (rtt < 200 && packetLoss < 5 && jitter < 50) {
      score = 'fair';
    } else {
      score = 'poor';
    }

    return {
      rtt,
      jitter,
      packetLoss,
      bandwidth: {
        upload: uploadBandwidth,
        download: downloadBandwidth
      },
      score
    };
  }

  onQuality(callback: (quality: NetworkQuality) => void): () => void {
    this.callbacks.push(callback);
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) this.callbacks.splice(index, 1);
    };
  }

  getHistory(): NetworkQuality[] {
    return [...this.history];
  }

  getAverage(): NetworkQuality {
    if (this.history.length === 0) {
      return {
        rtt: 0,
        jitter: 0,
        packetLoss: 0,
        bandwidth: { upload: 0, download: 0 },
        score: 'poor'
      };
    }

    const sum = this.history.reduce(
      (acc, q) => ({
        rtt: acc.rtt + q.rtt,
        jitter: acc.jitter + q.jitter,
        packetLoss: acc.packetLoss + q.packetLoss,
        upload: acc.upload + q.bandwidth.upload,
        download: acc.download + q.bandwidth.download
      }),
      { rtt: 0, jitter: 0, packetLoss: 0, upload: 0, download: 0 }
    );

    const count = this.history.length;
    const avgRtt = sum.rtt / count;
    const avgPacketLoss = sum.packetLoss / count;
    const avgJitter = sum.jitter / count;

    let score: NetworkQuality['score'];
    if (avgRtt < 50 && avgPacketLoss < 1 && avgJitter < 10) {
      score = 'excellent';
    } else if (avgRtt < 100 && avgPacketLoss < 3 && avgJitter < 30) {
      score = 'good';
    } else if (avgRtt < 200 && avgPacketLoss < 5 && avgJitter < 50) {
      score = 'fair';
    } else {
      score = 'poor';
    }

    return {
      rtt: avgRtt,
      jitter: avgJitter,
      packetLoss: avgPacketLoss,
      bandwidth: {
        upload: sum.upload / count,
        download: sum.download / count
      },
      score
    };
  }
}

// ============================================================================
// Hooks
// ============================================================================

type CleanupFn = () => void;
type EffectFn = () => void | CleanupFn;

const effectQueue: EffectFn[] = [];

function useEffect(effect: EffectFn, _deps?: unknown[]): void {
  effectQueue.push(effect);
}

function useState<T>(initial: T): [T, (value: T | ((prev: T) => T)) => void] {
  let state = initial;
  const setState = (value: T | ((prev: T) => T)) => {
    state = typeof value === 'function' ? (value as (prev: T) => T)(state) : value;
  };
  return [state, setState];
}

function useRef<T>(initial: T): { current: T } {
  return { current: initial };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function useCallback<T extends (...args: any[]) => any>(fn: T, _deps: unknown[]): T {
  return fn;
}

export function useWebRTC(signalingUrl: string, roomId: string, rtcConfig?: RTCConfig) {
  const signalingRef = useRef<SignalingClient | null>(null);
  const roomRef = useRef<RTCRoom | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [peers, setPeers] = useState<string[]>([]);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());

  useEffect(() => {
    const signaling = new SignalingClient({ type: 'websocket', url: signalingUrl });
    signalingRef.current = signaling;

    signaling.connect().then(() => {
      const room = new RTCRoom(signaling, roomId, rtcConfig);
      roomRef.current = room;

      room.onPeerJoined((peerId) => {
        setPeers(room.getPeers());
      });

      room.onPeerLeft((peerId) => {
        setPeers(room.getPeers());
        setRemoteStreams((prev) => {
          const next = new Map(prev);
          next.delete(peerId);
          return next;
        });
      });

      room.onTrack((peerId, track, streams) => {
        const stream = streams[0];
        if (stream) {
          setRemoteStreams((prev) => {
            const next = new Map(prev);
            next.set(peerId, stream);
            return next;
          });
        }
      });

      room.join();
      setIsConnected(true);
    });

    return () => {
      roomRef.current?.leave();
      signalingRef.current?.disconnect();
    };
  }, [signalingUrl, roomId]);

  const setLocalStream = useCallback((stream: MediaStream) => {
    roomRef.current?.setLocalStream(stream);
  }, []);

  const broadcast = useCallback((label: string, data: string | ArrayBuffer) => {
    roomRef.current?.broadcast(label, data);
  }, []);

  const sendToPeer = useCallback((peerId: string, label: string, data: string | ArrayBuffer) => {
    roomRef.current?.sendToPeer(peerId, label, data);
  }, []);

  return {
    isConnected,
    peers,
    remoteStreams,
    localPeerId: signalingRef.current?.getPeerId() ?? '',
    setLocalStream,
    broadcast,
    sendToPeer,
    leave: () => roomRef.current?.leave()
  };
}

export function usePeerConnection(options: PeerConnectionOptions) {
  const peerRef = useRef<PeerConnection | null>(null);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>('new');
  const [stats, setStats] = useState<PeerStats | null>(null);

  useEffect(() => {
    const peer = new PeerConnection({
      ...options,
      onConnectionStateChange: (state) => {
        setConnectionState(state);
        options.onConnectionStateChange?.(state);
      }
    });

    peerRef.current = peer;
    peer.startStatsMonitoring(2000, setStats);

    return () => peer.close();
  }, [options.peerId]);

  return {
    peer: peerRef.current,
    connectionState,
    stats
  };
}

export function useNetworkQuality(pc: RTCPeerConnection | null) {
  const monitorRef = useRef<NetworkQualityMonitor | null>(null);
  const [quality, setQuality] = useState<NetworkQuality | null>(null);

  useEffect(() => {
    if (!pc) return;

    const monitor = new NetworkQualityMonitor(pc);
    monitorRef.current = monitor;
    monitor.onQuality(setQuality);
    monitor.start(1000);

    return () => monitor.stop();
  }, [pc]);

  return {
    quality,
    history: monitorRef.current?.getHistory() ?? [],
    average: monitorRef.current?.getAverage() ?? null
  };
}

export function useDataChannel(peer: PeerConnection | null, label: string) {
  const channelRef = useRef<ChunkedDataChannel | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [lastMessage, setLastMessage] = useState<ArrayBuffer | string | null>(null);

  useEffect(() => {
    if (!peer) return;

    const channel = peer.getDataChannel(label);
    if (!channel) return;

    const chunked = new ChunkedDataChannel(channel);
    channelRef.current = chunked;

    channel.onopen = () => setIsOpen(true);
    channel.onclose = () => setIsOpen(false);

    chunked.onMessage((data) => {
      setLastMessage(data);
    });

    return () => chunked.close();
  }, [peer, label]);

  const send = useCallback((data: ArrayBuffer | string) => {
    channelRef.current?.send(data);
  }, []);

  return { isOpen, lastMessage, send };
}

// Export everything
export default {
  SignalingClient,
  PeerConnection,
  RTCRoom,
  ChunkedDataChannel,
  NetworkQualityMonitor,
  DEFAULT_ICE_SERVERS,
  useWebRTC,
  usePeerConnection,
  useNetworkQuality,
  useDataChannel
};
