import { jsx as _jsx, jsxs as _jsxs } from "philjs-core/jsx-runtime";
/**
 * PhilJS UI - Tabs Component
 */
import { signal, createContext, useContext } from 'philjs-core';
const TabsContext = createContext(null);
export function Tabs(props) {
    const { children, defaultValue = '', value, variant = 'line', size = 'md', onChange, className = '', } = props;
    const internalValue = signal(defaultValue);
    const activeTab = () => value ?? internalValue.get();
    const setActiveTab = (id) => {
        if (value === undefined) {
            internalValue.set(id);
        }
        onChange?.(id);
    };
    const contextValue = {
        activeTab,
        setActiveTab,
        variant,
        size,
    };
    return (_jsx(TabsContext.Provider, { value: contextValue, children: _jsx("div", { className: className, children: children }) }));
}
export function TabList(props) {
    const { children, className = '' } = props;
    const context = useContext(TabsContext);
    if (!context) {
        throw new Error('TabList must be used within Tabs');
    }
    const variantStyles = {
        line: 'border-b border-gray-200',
        enclosed: 'border-b border-gray-200',
        'soft-rounded': 'bg-gray-100 p-1 rounded-lg',
        'solid-rounded': 'bg-gray-100 p-1 rounded-lg',
    };
    return (_jsx("div", { role: "tablist", className: `flex ${variantStyles[context.variant]} ${className}`, children: children }));
}
export function Tab(props) {
    const { value, children, disabled = false, icon, className = '' } = props;
    const context = useContext(TabsContext);
    if (!context) {
        throw new Error('Tab must be used within Tabs');
    }
    const isActive = context.activeTab() === value;
    const handleClick = () => {
        if (!disabled) {
            context.setActiveTab(value);
        }
    };
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
        }
    };
    const sizeStyles = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg',
    };
    const getVariantStyles = () => {
        const { variant } = context;
        const baseActive = 'font-medium';
        const baseInactive = 'text-gray-500 hover:text-gray-700';
        switch (variant) {
            case 'line':
                return isActive
                    ? `${baseActive} text-blue-600 border-b-2 border-blue-600 -mb-px`
                    : `${baseInactive} border-b-2 border-transparent -mb-px hover:border-gray-300`;
            case 'enclosed':
                return isActive
                    ? `${baseActive} text-blue-600 bg-white border border-gray-200 border-b-white rounded-t-md -mb-px`
                    : `${baseInactive} border border-transparent`;
            case 'soft-rounded':
                return isActive
                    ? `${baseActive} text-blue-600 bg-white rounded-md shadow-sm`
                    : baseInactive;
            case 'solid-rounded':
                return isActive
                    ? `${baseActive} text-white bg-blue-600 rounded-md`
                    : baseInactive;
            default:
                return '';
        }
    };
    return (_jsxs("button", { role: "tab", "aria-selected": isActive, "aria-disabled": disabled, tabIndex: disabled ? -1 : 0, onClick: handleClick, onKeyDown: handleKeyDown, disabled: disabled, className: `
        ${sizeStyles[context.size]}
        ${getVariantStyles()}
        inline-flex items-center
        transition-colors duration-150
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `, children: [icon && _jsx("span", { className: "mr-2", children: icon }), children] }));
}
export function TabPanels(props) {
    const { children, className = '' } = props;
    return _jsx("div", { className: className, children: children });
}
export function TabPanel(props) {
    const { value, children, className = '' } = props;
    const context = useContext(TabsContext);
    if (!context) {
        throw new Error('TabPanel must be used within Tabs');
    }
    const isActive = context.activeTab() === value;
    if (!isActive)
        return null;
    return (_jsx("div", { role: "tabpanel", tabIndex: 0, className: `py-4 ${className}`, children: children }));
}
//# sourceMappingURL=Tabs.js.map