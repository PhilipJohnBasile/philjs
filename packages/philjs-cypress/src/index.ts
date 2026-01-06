/**
 * PhilJS Cypress Plugin
 *
 * Comprehensive E2E testing utilities for PhilJS applications.
 * Provides commands for testing signals, components, routing,
 * forms, accessibility, performance, and more.
 */

/// <reference types="cypress" />

// ============================================================================
// TYPE DECLARATIONS
// ============================================================================

declare global {
    namespace Cypress {
        interface Chainable {
            // ===== Signal Commands =====
            /**
             * Get the current value of a PhilJS signal by name
             */
            signal(name: string): Chainable<any>;

            /**
             * Assert a signal's value equals expected
             */
            signalShouldEqual(name: string, expectedValue: any): Chainable<void>;

            /**
             * Set a signal's value
             */
            setSignal(name: string, value: any): Chainable<void>;

            /**
             * Watch a signal for changes and return history
             */
            watchSignal(name: string, options?: WatchSignalOptions): Chainable<any[]>;

            /**
             * Assert signal changed to specific value
             */
            signalChangedTo(name: string, value: any): Chainable<void>;

            /**
             * Get all registered signals
             */
            getAllSignals(): Chainable<Record<string, any>>;

            /**
             * Reset all signals to initial values
             */
            resetSignals(): Chainable<void>;

            /**
             * Batch multiple signal updates
             */
            batchSignals(updates: Record<string, any>): Chainable<void>;

            // ===== Component Commands =====
            /**
             * Mount a PhilJS component for testing
             */
            mountPhilJS<P extends object>(
                component: (props: P) => any,
                options?: MountOptions<P>
            ): Chainable<JQuery<HTMLElement>>;

            /**
             * Unmount the currently mounted component
             */
            unmountPhilJS(): Chainable<void>;

            /**
             * Wait for component to finish rendering
             */
            waitForRender(): Chainable<void>;

            /**
             * Get component instance by test id
             */
            getComponent(testId: string): Chainable<JQuery<HTMLElement>>;

            /**
             * Assert component rendered correctly
             */
            componentShouldExist(testId: string): Chainable<void>;

            /**
             * Take snapshot of component for visual regression
             */
            snapshotComponent(name: string, options?: SnapshotOptions): Chainable<void>;

            // ===== Hydration Commands =====
            /**
             * Wait for PhilJS hydration to complete
             */
            waitForHydration(options?: HydrationOptions): Chainable<void>;

            /**
             * Assert hydration completed successfully
             */
            assertHydrated(): Chainable<void>;

            /**
             * Get hydration timing metrics
             */
            getHydrationMetrics(): Chainable<HydrationMetrics>;

            // ===== Router Commands =====
            /**
             * Navigate using PhilJS router
             */
            navigateTo(path: string, options?: NavigateOptions): Chainable<void>;

            /**
             * Assert current route matches
             */
            routeShouldBe(path: string): Chainable<void>;

            /**
             * Get current route params
             */
            getRouteParams(): Chainable<Record<string, string>>;

            /**
             * Get current query params
             */
            getQueryParams(): Chainable<Record<string, string>>;

            /**
             * Wait for route transition to complete
             */
            waitForRouteChange(): Chainable<void>;

            /**
             * Go back in history
             */
            goBack(): Chainable<void>;

            /**
             * Go forward in history
             */
            goForward(): Chainable<void>;

            // ===== Form Commands =====
            /**
             * Fill a PhilJS form by field names
             */
            fillForm(data: Record<string, any>): Chainable<void>;

            /**
             * Submit a PhilJS form
             */
            submitForm(selector?: string): Chainable<void>;

            /**
             * Assert form validation state
             */
            formShouldBeValid(selector?: string): Chainable<void>;

            /**
             * Assert form validation errors
             */
            formShouldHaveErrors(
                errors: Record<string, string | string[]>
            ): Chainable<void>;

            /**
             * Get form values
             */
            getFormValues(selector?: string): Chainable<Record<string, any>>;

            /**
             * Reset form to initial values
             */
            resetForm(selector?: string): Chainable<void>;

            // ===== Store Commands =====
            /**
             * Get PhilJS store state
             */
            getStoreState(storeName?: string): Chainable<any>;

            /**
             * Dispatch action to store
             */
            dispatchAction(action: string, payload?: any): Chainable<void>;

            /**
             * Assert store state matches
             */
            storeShouldEqual(expected: any, storeName?: string): Chainable<void>;

            /**
             * Reset store to initial state
             */
            resetStore(storeName?: string): Chainable<void>;

            // ===== DevTools Commands =====
            /**
             * Get PhilJS devtools state
             */
            getPhilJSState(): Chainable<Record<string, any>>;

            /**
             * Get component tree from devtools
             */
            getComponentTree(): Chainable<ComponentTreeNode[]>;

            /**
             * Get performance metrics from devtools
             */
            getPerformanceMetrics(): Chainable<PerformanceMetrics>;

            /**
             * Enable/disable devtools features
             */
            configureDevTools(options: DevToolsOptions): Chainable<void>;

            // ===== Accessibility Commands =====
            /**
             * Run accessibility audit on current page
             */
            a11yAudit(options?: A11yAuditOptions): Chainable<A11yResults>;

            /**
             * Assert no accessibility violations
             */
            shouldBeAccessible(options?: A11yAuditOptions): Chainable<void>;

            /**
             * Check focus management
             */
            assertFocusOn(selector: string): Chainable<void>;

            /**
             * Navigate using keyboard
             */
            keyboardNavigate(keys: string[]): Chainable<void>;

            /**
             * Assert element is keyboard accessible
             */
            shouldBeKeyboardAccessible(selector: string): Chainable<void>;

            // ===== Network Commands =====
            /**
             * Mock API endpoint
             */
            mockApi(
                method: string,
                url: string | RegExp,
                response: any,
                options?: MockApiOptions
            ): Chainable<void>;

            /**
             * Wait for API call
             */
            waitForApi(alias: string): Chainable<Interception>;

            /**
             * Assert API was called with specific data
             */
            apiCalledWith(
                alias: string,
                matcher: Record<string, any>
            ): Chainable<void>;

            /**
             * Simulate network conditions
             */
            simulateNetwork(condition: NetworkCondition): Chainable<void>;

            /**
             * Clear all mocks
             */
            clearMocks(): Chainable<void>;

            // ===== Animation Commands =====
            /**
             * Wait for animations to complete
             */
            waitForAnimation(selector?: string): Chainable<void>;

            /**
             * Disable animations for testing
             */
            disableAnimations(): Chainable<void>;

            /**
             * Enable animations
             */
            enableAnimations(): Chainable<void>;

            /**
             * Assert animation state
             */
            animationShouldBe(
                selector: string,
                state: 'running' | 'paused' | 'finished'
            ): Chainable<void>;

            // ===== Performance Commands =====
            /**
             * Measure performance of an action
             */
            measurePerformance(
                name: string,
                fn: () => Chainable<any>
            ): Chainable<PerformanceMeasure>;

            /**
             * Assert render time is under threshold
             */
            renderTimeShouldBeLessThan(ms: number): Chainable<void>;

            /**
             * Get Core Web Vitals
             */
            getWebVitals(): Chainable<WebVitals>;

            /**
             * Assert no memory leaks
             */
            assertNoMemoryLeaks(): Chainable<void>;

            // ===== Utility Commands =====
            /**
             * Wait for condition
             */
            waitUntil(
                predicate: () => boolean | Chainable<boolean>,
                options?: WaitUntilOptions
            ): Chainable<void>;

            /**
             * Execute PhilJS code in browser context
             */
            executePhilJS<T>(fn: () => T): Chainable<T>;

            /**
             * Create test fixture
             */
            createFixture<T>(name: string, data: T): Chainable<T>;

            /**
             * Load test fixture
             */
            loadFixture<T>(name: string): Chainable<T>;
        }
    }
}

// ============================================================================
// INTERFACES
// ============================================================================

export interface WatchSignalOptions {
    timeout?: number;
    maxChanges?: number;
}

export interface MountOptions<P> {
    props?: P;
    container?: string | HTMLElement;
    styles?: string;
    providers?: Record<string, any>;
}

export interface SnapshotOptions {
    threshold?: number;
    failOnDiff?: boolean;
    updateSnapshots?: boolean;
}

export interface HydrationOptions {
    timeout?: number;
    checkInterval?: number;
}

export interface HydrationMetrics {
    startTime: number;
    endTime: number;
    duration: number;
    componentsHydrated: number;
    signalsRestored: number;
}

export interface NavigateOptions {
    replace?: boolean;
    state?: any;
    waitForLoad?: boolean;
}

export interface ComponentTreeNode {
    id: string;
    name: string;
    props: Record<string, any>;
    children: ComponentTreeNode[];
}

export interface PerformanceMetrics {
    renderTime: number;
    updateTime: number;
    memoryUsage: number;
    componentCount: number;
    signalCount: number;
    effectCount: number;
}

export interface DevToolsOptions {
    enabled?: boolean;
    logSignals?: boolean;
    logEffects?: boolean;
    logRenders?: boolean;
    timeTravel?: boolean;
}

export interface A11yAuditOptions {
    runOnly?: string[];
    exclude?: string[];
    includedImpacts?: Array<'minor' | 'moderate' | 'serious' | 'critical'>;
    context?: string;
}

export interface A11yResults {
    violations: A11yViolation[];
    passes: A11yPass[];
    incomplete: A11yIncomplete[];
}

export interface A11yViolation {
    id: string;
    description: string;
    impact: 'minor' | 'moderate' | 'serious' | 'critical';
    nodes: Array<{ html: string; target: string[] }>;
}

export interface A11yPass {
    id: string;
    description: string;
}

export interface A11yIncomplete {
    id: string;
    description: string;
    nodes: Array<{ html: string; target: string[] }>;
}

export interface MockApiOptions {
    statusCode?: number;
    headers?: Record<string, string>;
    delay?: number;
    alias?: string;
    times?: number;
}

export type NetworkCondition =
    | 'offline'
    | 'slow-3g'
    | 'fast-3g'
    | '4g'
    | 'wifi'
    | { latency: number; downloadSpeed: number; uploadSpeed: number };

export interface PerformanceMeasure {
    name: string;
    duration: number;
    startTime: number;
    endTime: number;
}

export interface WebVitals {
    lcp: number;
    fid: number;
    cls: number;
    fcp: number;
    ttfb: number;
}

export interface WaitUntilOptions {
    timeout?: number;
    interval?: number;
    errorMessage?: string;
}

// ============================================================================
// GLOBAL STATE
// ============================================================================

let mountedRoot: HTMLElement | null = null;
const signalWatchers = new Map<string, any[]>();
const mockAliases = new Map<string, string>();
let animationsDisabled = false;

// ============================================================================
// SIGNAL COMMANDS
// ============================================================================

function registerSignalCommands(): void {
    Cypress.Commands.add('signal', (name: string) => {
        return cy.window().then((win: any) => {
            const philjs = win.__PHILJS_DEVTOOLS__;
            if (!philjs) {
                throw new Error('PhilJS DevTools not found. Ensure dev mode is enabled.');
            }
            const signal = philjs.getSignal(name);
            if (!signal) {
                throw new Error(`Signal "${name}" not found`);
            }
            return signal();
        });
    });

    Cypress.Commands.add('signalShouldEqual', (name: string, expectedValue: any) => {
        return cy.signal(name).should('deep.equal', expectedValue);
    });

    Cypress.Commands.add('setSignal', (name: string, value: any) => {
        return cy.window().then((win: any) => {
            const philjs = win.__PHILJS_DEVTOOLS__;
            if (!philjs) {
                throw new Error('PhilJS DevTools not found. Ensure dev mode is enabled.');
            }
            const signal = philjs.getSignal(name);
            if (!signal) {
                throw new Error(`Signal "${name}" not found`);
            }
            signal.set(value);
        });
    });

    Cypress.Commands.add('watchSignal', (name: string, options: WatchSignalOptions = {}) => {
        const { timeout = 5000, maxChanges = 10 } = options;

        return cy.window().then((win: any) => {
            return new Cypress.Promise((resolve) => {
                const philjs = win.__PHILJS_DEVTOOLS__;
                if (!philjs) {
                    throw new Error('PhilJS DevTools not found');
                }

                const changes: any[] = [];
                const signal = philjs.getSignal(name);
                if (!signal) {
                    throw new Error(`Signal "${name}" not found`);
                }

                // Get initial value
                changes.push(signal());

                // Watch for changes
                const unsubscribe = philjs.watchSignal(name, (value: any) => {
                    changes.push(value);
                    if (changes.length >= maxChanges) {
                        unsubscribe();
                        resolve(changes);
                    }
                });

                // Timeout
                setTimeout(() => {
                    unsubscribe();
                    resolve(changes);
                }, timeout);
            });
        });
    });

    Cypress.Commands.add('signalChangedTo', (name: string, value: any) => {
        return cy.window().then((win: any) => {
            return new Cypress.Promise((resolve, reject) => {
                const philjs = win.__PHILJS_DEVTOOLS__;
                if (!philjs) {
                    reject(new Error('PhilJS DevTools not found'));
                    return;
                }

                const signal = philjs.getSignal(name);
                if (!signal) {
                    reject(new Error(`Signal "${name}" not found`));
                    return;
                }

                // Check current value
                if (Cypress._.isEqual(signal(), value)) {
                    resolve();
                    return;
                }

                // Watch for change
                const unsubscribe = philjs.watchSignal(name, (newValue: any) => {
                    if (Cypress._.isEqual(newValue, value)) {
                        unsubscribe();
                        resolve();
                    }
                });

                // Timeout
                setTimeout(() => {
                    unsubscribe();
                    reject(new Error(`Signal "${name}" did not change to expected value`));
                }, 5000);
            });
        });
    });

    Cypress.Commands.add('getAllSignals', () => {
        return cy.window().then((win: any) => {
            const philjs = win.__PHILJS_DEVTOOLS__;
            if (!philjs) {
                throw new Error('PhilJS DevTools not found');
            }
            return philjs.getAllSignals();
        });
    });

    Cypress.Commands.add('resetSignals', () => {
        return cy.window().then((win: any) => {
            const philjs = win.__PHILJS_DEVTOOLS__;
            if (!philjs) {
                throw new Error('PhilJS DevTools not found');
            }
            philjs.resetSignals();
        });
    });

    Cypress.Commands.add('batchSignals', (updates: Record<string, any>) => {
        return cy.window().then((win: any) => {
            const philjs = win.__PHILJS_DEVTOOLS__;
            if (!philjs) {
                throw new Error('PhilJS DevTools not found');
            }

            const { batch } = win.__PHILJS__;
            batch(() => {
                for (const [name, value] of Object.entries(updates)) {
                    const signal = philjs.getSignal(name);
                    if (signal) {
                        signal.set(value);
                    }
                }
            });
        });
    });
}

// ============================================================================
// COMPONENT COMMANDS
// ============================================================================

function registerComponentCommands(): void {
    Cypress.Commands.add('mountPhilJS', <P extends object>(
        component: (props: P) => any,
        options: MountOptions<P> = {}
    ) => {
        const { props = {} as P, container, styles, providers } = options;

        return cy.document().then((doc) => {
            // Clean up existing mount
            if (mountedRoot) {
                mountedRoot.remove();
            }

            // Create container
            const root = typeof container === 'string'
                ? doc.querySelector(container) as HTMLElement
                : container || doc.createElement('div');

            if (!container) {
                root.id = 'philjs-cypress-root';
                doc.body.appendChild(root);
            }
            mountedRoot = root;

            // Add styles if provided
            if (styles) {
                const styleEl = doc.createElement('style');
                styleEl.textContent = styles;
                doc.head.appendChild(styleEl);
            }

            return cy.window().then((win: any) => {
                const { render, createContext } = win.__PHILJS__;

                // Wrap with providers if needed
                let content = component(props);
                if (providers) {
                    for (const [name, value] of Object.entries(providers)) {
                        const Context = createContext(name);
                        content = Context.Provider({ value, children: content });
                    }
                }

                render(content, root);
                return cy.wrap(Cypress.$(root));
            });
        });
    });

    Cypress.Commands.add('unmountPhilJS', () => {
        if (mountedRoot) {
            return cy.window().then((win: any) => {
                const { unmount } = win.__PHILJS__;
                if (unmount) {
                    unmount(mountedRoot);
                }
                mountedRoot?.remove();
                mountedRoot = null;
            });
        }
        return cy.wrap(null);
    });

    Cypress.Commands.add('waitForRender', () => {
        return cy.window().then((win: any) => {
            return new Cypress.Promise((resolve) => {
                // Use requestAnimationFrame to wait for render
                win.requestAnimationFrame(() => {
                    win.requestAnimationFrame(() => {
                        resolve();
                    });
                });
            });
        });
    });

    Cypress.Commands.add('getComponent', (testId: string) => {
        return cy.get(`[data-testid="${testId}"]`);
    });

    Cypress.Commands.add('componentShouldExist', (testId: string) => {
        return cy.getComponent(testId).should('exist');
    });

    Cypress.Commands.add('snapshotComponent', (name: string, options: SnapshotOptions = {}) => {
        const { threshold = 0.1, failOnDiff = true } = options;

        // This integrates with cypress-image-snapshot or similar plugins
        return cy.get('#philjs-cypress-root').then(($el) => {
            // @ts-ignore - Plugin method
            if (Cypress.Commands['matchImageSnapshot']) {
                // @ts-ignore
                cy.matchImageSnapshot(name, { threshold, failOnDiff });
            } else {
                cy.log('Image snapshot plugin not installed');
            }
        });
    });
}

// ============================================================================
// HYDRATION COMMANDS
// ============================================================================

function registerHydrationCommands(): void {
    Cypress.Commands.add('waitForHydration', (options: HydrationOptions = {}) => {
        const { timeout = 10000, checkInterval = 50 } = options;

        return cy.window().then((win: any) => {
            return new Cypress.Promise((resolve, reject) => {
                const startTime = Date.now();

                const check = () => {
                    if (win.__PHILJS_HYDRATED__) {
                        resolve();
                    } else if (Date.now() - startTime > timeout) {
                        reject(new Error('Hydration timeout'));
                    } else {
                        setTimeout(check, checkInterval);
                    }
                };

                check();
            });
        });
    });

    Cypress.Commands.add('assertHydrated', () => {
        return cy.window().then((win: any) => {
            expect(win.__PHILJS_HYDRATED__).to.be.true;
        });
    });

    Cypress.Commands.add('getHydrationMetrics', () => {
        return cy.window().then((win: any) => {
            const metrics = win.__PHILJS_HYDRATION_METRICS__;
            if (!metrics) {
                throw new Error('Hydration metrics not available');
            }
            return metrics;
        });
    });
}

// ============================================================================
// ROUTER COMMANDS
// ============================================================================

function registerRouterCommands(): void {
    Cypress.Commands.add('navigateTo', (path: string, options: NavigateOptions = {}) => {
        const { replace = false, state, waitForLoad = true } = options;

        return cy.window().then((win: any) => {
            const router = win.__PHILJS_ROUTER__;
            if (!router) {
                throw new Error('PhilJS Router not found');
            }

            if (replace) {
                router.replace(path, state);
            } else {
                router.push(path, state);
            }

            if (waitForLoad) {
                return cy.waitForRender();
            }
        });
    });

    Cypress.Commands.add('routeShouldBe', (path: string) => {
        return cy.window().then((win: any) => {
            const router = win.__PHILJS_ROUTER__;
            if (!router) {
                // Fallback to URL check
                expect(win.location.pathname).to.equal(path);
            } else {
                expect(router.currentPath()).to.equal(path);
            }
        });
    });

    Cypress.Commands.add('getRouteParams', () => {
        return cy.window().then((win: any) => {
            const router = win.__PHILJS_ROUTER__;
            if (!router) {
                throw new Error('PhilJS Router not found');
            }
            return router.params();
        });
    });

    Cypress.Commands.add('getQueryParams', () => {
        return cy.window().then((win: any) => {
            const router = win.__PHILJS_ROUTER__;
            if (router && router.query) {
                return router.query();
            }
            // Fallback
            return Object.fromEntries(new URLSearchParams(win.location.search));
        });
    });

    Cypress.Commands.add('waitForRouteChange', () => {
        return cy.window().then((win: any) => {
            return new Cypress.Promise((resolve) => {
                const router = win.__PHILJS_ROUTER__;
                if (!router) {
                    resolve();
                    return;
                }

                const currentPath = router.currentPath();
                const check = () => {
                    if (router.currentPath() !== currentPath) {
                        resolve();
                    } else {
                        setTimeout(check, 50);
                    }
                };

                setTimeout(check, 50);
            });
        });
    });

    Cypress.Commands.add('goBack', () => {
        return cy.window().then((win: any) => {
            win.history.back();
            return cy.waitForRender();
        });
    });

    Cypress.Commands.add('goForward', () => {
        return cy.window().then((win: any) => {
            win.history.forward();
            return cy.waitForRender();
        });
    });
}

// ============================================================================
// FORM COMMANDS
// ============================================================================

function registerFormCommands(): void {
    Cypress.Commands.add('fillForm', (data: Record<string, any>) => {
        for (const [name, value] of Object.entries(data)) {
            cy.get(`[name="${name}"]`).then(($el) => {
                const tagName = $el.prop('tagName').toLowerCase();
                const type = $el.attr('type');

                if (tagName === 'select') {
                    cy.wrap($el).select(value);
                } else if (type === 'checkbox') {
                    if (value) {
                        cy.wrap($el).check();
                    } else {
                        cy.wrap($el).uncheck();
                    }
                } else if (type === 'radio') {
                    cy.get(`[name="${name}"][value="${value}"]`).check();
                } else if (type === 'file') {
                    cy.wrap($el).selectFile(value);
                } else {
                    cy.wrap($el).clear().type(String(value));
                }
            });
        }
    });

    Cypress.Commands.add('submitForm', (selector = 'form') => {
        return cy.get(selector).submit();
    });

    Cypress.Commands.add('formShouldBeValid', (selector = 'form') => {
        return cy.get(selector).then(($form) => {
            const form = $form[0] as HTMLFormElement;
            expect(form.checkValidity()).to.be.true;
        });
    });

    Cypress.Commands.add('formShouldHaveErrors', (errors: Record<string, string | string[]>) => {
        for (const [field, messages] of Object.entries(errors)) {
            const messageArray = Array.isArray(messages) ? messages : [messages];
            for (const message of messageArray) {
                cy.get(`[data-error-for="${field}"]`)
                    .should('contain.text', message);
            }
        }
    });

    Cypress.Commands.add('getFormValues', (selector = 'form') => {
        return cy.get(selector).then(($form) => {
            const form = $form[0] as HTMLFormElement;
            const formData = new FormData(form);
            const values: Record<string, any> = {};

            formData.forEach((value, key) => {
                if (values[key] !== undefined) {
                    if (!Array.isArray(values[key])) {
                        values[key] = [values[key]];
                    }
                    values[key].push(value);
                } else {
                    values[key] = value;
                }
            });

            return values;
        });
    });

    Cypress.Commands.add('resetForm', (selector = 'form') => {
        return cy.get(selector).then(($form) => {
            ($form[0] as HTMLFormElement).reset();
        });
    });
}

// ============================================================================
// STORE COMMANDS
// ============================================================================

function registerStoreCommands(): void {
    Cypress.Commands.add('getStoreState', (storeName?: string) => {
        return cy.window().then((win: any) => {
            const philjs = win.__PHILJS_DEVTOOLS__;
            if (!philjs) {
                throw new Error('PhilJS DevTools not found');
            }

            if (storeName) {
                return philjs.getStore(storeName)?.getState();
            }
            return philjs.getAllStores();
        });
    });

    Cypress.Commands.add('dispatchAction', (action: string, payload?: any) => {
        return cy.window().then((win: any) => {
            const philjs = win.__PHILJS_DEVTOOLS__;
            if (!philjs) {
                throw new Error('PhilJS DevTools not found');
            }
            philjs.dispatch({ type: action, payload });
        });
    });

    Cypress.Commands.add('storeShouldEqual', (expected: any, storeName?: string) => {
        return cy.getStoreState(storeName).should('deep.equal', expected);
    });

    Cypress.Commands.add('resetStore', (storeName?: string) => {
        return cy.window().then((win: any) => {
            const philjs = win.__PHILJS_DEVTOOLS__;
            if (!philjs) {
                throw new Error('PhilJS DevTools not found');
            }

            if (storeName) {
                philjs.getStore(storeName)?.reset();
            } else {
                philjs.resetAllStores();
            }
        });
    });
}

// ============================================================================
// DEVTOOLS COMMANDS
// ============================================================================

function registerDevToolsCommands(): void {
    Cypress.Commands.add('getPhilJSState', () => {
        return cy.window().then((win: any) => {
            const philjs = win.__PHILJS_DEVTOOLS__;
            if (!philjs) {
                throw new Error('PhilJS DevTools not found');
            }
            return philjs.getState();
        });
    });

    Cypress.Commands.add('getComponentTree', () => {
        return cy.window().then((win: any) => {
            const philjs = win.__PHILJS_DEVTOOLS__;
            if (!philjs) {
                throw new Error('PhilJS DevTools not found');
            }
            return philjs.getComponentTree();
        });
    });

    Cypress.Commands.add('getPerformanceMetrics', () => {
        return cy.window().then((win: any) => {
            const philjs = win.__PHILJS_DEVTOOLS__;
            if (!philjs) {
                throw new Error('PhilJS DevTools not found');
            }
            return philjs.getPerformanceMetrics();
        });
    });

    Cypress.Commands.add('configureDevTools', (options: DevToolsOptions) => {
        return cy.window().then((win: any) => {
            const philjs = win.__PHILJS_DEVTOOLS__;
            if (!philjs) {
                throw new Error('PhilJS DevTools not found');
            }
            philjs.configure(options);
        });
    });
}

// ============================================================================
// ACCESSIBILITY COMMANDS
// ============================================================================

function registerA11yCommands(): void {
    Cypress.Commands.add('a11yAudit', (options: A11yAuditOptions = {}) => {
        return cy.window().then((win: any) => {
            // Integrate with axe-core if available
            if (!win.axe) {
                throw new Error('axe-core not loaded. Install cypress-axe for accessibility testing.');
            }

            const context = options.context || document;
            const axeOptions: any = {};

            if (options.runOnly) {
                axeOptions.runOnly = options.runOnly;
            }
            if (options.includedImpacts) {
                axeOptions.resultTypes = ['violations'];
            }

            return new Cypress.Promise((resolve) => {
                win.axe.run(context, axeOptions).then((results: any) => {
                    const filtered = options.includedImpacts
                        ? {
                            ...results,
                            violations: results.violations.filter((v: any) =>
                                options.includedImpacts!.includes(v.impact)
                            ),
                        }
                        : results;
                    resolve(filtered);
                });
            });
        });
    });

    Cypress.Commands.add('shouldBeAccessible', (options: A11yAuditOptions = {}) => {
        return cy.a11yAudit(options).then((results) => {
            const violations = results.violations;
            if (violations.length > 0) {
                const violationMessages = violations
                    .map((v) => `${v.id}: ${v.description} (${v.impact})`)
                    .join('\n');
                throw new Error(`Accessibility violations found:\n${violationMessages}`);
            }
        });
    });

    Cypress.Commands.add('assertFocusOn', (selector: string) => {
        return cy.focused().should('match', selector);
    });

    Cypress.Commands.add('keyboardNavigate', (keys: string[]) => {
        for (const key of keys) {
            cy.focused().type(`{${key}}`);
        }
    });

    Cypress.Commands.add('shouldBeKeyboardAccessible', (selector: string) => {
        return cy.get(selector).then(($el) => {
            // Check if element is focusable
            const tabIndex = $el.attr('tabindex');
            const tagName = $el.prop('tagName').toLowerCase();
            const focusableTags = ['a', 'button', 'input', 'select', 'textarea'];

            const isFocusable =
                focusableTags.includes(tagName) ||
                (tabIndex !== undefined && parseInt(tabIndex) >= 0);

            expect(isFocusable, 'Element should be keyboard focusable').to.be.true;

            // Try to focus
            cy.wrap($el).focus();
            cy.wrap($el).should('have.focus');
        });
    });
}

// ============================================================================
// NETWORK COMMANDS
// ============================================================================

function registerNetworkCommands(): void {
    Cypress.Commands.add('mockApi', (
        method: string,
        url: string | RegExp,
        response: any,
        options: MockApiOptions = {}
    ) => {
        const {
            statusCode = 200,
            headers = {},
            delay = 0,
            alias = `api_${Date.now()}`,
            times,
        } = options;

        const interceptOptions: any = {
            method: method.toUpperCase(),
            url,
        };

        if (times) {
            interceptOptions.times = times;
        }

        cy.intercept(interceptOptions, (req) => {
            req.reply({
                statusCode,
                headers: {
                    'Content-Type': 'application/json',
                    ...headers,
                },
                body: response,
                delay,
            });
        }).as(alias);

        mockAliases.set(alias, alias);
    });

    Cypress.Commands.add('waitForApi', (alias: string) => {
        return cy.wait(`@${alias}`);
    });

    Cypress.Commands.add('apiCalledWith', (alias: string, matcher: Record<string, any>) => {
        return cy.get(`@${alias}`).then((interception: any) => {
            const body = interception.request.body;

            for (const [key, value] of Object.entries(matcher)) {
                expect(body[key]).to.deep.equal(value);
            }
        });
    });

    Cypress.Commands.add('simulateNetwork', (condition: NetworkCondition) => {
        // Note: This requires CDP or a special setup
        const conditions: Record<string, { latency: number; downloadSpeed: number; uploadSpeed: number }> = {
            'offline': { latency: 0, downloadSpeed: 0, uploadSpeed: 0 },
            'slow-3g': { latency: 400, downloadSpeed: 400000, uploadSpeed: 400000 },
            'fast-3g': { latency: 100, downloadSpeed: 1500000, uploadSpeed: 750000 },
            '4g': { latency: 20, downloadSpeed: 4000000, uploadSpeed: 3000000 },
            'wifi': { latency: 2, downloadSpeed: 30000000, uploadSpeed: 15000000 },
        };

        const params = typeof condition === 'string' ? conditions[condition] : condition;

        if (!params) {
            throw new Error(`Unknown network condition: ${condition}`);
        }

        // This would require CDP integration
        cy.log(`Simulating network: ${JSON.stringify(params)}`);
    });

    Cypress.Commands.add('clearMocks', () => {
        mockAliases.clear();
        // Cypress automatically clears intercepts between tests
    });
}

// ============================================================================
// ANIMATION COMMANDS
// ============================================================================

function registerAnimationCommands(): void {
    Cypress.Commands.add('waitForAnimation', (selector?: string) => {
        const target = selector || 'body';

        return cy.get(target).then(($el) => {
            return new Cypress.Promise((resolve) => {
                const checkAnimations = () => {
                    const animations = $el[0].getAnimations();
                    const pending = animations.filter(
                        (a) => a.playState === 'running' || a.playState === 'pending'
                    );

                    if (pending.length === 0) {
                        resolve();
                    } else {
                        Promise.all(pending.map((a) => a.finished))
                            .then(() => resolve())
                            .catch(() => resolve());
                    }
                };

                checkAnimations();
            });
        });
    });

    Cypress.Commands.add('disableAnimations', () => {
        animationsDisabled = true;

        return cy.document().then((doc) => {
            const style = doc.createElement('style');
            style.id = 'philjs-disable-animations';
            style.textContent = `
                *, *::before, *::after {
                    animation-duration: 0s !important;
                    animation-delay: 0s !important;
                    transition-duration: 0s !important;
                    transition-delay: 0s !important;
                }
            `;
            doc.head.appendChild(style);
        });
    });

    Cypress.Commands.add('enableAnimations', () => {
        animationsDisabled = false;

        return cy.document().then((doc) => {
            const style = doc.getElementById('philjs-disable-animations');
            style?.remove();
        });
    });

    Cypress.Commands.add('animationShouldBe', (
        selector: string,
        state: 'running' | 'paused' | 'finished'
    ) => {
        return cy.get(selector).then(($el) => {
            const animations = $el[0].getAnimations();
            const allInState = animations.every((a) => a.playState === state);
            expect(allInState, `All animations should be ${state}`).to.be.true;
        });
    });
}

// ============================================================================
// PERFORMANCE COMMANDS
// ============================================================================

function registerPerformanceCommands(): void {
    Cypress.Commands.add('measurePerformance', (
        name: string,
        fn: () => Cypress.Chainable<any>
    ) => {
        const startTime = performance.now();

        return fn().then(() => {
            const endTime = performance.now();
            const duration = endTime - startTime;

            cy.log(`Performance [${name}]: ${duration.toFixed(2)}ms`);

            return {
                name,
                duration,
                startTime,
                endTime,
            };
        });
    });

    Cypress.Commands.add('renderTimeShouldBeLessThan', (ms: number) => {
        return cy.getPerformanceMetrics().then((metrics) => {
            expect(metrics.renderTime).to.be.lessThan(ms);
        });
    });

    Cypress.Commands.add('getWebVitals', () => {
        return cy.window().then((win: any) => {
            return new Cypress.Promise((resolve) => {
                const vitals: Partial<WebVitals> = {};

                // Get LCP
                const lcpObserver = new win.PerformanceObserver((list: any) => {
                    const entries = list.getEntries();
                    vitals.lcp = entries[entries.length - 1]?.startTime || 0;
                });
                lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

                // Get FCP
                const paintEntries = win.performance.getEntriesByType('paint');
                const fcpEntry = paintEntries.find((e: any) => e.name === 'first-contentful-paint');
                vitals.fcp = fcpEntry?.startTime || 0;

                // Get TTFB
                const navEntries = win.performance.getEntriesByType('navigation');
                if (navEntries.length > 0) {
                    vitals.ttfb = navEntries[0].responseStart;
                }

                // CLS would need a PerformanceObserver for layout-shift
                vitals.cls = 0;

                // FID would need user interaction
                vitals.fid = 0;

                resolve(vitals as WebVitals);
            });
        });
    });

    Cypress.Commands.add('assertNoMemoryLeaks', () => {
        return cy.window().then((win: any) => {
            if (win.performance && win.performance.memory) {
                const memory = win.performance.memory;
                cy.log(`Memory: ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`);

                // This is a basic check - real memory leak detection would need
                // multiple measurements over time
                expect(memory.usedJSHeapSize).to.be.lessThan(memory.jsHeapSizeLimit * 0.8);
            }
        });
    });
}

// ============================================================================
// UTILITY COMMANDS
// ============================================================================

function registerUtilityCommands(): void {
    Cypress.Commands.add('waitUntil', (
        predicate: () => boolean | Cypress.Chainable<boolean>,
        options: WaitUntilOptions = {}
    ) => {
        const {
            timeout = 10000,
            interval = 100,
            errorMessage = 'Condition not met within timeout',
        } = options;

        const startTime = Date.now();

        const check = (): Cypress.Chainable<void> => {
            const result = predicate();

            if (result && typeof (result as any).then === 'function') {
                return (result as Cypress.Chainable<boolean>).then((value) => {
                    if (value) {
                        return cy.wrap(null) as unknown as Cypress.Chainable<void>;
                    }
                    if (Date.now() - startTime > timeout) {
                        throw new Error(errorMessage);
                    }
                    return cy.wait(interval).then(() => check());
                });
            }

            if (result) {
                return cy.wrap(null) as unknown as Cypress.Chainable<void>;
            }
            if (Date.now() - startTime > timeout) {
                throw new Error(errorMessage);
            }
            return cy.wait(interval).then(() => check());
        };

        return check();
    });

    Cypress.Commands.add('executePhilJS', <T>(fn: () => T) => {
        return cy.window().then((win: any) => {
            const { signal, computed, effect, batch } = win.__PHILJS__;
            return fn.call({ signal, computed, effect, batch });
        });
    });

    Cypress.Commands.add('createFixture', <T>(name: string, data: T) => {
        return cy.writeFile(`cypress/fixtures/${name}.json`, data).then(() => data);
    });

    Cypress.Commands.add('loadFixture', <T>(name: string) => {
        return cy.fixture(name) as Cypress.Chainable<T>;
    });
}

// ============================================================================
// REGISTRATION
// ============================================================================

/**
 * Register all PhilJS Cypress commands
 */
export function registerCommands(): void {
    registerSignalCommands();
    registerComponentCommands();
    registerHydrationCommands();
    registerRouterCommands();
    registerFormCommands();
    registerStoreCommands();
    registerDevToolsCommands();
    registerA11yCommands();
    registerNetworkCommands();
    registerAnimationCommands();
    registerPerformanceCommands();
    registerUtilityCommands();
}

// ============================================================================
// PLUGIN CONFIGURATION
// ============================================================================

export interface PluginConfig {
    enableCodeCoverage?: boolean;
    baseUrl?: string;
    viewportWidth?: number;
    viewportHeight?: number;
    defaultCommandTimeout?: number;
    fixturesFolder?: string;
    screenshotsFolder?: string;
    videosFolder?: string;
    devTools?: DevToolsOptions;
}

/**
 * Configure PhilJS Cypress plugin (for cypress.config.ts)
 */
export function configurePhilJS(
    on: Cypress.PluginEvents,
    config: Cypress.PluginConfigOptions,
    options: PluginConfig = {}
): Cypress.PluginConfigOptions {
    const {
        enableCodeCoverage = false,
        viewportWidth,
        viewportHeight,
        defaultCommandTimeout,
        fixturesFolder,
        screenshotsFolder,
        videosFolder,
    } = options;

    // Apply configuration overrides
    if (viewportWidth) config.viewportWidth = viewportWidth;
    if (viewportHeight) config.viewportHeight = viewportHeight;
    if (defaultCommandTimeout) config.defaultCommandTimeout = defaultCommandTimeout;
    if (fixturesFolder) config.fixturesFolder = fixturesFolder;
    if (screenshotsFolder) config.screenshotsFolder = screenshotsFolder;
    if (videosFolder) config.videosFolder = videosFolder;

    // Code coverage setup
    if (enableCodeCoverage) {
        on('task', {
            coverage(coverage: any) {
                // Handle code coverage collection
                return null;
            },
        });
    }

    // Custom tasks
    on('task', {
        log(message: string) {
            console.log(message);
            return null;
        },

        readFileMaybe(filename: string) {
            const fs = require('fs');
            if (fs.existsSync(filename)) {
                return fs.readFileSync(filename, 'utf8');
            }
            return null;
        },

        clearFolder(folder: string) {
            const fs = require('fs');
            const path = require('path');

            if (fs.existsSync(folder)) {
                fs.readdirSync(folder).forEach((file: string) => {
                    fs.unlinkSync(path.join(folder, file));
                });
            }
            return null;
        },
    });

    // Browser launch options
    on('before:browser:launch', (browser, launchOptions) => {
        if (browser.name === 'chrome' || browser.name === 'chromium') {
            launchOptions.args.push('--disable-gpu');
            launchOptions.args.push('--disable-dev-shm-usage');
            launchOptions.args.push('--no-sandbox');
        }

        if (browser.name === 'electron') {
            launchOptions.preferences.webPreferences = {
                ...launchOptions.preferences.webPreferences,
                nodeIntegration: false,
                contextIsolation: true,
            };
        }

        return launchOptions;
    });

    return config;
}

// ============================================================================
// TEST HELPERS
// ============================================================================

/**
 * Create a component test helper
 */
export function createTestHelper<P extends object>(
    component: (props: P) => any,
    defaultProps: P
) {
    return {
        mount(props: Partial<P> = {}) {
            return cy.mountPhilJS(component, {
                props: { ...defaultProps, ...props },
            });
        },

        getByTestId(testId: string) {
            return cy.getComponent(testId);
        },

        assertRendered(testId: string) {
            return cy.componentShouldExist(testId);
        },
    };
}

/**
 * Create API mock helper
 */
export function createApiMock(baseUrl: string) {
    return {
        get(path: string, response: any, options?: MockApiOptions) {
            return cy.mockApi('GET', `${baseUrl}${path}`, response, options);
        },

        post(path: string, response: any, options?: MockApiOptions) {
            return cy.mockApi('POST', `${baseUrl}${path}`, response, options);
        },

        put(path: string, response: any, options?: MockApiOptions) {
            return cy.mockApi('PUT', `${baseUrl}${path}`, response, options);
        },

        patch(path: string, response: any, options?: MockApiOptions) {
            return cy.mockApi('PATCH', `${baseUrl}${path}`, response, options);
        },

        delete(path: string, response: any, options?: MockApiOptions) {
            return cy.mockApi('DELETE', `${baseUrl}${path}`, response, options);
        },

        waitFor(alias: string) {
            return cy.waitForApi(alias);
        },
    };
}

/**
 * Create form test helper
 */
export function createFormHelper(selector = 'form') {
    return {
        fill(data: Record<string, any>) {
            return cy.get(selector).within(() => {
                cy.fillForm(data);
            });
        },

        submit() {
            return cy.submitForm(selector);
        },

        assertValid() {
            return cy.formShouldBeValid(selector);
        },

        assertErrors(errors: Record<string, string | string[]>) {
            return cy.formShouldHaveErrors(errors);
        },

        getValues() {
            return cy.getFormValues(selector);
        },

        reset() {
            return cy.resetForm(selector);
        },
    };
}

/**
 * Create router test helper
 */
export function createRouterHelper() {
    return {
        navigate(path: string, options?: NavigateOptions) {
            return cy.navigateTo(path, options);
        },

        assertPath(path: string) {
            return cy.routeShouldBe(path);
        },

        getParams() {
            return cy.getRouteParams();
        },

        getQuery() {
            return cy.getQueryParams();
        },

        back() {
            return cy.goBack();
        },

        forward() {
            return cy.goForward();
        },
    };
}

// ============================================================================
// ASSERTIONS
// ============================================================================

/**
 * Custom Chai assertions for PhilJS
 */
export function addPhilJSAssertions(chai: Chai.ChaiStatic): void {
    const Assertion = chai.Assertion;

    // Signal value assertion
    Assertion.addMethod('signalValue', function (expected: any) {
        const signal = this._obj;
        const actual = typeof signal === 'function' ? signal() : signal;

        this.assert(
            Cypress._.isEqual(actual, expected),
            `expected signal to have value #{exp} but got #{act}`,
            `expected signal not to have value #{exp}`,
            expected,
            actual
        );
    });

    // Component rendered assertion
    Assertion.addMethod('beRendered', function () {
        const $el = this._obj;

        this.assert(
            $el.length > 0 && $el.is(':visible'),
            'expected component to be rendered and visible',
            'expected component not to be rendered'
        );
    });

    // Accessible assertion
    Assertion.addMethod('beAccessible', function () {
        const $el = this._obj;
        const el = $el[0];

        const hasRole = el.hasAttribute('role') || ['button', 'link', 'input'].includes(el.tagName.toLowerCase());
        const hasLabel =
            el.hasAttribute('aria-label') ||
            el.hasAttribute('aria-labelledby') ||
            $el.find('label').length > 0;

        this.assert(
            hasRole || hasLabel,
            'expected element to be accessible (have role or label)',
            'expected element not to have accessibility attributes'
        );
    });
}

// ============================================================================
// SETUP HELPERS
// ============================================================================

/**
 * Setup function for cypress/support/e2e.ts
 */
export function setupE2E(): void {
    registerCommands();

    // Add custom assertions
    if (typeof chai !== 'undefined') {
        addPhilJSAssertions(chai);
    }

    // Global before each hook
    beforeEach(() => {
        // Clear mocks
        mockAliases.clear();

        // Reset animations state
        if (animationsDisabled) {
            cy.enableAnimations();
        }
    });

    // Global after each hook
    afterEach(() => {
        // Cleanup mounted components
        if (mountedRoot) {
            cy.unmountPhilJS();
        }
    });
}

/**
 * Setup function for component testing
 */
export function setupComponent(): void {
    registerCommands();

    // Add custom assertions
    if (typeof chai !== 'undefined') {
        addPhilJSAssertions(chai);
    }

    beforeEach(() => {
        mockAliases.clear();
    });

    afterEach(() => {
        if (mountedRoot) {
            cy.unmountPhilJS();
        }
    });
}

// ============================================================================
// AUTO-REGISTRATION
// ============================================================================

// Auto-register commands when imported in support file
if (typeof Cypress !== 'undefined') {
    registerCommands();
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
    registerCommands,
    configurePhilJS,
    createTestHelper,
    createApiMock,
    createFormHelper,
    createRouterHelper,
    addPhilJSAssertions,
    setupE2E,
    setupComponent,
};

export default {
    registerCommands,
    configurePhilJS,
    setupE2E,
    setupComponent,
};
