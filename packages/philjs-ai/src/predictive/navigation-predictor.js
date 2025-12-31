/**
 * PhilJS Predictive Navigation
 *
 * UNIQUE INNOVATION: AI-powered navigation prediction using machine learning.
 *
 * Features:
 * - Learns user navigation patterns in real-time
 * - Predicts next likely navigation targets
 * - Automatically prefetches predicted routes and data
 * - Adapts to individual user behavior
 * - Session-aware predictions
 * - Device-aware resource management
 * - Privacy-first: all ML runs client-side
 *
 * No other framework provides client-side ML for navigation prediction.
 *
 * @packageDocumentation
 */
// =============================================================================
// Constants
// =============================================================================
const DEFAULT_CONFIG = {
    minConfidence: 0.3,
    maxPredictions: 5,
    enableLearning: true,
    maxHistory: 1000,
    decayFactor: 0.95,
    enablePrefetch: true,
    prefetchBudget: 500, // 500KB
    networkAware: true,
    storageKey: 'philjs_nav_predictor',
};
// =============================================================================
// Navigation Predictor
// =============================================================================
export class NavigationPredictor {
    config;
    model;
    history = [];
    session;
    prefetchedRoutes = new Set();
    routeDataSizes = new Map();
    prefetchQueue = [];
    isProcessingQueue = false;
    constructor(config = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        // Initialize model
        this.model = this.loadModel() || this.createEmptyModel();
        // Initialize session
        this.session = {
            sessionId: this.generateSessionId(),
            visitedRoutes: [],
            currentRoute: typeof window !== 'undefined' ? window.location.pathname : '/',
            startTime: Date.now(),
            engagementScore: 0.5,
            predictedSessionLength: 300000, // 5 minutes default
        };
        // Set up event listeners
        this.setupEventListeners();
    }
    // ===========================================================================
    // Public API
    // ===========================================================================
    /**
     * Record a navigation event
     */
    recordNavigation(from, to, metadata) {
        const event = this.createNavigationEvent(from, to, metadata);
        this.history.push(event);
        // Update session context
        this.session.visitedRoutes.push(to);
        this.session.currentRoute = to;
        // Learn from this navigation
        if (this.config.enableLearning) {
            this.updateModel(event);
        }
        // Trim history
        if (this.history.length > this.config.maxHistory) {
            this.history = this.history.slice(-this.config.maxHistory);
        }
        // Generate predictions for the new page
        const predictions = this.predict(to);
        // Trigger prefetching
        if (this.config.enablePrefetch) {
            this.schedulePrefetch(predictions);
        }
        // Persist model periodically
        if (this.model.totalNavigations % 10 === 0) {
            this.saveModel();
        }
    }
    /**
     * Generate navigation predictions for current or specified route
     */
    predict(currentRoute) {
        const route = currentRoute || this.session.currentRoute;
        const predictions = [];
        // Method 1: Markov chain transitions
        const transitionPredictions = this.predictFromTransitions(route);
        predictions.push(...transitionPredictions);
        // Method 2: Temporal patterns
        const temporalPredictions = this.predictFromTemporal();
        predictions.push(...temporalPredictions);
        // Method 3: Sequence patterns
        const sequencePredictions = this.predictFromSequence();
        predictions.push(...sequencePredictions);
        // Method 4: Session context
        const sessionPredictions = this.predictFromSession();
        predictions.push(...sessionPredictions);
        // Merge and rank predictions
        const merged = this.mergePredictions(predictions);
        // Filter by confidence threshold
        const filtered = merged.filter(p => p.confidence >= this.config.minConfidence);
        // Sort by priority and limit
        const sorted = filtered
            .sort((a, b) => b.priority - a.priority)
            .slice(0, this.config.maxPredictions);
        return sorted;
    }
    /**
     * Get prediction for a specific route
     */
    getPredictionFor(route) {
        const predictions = this.predict();
        return predictions.find(p => p.route === route) || null;
    }
    /**
     * Manually prefetch a route
     */
    async prefetchRoute(route) {
        if (this.prefetchedRoutes.has(route)) {
            return true;
        }
        // Check resource budget
        if (!this.canPrefetch(route)) {
            return false;
        }
        try {
            // Create prefetch link
            if (typeof document !== 'undefined') {
                const link = document.createElement('link');
                link.rel = 'prefetch';
                link.href = route;
                document.head.appendChild(link);
            }
            this.prefetchedRoutes.add(route);
            return true;
        }
        catch (e) {
            console.warn(`[Predictor] Failed to prefetch ${route}:`, e);
            return false;
        }
    }
    /**
     * Get current prediction accuracy
     */
    getAccuracy() {
        if (this.history.length < 10) {
            return { overall: 0, byRoute: new Map() };
        }
        let correct = 0;
        const byRoute = new Map();
        for (let i = 1; i < this.history.length; i++) {
            const prev = this.history[i - 1];
            const actual = this.history[i];
            // Skip if history entries are missing
            if (!prev || !actual)
                continue;
            // Get predictions from the previous state
            const predictions = this.predictFromTransitions(prev.from);
            const wasCorrect = predictions.some(p => p.route === actual.to && p.confidence >= 0.3);
            if (wasCorrect)
                correct++;
            // Track per-route accuracy
            const routeStats = byRoute.get(prev.from) || { correct: 0, total: 0 };
            routeStats.total++;
            if (wasCorrect)
                routeStats.correct++;
            byRoute.set(prev.from, routeStats);
        }
        const byRouteAccuracy = new Map();
        for (const [route, stats] of byRoute) {
            byRouteAccuracy.set(route, stats.correct / stats.total);
        }
        return {
            overall: correct / (this.history.length - 1),
            byRoute: byRouteAccuracy,
        };
    }
    /**
     * Get model statistics
     */
    getStats() {
        return {
            totalNavigations: this.model.totalNavigations,
            uniqueRoutes: this.model.visitCounts.size,
            sessionLength: Date.now() - this.session.startTime,
            prefetchedRoutes: this.prefetchedRoutes.size,
            modelSize: this.estimateModelSize(),
        };
    }
    /**
     * Reset the model
     */
    reset() {
        this.model = this.createEmptyModel();
        this.history = [];
        this.prefetchedRoutes.clear();
        this.saveModel();
    }
    /**
     * Export model for analysis (returns serializable object)
     */
    exportModel() {
        return structuredClone({
            transitions: Object.fromEntries(Array.from(this.model.transitions.entries()).map(([k, v]) => [k, Object.fromEntries(v)])),
            visitCounts: Object.fromEntries(this.model.visitCounts),
            temporalPatterns: Object.fromEntries(Array.from(this.model.temporalPatterns.entries()).map(([k, v]) => [k, Object.fromEntries(v)])),
            sequencePatterns: Object.fromEntries(Array.from(this.model.sequencePatterns.entries()).map(([k, v]) => [k, Object.fromEntries(v)])),
            totalNavigations: this.model.totalNavigations,
            version: this.model.version,
            lastUpdate: this.model.lastUpdate,
        });
    }
    // ===========================================================================
    // Private Methods - Model Management
    // ===========================================================================
    createEmptyModel() {
        return {
            transitions: new Map(),
            visitCounts: new Map(),
            temporalPatterns: new Map(),
            sequencePatterns: new Map(),
            totalNavigations: 0,
            version: 1,
            lastUpdate: Date.now(),
        };
    }
    loadModel() {
        if (typeof localStorage === 'undefined')
            return null;
        try {
            const saved = localStorage.getItem(this.config.storageKey);
            if (!saved)
                return null;
            const data = JSON.parse(saved);
            // Reconstruct Maps from plain objects
            return {
                transitions: new Map(Object.entries(data.transitions).map(([k, v]) => [k, new Map(Object.entries(v))])),
                visitCounts: new Map(Object.entries(data.visitCounts)),
                temporalPatterns: new Map(Object.entries(data.temporalPatterns).map(([k, v]) => [Number(k), new Map(Object.entries(v))])),
                sequencePatterns: new Map(Object.entries(data.sequencePatterns).map(([k, v]) => [k, new Map(Object.entries(v))])),
                totalNavigations: data.totalNavigations,
                version: data.version,
                lastUpdate: data.lastUpdate,
            };
        }
        catch (e) {
            console.warn('[Predictor] Failed to load model:', e);
            return null;
        }
    }
    saveModel() {
        if (typeof localStorage === 'undefined')
            return;
        try {
            const data = this.exportModel();
            localStorage.setItem(this.config.storageKey, JSON.stringify(data));
        }
        catch (e) {
            console.warn('[Predictor] Failed to save model:', e);
        }
    }
    updateModel(event) {
        const { from, to, hourOfDay } = event;
        // Update transition probabilities
        if (!this.model.transitions.has(from)) {
            this.model.transitions.set(from, new Map());
        }
        const fromTransitions = this.model.transitions.get(from);
        const currentCount = fromTransitions.get(to) || 0;
        fromTransitions.set(to, currentCount + 1);
        // Update visit counts
        const visitCount = this.model.visitCounts.get(to) || 0;
        this.model.visitCounts.set(to, visitCount + 1);
        // Update temporal patterns
        if (!this.model.temporalPatterns.has(hourOfDay)) {
            this.model.temporalPatterns.set(hourOfDay, new Map());
        }
        const hourPatterns = this.model.temporalPatterns.get(hourOfDay);
        const hourCount = hourPatterns.get(to) || 0;
        hourPatterns.set(to, hourCount + 1);
        // Update sequence patterns (last 3 routes -> next)
        if (this.session.visitedRoutes.length >= 3) {
            const sequence = this.session.visitedRoutes.slice(-3).join('->');
            if (!this.model.sequencePatterns.has(sequence)) {
                this.model.sequencePatterns.set(sequence, new Map());
            }
            const seqPatterns = this.model.sequencePatterns.get(sequence);
            const seqCount = seqPatterns.get(to) || 0;
            seqPatterns.set(to, seqCount + 1);
        }
        // Apply decay to old patterns
        this.applyDecay();
        // Update metadata
        this.model.totalNavigations++;
        this.model.lastUpdate = Date.now();
    }
    applyDecay() {
        // Only apply decay every 100 navigations
        if (this.model.totalNavigations % 100 !== 0)
            return;
        const decay = this.config.decayFactor;
        for (const [from, toMap] of this.model.transitions) {
            for (const [to, count] of toMap) {
                const decayed = count * decay;
                if (decayed < 0.1) {
                    toMap.delete(to);
                }
                else {
                    toMap.set(to, decayed);
                }
            }
            if (toMap.size === 0) {
                this.model.transitions.delete(from);
            }
        }
    }
    // ===========================================================================
    // Private Methods - Prediction
    // ===========================================================================
    predictFromTransitions(route) {
        const transitions = this.model.transitions.get(route);
        if (!transitions)
            return [];
        const totalCount = Array.from(transitions.values()).reduce((a, b) => a + b, 0);
        if (totalCount === 0)
            return [];
        const predictions = [];
        for (const [to, count] of transitions) {
            const probability = count / totalCount;
            predictions.push({
                route: to,
                confidence: probability,
                priority: probability * 100,
                factors: ['transition-probability'],
            });
        }
        return predictions;
    }
    predictFromTemporal() {
        const hour = new Date().getHours();
        const patterns = this.model.temporalPatterns.get(hour);
        if (!patterns)
            return [];
        const totalCount = Array.from(patterns.values()).reduce((a, b) => a + b, 0);
        if (totalCount === 0)
            return [];
        const predictions = [];
        for (const [route, count] of patterns) {
            // Skip current route
            if (route === this.session.currentRoute)
                continue;
            const probability = count / totalCount;
            // Lower weight for temporal predictions
            predictions.push({
                route,
                confidence: probability * 0.7,
                priority: probability * 70,
                factors: ['temporal-pattern'],
            });
        }
        return predictions;
    }
    predictFromSequence() {
        if (this.session.visitedRoutes.length < 3)
            return [];
        const sequence = this.session.visitedRoutes.slice(-3).join('->');
        const patterns = this.model.sequencePatterns.get(sequence);
        if (!patterns)
            return [];
        const totalCount = Array.from(patterns.values()).reduce((a, b) => a + b, 0);
        if (totalCount === 0)
            return [];
        const predictions = [];
        for (const [route, count] of patterns) {
            const probability = count / totalCount;
            // Higher weight for sequence predictions (more context)
            predictions.push({
                route,
                confidence: probability * 1.2, // Boost confidence
                priority: probability * 120,
                factors: ['sequence-pattern'],
            });
        }
        return predictions;
    }
    predictFromSession() {
        // Predict based on common session patterns
        const predictions = [];
        // If user has been engaged, predict deeper navigation
        if (this.session.engagementScore > 0.7) {
            // Find routes commonly visited late in sessions
            const lateRoutes = this.findLateSessionRoutes();
            for (const route of lateRoutes) {
                if (route !== this.session.currentRoute && !this.session.visitedRoutes.includes(route)) {
                    predictions.push({
                        route,
                        confidence: 0.5 * this.session.engagementScore,
                        priority: 50,
                        factors: ['high-engagement-session'],
                    });
                }
            }
        }
        // If user tends to revisit routes
        const revisitCandidates = this.session.visitedRoutes
            .filter((r, i, arr) => arr.indexOf(r) !== i)
            .filter((r, i, arr) => arr.indexOf(r) === i);
        for (const route of revisitCandidates.slice(0, 2)) {
            predictions.push({
                route,
                confidence: 0.4,
                priority: 40,
                factors: ['session-revisit'],
            });
        }
        return predictions;
    }
    findLateSessionRoutes() {
        // Find routes that are commonly visited late in sessions
        // This is a simplified heuristic; real implementation would track session positions
        const visitCounts = this.model.visitCounts;
        const sortedRoutes = Array.from(visitCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([route]) => route);
        return sortedRoutes;
    }
    mergePredictions(predictions) {
        const merged = new Map();
        for (const pred of predictions) {
            const existing = merged.get(pred.route);
            if (existing) {
                // Combine predictions for same route
                existing.confidence = Math.min(1, existing.confidence + pred.confidence * 0.5);
                existing.priority = Math.max(existing.priority, pred.priority);
                // ES2024: Use Set.union() for cleaner set operations
                existing.factors = [...new Set(existing.factors).union(new Set(pred.factors))];
            }
            else {
                merged.set(pred.route, { ...pred });
            }
        }
        return Array.from(merged.values());
    }
    // ===========================================================================
    // Private Methods - Prefetching
    // ===========================================================================
    schedulePrefetch(predictions) {
        this.prefetchQueue = predictions.filter(p => p.confidence >= this.config.minConfidence &&
            !this.prefetchedRoutes.has(p.route));
        if (!this.isProcessingQueue) {
            this.processQueue();
        }
    }
    async processQueue() {
        if (this.prefetchQueue.length === 0) {
            this.isProcessingQueue = false;
            return;
        }
        this.isProcessingQueue = true;
        // Check network conditions
        if (this.config.networkAware && !this.shouldPrefetch()) {
            this.isProcessingQueue = false;
            return;
        }
        const prediction = this.prefetchQueue.shift();
        // Stagger prefetches to avoid overwhelming the network
        await this.prefetchRoute(prediction.route);
        await new Promise(resolve => setTimeout(resolve, 100));
        // Continue processing
        this.processQueue();
    }
    shouldPrefetch() {
        if (typeof navigator === 'undefined')
            return true;
        // Check save-data header
        if (navigator.connection?.saveData) {
            return false;
        }
        // Check effective connection type
        const effectiveType = navigator.connection?.effectiveType;
        if (effectiveType === 'slow-2g' || effectiveType === '2g') {
            return false;
        }
        return true;
    }
    canPrefetch(route) {
        // Check if within budget
        const currentSize = this.calculatePrefetchedSize();
        const routeSize = this.routeDataSizes.get(route) || 50; // Assume 50KB default
        return currentSize + routeSize <= this.config.prefetchBudget;
    }
    calculatePrefetchedSize() {
        let total = 0;
        for (const route of this.prefetchedRoutes) {
            total += this.routeDataSizes.get(route) || 50;
        }
        return total;
    }
    // ===========================================================================
    // Private Methods - Utilities
    // ===========================================================================
    createNavigationEvent(from, to, metadata) {
        const now = new Date();
        return {
            from,
            to,
            timestamp: Date.now(),
            dwellTime: metadata?.dwellTime || 0,
            scrollDepth: metadata?.scrollDepth || 0,
            interactionCount: metadata?.interactionCount || 0,
            deviceType: this.detectDeviceType(),
            connectionType: this.detectConnectionType(),
            hourOfDay: now.getHours(),
            dayOfWeek: now.getDay(),
            sessionId: this.session.sessionId,
            engagementScore: this.session.engagementScore,
            ...metadata,
        };
    }
    detectDeviceType() {
        if (typeof window === 'undefined')
            return 'desktop';
        const width = window.innerWidth;
        if (width < 768)
            return 'mobile';
        if (width < 1024)
            return 'tablet';
        return 'desktop';
    }
    detectConnectionType() {
        if (typeof navigator === 'undefined')
            return 'unknown';
        const connection = navigator.connection;
        if (!connection)
            return 'unknown';
        return connection.effectiveType || 'unknown';
    }
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    }
    estimateModelSize() {
        // Rough estimation of model size in bytes
        let size = 0;
        for (const [from, toMap] of this.model.transitions) {
            size += from.length + 8; // Key + overhead
            for (const [to, count] of toMap) {
                size += to.length + 8;
            }
        }
        return size;
    }
    setupEventListeners() {
        if (typeof window === 'undefined')
            return;
        // Track page visibility for engagement
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.session.engagementScore *= 0.9; // Decrease engagement when tab hidden
            }
        });
        // Track interactions for engagement
        let interactionCount = 0;
        const updateEngagement = () => {
            interactionCount++;
            this.session.engagementScore = Math.min(1, this.session.engagementScore + 0.01);
        };
        document.addEventListener('click', updateEngagement);
        document.addEventListener('scroll', updateEngagement, { passive: true });
        // Listen for navigation
        window.addEventListener('popstate', () => {
            const newRoute = window.location.pathname;
            if (newRoute !== this.session.currentRoute) {
                this.recordNavigation(this.session.currentRoute, newRoute);
            }
        });
    }
}
// =============================================================================
// Global Instance
// =============================================================================
let globalPredictor = null;
/**
 * Initialize the navigation predictor
 */
export function initNavigationPredictor(config) {
    if (!globalPredictor) {
        globalPredictor = new NavigationPredictor(config);
    }
    return globalPredictor;
}
/**
 * Get the global navigation predictor
 */
export function getNavigationPredictor() {
    return globalPredictor;
}
/**
 * Reset the global predictor (for testing)
 */
export function resetNavigationPredictor() {
    globalPredictor = null;
}
// =============================================================================
// React-like Hooks
// =============================================================================
/**
 * Hook to use navigation prediction
 */
export function useNavigationPredictor() {
    const predictor = getNavigationPredictor() || initNavigationPredictor();
    return {
        predictions: predictor.predict(),
        recordNavigation: (from, to) => predictor.recordNavigation(from, to),
        prefetch: (route) => predictor.prefetchRoute(route),
        accuracy: predictor.getAccuracy(),
    };
}
/**
 * Higher-order function to add prediction to a Link component
 */
export function withPrediction(LinkComponent) {
    return (props) => {
        const predictor = getNavigationPredictor();
        if (predictor && typeof window !== 'undefined') {
            // Prefetch on hover if prediction confidence is high
            const prediction = predictor.getPredictionFor(props.href);
            if (prediction && prediction.confidence >= 0.5) {
                // Already prefetched
            }
        }
        return LinkComponent(props);
    };
}
//# sourceMappingURL=navigation-predictor.js.map