/**
 * PhilJS Immer Integration
 */

import { signal, type Signal } from '@philjs/core';
import { produce, type Draft } from 'immer';

/** Create a signal with Immer-powered updates */
export function immerSignal<T>(initialValue: T): Signal<T> & { update: (recipe: (draft: Draft<T>) => void) => void } {
    const sig = signal<T>(initialValue);

    return Object.assign(sig, {
        update: (recipe: (draft: Draft<T>) => void) => {
            sig.set(produce(sig(), recipe));
        }
    });
}

/** Hook to use Immer with signals */
export function useImmer<T>(initialValue: T) {
    const state = immerSignal(initialValue);

    const updateState = (recipe: (draft: Draft<T>) => void) => {
        state.update(recipe);
    };

    return [state, updateState] as const;
}
