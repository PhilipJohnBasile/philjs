import { jsx as _jsx, jsxs as _jsxs } from "philjs-core/jsx-runtime";
/**
 * PhilJS UI - Accordion Component
 */
import { signal, createContext, useContext } from 'philjs-core';
const AccordionContext = createContext(null);
export function Accordion(props) {
    const { children, allowMultiple = false, defaultExpanded = [], className = '', } = props;
    const expandedItems = signal(defaultExpanded);
    const toggleItem = (id) => {
        const current = expandedItems.get();
        if (current.includes(id)) {
            expandedItems.set(current.filter(item => item !== id));
        }
        else {
            if (allowMultiple) {
                expandedItems.set([...current, id]);
            }
            else {
                expandedItems.set([id]);
            }
        }
    };
    const contextValue = {
        expandedItems: () => expandedItems.get(),
        toggleItem,
        allowMultiple,
    };
    return (_jsx(AccordionContext.Provider, { value: contextValue, children: _jsx("div", { className: `divide-y divide-gray-200 border border-gray-200 rounded-lg ${className}`, children: children }) }));
}
export function AccordionItem(props) {
    const { id, children, className = '' } = props;
    return (_jsx("div", { "data-accordion-item": id, className: className, children: children }));
}
export function AccordionButton(props) {
    const { itemId, children, className = '' } = props;
    const context = useContext(AccordionContext);
    if (!context) {
        throw new Error('AccordionButton must be used within an Accordion');
    }
    const isExpanded = context.expandedItems().includes(itemId);
    const handleClick = () => {
        context.toggleItem(itemId);
    };
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
        }
    };
    return (_jsxs("button", { type: "button", onClick: handleClick, onKeyDown: handleKeyDown, "aria-expanded": isExpanded, "aria-controls": `accordion-panel-${itemId}`, className: `
        w-full px-4 py-4
        flex items-center justify-between
        text-left font-medium text-gray-900
        hover:bg-gray-50
        focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500
        ${className}
      `, children: [children, _jsx("svg", { className: `
          h-5 w-5 text-gray-500
          transition-transform duration-200
          ${isExpanded ? 'rotate-180' : ''}
        `, fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M19 9l-7 7-7-7" }) })] }));
}
export function AccordionPanel(props) {
    const { itemId, children, className = '' } = props;
    const context = useContext(AccordionContext);
    if (!context) {
        throw new Error('AccordionPanel must be used within an Accordion');
    }
    const isExpanded = context.expandedItems().includes(itemId);
    if (!isExpanded)
        return null;
    return (_jsx("div", { id: `accordion-panel-${itemId}`, role: "region", "aria-labelledby": `accordion-button-${itemId}`, className: `px-4 pb-4 text-gray-600 ${className}`, children: children }));
}
//# sourceMappingURL=Accordion.js.map