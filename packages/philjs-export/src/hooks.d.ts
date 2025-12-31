/**
 * PhilJS Export Hooks
 * Signal-based hooks for export operations
 */
import type { ExportOptions } from './index.js';
import type { StreamProgress, StreamStats } from './utils/streaming.js';
export interface ExportState {
    isExporting: boolean;
    progress: number;
    error: Error | null;
    result: Blob | null;
}
export declare function useExport(): {
    state: () => ExportState;
    exportData: <T>(data: T, format: "csv" | "excel" | "json" | "xml" | "yaml" | "pdf", options?: ExportOptions) => Promise<Blob | null>;
    reset: () => void;
};
export interface StreamingExportState {
    isStreaming: boolean;
    progress: StreamProgress | null;
    error: Error | null;
    stats: StreamStats | null;
}
export declare function useStreamingExport(): {
    state: () => StreamingExportState;
    streamExport: <T>(generator: AsyncGenerator<T>, options?: {
        onChunk?: (chunk: T) => void;
        onProgress?: (progress: StreamProgress) => void;
        onComplete?: (stats: StreamStats) => void;
    }) => Promise<T[]>;
    reset: () => void;
};
export interface BatchExportState {
    isExporting: boolean;
    currentIndex: number;
    totalItems: number;
    completedItems: Blob[];
    errors: Array<{
        index: number;
        error: Error;
    }>;
}
export declare function useBatchExport(): {
    state: () => BatchExportState;
    batchExport: <T>(items: T[], format: "csv" | "excel" | "json" | "xml" | "yaml" | "pdf", options?: ExportOptions) => Promise<Blob[]>;
    reset: () => void;
};
//# sourceMappingURL=hooks.d.ts.map