/**
 * Router Decorator
 *
 * Wraps stories with a mock router context
 */
export interface WithRouterOptions {
    initialPath?: string;
    params?: Record<string, string>;
}
/**
 * Decorator that provides router context to stories
 */
export declare function withRouter(options?: WithRouterOptions): (storyFn: () => any, context: any) => any;
//# sourceMappingURL=with-router.d.ts.map