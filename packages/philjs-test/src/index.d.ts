/**
 * @philjs/test - Comprehensive Testing Framework for PhilJS Applications
 *
 * A full-featured testing library with AI-powered test generation, fuzzing,
 * mocking, snapshot testing, and signal-aware assertions.
 *
 * @example
 * ```typescript
 * import { describe, it, expect, mock, createTestHarness } from '@philjs/test';
 *
 * describe('Counter component', () => {
 *   it('increments on click', async () => {
 *     const { getByRole, signals } = await createTestHarness(Counter);
 *     expect(signals.get('count')).toBe(0);
 *
 *     await getByRole('button').click();
 *     expect(signals.get('count')).toBe(1);
 *   });
 * });
 * ```
 */
export type TestStatus = 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
export interface TestResult {
    name: string;
    status: TestStatus;
    duration: number;
    error?: Error;
    assertions: number;
    retries?: number;
}
export interface SuiteResult {
    name: string;
    tests: TestResult[];
    suites: SuiteResult[];
    duration: number;
    passed: number;
    failed: number;
    skipped: number;
}
export interface TestContext {
    name: string;
    timeout: number;
    retries: number;
    skip: boolean;
    only: boolean;
    tags: string[];
    beforeEach: Array<() => void | Promise<void>>;
    afterEach: Array<() => void | Promise<void>>;
}
export interface MockOptions {
    returnValue?: any;
    implementation?: (...args: any[]) => any;
    throwError?: Error;
    once?: boolean;
    callThrough?: boolean;
}
export interface MockCall {
    args: any[];
    result?: any;
    error?: Error;
    timestamp: number;
}
export interface MockFn<T extends (...args: any[]) => any = (...args: any[]) => any> {
    (...args: Parameters<T>): ReturnType<T>;
    calls: MockCall[];
    callCount: number;
    mockReturnValue(value: ReturnType<T>): MockFn<T>;
    mockReturnValueOnce(value: ReturnType<T>): MockFn<T>;
    mockImplementation(fn: T): MockFn<T>;
    mockImplementationOnce(fn: T): MockFn<T>;
    mockResolvedValue(value: Awaited<ReturnType<T>>): MockFn<T>;
    mockRejectedValue(error: Error): MockFn<T>;
    mockReset(): void;
    mockRestore(): void;
    calledWith(...args: Parameters<T>): boolean;
    lastCalledWith(): Parameters<T> | undefined;
    nthCalledWith(n: number): Parameters<T> | undefined;
}
export interface SpyOptions {
    callThrough?: boolean;
}
export interface Spy<T extends (...args: any[]) => any = (...args: any[]) => any> extends MockFn<T> {
    original: T;
    restore(): void;
}
export interface FuzzOptions {
    agent: {
        chat: (input: string) => Promise<string>;
    };
    scenarios: number;
    strategies: FuzzStrategy[];
    validator: (input: string, output: string) => boolean | Promise<boolean>;
    seed?: number;
    timeout?: number;
}
export type FuzzStrategy = 'jailbreak' | 'injection' | 'nonsense' | 'valid' | 'boundary' | 'unicode' | 'overflow' | 'format';
export interface FuzzResult {
    total: number;
    passed: number;
    failures: Array<{
        scenario: number;
        strategy: FuzzStrategy;
        input: string;
        output: string;
    }>;
    score: number;
    duration: number;
}
export interface SnapshotOptions {
    name?: string;
    serializer?: (value: unknown) => string;
    updateSnapshots?: boolean;
}
export interface CoverageData {
    statements: {
        total: number;
        covered: number;
        percentage: number;
    };
    branches: {
        total: number;
        covered: number;
        percentage: number;
    };
    functions: {
        total: number;
        covered: number;
        percentage: number;
    };
    lines: {
        total: number;
        covered: number;
        percentage: number;
    };
    files: Map<string, FileCoverage>;
}
export interface FileCoverage {
    path: string;
    lines: Map<number, number>;
    branches: Map<string, boolean>;
    functions: Map<string, number>;
}
export interface TestHarness<T = unknown> {
    element: HTMLElement;
    component: T;
    signals: Map<string, any>;
    getByRole(role: string, options?: {
        name?: string;
    }): HTMLElement;
    getByText(text: string | RegExp): HTMLElement;
    getByTestId(testId: string): HTMLElement;
    getByLabel(label: string): HTMLElement;
    queryByRole(role: string, options?: {
        name?: string;
    }): HTMLElement | null;
    queryByText(text: string | RegExp): HTMLElement | null;
    queryByTestId(testId: string): HTMLElement | null;
    findByRole(role: string, options?: {
        name?: string;
        timeout?: number;
    }): Promise<HTMLElement>;
    findByText(text: string | RegExp, options?: {
        timeout?: number;
    }): Promise<HTMLElement>;
    fireEvent(element: HTMLElement, event: string, options?: EventInit): void;
    click(element: HTMLElement): Promise<void>;
    type(element: HTMLElement, text: string): Promise<void>;
    waitFor<R>(callback: () => R | Promise<R>, options?: {
        timeout?: number;
    }): Promise<R>;
    waitForSignal(name: string, value: any, options?: {
        timeout?: number;
    }): Promise<void>;
    unmount(): void;
    debug(): void;
}
export interface AITestGenerator {
    generateTests(code: string, options?: {
        framework?: string;
        coverage?: boolean;
    }): Promise<string>;
    generateMocks(interfaces: string): Promise<string>;
    suggestAssertions(testCase: string): Promise<string[]>;
    fixFailingTest(test: string, error: string): Promise<string>;
}
export interface PropertyBasedTestOptions<T> {
    iterations?: number;
    seed?: number;
    shrink?: boolean;
    examples?: T[];
}
export interface Arbitrary<T> {
    generate(seed: number): T;
    shrink(value: T): T[];
}
interface TestOptions {
    timeout?: number;
    retries?: number;
    skip?: boolean;
    only?: boolean;
    tags?: string[];
}
/**
 * Define a test suite
 */
export declare function describe(name: string, fn: () => void): void;
export declare namespace describe {
    var only: (name: string, fn: () => void) => void;
    var skip: (name: string, fn: () => void) => void;
}
/**
 * Define a test
 */
export declare function it(name: string, fn: () => void | Promise<void>, options?: TestOptions): void;
export declare namespace it {
    var only: (name: string, fn: () => void | Promise<void>, options?: TestOptions) => void;
    var skip: (name: string, fn: () => void | Promise<void>, options?: TestOptions) => void;
    var todo: (name: string) => void;
    var each: <T>(cases: T[]) => (name: string, fn: (testCase: T) => void | Promise<void>, options?: TestOptions) => void;
}
export declare const test: typeof it;
/**
 * Lifecycle hooks
 */
export declare function beforeAll(fn: () => void | Promise<void>): void;
export declare function afterAll(fn: () => void | Promise<void>): void;
export declare function beforeEach(fn: () => void | Promise<void>): void;
export declare function afterEach(fn: () => void | Promise<void>): void;
declare class AssertionError extends Error {
    expected: unknown;
    actual: unknown;
    constructor(message: string, expected: unknown, actual: unknown);
}
interface Matchers<T> {
    toBe(expected: T): void;
    toEqual(expected: T): void;
    toStrictEqual(expected: T): void;
    toBeDefined(): void;
    toBeUndefined(): void;
    toBeNull(): void;
    toBeTruthy(): void;
    toBeFalsy(): void;
    toBeNaN(): void;
    toBeGreaterThan(expected: number): void;
    toBeGreaterThanOrEqual(expected: number): void;
    toBeLessThan(expected: number): void;
    toBeLessThanOrEqual(expected: number): void;
    toBeCloseTo(expected: number, precision?: number): void;
    toContain(expected: unknown): void;
    toContainEqual(expected: unknown): void;
    toHaveLength(expected: number): void;
    toHaveProperty(key: string, value?: unknown): void;
    toMatch(expected: string | RegExp): void;
    toMatchObject(expected: object): void;
    toMatchSnapshot(options?: SnapshotOptions): void;
    toMatchInlineSnapshot(snapshot?: string): void;
    toThrow(expected?: string | RegExp | Error): void;
    toThrowError(expected?: string | RegExp | Error): void;
    resolves: Matchers<Awaited<T>>;
    rejects: Matchers<unknown>;
    not: Matchers<T>;
    toHaveSignalValue(expected: unknown): void;
    toBeReactive(): void;
    toHaveEmitted(event: string, times?: number): void;
    toBeInTheDocument(): void;
    toBeVisible(): void;
    toBeEnabled(): void;
    toBeDisabled(): void;
    toHaveClass(...classes: string[]): void;
    toHaveAttribute(attr: string, value?: string): void;
    toHaveTextContent(text: string | RegExp): void;
    toHaveValue(value: string | number): void;
    toBeChecked(): void;
    toHaveFocus(): void;
}
/**
 * Expect function - entry point for assertions
 */
export declare function expect<T>(actual: T): Matchers<T>;
export declare namespace expect {
    var extend: (customMatchers: Record<string, (actual: unknown, ...args: any[]) => void>) => void;
    var assertions: (count: number) => void;
    var hasAssertions: () => void;
}
/**
 * Create a mock function
 */
export declare function mock<T extends (...args: any[]) => any = (...args: any[]) => any>(implementation?: T): MockFn<T>;
/**
 * Create a spy on an existing function
 */
export declare function spy<T extends (...args: any[]) => any>(obj: object, method: string, options?: SpyOptions): Spy<T>;
/**
 * Mock a module
 */
export declare function mockModule(modulePath: string, factory?: () => object): void;
/**
 * Mock timers
 */
export declare const fakeTimers: {
    enable(): void;
    disable(): void;
    advance(ms: number): void;
    runAll(): void;
    runNext(): void;
    setSystemTime(date: Date | number): void;
};
/**
 * Describe an AI test suite
 */
export declare const describeAI: (suite: string, desc: string, fn: () => void) => Promise<{
    suite: string;
    status: string;
    testCount: number;
    error?: undefined;
} | {
    suite: string;
    status: string;
    error: any;
    testCount?: undefined;
}>;
/**
 * Fuzz test an AI agent
 */
export declare const fuzzAI: (options: FuzzOptions) => Promise<FuzzResult>;
/**
 * Attempt to fix a failing test using AI
 */
export declare const attemptTestFix: (failure: {
    error: string;
    code: string;
}, llm: {
    complete: (prompt: string) => Promise<string>;
}) => Promise<{
    status: string;
    patch: string;
    error?: undefined;
} | {
    status: string;
    error: any;
    patch?: undefined;
}>;
/**
 * Generate tests using AI
 */
export declare function createAITestGenerator(llm: {
    complete: (prompt: string) => Promise<string>;
}): AITestGenerator;
/**
 * Arbitrary value generators
 */
export declare const arbitrary: {
    integer(min?: number, max?: number): Arbitrary<number>;
    float(min?: number, max?: number): Arbitrary<number>;
    string(minLength?: number, maxLength?: number): Arbitrary<string>;
    boolean(): Arbitrary<boolean>;
    array<T>(elementArb: Arbitrary<T>, minLength?: number, maxLength?: number): Arbitrary<T[]>;
    object<T extends object>(shape: { [K in keyof T]: Arbitrary<T[K]>; }): Arbitrary<T>;
    oneOf<T>(...values: T[]): Arbitrary<T>;
};
/**
 * Run property-based test
 */
export declare function property<T>(name: string, arb: Arbitrary<T>, predicate: (value: T) => boolean | void, options?: PropertyBasedTestOptions<T>): void;
/**
 * Create a test harness for a component
 */
export declare function createTestHarness<T>(component: new (...args: any[]) => T | ((props: any) => any), props?: Record<string, any>): Promise<TestHarness<T>>;
interface RunnerOptions {
    filter?: string;
    tags?: string[];
    timeout?: number;
    retries?: number;
    parallel?: boolean;
    bail?: boolean;
    reporter?: 'default' | 'json' | 'junit' | 'tap';
}
/**
 * Run all registered tests
 */
export declare function runTests(options?: RunnerOptions): Promise<SuiteResult>;
/**
 * Format test results for display
 */
export declare function formatResults(results: SuiteResult, indent?: number): string;
export { describe, it, test, beforeAll, afterAll, beforeEach, afterEach, expect, AssertionError, mock, spy, mockModule, fakeTimers, describeAI, fuzzAI, attemptTestFix, createAITestGenerator, arbitrary, property, createTestHarness, runTests, formatResults, };
export type { TestStatus, TestResult, SuiteResult, TestContext, MockOptions, MockCall, MockFn, SpyOptions, Spy, FuzzOptions, FuzzStrategy, FuzzResult, SnapshotOptions, CoverageData, FileCoverage, TestHarness, AITestGenerator, PropertyBasedTestOptions, Arbitrary, Matchers, };
//# sourceMappingURL=index.d.ts.map