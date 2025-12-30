/**
 * Main Component Inspector Class
 *
 * Provides a visual interface for inspecting PhilJS component trees
 */

import type {
  ComponentNode,
  InspectorConfig,
  InspectorEvent,
  FilterOptions,
  PropInfo,
  StateInfo,
  SignalInfo
} from './types.js';

// Default configuration
const defaultConfig: InspectorConfig = {
  enabled: true,
  position: 'right',
  width: 400,
  height: 300,
  theme: 'dark',
  showPerformance: true,
  showNetwork: true,
  showStyles: true,
  showSource: true,
  highlightUpdates: true,
  trackRenderReasons: true,
  maxHistorySize: 100,
  shortcuts: {
    toggle: 'ctrl+shift+i',
    selectElement: 'ctrl+shift+c',
    search: 'ctrl+shift+f'
  }
};

// Global inspector instance
let inspectorInstance: ComponentInspector | null = null;

/**
 * Component Inspector - Main class for the visual inspector
 */
export class ComponentInspector {
  private config: InspectorConfig;
  private rootElement: HTMLElement | null = null;
  private selectedNode: ComponentNode | null = null;
  private hoveredNode: ComponentNode | null = null;
  private componentTree: ComponentNode | null = null;
  private eventListeners: Map<string, Set<(event: InspectorEvent) => void>> = new Map();
  private isVisible: boolean = false;
  private filter: FilterOptions = {
    showComponents: true,
    showElements: true,
    showIslands: true,
    showFragments: false,
    hideEmpty: false,
    searchQuery: '',
    componentNameFilter: []
  };
  private highlightOverlay: HTMLElement | null = null;
  private panelElement: HTMLElement | null = null;
  private updateScheduled: boolean = false;

  constructor(config: Partial<InspectorConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.initialize();
  }

  private initialize(): void {
    if (typeof window === 'undefined') return;

    // Create highlight overlay
    this.createHighlightOverlay();

    // Create inspector panel
    this.createInspectorPanel();

    // Setup keyboard shortcuts
    this.setupKeyboardShortcuts();

    // Hook into PhilJS component lifecycle
    this.hookComponentLifecycle();

    // Initial tree build
    this.rebuildTree();
  }

  private createHighlightOverlay(): void {
    this.highlightOverlay = document.createElement('div');
    this.highlightOverlay.id = 'philjs-inspector-highlight';
    this.highlightOverlay.style.cssText = `
      position: fixed;
      pointer-events: none;
      z-index: 999998;
      background: rgba(59, 130, 246, 0.2);
      border: 2px solid #3b82f6;
      border-radius: 2px;
      opacity: 0;
      transition: opacity 0.15s ease;
    `;

    // Add label
    const label = document.createElement('div');
    label.id = 'philjs-inspector-label';
    label.style.cssText = `
      position: absolute;
      top: -24px;
      left: 0;
      background: #3b82f6;
      color: white;
      padding: 2px 6px;
      font-size: 11px;
      font-family: system-ui, -apple-system, sans-serif;
      border-radius: 2px;
      white-space: nowrap;
    `;
    this.highlightOverlay.appendChild(label);

    document.body.appendChild(this.highlightOverlay);
  }

  private createInspectorPanel(): void {
    this.panelElement = document.createElement('div');
    this.panelElement.id = 'philjs-inspector-panel';

    const isDark = this.config.theme === 'dark' ||
      (this.config.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    const bgColor = isDark ? '#1e1e1e' : '#ffffff';
    const textColor = isDark ? '#e5e5e5' : '#1e1e1e';
    const borderColor = isDark ? '#333' : '#e5e7eb';

    this.panelElement.style.cssText = `
      position: fixed;
      ${this.config.position}: 0;
      top: 0;
      width: ${this.config.width}px;
      height: 100vh;
      background: ${bgColor};
      color: ${textColor};
      border-${this.config.position === 'right' ? 'left' : 'right'}: 1px solid ${borderColor};
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 12px;
      z-index: 999999;
      display: none;
      flex-direction: column;
      box-shadow: ${this.config.position === 'right' ? '-4px' : '4px'} 0 16px rgba(0,0,0,0.1);
    `;

    this.panelElement.innerHTML = this.renderPanelContent();
    document.body.appendChild(this.panelElement);

    this.attachPanelEventListeners();
  }

  private renderPanelContent(): string {
    const isDark = this.config.theme === 'dark' ||
      (this.config.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    return `
      <!-- Header -->
      <div style="padding: 8px 12px; border-bottom: 1px solid ${isDark ? '#333' : '#e5e7eb'}; display: flex; align-items: center; gap: 8px;">
        <span style="font-weight: 600; flex: 1;">PhilJS Inspector</span>
        <button id="inspector-select-mode" style="padding: 4px 8px; cursor: pointer; background: ${isDark ? '#2d2d2d' : '#f3f4f6'}; border: 1px solid ${isDark ? '#444' : '#d1d5db'}; border-radius: 4px; color: inherit;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
        </button>
        <button id="inspector-close" style="padding: 4px 8px; cursor: pointer; background: ${isDark ? '#2d2d2d' : '#f3f4f6'}; border: 1px solid ${isDark ? '#444' : '#d1d5db'}; border-radius: 4px; color: inherit;">×</button>
      </div>

      <!-- Search -->
      <div style="padding: 8px 12px; border-bottom: 1px solid ${isDark ? '#333' : '#e5e7eb'};">
        <input id="inspector-search" type="text" placeholder="Search components..." style="width: 100%; padding: 6px 8px; border: 1px solid ${isDark ? '#444' : '#d1d5db'}; border-radius: 4px; background: ${isDark ? '#2d2d2d' : '#ffffff'}; color: inherit; font-size: 12px;"/>
      </div>

      <!-- Tabs -->
      <div style="display: flex; border-bottom: 1px solid ${isDark ? '#333' : '#e5e7eb'};">
        <button class="inspector-tab active" data-tab="tree" style="flex: 1; padding: 8px; border: none; background: none; color: inherit; cursor: pointer; border-bottom: 2px solid #3b82f6;">Components</button>
        <button class="inspector-tab" data-tab="props" style="flex: 1; padding: 8px; border: none; background: none; color: inherit; cursor: pointer; opacity: 0.6;">Props</button>
        <button class="inspector-tab" data-tab="state" style="flex: 1; padding: 8px; border: none; background: none; color: inherit; cursor: pointer; opacity: 0.6;">State</button>
        <button class="inspector-tab" data-tab="styles" style="flex: 1; padding: 8px; border: none; background: none; color: inherit; cursor: pointer; opacity: 0.6;">Styles</button>
      </div>

      <!-- Content -->
      <div id="inspector-content" style="flex: 1; overflow: auto;">
        <div id="inspector-tree" class="inspector-panel-content" style="padding: 8px;">
          <div style="color: ${isDark ? '#888' : '#666'};">Loading component tree...</div>
        </div>
        <div id="inspector-props" class="inspector-panel-content" style="padding: 8px; display: none;">
          <div style="color: ${isDark ? '#888' : '#666'};">Select a component to view props</div>
        </div>
        <div id="inspector-state" class="inspector-panel-content" style="padding: 8px; display: none;">
          <div style="color: ${isDark ? '#888' : '#666'};">Select a component to view state</div>
        </div>
        <div id="inspector-styles" class="inspector-panel-content" style="padding: 8px; display: none;">
          <div style="color: ${isDark ? '#888' : '#666'};">Select a component to view styles</div>
        </div>
      </div>

      <!-- Footer -->
      <div style="padding: 8px 12px; border-top: 1px solid ${isDark ? '#333' : '#e5e7eb'}; font-size: 10px; color: ${isDark ? '#666' : '#999'};">
        <span id="inspector-component-count">0 components</span>
        <span style="float: right;">PhilJS DevTools v0.1.0</span>
      </div>
    `;
  }

  private attachPanelEventListeners(): void {
    if (!this.panelElement) return;

    // Close button
    this.panelElement.querySelector('#inspector-close')?.addEventListener('click', () => {
      this.hide();
    });

    // Select mode
    this.panelElement.querySelector('#inspector-select-mode')?.addEventListener('click', () => {
      this.enableSelectMode();
    });

    // Search
    const searchInput = this.panelElement.querySelector('#inspector-search') as HTMLInputElement;
    searchInput?.addEventListener('input', (e) => {
      this.filter.searchQuery = (e.target as HTMLInputElement).value;
      this.scheduleUpdate();
    });

    // Tabs
    this.panelElement.querySelectorAll('.inspector-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const tabName = (e.target as HTMLElement).dataset['tab'];
        this.switchTab(tabName || 'tree');
      });
    });
  }

  private switchTab(tabName: string): void {
    if (!this.panelElement) return;

    // Update tab buttons
    this.panelElement.querySelectorAll('.inspector-tab').forEach(tab => {
      const isActive = (tab as HTMLElement).dataset['tab'] === tabName;
      (tab as HTMLElement).style.borderBottom = isActive ? '2px solid #3b82f6' : '2px solid transparent';
      (tab as HTMLElement).style.opacity = isActive ? '1' : '0.6';
    });

    // Update content
    this.panelElement.querySelectorAll('.inspector-panel-content').forEach(content => {
      (content as HTMLElement).style.display = content.id === `inspector-${tabName}` ? 'block' : 'none';
    });
  }

  private setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', (e) => {
      const shortcut = this.getShortcutString(e);

      if (shortcut === this.config.shortcuts.toggle) {
        e.preventDefault();
        this.toggle();
      } else if (shortcut === this.config.shortcuts.selectElement) {
        e.preventDefault();
        this.enableSelectMode();
      } else if (shortcut === this.config.shortcuts.search && this.isVisible) {
        e.preventDefault();
        const searchInput = this.panelElement?.querySelector('#inspector-search') as HTMLInputElement;
        searchInput?.focus();
      }
    });
  }

  private getShortcutString(e: KeyboardEvent): string {
    const parts: string[] = [];
    if (e.ctrlKey || e.metaKey) parts.push('ctrl');
    if (e.shiftKey) parts.push('shift');
    if (e.altKey) parts.push('alt');
    parts.push(e.key.toLowerCase());
    return parts.join('+');
  }

  private hookComponentLifecycle(): void {
    // Hook into PhilJS component registry if available
    const registry = (window as any).__PHILJS_COMPONENT_REGISTRY__;
    if (registry) {
      registry.onMount = (node: ComponentNode) => {
        this.scheduleUpdate();
      };
      registry.onUpdate = (node: ComponentNode) => {
        this.scheduleUpdate();
        if (this.config.highlightUpdates) {
          this.flashHighlight(node);
        }
      };
      registry.onUnmount = (node: ComponentNode) => {
        this.scheduleUpdate();
      };
    }

    // Also observe DOM mutations as fallback
    const observer = new MutationObserver(() => {
      this.scheduleUpdate();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-component', 'island', 'data-hydrated']
    });
  }

  private scheduleUpdate(): void {
    if (this.updateScheduled) return;
    this.updateScheduled = true;

    requestAnimationFrame(() => {
      this.updateScheduled = false;
      this.rebuildTree();
      this.renderTree();
    });
  }

  private rebuildTree(): void {
    // Build component tree from DOM
    this.componentTree = this.buildNodeFromElement(document.body);
  }

  private buildNodeFromElement(element: Element, parent: ComponentNode | null = null): ComponentNode {
    const componentName = element.getAttribute('data-component') || element.tagName.toLowerCase();
    const isIsland = element.hasAttribute('island');
    const isHydrated = element.hasAttribute('data-hydrated');

    const keyValue = element.getAttribute('data-key');
    const node: ComponentNode = {
      id: this.generateNodeId(),
      name: componentName,
      type: isIsland ? 'island' : (element.getAttribute('data-component') ? 'component' : 'element'),
      element: element as HTMLElement,
      props: this.extractProps(element),
      state: this.extractState(element),
      signals: [],
      effects: [],
      children: [],
      parent,
      renderCount: parseInt(element.getAttribute('data-render-count') || '0'),
      lastRenderTime: parseFloat(element.getAttribute('data-render-time') || '0'),
      averageRenderTime: 0,
      isHydrated,
      ...(keyValue && { key: keyValue })
    };

    // Build children
    Array.from(element.children).forEach(child => {
      const childNode = this.buildNodeFromElement(child, node);
      if (this.shouldIncludeNode(childNode)) {
        node.children.push(childNode);
      }
    });

    return node;
  }

  private generateNodeId(): string {
    return `node-${Math.random().toString(36).substr(2, 9)}`;
  }

  private extractProps(element: Element): Record<string, unknown> {
    const props: Record<string, unknown> = {};
    Array.from(element.attributes).forEach(attr => {
      if (!attr.name.startsWith('data-')) {
        props[attr.name] = attr.value;
      }
    });
    return props;
  }

  private extractState(element: Element): Record<string, unknown> {
    const stateAttr = element.getAttribute('data-state');
    if (stateAttr) {
      try {
        return JSON.parse(stateAttr);
      } catch {
        return {};
      }
    }
    return {};
  }

  private shouldIncludeNode(node: ComponentNode): boolean {
    // Filter logic
    if (!this.filter.showElements && node.type === 'element') return false;
    if (!this.filter.showComponents && node.type === 'component') return false;
    if (!this.filter.showIslands && node.type === 'island') return false;
    if (!this.filter.showFragments && node.type === 'fragment') return false;
    if (this.filter.hideEmpty && node.children.length === 0 && Object.keys(node.props).length === 0) return false;
    if (this.filter.searchQuery && !node.name.toLowerCase().includes(this.filter.searchQuery.toLowerCase())) {
      // Check if any child matches
      const hasMatchingChild = node.children.some((child: ComponentNode) =>
        child.name.toLowerCase().includes(this.filter.searchQuery.toLowerCase())
      );
      if (!hasMatchingChild) return false;
    }
    return true;
  }

  private renderTree(): void {
    if (!this.panelElement || !this.componentTree) return;

    const treeContainer = this.panelElement.querySelector('#inspector-tree');
    if (!treeContainer) return;

    treeContainer.innerHTML = this.renderNode(this.componentTree);

    // Update component count
    const count = this.countNodes(this.componentTree);
    const countEl = this.panelElement.querySelector('#inspector-component-count');
    if (countEl) countEl.textContent = `${count} components`;

    // Attach node event listeners
    treeContainer.querySelectorAll('.inspector-node').forEach(nodeEl => {
      const nodeId = (nodeEl as HTMLElement).dataset['nodeId'];

      nodeEl.addEventListener('click', (e) => {
        e.stopPropagation();
        const node = this.findNodeById(nodeId!, this.componentTree!);
        if (node) this.selectNode(node);
      });

      nodeEl.addEventListener('mouseenter', () => {
        const node = this.findNodeById(nodeId!, this.componentTree!);
        if (node) this.hoverNode(node);
      });

      nodeEl.addEventListener('mouseleave', () => {
        this.unhoverNode();
      });
    });
  }

  private renderNode(node: ComponentNode, depth: number = 0): string {
    const isDark = this.config.theme === 'dark';
    const isSelected = this.selectedNode?.id === node.id;
    const indent = depth * 16;

    const typeColors: Record<string, string> = {
      component: '#3b82f6',
      island: '#10b981',
      element: isDark ? '#888' : '#666',
      portal: '#f59e0b',
      fragment: isDark ? '#666' : '#999'
    };

    const bgColor = isSelected ? (isDark ? '#2d3748' : '#e5e7eb') : 'transparent';

    let html = `
      <div class="inspector-node" data-node-id="${node.id}" style="
        padding: 4px 8px;
        padding-left: ${indent + 8}px;
        cursor: pointer;
        background: ${bgColor};
        border-radius: 4px;
        margin-bottom: 2px;
        display: flex;
        align-items: center;
        gap: 6px;
      ">
        ${node.children.length > 0 ? `
          <span style="color: ${isDark ? '#888' : '#666'}; font-size: 10px;">▼</span>
        ` : `
          <span style="width: 10px;"></span>
        `}
        <span style="color: ${typeColors[node.type]}; font-weight: 500;">${node.name}</span>
        ${node.isHydrated ? `<span style="font-size: 9px; padding: 1px 4px; background: #10b981; color: white; border-radius: 2px;">H</span>` : ''}
        ${node.key ? `<span style="font-size: 10px; color: ${isDark ? '#888' : '#666'};">key="${node.key}"</span>` : ''}
      </div>
    `;

    // Render children
    node.children.forEach((child: ComponentNode) => {
      html += this.renderNode(child, depth + 1);
    });

    return html;
  }

  private countNodes(node: ComponentNode): number {
    let count = 1;
    node.children.forEach((child: ComponentNode) => {
      count += this.countNodes(child);
    });
    return count;
  }

  private findNodeById(id: string, root: ComponentNode): ComponentNode | null {
    if (root.id === id) return root;
    for (const child of root.children) {
      const found = this.findNodeById(id, child);
      if (found) return found;
    }
    return null;
  }

  public selectNode(node: ComponentNode): void {
    this.selectedNode = node;
    this.renderTree();
    this.updatePropsPanel();
    this.updateStatePanel();
    this.updateStylesPanel();
    this.highlightElement(node.element);
    this.emit('component-selected', node);
  }

  private hoverNode(node: ComponentNode): void {
    this.hoveredNode = node;
    this.highlightElement(node.element);
    this.emit('component-hovered', node);
  }

  private unhoverNode(): void {
    this.hoveredNode = null;
    if (!this.selectedNode) {
      this.hideHighlight();
    } else {
      this.highlightElement(this.selectedNode.element);
    }
  }

  private highlightElement(element: HTMLElement | null): void {
    if (!this.highlightOverlay || !element) {
      this.hideHighlight();
      return;
    }

    const rect = element.getBoundingClientRect();
    this.highlightOverlay.style.left = `${rect.left}px`;
    this.highlightOverlay.style.top = `${rect.top}px`;
    this.highlightOverlay.style.width = `${rect.width}px`;
    this.highlightOverlay.style.height = `${rect.height}px`;
    this.highlightOverlay.style.opacity = '1';

    const label = this.highlightOverlay.querySelector('#philjs-inspector-label') as HTMLElement;
    if (label) {
      const node = this.selectedNode || this.hoveredNode;
      label.textContent = node?.name || element.tagName.toLowerCase();
    }
  }

  private hideHighlight(): void {
    if (this.highlightOverlay) {
      this.highlightOverlay.style.opacity = '0';
    }
  }

  private flashHighlight(node: ComponentNode): void {
    if (!node.element) return;

    const flash = document.createElement('div');
    flash.style.cssText = `
      position: fixed;
      pointer-events: none;
      background: rgba(59, 130, 246, 0.3);
      border: 2px solid #3b82f6;
      border-radius: 2px;
      z-index: 999997;
      animation: philjs-flash 0.5s ease-out;
    `;

    const rect = node.element.getBoundingClientRect();
    flash.style.left = `${rect.left}px`;
    flash.style.top = `${rect.top}px`;
    flash.style.width = `${rect.width}px`;
    flash.style.height = `${rect.height}px`;

    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 500);
  }

  private updatePropsPanel(): void {
    if (!this.panelElement || !this.selectedNode) return;

    const propsContainer = this.panelElement.querySelector('#inspector-props');
    if (!propsContainer) return;

    const props = this.selectedNode.props;
    const isDark = this.config.theme === 'dark';

    if (Object.keys(props).length === 0) {
      propsContainer.innerHTML = `<div style="color: ${isDark ? '#888' : '#666'};">No props</div>`;
      return;
    }

    propsContainer.innerHTML = Object.entries(props).map(([key, value]) => `
      <div style="padding: 4px 0; border-bottom: 1px solid ${isDark ? '#333' : '#e5e7eb'};">
        <span style="color: #3b82f6;">${key}</span>
        <span style="color: ${isDark ? '#888' : '#666'};">:</span>
        <span style="color: #10b981;">${JSON.stringify(value)}</span>
      </div>
    `).join('');
  }

  private updateStatePanel(): void {
    if (!this.panelElement || !this.selectedNode) return;

    const stateContainer = this.panelElement.querySelector('#inspector-state');
    if (!stateContainer) return;

    const state = this.selectedNode.state;
    const signals = this.selectedNode.signals;
    const isDark = this.config.theme === 'dark';

    if (Object.keys(state).length === 0 && signals.length === 0) {
      stateContainer.innerHTML = `<div style="color: ${isDark ? '#888' : '#666'};">No state</div>`;
      return;
    }

    let html = '';

    // Render signals
    if (signals.length > 0) {
      html += `<div style="margin-bottom: 12px;"><strong>Signals</strong></div>`;
      signals.forEach((signal: SignalInfo) => {
        html += `
          <div style="padding: 4px 0; border-bottom: 1px solid ${isDark ? '#333' : '#e5e7eb'};">
            <span style="color: #f59e0b;">${signal.name}</span>
            <span style="color: ${isDark ? '#888' : '#666'};">:</span>
            <span style="color: #10b981;">${JSON.stringify(signal.value)}</span>
            <span style="font-size: 10px; color: ${isDark ? '#666' : '#999'}; margin-left: 8px;">
              (${signal.subscribers} subscribers)
            </span>
          </div>
        `;
      });
    }

    // Render regular state
    if (Object.keys(state).length > 0) {
      html += `<div style="margin: 12px 0 8px 0;"><strong>State</strong></div>`;
      Object.entries(state).forEach(([key, value]) => {
        html += `
          <div style="padding: 4px 0; border-bottom: 1px solid ${isDark ? '#333' : '#e5e7eb'};">
            <span style="color: #3b82f6;">${key}</span>
            <span style="color: ${isDark ? '#888' : '#666'};">:</span>
            <span style="color: #10b981;">${JSON.stringify(value)}</span>
          </div>
        `;
      });
    }

    stateContainer.innerHTML = html;
  }

  private updateStylesPanel(): void {
    if (!this.panelElement || !this.selectedNode?.element) return;

    const stylesContainer = this.panelElement.querySelector('#inspector-styles');
    if (!stylesContainer) return;

    const element = this.selectedNode.element;
    const computedStyles = window.getComputedStyle(element);
    const isDark = this.config.theme === 'dark';

    // Get important CSS properties
    const importantProps = [
      'display', 'position', 'width', 'height',
      'margin', 'padding', 'border',
      'background', 'color', 'font-size',
      'flex', 'grid', 'gap'
    ];

    let html = `<div style="margin-bottom: 12px;"><strong>Computed Styles</strong></div>`;

    importantProps.forEach(prop => {
      const value = computedStyles.getPropertyValue(prop);
      if (value && value !== 'none' && value !== 'normal' && value !== '0px') {
        html += `
          <div style="padding: 2px 0; display: flex; justify-content: space-between;">
            <span style="color: #3b82f6;">${prop}</span>
            <span style="color: #10b981;">${value}</span>
          </div>
        `;
      }
    });

    // Box model
    const rect = element.getBoundingClientRect();
    html += `
      <div style="margin-top: 16px;"><strong>Box Model</strong></div>
      <div style="margin-top: 8px; text-align: center; color: ${isDark ? '#888' : '#666'};">
        <div>${computedStyles.marginTop} (margin-top)</div>
        <div style="display: flex; justify-content: center; align-items: center; gap: 8px;">
          <span>${computedStyles.marginLeft}</span>
          <div style="border: 1px solid ${isDark ? '#444' : '#ccc'}; padding: 8px;">
            <div style="border: 1px dashed ${isDark ? '#555' : '#aaa'}; padding: 8px;">
              ${Math.round(rect.width)} × ${Math.round(rect.height)}
            </div>
          </div>
          <span>${computedStyles.marginRight}</span>
        </div>
        <div>${computedStyles.marginBottom}</div>
      </div>
    `;

    stylesContainer.innerHTML = html;
  }

  private enableSelectMode(): void {
    document.body.style.cursor = 'crosshair';

    const handleClick = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      document.body.style.cursor = '';
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('mousemove', handleMove);

      const node = this.findNodeByElement(e.target as Element, this.componentTree!);
      if (node) {
        this.selectNode(node);
        this.switchTab('props');
      }
    };

    const handleMove = (e: MouseEvent) => {
      const node = this.findNodeByElement(e.target as Element, this.componentTree!);
      if (node) {
        this.highlightElement(node.element);
      }
    };

    document.addEventListener('click', handleClick, true);
    document.addEventListener('mousemove', handleMove);
  }

  private findNodeByElement(element: Element, root: ComponentNode): ComponentNode | null {
    if (root.element === element) return root;
    for (const child of root.children) {
      const found = this.findNodeByElement(element, child);
      if (found) return found;
    }
    return null;
  }

  public show(): void {
    if (!this.panelElement) return;
    this.panelElement.style.display = 'flex';
    this.isVisible = true;
    this.scheduleUpdate();
  }

  public hide(): void {
    if (!this.panelElement) return;
    this.panelElement.style.display = 'none';
    this.isVisible = false;
    this.hideHighlight();
  }

  public toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  public on(event: string, callback: (event: InspectorEvent) => void): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
    return () => this.off(event, callback);
  }

  public off(event: string, callback: (event: InspectorEvent) => void): void {
    this.eventListeners.get(event)?.delete(callback);
  }

  private emit(type: string, data: unknown): void {
    const event: InspectorEvent = {
      type: type as any,
      data,
      timestamp: Date.now()
    };
    this.eventListeners.get(type)?.forEach(cb => cb(event));
  }

  public destroy(): void {
    this.highlightOverlay?.remove();
    this.panelElement?.remove();
    this.eventListeners.clear();
  }

  public getSelectedComponent(): ComponentNode | null {
    return this.selectedNode;
  }

  public getComponentTree(): ComponentNode | null {
    return this.componentTree;
  }
}

/**
 * Create a new inspector instance
 */
export function createInspector(config?: Partial<InspectorConfig>): ComponentInspector {
  if (inspectorInstance) {
    inspectorInstance.destroy();
  }
  inspectorInstance = new ComponentInspector(config);
  return inspectorInstance;
}

/**
 * Get the current inspector instance
 */
export function getInspector(): ComponentInspector | null {
  return inspectorInstance;
}
