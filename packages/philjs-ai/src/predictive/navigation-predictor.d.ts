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
export interface NavigationEvent {
    /** Source page/route */
    from: string;
    /** Destination page/route */
    to: string;
    /** Timestamp of navigation */
    timestamp: number;
    /** Time spent on source page (ms) */
    dwellTime: number;
    /** Scroll depth on source page (0-1) */
    scrollDepth: number;
    /** Interaction count on source page */
    interactionCount: number;
    /** Device type */
    deviceType: 'mobile' | 'tablet' | 'desktop';
    /** Connection type */
    connectionType: 'slow-2g' | '2g' | '3g' | '4g' | 'wifi' | 'unknown';
    /** Time of day (0-23) */
    hourOfDay: number;
    /** Day of week (0-6) */
    dayOfWeek: number;
    /** Session ID */
    sessionId: string;
    /** User engagement score (0-1) */
    engagementScore: number;
}
export interface Prediction {
    /** Predicted route */
    route: string;
    /** Confidence score (0-1) */
    confidence: number;
    /** Priority for prefetching (higher = more important) */
    priority: number;
    /** Predicted time to navigation (ms) */
    predictedTimeToNav?: number;
    /** Factors contributing to this prediction */
    factors: string[];
}
export interface PredictionConfig {
    /** Minimum confidence threshold for prefetching */
    minConfidence: number;
    /** Maximum predictions to generate */
    maxPredictions: number;
    /** Enable learning from user behavior */
    enableLearning: boolean;
    /** Maximum history to keep */
    maxHistory: number;
    /** Decay factor for old data (0-1) */
    decayFactor: number;
    /** Enable prefetching based on predictions */
    enablePrefetch: boolean;
    /** Resource budget for prefetching (KB) */
    prefetchBudget: number;
    /** Adapt to network conditions */
    networkAware: boolean;
    /** Storage key for persistent model */
    storageKey: string;
}
export interface NavigationModel {
    /** Transition probabilities: from -> to -> probability */
    transitions: Map<string, Map<string, number>>;
    /** Page visit counts */
    visitCounts: Map<string, number>;
    /** Time-based patterns (hour -> route -> probability) */
    temporalPatterns: Map<number, Map<string, number>>;
    /** Sequence patterns (route sequence -> next route) */
    sequencePatterns: Map<string, Map<string, number>>;
    /** Total navigations tracked */
    totalNavigations: number;
    /** Model version for cache invalidation */
    version: number;
    /** Last update timestamp */
    lastUpdate: number;
}
export interface SessionContext {
    /** Current session ID */
    sessionId: string;
    /** Routes visited in this session */
    visitedRoutes: string[];
    /** Current route */
    currentRoute: string;
    /** Session start time */
    startTime: number;
    /** Session engagement score */
    engagementScore: number;
    /** Predicted session length */
    predictedSessionLength: number;
}
export declare class NavigationPredictor {
    private config;
    private model;
    private history;
    private session;
    private prefetchedRoutes;
    private routeDataSizes;
    private prefetchQueue;
    private isProcessingQueue;
    constructor(config?: Partial<PredictionConfig>);
    /**
     * Record a navigation event
     */
    recordNavigation(from: string, to: string, metadata?: Partial<NavigationEvent>): void;
    /**
     * Generate navigation predictions for current or specified route
     */
    predict(currentRoute?: string): Prediction[];
    /**
     * Get prediction for a specific route
     */
    getPredictionFor(route: string): Prediction | null;
    /**
     * Manually prefetch a route
     */
    prefetchRoute(route: string): Promise<boolean>;
    /**
     * Get current prediction accuracy
     */
    getAccuracy(): {
        overall: number;
        byRoute: Map<string, number>;
    };
    /**
     * Get model statistics
     */
    getStats(): {
        totalNavigations: number;
        uniqueRoutes: number;
        sessionLength: number;
        prefetchedRoutes: number;
        modelSize: number;
    };
    /**
     * Reset the model
     */
    reset(): void;
    /**
     * Export model for analysis (returns serializable object)
     */
    exportModel(): {
        transitions: {
            [k: string]: {
                [k: string]: number;
            };
        };
        visitCounts: {
            [k: string]: number;
        };
        temporalPatterns: {
            [k: string]: {
                [k: string]: number;
            };
        };
        sequencePatterns: {
            [k: string]: {
                [k: string]: number;
            };
        };
        totalNavigations: number;
        version: number;
        lastUpdate: number;
    };
    private createEmptyModel;
    private loadModel;
    private saveModel;
    private updateModel;
    private applyDecay;
    private predictFromTransitions;
    private predictFromTemporal;
    private predictFromSequence;
    private predictFromSession;
    private findLateSessionRoutes;
    private mergePredictions;
    private schedulePrefetch;
    private processQueue;
    private shouldPrefetch;
    private canPrefetch;
    private calculatePrefetchedSize;
    private createNavigationEvent;
    private detectDeviceType;
    private detectConnectionType;
    private generateSessionId;
    private estimateModelSize;
    private setupEventListeners;
}
/**
 * Initialize the navigation predictor
 */
export declare function initNavigationPredictor(config?: Partial<PredictionConfig>): NavigationPredictor;
/**
 * Get the global navigation predictor
 */
export declare function getNavigationPredictor(): NavigationPredictor | null;
/**
 * Reset the global predictor (for testing)
 */
export declare function resetNavigationPredictor(): void;
/**
 * Hook to use navigation prediction
 */
export declare function useNavigationPredictor(): {
    predictions: Prediction[];
    recordNavigation: (from: string, to: string) => void;
    prefetch: (route: string) => Promise<boolean>;
    accuracy: {
        overall: number;
        byRoute: Map<string, number>;
    };
};
/**
 * Higher-order function to add prediction to a Link component
 */
export declare function withPrediction<T extends {
    href: string;
}>(LinkComponent: (props: T) => unknown): (props: T) => unknown;
//# sourceMappingURL=navigation-predictor.d.ts.map