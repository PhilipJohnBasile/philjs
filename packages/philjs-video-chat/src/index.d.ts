/**
 * @philjs/video-chat - Full-featured video conferencing for PhilJS
 *
 * High-level video chat API with:
 * - Multi-party video rooms with grid/speaker layouts
 * - Virtual backgrounds (blur, replace, remove)
 * - Noise suppression and audio enhancement
 * - Recording and transcription
 * - Breakout rooms
 * - Hand raising and reactions
 * - Live captions
 * - Chat and file sharing
 * - Screen annotation
 */
interface VirtualBackgroundConfig {
    type: 'none' | 'blur' | 'image' | 'video' | 'remove';
    blurStrength?: number;
    backgroundUrl?: string;
    edgeBlur?: number;
    segmentationModel?: 'mediapipe' | 'tensorflow' | 'custom';
}
declare class VirtualBackgroundProcessor {
    private canvas;
    private ctx;
    private segmenter;
    private config;
    private backgroundImage;
    private running;
    constructor(config?: VirtualBackgroundConfig);
    initialize(): Promise<void>;
    private loadSegmentationModel;
    processFrame(inputFrame: VideoFrame): Promise<VideoFrame>;
    private segment;
    private applyBlur;
    private applyBackground;
    private removeBackground;
    setConfig(config: Partial<VirtualBackgroundConfig>): void;
    destroy(): void;
}
interface AudioEnhancementConfig {
    noiseSuppression: boolean;
    echoCancellation: boolean;
    autoGainControl: boolean;
    noiseGate: boolean;
    noiseGateThreshold?: number;
    compressor: boolean;
    equalizer?: number[];
}
declare class AudioEnhancer {
    private audioContext;
    private sourceNode;
    private destinationNode;
    private noiseGateNode;
    private compressorNode;
    private eqNodes;
    private config;
    constructor(config?: Partial<AudioEnhancementConfig>);
    initialize(): Promise<void>;
    private createNoiseGateProcessor;
    processStream(inputStream: MediaStream): MediaStream;
    setEqualizer(bands: number[]): void;
    destroy(): void;
}
interface ParticipantState {
    id: string;
    name: string;
    avatar?: string;
    isLocal: boolean;
    isMuted: boolean;
    isVideoOff: boolean;
    isScreenSharing: boolean;
    isSpeaking: boolean;
    isHandRaised: boolean;
    reaction?: string;
    connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
    audioLevel: number;
    role: 'host' | 'cohost' | 'participant';
}
declare class Participant {
    readonly id: string;
    readonly name: string;
    readonly isLocal: boolean;
    private _stream;
    private _screenStream;
    private state;
    private audioAnalyser;
    private audioContext;
    private listeners;
    constructor(id: string, name: string, isLocal: boolean, role?: ParticipantState['role']);
    get stream(): MediaStream | null;
    get screenStream(): MediaStream | null;
    setStream(stream: MediaStream): void;
    setScreenStream(stream: MediaStream | null): void;
    private setupAudioAnalysis;
    mute(): void;
    unmute(): void;
    hideVideo(): void;
    showVideo(): void;
    raiseHand(): void;
    lowerHand(): void;
    react(emoji: string): void;
    getState(): ParticipantState;
    on(event: string, callback: Function): () => void;
    private emit;
    destroy(): void;
}
type LayoutMode = 'grid' | 'speaker' | 'sidebar' | 'spotlight' | 'presentation';
interface RoomConfig {
    roomId: string;
    displayName: string;
    signalingUrl: string;
    iceServers?: RTCIceServer[];
    maxParticipants?: number;
    enableRecording?: boolean;
    enableTranscription?: boolean;
    enableChat?: boolean;
    virtualBackground?: VirtualBackgroundConfig;
    audioEnhancement?: Partial<AudioEnhancementConfig>;
}
interface ChatMessage {
    id: string;
    senderId: string;
    senderName: string;
    text: string;
    timestamp: Date;
    type: 'text' | 'file' | 'system';
    fileUrl?: string;
    fileName?: string;
}
interface TranscriptionSegment {
    id: string;
    speakerId: string;
    speakerName: string;
    text: string;
    timestamp: Date;
    isFinal: boolean;
}
declare class VideoRoom {
    readonly roomId: string;
    private config;
    private ws;
    private peerConnections;
    private participants;
    private localParticipant;
    private layoutMode;
    private activeSpeakerId;
    private pinnedParticipantId;
    private chatMessages;
    private transcription;
    private breakoutRooms;
    private virtualBackground;
    private audioEnhancer;
    private mediaRecorder;
    private recordedChunks;
    private speechRecognition;
    private listeners;
    constructor(config: RoomConfig);
    join(): Promise<Participant>;
    private connectSignaling;
    private handleSignal;
    private handleParticipantJoined;
    private handleParticipantLeft;
    private createPeerConnection;
    private mapConnectionStateToQuality;
    private handleOffer;
    private handleAnswer;
    private handleIceCandidate;
    sendChatMessage(text: string): void;
    sendFile(file: File): Promise<void>;
    private handleChatMessage;
    getChatHistory(): ChatMessage[];
    react(emoji: string): void;
    private handleReaction;
    raiseHand(): void;
    lowerHand(): void;
    private handleHandRaised;
    startRecording(): Promise<void>;
    stopRecording(): Blob;
    private startTranscription;
    getTranscription(): TranscriptionSegment[];
    setLayout(mode: LayoutMode): void;
    getLayout(): LayoutMode;
    pinParticipant(participantId: string): void;
    unpinParticipant(): void;
    createBreakoutRoom(name: string): string;
    assignToBreakoutRoom(participantId: string, breakoutRoomId: string): void;
    closeBreakoutRooms(): void;
    mute(): void;
    unmute(): void;
    hideVideo(): void;
    showVideo(): void;
    startScreenShare(): Promise<void>;
    stopScreenShare(): Promise<void>;
    setVirtualBackground(config: VirtualBackgroundConfig): void;
    getParticipants(): Participant[];
    getLocalParticipant(): Participant | null;
    getActiveSpeaker(): Participant | null;
    private sendSignal;
    on(event: string, callback: Function): () => void;
    private emit;
    leave(): Promise<void>;
}
interface UseVideoRoomResult {
    room: VideoRoom | null;
    participants: Participant[];
    localParticipant: Participant | null;
    activeSpeaker: Participant | null;
    layout: LayoutMode;
    isConnected: boolean;
    chatMessages: ChatMessage[];
    join: () => Promise<void>;
    leave: () => Promise<void>;
    mute: () => void;
    unmute: () => void;
    hideVideo: () => void;
    showVideo: () => void;
    startScreenShare: () => Promise<void>;
    stopScreenShare: () => Promise<void>;
    sendMessage: (text: string) => void;
    react: (emoji: string) => void;
    raiseHand: () => void;
    lowerHand: () => void;
    setLayout: (mode: LayoutMode) => void;
    pinParticipant: (id: string) => void;
    unpinParticipant: () => void;
    setVirtualBackground: (config: VirtualBackgroundConfig) => void;
}
declare function useVideoRoom(config: RoomConfig): UseVideoRoomResult;
declare function useParticipant(participant: Participant): ParticipantState;
declare function useActiveSpeaker(room: VideoRoom): Participant | null;
declare function useVirtualBackground(initialConfig?: VirtualBackgroundConfig): {
    config: VirtualBackgroundConfig;
    setType: (type: VirtualBackgroundConfig['type']) => void;
    setBlurStrength: (strength: number) => void;
    setBackgroundImage: (url: string) => void;
};
interface VideoGridConfig {
    maxColumns?: number;
    aspectRatio?: number;
    gap?: number;
    showNames?: boolean;
    showMuteIndicator?: boolean;
    showConnectionQuality?: boolean;
}
declare class VideoGridLayout {
    private container;
    private config;
    private videoElements;
    constructor(container: HTMLElement, config?: VideoGridConfig);
    private setupContainer;
    updateLayout(participants: Participant[]): void;
    private createVideoCell;
    private updateVideoCell;
    destroy(): void;
}
export { VideoRoom, Participant, VirtualBackgroundProcessor, AudioEnhancer, VideoGridLayout, useVideoRoom, useParticipant, useActiveSpeaker, useVirtualBackground, type RoomConfig, type VirtualBackgroundConfig, type AudioEnhancementConfig, type ParticipantState, type ChatMessage, type TranscriptionSegment, type LayoutMode, type VideoGridConfig, type UseVideoRoomResult };
//# sourceMappingURL=index.d.ts.map