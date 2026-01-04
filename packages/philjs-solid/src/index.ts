
import { createSignal as createSolidSignal, createEffect as createSolidEffect } from 'solid-js';

// Convert a Solid Getter to a PhilJS Signal
export function fromSolid<T>(getter: () => T) {
    return {
        get value() { return getter(); },
        // Read-only
    };
}

// Convert a PhilJS Signal to a Solid Getter
export function toSolid<T>(philSignal: { value: T; subscribe: (cb: (v: T) => void) => () => void }) {
    const [s, setS] = createSolidSignal(philSignal.value);
    philSignal.subscribe((v) => setS(() => v));
    return s;
}

// Stub for route data
export function createRouteData(fetcher: () => Promise<any>) {
    return { resource: fetcher };
}

export function createServerAction(action: () => Promise<any>) {
    return action;
}
