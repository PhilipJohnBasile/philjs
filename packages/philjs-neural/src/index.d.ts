/**
 * @philjs/neural - Neural Rendering Engine
 *
 * AI-powered rendering optimization using neural networks:
 * - Predictive frame rendering
 * - Adaptive quality scaling
 * - Smart component prioritization
 * - Neural layout optimization
 * - Render path prediction
 * - Memory-efficient DOM diffing with ML
 *
 * NO OTHER FRAMEWORK HAS THIS.
 */
export interface NeuralRendererConfig {
    /** Enable predictive rendering */
    predictiveRendering?: boolean;
    /** Target frame rate */
    targetFPS?: number;
    /** Enable adaptive quality */
    adaptiveQuality?: boolean;
    /** Neural model size: 'tiny' | 'small' | 'medium' */
    modelSize?: 'tiny' | 'small' | 'medium';
    /** Enable offline inference */
    offlineMode?: boolean;
    /** GPU acceleration */
    useGPU?: boolean;
    /** Memory budget in MB */
    memoryBudget?: number;
}
export interface RenderPrediction {
    componentId: string;
    probability: number;
    estimatedRenderTime: number;
    priority: 'critical' | 'high' | 'medium' | 'low';
    shouldPrerender: boolean;
}
export interface FrameAnalysis {
    frameTime: number;
    jankScore: number;
    componentsRendered: number;
    predictedNextFrame: RenderPrediction[];
    qualityLevel: number;
    memoryUsage: number;
}
export interface NeuralLayoutSuggestion {
    elementId: string;
    currentLayout: LayoutMetrics;
    suggestedLayout: LayoutMetrics;
    performanceGain: number;
    reason: string;
}
export interface LayoutMetrics {
    x: number;
    y: number;
    width: number;
    height: number;
    willChange?: string;
    containment?: string;
}
export interface ComponentPriority {
    id: string;
    visibility: number;
    interactionLikelihood: number;
    renderCost: number;
    priority: number;
}
declare class Tensor {
    data: Float32Array;
    shape: number[];
    constructor(data: Float32Array, shape: number[]);
    static zeros(shape: number[]): Tensor;
    static random(shape: number[]): Tensor;
    add(other: Tensor): Tensor;
    multiply(other: Tensor): Tensor;
    matmul(other: Tensor): Tensor;
    relu(): Tensor;
    sigmoid(): Tensor;
    softmax(): Tensor;
}
declare class NeuralLayer {
    weights: Tensor;
    bias: Tensor;
    constructor(inputSize: number, outputSize: number);
    forward(input: Tensor): Tensor;
}
declare class NeuralNetwork {
    layers: NeuralLayer[];
    addLayer(inputSize: number, outputSize: number): void;
    forward(input: Tensor): Tensor;
}
interface RenderHistoryEntry {
    timestamp: number;
    componentId: string;
    renderTime: number;
    triggerType: 'state' | 'props' | 'context' | 'effect';
    parentId?: string;
}
declare class RenderPredictor {
    private history;
    private network;
    private componentPatterns;
    private readonly maxHistory;
    constructor(modelSize?: 'tiny' | 'small' | 'medium');
    recordRender(entry: RenderHistoryEntry): void;
    predict(componentIds: string[]): RenderPrediction[];
    private extractFeatures;
    private getPriorityLevel;
    private getComponentDepth;
    private getChildCount;
}
declare class AdaptiveQualityManager {
    private qualityLevel;
    private metrics;
    private readonly targetFPS;
    private readonly minQuality;
    private readonly maxQuality;
    constructor(targetFPS?: number);
    recordFrame(frameTime: number, memoryPressure?: number): void;
    private adjustQuality;
    getQualityLevel(): number;
    getQualitySettings(): {
        enableShadows: boolean;
        enableAnimations: boolean;
        imageQuality: 'low' | 'medium' | 'high';
        renderResolution: number;
        enableBlur: boolean;
    };
}
declare class ComponentPrioritizer {
    private visibilityScores;
    private interactionScores;
    private renderCosts;
    private observer;
    constructor();
    observe(element: Element, componentId: string): void;
    unobserve(element: Element): void;
    recordInteraction(componentId: string): void;
    recordRenderCost(componentId: string, cost: number): void;
    getPriorities(componentIds: string[]): ComponentPriority[];
    destroy(): void;
}
declare class NeuralLayoutOptimizer {
    private network;
    private layoutHistory;
    constructor();
    recordLayout(elementId: string, metrics: LayoutMetrics): void;
    getSuggestions(elements: Map<string, LayoutMetrics>): NeuralLayoutSuggestion[];
    private extractLayoutFeatures;
    private calculateVariance;
    private shouldAddWillChange;
    private shouldAddContainment;
    private getOptimizationReason;
}
export declare class NeuralRenderer {
    private config;
    private predictor;
    private qualityManager;
    private prioritizer;
    private layoutOptimizer;
    private frameId;
    private lastFrameTime;
    private isRunning;
    constructor(config?: NeuralRendererConfig);
    start(): void;
    stop(): void;
    private tick;
    private getMemoryPressure;
    recordRender(componentId: string, renderTime: number, triggerType: 'state' | 'props' | 'context' | 'effect', parentId?: string): void;
    predictNextRenders(componentIds: string[]): RenderPrediction[];
    getQualitySettings(): ReturnType<AdaptiveQualityManager['getQualitySettings']>;
    getQualityLevel(): number;
    observeComponent(element: Element, componentId: string): void;
    unobserveComponent(element: Element): void;
    recordInteraction(componentId: string): void;
    getComponentPriorities(componentIds: string[]): ComponentPriority[];
    recordLayout(elementId: string, metrics: LayoutMetrics): void;
    getLayoutSuggestions(elements: Map<string, LayoutMetrics>): NeuralLayoutSuggestion[];
    analyzeFrame(): FrameAnalysis;
    destroy(): void;
}
export declare function initNeuralRenderer(config?: NeuralRendererConfig): NeuralRenderer;
export declare function getNeuralRenderer(): NeuralRenderer | null;
export declare function useNeuralRendering(componentId: string): {
    quality: ReturnType<AdaptiveQualityManager['getQualitySettings']>;
    priority: ComponentPriority | null;
    recordRender: (renderTime: number) => void;
    recordInteraction: () => void;
};
export declare function useAdaptiveQuality(): {
    level: number;
    settings: ReturnType<AdaptiveQualityManager['getQualitySettings']>;
};
export declare function usePredictiveRendering(componentIds: string[]): RenderPrediction[];
export declare function useLayoutOptimization(elements: Map<string, LayoutMetrics>): NeuralLayoutSuggestion[];
export { RenderPredictor, AdaptiveQualityManager, ComponentPrioritizer, NeuralLayoutOptimizer, Tensor, NeuralNetwork };
//# sourceMappingURL=index.d.ts.map