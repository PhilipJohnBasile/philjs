/**
 * ExportButton Component
 *
 * A button component for triggering data exports in various formats.
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
// ============================================================================
// ExportButton Component
// ============================================================================
/**
 * Create an ExportButton component
 */
export function ExportButton(props) {
    const state = signal({
        isExporting: false,
        progress: 0,
        error: null,
    });
    const handleExport = async () => {
        if (state().isExporting || props.disabled)
            return;
        state.set({
            isExporting: true,
            progress: 0,
            error: null,
        });
        props.onExportStart?.();
        try {
            // Get data (supports function, async function, or direct value)
            const data = typeof props.data === 'function'
                ? await props.data()
                : props.data;
            // Dynamic import to avoid circular dependencies
            const { useExport } = await import('../hooks.js');
            const exporter = useExport();
            const blob = await exporter.exportData(data, props.format, {
                ...props.options,
                onProgress: (progress) => {
                    state.set({
                        ...state(),
                        progress: progress * 100,
                    });
                },
            });
            state.set({
                isExporting: false,
                progress: 100,
                error: null,
            });
            if (blob) {
                props.onExportComplete?.(blob);
            }
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            state.set({
                isExporting: false,
                progress: 0,
                error: err,
            });
            props.onExportError?.(err);
        }
    };
    const formatLabels = {
        csv: 'CSV',
        excel: 'Excel',
        json: 'JSON',
        xml: 'XML',
        yaml: 'YAML',
        pdf: 'PDF',
    };
    const label = props.label || `Export to ${formatLabels[props.format] || props.format.toUpperCase()}`;
    const currentState = state();
    return {
        type: 'button',
        props: {
            className: props.className,
            disabled: props.disabled || currentState.isExporting,
            'data-testid': props.testID,
            'aria-label': label,
            'aria-busy': currentState.isExporting,
            onClick: handleExport,
            style: {
                cursor: props.disabled || currentState.isExporting ? 'not-allowed' : 'pointer',
                opacity: props.disabled ? 0.5 : 1,
            },
        },
        children: currentState.isExporting
            ? `Exporting... ${Math.round(currentState.progress)}%`
            : label,
    };
}
/**
 * Get current state of an ExportButton (for external access)
 */
export function createExportButtonState() {
    const state = signal({
        isExporting: false,
        progress: 0,
        error: null,
    });
    return {
        state: () => state(),
        reset: () => state.set({
            isExporting: false,
            progress: 0,
            error: null,
        }),
    };
}
export default ExportButton;
//# sourceMappingURL=ExportButton.js.map