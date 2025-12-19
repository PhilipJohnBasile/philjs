/**
 * PhilJS DevTools - Dependency Graph Visualization
 * Interactive D3.js-based graph showing signal dependencies
 */

export class DependencyGraph {
  constructor(container) {
    this.container = container;
    this.nodes = new Map();
    this.links = [];
    this.svg = null;
    this.simulation = null;
    this.width = 0;
    this.height = 0;
    this.zoom = null;

    this.init();
  }

  init() {
    // Clear container
    this.container.innerHTML = '';

    // Create SVG
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.style.width = '100%';
    this.svg.style.height = '100%';
    this.svg.style.border = '1px solid var(--border)';
    this.svg.style.borderRadius = '4px';
    this.svg.style.background = 'var(--bg-primary)';

    this.container.appendChild(this.svg);

    // Update dimensions
    this.updateDimensions();

    // Create groups
    this.g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.svg.appendChild(this.g);

    this.linksGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.linksGroup.setAttribute('class', 'links');
    this.g.appendChild(this.linksGroup);

    this.nodesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.nodesGroup.setAttribute('class', 'nodes');
    this.g.appendChild(this.nodesGroup);

    // Setup zoom
    this.setupZoom();

    // Handle resize
    window.addEventListener('resize', () => this.updateDimensions());
  }

  updateDimensions() {
    const rect = this.container.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;
    this.svg.setAttribute('viewBox', `0 0 ${this.width} ${this.height}`);
  }

  setupZoom() {
    let transform = { x: 0, y: 0, k: 1 };

    const handleZoom = (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        transform.k = Math.max(0.1, Math.min(5, transform.k * delta));
        this.applyTransform(transform);
      }
    };

    this.svg.addEventListener('wheel', handleZoom);

    // Pan support
    let isPanning = false;
    let startX, startY;

    this.svg.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        isPanning = true;
        startX = e.clientX - transform.x;
        startY = e.clientY - transform.y;
      }
    });

    this.svg.addEventListener('mousemove', (e) => {
      if (isPanning) {
        transform.x = e.clientX - startX;
        transform.y = e.clientY - startY;
        this.applyTransform(transform);
      }
    });

    this.svg.addEventListener('mouseup', () => {
      isPanning = false;
    });

    this.svg.addEventListener('mouseleave', () => {
      isPanning = false;
    });
  }

  applyTransform(transform) {
    this.g.setAttribute('transform', `translate(${transform.x},${transform.y}) scale(${transform.k})`);
  }

  updateGraph(signals, selectedSignalId = null) {
    // Build node and link data
    this.nodes.clear();
    this.links = [];

    signals.forEach(signal => {
      this.nodes.set(signal.id, {
        id: signal.id,
        name: signal.name,
        value: signal.value,
        subscribers: signal.subscribers || 0,
        dependencies: signal.dependencies || [],
        isSelected: signal.id === selectedSignalId
      });
    });

    // Create links from dependencies
    signals.forEach(signal => {
      if (signal.dependencies && signal.dependencies.length > 0) {
        signal.dependencies.forEach(depId => {
          if (this.nodes.has(depId)) {
            this.links.push({
              source: depId,
              target: signal.id
            });
          }
        });
      }
    });

    // If a signal is selected, filter to show only related nodes
    if (selectedSignalId) {
      this.filterBySignal(selectedSignalId);
    }

    this.render();
  }

  filterBySignal(signalId) {
    const relatedNodes = new Set([signalId]);

    // Add dependencies (incoming)
    const addDependencies = (id) => {
      const node = this.nodes.get(id);
      if (node && node.dependencies) {
        node.dependencies.forEach(depId => {
          if (!relatedNodes.has(depId)) {
            relatedNodes.add(depId);
            addDependencies(depId);
          }
        });
      }
    };

    // Add subscribers (outgoing)
    const addSubscribers = (id) => {
      this.links.forEach(link => {
        if (link.source === id && !relatedNodes.has(link.target)) {
          relatedNodes.add(link.target);
          addSubscribers(link.target);
        }
      });
    };

    addDependencies(signalId);
    addSubscribers(signalId);

    // Filter nodes and links
    const filteredNodes = new Map();
    relatedNodes.forEach(id => {
      if (this.nodes.has(id)) {
        filteredNodes.set(id, this.nodes.get(id));
      }
    });
    this.nodes = filteredNodes;

    this.links = this.links.filter(link =>
      relatedNodes.has(link.source) && relatedNodes.has(link.target)
    );
  }

  render() {
    // Use force-directed layout
    const nodeArray = Array.from(this.nodes.values());

    if (nodeArray.length === 0) {
      this.renderEmpty();
      return;
    }

    // Position nodes using simple force simulation
    this.layoutNodes(nodeArray);

    // Render links
    this.renderLinks();

    // Render nodes
    this.renderNodes(nodeArray);
  }

  layoutNodes(nodeArray) {
    const centerX = this.width / 2;
    const centerY = this.height / 2;

    if (nodeArray.length === 1) {
      nodeArray[0].x = centerX;
      nodeArray[0].y = centerY;
      return;
    }

    // Simple circular layout
    const selectedNode = nodeArray.find(n => n.isSelected);
    if (selectedNode) {
      selectedNode.x = centerX;
      selectedNode.y = centerY;

      const others = nodeArray.filter(n => !n.isSelected);
      const radius = Math.min(this.width, this.height) / 3;

      others.forEach((node, i) => {
        const angle = (2 * Math.PI * i) / others.length;
        node.x = centerX + radius * Math.cos(angle);
        node.y = centerY + radius * Math.sin(angle);
      });
    } else {
      // Circular layout for all
      const radius = Math.min(this.width, this.height) / 3;
      nodeArray.forEach((node, i) => {
        const angle = (2 * Math.PI * i) / nodeArray.length;
        node.x = centerX + radius * Math.cos(angle);
        node.y = centerY + radius * Math.sin(angle);
      });
    }
  }

  renderLinks() {
    this.linksGroup.innerHTML = '';

    this.links.forEach(link => {
      const sourceNode = this.nodes.get(link.source);
      const targetNode = this.nodes.get(link.target);

      if (!sourceNode || !targetNode) return;

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', sourceNode.x);
      line.setAttribute('y1', sourceNode.y);
      line.setAttribute('x2', targetNode.x);
      line.setAttribute('y2', targetNode.y);
      line.setAttribute('stroke', '#d1d5db');
      line.setAttribute('stroke-width', '2');
      line.setAttribute('marker-end', 'url(#arrow)');

      this.linksGroup.appendChild(line);
    });

    // Add arrow marker definition
    if (!this.svg.querySelector('defs')) {
      const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
      marker.setAttribute('id', 'arrow');
      marker.setAttribute('viewBox', '0 0 10 10');
      marker.setAttribute('refX', '20');
      marker.setAttribute('refY', '5');
      marker.setAttribute('markerWidth', '6');
      marker.setAttribute('markerHeight', '6');
      marker.setAttribute('orient', 'auto');

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z');
      path.setAttribute('fill', '#d1d5db');

      marker.appendChild(path);
      defs.appendChild(marker);
      this.svg.insertBefore(defs, this.g);
    }
  }

  renderNodes(nodeArray) {
    this.nodesGroup.innerHTML = '';

    nodeArray.forEach(node => {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('transform', `translate(${node.x},${node.y})`);
      g.style.cursor = 'pointer';

      // Circle
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('r', node.isSelected ? '40' : '30');
      circle.setAttribute('fill', node.isSelected ? '#3b82f6' : '#60a5fa');
      circle.setAttribute('stroke', '#fff');
      circle.setAttribute('stroke-width', '2');

      // Text
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dy', '0.3em');
      text.setAttribute('fill', '#fff');
      text.setAttribute('font-size', '12');
      text.setAttribute('font-weight', '500');
      text.textContent = node.name.slice(0, 8);

      // Badge for subscriber count
      if (node.subscribers > 0) {
        const badge = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        badge.setAttribute('cx', '20');
        badge.setAttribute('cy', '-20');
        badge.setAttribute('r', '10');
        badge.setAttribute('fill', '#ef4444');

        const badgeText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        badgeText.setAttribute('x', '20');
        badgeText.setAttribute('y', '-20');
        badgeText.setAttribute('text-anchor', 'middle');
        badgeText.setAttribute('dy', '0.3em');
        badgeText.setAttribute('fill', '#fff');
        badgeText.setAttribute('font-size', '10');
        badgeText.textContent = node.subscribers;

        g.appendChild(badge);
        g.appendChild(badgeText);
      }

      g.appendChild(circle);
      g.appendChild(text);

      // Tooltip
      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      title.textContent = `${node.name}\nValue: ${JSON.stringify(node.value)}\nSubscribers: ${node.subscribers}`;
      g.appendChild(title);

      // Events
      g.addEventListener('click', () => {
        this.dispatchEvent('nodeClick', node);
      });

      g.addEventListener('mouseenter', () => {
        circle.setAttribute('fill', '#2563eb');
      });

      g.addEventListener('mouseleave', () => {
        circle.setAttribute('fill', node.isSelected ? '#3b82f6' : '#60a5fa');
      });

      this.nodesGroup.appendChild(g);
    });
  }

  renderEmpty() {
    this.linksGroup.innerHTML = '';
    this.nodesGroup.innerHTML = '';

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', this.width / 2);
    text.setAttribute('y', this.height / 2);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', 'var(--text-tertiary)');
    text.setAttribute('font-size', '14');
    text.textContent = 'No signal dependencies to display';

    this.nodesGroup.appendChild(text);
  }

  dispatchEvent(eventName, detail) {
    const event = new CustomEvent(eventName, { detail });
    this.container.dispatchEvent(event);
  }

  destroy() {
    this.container.innerHTML = '';
  }
}
