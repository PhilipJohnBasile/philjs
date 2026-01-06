/**
 * Visual Builder component - Main visual builder UI
 *
 * Provides a drag-and-drop visual builder for creating component trees
 * with real-time property editing and layer management.
 */

import type { ComponentNode, NodeId, BuilderState } from '../types.js';

// ============================================================================
// Types
// ============================================================================

export interface BuilderUIState {
    leftPanelWidth: number;
    rightPanelWidth: number;
    leftPanelCollapsed: boolean;
    rightPanelCollapsed: boolean;
    activeTab: 'layers' | 'components' | 'assets';
    inspectorTab: 'props' | 'styles' | 'events' | 'advanced';
}

export interface VisualBuilderProps {
    /** Initial nodes to load */
    nodes?: Record<NodeId, ComponentNode>;
    /** Root node ID */
    rootId?: NodeId;
    /** Initial builder state */
    initialState?: Partial<BuilderState>;
    /** Callback when nodes change */
    onNodesChange?: (nodes: Record<NodeId, ComponentNode>) => void;
    /** Callback when selection changes */
    onSelectionChange?: (selectedIds: NodeId[]) => void;
    /** Callback when document is saved */
    onSave?: (state: BuilderState) => void;
    /** Callback when document is loaded */
    onLoad?: (state: BuilderState) => void;
    /** Whether to show the component palette */
    showPalette?: boolean;
    /** Whether to show the inspector panel */
    showInspector?: boolean;
    /** Whether to show the layers panel */
    showLayers?: boolean;
    /** Custom class name */
    className?: string;
    /** Theme mode */
    theme?: 'light' | 'dark' | 'auto';
    /** Available component types */
    componentTypes?: ComponentTypeDefinition[];
    /** Undo/Redo enabled */
    enableUndoRedo?: boolean;
    /** Grid snap size (0 = disabled) */
    gridSize?: number;
}

export interface ComponentTypeDefinition {
    type: string;
    label: string;
    icon?: string;
    category?: string;
    defaultProps?: Record<string, any>;
    propDefinitions?: PropDefinition[];
}

export interface PropDefinition {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'color' | 'select' | 'object' | 'array';
    label?: string;
    defaultValue?: any;
    options?: { label: string; value: any }[];
    min?: number;
    max?: number;
    step?: number;
}

export interface BuilderAPI {
    /** Get all nodes */
    getNodes: () => Record<NodeId, ComponentNode>;
    /** Set nodes */
    setNodes: (nodes: Record<NodeId, ComponentNode>) => void;
    /** Add a new node */
    addNode: (node: Omit<ComponentNode, 'id'>, parentId?: NodeId) => NodeId;
    /** Remove a node */
    removeNode: (nodeId: NodeId) => void;
    /** Update node properties */
    updateNode: (nodeId: NodeId, updates: Partial<ComponentNode>) => void;
    /** Get selected nodes */
    getSelectedNodes: () => NodeId[];
    /** Set selection */
    setSelection: (nodeIds: NodeId[]) => void;
    /** Undo last action */
    undo: () => void;
    /** Redo last undone action */
    redo: () => void;
    /** Export as JSON */
    exportJSON: () => string;
    /** Import from JSON */
    importJSON: (json: string) => void;
}

// ============================================================================
// Default Component Types
// ============================================================================

const DEFAULT_COMPONENT_TYPES: ComponentTypeDefinition[] = [
    {
        type: 'Container',
        label: 'Container',
        icon: '📦',
        category: 'Layout',
        defaultProps: { display: 'flex', flexDirection: 'column', padding: '10px' },
        propDefinitions: [
            { name: 'display', type: 'select', options: [{ label: 'Flex', value: 'flex' }, { label: 'Block', value: 'block' }, { label: 'Grid', value: 'grid' }] },
            { name: 'flexDirection', type: 'select', options: [{ label: 'Row', value: 'row' }, { label: 'Column', value: 'column' }] },
            { name: 'padding', type: 'string' },
            { name: 'gap', type: 'string' }
        ]
    },
    {
        type: 'Text',
        label: 'Text',
        icon: '📝',
        category: 'Basic',
        defaultProps: { content: 'Text', fontSize: '16px' },
        propDefinitions: [
            { name: 'content', type: 'string', label: 'Content' },
            { name: 'fontSize', type: 'string', label: 'Font Size' },
            { name: 'fontWeight', type: 'select', options: [{ label: 'Normal', value: 'normal' }, { label: 'Bold', value: 'bold' }] },
            { name: 'color', type: 'color', label: 'Color' }
        ]
    },
    {
        type: 'Button',
        label: 'Button',
        icon: '🔘',
        category: 'Basic',
        defaultProps: { label: 'Click me', variant: 'primary' },
        propDefinitions: [
            { name: 'label', type: 'string', label: 'Label' },
            { name: 'variant', type: 'select', options: [{ label: 'Primary', value: 'primary' }, { label: 'Secondary', value: 'secondary' }, { label: 'Outline', value: 'outline' }] },
            { name: 'disabled', type: 'boolean', label: 'Disabled' }
        ]
    },
    {
        type: 'Image',
        label: 'Image',
        icon: '🖼️',
        category: 'Media',
        defaultProps: { src: '', alt: 'Image' },
        propDefinitions: [
            { name: 'src', type: 'string', label: 'Source URL' },
            { name: 'alt', type: 'string', label: 'Alt Text' },
            { name: 'width', type: 'string', label: 'Width' },
            { name: 'height', type: 'string', label: 'Height' }
        ]
    },
    {
        type: 'Input',
        label: 'Input',
        icon: '✏️',
        category: 'Form',
        defaultProps: { placeholder: 'Enter text...', type: 'text' },
        propDefinitions: [
            { name: 'placeholder', type: 'string', label: 'Placeholder' },
            { name: 'type', type: 'select', options: [{ label: 'Text', value: 'text' }, { label: 'Email', value: 'email' }, { label: 'Password', value: 'password' }, { label: 'Number', value: 'number' }] },
            { name: 'required', type: 'boolean', label: 'Required' }
        ]
    },
    {
        type: 'Card',
        label: 'Card',
        icon: '🃏',
        category: 'Layout',
        defaultProps: { padding: '16px', borderRadius: '8px', shadow: true },
        propDefinitions: [
            { name: 'padding', type: 'string', label: 'Padding' },
            { name: 'borderRadius', type: 'string', label: 'Border Radius' },
            { name: 'shadow', type: 'boolean', label: 'Shadow' }
        ]
    }
];

// ============================================================================
// Visual Builder Component
// ============================================================================

/**
 * Main Visual Builder component
 *
 * Provides a complete visual builder UI with:
 * - Drag-and-drop component placement
 * - Property inspector panel
 * - Layers/tree view panel
 * - Undo/redo support
 * - Real-time preview
 */
export function VisualBuilder(props: VisualBuilderProps): HTMLElement & { api: BuilderAPI } {
    const {
        className = '',
        showPalette = true,
        showInspector = true,
        showLayers = true,
        theme = 'auto',
        nodes: initialNodes = {},
        rootId: initialRootId,
        componentTypes = DEFAULT_COMPONENT_TYPES,
        enableUndoRedo = true,
        gridSize = 0,
        onSelectionChange,
        onNodesChange,
        onSave
    } = props;

    // State
    let nodes: Record<NodeId, ComponentNode> = { ...initialNodes };
    let rootId: NodeId | null = initialRootId || null;
    let selectedIds: NodeId[] = [];
    let draggedType: string | null = null;
    let draggedNodeId: NodeId | null = null;
    let dropTargetId: NodeId | null = null;

    // Undo/redo stacks
    const undoStack: Array<Record<NodeId, ComponentNode>> = [];
    const redoStack: Array<Record<NodeId, ComponentNode>> = [];

    // Generate unique ID
    const generateId = (): NodeId => `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Save state for undo
    function saveState(): void {
        if (enableUndoRedo) {
            undoStack.push(JSON.parse(JSON.stringify(nodes)));
            redoStack.length = 0;
            if (undoStack.length > 50) undoStack.shift();
        }
    }

    // Create container
    const container = document.createElement('div');
    container.className = `philjs-visual-builder ${className}`.trim();
    container.dataset['theme'] = theme;
    container.style.cssText = `
        display: flex;
        height: 100%;
        background: var(--builder-bg, #1e1e1e);
        color: var(--builder-text, #fff);
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 14px;
    `;

    // Apply theme
    if (theme === 'light') {
        container.style.setProperty('--builder-bg', '#f5f5f5');
        container.style.setProperty('--builder-text', '#333');
        container.style.setProperty('--builder-panel-bg', '#fff');
        container.style.setProperty('--builder-border', '#ddd');
        container.style.setProperty('--builder-hover', '#e0e0e0');
        container.style.setProperty('--builder-selected', '#007bff');
    } else {
        container.style.setProperty('--builder-bg', '#1e1e1e');
        container.style.setProperty('--builder-text', '#fff');
        container.style.setProperty('--builder-panel-bg', '#252526');
        container.style.setProperty('--builder-border', '#3c3c3c');
        container.style.setProperty('--builder-hover', '#2a2d2e');
        container.style.setProperty('--builder-selected', '#094771');
    }

    // Create main layout
    const layout = document.createElement('div');
    layout.className = 'philjs-builder-layout';
    layout.style.cssText = 'display: flex; flex: 1; overflow: hidden;';

    // ========== LEFT PANEL (Palette/Layers) ==========
    let leftPanel: HTMLElement | null = null;
    if (showPalette || showLayers) {
        leftPanel = document.createElement('div');
        leftPanel.className = 'philjs-builder-panel philjs-builder-panel-left';
        leftPanel.style.cssText = `
            width: 250px;
            background: var(--builder-panel-bg);
            border-right: 1px solid var(--builder-border);
            display: flex;
            flex-direction: column;
            overflow: hidden;
        `;

        // Panel tabs
        const tabs = document.createElement('div');
        tabs.className = 'panel-tabs';
        tabs.style.cssText = `
            display: flex;
            border-bottom: 1px solid var(--builder-border);
        `;

        let activeLeftTab: 'components' | 'layers' = 'components';

        function createTab(label: string, isActive: boolean, onClick: () => void): HTMLElement {
            const tab = document.createElement('div');
            tab.textContent = label;
            tab.style.cssText = `
                padding: 10px 15px;
                cursor: pointer;
                border-bottom: 2px solid ${isActive ? 'var(--builder-selected)' : 'transparent'};
                background: ${isActive ? 'var(--builder-hover)' : 'transparent'};
            `;
            tab.addEventListener('click', onClick);
            return tab;
        }

        const componentsTab = createTab('Components', true, () => switchLeftTab('components'));
        const layersTab = createTab('Layers', false, () => switchLeftTab('layers'));

        tabs.appendChild(componentsTab);
        if (showLayers) tabs.appendChild(layersTab);

        // Content areas
        const componentsContent = document.createElement('div');
        componentsContent.className = 'components-content';
        componentsContent.style.cssText = 'flex: 1; overflow-y: auto; padding: 10px;';

        const layersContent = document.createElement('div');
        layersContent.className = 'layers-content';
        layersContent.style.cssText = 'flex: 1; overflow-y: auto; padding: 10px; display: none;';

        function switchLeftTab(tab: 'components' | 'layers'): void {
            activeLeftTab = tab;
            componentsTab.style.borderBottomColor = tab === 'components' ? 'var(--builder-selected)' : 'transparent';
            componentsTab.style.background = tab === 'components' ? 'var(--builder-hover)' : 'transparent';
            layersTab.style.borderBottomColor = tab === 'layers' ? 'var(--builder-selected)' : 'transparent';
            layersTab.style.background = tab === 'layers' ? 'var(--builder-hover)' : 'transparent';
            componentsContent.style.display = tab === 'components' ? 'block' : 'none';
            layersContent.style.display = tab === 'layers' ? 'block' : 'none';
        }

        // Populate components palette
        const categories = new Map<string, ComponentTypeDefinition[]>();
        for (const comp of componentTypes) {
            const cat = comp.category || 'Other';
            if (!categories.has(cat)) categories.set(cat, []);
            categories.get(cat)!.push(comp);
        }

        for (const [category, comps] of categories) {
            const catHeader = document.createElement('div');
            catHeader.textContent = category;
            catHeader.style.cssText = 'font-weight: bold; margin: 10px 0 5px 0; color: #888; font-size: 12px; text-transform: uppercase;';
            componentsContent.appendChild(catHeader);

            for (const comp of comps) {
                const item = document.createElement('div');
                item.className = 'component-item';
                item.draggable = true;
                item.style.cssText = `
                    padding: 8px 12px;
                    margin: 2px 0;
                    background: var(--builder-hover);
                    border-radius: 4px;
                    cursor: grab;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                `;
                item.innerHTML = `<span>${comp.icon || '📦'}</span><span>${comp.label}</span>`;

                item.addEventListener('dragstart', (e) => {
                    draggedType = comp.type;
                    e.dataTransfer!.effectAllowed = 'copy';
                    item.style.opacity = '0.5';
                });
                item.addEventListener('dragend', () => {
                    draggedType = null;
                    item.style.opacity = '1';
                });

                componentsContent.appendChild(item);
            }
        }

        // Render layers tree
        function renderLayersTree(): void {
            layersContent.innerHTML = '';
            if (!rootId) {
                layersContent.innerHTML = '<div style="color: #888; text-align: center; padding: 20px;">No components</div>';
                return;
            }
            renderLayerNode(rootId, 0, layersContent);
        }

        function renderLayerNode(nodeId: NodeId, depth: number, parent: HTMLElement): void {
            const node = nodes[nodeId];
            if (!node) return;

            const item = document.createElement('div');
            item.className = 'layer-item';
            item.draggable = true;
            item.style.cssText = `
                padding: 6px 8px;
                padding-left: ${8 + depth * 16}px;
                cursor: pointer;
                background: ${selectedIds.includes(nodeId) ? 'var(--builder-selected)' : 'transparent'};
                border-radius: 4px;
                display: flex;
                align-items: center;
                gap: 6px;
            `;

            const compDef = componentTypes.find(c => c.type === node.type);
            item.innerHTML = `<span>${compDef?.icon || '📦'}</span><span>${node.type}</span>`;

            item.addEventListener('click', () => {
                selectedIds = [nodeId];
                onSelectionChange?.(selectedIds);
                refreshSelection();
                renderLayersTree();
                renderInspector();
            });

            item.addEventListener('dragstart', (e) => {
                draggedNodeId = nodeId;
                e.dataTransfer!.effectAllowed = 'move';
            });

            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                if (draggedNodeId && draggedNodeId !== nodeId) {
                    item.style.borderTop = '2px solid var(--builder-selected)';
                }
            });

            item.addEventListener('dragleave', () => {
                item.style.borderTop = '';
            });

            item.addEventListener('drop', (e) => {
                e.preventDefault();
                item.style.borderTop = '';
                if (draggedNodeId && draggedNodeId !== nodeId) {
                    // Move node
                    moveNode(draggedNodeId, nodeId);
                }
                draggedNodeId = null;
            });

            parent.appendChild(item);

            // Render children
            const children = (node as any).children as NodeId[] | undefined;
            if (children && Array.isArray(children)) {
                for (const childId of children) {
                    renderLayerNode(childId, depth + 1, parent);
                }
            }
        }

        leftPanel.appendChild(tabs);
        leftPanel.appendChild(componentsContent);
        leftPanel.appendChild(layersContent);
        layout.appendChild(leftPanel);
    }

    // ========== CENTER PANEL (Canvas) ==========
    const centerPanel = document.createElement('div');
    centerPanel.className = 'philjs-builder-canvas-container';
    centerPanel.style.cssText = `
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    `;

    // Toolbar
    const toolbar = document.createElement('div');
    toolbar.className = 'philjs-builder-toolbar';
    toolbar.style.cssText = `
        padding: 8px 12px;
        background: var(--builder-panel-bg);
        border-bottom: 1px solid var(--builder-border);
        display: flex;
        gap: 10px;
        align-items: center;
    `;

    function createToolbarButton(icon: string, title: string, onClick: () => void): HTMLElement {
        const btn = document.createElement('button');
        btn.innerHTML = icon;
        btn.title = title;
        btn.style.cssText = `
            background: var(--builder-hover);
            border: 1px solid var(--builder-border);
            color: var(--builder-text);
            padding: 6px 10px;
            border-radius: 4px;
            cursor: pointer;
        `;
        btn.addEventListener('click', onClick);
        return btn;
    }

    if (enableUndoRedo) {
        toolbar.appendChild(createToolbarButton('↩️', 'Undo', () => api.undo()));
        toolbar.appendChild(createToolbarButton('↪️', 'Redo', () => api.redo()));
        toolbar.appendChild(document.createElement('span')); // spacer
    }

    toolbar.appendChild(createToolbarButton('💾', 'Save', () => {
        onSave?.({ nodes, rootId: rootId || undefined } as BuilderState);
    }));
    toolbar.appendChild(createToolbarButton('🗑️', 'Delete Selected', () => {
        if (selectedIds.length > 0) {
            for (const id of selectedIds) {
                api.removeNode(id);
            }
        }
    }));

    // Canvas
    const canvas = document.createElement('div');
    canvas.className = 'philjs-builder-canvas';
    canvas.style.cssText = `
        flex: 1;
        overflow: auto;
        padding: 20px;
        background: ${gridSize > 0 ? `repeating-linear-gradient(0deg, transparent, transparent ${gridSize - 1}px, var(--builder-border) ${gridSize}px), repeating-linear-gradient(90deg, transparent, transparent ${gridSize - 1}px, var(--builder-border) ${gridSize}px)` : 'var(--builder-bg)'};
    `;

    // Canvas drop handling
    canvas.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer!.dropEffect = draggedType ? 'copy' : 'move';
    });

    canvas.addEventListener('drop', (e) => {
        e.preventDefault();
        if (draggedType) {
            // Add new component
            const compDef = componentTypes.find(c => c.type === draggedType);
            const newId = api.addNode({
                type: draggedType,
                props: { ...compDef?.defaultProps },
                children: []
            } as any, rootId || undefined);

            if (!rootId) rootId = newId;
            selectedIds = [newId];
            onSelectionChange?.(selectedIds);
        }
        draggedType = null;
        refreshCanvas();
        if (leftPanel) renderLayersTree();
        renderInspector();
    });

    canvas.addEventListener('click', (e) => {
        if (e.target === canvas) {
            selectedIds = [];
            onSelectionChange?.(selectedIds);
            refreshSelection();
            if (leftPanel) renderLayersTree();
            renderInspector();
        }
    });

    centerPanel.appendChild(toolbar);
    centerPanel.appendChild(canvas);
    layout.appendChild(centerPanel);

    // ========== RIGHT PANEL (Inspector) ==========
    let rightPanel: HTMLElement | null = null;
    let propsContent: HTMLElement | null = null;
    let stylesContent: HTMLElement | null = null;

    if (showInspector) {
        rightPanel = document.createElement('div');
        rightPanel.className = 'philjs-builder-panel philjs-builder-panel-right';
        rightPanel.style.cssText = `
            width: 280px;
            background: var(--builder-panel-bg);
            border-left: 1px solid var(--builder-border);
            display: flex;
            flex-direction: column;
            overflow: hidden;
        `;

        const inspectorHeader = document.createElement('div');
        inspectorHeader.style.cssText = 'padding: 12px; border-bottom: 1px solid var(--builder-border); font-weight: bold;';
        inspectorHeader.textContent = 'Inspector';

        // Tabs
        const inspectorTabs = document.createElement('div');
        inspectorTabs.style.cssText = 'display: flex; border-bottom: 1px solid var(--builder-border);';

        let activeInspectorTab: 'props' | 'styles' = 'props';

        const propsTab = createTab('Props', true, () => switchInspectorTab('props'));
        const stylesTab = createTab('Styles', false, () => switchInspectorTab('styles'));

        function createTab(label: string, isActive: boolean, onClick: () => void): HTMLElement {
            const tab = document.createElement('div');
            tab.textContent = label;
            tab.style.cssText = `
                padding: 8px 12px;
                cursor: pointer;
                flex: 1;
                text-align: center;
                border-bottom: 2px solid ${isActive ? 'var(--builder-selected)' : 'transparent'};
            `;
            tab.addEventListener('click', onClick);
            return tab;
        }

        function switchInspectorTab(tab: 'props' | 'styles'): void {
            activeInspectorTab = tab;
            propsTab.style.borderBottomColor = tab === 'props' ? 'var(--builder-selected)' : 'transparent';
            stylesTab.style.borderBottomColor = tab === 'styles' ? 'var(--builder-selected)' : 'transparent';
            if (propsContent) propsContent.style.display = tab === 'props' ? 'block' : 'none';
            if (stylesContent) stylesContent.style.display = tab === 'styles' ? 'block' : 'none';
        }

        inspectorTabs.appendChild(propsTab);
        inspectorTabs.appendChild(stylesTab);

        propsContent = document.createElement('div');
        propsContent.style.cssText = 'flex: 1; overflow-y: auto; padding: 10px;';

        stylesContent = document.createElement('div');
        stylesContent.style.cssText = 'flex: 1; overflow-y: auto; padding: 10px; display: none;';

        rightPanel.appendChild(inspectorHeader);
        rightPanel.appendChild(inspectorTabs);
        rightPanel.appendChild(propsContent);
        rightPanel.appendChild(stylesContent);
        layout.appendChild(rightPanel);
    }

    function renderInspector(): void {
        if (!propsContent || !stylesContent) return;

        propsContent.innerHTML = '';
        stylesContent.innerHTML = '';

        if (selectedIds.length === 0) {
            propsContent.innerHTML = '<div style="color: #888; text-align: center; padding: 20px;">Select a component</div>';
            stylesContent.innerHTML = '<div style="color: #888; text-align: center; padding: 20px;">Select a component</div>';
            return;
        }

        const nodeId = selectedIds[0];
        const node = nodes[nodeId];
        if (!node) return;

        const compDef = componentTypes.find(c => c.type === node.type);

        // Render prop editors
        if (compDef?.propDefinitions) {
            for (const prop of compDef.propDefinitions) {
                const row = createPropEditor(prop, node.props?.[prop.name], (value) => {
                    saveState();
                    node.props = { ...node.props, [prop.name]: value };
                    onNodesChange?.(nodes);
                    refreshCanvas();
                });
                propsContent.appendChild(row);
            }
        }

        // Style editor
        const styleProps: PropDefinition[] = [
            { name: 'width', type: 'string', label: 'Width' },
            { name: 'height', type: 'string', label: 'Height' },
            { name: 'margin', type: 'string', label: 'Margin' },
            { name: 'padding', type: 'string', label: 'Padding' },
            { name: 'background', type: 'color', label: 'Background' },
            { name: 'border', type: 'string', label: 'Border' },
            { name: 'borderRadius', type: 'string', label: 'Border Radius' }
        ];

        for (const prop of styleProps) {
            const row = createPropEditor(prop, node.props?.style?.[prop.name], (value) => {
                saveState();
                if (!node.props) node.props = {};
                if (!node.props.style) node.props.style = {};
                node.props.style[prop.name] = value;
                onNodesChange?.(nodes);
                refreshCanvas();
            });
            stylesContent.appendChild(row);
        }
    }

    function createPropEditor(prop: PropDefinition, value: any, onChange: (value: any) => void): HTMLElement {
        const row = document.createElement('div');
        row.style.cssText = 'margin-bottom: 10px;';

        const label = document.createElement('label');
        label.textContent = prop.label || prop.name;
        label.style.cssText = 'display: block; margin-bottom: 4px; font-size: 12px; color: #888;';
        row.appendChild(label);

        let input: HTMLInputElement | HTMLSelectElement;

        switch (prop.type) {
            case 'boolean':
                input = document.createElement('input');
                input.type = 'checkbox';
                (input as HTMLInputElement).checked = !!value;
                input.addEventListener('change', () => onChange((input as HTMLInputElement).checked));
                break;

            case 'number':
                input = document.createElement('input');
                input.type = 'number';
                input.value = value ?? prop.defaultValue ?? '';
                if (prop.min !== undefined) input.min = String(prop.min);
                if (prop.max !== undefined) input.max = String(prop.max);
                if (prop.step !== undefined) input.step = String(prop.step);
                input.addEventListener('input', () => onChange(parseFloat(input.value)));
                break;

            case 'color':
                input = document.createElement('input');
                input.type = 'color';
                input.value = value || '#000000';
                input.addEventListener('input', () => onChange(input.value));
                break;

            case 'select':
                input = document.createElement('select');
                for (const opt of prop.options || []) {
                    const option = document.createElement('option');
                    option.value = opt.value;
                    option.textContent = opt.label;
                    if (opt.value === value) option.selected = true;
                    input.appendChild(option);
                }
                input.addEventListener('change', () => onChange(input.value));
                break;

            default:
                input = document.createElement('input');
                input.type = 'text';
                input.value = value ?? prop.defaultValue ?? '';
                input.addEventListener('input', () => onChange(input.value));
        }

        input.style.cssText = `
            width: 100%;
            padding: 6px 8px;
            border: 1px solid var(--builder-border);
            border-radius: 4px;
            background: var(--builder-bg);
            color: var(--builder-text);
            box-sizing: border-box;
        `;

        row.appendChild(input);
        return row;
    }

    // Render canvas content
    function refreshCanvas(): void {
        canvas.innerHTML = '';
        if (!rootId) {
            canvas.innerHTML = '<div style="color: #888; text-align: center; padding: 40px;">Drag components here to start</div>';
            return;
        }
        renderCanvasNode(rootId, canvas);
    }

    function renderCanvasNode(nodeId: NodeId, parent: HTMLElement): void {
        const node = nodes[nodeId];
        if (!node) return;

        const el = document.createElement('div');
        el.className = `philjs-canvas-node ${selectedIds.includes(nodeId) ? 'selected' : ''}`;
        el.dataset['nodeId'] = nodeId;
        el.style.cssText = `
            position: relative;
            padding: 10px;
            border: 2px solid ${selectedIds.includes(nodeId) ? 'var(--builder-selected)' : 'var(--builder-border)'};
            border-radius: 4px;
            margin: 5px;
            min-height: 30px;
            background: ${selectedIds.includes(nodeId) ? 'rgba(0,123,255,0.1)' : 'rgba(255,255,255,0.05)'};
            cursor: pointer;
            transition: border-color 0.2s;
        `;

        // Apply custom styles
        if (node.props?.style) {
            Object.assign(el.style, node.props.style);
        }

        // Node type label
        const typeLabel = document.createElement('div');
        typeLabel.style.cssText = `
            position: absolute;
            top: -10px;
            left: 5px;
            background: var(--builder-panel-bg);
            padding: 2px 6px;
            font-size: 10px;
            color: #888;
            border-radius: 3px;
        `;
        const compDef = componentTypes.find(c => c.type === node.type);
        typeLabel.textContent = `${compDef?.icon || '📦'} ${node.type}`;
        el.appendChild(typeLabel);

        // Preview content
        const preview = document.createElement('div');
        preview.style.cssText = 'margin-top: 5px;';
        preview.innerHTML = renderNodePreview(node);
        el.appendChild(preview);

        // Click handler
        el.addEventListener('click', (e) => {
            e.stopPropagation();
            selectedIds = [nodeId];
            onSelectionChange?.(selectedIds);
            refreshSelection();
            if (leftPanel) renderLayersTree();
            renderInspector();
        });

        // Drop zone for children
        el.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            el.style.background = 'rgba(0,123,255,0.2)';
            dropTargetId = nodeId;
        });

        el.addEventListener('dragleave', () => {
            el.style.background = selectedIds.includes(nodeId) ? 'rgba(0,123,255,0.1)' : 'rgba(255,255,255,0.05)';
        });

        el.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            el.style.background = selectedIds.includes(nodeId) ? 'rgba(0,123,255,0.1)' : 'rgba(255,255,255,0.05)';

            if (draggedType) {
                const compDef = componentTypes.find(c => c.type === draggedType);
                const newId = api.addNode({
                    type: draggedType,
                    props: { ...compDef?.defaultProps },
                    children: []
                } as any, nodeId);

                selectedIds = [newId];
                onSelectionChange?.(selectedIds);
            }
            draggedType = null;
            dropTargetId = null;
            refreshCanvas();
            if (leftPanel) renderLayersTree();
            renderInspector();
        });

        parent.appendChild(el);

        // Render children
        const children = (node as any).children as NodeId[] | undefined;
        if (children && Array.isArray(children)) {
            const childContainer = document.createElement('div');
            childContainer.style.cssText = 'margin-left: 10px; margin-top: 10px;';
            for (const childId of children) {
                renderCanvasNode(childId, childContainer);
            }
            el.appendChild(childContainer);
        }
    }

    function renderNodePreview(node: ComponentNode): string {
        switch (node.type) {
            case 'Text':
                return `<span style="font-size: ${node.props?.fontSize || '16px'}; color: ${node.props?.color || 'inherit'};">${node.props?.content || 'Text'}</span>`;
            case 'Button':
                return `<button style="padding: 8px 16px; cursor: default;">${node.props?.label || 'Button'}</button>`;
            case 'Image':
                return node.props?.src
                    ? `<img src="${node.props.src}" alt="${node.props?.alt || ''}" style="max-width: 100%; height: auto;" />`
                    : '<div style="background: #333; padding: 20px; text-align: center;">🖼️ Image</div>';
            case 'Input':
                return `<input type="${node.props?.type || 'text'}" placeholder="${node.props?.placeholder || ''}" style="padding: 8px; width: 100%; box-sizing: border-box;" readonly />`;
            default:
                return '';
        }
    }

    function refreshSelection(): void {
        canvas.querySelectorAll('.philjs-canvas-node').forEach(el => {
            const id = (el as HTMLElement).dataset['nodeId'];
            const isSelected = id && selectedIds.includes(id);
            (el as HTMLElement).style.borderColor = isSelected ? 'var(--builder-selected)' : 'var(--builder-border)';
            (el as HTMLElement).style.background = isSelected ? 'rgba(0,123,255,0.1)' : 'rgba(255,255,255,0.05)';
        });
    }

    function moveNode(nodeId: NodeId, newParentId: NodeId): void {
        saveState();
        // Remove from old parent
        for (const n of Object.values(nodes)) {
            const children = (n as any).children as NodeId[] | undefined;
            if (children) {
                const idx = children.indexOf(nodeId);
                if (idx !== -1) {
                    children.splice(idx, 1);
                    break;
                }
            }
        }
        // Add to new parent
        const newParent = nodes[newParentId] as any;
        if (!newParent.children) newParent.children = [];
        newParent.children.push(nodeId);
        onNodesChange?.(nodes);
        refreshCanvas();
    }

    function renderLayersTree(): void {
        if (leftPanel) {
            const layersContent = leftPanel.querySelector('.layers-content') as HTMLElement;
            if (layersContent) {
                layersContent.innerHTML = '';
                if (!rootId) {
                    layersContent.innerHTML = '<div style="color: #888; text-align: center; padding: 20px;">No components</div>';
                    return;
                }

                function renderLayerNode(nodeId: NodeId, depth: number, parent: HTMLElement): void {
                    const node = nodes[nodeId];
                    if (!node) return;

                    const item = document.createElement('div');
                    item.style.cssText = `
                        padding: 6px 8px;
                        padding-left: ${8 + depth * 16}px;
                        cursor: pointer;
                        background: ${selectedIds.includes(nodeId) ? 'var(--builder-selected)' : 'transparent'};
                        border-radius: 4px;
                    `;

                    const compDef = componentTypes.find(c => c.type === node.type);
                    item.innerHTML = `<span>${compDef?.icon || '📦'}</span> ${node.type}`;

                    item.addEventListener('click', () => {
                        selectedIds = [nodeId];
                        onSelectionChange?.(selectedIds);
                        refreshSelection();
                        renderLayersTree();
                        renderInspector();
                    });

                    parent.appendChild(item);

                    const children = (node as any).children as NodeId[] | undefined;
                    if (children) {
                        for (const childId of children) {
                            renderLayerNode(childId, depth + 1, parent);
                        }
                    }
                }

                renderLayerNode(rootId, 0, layersContent);
            }
        }
    }

    // Builder API
    const api: BuilderAPI = {
        getNodes() {
            return { ...nodes };
        },

        setNodes(newNodes) {
            saveState();
            nodes = { ...newNodes };
            onNodesChange?.(nodes);
            refreshCanvas();
            renderLayersTree();
        },

        addNode(nodeData, parentId) {
            saveState();
            const id = generateId();
            nodes[id] = { ...nodeData, id } as ComponentNode;

            if (parentId) {
                const parent = nodes[parentId] as any;
                if (!parent.children) parent.children = [];
                parent.children.push(id);
            }

            onNodesChange?.(nodes);
            refreshCanvas();
            renderLayersTree();
            return id;
        },

        removeNode(nodeId) {
            saveState();
            // Remove from parent's children
            for (const n of Object.values(nodes)) {
                const children = (n as any).children as NodeId[] | undefined;
                if (children) {
                    const idx = children.indexOf(nodeId);
                    if (idx !== -1) {
                        children.splice(idx, 1);
                    }
                }
            }
            delete nodes[nodeId];
            if (rootId === nodeId) rootId = null;
            selectedIds = selectedIds.filter(id => id !== nodeId);
            onNodesChange?.(nodes);
            onSelectionChange?.(selectedIds);
            refreshCanvas();
            renderLayersTree();
            renderInspector();
        },

        updateNode(nodeId, updates) {
            saveState();
            if (nodes[nodeId]) {
                nodes[nodeId] = { ...nodes[nodeId], ...updates };
                onNodesChange?.(nodes);
                refreshCanvas();
            }
        },

        getSelectedNodes() {
            return [...selectedIds];
        },

        setSelection(nodeIds) {
            selectedIds = [...nodeIds];
            onSelectionChange?.(selectedIds);
            refreshSelection();
            renderLayersTree();
            renderInspector();
        },

        undo() {
            if (undoStack.length > 0) {
                redoStack.push(JSON.parse(JSON.stringify(nodes)));
                nodes = undoStack.pop()!;
                onNodesChange?.(nodes);
                refreshCanvas();
                renderLayersTree();
                renderInspector();
            }
        },

        redo() {
            if (redoStack.length > 0) {
                undoStack.push(JSON.parse(JSON.stringify(nodes)));
                nodes = redoStack.pop()!;
                onNodesChange?.(nodes);
                refreshCanvas();
                renderLayersTree();
                renderInspector();
            }
        },

        exportJSON() {
            return JSON.stringify({ nodes, rootId }, null, 2);
        },

        importJSON(json) {
            try {
                const data = JSON.parse(json);
                saveState();
                nodes = data.nodes || {};
                rootId = data.rootId || null;
                selectedIds = [];
                onNodesChange?.(nodes);
                refreshCanvas();
                renderLayersTree();
                renderInspector();
            } catch (e) {
                console.error('Failed to import JSON:', e);
            }
        }
    };

    // Keyboard shortcuts
    container.tabIndex = 0;
    container.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key.toLowerCase()) {
                case 'z':
                    e.preventDefault();
                    if (e.shiftKey) {
                        api.redo();
                    } else {
                        api.undo();
                    }
                    break;
                case 'y':
                    e.preventDefault();
                    api.redo();
                    break;
                case 's':
                    e.preventDefault();
                    onSave?.({ nodes, rootId: rootId || undefined } as BuilderState);
                    break;
            }
        } else if (e.key === 'Delete' || e.key === 'Backspace') {
            if (selectedIds.length > 0) {
                e.preventDefault();
                for (const id of [...selectedIds]) {
                    api.removeNode(id);
                }
            }
        }
    });

    container.appendChild(layout);

    // Initial render
    refreshCanvas();
    renderInspector();

    // Attach API
    (container as any).api = api;

    return container as HTMLElement & { api: BuilderAPI };
}

export default VisualBuilder;
