/**
 * PhilJS CopilotKit Patterns
 *
 * AI copilot integration patterns.
 */
export interface CopilotAction {
    name: string;
    description: string;
    parameters: Array<{
        name: string;
        type: string;
        description: string;
        required?: boolean;
    }>;
    handler: (params: Record<string, any>) => Promise<any>;
}
export interface CopilotContext {
    data: Record<string, any>;
    readable: boolean;
    writable: boolean;
}
/** Register an action the AI can call */
export declare function useCopilotAction(action: CopilotAction): void;
/** Provide readable/writable context to the AI */
export declare function useCopilotContext(name: string, context: CopilotContext): void;
/** Chat interface */
export declare function useCopilotChat(): {
    messages: import("@philjs/core").Signal<{
        role: "user" | "assistant";
        content: string;
    }[]>;
    isLoading: import("@philjs/core").Signal<boolean>;
    sendMessage: (content: string) => Promise<void>;
};
/** Suggested prompts based on context */
export declare function useCopilotSuggestions(): import("@philjs/core").Signal<string[]>;
