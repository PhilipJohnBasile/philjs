/**
 * @philjs/intent - Intent-Based Development
 *
 * Describe WHAT you want, the framework figures out HOW:
 * - Natural language component descriptions
 * - Goal-oriented programming
 * - Automatic implementation selection
 * - Self-optimizing code paths
 * - Constraint-based development
 * - AI-powered code synthesis
 *
 * NO OTHER FRAMEWORK HAS THIS - TRUE PARADIGM SHIFT.
 */
export interface IntentConfig {
    /** AI provider for intent resolution */
    provider?: 'openai' | 'anthropic' | 'local';
    /** API key for cloud providers */
    apiKey?: string;
    /** Model to use */
    model?: string;
    /** Enable caching of resolved intents */
    cache?: boolean;
    /** Maximum resolution attempts */
    maxAttempts?: number;
    /** Enable learning from user corrections */
    learning?: boolean;
}
export interface Intent {
    id: string;
    description: string;
    constraints?: Constraint[];
    context?: IntentContext;
    priority?: 'performance' | 'readability' | 'size' | 'accessibility';
}
export interface Constraint {
    type: 'must' | 'should' | 'must-not' | 'prefer';
    description: string;
    validate?: (result: unknown) => boolean;
}
export interface IntentContext {
    component?: string;
    dependencies?: string[];
    targetFramework?: string;
    existingCode?: string;
    userPreferences?: Record<string, unknown>;
}
export interface ResolvedIntent {
    intent: Intent;
    implementation: string;
    explanation: string;
    alternatives?: AlternativeImplementation[];
    confidence: number;
    warnings?: string[];
}
export interface AlternativeImplementation {
    implementation: string;
    tradeoffs: string;
    confidence: number;
}
export interface IntentTemplate {
    name: string;
    pattern: RegExp;
    resolve: (match: RegExpMatchArray, context?: IntentContext) => string;
}
declare const builtInTemplates: IntentTemplate[];
export declare class IntentResolver {
    private config;
    private templates;
    private cache;
    private learnings;
    constructor(config?: IntentConfig);
    addTemplate(template: IntentTemplate): void;
    removeTemplate(name: string): void;
    resolve(intent: Intent): Promise<ResolvedIntent>;
    private tryTemplates;
    private resolveWithAI;
    private buildPrompt;
    private callOpenAI;
    private callAnthropic;
    private extractCode;
    private extractExplanation;
    private getCacheKey;
    learn(intent: Intent, correctedImplementation: string): void;
    clearLearnings(): void;
}
export declare function intent(description: string): IntentBuilder;
declare class IntentBuilder {
    private _intent;
    constructor(description: string);
    must(constraint: string, validate?: (result: unknown) => boolean): IntentBuilder;
    should(constraint: string, validate?: (result: unknown) => boolean): IntentBuilder;
    mustNot(constraint: string, validate?: (result: unknown) => boolean): IntentBuilder;
    prefer(constraint: string): IntentBuilder;
    prioritize(priority: 'performance' | 'readability' | 'size' | 'accessibility'): IntentBuilder;
    inContext(context: IntentContext): IntentBuilder;
    build(): Intent;
    resolve(resolver?: IntentResolver): Promise<ResolvedIntent>;
}
export declare function initIntent(config?: IntentConfig): IntentResolver;
export declare function getIntentResolver(): IntentResolver | null;
export declare function useIntent(description: string): {
    resolve: () => Promise<ResolvedIntent>;
    builder: IntentBuilder;
};
export { builtInTemplates };
//# sourceMappingURL=index.d.ts.map