/**
 * Native PhilJS Bindings for Hollow Components
 * Direct integration with PhilJS reactivity system
 */
// Import components to ensure registration
import '../components/index.js';
/**
 * Create a reactive binding between a signal and an element attribute
 */
export function bindProp(element, propName, accessor) {
    // Create an effect-like update function
    let currentValue = accessor();
    // Initial set
    setElementProp(element, propName, currentValue);
    // Return cleanup function that could be used with a signal library
    // In PhilJS, this would integrate with the effect system
    return () => {
        const newValue = accessor();
        if (newValue !== currentValue) {
            currentValue = newValue;
            setElementProp(element, propName, newValue);
        }
    };
}
/**
 * Set an element property/attribute
 */
function setElementProp(element, name, value) {
    if (typeof value === 'boolean') {
        if (value) {
            element.setAttribute(name, '');
        }
        else {
            element.removeAttribute(name);
        }
    }
    else if (value === null || value === undefined) {
        element.removeAttribute(name);
    }
    else if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
        element.setAttribute(name, JSON.stringify(value));
    }
    else {
        element.setAttribute(name, String(value));
    }
}
/**
 * Resolve prop value (accessor or direct value)
 */
function resolveProp(prop) {
    return typeof prop === 'function' ? prop() : prop;
}
/**
 * PhilJS Button component factory
 */
export function Button(props) {
    const elementProps = {};
    const eventHandlers = {};
    // Process props
    for (const [key, value] of Object.entries(props)) {
        if (key === 'children' || key === 'ref')
            continue;
        if (key === 'onClick' && typeof value === 'function') {
            eventHandlers['hollow-click'] = value;
        }
        else if (typeof value === 'function' && key !== 'onClick') {
            // Reactive accessor - resolve immediately, would be tracked in real PhilJS
            elementProps[key] = value();
        }
        else {
            elementProps[key] = value;
        }
    }
    return {
        type: 'hollow-button',
        props: {
            ...elementProps,
            children: props.children,
            // Event handlers would be attached via a directive in real PhilJS
            __eventHandlers: eventHandlers,
        },
        ref: props.ref,
    };
}
/**
 * PhilJS Input component factory
 */
export function Input(props) {
    const elementProps = {};
    const eventHandlers = {};
    for (const [key, value] of Object.entries(props)) {
        if (key === 'ref')
            continue;
        if (key === 'onInput' && typeof value === 'function') {
            eventHandlers['hollow-input'] = value;
        }
        else if (key === 'onChange' && typeof value === 'function') {
            eventHandlers['hollow-change'] = value;
        }
        else if (typeof value === 'function') {
            elementProps[key] = value();
        }
        else {
            elementProps[key] = value;
        }
    }
    return {
        type: 'hollow-input',
        props: {
            ...elementProps,
            __eventHandlers: eventHandlers,
        },
        ref: props.ref,
    };
}
/**
 * PhilJS Card component factory
 */
export function Card(props) {
    const elementProps = {};
    const eventHandlers = {};
    for (const [key, value] of Object.entries(props)) {
        if (key === 'children' || key === 'header' || key === 'footer' || key === 'ref')
            continue;
        if (key === 'onClick' && typeof value === 'function') {
            eventHandlers['hollow-click'] = value;
        }
        else if (typeof value === 'function') {
            elementProps[key] = value();
        }
        else {
            elementProps[key] = value;
        }
    }
    return {
        type: 'hollow-card',
        props: {
            ...elementProps,
            children: [
                props.header && { type: 'template', props: { slot: 'header', children: props.header } },
                props.children,
                props.footer && { type: 'template', props: { slot: 'footer', children: props.footer } },
            ].filter(Boolean),
            __eventHandlers: eventHandlers,
        },
        ref: props.ref,
    };
}
/**
 * PhilJS Modal component factory
 */
export function Modal(props) {
    const elementProps = {};
    const eventHandlers = {};
    for (const [key, value] of Object.entries(props)) {
        if (key === 'children' || key === 'header' || key === 'footer' || key === 'ref')
            continue;
        if (key === 'onOpen' && typeof value === 'function') {
            eventHandlers['hollow-open'] = value;
        }
        else if (key === 'onClose' && typeof value === 'function') {
            eventHandlers['hollow-close'] = value;
        }
        else if (key === 'closeOnBackdrop') {
            elementProps['close-on-backdrop'] = value;
        }
        else if (key === 'closeOnEscape') {
            elementProps['close-on-escape'] = value;
        }
        else if (typeof value === 'function') {
            elementProps[key] = value();
        }
        else {
            elementProps[key] = value;
        }
    }
    return {
        type: 'hollow-modal',
        props: {
            ...elementProps,
            children: [
                props.header && { type: 'template', props: { slot: 'header', children: props.header } },
                props.children,
                props.footer && { type: 'template', props: { slot: 'footer', children: props.footer } },
            ].filter(Boolean),
            __eventHandlers: eventHandlers,
        },
        ref: props.ref,
    };
}
/**
 * PhilJS Select component factory
 */
export function Select(props) {
    const elementProps = {};
    const eventHandlers = {};
    for (const [key, value] of Object.entries(props)) {
        if (key === 'ref')
            continue;
        if (key === 'onChange' && typeof value === 'function') {
            eventHandlers['hollow-change'] = value;
        }
        else if (key === 'onToggle' && typeof value === 'function') {
            eventHandlers['hollow-toggle'] = value;
        }
        else if (typeof value === 'function') {
            elementProps[key] = value();
        }
        else {
            elementProps[key] = value;
        }
    }
    return {
        type: 'hollow-select',
        props: {
            ...elementProps,
            __eventHandlers: eventHandlers,
        },
        ref: props.ref,
    };
}
/**
 * PhilJS Checkbox component factory
 */
export function Checkbox(props) {
    const elementProps = {};
    const eventHandlers = {};
    for (const [key, value] of Object.entries(props)) {
        if (key === 'children' || key === 'ref')
            continue;
        if (key === 'onChange' && typeof value === 'function') {
            eventHandlers['hollow-change'] = value;
        }
        else if (typeof value === 'function') {
            elementProps[key] = value();
        }
        else {
            elementProps[key] = value;
        }
    }
    return {
        type: 'hollow-checkbox',
        props: {
            ...elementProps,
            children: props.children,
            __eventHandlers: eventHandlers,
        },
        ref: props.ref,
    };
}
/**
 * PhilJS Switch component factory
 */
export function Switch(props) {
    const elementProps = {};
    const eventHandlers = {};
    for (const [key, value] of Object.entries(props)) {
        if (key === 'children' || key === 'ref')
            continue;
        if (key === 'onChange' && typeof value === 'function') {
            eventHandlers['hollow-change'] = value;
        }
        else if (key === 'labelOn') {
            elementProps['label-on'] = value;
        }
        else if (key === 'labelOff') {
            elementProps['label-off'] = value;
        }
        else if (typeof value === 'function') {
            elementProps[key] = value();
        }
        else {
            elementProps[key] = value;
        }
    }
    return {
        type: 'hollow-switch',
        props: {
            ...elementProps,
            children: props.children,
            __eventHandlers: eventHandlers,
        },
        ref: props.ref,
    };
}
/**
 * PhilJS Tabs component factory
 */
export function Tabs(props) {
    const elementProps = {};
    const eventHandlers = {};
    for (const [key, value] of Object.entries(props)) {
        if (key === 'children' || key === 'ref')
            continue;
        if (key === 'onChange' && typeof value === 'function') {
            eventHandlers['hollow-change'] = value;
        }
        else if (typeof value === 'function') {
            elementProps[key] = value();
        }
        else {
            elementProps[key] = value;
        }
    }
    return {
        type: 'hollow-tabs',
        props: {
            ...elementProps,
            children: props.children,
            __eventHandlers: eventHandlers,
        },
        ref: props.ref,
    };
}
/**
 * PhilJS Accordion component factory
 */
export function Accordion(props) {
    const elementProps = {};
    const eventHandlers = {};
    for (const [key, value] of Object.entries(props)) {
        if (key === 'children' || key === 'ref')
            continue;
        if (key === 'onChange' && typeof value === 'function') {
            eventHandlers['hollow-change'] = value;
        }
        else if (typeof value === 'function') {
            elementProps[key] = value();
        }
        else {
            elementProps[key] = value;
        }
    }
    return {
        type: 'hollow-accordion',
        props: {
            ...elementProps,
            children: props.children,
            __eventHandlers: eventHandlers,
        },
        ref: props.ref,
    };
}
/**
 * PhilJS AccordionItem component factory
 */
export function AccordionItem(props) {
    const elementProps = {};
    const eventHandlers = {};
    for (const [key, value] of Object.entries(props)) {
        if (key === 'children' || key === 'ref')
            continue;
        if (key === 'onToggle' && typeof value === 'function') {
            eventHandlers['hollow-toggle'] = value;
        }
        else if (typeof value === 'function') {
            elementProps[key] = value();
        }
        else {
            elementProps[key] = value;
        }
    }
    return {
        type: 'hollow-accordion-item',
        props: {
            ...elementProps,
            children: props.children,
            __eventHandlers: eventHandlers,
        },
        ref: props.ref,
    };
}
/**
 * Hook to bind Hollow events in PhilJS effects
 */
export function useHollowRef() {
    let element = null;
    const listeners = [];
    return {
        get current() {
            return element;
        },
        set(el) {
            element = el;
        },
        on(event, handler) {
            if (!element) {
                // Queue for when element is available
                const wrappedHandler = (e) => handler(e.detail);
                listeners.push({ event, handler: wrappedHandler });
                return () => {
                    const idx = listeners.findIndex((l) => l.event === event && l.handler === wrappedHandler);
                    if (idx >= 0)
                        listeners.splice(idx, 1);
                };
            }
            const wrappedHandler = (e) => handler(e.detail);
            element.addEventListener(event, wrappedHandler);
            return () => {
                element?.removeEventListener(event, wrappedHandler);
            };
        },
    };
}
/**
 * Directive to apply Hollow props reactively
 */
export function hollowProps(element, props) {
    const cleanups = [];
    for (const [key, value] of Object.entries(props)) {
        if (typeof value === 'function') {
            // Set up reactive binding
            cleanups.push(bindProp(element, key, value));
        }
        else {
            // Static value
            setElementProp(element, key, value);
        }
    }
    return () => {
        for (const cleanup of cleanups) {
            cleanup();
        }
    };
}
//# sourceMappingURL=philjs.js.map