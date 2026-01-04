import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { subscribeWithSelector } from 'zustand/middleware';
// ============================================================================
// Helper Functions
// ============================================================================
const generateId = () => {
    return `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
const getDefaultBounds = (type) => {
    const defaults = {
        Button: { x: 0, y: 0, width: 120, height: 40 },
        Text: { x: 0, y: 0, width: 200, height: 24 },
        Input: { x: 0, y: 0, width: 200, height: 40 },
        Container: { x: 0, y: 0, width: 400, height: 300 },
        Card: { x: 0, y: 0, width: 320, height: 200 },
        Image: { x: 0, y: 0, width: 200, height: 150 },
        default: { x: 0, y: 0, width: 100, height: 100 },
    };
    return defaults[type] ?? defaults['default'];
};
const getDefaultProps = (type) => {
    const defaults = {
        Button: { children: 'Button', variant: 'primary' },
        Text: { children: 'Text content' },
        Input: { placeholder: 'Enter text...' },
        Container: { className: '' },
        Card: { title: 'Card Title' },
        Image: { src: '', alt: 'Image' },
        default: {},
    };
    return defaults[type] ?? defaults['default'];
};
const cloneComponent = (component, newId, newParentId) => {
    return {
        ...component,
        id: newId,
        name: `${component.name} (copy)`,
        parentId: newParentId,
        children: [],
        bounds: {
            ...component.bounds,
            x: component.bounds.x + 20,
            y: component.bounds.y + 20,
        },
    };
};
const deepCloneComponents = (components, rootId, newParentId, idMap) => {
    const result = [];
    const original = components[rootId];
    if (!original)
        return result;
    const newId = generateId();
    idMap.set(rootId, newId);
    const cloned = cloneComponent(original, newId, newParentId);
    // Clone children recursively
    const newChildren = [];
    for (const childId of original.children) {
        const childClones = deepCloneComponents(components, childId, newId, idMap);
        result.push(...childClones);
        if (childClones.length > 0 && childClones[0]) {
            newChildren.push(childClones[0].id);
        }
    }
    cloned.children = newChildren;
    result.unshift(cloned);
    return result;
};
// ============================================================================
// Initial State
// ============================================================================
const initialState = {
    components: {},
    rootIds: [],
    canvas: {
        zoom: 1,
        pan: { x: 0, y: 0 },
        gridSize: 8,
        snapToGrid: true,
        showGrid: true,
        showGuides: true,
    },
    selection: {
        selectedIds: [],
        hoveredId: null,
        focusedId: null,
    },
    history: [],
    historyIndex: -1,
    maxHistorySize: 50,
    clipboard: null,
    activeBreakpoint: 'base',
    isDragging: false,
    dragSource: null,
};
// ============================================================================
// Store
// ============================================================================
export const useEditorStore = create()(subscribeWithSelector(immer((set, get) => ({
    ...initialState,
    // Component CRUD
    addComponent: (type, parentId, position) => {
        const id = generateId();
        const bounds = getDefaultBounds(type);
        if (position) {
            bounds.x = position.x;
            bounds.y = position.y;
        }
        const component = {
            id,
            type,
            name: `${type} ${Object.keys(get().components).length + 1}`,
            props: getDefaultProps(type),
            styles: { base: {} },
            events: [],
            children: [],
            parentId,
            isLocked: false,
            isVisible: true,
            bounds,
        };
        set((state) => {
            state.components[id] = component;
            if (parentId && state.components[parentId]) {
                state.components[parentId].children.push(id);
            }
            else {
                state.rootIds.push(id);
            }
        });
        get().pushHistory(`Add ${type}`);
        return id;
    },
    updateComponent: (id, updates) => {
        set((state) => {
            if (state.components[id]) {
                Object.assign(state.components[id], updates);
            }
        });
    },
    deleteComponent: (id) => {
        const state = get();
        const component = state.components[id];
        if (!component)
            return;
        // Recursively collect all descendant IDs
        const collectDescendants = (compId) => {
            const comp = state.components[compId];
            if (!comp)
                return [];
            return [compId, ...comp.children.flatMap(collectDescendants)];
        };
        const idsToDelete = collectDescendants(id);
        set((draft) => {
            // Remove from parent's children
            if (component.parentId && draft.components[component.parentId]) {
                const parent = draft.components[component.parentId];
                parent.children = parent.children.filter((childId) => childId !== id);
            }
            else {
                draft.rootIds = draft.rootIds.filter((rootId) => rootId !== id);
            }
            // Delete all components
            for (const deleteId of idsToDelete) {
                delete draft.components[deleteId];
            }
            // Clear selection if deleted
            draft.selection.selectedIds = draft.selection.selectedIds.filter((selectedId) => !idsToDelete.includes(selectedId));
        });
        get().pushHistory(`Delete component`);
    },
    duplicateComponent: (id) => {
        const state = get();
        const component = state.components[id];
        if (!component)
            return '';
        const idMap = new Map();
        const clones = deepCloneComponents(state.components, id, component.parentId, idMap);
        if (clones.length === 0)
            return '';
        set((draft) => {
            for (const clone of clones) {
                draft.components[clone.id] = clone;
            }
            const rootClone = clones[0];
            if (component.parentId && draft.components[component.parentId]) {
                draft.components[component.parentId].children.push(rootClone.id);
            }
            else {
                draft.rootIds.push(rootClone.id);
            }
        });
        get().pushHistory(`Duplicate ${component.type}`);
        return clones[0].id;
    },
    moveComponent: (id, newParentId, index) => {
        set((state) => {
            const component = state.components[id];
            if (!component)
                return;
            // Prevent moving to self or descendant
            const isDescendant = (ancestorId, descendantId) => {
                const comp = state.components[descendantId];
                if (!comp || !comp.parentId)
                    return false;
                if (comp.parentId === ancestorId)
                    return true;
                return isDescendant(ancestorId, comp.parentId);
            };
            if (newParentId && (newParentId === id || isDescendant(id, newParentId))) {
                return;
            }
            // Remove from current parent
            if (component.parentId && state.components[component.parentId]) {
                const oldParent = state.components[component.parentId];
                oldParent.children = oldParent.children.filter((childId) => childId !== id);
            }
            else {
                state.rootIds = state.rootIds.filter((rootId) => rootId !== id);
            }
            // Add to new parent
            component.parentId = newParentId;
            if (newParentId && state.components[newParentId]) {
                const newParent = state.components[newParentId];
                if (index !== undefined) {
                    newParent.children.splice(index, 0, id);
                }
                else {
                    newParent.children.push(id);
                }
            }
            else {
                if (index !== undefined) {
                    state.rootIds.splice(index, 0, id);
                }
                else {
                    state.rootIds.push(id);
                }
            }
        });
        get().pushHistory(`Move component`);
    },
    // Component props and styles
    updateProps: (id, props) => {
        set((state) => {
            if (state.components[id]) {
                state.components[id].props = { ...state.components[id].props, ...props };
            }
        });
    },
    updateStyles: (id, styles, breakpoint = 'base') => {
        set((state) => {
            if (state.components[id]) {
                const component = state.components[id];
                if (!component.styles[breakpoint]) {
                    component.styles[breakpoint] = {};
                }
                Object.assign(component.styles[breakpoint], styles);
            }
        });
    },
    updateBounds: (id, bounds) => {
        set((state) => {
            if (state.components[id]) {
                Object.assign(state.components[id].bounds, bounds);
            }
        });
    },
    // Events
    addEventHandler: (id, handler) => {
        set((state) => {
            if (state.components[id]) {
                state.components[id].events.push(handler);
            }
        });
    },
    updateEventHandler: (id, index, handler) => {
        set((state) => {
            if (state.components[id] && state.components[id].events[index]) {
                state.components[id].events[index] = handler;
            }
        });
    },
    removeEventHandler: (id, index) => {
        set((state) => {
            if (state.components[id]) {
                state.components[id].events.splice(index, 1);
            }
        });
    },
    // Selection
    select: (id, addToSelection = false) => {
        set((state) => {
            if (addToSelection) {
                if (state.selection.selectedIds.includes(id)) {
                    state.selection.selectedIds = state.selection.selectedIds.filter((sid) => sid !== id);
                }
                else {
                    state.selection.selectedIds.push(id);
                }
            }
            else {
                state.selection.selectedIds = [id];
            }
            state.selection.focusedId = id;
        });
    },
    selectMultiple: (ids) => {
        set((state) => {
            state.selection.selectedIds = ids;
            state.selection.focusedId = ids[0] || null;
        });
    },
    clearSelection: () => {
        set((state) => {
            state.selection.selectedIds = [];
            state.selection.focusedId = null;
        });
    },
    setHovered: (id) => {
        set((state) => {
            state.selection.hoveredId = id;
        });
    },
    setFocused: (id) => {
        set((state) => {
            state.selection.focusedId = id;
        });
    },
    // Canvas
    setZoom: (zoom) => {
        set((state) => {
            state.canvas.zoom = Math.max(0.1, Math.min(4, zoom));
        });
    },
    setPan: (pan) => {
        set((state) => {
            state.canvas.pan = pan;
        });
    },
    setGridSize: (size) => {
        set((state) => {
            state.canvas.gridSize = Math.max(1, size);
        });
    },
    toggleSnapToGrid: () => {
        set((state) => {
            state.canvas.snapToGrid = !state.canvas.snapToGrid;
        });
    },
    toggleShowGrid: () => {
        set((state) => {
            state.canvas.showGrid = !state.canvas.showGrid;
        });
    },
    toggleShowGuides: () => {
        set((state) => {
            state.canvas.showGuides = !state.canvas.showGuides;
        });
    },
    zoomIn: () => {
        set((state) => {
            state.canvas.zoom = Math.min(4, state.canvas.zoom * 1.2);
        });
    },
    zoomOut: () => {
        set((state) => {
            state.canvas.zoom = Math.max(0.1, state.canvas.zoom / 1.2);
        });
    },
    resetZoom: () => {
        set((state) => {
            state.canvas.zoom = 1;
            state.canvas.pan = { x: 0, y: 0 };
        });
    },
    fitToScreen: () => {
        // This would require knowing the canvas dimensions
        // For now, just reset to default
        get().resetZoom();
    },
    // Component visibility and locking
    toggleVisibility: (id) => {
        set((state) => {
            if (state.components[id]) {
                state.components[id].isVisible = !state.components[id].isVisible;
            }
        });
    },
    toggleLock: (id) => {
        set((state) => {
            if (state.components[id]) {
                state.components[id].isLocked = !state.components[id].isLocked;
            }
        });
    },
    // History
    undo: () => {
        const state = get();
        if (state.historyIndex <= 0)
            return;
        const newIndex = state.historyIndex - 1;
        const entry = state.history[newIndex];
        if (!entry)
            return;
        set((draft) => {
            draft.components = entry.components;
            draft.historyIndex = newIndex;
        });
    },
    redo: () => {
        const state = get();
        if (state.historyIndex >= state.history.length - 1)
            return;
        const newIndex = state.historyIndex + 1;
        const entry = state.history[newIndex];
        if (!entry)
            return;
        set((draft) => {
            draft.components = entry.components;
            draft.historyIndex = newIndex;
        });
    },
    pushHistory: (description) => {
        set((state) => {
            // Remove any redo entries
            state.history = state.history.slice(0, state.historyIndex + 1);
            // ES2024: structuredClone() is faster and handles more types than JSON.parse/stringify
            const componentsCopy = structuredClone(state.components);
            state.history.push({
                components: componentsCopy,
                timestamp: Date.now(),
                description,
            });
            // Trim history if needed
            if (state.history.length > state.maxHistorySize) {
                state.history = state.history.slice(-state.maxHistorySize);
            }
            state.historyIndex = state.history.length - 1;
        });
    },
    clearHistory: () => {
        set((state) => {
            state.history = [];
            state.historyIndex = -1;
        });
    },
    // Clipboard
    cut: () => {
        const state = get();
        const selectedComponents = state.getSelectedComponents();
        if (selectedComponents.length === 0)
            return;
        set((draft) => {
            draft.clipboard = {
                // ES2024: structuredClone() for deep cloning
                components: structuredClone(selectedComponents),
                type: 'cut',
            };
        });
        // Delete the cut components
        for (const comp of selectedComponents) {
            get().deleteComponent(comp.id);
        }
    },
    copy: () => {
        const selectedComponents = get().getSelectedComponents();
        if (selectedComponents.length === 0)
            return;
        set((state) => {
            state.clipboard = {
                // ES2024: structuredClone() for deep cloning
                components: structuredClone(selectedComponents),
                type: 'copy',
            };
        });
    },
    paste: (parentId = null) => {
        const state = get();
        if (!state.clipboard || state.clipboard.components.length === 0)
            return;
        const targetParentId = parentId ?? state.selection.selectedIds[0] ?? null;
        set((draft) => {
            for (const comp of state.clipboard.components) {
                const newId = generateId();
                const newComp = {
                    ...comp,
                    id: newId,
                    name: `${comp.name} (pasted)`,
                    parentId: targetParentId,
                    children: [],
                    bounds: {
                        ...comp.bounds,
                        x: comp.bounds.x + 20,
                        y: comp.bounds.y + 20,
                    },
                };
                draft.components[newId] = newComp;
                if (targetParentId && draft.components[targetParentId]) {
                    draft.components[targetParentId].children.push(newId);
                }
                else {
                    draft.rootIds.push(newId);
                }
            }
        });
        get().pushHistory('Paste components');
    },
    // Drag and drop
    setDragging: (isDragging) => {
        set((state) => {
            state.isDragging = isDragging;
        });
    },
    setDragSource: (source) => {
        set((state) => {
            state.dragSource = source;
        });
    },
    // Breakpoints
    setActiveBreakpoint: (breakpoint) => {
        set((state) => {
            state.activeBreakpoint = breakpoint;
        });
    },
    // Bulk operations
    clear: () => {
        set((state) => {
            state.components = {};
            state.rootIds = [];
            state.selection.selectedIds = [];
            state.selection.hoveredId = null;
            state.selection.focusedId = null;
        });
        get().pushHistory('Clear canvas');
    },
    loadState: (newState) => {
        set((state) => {
            Object.assign(state, newState);
        });
    },
    getComponent: (id) => {
        return get().components[id];
    },
    getSelectedComponents: () => {
        const state = get();
        return state.selection.selectedIds
            .map((id) => state.components[id])
            .filter((comp) => comp !== undefined);
    },
    getChildren: (id) => {
        const state = get();
        const component = state.components[id];
        if (!component)
            return [];
        return component.children
            .map((childId) => state.components[childId])
            .filter((comp) => comp !== undefined);
    },
    getAncestors: (id) => {
        const state = get();
        const ancestors = [];
        let current = state.components[id];
        while (current?.parentId) {
            const parent = state.components[current.parentId];
            if (parent) {
                ancestors.push(parent);
                current = parent;
            }
            else {
                break;
            }
        }
        return ancestors;
    },
}))));
// ============================================================================
// Selectors
// ============================================================================
export const selectComponents = (state) => state.components;
export const selectRootIds = (state) => state.rootIds;
export const selectCanvas = (state) => state.canvas;
export const selectSelection = (state) => state.selection;
export const selectSelectedIds = (state) => state.selection.selectedIds;
export const selectZoom = (state) => state.canvas.zoom;
export const selectPan = (state) => state.canvas.pan;
export const selectActiveBreakpoint = (state) => state.activeBreakpoint;
export const selectIsDragging = (state) => state.isDragging;
export const selectClipboard = (state) => state.clipboard;
export const selectCanUndo = (state) => state.historyIndex > 0;
export const selectCanRedo = (state) => state.historyIndex < state.history.length - 1;
// ============================================================================
// Hooks
// ============================================================================
export const useComponent = (id) => {
    return useEditorStore((state) => state.components[id]);
};
export const useSelectedComponents = () => {
    return useEditorStore((state) => state.selection.selectedIds
        .map((id) => state.components[id])
        .filter((comp) => comp !== undefined));
};
export const useIsSelected = (id) => {
    return useEditorStore((state) => state.selection.selectedIds.includes(id));
};
export const useIsHovered = (id) => {
    return useEditorStore((state) => state.selection.hoveredId === id);
};
export const useCanvas = () => {
    return useEditorStore((state) => state.canvas);
};
export const useEditorActions = () => {
    const store = useEditorStore();
    return {
        addComponent: store.addComponent,
        updateComponent: store.updateComponent,
        deleteComponent: store.deleteComponent,
        duplicateComponent: store.duplicateComponent,
        moveComponent: store.moveComponent,
        updateProps: store.updateProps,
        updateStyles: store.updateStyles,
        updateBounds: store.updateBounds,
        select: store.select,
        selectMultiple: store.selectMultiple,
        clearSelection: store.clearSelection,
        setHovered: store.setHovered,
        setZoom: store.setZoom,
        setPan: store.setPan,
        toggleSnapToGrid: store.toggleSnapToGrid,
        toggleShowGrid: store.toggleShowGrid,
        undo: store.undo,
        redo: store.redo,
        cut: store.cut,
        copy: store.copy,
        paste: store.paste,
    };
};
//# sourceMappingURL=EditorStore.js.map