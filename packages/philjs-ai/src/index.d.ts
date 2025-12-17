import type { PromptSpec, Provider } from "./types.js";
export * from "./types.js";
/**
 * Create a typed prompt specification.
 * @template TI, TO
 * @param {PromptSpec<TI, TO>} spec - Prompt specification
 * @returns {PromptSpec<TI, TO>}
 */
export declare function createPrompt<TI = any, TO = any>(spec: PromptSpec<TI, TO>): PromptSpec<TI, TO>;
/**
 * Create an AI client with a provider.
 * @param {Provider} provider - AI provider
 */
export declare function createAI(provider: Provider): {
    generate<TI = any, TO = any>(spec: PromptSpec<TI, TO>, input: TI, opts?: any): Promise<{
        text: string;
    }>;
};
/**
 * Built-in providers.
 */
export declare const providers: {
    /**
     * HTTP provider that POSTs to an endpoint.
     * @param {string} url - AI endpoint URL
     * @returns {Provider}
     */
    http: (url: string) => Provider;
    /**
     * Echo provider for testing (returns the prompt as-is).
     * @returns {Provider}
     */
    echo: () => Provider;
};
//# sourceMappingURL=index.d.ts.map