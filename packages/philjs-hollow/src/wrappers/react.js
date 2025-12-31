/**
 * React Wrappers for Hollow Components
 * Thin wrappers that provide React-idiomatic APIs for Hollow Web Components
 */
// Import components to ensure registration
import '../components/index.js';
/**
 * Create a React wrapper for a Hollow Web Component
 */
export function createReactWrapper(tagName, propDefs, eventMappings = {}) {
    // This is a factory that returns a React component
    // In production, React would be imported at runtime
    const displayName = tagName
        .replace('hollow-', '')
        .replace(/-./g, (x) => x[1].toUpperCase())
        .replace(/^./, (x) => x.toUpperCase());
    // Create wrapper component
    const Wrapper = function (props) {
        // Extract event handlers
        const eventProps = {};
        const elementProps = {};
        for (const [key, value] of Object.entries(props)) {
            if (key === 'ref' || key === 'children')
                continue;
            if (key.startsWith('on') && typeof value === 'function') {
                // Map React event to Hollow event
                const hollowEvent = eventMappings[key] ?? `hollow-${key.slice(2).toLowerCase()}`;
                eventProps[hollowEvent] = value;
            }
            else {
                // Find matching prop definition
                const propDef = propDefs.find((p) => p.name === key);
                if (propDef) {
                    const attrName = propDef.attribute ?? key;
                    if (propDef.type === 'boolean') {
                        if (value)
                            elementProps[attrName] = '';
                    }
                    else if (propDef.type === 'array' || propDef.type === 'object') {
                        elementProps[attrName] = JSON.stringify(value);
                    }
                    else {
                        elementProps[attrName] = value;
                    }
                }
                else {
                    elementProps[key] = value;
                }
            }
        }
        // Return element descriptor (React.createElement would be used at runtime)
        return {
            type: tagName,
            props: {
                ...elementProps,
                ref: props.ref,
                children: props.children,
                // Event handlers would be attached via useEffect in full implementation
            },
            key: null,
        };
    };
    // Add display name
    Wrapper.displayName = displayName;
    return Wrapper;
}
/**
 * React Button component
 */
export const Button = createReactWrapper('hollow-button', [
    { name: 'variant', type: 'string' },
    { name: 'size', type: 'string' },
    { name: 'disabled', type: 'boolean' },
    { name: 'loading', type: 'boolean' },
    { name: 'type', type: 'string' },
], {
    onClick: 'hollow-click',
});
/**
 * React Input component
 */
export const Input = createReactWrapper('hollow-input', [
    { name: 'variant', type: 'string' },
    { name: 'size', type: 'string' },
    { name: 'type', type: 'string' },
    { name: 'value', type: 'string' },
    { name: 'placeholder', type: 'string' },
    { name: 'disabled', type: 'boolean' },
    { name: 'readonly', type: 'boolean' },
    { name: 'required', type: 'boolean' },
    { name: 'minlength', type: 'number' },
    { name: 'maxlength', type: 'number' },
    { name: 'pattern', type: 'string' },
    { name: 'name', type: 'string' },
    { name: 'autocomplete', type: 'string' },
    { name: 'error', type: 'string' },
], {
    onInput: 'hollow-input',
    onChange: 'hollow-change',
});
/**
 * React Card component
 */
export const Card = createReactWrapper('hollow-card', [
    { name: 'variant', type: 'string' },
    { name: 'padding', type: 'string' },
    { name: 'interactive', type: 'boolean' },
    { name: 'selected', type: 'boolean' },
], {
    onClick: 'hollow-click',
});
/**
 * React Modal component
 */
export const Modal = createReactWrapper('hollow-modal', [
    { name: 'open', type: 'boolean' },
    { name: 'size', type: 'string' },
    { name: 'animation', type: 'string' },
    { name: 'closable', type: 'boolean' },
    { name: 'closeOnBackdrop', attribute: 'close-on-backdrop', type: 'boolean' },
    { name: 'closeOnEscape', attribute: 'close-on-escape', type: 'boolean' },
    { name: 'persistent', type: 'boolean' },
], {
    onOpen: 'hollow-open',
    onClose: 'hollow-close',
});
/**
 * React Select component
 */
export const Select = createReactWrapper('hollow-select', [
    { name: 'variant', type: 'string' },
    { name: 'size', type: 'string' },
    { name: 'value', type: 'string' },
    { name: 'placeholder', type: 'string' },
    { name: 'disabled', type: 'boolean' },
    { name: 'required', type: 'boolean' },
    { name: 'searchable', type: 'boolean' },
    { name: 'clearable', type: 'boolean' },
    { name: 'multiple', type: 'boolean' },
    { name: 'options', type: 'array' },
    { name: 'name', type: 'string' },
    { name: 'error', type: 'string' },
], {
    onChange: 'hollow-change',
    onToggle: 'hollow-toggle',
});
/**
 * React Checkbox component
 */
export const Checkbox = createReactWrapper('hollow-checkbox', [
    { name: 'variant', type: 'string' },
    { name: 'size', type: 'string' },
    { name: 'checked', type: 'boolean' },
    { name: 'indeterminate', type: 'boolean' },
    { name: 'disabled', type: 'boolean' },
    { name: 'required', type: 'boolean' },
    { name: 'name', type: 'string' },
    { name: 'value', type: 'string' },
], {
    onChange: 'hollow-change',
});
/**
 * React Switch component
 */
export const Switch = createReactWrapper('hollow-switch', [
    { name: 'variant', type: 'string' },
    { name: 'size', type: 'string' },
    { name: 'checked', type: 'boolean' },
    { name: 'disabled', type: 'boolean' },
    { name: 'required', type: 'boolean' },
    { name: 'name', type: 'string' },
    { name: 'value', type: 'string' },
    { name: 'labelOn', attribute: 'label-on', type: 'string' },
    { name: 'labelOff', attribute: 'label-off', type: 'string' },
], {
    onChange: 'hollow-change',
});
/**
 * React Tabs component
 */
export const Tabs = createReactWrapper('hollow-tabs', [
    { name: 'variant', type: 'string' },
    { name: 'size', type: 'string' },
    { name: 'active', type: 'string' },
    { name: 'alignment', type: 'string' },
    { name: 'tabs', type: 'array' },
], {
    onChange: 'hollow-change',
});
/**
 * React Accordion component
 */
export const Accordion = createReactWrapper('hollow-accordion', [
    { name: 'variant', type: 'string' },
    { name: 'multiple', type: 'boolean' },
    { name: 'collapsible', type: 'boolean' },
    { name: 'expanded', type: 'string' },
    { name: 'items', type: 'array' },
], {
    onChange: 'hollow-change',
});
/**
 * React AccordionItem component
 */
export const AccordionItem = createReactWrapper('hollow-accordion-item', [
    { name: 'title', type: 'string' },
    { name: 'expanded', type: 'boolean' },
    { name: 'disabled', type: 'boolean' },
    { name: 'icon', type: 'string' },
], {
    onToggle: 'hollow-toggle',
});
/**
 * Hook to use Hollow components with proper event handling
 */
export function useHollowEvent(ref, eventName, handler) {
    // In production, this would use useEffect
    // For now, provide the interface
    if (ref.current) {
        const wrappedHandler = (event) => {
            handler(event.detail);
        };
        ref.current.addEventListener(eventName, wrappedHandler);
    }
}
//# sourceMappingURL=react.js.map