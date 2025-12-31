/**
 * Core types for the PhilJS Visual Builder
 */
/**
 * Unique identifier for a component node in the builder
 */
export type NodeId = string;
/**
 * Component type identifier (e.g., 'div', 'Button', 'Card')
 */
export type ComponentType = string;
/**
 * Property value types supported by the builder
 */
export type PropValue = string | number | boolean | null | undefined | PropValue[] | {
    [key: string]: PropValue;
} | BindingExpression;
/**
 * Expression for data binding (e.g., signals, props, state)
 */
export interface BindingExpression {
    type: 'binding';
    expression: string;
    mode: 'one-way' | 'two-way';
}
/**
 * Style property value
 */
export interface StyleValue {
    value: string | number;
    unit?: 'px' | 'em' | 'rem' | '%' | 'vh' | 'vw' | 'auto' | 'none';
}
/**
 * Complete style definition for a node
 */
export interface NodeStyles {
    display?: string;
    position?: string;
    top?: StyleValue;
    right?: StyleValue;
    bottom?: StyleValue;
    left?: StyleValue;
    width?: StyleValue;
    height?: StyleValue;
    minWidth?: StyleValue;
    maxWidth?: StyleValue;
    minHeight?: StyleValue;
    maxHeight?: StyleValue;
    flexDirection?: string;
    flexWrap?: string;
    justifyContent?: string;
    alignItems?: string;
    alignContent?: string;
    gap?: StyleValue;
    flex?: string;
    flexGrow?: number;
    flexShrink?: number;
    flexBasis?: StyleValue;
    alignSelf?: string;
    order?: number;
    gridTemplateColumns?: string;
    gridTemplateRows?: string;
    gridColumn?: string;
    gridRow?: string;
    gridGap?: StyleValue;
    margin?: StyleValue;
    marginTop?: StyleValue;
    marginRight?: StyleValue;
    marginBottom?: StyleValue;
    marginLeft?: StyleValue;
    padding?: StyleValue;
    paddingTop?: StyleValue;
    paddingRight?: StyleValue;
    paddingBottom?: StyleValue;
    paddingLeft?: StyleValue;
    fontFamily?: string;
    fontSize?: StyleValue;
    fontWeight?: string | number;
    fontStyle?: string;
    lineHeight?: StyleValue;
    letterSpacing?: StyleValue;
    textAlign?: string;
    textDecoration?: string;
    textTransform?: string;
    color?: string;
    background?: string;
    backgroundColor?: string;
    backgroundImage?: string;
    backgroundSize?: string;
    backgroundPosition?: string;
    backgroundRepeat?: string;
    border?: string;
    borderWidth?: StyleValue;
    borderStyle?: string;
    borderColor?: string;
    borderRadius?: StyleValue;
    borderTop?: string;
    borderRight?: string;
    borderBottom?: string;
    borderLeft?: string;
    opacity?: number;
    boxShadow?: string;
    transform?: string;
    transition?: string;
    cursor?: string;
    overflow?: string;
    overflowX?: string;
    overflowY?: string;
    zIndex?: number;
    visibility?: string;
    [key: string]: StyleValue | string | number | undefined;
}
/**
 * Event handler definition
 */
export interface EventHandler {
    event: string;
    handler: string;
    modifiers?: string[];
}
/**
 * A single component node in the builder tree
 */
export interface ComponentNode {
    id: NodeId;
    type: ComponentType;
    name?: string;
    props: Record<string, PropValue>;
    styles: NodeStyles;
    children: NodeId[];
    parentId: NodeId | null;
    events: EventHandler[];
    isLocked?: boolean;
    isHidden?: boolean;
    constraints?: LayoutConstraints;
    metadata?: NodeMetadata;
}
/**
 * Layout constraints for responsive design
 */
export interface LayoutConstraints {
    horizontal?: 'left' | 'right' | 'center' | 'stretch' | 'scale';
    vertical?: 'top' | 'bottom' | 'center' | 'stretch' | 'scale';
    aspectRatio?: number;
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
}
/**
 * Metadata for a node
 */
export interface NodeMetadata {
    createdAt?: number;
    updatedAt?: number;
    createdBy?: string;
    notes?: string;
    tags?: string[];
}
/**
 * Property definition for component registration
 */
export interface PropDefinition {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'function' | 'node' | 'enum' | 'color' | 'image';
    defaultValue?: PropValue;
    required?: boolean;
    description?: string;
    enumValues?: string[];
    min?: number;
    max?: number;
    step?: number;
    group?: string;
}
/**
 * Component definition for the palette
 */
export interface ComponentDefinition {
    type: ComponentType;
    name: string;
    description?: string;
    category: string;
    icon?: string;
    props: PropDefinition[];
    defaultStyles?: NodeStyles;
    defaultChildren?: ComponentNode[];
    canHaveChildren?: boolean;
    allowedChildren?: ComponentType[];
    allowedParents?: ComponentType[];
    isContainer?: boolean;
    render?: (props: Record<string, PropValue>, children: any[]) => any;
}
/**
 * Component category for organizing the palette
 */
export interface ComponentCategory {
    id: string;
    name: string;
    icon?: string;
    description?: string;
    order?: number;
}
/**
 * Bounding box for a selected element
 */
export interface BoundingBox {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation?: number;
}
/**
 * Selection state
 */
export interface SelectionState {
    selectedIds: NodeId[];
    hoveredId: NodeId | null;
    focusedId: NodeId | null;
    boundingBox: BoundingBox | null;
    multiSelect: boolean;
}
/**
 * Drag operation types
 */
export type DragOperation = 'move' | 'copy' | 'add';
/**
 * Drag source information
 */
export interface DragSource {
    type: 'node' | 'palette' | 'external';
    nodeId?: NodeId;
    componentType?: ComponentType;
    data?: any;
}
/**
 * Drop target information
 */
export interface DropTarget {
    nodeId: NodeId;
    position: 'before' | 'after' | 'inside' | 'replace';
    insertIndex?: number;
}
/**
 * Drag state
 */
export interface DragState {
    isDragging: boolean;
    source: DragSource | null;
    target: DropTarget | null;
    position: {
        x: number;
        y: number;
    };
    offset: {
        x: number;
        y: number;
    };
    preview: ComponentNode | null;
}
/**
 * Resize handle position
 */
export type ResizeHandle = 'top' | 'right' | 'bottom' | 'left' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
/**
 * Resize state
 */
export interface ResizeState {
    isResizing: boolean;
    handle: ResizeHandle | null;
    initialBounds: BoundingBox | null;
    currentBounds: BoundingBox | null;
    aspectRatio?: number;
    maintainAspectRatio: boolean;
}
/**
 * Viewport/canvas state
 */
export interface ViewportState {
    zoom: number;
    panX: number;
    panY: number;
    canvasWidth: number;
    canvasHeight: number;
}
/**
 * Canvas grid settings
 */
export interface GridSettings {
    enabled: boolean;
    size: number;
    snapToGrid: boolean;
    showGuides: boolean;
    color: string;
}
/**
 * Canvas settings
 */
export interface CanvasSettings {
    width: number;
    height: number;
    backgroundColor: string;
    grid: GridSettings;
    rulers: boolean;
    zoom: {
        min: number;
        max: number;
        step: number;
    };
}
/**
 * Action types for history
 */
export type HistoryActionType = 'add_node' | 'delete_node' | 'move_node' | 'update_props' | 'update_styles' | 'update_children' | 'batch' | 'paste' | 'duplicate';
/**
 * History entry
 */
export interface HistoryEntry {
    id: string;
    type: HistoryActionType;
    timestamp: number;
    description: string;
    before: Partial<BuilderState>;
    after: Partial<BuilderState>;
}
/**
 * History state
 */
export interface HistoryState {
    entries: HistoryEntry[];
    currentIndex: number;
    maxEntries: number;
}
/**
 * Document/project metadata
 */
export interface DocumentMetadata {
    id: string;
    name: string;
    description?: string;
    version: string;
    createdAt: number;
    updatedAt: number;
    author?: string;
    tags?: string[];
}
/**
 * Complete builder state
 */
export interface BuilderState {
    document: DocumentMetadata;
    nodes: Record<NodeId, ComponentNode>;
    rootId: NodeId;
    selection: SelectionState;
    drag: DragState;
    resize: ResizeState;
    viewport: ViewportState;
    canvas: CanvasSettings;
    components: Record<ComponentType, ComponentDefinition>;
    categories: ComponentCategory[];
    ui: {
        leftPanelWidth: number;
        rightPanelWidth: number;
        leftPanelCollapsed: boolean;
        rightPanelCollapsed: boolean;
        activeTab: 'layers' | 'components' | 'assets';
        inspectorTab: 'props' | 'styles' | 'events' | 'advanced';
    };
    preview: {
        isOpen: boolean;
        device: 'desktop' | 'tablet' | 'mobile' | 'custom';
        customWidth?: number;
        customHeight?: number;
        darkMode: boolean;
    };
}
/**
 * Builder actions
 */
export type BuilderAction = {
    type: 'ADD_NODE';
    payload: {
        node: ComponentNode;
        parentId: NodeId;
        index?: number;
    };
} | {
    type: 'DELETE_NODE';
    payload: {
        nodeId: NodeId;
    };
} | {
    type: 'DELETE_NODES';
    payload: {
        nodeIds: NodeId[];
    };
} | {
    type: 'MOVE_NODE';
    payload: {
        nodeId: NodeId;
        newParentId: NodeId;
        index?: number;
    };
} | {
    type: 'UPDATE_NODE_PROPS';
    payload: {
        nodeId: NodeId;
        props: Partial<Record<string, PropValue>>;
    };
} | {
    type: 'UPDATE_NODE_STYLES';
    payload: {
        nodeId: NodeId;
        styles: Partial<NodeStyles>;
    };
} | {
    type: 'UPDATE_NODE_NAME';
    payload: {
        nodeId: NodeId;
        name: string;
    };
} | {
    type: 'DUPLICATE_NODE';
    payload: {
        nodeId: NodeId;
    };
} | {
    type: 'DUPLICATE_NODES';
    payload: {
        nodeIds: NodeId[];
    };
} | {
    type: 'COPY_NODES';
    payload: {
        nodeIds: NodeId[];
    };
} | {
    type: 'PASTE_NODES';
    payload: {
        parentId: NodeId;
        index?: number;
    };
} | {
    type: 'SELECT_NODE';
    payload: {
        nodeId: NodeId;
        addToSelection?: boolean;
    };
} | {
    type: 'SELECT_NODES';
    payload: {
        nodeIds: NodeId[];
    };
} | {
    type: 'DESELECT_NODE';
    payload: {
        nodeId: NodeId;
    };
} | {
    type: 'DESELECT_ALL';
} | {
    type: 'HOVER_NODE';
    payload: {
        nodeId: NodeId | null;
    };
} | {
    type: 'FOCUS_NODE';
    payload: {
        nodeId: NodeId | null;
    };
} | {
    type: 'START_DRAG';
    payload: DragSource;
} | {
    type: 'UPDATE_DRAG';
    payload: {
        position: {
            x: number;
            y: number;
        };
        target?: DropTarget;
    };
} | {
    type: 'END_DRAG';
} | {
    type: 'CANCEL_DRAG';
} | {
    type: 'START_RESIZE';
    payload: {
        handle: ResizeHandle;
        bounds: BoundingBox;
    };
} | {
    type: 'UPDATE_RESIZE';
    payload: {
        bounds: BoundingBox;
    };
} | {
    type: 'END_RESIZE';
} | {
    type: 'CANCEL_RESIZE';
} | {
    type: 'SET_ZOOM';
    payload: {
        zoom: number;
    };
} | {
    type: 'SET_PAN';
    payload: {
        x: number;
        y: number;
    };
} | {
    type: 'FIT_TO_SCREEN';
} | {
    type: 'UPDATE_CANVAS_SETTINGS';
    payload: Partial<CanvasSettings>;
} | {
    type: 'REGISTER_COMPONENT';
    payload: ComponentDefinition;
} | {
    type: 'UNREGISTER_COMPONENT';
    payload: {
        type: ComponentType;
    };
} | {
    type: 'UPDATE_UI';
    payload: Partial<BuilderState['ui']>;
} | {
    type: 'UPDATE_PREVIEW';
    payload: Partial<BuilderState['preview']>;
} | {
    type: 'LOAD_DOCUMENT';
    payload: {
        document: DocumentMetadata;
        nodes: Record<NodeId, ComponentNode>;
        rootId: NodeId;
    };
} | {
    type: 'NEW_DOCUMENT';
    payload?: {
        name?: string;
    };
} | {
    type: 'SET_VIEWPORT_MODE';
    payload: ViewportMode;
} | {
    type: 'UNDO';
} | {
    type: 'REDO';
} | {
    type: 'BATCH';
    payload: {
        actions: BuilderAction[];
    };
};
/**
 * Serialized document format
 */
export interface SerializedDocument {
    version: string;
    document: DocumentMetadata;
    nodes: Record<NodeId, ComponentNode>;
    rootId: NodeId;
    components?: ComponentDefinition[];
}
/**
 * Code generation options
 */
export interface CodegenOptions {
    format: 'jsx' | 'tsx' | 'philjs';
    indent: string;
    quotes: 'single' | 'double';
    semicolons: boolean;
    componentImports: boolean;
    styleFormat: 'inline' | 'object' | 'className' | 'tailwind';
    signalBindings: boolean;
    includeComments: boolean;
    minify: boolean;
}
/**
 * Import options
 */
export interface ImportOptions {
    parseStyles: boolean;
    parseEvents: boolean;
    flattenTree: boolean;
    preserveIds: boolean;
}
/**
 * Preview message types for iframe communication
 */
export type PreviewMessage = {
    type: 'INIT';
    payload: {
        nodes: Record<NodeId, ComponentNode>;
        rootId: NodeId;
    };
} | {
    type: 'UPDATE_NODE';
    payload: {
        nodeId: NodeId;
        node: ComponentNode;
    };
} | {
    type: 'DELETE_NODE';
    payload: {
        nodeId: NodeId;
    };
} | {
    type: 'FULL_REFRESH';
    payload: {
        nodes: Record<NodeId, ComponentNode>;
        rootId: NodeId;
    };
} | {
    type: 'SET_DEVICE';
    payload: {
        width: number;
        height: number;
    };
} | {
    type: 'SET_DARK_MODE';
    payload: {
        enabled: boolean;
    };
} | {
    type: 'SELECT_NODE';
    payload: {
        nodeId: NodeId;
    };
} | {
    type: 'HOVER_NODE';
    payload: {
        nodeId: NodeId | null;
    };
};
/**
 * Preview callback types
 */
export type PreviewCallback = {
    type: 'NODE_CLICKED';
    payload: {
        nodeId: NodeId;
    };
} | {
    type: 'NODE_HOVERED';
    payload: {
        nodeId: NodeId | null;
    };
} | {
    type: 'READY';
} | {
    type: 'ERROR';
    payload: {
        message: string;
    };
};
/**
 * Builder event types
 */
export interface BuilderEvents {
    'node:added': {
        node: ComponentNode;
    };
    'node:deleted': {
        nodeId: NodeId;
    };
    'node:updated': {
        nodeId: NodeId;
        changes: Partial<ComponentNode>;
    };
    'node:moved': {
        nodeId: NodeId;
        oldParentId: NodeId;
        newParentId: NodeId;
    };
    'selection:changed': {
        selectedIds: NodeId[];
    };
    'drag:start': {
        source: DragSource;
    };
    'drag:end': {
        source: DragSource;
        target: DropTarget | null;
    };
    'resize:start': {
        nodeId: NodeId;
        handle: ResizeHandle;
    };
    'resize:end': {
        nodeId: NodeId;
        bounds: BoundingBox;
    };
    'viewport:changed': {
        viewport: ViewportState;
    };
    'document:loaded': {
        document: DocumentMetadata;
    };
    'document:saved': {
        document: DocumentMetadata;
    };
    'history:changed': {
        canUndo: boolean;
        canRedo: boolean;
    };
}
/**
 * Event listener type
 */
export type BuilderEventListener<K extends keyof BuilderEvents> = (event: BuilderEvents[K]) => void;
/**
 * Viewport mode for responsive preview
 */
export type ViewportMode = 'desktop' | 'tablet' | 'mobile' | 'custom';
//# sourceMappingURL=types.d.ts.map