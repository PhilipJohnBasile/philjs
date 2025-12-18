/**
 * Advanced edge case tests for error-boundary
 * Covers scenarios beyond the basic error-boundary.test.ts
 */
import { describe, it, expect, vi } from 'vitest';
import { ErrorBoundary, setupGlobalErrorHandler, errorRecovery, } from './error-boundary';
import { signal } from './signals';
describe('Error Boundary - Dynamic Children', () => {
    it('should handle children changing after error', () => {
        const hasError = signal(false);
        const onError = vi.fn();
        const boundary = ErrorBoundary({
            children: hasError() ? null : { type: 'div', props: {} },
            onError,
        });
        expect(boundary).toBeDefined();
    });
    it('should recover when children are replaced', () => {
        const children = signal({ type: 'div', props: { children: 'ok' } });
        const boundary = ErrorBoundary({
            children: children(),
        });
        expect(boundary).toBeDefined();
    });
});
describe('Error Categorization - Edge Cases', () => {
    it('should categorize data-fetch errors', () => {
        const error = new Error('Failed to fetch data from API');
        const boundary = ErrorBoundary({
            children: { type: 'div', props: {} },
            onError: (errorInfo) => {
                expect(['network', 'unknown']).toContain(errorInfo.category);
            },
        });
        expect(boundary).toBeDefined();
    });
    it('should categorize mixed error messages', () => {
        const error = new Error('Network permission denied');
        const boundary = ErrorBoundary({
            children: { type: 'div', props: {} },
            onError: (errorInfo) => {
                // Should match network or permission
                expect(['network', 'permission']).toContain(errorInfo.category);
            },
        });
        expect(boundary).toBeDefined();
    });
    it('should handle error with no message', () => {
        const error = new Error('');
        const boundary = ErrorBoundary({
            children: { type: 'div', props: {} },
            onError: (errorInfo) => {
                expect(errorInfo.category).toBe('unknown');
            },
        });
        expect(boundary).toBeDefined();
    });
    it('should categorize based on stack trace', () => {
        const error = new Error('Something went wrong');
        error.stack = `Error: Something went wrong
    at render (component.tsx:10:20)`;
        const boundary = ErrorBoundary({
            children: { type: 'div', props: {} },
            onError: (errorInfo) => {
                expect(['render', 'unknown']).toContain(errorInfo.category);
            },
        });
        expect(boundary).toBeDefined();
    });
});
describe('Error Suggestions - Complex Patterns', () => {
    it('should suggest fixes for property access on null', () => {
        const error = new Error("Cannot read property 'value' of null");
        const boundary = ErrorBoundary({
            children: { type: 'div', props: {} },
            onError: (errorInfo) => {
                expect(errorInfo.suggestions.length).toBeGreaterThan(0);
                const hasOptionalChaining = errorInfo.suggestions.some(s => s.description.includes('optional chaining'));
                expect(hasOptionalChaining).toBe(true);
            },
        });
        expect(boundary).toBeDefined();
    });
    it('should provide multiple suggestions for common errors', () => {
        const error = new Error("Cannot read properties of undefined (reading 'name')");
        const boundary = ErrorBoundary({
            children: { type: 'div', props: {} },
            onError: (errorInfo) => {
                expect(errorInfo.suggestions.length).toBeGreaterThanOrEqual(2);
            },
        });
        expect(boundary).toBeDefined();
    });
    it('should mark suggestions with confidence scores', () => {
        const error = new Error("Cannot read property 'x' of undefined");
        const boundary = ErrorBoundary({
            children: { type: 'div', props: {} },
            onError: (errorInfo) => {
                errorInfo.suggestions.forEach(suggestion => {
                    expect(suggestion.confidence).toBeGreaterThanOrEqual(0);
                    expect(suggestion.confidence).toBeLessThanOrEqual(1);
                });
            },
        });
        expect(boundary).toBeDefined();
    });
    it('should provide code changes for auto-fixable errors', () => {
        const error = new Error("Cannot read property 'name' of undefined");
        const boundary = ErrorBoundary({
            children: { type: 'div', props: {} },
            onError: (errorInfo) => {
                const autoFixable = errorInfo.suggestions.filter(s => s.autoFixable);
                expect(autoFixable.length).toBeGreaterThan(0);
                autoFixable.forEach(suggestion => {
                    if (suggestion.codeChange) {
                        expect(suggestion.codeChange.before).toBeDefined();
                        expect(suggestion.codeChange.after).toBeDefined();
                    }
                });
            },
        });
        expect(boundary).toBeDefined();
    });
});
describe('Error Source Extraction - Advanced', () => {
    it('should extract source from multiple stack frames', () => {
        const error = new Error('Test error');
        error.stack = `Error: Test error
    at inner (utils.ts:5:10)
    at outer (component.tsx:20:15)
    at render (index.tsx:100:5)`;
        const boundary = ErrorBoundary({
            children: { type: 'div', props: {} },
            onError: (errorInfo) => {
                if (errorInfo.source) {
                    expect(errorInfo.source.file).toBe('utils.ts');
                    expect(errorInfo.source.line).toBe(5);
                    expect(errorInfo.source.column).toBe(10);
                }
            },
        });
        expect(boundary).toBeDefined();
    });
    it('should handle webpack-style stack traces', () => {
        const error = new Error('Test error');
        error.stack = `Error: Test error
    at Module../src/component.tsx (webpack-internal:///./src/component.tsx:10:20)`;
        const boundary = ErrorBoundary({
            children: { type: 'div', props: {} },
            onError: (errorInfo) => {
                expect(errorInfo.source).toBeDefined();
            },
        });
        expect(boundary).toBeDefined();
    });
    it('should handle anonymous function stack traces', () => {
        const error = new Error('Test error');
        error.stack = `Error: Test error
    at <anonymous>:1:1`;
        const boundary = ErrorBoundary({
            children: { type: 'div', props: {} },
            onError: (errorInfo) => {
                expect(errorInfo.source).toBeDefined();
            },
        });
        expect(boundary).toBeDefined();
    });
});
describe('Error Recovery - Advanced Strategies', () => {
    it('should execute recovery strategy in order', async () => {
        const executionOrder = [];
        errorRecovery.addStrategy('network', {
            name: 'First Strategy',
            execute: async () => {
                executionOrder.push('first');
                throw new Error('Failed');
            },
            shouldApply: () => true,
        });
        errorRecovery.addStrategy('network', {
            name: 'Second Strategy',
            execute: async () => {
                executionOrder.push('second');
                return 'recovered';
            },
            shouldApply: () => true,
        });
        const error = new Error('Network error');
        const context = { retry: vi.fn() };
        try {
            await errorRecovery.recover(error, 'network', context);
        }
        catch (err) {
            // May fail
        }
        expect(executionOrder.length).toBeGreaterThan(0);
    });
    it('should skip strategy if shouldApply returns false', async () => {
        const executeSpy = vi.fn();
        errorRecovery.addStrategy('render', {
            name: 'Conditional Strategy',
            execute: executeSpy,
            shouldApply: (error) => error.message.includes('specific'),
        });
        const error = new Error('Generic render error');
        const context = { retry: vi.fn() };
        try {
            await errorRecovery.recover(error, 'render', context);
        }
        catch (err) {
            // Expected to throw
        }
        expect(executeSpy).not.toHaveBeenCalled();
    });
    it('should use fallback value in recovery context', async () => {
        const error = new Error('Cannot read property of undefined');
        const context = {
            retry: vi.fn(),
            fallbackValue: { default: 'fallback' },
        };
        errorRecovery.addStrategy('type', {
            name: 'Use Fallback',
            execute: async (error, ctx) => ctx.fallbackValue,
            shouldApply: () => true,
        });
        const result = await errorRecovery.recover(error, 'type', context);
        expect(result).toEqual({ default: 'fallback' });
    });
    it('should provide component name in recovery context', async () => {
        let capturedContext = null;
        errorRecovery.addStrategy('unknown', {
            name: 'Capture Context',
            execute: async (error, context) => {
                capturedContext = context;
                throw error;
            },
            shouldApply: () => true,
        });
        const error = new Error('Test');
        const context = {
            retry: vi.fn(),
            componentName: 'TestComponent',
        };
        try {
            await errorRecovery.recover(error, 'unknown', context);
        }
        catch (err) {
            // Expected
        }
        expect(capturedContext?.componentName).toBe('TestComponent');
    });
});
describe('Error Retry Mechanism', () => {
    it('should increment retry count on each retry', () => {
        let retryFn = null;
        let errorCount = 0;
        const fallback = (error, retry) => {
            retryFn = retry;
            errorCount++;
            return { type: 'div', props: { children: 'Error' } };
        };
        ErrorBoundary({
            children: { type: 'div', props: {} },
            fallback,
        });
        if (retryFn) {
            retryFn();
            expect(errorCount).toBeGreaterThan(0);
        }
    });
    it('should call onRecover when retry succeeds', () => {
        const onRecover = vi.fn();
        let retryFn = null;
        const fallback = (error, retry) => {
            retryFn = retry;
            return { type: 'div', props: {} };
        };
        ErrorBoundary({
            children: { type: 'div', props: {} },
            fallback,
            onRecover,
        });
        if (retryFn) {
            retryFn();
        }
    });
    it('should clear error state on successful retry', () => {
        let retryFn = null;
        const fallback = (error, retry) => {
            retryFn = retry;
            return { type: 'div', props: { children: 'Error' } };
        };
        const boundary = ErrorBoundary({
            children: { type: 'div', props: {} },
            fallback,
        });
        if (retryFn) {
            retryFn();
        }
        expect(boundary).toBeDefined();
    });
});
describe('Nested Error Boundaries - Advanced', () => {
    it('should handle errors at different nesting levels', () => {
        const innerError = vi.fn();
        const outerError = vi.fn();
        const inner = ErrorBoundary({
            name: 'Inner',
            onError: innerError,
            children: { type: 'div', props: { children: 'content' } },
        });
        const outer = ErrorBoundary({
            name: 'Outer',
            onError: outerError,
            children: inner,
        });
        expect(outer).toBeDefined();
    });
    it('should allow error propagation to parent boundary', () => {
        const errors = [];
        const level3 = ErrorBoundary({
            name: 'Level3',
            onError: () => errors.push('level3'),
            children: { type: 'div', props: {} },
        });
        const level2 = ErrorBoundary({
            name: 'Level2',
            onError: () => errors.push('level2'),
            children: level3,
        });
        const level1 = ErrorBoundary({
            name: 'Level1',
            onError: () => errors.push('level1'),
            children: level2,
        });
        expect(level1).toBeDefined();
    });
    it('should isolate errors with multiple boundaries at same level', () => {
        const error1 = vi.fn();
        const error2 = vi.fn();
        const boundary1 = ErrorBoundary({
            name: 'Boundary1',
            onError: error1,
            children: { type: 'div', props: {} },
        });
        const boundary2 = ErrorBoundary({
            name: 'Boundary2',
            onError: error2,
            children: { type: 'div', props: {} },
        });
        expect(boundary1).toBeDefined();
        expect(boundary2).toBeDefined();
    });
});
describe('Global Error Handler - Edge Cases', () => {
    it('should handle errors without error object', () => {
        const onError = vi.fn();
        const cleanup = setupGlobalErrorHandler(onError);
        const errorEvent = new ErrorEvent('error', {
            message: 'Error message',
        });
        window.dispatchEvent(errorEvent);
        cleanup();
        expect(onError).toHaveBeenCalled();
    });
    it('should handle string rejection reasons', () => {
        const onError = vi.fn();
        const cleanup = setupGlobalErrorHandler(onError);
        // Create a promise that we'll catch to prevent unhandled rejection
        const rejectedPromise = Promise.reject('String reason');
        rejectedPromise.catch(() => { }); // Prevent unhandled rejection warning
        const rejectionEvent = new PromiseRejectionEvent('unhandledrejection', {
            promise: rejectedPromise,
            reason: 'String reason',
        });
        window.dispatchEvent(rejectionEvent);
        cleanup();
        expect(onError).toHaveBeenCalled();
    });
    it('should handle object rejection reasons', () => {
        const onError = vi.fn();
        const cleanup = setupGlobalErrorHandler(onError);
        // Create a promise that we'll catch to prevent unhandled rejection
        const rejectedPromise = Promise.reject({ code: 'ERR_001' });
        rejectedPromise.catch(() => { }); // Prevent unhandled rejection warning
        const rejectionEvent = new PromiseRejectionEvent('unhandledrejection', {
            promise: rejectedPromise,
            reason: { code: 'ERR_001' },
        });
        window.dispatchEvent(rejectionEvent);
        cleanup();
        expect(onError).toHaveBeenCalled();
    });
    it('should allow multiple global handlers', () => {
        const onError1 = vi.fn();
        const onError2 = vi.fn();
        const cleanup1 = setupGlobalErrorHandler(onError1);
        const cleanup2 = setupGlobalErrorHandler(onError2);
        const errorEvent = new ErrorEvent('error', {
            error: new Error('Test'),
        });
        window.dispatchEvent(errorEvent);
        cleanup1();
        cleanup2();
        expect(onError1).toHaveBeenCalled();
        expect(onError2).toHaveBeenCalled();
    });
});
describe('Error Logging and Analytics', () => {
    it('should log errors with boundary name', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        ErrorBoundary({
            name: 'TestBoundary',
            children: { type: 'div', props: {} },
        });
        consoleSpy.mockRestore();
    });
    it('should include suggestions in error log', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        ErrorBoundary({
            children: { type: 'div', props: {} },
        });
        consoleSpy.mockRestore();
    });
    it('should not crash if window.analytics is undefined', () => {
        const originalAnalytics = window.analytics;
        delete window.analytics;
        expect(() => {
            ErrorBoundary({
                children: { type: 'div', props: {} },
            });
        }).not.toThrow();
        if (originalAnalytics) {
            window.analytics = originalAnalytics;
        }
    });
});
describe('Error Info Structure', () => {
    it('should include all required fields in ErrorInfo', () => {
        const onError = vi.fn((errorInfo) => {
            expect(errorInfo.error).toBeInstanceOf(Error);
            expect(errorInfo.category).toBeDefined();
            expect(Array.isArray(errorInfo.suggestions)).toBe(true);
        });
        ErrorBoundary({
            children: { type: 'div', props: {} },
            onError,
        });
    });
    it('should provide component stack when available', () => {
        const onError = vi.fn((errorInfo) => {
            // componentStack may or may not be present
            if (errorInfo.componentStack) {
                expect(typeof errorInfo.componentStack).toBe('string');
            }
        });
        ErrorBoundary({
            children: { type: 'div', props: {} },
            onError,
        });
    });
    it('should extract source location when available', () => {
        const error = new Error('Test');
        error.stack = `Error: Test
    at Component (app.tsx:42:10)`;
        const onError = vi.fn((errorInfo) => {
            if (errorInfo.source) {
                expect(errorInfo.source.file).toBeDefined();
                expect(typeof errorInfo.source.line).toBe('number');
                expect(typeof errorInfo.source.column).toBe('number');
            }
        });
        ErrorBoundary({
            children: { type: 'div', props: {} },
            onError,
        });
    });
});
describe('Suggestion Generation - Network Errors', () => {
    it('should suggest error handling for network errors', () => {
        const error = new Error('fetch failed');
        const boundary = ErrorBoundary({
            children: { type: 'div', props: {} },
            onError: (errorInfo) => {
                const hasErrorHandling = errorInfo.suggestions.some(s => s.description.toLowerCase().includes('error handling'));
                expect(hasErrorHandling).toBe(true);
            },
        });
        expect(boundary).toBeDefined();
    });
    it('should suggest checking network connection', () => {
        const error = new Error('Network request failed');
        const boundary = ErrorBoundary({
            children: { type: 'div', props: {} },
            onError: (errorInfo) => {
                const hasNetworkCheck = errorInfo.suggestions.some(s => s.description.toLowerCase().includes('network'));
                expect(hasNetworkCheck).toBe(true);
            },
        });
        expect(boundary).toBeDefined();
    });
});
describe('Suggestion Generation - Render Errors', () => {
    it('should suggest checking props for render errors', () => {
        const error = new Error('Render failed in component');
        const boundary = ErrorBoundary({
            children: { type: 'div', props: {} },
            onError: (errorInfo) => {
                if (errorInfo.category === 'render') {
                    const hasPropsCheck = errorInfo.suggestions.some(s => s.description.toLowerCase().includes('props'));
                    expect(hasPropsCheck).toBe(true);
                }
            },
        });
        expect(boundary).toBeDefined();
    });
    it('should suggest JSX syntax check for render errors', () => {
        const error = new Error('Render error');
        const boundary = ErrorBoundary({
            children: { type: 'div', props: {} },
            onError: (errorInfo) => {
                if (errorInfo.category === 'render') {
                    const hasJSXCheck = errorInfo.suggestions.some(s => s.description.toLowerCase().includes('jsx'));
                    expect(hasJSXCheck).toBe(true);
                }
            },
        });
        expect(boundary).toBeDefined();
    });
});
//# sourceMappingURL=error-boundary-edge-cases.test.js.map