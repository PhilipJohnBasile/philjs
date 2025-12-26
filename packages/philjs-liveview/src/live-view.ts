// @ts-nocheck
/**
 * PhilJS LiveView - Core LiveView Implementation
 */

import type {
  LiveViewDefinition,
  LiveViewState,
  LiveViewEvent,
  LiveViewParams,
  LiveSocket,
  FlashType,
  ViewPatch,
} from './types';
import { createDiffer } from './differ';

// ============================================================================
// LiveView Factory
// ============================================================================

/**
 * Create a new LiveView
 *
 * @example
 * ```typescript
 * const CounterView = createLiveView({
 *   mount: () => ({ count: 0 }),
 *
 *   handleEvent: (event, state) => {
 *     if (event.type === 'increment') {
 *       return { count: state.count + 1 };
 *     }
 *     return state;
 *   },
 *
 *   render: (state) => `
 *     <div>
 *       <span>Count: ${state.count}</span>
 *       <button phx-click="increment">+</button>
 *     </div>
 *   `,
 * });
 * ```
 */
export function createLiveView<S extends LiveViewState = LiveViewState>(
  definition: LiveViewDefinition<S>
): LiveViewDefinition<S> {
  return {
    ...definition,
    // Provide default implementations
    handleParams: definition.handleParams || ((_, __, socket) => socket.state as S),
    handleEvent: definition.handleEvent || ((_, state) => state),
    handleInfo: definition.handleInfo || ((_, state) => state),
    terminate: definition.terminate || (() => {}),
  };
}

// ============================================================================
// LiveView Instance
// ============================================================================

export interface LiveViewInstance<S extends LiveViewState = LiveViewState> {
  /** Current state */
  state: S;

  /** Rendered HTML */
  html: string;

  /** Socket reference */
  socket: LiveSocket;

  /** Handle an event */
  handleEvent(event: LiveViewEvent): Promise<ViewPatch>;

  /** Handle an info message */
  handleInfo(info: any): Promise<ViewPatch>;

  /** Handle params change */
  handleParams(params: LiveViewParams, uri: string): Promise<ViewPatch>;

  /** Re-render the view */
  render(): string;

  /** Get the current diff from previous render */
  getDiff(): ViewPatch;

  /** Terminate the view */
  terminate(reason: string): void;
}

/**
 * Create a LiveView instance for a connected socket
 */
export async function mountLiveView<S extends LiveViewState>(
  definition: LiveViewDefinition<S>,
  socket: LiveSocket
): Promise<LiveViewInstance<S>> {
  const differ = createDiffer();

  // Mount and get initial state
  let state = await definition.mount(socket);
  let previousHtml = '';
  let html = definition.render(state);
  previousHtml = html;

  const instance: LiveViewInstance<S> = {
    state,
    html,
    socket,

    async handleEvent(event: LiveViewEvent): Promise<ViewPatch> {
      if (definition.handleEvent) {
        state = await definition.handleEvent(event, state, socket);
        socket.assign(state);
      }
      return this.getDiff();
    },

    async handleInfo(info: any): Promise<ViewPatch> {
      if (definition.handleInfo) {
        state = await definition.handleInfo(info, state, socket);
        socket.assign(state);
      }
      return this.getDiff();
    },

    async handleParams(params: LiveViewParams, uri: string): Promise<ViewPatch> {
      if (definition.handleParams) {
        state = await definition.handleParams(params, uri, socket);
        socket.assign(state);
      }
      return this.getDiff();
    },

    render(): string {
      html = definition.render(state);
      return html;
    },

    getDiff(): ViewPatch {
      const newHtml = this.render();
      const patches = differ.diff(previousHtml, newHtml);
      previousHtml = newHtml;
      return { patches };
    },

    terminate(reason: string): void {
      if (definition.terminate) {
        definition.terminate(reason, state);
      }
    },
  };

  return instance;
}

// ============================================================================
// LiveView Helpers
// ============================================================================

/**
 * Create a socket implementation
 */
export function createLiveSocket(
  id: string,
  initialState: LiveViewState,
  options: {
    session?: Record<string, any>;
    params?: LiveViewParams;
    clientId: string;
    onPush?: (event: string, payload: any) => void;
    onRedirect?: (to: string, replace: boolean) => void;
    onPatch?: (to: string, replace: boolean) => void;
  }
): LiveSocket {
  const state = { ...initialState };
  const temporaryAssigns: string[] = [];
  const flashes: Array<{ type: FlashType; message: string }> = [];

  return {
    id,
    state,
    session: options.session || {},
    params: options.params || {},
    clientId: options.clientId,

    pushEvent(event: string, payload: any): void {
      options.onPush?.(event, payload);
    },

    pushRedirect(to: string, opts?: { replace?: boolean }): void {
      options.onRedirect?.(to, opts?.replace || false);
    },

    pushPatch(to: string, opts?: { replace?: boolean }): void {
      options.onPatch?.(to, opts?.replace || false);
    },

    assign(newState: Partial<LiveViewState>): void {
      Object.assign(state, newState);
    },

    putFlash(type: FlashType, message: string): void {
      flashes.push({ type, message });
    },

    getTemporaryAssigns(): string[] {
      return [...temporaryAssigns];
    },

    setTemporaryAssigns(keys: string[]): void {
      temporaryAssigns.length = 0;
      temporaryAssigns.push(...keys);
    },
  };
}

// ============================================================================
// PHX Attribute Helpers
// ============================================================================

/**
 * Extract PHX attributes from HTML
 */
export function extractPhxBindings(html: string): Map<string, PhxBinding[]> {
  const bindings = new Map<string, PhxBinding[]>();

  // Match phx-* attributes
  const regex = /phx-([\w-]+)(?:\.([.\w]+))?="([^"]+)"/g;
  let match;

  while ((match = regex.exec(html)) !== null) {
    const [, type, modifiers, value] = match;
    const key = type;

    if (!bindings.has(key)) {
      bindings.set(key, []);
    }

    bindings.get(key)!.push({
      type,
      modifiers: modifiers ? modifiers.split('.') : [],
      value,
      raw: match[0],
    });
  }

  return bindings;
}

interface PhxBinding {
  type: string;
  modifiers: string[];
  value: string;
  raw: string;
}

// ============================================================================
// Template Helpers
// ============================================================================

/**
 * HTML template tag for syntax highlighting and escaping
 */
export function html(strings: TemplateStringsArray, ...values: any[]): string {
  return strings.reduce((result, str, i) => {
    const value = values[i - 1];
    return result + escapeHtml(String(value ?? '')) + str;
  });
}

/**
 * Raw HTML (no escaping)
 */
export function raw(value: string): RawHtml {
  return new RawHtml(value);
}

class RawHtml {
  constructor(public value: string) {}
  toString() {
    return this.value;
  }
}

/**
 * Escape HTML special characters
 */
function escapeHtml(str: string): string {
  if (str instanceof RawHtml) return str.value;

  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Conditionally render content
 */
export function when<T>(condition: boolean, content: T): T | '' {
  return condition ? content : '';
}

/**
 * Render a list with a template
 */
export function each<T>(
  items: T[],
  keyFn: (item: T, index: number) => string,
  template: (item: T, index: number) => string
): string {
  return items
    .map((item, i) => {
      const key = keyFn(item, i);
      const content = template(item, i);
      // Inject phx-key for efficient updates
      return content.replace(/^(<\w+)/, `$1 phx-key="${key}"`);
    })
    .join('');
}

// ============================================================================
// Form Helpers
// ============================================================================

/**
 * Generate form input with phx bindings
 */
export function input(
  name: string,
  options: {
    type?: string;
    value?: any;
    phxChange?: boolean;
    phxBlur?: boolean;
    phxDebounce?: number;
    class?: string;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    [key: string]: any;
  } = {}
): string {
  const {
    type = 'text',
    value = '',
    phxChange = true,
    phxBlur = false,
    phxDebounce,
    class: className,
    ...rest
  } = options;

  const attrs: string[] = [
    `type="${type}"`,
    `name="${name}"`,
    `id="${name}"`,
  ];

  if (value !== undefined && value !== '') {
    attrs.push(`value="${escapeHtml(String(value))}"`);
  }

  if (className) {
    attrs.push(`class="${className}"`);
  }

  if (phxChange) {
    attrs.push(`phx-change="validate"`);
  }

  if (phxBlur) {
    attrs.push(`phx-blur="validate"`);
  }

  if (phxDebounce !== undefined) {
    attrs.push(`phx-debounce="${phxDebounce}"`);
  }

  for (const [key, val] of Object.entries(rest)) {
    if (val === true) {
      attrs.push(key);
    } else if (val !== false && val !== undefined) {
      attrs.push(`${key}="${escapeHtml(String(val))}"`);
    }
  }

  return `<input ${attrs.join(' ')} />`;
}

/**
 * Render validation errors for a field
 */
export function errorTag(errors: Record<string, string[]>, field: string): string {
  const fieldErrors = errors[field];
  if (!fieldErrors || fieldErrors.length === 0) return '';

  return `<div class="error">${fieldErrors.map(e => escapeHtml(e)).join(', ')}</div>`;
}
