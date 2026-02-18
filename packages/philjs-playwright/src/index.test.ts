/**
 * PhilJS Playwright Integration Tests
 *
 * Comprehensive tests for E2E testing utilities for PhilJS applications.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Page, TestInfo, Locator, Route, Request, Response } from '@playwright/test';
import type {
  PhilJSFixtures,
  SignalInfo,
  ComponentInfo,
  RenderContext,
  VisualComparisonOptions,
  AccessibilityViolation,
  PerformanceMetrics,
  MockRouteOptions,
  TimeState,
} from './index';

// ============================================================================
// Type Tests
// ============================================================================

describe('Type Definitions', () => {
  describe('PhilJSFixtures', () => {
    it('should define fixture structure', () => {
      const fixtures: PhilJSFixtures = {
        philjs: {} as any,
        visual: {} as any,
        a11y: {} as any,
        performance: {} as any,
        network: {} as any,
        time: {} as any,
      };

      expect(fixtures).toHaveProperty('philjs');
      expect(fixtures).toHaveProperty('visual');
      expect(fixtures).toHaveProperty('a11y');
      expect(fixtures).toHaveProperty('performance');
      expect(fixtures).toHaveProperty('network');
      expect(fixtures).toHaveProperty('time');
    });
  });

  describe('SignalInfo', () => {
    it('should define signal information structure', () => {
      const signalInfo: SignalInfo = {
        name: 'counter',
        value: 42,
        type: 'number',
        dependents: ['computed1', 'computed2'],
        dependencies: ['dependency1'],
      };

      expect(signalInfo.name).toBe('counter');
      expect(signalInfo.value).toBe(42);
      expect(signalInfo.type).toBe('number');
      expect(signalInfo.dependents).toHaveLength(2);
      expect(signalInfo.dependencies).toHaveLength(1);
    });
  });

  describe('ComponentInfo', () => {
    it('should define component information structure', () => {
      const componentInfo: ComponentInfo = {
        name: 'Counter',
        props: { initialValue: 0 },
        signals: ['count'],
        children: [
          {
            name: 'Button',
            props: { onClick: 'increment' },
            signals: [],
            children: [],
            element: 'button',
          },
        ],
        element: 'div',
      };

      expect(componentInfo.name).toBe('Counter');
      expect(componentInfo.props.initialValue).toBe(0);
      expect(componentInfo.signals).toContain('count');
      expect(componentInfo.children).toHaveLength(1);
      expect(componentInfo.element).toBe('div');
    });
  });

  describe('RenderContext', () => {
    it('should define render context structure', () => {
      const context: RenderContext = {
        url: 'http://localhost:3000/test',
        headers: { 'Content-Type': 'application/json' },
        cookies: { session: 'abc123' },
        state: { authenticated: true },
      };

      expect(context.url).toBe('http://localhost:3000/test');
      expect(context.headers['Content-Type']).toBe('application/json');
      expect(context.cookies.session).toBe('abc123');
      expect(context.state.authenticated).toBe(true);
    });
  });

  describe('VisualComparisonOptions', () => {
    it('should define visual comparison options', () => {
      const options: VisualComparisonOptions = {
        threshold: 0.1,
        maxDiffPixels: 100,
        maxDiffPixelRatio: 0.05,
        animations: 'disabled',
        mask: [],
        maskColor: '#FF00FF',
        fullPage: true,
        clip: { x: 0, y: 0, width: 800, height: 600 },
        scale: 'css',
      };

      expect(options.threshold).toBe(0.1);
      expect(options.maxDiffPixels).toBe(100);
      expect(options.animations).toBe('disabled');
      expect(options.fullPage).toBe(true);
      expect(options.scale).toBe('css');
    });

    it('should accept animations allow option', () => {
      const options: VisualComparisonOptions = {
        animations: 'allow',
      };

      expect(options.animations).toBe('allow');
    });

    it('should accept device scale option', () => {
      const options: VisualComparisonOptions = {
        scale: 'device',
      };

      expect(options.scale).toBe('device');
    });
  });

  describe('AccessibilityViolation', () => {
    it('should define accessibility violation structure', () => {
      const violation: AccessibilityViolation = {
        id: 'color-contrast',
        impact: 'serious',
        description: 'Elements must have sufficient color contrast',
        help: 'Ensure text has adequate contrast',
        helpUrl: 'https://dequeuniversity.com/rules/axe/color-contrast',
        nodes: [
          {
            html: '<p class="low-contrast">Text</p>',
            target: ['p.low-contrast'],
            failureSummary: 'Fix any of the following:\n  Element has insufficient contrast ratio',
          },
        ],
      };

      expect(violation.id).toBe('color-contrast');
      expect(violation.impact).toBe('serious');
      expect(violation.nodes).toHaveLength(1);
      expect(violation.nodes[0].html).toContain('low-contrast');
    });

    it('should support all impact levels', () => {
      const impacts: AccessibilityViolation['impact'][] = ['minor', 'moderate', 'serious', 'critical'];

      impacts.forEach((impact) => {
        const violation: AccessibilityViolation = {
          id: 'test',
          impact,
          description: 'Test',
          help: 'Test',
          helpUrl: 'https://example.com',
          nodes: [],
        };
        expect(violation.impact).toBe(impact);
      });
    });
  });

  describe('PerformanceMetrics', () => {
    it('should define performance metrics structure', () => {
      const metrics: PerformanceMetrics = {
        ttfb: 150,
        fcp: 1200,
        lcp: 2500,
        fid: 50,
        cls: 0.05,
        tti: 3500,
        tbt: 200,
        domContentLoaded: 1800,
        load: 3000,
        jsHeapSize: 15000000,
        layoutCount: 10,
        recalcStyleCount: 25,
        paintCount: 5,
      };

      expect(metrics.ttfb).toBe(150);
      expect(metrics.fcp).toBe(1200);
      expect(metrics.lcp).toBe(2500);
      expect(metrics.fid).toBe(50);
      expect(metrics.cls).toBe(0.05);
      expect(metrics.tti).toBe(3500);
      expect(metrics.tbt).toBe(200);
      expect(metrics.domContentLoaded).toBe(1800);
      expect(metrics.load).toBe(3000);
      expect(metrics.jsHeapSize).toBe(15000000);
      expect(metrics.layoutCount).toBe(10);
      expect(metrics.recalcStyleCount).toBe(25);
      expect(metrics.paintCount).toBe(5);
    });
  });

  describe('MockRouteOptions', () => {
    it('should define mock route options', () => {
      const options: MockRouteOptions = {
        status: 200,
        headers: { 'X-Custom-Header': 'value' },
        body: { data: 'test' },
        delay: 100,
        contentType: 'application/json',
      };

      expect(options.status).toBe(200);
      expect(options.headers?.['X-Custom-Header']).toBe('value');
      expect(options.body).toEqual({ data: 'test' });
      expect(options.delay).toBe(100);
      expect(options.contentType).toBe('application/json');
    });

    it('should accept string body', () => {
      const options: MockRouteOptions = {
        body: 'Plain text response',
      };

      expect(options.body).toBe('Plain text response');
    });

    it('should accept Buffer body', () => {
      const options: MockRouteOptions = {
        body: Buffer.from('binary data'),
      };

      expect(Buffer.isBuffer(options.body)).toBe(true);
    });
  });

  describe('TimeState', () => {
    it('should define time state structure', () => {
      const state: TimeState = {
        frozen: true,
        currentTime: 1704067200000,
        speed: 1.5,
      };

      expect(state.frozen).toBe(true);
      expect(state.currentTime).toBe(1704067200000);
      expect(state.speed).toBe(1.5);
    });
  });
});

// ============================================================================
// PhilJSTestUtils Tests
// ============================================================================

describe('PhilJSTestUtils', () => {
  let mockPage: Page;

  beforeEach(() => {
    mockPage = createMockPage();
  });

  describe('waitForHydration', () => {
    it('should wait for PhilJS hydration', async () => {
      const { PhilJSTestUtils } = await import('./index');
      const utils = new PhilJSTestUtils(mockPage);

      mockPage.waitForFunction = vi.fn().mockResolvedValue(undefined);

      await utils.waitForHydration();

      expect(mockPage.waitForFunction).toHaveBeenCalledWith(
        expect.any(Function),
        { timeout: 30000 }
      );
    });

    it('should accept custom timeout', async () => {
      const { PhilJSTestUtils } = await import('./index');
      const utils = new PhilJSTestUtils(mockPage);

      mockPage.waitForFunction = vi.fn().mockResolvedValue(undefined);

      await utils.waitForHydration({ timeout: 5000 });

      expect(mockPage.waitForFunction).toHaveBeenCalledWith(
        expect.any(Function),
        { timeout: 5000 }
      );
    });
  });

  describe('isHydrated', () => {
    it('should check hydration status', async () => {
      const { PhilJSTestUtils } = await import('./index');
      const utils = new PhilJSTestUtils(mockPage);

      mockPage.evaluate = vi.fn().mockResolvedValue(true);

      const result = await utils.isHydrated();

      expect(result).toBe(true);
      expect(mockPage.evaluate).toHaveBeenCalled();
    });
  });

  describe('getSignal', () => {
    it('should get signal value by name', async () => {
      const { PhilJSTestUtils } = await import('./index');
      const utils = new PhilJSTestUtils(mockPage);

      mockPage.evaluate = vi.fn().mockResolvedValue(42);

      const value = await utils.getSignal<number>('count');

      expect(value).toBe(42);
      expect(mockPage.evaluate).toHaveBeenCalledWith(expect.any(Function), 'count');
    });
  });

  describe('setSignal', () => {
    it('should set signal value by name', async () => {
      const { PhilJSTestUtils } = await import('./index');
      const utils = new PhilJSTestUtils(mockPage);

      mockPage.evaluate = vi.fn().mockResolvedValue(undefined);

      await utils.setSignal('count', 100);

      expect(mockPage.evaluate).toHaveBeenCalledWith(
        expect.any(Function),
        ['count', 100]
      );
    });
  });

  describe('updateSignal', () => {
    it('should update signal with updater function', async () => {
      const { PhilJSTestUtils } = await import('./index');
      const utils = new PhilJSTestUtils(mockPage);

      mockPage.evaluate = vi.fn().mockResolvedValue(undefined);

      await utils.updateSignal<number>('count', (n) => n + 1);

      expect(mockPage.evaluate).toHaveBeenCalled();
    });
  });

  describe('waitForSignal', () => {
    it('should wait for signal to have expected value', async () => {
      const { PhilJSTestUtils } = await import('./index');
      const utils = new PhilJSTestUtils(mockPage);

      mockPage.waitForFunction = vi.fn().mockResolvedValue(undefined);

      await utils.waitForSignal('count', 10);

      expect(mockPage.waitForFunction).toHaveBeenCalledWith(
        expect.any(Function),
        ['count', 10, 100],
        { timeout: 10000, polling: 100 }
      );
    });

    it('should accept custom timeout and interval', async () => {
      const { PhilJSTestUtils } = await import('./index');
      const utils = new PhilJSTestUtils(mockPage);

      mockPage.waitForFunction = vi.fn().mockResolvedValue(undefined);

      await utils.waitForSignal('count', 10, { timeout: 5000, interval: 50 });

      expect(mockPage.waitForFunction).toHaveBeenCalledWith(
        expect.any(Function),
        ['count', 10, 50],
        { timeout: 5000, polling: 50 }
      );
    });
  });

  describe('waitForSignalMatch', () => {
    it('should wait for signal to match predicate', async () => {
      const { PhilJSTestUtils } = await import('./index');
      const utils = new PhilJSTestUtils(mockPage);

      mockPage.waitForFunction = vi.fn().mockResolvedValue(undefined);

      await utils.waitForSignalMatch<number>('count', (v) => v > 5);

      expect(mockPage.waitForFunction).toHaveBeenCalledWith(
        expect.any(Function),
        expect.arrayContaining(['count']),
        { timeout: 10000 }
      );
    });
  });

  describe('getAllSignals', () => {
    it('should get all signals and their values', async () => {
      const { PhilJSTestUtils } = await import('./index');
      const utils = new PhilJSTestUtils(mockPage);

      const mockSignals = { count: 5, name: 'test' };
      mockPage.evaluate = vi.fn().mockResolvedValue(mockSignals);

      const signals = await utils.getAllSignals();

      expect(signals).toEqual(mockSignals);
    });
  });

  describe('getSignalInfo', () => {
    it('should get detailed signal information', async () => {
      const { PhilJSTestUtils } = await import('./index');
      const utils = new PhilJSTestUtils(mockPage);

      const mockInfo: SignalInfo = {
        name: 'count',
        value: 42,
        type: 'number',
        dependents: ['doubled'],
        dependencies: [],
      };
      mockPage.evaluate = vi.fn().mockResolvedValue(mockInfo);

      const info = await utils.getSignalInfo('count');

      expect(info).toEqual(mockInfo);
    });
  });

  describe('getComponentTree', () => {
    it('should get component tree', async () => {
      const { PhilJSTestUtils } = await import('./index');
      const utils = new PhilJSTestUtils(mockPage);

      const mockTree: ComponentInfo[] = [
        {
          name: 'App',
          props: {},
          signals: [],
          children: [],
          element: 'div',
        },
      ];
      mockPage.evaluate = vi.fn().mockResolvedValue(mockTree);

      const tree = await utils.getComponentTree();

      expect(tree).toEqual(mockTree);
    });
  });

  describe('findComponent', () => {
    it('should find component by name', async () => {
      const { PhilJSTestUtils } = await import('./index');
      const utils = new PhilJSTestUtils(mockPage);

      const mockComponent: ComponentInfo = {
        name: 'Counter',
        props: {},
        signals: ['count'],
        children: [],
        element: 'div',
      };
      mockPage.evaluate = vi.fn().mockResolvedValue(mockComponent);

      const component = await utils.findComponent('Counter');

      expect(component?.name).toBe('Counter');
    });

    it('should return null if component not found', async () => {
      const { PhilJSTestUtils } = await import('./index');
      const utils = new PhilJSTestUtils(mockPage);

      mockPage.evaluate = vi.fn().mockResolvedValue(null);

      const component = await utils.findComponent('NotFound');

      expect(component).toBeNull();
    });
  });

  describe('getComponentProps', () => {
    it('should get component props', async () => {
      const { PhilJSTestUtils } = await import('./index');
      const utils = new PhilJSTestUtils(mockPage);

      mockPage.evaluate = vi.fn().mockResolvedValue({
        name: 'Counter',
        props: { initial: 5 },
        signals: [],
        children: [],
        element: 'div',
      });

      const props = await utils.getComponentProps('Counter');

      expect(props).toEqual({ initial: 5 });
    });
  });

  describe('invalidateComputed', () => {
    it('should invalidate computed signal', async () => {
      const { PhilJSTestUtils } = await import('./index');
      const utils = new PhilJSTestUtils(mockPage);

      mockPage.evaluate = vi.fn().mockResolvedValue(undefined);

      await utils.invalidateComputed('doubled');

      expect(mockPage.evaluate).toHaveBeenCalledWith(
        expect.any(Function),
        'doubled'
      );
    });
  });

  describe('batchUpdates', () => {
    it('should batch multiple signal updates', async () => {
      const { PhilJSTestUtils } = await import('./index');
      const utils = new PhilJSTestUtils(mockPage);

      mockPage.evaluate = vi.fn().mockResolvedValue(undefined);

      const updates = [
        { name: 'count', value: 10 },
        { name: 'name', value: 'test' },
      ];

      await utils.batchUpdates(updates);

      expect(mockPage.evaluate).toHaveBeenCalledWith(
        expect.any(Function),
        updates
      );
    });
  });

  describe('watchSignal', () => {
    it('should watch signal changes and return unsubscribe function', async () => {
      const { PhilJSTestUtils } = await import('./index');
      const utils = new PhilJSTestUtils(mockPage);

      mockPage.exposeFunction = vi.fn().mockResolvedValue(undefined);
      mockPage.evaluate = vi.fn().mockResolvedValue(undefined);

      const callback = vi.fn();
      const unsubscribe = await utils.watchSignal('count', callback);

      expect(mockPage.exposeFunction).toHaveBeenCalled();
      expect(typeof unsubscribe).toBe('function');

      await unsubscribe();
      expect(mockPage.evaluate).toHaveBeenCalled();
    });
  });

  describe('getSignalHistory', () => {
    it('should get signal history', async () => {
      const { PhilJSTestUtils } = await import('./index');
      const utils = new PhilJSTestUtils(mockPage);

      const mockHistory = [
        { value: 0, timestamp: 1000 },
        { value: 1, timestamp: 2000 },
      ];
      mockPage.evaluate = vi.fn().mockResolvedValue(mockHistory);

      const history = await utils.getSignalHistory('count');

      expect(history).toEqual(mockHistory);
    });
  });

  describe('clearSignalHistory', () => {
    it('should clear specific signal history', async () => {
      const { PhilJSTestUtils } = await import('./index');
      const utils = new PhilJSTestUtils(mockPage);

      mockPage.evaluate = vi.fn().mockResolvedValue(undefined);

      await utils.clearSignalHistory('count');

      expect(mockPage.evaluate).toHaveBeenCalledWith(
        expect.any(Function),
        'count'
      );
    });

    it('should clear all signal history when no name provided', async () => {
      const { PhilJSTestUtils } = await import('./index');
      const utils = new PhilJSTestUtils(mockPage);

      mockPage.evaluate = vi.fn().mockResolvedValue(undefined);

      await utils.clearSignalHistory();

      expect(mockPage.evaluate).toHaveBeenCalledWith(
        expect.any(Function),
        undefined
      );
    });
  });

  describe('snapshot and restoreSnapshot', () => {
    it('should take snapshot of all signals', async () => {
      const { PhilJSTestUtils } = await import('./index');
      const utils = new PhilJSTestUtils(mockPage);

      const mockSignals = { count: 5, name: 'test' };
      mockPage.evaluate = vi.fn().mockResolvedValue(mockSignals);

      const snapshot = await utils.snapshot();

      expect(snapshot).toEqual(mockSignals);
    });

    it('should restore signals from snapshot', async () => {
      const { PhilJSTestUtils } = await import('./index');
      const utils = new PhilJSTestUtils(mockPage);

      mockPage.evaluate = vi.fn().mockResolvedValue(undefined);

      const snapshot = { count: 5, name: 'test' };
      await utils.restoreSnapshot(snapshot);

      expect(mockPage.evaluate).toHaveBeenCalledWith(
        expect.any(Function),
        [
          { name: 'count', value: 5 },
          { name: 'name', value: 'test' },
        ]
      );
    });
  });

  describe('waitForNextUpdate', () => {
    it('should wait for next signal update', async () => {
      const { PhilJSTestUtils } = await import('./index');
      const utils = new PhilJSTestUtils(mockPage);

      mockPage.evaluate = vi.fn()
        .mockResolvedValueOnce(5) // getSignal call
        .mockResolvedValueOnce(6); // waitForNextUpdate result

      const newValue = await utils.waitForNextUpdate('count');

      expect(newValue).toBe(6);
    });
  });
});

// ============================================================================
// VisualTestUtils Tests
// ============================================================================

describe('VisualTestUtils', () => {
  let mockPage: Page;
  let mockTestInfo: TestInfo;

  beforeEach(() => {
    mockPage = createMockPage();
    mockTestInfo = createMockTestInfo();
  });

  describe('expectToMatchSnapshot', () => {
    it('should take screenshot and compare with baseline', async () => {
      const { VisualTestUtils } = await import('./index');
      const utils = new VisualTestUtils(mockPage, mockTestInfo);

      const mockScreenshot = Buffer.from('screenshot');
      mockPage.evaluate = vi.fn().mockResolvedValue(undefined);
      mockPage.waitForLoadState = vi.fn().mockResolvedValue(undefined);
      mockPage.waitForTimeout = vi.fn().mockResolvedValue(undefined);
      mockPage.screenshot = vi.fn().mockResolvedValue(mockScreenshot);

      await utils.expectToMatchSnapshot('test-snapshot');

      expect(mockPage.screenshot).toHaveBeenCalled();
      expect(mockTestInfo.attach).toHaveBeenCalledWith(
        'test-snapshot.png',
        expect.objectContaining({
          body: mockScreenshot,
          contentType: 'image/png',
        })
      );
    });

    it('should disable animations by default', async () => {
      const { VisualTestUtils } = await import('./index');
      const utils = new VisualTestUtils(mockPage, mockTestInfo);

      mockPage.evaluate = vi.fn().mockResolvedValue(undefined);
      mockPage.waitForLoadState = vi.fn().mockResolvedValue(undefined);
      mockPage.waitForTimeout = vi.fn().mockResolvedValue(undefined);
      mockPage.screenshot = vi.fn().mockResolvedValue(Buffer.from(''));

      await utils.expectToMatchSnapshot('test', { animations: 'disabled' });

      // Verify animation disabling script was injected
      expect(mockPage.evaluate).toHaveBeenCalled();
    });

    it('should allow animations when specified', async () => {
      const { VisualTestUtils } = await import('./index');
      const utils = new VisualTestUtils(mockPage, mockTestInfo);

      mockPage.evaluate = vi.fn().mockResolvedValue(undefined);
      mockPage.waitForLoadState = vi.fn().mockResolvedValue(undefined);
      mockPage.waitForTimeout = vi.fn().mockResolvedValue(undefined);
      mockPage.screenshot = vi.fn().mockResolvedValue(Buffer.from(''));

      await utils.expectToMatchSnapshot('test', { animations: 'allow' });

      expect(mockPage.screenshot).toHaveBeenCalled();
    });
  });

  describe('expectElementToMatchSnapshot', () => {
    it('should take element screenshot', async () => {
      const { VisualTestUtils } = await import('./index');
      const utils = new VisualTestUtils(mockPage, mockTestInfo);

      const mockScreenshot = Buffer.from('element-screenshot');
      const mockLocator = {
        waitFor: vi.fn().mockResolvedValue(undefined),
        screenshot: vi.fn().mockResolvedValue(mockScreenshot),
      };
      mockPage.locator = vi.fn().mockReturnValue(mockLocator);

      await utils.expectElementToMatchSnapshot('.button', 'button-snapshot');

      expect(mockPage.locator).toHaveBeenCalledWith('.button');
      expect(mockLocator.waitFor).toHaveBeenCalledWith({ state: 'visible' });
      expect(mockTestInfo.attach).toHaveBeenCalledWith(
        'button-snapshot.png',
        expect.objectContaining({
          body: mockScreenshot,
          contentType: 'image/png',
        })
      );
    });
  });

  describe('expectFullPageToMatchSnapshot', () => {
    it('should take full page screenshot', async () => {
      const { VisualTestUtils } = await import('./index');
      const utils = new VisualTestUtils(mockPage, mockTestInfo);

      mockPage.evaluate = vi.fn().mockResolvedValue(undefined);
      mockPage.waitForLoadState = vi.fn().mockResolvedValue(undefined);
      mockPage.waitForTimeout = vi.fn().mockResolvedValue(undefined);
      mockPage.screenshot = vi.fn().mockResolvedValue(Buffer.from(''));

      await utils.expectFullPageToMatchSnapshot('full-page');

      expect(mockPage.screenshot).toHaveBeenCalledWith(
        expect.objectContaining({
          fullPage: true,
        })
      );
    });
  });

  describe('expectResponsiveSnapshots', () => {
    it('should take screenshots at multiple viewport sizes', async () => {
      const { VisualTestUtils } = await import('./index');
      const utils = new VisualTestUtils(mockPage, mockTestInfo);

      mockPage.evaluate = vi.fn().mockResolvedValue(undefined);
      mockPage.waitForLoadState = vi.fn().mockResolvedValue(undefined);
      mockPage.waitForTimeout = vi.fn().mockResolvedValue(undefined);
      mockPage.screenshot = vi.fn().mockResolvedValue(Buffer.from(''));
      mockPage.viewportSize = vi.fn().mockReturnValue({ width: 1280, height: 720 });
      mockPage.setViewportSize = vi.fn().mockResolvedValue(undefined);

      const viewports = [
        { width: 375, height: 667, name: 'mobile' },
        { width: 768, height: 1024, name: 'tablet' },
        { width: 1920, height: 1080, name: 'desktop' },
      ];

      await utils.expectResponsiveSnapshots('responsive', viewports);

      expect(mockPage.setViewportSize).toHaveBeenCalledTimes(4); // 3 viewports + restore
      expect(mockTestInfo.attach).toHaveBeenCalledTimes(3);
    });
  });

  describe('recordVisualTimeline', () => {
    it('should record screenshots over time', async () => {
      const { VisualTestUtils } = await import('./index');
      const utils = new VisualTestUtils(mockPage, mockTestInfo);

      mockPage.screenshot = vi.fn().mockResolvedValue(Buffer.from(''));
      mockPage.waitForTimeout = vi.fn().mockResolvedValue(undefined);

      // Record for a short duration with fast interval
      vi.useFakeTimers();
      const recordPromise = utils.recordVisualTimeline('timeline', 100, 50);

      // Advance through the recording
      await vi.advanceTimersByTimeAsync(150);
      vi.useRealTimers();

      await recordPromise;

      expect(mockTestInfo.attach).toHaveBeenCalled();
    });
  });
});

// ============================================================================
// AccessibilityUtils Tests
// ============================================================================

describe('AccessibilityUtils', () => {
  let mockPage: Page;

  beforeEach(() => {
    mockPage = createMockPage();
  });

  describe('audit', () => {
    it('should run accessibility audit', async () => {
      const { AccessibilityUtils } = await import('./index');
      const utils = new AccessibilityUtils(mockPage);

      const mockResults = {
        violations: [
          {
            id: 'color-contrast',
            impact: 'serious',
            description: 'Test',
            help: 'Test help',
            helpUrl: 'https://example.com',
            nodes: [{ html: '<p>test</p>', target: ['p'], failureSummary: 'Test' }],
          },
        ],
      };

      mockPage.evaluate = vi.fn()
        .mockResolvedValueOnce(true) // axe loaded check
        .mockResolvedValueOnce(mockResults);

      const violations = await utils.audit();

      expect(violations).toHaveLength(1);
      expect(violations[0].id).toBe('color-contrast');
    });

    it('should inject axe-core if not present', async () => {
      const { AccessibilityUtils } = await import('./index');
      const utils = new AccessibilityUtils(mockPage);

      mockPage.evaluate = vi.fn()
        .mockResolvedValueOnce(false) // axe not loaded
        .mockResolvedValueOnce({ violations: [] });
      mockPage.addScriptTag = vi.fn().mockResolvedValue(undefined);

      await utils.audit();

      expect(mockPage.addScriptTag).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('axe-core'),
        })
      );
    });

    it('should filter by specific rules', async () => {
      const { AccessibilityUtils } = await import('./index');
      const utils = new AccessibilityUtils(mockPage);

      mockPage.evaluate = vi.fn()
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce({ violations: [] });

      await utils.audit({ rules: ['color-contrast', 'label'] });

      expect(mockPage.evaluate).toHaveBeenCalled();
    });

    it('should support disabled rules', async () => {
      const { AccessibilityUtils } = await import('./index');
      const utils = new AccessibilityUtils(mockPage);

      mockPage.evaluate = vi.fn()
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce({ violations: [] });

      await utils.audit({ disabledRules: ['region'] });

      expect(mockPage.evaluate).toHaveBeenCalled();
    });
  });

  describe('expectNoViolations', () => {
    it('should pass when no violations', async () => {
      const { AccessibilityUtils } = await import('./index');
      const utils = new AccessibilityUtils(mockPage);

      mockPage.evaluate = vi.fn()
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce({ violations: [] });

      await expect(utils.expectNoViolations()).resolves.not.toThrow();
    });

    it('should throw when violations found', async () => {
      const { AccessibilityUtils } = await import('./index');
      const utils = new AccessibilityUtils(mockPage);

      mockPage.evaluate = vi.fn()
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce({
          violations: [{
            id: 'test',
            impact: 'serious',
            description: 'Test',
            help: 'Test help',
            helpUrl: 'https://example.com',
            nodes: [{ html: '<p>test</p>', target: ['p'], failureSummary: 'Test' }],
          }],
        });

      await expect(utils.expectNoViolations()).rejects.toThrow('Accessibility violations found');
    });

    it('should filter by impact level', async () => {
      const { AccessibilityUtils } = await import('./index');
      const utils = new AccessibilityUtils(mockPage);

      mockPage.evaluate = vi.fn()
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce({
          violations: [{
            id: 'test',
            impact: 'minor',
            description: 'Test',
            help: 'Test help',
            helpUrl: 'https://example.com',
            nodes: [],
          }],
        });

      // Should pass because we're only checking serious/critical
      await expect(utils.expectNoViolations({ impact: ['serious', 'critical'] })).resolves.not.toThrow();
    });
  });

  describe('checkElement', () => {
    it('should check accessibility of specific element', async () => {
      const { AccessibilityUtils } = await import('./index');
      const utils = new AccessibilityUtils(mockPage);

      mockPage.evaluate = vi.fn()
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce({ violations: [] });

      const violations = await utils.checkElement('.button');

      expect(mockPage.evaluate).toHaveBeenCalled();
      expect(violations).toEqual([]);
    });
  });

  describe('verifyKeyboardNavigation', () => {
    it('should verify keyboard navigation order', async () => {
      const { AccessibilityUtils } = await import('./index');
      const utils = new AccessibilityUtils(mockPage);

      mockPage.focus = vi.fn().mockResolvedValue(undefined);
      mockPage.keyboard = {
        press: vi.fn().mockResolvedValue(undefined),
      } as any;
      mockPage.evaluate = vi.fn()
        .mockResolvedValueOnce('button1')
        .mockResolvedValueOnce('button2')
        .mockResolvedValueOnce('button3');

      const result = await utils.verifyKeyboardNavigation('#start', ['button1', 'button2', 'button3']);

      expect(result).toBe(true);
      expect(mockPage.keyboard.press).toHaveBeenCalledTimes(3);
    });

    it('should return false if navigation order is wrong', async () => {
      const { AccessibilityUtils } = await import('./index');
      const utils = new AccessibilityUtils(mockPage);

      mockPage.focus = vi.fn().mockResolvedValue(undefined);
      mockPage.keyboard = {
        press: vi.fn().mockResolvedValue(undefined),
      } as any;
      mockPage.evaluate = vi.fn()
        .mockResolvedValueOnce('button3') // Wrong order
        .mockResolvedValueOnce('button1')
        .mockResolvedValueOnce('button2');

      const result = await utils.verifyKeyboardNavigation('#start', ['button1', 'button2', 'button3']);

      expect(result).toBe(false);
    });
  });

  describe('checkFocusVisible', () => {
    it('should check focus visibility', async () => {
      const { AccessibilityUtils } = await import('./index');
      const utils = new AccessibilityUtils(mockPage);

      mockPage.focus = vi.fn().mockResolvedValue(undefined);
      mockPage.evaluate = vi.fn().mockResolvedValue(true);

      const isVisible = await utils.checkFocusVisible('.button');

      expect(mockPage.focus).toHaveBeenCalledWith('.button');
      expect(isVisible).toBe(true);
    });
  });

  describe('checkColorContrast', () => {
    it('should check color contrast', async () => {
      const { AccessibilityUtils } = await import('./index');
      const utils = new AccessibilityUtils(mockPage);

      mockPage.evaluate = vi.fn().mockResolvedValue({
        foreground: 'rgb(0, 0, 0)',
        background: 'rgb(255, 255, 255)',
        ratio: 21,
        passes: { aa: true, aaa: true },
      });

      const result = await utils.checkColorContrast('.text');

      expect(result.ratio).toBe(21);
      expect(result.passes.aa).toBe(true);
      expect(result.passes.aaa).toBe(true);
    });
  });

  describe('checkAriaAttributes', () => {
    it('should check ARIA attributes', async () => {
      const { AccessibilityUtils } = await import('./index');
      const utils = new AccessibilityUtils(mockPage);

      mockPage.evaluate = vi.fn().mockResolvedValue({
        role: 'button',
        label: 'Submit form',
        describedBy: 'description',
        expanded: null,
        selected: null,
        hidden: null,
        live: null,
      });

      const attrs = await utils.checkAriaAttributes('.button');

      expect(attrs.role).toBe('button');
      expect(attrs.label).toBe('Submit form');
    });
  });
});

// ============================================================================
// PerformanceUtils Tests
// ============================================================================

describe('PerformanceUtils', () => {
  let mockPage: Page;

  beforeEach(() => {
    mockPage = createMockPage();
  });

  describe('getWebVitals', () => {
    it('should get Core Web Vitals', async () => {
      const { PerformanceUtils } = await import('./index');
      const utils = new PerformanceUtils(mockPage);

      const mockMetrics: PerformanceMetrics = {
        ttfb: 150,
        fcp: 1200,
        lcp: 2500,
        fid: 0,
        cls: 0.05,
        tti: 0,
        tbt: 0,
        domContentLoaded: 1800,
        load: 3000,
        jsHeapSize: 15000000,
        layoutCount: 0,
        recalcStyleCount: 0,
        paintCount: 2,
      };

      mockPage.evaluate = vi.fn().mockResolvedValue(mockMetrics);

      const metrics = await utils.getWebVitals();

      expect(metrics.ttfb).toBe(150);
      expect(metrics.fcp).toBe(1200);
      expect(metrics.lcp).toBe(2500);
      expect(metrics.cls).toBe(0.05);
    });
  });

  describe('startMeasurement and endMeasurement', () => {
    it('should measure performance', async () => {
      const { PerformanceUtils } = await import('./index');
      const utils = new PerformanceUtils(mockPage);

      mockPage.evaluate = vi.fn()
        .mockResolvedValueOnce(undefined) // startMeasurement
        .mockResolvedValueOnce(250); // endMeasurement

      await utils.startMeasurement('test');
      const duration = await utils.endMeasurement('test');

      expect(duration).toBe(250);
    });
  });

  describe('measureRender', () => {
    it('should measure render time', async () => {
      const { PerformanceUtils } = await import('./index');
      const utils = new PerformanceUtils(mockPage);

      mockPage.evaluate = vi.fn()
        .mockResolvedValueOnce(undefined) // start
        .mockResolvedValueOnce(100); // end

      const action = vi.fn().mockResolvedValue(undefined);
      const duration = await utils.measureRender(action);

      expect(action).toHaveBeenCalled();
      expect(duration).toBe(100);
    });
  });

  describe('getResourceTiming', () => {
    it('should get resource timing data', async () => {
      const { PerformanceUtils } = await import('./index');
      const utils = new PerformanceUtils(mockPage);

      const mockResources = [
        { name: '/app.js', type: 'script', duration: 200, size: 50000 },
        { name: '/styles.css', type: 'link', duration: 50, size: 10000 },
      ];
      mockPage.evaluate = vi.fn().mockResolvedValue(mockResources);

      const resources = await utils.getResourceTiming();

      expect(resources).toHaveLength(2);
      expect(resources[0].name).toBe('/app.js');
    });
  });

  describe('getLongTasks', () => {
    it('should get long tasks', async () => {
      const { PerformanceUtils } = await import('./index');
      const utils = new PerformanceUtils(mockPage);

      const mockTasks = [
        { duration: 100, startTime: 500 },
        { duration: 200, startTime: 1000 },
      ];
      mockPage.evaluate = vi.fn().mockResolvedValue(mockTasks);

      const tasks = await utils.getLongTasks();

      expect(tasks).toHaveLength(2);
      expect(tasks[0].duration).toBe(100);
    });
  });

  describe('monitorLongTasks', () => {
    it('should monitor long tasks during action', async () => {
      const { PerformanceUtils } = await import('./index');
      const utils = new PerformanceUtils(mockPage);

      mockPage.evaluate = vi.fn()
        .mockResolvedValueOnce([{ duration: 50, startTime: 0 }]) // before
        .mockResolvedValueOnce([{ duration: 50, startTime: 0 }, { duration: 150, startTime: 100 }]); // after

      const action = vi.fn().mockResolvedValue(undefined);
      const totalDuration = await utils.monitorLongTasks(action);

      expect(totalDuration).toBe(150);
    });
  });

  describe('getBundleSize', () => {
    it('should calculate bundle sizes by type', async () => {
      const { PerformanceUtils } = await import('./index');
      const utils = new PerformanceUtils(mockPage);

      mockPage.evaluate = vi.fn().mockResolvedValue([
        { name: '/app.js', type: 'script', duration: 100, size: 50000 },
        { name: '/vendor.js', type: 'script', duration: 200, size: 100000 },
        { name: '/styles.css', type: 'link', duration: 50, size: 10000 },
        { name: '/logo.png', type: 'img', duration: 30, size: 5000 },
      ]);

      const bundle = await utils.getBundleSize();

      expect(bundle.total).toBe(165000);
      expect(bundle.js).toBe(150000);
      expect(bundle.css).toBe(10000);
      expect(bundle.images).toBe(5000);
    });
  });

  describe('runAudit', () => {
    it('should run lighthouse-style audit', async () => {
      const { PerformanceUtils } = await import('./index');
      const utils = new PerformanceUtils(mockPage);

      mockPage.evaluate = vi.fn().mockResolvedValue({
        ttfb: 100,
        fcp: 1000,
        lcp: 2000,
        fid: 50,
        cls: 0.1,
        tti: 3000,
        tbt: 100,
        domContentLoaded: 1500,
        load: 2500,
        jsHeapSize: 10000000,
        layoutCount: 0,
        recalcStyleCount: 0,
        paintCount: 2,
      });

      const audit = await utils.runAudit();

      expect(audit.performance).toBeGreaterThanOrEqual(0);
      expect(audit.performance).toBeLessThanOrEqual(100);
      expect(audit.fcp).toBe(1000);
      expect(audit.lcp).toBe(2000);
    });
  });

  describe('assertBudget', () => {
    it('should pass when within budget', async () => {
      const { PerformanceUtils } = await import('./index');
      const utils = new PerformanceUtils(mockPage);

      mockPage.evaluate = vi.fn()
        .mockResolvedValueOnce({
          ttfb: 100,
          fcp: 1000,
          lcp: 2000,
          fid: 50,
          cls: 0.05,
          tti: 3000,
          tbt: 100,
          domContentLoaded: 1500,
          load: 2500,
          jsHeapSize: 10000000,
          layoutCount: 0,
          recalcStyleCount: 0,
          paintCount: 2,
        })
        .mockResolvedValueOnce([{ name: '/app.js', type: 'script', duration: 100, size: 50000 }]);

      await expect(utils.assertBudget({
        fcp: 2000,
        lcp: 3000,
        cls: 0.1,
        bundleSize: 100000,
      })).resolves.not.toThrow();
    });

    it('should throw when budget exceeded', async () => {
      const { PerformanceUtils } = await import('./index');
      const utils = new PerformanceUtils(mockPage);

      mockPage.evaluate = vi.fn()
        .mockResolvedValueOnce({
          ttfb: 100,
          fcp: 5000, // Exceeds budget
          lcp: 2000,
          fid: 50,
          cls: 0.05,
          tti: 3000,
          tbt: 100,
          domContentLoaded: 1500,
          load: 2500,
          jsHeapSize: 10000000,
          layoutCount: 0,
          recalcStyleCount: 0,
          paintCount: 2,
        })
        .mockResolvedValueOnce([]);

      await expect(utils.assertBudget({ fcp: 2000 })).rejects.toThrow('Performance budget exceeded');
    });
  });
});

// ============================================================================
// NetworkUtils Tests
// ============================================================================

describe('NetworkUtils', () => {
  let mockPage: Page;

  beforeEach(() => {
    mockPage = createMockPage();
  });

  describe('mock', () => {
    it('should mock route with response options', async () => {
      const { NetworkUtils } = await import('./index');
      const utils = new NetworkUtils(mockPage);

      mockPage.route = vi.fn().mockResolvedValue(undefined);

      await utils.mock('**/api/users', {
        status: 200,
        body: { users: [] },
      });

      expect(mockPage.route).toHaveBeenCalledWith('**/api/users', expect.any(Function));
    });

    it('should mock route with function handler', async () => {
      const { NetworkUtils } = await import('./index');
      const utils = new NetworkUtils(mockPage);

      mockPage.route = vi.fn().mockResolvedValue(undefined);

      const handler = vi.fn();
      await utils.mock('**/api/users', handler);

      expect(mockPage.route).toHaveBeenCalledWith('**/api/users', expect.any(Function));
    });
  });

  describe('mockApi', () => {
    it('should mock API endpoint', async () => {
      const { NetworkUtils } = await import('./index');
      const utils = new NetworkUtils(mockPage);

      mockPage.route = vi.fn().mockResolvedValue(undefined);

      await utils.mockApi('/users', { users: [] });

      expect(mockPage.route).toHaveBeenCalledWith('**/api/users', expect.any(Function));
    });

    it('should accept options for API mock', async () => {
      const { NetworkUtils } = await import('./index');
      const utils = new NetworkUtils(mockPage);

      mockPage.route = vi.fn().mockResolvedValue(undefined);

      await utils.mockApi('/users', { error: 'Not found' }, { status: 404, delay: 100 });

      expect(mockPage.route).toHaveBeenCalled();
    });
  });

  describe('mockGraphQL', () => {
    it('should mock GraphQL query', async () => {
      const { NetworkUtils } = await import('./index');
      const utils = new NetworkUtils(mockPage);

      mockPage.route = vi.fn().mockResolvedValue(undefined);

      await utils.mockGraphQL('GetUsers', { users: [] });

      expect(mockPage.route).toHaveBeenCalledWith('**/graphql', expect.any(Function));
    });
  });

  describe('simulateError', () => {
    it('should simulate network error', async () => {
      const { NetworkUtils } = await import('./index');
      const utils = new NetworkUtils(mockPage);

      mockPage.route = vi.fn().mockResolvedValue(undefined);

      await utils.simulateError('**/api/users');

      expect(mockPage.route).toHaveBeenCalledWith('**/api/users', expect.any(Function));
    });
  });

  describe('simulateSlowNetwork', () => {
    it('should simulate slow network', async () => {
      const { NetworkUtils } = await import('./index');
      const utils = new NetworkUtils(mockPage);

      mockPage.route = vi.fn().mockResolvedValue(undefined);

      await utils.simulateSlowNetwork(1000);

      expect(mockPage.route).toHaveBeenCalledWith('**/*', expect.any(Function));
    });
  });

  describe('goOffline and goOnline', () => {
    it('should go offline', async () => {
      const { NetworkUtils } = await import('./index');
      const utils = new NetworkUtils(mockPage);

      const mockContext = {
        setOffline: vi.fn().mockResolvedValue(undefined),
      };
      mockPage.context = vi.fn().mockReturnValue(mockContext);

      await utils.goOffline();

      expect(mockContext.setOffline).toHaveBeenCalledWith(true);
    });

    it('should go online', async () => {
      const { NetworkUtils } = await import('./index');
      const utils = new NetworkUtils(mockPage);

      const mockContext = {
        setOffline: vi.fn().mockResolvedValue(undefined),
      };
      mockPage.context = vi.fn().mockReturnValue(mockContext);

      await utils.goOnline();

      expect(mockContext.setOffline).toHaveBeenCalledWith(false);
    });
  });

  describe('waitForRequest', () => {
    it('should wait for request', async () => {
      const { NetworkUtils } = await import('./index');
      const utils = new NetworkUtils(mockPage);

      const mockRequest = { url: () => '/api/users' };
      mockPage.waitForRequest = vi.fn().mockResolvedValue(mockRequest);

      const request = await utils.waitForRequest('**/api/users');

      expect(request.url()).toBe('/api/users');
    });
  });

  describe('waitForResponse', () => {
    it('should wait for response', async () => {
      const { NetworkUtils } = await import('./index');
      const utils = new NetworkUtils(mockPage);

      const mockResponse = { status: () => 200 };
      mockPage.waitForResponse = vi.fn().mockResolvedValue(mockResponse);

      const response = await utils.waitForResponse('**/api/users');

      expect(response.status()).toBe(200);
    });
  });

  describe('captureRequests', () => {
    it('should capture requests during action', async () => {
      const { NetworkUtils } = await import('./index');
      const utils = new NetworkUtils(mockPage);

      mockPage.on = vi.fn();
      mockPage.off = vi.fn();

      const action = vi.fn().mockResolvedValue(undefined);
      await utils.captureRequests(action);

      expect(mockPage.on).toHaveBeenCalledWith('request', expect.any(Function));
      expect(mockPage.off).toHaveBeenCalledWith('request', expect.any(Function));
      expect(action).toHaveBeenCalled();
    });
  });

  describe('clearMocks', () => {
    it('should clear all mocked routes', async () => {
      const { NetworkUtils } = await import('./index');
      const utils = new NetworkUtils(mockPage);

      mockPage.unrouteAll = vi.fn().mockResolvedValue(undefined);

      await utils.clearMocks();

      expect(mockPage.unrouteAll).toHaveBeenCalled();
    });
  });

  describe('intercept', () => {
    it('should intercept and modify request', async () => {
      const { NetworkUtils } = await import('./index');
      const utils = new NetworkUtils(mockPage);

      mockPage.route = vi.fn().mockResolvedValue(undefined);

      await utils.intercept('**/api/**', (request) => ({
        headers: { 'Authorization': 'Bearer token' },
      }));

      expect(mockPage.route).toHaveBeenCalledWith('**/api/**', expect.any(Function));
    });
  });
});

// ============================================================================
// TimeUtils Tests
// ============================================================================

describe('TimeUtils', () => {
  let mockPage: Page;

  beforeEach(() => {
    mockPage = createMockPage();
  });

  describe('freeze', () => {
    it('should freeze time at specific moment', async () => {
      const { TimeUtils } = await import('./index');
      const utils = new TimeUtils(mockPage);

      mockPage.addInitScript = vi.fn().mockResolvedValue(undefined);

      const frozenDate = new Date('2024-01-01');
      await utils.freeze(frozenDate);

      expect(mockPage.addInitScript).toHaveBeenCalledWith(
        expect.stringContaining(frozenDate.getTime().toString())
      );
    });

    it('should freeze time at current moment if no date provided', async () => {
      const { TimeUtils } = await import('./index');
      const utils = new TimeUtils(mockPage);

      mockPage.addInitScript = vi.fn().mockResolvedValue(undefined);

      await utils.freeze();

      expect(mockPage.addInitScript).toHaveBeenCalled();
    });
  });

  describe('unfreeze', () => {
    it('should unfreeze time', async () => {
      const { TimeUtils } = await import('./index');
      const utils = new TimeUtils(mockPage);

      mockPage.addInitScript = vi.fn().mockResolvedValue(undefined);
      mockPage.reload = vi.fn().mockResolvedValue(undefined);

      await utils.unfreeze();

      expect(mockPage.reload).toHaveBeenCalled();
    });
  });

  describe('advance', () => {
    it('should advance time by milliseconds', async () => {
      const { TimeUtils } = await import('./index');
      const utils = new TimeUtils(mockPage);

      mockPage.evaluate = vi.fn().mockResolvedValue(undefined);

      await utils.advance(1000);

      expect(mockPage.evaluate).toHaveBeenCalled();
    });
  });

  describe('setSpeed', () => {
    it('should set playback speed', async () => {
      const { TimeUtils } = await import('./index');
      const utils = new TimeUtils(mockPage);

      mockPage.evaluate = vi.fn().mockResolvedValue(undefined);

      await utils.setSpeed(2);

      expect(mockPage.evaluate).toHaveBeenCalledWith(expect.any(Function), 2);
    });
  });

  describe('runAllTimers', () => {
    it('should run all pending timers', async () => {
      const { TimeUtils } = await import('./index');
      const utils = new TimeUtils(mockPage);

      mockPage.evaluate = vi.fn().mockResolvedValue(undefined);

      await utils.runAllTimers();

      expect(mockPage.evaluate).toHaveBeenCalled();
    });
  });

  describe('runOnlyPendingTimers', () => {
    it('should run only pending timers', async () => {
      const { TimeUtils } = await import('./index');
      const utils = new TimeUtils(mockPage);

      mockPage.evaluate = vi.fn().mockResolvedValue(undefined);

      await utils.runOnlyPendingTimers();

      expect(mockPage.evaluate).toHaveBeenCalled();
    });
  });

  describe('advanceTimersByTime', () => {
    it('should advance timers by time', async () => {
      const { TimeUtils } = await import('./index');
      const utils = new TimeUtils(mockPage);

      mockPage.evaluate = vi.fn().mockResolvedValue(undefined);

      await utils.advanceTimersByTime(1000);

      expect(mockPage.evaluate).toHaveBeenCalledTimes(2); // advance + runOnlyPendingTimers
    });
  });

  describe('getCurrentTime', () => {
    it('should get current mocked time', async () => {
      const { TimeUtils } = await import('./index');
      const utils = new TimeUtils(mockPage);

      const mockTime = Date.now();
      mockPage.evaluate = vi.fn().mockResolvedValue(mockTime);

      const time = await utils.getCurrentTime();

      expect(time).toBe(mockTime);
    });
  });

  describe('useFakeTimers', () => {
    it('should enable fake timers', async () => {
      const { TimeUtils } = await import('./index');
      const utils = new TimeUtils(mockPage);

      mockPage.addInitScript = vi.fn().mockResolvedValue(undefined);

      await utils.useFakeTimers();

      expect(mockPage.addInitScript).toHaveBeenCalledWith(
        expect.stringContaining('__PHILJS_PENDING_TIMERS__')
      );
    });
  });

  describe('useRealTimers', () => {
    it('should restore real timers', async () => {
      const { TimeUtils } = await import('./index');
      const utils = new TimeUtils(mockPage);

      mockPage.evaluate = vi.fn().mockResolvedValue(undefined);
      mockPage.reload = vi.fn().mockResolvedValue(undefined);

      await utils.useRealTimers();

      expect(mockPage.reload).toHaveBeenCalled();
    });
  });
});

// ============================================================================
// Fixtures Factory Tests
// ============================================================================

describe('createPhilJSFixtures', () => {
  it('should create fixture definitions', async () => {
    const { createPhilJSFixtures } = await import('./index');

    const fixtures = createPhilJSFixtures();

    expect(fixtures).toHaveProperty('philjs');
    expect(fixtures).toHaveProperty('visual');
    expect(fixtures).toHaveProperty('a11y');
    expect(fixtures).toHaveProperty('performance');
    expect(fixtures).toHaveProperty('network');
    expect(fixtures).toHaveProperty('time');
    expect(typeof fixtures.philjs).toBe('function');
    expect(typeof fixtures.visual).toBe('function');
    expect(typeof fixtures.a11y).toBe('function');
    expect(typeof fixtures.performance).toBe('function');
    expect(typeof fixtures.network).toBe('function');
    expect(typeof fixtures.time).toBe('function');
  });
});

// ============================================================================
// PhilJSPageObject Tests
// ============================================================================

describe('PhilJSPageObject', () => {
  let mockPage: Page;

  beforeEach(() => {
    mockPage = createMockPage();
  });

  it('should provide locator helpers', async () => {
    const { PhilJSPageObject } = await import('./index');

    class TestPage extends PhilJSPageObject {
      async goto(): Promise<void> {
        await this.page.goto('/test');
      }
    }

    const testPage = new TestPage(mockPage);

    mockPage.getByTestId = vi.fn().mockReturnValue({ click: vi.fn() });
    mockPage.getByRole = vi.fn().mockReturnValue({ click: vi.fn() });
    mockPage.getByText = vi.fn().mockReturnValue({ click: vi.fn() });
    mockPage.getByLabel = vi.fn().mockReturnValue({ click: vi.fn() });
    mockPage.getByPlaceholder = vi.fn().mockReturnValue({ click: vi.fn() });

    testPage.getByTestId('submit-button');
    testPage.getByRole('button', { name: 'Submit' });
    testPage.getByText('Submit');
    testPage.getByLabel('Email');
    testPage.getByPlaceholder('Enter email');

    expect(mockPage.getByTestId).toHaveBeenCalledWith('submit-button');
    expect(mockPage.getByRole).toHaveBeenCalledWith('button', { name: 'Submit' });
    expect(mockPage.getByText).toHaveBeenCalledWith('Submit');
    expect(mockPage.getByLabel).toHaveBeenCalledWith('Email');
    expect(mockPage.getByPlaceholder).toHaveBeenCalledWith('Enter email');
  });

  it('should wait for page ready', async () => {
    const { PhilJSPageObject } = await import('./index');

    class TestPage extends PhilJSPageObject {
      async goto(): Promise<void> {
        await this.page.goto('/test');
      }
    }

    const testPage = new TestPage(mockPage);

    mockPage.waitForFunction = vi.fn().mockResolvedValue(undefined);

    await testPage.waitForReady();

    expect(mockPage.waitForFunction).toHaveBeenCalled();
  });

  it('should take screenshot', async () => {
    const { PhilJSPageObject } = await import('./index');

    class TestPage extends PhilJSPageObject {
      async goto(): Promise<void> {
        await this.page.goto('/test');
      }
    }

    const testPage = new TestPage(mockPage);

    const mockScreenshot = Buffer.from('screenshot');
    mockPage.screenshot = vi.fn().mockResolvedValue(mockScreenshot);

    const screenshot = await testPage.screenshot('test');

    expect(mockPage.screenshot).toHaveBeenCalledWith({ path: 'screenshots/test.png' });
    expect(screenshot).toBe(mockScreenshot);
  });
});

// ============================================================================
// Component Testing Utilities Tests
// ============================================================================

describe('Component Testing Utilities', () => {
  let mockPage: Page;

  beforeEach(() => {
    mockPage = createMockPage();
  });

  describe('mount', () => {
    it('should mount component for testing', async () => {
      const { mount } = await import('./index');

      mockPage.setContent = vi.fn().mockResolvedValue(undefined);
      mockPage.waitForFunction = vi.fn().mockResolvedValue(undefined);
      mockPage.locator = vi.fn().mockReturnValue({ click: vi.fn() });

      const locator = await mount(mockPage, 'Counter', { initial: 0 });

      expect(mockPage.setContent).toHaveBeenCalledWith(
        expect.stringContaining('Component Test')
      );
      expect(mockPage.waitForFunction).toHaveBeenCalled();
      expect(mockPage.locator).toHaveBeenCalledWith('#root');
    });

    it('should accept function component', async () => {
      const { mount } = await import('./index');

      mockPage.setContent = vi.fn().mockResolvedValue(undefined);
      mockPage.waitForFunction = vi.fn().mockResolvedValue(undefined);
      mockPage.locator = vi.fn().mockReturnValue({ click: vi.fn() });

      const Component = (props: { count: number }) => `<div>${props.count}</div>`;
      await mount(mockPage, Component, { count: 5 });

      expect(mockPage.setContent).toHaveBeenCalled();
    });

    it('should include styles and scripts', async () => {
      const { mount } = await import('./index');

      mockPage.setContent = vi.fn().mockResolvedValue(undefined);
      mockPage.waitForFunction = vi.fn().mockResolvedValue(undefined);
      mockPage.locator = vi.fn().mockReturnValue({ click: vi.fn() });

      await mount(mockPage, 'Counter', {}, {
        styles: ['/styles.css'],
        scripts: ['/vendor.js'],
      });

      expect(mockPage.setContent).toHaveBeenCalledWith(
        expect.stringContaining('styles.css')
      );
      expect(mockPage.setContent).toHaveBeenCalledWith(
        expect.stringContaining('vendor.js')
      );
    });
  });

  describe('createComponentHarness', () => {
    it('should create component harness', async () => {
      const { createComponentHarness } = await import('./index');

      mockPage.setContent = vi.fn().mockResolvedValue(undefined);
      mockPage.waitForFunction = vi.fn().mockResolvedValue(undefined);
      mockPage.locator = vi.fn().mockReturnValue({ click: vi.fn() });
      mockPage.evaluate = vi.fn().mockResolvedValue(undefined);

      const harness = createComponentHarness(mockPage, 'Counter');

      expect(harness).toHaveProperty('render');
      expect(harness).toHaveProperty('rerender');
      expect(harness).toHaveProperty('unmount');
      expect(harness).toHaveProperty('philjs');
    });

    it('should render component through harness', async () => {
      const { createComponentHarness } = await import('./index');

      mockPage.setContent = vi.fn().mockResolvedValue(undefined);
      mockPage.waitForFunction = vi.fn().mockResolvedValue(undefined);
      mockPage.locator = vi.fn().mockReturnValue({ click: vi.fn() });

      const harness = createComponentHarness(mockPage, 'Counter');
      await harness.render({ initial: 0 });

      expect(mockPage.setContent).toHaveBeenCalled();
    });

    it('should rerender component through harness', async () => {
      const { createComponentHarness } = await import('./index');

      mockPage.setContent = vi.fn().mockResolvedValue(undefined);
      mockPage.waitForFunction = vi.fn().mockResolvedValue(undefined);
      mockPage.locator = vi.fn().mockReturnValue({ click: vi.fn() });
      mockPage.evaluate = vi.fn().mockResolvedValue(undefined);

      const harness = createComponentHarness(mockPage, 'Counter');
      await harness.rerender({ initial: 5 });

      expect(mockPage.evaluate).toHaveBeenCalled();
    });

    it('should unmount component through harness', async () => {
      const { createComponentHarness } = await import('./index');

      mockPage.setContent = vi.fn().mockResolvedValue(undefined);
      mockPage.waitForFunction = vi.fn().mockResolvedValue(undefined);
      mockPage.locator = vi.fn().mockReturnValue({ click: vi.fn() });
      mockPage.evaluate = vi.fn().mockResolvedValue(undefined);

      const harness = createComponentHarness(mockPage, 'Counter');
      await harness.unmount();

      expect(mockPage.evaluate).toHaveBeenCalled();
    });
  });
});

// ============================================================================
// Custom Assertions Tests
// ============================================================================

describe('philjsMatchers', () => {
  let mockPage: Page;

  beforeEach(() => {
    mockPage = createMockPage();
  });

  describe('toHaveSignalValue', () => {
    it('should pass when signal has expected value', async () => {
      const { philjsMatchers } = await import('./index');

      mockPage.evaluate = vi.fn().mockResolvedValue(42);

      const result = await philjsMatchers.toHaveSignalValue(mockPage, 'count', 42);

      expect(result.pass).toBe(true);
    });

    it('should fail when signal has different value', async () => {
      const { philjsMatchers } = await import('./index');

      mockPage.evaluate = vi.fn().mockResolvedValue(42);

      const result = await philjsMatchers.toHaveSignalValue(mockPage, 'count', 100);

      expect(result.pass).toBe(false);
      expect(result.message()).toContain('Expected signal');
    });
  });

  describe('toBeHydrated', () => {
    it('should pass when page is hydrated', async () => {
      const { philjsMatchers } = await import('./index');

      mockPage.evaluate = vi.fn().mockResolvedValue(true);

      const result = await philjsMatchers.toBeHydrated(mockPage);

      expect(result.pass).toBe(true);
    });

    it('should fail when page is not hydrated', async () => {
      const { philjsMatchers } = await import('./index');

      mockPage.evaluate = vi.fn().mockResolvedValue(false);

      const result = await philjsMatchers.toBeHydrated(mockPage);

      expect(result.pass).toBe(false);
      expect(result.message()).toContain('hydrated');
    });
  });

  describe('toHaveNoA11yViolations', () => {
    it('should pass when no violations', async () => {
      const { philjsMatchers } = await import('./index');

      mockPage.evaluate = vi.fn()
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce({ violations: [] });

      const result = await philjsMatchers.toHaveNoA11yViolations(mockPage);

      expect(result.pass).toBe(true);
    });

    it('should fail when violations found', async () => {
      const { philjsMatchers } = await import('./index');

      mockPage.evaluate = vi.fn()
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce({
          violations: [{
            id: 'test',
            impact: 'serious',
            description: 'Test',
            help: 'Test help',
            helpUrl: 'https://example.com',
            nodes: [],
          }],
        });

      const result = await philjsMatchers.toHaveNoA11yViolations(mockPage);

      expect(result.pass).toBe(false);
    });

    it('should filter by impact level', async () => {
      const { philjsMatchers } = await import('./index');

      mockPage.evaluate = vi.fn()
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce({
          violations: [{
            id: 'test',
            impact: 'minor',
            description: 'Test',
            help: 'Test help',
            helpUrl: 'https://example.com',
            nodes: [],
          }],
        });

      // Should pass because only checking 'serious'
      const result = await philjsMatchers.toHaveNoA11yViolations(mockPage, { impact: ['serious'] });

      expect(result.pass).toBe(true);
    });
  });

  describe('toHavePerformanceWithinBudget', () => {
    it('should pass when within budget', async () => {
      const { philjsMatchers } = await import('./index');

      mockPage.evaluate = vi.fn().mockResolvedValue({
        ttfb: 100,
        fcp: 1000,
        lcp: 2000,
        fid: 50,
        cls: 0.05,
        tti: 3000,
        tbt: 100,
        domContentLoaded: 1500,
        load: 2500,
        jsHeapSize: 10000000,
        layoutCount: 0,
        recalcStyleCount: 0,
        paintCount: 2,
      });

      const result = await philjsMatchers.toHavePerformanceWithinBudget(mockPage, {
        fcp: 2000,
        lcp: 3000,
        cls: 0.1,
      });

      expect(result.pass).toBe(true);
    });

    it('should fail when budget exceeded', async () => {
      const { philjsMatchers } = await import('./index');

      mockPage.evaluate = vi.fn().mockResolvedValue({
        ttfb: 100,
        fcp: 5000,
        lcp: 2000,
        fid: 50,
        cls: 0.05,
        tti: 3000,
        tbt: 100,
        domContentLoaded: 1500,
        load: 2500,
        jsHeapSize: 10000000,
        layoutCount: 0,
        recalcStyleCount: 0,
        paintCount: 2,
      });

      const result = await philjsMatchers.toHavePerformanceWithinBudget(mockPage, {
        fcp: 2000,
      });

      expect(result.pass).toBe(false);
      expect(result.message()).toContain('FCP');
    });
  });
});

// ============================================================================
// Helper Functions
// ============================================================================

function createMockPage(): Page {
  return {
    evaluate: vi.fn(),
    waitForFunction: vi.fn(),
    waitForLoadState: vi.fn(),
    waitForTimeout: vi.fn(),
    waitForRequest: vi.fn(),
    waitForResponse: vi.fn(),
    screenshot: vi.fn(),
    setContent: vi.fn(),
    setViewportSize: vi.fn(),
    viewportSize: vi.fn(),
    locator: vi.fn(),
    getByTestId: vi.fn(),
    getByRole: vi.fn(),
    getByText: vi.fn(),
    getByLabel: vi.fn(),
    getByPlaceholder: vi.fn(),
    focus: vi.fn(),
    keyboard: { press: vi.fn() },
    route: vi.fn(),
    unrouteAll: vi.fn(),
    context: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    goto: vi.fn(),
    addInitScript: vi.fn(),
    addScriptTag: vi.fn(),
    reload: vi.fn(),
    exposeFunction: vi.fn(),
  } as unknown as Page;
}

function createMockTestInfo(): TestInfo {
  return {
    attach: vi.fn().mockResolvedValue(undefined),
  } as unknown as TestInfo;
}
