/**
 * @philjs/eye-tracking - Gaze-Based Interactions
 *
 * Industry-first framework-native eye tracking:
 * - WebGazer.js integration for webcam-based tracking
 * - Gaze-aware UI components
 * - Dwell click activation
 * - Attention heatmaps
 * - Reading pattern analysis
 * - Accessibility features for motor impairments
 */
export interface GazePoint {
    x: number;
    y: number;
    timestamp: number;
    confidence: number;
}
export interface Fixation {
    x: number;
    y: number;
    startTime: number;
    duration: number;
    dispersal: number;
}
export interface Saccade {
    startPoint: GazePoint;
    endPoint: GazePoint;
    duration: number;
    velocity: number;
    amplitude: number;
}
export interface GazeEvent {
    type: 'enter' | 'leave' | 'dwell' | 'fixation';
    target: Element;
    gazePoint: GazePoint;
    dwellTime?: number;
    fixation?: Fixation;
}
export interface EyeTrackingConfig {
    calibrationPoints?: number;
    smoothing?: boolean;
    smoothingFactor?: number;
    fixationThreshold?: number;
    fixationDuration?: number;
    dwellThreshold?: number;
    showGazeCursor?: boolean;
    recordData?: boolean;
}
export interface HeatmapConfig {
    resolution?: number;
    radius?: number;
    maxOpacity?: number;
    gradient?: {
        [key: number]: string;
    };
}
export interface CalibrationResult {
    accuracy: number;
    precision: number;
    points: Array<{
        target: {
            x: number;
            y: number;
        };
        measured: {
            x: number;
            y: number;
        };
        error: number;
    }>;
}
export type GazeCallback = (point: GazePoint) => void;
export type GazeEventCallback = (event: GazeEvent) => void;
export declare class EyeTracker {
    private videoElement;
    private stream;
    private isTracking;
    private isCalibrated;
    private config;
    private gazeHistory;
    private readonly historyLength;
    private gazeCallbacks;
    private fixationCallbacks;
    private currentFixation;
    private animationFrame;
    constructor(config?: EyeTrackingConfig);
    initialize(): Promise<void>;
    calibrate(): Promise<CalibrationResult>;
    onGaze(callback: GazeCallback): () => void;
    onFixation(callback: (fixation: Fixation) => void): () => void;
    start(): void;
    private track;
    private getSimulatedGazePoint;
    private smoothGazePoint;
    private detectFixation;
    stop(): void;
    isActive(): boolean;
    isReady(): boolean;
    dispose(): void;
}
export declare class GazeAwareElement {
    private element;
    private tracker;
    private isGazeInside;
    private dwellStartTime;
    private callbacks;
    private dwellThreshold;
    private unsubscribe;
    constructor(element: Element, tracker: EyeTracker, dwellThreshold?: number);
    private setupTracking;
    on(event: 'enter' | 'leave' | 'dwell', callback: GazeEventCallback): () => void;
    private emit;
    dispose(): void;
}
export declare class DwellClick {
    private tracker;
    private dwellThreshold;
    private currentTarget;
    private dwellStartTime;
    private progressElement;
    private unsubscribe;
    private animationFrame;
    constructor(tracker: EyeTracker, dwellThreshold?: number);
    private createProgressElement;
    private setupTracking;
    private showProgress;
    private updateProgress;
    private resetDwell;
    private triggerClick;
    setThreshold(ms: number): void;
    dispose(): void;
}
export declare class AttentionHeatmap {
    private tracker;
    private canvas;
    private ctx;
    private data;
    private config;
    private unsubscribe;
    constructor(tracker: EyeTracker, config?: HeatmapConfig);
    private initializeData;
    start(): void;
    private addPoint;
    private render;
    private getColorForIntensity;
    clear(): void;
    getHotspots(threshold?: number): Array<{
        x: number;
        y: number;
        intensity: number;
    }>;
    exportData(): number[][];
    stop(): void;
}
export declare class ReadingAnalyzer {
    private tracker;
    private fixations;
    private saccades;
    private lastGazePoint;
    private unsubscribeGaze;
    private unsubscribeFixation;
    constructor(tracker: EyeTracker);
    start(): void;
    getReadingDirection(): 'ltr' | 'rtl' | 'unknown';
    getAverageFixationDuration(): number;
    getReadingSpeed(): number;
    getRegressionRate(): number;
    getSkippedAreas(): Array<{
        x: number;
        y: number;
        width: number;
        height: number;
    }>;
    stop(): void;
    reset(): void;
}
export declare class GazeCursor {
    private element;
    private tracker;
    private unsubscribe;
    constructor(tracker: EyeTracker);
    show(): void;
    hide(): void;
    setStyle(style: Partial<CSSStyleDeclaration>): void;
    dispose(): void;
}
export declare function useEyeTracking(config?: EyeTrackingConfig): {
    tracker: EyeTracker | null;
    isInitialized: boolean;
    isCalibrated: boolean;
    calibrate: () => Promise<CalibrationResult | null>;
    start: () => void | undefined;
    stop: () => void | undefined;
};
export declare function useGazePoint(tracker: EyeTracker | null): GazePoint | null;
export declare function useGazeAware(elementRef: {
    current: Element | null;
}, tracker: EyeTracker | null, options?: {
    dwellThreshold?: number;
}): {
    isGazing: boolean;
    dwellTime: number;
};
export declare function useDwellClick(tracker: EyeTracker | null, threshold?: number): {
    setThreshold: (ms: number) => void | undefined;
};
export declare function useAttentionHeatmap(tracker: EyeTracker | null, config?: HeatmapConfig): {
    clear: () => void | undefined;
    getHotspots: (threshold?: number) => {
        x: number;
        y: number;
        intensity: number;
    }[];
    exportData: () => number[][];
};
export declare function useReadingAnalysis(tracker: EyeTracker | null): {
    getReadingDirection: () => "ltr" | "rtl" | "unknown";
    getAverageFixationDuration: () => number;
    getReadingSpeed: () => number;
    getRegressionRate: () => number;
    getSkippedAreas: () => {
        x: number;
        y: number;
        width: number;
        height: number;
    }[];
    reset: () => void | undefined;
};
declare const _default: {
    EyeTracker: typeof EyeTracker;
    GazeAwareElement: typeof GazeAwareElement;
    DwellClick: typeof DwellClick;
    AttentionHeatmap: typeof AttentionHeatmap;
    ReadingAnalyzer: typeof ReadingAnalyzer;
    GazeCursor: typeof GazeCursor;
    useEyeTracking: typeof useEyeTracking;
    useGazePoint: typeof useGazePoint;
    useGazeAware: typeof useGazeAware;
    useDwellClick: typeof useDwellClick;
    useAttentionHeatmap: typeof useAttentionHeatmap;
    useReadingAnalysis: typeof useReadingAnalysis;
};
export default _default;
//# sourceMappingURL=index.d.ts.map