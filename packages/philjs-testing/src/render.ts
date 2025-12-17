/**
 * PhilJS Testing - Render Utilities
 */

import { queries } from './queries';
import { debug } from './debug';

export interface RenderOptions {
  container?: HTMLElement;
  baseElement?: HTMLElement;
  wrapper?: (props: { children: any }) => any;
  hydrate?: boolean;
}

export interface RenderResult {
  container: HTMLElement;
  baseElement: HTMLElement;
  debug: (el?: HTMLElement) => void;
  rerender: (ui: any) => void;
  unmount: () => void;
  asFragment: () => DocumentFragment;
  // Bound queries
  getByRole: typeof queries.getByRole;
  getAllByRole: typeof queries.getAllByRole;
  queryByRole: typeof queries.queryByRole;
  queryAllByRole: typeof queries.queryAllByRole;
  findByRole: typeof queries.findByRole;
  findAllByRole: typeof queries.findAllByRole;
  getByText: typeof queries.getByText;
  getAllByText: typeof queries.getAllByText;
  queryByText: typeof queries.queryByText;
  queryAllByText: typeof queries.queryAllByText;
  findByText: typeof queries.findByText;
  findAllByText: typeof queries.findAllByText;
  getByTestId: typeof queries.getByTestId;
  getAllByTestId: typeof queries.getAllByTestId;
  queryByTestId: typeof queries.queryByTestId;
  queryAllByTestId: typeof queries.queryAllByTestId;
  findByTestId: typeof queries.findByTestId;
  findAllByTestId: typeof queries.findAllByTestId;
  getByLabelText: typeof queries.getByLabelText;
  getAllByLabelText: typeof queries.getAllByLabelText;
  queryByLabelText: typeof queries.queryByLabelText;
  queryAllByLabelText: typeof queries.queryAllByLabelText;
  findByLabelText: typeof queries.findByLabelText;
  findAllByLabelText: typeof queries.findAllByLabelText;
  getByPlaceholderText: typeof queries.getByPlaceholderText;
  getAllByPlaceholderText: typeof queries.getAllByPlaceholderText;
  queryByPlaceholderText: typeof queries.queryByPlaceholderText;
  queryAllByPlaceholderText: typeof queries.queryAllByPlaceholderText;
  findByPlaceholderText: typeof queries.findByPlaceholderText;
  findAllByPlaceholderText: typeof queries.findAllByPlaceholderText;
  getByDisplayValue: typeof queries.getByDisplayValue;
  getAllByDisplayValue: typeof queries.getAllByDisplayValue;
  queryByDisplayValue: typeof queries.queryByDisplayValue;
  queryAllByDisplayValue: typeof queries.queryAllByDisplayValue;
  findByDisplayValue: typeof queries.findByDisplayValue;
  findAllByDisplayValue: typeof queries.findAllByDisplayValue;
  getByAltText: typeof queries.getByAltText;
  getAllByAltText: typeof queries.getAllByAltText;
  queryByAltText: typeof queries.queryByAltText;
  queryAllByAltText: typeof queries.queryAllByAltText;
  findByAltText: typeof queries.findByAltText;
  findAllByAltText: typeof queries.findAllByAltText;
  getByTitle: typeof queries.getByTitle;
  getAllByTitle: typeof queries.getAllByTitle;
  queryByTitle: typeof queries.queryByTitle;
  queryAllByTitle: typeof queries.queryAllByTitle;
  findByTitle: typeof queries.findByTitle;
  findAllByTitle: typeof queries.findAllByTitle;
}

const mountedContainers = new Set<HTMLElement>();

/**
 * Render a PhilJS component into a container for testing
 */
export function render(
  ui: any,
  options: RenderOptions = {}
): RenderResult {
  const {
    container: customContainer,
    baseElement = document.body,
    wrapper: Wrapper,
    hydrate = false,
  } = options;

  // Create container
  const container = customContainer || document.createElement('div');

  if (!customContainer) {
    baseElement.appendChild(container);
  }

  mountedContainers.add(container);

  // Wrap if wrapper provided
  const componentToRender = Wrapper
    ? Wrapper({ children: ui })
    : ui;

  // Render the component using PhilJS
  let unmountFn: (() => void) | undefined;

  try {
    // Import PhilJS render dynamically to avoid hard dependency
    const philjs = (globalThis as any).__PHILJS__ || require('philjs-core');

    if (hydrate && philjs.hydrate) {
      philjs.hydrate(componentToRender, container);
    } else if (philjs.render) {
      unmountFn = philjs.render(componentToRender, container);
    } else {
      // Fallback: try to render JSX directly
      renderToContainer(componentToRender, container);
    }
  } catch (error) {
    // If PhilJS is not available, use basic rendering
    renderToContainer(componentToRender, container);
  }

  // Bind queries to container
  const boundQueries = bindQueries(container);

  return {
    container,
    baseElement,

    debug: (el = baseElement) => debug(el),

    rerender: (newUI: any) => {
      const toRender = Wrapper ? Wrapper({ children: newUI }) : newUI;
      renderToContainer(toRender, container);
    },

    unmount: () => {
      if (unmountFn) {
        unmountFn();
      }
      container.innerHTML = '';
      mountedContainers.delete(container);
    },

    asFragment: () => {
      const fragment = document.createDocumentFragment();
      Array.from(container.childNodes).forEach(node => {
        fragment.appendChild(node.cloneNode(true));
      });
      return fragment;
    },

    ...boundQueries,
  };
}

/**
 * Cleanup all rendered containers
 */
export function cleanup(): void {
  mountedContainers.forEach(container => {
    container.innerHTML = '';
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });
  mountedContainers.clear();
}

/**
 * Basic render to container (fallback)
 */
function renderToContainer(element: any, container: HTMLElement): void {
  // Handle JSX elements
  if (typeof element === 'object' && element !== null) {
    if (element.type && element.props) {
      // JSX element
      const { type, props } = element;

      if (typeof type === 'function') {
        // Component
        const result = type(props);
        renderToContainer(result, container);
      } else if (typeof type === 'string') {
        // HTML element
        const el = document.createElement(type);

        // Apply props
        for (const [key, value] of Object.entries(props || {})) {
          if (key === 'children') {
            const children = Array.isArray(value) ? value : [value];
            children.forEach((child: any) => {
              if (child != null) {
                renderToContainer(child, el);
              }
            });
          } else if (key === 'className') {
            el.className = String(value);
          } else if (key.startsWith('on') && typeof value === 'function') {
            const eventName = key.slice(2).toLowerCase();
            el.addEventListener(eventName, value as EventListener);
          } else if (key === 'style' && typeof value === 'object') {
            Object.assign(el.style, value);
          } else if (key === 'ref' && typeof value === 'function') {
            (value as Function)(el);
          } else {
            el.setAttribute(key, String(value));
          }
        }

        container.appendChild(el);
      }
    } else if (Array.isArray(element)) {
      element.forEach(child => renderToContainer(child, container));
    }
  } else if (typeof element === 'string' || typeof element === 'number') {
    container.appendChild(document.createTextNode(String(element)));
  }
}

/**
 * Bind query functions to a container
 */
function bindQueries(container: HTMLElement) {
  const bound: Record<string, any> = {};

  for (const [name, fn] of Object.entries(queries)) {
    bound[name] = (...args: any[]) => (fn as Function)(container, ...args);
  }

  return bound as RenderResult;
}

// Auto-cleanup after each test if vitest/jest is detected
if (typeof afterEach !== 'undefined') {
  afterEach(() => {
    cleanup();
  });
}
