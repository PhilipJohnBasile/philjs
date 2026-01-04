/**
 * PhilJS Edge A/B Testing
 *
 * Cookie-based A/B testing at the edge with zero layout shift.
 * Integrates with analytics and supports multivariate testing.
 *
 * Features:
 * - Cookie-based variant assignment
 * - Edge-computed variants (no client-side flicker)
 * - No layout shift
 * - Analytics integration
 * - Multivariate testing
 * - Targeting rules
 * - useVariant() hook
 */
import type { EdgeMiddleware, EdgeContext } from './edge-middleware.js';
export interface Variant {
    /** Variant identifier */
    id: string;
    /** Variant name */
    name: string;
    /** Weight (0-100) */
    weight: number;
    /** Optional metadata */
    metadata?: Record<string, unknown>;
}
export interface Experiment {
    /** Experiment identifier */
    id: string;
    /** Experiment name */
    name: string;
    /** Variants */
    variants: Variant[];
    /** Cookie name (defaults to `exp_${id}`) */
    cookieName?: string;
    /** Cookie max age in seconds (default: 30 days) */
    cookieMaxAge?: number;
    /** Targeting rules */
    targeting?: TargetingRules;
    /** Traffic allocation (0-100, default: 100) */
    traffic?: number;
}
export interface TargetingRules {
    /** Target specific countries */
    countries?: string[];
    /** Target specific regions */
    regions?: string[];
    /** Target specific cities */
    cities?: string[];
    /** Target URL patterns */
    urlPatterns?: string[];
    /** Custom targeting function */
    custom?: (context: EdgeContext) => boolean;
}
export interface ExperimentAssignment {
    experimentId: string;
    variantId: string;
    variantName: string;
    isNew: boolean;
}
export interface ABTestingOptions {
    /** List of experiments */
    experiments: Experiment[];
    /** Analytics callback */
    onAssignment?: (assignment: ExperimentAssignment, context: EdgeContext) => void | Promise<void>;
    /** Cookie path */
    cookiePath?: string;
    /** Cookie domain */
    cookieDomain?: string;
    /** Cookie secure flag */
    cookieSecure?: boolean;
}
/**
 * Deterministic variant selection based on user ID
 */
export declare function selectVariantDeterministic(variants: Variant[], userId: string): Variant;
/**
 * A/B testing middleware
 */
export declare function abTestingMiddleware(options: ABTestingOptions): EdgeMiddleware;
/**
 * Inject variant data into HTML response
 */
export declare function injectVariantData(html: string, assignments: Record<string, ExperimentAssignment>): string;
/**
 * Variant injection middleware
 */
export declare function variantInjectionMiddleware(): EdgeMiddleware;
/**
 * Render different content based on variant
 */
export declare function variantMiddleware(experimentId: string, handlers: Record<string, EdgeMiddleware>): EdgeMiddleware;
/**
 * Rewrite URL based on variant
 */
export declare function variantRewriteMiddleware(experimentId: string, rewrites: Record<string, string>): EdgeMiddleware;
export interface AnalyticsProvider {
    trackExperiment(assignment: ExperimentAssignment, context: EdgeContext): void | Promise<void>;
    trackConversion(experimentId: string, variantId: string, context: EdgeContext): void | Promise<void>;
}
/**
 * Google Analytics provider
 */
export declare const GoogleAnalyticsProvider: AnalyticsProvider;
/**
 * Custom analytics provider
 */
export declare function createAnalyticsProvider(options: {
    endpoint: string;
    headers?: Record<string, string>;
}): AnalyticsProvider;
/**
 * useVariant hook for client-side
 */
export declare function useVariant(experimentId: string): {
    variant: string | null;
    isLoading: boolean;
};
/**
 * Check if user is in variant
 */
export declare function isVariant(experimentId: string, variantName: string): boolean;
/**
 * Get all active experiments
 */
export declare function getActiveExperiments(): Record<string, ExperimentAssignment>;
export interface MultivariateExperiment {
    id: string;
    name: string;
    factors: {
        id: string;
        name: string;
        variants: Variant[];
    }[];
    cookieNamePrefix?: string;
    cookieMaxAge?: number;
    targeting?: TargetingRules;
}
/**
 * Multivariate testing middleware
 */
export declare function multivariateTestingMiddleware(experiment: MultivariateExperiment, options?: {
    onAssignment?: (assignments: Record<string, ExperimentAssignment>, context: EdgeContext) => void | Promise<void>;
    cookiePath?: string;
    cookieDomain?: string;
    cookieSecure?: boolean;
}): EdgeMiddleware;
export interface VariantStats {
    variantId: string;
    impressions: number;
    conversions: number;
    conversionRate: number;
}
/**
 * Calculate statistical significance (using Z-test)
 */
export declare function calculateSignificance(control: VariantStats, variant: VariantStats): {
    zScore: number;
    pValue: number;
    isSignificant: boolean;
    confidence: number;
};
//# sourceMappingURL=edge-ab-testing.d.ts.map