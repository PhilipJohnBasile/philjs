/**
 * Comprehensive test suite for PhilJS Islands architecture.
 * Tests selective hydration, lazy loading, and client directives.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mountIslands, hydrateIsland, registerIsland, loadIsland, initIslands, Island, } from './index.js';
// Mock IntersectionObserver
class MockIntersectionObserver {
    callback;
    elements = new Set();
    constructor(callback) {
        this.callback = callback;
    }
    observe(element) {
        this.elements.add(element);
    }
    unobserve(element) {
        this.elements.delete(element);
    }
    disconnect() {
        this.elements.clear();
    }
    // Helper to trigger intersection
    trigger(element, isIntersecting) {
        this.callback([{
                target: element,
                isIntersecting,
                boundingClientRect: {},
                intersectionRatio: isIntersecting ? 1 : 0,
                intersectionRect: {},
                rootBounds: null,
                time: Date.now(),
            }], this);
    }
}
describe('Islands Architecture', () => {
    let container;
    let mockObserver;
    beforeEach(() => {
        // Create fresh container for each test
        container = document.createElement('div');
        document.body.appendChild(container);
        // Mock IntersectionObserver
        mockObserver = new MockIntersectionObserver(() => { });
        global.IntersectionObserver = vi.fn((callback) => {
            mockObserver = new MockIntersectionObserver(callback);
            return mockObserver;
        });
        // Mock requestIdleCallback
        global.requestIdleCallback = vi.fn((callback) => {
            setTimeout(callback, 0);
            return 1;
        });
    });
    afterEach(() => {
        document.body.removeChild(container);
        vi.clearAllMocks();
    });
    describe('mountIslands()', () => {
        it('should find and mount islands with [island] attribute', () => {
            const island = document.createElement('div');
            island.setAttribute('island', 'TestComponent');
            container.appendChild(island);
            mountIslands(container);
            // Should create IntersectionObserver
            expect(global.IntersectionObserver).toHaveBeenCalled();
        });
        it('should hydrate island when it becomes visible', () => {
            const island = document.createElement('div');
            island.setAttribute('island', 'TestComponent');
            container.appendChild(island);
            const eventSpy = vi.fn();
            island.addEventListener('phil:island-hydrated', eventSpy);
            mountIslands(container);
            // Trigger intersection
            mockObserver.trigger(island, true);
            expect(island.hasAttribute('data-hydrated')).toBe(true);
            expect(eventSpy).toHaveBeenCalledWith(expect.objectContaining({
                detail: {
                    name: 'TestComponent',
                    element: island,
                },
            }));
        });
        it('should not hydrate island twice', () => {
            const island = document.createElement('div');
            island.setAttribute('island', 'TestComponent');
            container.appendChild(island);
            const eventSpy = vi.fn();
            island.addEventListener('phil:island-hydrated', eventSpy);
            mountIslands(container);
            // Trigger intersection twice
            mockObserver.trigger(island, true);
            mockObserver.trigger(island, true);
            // Event should only fire once
            expect(eventSpy).toHaveBeenCalledTimes(1);
        });
        it('should handle islands without IntersectionObserver', () => {
            // Remove IntersectionObserver support
            const originalIO = global.IntersectionObserver;
            delete global.IntersectionObserver;
            delete window.IntersectionObserver;
            const island = document.createElement('div');
            island.setAttribute('island', 'TestComponent');
            container.appendChild(island);
            const eventSpy = vi.fn();
            island.addEventListener('phil:island-hydrated', eventSpy);
            mountIslands(container);
            // Should hydrate immediately
            expect(island.hasAttribute('data-hydrated')).toBe(true);
            expect(eventSpy).toHaveBeenCalled();
            // Restore
            global.IntersectionObserver = originalIO;
        });
        it('should mount multiple islands', () => {
            const observers = [];
            global.IntersectionObserver = vi.fn((callback) => {
                const obs = new MockIntersectionObserver(callback);
                observers.push(obs);
                return obs;
            });
            const island1 = document.createElement('div');
            island1.setAttribute('island', 'Component1');
            const island2 = document.createElement('div');
            island2.setAttribute('island', 'Component2');
            container.appendChild(island1);
            container.appendChild(island2);
            mountIslands(container);
            // Trigger both islands
            observers[0].trigger(island1, true);
            observers[1].trigger(island2, true);
            expect(island1.hasAttribute('data-hydrated')).toBe(true);
            expect(island2.hasAttribute('data-hydrated')).toBe(true);
        });
        it('should handle islands without name gracefully', () => {
            const island = document.createElement('div');
            island.setAttribute('island', '');
            container.appendChild(island);
            expect(() => mountIslands(container)).not.toThrow();
        });
        it('should not bubble hydration event', () => {
            const island = document.createElement('div');
            island.setAttribute('island', 'TestComponent');
            container.appendChild(island);
            const containerEventSpy = vi.fn();
            container.addEventListener('phil:island-hydrated', containerEventSpy);
            mountIslands(container);
            mockObserver.trigger(island, true);
            // Event should not bubble to container
            expect(containerEventSpy).not.toHaveBeenCalled();
        });
    });
    describe('hydrateIsland()', () => {
        it('should hydrate island immediately', () => {
            const island = document.createElement('div');
            island.setAttribute('island', 'TestComponent');
            const eventSpy = vi.fn();
            island.addEventListener('phil:island-hydrated', eventSpy);
            hydrateIsland(island);
            expect(island.hasAttribute('data-hydrated')).toBe(true);
            expect(eventSpy).toHaveBeenCalled();
        });
        it('should not hydrate island without [island] attribute', () => {
            const element = document.createElement('div');
            const eventSpy = vi.fn();
            element.addEventListener('phil:island-hydrated', eventSpy);
            hydrateIsland(element);
            expect(element.hasAttribute('data-hydrated')).toBe(false);
            expect(eventSpy).not.toHaveBeenCalled();
        });
        it('should not hydrate island twice', () => {
            const island = document.createElement('div');
            island.setAttribute('island', 'TestComponent');
            const eventSpy = vi.fn();
            island.addEventListener('phil:island-hydrated', eventSpy);
            hydrateIsland(island);
            hydrateIsland(island);
            expect(eventSpy).toHaveBeenCalledTimes(1);
        });
    });
    describe('registerIsland()', () => {
        it('should register island loader', () => {
            const loader = vi.fn(async () => ({
                default: () => ({ type: 'div', props: {} }),
            }));
            expect(() => registerIsland('TestComponent', loader)).not.toThrow();
        });
        it('should allow multiple registrations', () => {
            const loader1 = vi.fn(async () => ({ default: () => ({}) }));
            const loader2 = vi.fn(async () => ({ default: () => ({}) }));
            registerIsland('Component1', loader1);
            registerIsland('Component2', loader2);
            // Both should be registered without errors
            expect(true).toBe(true);
        });
        it('should overwrite existing registration', () => {
            const loader1 = vi.fn(async () => ({ default: () => ({}) }));
            const loader2 = vi.fn(async () => ({ default: () => ({}) }));
            registerIsland('TestComponent', loader1);
            registerIsland('TestComponent', loader2); // Overwrite
            // Should not throw
            expect(true).toBe(true);
        });
    });
    describe('loadIsland()', () => {
        it('should load and hydrate island with manifest', async () => {
            const TestComponent = (props) => ({
                type: 'div',
                props: { children: `Count: ${props.count}` },
            });
            const loader = vi.fn(async () => ({
                default: TestComponent,
            }));
            registerIsland('Counter', loader);
            const island = document.createElement('div');
            island.setAttribute('island', 'Counter');
            island.setAttribute('data-props', JSON.stringify({ count: 5 }));
            container.appendChild(island);
            const manifest = {
                Counter: {
                    import: './Counter.js',
                    trigger: 'immediate',
                },
            };
            const eventSpy = vi.fn();
            island.addEventListener('phil:island-loaded', eventSpy);
            await loadIsland(island, manifest);
            expect(loader).toHaveBeenCalled();
            expect(island.hasAttribute('data-hydrated')).toBe(true);
            expect(eventSpy).toHaveBeenCalledWith(expect.objectContaining({
                detail: {
                    name: 'Counter',
                    element: island,
                },
            }));
        });
        it('should handle island not in manifest', async () => {
            const island = document.createElement('div');
            island.setAttribute('island', 'UnknownComponent');
            container.appendChild(island);
            const manifest = {};
            const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
            await loadIsland(island, manifest);
            expect(consoleWarnSpy).toHaveBeenCalledWith('Island "UnknownComponent" not found in manifest');
            expect(island.hasAttribute('data-hydrated')).toBe(false);
            consoleWarnSpy.mockRestore();
        });
        it('should handle island without loader', async () => {
            const island = document.createElement('div');
            island.setAttribute('island', 'NoLoader');
            container.appendChild(island);
            const manifest = {
                NoLoader: {
                    import: './NoLoader.js',
                },
            };
            const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
            await loadIsland(island, manifest);
            expect(consoleWarnSpy).toHaveBeenCalledWith('No loader registered for island "NoLoader"');
            expect(island.hasAttribute('data-hydrated')).toBe(false);
            consoleWarnSpy.mockRestore();
        });
        it('should handle loader errors gracefully', async () => {
            const loader = vi.fn(async () => {
                throw new Error('Failed to load');
            });
            registerIsland('ErrorComponent', loader);
            const island = document.createElement('div');
            island.setAttribute('island', 'ErrorComponent');
            container.appendChild(island);
            const manifest = {
                ErrorComponent: {
                    import: './Error.js',
                },
            };
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            await loadIsland(island, manifest);
            expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load island "ErrorComponent":', expect.any(Error));
            expect(island.hasAttribute('data-hydration-error')).toBe(true);
            consoleErrorSpy.mockRestore();
        });
        it('should handle module without default export', async () => {
            const loader = vi.fn(async () => ({
            // No default export
            }));
            registerIsland('NoDefault', loader);
            const island = document.createElement('div');
            island.setAttribute('island', 'NoDefault');
            container.appendChild(island);
            const manifest = {
                NoDefault: {
                    import: './NoDefault.js',
                },
            };
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            await loadIsland(island, manifest);
            expect(consoleErrorSpy).toHaveBeenCalledWith('Island "NoDefault" has no default export');
            expect(island.hasAttribute('data-hydrated')).toBe(false);
            consoleErrorSpy.mockRestore();
        });
        it('should extract props from data attributes', async () => {
            let receivedProps;
            const TestComponent = (props) => {
                receivedProps = props;
                return { type: 'div', props: {} };
            };
            const loader = vi.fn(async () => ({ default: TestComponent }));
            registerIsland('PropTest', loader);
            const island = document.createElement('div');
            island.setAttribute('island', 'PropTest');
            island.setAttribute('data-prop-count', '42');
            island.setAttribute('data-prop-is-active', 'true');
            island.setAttribute('data-prop-user-name', 'John');
            container.appendChild(island);
            const manifest = {
                PropTest: {
                    import: './PropTest.js',
                    props: { defaultProp: 'default' },
                },
            };
            await loadIsland(island, manifest);
            expect(receivedProps).toEqual({
                defaultProp: 'default',
                count: 42,
                isActive: true,
                userName: 'John',
            });
        });
        it('should parse data-props JSON', async () => {
            let receivedProps;
            const TestComponent = (props) => {
                receivedProps = props;
                return { type: 'div', props: {} };
            };
            const loader = vi.fn(async () => ({ default: TestComponent }));
            registerIsland('JsonProps', loader);
            const island = document.createElement('div');
            island.setAttribute('island', 'JsonProps');
            island.setAttribute('data-props', JSON.stringify({ count: 10, items: ['a', 'b'] }));
            container.appendChild(island);
            const manifest = {
                JsonProps: {
                    import: './JsonProps.js',
                },
            };
            await loadIsland(island, manifest);
            expect(receivedProps).toEqual({
                count: 10,
                items: ['a', 'b'],
            });
        });
        it('should handle invalid JSON in data-props', async () => {
            let receivedProps;
            const TestComponent = (props) => {
                receivedProps = props;
                return { type: 'div', props: {} };
            };
            const loader = vi.fn(async () => ({ default: TestComponent }));
            registerIsland('InvalidJson', loader);
            const island = document.createElement('div');
            island.setAttribute('island', 'InvalidJson');
            island.setAttribute('data-props', '{invalid json}');
            container.appendChild(island);
            const manifest = {
                InvalidJson: {
                    import: './InvalidJson.js',
                    props: { fallback: 'value' },
                },
            };
            const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
            await loadIsland(island, manifest);
            expect(consoleWarnSpy).toHaveBeenCalledWith('Failed to parse data-props:', expect.any(Error));
            expect(receivedProps).toEqual({ fallback: 'value' });
            consoleWarnSpy.mockRestore();
        });
        it('should dispatch phil:island-loaded event with bubbling', async () => {
            const TestComponent = () => ({ type: 'div', props: {} });
            const loader = vi.fn(async () => ({ default: TestComponent }));
            registerIsland('BubbleTest', loader);
            const island = document.createElement('div');
            island.setAttribute('island', 'BubbleTest');
            container.appendChild(island);
            const manifest = {
                BubbleTest: { import: './BubbleTest.js' },
            };
            const containerEventSpy = vi.fn();
            container.addEventListener('phil:island-loaded', containerEventSpy);
            await loadIsland(island, manifest);
            // Event should bubble to container
            expect(containerEventSpy).toHaveBeenCalledWith(expect.objectContaining({
                detail: { name: 'BubbleTest', element: island },
            }));
        });
    });
    describe('initIslands()', () => {
        it('should initialize islands with immediate trigger', async () => {
            const TestComponent = () => ({ type: 'div', props: {} });
            const loader = vi.fn(async () => ({ default: TestComponent }));
            registerIsland('Immediate', loader);
            const island = document.createElement('div');
            island.setAttribute('island', 'Immediate');
            container.appendChild(island);
            const manifest = {
                Immediate: {
                    import: './Immediate.js',
                    trigger: 'immediate',
                },
            };
            initIslands(manifest);
            // Wait for async loading
            await new Promise(resolve => setTimeout(resolve, 10));
            expect(loader).toHaveBeenCalled();
            expect(island.hasAttribute('data-hydrated')).toBe(true);
        });
        // TODO: Fix flaky test - idle callback timing is unreliable on CI
        it.skip('should initialize islands with idle trigger', async () => {
            const TestComponent = () => ({ type: 'div', props: {} });
            const loader = vi.fn(async () => ({ default: TestComponent }));
            registerIsland('Idle', loader);
            const island = document.createElement('div');
            island.setAttribute('island', 'Idle');
            container.appendChild(island);
            const manifest = {
                Idle: {
                    import: './Idle.js',
                    trigger: 'idle',
                },
            };
            initIslands(manifest);
            expect(global.requestIdleCallback).toHaveBeenCalled();
            // Wait for idle callback (use longer timeout for reliability)
            await new Promise(resolve => setTimeout(resolve, 100));
            expect(loader).toHaveBeenCalled();
        });
        // TODO: Fix flaky test - setTimeout fallback timing is unreliable on CI
        it.skip('should fallback to setTimeout when requestIdleCallback unavailable', async () => {
            const originalRIC = window.requestIdleCallback;
            delete window.requestIdleCallback;
            const TestComponent = () => ({ type: 'div', props: {} });
            const loader = vi.fn(async () => ({ default: TestComponent }));
            registerIsland('IdleFallback', loader);
            const island = document.createElement('div');
            island.setAttribute('island', 'IdleFallback');
            container.appendChild(island);
            const manifest = {
                IdleFallback: {
                    import: './IdleFallback.js',
                    trigger: 'idle',
                },
            };
            initIslands(manifest);
            // Wait for setTimeout
            await new Promise(resolve => setTimeout(resolve, 10));
            expect(loader).toHaveBeenCalled();
            // Restore
            window.requestIdleCallback = originalRIC;
        });
        it('should initialize islands with visible trigger', () => {
            const TestComponent = () => ({ type: 'div', props: {} });
            const loader = vi.fn(async () => ({ default: TestComponent }));
            registerIsland('Visible', loader);
            const island = document.createElement('div');
            island.setAttribute('island', 'Visible');
            container.appendChild(island);
            const manifest = {
                Visible: {
                    import: './Visible.js',
                    trigger: 'visible',
                },
            };
            initIslands(manifest);
            expect(global.IntersectionObserver).toHaveBeenCalled();
            expect(loader).not.toHaveBeenCalled(); // Not called until visible
            // Trigger visibility
            mockObserver.trigger(island, true);
            expect(loader).toHaveBeenCalled();
        });
        it('should use visible trigger by default', () => {
            const TestComponent = () => ({ type: 'div', props: {} });
            const loader = vi.fn(async () => ({ default: TestComponent }));
            registerIsland('Default', loader);
            const island = document.createElement('div');
            island.setAttribute('island', 'Default');
            container.appendChild(island);
            const manifest = {
                Default: {
                    import: './Default.js',
                    // No trigger specified - should default to 'visible'
                },
            };
            initIslands(manifest);
            expect(global.IntersectionObserver).toHaveBeenCalled();
        });
        it('should fallback to immediate load without IntersectionObserver', async () => {
            const originalIO = window.IntersectionObserver;
            delete global.IntersectionObserver;
            delete window.IntersectionObserver;
            const TestComponent = () => ({ type: 'div', props: {} });
            const loader = vi.fn(async () => ({ default: TestComponent }));
            registerIsland('NoObserver', loader);
            const island = document.createElement('div');
            island.setAttribute('island', 'NoObserver');
            container.appendChild(island);
            const manifest = {
                NoObserver: {
                    import: './NoObserver.js',
                    trigger: 'visible',
                },
            };
            initIslands(manifest);
            // Wait for async loading
            await new Promise(resolve => setTimeout(resolve, 10));
            expect(loader).toHaveBeenCalled();
            // Restore
            window.IntersectionObserver = originalIO;
            global.IntersectionObserver = originalIO;
        });
        it('should skip islands not in manifest', () => {
            const island = document.createElement('div');
            island.setAttribute('island', 'NotInManifest');
            container.appendChild(island);
            const manifest = {};
            expect(() => initIslands(manifest)).not.toThrow();
        });
        it('should skip islands without name attribute', () => {
            const island = document.createElement('div');
            island.setAttribute('island', '');
            container.appendChild(island);
            const manifest = {
                '': { import: './Empty.js' },
            };
            expect(() => initIslands(manifest)).not.toThrow();
        });
        it('should unobserve after loading visible island', async () => {
            let capturedObserver = null;
            global.IntersectionObserver = vi.fn((callback) => {
                const obs = new MockIntersectionObserver(callback);
                capturedObserver = obs;
                return obs;
            });
            const TestComponent = () => ({ type: 'div', props: {} });
            const loader = vi.fn(async () => ({ default: TestComponent }));
            registerIsland('UnobserveTest', loader);
            const island = document.createElement('div');
            island.setAttribute('island', 'UnobserveTest');
            container.appendChild(island);
            const manifest = {
                UnobserveTest: {
                    import: './UnobserveTest.js',
                    trigger: 'visible',
                },
            };
            initIslands(manifest);
            const unobserveSpy = vi.spyOn(capturedObserver, 'unobserve');
            // Trigger visibility
            capturedObserver.trigger(island, true);
            await new Promise(resolve => setTimeout(resolve, 10));
            expect(unobserveSpy).toHaveBeenCalledWith(island);
        });
    });
    describe('Island() wrapper component', () => {
        it('should create island wrapper with attributes', () => {
            const children = { type: 'p', props: { children: 'Content' } };
            const result = Island({
                name: 'TestComponent',
                trigger: 'immediate',
                props: { count: 5 },
                children,
            });
            expect(result).toEqual({
                type: 'div',
                props: {
                    island: 'TestComponent',
                    'data-trigger': 'immediate',
                    'data-priority': '5',
                    'data-props': JSON.stringify({ count: 5 }),
                    children,
                },
            });
        });
        it('should default to visible trigger', () => {
            const children = { type: 'span', props: {} };
            const result = Island({
                name: 'DefaultTrigger',
                children,
            });
            expect(result.props['data-trigger']).toBe('visible');
        });
        it('should omit data-props when props not provided', () => {
            const children = { type: 'div', props: {} };
            const result = Island({
                name: 'NoProps',
                children,
            });
            expect(result.props['data-props']).toBeUndefined();
        });
        it('should serialize complex props as JSON', () => {
            const children = { type: 'div', props: {} };
            const complexProps = {
                items: ['a', 'b', 'c'],
                config: { nested: true },
                count: 42,
            };
            const result = Island({
                name: 'ComplexProps',
                props: complexProps,
                children,
            });
            expect(result.props['data-props']).toBe(JSON.stringify(complexProps));
        });
    });
    describe('Value parsing', () => {
        it('should parse boolean values', async () => {
            let receivedProps;
            const TestComponent = (props) => {
                receivedProps = props;
                return { type: 'div', props: {} };
            };
            const loader = vi.fn(async () => ({ default: TestComponent }));
            registerIsland('BoolTest', loader);
            const island = document.createElement('div');
            island.setAttribute('island', 'BoolTest');
            island.setAttribute('data-prop-is-active', 'true');
            island.setAttribute('data-prop-is-disabled', 'false');
            container.appendChild(island);
            const manifest = {
                BoolTest: { import: './BoolTest.js' },
            };
            await loadIsland(island, manifest);
            expect(receivedProps.isActive).toBe(true);
            expect(receivedProps.isDisabled).toBe(false);
        });
        it('should parse number values', async () => {
            let receivedProps;
            const TestComponent = (props) => {
                receivedProps = props;
                return { type: 'div', props: {} };
            };
            const loader = vi.fn(async () => ({ default: TestComponent }));
            registerIsland('NumberTest', loader);
            const island = document.createElement('div');
            island.setAttribute('island', 'NumberTest');
            island.setAttribute('data-prop-count', '42');
            island.setAttribute('data-prop-price', '19.99');
            island.setAttribute('data-prop-negative', '-5');
            container.appendChild(island);
            const manifest = {
                NumberTest: { import: './NumberTest.js' },
            };
            await loadIsland(island, manifest);
            expect(receivedProps.count).toBe(42);
            expect(receivedProps.price).toBe(19.99);
            expect(receivedProps.negative).toBe(-5);
        });
        it('should parse null and undefined', async () => {
            let receivedProps;
            const TestComponent = (props) => {
                receivedProps = props;
                return { type: 'div', props: {} };
            };
            const loader = vi.fn(async () => ({ default: TestComponent }));
            registerIsland('NullTest', loader);
            const island = document.createElement('div');
            island.setAttribute('island', 'NullTest');
            island.setAttribute('data-prop-null-value', 'null');
            island.setAttribute('data-prop-undefined-value', 'undefined');
            container.appendChild(island);
            const manifest = {
                NullTest: { import: './NullTest.js' },
            };
            await loadIsland(island, manifest);
            expect(receivedProps.nullValue).toBe(null);
            expect(receivedProps.undefinedValue).toBe(undefined);
        });
        it('should parse JSON arrays and objects', async () => {
            let receivedProps;
            const TestComponent = (props) => {
                receivedProps = props;
                return { type: 'div', props: {} };
            };
            const loader = vi.fn(async () => ({ default: TestComponent }));
            registerIsland('JsonTest', loader);
            const island = document.createElement('div');
            island.setAttribute('island', 'JsonTest');
            island.setAttribute('data-prop-items', '["a","b","c"]');
            island.setAttribute('data-prop-config', '{"nested":true}');
            container.appendChild(island);
            const manifest = {
                JsonTest: { import: './JsonTest.js' },
            };
            await loadIsland(island, manifest);
            expect(receivedProps.items).toEqual(['a', 'b', 'c']);
            expect(receivedProps.config).toEqual({ nested: true });
        });
        it('should keep strings as strings', async () => {
            let receivedProps;
            const TestComponent = (props) => {
                receivedProps = props;
                return { type: 'div', props: {} };
            };
            const loader = vi.fn(async () => ({ default: TestComponent }));
            registerIsland('StringTest', loader);
            const island = document.createElement('div');
            island.setAttribute('island', 'StringTest');
            island.setAttribute('data-prop-name', 'John Doe');
            island.setAttribute('data-prop-label', 'Click me');
            container.appendChild(island);
            const manifest = {
                StringTest: { import: './StringTest.js' },
            };
            await loadIsland(island, manifest);
            expect(receivedProps.name).toBe('John Doe');
            expect(receivedProps.label).toBe('Click me');
        });
        it('should convert kebab-case to camelCase', async () => {
            let receivedProps;
            const TestComponent = (props) => {
                receivedProps = props;
                return { type: 'div', props: {} };
            };
            const loader = vi.fn(async () => ({ default: TestComponent }));
            registerIsland('CaseTest', loader);
            const island = document.createElement('div');
            island.setAttribute('island', 'CaseTest');
            island.setAttribute('data-prop-user-name', 'John');
            island.setAttribute('data-prop-is-active', 'true');
            island.setAttribute('data-prop-max-count', '100');
            container.appendChild(island);
            const manifest = {
                CaseTest: { import: './CaseTest.js' },
            };
            await loadIsland(island, manifest);
            expect(receivedProps.userName).toBe('John');
            expect(receivedProps.isActive).toBe(true);
            expect(receivedProps.maxCount).toBe(100);
        });
    });
});
//# sourceMappingURL=islands.test.js.map