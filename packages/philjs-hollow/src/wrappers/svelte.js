/**
 * Svelte Actions for Hollow Components
 * Svelte-compatible actions for Hollow Web Components
 */
// Import components to ensure registration
import '../components/index.js';
/**
 * Svelte action for Hollow components
 */
export function hollow(node, params) {
    const handlers = [];
    function update(newParams) {
        // Remove old event handlers
        for (const { event, handler } of handlers) {
            node.removeEventListener(event, handler);
        }
        handlers.length = 0;
        // Apply new parameters
        for (const [key, value] of Object.entries(newParams)) {
            if (key.startsWith('on') && typeof value === 'function') {
                // Event handler
                const eventName = `hollow-${key.slice(2).toLowerCase()}`;
                const handler = (event) => {
                    value(event.detail);
                };
                node.addEventListener(eventName, handler);
                handlers.push({ event: eventName, handler });
            }
            else if (typeof value === 'boolean') {
                // Boolean attribute
                if (value) {
                    node.setAttribute(key, '');
                }
                else {
                    node.removeAttribute(key);
                }
            }
            else if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
                // Array or object - serialize to JSON
                node.setAttribute(key, JSON.stringify(value));
            }
            else if (value !== undefined && value !== null) {
                // String attribute
                node.setAttribute(key, String(value));
            }
            else {
                node.removeAttribute(key);
            }
        }
    }
    // Initial update
    update(params);
    return {
        update,
        destroy() {
            for (const { event, handler } of handlers) {
                node.removeEventListener(event, handler);
            }
        },
    };
}
/**
 * Typed action for Hollow Button
 */
export function hollowButton(node, params) {
    return hollow(node, params);
}
/**
 * Typed action for Hollow Input
 */
export function hollowInput(node, params) {
    return hollow(node, params);
}
/**
 * Typed action for Hollow Card
 */
export function hollowCard(node, params) {
    return hollow(node, params);
}
/**
 * Typed action for Hollow Modal
 */
export function hollowModal(node, params) {
    // Map camelCase props to kebab-case attributes
    const mapped = { ...params };
    if ('closeOnBackdrop' in params) {
        mapped['close-on-backdrop'] = params.closeOnBackdrop;
        delete mapped.closeOnBackdrop;
    }
    if ('closeOnEscape' in params) {
        mapped['close-on-escape'] = params.closeOnEscape;
        delete mapped.closeOnEscape;
    }
    return hollow(node, mapped);
}
/**
 * Typed action for Hollow Select
 */
export function hollowSelect(node, params) {
    return hollow(node, params);
}
/**
 * Typed action for Hollow Checkbox
 */
export function hollowCheckbox(node, params) {
    return hollow(node, params);
}
/**
 * Typed action for Hollow Switch
 */
export function hollowSwitch(node, params) {
    // Map camelCase props to kebab-case attributes
    const mapped = { ...params };
    if ('labelOn' in params) {
        mapped['label-on'] = params.labelOn;
        delete mapped.labelOn;
    }
    if ('labelOff' in params) {
        mapped['label-off'] = params.labelOff;
        delete mapped.labelOff;
    }
    return hollow(node, mapped);
}
/**
 * Typed action for Hollow Tabs
 */
export function hollowTabs(node, params) {
    return hollow(node, params);
}
/**
 * Typed action for Hollow Accordion
 */
export function hollowAccordion(node, params) {
    return hollow(node, params);
}
/**
 * Typed action for Hollow AccordionItem
 */
export function hollowAccordionItem(node, params) {
    return hollow(node, params);
}
/**
 * Reactive store wrapper for Hollow components
 * Creates a Svelte store that syncs with component attributes
 */
export function createHollowStore(initial) {
    let value = initial;
    const subscribers = new Set();
    return {
        subscribe(callback) {
            subscribers.add(callback);
            callback(value);
            return () => {
                subscribers.delete(callback);
            };
        },
        set(newValue) {
            value = newValue;
            for (const callback of subscribers) {
                callback(value);
            }
        },
        update(updater) {
            value = updater(value);
            for (const callback of subscribers) {
                callback(value);
            }
        },
    };
}
/**
 * Event dispatcher helper for Svelte components
 */
export function onHollowEvent(element, eventName, handler) {
    const wrappedHandler = (event) => {
        handler(event.detail);
    };
    element.addEventListener(eventName, wrappedHandler);
    return () => {
        element.removeEventListener(eventName, wrappedHandler);
    };
}
//# sourceMappingURL=svelte.js.map