/**
 * PhilJS Testing - Hook Testing Utilities
 */

export interface HookResult<T> {
  result: { current: T };
  rerender: (newProps?: any) => void;
  unmount: () => void;
  waitForNextUpdate: () => Promise<void>;
}

interface RenderHookOptions<P> {
  initialProps?: P;
  wrapper?: (props: { children: any }) => any;
}

const mountedHooks = new Set<{ unmount: () => void }>();

/**
 * Render a hook for testing
 */
export function renderHook<T, P = unknown>(
  callback: (props: P) => T,
  options: RenderHookOptions<P> = {}
): HookResult<T> {
  const { initialProps, wrapper: Wrapper } = options;

  let result: { current: T } = { current: undefined as T };
  let currentProps = initialProps as P;
  let resolveNextUpdate: (() => void) | null = null;

  // Create a component that calls the hook
  function TestComponent(props: { hookProps: P }) {
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
  const renderComponent = (props: P) => {
    const element = { type: TestComponent, props: { hookProps: props } };
    const wrapped = Wrapper ? Wrapper({ children: element }) : element;
    renderToContainer(wrapped, container);
  };

  // Initial render
  renderComponent(currentProps);

  const hookInstance = {
    result,

    rerender: (newProps?: P) => {
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
      return new Promise<void>((resolve) => {
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
export async function act(callback: () => void | Promise<void>): Promise<void> {
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
function flushPromises(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0));
}

/**
 * Basic render to container for hook testing
 */
function renderToContainer(element: any, container: HTMLElement): void {
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
export function cleanupHooks(): void {
  mountedHooks.forEach(hook => hook.unmount());
  mountedHooks.clear();
}

// Auto-cleanup
if (typeof afterEach !== 'undefined') {
  afterEach(() => {
    cleanupHooks();
  });
}
