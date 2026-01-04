/**
 * Inline styles for PhilJS Inspector UI
 * All styles are scoped to avoid conflicts with the application
 */
export const INSPECTOR_STYLES = {
    overlay: {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: '999999',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: '14px',
    },
    highlightBox: {
        position: 'absolute',
        pointerEvents: 'none',
        border: '2px solid #3b82f6',
        background: 'rgba(59, 130, 246, 0.1)',
        transition: 'all 0.1s ease-out',
        zIndex: '999999',
    },
    highlightBoxHover: {
        position: 'absolute',
        pointerEvents: 'none',
        border: '2px solid #8b5cf6',
        background: 'rgba(139, 92, 246, 0.15)',
        zIndex: '999998',
    },
    componentLabel: {
        position: 'absolute',
        background: '#3b82f6',
        color: 'white',
        padding: '2px 8px',
        borderRadius: '3px',
        fontSize: '12px',
        fontWeight: '600',
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        zIndex: '1000000',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
    },
    tooltip: {
        position: 'fixed',
        background: 'rgba(17, 24, 39, 0.98)',
        color: 'white',
        borderRadius: '8px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
        maxWidth: '400px',
        maxHeight: '500px',
        overflow: 'auto',
        pointerEvents: 'auto',
        zIndex: '1000001',
        fontSize: '13px',
        backdropFilter: 'blur(10px)',
    },
    tooltipHeader: {
        padding: '12px 16px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    tooltipTitle: {
        fontSize: '14px',
        fontWeight: '600',
        color: '#60a5fa',
    },
    tooltipClose: {
        background: 'transparent',
        border: 'none',
        color: '#9ca3af',
        cursor: 'pointer',
        padding: '4px 8px',
        fontSize: '18px',
        lineHeight: '1',
    },
    tooltipSection: {
        padding: '12px 16px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    },
    tooltipSectionTitle: {
        fontSize: '11px',
        fontWeight: '700',
        textTransform: 'uppercase',
        color: '#9ca3af',
        marginBottom: '8px',
        letterSpacing: '0.5px',
    },
    breadcrumb: {
        position: 'fixed',
        top: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(17, 24, 39, 0.98)',
        color: 'white',
        padding: '8px 16px',
        borderRadius: '8px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
        fontSize: '12px',
        pointerEvents: 'auto',
        zIndex: '1000000',
        maxWidth: '80%',
        overflow: 'auto',
        whiteSpace: 'nowrap',
        backdropFilter: 'blur(10px)',
    },
    breadcrumbItem: {
        display: 'inline-block',
        cursor: 'pointer',
        padding: '4px 8px',
        borderRadius: '4px',
        transition: 'background 0.2s',
    },
    breadcrumbSeparator: {
        display: 'inline-block',
        margin: '0 8px',
        color: '#6b7280',
    },
    searchBox: {
        position: 'fixed',
        top: '16px',
        right: '16px',
        background: 'rgba(17, 24, 39, 0.98)',
        borderRadius: '8px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
        padding: '8px',
        pointerEvents: 'auto',
        zIndex: '1000000',
        backdropFilter: 'blur(10px)',
    },
    searchInput: {
        background: 'rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '6px',
        color: 'white',
        padding: '8px 12px',
        fontSize: '13px',
        outline: 'none',
        width: '250px',
    },
    searchResults: {
        marginTop: '8px',
        maxHeight: '300px',
        overflow: 'auto',
    },
    searchResultItem: {
        padding: '8px 12px',
        cursor: 'pointer',
        borderRadius: '4px',
        transition: 'background 0.2s',
        fontSize: '12px',
    },
    metricsPanel: {
        background: 'rgba(17, 24, 39, 0.95)',
        padding: '8px',
        borderRadius: '4px',
        marginTop: '8px',
    },
    metricsRow: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '4px 0',
        fontSize: '12px',
    },
    metricsLabel: {
        color: '#9ca3af',
    },
    metricsValue: {
        color: '#60a5fa',
        fontWeight: '600',
    },
    propsList: {
        listStyle: 'none',
        padding: '0',
        margin: '0',
    },
    propsItem: {
        padding: '6px 0',
        fontSize: '12px',
        fontFamily: '"Fira Code", "Courier New", monospace',
    },
    propsKey: {
        color: '#a78bfa',
        fontWeight: '600',
    },
    propsValue: {
        color: '#34d399',
        marginLeft: '8px',
    },
    badge: {
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: '12px',
        fontSize: '10px',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        marginLeft: '8px',
    },
    islandBadge: {
        background: '#10b981',
        color: 'white',
    },
    hydratedBadge: {
        background: '#3b82f6',
        color: 'white',
    },
    statusBar: {
        position: 'fixed',
        bottom: '16px',
        right: '16px',
        background: 'rgba(17, 24, 39, 0.98)',
        color: 'white',
        padding: '8px 16px',
        borderRadius: '8px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
        fontSize: '11px',
        pointerEvents: 'auto',
        zIndex: '1000000',
        backdropFilter: 'blur(10px)',
    },
    statusBarShortcut: {
        color: '#9ca3af',
        marginLeft: '8px',
        fontFamily: '"Fira Code", "Courier New", monospace',
    },
    sourceLink: {
        display: 'block',
        color: '#60a5fa',
        textDecoration: 'none',
        fontSize: '12px',
        fontFamily: '"Fira Code", "Courier New", monospace',
        marginTop: '8px',
        padding: '6px 8px',
        background: 'rgba(59, 130, 246, 0.1)',
        borderRadius: '4px',
        transition: 'background 0.2s',
    },
    signalList: {
        listStyle: 'none',
        padding: '0',
        margin: '0',
    },
    signalItem: {
        padding: '6px 8px',
        background: 'rgba(139, 92, 246, 0.1)',
        borderRadius: '4px',
        marginBottom: '4px',
        fontSize: '12px',
        fontFamily: '"Fira Code", "Courier New", monospace',
    },
    signalName: {
        color: '#a78bfa',
        fontWeight: '600',
    },
    signalValue: {
        color: '#34d399',
        marginLeft: '8px',
    },
};
/**
 * Convert style object to CSS string
 */
export function styleToCss(style) {
    return Object.entries(style)
        .map(([key, value]) => {
        const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        return `${cssKey}: ${value}`;
    })
        .join('; ');
}
/**
 * Apply styles to an element
 */
export function applyStyles(element, styles) {
    Object.entries(styles).forEach(([key, value]) => {
        element.style[key] = value;
    });
}
//# sourceMappingURL=styles.js.map