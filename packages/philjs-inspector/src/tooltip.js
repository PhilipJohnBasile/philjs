/**
 * Floating tooltip UI for component details
 */
import { INSPECTOR_STYLES, applyStyles } from './styles.js';
import { formatPropValue } from './component-info.js';
let tooltip = null;
let currentComponent = null;
/**
 * Show tooltip for component
 */
export function showTooltip(componentInfo, position) {
    if (tooltip) {
        hideTooltip();
    }
    currentComponent = componentInfo;
    tooltip = document.createElement('div');
    applyStyles(tooltip, INSPECTOR_STYLES.tooltip);
    // Build tooltip content
    tooltip.innerHTML = buildTooltipContent(componentInfo);
    document.body.appendChild(tooltip);
    // Position tooltip
    positionTooltip(position);
    // Add event listeners
    setupTooltipEvents();
}
/**
 * Hide tooltip
 */
export function hideTooltip() {
    if (tooltip) {
        tooltip.remove();
        tooltip = null;
        currentComponent = null;
    }
}
/**
 * Update tooltip content
 */
export function updateTooltip(componentInfo) {
    if (!tooltip)
        return;
    currentComponent = componentInfo;
    tooltip.innerHTML = buildTooltipContent(componentInfo);
    setupTooltipEvents();
}
/**
 * Build tooltip HTML content
 */
function buildTooltipContent(info) {
    const sections = [];
    // Header
    sections.push(`
    <div style="${stylesToString(INSPECTOR_STYLES.tooltipHeader)}">
      <div style="${stylesToString(INSPECTOR_STYLES.tooltipTitle)}">
        ${escapeHtml(info.name)}
        ${info.isIsland
        ? `<span style="${stylesToString({ ...INSPECTOR_STYLES.badge, ...INSPECTOR_STYLES.islandBadge })}">Island</span>`
        : ''}
        ${info.isHydrated
        ? `<span style="${stylesToString({ ...INSPECTOR_STYLES.badge, ...INSPECTOR_STYLES.hydratedBadge })}">Hydrated</span>`
        : ''}
      </div>
      <button class="philjs-tooltip-close" style="${stylesToString(INSPECTOR_STYLES.tooltipClose)}">×</button>
    </div>
  `);
    // Props section
    if (Object.keys(info.props).length > 0) {
        sections.push(`
      <div style="${stylesToString(INSPECTOR_STYLES.tooltipSection)}">
        <div style="${stylesToString(INSPECTOR_STYLES.tooltipSectionTitle)}">Props</div>
        <ul style="${stylesToString(INSPECTOR_STYLES.propsList)}">
          ${Object.entries(info.props)
            .map(([key, value]) => `
            <li style="${stylesToString(INSPECTOR_STYLES.propsItem)}">
              <span style="${stylesToString(INSPECTOR_STYLES.propsKey)}">${escapeHtml(key)}:</span>
              <span style="${stylesToString(INSPECTOR_STYLES.propsValue)}">${escapeHtml(formatPropValue(value))}</span>
            </li>
          `)
            .join('')}
        </ul>
      </div>
    `);
    }
    // Signals section
    if (info.signals.length > 0) {
        sections.push(`
      <div style="${stylesToString(INSPECTOR_STYLES.tooltipSection)}">
        <div style="${stylesToString(INSPECTOR_STYLES.tooltipSectionTitle)}">Signals</div>
        <ul style="${stylesToString(INSPECTOR_STYLES.signalList)}">
          ${info.signals
            .map((signal) => `
            <li style="${stylesToString(INSPECTOR_STYLES.signalItem)}">
              <span style="${stylesToString(INSPECTOR_STYLES.signalName)}">${escapeHtml(signal.name)}</span>
              <span style="${stylesToString(INSPECTOR_STYLES.signalValue)}">${escapeHtml(formatPropValue(signal.value))}</span>
            </li>
          `)
            .join('')}
        </ul>
      </div>
    `);
    }
    // Performance metrics
    if (info.renderCount > 0) {
        sections.push(`
      <div style="${stylesToString(INSPECTOR_STYLES.tooltipSection)}">
        <div style="${stylesToString(INSPECTOR_STYLES.tooltipSectionTitle)}">Performance</div>
        <div style="${stylesToString(INSPECTOR_STYLES.metricsPanel)}">
          <div style="${stylesToString(INSPECTOR_STYLES.metricsRow)}">
            <span style="${stylesToString(INSPECTOR_STYLES.metricsLabel)}">Render Count:</span>
            <span style="${stylesToString(INSPECTOR_STYLES.metricsValue)}">${info.renderCount}</span>
          </div>
          <div style="${stylesToString(INSPECTOR_STYLES.metricsRow)}">
            <span style="${stylesToString(INSPECTOR_STYLES.metricsLabel)}">Last Render:</span>
            <span style="${stylesToString(INSPECTOR_STYLES.metricsValue)}">${info.renderTime.toFixed(2)}ms</span>
          </div>
          <div style="${stylesToString(INSPECTOR_STYLES.metricsRow)}">
            <span style="${stylesToString(INSPECTOR_STYLES.metricsLabel)}">Updates:</span>
            <span style="${stylesToString(INSPECTOR_STYLES.metricsValue)}">${info.updateCount}</span>
          </div>
        </div>
      </div>
    `);
    }
    // Source location
    if (info.source) {
        sections.push(`
      <div style="${stylesToString(INSPECTOR_STYLES.tooltipSection)}">
        <div style="${stylesToString(INSPECTOR_STYLES.tooltipSectionTitle)}">Source</div>
        <a href="vscode://file/${info.source.file}:${info.source.line}:${info.source.column}"
           class="philjs-source-link"
           style="${stylesToString(INSPECTOR_STYLES.sourceLink)}">
          ${escapeHtml(info.source.file)}:${info.source.line}:${info.source.column}
        </a>
      </div>
    `);
    }
    // Component path
    if (info.path.length > 0) {
        sections.push(`
      <div style="${stylesToString(INSPECTOR_STYLES.tooltipSection)}">
        <div style="${stylesToString(INSPECTOR_STYLES.tooltipSectionTitle)}">Component Path</div>
        <div style="font-size: 11px; color: #9ca3af; font-family: monospace;">
          ${info.path.join(' > ')}
        </div>
      </div>
    `);
    }
    return sections.join('');
}
/**
 * Position tooltip on screen
 */
function positionTooltip(position) {
    if (!tooltip)
        return;
    const rect = tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    let x = position?.x ?? viewportWidth / 2 - rect.width / 2;
    let y = position?.y ?? viewportHeight / 2 - rect.height / 2;
    // Keep tooltip within viewport
    if (x + rect.width > viewportWidth - 20) {
        x = viewportWidth - rect.width - 20;
    }
    if (x < 20) {
        x = 20;
    }
    if (y + rect.height > viewportHeight - 20) {
        y = viewportHeight - rect.height - 20;
    }
    if (y < 20) {
        y = 20;
    }
    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${y}px`;
}
/**
 * Setup tooltip event listeners
 */
function setupTooltipEvents() {
    if (!tooltip)
        return;
    // Close button
    const closeBtn = tooltip.querySelector('.philjs-tooltip-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            hideTooltip();
        });
    }
    // Source link
    const sourceLink = tooltip.querySelector('.philjs-source-link');
    if (sourceLink) {
        sourceLink.addEventListener('click', (e) => {
            e.preventDefault();
            const href = e.currentTarget.href;
            // Try to open in IDE
            if (typeof window !== 'undefined' && window.__PHILJS_OPEN_IN_IDE__) {
                window.__PHILJS_OPEN_IN_IDE__(href);
            }
            else {
                // Fallback: try to open with window.open
                window.open(href, '_blank');
            }
        });
    }
    // Make tooltip draggable
    makeDraggable(tooltip);
}
/**
 * Make element draggable
 */
function makeDraggable(element) {
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let elementX = 0;
    let elementY = 0;
    const header = element.querySelector('[style*="tooltipHeader"]');
    if (!header)
        return;
    header.style.cursor = 'move';
    header.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        const rect = element.getBoundingClientRect();
        elementX = rect.left;
        elementY = rect.top;
        e.preventDefault();
    });
    document.addEventListener('mousemove', (e) => {
        if (!isDragging)
            return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        element.style.left = `${elementX + dx}px`;
        element.style.top = `${elementY + dy}px`;
    });
    document.addEventListener('mouseup', () => {
        isDragging = false;
    });
}
/**
 * Convert styles object to CSS string
 */
function stylesToString(styles) {
    return Object.entries(styles)
        .map(([key, value]) => {
        const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        return `${cssKey}: ${value}`;
    })
        .join('; ');
}
/**
 * Escape HTML for safe display
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
/**
 * Get current tooltip component
 */
export function getCurrentTooltipComponent() {
    return currentComponent;
}
/**
 * Check if tooltip is visible
 */
export function isTooltipVisible() {
    return tooltip !== null;
}
//# sourceMappingURL=tooltip.js.map