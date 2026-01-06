/**
 * PhilJS CopilotKit Patterns
 * 
 * AI copilot integration patterns.
 */

import { signal, effect } from '@philjs/core';

export interface CopilotAction {
    name: string;
    description: string;
    parameters: Array<{ name: string; type: string; description: string; required?: boolean }>;
    handler: (params: Record<string, any>) => Promise<any>;
}

export interface CopilotContext {
    data: Record<string, any>;
    readable: boolean;
    writable: boolean;
}

const actions = signal<CopilotAction[]>([]);
const contexts = signal<Map<string, CopilotContext>>(new Map());
const messages = signal<Array<{ role: 'user' | 'assistant'; content: string }>>([]);

/** Register an action the AI can call */
export function useCopilotAction(action: CopilotAction) {
    effect(() => {
        actions.set(a => [...a, action]);
        return () => {
            actions.set(a => a.filter(x => x.name !== action.name));
        };
    });
}

/** Provide readable/writable context to the AI */
export function useCopilotContext(name: string, context: CopilotContext) {
    effect(() => {
        contexts.set(c => new Map(c).set(name, context));
        return () => {
            contexts.set(c => { const m = new Map(c); m.delete(name); return m; });
        };
    });
}

/** Chat interface */
export function useCopilotChat() {
    const isLoading = signal(false);

    const sendMessage = async (content: string) => {
        messages.set(m => [...m, { role: 'user', content }]);
        isLoading.set(true);

        // Would call LLM API here
        const response = await simulateResponse(content, actions(), contexts());

        messages.set(m => [...m, { role: 'assistant', content: response }]);
        isLoading.set(false);
    };

    return { messages, isLoading, sendMessage };
}

async function simulateResponse(
    _userMessage: string,
    _actions: CopilotAction[],
    _contexts: Map<string, CopilotContext>
): Promise<string> {
    return 'I can help you with that!';
}

/** Suggested prompts based on context */
export function useCopilotSuggestions() {
    const suggestions = signal<string[]>([]);

    effect(() => {
        const availableActions = actions();
        suggestions.set(availableActions.map(a => `Help me ${a.description}`));
    });

    return suggestions;
}
