/**
 * Main inspector controller - activation, deactivation, and coordination
 */
import { initOverlay, destroyOverlay, highlightElement, highlightElementHover, removeHighlight, removeHoverHighlight, updateHighlightPosition, flashHighlight, getCurrentHighlightedElement, } from './overlay.js';
import { extractComponentInfo, getComponentByElement, getAllComponents, clearComponentRegistry, } from './component-info.js';
import { showTooltip, hideTooltip, isTooltipVisible } from './tooltip.js';
import { registerShortcut, startKeyboardListening, stopKeyboardListening, clearAllShortcuts, ComponentNavigator, formatShortcut, } from './keyboard.js';
import { showSearchBox, hideSearchBox, isSearchBoxVisible } from './search.js';
import { INSPECTOR_STYLES, applyStyles } from './styles.js';
class PhilJSInspector {
    config;
    state;
    navigator;
    statusBar = null;
    breadcrumb = null;
    constructor() {
        this.config = {
            enabled: false,
            showMetrics: true,
            enableKeyboard: true,
            shortcuts: this.getDefaultShortcuts(),
        };
        this.state = {
            enabled: false,
            hoveredElement: null,
            selectedElement: null,
            mode: 'inspect',
        };
        this.navigator = new ComponentNavigator();
    }
    /**
     * Enable inspector
     */
    enable(config) {
        if (this.state.enabled)
            return;
        this.config = { ...this.config, ...config };
        this.state.enabled = true;
        // Initialize overlay
        initOverlay();
        // Setup event listeners
        this.setupEventListeners();
        // Setup keyboard shortcuts
        if (this.config.enableKeyboard) {
            this.setupKeyboardShortcuts();
            startKeyboardListening();
        }
        // Show status bar
        this.showStatusBar();
        // Build component registry
        this.buildComponentRegistry();
    }
    /**
     * Disable inspector
     */
    disable() {
        if (!this.state.enabled)
            return;
        this.state.enabled = false;
        // Cleanup
        this.cleanupEventListeners();
        stopKeyboardListening();
        clearAllShortcuts();
        destroyOverlay();
        this.hideStatusBar();
        this.hideBreadcrumb();
        hideTooltip();
        hideSearchBox();
        clearComponentRegistry();
    }
    /**
     * Toggle inspector
     */
    toggle() {
        if (this.state.enabled) {
            this.disable();
        }
        else {
            this.enable();
        }
    }
    /**
     * Check if inspector is enabled
     */
    isEnabled() {
        return this.state.enabled;
    }
    /**
     * Get current state
     */
    getState() {
        return { ...this.state };
    }
    /**
     * Get all components
     */
    getComponents() {
        return getAllComponents();
    }
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        document.addEventListener('mouseover', this.handleMouseOver, true);
        document.addEventListener('mouseout', this.handleMouseOut, true);
        document.addEventListener('click', this.handleClick, true);
        window.addEventListener('scroll', this.handleScroll, true);
        window.addEventListener('resize', this.handleResize);
    }
    /**
     * Cleanup event listeners
     */
    cleanupEventListeners() {
        document.removeEventListener('mouseover', this.handleMouseOver, true);
        document.removeEventListener('mouseout', this.handleMouseOut, true);
        document.removeEventListener('click', this.handleClick, true);
        window.removeEventListener('scroll', this.handleScroll, true);
        window.removeEventListener('resize', this.handleResize);
    }
    /**
     * Handle mouse over
     */
    handleMouseOver = (event) => {
        if (!this.state.enabled)
            return;
        const element = event.target;
        // Ignore inspector UI elements
        if (this.isInspectorElement(element))
            return;
        this.state.hoveredElement = element;
        // Extract or get component info
        let componentInfo = getComponentByElement(element);
        if (!componentInfo) {
            componentInfo = extractComponentInfo(element);
        }
        // Highlight on hover
        highlightElementHover(element, componentInfo);
    };
    /**
     * Handle mouse out
     */
    handleMouseOut = (event) => {
        if (!this.state.enabled)
            return;
        removeHoverHighlight();
        this.state.hoveredElement = null;
    };
    /**
     * Handle click
     */
    handleClick = (event) => {
        if (!this.state.enabled)
            return;
        const element = event.target;
        // Ignore inspector UI elements
        if (this.isInspectorElement(element))
            return;
        // Prevent default behavior
        event.preventDefault();
        event.stopPropagation();
        this.selectElement(element);
    };
    /**
     * Handle scroll
     */
    handleScroll = () => {
        if (!this.state.enabled)
            return;
        updateHighlightPosition();
    };
    /**
     * Handle resize
     */
    handleResize = () => {
        if (!this.state.enabled)
            return;
        updateHighlightPosition();
    };
    /**
     * Select element
     */
    selectElement(element) {
        this.state.selectedElement = element;
        // Extract or get component info
        let componentInfo = getComponentByElement(element);
        if (!componentInfo) {
            componentInfo = extractComponentInfo(element);
        }
        // Highlight selected element
        highlightElement(element, componentInfo, {
            showLabel: true,
            ...(this.config.showMetrics !== undefined && { showMetrics: this.config.showMetrics }),
        });
        // Show tooltip
        showTooltip(componentInfo);
        // Update breadcrumb
        this.updateBreadcrumb(componentInfo);
        // Update navigator
        this.navigator.setCurrent(element);
        // Flash animation
        flashHighlight(element);
    }
    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        const shortcuts = this.config.shortcuts;
        // Toggle inspector
        registerShortcut({
            key: 'i',
            ctrl: true,
            shift: true,
            handler: () => {
                this.toggle();
            },
            description: 'Toggle inspector',
        });
        // Search
        registerShortcut({
            key: 'f',
            ctrl: true,
            handler: () => {
                if (isSearchBoxVisible()) {
                    hideSearchBox();
                }
                else {
                    showSearchBox((component) => {
                        this.selectElement(component.element);
                    });
                }
            },
            description: 'Search components',
        });
        // Navigate components
        registerShortcut({
            key: 'arrowdown',
            handler: () => {
                const next = this.navigator.next();
                if (next)
                    this.selectElement(next);
            },
            description: 'Next component',
        });
        registerShortcut({
            key: 'arrowup',
            handler: () => {
                const prev = this.navigator.previous();
                if (prev)
                    this.selectElement(prev);
            },
            description: 'Previous component',
        });
        registerShortcut({
            key: 'arrowleft',
            handler: () => {
                const current = getCurrentHighlightedElement();
                if (current) {
                    const parent = this.navigator.parent(current);
                    if (parent)
                        this.selectElement(parent);
                }
            },
            description: 'Parent component',
        });
        registerShortcut({
            key: 'arrowright',
            handler: () => {
                const current = getCurrentHighlightedElement();
                if (current) {
                    const child = this.navigator.firstChild(current);
                    if (child)
                        this.selectElement(child);
                }
            },
            description: 'Child component',
        });
        // Escape
        registerShortcut({
            key: 'escape',
            handler: () => {
                if (isTooltipVisible()) {
                    hideTooltip();
                    removeHighlight();
                }
                else if (isSearchBoxVisible()) {
                    hideSearchBox();
                }
                else {
                    this.disable();
                }
            },
            description: 'Close/Escape',
        });
    }
    /**
     * Get default shortcuts
     */
    getDefaultShortcuts() {
        return {
            toggle: {
                key: 'i',
                ctrl: true,
                shift: true,
                handler: () => { },
                description: 'Toggle inspector',
            },
            search: {
                key: 'f',
                ctrl: true,
                handler: () => { },
                description: 'Search components',
            },
            nextComponent: {
                key: 'arrowdown',
                handler: () => { },
                description: 'Next component',
            },
            prevComponent: {
                key: 'arrowup',
                handler: () => { },
                description: 'Previous component',
            },
            parentComponent: {
                key: 'arrowleft',
                handler: () => { },
                description: 'Parent component',
            },
            childComponent: {
                key: 'arrowright',
                handler: () => { },
                description: 'Child component',
            },
            escape: {
                key: 'escape',
                handler: () => { },
                description: 'Close/Escape',
            },
        };
    }
    /**
     * Show status bar
     */
    showStatusBar() {
        if (this.statusBar)
            return;
        this.statusBar = document.createElement('div');
        applyStyles(this.statusBar, INSPECTOR_STYLES.statusBar);
        this.statusBar.innerHTML = `
      <div>
        <strong>PhilJS Inspector</strong>
        <span style="${Object.entries(INSPECTOR_STYLES.statusBarShortcut).map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${v}`).join('; ')}">
          Ctrl+Shift+I to toggle | Ctrl+F to search | ESC to close
        </span>
      </div>
    `;
        document.body.appendChild(this.statusBar);
    }
    /**
     * Hide status bar
     */
    hideStatusBar() {
        if (this.statusBar) {
            this.statusBar.remove();
            this.statusBar = null;
        }
    }
    /**
     * Update breadcrumb
     */
    updateBreadcrumb(componentInfo) {
        if (!this.breadcrumb) {
            this.breadcrumb = document.createElement('div');
            applyStyles(this.breadcrumb, INSPECTOR_STYLES.breadcrumb);
            document.body.appendChild(this.breadcrumb);
        }
        this.breadcrumb.innerHTML = componentInfo.path
            .map((name, index) => `
        <span class="philjs-breadcrumb-item" data-index="${index}"
              style="${Object.entries(INSPECTOR_STYLES.breadcrumbItem).map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${v}`).join('; ')}">
          ${name}
        </span>
        ${index < componentInfo.path.length - 1 ? `<span style="${Object.entries(INSPECTOR_STYLES.breadcrumbSeparator).map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${v}`).join('; ')}">›</span>` : ''}
      `)
            .join('');
        // Add click handlers for breadcrumb items
        const items = this.breadcrumb.querySelectorAll('.philjs-breadcrumb-item');
        items.forEach((item) => {
            item.addEventListener('click', () => {
                // Navigate to ancestor
                // This would require tracking ancestor elements
            });
        });
    }
    /**
     * Hide breadcrumb
     */
    hideBreadcrumb() {
        if (this.breadcrumb) {
            this.breadcrumb.remove();
            this.breadcrumb = null;
        }
    }
    /**
     * Build component registry
     */
    buildComponentRegistry() {
        // Find all potential component elements
        const elements = Array.from(document.querySelectorAll('*')).filter((el) => !this.isInspectorElement(el));
        // Update navigator
        this.navigator.setElements(elements);
    }
    /**
     * Check if element is part of inspector UI
     */
    isInspectorElement(element) {
        return (element.id.startsWith('philjs-inspector') ||
            element.closest('#philjs-inspector-overlay') !== null ||
            element.classList.contains('philjs-inspector-ui'));
    }
}
// Global instance
let inspectorInstance = null;
/**
 * Get or create inspector instance
 */
export function getInspector() {
    if (!inspectorInstance) {
        inspectorInstance = new PhilJSInspector();
    }
    return inspectorInstance;
}
/**
 * Initialize inspector and attach to window
 */
export function initInspector() {
    if (typeof window === 'undefined')
        return;
    const inspector = getInspector();
    // Attach to window
    window.__PHILJS_INSPECTOR__ = {
        enable: (config) => inspector.enable(config),
        disable: () => inspector.disable(),
        toggle: () => inspector.toggle(),
        isEnabled: () => inspector.isEnabled(),
        getState: () => inspector.getState(),
        getComponents: () => inspector.getComponents(),
    };
    console.log('[PhilJS Inspector] Initialized. Use window.__PHILJS_INSPECTOR__.enable() to activate.');
}
//# sourceMappingURL=inspector.js.map