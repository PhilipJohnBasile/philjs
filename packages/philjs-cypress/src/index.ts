/**
 * PhilJS Cypress Plugin
 * 
 * E2E testing utilities for PhilJS applications.
 * Provides commands for testing signals, components, and routing.
 */

/// <reference types="cypress" />

declare global {
    namespace Cypress {
        interface Chainable {
            /**
             * Get the current value of a PhilJS signal by its debug name
             */
            signal(name: string): Chainable<any>;

            /**
             * Assert a signal's value
             */
            signalShouldEqual(name: string, expectedValue: any): Chainable<void>;

            /**
             * Set a signal's value (for testing)
             */
            setSignal(name: string, value: any): Chainable<void>;

            /**
             * Mount a PhilJS component for testing
             */
            mountPhilJS<P>(component: (props: P) => any, props?: P): Chainable<JQuery<HTMLElement>>;

            /**
             * Wait for PhilJS hydration to complete
             */
            waitForHydration(): Chainable<void>;

            /**
             * Get PhilJS devtools state
             */
            getPhilJSState(): Chainable<Record<string, any>>;
        }
    }
}

/**
 * Register PhilJS Cypress commands
 */
export function registerCommands(): void {
    // Signal commands
    Cypress.Commands.add('signal', (name: string) => {
        return cy.window().then((win: any) => {
            const philjs = win.__PHILJS_DEVTOOLS__;
            if (!philjs) {
                throw new Error('PhilJS DevTools not found. Ensure dev mode is enabled.');
            }
            return philjs.getSignal(name)?.();
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
            if (signal) {
                signal.set(value);
            } else {
                throw new Error(`Signal "${name}" not found`);
            }
        });
    });

    // Component mounting
    Cypress.Commands.add('mountPhilJS', (component: any, props?: any) => {
        return cy.document().then((doc) => {
            const root = doc.createElement('div');
            root.id = 'philjs-cypress-root';
            doc.body.appendChild(root);

            // Render the component
            return cy.window().then((win: any) => {
                const { render } = win.__PHILJS__;
                render(component(props || {}), root);
                return cy.wrap(Cypress.$(root));
            });
        });
    });

    // Hydration wait
    Cypress.Commands.add('waitForHydration', () => {
        return cy.window().then((win: any) => {
            return new Cypress.Promise((resolve) => {
                if (win.__PHILJS_HYDRATED__) {
                    resolve();
                } else {
                    const checkHydration = () => {
                        if (win.__PHILJS_HYDRATED__) {
                            resolve();
                        } else {
                            setTimeout(checkHydration, 50);
                        }
                    };
                    checkHydration();
                }
            });
        });
    });

    // DevTools state
    Cypress.Commands.add('getPhilJSState', () => {
        return cy.window().then((win: any) => {
            const philjs = win.__PHILJS_DEVTOOLS__;
            if (!philjs) {
                throw new Error('PhilJS DevTools not found');
            }
            return philjs.getState();
        });
    });
}

/**
 * Configure PhilJS Cypress plugin
 */
export function configurePhilJS(on: Cypress.PluginEvents, config: Cypress.PluginConfigOptions) {
    // Add any Node-side plugin configuration here

    return config;
}

// Auto-register commands when imported in support file
if (typeof Cypress !== 'undefined') {
    registerCommands();
}

export default { registerCommands, configurePhilJS };
