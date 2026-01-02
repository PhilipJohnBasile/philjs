/**
 * Signals Decorator
 *
 * Wraps stories with signal state management utilities
 */

import { signal } from '@philjs/core';

export interface WithSignalsOptions {
  initialState?: Record<string, any>;
}

/**
 * Decorator that provides signal utilities to stories
 */
export function withSignals(options: WithSignalsOptions = {}) {
  const { initialState = {} } = options;

  return (storyFn: () => any, context: any) => {
    // Create signals from initial state
    const signals: Record<string, ReturnType<typeof signal>> = {};

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
