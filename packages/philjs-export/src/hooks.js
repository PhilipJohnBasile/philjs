/**
 * PhilJS Export Hooks
 * Signal-based hooks for export operations
 */
function signal(initialValue) {
    let value = initialValue;
    const subscribers = new Set();
    const getter = (() => value);
    getter.set = (newValue) => {
        value = newValue;
        subscribers.forEach(fn => fn());
    };
    return getter;
}
export function useExport() {
    const state = signal({
        isExporting: false,
        progress: 0,
        error: null,
        result: null,
    });
    const exportData = async (data, format, options = {}) => {
        state.set({
            isExporting: true,
            progress: 0,
            error: null,
            result: null,
        });
        try {
            let blob;
            const progressCallback = (progress) => {
                state.set({
                    ...state(),
                    progress: progress * 100,
                });
                options.onProgress?.(progress);
            };
            const optionsWithProgress = { ...options, onProgress: progressCallback };
            switch (format) {
                case 'csv': {
                    const { exportToCSV } = await import('./index.js');
                    blob = await exportToCSV(data, optionsWithProgress);
                    break;
                }
                case 'excel': {
                    const { exportToExcel } = await import('./index.js');
                    blob = await exportToExcel(data, optionsWithProgress);
                    break;
                }
                case 'json': {
                    const { exportToJSON } = await import('./index.js');
                    blob = await exportToJSON(data, optionsWithProgress);
                    break;
                }
                case 'xml': {
                    const { exportToXML } = await import('./index.js');
                    blob = await exportToXML(data, optionsWithProgress);
                    break;
                }
                case 'yaml': {
                    const { exportToYAML } = await import('./index.js');
                    blob = await exportToYAML(data, optionsWithProgress);
                    break;
                }
                case 'pdf': {
                    const { exportToPDF } = await import('./index.js');
                    blob = await exportToPDF(data, optionsWithProgress);
                    break;
                }
                default:
                    throw new Error(`Unsupported format: ${format}`);
            }
            state.set({
                isExporting: false,
                progress: 100,
                error: null,
                result: blob,
            });
            return blob;
        }
        catch (error) {
            state.set({
                isExporting: false,
                progress: 0,
                error: error instanceof Error ? error : new Error(String(error)),
                result: null,
            });
            return null;
        }
    };
    const reset = () => {
        state.set({
            isExporting: false,
            progress: 0,
            error: null,
            result: null,
        });
    };
    return {
        state: () => state(),
        exportData,
        reset,
    };
}
export function useStreamingExport() {
    const state = signal({
        isStreaming: false,
        progress: null,
        error: null,
        stats: null,
    });
    const streamExport = async (generator, options = {}) => {
        state.set({
            isStreaming: true,
            progress: null,
            error: null,
            stats: null,
        });
        const chunks = [];
        const startTime = Date.now();
        try {
            for await (const chunk of generator) {
                chunks.push(chunk);
                options.onChunk?.(chunk);
                const progress = {
                    progress: 0, // Unknown total
                    processedItems: chunks.length,
                    bytesWritten: 0,
                    elapsedMs: Date.now() - startTime,
                    itemsPerSecond: chunks.length / ((Date.now() - startTime) / 1000),
                };
                state.set({
                    ...state(),
                    progress,
                });
                options.onProgress?.(progress);
            }
            const stats = {
                totalItems: chunks.length,
                totalBytes: 0,
                totalTimeMs: Date.now() - startTime,
                averageItemsPerSecond: chunks.length / ((Date.now() - startTime) / 1000),
                chunks: chunks.length,
            };
            state.set({
                isStreaming: false,
                progress: null,
                error: null,
                stats,
            });
            options.onComplete?.(stats);
            return chunks;
        }
        catch (error) {
            state.set({
                isStreaming: false,
                progress: null,
                error: error instanceof Error ? error : new Error(String(error)),
                stats: null,
            });
            return [];
        }
    };
    const reset = () => {
        state.set({
            isStreaming: false,
            progress: null,
            error: null,
            stats: null,
        });
    };
    return {
        state: () => state(),
        streamExport,
        reset,
    };
}
export function useBatchExport() {
    const state = signal({
        isExporting: false,
        currentIndex: 0,
        totalItems: 0,
        completedItems: [],
        errors: [],
    });
    const batchExport = async (items, format, options = {}) => {
        state.set({
            isExporting: true,
            currentIndex: 0,
            totalItems: items.length,
            completedItems: [],
            errors: [],
        });
        const results = [];
        const errors = [];
        for (let i = 0; i < items.length; i++) {
            state.set({
                ...state(),
                currentIndex: i,
            });
            try {
                const { useExport } = await import('./hooks.js');
                const exporter = useExport();
                const blob = await exporter.exportData(items[i], format, {
                    ...options,
                    download: false,
                });
                if (blob) {
                    results.push(blob);
                }
            }
            catch (error) {
                errors.push({
                    index: i,
                    error: error instanceof Error ? error : new Error(String(error)),
                });
            }
            state.set({
                ...state(),
                completedItems: [...results],
                errors: [...errors],
            });
        }
        state.set({
            isExporting: false,
            currentIndex: items.length,
            totalItems: items.length,
            completedItems: results,
            errors,
        });
        return results;
    };
    const reset = () => {
        state.set({
            isExporting: false,
            currentIndex: 0,
            totalItems: 0,
            completedItems: [],
            errors: [],
        });
    };
    return {
        state: () => state(),
        batchExport,
        reset,
    };
}
//# sourceMappingURL=hooks.js.map