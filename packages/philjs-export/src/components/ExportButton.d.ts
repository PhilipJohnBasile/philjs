/**
 * ExportButton Component
 *
 * A button component for triggering data exports in various formats.
 */
import type { ExportOptions } from '../index.js';
/**
 * ExportButton props
 */
export interface ExportButtonProps<T = unknown> {
    /**
     * Data to export
     */
    data: T | (() => T) | (() => Promise<T>);
    /**
     * Export format
     */
    format: 'csv' | 'excel' | 'json' | 'xml' | 'yaml' | 'pdf';
    /**
     * Button label
     */
    label?: string;
    /**
     * Export options
     */
    options?: ExportOptions;
    /**
     * Whether button is disabled
     */
    disabled?: boolean;
    /**
     * Callback when export starts
     */
    onExportStart?: () => void;
    /**
     * Callback when export completes
     */
    onExportComplete?: (blob: Blob) => void;
    /**
     * Callback when export fails
     */
    onExportError?: (error: Error) => void;
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
 * ExportButton state
 */
export interface ExportButtonState {
    isExporting: boolean;
    progress: number;
    error: Error | null;
}
/**
 * Create an ExportButton component
 */
export declare function ExportButton<T = unknown>(props: ExportButtonProps<T>): unknown;
/**
 * Get current state of an ExportButton (for external access)
 */
export declare function createExportButtonState(): {
    state: () => ExportButtonState;
    reset: () => void;
};
export default ExportButton;
//# sourceMappingURL=ExportButton.d.ts.map