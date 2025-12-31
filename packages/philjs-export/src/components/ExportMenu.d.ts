/**
 * ExportMenu Component
 *
 * A dropdown menu component for selecting export formats.
 */
import type { ExportOptions } from '../index.js';
/**
 * Export format configuration
 */
export interface ExportFormatConfig {
    format: 'csv' | 'excel' | 'json' | 'xml' | 'yaml' | 'pdf';
    label: string;
    icon?: string;
    disabled?: boolean;
    options?: ExportOptions;
}
/**
 * ExportMenu props
 */
export interface ExportMenuProps<T = unknown> {
    /**
     * Data to export
     */
    data: T | (() => T) | (() => Promise<T>);
    /**
     * Available formats (defaults to all)
     */
    formats?: ExportFormatConfig[];
    /**
     * Menu trigger label
     */
    label?: string;
    /**
     * Default export options
     */
    options?: ExportOptions;
    /**
     * Whether menu is disabled
     */
    disabled?: boolean;
    /**
     * Callback when export starts
     */
    onExportStart?: (format: string) => void;
    /**
     * Callback when export completes
     */
    onExportComplete?: (format: string, blob: Blob) => void;
    /**
     * Callback when export fails
     */
    onExportError?: (format: string, error: Error) => void;
    /**
     * Custom class name
     */
    className?: string;
    /**
     * Test ID for testing
     */
    testID?: string;
}
/**
 * ExportMenu state
 */
export interface ExportMenuState {
    isOpen: boolean;
    isExporting: boolean;
    currentFormat: string | null;
    progress: number;
    error: Error | null;
}
/**
 * Create an ExportMenu component
 */
export declare function ExportMenu<T = unknown>(props: ExportMenuProps<T>): unknown;
/**
 * Create ExportMenu state for external access
 */
export declare function createExportMenuState(): {
    state: () => ExportMenuState;
    reset: () => void;
};
export default ExportMenu;
//# sourceMappingURL=ExportMenu.d.ts.map