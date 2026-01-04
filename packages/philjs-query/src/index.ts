
// PhilJS Query
// Data fetching with Optimistic UI updates

import { signal, Signal } from '@philjs/core';

export interface QueryState<T> {
    data: T | null;
    isLoading: boolean;
    error: any;
}

export function useQuery<T>(key: string, fetcher: () => Promise<T>): Signal<QueryState<T>> {
    const state = signal<QueryState<T>>({ data: null, isLoading: true, error: null });

    fetcher()
        .then(data => state.set({ data, isLoading: false, error: null }))
        .catch(error => state.set({ data: null, isLoading: false, error }));

    return state;
}

export function useOptimistic<T>(querySignal: Signal<QueryState<T>>, updateFn: (old: T) => T) {
    return async (mutationFn: () => Promise<void>) => {
        const previous = querySignal.value.data;
        // Optimistic update
        if (previous) {
            querySignal.set({ ...querySignal.value, data: updateFn(previous) });
        }

        try {
            await mutationFn();
        } catch (e) {
            // Rollback
            querySignal.set({ ...querySignal.value, data: previous });
            throw e;
        }
    };
}
