/**
 * PhilJS Native Adapter
 *
 * Converts Universal Components to native PhilJS components
 */

import type { UniversalComponentDef, VNode, RenderContext, SlotContent } from '../protocol';
import { createSignal, createEffect, type Signal } from '@philjs/core';
import { Fragment } from '../protocol';

export interface PhilJSComponentOptions {
  /** Whether to enable signal-based reactivity */
  reactive?: boolean;
}

/**
 * Convert a Universal Component to a PhilJS component function
 */
export function toPhilJS<
  Props extends Record<string, unknown>,
  Events extends Record<string, unknown>,
>(
  component: UniversalComponentDef<Props, Events>,
  _options: PhilJSComponentOptions = {}
): (props: Partial<Props>) => ReturnType<typeof createPhilJSComponent> {
  return (initialProps: Partial<Props>) => {
    return createPhilJSComponent(component, initialProps);
  };
}

function createPhilJSComponent<
  Props extends Record<string, unknown>,
  Events extends Record<string, unknown>,
>(
  component: UniversalComponentDef<Props, Events>,
  initialProps: Partial<Props>
) {
  // Create reactive signals for each prop
  const propSignals = new Map<keyof Props, [Signal<unknown>, (v: unknown) => void]>();
  const propNames = Object.keys(component.props) as (keyof Props)[];

  for (const propName of propNames) {
    const def = component.props[propName];
    const initialValue = initialProps[propName] ?? def.default;
    const [signal, setSignal] = createSignal(initialValue);
    propSignals.set(propName, [signal, setSignal]);
  }

  // Event emitter
  const eventListeners = new Map<keyof Events, Set<(payload: unknown) => void>>();

  // Create render context
  const context: RenderContext<Props, Events> = {
    props: Object.fromEntries(
      Array.from(propSignals.entries()).map(([key, [signal]]) => [key, signal])
    ) as RenderContext<Props, Events>['props'],

    emit: (event, payload) => {
      const listeners = eventListeners.get(event);
      if (listeners) {
        for (const listener of listeners) {
          listener(payload);
        }
      }
    },

    slot: (name = ''): SlotContent => {
      // In PhilJS, slots are handled via children prop
      return {
        hasContent: false,
        render: () => null,
      };
    },

    host: () => null,

    update: () => {
      // PhilJS uses signals, so updates are automatic
    },
  };

  // Call lifecycle hooks
  component.lifecycle?.beforeMount?.();

  // Create render effect
  let currentVNode: ReturnType<typeof component.render>;

  createEffect(() => {
    component.lifecycle?.beforeUpdate?.();
    currentVNode = component.render(context);
    component.lifecycle?.updated?.();
  });

  component.lifecycle?.mounted?.();

  // Return component interface
  return {
    /** Get current rendered output */
    get vnode() {
      return currentVNode;
    },

    /** Update a prop */
    setProp<K extends keyof Props>(key: K, value: Props[K]): void {
      const signal = propSignals.get(key);
      if (signal) {
        signal[1](value);
      }
    },

    /** Get current prop value */
    getProp<K extends keyof Props>(key: K): Props[K] | undefined {
      const signal = propSignals.get(key);
      return signal ? (signal[0]() as Props[K]) : undefined;
    },

    /** Subscribe to an event */
    on<K extends keyof Events>(event: K, callback: (payload: Events[K]) => void): () => void {
      if (!eventListeners.has(event)) {
        eventListeners.set(event, new Set());
      }
      eventListeners.get(event)!.add(callback as (payload: unknown) => void);

      return () => {
        eventListeners.get(event)?.delete(callback as (payload: unknown) => void);
      };
    },

    /** Unmount the component */
    unmount(): void {
      component.lifecycle?.beforeUnmount?.();
      eventListeners.clear();
      component.lifecycle?.unmounted?.();
    },

    /** Render to DOM element */
    mount(container: Element): void {
      const render = () => {
        container.innerHTML = '';
        const nodes = vnodeToDOM(currentVNode);
        for (const node of nodes) {
          container.appendChild(node);
        }
      };

      createEffect(render);
    },
  };
}

// ============================================================================
// DOM Rendering Helpers
// ============================================================================

function vnodeToDOM(vnode: VNode | VNode[] | string | number | null | undefined): Node[] {
  if (vnode === null || vnode === undefined) {
    return [];
  }

  if (typeof vnode === 'string' || typeof vnode === 'number') {
    return [document.createTextNode(String(vnode))];
  }

  if (Array.isArray(vnode)) {
    return vnode.flatMap((v) => vnodeToDOM(v));
  }

  if (vnode.type === Fragment) {
    return vnode.children.flatMap((c) => vnodeToDOM(c));
  }

  if (vnode.type === 'TEXT_NODE') {
    return [document.createTextNode(String(vnode.props.nodeValue ?? ''))];
  }

  if (typeof vnode.type === 'string') {
    const el = document.createElement(vnode.type);

    for (const [key, value] of Object.entries(vnode.props)) {
      if (key.startsWith('on') && typeof value === 'function') {
        const eventName = key.slice(2).toLowerCase();
        el.addEventListener(eventName, value as EventListener);
      } else if (key === 'className') {
        el.setAttribute('class', String(value));
      } else if (key === 'style' && typeof value === 'object') {
        Object.assign(el.style, value);
      } else if (typeof value === 'boolean') {
        if (value) el.setAttribute(key, '');
      } else if (value != null) {
        el.setAttribute(key, String(value));
      }
    }

    for (const child of vnode.children) {
      const childNodes = vnodeToDOM(child);
      for (const node of childNodes) {
        el.appendChild(node);
      }
    }

    return [el];
  }

  return [];
}
