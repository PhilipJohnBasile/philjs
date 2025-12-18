import { jsx as _jsx } from "philjs-core/jsx-runtime";
/**
 * Application entry point
 */
import { render } from 'philjs-core';
import { App } from './App';
const root = document.getElementById('root');
if (!root) {
    throw new Error('Root element not found');
}
render(_jsx(App, {}), root);
//# sourceMappingURL=main.js.map