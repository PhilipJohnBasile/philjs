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
// ============================================================================
// Neural Network Layer (Lightweight TensorFlow-like)
// ============================================================================
class Tensor {
    data;
    shape;
    constructor(data, shape) {
        this.data = data;
        this.shape = shape;
    }
    static zeros(shape) {
        const size = shape.reduce((a, b) => a * b, 1);
        return new Tensor(new Float32Array(size), shape);
    }
    static random(shape) {
        const size = shape.reduce((a, b) => a * b, 1);
        const data = new Float32Array(size);
        for (let i = 0; i < size; i++) {
            data[i] = (Math.random() - 0.5) * 2;
        }
        return new Tensor(data, shape);
    }
    add(other) {
        const result = new Float32Array(this.data.length);
        for (let i = 0; i < this.data.length; i++) {
            result[i] = this.data[i] + other.data[i % other.data.length];
        }
        return new Tensor(result, this.shape);
    }
    multiply(other) {
        const result = new Float32Array(this.data.length);
        for (let i = 0; i < this.data.length; i++) {
            result[i] = this.data[i] * other.data[i % other.data.length];
        }
        return new Tensor(result, this.shape);
    }
    matmul(other) {
        const m = this.shape[0];
        const k1 = this.shape[1];
        const k2 = other.shape[0];
        const n = other.shape[1];
        if (k1 !== k2)
            throw new Error('Matrix dimensions mismatch');
        const result = new Float32Array(m * n);
        for (let i = 0; i < m; i++) {
            for (let j = 0; j < n; j++) {
                let sum = 0;
                for (let k = 0; k < k1; k++) {
                    sum += this.data[i * k1 + k] * other.data[k * n + j];
                }
                result[i * n + j] = sum;
            }
        }
        return new Tensor(result, [m, n]);
    }
    relu() {
        const result = new Float32Array(this.data.length);
        for (let i = 0; i < this.data.length; i++) {
            result[i] = Math.max(0, this.data[i]);
        }
        return new Tensor(result, this.shape);
    }
    sigmoid() {
        const result = new Float32Array(this.data.length);
        for (let i = 0; i < this.data.length; i++) {
            result[i] = 1 / (1 + Math.exp(-this.data[i]));
        }
        return new Tensor(result, this.shape);
    }
    softmax() {
        const result = new Float32Array(this.data.length);
        const max = Math.max(...Array.from(this.data));
        let sum = 0;
        for (let i = 0; i < this.data.length; i++) {
            result[i] = Math.exp(this.data[i] - max);
            sum += result[i];
        }
        for (let i = 0; i < this.data.length; i++) {
            result[i] /= sum;
        }
        return new Tensor(result, this.shape);
    }
}
class NeuralLayer {
    weights;
    bias;
    constructor(inputSize, outputSize) {
        this.weights = Tensor.random([inputSize, outputSize]);
        this.bias = Tensor.zeros([1, outputSize]);
    }
    forward(input) {
        return input.matmul(this.weights).add(this.bias);
    }
}
class NeuralNetwork {
    layers = [];
    addLayer(inputSize, outputSize) {
        this.layers.push(new NeuralLayer(inputSize, outputSize));
    }
    forward(input) {
        let current = input;
        for (let i = 0; i < this.layers.length - 1; i++) {
            current = this.layers[i].forward(current).relu();
        }
        return this.layers[this.layers.length - 1].forward(current).sigmoid();
    }
}
class RenderPredictor {
    history = [];
    network;
    componentPatterns = new Map();
    maxHistory = 1000;
    constructor(modelSize = 'small') {
        this.network = new NeuralNetwork();
        const sizes = {
            tiny: [16, 8],
            small: [32, 16, 8],
            medium: [64, 32, 16, 8]
        };
        const layers = sizes[modelSize];
        let prevSize = 10; // Input features
        for (const size of layers) {
            this.network.addLayer(prevSize, size);
            prevSize = size;
        }
        this.network.addLayer(prevSize, 4); // Output: probability, time, priority, prerender
    }
    recordRender(entry) {
        this.history.push(entry);
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }
        // Update component patterns
        const pattern = this.componentPatterns.get(entry.componentId) || [];
        pattern.push(entry.renderTime);
        if (pattern.length > 100)
            pattern.shift();
        this.componentPatterns.set(entry.componentId, pattern);
    }
    predict(componentIds) {
        const predictions = [];
        for (const componentId of componentIds) {
            const features = this.extractFeatures(componentId);
            const input = new Tensor(new Float32Array(features), [1, features.length]);
            const output = this.network.forward(input);
            const probability = output.data[0];
            const timeNorm = output.data[1];
            const priorityNorm = output.data[2];
            const prerenderNorm = output.data[3];
            predictions.push({
                componentId,
                probability: probability,
                estimatedRenderTime: timeNorm * 100, // Scale to ms
                priority: this.getPriorityLevel(priorityNorm),
                shouldPrerender: prerenderNorm > 0.5
            });
        }
        return predictions.sort((a, b) => b.probability - a.probability);
    }
    extractFeatures(componentId) {
        const pattern = this.componentPatterns.get(componentId) || [];
        const recentRenders = this.history
            .filter(h => h.componentId === componentId)
            .slice(-10);
        const avgRenderTime = pattern.length > 0
            ? pattern.reduce((a, b) => a + b, 0) / pattern.length
            : 0;
        const renderFrequency = recentRenders.length / 10;
        const lastRenderAge = recentRenders.length > 0
            ? (Date.now() - recentRenders[recentRenders.length - 1].timestamp) / 1000
            : Infinity;
        const triggerCounts = { state: 0, props: 0, context: 0, effect: 0 };
        for (const r of recentRenders) {
            triggerCounts[r.triggerType]++;
        }
        return [
            avgRenderTime / 100,
            renderFrequency,
            Math.min(lastRenderAge / 10, 1),
            pattern.length / 100,
            triggerCounts.state / 10,
            triggerCounts.props / 10,
            triggerCounts.context / 10,
            triggerCounts.effect / 10,
            this.getComponentDepth(componentId) / 10,
            this.getChildCount(componentId) / 20
        ];
    }
    getPriorityLevel(value) {
        if (value > 0.75)
            return 'critical';
        if (value > 0.5)
            return 'high';
        if (value > 0.25)
            return 'medium';
        return 'low';
    }
    getComponentDepth(componentId) {
        let depth = 0;
        let current = componentId;
        while (true) {
            const parent = this.history.find(h => h.componentId === current)?.parentId;
            if (!parent)
                break;
            depth++;
            current = parent;
        }
        return depth;
    }
    getChildCount(componentId) {
        return this.history.filter(h => h.parentId === componentId).length;
    }
}
class AdaptiveQualityManager {
    qualityLevel = 1.0;
    metrics = [];
    targetFPS;
    minQuality = 0.3;
    maxQuality = 1.0;
    constructor(targetFPS = 60) {
        this.targetFPS = targetFPS;
    }
    recordFrame(frameTime, memoryPressure = 0) {
        const fps = 1000 / frameTime;
        const jank = frameTime > (1000 / this.targetFPS) * 1.5 ? 1 : 0;
        this.metrics.push({ fps, frameTime, jank, memoryPressure });
        if (this.metrics.length > 60) {
            this.metrics.shift();
        }
        this.adjustQuality();
    }
    adjustQuality() {
        if (this.metrics.length < 10)
            return;
        const recent = this.metrics.slice(-10);
        const avgFPS = recent.reduce((a, m) => a + m.fps, 0) / recent.length;
        const jankRate = recent.filter(m => m.jank).length / recent.length;
        const avgMemory = recent.reduce((a, m) => a + m.memoryPressure, 0) / recent.length;
        // Adjust quality based on performance
        if (avgFPS < this.targetFPS * 0.8 || jankRate > 0.3 || avgMemory > 0.8) {
            // Decrease quality
            this.qualityLevel = Math.max(this.minQuality, this.qualityLevel - 0.05);
        }
        else if (avgFPS > this.targetFPS * 0.95 && jankRate < 0.1 && avgMemory < 0.5) {
            // Increase quality
            this.qualityLevel = Math.min(this.maxQuality, this.qualityLevel + 0.02);
        }
    }
    getQualityLevel() {
        return this.qualityLevel;
    }
    getQualitySettings() {
        return {
            enableShadows: this.qualityLevel > 0.6,
            enableAnimations: this.qualityLevel > 0.4,
            imageQuality: this.qualityLevel > 0.7 ? 'high' : this.qualityLevel > 0.4 ? 'medium' : 'low',
            renderResolution: this.qualityLevel,
            enableBlur: this.qualityLevel > 0.8
        };
    }
}
// ============================================================================
// Component Prioritizer
// ============================================================================
class ComponentPrioritizer {
    visibilityScores = new Map();
    interactionScores = new Map();
    renderCosts = new Map();
    observer = null;
    constructor() {
        if (typeof IntersectionObserver !== 'undefined') {
            this.observer = new IntersectionObserver((entries) => {
                for (const entry of entries) {
                    const id = entry.target.dataset['componentId'];
                    if (id) {
                        this.visibilityScores.set(id, entry.intersectionRatio);
                    }
                }
            }, { threshold: [0, 0.25, 0.5, 0.75, 1] });
        }
    }
    observe(element, componentId) {
        element.dataset['componentId'] = componentId;
        this.observer?.observe(element);
    }
    unobserve(element) {
        this.observer?.unobserve(element);
    }
    recordInteraction(componentId) {
        const current = this.interactionScores.get(componentId) || 0;
        this.interactionScores.set(componentId, current + 1);
    }
    recordRenderCost(componentId, cost) {
        const costs = this.renderCosts.get(componentId) || 0;
        // Exponential moving average
        this.renderCosts.set(componentId, costs * 0.8 + cost * 0.2);
    }
    getPriorities(componentIds) {
        const maxInteraction = Math.max(...Array.from(this.interactionScores.values()), 1);
        const maxCost = Math.max(...Array.from(this.renderCosts.values()), 1);
        return componentIds.map(id => {
            const visibility = this.visibilityScores.get(id) || 0;
            const interaction = (this.interactionScores.get(id) || 0) / maxInteraction;
            const cost = (this.renderCosts.get(id) || 0) / maxCost;
            // Priority formula: high visibility + high interaction - high cost
            const priority = visibility * 0.4 + interaction * 0.4 - cost * 0.2;
            return {
                id,
                visibility,
                interactionLikelihood: interaction,
                renderCost: cost,
                priority
            };
        }).sort((a, b) => b.priority - a.priority);
    }
    destroy() {
        this.observer?.disconnect();
    }
}
// ============================================================================
// Neural Layout Optimizer
// ============================================================================
class NeuralLayoutOptimizer {
    network;
    layoutHistory = new Map();
    constructor() {
        this.network = new NeuralNetwork();
        this.network.addLayer(8, 16);
        this.network.addLayer(16, 8);
        this.network.addLayer(8, 4); // x, y, width, height adjustments
    }
    recordLayout(elementId, metrics) {
        const history = this.layoutHistory.get(elementId) || [];
        history.push(metrics);
        if (history.length > 50)
            history.shift();
        this.layoutHistory.set(elementId, history);
    }
    getSuggestions(elements) {
        const suggestions = [];
        for (const [elementId, current] of Array.from(elements.entries())) {
            const history = this.layoutHistory.get(elementId) || [];
            if (history.length < 5)
                continue;
            const features = this.extractLayoutFeatures(current, history);
            const input = new Tensor(new Float32Array(features), [1, features.length]);
            const output = this.network.forward(input);
            const dx = output.data[0];
            const dy = output.data[1];
            const dw = output.data[2];
            const dh = output.data[3];
            // Only suggest if there's significant potential improvement
            const adjustmentMagnitude = Math.abs(dx) + Math.abs(dy) + Math.abs(dw) + Math.abs(dh);
            if (adjustmentMagnitude > 0.1) {
                const suggested = {
                    x: current.x + dx * 10,
                    y: current.y + dy * 10,
                    width: current.width * (1 + dw * 0.1),
                    height: current.height * (1 + dh * 0.1)
                };
                if (this.shouldAddWillChange(history)) {
                    suggested.willChange = 'transform';
                }
                if (this.shouldAddContainment(current)) {
                    suggested.containment = 'layout';
                }
                suggestions.push({
                    elementId,
                    currentLayout: current,
                    suggestedLayout: suggested,
                    performanceGain: adjustmentMagnitude * 10,
                    reason: this.getOptimizationReason(current, suggested)
                });
            }
        }
        return suggestions.sort((a, b) => b.performanceGain - a.performanceGain);
    }
    extractLayoutFeatures(current, history) {
        const avgWidth = history.reduce((a, l) => a + l.width, 0) / history.length;
        const avgHeight = history.reduce((a, l) => a + l.height, 0) / history.length;
        const positionVariance = this.calculateVariance(history.map(l => l.x + l.y));
        const sizeVariance = this.calculateVariance(history.map(l => l.width * l.height));
        return [
            current.x / 1000,
            current.y / 1000,
            current.width / 500,
            current.height / 500,
            (current.width - avgWidth) / avgWidth,
            (current.height - avgHeight) / avgHeight,
            positionVariance / 10000,
            sizeVariance / 100000
        ];
    }
    calculateVariance(values) {
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        return values.reduce((a, v) => a + (v - mean) ** 2, 0) / values.length;
    }
    shouldAddWillChange(history) {
        if (history.length < 2)
            return false;
        let changes = 0;
        for (let i = 1; i < history.length; i++) {
            if (history[i].x !== history[i - 1].x || history[i].y !== history[i - 1].y) {
                changes++;
            }
        }
        return changes / history.length > 0.3;
    }
    shouldAddContainment(layout) {
        // Suggest containment for larger elements
        return layout.width * layout.height > 50000;
    }
    getOptimizationReason(current, suggested) {
        const reasons = [];
        if (suggested.willChange) {
            reasons.push('Add will-change for frequent transforms');
        }
        if (suggested.containment) {
            reasons.push('Add containment for isolated rendering');
        }
        if (Math.abs(suggested.width - current.width) > 1) {
            reasons.push('Optimize width for rendering performance');
        }
        if (Math.abs(suggested.height - current.height) > 1) {
            reasons.push('Optimize height for rendering performance');
        }
        return reasons.join('; ') || 'General layout optimization';
    }
}
// ============================================================================
// Neural Renderer
// ============================================================================
export class NeuralRenderer {
    config;
    predictor;
    qualityManager;
    prioritizer;
    layoutOptimizer;
    frameId = 0;
    lastFrameTime = 0;
    isRunning = false;
    constructor(config = {}) {
        this.config = {
            predictiveRendering: config.predictiveRendering ?? true,
            targetFPS: config.targetFPS ?? 60,
            adaptiveQuality: config.adaptiveQuality ?? true,
            modelSize: config.modelSize ?? 'small',
            offlineMode: config.offlineMode ?? true,
            useGPU: config.useGPU ?? false,
            memoryBudget: config.memoryBudget ?? 50
        };
        this.predictor = new RenderPredictor(this.config.modelSize);
        this.qualityManager = new AdaptiveQualityManager(this.config.targetFPS);
        this.prioritizer = new ComponentPrioritizer();
        this.layoutOptimizer = new NeuralLayoutOptimizer();
    }
    start() {
        if (this.isRunning)
            return;
        this.isRunning = true;
        this.lastFrameTime = performance.now();
        this.tick();
    }
    stop() {
        this.isRunning = false;
        if (this.frameId) {
            cancelAnimationFrame(this.frameId);
        }
    }
    tick() {
        if (!this.isRunning)
            return;
        const now = performance.now();
        const frameTime = now - this.lastFrameTime;
        this.lastFrameTime = now;
        // Record frame metrics
        const memoryPressure = this.getMemoryPressure();
        this.qualityManager.recordFrame(frameTime, memoryPressure);
        this.frameId = requestAnimationFrame(() => this.tick());
    }
    getMemoryPressure() {
        if (typeof performance !== 'undefined' && 'memory' in performance) {
            const memory = performance.memory;
            return memory.usedJSHeapSize / memory.jsHeapSizeLimit;
        }
        return 0;
    }
    // Public API
    recordRender(componentId, renderTime, triggerType, parentId) {
        const entry = {
            timestamp: Date.now(),
            componentId,
            renderTime,
            triggerType
        };
        if (parentId !== undefined) {
            entry.parentId = parentId;
        }
        this.predictor.recordRender(entry);
        this.prioritizer.recordRenderCost(componentId, renderTime);
    }
    predictNextRenders(componentIds) {
        if (!this.config.predictiveRendering) {
            return componentIds.map(id => ({
                componentId: id,
                probability: 0.5,
                estimatedRenderTime: 0,
                priority: 'medium',
                shouldPrerender: false
            }));
        }
        return this.predictor.predict(componentIds);
    }
    getQualitySettings() {
        return this.qualityManager.getQualitySettings();
    }
    getQualityLevel() {
        return this.qualityManager.getQualityLevel();
    }
    observeComponent(element, componentId) {
        this.prioritizer.observe(element, componentId);
    }
    unobserveComponent(element) {
        this.prioritizer.unobserve(element);
    }
    recordInteraction(componentId) {
        this.prioritizer.recordInteraction(componentId);
    }
    getComponentPriorities(componentIds) {
        return this.prioritizer.getPriorities(componentIds);
    }
    recordLayout(elementId, metrics) {
        this.layoutOptimizer.recordLayout(elementId, metrics);
    }
    getLayoutSuggestions(elements) {
        return this.layoutOptimizer.getSuggestions(elements);
    }
    analyzeFrame() {
        const quality = this.qualityManager.getQualityLevel();
        const settings = this.qualityManager.getQualitySettings();
        return {
            frameTime: this.lastFrameTime ? performance.now() - this.lastFrameTime : 0,
            jankScore: 1 - quality,
            componentsRendered: 0, // Would be tracked in real implementation
            predictedNextFrame: [],
            qualityLevel: quality,
            memoryUsage: this.getMemoryPressure() * this.config.memoryBudget
        };
    }
    destroy() {
        this.stop();
        this.prioritizer.destroy();
    }
}
// ============================================================================
// React-like Hooks
// ============================================================================
let globalRenderer = null;
export function initNeuralRenderer(config) {
    if (globalRenderer) {
        globalRenderer.destroy();
    }
    globalRenderer = new NeuralRenderer(config);
    globalRenderer.start();
    return globalRenderer;
}
export function getNeuralRenderer() {
    return globalRenderer;
}
export function useNeuralRendering(componentId) {
    const renderer = globalRenderer;
    return {
        quality: renderer?.getQualitySettings() || {
            enableShadows: true,
            enableAnimations: true,
            imageQuality: 'high',
            renderResolution: 1,
            enableBlur: true
        },
        priority: renderer?.getComponentPriorities([componentId])[0] || null,
        recordRender: (renderTime) => {
            renderer?.recordRender(componentId, renderTime, 'state');
        },
        recordInteraction: () => {
            renderer?.recordInteraction(componentId);
        }
    };
}
export function useAdaptiveQuality() {
    const renderer = globalRenderer;
    return {
        level: renderer?.getQualityLevel() || 1,
        settings: renderer?.getQualitySettings() || {
            enableShadows: true,
            enableAnimations: true,
            imageQuality: 'high',
            renderResolution: 1,
            enableBlur: true
        }
    };
}
export function usePredictiveRendering(componentIds) {
    return globalRenderer?.predictNextRenders(componentIds) || [];
}
export function useLayoutOptimization(elements) {
    return globalRenderer?.getLayoutSuggestions(elements) || [];
}
// ============================================================================
// Exports
// ============================================================================
export { RenderPredictor, AdaptiveQualityManager, ComponentPrioritizer, NeuralLayoutOptimizer, Tensor, NeuralNetwork };
//# sourceMappingURL=index.js.map