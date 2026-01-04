/**
 * Router Mocking Utilities
 *
 * Create mock router for testing route components
 */
import { signal } from '@philjs/core';
export interface MockRouter {
    pathname: ReturnType<typeof signal<string>>;
    params: ReturnType<typeof signal<Record<string, string>>>;
    searchParams: ReturnType<typeof signal<URLSearchParams>>;
    navigate: (path: string) => void;
    back: () => void;
    forward: () => void;
    push: (path: string) => void;
    replace: (path: string) => void;
    getCalls: () => Array<{
        method: string;
        args: any[];
    }>;
}
/**
 * Create a mock router
 */
export declare function createMockRouter(initialPath?: string): MockRouter;
/**
 * Create mock route params
 */
export declare function createMockParams(params: Record<string, string>): import("@philjs/core").Signal<Record<string, string>>;
/**
 * Create mock search params
 */
export declare function createMockSearchParams(params?: Record<string, string>): import("@philjs/core").Signal<URLSearchParams>;
//# sourceMappingURL=router-mocks.d.ts.map