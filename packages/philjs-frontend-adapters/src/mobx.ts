import { signal, memo, effect, type Signal } from '@philjs/core';

// Compatibility wrapper to provide tuple-style API
function createSignal<T>(initialValue: T): [() => T, (v: T) => void] {
    const sig = signal(initialValue);
    return [() => sig.get(), (v: T) => sig.set(v)];
}

export function useObservable<T extends object>(initialValue: T): T {
    const signals = new Map<keyof T, [() => any, (v: any) => void]>();

    // Initialize signals for existing props
    for (const key of Object.keys(initialValue)) {
        signals.set(key as keyof T, createSignal((initialValue as any)[key]));
    }

    return new Proxy(initialValue, {
        get(target, prop, receiver) {
            // Lazy create signal for new props
            if (!signals.has(prop as keyof T)) {
                signals.set(prop as keyof T, createSignal(Reflect.get(target, prop, receiver)));
            }

            const [get] = signals.get(prop as keyof T)!;
            return get();
        },
        set(target, prop, value, receiver) {
            const result = Reflect.set(target, prop, value, receiver);

            if (!signals.has(prop as keyof T)) {
                signals.set(prop as keyof T, createSignal(value));
            } else {
                const [, set] = signals.get(prop as keyof T)!;
                set(value);
            }

            return result;
        }
    });
}

export function autorun(reaction: () => void) {
    // PhilJS effects are auto-running and reactive
    effect(reaction);
    // Return disposer (mocked as PhilJS handles lifecycle automatically in components)
    return () => { };
}

export function computed<T>(getter: () => T) {
    // PhilJS memos are computed values
    const m = memo(getter);
    return {
        get: () => m.get()
    };
}
