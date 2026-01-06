import { createSignal, onCleanup } from '@philjs/core';

export interface Action<T = any> {
    type: T;
}

export interface AnyAction extends Action {
    [extraProps: string]: any;
}

export type Dispatch<A extends Action = AnyAction> = <T extends A>(action: T) => T;

export interface MiddlewareAPI<D extends Dispatch = Dispatch, S = any> {
    dispatch: D;
    getState(): S;
}

export interface Store<S = any> {
    getState(): S;
    dispatch: Dispatch;
    subscribe(listener: () => void): () => void;
}

export type Middleware = (api: MiddlewareAPI) => (next: Dispatch) => (action: AnyAction) => any;

export function useSelector<S, R>(store: Store<S>, selector: (state: S) => R): () => R {
    const [selected, setSelected] = createSignal(selector(store.getState()));

    const unsubscribe = store.subscribe(() => {
        const nextValue = selector(store.getState());
        // PhilJS signals typically handle equality check, but explicit check here saves overhead
        if (nextValue !== selected()) {
            setSelected(nextValue);
        }
    });

    onCleanup(() => unsubscribe());

    return selected;
}

export function connectDevTools(store: { getState: () => any; subscribe: (cb: Function) => void }) {
    if (typeof window !== 'undefined' && (window as any).__REDUX_DEVTOOLS_EXTENSION__) {
        const devTools = (window as any).__REDUX_DEVTOOLS_EXTENSION__.connect({ name: 'PhilJS App' });
        devTools.init(store.getState());

        store.subscribe(() => {
            devTools.send('STATE_UPDATE', store.getState());
        });

        devTools.subscribe((message: any) => {
            if (message.type === 'DISPATCH' && message.payload?.type === 'JUMP_TO_ACTION') {
                console.log('Redux DevTools: Jump detected (Implementation requires store.setState which Redux lacks by default)');
            }
        });
    }
}
