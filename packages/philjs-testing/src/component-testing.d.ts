/**
 * Component Testing Utilities
 *
 * Advanced component testing with:
 * - Visual regression testing
 * - Accessibility testing
 * - Performance testing
 * - Interactive testing
 */
export interface ComponentTestConfig {
    /** Component to test */
    component: unknown;
    /** Component props */
    props?: Record<string, unknown>;
    /** Container options */
    container?: HTMLElement;
    /** Whether to enable accessibility checking */
    a11y?: boolean;
    /** Whether to capture performance metrics */
    performance?: boolean;
    /** Viewport size for visual testing */
    viewport?: {
        width: number;
        height: number;
    };
}
export interface ComponentTestResult {
    /** Rendered element */
    element: HTMLElement;
    /** Component instance */
    instance: unknown;
    /** Unmount function */
    unmount: () => void;
    /** Rerender with new props */
    rerender: (props: Record<string, unknown>) => void;
    /** Get accessibility report */
    getA11yReport: () => Promise<A11yReport>;
    /** Get performance metrics */
    getPerformance: () => PerformanceMetrics;
    /** Take screenshot */
    screenshot: () => Promise<string>;
    /** Fire event and wait for update */
    act: (fn: () => void | Promise<void>) => Promise<void>;
    /** Query helpers bound to component */
    queries: ComponentQueries;
}
export interface A11yReport {
    violations: A11yViolation[];
    passes: A11yPass[];
    incomplete: A11yIncomplete[];
    score: number;
}
export interface A11yViolation {
    id: string;
    impact: 'minor' | 'moderate' | 'serious' | 'critical';
    description: string;
    help: string;
    helpUrl: string;
    nodes: Array<{
        html: string;
        target: string[];
        failureSummary: string;
    }>;
}
export interface A11yPass {
    id: string;
    description: string;
    nodes: number;
}
export interface A11yIncomplete {
    id: string;
    description: string;
    nodes: Array<{
        html: string;
        target: string[];
    }>;
}
export interface PerformanceMetrics {
    renderTime: number;
    rerenderTime: number;
    mountTime: number;
    updateCount: number;
    memoryUsage: number;
    domNodes: number;
    eventListeners: number;
}
export interface ComponentQueries {
    getByRole: (role: string, options?: QueryOptions) => HTMLElement;
    getByText: (text: string | RegExp, options?: QueryOptions) => HTMLElement;
    getByTestId: (testId: string) => HTMLElement;
    getByLabelText: (text: string | RegExp, options?: QueryOptions) => HTMLElement;
    getByPlaceholderText: (text: string | RegExp) => HTMLElement;
    getAllByRole: (role: string, options?: QueryOptions) => HTMLElement[];
    getAllByText: (text: string | RegExp, options?: QueryOptions) => HTMLElement[];
    queryByRole: (role: string, options?: QueryOptions) => HTMLElement | null;
    queryByText: (text: string | RegExp, options?: QueryOptions) => HTMLElement | null;
    findByRole: (role: string, options?: QueryOptions) => Promise<HTMLElement>;
    findByText: (text: string | RegExp, options?: QueryOptions) => Promise<HTMLElement>;
}
export interface QueryOptions {
    name?: string | RegExp;
    hidden?: boolean;
    exact?: boolean;
    selector?: string;
}
export interface VisualTestOptions {
    threshold?: number;
    includeAA?: boolean;
    diffColor?: {
        r: number;
        g: number;
        b: number;
    };
    alpha?: number;
}
export interface VisualDiff {
    match: boolean;
    diffPercentage: number;
    diffPixels: number;
    diffImage?: string;
}
/**
 * Test a component with full lifecycle tracking
 */
export declare function testComponent(config: ComponentTestConfig): Promise<ComponentTestResult>;
/**
 * Compare component screenshot with baseline
 */
export declare function visualTest(config: ComponentTestConfig, baselineImage: string, options?: VisualTestOptions): Promise<VisualDiff>;
/**
 * Create visual snapshot
 */
export declare function createVisualSnapshot(config: ComponentTestConfig, name: string): Promise<string>;
/**
 * Update visual snapshot
 */
export declare function updateVisualSnapshot(config: ComponentTestConfig, name: string): Promise<void>;
/**
 * Assert no accessibility violations
 */
export declare function expectNoA11yViolations(config: ComponentTestConfig, options?: {
    impact?: 'minor' | 'moderate' | 'serious' | 'critical';
}): Promise<void>;
/**
 * Measure component render performance
 */
export declare function measureRenderPerformance(config: ComponentTestConfig, iterations?: number): Promise<{
    mean: number;
    median: number;
    min: number;
    max: number;
    p95: number;
    p99: number;
}>;
/**
 * Assert component renders within time budget
 */
export declare function expectRenderWithinBudget(config: ComponentTestConfig, budgetMs: number): Promise<void>;
/**
 * Simulate user interaction sequence
 */
export declare function interactionTest(config: ComponentTestConfig, interactions: Array<{
    action: 'click' | 'type' | 'focus' | 'blur' | 'hover' | 'select';
    target: string;
    value?: string;
}>): Promise<{
    success: boolean;
    errors: string[];
}>;
export interface TestFixture<T> {
    setup: () => T | Promise<T>;
    teardown: (data: T) => void | Promise<void>;
}
/**
 * Create reusable test fixture
 */
export declare function createFixture<T>(config: TestFixture<T>): () => Promise<{
    data: T;
    cleanup: () => Promise<void>;
}>;
/**
 * Create component test fixture
 */
export declare function componentFixture(component: unknown, defaultProps?: Record<string, unknown>): (props?: Record<string, unknown>) => Promise<ComponentTestResult>;
//# sourceMappingURL=component-testing.d.ts.map