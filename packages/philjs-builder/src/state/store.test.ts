/**
 * Tests for the Builder Store
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createBuilderStore,
  generateId,
  resetBuilderStore,
  type BuilderStore,
} from './store.js';
import type { ComponentNode } from '../types.js';

describe('BuilderStore', () => {
  let store: BuilderStore;

  beforeEach(() => {
    resetBuilderStore();
    store = createBuilderStore();
  });

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^node_/);
    });
  });

  describe('initialization', () => {
    it('should create store with default state', () => {
      expect(store.nodes()).toBeDefined();
      expect(store.rootId()).toBeDefined();
      expect(store.selection().selectedIds).toEqual([]);
      expect(store.drag().isDragging).toBe(false);
      expect(store.viewport().zoom).toBe(1);
    });

    it('should have a root node', () => {
      const rootId = store.rootId();
      const rootNode = store.getNode(rootId);
      expect(rootNode).toBeDefined();
      expect(rootNode?.type).toBe('Frame');
      expect(rootNode?.parentId).toBeNull();
    });
  });

  describe('ADD_NODE', () => {
    it('should add a node to the tree', () => {
      const newNode: ComponentNode = {
        id: 'test-node-1',
        type: 'Button',
        name: 'Test Button',
        props: { label: 'Click me' },
        styles: {},
        children: [],
        parentId: null,
        events: [],
      };

      store.dispatch({
        type: 'ADD_NODE',
        payload: { node: newNode, parentId: store.rootId() },
      });

      expect(store.getNode('test-node-1')).toBeDefined();
      expect(store.getNode('test-node-1')?.parentId).toBe(store.rootId());

      const rootNode = store.getNode(store.rootId());
      expect(rootNode?.children).toContain('test-node-1');
    });

    it('should add node at specific index', () => {
      const node1: ComponentNode = {
        id: 'node-1',
        type: 'Text',
        props: {},
        styles: {},
        children: [],
        parentId: null,
        events: [],
      };

      const node2: ComponentNode = {
        id: 'node-2',
        type: 'Text',
        props: {},
        styles: {},
        children: [],
        parentId: null,
        events: [],
      };

      const node3: ComponentNode = {
        id: 'node-3',
        type: 'Text',
        props: {},
        styles: {},
        children: [],
        parentId: null,
        events: [],
      };

      store.dispatch({ type: 'ADD_NODE', payload: { node: node1, parentId: store.rootId() } });
      store.dispatch({ type: 'ADD_NODE', payload: { node: node2, parentId: store.rootId() } });
      store.dispatch({ type: 'ADD_NODE', payload: { node: node3, parentId: store.rootId(), index: 1 } });

      const rootNode = store.getNode(store.rootId());
      expect(rootNode?.children).toEqual(['node-1', 'node-3', 'node-2']);
    });
  });

  describe('DELETE_NODE', () => {
    it('should delete a node', () => {
      const newNode: ComponentNode = {
        id: 'delete-me',
        type: 'Button',
        props: {},
        styles: {},
        children: [],
        parentId: null,
        events: [],
      };

      store.dispatch({ type: 'ADD_NODE', payload: { node: newNode, parentId: store.rootId() } });
      expect(store.getNode('delete-me')).toBeDefined();

      store.dispatch({ type: 'DELETE_NODE', payload: { nodeId: 'delete-me' } });
      expect(store.getNode('delete-me')).toBeUndefined();
    });

    it('should delete descendants when deleting parent', () => {
      const parent: ComponentNode = {
        id: 'parent',
        type: 'Frame',
        props: {},
        styles: {},
        children: [],
        parentId: null,
        events: [],
      };

      const child: ComponentNode = {
        id: 'child',
        type: 'Text',
        props: {},
        styles: {},
        children: [],
        parentId: null,
        events: [],
      };

      store.dispatch({ type: 'ADD_NODE', payload: { node: parent, parentId: store.rootId() } });
      store.dispatch({ type: 'ADD_NODE', payload: { node: child, parentId: 'parent' } });

      expect(store.getNode('parent')).toBeDefined();
      expect(store.getNode('child')).toBeDefined();

      store.dispatch({ type: 'DELETE_NODE', payload: { nodeId: 'parent' } });

      expect(store.getNode('parent')).toBeUndefined();
      expect(store.getNode('child')).toBeUndefined();
    });

    it('should not delete root node', () => {
      const rootId = store.rootId();
      store.dispatch({ type: 'DELETE_NODE', payload: { nodeId: rootId } });
      expect(store.getNode(rootId)).toBeDefined();
    });

    it('should update selection when deleting selected node', () => {
      const node: ComponentNode = {
        id: 'selected-node',
        type: 'Button',
        props: {},
        styles: {},
        children: [],
        parentId: null,
        events: [],
      };

      store.dispatch({ type: 'ADD_NODE', payload: { node, parentId: store.rootId() } });
      store.dispatch({ type: 'SELECT_NODE', payload: { nodeId: 'selected-node' } });
      expect(store.selection().selectedIds).toContain('selected-node');

      store.dispatch({ type: 'DELETE_NODE', payload: { nodeId: 'selected-node' } });
      expect(store.selection().selectedIds).not.toContain('selected-node');
    });
  });

  describe('MOVE_NODE', () => {
    it('should move node to new parent', () => {
      const container1: ComponentNode = {
        id: 'container-1',
        type: 'Frame',
        props: {},
        styles: {},
        children: [],
        parentId: null,
        events: [],
      };

      const container2: ComponentNode = {
        id: 'container-2',
        type: 'Frame',
        props: {},
        styles: {},
        children: [],
        parentId: null,
        events: [],
      };

      const movable: ComponentNode = {
        id: 'movable',
        type: 'Text',
        props: {},
        styles: {},
        children: [],
        parentId: null,
        events: [],
      };

      store.dispatch({ type: 'ADD_NODE', payload: { node: container1, parentId: store.rootId() } });
      store.dispatch({ type: 'ADD_NODE', payload: { node: container2, parentId: store.rootId() } });
      store.dispatch({ type: 'ADD_NODE', payload: { node: movable, parentId: 'container-1' } });

      expect(store.getNode('container-1')?.children).toContain('movable');
      expect(store.getNode('movable')?.parentId).toBe('container-1');

      store.dispatch({
        type: 'MOVE_NODE',
        payload: { nodeId: 'movable', newParentId: 'container-2' },
      });

      expect(store.getNode('container-1')?.children).not.toContain('movable');
      expect(store.getNode('container-2')?.children).toContain('movable');
      expect(store.getNode('movable')?.parentId).toBe('container-2');
    });
  });

  describe('UPDATE_NODE_PROPS', () => {
    it('should update node props', () => {
      const node: ComponentNode = {
        id: 'props-node',
        type: 'Button',
        props: { label: 'Original' },
        styles: {},
        children: [],
        parentId: null,
        events: [],
      };

      store.dispatch({ type: 'ADD_NODE', payload: { node, parentId: store.rootId() } });

      store.dispatch({
        type: 'UPDATE_NODE_PROPS',
        payload: { nodeId: 'props-node', props: { label: 'Updated', disabled: true } },
      });

      const updatedNode = store.getNode('props-node');
      expect(updatedNode?.props.label).toBe('Updated');
      expect(updatedNode?.props.disabled).toBe(true);
    });
  });

  describe('UPDATE_NODE_STYLES', () => {
    it('should update node styles', () => {
      const node: ComponentNode = {
        id: 'style-node',
        type: 'Frame',
        props: {},
        styles: { backgroundColor: '#ffffff' },
        children: [],
        parentId: null,
        events: [],
      };

      store.dispatch({ type: 'ADD_NODE', payload: { node, parentId: store.rootId() } });

      store.dispatch({
        type: 'UPDATE_NODE_STYLES',
        payload: {
          nodeId: 'style-node',
          styles: {
            backgroundColor: '#000000',
            padding: { value: 16, unit: 'px' },
          },
        },
      });

      const updatedNode = store.getNode('style-node');
      expect(updatedNode?.styles.backgroundColor).toBe('#000000');
      expect(updatedNode?.styles.padding).toEqual({ value: 16, unit: 'px' });
    });
  });

  describe('Selection', () => {
    it('should select a node', () => {
      const node: ComponentNode = {
        id: 'select-node',
        type: 'Button',
        props: {},
        styles: {},
        children: [],
        parentId: null,
        events: [],
      };

      store.dispatch({ type: 'ADD_NODE', payload: { node, parentId: store.rootId() } });
      store.dispatch({ type: 'SELECT_NODE', payload: { nodeId: 'select-node' } });

      expect(store.selection().selectedIds).toEqual(['select-node']);
      expect(store.selectedNodes()[0]?.id).toBe('select-node');
    });

    it('should add to selection with addToSelection', () => {
      const node1: ComponentNode = {
        id: 'node-a',
        type: 'Button',
        props: {},
        styles: {},
        children: [],
        parentId: null,
        events: [],
      };

      const node2: ComponentNode = {
        id: 'node-b',
        type: 'Button',
        props: {},
        styles: {},
        children: [],
        parentId: null,
        events: [],
      };

      store.dispatch({ type: 'ADD_NODE', payload: { node: node1, parentId: store.rootId() } });
      store.dispatch({ type: 'ADD_NODE', payload: { node: node2, parentId: store.rootId() } });

      store.dispatch({ type: 'SELECT_NODE', payload: { nodeId: 'node-a' } });
      store.dispatch({ type: 'SELECT_NODE', payload: { nodeId: 'node-b', addToSelection: true } });

      expect(store.selection().selectedIds).toEqual(['node-a', 'node-b']);
    });

    it('should deselect all nodes', () => {
      const node: ComponentNode = {
        id: 'deselect-node',
        type: 'Button',
        props: {},
        styles: {},
        children: [],
        parentId: null,
        events: [],
      };

      store.dispatch({ type: 'ADD_NODE', payload: { node, parentId: store.rootId() } });
      store.dispatch({ type: 'SELECT_NODE', payload: { nodeId: 'deselect-node' } });
      expect(store.selection().selectedIds.length).toBe(1);

      store.dispatch({ type: 'DESELECT_ALL' });
      expect(store.selection().selectedIds).toEqual([]);
    });

    it('should handle hover state', () => {
      const node: ComponentNode = {
        id: 'hover-node',
        type: 'Button',
        props: {},
        styles: {},
        children: [],
        parentId: null,
        events: [],
      };

      store.dispatch({ type: 'ADD_NODE', payload: { node, parentId: store.rootId() } });
      store.dispatch({ type: 'HOVER_NODE', payload: { nodeId: 'hover-node' } });

      expect(store.selection().hoveredId).toBe('hover-node');

      store.dispatch({ type: 'HOVER_NODE', payload: { nodeId: null } });
      expect(store.selection().hoveredId).toBeNull();
    });
  });

  describe('DUPLICATE_NODE', () => {
    it('should duplicate a node', () => {
      const node: ComponentNode = {
        id: 'original',
        type: 'Button',
        props: { label: 'Test' },
        styles: { backgroundColor: '#ff0000' },
        children: [],
        parentId: null,
        events: [],
      };

      store.dispatch({ type: 'ADD_NODE', payload: { node, parentId: store.rootId() } });

      const beforeCount = Object.keys(store.nodes()).length;
      store.dispatch({ type: 'DUPLICATE_NODE', payload: { nodeId: 'original' } });

      expect(Object.keys(store.nodes()).length).toBe(beforeCount + 1);

      // Check the duplicate has the same props
      const duplicatedId = store.selection().selectedIds[0];
      const duplicate = store.getNode(duplicatedId);
      expect(duplicate?.props.label).toBe('Test');
      expect(duplicate?.styles.backgroundColor).toBe('#ff0000');
      expect(duplicate?.id).not.toBe('original');
    });
  });

  describe('Copy and Paste', () => {
    it('should copy and paste nodes', () => {
      const node: ComponentNode = {
        id: 'copy-node',
        type: 'Button',
        props: { label: 'Copy me' },
        styles: {},
        children: [],
        parentId: null,
        events: [],
      };

      store.dispatch({ type: 'ADD_NODE', payload: { node, parentId: store.rootId() } });
      store.dispatch({ type: 'COPY_NODES', payload: { nodeIds: ['copy-node'] } });

      expect(store.clipboard().length).toBe(1);

      const beforeCount = Object.keys(store.nodes()).length;
      store.dispatch({ type: 'PASTE_NODES', payload: { parentId: store.rootId() } });

      expect(Object.keys(store.nodes()).length).toBe(beforeCount + 1);

      const pastedId = store.selection().selectedIds[0];
      const pasted = store.getNode(pastedId);
      expect(pasted?.props.label).toBe('Copy me');
      expect(pasted?.id).not.toBe('copy-node');
    });
  });

  describe('Viewport', () => {
    it('should set zoom', () => {
      store.dispatch({ type: 'SET_ZOOM', payload: { zoom: 2 } });
      expect(store.viewport().zoom).toBe(2);
    });

    it('should clamp zoom to min/max', () => {
      store.dispatch({ type: 'SET_ZOOM', payload: { zoom: 10 } });
      expect(store.viewport().zoom).toBe(store.canvas().zoom.max);

      store.dispatch({ type: 'SET_ZOOM', payload: { zoom: 0.01 } });
      expect(store.viewport().zoom).toBe(store.canvas().zoom.min);
    });

    it('should set pan', () => {
      store.dispatch({ type: 'SET_PAN', payload: { x: 100, y: 200 } });
      expect(store.viewport().panX).toBe(100);
      expect(store.viewport().panY).toBe(200);
    });
  });

  describe('Drag and Drop', () => {
    it('should start and end drag', () => {
      store.dispatch({
        type: 'START_DRAG',
        payload: { type: 'node', nodeId: 'test-node' },
      });

      expect(store.drag().isDragging).toBe(true);
      expect(store.drag().source?.nodeId).toBe('test-node');

      store.dispatch({ type: 'END_DRAG' });
      expect(store.drag().isDragging).toBe(false);
    });

    it('should cancel drag', () => {
      store.dispatch({
        type: 'START_DRAG',
        payload: { type: 'palette', componentType: 'Button' },
      });

      expect(store.drag().isDragging).toBe(true);

      store.dispatch({ type: 'CANCEL_DRAG' });
      expect(store.drag().isDragging).toBe(false);
      expect(store.drag().source).toBeNull();
    });
  });

  describe('Undo/Redo', () => {
    it('should undo and redo node additions', () => {
      const node: ComponentNode = {
        id: 'undo-node',
        type: 'Button',
        props: {},
        styles: {},
        children: [],
        parentId: null,
        events: [],
      };

      store.dispatch({ type: 'ADD_NODE', payload: { node, parentId: store.rootId() } });
      expect(store.getNode('undo-node')).toBeDefined();
      expect(store.canUndo()).toBe(true);

      store.dispatch({ type: 'UNDO' });
      expect(store.getNode('undo-node')).toBeUndefined();
      expect(store.canRedo()).toBe(true);

      store.dispatch({ type: 'REDO' });
      expect(store.getNode('undo-node')).toBeDefined();
    });
  });

  describe('Document Management', () => {
    it('should create new document', () => {
      const node: ComponentNode = {
        id: 'temp-node',
        type: 'Button',
        props: {},
        styles: {},
        children: [],
        parentId: null,
        events: [],
      };

      store.dispatch({ type: 'ADD_NODE', payload: { node, parentId: store.rootId() } });
      expect(Object.keys(store.nodes()).length).toBeGreaterThan(1);

      store.dispatch({ type: 'NEW_DOCUMENT', payload: { name: 'New Project' } });

      expect(store.document().name).toBe('New Project');
      expect(Object.keys(store.nodes()).length).toBe(1); // Only root node
    });

    it('should load document', () => {
      const customRootNode: ComponentNode = {
        id: 'custom-root',
        type: 'Frame',
        props: {},
        styles: {},
        children: [],
        parentId: null,
        events: [],
      };

      store.dispatch({
        type: 'LOAD_DOCUMENT',
        payload: {
          document: {
            id: 'doc-1',
            name: 'Loaded Doc',
            version: '1.0.0',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
          nodes: { 'custom-root': customRootNode },
          rootId: 'custom-root',
        },
      });

      expect(store.document().name).toBe('Loaded Doc');
      expect(store.rootId()).toBe('custom-root');
    });
  });

  describe('Component Registration', () => {
    it('should register and unregister components', () => {
      store.dispatch({
        type: 'REGISTER_COMPONENT',
        payload: {
          type: 'CustomButton',
          name: 'Custom Button',
          category: 'custom',
          props: [],
        },
      });

      expect(store.components()['CustomButton']).toBeDefined();

      store.dispatch({
        type: 'UNREGISTER_COMPONENT',
        payload: { type: 'CustomButton' },
      });

      expect(store.components()['CustomButton']).toBeUndefined();
    });
  });

  describe('Event System', () => {
    it('should emit and listen to events', () => {
      const listener = vi.fn();
      const unsubscribe = store.on('node:added', listener);

      const node: ComponentNode = {
        id: 'event-node',
        type: 'Button',
        props: {},
        styles: {},
        children: [],
        parentId: null,
        events: [],
      };

      store.dispatch({ type: 'ADD_NODE', payload: { node, parentId: store.rootId() } });

      expect(listener).toHaveBeenCalledWith({ node });

      unsubscribe();
      listener.mockClear();

      store.dispatch({ type: 'ADD_NODE', payload: { node: { ...node, id: 'event-node-2' }, parentId: store.rootId() } });
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('Tree Operations', () => {
    it('should get children of a node', () => {
      const parent: ComponentNode = {
        id: 'tree-parent',
        type: 'Frame',
        props: {},
        styles: {},
        children: [],
        parentId: null,
        events: [],
      };

      const child1: ComponentNode = {
        id: 'tree-child-1',
        type: 'Text',
        props: {},
        styles: {},
        children: [],
        parentId: null,
        events: [],
      };

      const child2: ComponentNode = {
        id: 'tree-child-2',
        type: 'Text',
        props: {},
        styles: {},
        children: [],
        parentId: null,
        events: [],
      };

      store.dispatch({ type: 'ADD_NODE', payload: { node: parent, parentId: store.rootId() } });
      store.dispatch({ type: 'ADD_NODE', payload: { node: child1, parentId: 'tree-parent' } });
      store.dispatch({ type: 'ADD_NODE', payload: { node: child2, parentId: 'tree-parent' } });

      const children = store.getChildren('tree-parent');
      expect(children.length).toBe(2);
      expect(children.map(c => c.id)).toEqual(['tree-child-1', 'tree-child-2']);
    });

    it('should get parent of a node', () => {
      const parent: ComponentNode = {
        id: 'get-parent',
        type: 'Frame',
        props: {},
        styles: {},
        children: [],
        parentId: null,
        events: [],
      };

      const child: ComponentNode = {
        id: 'get-child',
        type: 'Text',
        props: {},
        styles: {},
        children: [],
        parentId: null,
        events: [],
      };

      store.dispatch({ type: 'ADD_NODE', payload: { node: parent, parentId: store.rootId() } });
      store.dispatch({ type: 'ADD_NODE', payload: { node: child, parentId: 'get-parent' } });

      const nodeParent = store.getParent('get-child');
      expect(nodeParent?.id).toBe('get-parent');
    });

    it('should get ancestors of a node', () => {
      const grandparent: ComponentNode = {
        id: 'grandparent',
        type: 'Frame',
        props: {},
        styles: {},
        children: [],
        parentId: null,
        events: [],
      };

      const parent: ComponentNode = {
        id: 'ancestor-parent',
        type: 'Frame',
        props: {},
        styles: {},
        children: [],
        parentId: null,
        events: [],
      };

      const child: ComponentNode = {
        id: 'ancestor-child',
        type: 'Text',
        props: {},
        styles: {},
        children: [],
        parentId: null,
        events: [],
      };

      store.dispatch({ type: 'ADD_NODE', payload: { node: grandparent, parentId: store.rootId() } });
      store.dispatch({ type: 'ADD_NODE', payload: { node: parent, parentId: 'grandparent' } });
      store.dispatch({ type: 'ADD_NODE', payload: { node: child, parentId: 'ancestor-parent' } });

      const ancestors = store.getAncestors('ancestor-child');
      expect(ancestors.map(a => a.id)).toEqual(['ancestor-parent', 'grandparent', store.rootId()]);
    });

    it('should get descendants of a node', () => {
      const parent: ComponentNode = {
        id: 'desc-parent',
        type: 'Frame',
        props: {},
        styles: {},
        children: [],
        parentId: null,
        events: [],
      };

      const child: ComponentNode = {
        id: 'desc-child',
        type: 'Frame',
        props: {},
        styles: {},
        children: [],
        parentId: null,
        events: [],
      };

      const grandchild: ComponentNode = {
        id: 'desc-grandchild',
        type: 'Text',
        props: {},
        styles: {},
        children: [],
        parentId: null,
        events: [],
      };

      store.dispatch({ type: 'ADD_NODE', payload: { node: parent, parentId: store.rootId() } });
      store.dispatch({ type: 'ADD_NODE', payload: { node: child, parentId: 'desc-parent' } });
      store.dispatch({ type: 'ADD_NODE', payload: { node: grandchild, parentId: 'desc-child' } });

      const descendants = store.getDescendants('desc-parent');
      expect(descendants.map(d => d.id)).toEqual(['desc-child', 'desc-grandchild']);
    });
  });

  describe('getState', () => {
    it('should return complete state snapshot', () => {
      const state = store.getState();

      expect(state.document).toBeDefined();
      expect(state.nodes).toBeDefined();
      expect(state.rootId).toBeDefined();
      expect(state.selection).toBeDefined();
      expect(state.drag).toBeDefined();
      expect(state.resize).toBeDefined();
      expect(state.viewport).toBeDefined();
      expect(state.canvas).toBeDefined();
      expect(state.ui).toBeDefined();
      expect(state.preview).toBeDefined();
    });
  });
});
