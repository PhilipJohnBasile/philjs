// @ts-nocheck
/**
 * PhilJS LiveView - Client Hooks
 *
 * Hooks provide client-side JavaScript interop for LiveView elements.
 * They're triggered by lifecycle events on elements with phx-hook attribute.
 */

import type { HookDefinition, Hooks, ClientHook } from './types.js';

// ============================================================================
// Hook Registry
// ============================================================================

const hookRegistry: Hooks = {};

/**
 * Register hooks globally
 */
export function registerHooks(hooks: Hooks): void {
  Object.assign(hookRegistry, hooks);
}

/**
 * Get a registered hook
 */
export function getHook(name: string): HookDefinition | undefined {
  return hookRegistry[name];
}

/**
 * Get all registered hooks
 */
export function getAllHooks(): Hooks {
  return { ...hookRegistry };
}

// ============================================================================
// Hook Instance Manager
// ============================================================================

interface HookInstance extends ClientHook {
  name: string;
  destroyed: boolean;
}

const activeHooks = new Map<HTMLElement, HookInstance>();

/**
 * Mount a hook on an element
 */
export function mountHook(
  element: HTMLElement,
  hookName: string,
  context: {
    pushEvent: (event: string, payload: any, target?: string) => void;
    pushEventTo: (selector: string, event: string, payload: any) => void;
    handleEvent: (event: string, callback: (payload: any) => void) => void;
    upload: (name: string, files: FileList) => void;
  }
): void {
  const definition = getHook(hookName);
  if (!definition) {
    console.warn(`Hook "${hookName}" not found`);
    return;
  }

  const instance: HookInstance = {
    name: hookName,
    destroyed: false,
    el: element,
    pushEvent: context.pushEvent,
    pushEventTo: context.pushEventTo,
    handleEvent: context.handleEvent,
    upload: context.upload,

    // Copy lifecycle methods
    mounted: definition.mounted?.bind(definition),
    beforeUpdate: definition.beforeUpdate?.bind(definition),
    updated: definition.updated?.bind(definition),
    beforeDestroy: definition.beforeDestroy?.bind(definition),
    disconnected: definition.disconnected?.bind(definition),
    reconnected: definition.reconnected?.bind(definition),
  };

  // Bind 'this' to instance for all methods
  Object.keys(definition).forEach((key) => {
    const fn = (definition as any)[key];
    if (typeof fn === 'function') {
      (instance as any)[key] = fn.bind(instance);
    }
  });

  activeHooks.set(element, instance);

  // Call mounted
  instance.mounted?.();
}

/**
 * Update a hook (call beforeUpdate and updated)
 */
export function updateHook(element: HTMLElement): void {
  const instance = activeHooks.get(element);
  if (instance && !instance.destroyed) {
    instance.beforeUpdate?.();
    instance.updated?.();
  }
}

/**
 * Destroy a hook
 */
export function destroyHook(element: HTMLElement): void {
  const instance = activeHooks.get(element);
  if (instance) {
    instance.beforeDestroy?.();
    instance.destroyed = true;
    activeHooks.delete(element);
  }
}

/**
 * Notify hooks of disconnection
 */
export function disconnectHooks(): void {
  for (const instance of activeHooks.values()) {
    instance.disconnected?.();
  }
}

/**
 * Notify hooks of reconnection
 */
export function reconnectHooks(): void {
  for (const instance of activeHooks.values()) {
    instance.reconnected?.();
  }
}

// ============================================================================
// Built-in Hooks
// ============================================================================

/**
 * Infinite scroll hook
 */
export const InfiniteScroll: HookDefinition = {
  mounted() {
    const el = this.el!;
    const loadMoreEvent = el.getAttribute('phx-load-more') || 'load-more';

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          this.pushEvent!(loadMoreEvent, {});
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);

    (this as any)._observer = observer;
  },

  destroyed() {
    (this as any)._observer?.disconnect();
  },
};

/**
 * Focus hook - focuses element on mount/update
 */
export const Focus: HookDefinition = {
  mounted() {
    this.el!.focus();
  },

  updated() {
    this.el!.focus();
  },
};

/**
 * Clipboard hook - copy to clipboard
 */
export const Clipboard: HookDefinition = {
  mounted() {
    const el = this.el!;
    const targetSelector = el.getAttribute('data-clipboard-target');
    const text = el.getAttribute('data-clipboard-text');

    el.addEventListener('click', async () => {
      let content = text;

      if (targetSelector) {
        const target = document.querySelector(targetSelector);
        if (target) {
          content = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement
            ? target.value
            : target.textContent || '';
        }
      }

      if (content) {
        await navigator.clipboard.writeText(content);
        this.pushEvent!('clipboard:copied', { text: content });
      }
    });
  },
};

/**
 * Local time hook - converts UTC to local time
 */
export const LocalTime: HookDefinition = {
  mounted() {
    this.updateTime();
  },

  updated() {
    this.updateTime();
  },

  updateTime() {
    const el = this.el!;
    const utc = el.getAttribute('data-utc');
    const format = el.getAttribute('data-format') || 'datetime';

    if (utc) {
      const date = new Date(utc);
      let formatted: string;

      switch (format) {
        case 'date':
          formatted = date.toLocaleDateString();
          break;
        case 'time':
          formatted = date.toLocaleTimeString();
          break;
        case 'relative':
          formatted = formatRelativeTime(date);
          break;
        default:
          formatted = date.toLocaleString();
      }

      el.textContent = formatted;
    }
  },
} as HookDefinition & { updateTime(): void };

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}

/**
 * Sortable hook - drag and drop sorting
 */
export const Sortable: HookDefinition = {
  mounted() {
    const el = this.el!;
    const group = el.getAttribute('phx-sortable-group') || 'default';
    let draggedEl: HTMLElement | null = null;

    el.querySelectorAll('[phx-sortable-item]').forEach((item) => {
      const itemEl = item as HTMLElement;
      itemEl.draggable = true;

      itemEl.addEventListener('dragstart', (e) => {
        draggedEl = itemEl;
        itemEl.classList.add('dragging');
        e.dataTransfer!.effectAllowed = 'move';
      });

      itemEl.addEventListener('dragend', () => {
        itemEl.classList.remove('dragging');
        draggedEl = null;
      });

      itemEl.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer!.dropEffect = 'move';
      });

      itemEl.addEventListener('drop', (e) => {
        e.preventDefault();
        if (draggedEl && draggedEl !== itemEl) {
          const items = Array.from(el.querySelectorAll('[phx-sortable-item]'));
          const fromIndex = items.indexOf(draggedEl);
          const toIndex = items.indexOf(itemEl);

          this.pushEvent!('reorder', {
            group,
            from: fromIndex,
            to: toIndex,
            id: draggedEl.getAttribute('phx-sortable-id'),
          });
        }
      });
    });
  },
};

/**
 * Debounce hook - adds debounce to any element
 */
export const Debounce: HookDefinition = {
  mounted() {
    const el = this.el!;
    const delay = parseInt(el.getAttribute('phx-debounce-delay') || '300', 10);
    let timer: ReturnType<typeof setTimeout>;

    // Intercept input events
    el.addEventListener('input', (e) => {
      clearTimeout(timer);
      e.stopPropagation();

      timer = setTimeout(() => {
        const newEvent = new Event('input', { bubbles: true });
        el.dispatchEvent(newEvent);
      }, delay);
    });
  },
};

/**
 * Countdown hook - countdown timer
 */
export const Countdown: HookDefinition = {
  mounted() {
    this.startCountdown();
  },

  updated() {
    this.startCountdown();
  },

  destroyed() {
    clearInterval((this as any)._timer);
  },

  startCountdown() {
    clearInterval((this as any)._timer);

    const el = this.el!;
    const targetTime = el.getAttribute('data-countdown-to');

    if (!targetTime) return;

    const target = new Date(targetTime).getTime();

    const update = () => {
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        el.textContent = '0:00';
        clearInterval((this as any)._timer);
        this.pushEvent!('countdown:complete', {});
        return;
      }

      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      if (hours > 0) {
        el.textContent = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      } else {
        el.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      }
    };

    update();
    (this as any)._timer = setInterval(update, 1000);
  },
} as HookDefinition & { startCountdown(): void };

// ============================================================================
// Register Built-in Hooks
// ============================================================================

registerHooks({
  InfiniteScroll,
  Focus,
  Clipboard,
  LocalTime,
  Sortable,
  Debounce,
  Countdown,
});

// ============================================================================
// Exports
// ============================================================================

export type { HookDefinition, Hooks, ClientHook };
