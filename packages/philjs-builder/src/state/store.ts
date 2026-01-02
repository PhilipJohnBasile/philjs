/**
 * Builder state store using PhilJS signals
 */

import { signal, memo, batch, effect } from '@philjs/core';
import type {
  BuilderState,
  BuilderAction,
  ComponentNode,
  NodeId,
  ComponentDefinition,
  ComponentCategory,
  SelectionState,
  DragState,
  ResizeState,
  ViewportState,
  CanvasSettings,
  DocumentMetadata,
  PropValue,
  NodeStyles,
  DragSource,
  DropTarget,
  ResizeHandle,
  BoundingBox,
  BuilderEvents,
  BuilderEventListener,
} from '../types.js';
import { createHistoryManager, type HistoryManager } from './history.js';

// ============================================================================
// Default Values
// ============================================================================

const createDefaultDocument = (): DocumentMetadata => ({
  id: generateId(),
  name: 'Untitled',
  version: '1.0.0',
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

const createDefaultRootNode = (): ComponentNode => ({
  id: 'root',
  type: 'Frame',
  name: 'Root',
  props: {},
  styles: {
    display: 'flex',
    flexDirection: 'column',
    width: { value: 100, unit: '%' },
    height: { value: 100, unit: '%' },
    backgroundColor: '#ffffff',
  },
  children: [],
  parentId: null,
  events: [],
});

const defaultSelectionState: SelectionState = {
  selectedIds: [],
  hoveredId: null,
  focusedId: null,
  boundingBox: null,
  multiSelect: false,
};

const defaultDragState: DragState = {
  isDragging: false,
  source: null,
  target: null,
  position: { x: 0, y: 0 },
  offset: { x: 0, y: 0 },
  preview: null,
};

const defaultResizeState: ResizeState = {
  isResizing: false,
  handle: null,
  initialBounds: null,
  currentBounds: null,
  maintainAspectRatio: false,
};

const defaultViewportState: ViewportState = {
  zoom: 1,
  panX: 0,
  panY: 0,
  canvasWidth: 1200,
  canvasHeight: 800,
};

const defaultCanvasSettings: CanvasSettings = {
  width: 1200,
  height: 800,
  backgroundColor: '#f5f5f5',
  grid: {
    enabled: true,
    size: 8,
    snapToGrid: true,
    showGuides: true,
    color: '#e0e0e0',
  },
  rulers: true,
  zoom: {
    min: 0.1,
    max: 4,
    step: 0.1,
  },
};

const defaultUIState: BuilderState['ui'] = {
  leftPanelWidth: 280,
  rightPanelWidth: 320,
  leftPanelCollapsed: false,
  rightPanelCollapsed: false,
  activeTab: 'layers',
  inspectorTab: 'props',
};

const defaultPreviewState: BuilderState['preview'] = {
  isOpen: false,
  device: 'desktop',
  darkMode: false,
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `node_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Deep clone a node and its children with new IDs
 */
function cloneNodeWithNewIds(
  node: ComponentNode,
  nodes: Record<NodeId, ComponentNode>,
  newParentId: NodeId | null
): { clonedNode: ComponentNode; clonedNodes: Record<NodeId, ComponentNode> } {
  const newId = generateId();
  const clonedNodes: Record<NodeId, ComponentNode> = {};

  const clonedNode: ComponentNode = {
    ...node,
    id: newId,
    parentId: newParentId,
    props: { ...node.props },
    styles: { ...node.styles },
    events: [...node.events],
    children: [],
  };

  // Clone children recursively
  for (const childId of node.children) {
    const childNode = nodes[childId];
    if (childNode) {
      const { clonedNode: clonedChild, clonedNodes: childClonedNodes } = cloneNodeWithNewIds(
        childNode,
        nodes,
        newId
      );
      clonedNode.children.push(clonedChild.id);
      clonedNodes[clonedChild.id] = clonedChild;
      Object.assign(clonedNodes, childClonedNodes);
    }
  }

  clonedNodes[newId] = clonedNode;
  return { clonedNode, clonedNodes };
}

/**
 * Get all descendant IDs of a node
 */
function getDescendantIds(nodeId: NodeId, nodes: Record<NodeId, ComponentNode>): NodeId[] {
  const node = nodes[nodeId];
  if (!node) return [];

  const descendants: NodeId[] = [];
  for (const childId of node.children) {
    descendants.push(childId);
    descendants.push(...getDescendantIds(childId, nodes));
  }
  return descendants;
}

/**
 * Remove a node and its descendants from the nodes map
 */
function removeNodeAndDescendants(
  nodeId: NodeId,
  nodes: Record<NodeId, ComponentNode>
): Record<NodeId, ComponentNode> {
  const idsToRemove = new Set([nodeId, ...getDescendantIds(nodeId, nodes)]);
  const newNodes: Record<NodeId, ComponentNode> = {};

  for (const [id, node] of Object.entries(nodes)) {
    if (!idsToRemove.has(id)) {
      // Remove the deleted node from children arrays
      newNodes[id] = {
        ...node,
        children: node.children.filter((childId) => !idsToRemove.has(childId)),
      };
    }
  }

  return newNodes;
}

// ============================================================================
// Builder Store
// ============================================================================

export interface BuilderStore {
  // State signals
  document: ReturnType<typeof signal<DocumentMetadata>>;
  nodes: ReturnType<typeof signal<Record<NodeId, ComponentNode>>>;
  rootId: ReturnType<typeof signal<NodeId>>;
  selection: ReturnType<typeof signal<SelectionState>>;
  drag: ReturnType<typeof signal<DragState>>;
  resize: ReturnType<typeof signal<ResizeState>>;
  viewport: ReturnType<typeof signal<ViewportState>>;
  canvas: ReturnType<typeof signal<CanvasSettings>>;
  components: ReturnType<typeof signal<Record<string, ComponentDefinition>>>;
  categories: ReturnType<typeof signal<ComponentCategory[]>>;
  ui: ReturnType<typeof signal<BuilderState['ui']>>;
  preview: ReturnType<typeof signal<BuilderState['preview']>>;

  // Clipboard
  clipboard: ReturnType<typeof signal<ComponentNode[]>>;

  // History manager
  history: HistoryManager;

  // Computed values
  selectedNodes: ReturnType<typeof memo<ComponentNode[]>>;
  canUndo: ReturnType<typeof memo<boolean>>;
  canRedo: ReturnType<typeof memo<boolean>>;

  // Actions
  dispatch: (action: BuilderAction) => void;
  getState: () => BuilderState;

  // Node operations
  getNode: (id: NodeId) => ComponentNode | undefined;
  getChildren: (id: NodeId) => ComponentNode[];
  getParent: (id: NodeId) => ComponentNode | undefined;
  getAncestors: (id: NodeId) => ComponentNode[];
  getDescendants: (id: NodeId) => ComponentNode[];

  // Event system
  on: <K extends keyof BuilderEvents>(event: K, listener: BuilderEventListener<K>) => () => void;
  emit: <K extends keyof BuilderEvents>(event: K, payload: BuilderEvents[K]) => void;

  // Cleanup
  dispose: () => void;
}

/**
 * Create a new builder store
 */
export function createBuilderStore(initialState?: Partial<BuilderState>): BuilderStore {
  // Initialize state signals
  const rootNode = createDefaultRootNode();
  const document = signal(initialState?.document ?? createDefaultDocument());
  const nodes = signal<Record<NodeId, ComponentNode>>(
    initialState?.nodes ?? { [rootNode.id]: rootNode }
  );
  const rootId = signal<NodeId>(initialState?.rootId ?? rootNode.id);
  const selection = signal<SelectionState>(initialState?.selection ?? defaultSelectionState);
  const drag = signal<DragState>(initialState?.drag ?? defaultDragState);
  const resize = signal<ResizeState>(initialState?.resize ?? defaultResizeState);
  const viewport = signal<ViewportState>(initialState?.viewport ?? defaultViewportState);
  const canvas = signal<CanvasSettings>(initialState?.canvas ?? defaultCanvasSettings);
  const components = signal<Record<string, ComponentDefinition>>(initialState?.components ?? {});
  const categories = signal<ComponentCategory[]>(initialState?.categories ?? []);
  const ui = signal<BuilderState['ui']>(initialState?.ui ?? defaultUIState);
  const preview = signal<BuilderState['preview']>(initialState?.preview ?? defaultPreviewState);
  const clipboard = signal<ComponentNode[]>([]);

  // Event listeners
  const eventListeners = new Map<string, Set<Function>>();

  // History manager
  const history = createHistoryManager({
    maxEntries: 100,
    onUndo: (entry) => {
      batch(() => {
        if (entry.before.nodes) nodes.set(entry.before.nodes);
        if (entry.before.rootId) rootId.set(entry.before.rootId);
      });
    },
    onRedo: (entry) => {
      batch(() => {
        if (entry.after.nodes) nodes.set(entry.after.nodes);
        if (entry.after.rootId) rootId.set(entry.after.rootId);
      });
    },
  });

  // Computed values
  const selectedNodes = memo(() => {
    const sel = selection();
    const nodeMap = nodes();
    return sel.selectedIds.map((id) => nodeMap[id]).filter(Boolean) as ComponentNode[];
  });

  const canUndo = memo(() => history.canUndo());
  const canRedo = memo(() => history.canRedo());

  // Helper functions
  const getNode = (id: NodeId): ComponentNode | undefined => nodes()[id];

  const getChildren = (id: NodeId): ComponentNode[] => {
    const node = getNode(id);
    if (!node) return [];
    return node.children.map((childId) => nodes()[childId]).filter(Boolean) as ComponentNode[];
  };

  const getParent = (id: NodeId): ComponentNode | undefined => {
    const node = getNode(id);
    if (!node || !node.parentId) return undefined;
    return getNode(node.parentId);
  };

  const getAncestors = (id: NodeId): ComponentNode[] => {
    const ancestors: ComponentNode[] = [];
    let current = getParent(id);
    while (current) {
      ancestors.push(current);
      current = current.parentId ? getNode(current.parentId) : undefined;
    }
    return ancestors;
  };

  const getDescendants = (id: NodeId): ComponentNode[] => {
    const node = getNode(id);
    if (!node) return [];

    const descendants: ComponentNode[] = [];
    const processNode = (nodeId: NodeId) => {
      const n = getNode(nodeId);
      if (n) {
        for (const childId of n.children) {
          const child = getNode(childId);
          if (child) {
            descendants.push(child);
            processNode(childId);
          }
        }
      }
    };
    processNode(id);
    return descendants;
  };

  // Event system
  const on = <K extends keyof BuilderEvents>(
    event: K,
    listener: BuilderEventListener<K>
  ): (() => void) => {
    if (!eventListeners.has(event)) {
      eventListeners.set(event, new Set());
    }
    eventListeners.get(event)!.add(listener);
    return () => {
      eventListeners.get(event)?.delete(listener);
    };
  };

  const emit = <K extends keyof BuilderEvents>(event: K, payload: BuilderEvents[K]): void => {
    eventListeners.get(event)?.forEach((listener) => {
      try {
        listener(payload);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  };

  // Record history for node operations
  const recordHistory = (description: string, type: string) => {
    const currentNodes = nodes();
    const currentRootId = rootId();
    return (afterNodes?: Record<NodeId, ComponentNode>, afterRootId?: NodeId) => {
      history.push({
        id: generateId(),
        type: type as any,
        timestamp: Date.now(),
        description,
        before: { nodes: currentNodes, rootId: currentRootId },
        after: { nodes: afterNodes ?? nodes(), rootId: afterRootId ?? rootId() },
      });
    };
  };

  // Get current state
  const getState = (): BuilderState => ({
    document: document(),
    nodes: nodes(),
    rootId: rootId(),
    selection: selection(),
    drag: drag(),
    resize: resize(),
    viewport: viewport(),
    canvas: canvas(),
    components: components(),
    categories: categories(),
    ui: ui(),
    preview: preview(),
  });

  // Action dispatcher
  const dispatch = (action: BuilderAction): void => {
    switch (action.type) {
      case 'ADD_NODE': {
        const { node, parentId, index } = action.payload;
        const record = recordHistory(`Add ${node.type}`, 'add_node');

        batch(() => {
          const currentNodes = nodes();
          const parent = currentNodes[parentId];

          if (!parent) {
            console.error(`Parent node ${parentId} not found`);
            return;
          }

          const newChildren = [...parent.children];
          if (index !== undefined && index >= 0 && index <= newChildren.length) {
            newChildren.splice(index, 0, node.id);
          } else {
            newChildren.push(node.id);
          }

          nodes.set({
            ...currentNodes,
            [node.id]: { ...node, parentId },
            [parentId]: { ...parent, children: newChildren },
          });
        });

        record();
        emit('node:added', { node: action.payload.node });
        break;
      }

      case 'DELETE_NODE': {
        const { nodeId } = action.payload;
        if (nodeId === rootId()) {
          console.error('Cannot delete root node');
          return;
        }

        const record = recordHistory(`Delete node`, 'delete_node');

        batch(() => {
          const currentNodes = nodes();
          const node = currentNodes[nodeId];

          if (!node) return;

          // Remove from parent's children
          if (node.parentId) {
            const parent = currentNodes[node.parentId];
            if (parent) {
              currentNodes[node.parentId] = {
                ...parent,
                children: parent.children.filter((id) => id !== nodeId),
              };
            }
          }

          nodes.set(removeNodeAndDescendants(nodeId, currentNodes));

          // Update selection
          const currentSelection = selection();
          if (currentSelection.selectedIds.includes(nodeId)) {
            selection.set({
              ...currentSelection,
              selectedIds: currentSelection.selectedIds.filter((id) => id !== nodeId),
            });
          }
        });

        record();
        emit('node:deleted', { nodeId });
        break;
      }

      case 'DELETE_NODES': {
        const { nodeIds } = action.payload;
        const validIds = nodeIds.filter((id) => id !== rootId());

        if (validIds.length === 0) return;

        const record = recordHistory(`Delete ${validIds.length} nodes`, 'delete_node');

        batch(() => {
          let currentNodes = nodes();

          for (const nodeId of validIds) {
            const node = currentNodes[nodeId];
            if (!node) continue;

            // Remove from parent's children
            if (node.parentId && currentNodes[node.parentId]) {
              const parent = currentNodes[node.parentId]!;
              currentNodes = {
                ...currentNodes,
                [node.parentId]: {
                  ...parent,
                  children: parent.children.filter((id) => id !== nodeId),
                },
              };
            }

            currentNodes = removeNodeAndDescendants(nodeId, currentNodes);
          }

          nodes.set(currentNodes);

          // Update selection
          selection.set({
            ...selection(),
            selectedIds: [],
          });
        });

        record();
        break;
      }

      case 'MOVE_NODE': {
        const { nodeId, newParentId, index } = action.payload;

        if (nodeId === rootId()) {
          console.error('Cannot move root node');
          return;
        }

        const record = recordHistory(`Move node`, 'move_node');

        batch(() => {
          const currentNodes = { ...nodes() };
          const node = currentNodes[nodeId];
          const newParent = currentNodes[newParentId];

          if (!node || !newParent) return;

          const oldParentId = node.parentId;

          // Remove from old parent
          if (oldParentId && currentNodes[oldParentId]) {
            const oldParent = currentNodes[oldParentId];
            currentNodes[oldParentId] = {
              ...oldParent,
              children: oldParent.children.filter((id) => id !== nodeId),
            };
          }

          // Add to new parent
          const newChildren = [...newParent.children];
          if (index !== undefined && index >= 0 && index <= newChildren.length) {
            newChildren.splice(index, 0, nodeId);
          } else {
            newChildren.push(nodeId);
          }

          currentNodes[newParentId] = { ...newParent, children: newChildren };
          currentNodes[nodeId] = { ...node, parentId: newParentId };

          nodes.set(currentNodes);

          if (oldParentId) {
            emit('node:moved', { nodeId, oldParentId, newParentId });
          }
        });

        record();
        break;
      }

      case 'UPDATE_NODE_PROPS': {
        const { nodeId, props: newProps } = action.payload;
        const record = recordHistory(`Update props`, 'update_props');

        const currentNodes = nodes();
        const node = currentNodes[nodeId];

        if (!node) return;

        nodes.set({
          ...currentNodes,
          [nodeId]: {
            ...node,
            props: { ...node.props, ...newProps },
          },
        });

        record();
        emit('node:updated', { nodeId, changes: { props: newProps } });
        break;
      }

      case 'UPDATE_NODE_STYLES': {
        const { nodeId, styles: newStyles } = action.payload;
        const record = recordHistory(`Update styles`, 'update_styles');

        const currentNodes = nodes();
        const node = currentNodes[nodeId];

        if (!node) return;

        nodes.set({
          ...currentNodes,
          [nodeId]: {
            ...node,
            styles: { ...node.styles, ...newStyles },
          },
        });

        record();
        emit('node:updated', { nodeId, changes: { styles: newStyles } });
        break;
      }

      case 'UPDATE_NODE_NAME': {
        const { nodeId, name } = action.payload;

        const currentNodes = nodes();
        const node = currentNodes[nodeId];

        if (!node) return;

        nodes.set({
          ...currentNodes,
          [nodeId]: { ...node, name },
        });
        break;
      }

      case 'DUPLICATE_NODE': {
        const { nodeId } = action.payload;
        const currentNodes = nodes();
        const node = currentNodes[nodeId];

        if (!node || !node.parentId) return;

        const record = recordHistory(`Duplicate node`, 'duplicate');

        const { clonedNode, clonedNodes } = cloneNodeWithNewIds(node, currentNodes, node.parentId);
        const parent = currentNodes[node.parentId]!;
        const nodeIndex = parent.children.indexOf(nodeId);

        batch(() => {
          const newChildren = [...parent.children];
          newChildren.splice(nodeIndex + 1, 0, clonedNode.id);

          nodes.set({
            ...currentNodes,
            ...clonedNodes,
            [node.parentId!]: { ...parent, children: newChildren },
          } as Record<NodeId, ComponentNode>);

          selection.set({
            ...selection(),
            selectedIds: [clonedNode.id],
          });
        });

        record();
        break;
      }

      case 'DUPLICATE_NODES': {
        const { nodeIds } = action.payload;
        const currentNodes = nodes();
        const record = recordHistory(`Duplicate ${nodeIds.length} nodes`, 'duplicate');

        batch(() => {
          let updatedNodes = { ...currentNodes };
          const newSelectedIds: NodeId[] = [];

          for (const nodeId of nodeIds) {
            const node = updatedNodes[nodeId];
            if (!node || !node.parentId) continue;

            const { clonedNode, clonedNodes } = cloneNodeWithNewIds(node, updatedNodes, node.parentId);
            const parent = updatedNodes[node.parentId]!;
            const nodeIndex = parent.children.indexOf(nodeId);

            const newChildren = [...parent.children];
            newChildren.splice(nodeIndex + 1, 0, clonedNode.id);

            updatedNodes = {
              ...updatedNodes,
              ...clonedNodes,
              [node.parentId]: { ...parent, children: newChildren },
            } as Record<NodeId, ComponentNode>;

            newSelectedIds.push(clonedNode.id);
          }

          nodes.set(updatedNodes);
          selection.set({
            ...selection(),
            selectedIds: newSelectedIds,
          });
        });

        record();
        break;
      }

      case 'COPY_NODES': {
        const { nodeIds } = action.payload;
        const currentNodes = nodes();
        const copiedNodes: ComponentNode[] = [];

        for (const nodeId of nodeIds) {
          const node = currentNodes[nodeId];
          if (node) {
            const { clonedNode, clonedNodes } = cloneNodeWithNewIds(node, currentNodes, null);
            copiedNodes.push(clonedNode);
          }
        }

        clipboard.set(copiedNodes);
        break;
      }

      case 'PASTE_NODES': {
        const { parentId, index } = action.payload;
        const clipboardNodes = clipboard();

        if (clipboardNodes.length === 0) return;

        const record = recordHistory(`Paste ${clipboardNodes.length} nodes`, 'paste');

        batch(() => {
          const currentNodes = nodes();
          let updatedNodes = { ...currentNodes };
          const parent = updatedNodes[parentId];

          if (!parent) return;

          const newChildren = [...parent.children];
          const newSelectedIds: NodeId[] = [];
          let insertIndex = index ?? newChildren.length;

          for (const clipboardNode of clipboardNodes) {
            const { clonedNode, clonedNodes } = cloneNodeWithNewIds(
              clipboardNode,
              updatedNodes,
              parentId
            );

            newChildren.splice(insertIndex, 0, clonedNode.id);
            insertIndex++;
            newSelectedIds.push(clonedNode.id);

            updatedNodes = {
              ...updatedNodes,
              ...clonedNodes,
            };
          }

          updatedNodes[parentId] = { ...parent, children: newChildren };
          nodes.set(updatedNodes);

          selection.set({
            ...selection(),
            selectedIds: newSelectedIds,
          });
        });

        record();
        break;
      }

      case 'SELECT_NODE': {
        const { nodeId, addToSelection } = action.payload;
        const currentSelection = selection();

        if (addToSelection) {
          selection.set({
            ...currentSelection,
            selectedIds: [...currentSelection.selectedIds, nodeId],
          });
        } else {
          selection.set({
            ...currentSelection,
            selectedIds: [nodeId],
          });
        }

        emit('selection:changed', { selectedIds: selection().selectedIds });
        break;
      }

      case 'SELECT_NODES': {
        const { nodeIds } = action.payload;
        selection.set({
          ...selection(),
          selectedIds: nodeIds,
        });
        emit('selection:changed', { selectedIds: nodeIds });
        break;
      }

      case 'DESELECT_NODE': {
        const { nodeId } = action.payload;
        const currentSelection = selection();
        selection.set({
          ...currentSelection,
          selectedIds: currentSelection.selectedIds.filter((id) => id !== nodeId),
        });
        emit('selection:changed', { selectedIds: selection().selectedIds });
        break;
      }

      case 'DESELECT_ALL': {
        selection.set({
          ...selection(),
          selectedIds: [],
        });
        emit('selection:changed', { selectedIds: [] });
        break;
      }

      case 'HOVER_NODE': {
        selection.set({
          ...selection(),
          hoveredId: action.payload.nodeId,
        });
        break;
      }

      case 'FOCUS_NODE': {
        selection.set({
          ...selection(),
          focusedId: action.payload.nodeId,
        });
        break;
      }

      case 'START_DRAG': {
        drag.set({
          isDragging: true,
          source: action.payload,
          target: null,
          position: { x: 0, y: 0 },
          offset: { x: 0, y: 0 },
          preview: null,
        });
        emit('drag:start', { source: action.payload });
        break;
      }

      case 'UPDATE_DRAG': {
        const currentDrag = drag();
        drag.set({
          ...currentDrag,
          position: action.payload.position,
          target: action.payload.target ?? currentDrag.target,
        });
        break;
      }

      case 'END_DRAG': {
        const currentDrag = drag();
        emit('drag:end', { source: currentDrag.source!, target: currentDrag.target });
        drag.set(defaultDragState);
        break;
      }

      case 'CANCEL_DRAG': {
        drag.set(defaultDragState);
        break;
      }

      case 'START_RESIZE': {
        const { handle, bounds } = action.payload;
        resize.set({
          isResizing: true,
          handle,
          initialBounds: bounds,
          currentBounds: bounds,
          maintainAspectRatio: false,
        });
        break;
      }

      case 'UPDATE_RESIZE': {
        resize.set({
          ...resize(),
          currentBounds: action.payload.bounds,
        });
        break;
      }

      case 'END_RESIZE': {
        const currentResize = resize();
        if (currentResize.currentBounds) {
          // Apply resize to selected nodes
          const sel = selection();
          if (sel.selectedIds.length > 0) {
            const nodeId = sel.selectedIds[0]!;
            const bounds = currentResize.currentBounds;

            dispatch({
              type: 'UPDATE_NODE_STYLES',
              payload: {
                nodeId,
                styles: {
                  width: { value: bounds.width, unit: 'px' },
                  height: { value: bounds.height, unit: 'px' },
                },
              },
            });
          }
        }
        resize.set(defaultResizeState);
        break;
      }

      case 'CANCEL_RESIZE': {
        resize.set(defaultResizeState);
        break;
      }

      case 'SET_ZOOM': {
        const currentCanvas = canvas();
        const clampedZoom = Math.max(
          currentCanvas.zoom.min,
          Math.min(currentCanvas.zoom.max, action.payload.zoom)
        );
        viewport.set({
          ...viewport(),
          zoom: clampedZoom,
        });
        emit('viewport:changed', { viewport: viewport() });
        break;
      }

      case 'SET_PAN': {
        viewport.set({
          ...viewport(),
          panX: action.payload.x,
          panY: action.payload.y,
        });
        emit('viewport:changed', { viewport: viewport() });
        break;
      }

      case 'FIT_TO_SCREEN': {
        // Calculate zoom to fit canvas in viewport
        const currentCanvas = canvas();
        const currentViewport = viewport();
        const padding = 40;

        const availableWidth = currentViewport.canvasWidth - padding * 2;
        const availableHeight = currentViewport.canvasHeight - padding * 2;

        const zoomX = availableWidth / currentCanvas.width;
        const zoomY = availableHeight / currentCanvas.height;
        const newZoom = Math.min(zoomX, zoomY, 1);

        viewport.set({
          ...currentViewport,
          zoom: newZoom,
          panX: (currentViewport.canvasWidth - currentCanvas.width * newZoom) / 2,
          panY: (currentViewport.canvasHeight - currentCanvas.height * newZoom) / 2,
        });
        emit('viewport:changed', { viewport: viewport() });
        break;
      }

      case 'UPDATE_CANVAS_SETTINGS': {
        canvas.set({
          ...canvas(),
          ...action.payload,
        });
        break;
      }

      case 'REGISTER_COMPONENT': {
        components.set({
          ...components(),
          [action.payload.type]: action.payload,
        });
        break;
      }

      case 'UNREGISTER_COMPONENT': {
        const currentComponents = { ...components() };
        delete currentComponents[action.payload.type];
        components.set(currentComponents);
        break;
      }

      case 'UPDATE_UI': {
        ui.set({
          ...ui(),
          ...action.payload,
        });
        break;
      }

      case 'UPDATE_PREVIEW': {
        preview.set({
          ...preview(),
          ...action.payload,
        });
        break;
      }

      case 'SET_VIEWPORT_MODE': {
        preview.set({
          ...preview(),
          device: action.payload,
        });
        break;
      }

      case 'LOAD_DOCUMENT': {
        batch(() => {
          document.set(action.payload.document);
          nodes.set(action.payload.nodes);
          rootId.set(action.payload.rootId);
          selection.set(defaultSelectionState);
          history.clear();
        });
        emit('document:loaded', { document: action.payload.document });
        break;
      }

      case 'NEW_DOCUMENT': {
        const newRootNode = createDefaultRootNode();
        batch(() => {
          document.set({
            ...createDefaultDocument(),
            name: action.payload?.name ?? 'Untitled',
          });
          nodes.set({ [newRootNode.id]: newRootNode });
          rootId.set(newRootNode.id);
          selection.set(defaultSelectionState);
          history.clear();
        });
        break;
      }

      case 'UNDO': {
        history.undo();
        emit('history:changed', { canUndo: history.canUndo(), canRedo: history.canRedo() });
        break;
      }

      case 'REDO': {
        history.redo();
        emit('history:changed', { canUndo: history.canUndo(), canRedo: history.canRedo() });
        break;
      }

      case 'BATCH': {
        batch(() => {
          for (const batchAction of action.payload.actions) {
            dispatch(batchAction);
          }
        });
        break;
      }

      default:
        console.warn(`Unknown action type: ${(action as any).type}`);
    }
  };

  // Cleanup function
  const dispose = (): void => {
    eventListeners.clear();
  };

  return {
    document,
    nodes,
    rootId,
    selection,
    drag,
    resize,
    viewport,
    canvas,
    components,
    categories,
    ui,
    preview,
    clipboard,
    history,
    selectedNodes,
    canUndo,
    canRedo,
    dispatch,
    getState,
    getNode,
    getChildren,
    getParent,
    getAncestors,
    getDescendants,
    on,
    emit,
    dispose,
  };
}

// ============================================================================
// Default Store Instance
// ============================================================================

let defaultStore: BuilderStore | null = null;

/**
 * Get the default builder store instance
 */
export function getBuilderStore(): BuilderStore {
  if (!defaultStore) {
    defaultStore = createBuilderStore();
  }
  return defaultStore;
}

/**
 * Reset the default builder store
 */
export function resetBuilderStore(): void {
  if (defaultStore) {
    defaultStore.dispose();
    defaultStore = null;
  }
}
