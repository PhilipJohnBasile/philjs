/**
 * Resumability Tests
 *
 * Tests for Qwik-style resumability support in PhilJS SSR.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  // QRL functions
  qrl,
  qrlChunk,
  isQRL,
  resolveQRL,
  qrlRegistry,
  $,
  $$,
  $closure,

  // State serialization
  resumable,
  useResumable,
  resumableComputed,
  serializeState,
  deserializeState,
  resumeFromState,
  clearSerializedState,

  // Event listeners
  on,
  serializeListeners,
  resumeListeners,

  // Component boundaries
  boundary,
  serializeBoundaries,
  getBoundary,

  // Resumable app
  createResumableApp,

  // Context
  createResumableContext,
  serializeContext,
  resumeContext,
  injectResumableState,
  extractResumableState,

  // Closure serialization
  serializeClosure,
  deserializeClosureVars,

  // Utilities
  getResumabilityStats,
  isResuming,
  hasResumed,
  hasResumableState,
  enableResumability,
  onResume,

  // Types
  type QRL,
  type ResumableState,
  type ResumableContext,
  type ComponentBoundary,
} from './resumability.js';

// Mock window and document for browser-like tests
const mockWindow = () => {
  (global as any).window = {
    __PHILJS_RESUMABLE_STATE__: undefined,
    __PHILJS_RESUMING__: undefined,
    __PHILJS_RESUMED__: undefined,
  };
};

const mockDocument = () => {
  const listeners: Record<string, Function[]> = {};
  (global as any).document = {
    getElementById: vi.fn().mockReturnValue(null),
    querySelectorAll: vi.fn().mockReturnValue([]),
    addEventListener: vi.fn((event, handler) => {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(handler);
    }),
    body: {},
  };
  return { listeners };
};

const cleanupGlobals = () => {
  delete (global as any).window;
  delete (global as any).document;
};

describe('Resumability', () => {
  beforeEach(() => {
    clearSerializedState();
    cleanupGlobals();
  });

  afterEach(() => {
    clearSerializedState();
    cleanupGlobals();
  });

  describe('QRL (Qwik Resource Locator)', () => {
    it('should create a QRL from a function', () => {
      const handler = () => console.log('clicked');
      const qrlRef = qrl(handler, 'handleClick');

      expect(qrlRef.__qrl__).toBe(true);
      expect(qrlRef.symbol).toBe('handleClick');
      expect(qrlRef.chunk).toBe('inline');
      expect(qrlRef.exportName).toBe('default');
      expect(qrlRef.resolved).toBe(handler);
    });

    it('should create a QRL with captured state', () => {
      const userId = 123;
      const handler = () => fetchUser(userId);
      const qrlRef = qrl(handler, 'fetchUserHandler', { userId });

      expect(qrlRef.capturedState).toEqual({ userId: 123 });
    });

    it('should check if value is a QRL', () => {
      const qrlRef = qrl(() => {}, 'test');
      const notQrl = { symbol: 'fake' };

      expect(isQRL(qrlRef)).toBe(true);
      expect(isQRL(notQrl)).toBe(false);
      expect(isQRL(null)).toBe(false);
      expect(isQRL('string')).toBe(false);
    });

    it('should resolve inline QRLs immediately', async () => {
      const handler = vi.fn(() => 'result');
      const qrlRef = qrl(handler, 'immediateHandler');

      const resolved = await resolveQRL(qrlRef);
      expect(resolved).toBe(handler);

      const result = resolved();
      expect(result).toBe('result');
      expect(handler).toHaveBeenCalled();
    });

    it('should create a QRL with chunk path for code splitting', () => {
      const qrlRef = qrlChunk('/chunks/handlers.js', 'handleSubmit', 'submitHandler');

      expect(qrlRef.chunk).toBe('/chunks/handlers.js');
      expect(qrlRef.exportName).toBe('handleSubmit');
      expect(qrlRef.symbol).toBe('submitHandler');
    });

    it('should serialize QRLs', () => {
      qrl(() => {}, 'handler1');
      qrl(() => {}, 'handler2', { data: 'test' });

      const serialized = qrlRegistry.serialize();

      expect(serialized).toHaveLength(2);
      expect(serialized[0].symbol).toBe('handler1');
      expect(serialized[1].symbol).toBe('handler2');
      expect(serialized[1].capturedState).toEqual({ data: 'test' });
    });

    it('should restore QRLs from serialized data', () => {
      const data = [
        { symbol: 'restored1', chunk: '/chunk1.js', exportName: 'handler1' },
        { symbol: 'restored2', chunk: '/chunk2.js', exportName: 'handler2', capturedState: { id: 1 } },
      ];

      qrlRegistry.restore(data);

      const qrl1 = qrlRegistry.get('restored1');
      const qrl2 = qrlRegistry.get('restored2');

      expect(qrl1).toBeDefined();
      expect(qrl1?.chunk).toBe('/chunk1.js');
      expect(qrl2?.capturedState).toEqual({ id: 1 });
    });
  });

  describe('$ Prefix Functions', () => {
    it('should create an anonymous QRL with $', () => {
      const qrlRef = $(() => console.log('lazy'));

      expect(isQRL(qrlRef)).toBe(true);
      expect(qrlRef.symbol).toMatch(/^\$_\d+_[a-z0-9]+$/);
    });

    it('should create a named QRL with $$', () => {
      const qrlRef = $$('namedHandler', () => console.log('named'));

      expect(qrlRef.symbol).toBe('namedHandler');
    });

    it('should create a QRL with closure state using $closure', () => {
      const userId = 42;
      const qrlRef = $closure(() => fetchUser(userId), { userId });

      expect(qrlRef.capturedState).toEqual({ userId: 42 });
      expect(qrlRef.symbol).toMatch(/^\$closure_\d+_[a-z0-9]+$/);
    });
  });

  describe('State Serialization', () => {
    it('should create a resumable signal', () => {
      const count = resumable(0, { id: 'counter' });

      expect(count()).toBe(0);
      count.set(5);
      expect(count()).toBe(5);
    });

    it('should create a resumable signal with useResumable', () => {
      const name = useResumable('initial', { id: 'name' });

      expect(name()).toBe('initial');
      name.set('updated');
      expect(name()).toBe('updated');
    });

    it('should serialize state to JSON', () => {
      const count = resumable(42, { id: 'testCount' });
      const name = resumable('hello', { id: 'testName' });

      const serialized = serializeState();
      const parsed = JSON.parse(serialized);

      expect(parsed.testCount).toBeDefined();
      expect(parsed.testCount.data).toBe(42);
      expect(parsed.testName.data).toBe('hello');
    });

    it('should deserialize state', () => {
      mockWindow();

      const serialized = JSON.stringify({
        counter: { id: 'counter', type: 'signal', data: 100, timestamp: Date.now() },
      });

      deserializeState(serialized);

      expect((global as any).window.__PHILJS_RESUMABLE_STATE__).toBeDefined();
      expect((global as any).window.__PHILJS_RESUMABLE_STATE__.counter.data).toBe(100);
    });

    it('should warn when state exceeds max size', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Create a large state
      const largeData = 'x'.repeat(100);
      resumable(largeData, { id: 'large' });

      serializeState({ maxStateSize: 50 });

      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('exceeds maxStateSize'));
      warnSpy.mockRestore();
    });

    it('should resume from serialized state', async () => {
      mockWindow();
      mockDocument();

      const serializedState = JSON.stringify({
        state: [['s0', { id: 's0', type: 'signal', data: 'resumed value', timestamp: Date.now() }]],
        listeners: [],
        components: [],
        qrls: [],
      });

      await resumeFromState(serializedState);

      expect((global as any).window.__PHILJS_RESUMED__).toBe(true);
    });
  });

  describe('Event Listener Serialization', () => {
    it('should register an event listener', () => {
      const handler = () => console.log('clicked');
      const listenerId = on('click', handler, { module: 'handlers', name: 'onClick' });

      expect(listenerId).toMatch(/^l\d+$/);
    });

    it('should serialize listeners', () => {
      on('click', () => {}, { module: 'mod1', name: 'handler1' });
      on('submit', () => {}, { module: 'mod2', name: 'handler2', capture: true });

      const listeners = serializeListeners();

      expect(listeners).toHaveLength(2);
      expect(listeners[0].event).toBe('click');
      expect(listeners[0].module).toBe('mod1');
      expect(listeners[1].event).toBe('submit');
      expect(listeners[1].capture).toBe(true);
    });

    it('should resume listeners with import map', async () => {
      mockWindow();
      mockDocument();

      const listeners = [
        { event: 'click', module: 'handlers', handler: 'onClick', selector: '[data-listener="l0"]' },
      ];

      const mockHandler = vi.fn();
      const importMap = new Map([
        ['handlers', async () => ({ onClick: mockHandler })],
      ]);

      await resumeListeners(listeners, importMap);

      expect((global as any).window.__PHILJS_RESUMING__).toBe(false);
    });
  });

  describe('Component Boundaries', () => {
    it('should create a component boundary', () => {
      const b = boundary('comp1', 'Counter', { initialCount: 0 }, ['child1', 'child2']);

      expect(b.id).toBe('comp1');
      expect(b.type).toBe('Counter');
      expect(b.props).toEqual({ initialCount: 0 });
      expect(b.children).toEqual(['child1', 'child2']);
    });

    it('should serialize boundaries', () => {
      boundary('b1', 'Header', {});
      boundary('b2', 'Footer', { year: 2024 });

      const boundaries = serializeBoundaries();

      expect(boundaries).toHaveLength(2);
      expect(boundaries.find(b => b.id === 'b1')?.type).toBe('Header');
      expect(boundaries.find(b => b.id === 'b2')?.props.year).toBe(2024);
    });

    it('should get boundary by ID', () => {
      boundary('findMe', 'MyComponent', { special: true });

      const found = getBoundary('findMe');
      const notFound = getBoundary('doesNotExist');

      expect(found?.type).toBe('MyComponent');
      expect(found?.props.special).toBe(true);
      expect(notFound).toBeUndefined();
    });
  });

  describe('Resumable App', () => {
    it('should create a resumable app wrapper', () => {
      const MyComponent = () => ({ type: 'div', props: {} });
      const app = createResumableApp(MyComponent);

      expect(app.Component).toBe(MyComponent);
      expect(typeof app.render).toBe('function');
      expect(typeof app.getState).toBe('function');
      expect(typeof app.resume).toBe('function');
      expect(typeof app.dispose).toBe('function');
    });

    it('should render with embedded state', () => {
      const MyApp = () => ({ type: 'div', props: {} });
      const app = createResumableApp(MyApp, { moduleBasePath: '/assets/' });

      const html = app.render();

      expect(html).toContain('__PHILJS_RESUMABLE__');
      expect(html).toContain('__philjs_app__');
      expect(html).toContain('data-boundary');
    });

    it('should get serialized state', () => {
      const MyApp = () => ({ type: 'div', props: {} });
      const app = createResumableApp(MyApp);

      // Add some state
      resumable('test', { id: 'appState' });

      const state = app.getState();
      const parsed = JSON.parse(state);

      expect(parsed.state).toBeDefined();
      expect(parsed.timestamp).toBeDefined();
    });

    it('should dispose resources', () => {
      const MyApp = () => ({ type: 'div', props: {} });
      const app = createResumableApp(MyApp);

      app.dispose();

      // State should be cleared
      const stats = getResumabilityStats();
      expect(stats.stateCount).toBe(0);
    });
  });

  describe('Resumable Context', () => {
    it('should create a resumable context', () => {
      resumable('value1', { id: 'ctx1' });
      on('click', () => {}, { module: 'mod' });
      boundary('b1', 'Comp', {});

      const context = createResumableContext();

      expect(context.state.size).toBeGreaterThan(0);
      expect(context.listeners.length).toBeGreaterThan(0);
      expect(context.components.size).toBeGreaterThan(0);
    });

    it('should serialize context', () => {
      resumable('test', { id: 'serializeTest' });

      const context = createResumableContext();
      const serialized = serializeContext(context);
      const parsed = JSON.parse(serialized);

      expect(parsed.state).toBeDefined();
      expect(parsed.listeners).toBeDefined();
      expect(parsed.components).toBeDefined();
      expect(parsed.timestamp).toBeDefined();
    });

    it('should resume from context', async () => {
      mockWindow();
      mockDocument();

      const serialized = JSON.stringify({
        state: [['s0', { id: 's0', type: 'signal', data: 'ctx value', timestamp: Date.now() }]],
        listeners: [],
        components: [],
        qrls: [],
      });

      const importMap = new Map();
      await resumeContext(serialized, importMap);

      expect((global as any).window.__PHILJS_RESUMABLE_STATE__).toBeDefined();
    });
  });

  describe('HTML Injection/Extraction', () => {
    it('should inject resumable state into HTML', () => {
      resumable('inject', { id: 'injectTest' });
      const context = createResumableContext();

      const html = '<html><body><div>Content</div></body></html>';
      const injected = injectResumableState(html, context);

      expect(injected).toContain('__PHILJS_RESUMABLE__');
      expect(injected).toContain('</body>');
      expect(injected.indexOf('__PHILJS_RESUMABLE__')).toBeLessThan(injected.indexOf('</body>'));
    });

    it('should extract resumable state from document', () => {
      const stateData = {
        state: [['s0', { id: 's0', type: 'signal', data: 'extracted', timestamp: Date.now() }]],
        listeners: [],
        components: [],
        qrls: [],
      };

      (global as any).document = {
        getElementById: vi.fn().mockReturnValue({
          textContent: JSON.stringify(stateData),
        }),
      };

      const context = extractResumableState();

      expect(context).not.toBeNull();
      expect(context?.state.size).toBe(1);
    });

    it('should return null when no state found', () => {
      (global as any).document = {
        getElementById: vi.fn().mockReturnValue(null),
      };

      const context = extractResumableState();
      expect(context).toBeNull();
    });
  });

  describe('Closure Serialization', () => {
    it('should serialize a closure with captured variables', () => {
      const userId = 42;
      const handler = () => fetchUser(userId);

      const { code, captured } = serializeClosure(handler, { userId });

      expect(code).toContain('fetchUser');
      expect(captured.userId).toBe(42);
    });

    it('should handle functions in closure', () => {
      const callback = () => 'result';
      const { captured } = serializeClosure(() => callback(), { callback });

      expect(captured.callback.__type).toBe('qrl');
      expect(captured.callback.symbol).toBeDefined();
    });

    it('should deserialize closure variables', () => {
      // Create a QRL first
      const originalFn = () => 'original';
      const qrlRef = qrl(originalFn, 'closureFn');

      const vars = {
        qrlVar: { __type: 'qrl', symbol: 'closureFn' },
        normalVar: 'hello',
      };

      const deserialized = deserializeClosureVars(vars);

      expect(deserialized.normalVar).toBe('hello');
      expect(deserialized.qrlVar).toBe(originalFn);
    });
  });

  describe('Development Tools', () => {
    it('should get resumability stats', () => {
      resumable('s1', { id: 'stat1' });
      resumable('s2', { id: 'stat2' });
      on('click', () => {});
      boundary('b1', 'C', {});
      $(() => {});

      const stats = getResumabilityStats();

      expect(stats.stateCount).toBeGreaterThanOrEqual(2);
      expect(stats.listenerCount).toBeGreaterThanOrEqual(1);
      expect(stats.componentCount).toBeGreaterThanOrEqual(1);
      expect(stats.qrlCount).toBeGreaterThanOrEqual(1);
      expect(stats.estimatedSize).toBeGreaterThan(0);
    });
  });

  describe('Utility Functions', () => {
    it('should check isResuming', () => {
      expect(isResuming()).toBe(false);

      mockWindow();
      (global as any).window.__PHILJS_RESUMING__ = true;
      expect(isResuming()).toBe(true);
    });

    it('should check hasResumed', () => {
      expect(hasResumed()).toBe(false);

      mockWindow();
      (global as any).window.__PHILJS_RESUMED__ = true;
      expect(hasResumed()).toBe(true);
    });

    it('should check hasResumableState', () => {
      expect(hasResumableState()).toBe(false);

      mockWindow();
      (global as any).window.__PHILJS_RESUMABLE_STATE__ = { test: {} };
      expect(hasResumableState()).toBe(true);
    });

    it('should enable resumability', () => {
      mockWindow();

      const stateData = {
        state: [['s0', { id: 's0', type: 'signal', data: 'enabled', timestamp: Date.now() }]],
        listeners: [],
        components: [],
        qrls: [],
      };

      (global as any).document = {
        getElementById: vi.fn().mockReturnValue({
          textContent: JSON.stringify(stateData),
          remove: vi.fn(),
        }),
      };

      enableResumability();

      expect((global as any).window.__PHILJS_RESUMABLE_STATE__).toBeDefined();
    });

    it('should call callback on resume', () => {
      mockWindow();
      (global as any).window.__PHILJS_RESUMED__ = true;

      const callback = vi.fn();
      onResume(callback);

      expect(callback).toHaveBeenCalled();
    });

    it('should wait for resume before calling callback', async () => {
      mockWindow();
      (global as any).window.__PHILJS_RESUMED__ = false;

      const callback = vi.fn();
      onResume(callback);

      expect(callback).not.toHaveBeenCalled();

      // Simulate resume
      (global as any).window.__PHILJS_RESUMED__ = true;

      // Wait for interval check
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(callback).toHaveBeenCalled();
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete SSR to client resume flow', async () => {
      // === SERVER SIDE ===
      // Create state
      const count = resumable(0, { id: 'count' });
      const name = resumable('PhilJS', { id: 'name' });

      // Create event handlers as QRLs
      const incrementHandler = $$('increment', () => count.set(count() + 1));

      // Create component boundary
      boundary('counter', 'Counter', { initial: 0 });

      // Serialize for SSR
      const context = createResumableContext();
      const serialized = serializeContext(context);

      // Clear server state
      clearSerializedState();

      // === CLIENT SIDE ===
      mockWindow();
      mockDocument();

      // Resume from serialized state
      await resumeFromState(serialized);

      // Verify state was restored
      expect((global as any).window.__PHILJS_RESUMED__).toBe(true);
    });

    it('should support lazy-loaded event handlers', async () => {
      // Create handlers
      const handler1 = $$('lazyHandler1', vi.fn());
      const handler2 = $$('lazyHandler2', vi.fn());

      // Verify QRLs are registered
      expect(qrlRegistry.get('lazyHandler1')).toBeDefined();
      expect(qrlRegistry.get('lazyHandler2')).toBeDefined();

      // Resolve and execute
      const resolved = await resolveQRL(handler1);
      resolved();

      expect(handler1.resolved).toHaveBeenCalled();
    });

    it('should preserve closure state across serialization', async () => {
      const userData = { id: 1, name: 'Test User' };
      const handler = $closure(
        (data: typeof userData) => console.log(data.name),
        { userData }
      );

      // Serialize
      const qrlData = qrlRegistry.serialize();
      const handlerData = qrlData.find(q => q.symbol === handler.symbol);

      expect(handlerData?.capturedState?.userData).toEqual(userData);

      // Clear and restore
      qrlRegistry.clear();
      qrlRegistry.restore(qrlData);

      // Verify restored
      const restored = qrlRegistry.get(handler.symbol);
      expect(restored?.capturedState?.userData).toEqual(userData);
    });
  });
});

// Helper function for tests
function fetchUser(id: number): Promise<{ id: number; name: string }> {
  return Promise.resolve({ id, name: 'Test User' });
}
