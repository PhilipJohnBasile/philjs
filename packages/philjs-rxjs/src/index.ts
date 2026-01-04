/**
 * PhilJS RxJS Interop
 */

import { signal, effect, type Signal } from '@philjs/core';
import type { Observable, Subscription } from 'rxjs';

/** Convert an Observable to a PhilJS signal */
export function fromObservable<T>(observable: Observable<T>, initialValue: T): Signal<T> {
    const sig = signal<T>(initialValue);
    let subscription: Subscription;

    effect(() => {
        subscription = observable.subscribe(value => sig.set(value));
        return () => subscription?.unsubscribe();
    });

    return sig;
}

/** Convert a PhilJS signal to an Observable */
export function toObservable<T>(sig: Signal<T>): Observable<T> {
    return {
        subscribe(observer: any) {
            const unsubscribe = effect(() => {
                const value = sig();
                if (typeof observer === 'function') observer(value);
                else observer.next?.(value);
            });
            return { unsubscribe };
        }
    } as unknown as Observable<T>;
}

/** Use an RxJS observable as a reactive value */
export function useObservable<T>(observable: Observable<T>, initialValue: T) {
    const value = signal<T>(initialValue);
    const error = signal<Error | null>(null);
    const loading = signal(true);

    effect(() => {
        const sub = observable.subscribe({
            next: v => { value.set(v); loading.set(false); },
            error: e => { error.set(e); loading.set(false); },
        });
        return () => sub.unsubscribe();
    });

    return { value, error, loading };
}
