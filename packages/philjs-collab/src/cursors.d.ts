/**
 * Cursor Sync for PhilJS Collab
 *
 * Real-time cursor and selection synchronization:
 * - Remote cursor rendering
 * - Selection highlighting
 * - Smooth cursor animations
 * - Cursor labels with user names
 */
export interface CursorPosition {
    clientId: string;
    userId?: string;
    name: string;
    color: string;
    position: {
        line: number;
        column: number;
        offset?: number;
    };
    selection?: {
        start: {
            line: number;
            column: number;
            offset?: number;
        };
        end: {
            line: number;
            column: number;
            offset?: number;
        };
    };
    timestamp: number;
}
export interface CursorConfig {
    showLabels?: boolean;
    labelTimeout?: number;
    smoothing?: boolean;
    smoothingDuration?: number;
    showSelections?: boolean;
    cursorStyle?: 'line' | 'block' | 'underline';
}
export interface CursorDecoration {
    clientId: string;
    element: HTMLElement;
    labelElement?: HTMLElement;
    selectionElements?: HTMLElement[] | undefined;
    position: CursorPosition;
    animationFrame?: number;
}
/**
 * Cursor Manager for collaborative editing
 */
export declare class CursorManager {
    private cursors;
    private decorations;
    private container;
    private config;
    private listeners;
    private localClientId;
    private labelTimers;
    constructor(localClientId: string, config?: CursorConfig);
    /**
     * Attach to a container element
     */
    attach(container: HTMLElement): void;
    /**
     * Detach from container
     */
    detach(): void;
    /**
     * Update a cursor position
     */
    updateCursor(cursor: CursorPosition): void;
    /**
     * Remove a cursor
     */
    removeCursor(clientId: string): void;
    /**
     * Get all cursors
     */
    getCursors(): Map<string, CursorPosition>;
    /**
     * Subscribe to cursor changes
     */
    subscribe(listener: (cursors: Map<string, CursorPosition>) => void): () => void;
    /**
     * Convert line/column to pixel position
     */
    getPixelPosition(position: {
        line: number;
        column: number;
    }, editor?: HTMLElement): {
        x: number;
        y: number;
    } | null;
    private renderCursor;
    private createDecoration;
    private updateDecoration;
    private updateSelectionDecoration;
    private removeDecoration;
    private notifyListeners;
}
/**
 * Create a cursor manager
 */
export declare function createCursorManager(localClientId: string, config?: CursorConfig): CursorManager;
/**
 * CSS styles for cursors (inject into document)
 */
export declare const CURSOR_STYLES = "\n  .philjs-cursor-layer {\n    position: absolute;\n    inset: 0;\n    pointer-events: none;\n    z-index: 1000;\n    overflow: hidden;\n  }\n\n  .philjs-remote-cursor {\n    position: absolute;\n    width: 2px;\n    border-radius: 1px;\n    pointer-events: none;\n  }\n\n  .philjs-remote-cursor::after {\n    content: '';\n    position: absolute;\n    top: 0;\n    left: -1px;\n    width: 4px;\n    height: 4px;\n    background-color: inherit;\n    border-radius: 50%;\n  }\n\n  .philjs-cursor-label {\n    position: absolute;\n    bottom: 100%;\n    left: 0;\n    padding: 2px 6px;\n    font-size: 11px;\n    font-weight: 500;\n    border-radius: 3px 3px 3px 0;\n    white-space: nowrap;\n    color: white;\n    pointer-events: none;\n    user-select: none;\n  }\n\n  .philjs-selection {\n    position: absolute;\n    pointer-events: none;\n    border-radius: 2px;\n  }\n\n  @keyframes philjs-cursor-blink {\n    0%, 100% { opacity: 1; }\n    50% { opacity: 0; }\n  }\n";
/**
 * Inject cursor styles into document
 */
export declare function injectCursorStyles(): void;
//# sourceMappingURL=cursors.d.ts.map