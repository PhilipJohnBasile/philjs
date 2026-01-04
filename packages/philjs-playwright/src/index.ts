/**
 * PhilJS Playwright Integration
 * 
 * E2E testing with Playwright for PhilJS apps.
 */

import type { Page, Locator, TestInfo } from '@playwright/test';

// ============ FIXTURES ============

export interface PhilJSFixtures {
    /** Wait for PhilJS to hydrate */
    waitForHydration: () => Promise<void>;
    /** Get a signal value */
    getSignal: <T>(name: string) => Promise<T>;
    /** Set a signal value */
    setSignal: <T>(name: string, value: T) => Promise<void>;
    /** Wait for signal to have a specific value */
    waitForSignal: <T>(name: string, value: T) => Promise<void>;
}

/**
 * Create PhilJS Playwright fixtures
 * 
 * @example
 * ```ts
 * // playwright.config.ts
 * import { test as base } from '@playwright/test';
 * import { createPhilJSFixtures } from '@philjs/playwright';
 * 
 * export const test = base.extend(createPhilJSFixtures());
 * 
 * // example.spec.ts
 * test('counter increments', async ({ page, waitForHydration, getSignal }) => {
 *   await page.goto('/');
 *   await waitForHydration();
 *   
 *   expect(await getSignal('count')).toBe(0);
 *   await page.click('button');
 *   expect(await getSignal('count')).toBe(1);
 * });
 * ```
 */
export function createPhilJSFixtures() {
    return {
        waitForHydration: async ({ page }: { page: Page }, use: (fn: () => Promise<void>) => Promise<void>) => {
            await use(async () => {
                await page.waitForFunction(() => {
                    return (window as any).__PHILJS_HYDRATED__ === true;
                }, { timeout: 10000 });
            });
        },

        getSignal: async ({ page }: { page: Page }, use: (fn: <T>(name: string) => Promise<T>) => Promise<void>) => {
            await use(async <T>(name: string): Promise<T> => {
                return page.evaluate((signalName) => {
                    const devtools = (window as any).__PHILJS_DEVTOOLS__;
                    if (!devtools) throw new Error('PhilJS DevTools not found');

                    const signal = devtools.signals.get(signalName);
                    if (!signal) throw new Error(`Signal "${signalName}" not found`);

                    return signal.value;
                }, name);
            });
        },

        setSignal: async ({ page }: { page: Page }, use: (fn: <T>(name: string, value: T) => Promise<void>) => Promise<void>) => {
            await use(async <T>(name: string, value: T): Promise<void> => {
                await page.evaluate(([signalName, signalValue]) => {
                    const devtools = (window as any).__PHILJS_DEVTOOLS__;
                    if (!devtools) throw new Error('PhilJS DevTools not found');

                    const signal = devtools.signals.get(signalName);
                    if (!signal) throw new Error(`Signal "${signalName}" not found`);

                    signal.set(signalValue);
                }, [name, value] as const);
            });
        },

        waitForSignal: async ({ page }: { page: Page }, use: (fn: <T>(name: string, value: T) => Promise<void>) => Promise<void>) => {
            await use(async <T>(name: string, value: T): Promise<void> => {
                await page.waitForFunction(([signalName, expectedValue]) => {
                    const devtools = (window as any).__PHILJS_DEVTOOLS__;
                    if (!devtools) return false;

                    const signal = devtools.signals.get(signalName);
                    if (!signal) return false;

                    return JSON.stringify(signal.value) === JSON.stringify(expectedValue);
                }, [name, value] as const, { timeout: 10000 });
            });
        },
    };
}

// ============ PAGE HELPERS ============

/**
 * Extended Page object with PhilJS utilities
 */
export class PhilJSPage {
    constructor(private page: Page) { }

    async goto(url: string, options?: { waitForHydration?: boolean }) {
        await this.page.goto(url);

        if (options?.waitForHydration !== false) {
            await this.waitForHydration();
        }
    }

    async waitForHydration() {
        await this.page.waitForFunction(() => {
            return (window as any).__PHILJS_HYDRATED__ === true;
        }, { timeout: 10000 });
    }

    async getSignal<T>(name: string): Promise<T> {
        return this.page.evaluate((signalName) => {
            const devtools = (window as any).__PHILJS_DEVTOOLS__;
            return devtools?.signals.get(signalName)?.value;
        }, name);
    }

    async setSignal<T>(name: string, value: T): Promise<void> {
        await this.page.evaluate(([signalName, signalValue]) => {
            const devtools = (window as any).__PHILJS_DEVTOOLS__;
            devtools?.signals.get(signalName)?.set(signalValue);
        }, [name, value] as const);
    }

    async waitForSignal<T>(name: string, expectedValue: T, timeout = 10000): Promise<void> {
        await this.page.waitForFunction(([signalName, value]) => {
            const devtools = (window as any).__PHILJS_DEVTOOLS__;
            const signal = devtools?.signals.get(signalName);
            return JSON.stringify(signal?.value) === JSON.stringify(value);
        }, [name, expectedValue] as const, { timeout });
    }

    async getAllSignals(): Promise<Record<string, any>> {
        return this.page.evaluate(() => {
            const devtools = (window as any).__PHILJS_DEVTOOLS__;
            if (!devtools) return {};

            const signals: Record<string, any> = {};
            devtools.signals.forEach((signal: any, name: string) => {
                signals[name] = signal.value;
            });
            return signals;
        });
    }

    async getComponentTree(): Promise<any> {
        return this.page.evaluate(() => {
            const devtools = (window as any).__PHILJS_DEVTOOLS__;
            return devtools?.componentTree || null;
        });
    }
}

// ============ ASSERTIONS ============

/**
 * Custom expect matchers for PhilJS
 */
export const philjsMatchers = {
    async toHaveSignalValue(page: Page, signalName: string, expectedValue: any) {
        const actualValue = await page.evaluate((name) => {
            const devtools = (window as any).__PHILJS_DEVTOOLS__;
            return devtools?.signals.get(name)?.value;
        }, signalName);

        const pass = JSON.stringify(actualValue) === JSON.stringify(expectedValue);

        return {
            pass,
            message: () => pass
                ? `Expected signal "${signalName}" not to have value ${JSON.stringify(expectedValue)}`
                : `Expected signal "${signalName}" to have value ${JSON.stringify(expectedValue)}, but got ${JSON.stringify(actualValue)}`,
        };
    },

    async toBeHydrated(page: Page) {
        const isHydrated = await page.evaluate(() => {
            return (window as any).__PHILJS_HYDRATED__ === true;
        });

        return {
            pass: isHydrated,
            message: () => isHydrated
                ? 'Expected page not to be hydrated'
                : 'Expected page to be hydrated',
        };
    },
};

// ============ COMPONENT TESTING ============

/**
 * Mount a PhilJS component for testing
 */
export async function mount<T>(
    page: Page,
    Component: (props: T) => any,
    props: T
): Promise<Locator> {
    await page.setContent(`
    <!DOCTYPE html>
    <html>
      <head><title>Component Test</title></head>
      <body>
        <div id="root"></div>
        <script type="module">
          import { render } from '@philjs/core';
          const Component = ${Component.toString()};
          render(Component(${JSON.stringify(props)}), document.getElementById('root'));
          window.__PHILJS_HYDRATED__ = true;
        </script>
      </body>
    </html>
  `);

    await page.waitForFunction(() => (window as any).__PHILJS_HYDRATED__);

    return page.locator('#root');
}

export {
    createPhilJSFixtures,
    PhilJSPage,
    philjsMatchers,
    mount,
};
