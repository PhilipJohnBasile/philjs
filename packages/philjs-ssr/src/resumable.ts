/**
 * PhilJS Qwik Resumability
 */

import { signal, effect } from '@philjs/core';

interface ResumeState { signals: Record<string, any>; components: Record<string, any>; }

/** Serialize state for resumability */
export function serializeState(state: ResumeState): string {
    return JSON.stringify(state);
}

/** Resume from serialized state */
export function resumeFromState(serialized: string) {
    const state: ResumeState = JSON.parse(serialized);
    const signals: Record<string, any> = {};

    for (const [key, value] of Object.entries(state.signals)) {
        signals[key] = signal(value);
    }

    return { signals, meta: state.components };
}

/** Create a resumable signal */
export function resumableSignal<T>(name: string, initialValue: T) {
    const existingState = typeof window !== 'undefined'
        ? (window as any).__PHILJS_RESUME_STATE__?.signals?.[name]
        : undefined;

    return signal<T>(existingState ?? initialValue);
}

/** Mark component for lazy hydration */
export function qwikify<P>(component: (props: P) => any, options: { eagerness?: 'load' | 'visible' | 'idle' } = {}) {
    return (props: P) => {
        const { eagerness = 'visible' } = options;

        if (typeof window === 'undefined') {
            // Server: render normally
            return component(props);
        }

        // Client: hydrate based on eagerness
        const hydrated = signal(false);

        effect(() => {
            if (eagerness === 'load') {
                hydrated.set(true);
            } else if (eagerness === 'idle') {
                requestIdleCallback(() => hydrated.set(true));
            }
            // 'visible' would use IntersectionObserver
        });

        return component(props);
    };
}
