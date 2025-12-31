export interface Position {
    x: number;
    y: number;
}
export interface Size {
    width: number;
    height: number;
}
export interface Bounds {
    x: number;
    y: number;
    width: number;
    height: number;
}
export interface SpacingValue {
    top: number;
    right: number;
    bottom: number;
    left: number;
}
export interface TypographyStyle {
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: number | string;
    lineHeight?: number | string;
    letterSpacing?: number | string;
    textAlign?: 'left' | 'center' | 'right' | 'justify';
    textDecoration?: string;
    textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
}
export interface ComponentStyle {
    display?: string;
    flexDirection?: string;
    justifyContent?: string;
    alignItems?: string;
    gap?: number | string;
    padding?: SpacingValue | number | string;
    margin?: SpacingValue | number | string;
    width?: number | string;
    height?: number | string;
    minWidth?: number | string;
    maxWidth?: number | string;
    minHeight?: number | string;
    maxHeight?: number | string;
    backgroundColor?: string;
    color?: string;
    borderColor?: string;
    borderWidth?: number | string;
    borderRadius?: number | string;
    borderStyle?: string;
    typography?: TypographyStyle;
    opacity?: number;
    boxShadow?: string;
    custom?: Record<string, string | number>;
}
export interface ResponsiveStyles {
    base: ComponentStyle;
    sm?: ComponentStyle;
    md?: ComponentStyle;
    lg?: ComponentStyle;
    xl?: ComponentStyle;
}
export interface EventHandler {
    event: string;
    action: 'navigate' | 'custom' | 'setState' | 'submit';
    config: Record<string, unknown>;
}
export interface ComponentNode {
    id: string;
    type: string;
    name: string;
    props: Record<string, unknown>;
    styles: ResponsiveStyles;
    events: EventHandler[];
    children: string[];
    parentId: string | null;
    isLocked: boolean;
    isVisible: boolean;
    bounds: Bounds;
}
export interface CanvasState {
    zoom: number;
    pan: Position;
    gridSize: number;
    snapToGrid: boolean;
    showGrid: boolean;
    showGuides: boolean;
}
export interface SelectionState {
    selectedIds: string[];
    hoveredId: string | null;
    focusedId: string | null;
}
export interface HistoryEntry {
    components: Record<string, ComponentNode>;
    timestamp: number;
    description: string;
}
export interface ClipboardData {
    components: ComponentNode[];
    type: 'cut' | 'copy';
}
export type Breakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl';
export interface EditorState {
    components: Record<string, ComponentNode>;
    rootIds: string[];
    canvas: CanvasState;
    selection: SelectionState;
    history: HistoryEntry[];
    historyIndex: number;
    maxHistorySize: number;
    clipboard: ClipboardData | null;
    activeBreakpoint: Breakpoint;
    isDragging: boolean;
    dragSource: {
        type: 'palette' | 'canvas';
        componentType?: string;
        componentId?: string;
    } | null;
}
export interface EditorActions {
    addComponent: (type: string, parentId: string | null, position?: Position) => string;
    updateComponent: (id: string, updates: Partial<ComponentNode>) => void;
    deleteComponent: (id: string) => void;
    duplicateComponent: (id: string) => string;
    moveComponent: (id: string, newParentId: string | null, index?: number) => void;
    updateProps: (id: string, props: Record<string, unknown>) => void;
    updateStyles: (id: string, styles: Partial<ComponentStyle>, breakpoint?: Breakpoint) => void;
    updateBounds: (id: string, bounds: Partial<Bounds>) => void;
    addEventHandler: (id: string, handler: EventHandler) => void;
    updateEventHandler: (id: string, index: number, handler: EventHandler) => void;
    removeEventHandler: (id: string, index: number) => void;
    select: (id: string, addToSelection?: boolean) => void;
    selectMultiple: (ids: string[]) => void;
    clearSelection: () => void;
    setHovered: (id: string | null) => void;
    setFocused: (id: string | null) => void;
    setZoom: (zoom: number) => void;
    setPan: (pan: Position) => void;
    setGridSize: (size: number) => void;
    toggleSnapToGrid: () => void;
    toggleShowGrid: () => void;
    toggleShowGuides: () => void;
    zoomIn: () => void;
    zoomOut: () => void;
    resetZoom: () => void;
    fitToScreen: () => void;
    toggleVisibility: (id: string) => void;
    toggleLock: (id: string) => void;
    undo: () => void;
    redo: () => void;
    pushHistory: (description: string) => void;
    clearHistory: () => void;
    cut: () => void;
    copy: () => void;
    paste: (parentId?: string | null) => void;
    setDragging: (isDragging: boolean) => void;
    setDragSource: (source: EditorState['dragSource']) => void;
    setActiveBreakpoint: (breakpoint: Breakpoint) => void;
    clear: () => void;
    loadState: (state: Partial<EditorState>) => void;
    getComponent: (id: string) => ComponentNode | undefined;
    getSelectedComponents: () => ComponentNode[];
    getChildren: (id: string) => ComponentNode[];
    getAncestors: (id: string) => ComponentNode[];
}
export declare const useEditorStore: import("zustand").UseBoundStore<Omit<Omit<import("zustand").StoreApi<EditorState & EditorActions>, "subscribe"> & {
    subscribe: {
        (listener: (selectedState: EditorState & EditorActions, previousSelectedState: EditorState & EditorActions) => void): () => void;
        <U>(selector: (state: EditorState & EditorActions) => U, listener: (selectedState: U, previousSelectedState: U) => void, options?: {
            equalityFn?: (a: U, b: U) => boolean;
            fireImmediately?: boolean;
        } | undefined): () => void;
    };
}, "setState"> & {
    setState(nextStateOrUpdater: (EditorState & EditorActions) | Partial<EditorState & EditorActions> | ((state: {
        components: {
            [x: string]: {
                id: string;
                type: string;
                name: string;
                props: {
                    [x: string]: unknown;
                };
                styles: {
                    base: {
                        display?: string;
                        flexDirection?: string;
                        justifyContent?: string;
                        alignItems?: string;
                        gap?: number | string;
                        padding?: string | number | {
                            top: number;
                            right: number;
                            bottom: number;
                            left: number;
                        };
                        margin?: string | number | {
                            top: number;
                            right: number;
                            bottom: number;
                            left: number;
                        };
                        width?: number | string;
                        height?: number | string;
                        minWidth?: number | string;
                        maxWidth?: number | string;
                        minHeight?: number | string;
                        maxHeight?: number | string;
                        backgroundColor?: string;
                        color?: string;
                        borderColor?: string;
                        borderWidth?: number | string;
                        borderRadius?: number | string;
                        borderStyle?: string;
                        typography?: {
                            fontFamily?: string;
                            fontSize?: number;
                            fontWeight?: number | string;
                            lineHeight?: number | string;
                            letterSpacing?: number | string;
                            textAlign?: "left" | "center" | "right" | "justify";
                            textDecoration?: string;
                            textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
                        };
                        opacity?: number;
                        boxShadow?: string;
                        custom?: {
                            [x: string]: string | number;
                        };
                    };
                    sm?: {
                        display?: string;
                        flexDirection?: string;
                        justifyContent?: string;
                        alignItems?: string;
                        gap?: number | string;
                        padding?: string | number | {
                            top: number;
                            right: number;
                            bottom: number;
                            left: number;
                        };
                        margin?: string | number | {
                            top: number;
                            right: number;
                            bottom: number;
                            left: number;
                        };
                        width?: number | string;
                        height?: number | string;
                        minWidth?: number | string;
                        maxWidth?: number | string;
                        minHeight?: number | string;
                        maxHeight?: number | string;
                        backgroundColor?: string;
                        color?: string;
                        borderColor?: string;
                        borderWidth?: number | string;
                        borderRadius?: number | string;
                        borderStyle?: string;
                        typography?: {
                            fontFamily?: string;
                            fontSize?: number;
                            fontWeight?: number | string;
                            lineHeight?: number | string;
                            letterSpacing?: number | string;
                            textAlign?: "left" | "center" | "right" | "justify";
                            textDecoration?: string;
                            textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
                        };
                        opacity?: number;
                        boxShadow?: string;
                        custom?: {
                            [x: string]: string | number;
                        };
                    };
                    md?: {
                        display?: string;
                        flexDirection?: string;
                        justifyContent?: string;
                        alignItems?: string;
                        gap?: number | string;
                        padding?: string | number | {
                            top: number;
                            right: number;
                            bottom: number;
                            left: number;
                        };
                        margin?: string | number | {
                            top: number;
                            right: number;
                            bottom: number;
                            left: number;
                        };
                        width?: number | string;
                        height?: number | string;
                        minWidth?: number | string;
                        maxWidth?: number | string;
                        minHeight?: number | string;
                        maxHeight?: number | string;
                        backgroundColor?: string;
                        color?: string;
                        borderColor?: string;
                        borderWidth?: number | string;
                        borderRadius?: number | string;
                        borderStyle?: string;
                        typography?: {
                            fontFamily?: string;
                            fontSize?: number;
                            fontWeight?: number | string;
                            lineHeight?: number | string;
                            letterSpacing?: number | string;
                            textAlign?: "left" | "center" | "right" | "justify";
                            textDecoration?: string;
                            textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
                        };
                        opacity?: number;
                        boxShadow?: string;
                        custom?: {
                            [x: string]: string | number;
                        };
                    };
                    lg?: {
                        display?: string;
                        flexDirection?: string;
                        justifyContent?: string;
                        alignItems?: string;
                        gap?: number | string;
                        padding?: string | number | {
                            top: number;
                            right: number;
                            bottom: number;
                            left: number;
                        };
                        margin?: string | number | {
                            top: number;
                            right: number;
                            bottom: number;
                            left: number;
                        };
                        width?: number | string;
                        height?: number | string;
                        minWidth?: number | string;
                        maxWidth?: number | string;
                        minHeight?: number | string;
                        maxHeight?: number | string;
                        backgroundColor?: string;
                        color?: string;
                        borderColor?: string;
                        borderWidth?: number | string;
                        borderRadius?: number | string;
                        borderStyle?: string;
                        typography?: {
                            fontFamily?: string;
                            fontSize?: number;
                            fontWeight?: number | string;
                            lineHeight?: number | string;
                            letterSpacing?: number | string;
                            textAlign?: "left" | "center" | "right" | "justify";
                            textDecoration?: string;
                            textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
                        };
                        opacity?: number;
                        boxShadow?: string;
                        custom?: {
                            [x: string]: string | number;
                        };
                    };
                    xl?: {
                        display?: string;
                        flexDirection?: string;
                        justifyContent?: string;
                        alignItems?: string;
                        gap?: number | string;
                        padding?: string | number | {
                            top: number;
                            right: number;
                            bottom: number;
                            left: number;
                        };
                        margin?: string | number | {
                            top: number;
                            right: number;
                            bottom: number;
                            left: number;
                        };
                        width?: number | string;
                        height?: number | string;
                        minWidth?: number | string;
                        maxWidth?: number | string;
                        minHeight?: number | string;
                        maxHeight?: number | string;
                        backgroundColor?: string;
                        color?: string;
                        borderColor?: string;
                        borderWidth?: number | string;
                        borderRadius?: number | string;
                        borderStyle?: string;
                        typography?: {
                            fontFamily?: string;
                            fontSize?: number;
                            fontWeight?: number | string;
                            lineHeight?: number | string;
                            letterSpacing?: number | string;
                            textAlign?: "left" | "center" | "right" | "justify";
                            textDecoration?: string;
                            textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
                        };
                        opacity?: number;
                        boxShadow?: string;
                        custom?: {
                            [x: string]: string | number;
                        };
                    };
                };
                events: {
                    event: string;
                    action: "navigate" | "custom" | "setState" | "submit";
                    config: {
                        [x: string]: unknown;
                    };
                }[];
                children: string[];
                parentId: string | null;
                isLocked: boolean;
                isVisible: boolean;
                bounds: {
                    x: number;
                    y: number;
                    width: number;
                    height: number;
                };
            };
        };
        rootIds: string[];
        canvas: {
            zoom: number;
            pan: {
                x: number;
                y: number;
            };
            gridSize: number;
            snapToGrid: boolean;
            showGrid: boolean;
            showGuides: boolean;
        };
        selection: {
            selectedIds: string[];
            hoveredId: string | null;
            focusedId: string | null;
        };
        history: {
            components: {
                [x: string]: {
                    id: string;
                    type: string;
                    name: string;
                    props: {
                        [x: string]: unknown;
                    };
                    styles: {
                        base: {
                            display?: string;
                            flexDirection?: string;
                            justifyContent?: string;
                            alignItems?: string;
                            gap?: number | string;
                            padding?: string | number | {
                                top: number;
                                right: number;
                                bottom: number;
                                left: number;
                            };
                            margin?: string | number | {
                                top: number;
                                right: number;
                                bottom: number;
                                left: number;
                            };
                            width?: number | string;
                            height?: number | string;
                            minWidth?: number | string;
                            maxWidth?: number | string;
                            minHeight?: number | string;
                            maxHeight?: number | string;
                            backgroundColor?: string;
                            color?: string;
                            borderColor?: string;
                            borderWidth?: number | string;
                            borderRadius?: number | string;
                            borderStyle?: string;
                            typography?: {
                                fontFamily?: string;
                                fontSize?: number;
                                fontWeight?: number | string;
                                lineHeight?: number | string;
                                letterSpacing?: number | string;
                                textAlign?: "left" | "center" | "right" | "justify";
                                textDecoration?: string;
                                textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
                            };
                            opacity?: number;
                            boxShadow?: string;
                            custom?: {
                                [x: string]: string | number;
                            };
                        };
                        sm?: {
                            display?: string;
                            flexDirection?: string;
                            justifyContent?: string;
                            alignItems?: string;
                            gap?: number | string;
                            padding?: string | number | {
                                top: number;
                                right: number;
                                bottom: number;
                                left: number;
                            };
                            margin?: string | number | {
                                top: number;
                                right: number;
                                bottom: number;
                                left: number;
                            };
                            width?: number | string;
                            height?: number | string;
                            minWidth?: number | string;
                            maxWidth?: number | string;
                            minHeight?: number | string;
                            maxHeight?: number | string;
                            backgroundColor?: string;
                            color?: string;
                            borderColor?: string;
                            borderWidth?: number | string;
                            borderRadius?: number | string;
                            borderStyle?: string;
                            typography?: {
                                fontFamily?: string;
                                fontSize?: number;
                                fontWeight?: number | string;
                                lineHeight?: number | string;
                                letterSpacing?: number | string;
                                textAlign?: "left" | "center" | "right" | "justify";
                                textDecoration?: string;
                                textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
                            };
                            opacity?: number;
                            boxShadow?: string;
                            custom?: {
                                [x: string]: string | number;
                            };
                        };
                        md?: {
                            display?: string;
                            flexDirection?: string;
                            justifyContent?: string;
                            alignItems?: string;
                            gap?: number | string;
                            padding?: string | number | {
                                top: number;
                                right: number;
                                bottom: number;
                                left: number;
                            };
                            margin?: string | number | {
                                top: number;
                                right: number;
                                bottom: number;
                                left: number;
                            };
                            width?: number | string;
                            height?: number | string;
                            minWidth?: number | string;
                            maxWidth?: number | string;
                            minHeight?: number | string;
                            maxHeight?: number | string;
                            backgroundColor?: string;
                            color?: string;
                            borderColor?: string;
                            borderWidth?: number | string;
                            borderRadius?: number | string;
                            borderStyle?: string;
                            typography?: {
                                fontFamily?: string;
                                fontSize?: number;
                                fontWeight?: number | string;
                                lineHeight?: number | string;
                                letterSpacing?: number | string;
                                textAlign?: "left" | "center" | "right" | "justify";
                                textDecoration?: string;
                                textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
                            };
                            opacity?: number;
                            boxShadow?: string;
                            custom?: {
                                [x: string]: string | number;
                            };
                        };
                        lg?: {
                            display?: string;
                            flexDirection?: string;
                            justifyContent?: string;
                            alignItems?: string;
                            gap?: number | string;
                            padding?: string | number | {
                                top: number;
                                right: number;
                                bottom: number;
                                left: number;
                            };
                            margin?: string | number | {
                                top: number;
                                right: number;
                                bottom: number;
                                left: number;
                            };
                            width?: number | string;
                            height?: number | string;
                            minWidth?: number | string;
                            maxWidth?: number | string;
                            minHeight?: number | string;
                            maxHeight?: number | string;
                            backgroundColor?: string;
                            color?: string;
                            borderColor?: string;
                            borderWidth?: number | string;
                            borderRadius?: number | string;
                            borderStyle?: string;
                            typography?: {
                                fontFamily?: string;
                                fontSize?: number;
                                fontWeight?: number | string;
                                lineHeight?: number | string;
                                letterSpacing?: number | string;
                                textAlign?: "left" | "center" | "right" | "justify";
                                textDecoration?: string;
                                textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
                            };
                            opacity?: number;
                            boxShadow?: string;
                            custom?: {
                                [x: string]: string | number;
                            };
                        };
                        xl?: {
                            display?: string;
                            flexDirection?: string;
                            justifyContent?: string;
                            alignItems?: string;
                            gap?: number | string;
                            padding?: string | number | {
                                top: number;
                                right: number;
                                bottom: number;
                                left: number;
                            };
                            margin?: string | number | {
                                top: number;
                                right: number;
                                bottom: number;
                                left: number;
                            };
                            width?: number | string;
                            height?: number | string;
                            minWidth?: number | string;
                            maxWidth?: number | string;
                            minHeight?: number | string;
                            maxHeight?: number | string;
                            backgroundColor?: string;
                            color?: string;
                            borderColor?: string;
                            borderWidth?: number | string;
                            borderRadius?: number | string;
                            borderStyle?: string;
                            typography?: {
                                fontFamily?: string;
                                fontSize?: number;
                                fontWeight?: number | string;
                                lineHeight?: number | string;
                                letterSpacing?: number | string;
                                textAlign?: "left" | "center" | "right" | "justify";
                                textDecoration?: string;
                                textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
                            };
                            opacity?: number;
                            boxShadow?: string;
                            custom?: {
                                [x: string]: string | number;
                            };
                        };
                    };
                    events: {
                        event: string;
                        action: "navigate" | "custom" | "setState" | "submit";
                        config: {
                            [x: string]: unknown;
                        };
                    }[];
                    children: string[];
                    parentId: string | null;
                    isLocked: boolean;
                    isVisible: boolean;
                    bounds: {
                        x: number;
                        y: number;
                        width: number;
                        height: number;
                    };
                };
            };
            timestamp: number;
            description: string;
        }[];
        historyIndex: number;
        maxHistorySize: number;
        clipboard: {
            components: {
                id: string;
                type: string;
                name: string;
                props: {
                    [x: string]: unknown;
                };
                styles: {
                    base: {
                        display?: string;
                        flexDirection?: string;
                        justifyContent?: string;
                        alignItems?: string;
                        gap?: number | string;
                        padding?: string | number | {
                            top: number;
                            right: number;
                            bottom: number;
                            left: number;
                        };
                        margin?: string | number | {
                            top: number;
                            right: number;
                            bottom: number;
                            left: number;
                        };
                        width?: number | string;
                        height?: number | string;
                        minWidth?: number | string;
                        maxWidth?: number | string;
                        minHeight?: number | string;
                        maxHeight?: number | string;
                        backgroundColor?: string;
                        color?: string;
                        borderColor?: string;
                        borderWidth?: number | string;
                        borderRadius?: number | string;
                        borderStyle?: string;
                        typography?: {
                            fontFamily?: string;
                            fontSize?: number;
                            fontWeight?: number | string;
                            lineHeight?: number | string;
                            letterSpacing?: number | string;
                            textAlign?: "left" | "center" | "right" | "justify";
                            textDecoration?: string;
                            textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
                        };
                        opacity?: number;
                        boxShadow?: string;
                        custom?: {
                            [x: string]: string | number;
                        };
                    };
                    sm?: {
                        display?: string;
                        flexDirection?: string;
                        justifyContent?: string;
                        alignItems?: string;
                        gap?: number | string;
                        padding?: string | number | {
                            top: number;
                            right: number;
                            bottom: number;
                            left: number;
                        };
                        margin?: string | number | {
                            top: number;
                            right: number;
                            bottom: number;
                            left: number;
                        };
                        width?: number | string;
                        height?: number | string;
                        minWidth?: number | string;
                        maxWidth?: number | string;
                        minHeight?: number | string;
                        maxHeight?: number | string;
                        backgroundColor?: string;
                        color?: string;
                        borderColor?: string;
                        borderWidth?: number | string;
                        borderRadius?: number | string;
                        borderStyle?: string;
                        typography?: {
                            fontFamily?: string;
                            fontSize?: number;
                            fontWeight?: number | string;
                            lineHeight?: number | string;
                            letterSpacing?: number | string;
                            textAlign?: "left" | "center" | "right" | "justify";
                            textDecoration?: string;
                            textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
                        };
                        opacity?: number;
                        boxShadow?: string;
                        custom?: {
                            [x: string]: string | number;
                        };
                    };
                    md?: {
                        display?: string;
                        flexDirection?: string;
                        justifyContent?: string;
                        alignItems?: string;
                        gap?: number | string;
                        padding?: string | number | {
                            top: number;
                            right: number;
                            bottom: number;
                            left: number;
                        };
                        margin?: string | number | {
                            top: number;
                            right: number;
                            bottom: number;
                            left: number;
                        };
                        width?: number | string;
                        height?: number | string;
                        minWidth?: number | string;
                        maxWidth?: number | string;
                        minHeight?: number | string;
                        maxHeight?: number | string;
                        backgroundColor?: string;
                        color?: string;
                        borderColor?: string;
                        borderWidth?: number | string;
                        borderRadius?: number | string;
                        borderStyle?: string;
                        typography?: {
                            fontFamily?: string;
                            fontSize?: number;
                            fontWeight?: number | string;
                            lineHeight?: number | string;
                            letterSpacing?: number | string;
                            textAlign?: "left" | "center" | "right" | "justify";
                            textDecoration?: string;
                            textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
                        };
                        opacity?: number;
                        boxShadow?: string;
                        custom?: {
                            [x: string]: string | number;
                        };
                    };
                    lg?: {
                        display?: string;
                        flexDirection?: string;
                        justifyContent?: string;
                        alignItems?: string;
                        gap?: number | string;
                        padding?: string | number | {
                            top: number;
                            right: number;
                            bottom: number;
                            left: number;
                        };
                        margin?: string | number | {
                            top: number;
                            right: number;
                            bottom: number;
                            left: number;
                        };
                        width?: number | string;
                        height?: number | string;
                        minWidth?: number | string;
                        maxWidth?: number | string;
                        minHeight?: number | string;
                        maxHeight?: number | string;
                        backgroundColor?: string;
                        color?: string;
                        borderColor?: string;
                        borderWidth?: number | string;
                        borderRadius?: number | string;
                        borderStyle?: string;
                        typography?: {
                            fontFamily?: string;
                            fontSize?: number;
                            fontWeight?: number | string;
                            lineHeight?: number | string;
                            letterSpacing?: number | string;
                            textAlign?: "left" | "center" | "right" | "justify";
                            textDecoration?: string;
                            textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
                        };
                        opacity?: number;
                        boxShadow?: string;
                        custom?: {
                            [x: string]: string | number;
                        };
                    };
                    xl?: {
                        display?: string;
                        flexDirection?: string;
                        justifyContent?: string;
                        alignItems?: string;
                        gap?: number | string;
                        padding?: string | number | {
                            top: number;
                            right: number;
                            bottom: number;
                            left: number;
                        };
                        margin?: string | number | {
                            top: number;
                            right: number;
                            bottom: number;
                            left: number;
                        };
                        width?: number | string;
                        height?: number | string;
                        minWidth?: number | string;
                        maxWidth?: number | string;
                        minHeight?: number | string;
                        maxHeight?: number | string;
                        backgroundColor?: string;
                        color?: string;
                        borderColor?: string;
                        borderWidth?: number | string;
                        borderRadius?: number | string;
                        borderStyle?: string;
                        typography?: {
                            fontFamily?: string;
                            fontSize?: number;
                            fontWeight?: number | string;
                            lineHeight?: number | string;
                            letterSpacing?: number | string;
                            textAlign?: "left" | "center" | "right" | "justify";
                            textDecoration?: string;
                            textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
                        };
                        opacity?: number;
                        boxShadow?: string;
                        custom?: {
                            [x: string]: string | number;
                        };
                    };
                };
                events: {
                    event: string;
                    action: "navigate" | "custom" | "setState" | "submit";
                    config: {
                        [x: string]: unknown;
                    };
                }[];
                children: string[];
                parentId: string | null;
                isLocked: boolean;
                isVisible: boolean;
                bounds: {
                    x: number;
                    y: number;
                    width: number;
                    height: number;
                };
            }[];
            type: "cut" | "copy";
        } | null;
        activeBreakpoint: Breakpoint;
        isDragging: boolean;
        dragSource: {
            type: "palette" | "canvas";
            componentType?: string;
            componentId?: string;
        } | null;
        addComponent: (type: string, parentId: string | null, position?: Position) => string;
        updateComponent: (id: string, updates: Partial<ComponentNode>) => void;
        deleteComponent: (id: string) => void;
        duplicateComponent: (id: string) => string;
        moveComponent: (id: string, newParentId: string | null, index?: number) => void;
        updateProps: (id: string, props: Record<string, unknown>) => void;
        updateStyles: (id: string, styles: Partial<ComponentStyle>, breakpoint?: Breakpoint) => void;
        updateBounds: (id: string, bounds: Partial<Bounds>) => void;
        addEventHandler: (id: string, handler: EventHandler) => void;
        updateEventHandler: (id: string, index: number, handler: EventHandler) => void;
        removeEventHandler: (id: string, index: number) => void;
        select: (id: string, addToSelection?: boolean) => void;
        selectMultiple: (ids: string[]) => void;
        clearSelection: () => void;
        setHovered: (id: string | null) => void;
        setFocused: (id: string | null) => void;
        setZoom: (zoom: number) => void;
        setPan: (pan: Position) => void;
        setGridSize: (size: number) => void;
        toggleSnapToGrid: () => void;
        toggleShowGrid: () => void;
        toggleShowGuides: () => void;
        zoomIn: () => void;
        zoomOut: () => void;
        resetZoom: () => void;
        fitToScreen: () => void;
        toggleVisibility: (id: string) => void;
        toggleLock: (id: string) => void;
        undo: () => void;
        redo: () => void;
        pushHistory: (description: string) => void;
        clearHistory: () => void;
        cut: () => void;
        copy: () => void;
        paste: (parentId?: string | null) => void;
        setDragging: (isDragging: boolean) => void;
        setDragSource: (source: EditorState["dragSource"]) => void;
        setActiveBreakpoint: (breakpoint: Breakpoint) => void;
        clear: () => void;
        loadState: (state: Partial<EditorState>) => void;
        getComponent: (id: string) => ComponentNode | undefined;
        getSelectedComponents: () => ComponentNode[];
        getChildren: (id: string) => ComponentNode[];
        getAncestors: (id: string) => ComponentNode[];
    }) => void), shouldReplace?: false): void;
    setState(nextStateOrUpdater: (EditorState & EditorActions) | ((state: {
        components: {
            [x: string]: {
                id: string;
                type: string;
                name: string;
                props: {
                    [x: string]: unknown;
                };
                styles: {
                    base: {
                        display?: string;
                        flexDirection?: string;
                        justifyContent?: string;
                        alignItems?: string;
                        gap?: number | string;
                        padding?: string | number | {
                            top: number;
                            right: number;
                            bottom: number;
                            left: number;
                        };
                        margin?: string | number | {
                            top: number;
                            right: number;
                            bottom: number;
                            left: number;
                        };
                        width?: number | string;
                        height?: number | string;
                        minWidth?: number | string;
                        maxWidth?: number | string;
                        minHeight?: number | string;
                        maxHeight?: number | string;
                        backgroundColor?: string;
                        color?: string;
                        borderColor?: string;
                        borderWidth?: number | string;
                        borderRadius?: number | string;
                        borderStyle?: string;
                        typography?: {
                            fontFamily?: string;
                            fontSize?: number;
                            fontWeight?: number | string;
                            lineHeight?: number | string;
                            letterSpacing?: number | string;
                            textAlign?: "left" | "center" | "right" | "justify";
                            textDecoration?: string;
                            textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
                        };
                        opacity?: number;
                        boxShadow?: string;
                        custom?: {
                            [x: string]: string | number;
                        };
                    };
                    sm?: {
                        display?: string;
                        flexDirection?: string;
                        justifyContent?: string;
                        alignItems?: string;
                        gap?: number | string;
                        padding?: string | number | {
                            top: number;
                            right: number;
                            bottom: number;
                            left: number;
                        };
                        margin?: string | number | {
                            top: number;
                            right: number;
                            bottom: number;
                            left: number;
                        };
                        width?: number | string;
                        height?: number | string;
                        minWidth?: number | string;
                        maxWidth?: number | string;
                        minHeight?: number | string;
                        maxHeight?: number | string;
                        backgroundColor?: string;
                        color?: string;
                        borderColor?: string;
                        borderWidth?: number | string;
                        borderRadius?: number | string;
                        borderStyle?: string;
                        typography?: {
                            fontFamily?: string;
                            fontSize?: number;
                            fontWeight?: number | string;
                            lineHeight?: number | string;
                            letterSpacing?: number | string;
                            textAlign?: "left" | "center" | "right" | "justify";
                            textDecoration?: string;
                            textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
                        };
                        opacity?: number;
                        boxShadow?: string;
                        custom?: {
                            [x: string]: string | number;
                        };
                    };
                    md?: {
                        display?: string;
                        flexDirection?: string;
                        justifyContent?: string;
                        alignItems?: string;
                        gap?: number | string;
                        padding?: string | number | {
                            top: number;
                            right: number;
                            bottom: number;
                            left: number;
                        };
                        margin?: string | number | {
                            top: number;
                            right: number;
                            bottom: number;
                            left: number;
                        };
                        width?: number | string;
                        height?: number | string;
                        minWidth?: number | string;
                        maxWidth?: number | string;
                        minHeight?: number | string;
                        maxHeight?: number | string;
                        backgroundColor?: string;
                        color?: string;
                        borderColor?: string;
                        borderWidth?: number | string;
                        borderRadius?: number | string;
                        borderStyle?: string;
                        typography?: {
                            fontFamily?: string;
                            fontSize?: number;
                            fontWeight?: number | string;
                            lineHeight?: number | string;
                            letterSpacing?: number | string;
                            textAlign?: "left" | "center" | "right" | "justify";
                            textDecoration?: string;
                            textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
                        };
                        opacity?: number;
                        boxShadow?: string;
                        custom?: {
                            [x: string]: string | number;
                        };
                    };
                    lg?: {
                        display?: string;
                        flexDirection?: string;
                        justifyContent?: string;
                        alignItems?: string;
                        gap?: number | string;
                        padding?: string | number | {
                            top: number;
                            right: number;
                            bottom: number;
                            left: number;
                        };
                        margin?: string | number | {
                            top: number;
                            right: number;
                            bottom: number;
                            left: number;
                        };
                        width?: number | string;
                        height?: number | string;
                        minWidth?: number | string;
                        maxWidth?: number | string;
                        minHeight?: number | string;
                        maxHeight?: number | string;
                        backgroundColor?: string;
                        color?: string;
                        borderColor?: string;
                        borderWidth?: number | string;
                        borderRadius?: number | string;
                        borderStyle?: string;
                        typography?: {
                            fontFamily?: string;
                            fontSize?: number;
                            fontWeight?: number | string;
                            lineHeight?: number | string;
                            letterSpacing?: number | string;
                            textAlign?: "left" | "center" | "right" | "justify";
                            textDecoration?: string;
                            textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
                        };
                        opacity?: number;
                        boxShadow?: string;
                        custom?: {
                            [x: string]: string | number;
                        };
                    };
                    xl?: {
                        display?: string;
                        flexDirection?: string;
                        justifyContent?: string;
                        alignItems?: string;
                        gap?: number | string;
                        padding?: string | number | {
                            top: number;
                            right: number;
                            bottom: number;
                            left: number;
                        };
                        margin?: string | number | {
                            top: number;
                            right: number;
                            bottom: number;
                            left: number;
                        };
                        width?: number | string;
                        height?: number | string;
                        minWidth?: number | string;
                        maxWidth?: number | string;
                        minHeight?: number | string;
                        maxHeight?: number | string;
                        backgroundColor?: string;
                        color?: string;
                        borderColor?: string;
                        borderWidth?: number | string;
                        borderRadius?: number | string;
                        borderStyle?: string;
                        typography?: {
                            fontFamily?: string;
                            fontSize?: number;
                            fontWeight?: number | string;
                            lineHeight?: number | string;
                            letterSpacing?: number | string;
                            textAlign?: "left" | "center" | "right" | "justify";
                            textDecoration?: string;
                            textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
                        };
                        opacity?: number;
                        boxShadow?: string;
                        custom?: {
                            [x: string]: string | number;
                        };
                    };
                };
                events: {
                    event: string;
                    action: "navigate" | "custom" | "setState" | "submit";
                    config: {
                        [x: string]: unknown;
                    };
                }[];
                children: string[];
                parentId: string | null;
                isLocked: boolean;
                isVisible: boolean;
                bounds: {
                    x: number;
                    y: number;
                    width: number;
                    height: number;
                };
            };
        };
        rootIds: string[];
        canvas: {
            zoom: number;
            pan: {
                x: number;
                y: number;
            };
            gridSize: number;
            snapToGrid: boolean;
            showGrid: boolean;
            showGuides: boolean;
        };
        selection: {
            selectedIds: string[];
            hoveredId: string | null;
            focusedId: string | null;
        };
        history: {
            components: {
                [x: string]: {
                    id: string;
                    type: string;
                    name: string;
                    props: {
                        [x: string]: unknown;
                    };
                    styles: {
                        base: {
                            display?: string;
                            flexDirection?: string;
                            justifyContent?: string;
                            alignItems?: string;
                            gap?: number | string;
                            padding?: string | number | {
                                top: number;
                                right: number;
                                bottom: number;
                                left: number;
                            };
                            margin?: string | number | {
                                top: number;
                                right: number;
                                bottom: number;
                                left: number;
                            };
                            width?: number | string;
                            height?: number | string;
                            minWidth?: number | string;
                            maxWidth?: number | string;
                            minHeight?: number | string;
                            maxHeight?: number | string;
                            backgroundColor?: string;
                            color?: string;
                            borderColor?: string;
                            borderWidth?: number | string;
                            borderRadius?: number | string;
                            borderStyle?: string;
                            typography?: {
                                fontFamily?: string;
                                fontSize?: number;
                                fontWeight?: number | string;
                                lineHeight?: number | string;
                                letterSpacing?: number | string;
                                textAlign?: "left" | "center" | "right" | "justify";
                                textDecoration?: string;
                                textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
                            };
                            opacity?: number;
                            boxShadow?: string;
                            custom?: {
                                [x: string]: string | number;
                            };
                        };
                        sm?: {
                            display?: string;
                            flexDirection?: string;
                            justifyContent?: string;
                            alignItems?: string;
                            gap?: number | string;
                            padding?: string | number | {
                                top: number;
                                right: number;
                                bottom: number;
                                left: number;
                            };
                            margin?: string | number | {
                                top: number;
                                right: number;
                                bottom: number;
                                left: number;
                            };
                            width?: number | string;
                            height?: number | string;
                            minWidth?: number | string;
                            maxWidth?: number | string;
                            minHeight?: number | string;
                            maxHeight?: number | string;
                            backgroundColor?: string;
                            color?: string;
                            borderColor?: string;
                            borderWidth?: number | string;
                            borderRadius?: number | string;
                            borderStyle?: string;
                            typography?: {
                                fontFamily?: string;
                                fontSize?: number;
                                fontWeight?: number | string;
                                lineHeight?: number | string;
                                letterSpacing?: number | string;
                                textAlign?: "left" | "center" | "right" | "justify";
                                textDecoration?: string;
                                textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
                            };
                            opacity?: number;
                            boxShadow?: string;
                            custom?: {
                                [x: string]: string | number;
                            };
                        };
                        md?: {
                            display?: string;
                            flexDirection?: string;
                            justifyContent?: string;
                            alignItems?: string;
                            gap?: number | string;
                            padding?: string | number | {
                                top: number;
                                right: number;
                                bottom: number;
                                left: number;
                            };
                            margin?: string | number | {
                                top: number;
                                right: number;
                                bottom: number;
                                left: number;
                            };
                            width?: number | string;
                            height?: number | string;
                            minWidth?: number | string;
                            maxWidth?: number | string;
                            minHeight?: number | string;
                            maxHeight?: number | string;
                            backgroundColor?: string;
                            color?: string;
                            borderColor?: string;
                            borderWidth?: number | string;
                            borderRadius?: number | string;
                            borderStyle?: string;
                            typography?: {
                                fontFamily?: string;
                                fontSize?: number;
                                fontWeight?: number | string;
                                lineHeight?: number | string;
                                letterSpacing?: number | string;
                                textAlign?: "left" | "center" | "right" | "justify";
                                textDecoration?: string;
                                textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
                            };
                            opacity?: number;
                            boxShadow?: string;
                            custom?: {
                                [x: string]: string | number;
                            };
                        };
                        lg?: {
                            display?: string;
                            flexDirection?: string;
                            justifyContent?: string;
                            alignItems?: string;
                            gap?: number | string;
                            padding?: string | number | {
                                top: number;
                                right: number;
                                bottom: number;
                                left: number;
                            };
                            margin?: string | number | {
                                top: number;
                                right: number;
                                bottom: number;
                                left: number;
                            };
                            width?: number | string;
                            height?: number | string;
                            minWidth?: number | string;
                            maxWidth?: number | string;
                            minHeight?: number | string;
                            maxHeight?: number | string;
                            backgroundColor?: string;
                            color?: string;
                            borderColor?: string;
                            borderWidth?: number | string;
                            borderRadius?: number | string;
                            borderStyle?: string;
                            typography?: {
                                fontFamily?: string;
                                fontSize?: number;
                                fontWeight?: number | string;
                                lineHeight?: number | string;
                                letterSpacing?: number | string;
                                textAlign?: "left" | "center" | "right" | "justify";
                                textDecoration?: string;
                                textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
                            };
                            opacity?: number;
                            boxShadow?: string;
                            custom?: {
                                [x: string]: string | number;
                            };
                        };
                        xl?: {
                            display?: string;
                            flexDirection?: string;
                            justifyContent?: string;
                            alignItems?: string;
                            gap?: number | string;
                            padding?: string | number | {
                                top: number;
                                right: number;
                                bottom: number;
                                left: number;
                            };
                            margin?: string | number | {
                                top: number;
                                right: number;
                                bottom: number;
                                left: number;
                            };
                            width?: number | string;
                            height?: number | string;
                            minWidth?: number | string;
                            maxWidth?: number | string;
                            minHeight?: number | string;
                            maxHeight?: number | string;
                            backgroundColor?: string;
                            color?: string;
                            borderColor?: string;
                            borderWidth?: number | string;
                            borderRadius?: number | string;
                            borderStyle?: string;
                            typography?: {
                                fontFamily?: string;
                                fontSize?: number;
                                fontWeight?: number | string;
                                lineHeight?: number | string;
                                letterSpacing?: number | string;
                                textAlign?: "left" | "center" | "right" | "justify";
                                textDecoration?: string;
                                textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
                            };
                            opacity?: number;
                            boxShadow?: string;
                            custom?: {
                                [x: string]: string | number;
                            };
                        };
                    };
                    events: {
                        event: string;
                        action: "navigate" | "custom" | "setState" | "submit";
                        config: {
                            [x: string]: unknown;
                        };
                    }[];
                    children: string[];
                    parentId: string | null;
                    isLocked: boolean;
                    isVisible: boolean;
                    bounds: {
                        x: number;
                        y: number;
                        width: number;
                        height: number;
                    };
                };
            };
            timestamp: number;
            description: string;
        }[];
        historyIndex: number;
        maxHistorySize: number;
        clipboard: {
            components: {
                id: string;
                type: string;
                name: string;
                props: {
                    [x: string]: unknown;
                };
                styles: {
                    base: {
                        display?: string;
                        flexDirection?: string;
                        justifyContent?: string;
                        alignItems?: string;
                        gap?: number | string;
                        padding?: string | number | {
                            top: number;
                            right: number;
                            bottom: number;
                            left: number;
                        };
                        margin?: string | number | {
                            top: number;
                            right: number;
                            bottom: number;
                            left: number;
                        };
                        width?: number | string;
                        height?: number | string;
                        minWidth?: number | string;
                        maxWidth?: number | string;
                        minHeight?: number | string;
                        maxHeight?: number | string;
                        backgroundColor?: string;
                        color?: string;
                        borderColor?: string;
                        borderWidth?: number | string;
                        borderRadius?: number | string;
                        borderStyle?: string;
                        typography?: {
                            fontFamily?: string;
                            fontSize?: number;
                            fontWeight?: number | string;
                            lineHeight?: number | string;
                            letterSpacing?: number | string;
                            textAlign?: "left" | "center" | "right" | "justify";
                            textDecoration?: string;
                            textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
                        };
                        opacity?: number;
                        boxShadow?: string;
                        custom?: {
                            [x: string]: string | number;
                        };
                    };
                    sm?: {
                        display?: string;
                        flexDirection?: string;
                        justifyContent?: string;
                        alignItems?: string;
                        gap?: number | string;
                        padding?: string | number | {
                            top: number;
                            right: number;
                            bottom: number;
                            left: number;
                        };
                        margin?: string | number | {
                            top: number;
                            right: number;
                            bottom: number;
                            left: number;
                        };
                        width?: number | string;
                        height?: number | string;
                        minWidth?: number | string;
                        maxWidth?: number | string;
                        minHeight?: number | string;
                        maxHeight?: number | string;
                        backgroundColor?: string;
                        color?: string;
                        borderColor?: string;
                        borderWidth?: number | string;
                        borderRadius?: number | string;
                        borderStyle?: string;
                        typography?: {
                            fontFamily?: string;
                            fontSize?: number;
                            fontWeight?: number | string;
                            lineHeight?: number | string;
                            letterSpacing?: number | string;
                            textAlign?: "left" | "center" | "right" | "justify";
                            textDecoration?: string;
                            textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
                        };
                        opacity?: number;
                        boxShadow?: string;
                        custom?: {
                            [x: string]: string | number;
                        };
                    };
                    md?: {
                        display?: string;
                        flexDirection?: string;
                        justifyContent?: string;
                        alignItems?: string;
                        gap?: number | string;
                        padding?: string | number | {
                            top: number;
                            right: number;
                            bottom: number;
                            left: number;
                        };
                        margin?: string | number | {
                            top: number;
                            right: number;
                            bottom: number;
                            left: number;
                        };
                        width?: number | string;
                        height?: number | string;
                        minWidth?: number | string;
                        maxWidth?: number | string;
                        minHeight?: number | string;
                        maxHeight?: number | string;
                        backgroundColor?: string;
                        color?: string;
                        borderColor?: string;
                        borderWidth?: number | string;
                        borderRadius?: number | string;
                        borderStyle?: string;
                        typography?: {
                            fontFamily?: string;
                            fontSize?: number;
                            fontWeight?: number | string;
                            lineHeight?: number | string;
                            letterSpacing?: number | string;
                            textAlign?: "left" | "center" | "right" | "justify";
                            textDecoration?: string;
                            textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
                        };
                        opacity?: number;
                        boxShadow?: string;
                        custom?: {
                            [x: string]: string | number;
                        };
                    };
                    lg?: {
                        display?: string;
                        flexDirection?: string;
                        justifyContent?: string;
                        alignItems?: string;
                        gap?: number | string;
                        padding?: string | number | {
                            top: number;
                            right: number;
                            bottom: number;
                            left: number;
                        };
                        margin?: string | number | {
                            top: number;
                            right: number;
                            bottom: number;
                            left: number;
                        };
                        width?: number | string;
                        height?: number | string;
                        minWidth?: number | string;
                        maxWidth?: number | string;
                        minHeight?: number | string;
                        maxHeight?: number | string;
                        backgroundColor?: string;
                        color?: string;
                        borderColor?: string;
                        borderWidth?: number | string;
                        borderRadius?: number | string;
                        borderStyle?: string;
                        typography?: {
                            fontFamily?: string;
                            fontSize?: number;
                            fontWeight?: number | string;
                            lineHeight?: number | string;
                            letterSpacing?: number | string;
                            textAlign?: "left" | "center" | "right" | "justify";
                            textDecoration?: string;
                            textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
                        };
                        opacity?: number;
                        boxShadow?: string;
                        custom?: {
                            [x: string]: string | number;
                        };
                    };
                    xl?: {
                        display?: string;
                        flexDirection?: string;
                        justifyContent?: string;
                        alignItems?: string;
                        gap?: number | string;
                        padding?: string | number | {
                            top: number;
                            right: number;
                            bottom: number;
                            left: number;
                        };
                        margin?: string | number | {
                            top: number;
                            right: number;
                            bottom: number;
                            left: number;
                        };
                        width?: number | string;
                        height?: number | string;
                        minWidth?: number | string;
                        maxWidth?: number | string;
                        minHeight?: number | string;
                        maxHeight?: number | string;
                        backgroundColor?: string;
                        color?: string;
                        borderColor?: string;
                        borderWidth?: number | string;
                        borderRadius?: number | string;
                        borderStyle?: string;
                        typography?: {
                            fontFamily?: string;
                            fontSize?: number;
                            fontWeight?: number | string;
                            lineHeight?: number | string;
                            letterSpacing?: number | string;
                            textAlign?: "left" | "center" | "right" | "justify";
                            textDecoration?: string;
                            textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
                        };
                        opacity?: number;
                        boxShadow?: string;
                        custom?: {
                            [x: string]: string | number;
                        };
                    };
                };
                events: {
                    event: string;
                    action: "navigate" | "custom" | "setState" | "submit";
                    config: {
                        [x: string]: unknown;
                    };
                }[];
                children: string[];
                parentId: string | null;
                isLocked: boolean;
                isVisible: boolean;
                bounds: {
                    x: number;
                    y: number;
                    width: number;
                    height: number;
                };
            }[];
            type: "cut" | "copy";
        } | null;
        activeBreakpoint: Breakpoint;
        isDragging: boolean;
        dragSource: {
            type: "palette" | "canvas";
            componentType?: string;
            componentId?: string;
        } | null;
        addComponent: (type: string, parentId: string | null, position?: Position) => string;
        updateComponent: (id: string, updates: Partial<ComponentNode>) => void;
        deleteComponent: (id: string) => void;
        duplicateComponent: (id: string) => string;
        moveComponent: (id: string, newParentId: string | null, index?: number) => void;
        updateProps: (id: string, props: Record<string, unknown>) => void;
        updateStyles: (id: string, styles: Partial<ComponentStyle>, breakpoint?: Breakpoint) => void;
        updateBounds: (id: string, bounds: Partial<Bounds>) => void;
        addEventHandler: (id: string, handler: EventHandler) => void;
        updateEventHandler: (id: string, index: number, handler: EventHandler) => void;
        removeEventHandler: (id: string, index: number) => void;
        select: (id: string, addToSelection?: boolean) => void;
        selectMultiple: (ids: string[]) => void;
        clearSelection: () => void;
        setHovered: (id: string | null) => void;
        setFocused: (id: string | null) => void;
        setZoom: (zoom: number) => void;
        setPan: (pan: Position) => void;
        setGridSize: (size: number) => void;
        toggleSnapToGrid: () => void;
        toggleShowGrid: () => void;
        toggleShowGuides: () => void;
        zoomIn: () => void;
        zoomOut: () => void;
        resetZoom: () => void;
        fitToScreen: () => void;
        toggleVisibility: (id: string) => void;
        toggleLock: (id: string) => void;
        undo: () => void;
        redo: () => void;
        pushHistory: (description: string) => void;
        clearHistory: () => void;
        cut: () => void;
        copy: () => void;
        paste: (parentId?: string | null) => void;
        setDragging: (isDragging: boolean) => void;
        setDragSource: (source: EditorState["dragSource"]) => void;
        setActiveBreakpoint: (breakpoint: Breakpoint) => void;
        clear: () => void;
        loadState: (state: Partial<EditorState>) => void;
        getComponent: (id: string) => ComponentNode | undefined;
        getSelectedComponents: () => ComponentNode[];
        getChildren: (id: string) => ComponentNode[];
        getAncestors: (id: string) => ComponentNode[];
    }) => void), shouldReplace: true): void;
}>;
export declare const selectComponents: (state: EditorState) => Record<string, ComponentNode>;
export declare const selectRootIds: (state: EditorState) => string[];
export declare const selectCanvas: (state: EditorState) => CanvasState;
export declare const selectSelection: (state: EditorState) => SelectionState;
export declare const selectSelectedIds: (state: EditorState) => string[];
export declare const selectZoom: (state: EditorState) => number;
export declare const selectPan: (state: EditorState) => Position;
export declare const selectActiveBreakpoint: (state: EditorState) => Breakpoint;
export declare const selectIsDragging: (state: EditorState) => boolean;
export declare const selectClipboard: (state: EditorState) => ClipboardData | null;
export declare const selectCanUndo: (state: EditorState) => boolean;
export declare const selectCanRedo: (state: EditorState) => boolean;
export declare const useComponent: (id: string) => ComponentNode | undefined;
export declare const useSelectedComponents: () => ComponentNode[];
export declare const useIsSelected: (id: string) => boolean;
export declare const useIsHovered: (id: string) => boolean;
export declare const useCanvas: () => CanvasState;
export declare const useEditorActions: () => {
    addComponent: (type: string, parentId: string | null, position?: Position) => string;
    updateComponent: (id: string, updates: Partial<ComponentNode>) => void;
    deleteComponent: (id: string) => void;
    duplicateComponent: (id: string) => string;
    moveComponent: (id: string, newParentId: string | null, index?: number) => void;
    updateProps: (id: string, props: Record<string, unknown>) => void;
    updateStyles: (id: string, styles: Partial<ComponentStyle>, breakpoint?: Breakpoint) => void;
    updateBounds: (id: string, bounds: Partial<Bounds>) => void;
    select: (id: string, addToSelection?: boolean) => void;
    selectMultiple: (ids: string[]) => void;
    clearSelection: () => void;
    setHovered: (id: string | null) => void;
    setZoom: (zoom: number) => void;
    setPan: (pan: Position) => void;
    toggleSnapToGrid: () => void;
    toggleShowGrid: () => void;
    undo: () => void;
    redo: () => void;
    cut: () => void;
    copy: () => void;
    paste: (parentId?: string | null) => void;
};
//# sourceMappingURL=EditorStore.d.ts.map