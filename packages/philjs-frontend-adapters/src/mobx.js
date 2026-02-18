import { signal, memo, effect } from '@philjs/core';
// Compatibility wrapper to provide tuple-style API
function createSignal(initialValue) {
    const sig = signal(initialValue);
    return [() => sig.get(), (v) => sig.set(v)];
}
export function useObservable(initialValue) {
    const signals = new Map();
    // Initialize signals for existing props
    for (const key of Object.keys(initialValue)) {
        signals.set(key, createSignal(initialValue[key]));
    }
    return new Proxy(initialValue, {
        get(target, prop, receiver) {
            // Lazy create signal for new props
            if (!signals.has(prop)) {
                signals.set(prop, createSignal(Reflect.get(target, prop, receiver)));
            }
            const [get] = signals.get(prop);
            return get();
        },
        set(target, prop, value, receiver) {
            const result = Reflect.set(target, prop, value, receiver);
            if (!signals.has(prop)) {
                signals.set(prop, createSignal(value));
            }
            else {
                const [, set] = signals.get(prop);
                set(value);
            }
            return result;
        }
    });
}
export function autorun(reaction) {
    // PhilJS effects are auto-running and reactive
    effect(reaction);
    // Return disposer (mocked as PhilJS handles lifecycle automatically in components)
    return () => { };
}
export function computed(getter) {
    // PhilJS memos are computed values
    const m = memo(getter);
    return {
        get: () => m.get()
    };
}
//# sourceMappingURL=mobx.js.map