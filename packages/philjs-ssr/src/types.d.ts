/**
 * Type definitions for SSR, loaders, and actions.
 */
export type LoaderCtx = {
    params: Record<string, string>;
    request: Request;
    env?: any;
    db?: any;
    ai?: any;
};
export type ActionCtx = LoaderCtx & {
    formData: FormData;
};
export type Loader<T> = (ctx: LoaderCtx) => Promise<T> | T;
export type Action<T> = (ctx: ActionCtx) => Promise<T> | T;
//# sourceMappingURL=types.d.ts.map