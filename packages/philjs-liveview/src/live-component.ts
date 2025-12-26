// @ts-nocheck
/**
 * PhilJS LiveView - LiveComponent Implementation
 *
 * LiveComponents are stateful components that live within a LiveView.
 * They have their own state and can handle events independently.
 */

import type {
  LiveComponentDefinition,
  LiveViewState,
  LiveViewEvent,
  LiveSocket,
  ViewPatch,
} from './types';
import { createDiffer } from './differ';

// ============================================================================
// LiveComponent Factory
// ============================================================================

/**
 * Create a LiveComponent
 *
 * @example
 * ```typescript
 * const Modal = createLiveComponent({
 *   id: 'modal',
 *
 *   mount: () => ({ open: false }),
 *
 *   handleEvent: (event, state) => {
 *     if (event.type === 'toggle') {
 *       return { open: !state.open };
 *     }
 *     return state;
 *   },
 *
 *   render: (state, props) => `
 *     <div class="modal ${state.open ? 'open' : ''}">
 *       <div class="modal-content">
 *         ${props.children}
 *       </div>
 *       <button phx-click="toggle" phx-target="#modal">
 *         ${state.open ? 'Close' : 'Open'}
 *       </button>
 *     </div>
 *   `,
 * });
 * ```
 */
export function createLiveComponent<S extends LiveViewState = LiveViewState, P = any>(
  definition: LiveComponentDefinition<S, P>
): LiveComponentDefinition<S, P> {
  return {
    ...definition,
    mount: definition.mount || (() => ({} as S)),
    update: definition.update || ((_, state) => state),
    handleEvent: definition.handleEvent || ((_, state) => state),
  };
}

// ============================================================================
// Component Registry
// ============================================================================

const componentRegistry = new Map<string, LiveComponentDefinition>();

/**
 * Register a global LiveComponent
 */
export function registerComponent(name: string, component: LiveComponentDefinition): void {
  componentRegistry.set(name, component);
}

/**
 * Get a registered component
 */
export function getComponent(name: string): LiveComponentDefinition | undefined {
  return componentRegistry.get(name);
}

// ============================================================================
// Component Instance
// ============================================================================

export interface LiveComponentInstance<S extends LiveViewState = LiveViewState, P = any> {
  /** Component ID */
  id: string;

  /** Component name */
  name: string;

  /** Current state */
  state: S;

  /** Current props */
  props: P;

  /** Rendered HTML */
  html: string;

  /** Handle an event */
  handleEvent(event: LiveViewEvent): Promise<ViewPatch>;

  /** Update props */
  updateProps(props: P): Promise<ViewPatch>;

  /** Re-render */
  render(): string;

  /** Get diff from previous render */
  getDiff(): ViewPatch;
}

/**
 * Mount a LiveComponent instance
 */
export async function mountLiveComponent<S extends LiveViewState, P>(
  definition: LiveComponentDefinition<S, P>,
  props: P,
  socket: LiveSocket,
  parentId: string
): Promise<LiveComponentInstance<S, P>> {
  const differ = createDiffer();

  // Resolve component ID
  const id =
    typeof definition.id === 'function'
      ? definition.id(props)
      : definition.id || `${parentId}-component-${Math.random().toString(36).slice(2)}`;

  // Mount component
  let state = definition.mount ? await definition.mount(socket, props) : ({} as S);
  let currentProps = props;
  let previousHtml = '';
  let html = definition.render(state, currentProps);
  previousHtml = html;

  const instance: LiveComponentInstance<S, P> = {
    id,
    name: '',
    state,
    props: currentProps,
    html,

    async handleEvent(event: LiveViewEvent): Promise<ViewPatch> {
      if (definition.handleEvent) {
        state = await definition.handleEvent(event, state, socket);
      }
      return this.getDiff();
    },

    async updateProps(newProps: P): Promise<ViewPatch> {
      currentProps = newProps;
      if (definition.update) {
        state = await definition.update(newProps, state, socket);
      }
      return this.getDiff();
    },

    render(): string {
      html = wrapWithComponentId(id, definition.render(state, currentProps));
      return html;
    },

    getDiff(): ViewPatch {
      const newHtml = this.render();
      const patches = differ.diff(previousHtml, newHtml);
      previousHtml = newHtml;
      return { patches };
    },
  };

  return instance;
}

/**
 * Wrap component HTML with ID for targeting
 */
function wrapWithComponentId(id: string, html: string): string {
  // Find the first element and add phx-component attribute
  return html.replace(
    /^(\s*<\w+)/,
    `$1 data-phx-component="${id}" id="${id}"`
  );
}

// ============================================================================
// Component Rendering Helpers
// ============================================================================

/**
 * Render a LiveComponent within a LiveView template
 *
 * @example
 * ```typescript
 * render: (state) => `
 *   <div>
 *     ${liveComponent(Modal, { children: '<p>Content</p>' })}
 *   </div>
 * `,
 * ```
 */
export function liveComponent<P>(
  component: LiveComponentDefinition<any, P>,
  props: P,
  options?: { id?: string }
): string {
  // This returns a placeholder that the server will replace with the actual component
  const id = options?.id || `component-${Math.random().toString(36).slice(2)}`;
  const propsJson = JSON.stringify(props);

  return `<div data-phx-component-placeholder="${id}" data-phx-props="${escapeAttr(propsJson)}"></div>`;
}

/**
 * Render a named LiveComponent
 */
export function liveComponentByName(
  name: string,
  props: any,
  options?: { id?: string }
): string {
  const id = options?.id || `component-${name}-${Math.random().toString(36).slice(2)}`;
  const propsJson = JSON.stringify(props);

  return `<div data-phx-component="${name}" data-phx-component-id="${id}" data-phx-props="${escapeAttr(propsJson)}"></div>`;
}

function escapeAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ============================================================================
// Slots
// ============================================================================

export interface Slot {
  name: string;
  content: string;
  attributes?: Record<string, string>;
}

/**
 * Define a slot in a component
 */
export function slot(name: string = 'default'): string {
  return `<slot name="${name}"></slot>`;
}

/**
 * Render slot content
 */
export function renderSlot(slots: Slot[], name: string = 'default'): string {
  const s = slots.find(s => s.name === name);
  return s?.content || '';
}

/**
 * Check if a slot has content
 */
export function hasSlot(slots: Slot[], name: string = 'default'): boolean {
  return slots.some(s => s.name === name && s.content.trim().length > 0);
}

// ============================================================================
// Component Preloading
// ============================================================================

/**
 * Preload data for multiple components at once
 * This is useful when rendering a list of the same component type
 */
export async function preloadComponents<P>(
  component: LiveComponentDefinition<any, P>,
  propsList: P[]
): Promise<P[]> {
  if (component.preload) {
    return component.preload(propsList);
  }
  return propsList;
}

// ============================================================================
// Functional Component Helper
// ============================================================================

/**
 * Create a simple stateless component (function component)
 * These are rendered purely from props without state or events.
 */
export function createFunctionComponent<P>(
  render: (props: P) => string
): (props: P) => string {
  return render;
}

/**
 * Helper to create async data-fetching components
 */
export function createAsyncComponent<P, D>(
  fetchData: (props: P) => Promise<D>,
  render: (data: D, props: P) => string,
  fallback?: (props: P) => string
): LiveComponentDefinition<{ data: D | null; loading: boolean; error: string | null }, P> {
  return createLiveComponent({
    mount: async (socket, props) => {
      try {
        const data = await fetchData(props);
        return { data, loading: false, error: null };
      } catch (e) {
        return { data: null, loading: false, error: String(e) };
      }
    },

    render: (state, props) => {
      if (state.loading) {
        return fallback?.(props) || '<div class="loading">Loading...</div>';
      }
      if (state.error) {
        return `<div class="error">${state.error}</div>`;
      }
      if (state.data) {
        return render(state.data, props);
      }
      return '';
    },
  });
}
