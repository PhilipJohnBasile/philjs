/**
 * PhilJS Brain-Computer Interface (BCI) Package
 * Production-ready neural signal processing and device integration
 */
export interface Brainwaves {
    delta: number;
    theta: number;
    alpha: number;
    beta: number;
    gamma: number;
    attention: number;
    meditation: number;
}
export interface BCIDeviceInfo {
    type: 'neurosky' | 'emotiv' | 'openbci' | 'muse' | 'generic';
    name: string;
    connected: boolean;
    sampleRate: number;
    channels: number;
    batteryLevel?: number;
}
export interface EEGSample {
    timestamp: number;
    channels: Float32Array;
    quality: number[];
}
export interface FrequencyBands {
    delta: number;
    theta: number;
    alpha: number;
    beta: number;
    gamma: number;
}
export interface MentalState {
    focus: number;
    relaxation: number;
    stress: number;
    drowsiness: number;
    engagement: number;
    timestamp: number;
}
export interface ERPEvent {
    type: 'P300' | 'N100' | 'N200' | 'P100' | 'N400' | 'P600';
    amplitude: number;
    latency: number;
    channel: number;
    timestamp: number;
}
export interface BlinkEvent {
    timestamp: number;
    duration: number;
    type: 'single' | 'double' | 'long';
}
export interface BCIConfig {
    sampleRate?: number;
    bufferSize?: number;
    notchFilter?: 50 | 60;
    bandpassLow?: number;
    bandpassHigh?: number;
    artifactRejection?: boolean;
    channels?: number[];
}
type EventCallback = (...args: any[]) => void;
export declare class BCIDevice {
    private deviceInfo;
    private connection;
    private config;
    private dataBuffer;
    private readonly maxBufferSize;
    private eventEmitter;
    private artifactDetector;
    private isRecording;
    private recordedData;
    constructor(config?: BCIConfig);
    /**
     * Connect to a BCI device
     */
    static connect(type?: 'neurosky' | 'emotiv' | 'openbci' | 'muse'): Promise<BCIDevice>;
    private connectDevice;
    private connectNeuroSky;
    private connectOpenBCI;
    private connectEmotiv;
    private connectMuse;
    private parseMusePacket;
    /**
     * Disconnect from device
     */
    disconnect(): Promise<void>;
    private handleBrainwaves;
    private handleEEGSample;
    /**
     * Compute band powers from buffer
     */
    private computeBandPowers;
    /**
     * Get current band powers
     */
    getBandPowers(): FrequencyBands;
    /**
     * Compute attention level from band powers
     */
    private computeAttention;
    /**
     * Compute meditation level from band powers
     */
    private computeMeditation;
    /**
     * Compute comprehensive mental state
     */
    private computeMentalState;
    /**
     * Get focus level (0-1)
     */
    getFocusLevel(): number;
    /**
     * Get meditation/relaxation level (0-1)
     */
    getMeditationLevel(): number;
    /**
     * Detect P300 ERP (for BCI spellers, etc.)
     */
    detectP300(epochs: Float32Array[], stimulusOnsets: number[]): ERPEvent[];
    /**
     * Start recording EEG data
     */
    startRecording(): void;
    /**
     * Stop recording and return data
     */
    stopRecording(): EEGSample[];
    /**
     * Export recorded data to CSV
     */
    exportToCSV(data: EEGSample[]): string;
    /**
     * Subscribe to events
     */
    on(event: 'connected' | 'disconnected' | 'brainwaves' | 'sample' | 'bandPowers' | 'mentalState' | 'focus' | 'relaxation' | 'blink' | 'recordingStarted' | 'recordingStopped', callback: EventCallback): void;
    /**
     * Unsubscribe from events
     */
    off(event: string, callback: EventCallback): void;
    /**
     * Subscribe to event once
     */
    once(event: string, callback: EventCallback): void;
    /**
     * Get device info
     */
    getDeviceInfo(): BCIDeviceInfo | null;
    /**
     * Check if connected
     */
    isConnected(): boolean;
    /**
     * Get raw data buffer
     */
    getBuffer(): Float32Array[];
}
export declare class NeuralInterface {
    private device;
    private interval;
    private listeners;
    private isSimulating;
    static connect(): NeuralInterface;
    static connectDevice(type?: 'neurosky' | 'emotiv' | 'openbci' | 'muse'): Promise<NeuralInterface>;
    private setupDeviceHandlers;
    private startSimulation;
    private generateSample;
    on(event: 'focus' | 'flow' | 'blink' | 'data', callback: (data: Brainwaves) => void): void;
    private emit;
    getStream(): () => Brainwaves | null;
    disconnect(): void;
}
export interface NeurofeedbackProtocol {
    name: string;
    targetBand: keyof FrequencyBands;
    threshold: number;
    direction: 'increase' | 'decrease';
    channels?: number[];
    duration: number;
}
export declare class NeurofeedbackTrainer {
    private device;
    private protocol;
    private sessionData;
    private isActive;
    private eventEmitter;
    constructor(device: BCIDevice, protocol: NeurofeedbackProtocol);
    /**
     * Start training session
     */
    start(): void;
    /**
     * Stop training session
     */
    stop(): {
        successRate: number;
        avgValue: number;
        data: typeof this.sessionData;
    };
    on(event: 'sessionStart' | 'sessionEnd' | 'feedback', callback: EventCallback): void;
}
export declare const PROTOCOLS: {
    alphaEnhancement: {
        name: string;
        targetBand: "alpha";
        threshold: number;
        direction: "increase";
        duration: number;
    };
    betaSuppression: {
        name: string;
        targetBand: "beta";
        threshold: number;
        direction: "decrease";
        duration: number;
    };
    smrTraining: {
        name: string;
        targetBand: "beta";
        threshold: number;
        direction: "increase";
        duration: number;
    };
    thetaAlpha: {
        name: string;
        targetBand: "theta";
        threshold: number;
        direction: "increase";
        duration: number;
    };
};
export {};
