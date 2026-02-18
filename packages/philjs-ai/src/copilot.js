/**
 * PhilJS CopilotKit Patterns
 *
 * AI copilot integration patterns.
 */
import { signal, effect } from '@philjs/core';
const actions = signal([]);
const contexts = signal(new Map());
const messages = signal([]);
/** Register an action the AI can call */
export function useCopilotAction(action) {
    effect(() => {
        actions.set(a => [...a, action]);
        return () => {
            actions.set(a => a.filter(x => x.name !== action.name));
        };
    });
}
/** Provide readable/writable context to the AI */
export function useCopilotContext(name, context) {
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
    const sendMessage = async (content) => {
        messages.set(m => [...m, { role: 'user', content }]);
        isLoading.set(true);
        // Would call LLM API here
        const response = await simulateResponse(content, actions(), contexts());
        messages.set(m => [...m, { role: 'assistant', content: response }]);
        isLoading.set(false);
    };
    return { messages, isLoading, sendMessage };
}
async function simulateResponse(_userMessage, _actions, _contexts) {
    return 'I can help you with that!';
}
/** Suggested prompts based on context */
export function useCopilotSuggestions() {
    const suggestions = signal([]);
    effect(() => {
        const availableActions = actions();
        suggestions.set(availableActions.map(a => `Help me ${a.description}`));
    });
    return suggestions;
}
//# sourceMappingURL=copilot.js.map