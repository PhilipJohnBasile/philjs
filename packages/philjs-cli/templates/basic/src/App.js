import { jsx as _jsx, jsxs as _jsxs } from "philjs-core/jsx-runtime";
/**
 * Root App Component
 */
import { signal } from 'philjs-core';
import './App.css';
export function App() {
    const count = signal(0);
    return (_jsxs("div", { className: "app", children: [_jsxs("header", { className: "app-header", children: [_jsx("h1", { children: "Welcome to PhilJS" }), _jsx("p", { className: "tagline", children: "The framework that thinks ahead" })] }), _jsxs("main", { className: "app-main", children: [_jsxs("div", { className: "counter", children: [_jsx("h2", { children: "Counter Example" }), _jsx("p", { className: "count", children: count.get() }), _jsxs("div", { className: "controls", children: [_jsx("button", { onClick: () => count.set(count.get() - 1), children: "-" }), _jsx("button", { onClick: () => count.set(0), children: "Reset" }), _jsx("button", { onClick: () => count.set(count.get() + 1), children: "+" })] })] }), _jsxs("div", { className: "features", children: [_jsx("h2", { children: "Features" }), _jsxs("ul", { children: [_jsx("li", { children: "Fast, reactive signals" }), _jsx("li", { children: "Smart preloading" }), _jsx("li", { children: "Built-in routing" }), _jsx("li", { children: "SSR & SSG support" }), _jsx("li", { children: "Time-travel debugging" })] })] })] }), _jsx("footer", { className: "app-footer", children: _jsxs("p", { children: ["Edit ", _jsx("code", { children: "src/App.tsx" }), " to get started"] }) })] }));
}
//# sourceMappingURL=App.js.map