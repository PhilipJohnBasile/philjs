/**
 * DOM overlay rendering for visual inspection
 */
import { INSPECTOR_STYLES, applyStyles } from './styles.js';
let overlayRoot = null;
let highlightBox = null;
let hoverHighlightBox = null;
let componentLabel = null;
let currentHighlightedElement = null;
/**
 * Initialize overlay
 */
export function initOverlay() {
    if (overlayRoot)
        return overlayRoot;
    overlayRoot = document.createElement('div');
    overlayRoot.id = 'philjs-inspector-overlay';
    applyStyles(overlayRoot, INSPECTOR_STYLES.overlay);
    document.body.appendChild(overlayRoot);
    return overlayRoot;
}
/**
 * Destroy overlay
 */
export function destroyOverlay() {
    if (overlayRoot) {
        overlayRoot.remove();
        overlayRoot = null;
    }
    highlightBox = null;
    hoverHighlightBox = null;
    componentLabel = null;
    currentHighlightedElement = null;
}
/**
 * Get overlay root element
 */
export function getOverlayRoot() {
    return overlayRoot;
}
/**
 * Highlight element on hover
 */
export function highlightElementHover(element, componentInfo) {
    if (!overlayRoot)
        return;
    // Remove existing hover highlight
    if (hoverHighlightBox) {
        hoverHighlightBox.remove();
        hoverHighlightBox = null;
    }
    // Don't highlight if it's the currently selected element
    if (element === currentHighlightedElement)
        return;
    const rect = element.getBoundingClientRect();
    // Create hover highlight box
    hoverHighlightBox = document.createElement('div');
    applyStyles(hoverHighlightBox, INSPECTOR_STYLES.highlightBoxHover);
    hoverHighlightBox.style.top = `${rect.top + window.scrollY}px`;
    hoverHighlightBox.style.left = `${rect.left + window.scrollX}px`;
    hoverHighlightBox.style.width = `${rect.width}px`;
    hoverHighlightBox.style.height = `${rect.height}px`;
    overlayRoot.appendChild(hoverHighlightBox);
}
/**
 * Remove hover highlight
 */
export function removeHoverHighlight() {
    if (hoverHighlightBox) {
        hoverHighlightBox.remove();
        hoverHighlightBox = null;
    }
}
/**
 * Highlight element (selected)
 */
export function highlightElement(element, componentInfo, options = {}) {
    if (!overlayRoot)
        return;
    const { color = '#3b82f6', showLabel = true, showMetrics = false, } = options;
    // Remove existing highlight
    removeHighlight();
    currentHighlightedElement = element;
    const rect = element.getBoundingClientRect();
    // Create highlight box
    highlightBox = document.createElement('div');
    applyStyles(highlightBox, INSPECTOR_STYLES.highlightBox);
    highlightBox.style.top = `${rect.top + window.scrollY}px`;
    highlightBox.style.left = `${rect.left + window.scrollX}px`;
    highlightBox.style.width = `${rect.width}px`;
    highlightBox.style.height = `${rect.height}px`;
    highlightBox.style.borderColor = color;
    overlayRoot.appendChild(highlightBox);
    // Create label
    if (showLabel && componentInfo) {
        componentLabel = document.createElement('div');
        applyStyles(componentLabel, INSPECTOR_STYLES.componentLabel);
        componentLabel.style.backgroundColor = color;
        let labelText = componentInfo.name;
        if (componentInfo.isIsland) {
            labelText += ' [island]';
        }
        if (showMetrics && componentInfo.renderTime > 0) {
            labelText += ` (${componentInfo.renderTime.toFixed(2)}ms)`;
        }
        componentLabel.textContent = labelText;
        // Position label above or below element
        const labelTop = rect.top + window.scrollY - 28;
        if (labelTop < 0) {
            componentLabel.style.top = `${rect.bottom + window.scrollY + 4}px`;
        }
        else {
            componentLabel.style.top = `${labelTop}px`;
        }
        componentLabel.style.left = `${rect.left + window.scrollX}px`;
        overlayRoot.appendChild(componentLabel);
    }
}
/**
 * Remove highlight
 */
export function removeHighlight() {
    if (highlightBox) {
        highlightBox.remove();
        highlightBox = null;
    }
    if (componentLabel) {
        componentLabel.remove();
        componentLabel = null;
    }
    currentHighlightedElement = null;
}
/**
 * Update highlight position (on scroll/resize)
 */
export function updateHighlightPosition() {
    if (!currentHighlightedElement || !highlightBox)
        return;
    const rect = currentHighlightedElement.getBoundingClientRect();
    highlightBox.style.top = `${rect.top + window.scrollY}px`;
    highlightBox.style.left = `${rect.left + window.scrollX}px`;
    highlightBox.style.width = `${rect.width}px`;
    highlightBox.style.height = `${rect.height}px`;
    if (componentLabel) {
        const labelTop = rect.top + window.scrollY - 28;
        if (labelTop < 0) {
            componentLabel.style.top = `${rect.bottom + window.scrollY + 4}px`;
        }
        else {
            componentLabel.style.top = `${labelTop}px`;
        }
        componentLabel.style.left = `${rect.left + window.scrollX}px`;
    }
}
/**
 * Get currently highlighted element
 */
export function getCurrentHighlightedElement() {
    return currentHighlightedElement;
}
/**
 * Flash highlight animation
 */
export function flashHighlight(element, color = '#10b981') {
    if (!overlayRoot)
        return;
    const rect = element.getBoundingClientRect();
    const flash = document.createElement('div');
    applyStyles(flash, {
        ...INSPECTOR_STYLES.highlightBox,
        borderColor: color,
        background: `${color}33`,
        animation: 'philjs-inspector-flash 0.6s ease-out',
    });
    flash.style.top = `${rect.top + window.scrollY}px`;
    flash.style.left = `${rect.left + window.scrollX}px`;
    flash.style.width = `${rect.width}px`;
    flash.style.height = `${rect.height}px`;
    overlayRoot.appendChild(flash);
    // Add CSS animation
    if (!document.getElementById('philjs-inspector-animations')) {
        const style = document.createElement('style');
        style.id = 'philjs-inspector-animations';
        style.textContent = `
      @keyframes philjs-inspector-flash {
        0% { opacity: 1; transform: scale(1); }
        100% { opacity: 0; transform: scale(1.05); }
      }
    `;
        document.head.appendChild(style);
    }
    setTimeout(() => {
        flash.remove();
    }, 600);
}
/**
 * Create measurement overlay (padding, margin, border)
 */
export function showElementMeasurements(element) {
    const container = document.createElement('div');
    applyStyles(container, {
        position: 'absolute',
        pointerEvents: 'none',
        zIndex: '999997',
    });
    const rect = element.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(element);
    // Get box model values
    const margin = {
        top: parseFloat(computedStyle.marginTop),
        right: parseFloat(computedStyle.marginRight),
        bottom: parseFloat(computedStyle.marginBottom),
        left: parseFloat(computedStyle.marginLeft),
    };
    const padding = {
        top: parseFloat(computedStyle.paddingTop),
        right: parseFloat(computedStyle.paddingRight),
        bottom: parseFloat(computedStyle.paddingBottom),
        left: parseFloat(computedStyle.paddingLeft),
    };
    const border = {
        top: parseFloat(computedStyle.borderTopWidth),
        right: parseFloat(computedStyle.borderRightWidth),
        bottom: parseFloat(computedStyle.borderBottomWidth),
        left: parseFloat(computedStyle.borderLeftWidth),
    };
    // Draw margin
    if (margin.top > 0 || margin.right > 0 || margin.bottom > 0 || margin.left > 0) {
        const marginBox = document.createElement('div');
        applyStyles(marginBox, {
            position: 'absolute',
            top: `${rect.top + window.scrollY - margin.top}px`,
            left: `${rect.left + window.scrollX - margin.left}px`,
            width: `${rect.width + margin.left + margin.right}px`,
            height: `${rect.height + margin.top + margin.bottom}px`,
            background: 'rgba(246, 178, 107, 0.15)',
            border: '1px dashed rgba(246, 178, 107, 0.5)',
        });
        container.appendChild(marginBox);
    }
    // Draw padding
    if (padding.top > 0 || padding.right > 0 || padding.bottom > 0 || padding.left > 0) {
        const paddingBox = document.createElement('div');
        applyStyles(paddingBox, {
            position: 'absolute',
            top: `${rect.top + window.scrollY + border.top}px`,
            left: `${rect.left + window.scrollX + border.left}px`,
            width: `${rect.width - border.left - border.right}px`,
            height: `${rect.height - border.top - border.bottom}px`,
            background: 'rgba(147, 196, 125, 0.15)',
            border: '1px dashed rgba(147, 196, 125, 0.5)',
        });
        container.appendChild(paddingBox);
    }
    return container;
}
//# sourceMappingURL=overlay.js.map