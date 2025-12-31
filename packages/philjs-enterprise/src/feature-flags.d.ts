/**
 * Feature Flags for PhilJS Enterprise
 */
export interface FeatureFlag {
    id: string;
    name: string;
    description?: string;
    enabled: boolean;
    rules?: FeatureRule[];
    variants?: FeatureVariant[];
    rolloutPercentage?: number;
    metadata?: Record<string, unknown>;
}
export interface FeatureRule {
    conditions: RuleCondition[];
    result: boolean | string;
}
export interface RuleCondition {
    attribute: string;
    operator: 'eq' | 'ne' | 'in' | 'notIn' | 'gt' | 'lt' | 'contains' | 'regex';
    value: unknown;
}
export interface FeatureVariant {
    id: string;
    name: string;
    weight: number;
    payload?: unknown;
}
export interface EvaluationContext {
    userId?: string;
    tenantId?: string;
    environment?: string;
    attributes?: Record<string, unknown>;
}
export declare class FeatureFlagManager {
    private flags;
    private cache;
    private cacheTTL;
    constructor(flags: FeatureFlag[], cacheTTL?: number);
    isEnabled(flagId: string, context?: EvaluationContext): boolean;
    evaluate(flagId: string, context?: EvaluationContext): boolean | string;
    getVariant(flagId: string, context?: EvaluationContext): FeatureVariant | null;
    setFlag(flag: FeatureFlag): void;
    getFlag(flagId: string): FeatureFlag | undefined;
    getAllFlags(): FeatureFlag[];
    invalidateCache(flagId?: string): void;
    private evaluateRule;
    private evaluateCondition;
    private getAttributeValue;
    private selectVariant;
    private hashString;
}
export declare function createFeatureFlagManager(flags: FeatureFlag[]): FeatureFlagManager;
//# sourceMappingURL=feature-flags.d.ts.map