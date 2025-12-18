/**
 * Component Tree Visualization Helpers
 *
 * Provides utilities for visualizing and inspecting the component hierarchy:
 * - Component tree traversal and inspection
 * - Props and state visualization
 * - Component relationship mapping
 * - DOM-to-component mapping
 */

import type { JSXElement } from "philjs-core";

// ============================================================================
// Types
// ============================================================================

export type ComponentNode = {
  id: string;
  name: string;
  type: "component" | "element" | "text" | "fragment";
  props: Record<string, any>;
  children: ComponentNode[];
  parent?: ComponentNode;
  domNode?: Element | Text;
  isIsland?: boolean;
  isHydrated?: boolean;
  renderTime?: number;
  updateCount?: number;
};

export type ComponentTreeSnapshot = {
  root: ComponentNode;
  timestamp: number;
  totalComponents: number;
  totalElements: number;
  totalIslands: number;
};

export type ComponentInspectionData = {
  node: ComponentNode;
  path: string[];
  depth: number;
  siblings: number;
  descendants: number;
  signals: string[];
  effects: string[];
};

export type TreeDiff = {
  type: "added" | "removed" | "modified" | "moved";
  path: string[];
  oldNode?: ComponentNode;
  newNode?: ComponentNode;
};

// ============================================================================
// Component Tree Inspector
// ============================================================================

export class ComponentTreeInspector {
  private nodeMap = new Map<string, ComponentNode>();
  private domNodeMap = new Map<Element | Text, ComponentNode>();
  private idCounter = 0;
  private snapshots: ComponentTreeSnapshot[] = [];
  private maxSnapshots = 20;

  /**
   * Build component tree from DOM
   */
  public buildTreeFromDOM(rootElement: Element = document.body): ComponentNode {
    this.nodeMap.clear();
    this.domNodeMap.clear();
    this.idCounter = 0;

    const root = this.traverseDOM(rootElement);
    this.createSnapshot(root);
    return root;
  }

  /**
   * Get component node by ID
   */
  public getNode(nodeId: string): ComponentNode | undefined {
    return this.nodeMap.get(nodeId);
  }

  /**
   * Get component node by DOM element
   */
  public getNodeByDOM(element: Element | Text): ComponentNode | undefined {
    return this.domNodeMap.get(element);
  }

  /**
   * Find component nodes by name
   */
  public findByName(name: string): ComponentNode[] {
    const results: ComponentNode[] = [];
    for (const node of this.nodeMap.values()) {
      if (node.name.includes(name)) {
        results.push(node);
      }
    }
    return results;
  }

  /**
   * Find component nodes by prop
   */
  public findByProp(propName: string, propValue?: any): ComponentNode[] {
    const results: ComponentNode[] = [];
    for (const node of this.nodeMap.values()) {
      if (propName in node.props) {
        if (propValue === undefined || node.props[propName] === propValue) {
          results.push(node);
        }
      }
    }
    return results;
  }

  /**
   * Get path from root to node
   */
  public getPath(nodeId: string): string[] {
    const path: string[] = [];
    let current = this.nodeMap.get(nodeId);

    while (current) {
      path.unshift(current.name);
      current = current.parent;
    }

    return path;
  }

  /**
   * Get detailed inspection data for a node
   */
  public inspect(nodeId: string): ComponentInspectionData | null {
    const node = this.nodeMap.get(nodeId);
    if (!node) return null;

    const path = this.getPath(nodeId);
    const depth = path.length - 1;
    const siblings = node.parent ? node.parent.children.length : 0;
    const descendants = this.countDescendants(node);

    return {
      node,
      path,
      depth,
      siblings,
      descendants,
      signals: this.extractSignals(node),
      effects: this.extractEffects(node),
    };
  }

  /**
   * Get all islands in the tree
   */
  public getIslands(): ComponentNode[] {
    return Array.from(this.nodeMap.values()).filter((node) => node.isIsland);
  }

  /**
   * Get all hydrated components
   */
  public getHydratedComponents(): ComponentNode[] {
    return Array.from(this.nodeMap.values()).filter((node) => node.isHydrated);
  }

  /**
   * Serialize tree to JSON (for display/export)
   */
  public serializeTree(node: ComponentNode, depth = Infinity): any {
    if (depth <= 0) return "...";

    return {
      id: node.id,
      name: node.name,
      type: node.type,
      props: this.serializeProps(node.props),
      isIsland: node.isIsland,
      isHydrated: node.isHydrated,
      renderTime: node.renderTime,
      updateCount: node.updateCount,
      children:
        node.children.length > 0
          ? node.children.map((child) => this.serializeTree(child, depth - 1))
          : undefined,
    };
  }

  /**
   * Create a snapshot of current tree state
   */
  public createSnapshot(root: ComponentNode): void {
    const snapshot: ComponentTreeSnapshot = {
      root: this.cloneNode(root),
      timestamp: Date.now(),
      totalComponents: this.countByType(root, "component"),
      totalElements: this.countByType(root, "element"),
      totalIslands: this.countIslands(root),
    };

    this.snapshots.push(snapshot);

    // Maintain max snapshots
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
    }
  }

  /**
   * Get all snapshots
   */
  public getSnapshots(): ComponentTreeSnapshot[] {
    return this.snapshots.slice();
  }

  /**
   * Compare two trees and generate diff
   */
  public diff(oldRoot: ComponentNode, newRoot: ComponentNode): TreeDiff[] {
    const diffs: TreeDiff[] = [];
    this.compareNodes(oldRoot, newRoot, [], diffs);
    return diffs;
  }

  /**
   * Print tree as ASCII art
   */
  public printTree(node: ComponentNode, prefix = "", isLast = true): string {
    const connector = isLast ? "└── " : "├── ";
    const childPrefix = prefix + (isLast ? "    " : "│   ");

    let output = prefix + connector + this.formatNodeName(node) + "\n";

    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      const childIsLast = i === node.children.length - 1;
      output += this.printTree(child, childPrefix, childIsLast);
    }

    return output;
  }

  /**
   * Get tree statistics
   */
  public getStatistics(root: ComponentNode): {
    totalNodes: number;
    byType: Record<string, number>;
    maxDepth: number;
    averageChildren: number;
    islands: number;
    hydrated: number;
  } {
    const stats = {
      totalNodes: 0,
      byType: {} as Record<string, number>,
      maxDepth: 0,
      averageChildren: 0,
      islands: 0,
      hydrated: 0,
    };

    let totalChildren = 0;
    let nodeCount = 0;

    const traverse = (node: ComponentNode, depth: number) => {
      stats.totalNodes++;
      stats.byType[node.type] = (stats.byType[node.type] || 0) + 1;
      stats.maxDepth = Math.max(stats.maxDepth, depth);

      if (node.isIsland) stats.islands++;
      if (node.isHydrated) stats.hydrated++;

      if (node.children.length > 0) {
        totalChildren += node.children.length;
        nodeCount++;
      }

      for (const child of node.children) {
        traverse(child, depth + 1);
      }
    };

    traverse(root, 0);
    stats.averageChildren = nodeCount > 0 ? totalChildren / nodeCount : 0;

    return stats;
  }

  // Private methods

  private traverseDOM(element: Element | Text, parent?: ComponentNode): ComponentNode {
    const id = `node-${this.idCounter++}`;

    let node: ComponentNode;

    if (element.nodeType === Node.TEXT_NODE) {
      node = {
        id,
        name: "#text",
        type: "text",
        props: { textContent: element.textContent },
        children: [],
        parent,
        domNode: element,
      };
    } else if (element.nodeType === Node.ELEMENT_NODE) {
      const el = element as Element;
      const isIsland = el.hasAttribute("island");
      const isHydrated = el.hasAttribute("data-hydrated");

      node = {
        id,
        name: el.tagName.toLowerCase(),
        type: "element",
        props: this.extractProps(el),
        children: [],
        parent,
        domNode: el,
        isIsland,
        isHydrated,
        updateCount: 0,
      };

      // Recursively traverse children
      for (let i = 0; i < el.childNodes.length; i++) {
        const childNode = el.childNodes[i];
        if (
          childNode.nodeType === Node.ELEMENT_NODE ||
          childNode.nodeType === Node.TEXT_NODE
        ) {
          const child = this.traverseDOM(childNode as Element | Text, node);
          node.children.push(child);
        }
      }
    } else {
      node = {
        id,
        name: "#unknown",
        type: "element",
        props: {},
        children: [],
        parent,
      };
    }

    this.nodeMap.set(id, node);
    if (node.domNode) {
      this.domNodeMap.set(node.domNode, node);
    }

    return node;
  }

  private extractProps(element: Element): Record<string, any> {
    const props: Record<string, any> = {};

    // Extract attributes
    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i];
      props[attr.name] = attr.value;
    }

    return props;
  }

  private serializeProps(props: Record<string, any>): Record<string, any> {
    const serialized: Record<string, any> = {};

    for (const [key, value] of Object.entries(props)) {
      if (typeof value === "function") {
        serialized[key] = "[Function]";
      } else if (typeof value === "object" && value !== null) {
        serialized[key] = "[Object]";
      } else {
        serialized[key] = value;
      }
    }

    return serialized;
  }

  private countDescendants(node: ComponentNode): number {
    let count = node.children.length;
    for (const child of node.children) {
      count += this.countDescendants(child);
    }
    return count;
  }

  private countByType(node: ComponentNode, type: string): number {
    let count = node.type === type ? 1 : 0;
    for (const child of node.children) {
      count += this.countByType(child, type);
    }
    return count;
  }

  private countIslands(node: ComponentNode): number {
    let count = node.isIsland ? 1 : 0;
    for (const child of node.children) {
      count += this.countIslands(child);
    }
    return count;
  }

  private extractSignals(node: ComponentNode): string[] {
    // This would need integration with signal inspector
    // For now, return placeholder
    return [];
  }

  private extractEffects(node: ComponentNode): string[] {
    // This would need integration with effect tracking
    // For now, return placeholder
    return [];
  }

  private cloneNode(node: ComponentNode): ComponentNode {
    return {
      ...node,
      props: { ...node.props },
      children: node.children.map((child) => this.cloneNode(child)),
    };
  }

  private compareNodes(
    oldNode: ComponentNode,
    newNode: ComponentNode,
    path: string[],
    diffs: TreeDiff[]
  ): void {
    // Check if node was modified
    if (oldNode.name !== newNode.name || oldNode.type !== newNode.type) {
      diffs.push({
        type: "modified",
        path,
        oldNode,
        newNode,
      });
      return;
    }

    // Check props
    const oldProps = JSON.stringify(oldNode.props);
    const newProps = JSON.stringify(newNode.props);
    if (oldProps !== newProps) {
      diffs.push({
        type: "modified",
        path,
        oldNode,
        newNode,
      });
    }

    // Compare children
    const maxLength = Math.max(oldNode.children.length, newNode.children.length);

    for (let i = 0; i < maxLength; i++) {
      const oldChild = oldNode.children[i];
      const newChild = newNode.children[i];
      const childPath = [...path, String(i)];

      if (!oldChild && newChild) {
        diffs.push({
          type: "added",
          path: childPath,
          newNode: newChild,
        });
      } else if (oldChild && !newChild) {
        diffs.push({
          type: "removed",
          path: childPath,
          oldNode: oldChild,
        });
      } else if (oldChild && newChild) {
        this.compareNodes(oldChild, newChild, childPath, diffs);
      }
    }
  }

  private formatNodeName(node: ComponentNode): string {
    let name = node.name;

    if (node.isIsland) {
      name += " [island]";
    }

    if (node.isHydrated) {
      name += " [hydrated]";
    }

    if (node.props.id) {
      name += ` #${node.props.id}`;
    }

    if (node.props.class || node.props.className) {
      name += ` .${node.props.class || node.props.className}`;
    }

    return name;
  }
}

// ============================================================================
// Global Instance & Utilities
// ============================================================================

let globalTreeInspector: ComponentTreeInspector | null = null;

export function initComponentTreeInspector(): ComponentTreeInspector {
  if (!globalTreeInspector) {
    globalTreeInspector = new ComponentTreeInspector();
  }
  return globalTreeInspector;
}

export function getComponentTreeInspector(): ComponentTreeInspector | null {
  return globalTreeInspector;
}

/**
 * Highlight a component in the DOM
 */
export function highlightComponent(nodeId: string): void {
  const inspector = getComponentTreeInspector();
  if (!inspector) return;

  const node = inspector.getNode(nodeId);
  if (!node || !node.domNode || node.domNode.nodeType !== Node.ELEMENT_NODE) {
    return;
  }

  const element = node.domNode as Element;

  // Add highlight overlay
  const overlay = document.createElement("div");
  overlay.id = "philjs-component-highlight";
  overlay.style.cssText = `
    position: absolute;
    pointer-events: none;
    border: 2px solid #3b82f6;
    background: rgba(59, 130, 246, 0.1);
    z-index: 999998;
  `;

  const rect = element.getBoundingClientRect();
  overlay.style.top = `${rect.top + window.scrollY}px`;
  overlay.style.left = `${rect.left + window.scrollX}px`;
  overlay.style.width = `${rect.width}px`;
  overlay.style.height = `${rect.height}px`;

  // Remove existing highlight
  const existing = document.getElementById("philjs-component-highlight");
  if (existing) {
    existing.remove();
  }

  document.body.appendChild(overlay);

  // Auto-remove after 3 seconds
  setTimeout(() => {
    overlay.remove();
  }, 3000);
}

/**
 * Remove component highlight
 */
export function removeHighlight(): void {
  const overlay = document.getElementById("philjs-component-highlight");
  if (overlay) {
    overlay.remove();
  }
}

/**
 * Log component tree to console
 */
export function logComponentTree(rootElement?: Element): void {
  const inspector = getComponentTreeInspector() || initComponentTreeInspector();
  const root = inspector.buildTreeFromDOM(rootElement);
  console.log(inspector.printTree(root));
  console.log("Statistics:", inspector.getStatistics(root));
}
