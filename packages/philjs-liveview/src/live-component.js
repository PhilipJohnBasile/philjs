// @ts-nocheck
/**
 * PhilJS LiveView - LiveComponent Implementation
 *
 * LiveComponents are stateful components that live within a LiveView.
 * They have their own state and can handle events independently.
 */
import { createDiffer } from './differ.js';
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
export function createLiveComponent(definition) {
    return {
        ...definition,
        mount: definition.mount || (() => ({})),
        update: definition.update || ((_, state) => state),
        handleEvent: definition.handleEvent || ((_, state) => state),
    };
}
// ============================================================================
// Component Registry
// ============================================================================
const componentRegistry = new Map();
/**
 * Register a global LiveComponent
 */
export function registerComponent(name, component) {
    componentRegistry.set(name, component);
}
/**
 * Get a registered component
 */
export function getComponent(name) {
    return componentRegistry.get(name);
}
/**
 * Mount a LiveComponent instance
 */
export async function mountLiveComponent(definition, props, socket, parentId) {
    const differ = createDiffer();
    // Resolve component ID
    const id = typeof definition.id === 'function'
        ? definition.id(props)
        : definition.id || `${parentId}-component-${Math.random().toString(36).slice(2)}`;
    // Mount component
    let state = definition.mount ? await definition.mount(socket, props) : {};
    let currentProps = props;
    let previousHtml = '';
    let html = definition.render(state, currentProps);
    previousHtml = html;
    const instance = {
        id,
        name: '',
        state,
        props: currentProps,
        html,
        async handleEvent(event) {
            if (definition.handleEvent) {
                state = await definition.handleEvent(event, state, socket);
            }
            return this.getDiff();
        },
        async updateProps(newProps) {
            currentProps = newProps;
            if (definition.update) {
                state = await definition.update(newProps, state, socket);
            }
            return this.getDiff();
        },
        render() {
            html = wrapWithComponentId(id, definition.render(state, currentProps));
            return html;
        },
        getDiff() {
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
function wrapWithComponentId(id, html) {
    // Find the first element and add phx-component attribute
    return html.replace(/^(\s*<\w+)/, `$1 data-phx-component="${id}" id="${id}"`);
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
export function liveComponent(component, props, options) {
    // This returns a placeholder that the server will replace with the actual component
    const id = options?.id || `component-${Math.random().toString(36).slice(2)}`;
    const propsJson = JSON.stringify(props);
    return `<div data-phx-component-placeholder="${id}" data-phx-props="${escapeAttr(propsJson)}"></div>`;
}
/**
 * Render a named LiveComponent
 */
export function liveComponentByName(name, props, options) {
    const id = options?.id || `component-${name}-${Math.random().toString(36).slice(2)}`;
    const propsJson = JSON.stringify(props);
    return `<div data-phx-component="${name}" data-phx-component-id="${id}" data-phx-props="${escapeAttr(propsJson)}"></div>`;
}
function escapeAttr(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
/**
 * Define a slot in a component
 */
export function slot(name = 'default') {
    return `<slot name="${name}"></slot>`;
}
/**
 * Render slot content
 */
export function renderSlot(slots, name = 'default') {
    const s = slots.find(s => s.name === name);
    return s?.content || '';
}
/**
 * Check if a slot has content
 */
export function hasSlot(slots, name = 'default') {
    return slots.some(s => s.name === name && s.content.trim().length > 0);
}
// ============================================================================
// Component Preloading
// ============================================================================
/**
 * Preload data for multiple components at once
 * This is useful when rendering a list of the same component type
 */
export async function preloadComponents(component, propsList) {
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
export function createFunctionComponent(render) {
    return render;
}
/**
 * Helper to create async data-fetching components
 */
export function createAsyncComponent(fetchData, render, fallback) {
    return createLiveComponent({
        mount: async (socket, props) => {
            try {
                const data = await fetchData(props);
                return { data, loading: false, error: null };
            }
            catch (e) {
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
//# sourceMappingURL=live-component.js.map