/**
 * Signals Decorator
 *
 * Wraps stories with signal state management utilities
 */
import { signal } from 'philjs-core';
/**
 * Decorator that provides signal utilities to stories
 */
export function withSignals(options = {}) {
    const { initialState = {} } = options;
    return (storyFn, context) => {
        // Create signals from initial state
        const signals = {};
        for (const key of Object.keys(initialState)) {
            signals[key] = signal(initialState[key]);
        }
        // Attach signals to context for story access
        if (context && context.parameters) {
            context.parameters['signals'] = signals;
        }
        return storyFn();
    };
}
//# sourceMappingURL=with-signals.js.map