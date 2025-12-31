/**
 * Visual Builder component - Main visual builder UI
 */
// ============================================================================
// Visual Builder Component
// ============================================================================
/**
 * Main Visual Builder component
 *
 * This is a stub implementation that provides the basic structure
 * for the visual builder UI. It creates a container with panels
 * for the component palette, canvas, and inspector.
 */
export function VisualBuilder(props) {
    const { className = '', showPalette = true, showInspector = true, showLayers = true, theme = 'auto', } = props;
    const container = document.createElement('div');
    container.className = `philjs-visual-builder ${className}`.trim();
    container.dataset['theme'] = theme;
    // Create main layout structure
    const layout = document.createElement('div');
    layout.className = 'philjs-builder-layout';
    // Left panel (component palette and layers)
    if (showPalette || showLayers) {
        const leftPanel = document.createElement('div');
        leftPanel.className = 'philjs-builder-panel philjs-builder-panel-left';
        layout.appendChild(leftPanel);
    }
    // Center (canvas)
    const centerPanel = document.createElement('div');
    centerPanel.className = 'philjs-builder-canvas-container';
    layout.appendChild(centerPanel);
    // Right panel (inspector)
    if (showInspector) {
        const rightPanel = document.createElement('div');
        rightPanel.className = 'philjs-builder-panel philjs-builder-panel-right';
        layout.appendChild(rightPanel);
    }
    container.appendChild(layout);
    return container;
}
export default VisualBuilder;
//# sourceMappingURL=VisualBuilder.js.map