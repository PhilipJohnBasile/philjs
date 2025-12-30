import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { subscribeWithSelector } from 'zustand/middleware';

// ============================================================================
// Types
// ============================================================================

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
  // Layout
  display?: string;
  flexDirection?: string;
  justifyContent?: string;
  alignItems?: string;
  gap?: number | string;

  // Spacing
  padding?: SpacingValue | number | string;
  margin?: SpacingValue | number | string;

  // Size
  width?: number | string;
  height?: number | string;
  minWidth?: number | string;
  maxWidth?: number | string;
  minHeight?: number | string;
  maxHeight?: number | string;

  // Colors
  backgroundColor?: string;
  color?: string;
  borderColor?: string;

  // Border
  borderWidth?: number | string;
  borderRadius?: number | string;
  borderStyle?: string;

  // Typography
  typography?: TypographyStyle;

  // Effects
  opacity?: number;
  boxShadow?: string;

  // Custom CSS
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
  // Components
  components: Record<string, ComponentNode>;
  rootIds: string[];

  // Canvas
  canvas: CanvasState;

  // Selection
  selection: SelectionState;

  // History
  history: HistoryEntry[];
  historyIndex: number;
  maxHistorySize: number;

  // Clipboard
  clipboard: ClipboardData | null;

  // Current breakpoint for responsive editing
  activeBreakpoint: Breakpoint;

  // Drag state
  isDragging: boolean;
  dragSource: { type: 'palette' | 'canvas'; componentType?: string; componentId?: string } | null;
}

export interface EditorActions {
  // Component CRUD
  addComponent: (type: string, parentId: string | null, position?: Position) => string;
  updateComponent: (id: string, updates: Partial<ComponentNode>) => void;
  deleteComponent: (id: string) => void;
  duplicateComponent: (id: string) => string;
  moveComponent: (id: string, newParentId: string | null, index?: number) => void;

  // Component props and styles
  updateProps: (id: string, props: Record<string, unknown>) => void;
  updateStyles: (id: string, styles: Partial<ComponentStyle>, breakpoint?: Breakpoint) => void;
  updateBounds: (id: string, bounds: Partial<Bounds>) => void;

  // Events
  addEventHandler: (id: string, handler: EventHandler) => void;
  updateEventHandler: (id: string, index: number, handler: EventHandler) => void;
  removeEventHandler: (id: string, index: number) => void;

  // Selection
  select: (id: string, addToSelection?: boolean) => void;
  selectMultiple: (ids: string[]) => void;
  clearSelection: () => void;
  setHovered: (id: string | null) => void;
  setFocused: (id: string | null) => void;

  // Canvas
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

  // Component visibility and locking
  toggleVisibility: (id: string) => void;
  toggleLock: (id: string) => void;

  // History
  undo: () => void;
  redo: () => void;
  pushHistory: (description: string) => void;
  clearHistory: () => void;

  // Clipboard
  cut: () => void;
  copy: () => void;
  paste: (parentId?: string | null) => void;

  // Drag and drop
  setDragging: (isDragging: boolean) => void;
  setDragSource: (source: EditorState['dragSource']) => void;

  // Breakpoints
  setActiveBreakpoint: (breakpoint: Breakpoint) => void;

  // Bulk operations
  clear: () => void;
  loadState: (state: Partial<EditorState>) => void;
  getComponent: (id: string) => ComponentNode | undefined;
  getSelectedComponents: () => ComponentNode[];
  getChildren: (id: string) => ComponentNode[];
  getAncestors: (id: string) => ComponentNode[];
}

// ============================================================================
// Helper Functions
// ============================================================================

const generateId = (): string => {
  return `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const getDefaultBounds = (type: string): Bounds => {
  const defaults: Record<string, Bounds> = {
    Button: { x: 0, y: 0, width: 120, height: 40 },
    Text: { x: 0, y: 0, width: 200, height: 24 },
    Input: { x: 0, y: 0, width: 200, height: 40 },
    Container: { x: 0, y: 0, width: 400, height: 300 },
    Card: { x: 0, y: 0, width: 320, height: 200 },
    Image: { x: 0, y: 0, width: 200, height: 150 },
    default: { x: 0, y: 0, width: 100, height: 100 },
  };
  return defaults[type] ?? defaults['default']!;
};

const getDefaultProps = (type: string): Record<string, unknown> => {
  const defaults: Record<string, Record<string, unknown>> = {
    Button: { children: 'Button', variant: 'primary' },
    Text: { children: 'Text content' },
    Input: { placeholder: 'Enter text...' },
    Container: { className: '' },
    Card: { title: 'Card Title' },
    Image: { src: '', alt: 'Image' },
    default: {},
  };
  return defaults[type] ?? defaults['default']!;
};

const cloneComponent = (
  component: ComponentNode,
  newId: string,
  newParentId: string | null
): ComponentNode => {
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

const deepCloneComponents = (
  components: Record<string, ComponentNode>,
  rootId: string,
  newParentId: string | null,
  idMap: Map<string, string>
): ComponentNode[] => {
  const result: ComponentNode[] = [];
  const original = components[rootId];
  if (!original) return result;

  const newId = generateId();
  idMap.set(rootId, newId);

  const cloned = cloneComponent(original, newId, newParentId);

  // Clone children recursively
  const newChildren: string[] = [];
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

const initialState: EditorState = {
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

export const useEditorStore = create<EditorState & EditorActions>()(
  subscribeWithSelector(
    immer((set, get) => ({
      ...initialState,

      // Component CRUD
      addComponent: (type: string, parentId: string | null, position?: Position): string => {
        const id = generateId();
        const bounds = getDefaultBounds(type);
        if (position) {
          bounds.x = position.x;
          bounds.y = position.y;
        }

        const component: ComponentNode = {
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
          } else {
            state.rootIds.push(id);
          }
        });

        get().pushHistory(`Add ${type}`);
        return id;
      },

      updateComponent: (id: string, updates: Partial<ComponentNode>) => {
        set((state) => {
          if (state.components[id]) {
            Object.assign(state.components[id], updates);
          }
        });
      },

      deleteComponent: (id: string) => {
        const state = get();
        const component = state.components[id];
        if (!component) return;

        // Recursively collect all descendant IDs
        const collectDescendants = (compId: string): string[] => {
          const comp = state.components[compId];
          if (!comp) return [];
          return [compId, ...comp.children.flatMap(collectDescendants)];
        };

        const idsToDelete = collectDescendants(id);

        set((draft) => {
          // Remove from parent's children
          if (component.parentId && draft.components[component.parentId]) {
            const parent = draft.components[component.parentId]!;
            parent.children = parent.children.filter((childId) => childId !== id);
          } else {
            draft.rootIds = draft.rootIds.filter((rootId) => rootId !== id);
          }

          // Delete all components
          for (const deleteId of idsToDelete) {
            delete draft.components[deleteId];
          }

          // Clear selection if deleted
          draft.selection.selectedIds = draft.selection.selectedIds.filter(
            (selectedId) => !idsToDelete.includes(selectedId)
          );
        });

        get().pushHistory(`Delete component`);
      },

      duplicateComponent: (id: string): string => {
        const state = get();
        const component = state.components[id];
        if (!component) return '';

        const idMap = new Map<string, string>();
        const clones = deepCloneComponents(state.components, id, component.parentId, idMap);

        if (clones.length === 0) return '';

        set((draft) => {
          for (const clone of clones) {
            draft.components[clone.id] = clone;
          }

          const rootClone = clones[0]!;
          if (component.parentId && draft.components[component.parentId]) {
            draft.components[component.parentId]!.children.push(rootClone.id);
          } else {
            draft.rootIds.push(rootClone.id);
          }
        });

        get().pushHistory(`Duplicate ${component.type}`);
        return clones[0]!.id;
      },

      moveComponent: (id: string, newParentId: string | null, index?: number) => {
        set((state) => {
          const component = state.components[id];
          if (!component) return;

          // Prevent moving to self or descendant
          const isDescendant = (ancestorId: string, descendantId: string): boolean => {
            const comp = state.components[descendantId];
            if (!comp || !comp.parentId) return false;
            if (comp.parentId === ancestorId) return true;
            return isDescendant(ancestorId, comp.parentId);
          };

          if (newParentId && (newParentId === id || isDescendant(id, newParentId))) {
            return;
          }

          // Remove from current parent
          if (component.parentId && state.components[component.parentId]) {
            const oldParent = state.components[component.parentId]!;
            oldParent.children = oldParent.children.filter((childId) => childId !== id);
          } else {
            state.rootIds = state.rootIds.filter((rootId) => rootId !== id);
          }

          // Add to new parent
          component.parentId = newParentId;
          if (newParentId && state.components[newParentId]) {
            const newParent = state.components[newParentId];
            if (index !== undefined) {
              newParent.children.splice(index, 0, id);
            } else {
              newParent.children.push(id);
            }
          } else {
            if (index !== undefined) {
              state.rootIds.splice(index, 0, id);
            } else {
              state.rootIds.push(id);
            }
          }
        });

        get().pushHistory(`Move component`);
      },

      // Component props and styles
      updateProps: (id: string, props: Record<string, unknown>) => {
        set((state) => {
          if (state.components[id]) {
            state.components[id].props = { ...state.components[id].props, ...props };
          }
        });
      },

      updateStyles: (id: string, styles: Partial<ComponentStyle>, breakpoint: Breakpoint = 'base') => {
        set((state) => {
          if (state.components[id]) {
            const component = state.components[id];
            if (!component.styles[breakpoint]) {
              component.styles[breakpoint] = {};
            }
            Object.assign(component.styles[breakpoint]!, styles);
          }
        });
      },

      updateBounds: (id: string, bounds: Partial<Bounds>) => {
        set((state) => {
          if (state.components[id]) {
            Object.assign(state.components[id].bounds, bounds);
          }
        });
      },

      // Events
      addEventHandler: (id: string, handler: EventHandler) => {
        set((state) => {
          if (state.components[id]) {
            state.components[id].events.push(handler);
          }
        });
      },

      updateEventHandler: (id: string, index: number, handler: EventHandler) => {
        set((state) => {
          if (state.components[id] && state.components[id].events[index]) {
            state.components[id].events[index] = handler;
          }
        });
      },

      removeEventHandler: (id: string, index: number) => {
        set((state) => {
          if (state.components[id]) {
            state.components[id].events.splice(index, 1);
          }
        });
      },

      // Selection
      select: (id: string, addToSelection = false) => {
        set((state) => {
          if (addToSelection) {
            if (state.selection.selectedIds.includes(id)) {
              state.selection.selectedIds = state.selection.selectedIds.filter((sid) => sid !== id);
            } else {
              state.selection.selectedIds.push(id);
            }
          } else {
            state.selection.selectedIds = [id];
          }
          state.selection.focusedId = id;
        });
      },

      selectMultiple: (ids: string[]) => {
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

      setHovered: (id: string | null) => {
        set((state) => {
          state.selection.hoveredId = id;
        });
      },

      setFocused: (id: string | null) => {
        set((state) => {
          state.selection.focusedId = id;
        });
      },

      // Canvas
      setZoom: (zoom: number) => {
        set((state) => {
          state.canvas.zoom = Math.max(0.1, Math.min(4, zoom));
        });
      },

      setPan: (pan: Position) => {
        set((state) => {
          state.canvas.pan = pan;
        });
      },

      setGridSize: (size: number) => {
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
      toggleVisibility: (id: string) => {
        set((state) => {
          if (state.components[id]) {
            state.components[id].isVisible = !state.components[id].isVisible;
          }
        });
      },

      toggleLock: (id: string) => {
        set((state) => {
          if (state.components[id]) {
            state.components[id].isLocked = !state.components[id].isLocked;
          }
        });
      },

      // History
      undo: () => {
        const state = get();
        if (state.historyIndex <= 0) return;

        const newIndex = state.historyIndex - 1;
        const entry = state.history[newIndex];
        if (!entry) return;

        set((draft) => {
          draft.components = entry.components;
          draft.historyIndex = newIndex;
        });
      },

      redo: () => {
        const state = get();
        if (state.historyIndex >= state.history.length - 1) return;

        const newIndex = state.historyIndex + 1;
        const entry = state.history[newIndex];
        if (!entry) return;

        set((draft) => {
          draft.components = entry.components;
          draft.historyIndex = newIndex;
        });
      },

      pushHistory: (description: string) => {
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
        if (selectedComponents.length === 0) return;

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
        if (selectedComponents.length === 0) return;

        set((state) => {
          state.clipboard = {
            // ES2024: structuredClone() for deep cloning
            components: structuredClone(selectedComponents),
            type: 'copy',
          };
        });
      },

      paste: (parentId: string | null = null) => {
        const state = get();
        if (!state.clipboard || state.clipboard.components.length === 0) return;

        const targetParentId = parentId ?? state.selection.selectedIds[0] ?? null;

        set((draft) => {
          for (const comp of state.clipboard!.components) {
            const newId = generateId();
            const newComp: ComponentNode = {
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
            } else {
              draft.rootIds.push(newId);
            }
          }
        });

        get().pushHistory('Paste components');
      },

      // Drag and drop
      setDragging: (isDragging: boolean) => {
        set((state) => {
          state.isDragging = isDragging;
        });
      },

      setDragSource: (source: EditorState['dragSource']) => {
        set((state) => {
          state.dragSource = source;
        });
      },

      // Breakpoints
      setActiveBreakpoint: (breakpoint: Breakpoint) => {
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

      loadState: (newState: Partial<EditorState>) => {
        set((state) => {
          Object.assign(state, newState);
        });
      },

      getComponent: (id: string): ComponentNode | undefined => {
        return get().components[id];
      },

      getSelectedComponents: (): ComponentNode[] => {
        const state = get();
        return state.selection.selectedIds
          .map((id) => state.components[id])
          .filter((comp): comp is ComponentNode => comp !== undefined);
      },

      getChildren: (id: string): ComponentNode[] => {
        const state = get();
        const component = state.components[id];
        if (!component) return [];
        return component.children
          .map((childId) => state.components[childId])
          .filter((comp): comp is ComponentNode => comp !== undefined);
      },

      getAncestors: (id: string): ComponentNode[] => {
        const state = get();
        const ancestors: ComponentNode[] = [];
        let current = state.components[id];

        while (current?.parentId) {
          const parent = state.components[current.parentId];
          if (parent) {
            ancestors.push(parent);
            current = parent;
          } else {
            break;
          }
        }

        return ancestors;
      },
    }))
  )
);

// ============================================================================
// Selectors
// ============================================================================

export const selectComponents = (state: EditorState) => state.components;
export const selectRootIds = (state: EditorState) => state.rootIds;
export const selectCanvas = (state: EditorState) => state.canvas;
export const selectSelection = (state: EditorState) => state.selection;
export const selectSelectedIds = (state: EditorState) => state.selection.selectedIds;
export const selectZoom = (state: EditorState) => state.canvas.zoom;
export const selectPan = (state: EditorState) => state.canvas.pan;
export const selectActiveBreakpoint = (state: EditorState) => state.activeBreakpoint;
export const selectIsDragging = (state: EditorState) => state.isDragging;
export const selectClipboard = (state: EditorState) => state.clipboard;
export const selectCanUndo = (state: EditorState) => state.historyIndex > 0;
export const selectCanRedo = (state: EditorState) => state.historyIndex < state.history.length - 1;

// ============================================================================
// Hooks
// ============================================================================

export const useComponent = (id: string) => {
  return useEditorStore((state) => state.components[id]);
};

export const useSelectedComponents = () => {
  return useEditorStore((state) =>
    state.selection.selectedIds
      .map((id) => state.components[id])
      .filter((comp): comp is ComponentNode => comp !== undefined)
  );
};

export const useIsSelected = (id: string) => {
  return useEditorStore((state) => state.selection.selectedIds.includes(id));
};

export const useIsHovered = (id: string) => {
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
