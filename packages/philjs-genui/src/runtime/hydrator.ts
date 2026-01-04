/**
 * GenUI Hydrator
 * Converts A2UI messages into live DOM elements
 */

import type {
  A2UIMessage,
  A2UIComponent,
  A2UIBinding,
  A2UIAction,
  A2UILayout,
  A2UIRenderPayload,
  A2UIUpdatePayload,
} from '../protocol/a2ui-schema.js';
import type { ComponentRegistry, RenderContext } from '../registry/component-registry.js';
import { ASTValidator, type SandboxConfig } from '../sandbox/ast-validator.js';

/**
 * Hydration result
 */
export interface HydrationResult {
  /** Whether hydration succeeded */
  success: boolean;
  /** Root element if successful */
  element?: HTMLElement;
  /** Errors if failed */
  errors?: Array<{ code: string; message: string }>;
  /** Cleanup function */
  cleanup?: () => void;
  /** Component map for updates */
  componentMap?: Map<string, HTMLElement>;
}

/**
 * Hydrator options
 */
export interface HydratorOptions {
  /** Sandbox configuration */
  sandbox?: Partial<SandboxConfig>;
  /** Callback when agent receives action */
  onAgentAction?: (actionId: string, event: { type: string; data?: unknown }) => void;
  /** Signal store for reactive bindings */
  signals?: Map<string, { get: () => unknown; set: (value: unknown) => void }>;
  /** Whether to animate transitions */
  animateTransitions?: boolean;
}

/**
 * GenUI Hydrator
 * Converts validated A2UI messages into live DOM
 */
export class GenUIHydrator {
  private registry: ComponentRegistry;
  private validator: ASTValidator;
  private options: HydratorOptions;
  private componentMap: Map<string, HTMLElement> = new Map();
  private cleanupFunctions: Array<() => void> = [];

  constructor(registry: ComponentRegistry, options: HydratorOptions = {}) {
    this.registry = registry;
    const sandboxConfig = { allowUnknownComponents: true, ...options.sandbox };
    this.validator = new ASTValidator(sandboxConfig);
    this.options = options;
  }

  /**
   * Hydrate an A2UI message into a container
   */
  hydrate(message: A2UIMessage, container: HTMLElement): HydrationResult {
    // Validate the message
    const validation = this.validator.validate(message);
    if (!validation.valid) {
      return {
        success: false,
        errors: validation.errors.map((e) => ({ code: e.code, message: e.message })),
      };
    }

    try {
      if (message.type === 'render' && message.payload.type === 'render') {
        // Clear previous content for full renders
        this.cleanup();
        container.innerHTML = '';
        this.componentMap.clear();
        return this.hydrateRenderPayload(message.payload, container);
      } else if (message.type === 'update' && message.payload.type === 'update') {
        return this.hydrateUpdatePayload(message.payload);
      }

      return {
        success: false,
        errors: [{ code: 'INVALID_MESSAGE', message: `Unknown message type: ${message.type}` }],
      };
    } catch (error) {
      return {
        success: false,
        errors: [{ code: 'HYDRATION_ERROR', message: error instanceof Error ? error.message : 'Unknown error' }],
      };
    }
  }

  /**
   * Hydrate a render payload
   */
  private hydrateRenderPayload(
    payload: A2UIRenderPayload,
    container: HTMLElement
  ): HydrationResult {
    // Create layout wrapper
    const layoutElement = this.createLayoutElement(payload.layout);

    // Create render context
    const context = this.createRenderContext(payload);

    // Render all components
    for (const component of payload.components) {
      const element = this.renderComponent(component, context);
      if (element) {
        layoutElement.appendChild(element);
      }
    }

    // Apply bindings
    if (payload.bindings) {
      this.applyBindings(payload.bindings, context);
    }

    // Setup actions
    if (payload.actions) {
      this.setupActions(payload.actions, context);
    }

    // Mount to container
    container.appendChild(layoutElement);

    return {
      success: true,
      element: layoutElement,
      cleanup: () => this.cleanup(),
      componentMap: new Map(this.componentMap),
    };
  }

  /**
   * Hydrate an update payload
   */
  private hydrateUpdatePayload(payload: A2UIUpdatePayload): HydrationResult {
    const targetElement = this.componentMap.get(payload.targetId);
    if (!targetElement) {
      return {
        success: false,
        errors: [{ code: 'COMPONENT_NOT_FOUND', message: `Component not found: ${payload.targetId}` }],
      };
    }

    // Update props as attributes
    if (payload.props) {
      for (const [key, value] of Object.entries(payload.props)) {
        if (value === undefined || value === null) {
          targetElement.removeAttribute(key);
        } else if (typeof value === 'boolean') {
          if (value) targetElement.setAttribute(key, '');
          else targetElement.removeAttribute(key);
        } else {
          targetElement.setAttribute(key, String(value));
        }
      }
    }

    // Replace children if provided
    if (payload.children) {
      const context = this.createRenderContext({ type: 'render', layout: { type: 'stack' }, components: [] });
      targetElement.innerHTML = '';
      for (const child of payload.children) {
        const childElement = this.renderComponent(child, context);
        if (childElement) {
          targetElement.appendChild(childElement);
        }
      }
    }

    // Apply animation if specified
    if (payload.animation && this.options.animateTransitions) {
      this.applyAnimation(targetElement, payload.animation);
    }

    return {
      success: true,
      element: targetElement,
      componentMap: new Map(this.componentMap),
    };
  }

  /**
   * Create a layout wrapper element
   */
  private createLayoutElement(layout: A2UILayout): HTMLElement {
    const element = document.createElement('div');
    element.dataset.layout = layout.type;

    switch (layout.type) {
      case 'stack':
      case 'flex':
        element.style.display = 'flex';
        element.style.flexDirection = layout.direction || 'column';
        break;
      case 'grid':
        element.style.display = 'grid';
        if (layout.columns) element.style.gridTemplateColumns = String(layout.columns);
        if (layout.rows) element.style.gridTemplateRows = String(layout.rows);
        break;
      case 'flow':
        element.style.display = 'block';
        break;
      case 'absolute':
        element.style.position = 'relative';
        break;
    }

    if (layout.gap) element.style.gap = String(layout.gap);
    if (layout.align) element.style.alignItems = layout.align;
    if (layout.justify) {
      const j = layout.justify;
      element.style.justifyContent = j === 'between' ? 'space-between' : j === 'around' ? 'space-around' : j === 'evenly' ? 'space-evenly' : j;
    }
    if (layout.wrap) element.style.flexWrap = 'wrap';

    if (layout.padding) {
      if (Array.isArray(layout.padding)) {
        element.style.padding = layout.padding.map((p) => `${p}px`).join(' ');
      } else {
        element.style.padding = typeof layout.padding === 'number' ? `${layout.padding}px` : layout.padding;
      }
    }

    return element;
  }

  /**
   * Create render context for component rendering
   */
  private createRenderContext(payload: A2UIRenderPayload): RenderContext {
    const signals = this.options.signals || new Map();
    const actions = new Map<string, (event: Event) => void>();

    return {
      parent: null,
      signals,
      actions,
      renderChild: (child: A2UIComponent) => this.renderComponent(child, {
        parent: null,
        signals,
        actions,
        renderChild: () => null,
        getBoundValue: (path) => this.resolvePath(signals, path),
        emitToAgent: this.emitToAgent.bind(this),
      }),
      getBoundValue: (path) => this.resolvePath(signals, path),
      emitToAgent: this.emitToAgent.bind(this),
    };
  }

  /**
   * Render a single component
   */
  private renderComponent(component: A2UIComponent, context: RenderContext): HTMLElement | null {
    // Handle conditional rendering
    if (component.when) {
      const result = this.evaluateCondition(component.when.expression, context);
      if (!result) {
        if (component.when.fallback) {
          return this.renderComponent(component.when.fallback, context);
        }
        return null;
      }
    }

    // Handle iteration
    if (component.each) {
      const container = document.createElement('div');
      container.dataset.each = component.each.source;

      const items = this.resolvePath(context.signals, component.each.source) as unknown[];
      if (!Array.isArray(items) || items.length === 0) {
        if (component.each.empty) {
          const emptyElement = this.renderComponent(component.each.empty, context);
          if (emptyElement) container.appendChild(emptyElement);
        }
        return container;
      }

      for (let i = 0; i < items.length; i++) {
        // Create a new context with item variables
        const itemContext = { ...context };
        // For simplicity, we'll render the component as-is
        // In a full implementation, we'd inject item/index into the context
        const childComponent = { ...component, each: undefined, id: `${component.id}-${i}` };
        const element = this.renderComponent(childComponent, itemContext);
        if (element) container.appendChild(element);
      }

      return container;
    }

    // Get renderer from registry
    const renderer = this.registry.getRenderer(component.type);
    if (!renderer) {
      // Fallback: create a generic div with warning
      const fallback = document.createElement('div');
      fallback.id = component.id;
      fallback.dataset.unknownComponent = component.type;
      fallback.textContent = `[Unknown component: ${component.type}]`;
      this.applyComponentDecorations(fallback, component);
      this.componentMap.set(component.id, fallback);
      return fallback;
    }

    // Render component
    const element = renderer(component, context);
    if (element) {
      this.applyComponentDecorations(element, component);
      this.componentMap.set(component.id, element);
    }

    return element;
  }

  /**
   * Apply data bindings
   */
  private applyBindings(bindings: A2UIBinding[], context: RenderContext): void {
    for (const binding of bindings) {
      const element = this.componentMap.get(binding.targetId);
      if (!element) continue;

      // Get initial value
      let value = this.resolvePath(context.signals, binding.path);

      // Apply transform if specified
      if (binding.transform) {
        value = this.evaluateTransform(binding.transform, value, context);
      }

      // Use default if undefined
      if (value === undefined && binding.defaultValue !== undefined) {
        value = binding.defaultValue;
      }

      // Set the property
      this.setElementProperty(element, binding.targetProp, value);

      // Setup reactive subscription if using signals
      if (this.options.signals) {
        const signal = this.options.signals.get(binding.path);
        if (signal) {
          // In a real implementation, we'd use effects here
          // For now, just set initial value
        }
      }
    }
  }

  /**
   * Setup action handlers
   */
  private setupActions(actions: A2UIAction[], context: RenderContext): void {
    for (const action of actions) {
      // Find elements that should trigger this action
      // Actions are typically associated with components via data attributes
      for (const [componentId, element] of this.componentMap) {
        // Check if element has this action
        const eventName = action.trigger === 'custom' ? action.customEvent : action.trigger;
        if (!eventName) continue;

        const handler = (event: Event) => {
          if (action.preventDefault) event.preventDefault();
          if (action.stopPropagation) event.stopPropagation();

          this.executeAction(action, event, context);
        };

        // Apply debounce/throttle if specified
        const finalHandler = action.debounce
          ? this.debounce(handler, action.debounce)
          : action.throttle
            ? this.throttle(handler, action.throttle)
            : handler;

        element.addEventListener(eventName, finalHandler);

        // Store cleanup function
        this.cleanupFunctions.push(() => {
          element.removeEventListener(eventName, finalHandler);
        });
      }
    }
  }

  /**
   * Execute an action handler
   */
  private executeAction(action: A2UIAction, event: Event, context: RenderContext): void {
    const handler = action.handler;

    switch (handler.type) {
      case 'emit':
        this.emitToAgent(action.id, { type: handler.event, data: handler.payload });
        break;

      case 'navigate':
        if (handler.replace) {
          window.location.replace(handler.to);
        } else {
          window.location.href = handler.to;
        }
        break;

      case 'signal':
        const signal = this.options.signals?.get(handler.path);
        if (signal) {
          if (handler.action === 'set') {
            signal.set(handler.value);
          } else if (handler.action === 'update' && typeof handler.value === 'function') {
            signal.set((handler.value as (v: unknown) => unknown)(signal.get()));
          } else if (handler.action === 'reset') {
            signal.set(undefined);
          }
        }
        break;

      case 'agent':
        this.emitToAgent(action.id, {
          type: 'agent',
          data: { intent: handler.intent, context: handler.context },
        });
        break;
    }
  }

  /**
   * Emit event to agent
   */
  private emitToAgent(actionId: string, event: { type: string; data?: unknown }): void {
    this.options.onAgentAction?.(actionId, event);
  }

  /**
   * Resolve a path in the signals store
   */
  private resolvePath(signals: Map<string, unknown>, path: string): unknown {
    const signal = signals.get(path);
    if (signal && typeof signal === 'object' && 'get' in signal) {
      return (signal as { get: () => unknown }).get();
    }
    return signal;
  }

  /**
   * Evaluate a condition expression (safely)
   */
  private evaluateCondition(expression: string, context: RenderContext): boolean {
    // Simple expression evaluation
    // In production, use a proper safe expression parser
    try {
      // Only allow simple boolean checks
      if (expression === 'true') return true;
      if (expression === 'false') return false;

      // Check for simple path lookups
      const pathMatch = expression.match(/^(\w+(?:\.\w+)*)$/);
      if (pathMatch) {
        const value = context.getBoundValue(pathMatch[1]!);
        return Boolean(value);
      }

      // Check for negation
      const negationMatch = expression.match(/^!(\w+(?:\.\w+)*)$/);
      if (negationMatch) {
        const value = context.getBoundValue(negationMatch[1]!);
        return !value;
      }

      return false;
    } catch {
      return false;
    }
  }

  /**
   * Evaluate a transform expression (safely)
   */
  private evaluateTransform(transform: string, value: unknown, context: RenderContext): unknown {
    // Simple transforms only
    // In production, use a proper safe expression parser
    try {
      if (transform === 'toString') return String(value);
      if (transform === 'toNumber') return Number(value);
      if (transform === 'toBoolean') return Boolean(value);
      if (transform === 'toUpperCase' && typeof value === 'string') return value.toUpperCase();
      if (transform === 'toLowerCase' && typeof value === 'string') return value.toLowerCase();
      if (transform === 'trim' && typeof value === 'string') return value.trim();
      if (transform === 'length' && (typeof value === 'string' || Array.isArray(value))) return value.length;
      return value;
    } catch {
      return value;
    }
  }

  /**
   * Set a property on an element
   */
  private setElementProperty(element: HTMLElement, prop: string, value: unknown): void {
    if (prop === 'textContent' || prop === 'innerText') {
      element.textContent = String(value ?? '');
    } else if (prop === 'innerHTML') {
      // Block innerHTML for security
      element.textContent = String(value ?? '');
    } else if (prop === 'value' && 'value' in element) {
      (element as HTMLInputElement).value = String(value ?? '');
    } else if (prop === 'checked' && 'checked' in element) {
      (element as HTMLInputElement).checked = Boolean(value);
    } else if (prop === 'disabled' && 'disabled' in element) {
      (element as HTMLInputElement).disabled = Boolean(value);
    } else if (prop.startsWith('data-')) {
      element.setAttribute(prop, String(value ?? ''));
    } else if (prop.startsWith('aria-')) {
      element.setAttribute(prop, String(value ?? ''));
    } else {
      element.setAttribute(prop, String(value ?? ''));
    }
  }

  /**
   * Apply class, style, and accessibility metadata to a rendered element.
   */
  private applyComponentDecorations(element: HTMLElement, component: A2UIComponent): void {
    if (component.className) {
      for (const className of component.className.split(/\s+/)) {
        if (className) element.classList.add(className);
      }
    }

    if (component.style) {
      for (const [prop, value] of Object.entries(component.style)) {
        (element.style as Record<string, string | number>)[prop] = value as string | number;
      }
    }

    if (component.a11y) {
      if (component.a11y.role) element.setAttribute('role', component.a11y.role);
      if (component.a11y.label) element.setAttribute('aria-label', component.a11y.label);
      if (component.a11y.labelledBy) {
        element.setAttribute('aria-labelledby', component.a11y.labelledBy);
      }
      if (component.a11y.describedBy) {
        element.setAttribute('aria-describedby', component.a11y.describedBy);
      }
      if (component.a11y.live) element.setAttribute('aria-live', component.a11y.live);
      if (component.a11y.tabIndex !== undefined) element.tabIndex = component.a11y.tabIndex;
      if (component.a11y.hidden) element.setAttribute('aria-hidden', 'true');
    }
  }

  /**
   * Apply animation to element
   */
  private applyAnimation(
    element: HTMLElement,
    animation: { type: string; duration?: number; easing?: string; direction?: string }
  ): void {
    const duration = animation.duration || 300;
    const easing = animation.easing || 'ease';

    const keyframes: Keyframe[] = [];
    switch (animation.type) {
      case 'fade':
        keyframes.push({ opacity: 0 }, { opacity: 1 });
        break;
      case 'slide':
        const dir = animation.direction || 'up';
        const start = dir === 'up' ? '20px' : dir === 'down' ? '-20px' : dir === 'left' ? '20px' : '-20px';
        const prop = dir === 'up' || dir === 'down' ? 'translateY' : 'translateX';
        keyframes.push({ transform: `${prop}(${start})`, opacity: 0 }, { transform: `${prop}(0)`, opacity: 1 });
        break;
      case 'scale':
        keyframes.push({ transform: 'scale(0.9)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 });
        break;
    }

    if (keyframes.length > 0) {
      element.animate(keyframes, { duration, easing, fill: 'forwards' });
    }
  }

  /**
   * Debounce helper
   */
  private debounce<T extends (...args: unknown[]) => void>(fn: T, delay: number): T {
    let timeoutId: ReturnType<typeof setTimeout>;
    return ((...args: unknown[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), delay);
    }) as T;
  }

  /**
   * Throttle helper
   */
  private throttle<T extends (...args: unknown[]) => void>(fn: T, limit: number): T {
    let inThrottle = false;
    return ((...args: unknown[]) => {
      if (!inThrottle) {
        fn(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    }) as T;
  }

  /**
   * Cleanup all resources
   */
  cleanup(): void {
    for (const cleanup of this.cleanupFunctions) {
      cleanup();
    }
    this.cleanupFunctions = [];
    this.componentMap.clear();
  }
}

/**
 * Create a new hydrator
 */
export function createHydrator(registry: ComponentRegistry, options?: HydratorOptions): GenUIHydrator {
  return new GenUIHydrator(registry, options);
}
