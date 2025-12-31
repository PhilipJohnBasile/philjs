/**
 * @philjs/screen-share - Advanced screen sharing for PhilJS
 *
 * Features:
 * - Multi-source screen capture (screen, window, tab)
 * - Real-time annotation overlay
 * - Presenter mode with webcam picture-in-picture
 * - Cursor highlighting and spotlight
 * - Region selection and cropping
 * - Frame rate control and quality optimization
 * - Screen recording with system audio
 * - Remote control (with permissions)
 */
interface ScreenShareConfig {
    preferredSource?: 'screen' | 'window' | 'tab';
    systemAudio?: boolean;
    selfBrowserAudio?: boolean;
    resolution?: {
        width: number;
        height: number;
    };
    frameRate?: number;
    cursorHighlight?: boolean;
    presenterMode?: boolean;
    webcamPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    webcamSize?: number;
}
interface AnnotationTool {
    type: 'pen' | 'highlighter' | 'arrow' | 'rectangle' | 'ellipse' | 'text' | 'spotlight' | 'laser';
    color: string;
    strokeWidth: number;
    opacity?: number;
}
interface Annotation {
    id: string;
    tool: AnnotationTool;
    points: Array<{
        x: number;
        y: number;
    }>;
    text?: string;
    timestamp: number;
}
interface CropRegion {
    x: number;
    y: number;
    width: number;
    height: number;
}
declare class CursorHighlighter {
    private canvas;
    private ctx;
    private cursorPos;
    private isSpotlight;
    private highlightRadius;
    private spotlightRadius;
    private clickRipples;
    private animationFrame;
    constructor(width: number, height: number);
    setCursorPosition(x: number, y: number): void;
    enableSpotlight(enabled: boolean): void;
    addClickRipple(x: number, y: number): void;
    render(): ImageData;
    getCanvas(): HTMLCanvasElement;
}
declare class AnnotationLayer {
    private canvas;
    private ctx;
    private annotations;
    private currentAnnotation;
    private currentTool;
    private isDrawing;
    private laserPosition;
    private listeners;
    constructor(width: number, height: number);
    private setupEventListeners;
    private handleMouseDown;
    private handleMouseMove;
    private handleMouseUp;
    setTool(tool: Partial<AnnotationTool>): void;
    addText(x: number, y: number, text: string): void;
    undo(): void;
    clear(): void;
    render(): void;
    private renderAnnotation;
    private drawPath;
    private drawArrow;
    private drawRectangle;
    private drawEllipse;
    private drawSpotlight;
    private renderLaser;
    getAnnotations(): Annotation[];
    setAnnotations(annotations: Annotation[]): void;
    getCanvas(): HTMLCanvasElement;
    on(event: string, callback: Function): () => void;
    private emit;
}
declare class PresenterMode {
    private mainCanvas;
    private ctx;
    private screenStream;
    private webcamStream;
    private position;
    private size;
    private screenVideo;
    private webcamVideo;
    private outputStream;
    private animationFrame;
    constructor(screenStream: MediaStream, position?: PresenterMode['position'], size?: number);
    enableWebcam(): Promise<void>;
    disableWebcam(): void;
    setPosition(position: PresenterMode['position']): void;
    setSize(size: number): void;
    private startCompositing;
    getOutputStream(): MediaStream;
    destroy(): void;
}
declare class RegionSelector {
    private overlay;
    private selection;
    private startPoint;
    private region;
    private resolve;
    constructor();
    private setupEventListeners;
    private handleMouseDown;
    private handleMouseMove;
    private handleMouseUp;
    private handleKeyDown;
    private cleanup;
    selectRegion(): Promise<CropRegion | null>;
}
declare class ScreenShareManager {
    private config;
    private screenStream;
    private presenterMode;
    private annotationLayer;
    private cursorHighlighter;
    private cropRegion;
    private compositeCanvas;
    private compositeCtx;
    private outputStream;
    private animationFrame;
    private mediaRecorder;
    private recordedChunks;
    private listeners;
    constructor(config?: ScreenShareConfig);
    start(): Promise<MediaStream>;
    private startCompositing;
    setAnnotationTool(tool: Partial<AnnotationTool>): void;
    addTextAnnotation(x: number, y: number, text: string): void;
    undoAnnotation(): void;
    clearAnnotations(): void;
    getAnnotations(): Annotation[];
    getAnnotationCanvas(): HTMLCanvasElement | null;
    setCursorPosition(x: number, y: number): void;
    enableSpotlight(enabled: boolean): void;
    addClickRipple(x: number, y: number): void;
    selectRegion(): Promise<CropRegion | null>;
    setCropRegion(region: CropRegion | null): void;
    enablePresenterMode(): Promise<void>;
    disablePresenterMode(): void;
    setWebcamPosition(position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'): void;
    setWebcamSize(size: number): void;
    startRecording(): void;
    stopRecording(): Blob;
    pauseRecording(): void;
    resumeRecording(): void;
    getOutputStream(): MediaStream | null;
    getScreenStream(): MediaStream | null;
    stop(): void;
    on(event: string, callback: Function): () => void;
    private emit;
}
interface UseScreenShareResult {
    isSharing: boolean;
    stream: MediaStream | null;
    annotations: Annotation[];
    start: () => Promise<void>;
    stop: () => void;
    setTool: (tool: Partial<AnnotationTool>) => void;
    undoAnnotation: () => void;
    clearAnnotations: () => void;
    enableSpotlight: (enabled: boolean) => void;
    selectRegion: () => Promise<void>;
    startRecording: () => void;
    stopRecording: () => Blob;
}
declare function useScreenShare(config?: ScreenShareConfig): UseScreenShareResult;
declare function useAnnotationTools(): {
    tools: AnnotationTool[];
    currentTool: AnnotationTool | undefined;
    setCurrentTool: (tool: AnnotationTool) => void;
    getToolByType: (type: AnnotationTool["type"]) => AnnotationTool | undefined;
};
declare function usePresenterMode(screenStream: MediaStream | null): {
    isEnabled: boolean;
    position: "bottom-right";
    size: number;
    enable: () => Promise<void>;
    disable: () => void;
    setPosition: (pos: PresenterMode["position"]) => void;
    setSize: (s: number) => void;
    getOutputStream: () => MediaStream | null;
};
export { ScreenShareManager, AnnotationLayer, CursorHighlighter, PresenterMode, RegionSelector, useScreenShare, useAnnotationTools, usePresenterMode, type ScreenShareConfig, type AnnotationTool, type Annotation, type CropRegion, type UseScreenShareResult };
//# sourceMappingURL=index.d.ts.map