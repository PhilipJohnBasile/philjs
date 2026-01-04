/**
 * Inline styles for PhilJS Inspector UI
 * All styles are scoped to avoid conflicts with the application
 */
export declare const INSPECTOR_STYLES: {
    overlay: {
        readonly position: "fixed";
        readonly top: "0";
        readonly left: "0";
        readonly width: "100%";
        readonly height: "100%";
        readonly pointerEvents: "none";
        readonly zIndex: "999999";
        readonly fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif";
        readonly fontSize: "14px";
    };
    highlightBox: {
        readonly position: "absolute";
        readonly pointerEvents: "none";
        readonly border: "2px solid #3b82f6";
        readonly background: "rgba(59, 130, 246, 0.1)";
        readonly transition: "all 0.1s ease-out";
        readonly zIndex: "999999";
    };
    highlightBoxHover: {
        readonly position: "absolute";
        readonly pointerEvents: "none";
        readonly border: "2px solid #8b5cf6";
        readonly background: "rgba(139, 92, 246, 0.15)";
        readonly zIndex: "999998";
    };
    componentLabel: {
        readonly position: "absolute";
        readonly background: "#3b82f6";
        readonly color: "white";
        readonly padding: "2px 8px";
        readonly borderRadius: "3px";
        readonly fontSize: "12px";
        readonly fontWeight: "600";
        readonly whiteSpace: "nowrap";
        readonly pointerEvents: "none";
        readonly zIndex: "1000000";
        readonly boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)";
    };
    tooltip: {
        readonly position: "fixed";
        readonly background: "rgba(17, 24, 39, 0.98)";
        readonly color: "white";
        readonly borderRadius: "8px";
        readonly boxShadow: "0 10px 40px rgba(0, 0, 0, 0.3)";
        readonly maxWidth: "400px";
        readonly maxHeight: "500px";
        readonly overflow: "auto";
        readonly pointerEvents: "auto";
        readonly zIndex: "1000001";
        readonly fontSize: "13px";
        readonly backdropFilter: "blur(10px)";
    };
    tooltipHeader: {
        readonly padding: "12px 16px";
        readonly borderBottom: "1px solid rgba(255, 255, 255, 0.1)";
        readonly display: "flex";
        readonly justifyContent: "space-between";
        readonly alignItems: "center";
    };
    tooltipTitle: {
        readonly fontSize: "14px";
        readonly fontWeight: "600";
        readonly color: "#60a5fa";
    };
    tooltipClose: {
        readonly background: "transparent";
        readonly border: "none";
        readonly color: "#9ca3af";
        readonly cursor: "pointer";
        readonly padding: "4px 8px";
        readonly fontSize: "18px";
        readonly lineHeight: "1";
    };
    tooltipSection: {
        readonly padding: "12px 16px";
        readonly borderBottom: "1px solid rgba(255, 255, 255, 0.1)";
    };
    tooltipSectionTitle: {
        readonly fontSize: "11px";
        readonly fontWeight: "700";
        readonly textTransform: "uppercase";
        readonly color: "#9ca3af";
        readonly marginBottom: "8px";
        readonly letterSpacing: "0.5px";
    };
    breadcrumb: {
        readonly position: "fixed";
        readonly top: "16px";
        readonly left: "50%";
        readonly transform: "translateX(-50%)";
        readonly background: "rgba(17, 24, 39, 0.98)";
        readonly color: "white";
        readonly padding: "8px 16px";
        readonly borderRadius: "8px";
        readonly boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2)";
        readonly fontSize: "12px";
        readonly pointerEvents: "auto";
        readonly zIndex: "1000000";
        readonly maxWidth: "80%";
        readonly overflow: "auto";
        readonly whiteSpace: "nowrap";
        readonly backdropFilter: "blur(10px)";
    };
    breadcrumbItem: {
        readonly display: "inline-block";
        readonly cursor: "pointer";
        readonly padding: "4px 8px";
        readonly borderRadius: "4px";
        readonly transition: "background 0.2s";
    };
    breadcrumbSeparator: {
        readonly display: "inline-block";
        readonly margin: "0 8px";
        readonly color: "#6b7280";
    };
    searchBox: {
        readonly position: "fixed";
        readonly top: "16px";
        readonly right: "16px";
        readonly background: "rgba(17, 24, 39, 0.98)";
        readonly borderRadius: "8px";
        readonly boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2)";
        readonly padding: "8px";
        readonly pointerEvents: "auto";
        readonly zIndex: "1000000";
        readonly backdropFilter: "blur(10px)";
    };
    searchInput: {
        readonly background: "rgba(255, 255, 255, 0.1)";
        readonly border: "1px solid rgba(255, 255, 255, 0.2)";
        readonly borderRadius: "6px";
        readonly color: "white";
        readonly padding: "8px 12px";
        readonly fontSize: "13px";
        readonly outline: "none";
        readonly width: "250px";
    };
    searchResults: {
        readonly marginTop: "8px";
        readonly maxHeight: "300px";
        readonly overflow: "auto";
    };
    searchResultItem: {
        readonly padding: "8px 12px";
        readonly cursor: "pointer";
        readonly borderRadius: "4px";
        readonly transition: "background 0.2s";
        readonly fontSize: "12px";
    };
    metricsPanel: {
        readonly background: "rgba(17, 24, 39, 0.95)";
        readonly padding: "8px";
        readonly borderRadius: "4px";
        readonly marginTop: "8px";
    };
    metricsRow: {
        readonly display: "flex";
        readonly justifyContent: "space-between";
        readonly padding: "4px 0";
        readonly fontSize: "12px";
    };
    metricsLabel: {
        readonly color: "#9ca3af";
    };
    metricsValue: {
        readonly color: "#60a5fa";
        readonly fontWeight: "600";
    };
    propsList: {
        readonly listStyle: "none";
        readonly padding: "0";
        readonly margin: "0";
    };
    propsItem: {
        readonly padding: "6px 0";
        readonly fontSize: "12px";
        readonly fontFamily: "\"Fira Code\", \"Courier New\", monospace";
    };
    propsKey: {
        readonly color: "#a78bfa";
        readonly fontWeight: "600";
    };
    propsValue: {
        readonly color: "#34d399";
        readonly marginLeft: "8px";
    };
    badge: {
        readonly display: "inline-block";
        readonly padding: "2px 8px";
        readonly borderRadius: "12px";
        readonly fontSize: "10px";
        readonly fontWeight: "600";
        readonly textTransform: "uppercase";
        readonly letterSpacing: "0.5px";
        readonly marginLeft: "8px";
    };
    islandBadge: {
        readonly background: "#10b981";
        readonly color: "white";
    };
    hydratedBadge: {
        readonly background: "#3b82f6";
        readonly color: "white";
    };
    statusBar: {
        readonly position: "fixed";
        readonly bottom: "16px";
        readonly right: "16px";
        readonly background: "rgba(17, 24, 39, 0.98)";
        readonly color: "white";
        readonly padding: "8px 16px";
        readonly borderRadius: "8px";
        readonly boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2)";
        readonly fontSize: "11px";
        readonly pointerEvents: "auto";
        readonly zIndex: "1000000";
        readonly backdropFilter: "blur(10px)";
    };
    statusBarShortcut: {
        readonly color: "#9ca3af";
        readonly marginLeft: "8px";
        readonly fontFamily: "\"Fira Code\", \"Courier New\", monospace";
    };
    sourceLink: {
        readonly display: "block";
        readonly color: "#60a5fa";
        readonly textDecoration: "none";
        readonly fontSize: "12px";
        readonly fontFamily: "\"Fira Code\", \"Courier New\", monospace";
        readonly marginTop: "8px";
        readonly padding: "6px 8px";
        readonly background: "rgba(59, 130, 246, 0.1)";
        readonly borderRadius: "4px";
        readonly transition: "background 0.2s";
    };
    signalList: {
        readonly listStyle: "none";
        readonly padding: "0";
        readonly margin: "0";
    };
    signalItem: {
        readonly padding: "6px 8px";
        readonly background: "rgba(139, 92, 246, 0.1)";
        readonly borderRadius: "4px";
        readonly marginBottom: "4px";
        readonly fontSize: "12px";
        readonly fontFamily: "\"Fira Code\", \"Courier New\", monospace";
    };
    signalName: {
        readonly color: "#a78bfa";
        readonly fontWeight: "600";
    };
    signalValue: {
        readonly color: "#34d399";
        readonly marginLeft: "8px";
    };
};
/**
 * Convert style object to CSS string
 */
export declare function styleToCss(style: Record<string, string | number>): string;
/**
 * Apply styles to an element
 */
export declare function applyStyles(element: HTMLElement, styles: Record<string, string | number>): void;
//# sourceMappingURL=styles.d.ts.map