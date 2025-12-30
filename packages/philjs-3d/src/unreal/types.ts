/**
 * @file Unreal Engine Integration Types
 * @description Type definitions for Unreal Engine Pixel Streaming integration with PhilJS
 */

/**
 * Pixel Streaming configuration
 */
export interface PixelStreamingConfig {
  /** Signaling server URL */
  signallingServerUrl: string;
  /** STUN server URL */
  stunServerUrl?: string;
  /** TURN server URL */
  turnServerUrl?: string;
  /** TURN username */
  turnUsername?: string;
  /** TURN credential */
  turnCredential?: string;
  /** Auto-connect on init */
  autoConnect?: boolean;
  /** Auto-play video */
  autoPlay?: boolean;
  /** Match viewport resolution */
  matchViewportResolution?: boolean;
  /** Start muted */
  startMuted?: boolean;
  /** Enable microphone */
  useMic?: boolean;
  /** Force TURN relay */
  forceTurn?: boolean;
  /** Use a specific video codec */
  preferredCodec?: 'H264' | 'VP8' | 'VP9';
}

/**
 * WebRTC statistics
 */
export interface WebRTCStats {
  /** Frames per second */
  fps: number;
  /** Bitrate in kbps */
  bitrate: number;
  /** Latency in ms */
  latency: number;
  /** Packet loss percentage */
  packetLoss: number;
  /** Video width */
  width: number;
  /** Video height */
  height: number;
  /** Codec being used */
  codec: string;
  /** Connection state */
  connectionState: RTCPeerConnectionState;
}

/**
 * Input event types
 */
export interface PixelStreamingInputEvent {
  type: 'keyboard' | 'mouse' | 'touch' | 'gamepad';
  data: KeyboardInputData | MouseInputData | TouchInputData | GamepadInputData;
}

export interface KeyboardInputData {
  type: 'keydown' | 'keyup';
  keyCode: number;
  repeat: boolean;
}

export interface MouseInputData {
  type: 'mousemove' | 'mousedown' | 'mouseup' | 'wheel';
  button?: number;
  x: number;
  y: number;
  deltaX?: number;
  deltaY?: number;
}

export interface TouchInputData {
  type: 'touchstart' | 'touchmove' | 'touchend';
  touches: Array<{
    id: number;
    x: number;
    y: number;
  }>;
}

export interface GamepadInputData {
  index: number;
  buttons: number[];
  axes: number[];
}

/**
 * Console command options
 */
export interface ConsoleCommandOptions {
  /** Command to execute */
  command: string;
  /** Whether to log the command */
  log?: boolean;
}

/**
 * Custom event from UE
 */
export interface UnrealCustomEvent {
  type: string;
  data: unknown;
}

/**
 * Pixel Streaming instance interface
 */
export interface PixelStreamingInstance {
  /** Connect to the signaling server */
  connect: () => Promise<void>;
  /** Disconnect from the server */
  disconnect: () => void;
  /** Reconnect to the server */
  reconnect: () => Promise<void>;
  /** Check if connected */
  isConnected: () => boolean;
  /** Get current stats */
  getStats: () => Promise<WebRTCStats>;
  /** Send keyboard input */
  sendKeyboardInput: (data: KeyboardInputData) => void;
  /** Send mouse input */
  sendMouseInput: (data: MouseInputData) => void;
  /** Send touch input */
  sendTouchInput: (data: TouchInputData) => void;
  /** Send gamepad input */
  sendGamepadInput: (data: GamepadInputData) => void;
  /** Execute console command */
  executeCommand: (command: string) => void;
  /** Send custom message to UE */
  sendMessage: (type: string, data: unknown) => void;
  /** Register event handler */
  on: (event: string, handler: (data: unknown) => void) => () => void;
  /** Mute/unmute video */
  setMuted: (muted: boolean) => void;
  /** Request fullscreen */
  requestFullscreen: () => Promise<void>;
  /** Exit fullscreen */
  exitFullscreen: () => Promise<void>;
  /** Set quality level */
  setQualityLevel: (level: number) => void;
  /** Request keyframe */
  requestKeyframe: () => void;
}

/**
 * Unreal embed props
 */
export interface UnrealEmbedProps {
  /** Signaling server URL */
  serverUrl: string;
  /** Width of the video */
  width?: number;
  /** Height of the video */
  height?: number;
  /** Video element ID */
  videoId?: string;
  /** Start video muted */
  startMuted?: boolean;
  /** Configuration options */
  config?: Partial<PixelStreamingConfig>;
  /** Called when connected */
  onConnect?: (instance: PixelStreamingInstance) => void;
  /** Called when connected and ready */
  onReady?: (instance: PixelStreamingInstance) => void;
  /** Called on disconnect */
  onDisconnect?: () => void;
  /** Called on error */
  onError?: (error: Error) => void;
  /** Called on custom event from UE */
  onCustomEvent?: (event: UnrealCustomEvent) => void;
  /** Called on stats update */
  onStats?: (stats: WebRTCStats) => void;
  /** Custom styles */
  style?: Record<string, string | number>;
  /** CSS class name */
  className?: string;
  /** Show controls overlay */
  showControls?: boolean;
  /** Enable input forwarding */
  enableInput?: boolean;
}

/**
 * Unreal state for PhilJS
 */
export interface UnrealState {
  instance: PixelStreamingInstance | null;
  isConnecting: boolean;
  isConnected: boolean;
  error: Error | null;
  stats: WebRTCStats | null;
  isMuted: boolean;
  isFullscreen: boolean;
}

/**
 * Use Unreal hook result
 */
export interface UseUnrealResult {
  /** Pixel Streaming instance */
  unreal: PixelStreamingInstance | null;
  /** Connecting state */
  isConnecting: boolean;
  /** Connected state */
  isConnected: boolean;
  /** Error if any */
  error: Error | null;
  /** Current stats */
  stats: WebRTCStats | null;
  /** Execute a console command */
  executeCommand: (command: string) => void;
  /** Send custom message to UE */
  sendMessage: (type: string, data: unknown) => void;
  /** Reconnect */
  reconnect: () => Promise<void>;
  /** Toggle mute */
  toggleMute: () => void;
  /** Request fullscreen */
  requestFullscreen: () => Promise<void>;
}
