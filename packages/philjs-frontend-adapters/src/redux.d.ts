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
export declare function useSelector<S, R>(store: Store<S>, selector: (state: S) => R): () => R;
export declare function connectDevTools(store: {
    getState: () => any;
    subscribe: (cb: Function) => void;
}): void;
//# sourceMappingURL=redux.d.ts.map