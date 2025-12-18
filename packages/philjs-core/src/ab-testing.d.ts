/**
 * Built-in A/B Testing - PhilJS 2026 Innovation
 * Run A/B tests directly in your app with zero external dependencies
 */
import { type Signal } from './signals';
export interface Experiment {
    id: string;
    name: string;
    variants: Variant[];
    /** Traffic allocation (0-1, default 1 = 100%) */
    traffic?: number;
    /** User segments to target */
    targeting?: TargetingRules;
    /** Start/end dates */
    schedule?: {
        start?: Date;
        end?: Date;
    };
    /** Winner variant (when experiment concludes) */
    winner?: string;
}
export interface Variant {
    id: string;
    name: string;
    /** Weight for traffic distribution (default: equal split) */
    weight?: number;
    /** Configuration for this variant */
    config?: Record<string, any>;
}
export interface TargetingRules {
    /** User segments to include */
    segments?: string[];
    /** Custom targeting function */
    custom?: (user: User) => boolean;
    /** Geographic targeting */
    countries?: string[];
    /** Device targeting */
    devices?: ('mobile' | 'tablet' | 'desktop')[];
}
export interface User {
    id: string;
    segments?: string[];
    country?: string;
    device?: 'mobile' | 'tablet' | 'desktop';
    [key: string]: any;
}
export interface ExperimentAssignment {
    experimentId: string;
    variantId: string;
    timestamp: number;
}
export interface ExperimentEvent {
    experimentId: string;
    variantId: string;
    eventName: string;
    value?: number;
    timestamp: number;
    userId?: string;
}
export interface ExperimentResults {
    experimentId: string;
    variants: VariantResults[];
    winner?: string;
    confidence?: number;
    sampleSize: number;
}
export interface VariantResults {
    variantId: string;
    impressions: number;
    conversions: number;
    conversionRate: number;
    averageValue?: number;
    revenue?: number;
}
export interface ABTestConfig {
    /** Enable/disable A/B testing globally */
    enabled?: boolean;
    /** Storage mechanism for assignments */
    storage?: 'localStorage' | 'sessionStorage' | 'memory' | 'cookie';
    /** Callback when variant is assigned */
    onAssignment?: (assignment: ExperimentAssignment) => void;
    /** Callback when event is tracked */
    onEvent?: (event: ExperimentEvent) => void;
    /** Force specific variants (for QA) */
    forceVariants?: Record<string, string>;
}
export declare class ABTestEngine {
    private experiments;
    private assignments;
    private events;
    private storage;
    private config;
    constructor(config?: ABTestConfig);
    /**
     * Register an experiment
     */
    register(experiment: Experiment): void;
    /**
     * Get variant for a user
     */
    getVariant(experimentId: string, user: User): Variant | null;
    /**
     * Track an event (conversion, click, etc.)
     */
    track(experimentId: string, variantId: string, eventName: string, options?: {
        value?: number;
        userId?: string;
    }): void;
    /**
     * Get experiment results
     */
    getResults(experimentId: string): ExperimentResults | null;
    /**
     * Clear all experiment data
     */
    clear(): void;
    /**
     * Get all active experiments
     */
    getActiveExperiments(): Experiment[];
    private assignVariant;
    private matchesTargeting;
    private isExperimentActive;
    private getAssignmentKey;
    private hashString;
    private loadAssignments;
    private saveAssignments;
}
export declare function initABTesting(config?: ABTestConfig): ABTestEngine;
export declare function getABTestEngine(): ABTestEngine;
/**
 * Use A/B test variant (reactive)
 */
export declare function useExperiment(experimentId: string, user: User): Signal<Variant | null>;
/**
 * Simple A/B test component helper
 */
export declare function ABTest(props: {
    experimentId: string;
    user: User;
    variants: Record<string, () => any>;
    fallback?: () => any;
}): any;
/**
 * Feature flag (simple A/B test)
 */
export declare function useFeatureFlag(flagName: string, user: User, defaultValue?: boolean): Signal<boolean>;
/**
 * Create a multivariate test (more than 2 variants)
 */
export declare function createMultivariateTest(id: string, name: string, variants: string[]): Experiment;
/**
 * Calculate statistical significance (Chi-squared test)
 */
export declare function calculateSignificance(controlConversions: number, controlImpressions: number, variantConversions: number, variantImpressions: number): number;
//# sourceMappingURL=ab-testing.d.ts.map