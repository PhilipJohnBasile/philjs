/**
 * @philjs/ab-testing - Native A/B Testing Framework
 *
 * Built-in experimentation and feature flags.
 * NO OTHER FRAMEWORK provides native A/B testing.
 *
 * Features:
 * - Experiment configuration
 * - Variant assignment
 * - Statistical analysis
 * - Feature flags
 * - Rollout percentages
 * - User segmentation
 * - Event tracking
 * - Results dashboard data
 * - Multi-armed bandit
 */
export interface Experiment {
    id: string;
    name: string;
    description?: string;
    variants: Variant[];
    allocation: number;
    startDate?: Date;
    endDate?: Date;
    status: 'draft' | 'running' | 'paused' | 'completed';
    targetAudience?: AudienceRule[];
    primaryMetric?: string;
    secondaryMetrics?: string[];
}
export interface Variant {
    id: string;
    name: string;
    weight: number;
    isControl?: boolean;
    config?: Record<string, any>;
}
export interface AudienceRule {
    attribute: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'not_in';
    value: any;
}
export interface FeatureFlag {
    id: string;
    name: string;
    description?: string;
    enabled: boolean;
    rolloutPercentage?: number;
    targetAudience?: AudienceRule[];
    variants?: Record<string, any>;
}
export interface Assignment {
    experimentId: string;
    variantId: string;
    timestamp: number;
    userId: string;
}
export interface ExperimentEvent {
    experimentId: string;
    variantId: string;
    eventName: string;
    value?: number;
    timestamp: number;
    userId: string;
    metadata?: Record<string, any>;
}
export interface ExperimentResults {
    experimentId: string;
    variants: VariantResults[];
    sampleSize: number;
    startDate: Date;
    endDate?: Date;
    primaryMetric?: MetricResults;
    secondaryMetrics?: Record<string, MetricResults>;
}
export interface VariantResults {
    variantId: string;
    name: string;
    sampleSize: number;
    conversionRate?: number;
    averageValue?: number;
    totalValue?: number;
}
export interface MetricResults {
    name: string;
    controlValue: number;
    variants: Array<{
        variantId: string;
        value: number;
        lift: number;
        confidence: number;
        significant: boolean;
    }>;
}
export interface UserContext {
    userId: string;
    attributes?: Record<string, any>;
    traits?: Record<string, any>;
}
export interface ABTestingConfig {
    storageKey?: string;
    trackingEndpoint?: string;
    autoTrack?: boolean;
    debug?: boolean;
}
export declare class AssignmentEngine {
    private assignments;
    private storageKey;
    constructor(storageKey?: string);
    private loadAssignments;
    private saveAssignments;
    assign(experiment: Experiment, userId: string, context?: UserContext): Variant | null;
    private isInAllocation;
    private selectVariant;
    private matchesAudience;
    private hash;
    getAssignment(experimentId: string): Assignment | undefined;
    clearAssignment(experimentId: string): void;
    clearAll(): void;
}
export declare class FeatureFlagManager {
    private flags;
    private userId;
    private context;
    private overrides;
    constructor(userId: string, context?: UserContext);
    private loadOverrides;
    registerFlags(flags: FeatureFlag[]): void;
    isEnabled(flagId: string): boolean;
    getVariant<T = any>(flagId: string): T | undefined;
    override(flagId: string, enabled: boolean): void;
    clearOverride(flagId: string): void;
    clearAllOverrides(): void;
    private matchesAudience;
    private hash;
    private saveOverrides;
    getAllFlags(): FeatureFlag[];
}
export declare class EventTracker {
    private events;
    private trackingEndpoint;
    private flushInterval;
    private batchSize;
    constructor(trackingEndpoint?: string);
    track(event: Omit<ExperimentEvent, 'timestamp'>): void;
    trackConversion(experimentId: string, variantId: string, userId: string, value?: number, metadata?: Record<string, any>): void;
    trackEvent(experimentId: string, variantId: string, eventName: string, userId: string, value?: number, metadata?: Record<string, any>): void;
    flush(): Promise<void>;
    private startAutoFlush;
    stop(): void;
    getEvents(): ExperimentEvent[];
}
export declare class StatisticalAnalyzer {
    zTest(control: {
        conversions: number;
        total: number;
    }, variant: {
        conversions: number;
        total: number;
    }): {
        zScore: number;
        pValue: number;
        significant: boolean;
    };
    tTest(control: {
        values: number[];
    }, variant: {
        values: number[];
    }): {
        tScore: number;
        pValue: number;
        significant: boolean;
    };
    calculateLift(control: number, variant: number): number;
    confidenceInterval(proportion: number, sampleSize: number, confidenceLevel?: number): {
        lower: number;
        upper: number;
    };
    calculateSampleSize(baseline: number, // baseline conversion rate
    mde: number, // minimum detectable effect (relative)
    power?: number, // statistical power
    significance?: number): number;
    private mean;
    private variance;
    private normalCDF;
    private zScoreForConfidence;
}
export declare class ABTestingManager {
    private config;
    private experiments;
    private assignmentEngine;
    private featureFlagManager;
    private eventTracker;
    private statisticalAnalyzer;
    private userId;
    private context;
    constructor(userId: string, config?: ABTestingConfig, context?: UserContext);
    registerExperiments(experiments: Experiment[]): void;
    registerFlags(flags: FeatureFlag[]): void;
    getVariant(experimentId: string): Variant | null;
    isInVariant(experimentId: string, variantId: string): boolean;
    isFeatureEnabled(flagId: string): boolean;
    getFeatureVariant<T = any>(flagId: string): T | undefined;
    trackConversion(experimentId: string, value?: number, metadata?: Record<string, any>): void;
    trackEvent(experimentId: string, eventName: string, value?: number, metadata?: Record<string, any>): void;
    analyzeExperiment(experimentId: string, controlData: {
        conversions: number;
        total: number;
    }, variantData: {
        conversions: number;
        total: number;
    }): {
        lift: number;
        pValue: number;
        significant: boolean;
    };
    calculateRequiredSampleSize(baseline: number, mde: number, power?: number, significance?: number): number;
    setUserContext(context: UserContext): void;
    flush(): Promise<void>;
    private log;
}
/**
 * Hook for A/B testing
 */
export declare function useABTesting(userId: string, config?: ABTestingConfig, context?: UserContext): {
    getVariant: (experimentId: string) => Variant | null;
    isInVariant: (experimentId: string, variantId: string) => boolean;
    trackConversion: (experimentId: string, value?: number, metadata?: Record<string, any>) => void;
    trackEvent: (experimentId: string, eventName: string, value?: number, metadata?: Record<string, any>) => void;
    registerExperiments: (experiments: Experiment[]) => void;
};
/**
 * Hook for experiment variant
 */
export declare function useExperiment(experimentId: string): {
    variant: Variant | null;
    isControl: boolean;
    config: Record<string, any>;
    trackConversion: (value?: number) => void;
};
/**
 * Hook for feature flags
 */
export declare function useFeatureFlag(flagId: string): {
    enabled: boolean;
    variant: any;
};
//# sourceMappingURL=index.d.ts.map