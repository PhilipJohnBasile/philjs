/**
 * PhilJS Playwright Integration
 *
 * Comprehensive E2E testing utilities for PhilJS applications.
 * Features:
 * - Playwright fixtures for PhilJS signals and state
 * - Component testing utilities
 * - Visual regression testing
 * - Accessibility testing
 * - Performance testing
 * - Network mocking
 * - Time manipulation
 * - Custom assertions
 *
 * @example
 * ```typescript
 * import { test, expect } from '@philjs/playwright';
 *
 * test('counter increments', async ({ page, philjs }) => {
 *   await page.goto('/');
 *   await philjs.waitForHydration();
 *
 *   expect(await philjs.getSignal('count')).toBe(0);
 *   await page.click('button');
 *   expect(await philjs.getSignal('count')).toBe(1);
 * });
 * ```
 */

import type {
  Page,
  Locator,
  TestInfo,
  BrowserContext,
  Browser,
  Frame,
  Route,
  Request,
  Response,
  ElementHandle,
  JSHandle,
  ConsoleMessage,
  Dialog,
  Download,
  FileChooser,
  Worker,
  WebSocket,
} from '@playwright/test';

// ============================================================================
// Types
// ============================================================================

export interface PhilJSFixtures {
  /** PhilJS testing utilities */
  philjs: PhilJSTestUtils;
  /** Visual testing utilities */
  visual: VisualTestUtils;
  /** Accessibility testing utilities */
  a11y: AccessibilityUtils;
  /** Performance testing utilities */
  performance: PerformanceUtils;
  /** Network mocking utilities */
  network: NetworkUtils;
  /** Time manipulation utilities */
  time: TimeUtils;
}

export interface SignalInfo {
  name: string;
  value: any;
  type: string;
  dependents: string[];
  dependencies: string[];
}

export interface ComponentInfo {
  name: string;
  props: Record<string, any>;
  signals: string[];
  children: ComponentInfo[];
  element: string;
}

export interface RenderContext {
  url: string;
  headers: Record<string, string>;
  cookies: Record<string, string>;
  state: Record<string, any>;
}

export interface VisualComparisonOptions {
  threshold?: number;
  maxDiffPixels?: number;
  maxDiffPixelRatio?: number;
  animations?: 'disabled' | 'allow';
  mask?: Locator[];
  maskColor?: string;
  fullPage?: boolean;
  clip?: { x: number; y: number; width: number; height: number };
  scale?: 'css' | 'device';
  stylePath?: string | string[];
}

export interface AccessibilityViolation {
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

export interface PerformanceMetrics {
  ttfb: number;
  fcp: number;
  lcp: number;
  fid: number;
  cls: number;
  tti: number;
  tbt: number;
  domContentLoaded: number;
  load: number;
  jsHeapSize: number;
  layoutCount: number;
  recalcStyleCount: number;
  paintCount: number;
}

export interface MockRouteOptions {
  status?: number;
  headers?: Record<string, string>;
  body?: string | Buffer | object;
  delay?: number;
  contentType?: string;
}

export interface TimeState {
  frozen: boolean;
  currentTime: number;
  speed: number;
}

// ============================================================================
// PhilJS Test Utilities
// ============================================================================

/**
 * Core PhilJS testing utilities
 */
export class PhilJSTestUtils {
  constructor(private page: Page) {}

  /**
   * Wait for PhilJS to hydrate
   */
  async waitForHydration(options: { timeout?: number } = {}): Promise<void> {
    const { timeout = 30000 } = options;
    await this.page.waitForFunction(
      () => (window as any).__PHILJS_HYDRATED__ === true,
      { timeout }
    );
  }

  /**
   * Check if PhilJS is hydrated
   */
  async isHydrated(): Promise<boolean> {
    return this.page.evaluate(() => (window as any).__PHILJS_HYDRATED__ === true);
  }

  /**
   * Get a signal value by name
   */
  async getSignal<T>(name: string): Promise<T> {
    return this.page.evaluate((signalName) => {
      const devtools = (window as any).__PHILJS_DEVTOOLS__;
      if (!devtools) throw new Error('PhilJS DevTools not found. Enable devtools in your app.');
      const signal = devtools.signals.get(signalName);
      if (!signal) throw new Error(`Signal "${signalName}" not found`);
      return signal.value;
    }, name);
  }

  /**
   * Set a signal value by name
   */
  async setSignal<T>(name: string, value: T): Promise<void> {
    await this.page.evaluate(
      ([signalName, signalValue]) => {
        const devtools = (window as any).__PHILJS_DEVTOOLS__;
        if (!devtools) throw new Error('PhilJS DevTools not found');
        const signal = devtools.signals.get(signalName);
        if (!signal) throw new Error(`Signal "${signalName}" not found`);
        signal.set(signalValue);
      },
      [name, value] as const
    );
  }

  /**
   * Update a signal value with a function
   */
  async updateSignal<T>(name: string, updater: (current: T) => T): Promise<void> {
    await this.page.evaluate(
      ([signalName, updaterFn]) => {
        const devtools = (window as any).__PHILJS_DEVTOOLS__;
        if (!devtools) throw new Error('PhilJS DevTools not found');
        const signal = devtools.signals.get(signalName);
        if (!signal) throw new Error(`Signal "${signalName}" not found`);
        const fn = new Function('return ' + updaterFn)();
        signal.set(fn(signal.value));
      },
      [name, updater.toString()] as const
    );
  }

  /**
   * Wait for signal to have a specific value
   */
  async waitForSignal<T>(
    name: string,
    expectedValue: T,
    options: { timeout?: number; interval?: number } = {}
  ): Promise<void> {
    const { timeout = 10000, interval = 100 } = options;
    await this.page.waitForFunction(
      ([signalName, value, intervalMs]) => {
        const devtools = (window as any).__PHILJS_DEVTOOLS__;
        if (!devtools) return false;
        const signal = devtools.signals.get(signalName);
        if (!signal) return false;
        return JSON.stringify(signal.value) === JSON.stringify(value);
      },
      [name, expectedValue, interval] as const,
      { timeout, polling: interval }
    );
  }

  /**
   * Wait for signal to match a predicate
   */
  async waitForSignalMatch<T>(
    name: string,
    predicate: (value: T) => boolean,
    options: { timeout?: number } = {}
  ): Promise<void> {
    const { timeout = 10000 } = options;
    await this.page.waitForFunction(
      ([signalName, predicateFn]) => {
        const devtools = (window as any).__PHILJS_DEVTOOLS__;
        if (!devtools) return false;
        const signal = devtools.signals.get(signalName);
        if (!signal) return false;
        const fn = new Function('return ' + predicateFn)();
        return fn(signal.value);
      },
      [name, predicate.toString()] as const,
      { timeout }
    );
  }

  /**
   * Get all signals and their values
   */
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

  /**
   * Get detailed signal information
   */
  async getSignalInfo(name: string): Promise<SignalInfo> {
    return this.page.evaluate((signalName) => {
      const devtools = (window as any).__PHILJS_DEVTOOLS__;
      if (!devtools) throw new Error('PhilJS DevTools not found');
      const signal = devtools.signals.get(signalName);
      if (!signal) throw new Error(`Signal "${signalName}" not found`);
      return {
        name: signalName,
        value: signal.value,
        type: typeof signal.value,
        dependents: Array.from(signal.dependents || []),
        dependencies: Array.from(signal.dependencies || []),
      };
    }, name);
  }

  /**
   * Get component tree
   */
  async getComponentTree(): Promise<ComponentInfo[]> {
    return this.page.evaluate(() => {
      const devtools = (window as any).__PHILJS_DEVTOOLS__;
      return devtools?.componentTree || [];
    });
  }

  /**
   * Find component by name
   */
  async findComponent(name: string): Promise<ComponentInfo | null> {
    return this.page.evaluate((componentName) => {
      const devtools = (window as any).__PHILJS_DEVTOOLS__;
      if (!devtools?.componentTree) return null;

      function search(components: any[]): any {
        for (const component of components) {
          if (component.name === componentName) return component;
          if (component.children) {
            const found = search(component.children);
            if (found) return found;
          }
        }
        return null;
      }

      return search(devtools.componentTree);
    }, name);
  }

  /**
   * Get component props
   */
  async getComponentProps(name: string): Promise<Record<string, any>> {
    const component = await this.findComponent(name);
    return component?.props || {};
  }

  /**
   * Trigger a computed signal recalculation
   */
  async invalidateComputed(name: string): Promise<void> {
    await this.page.evaluate((computedName) => {
      const devtools = (window as any).__PHILJS_DEVTOOLS__;
      if (!devtools) throw new Error('PhilJS DevTools not found');
      const computed = devtools.computed?.get(computedName);
      if (computed?.invalidate) {
        computed.invalidate();
      }
    }, name);
  }

  /**
   * Batch multiple signal updates
   */
  async batchUpdates(updates: Array<{ name: string; value: any }>): Promise<void> {
    await this.page.evaluate((updateList) => {
      const devtools = (window as any).__PHILJS_DEVTOOLS__;
      if (!devtools) throw new Error('PhilJS DevTools not found');
      const batch = (window as any).__PHILJS_BATCH__ || ((fn: () => void) => fn());
      batch(() => {
        for (const { name, value } of updateList) {
          const signal = devtools.signals.get(name);
          if (signal) signal.set(value);
        }
      });
    }, updates);
  }

  /**
   * Subscribe to signal changes during test
   */
  async watchSignal<T>(
    name: string,
    callback: (value: T) => void
  ): Promise<() => Promise<void>> {
    const watchId = `__test_watch_${Date.now()}_${Math.random()}`;

    await this.page.exposeFunction(watchId, callback);

    await this.page.evaluate(
      ([signalName, callbackId]) => {
        const devtools = (window as any).__PHILJS_DEVTOOLS__;
        if (!devtools) return;
        const signal = devtools.signals.get(signalName);
        if (!signal) return;

        const unsubscribe = signal.subscribe?.((value: any) => {
          (window as any)[callbackId]?.(value);
        });

        (window as any)[`${callbackId}_unsub`] = unsubscribe;
      },
      [name, watchId] as const
    );

    return async () => {
      await this.page.evaluate((callbackId) => {
        const unsubscribe = (window as any)[`${callbackId}_unsub`];
        if (typeof unsubscribe === 'function') unsubscribe();
      }, watchId);
    };
  }

  /**
   * Get signal history (if devtools tracking is enabled)
   */
  async getSignalHistory(name: string): Promise<Array<{ value: any; timestamp: number }>> {
    return this.page.evaluate((signalName) => {
      const devtools = (window as any).__PHILJS_DEVTOOLS__;
      if (!devtools?.signalHistory) return [];
      return devtools.signalHistory.get(signalName) || [];
    }, name);
  }

  /**
   * Clear signal history
   */
  async clearSignalHistory(name?: string): Promise<void> {
    await this.page.evaluate((signalName) => {
      const devtools = (window as any).__PHILJS_DEVTOOLS__;
      if (!devtools?.signalHistory) return;
      if (signalName) {
        devtools.signalHistory.delete(signalName);
      } else {
        devtools.signalHistory.clear();
      }
    }, name);
  }

  /**
   * Take a snapshot of all signals
   */
  async snapshot(): Promise<Record<string, any>> {
    return this.getAllSignals();
  }

  /**
   * Restore signals from a snapshot
   */
  async restoreSnapshot(snapshot: Record<string, any>): Promise<void> {
    const updates = Object.entries(snapshot).map(([name, value]) => ({ name, value }));
    await this.batchUpdates(updates);
  }

  /**
   * Wait for next signal update
   */
  async waitForNextUpdate(name: string, options: { timeout?: number } = {}): Promise<any> {
    const { timeout = 5000 } = options;
    const currentValue = await this.getSignal(name);

    return this.page.evaluate(
      ([signalName, current, timeoutMs]) => {
        return new Promise((resolve, reject) => {
          const devtools = (window as any).__PHILJS_DEVTOOLS__;
          if (!devtools) {
            reject(new Error('PhilJS DevTools not found'));
            return;
          }

          const signal = devtools.signals.get(signalName);
          if (!signal) {
            reject(new Error(`Signal "${signalName}" not found`));
            return;
          }

          const timer = setTimeout(() => {
            reject(new Error(`Timeout waiting for signal update`));
          }, timeoutMs);

          const checkValue = () => {
            const newValue = signal.value;
            if (JSON.stringify(newValue) !== JSON.stringify(current)) {
              clearTimeout(timer);
              resolve(newValue);
              return true;
            }
            return false;
          };

          if (!checkValue()) {
            const interval = setInterval(() => {
              if (checkValue()) clearInterval(interval);
            }, 50);
          }
        });
      },
      [name, currentValue, timeout] as const
    );
  }
}

// ============================================================================
// Visual Testing Utilities
// ============================================================================

/**
 * Visual regression testing utilities
 */
export class VisualTestUtils {
  constructor(
    private page: Page,
    private testInfo: TestInfo
  ) {}

  /**
   * Take a screenshot and compare with baseline
   */
  async expectToMatchSnapshot(
    name: string,
    options: VisualComparisonOptions = {}
  ): Promise<void> {
    const {
      threshold = 0.2,
      maxDiffPixels,
      maxDiffPixelRatio,
      animations = 'disabled',
      mask = [],
      maskColor = '#FF00FF',
      fullPage = false,
      clip,
      scale = 'css',
    } = options;

    // Disable animations for consistent screenshots
    if (animations === 'disabled') {
      await this.page.evaluate(() => {
        const style = document.createElement('style');
        style.id = '__philjs_no_animations__';
        style.textContent = `
          *, *::before, *::after {
            animation-duration: 0s !important;
            animation-delay: 0s !important;
            transition-duration: 0s !important;
            transition-delay: 0s !important;
          }
        `;
        document.head.appendChild(style);
      });
    }

    // Wait for page to stabilize
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(100);

    const screenshot = await this.page.screenshot({
      fullPage,
      clip,
      scale,
      mask,
      maskColor,
    });

    // Use Playwright's built-in snapshot comparison
    const snapshotName = `${name}.png`;
    await this.testInfo.attach(snapshotName, {
      body: screenshot,
      contentType: 'image/png',
    });

    // Re-enable animations
    if (animations === 'disabled') {
      await this.page.evaluate(() => {
        document.getElementById('__philjs_no_animations__')?.remove();
      });
    }
  }

  /**
   * Compare element screenshot
   */
  async expectElementToMatchSnapshot(
    selector: string,
    name: string,
    options: VisualComparisonOptions = {}
  ): Promise<void> {
    const locator = this.page.locator(selector);
    await locator.waitFor({ state: 'visible' });

    const screenshot = await locator.screenshot({
      scale: options.scale || 'css',
    });

    await this.testInfo.attach(`${name}.png`, {
      body: screenshot,
      contentType: 'image/png',
    });
  }

  /**
   * Compare full page with scrolling
   */
  async expectFullPageToMatchSnapshot(
    name: string,
    options: VisualComparisonOptions = {}
  ): Promise<void> {
    await this.expectToMatchSnapshot(name, { ...options, fullPage: true });
  }

  /**
   * Take screenshots at multiple viewport sizes
   */
  async expectResponsiveSnapshots(
    name: string,
    viewports: Array<{ width: number; height: number; name: string }>,
    options: VisualComparisonOptions = {}
  ): Promise<void> {
    const originalViewport = this.page.viewportSize();

    for (const viewport of viewports) {
      await this.page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });
      await this.page.waitForTimeout(100);
      await this.expectToMatchSnapshot(`${name}-${viewport.name}`, options);
    }

    // Restore original viewport
    if (originalViewport) {
      await this.page.setViewportSize(originalViewport);
    }
  }

  /**
   * Record visual changes over time
   */
  async recordVisualTimeline(
    name: string,
    duration: number,
    interval = 500
  ): Promise<void> {
    const screenshots: Buffer[] = [];
    const startTime = Date.now();

    while (Date.now() - startTime < duration) {
      screenshots.push(await this.page.screenshot());
      await this.page.waitForTimeout(interval);
    }

    for (let i = 0; i < screenshots.length; i++) {
      await this.testInfo.attach(`${name}-frame-${i}.png`, {
        body: screenshots[i],
        contentType: 'image/png',
      });
    }
  }
}

// ============================================================================
// Accessibility Testing Utilities
// ============================================================================

/**
 * Accessibility testing utilities
 */
export class AccessibilityUtils {
  constructor(private page: Page) {}

  /**
   * Run accessibility audit on the page
   */
  async audit(options: {
    include?: string[];
    exclude?: string[];
    rules?: string[];
    disabledRules?: string[];
  } = {}): Promise<AccessibilityViolation[]> {
    // Inject axe-core if not present
    const axeLoaded = await this.page.evaluate(() => typeof (window as any).axe !== 'undefined');

    if (!axeLoaded) {
      await this.page.addScriptTag({
        url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.8.2/axe.min.js',
      });
    }

    const results = await this.page.evaluate(async (opts) => {
      const config: any = {};

      if (opts.rules) {
        config.runOnly = { type: 'rule', values: opts.rules };
      }

      if (opts.disabledRules) {
        config.rules = opts.disabledRules.reduce((acc: any, rule: string) => {
          acc[rule] = { enabled: false };
          return acc;
        }, {});
      }

      const context: any = {};
      if (opts.include) context.include = opts.include;
      if (opts.exclude) context.exclude = opts.exclude;

      return (window as any).axe.run(
        Object.keys(context).length > 0 ? context : document,
        config
      );
    }, options);

    return results.violations.map((v: any) => ({
      id: v.id,
      impact: v.impact,
      description: v.description,
      help: v.help,
      helpUrl: v.helpUrl,
      nodes: v.nodes.map((n: any) => ({
        html: n.html,
        target: n.target,
        failureSummary: n.failureSummary,
      })),
    }));
  }

  /**
   * Assert no accessibility violations
   */
  async expectNoViolations(options: {
    impact?: ('minor' | 'moderate' | 'serious' | 'critical')[];
    exclude?: string[];
  } = {}): Promise<void> {
    const violations = await this.audit({ exclude: options.exclude });
    const filteredViolations = options.impact
      ? violations.filter((v) => options.impact!.includes(v.impact))
      : violations;

    if (filteredViolations.length > 0) {
      const message = filteredViolations
        .map((v) => `${v.id} (${v.impact}): ${v.help}\n  ${v.nodes.map((n) => n.html).join('\n  ')}`)
        .join('\n\n');
      throw new Error(`Accessibility violations found:\n${message}`);
    }
  }

  /**
   * Check element accessibility
   */
  async checkElement(selector: string): Promise<AccessibilityViolation[]> {
    return this.audit({ include: [selector] });
  }

  /**
   * Verify keyboard navigation
   */
  async verifyKeyboardNavigation(
    startSelector: string,
    expectedOrder: string[]
  ): Promise<boolean> {
    await this.page.focus(startSelector);
    const actualOrder: string[] = [];

    for (let i = 0; i < expectedOrder.length; i++) {
      await this.page.keyboard.press('Tab');
      const focused = await this.page.evaluate(() => {
        const el = document.activeElement;
        return el?.getAttribute('data-testid') || el?.id || el?.tagName.toLowerCase();
      });
      actualOrder.push(focused || '');
    }

    return JSON.stringify(actualOrder) === JSON.stringify(expectedOrder);
  }

  /**
   * Check focus visibility
   */
  async checkFocusVisible(selector: string): Promise<boolean> {
    await this.page.focus(selector);
    return this.page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (!el) return false;
      const styles = getComputedStyle(el);
      return (
        styles.outlineStyle !== 'none' ||
        styles.boxShadow !== 'none' ||
        styles.border !== getComputedStyle(document.body).border
      );
    }, selector);
  }

  /**
   * Check color contrast
   */
  async checkColorContrast(selector: string): Promise<{
    foreground: string;
    background: string;
    ratio: number;
    passes: { aa: boolean; aaa: boolean };
  }> {
    return this.page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (!el) throw new Error(`Element not found: ${sel}`);

      const styles = getComputedStyle(el);
      const foreground = styles.color;
      const background = styles.backgroundColor;

      // Simple luminance calculation
      const getLuminance = (color: string): number => {
        const rgb = color.match(/\d+/g)?.map(Number) || [0, 0, 0];
        const [r, g, b] = rgb.map((c) => {
          c = c / 255;
          return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };

      const l1 = getLuminance(foreground);
      const l2 = getLuminance(background);
      const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

      return {
        foreground,
        background,
        ratio: Math.round(ratio * 100) / 100,
        passes: {
          aa: ratio >= 4.5,
          aaa: ratio >= 7,
        },
      };
    }, selector);
  }

  /**
   * Check ARIA attributes
   */
  async checkAriaAttributes(selector: string): Promise<{
    role: string | null;
    label: string | null;
    describedBy: string | null;
    expanded: string | null;
    selected: string | null;
    hidden: string | null;
    live: string | null;
  }> {
    return this.page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (!el) throw new Error(`Element not found: ${sel}`);

      return {
        role: el.getAttribute('role'),
        label: el.getAttribute('aria-label') || el.getAttribute('aria-labelledby'),
        describedBy: el.getAttribute('aria-describedby'),
        expanded: el.getAttribute('aria-expanded'),
        selected: el.getAttribute('aria-selected'),
        hidden: el.getAttribute('aria-hidden'),
        live: el.getAttribute('aria-live'),
      };
    }, selector);
  }
}

// ============================================================================
// Performance Testing Utilities
// ============================================================================

/**
 * Performance testing utilities
 */
export class PerformanceUtils {
  constructor(private page: Page) {}

  /**
   * Get Core Web Vitals
   */
  async getWebVitals(): Promise<PerformanceMetrics> {
    return this.page.evaluate(() => {
      const performance = window.performance;
      const timing = performance.timing;
      const entries = performance.getEntriesByType('paint');

      const fcp = entries.find((e) => e.name === 'first-contentful-paint');
      const lcp = (performance as any).getEntriesByType?.('largest-contentful-paint')?.[0];

      // Calculate CLS
      let cls = 0;
      const layoutShifts = (performance as any).getEntriesByType?.('layout-shift') || [];
      for (const shift of layoutShifts) {
        if (!shift.hadRecentInput) {
          cls += shift.value;
        }
      }

      // Get memory info if available
      const memory = (performance as any).memory || {};

      return {
        ttfb: timing.responseStart - timing.requestStart,
        fcp: fcp?.startTime || 0,
        lcp: lcp?.startTime || 0,
        fid: 0, // FID requires user interaction
        cls: Math.round(cls * 1000) / 1000,
        tti: 0, // TTI requires more complex calculation
        tbt: 0, // TBT requires long task monitoring
        domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
        load: timing.loadEventEnd - timing.navigationStart,
        jsHeapSize: memory.usedJSHeapSize || 0,
        layoutCount: 0,
        recalcStyleCount: 0,
        paintCount: entries.length,
      };
    });
  }

  /**
   * Start performance measurement
   */
  async startMeasurement(name: string): Promise<void> {
    await this.page.evaluate((measureName) => {
      performance.mark(`${measureName}-start`);
    }, name);
  }

  /**
   * End performance measurement
   */
  async endMeasurement(name: string): Promise<number> {
    return this.page.evaluate((measureName) => {
      performance.mark(`${measureName}-end`);
      performance.measure(measureName, `${measureName}-start`, `${measureName}-end`);
      const entries = performance.getEntriesByName(measureName);
      return entries[entries.length - 1]?.duration || 0;
    }, name);
  }

  /**
   * Measure render time
   */
  async measureRender(action: () => Promise<void>): Promise<number> {
    await this.startMeasurement('render');
    await action();
    return this.endMeasurement('render');
  }

  /**
   * Get resource timing
   */
  async getResourceTiming(): Promise<
    Array<{
      name: string;
      type: string;
      duration: number;
      size: number;
    }>
  > {
    return this.page.evaluate(() => {
      const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      return entries.map((e) => ({
        name: e.name,
        type: e.initiatorType,
        duration: e.duration,
        size: e.transferSize || 0,
      }));
    });
  }

  /**
   * Get long tasks
   */
  async getLongTasks(): Promise<
    Array<{
      duration: number;
      startTime: number;
    }>
  > {
    return this.page.evaluate(() => {
      const entries = (performance as any).getEntriesByType?.('longtask') || [];
      return entries.map((e: any) => ({
        duration: e.duration,
        startTime: e.startTime,
      }));
    });
  }

  /**
   * Monitor long tasks during action
   */
  async monitorLongTasks(action: () => Promise<void>): Promise<number> {
    const beforeTasks = await this.getLongTasks();
    await action();
    const afterTasks = await this.getLongTasks();
    const newTasks = afterTasks.slice(beforeTasks.length);
    return newTasks.reduce((sum, t) => sum + t.duration, 0);
  }

  /**
   * Check bundle size
   */
  async getBundleSize(): Promise<{
    total: number;
    js: number;
    css: number;
    images: number;
    other: number;
  }> {
    const resources = await this.getResourceTiming();

    const result = { total: 0, js: 0, css: 0, images: 0, other: 0 };

    for (const resource of resources) {
      result.total += resource.size;
      if (resource.name.endsWith('.js')) {
        result.js += resource.size;
      } else if (resource.name.endsWith('.css')) {
        result.css += resource.size;
      } else if (/\.(png|jpg|jpeg|gif|svg|webp)$/i.test(resource.name)) {
        result.images += resource.size;
      } else {
        result.other += resource.size;
      }
    }

    return result;
  }

  /**
   * Run lighthouse-style audit
   */
  async runAudit(): Promise<{
    performance: number;
    fcp: number;
    lcp: number;
    cls: number;
    tti: number;
  }> {
    const metrics = await this.getWebVitals();

    // Simplified scoring (real Lighthouse uses more complex algorithms)
    const fcpScore = Math.max(0, 100 - (metrics.fcp / 30)); // 3000ms = 0
    const lcpScore = Math.max(0, 100 - (metrics.lcp / 40)); // 4000ms = 0
    const clsScore = Math.max(0, 100 - (metrics.cls * 400)); // 0.25 = 0

    const performance = Math.round((fcpScore + lcpScore + clsScore) / 3);

    return {
      performance,
      fcp: metrics.fcp,
      lcp: metrics.lcp,
      cls: metrics.cls,
      tti: metrics.tti,
    };
  }

  /**
   * Assert performance budget
   */
  async assertBudget(budget: {
    fcp?: number;
    lcp?: number;
    cls?: number;
    bundleSize?: number;
  }): Promise<void> {
    const metrics = await this.getWebVitals();
    const bundleSize = await this.getBundleSize();
    const violations: string[] = [];

    if (budget.fcp && metrics.fcp > budget.fcp) {
      violations.push(`FCP ${metrics.fcp}ms exceeds budget ${budget.fcp}ms`);
    }
    if (budget.lcp && metrics.lcp > budget.lcp) {
      violations.push(`LCP ${metrics.lcp}ms exceeds budget ${budget.lcp}ms`);
    }
    if (budget.cls && metrics.cls > budget.cls) {
      violations.push(`CLS ${metrics.cls} exceeds budget ${budget.cls}`);
    }
    if (budget.bundleSize && bundleSize.total > budget.bundleSize) {
      violations.push(`Bundle size ${bundleSize.total} exceeds budget ${budget.bundleSize}`);
    }

    if (violations.length > 0) {
      throw new Error(`Performance budget exceeded:\n${violations.join('\n')}`);
    }
  }
}

// ============================================================================
// Network Mocking Utilities
// ============================================================================

/**
 * Network mocking utilities
 */
export class NetworkUtils {
  private routes: Map<string, Route> = new Map();

  constructor(private page: Page) {}

  /**
   * Mock a route
   */
  async mock(
    urlPattern: string | RegExp,
    response: MockRouteOptions | ((route: Route) => Promise<void>)
  ): Promise<void> {
    await this.page.route(urlPattern, async (route) => {
      if (typeof response === 'function') {
        await response(route);
      } else {
        const { status = 200, headers = {}, body, delay = 0, contentType } = response;

        if (delay > 0) {
          await new Promise((resolve) => setTimeout(resolve, delay));
        }

        const responseBody =
          typeof body === 'object' && !Buffer.isBuffer(body) ? JSON.stringify(body) : body;

        await route.fulfill({
          status,
          headers: {
            'Content-Type': contentType || (typeof body === 'object' ? 'application/json' : 'text/plain'),
            ...headers,
          },
          body: responseBody,
        });
      }
    });
  }

  /**
   * Mock API endpoint
   */
  async mockApi(
    path: string,
    response: object | object[],
    options: { method?: string; status?: number; delay?: number } = {}
  ): Promise<void> {
    const { method = '*', status = 200, delay = 0 } = options;
    await this.mock(`**/api${path}`, { status, body: response, delay });
  }

  /**
   * Mock GraphQL query
   */
  async mockGraphQL(
    operationName: string,
    response: object,
    options: { status?: number; delay?: number } = {}
  ): Promise<void> {
    const { status = 200, delay = 0 } = options;

    await this.page.route('**/graphql', async (route) => {
      const request = route.request();
      const postData = request.postDataJSON?.();

      if (postData?.operationName === operationName) {
        if (delay > 0) {
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
        await route.fulfill({
          status,
          contentType: 'application/json',
          body: JSON.stringify({ data: response }),
        });
      } else {
        await route.continue();
      }
    });
  }

  /**
   * Simulate network error
   */
  async simulateError(urlPattern: string | RegExp): Promise<void> {
    await this.page.route(urlPattern, (route) => route.abort('failed'));
  }

  /**
   * Simulate slow network
   */
  async simulateSlowNetwork(latency: number): Promise<void> {
    await this.page.route('**/*', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, latency));
      await route.continue();
    });
  }

  /**
   * Simulate offline mode
   */
  async goOffline(): Promise<void> {
    await this.page.context().setOffline(true);
  }

  /**
   * Go back online
   */
  async goOnline(): Promise<void> {
    await this.page.context().setOffline(false);
  }

  /**
   * Wait for request
   */
  async waitForRequest(
    urlPattern: string | RegExp,
    options: { timeout?: number } = {}
  ): Promise<Request> {
    return this.page.waitForRequest(urlPattern, options);
  }

  /**
   * Wait for response
   */
  async waitForResponse(
    urlPattern: string | RegExp,
    options: { timeout?: number } = {}
  ): Promise<Response> {
    return this.page.waitForResponse(urlPattern, options);
  }

  /**
   * Capture all requests
   */
  async captureRequests(action: () => Promise<void>): Promise<Request[]> {
    const requests: Request[] = [];
    const handler = (request: Request) => requests.push(request);

    this.page.on('request', handler);
    await action();
    this.page.off('request', handler);

    return requests;
  }

  /**
   * Clear all mocked routes
   */
  async clearMocks(): Promise<void> {
    await this.page.unrouteAll();
  }

  /**
   * Intercept and modify request
   */
  async intercept(
    urlPattern: string | RegExp,
    modifier: (request: Request) => { headers?: Record<string, string>; postData?: string }
  ): Promise<void> {
    await this.page.route(urlPattern, async (route) => {
      const request = route.request();
      const modifications = modifier(request);
      await route.continue({
        headers: modifications.headers,
        postData: modifications.postData,
      });
    });
  }
}

// ============================================================================
// Time Manipulation Utilities
// ============================================================================

/**
 * Time manipulation utilities for testing
 */
export class TimeUtils {
  private frozen = false;
  private currentTime = Date.now();
  private speed = 1;

  constructor(private page: Page) {}

  /**
   * Freeze time at a specific moment
   */
  async freeze(date?: Date | number): Promise<void> {
    this.frozen = true;
    this.currentTime = date instanceof Date ? date.getTime() : date || Date.now();

    await this.page.addInitScript(`
      const frozenTime = ${this.currentTime};
      Date.now = () => frozenTime;
      const OriginalDate = Date;
      globalThis.Date = class extends OriginalDate {
        constructor(...args) {
          if (args.length === 0) {
            super(frozenTime);
          } else {
            super(...args);
          }
        }
        static now() {
          return frozenTime;
        }
      };
    `);
  }

  /**
   * Unfreeze time
   */
  async unfreeze(): Promise<void> {
    this.frozen = false;
    await this.page.addInitScript(`
      delete globalThis.Date;
    `);
    await this.page.reload();
  }

  /**
   * Advance time by milliseconds
   */
  async advance(ms: number): Promise<void> {
    this.currentTime += ms;
    await this.page.evaluate((time) => {
      (window as any).__PHILJS_FROZEN_TIME__ = time;
      // Trigger any pending timeouts/intervals
      const event = new CustomEvent('philjs:timeadvance', { detail: { time } });
      window.dispatchEvent(event);
    }, this.currentTime);
  }

  /**
   * Set playback speed
   */
  async setSpeed(speed: number): Promise<void> {
    this.speed = speed;
    await this.page.evaluate((s) => {
      (window as any).__PHILJS_TIME_SPEED__ = s;
    }, speed);
  }

  /**
   * Run timers to completion
   */
  async runAllTimers(): Promise<void> {
    await this.page.evaluate(() => {
      // Run all pending timers
      let iterations = 0;
      const maxIterations = 1000;
      while ((window as any).__PHILJS_PENDING_TIMERS__?.length > 0 && iterations < maxIterations) {
        const timer = (window as any).__PHILJS_PENDING_TIMERS__.shift();
        timer?.();
        iterations++;
      }
    });
  }

  /**
   * Run only pending timers
   */
  async runOnlyPendingTimers(): Promise<void> {
    await this.page.evaluate(() => {
      const timers = [...((window as any).__PHILJS_PENDING_TIMERS__ || [])];
      for (const timer of timers) {
        timer?.();
      }
    });
  }

  /**
   * Advance timers by time
   */
  async advanceTimersByTime(ms: number): Promise<void> {
    await this.advance(ms);
    await this.runOnlyPendingTimers();
  }

  /**
   * Get current mocked time
   */
  async getCurrentTime(): Promise<number> {
    return this.page.evaluate(() => Date.now());
  }

  /**
   * Use fake timers
   */
  async useFakeTimers(): Promise<void> {
    await this.page.addInitScript(`
      const originalSetTimeout = globalThis.setTimeout;
      const originalSetInterval = globalThis.setInterval;
      const originalClearTimeout = globalThis.clearTimeout;
      const originalClearInterval = globalThis.clearInterval;

      globalThis.__PHILJS_PENDING_TIMERS__ = [];

      globalThis.setTimeout = (fn, delay, ...args) => {
        const id = Math.random();
        globalThis.__PHILJS_PENDING_TIMERS__.push(() => fn(...args));
        return id;
      };

      globalThis.setInterval = (fn, delay, ...args) => {
        const id = Math.random();
        globalThis.__PHILJS_PENDING_TIMERS__.push(() => fn(...args));
        return id;
      };

      globalThis.clearTimeout = () => {};
      globalThis.clearInterval = () => {};
    `);
  }

  /**
   * Use real timers
   */
  async useRealTimers(): Promise<void> {
    await this.page.evaluate(() => {
      delete (window as any).__PHILJS_PENDING_TIMERS__;
    });
    await this.page.reload();
  }
}

// ============================================================================
// Fixtures Factory
// ============================================================================

/**
 * Create PhilJS Playwright fixtures
 */
export function createPhilJSFixtures() {
  return {
    philjs: async ({ page }: { page: Page }, use: (utils: PhilJSTestUtils) => Promise<void>) => {
      const utils = new PhilJSTestUtils(page);
      await use(utils);
    },

    visual: async (
      { page }: { page: Page },
      use: (utils: VisualTestUtils) => Promise<void>,
      testInfo: TestInfo
    ) => {
      const utils = new VisualTestUtils(page, testInfo);
      await use(utils);
    },

    a11y: async ({ page }: { page: Page }, use: (utils: AccessibilityUtils) => Promise<void>) => {
      const utils = new AccessibilityUtils(page);
      await use(utils);
    },

    performance: async (
      { page }: { page: Page },
      use: (utils: PerformanceUtils) => Promise<void>
    ) => {
      const utils = new PerformanceUtils(page);
      await use(utils);
    },

    network: async ({ page }: { page: Page }, use: (utils: NetworkUtils) => Promise<void>) => {
      const utils = new NetworkUtils(page);
      await use(utils);
      await utils.clearMocks();
    },

    time: async ({ page }: { page: Page }, use: (utils: TimeUtils) => Promise<void>) => {
      const utils = new TimeUtils(page);
      await use(utils);
    },
  };
}

// ============================================================================
// Page Object Model Base
// ============================================================================

/**
 * Base class for Page Object Model pattern
 */
export abstract class PhilJSPageObject {
  protected philjs: PhilJSTestUtils;

  constructor(protected page: Page) {
    this.philjs = new PhilJSTestUtils(page);
  }

  /**
   * Navigate to this page
   */
  abstract goto(): Promise<void>;

  /**
   * Wait for page to be ready
   */
  async waitForReady(): Promise<void> {
    await this.philjs.waitForHydration();
  }

  /**
   * Get element by test ID
   */
  getByTestId(testId: string): Locator {
    return this.page.getByTestId(testId);
  }

  /**
   * Get element by role
   */
  getByRole(
    role: string,
    options?: { name?: string | RegExp; exact?: boolean }
  ): Locator {
    return this.page.getByRole(role as any, options);
  }

  /**
   * Get element by text
   */
  getByText(text: string | RegExp, options?: { exact?: boolean }): Locator {
    return this.page.getByText(text, options);
  }

  /**
   * Get element by label
   */
  getByLabel(text: string | RegExp, options?: { exact?: boolean }): Locator {
    return this.page.getByLabel(text, options);
  }

  /**
   * Get element by placeholder
   */
  getByPlaceholder(text: string | RegExp, options?: { exact?: boolean }): Locator {
    return this.page.getByPlaceholder(text, options);
  }

  /**
   * Take screenshot of page
   */
  async screenshot(name: string): Promise<Buffer> {
    return this.page.screenshot({ path: `screenshots/${name}.png` });
  }
}

// ============================================================================
// Component Testing
// ============================================================================

/**
 * Mount a PhilJS component for isolated testing
 */
export async function mount<T extends Record<string, any>>(
  page: Page,
  component: string | ((props: T) => any),
  props: T = {} as T,
  options: {
    styles?: string[];
    scripts?: string[];
    html?: string;
  } = {}
): Promise<Locator> {
  const componentStr = typeof component === 'string' ? component : component.toString();
  const stylesHtml = options.styles?.map((s) => `<link rel="stylesheet" href="${s}">`).join('\n') || '';
  const scriptsHtml = options.scripts?.map((s) => `<script src="${s}"></script>`).join('\n') || '';

  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Component Test</title>
        ${stylesHtml}
      </head>
      <body>
        ${options.html || '<div id="root"></div>'}
        ${scriptsHtml}
        <script type="module">
          import { render } from '@philjs/core';

          const Component = ${componentStr};
          const props = ${JSON.stringify(props)};

          render(Component(props), document.getElementById('root'));
          window.__PHILJS_HYDRATED__ = true;
        </script>
      </body>
    </html>
  `);

  await page.waitForFunction(() => (window as any).__PHILJS_HYDRATED__);
  return page.locator('#root');
}

/**
 * Create a component test harness
 */
export function createComponentHarness<T extends Record<string, any>>(
  page: Page,
  component: string | ((props: T) => any)
) {
  return {
    async render(props: T = {} as T): Promise<Locator> {
      return mount(page, component, props);
    },

    async rerender(props: T): Promise<void> {
      await page.evaluate((p) => {
        (window as any).__PHILJS_RERENDER__?.(p);
      }, props);
    },

    async unmount(): Promise<void> {
      await page.evaluate(() => {
        const root = document.getElementById('root');
        if (root) root.innerHTML = '';
      });
    },

    philjs: new PhilJSTestUtils(page),
  };
}

// ============================================================================
// Custom Assertions
// ============================================================================

/**
 * Custom expect matchers for PhilJS
 */
export const philjsMatchers = {
  async toHaveSignalValue(page: Page, signalName: string, expectedValue: any) {
    const philjs = new PhilJSTestUtils(page);
    const actualValue = await philjs.getSignal(signalName);
    const pass = JSON.stringify(actualValue) === JSON.stringify(expectedValue);

    return {
      pass,
      message: () =>
        pass
          ? `Expected signal "${signalName}" not to have value ${JSON.stringify(expectedValue)}`
          : `Expected signal "${signalName}" to have value ${JSON.stringify(expectedValue)}, but got ${JSON.stringify(actualValue)}`,
    };
  },

  async toBeHydrated(page: Page) {
    const philjs = new PhilJSTestUtils(page);
    const isHydrated = await philjs.isHydrated();

    return {
      pass: isHydrated,
      message: () => (isHydrated ? 'Expected page not to be hydrated' : 'Expected page to be hydrated'),
    };
  },

  async toHaveNoA11yViolations(page: Page, options?: { impact?: string[] }) {
    const a11y = new AccessibilityUtils(page);
    const violations = await a11y.audit();
    const filtered = options?.impact
      ? violations.filter((v) => options.impact!.includes(v.impact))
      : violations;
    const pass = filtered.length === 0;

    return {
      pass,
      message: () =>
        pass
          ? 'Expected page to have accessibility violations'
          : `Found ${filtered.length} accessibility violations:\n${filtered.map((v) => `- ${v.id}: ${v.help}`).join('\n')}`,
    };
  },

  async toHavePerformanceWithinBudget(
    page: Page,
    budget: { fcp?: number; lcp?: number; cls?: number }
  ) {
    const perf = new PerformanceUtils(page);
    const metrics = await perf.getWebVitals();
    const violations: string[] = [];

    if (budget.fcp && metrics.fcp > budget.fcp) {
      violations.push(`FCP ${metrics.fcp}ms > ${budget.fcp}ms`);
    }
    if (budget.lcp && metrics.lcp > budget.lcp) {
      violations.push(`LCP ${metrics.lcp}ms > ${budget.lcp}ms`);
    }
    if (budget.cls && metrics.cls > budget.cls) {
      violations.push(`CLS ${metrics.cls} > ${budget.cls}`);
    }

    return {
      pass: violations.length === 0,
      message: () =>
        violations.length === 0
          ? 'Expected page to exceed performance budget'
          : `Performance budget exceeded:\n${violations.join('\n')}`,
    };
  },
};

// ============================================================================
// Exports
// ============================================================================

export {
  PhilJSTestUtils,
  VisualTestUtils,
  AccessibilityUtils,
  PerformanceUtils,
  NetworkUtils,
  TimeUtils,
  PhilJSPageObject,
  createPhilJSFixtures,
  mount,
  createComponentHarness,
  philjsMatchers,
};

// Type exports
export type {
  PhilJSFixtures,
  SignalInfo,
  ComponentInfo,
  RenderContext,
  VisualComparisonOptions,
  AccessibilityViolation,
  PerformanceMetrics,
  MockRouteOptions,
  TimeState,
};
