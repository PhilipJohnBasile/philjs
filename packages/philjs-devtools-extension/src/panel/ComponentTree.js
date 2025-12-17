/**
 * PhilJS DevTools - Component Tree
 */
export class ComponentTree {
    root = null;
    selectedId = null;
    expandedNodes = new Set();
    searchQuery = '';
    update(root) {
        this.root = root;
    }
    select(nodeId) {
        this.selectedId = nodeId;
    }
    toggle(nodeId) {
        if (this.expandedNodes.has(nodeId)) {
            this.expandedNodes.delete(nodeId);
        }
        else {
            this.expandedNodes.add(nodeId);
        }
    }
    search(query) {
        this.searchQuery = query.toLowerCase();
    }
    render() {
        return `
      <div class="component-tree">
        <div class="tree-toolbar">
          <input
            type="text"
            placeholder="Search components..."
            class="tree-search"
            value="${this.searchQuery}"
          />
          <button class="tree-btn expand-all" title="Expand All">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M12 5.83L15.17 9l1.41-1.41L12 3 7.41 7.59 8.83 9 12 5.83zm0 12.34L8.83 15l-1.41 1.41L12 21l4.59-4.59L15.17 15 12 18.17z"/>
            </svg>
          </button>
          <button class="tree-btn collapse-all" title="Collapse All">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M7.41 18.59L8.83 20 12 16.83 15.17 20l1.41-1.41L12 14l-4.59 4.59zm9.18-13.18L15.17 4 12 7.17 8.83 4 7.41 5.41 12 10l4.59-4.59z"/>
            </svg>
          </button>
        </div>

        <div class="tree-content">
          ${this.root ? this.renderNode(this.root, 0) : this.renderEmptyState()}
        </div>
      </div>
    `;
    }
    renderNode(node, depth) {
        const isExpanded = this.expandedNodes.has(node.id);
        const isSelected = node.id === this.selectedId;
        const hasChildren = node.children.length > 0;
        const matchesSearch = this.matchesSearch(node);
        if (this.searchQuery && !matchesSearch && !this.hasMatchingDescendant(node)) {
            return '';
        }
        const nodeIcon = this.getNodeIcon(node);
        const indent = depth * 20;
        return `
      <div class="tree-node-wrapper">
        <div
          class="tree-node ${isSelected ? 'selected' : ''} ${matchesSearch ? 'highlighted' : ''}"
          data-node-id="${node.id}"
          style="padding-left: ${indent}px"
        >
          <span class="tree-toggle ${hasChildren ? '' : 'hidden'}" data-toggle="${node.id}">
            ${hasChildren ? (isExpanded ? '▼' : '▶') : ''}
          </span>
          <span class="tree-icon">${nodeIcon}</span>
          <span class="tree-name">${node.name}</span>
          ${node.warnings.length > 0 ? `<span class="tree-warning">⚠</span>` : ''}
          ${node.renderCount > 1 ? `<span class="tree-renders">${node.renderCount}</span>` : ''}
        </div>

        ${hasChildren && isExpanded ? `
          <div class="tree-children">
            ${node.children.map(child => this.renderNode(child, depth + 1)).join('')}
          </div>
        ` : ''}
      </div>
    `;
    }
    getNodeIcon(node) {
        switch (node.type) {
            case 'component':
                return '⚛';
            case 'element':
                return `&lt;${node.name.toLowerCase()}&gt;`;
            case 'fragment':
                return '◇';
            case 'text':
                return '"';
            default:
                return '○';
        }
    }
    matchesSearch(node) {
        if (!this.searchQuery)
            return false;
        return node.name.toLowerCase().includes(this.searchQuery);
    }
    hasMatchingDescendant(node) {
        if (this.matchesSearch(node))
            return true;
        return node.children.some(child => this.hasMatchingDescendant(child));
    }
    renderEmptyState() {
        return `
      <div class="tree-empty">
        <p>No component tree available.</p>
        <p>Make sure PhilJS DevTools is connected.</p>
      </div>
    `;
    }
    expandAll() {
        if (this.root) {
            this.expandNodeRecursive(this.root);
        }
    }
    collapseAll() {
        this.expandedNodes.clear();
    }
    expandNodeRecursive(node) {
        this.expandedNodes.add(node.id);
        node.children.forEach(child => this.expandNodeRecursive(child));
    }
}
//# sourceMappingURL=ComponentTree.js.map