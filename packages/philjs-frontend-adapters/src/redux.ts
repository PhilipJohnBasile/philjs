
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

export type Middleware = (api: MiddlewareAPI) => (next: Dispatch) => (action: AnyAction) => any;

export function connectDevTools(store: { getState: () => any; subscribe: (cb: Function) => void }) {
    if (typeof window !== 'undefined' && (window as any).__REDUX_DEVTOOLS_EXTENSION__) {
        const devTools = (window as any).__REDUX_DEVTOOLS_EXTENSION__.connect({ name: 'PhilJS App' });
        devTools.init(store.getState());

        // Subscribe to store updates to notify DevTools
        store.subscribe(() => {
            devTools.send('STATE_UPDATE', store.getState());
        });

        // Subscribe to DevTools actions (Time Travel)
        devTools.subscribe((message: any) => {
            if (message.type === 'DISPATCH' && message.payload?.type === 'JUMP_TO_ACTION') {
                console.log('Redux DevTools: Time Travel to', JSON.parse(message.state));
            }
        });
    }
}
