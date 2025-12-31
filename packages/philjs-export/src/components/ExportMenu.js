/**
 * ExportMenu Component
 *
 * A dropdown menu component for selecting export formats.
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
// Default Formats
// ============================================================================
const DEFAULT_FORMATS = [
    { format: 'csv', label: 'CSV (.csv)' },
    { format: 'excel', label: 'Excel (.xlsx)' },
    { format: 'json', label: 'JSON (.json)' },
    { format: 'xml', label: 'XML (.xml)' },
    { format: 'yaml', label: 'YAML (.yaml)' },
    { format: 'pdf', label: 'PDF (.pdf)' },
];
// ============================================================================
// ExportMenu Component
// ============================================================================
/**
 * Create an ExportMenu component
 */
export function ExportMenu(props) {
    const state = signal({
        isOpen: false,
        isExporting: false,
        currentFormat: null,
        progress: 0,
        error: null,
    });
    const formats = props.formats || DEFAULT_FORMATS;
    const toggleMenu = () => {
        if (props.disabled || state().isExporting)
            return;
        state.set({
            ...state(),
            isOpen: !state().isOpen,
        });
    };
    const closeMenu = () => {
        state.set({
            ...state(),
            isOpen: false,
        });
    };
    const handleExport = async (formatConfig) => {
        if (state().isExporting || formatConfig.disabled)
            return;
        closeMenu();
        state.set({
            ...state(),
            isExporting: true,
            currentFormat: formatConfig.format,
            progress: 0,
            error: null,
        });
        props.onExportStart?.(formatConfig.format);
        try {
            // Get data (supports function, async function, or direct value)
            const data = typeof props.data === 'function'
                ? await props.data()
                : props.data;
            // Dynamic import to avoid circular dependencies
            const { useExport } = await import('../hooks.js');
            const exporter = useExport();
            const mergedOptions = {
                ...props.options,
                ...formatConfig.options,
                onProgress: (progress) => {
                    state.set({
                        ...state(),
                        progress: progress * 100,
                    });
                },
            };
            const blob = await exporter.exportData(data, formatConfig.format, mergedOptions);
            state.set({
                ...state(),
                isExporting: false,
                currentFormat: null,
                progress: 100,
                error: null,
            });
            if (blob) {
                props.onExportComplete?.(formatConfig.format, blob);
            }
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            state.set({
                ...state(),
                isExporting: false,
                currentFormat: null,
                progress: 0,
                error: err,
            });
            props.onExportError?.(formatConfig.format, err);
        }
    };
    const currentState = state();
    const label = props.label || 'Export';
    return {
        type: 'div',
        props: {
            className: `export-menu ${props.className || ''}`.trim(),
            'data-testid': props.testID,
            style: {
                position: 'relative',
                display: 'inline-block',
            },
        },
        children: [
            // Trigger button
            {
                type: 'button',
                props: {
                    className: 'export-menu-trigger',
                    disabled: props.disabled || currentState.isExporting,
                    'aria-haspopup': 'menu',
                    'aria-expanded': currentState.isOpen,
                    onClick: toggleMenu,
                    style: {
                        cursor: props.disabled || currentState.isExporting ? 'not-allowed' : 'pointer',
                        opacity: props.disabled ? 0.5 : 1,
                    },
                },
                children: currentState.isExporting
                    ? `Exporting ${currentState.currentFormat}... ${Math.round(currentState.progress)}%`
                    : label,
            },
            // Dropdown menu
            currentState.isOpen && {
                type: 'div',
                props: {
                    className: 'export-menu-dropdown',
                    role: 'menu',
                    style: {
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        zIndex: 1000,
                        minWidth: '150px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #e0e0e0',
                        borderRadius: '4px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                        marginTop: '4px',
                    },
                },
                children: formats.map((formatConfig) => ({
                    type: 'button',
                    props: {
                        className: 'export-menu-item',
                        role: 'menuitem',
                        disabled: formatConfig.disabled,
                        onClick: () => handleExport(formatConfig),
                        style: {
                            display: 'block',
                            width: '100%',
                            padding: '8px 16px',
                            textAlign: 'left',
                            border: 'none',
                            backgroundColor: 'transparent',
                            cursor: formatConfig.disabled ? 'not-allowed' : 'pointer',
                            opacity: formatConfig.disabled ? 0.5 : 1,
                        },
                    },
                    children: formatConfig.label,
                })),
            },
        ].filter(Boolean),
    };
}
/**
 * Create ExportMenu state for external access
 */
export function createExportMenuState() {
    const state = signal({
        isOpen: false,
        isExporting: false,
        currentFormat: null,
        progress: 0,
        error: null,
    });
    return {
        state: () => state(),
        reset: () => state.set({
            isOpen: false,
            isExporting: false,
            currentFormat: null,
            progress: 0,
            error: null,
        }),
    };
}
export default ExportMenu;
//# sourceMappingURL=ExportMenu.js.map