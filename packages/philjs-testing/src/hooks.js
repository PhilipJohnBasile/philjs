/**
 * PhilJS Testing - Hook Testing Utilities
 */
const mountedHooks = new Set();
/**
 * Render a hook for testing
 */
export function renderHook(callback, options = {}) {
    const { initialProps, wrapper: Wrapper } = options;
    let result = { current: undefined };
    let currentProps = initialProps;
    let resolveNextUpdate = null;
    // Create a component that calls the hook
    function TestComponent(props) {
        result.current = callback(props.hookProps);
        // Notify waiters
        if (resolveNextUpdate) {
            const resolve = resolveNextUpdate;
            resolveNextUpdate = null;
            setTimeout(resolve, 0);
        }
        return null;
    }
    // Mount container
    const container = document.createElement('div');
    document.body.appendChild(container);
    // Render function
    const renderComponent = (props) => {
        const element = { type: TestComponent, props: { hookProps: props } };
        const wrapped = Wrapper ? Wrapper({ children: element }) : element;
        renderToContainer(wrapped, container);
    };
    // Initial render
    renderComponent(currentProps);
    const hookInstance = {
        result,
        rerender: (newProps) => {
            currentProps = newProps ?? currentProps;
            container.innerHTML = '';
            renderComponent(currentProps);
        },
        unmount: () => {
            container.innerHTML = '';
            if (container.parentNode) {
                container.parentNode.removeChild(container);
            }
            mountedHooks.delete(hookInstance);
        },
        waitForNextUpdate: () => {
            return new Promise((resolve) => {
                resolveNextUpdate = resolve;
            });
        },
    };
    mountedHooks.add(hookInstance);
    return hookInstance;
}
/**
 * Run code that triggers state updates inside act()
 */
export async function act(callback) {
    // Execute the callback
    const result = callback();
    // If it's a promise, wait for it
    if (result instanceof Promise) {
        await result;
    }
    // Flush any pending updates
    await flushPromises();
}
/**
 * Flush all pending promises
 */
function flushPromises() {
    return new Promise(resolve => setTimeout(resolve, 0));
}
/**
 * Basic render to container for hook testing
 */
function renderToContainer(element, container) {
    container.innerHTML = '';
    if (typeof element === 'object' && element !== null && element.type) {
        const { type, props } = element;
        if (typeof type === 'function') {
            const result = type(props);
            if (result !== null) {
                renderToContainer(result, container);
            }
        }
    }
}
/**
 * Cleanup all mounted hooks
 */
export function cleanupHooks() {
    mountedHooks.forEach(hook => hook.unmount());
    mountedHooks.clear();
}
if (typeof afterEach !== 'undefined') {
    afterEach(() => {
        cleanupHooks();
    });
}
//# sourceMappingURL=hooks.js.map