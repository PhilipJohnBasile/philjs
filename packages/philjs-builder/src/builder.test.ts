/**
 * Tests for PhilJS Builder component functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createBuilderStore,
  generateId,
  resetBuilderStore,
  type BuilderStore,
} from './state/store.js';
import { createHistoryManager, type HistoryManager } from './state/history.js';
import type { ComponentNode } from './types.js';

describe('Builder Core Functions', () => {
  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(generateId());
      }
      expect(ids.size).toBe(100);
    });

    it('should generate IDs with node_ prefix', () => {
      const id = generateId();
      expect(id.startsWith('node_')).toBe(true);
    });

    it('should generate IDs with timestamp and random parts', () => {
      const id = generateId();
      const parts = id.split('_');
      expect(parts.length).toBe(3);
      expect(parts[0]).toBe('node');
    });
  });
});

describe('BuilderStore', () => {
  let store: BuilderStore;

  beforeEach(() => {
    resetBuilderStore();
    store = createBuilderStore();
  });

  describe('Initialization', () => {
    it('should create store with default root node', () => {
      const rootId = store.rootId();
      const rootNode = store.getNode(rootId);

      expect(rootNode).toBeDefined();
      expect(rootNode?.type).toBe('Frame');
      expect(rootNode?.parentId).toBeNull();
    });

    it('should initialize with default viewport settings', () => {
      const viewport = store.viewport();

      expect(viewport.zoom).toBe(1);
      expect(viewport.panX).toBe(0);
      expect(viewport.panY).toBe(0);
    });

    it('should initialize with empty selection', () => {
      const selection = store.selection();

      expect(selection.selectedIds).toEqual([]);
      expect(selection.hoveredId).toBeNull();
    });

    it('should initialize with default canvas settings', () => {
      const canvas = store.canvas();

      expect(canvas.grid.enabled).toBe(true);
      expect(canvas.grid.size).toBe(8);
      expect(canvas.rulers).toBe(true);
    });
  });

  describe('Node Operations', () => {
    it('should add node to parent', () => {
      const newNode: ComponentNode = {
        id: 'test-btn',
        type: 'Button',
        name: 'Test Button',
        props: { label: 'Click' },
        styles: {},
        children: [],
        parentId: null,
        events: [],
      };

      store.dispatch({
        type: 'ADD_NODE',
        payload: { node: newNode, parentId: store.rootId() },
      });

      const addedNode = store.getNode('test-btn');
      expect(addedNode).toBeDefined();
      expect(addedNode?.parentId).toBe(store.rootId());
    });

    it('should update node properties', () => {
      const node: ComponentNode = {
        id: 'update-test',
        type: 'Text',
        props: { content: 'Original' },
        styles: {},
        children: [],
        parentId: null,
        events: [],
      };

      store.dispatch({
        type: 'ADD_NODE',
        payload: { node, parentId: store.rootId() },
      });

      store.dispatch({
        type: 'UPDATE_NODE_PROPS',
        payload: { nodeId: 'update-test', props: { content: 'Updated' } },
      });

      const updated = store.getNode('update-test');
      expect(updated?.props.content).toBe('Updated');
    });

    it('should delete node and update parent children', () => {
      const node: ComponentNode = {
        id: 'delete-test',
        type: 'Button',
        props: {},
        styles: {},
        children: [],
        parentId: null,
        events: [],
      };

      store.dispatch({
        type: 'ADD_NODE',
        payload: { node, parentId: store.rootId() },
      });

      const rootBefore = store.getNode(store.rootId());
      expect(rootBefore?.children).toContain('delete-test');

      store.dispatch({
        type: 'DELETE_NODE',
        payload: { nodeId: 'delete-test' },
      });

      expect(store.getNode('delete-test')).toBeUndefined();
      const rootAfter = store.getNode(store.rootId());
      expect(rootAfter?.children).not.toContain('delete-test');
    });
  });

  describe('Selection Management', () => {
    it('should select a node', () => {
      const node: ComponentNode = {
        id: 'select-test',
        type: 'Frame',
        props: {},
        styles: {},
        children: [],
        parentId: null,
        events: [],
      };

      store.dispatch({
        type: 'ADD_NODE',
        payload: { node, parentId: store.rootId() },
      });

      store.dispatch({
        type: 'SELECT_NODE',
        payload: { nodeId: 'select-test' },
      });

      expect(store.selection().selectedIds).toContain('select-test');
    });

    it('should support multi-selection', () => {
      const node1: ComponentNode = {
        id: 'multi-1',
        type: 'Text',
        props: {},
        styles: {},
        children: [],
        parentId: null,
        events: [],
      };

      const node2: ComponentNode = {
        id: 'multi-2',
        type: 'Text',
        props: {},
        styles: {},
        children: [],
        parentId: null,
        events: [],
      };

      store.dispatch({ type: 'ADD_NODE', payload: { node: node1, parentId: store.rootId() } });
      store.dispatch({ type: 'ADD_NODE', payload: { node: node2, parentId: store.rootId() } });

      store.dispatch({ type: 'SELECT_NODE', payload: { nodeId: 'multi-1' } });
      store.dispatch({ type: 'SELECT_NODE', payload: { nodeId: 'multi-2', addToSelection: true } });

      expect(store.selection().selectedIds).toEqual(['multi-1', 'multi-2']);
    });

    it('should deselect all nodes', () => {
      const node: ComponentNode = {
        id: 'deselect-test',
        type: 'Button',
        props: {},
        styles: {},
        children: [],
        parentId: null,
        events: [],
      };

      store.dispatch({ type: 'ADD_NODE', payload: { node, parentId: store.rootId() } });
      store.dispatch({ type: 'SELECT_NODE', payload: { nodeId: 'deselect-test' } });
      store.dispatch({ type: 'DESELECT_ALL' });

      expect(store.selection().selectedIds).toEqual([]);
    });
  });

  describe('Tree Traversal', () => {
    it('should get children of a node', () => {
      const parent: ComponentNode = {
        id: 'parent-node',
        type: 'Frame',
        props: {},
        styles: {},
        children: [],
        parentId: null,
        events: [],
      };

      const child: ComponentNode = {
        id: 'child-node',
        type: 'Text',
        props: {},
        styles: {},
        children: [],
        parentId: null,
        events: [],
      };

      store.dispatch({ type: 'ADD_NODE', payload: { node: parent, parentId: store.rootId() } });
      store.dispatch({ type: 'ADD_NODE', payload: { node: child, parentId: 'parent-node' } });

      const children = store.getChildren('parent-node');
      expect(children.length).toBe(1);
      expect(children[0].id).toBe('child-node');
    });

    it('should get parent of a node', () => {
      const parent: ComponentNode = {
        id: 'get-parent-test',
        type: 'Frame',
        props: {},
        styles: {},
        children: [],
        parentId: null,
        events: [],
      };

      const child: ComponentNode = {
        id: 'get-child-test',
        type: 'Text',
        props: {},
        styles: {},
        children: [],
        parentId: null,
        events: [],
      };

      store.dispatch({ type: 'ADD_NODE', payload: { node: parent, parentId: store.rootId() } });
      store.dispatch({ type: 'ADD_NODE', payload: { node: child, parentId: 'get-parent-test' } });

      const parentNode = store.getParent('get-child-test');
      expect(parentNode?.id).toBe('get-parent-test');
    });
  });

  describe('History (Undo/Redo)', () => {
    it('should undo node addition', () => {
      const node: ComponentNode = {
        id: 'undo-add',
        type: 'Button',
        props: {},
        styles: {},
        children: [],
        parentId: null,
        events: [],
      };

      store.dispatch({ type: 'ADD_NODE', payload: { node, parentId: store.rootId() } });
      expect(store.getNode('undo-add')).toBeDefined();
      expect(store.canUndo()).toBe(true);

      store.dispatch({ type: 'UNDO' });
      expect(store.getNode('undo-add')).toBeUndefined();
    });

    it('should redo after undo', () => {
      const node: ComponentNode = {
        id: 'redo-test',
        type: 'Button',
        props: {},
        styles: {},
        children: [],
        parentId: null,
        events: [],
      };

      store.dispatch({ type: 'ADD_NODE', payload: { node, parentId: store.rootId() } });
      store.dispatch({ type: 'UNDO' });
      expect(store.canRedo()).toBe(true);

      store.dispatch({ type: 'REDO' });
      expect(store.getNode('redo-test')).toBeDefined();
    });
  });
});

describe('HistoryManager', () => {
  let history: HistoryManager;

  beforeEach(() => {
    history = createHistoryManager({
      maxEntries: 10,
      onUndo: vi.fn(),
      onRedo: vi.fn(),
    });
  });

  it('should track history entries', () => {
    expect(history.canUndo()).toBe(false);
    expect(history.canRedo()).toBe(false);

    history.push({
      id: 'entry-1',
      type: 'add_node',
      timestamp: Date.now(),
      description: 'Add node',
      before: {},
      after: {},
    });

    expect(history.canUndo()).toBe(true);
  });

  it('should respect max entries limit', () => {
    for (let i = 0; i < 15; i++) {
      history.push({
        id: `entry-${i}`,
        type: 'test',
        timestamp: Date.now(),
        description: `Entry ${i}`,
        before: {},
        after: {},
      });
    }

    // Should not exceed max entries
    let count = 0;
    while (history.canUndo()) {
      history.undo();
      count++;
    }
    expect(count).toBeLessThanOrEqual(10);
  });

  it('should clear history', () => {
    history.push({
      id: 'clear-test',
      type: 'test',
      timestamp: Date.now(),
      description: 'Test',
      before: {},
      after: {},
    });

    expect(history.canUndo()).toBe(true);
    history.clear();
    expect(history.canUndo()).toBe(false);
  });
});
