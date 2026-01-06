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

// ============================================================================
// VIRTUAL BACKGROUND ENGINE
// ============================================================================

interface VirtualBackgroundConfig {
  type: 'none' | 'blur' | 'image' | 'video' | 'remove';
  blurStrength?: number; // 0-1
  backgroundUrl?: string;
  edgeBlur?: number;
  segmentationModel?: 'mediapipe' | 'tensorflow' | 'custom';
}

// MediaPipe Types
interface SelfieSegmentationResults {
  segmentationMask: ImageData;
  image: ImageBitmap;
}

interface SelfieSegmentation {
  setOptions(options: { modelSelection: number; selfieMode: boolean }): void;
  onResults(callback: (results: SelfieSegmentationResults) => void): void;
  send(input: { image: ImageBitmap }): Promise<void>;
  close(): Promise<void>;
}

interface SelfieSegmentationConstructor {
  new(config?: { locateFile?: (file: string) => string }): SelfieSegmentation;
}

// Web Speech API Types
interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionConstructor {
  new(): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

class VirtualBackgroundProcessor {
  private canvas: OffscreenCanvas;
  private ctx: OffscreenCanvasRenderingContext2D;
  private segmenter: SelfieSegmentation | null = null;
  private config: VirtualBackgroundConfig;
  private backgroundImage: ImageBitmap | null = null;
  private running = false;

  constructor(config: VirtualBackgroundConfig = { type: 'none' }) {
    this.canvas = new OffscreenCanvas(640, 480);
    this.ctx = this.canvas.getContext('2d')!;
    this.config = config;
  }

  async initialize(): Promise<void> {
    // Load segmentation model
    if (this.config.type !== 'none') {
      await this.loadSegmentationModel();
    }

    // Load background image if needed
    if (this.config.type === 'image' && this.config.backgroundUrl) {
      const response = await fetch(this.config.backgroundUrl);
      const blob = await response.blob();
      this.backgroundImage = await createImageBitmap(blob);
    }
  }

  private async loadSegmentationModel(): Promise<void> {
    // MediaPipe Selfie Segmentation integration
    const model = this.config.segmentationModel || 'mediapipe';

    if (model === 'mediapipe') {
      // @ts-ignore - Dynamic import of generic module
      const { SelfieSegmentation } = await import('@mediapipe/selfie_segmentation');
      const SelfieSegmentationClass = SelfieSegmentation as SelfieSegmentationConstructor;

      this.segmenter = new SelfieSegmentationClass({
        locateFile: (file: string) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`
      });
      this.segmenter.setOptions({ modelSelection: 1, selfieMode: true });
    }
  }

  async processFrame(inputFrame: VideoFrame): Promise<VideoFrame> {
    if (this.config.type === 'none') {
      return inputFrame;
    }

    const width = inputFrame.displayWidth;
    const height = inputFrame.displayHeight;
    this.canvas.width = width;
    this.canvas.height = height;

    // Create bitmap from frame
    const bitmap = await createImageBitmap(inputFrame);

    // Run segmentation
    const maskCanvas = await this.segment(bitmap);

    // Apply effect based on type
    switch (this.config.type) {
      case 'blur':
        this.applyBlur(bitmap, maskCanvas);
        break;
      case 'image':
        this.applyBackground(bitmap, maskCanvas);
        break;
      case 'remove':
        this.removeBackground(bitmap, maskCanvas);
        break;
    }

    bitmap.close();

    // Create new VideoFrame from canvas
    return new VideoFrame(this.canvas, { timestamp: inputFrame.timestamp });
  }

  private async segment(bitmap: ImageBitmap): Promise<ImageData> {
    // Run MediaPipe segmentation
    return new Promise((resolve) => {
      if (!this.segmenter) {
        resolve(new ImageData(1, 1)); // Fallback
        return;
      }
      this.segmenter.onResults((results: SelfieSegmentationResults) => {
        resolve(results.segmentationMask);
      });
      this.segmenter.send({ image: bitmap });
    });
  }

  private applyBlur(foreground: ImageBitmap, mask: ImageData): void {
    const strength = this.config.blurStrength ?? 0.5;
    const blurRadius = Math.round(strength * 20);

    // Draw blurred background
    this.ctx.filter = `blur(${blurRadius}px)`;
    this.ctx.drawImage(foreground, 0, 0);
    this.ctx.filter = 'none';

    // Apply mask and draw foreground
    this.ctx.globalCompositeOperation = 'destination-out';
    this.ctx.putImageData(mask, 0, 0);
    this.ctx.globalCompositeOperation = 'destination-over';
    this.ctx.drawImage(foreground, 0, 0);
    this.ctx.globalCompositeOperation = 'source-over';
  }

  private applyBackground(foreground: ImageBitmap, mask: ImageData): void {
    if (!this.backgroundImage) return;

    // Draw custom background
    this.ctx.drawImage(this.backgroundImage, 0, 0, this.canvas.width, this.canvas.height);

    // Apply mask and draw foreground
    this.ctx.globalCompositeOperation = 'destination-in';
    this.ctx.putImageData(mask, 0, 0);
    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.drawImage(foreground, 0, 0);
  }

  private removeBackground(foreground: ImageBitmap, mask: ImageData): void {
    // Draw foreground with transparency
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.drawImage(foreground, 0, 0);
    this.ctx.globalCompositeOperation = 'destination-in';
    this.ctx.putImageData(mask, 0, 0);
    this.ctx.globalCompositeOperation = 'source-over';
  }

  setConfig(config: Partial<VirtualBackgroundConfig>): void {
    this.config = { ...this.config, ...config };
  }

  destroy(): void {
    this.running = false;
    this.backgroundImage?.close();
    this.segmenter?.close();
  }
}

// ============================================================================
// AUDIO ENHANCEMENT
// ============================================================================

interface AudioEnhancementConfig {
  noiseSuppression: boolean;
  echoCancellation: boolean;
  autoGainControl: boolean;
  noiseGate: boolean;
  noiseGateThreshold?: number;
  compressor: boolean;
  equalizer?: number[]; // 10-band EQ
}

class AudioEnhancer {
  private audioContext: AudioContext;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private destinationNode: MediaStreamAudioDestinationNode;
  private noiseGateNode: AudioWorkletNode | null = null;
  private compressorNode: DynamicsCompressorNode | null = null;
  private eqNodes: BiquadFilterNode[] = [];
  private config: AudioEnhancementConfig;

  constructor(config: Partial<AudioEnhancementConfig> = {}) {
    this.audioContext = new AudioContext();
    this.destinationNode = this.audioContext.createMediaStreamDestination();
    this.config = {
      noiseSuppression: true,
      echoCancellation: true,
      autoGainControl: true,
      noiseGate: false,
      compressor: false,
      ...config
    };
  }

  async initialize(): Promise<void> {
    // Load noise gate worklet
    if (this.config.noiseGate) {
      await this.audioContext.audioWorklet.addModule(
        this.createNoiseGateProcessor()
      );
    }
  }

  private createNoiseGateProcessor(): string {
    const processorCode = `
      class NoiseGateProcessor extends AudioWorkletProcessor {
        static get parameterDescriptors() {
          return [{ name: 'threshold', defaultValue: -50, minValue: -100, maxValue: 0 }];
        }

        process(inputs, outputs, parameters) {
          const input = inputs[0];
          const output = outputs[0];
          const threshold = parameters.threshold[0];

          for (let channel = 0; channel < input.length; channel++) {
            const inputChannel = input[channel];
            const outputChannel = output[channel];

            for (let i = 0; i < inputChannel.length; i++) {
              const db = 20 * Math.log10(Math.abs(inputChannel[i]) + 1e-10);
              outputChannel[i] = db > threshold ? inputChannel[i] : 0;
            }
          }

          return true;
        }
      }
      registerProcessor('noise-gate', NoiseGateProcessor);
    `;
    return URL.createObjectURL(new Blob([processorCode], { type: 'application/javascript' }));
  }

  processStream(inputStream: MediaStream): MediaStream {
    this.sourceNode = this.audioContext.createMediaStreamSource(inputStream);
    let currentNode: AudioNode = this.sourceNode;

    // Add noise gate
    if (this.config.noiseGate) {
      this.noiseGateNode = new AudioWorkletNode(this.audioContext, 'noise-gate');
      if (this.config.noiseGateThreshold !== undefined) {
        const thresholdParam = this.noiseGateNode.parameters['get']('threshold');
        if (thresholdParam) {
          thresholdParam.value = this.config.noiseGateThreshold;
        }
      }
      currentNode.connect(this.noiseGateNode);
      currentNode = this.noiseGateNode;
    }

    // Add EQ
    if (this.config.equalizer && this.config.equalizer.length === 10) {
      const frequencies = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
      this.eqNodes = frequencies.map((freq, i) => {
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'peaking';
        filter.frequency.value = freq;
        filter.Q.value = 1.4;
        filter.gain.value = this.config.equalizer![i]!;
        currentNode.connect(filter);
        currentNode = filter;
        return filter;
      });
    }

    // Add compressor
    if (this.config.compressor) {
      this.compressorNode = this.audioContext.createDynamicsCompressor();
      this.compressorNode.threshold.value = -24;
      this.compressorNode.knee.value = 30;
      this.compressorNode.ratio.value = 12;
      this.compressorNode.attack.value = 0.003;
      this.compressorNode.release.value = 0.25;
      currentNode.connect(this.compressorNode);
      currentNode = this.compressorNode;
    }

    currentNode.connect(this.destinationNode);
    return this.destinationNode.stream;
  }

  setEqualizer(bands: number[]): void {
    if (bands.length !== 10) return;
    this.eqNodes.forEach((node, i) => {
      node.gain.value = bands[i]!;
    });
  }

  destroy(): void {
    this.sourceNode?.disconnect();
    this.noiseGateNode?.disconnect();
    this.compressorNode?.disconnect();
    this.eqNodes.forEach(node => node.disconnect());
    this.audioContext.close();
  }
}

// ============================================================================
// PARTICIPANT
// ============================================================================

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
  audioLevel: number; // 0-1
  role: 'host' | 'cohost' | 'participant';
}

class Participant {
  readonly id: string;
  readonly name: string;
  readonly isLocal: boolean;

  private _stream: MediaStream | null = null;
  private _screenStream: MediaStream | null = null;
  private state: ParticipantState;
  private audioAnalyser: AnalyserNode | null = null;
  private audioContext: AudioContext | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  constructor(id: string, name: string, isLocal: boolean, role: ParticipantState['role'] = 'participant') {
    this.id = id;
    this.name = name;
    this.isLocal = isLocal;
    this.state = {
      id,
      name,
      isLocal,
      isMuted: false,
      isVideoOff: false,
      isScreenSharing: false,
      isSpeaking: false,
      isHandRaised: false,
      connectionQuality: 'good',
      audioLevel: 0,
      role
    };
  }

  get stream(): MediaStream | null { return this._stream; }
  get screenStream(): MediaStream | null { return this._screenStream; }

  setStream(stream: MediaStream): void {
    this._stream = stream;
    this.setupAudioAnalysis();
    this.emit('streamChanged', stream);
  }

  setScreenStream(stream: MediaStream | null): void {
    this._screenStream = stream;
    this.state.isScreenSharing = stream !== null;
    this.emit('screenStreamChanged', stream);
  }

  private setupAudioAnalysis(): void {
    if (!this._stream || this.audioContext) return;

    this.audioContext = new AudioContext();
    const source = this.audioContext.createMediaStreamSource(this._stream);
    this.audioAnalyser = this.audioContext.createAnalyser();
    this.audioAnalyser.fftSize = 256;
    source.connect(this.audioAnalyser);

    const dataArray = new Uint8Array(this.audioAnalyser.frequencyBinCount);

    const analyze = () => {
      if (!this.audioAnalyser) return;

      this.audioAnalyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      this.state.audioLevel = average / 255;
      this.state.isSpeaking = this.state.audioLevel > 0.1;

      requestAnimationFrame(analyze);
    };
    analyze();
  }

  mute(): void {
    this.state.isMuted = true;
    if (this._stream) {
      this._stream.getAudioTracks().forEach(t => t.enabled = false);
    }
    this.emit('muted', true);
  }

  unmute(): void {
    this.state.isMuted = false;
    if (this._stream) {
      this._stream.getAudioTracks().forEach(t => t.enabled = true);
    }
    this.emit('muted', false);
  }

  hideVideo(): void {
    this.state.isVideoOff = true;
    if (this._stream) {
      this._stream.getVideoTracks().forEach(t => t.enabled = false);
    }
    this.emit('videoOff', true);
  }

  showVideo(): void {
    this.state.isVideoOff = false;
    if (this._stream) {
      this._stream.getVideoTracks().forEach(t => t.enabled = true);
    }
    this.emit('videoOff', false);
  }

  raiseHand(): void {
    this.state.isHandRaised = true;
    this.emit('handRaised', true);
  }

  lowerHand(): void {
    this.state.isHandRaised = false;
    this.emit('handRaised', false);
  }

  react(emoji: string): void {
    this.state.reaction = emoji;
    this.emit('reaction', emoji);
    setTimeout(() => {
      delete this.state.reaction;
      this.emit('reactionEnded', emoji);
    }, 3000);
  }

  getState(): ParticipantState {
    return { ...this.state };
  }

  on(event: string, callback: Function): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: any): void {
    this.listeners.get(event)?.forEach(cb => cb(data));
  }

  destroy(): void {
    this._stream?.getTracks().forEach(t => t.stop());
    this._screenStream?.getTracks().forEach(t => t.stop());
    this.audioContext?.close();
    this.listeners.clear();
  }
}

// ============================================================================
// VIDEO ROOM
// ============================================================================

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

class VideoRoom {
  readonly roomId: string;
  private config: RoomConfig;
  private ws: WebSocket | null = null;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private participants: Map<string, Participant> = new Map();
  private localParticipant: Participant | null = null;
  private layoutMode: LayoutMode = 'grid';
  private activeSpeakerId: string | null = null;
  private pinnedParticipantId: string | null = null;
  private chatMessages: ChatMessage[] = [];
  private transcription: TranscriptionSegment[] = [];
  private breakoutRooms: Map<string, Set<string>> = new Map();
  private virtualBackground: VirtualBackgroundProcessor | null = null;
  private audioEnhancer: AudioEnhancer | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private speechRecognition: SpeechRecognition | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  constructor(config: RoomConfig) {
    this.roomId = config.roomId;
    this.config = config;
  }

  async join(): Promise<Participant> {
    // Initialize virtual background
    if (this.config.virtualBackground) {
      this.virtualBackground = new VirtualBackgroundProcessor(this.config.virtualBackground);
      await this.virtualBackground.initialize();
    }

    // Initialize audio enhancement
    if (this.config.audioEnhancement) {
      this.audioEnhancer = new AudioEnhancer(this.config.audioEnhancement);
      await this.audioEnhancer.initialize();
    }

    // Get local media
    const constraints: MediaStreamConstraints = {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      },
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 }
      }
    };

    let localStream = await navigator.mediaDevices.getUserMedia(constraints);

    // Apply audio enhancement
    if (this.audioEnhancer) {
      const enhancedAudio = this.audioEnhancer.processStream(localStream);
      const audioTrack = enhancedAudio.getAudioTracks()[0];
      const videoTrack = localStream.getVideoTracks()[0];
      if (audioTrack && videoTrack) {
        localStream = new MediaStream([audioTrack, videoTrack]);
      }
    }

    // Apply virtual background using Insertable Streams
    if (this.virtualBackground && typeof (window as any).MediaStreamTrackProcessor !== 'undefined') {
      const videoTrack = localStream.getVideoTracks()[0];
      const processor = new (window as any).MediaStreamTrackProcessor({ track: videoTrack });
      const generator = new (window as any).MediaStreamTrackGenerator({ kind: 'video' });

      const transformer = new TransformStream({
        transform: async (frame: any, controller: any) => {
          const processedFrame = await this.virtualBackground!.processFrame(frame);
          frame.close();
          controller.enqueue(processedFrame);
        }
      });

      processor.readable.pipeThrough(transformer).pipeTo(generator.writable);

      localStream = new MediaStream([
        generator,
        localStream.getAudioTracks()[0]
      ]);
    }

    // Create local participant
    this.localParticipant = new Participant(
      crypto.randomUUID(),
      this.config.displayName,
      true,
      'participant'
    );
    this.localParticipant.setStream(localStream);
    this.participants.set(this.localParticipant.id, this.localParticipant);

    // Connect to signaling server
    await this.connectSignaling();

    // Start transcription if enabled
    if (this.config.enableTranscription) {
      this.startTranscription();
    }

    this.emit('joined', this.localParticipant);
    return this.localParticipant;
  }

  private async connectSignaling(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.config.signalingUrl);

      this.ws.onopen = () => {
        this.sendSignal({
          type: 'join',
          roomId: this.roomId,
          participantId: this.localParticipant!.id,
          displayName: this.config.displayName
        });
        resolve();
      };

      this.ws.onerror = reject;

      this.ws.onmessage = async (event) => {
        const message = JSON.parse(event.data);
        await this.handleSignal(message);
      };

      this.ws.onclose = () => {
        this.emit('disconnected', { reason: 'signaling closed' });
      };
    });
  }

  private async handleSignal(message: any): Promise<void> {
    switch (message.type) {
      case 'participant-joined':
        await this.handleParticipantJoined(message);
        break;
      case 'participant-left':
        this.handleParticipantLeft(message);
        break;
      case 'offer':
        await this.handleOffer(message);
        break;
      case 'answer':
        await this.handleAnswer(message);
        break;
      case 'ice-candidate':
        await this.handleIceCandidate(message);
        break;
      case 'chat':
        this.handleChatMessage(message);
        break;
      case 'reaction':
        this.handleReaction(message);
        break;
      case 'hand-raised':
        this.handleHandRaised(message);
        break;
    }
  }

  private async handleParticipantJoined(message: any): Promise<void> {
    const participant = new Participant(
      message.participantId,
      message.displayName,
      false
    );
    this.participants.set(participant.id, participant);

    // Create peer connection
    const pc = this.createPeerConnection(participant.id);
    this.peerConnections.set(participant.id, pc);

    // Add local tracks
    this.localParticipant!.stream!.getTracks().forEach(track => {
      pc.addTrack(track, this.localParticipant!.stream!);
    });

    // Create and send offer (if we're the polite peer)
    if (this.localParticipant!.id < participant.id) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      this.sendSignal({
        type: 'offer',
        targetId: participant.id,
        offer: pc.localDescription
      });
    }

    this.emit('participantJoined', participant);
  }

  private handleParticipantLeft(message: any): void {
    const participant = this.participants.get(message.participantId);
    if (participant) {
      participant.destroy();
      this.participants.delete(message.participantId);
      this.peerConnections.get(message.participantId)?.close();
      this.peerConnections.delete(message.participantId);
      this.emit('participantLeft', participant);
    }
  }

  private createPeerConnection(peerId: string): RTCPeerConnection {
    const pc = new RTCPeerConnection({
      iceServers: this.config.iceServers || [
        { urls: 'stun:stun.l.google.com:19302' }
      ]
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignal({
          type: 'ice-candidate',
          targetId: peerId,
          candidate: event.candidate
        });
      }
    };

    pc.ontrack = (event) => {
      const participant = this.participants.get(peerId);
      if (participant && event.streams[0]) {
        participant.setStream(event.streams[0]);
      }
    };

    pc.onconnectionstatechange = () => {
      const participant = this.participants.get(peerId);
      if (participant) {
        const quality = this.mapConnectionStateToQuality(pc.connectionState);
        this.emit('connectionQualityChanged', { participantId: peerId, quality });
      }
    };

    return pc;
  }

  private mapConnectionStateToQuality(state: RTCPeerConnectionState): ParticipantState['connectionQuality'] {
    switch (state) {
      case 'connected': return 'excellent';
      case 'connecting': return 'good';
      case 'disconnected': return 'poor';
      default: return 'fair';
    }
  }

  private async handleOffer(message: any): Promise<void> {
    const pc = this.peerConnections.get(message.fromId) || this.createPeerConnection(message.fromId);
    if (!this.peerConnections.has(message.fromId)) {
      this.peerConnections.set(message.fromId, pc);
    }

    await pc.setRemoteDescription(message.offer);

    this.localParticipant!.stream!.getTracks().forEach(track => {
      pc.addTrack(track, this.localParticipant!.stream!);
    });

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    this.sendSignal({
      type: 'answer',
      targetId: message.fromId,
      answer: pc.localDescription
    });
  }

  private async handleAnswer(message: any): Promise<void> {
    const pc = this.peerConnections.get(message.fromId);
    if (pc) {
      await pc.setRemoteDescription(message.answer);
    }
  }

  private async handleIceCandidate(message: any): Promise<void> {
    const pc = this.peerConnections.get(message.fromId);
    if (pc) {
      await pc.addIceCandidate(message.candidate);
    }
  }

  // ==================== CHAT ====================

  sendChatMessage(text: string): void {
    const message: ChatMessage = {
      id: crypto.randomUUID(),
      senderId: this.localParticipant!.id,
      senderName: this.localParticipant!.name,
      text,
      timestamp: new Date(),
      type: 'text'
    };

    this.chatMessages.push(message);
    this.sendSignal({ type: 'chat', message });
    this.emit('chatMessage', message);
  }

  async sendFile(file: File): Promise<void> {
    // Upload file and get URL (implementation depends on backend)
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.config.signalingUrl.replace('ws', 'http')}/upload`, {
      method: 'POST',
      body: formData
    });
    const { url } = await response.json();

    const message: ChatMessage = {
      id: crypto.randomUUID(),
      senderId: this.localParticipant!.id,
      senderName: this.localParticipant!.name,
      text: `Shared file: ${file.name}`,
      timestamp: new Date(),
      type: 'file',
      fileUrl: url,
      fileName: file.name
    };

    this.chatMessages.push(message);
    this.sendSignal({ type: 'chat', message });
    this.emit('chatMessage', message);
  }

  private handleChatMessage(message: any): void {
    this.chatMessages.push(message.message);
    this.emit('chatMessage', message.message);
  }

  getChatHistory(): ChatMessage[] {
    return [...this.chatMessages];
  }

  // ==================== REACTIONS ====================

  react(emoji: string): void {
    this.localParticipant?.react(emoji);
    this.sendSignal({
      type: 'reaction',
      participantId: this.localParticipant!.id,
      emoji
    });
  }

  private handleReaction(message: any): void {
    const participant = this.participants.get(message.participantId);
    participant?.react(message.emoji);
  }

  // ==================== HAND RAISING ====================

  raiseHand(): void {
    this.localParticipant?.raiseHand();
    this.sendSignal({
      type: 'hand-raised',
      participantId: this.localParticipant!.id,
      raised: true
    });
  }

  lowerHand(): void {
    this.localParticipant?.lowerHand();
    this.sendSignal({
      type: 'hand-raised',
      participantId: this.localParticipant!.id,
      raised: false
    });
  }

  private handleHandRaised(message: any): void {
    const participant = this.participants.get(message.participantId);
    if (message.raised) {
      participant?.raiseHand();
    } else {
      participant?.lowerHand();
    }
  }

  // ==================== RECORDING ====================

  async startRecording(): Promise<void> {
    if (!this.config.enableRecording) return;

    // Create a composite stream of all participants
    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d')!;

    const audioContext = new AudioContext();
    const destination = audioContext.createMediaStreamDestination();

    // Mix all participant audio
    this.participants.forEach(p => {
      if (p.stream) {
        const source = audioContext.createMediaStreamSource(p.stream);
        source.connect(destination);
      }
    });

    // Create canvas stream with mixed audio
    const canvasStream = canvas.captureStream(30);
    const videoTrack = canvasStream.getVideoTracks()[0];
    const audioTrack = destination.stream.getAudioTracks()[0];
    if (!videoTrack || !audioTrack) return;
    const compositeStream = new MediaStream([videoTrack, audioTrack]);

    this.mediaRecorder = new MediaRecorder(compositeStream, {
      mimeType: 'video/webm;codecs=vp9,opus'
    });

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    this.mediaRecorder.start(1000);

    // Render loop
    const render = () => {
      if (!this.mediaRecorder || this.mediaRecorder.state !== 'recording') return;

      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const participants = Array.from(this.participants.values());
      const cols = Math.ceil(Math.sqrt(participants.length));
      const rows = Math.ceil(participants.length / cols);
      const cellWidth = canvas.width / cols;
      const cellHeight = canvas.height / rows;

      participants.forEach((p, i) => {
        if (p.stream) {
          const video = document.createElement('video');
          video.srcObject = p.stream;
          video.muted = true;
          video.play();

          const x = (i % cols) * cellWidth;
          const y = Math.floor(i / cols) * cellHeight;

          ctx.drawImage(video, x, y, cellWidth, cellHeight);
        }
      });

      requestAnimationFrame(render);
    };
    render();

    this.emit('recordingStarted', {});
  }

  stopRecording(): Blob {
    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
      const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
      this.recordedChunks = [];
      this.emit('recordingStopped', blob);
      return blob;
    }
    return new Blob();
  }

  // ==================== TRANSCRIPTION ====================

  private startTranscription(): void {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      console.warn('Speech recognition not supported');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    this.speechRecognition = new SpeechRecognition();
    this.speechRecognition.continuous = true;
    this.speechRecognition.interimResults = true;

    this.speechRecognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1];
      const segment: TranscriptionSegment = {
        id: crypto.randomUUID(),
        speakerId: this.localParticipant!.id,
        speakerName: this.localParticipant!.name,
        text: result[0].transcript,
        timestamp: new Date(),
        isFinal: result.isFinal
      };

      if (result.isFinal) {
        this.transcription.push(segment);
      }
      this.emit('transcription', segment);
    };

    this.speechRecognition.start();
  }

  getTranscription(): TranscriptionSegment[] {
    return [...this.transcription];
  }

  // ==================== LAYOUT ====================

  setLayout(mode: LayoutMode): void {
    this.layoutMode = mode;
    this.emit('layoutChanged', mode);
  }

  getLayout(): LayoutMode {
    return this.layoutMode;
  }

  pinParticipant(participantId: string): void {
    this.pinnedParticipantId = participantId;
    this.emit('participantPinned', participantId);
  }

  unpinParticipant(): void {
    this.pinnedParticipantId = null;
    this.emit('participantUnpinned', {});
  }

  // ==================== BREAKOUT ROOMS ====================

  createBreakoutRoom(name: string): string {
    const roomId = crypto.randomUUID();
    this.breakoutRooms.set(roomId, new Set());
    this.emit('breakoutRoomCreated', { roomId, name });
    return roomId;
  }

  assignToBreakoutRoom(participantId: string, breakoutRoomId: string): void {
    const room = this.breakoutRooms.get(breakoutRoomId);
    if (room) {
      // Remove from other breakout rooms
      this.breakoutRooms.forEach(r => r.delete(participantId));
      room.add(participantId);
      this.emit('participantAssigned', { participantId, breakoutRoomId });
    }
  }

  closeBreakoutRooms(): void {
    this.breakoutRooms.clear();
    this.emit('breakoutRoomsClosed', {});
  }

  // ==================== CONTROLS ====================

  mute(): void {
    this.localParticipant?.mute();
  }

  unmute(): void {
    this.localParticipant?.unmute();
  }

  hideVideo(): void {
    this.localParticipant?.hideVideo();
  }

  showVideo(): void {
    this.localParticipant?.showVideo();
  }

  async startScreenShare(): Promise<void> {
    const screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true
    });

    this.localParticipant?.setScreenStream(screenStream);

    // Replace video track in all peer connections
    const screenTrack = screenStream.getVideoTracks()[0];
    if (!screenTrack) return;

    this.peerConnections.forEach(pc => {
      const sender = pc.getSenders().find(s => s.track?.kind === 'video');
      sender?.replaceTrack(screenTrack);
    });

    screenTrack.onended = () => {
      this.stopScreenShare();
    };

    this.emit('screenShareStarted', { participantId: this.localParticipant!.id });
  }

  async stopScreenShare(): Promise<void> {
    if (this.localParticipant?.screenStream) {
      this.localParticipant.screenStream.getTracks().forEach(t => t.stop());
      this.localParticipant.setScreenStream(null);

      // Restore video track
      const videoTrack = this.localParticipant.stream?.getVideoTracks()[0];
      if (videoTrack) {
        this.peerConnections.forEach(pc => {
          const sender = pc.getSenders().find(s => s.track?.kind === 'video');
          sender?.replaceTrack(videoTrack);
        });
      }

      this.emit('screenShareStopped', { participantId: this.localParticipant.id });
    }
  }

  setVirtualBackground(config: VirtualBackgroundConfig): void {
    this.virtualBackground?.setConfig(config);
  }

  // ==================== UTILITIES ====================

  getParticipants(): Participant[] {
    return Array.from(this.participants.values());
  }

  getLocalParticipant(): Participant | null {
    return this.localParticipant;
  }

  getActiveSpeaker(): Participant | null {
    if (this.activeSpeakerId) {
      return this.participants.get(this.activeSpeakerId) || null;
    }

    // Find participant with highest audio level
    let maxLevel = 0;
    let activeSpeaker: Participant | null = null;

    this.participants.forEach(p => {
      const state = p.getState();
      if (state.audioLevel > maxLevel && !state.isMuted) {
        maxLevel = state.audioLevel;
        activeSpeaker = p;
      }
    });

    return activeSpeaker;
  }

  private sendSignal(message: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        ...message,
        fromId: this.localParticipant?.id
      }));
    }
  }

  on(event: string, callback: Function): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: any): void {
    this.listeners.get(event)?.forEach(cb => cb(data));
  }

  async leave(): Promise<void> {
    this.speechRecognition?.stop();
    this.mediaRecorder?.stop();
    this.virtualBackground?.destroy();
    this.audioEnhancer?.destroy();

    this.participants.forEach(p => p.destroy());
    this.peerConnections.forEach(pc => pc.close());

    this.ws?.close();

    this.participants.clear();
    this.peerConnections.clear();

    this.emit('left', {});
  }
}

// ============================================================================
// REACT HOOKS
// ============================================================================

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

function useVideoRoom(config: RoomConfig): UseVideoRoomResult {
  // State management with framework-agnostic approach
  let room: VideoRoom | null = null;
  let participants: Participant[] = [];
  let localParticipant: Participant | null = null;
  let activeSpeaker: Participant | null = null;
  let layout: LayoutMode = 'grid';
  let isConnected = false;
  let chatMessages: ChatMessage[] = [];

  const updateState = () => {
    if (room) {
      participants = room.getParticipants();
      localParticipant = room.getLocalParticipant();
      activeSpeaker = room.getActiveSpeaker();
      layout = room.getLayout();
      chatMessages = room.getChatHistory();
    }
  };

  const join = async () => {
    room = new VideoRoom(config);

    room.on('participantJoined', updateState);
    room.on('participantLeft', updateState);
    room.on('chatMessage', updateState);
    room.on('layoutChanged', updateState);

    await room.join();
    isConnected = true;
    updateState();
  };

  const leave = async () => {
    await room?.leave();
    room = null;
    isConnected = false;
    participants = [];
    localParticipant = null;
  };

  return {
    room,
    participants,
    localParticipant,
    activeSpeaker,
    layout,
    isConnected,
    chatMessages,
    join,
    leave,
    mute: () => room?.mute(),
    unmute: () => room?.unmute(),
    hideVideo: () => room?.hideVideo(),
    showVideo: () => room?.showVideo(),
    startScreenShare: () => room?.startScreenShare() || Promise.resolve(),
    stopScreenShare: () => room?.stopScreenShare() || Promise.resolve(),
    sendMessage: (text: string) => room?.sendChatMessage(text),
    react: (emoji: string) => room?.react(emoji),
    raiseHand: () => room?.raiseHand(),
    lowerHand: () => room?.lowerHand(),
    setLayout: (mode: LayoutMode) => room?.setLayout(mode),
    pinParticipant: (id: string) => room?.pinParticipant(id),
    unpinParticipant: () => room?.unpinParticipant(),
    setVirtualBackground: (config: VirtualBackgroundConfig) => room?.setVirtualBackground(config)
  };
}

function useParticipant(participant: Participant): ParticipantState {
  return participant.getState();
}

function useActiveSpeaker(room: VideoRoom): Participant | null {
  return room.getActiveSpeaker();
}

function useVirtualBackground(initialConfig?: VirtualBackgroundConfig): {
  config: VirtualBackgroundConfig;
  setType: (type: VirtualBackgroundConfig['type']) => void;
  setBlurStrength: (strength: number) => void;
  setBackgroundImage: (url: string) => void;
} {
  let config: VirtualBackgroundConfig = initialConfig || { type: 'none' };

  return {
    config,
    setType: (type) => { config = { ...config, type }; },
    setBlurStrength: (strength) => { config = { ...config, blurStrength: strength }; },
    setBackgroundImage: (url) => { config = { ...config, type: 'image', backgroundUrl: url }; }
  };
}

// ============================================================================
// PRE-BUILT COMPONENTS (FRAMEWORK AGNOSTIC)
// ============================================================================

interface VideoGridConfig {
  maxColumns?: number;
  aspectRatio?: number;
  gap?: number;
  showNames?: boolean;
  showMuteIndicator?: boolean;
  showConnectionQuality?: boolean;
}

class VideoGridLayout {
  private container: HTMLElement;
  private config: Required<VideoGridConfig>;
  private videoElements: Map<string, HTMLVideoElement> = new Map();

  constructor(container: HTMLElement, config: VideoGridConfig = {}) {
    this.container = container;
    this.config = {
      maxColumns: config.maxColumns ?? 4,
      aspectRatio: config.aspectRatio ?? 16 / 9,
      gap: config.gap ?? 8,
      showNames: config.showNames ?? true,
      showMuteIndicator: config.showMuteIndicator ?? true,
      showConnectionQuality: config.showConnectionQuality ?? true
    };

    this.setupContainer();
  }

  private setupContainer(): void {
    this.container.style.display = 'grid';
    this.container.style.gap = `${this.config.gap}px`;
    this.container.style.backgroundColor = '#1a1a1a';
    this.container.style.padding = `${this.config.gap}px`;
  }

  updateLayout(participants: Participant[]): void {
    const count = participants.length;
    const cols = Math.min(Math.ceil(Math.sqrt(count)), this.config.maxColumns);

    this.container.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

    // Create or update video elements
    participants.forEach(p => {
      let cell = this.videoElements.get(p.id)?.parentElement;
      if (!cell) {
        cell = this.createVideoCell(p);
        this.container.appendChild(cell);
      }
      this.updateVideoCell(cell, p);
    });

    // Remove old cells
    const participantIds = new Set(participants.map(p => p.id));
    this.videoElements.forEach((video, id) => {
      if (!participantIds.has(id)) {
        video.parentElement?.remove();
        this.videoElements.delete(id);
      }
    });
  }

  private createVideoCell(participant: Participant): HTMLElement {
    const cell = document.createElement('div');
    cell.style.position = 'relative';
    cell.style.aspectRatio = String(this.config.aspectRatio);
    cell.style.backgroundColor = '#2a2a2a';
    cell.style.borderRadius = '8px';
    cell.style.overflow = 'hidden';

    const video = document.createElement('video');
    video.autoplay = true;
    video.playsInline = true;
    video.muted = participant.isLocal;
    video.style.width = '100%';
    video.style.height = '100%';
    video.style.objectFit = 'cover';

    if (participant.stream) {
      video.srcObject = participant.stream;
    }

    cell.appendChild(video);
    this.videoElements.set(participant.id, video);

    // Name overlay
    if (this.config.showNames) {
      const nameOverlay = document.createElement('div');
      nameOverlay.className = 'participant-name';
      nameOverlay.style.cssText = `
        position: absolute;
        bottom: 8px;
        left: 8px;
        background: rgba(0,0,0,0.6);
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 14px;
      `;
      nameOverlay.textContent = participant.name;
      cell.appendChild(nameOverlay);
    }

    return cell;
  }

  private updateVideoCell(cell: HTMLElement, participant: Participant): void {
    const video = this.videoElements.get(participant.id);
    if (video && participant.stream && video.srcObject !== participant.stream) {
      video.srcObject = participant.stream;
    }

    const state = participant.getState();

    // Update mute indicator
    let muteIndicator = cell.querySelector('.mute-indicator') as HTMLElement;
    if (this.config.showMuteIndicator && state.isMuted) {
      if (!muteIndicator) {
        muteIndicator = document.createElement('div');
        muteIndicator.className = 'mute-indicator';
        muteIndicator.style.cssText = `
          position: absolute;
          top: 8px;
          right: 8px;
          background: #ef4444;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
        `;
        muteIndicator.textContent = '🔇';
        cell.appendChild(muteIndicator);
      }
    } else if (muteIndicator) {
      muteIndicator.remove();
    }

    // Update reaction
    let reactionOverlay = cell.querySelector('.reaction') as HTMLElement;
    if (state.reaction) {
      if (!reactionOverlay) {
        reactionOverlay = document.createElement('div');
        reactionOverlay.className = 'reaction';
        reactionOverlay.style.cssText = `
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 48px;
          animation: bounce 0.5s ease;
        `;
        cell.appendChild(reactionOverlay);
      }
      reactionOverlay.textContent = state.reaction;
    } else if (reactionOverlay) {
      reactionOverlay.remove();
    }
  }

  destroy(): void {
    this.videoElements.forEach(video => {
      video.srcObject = null;
    });
    this.container.innerHTML = '';
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  // Core classes
  VideoRoom,
  Participant,
  VirtualBackgroundProcessor,
  AudioEnhancer,
  VideoGridLayout,

  // Hooks
  useVideoRoom,
  useParticipant,
  useActiveSpeaker,
  useVirtualBackground,

  // Types
  type RoomConfig,
  type VirtualBackgroundConfig,
  type AudioEnhancementConfig,
  type ParticipantState,
  type ChatMessage,
  type TranscriptionSegment,
  type LayoutMode,
  type VideoGridConfig,
  type UseVideoRoomResult
};
