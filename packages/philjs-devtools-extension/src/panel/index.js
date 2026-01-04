/**
 * DevTools Panel Entry Point
 */
import { DevToolsPanel } from './DevToolsPanel.js';
// Initialize the devtools panel when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const root = document.getElementById('root');
    if (root) {
        const panel = new DevToolsPanel();
        root.appendChild(panel.element);
    }
});
//# sourceMappingURL=index.js.map