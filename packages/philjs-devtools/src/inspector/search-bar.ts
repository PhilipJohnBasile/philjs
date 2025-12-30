/**
 * Search Bar - Component search with fuzzy matching
 */

import type { ComponentNode } from './types.js';

export interface SearchResult {
  node: ComponentNode;
  score: number;
  matchType: 'exact' | 'prefix' | 'contains' | 'fuzzy';
  highlights: Array<{ start: number; end: number }>;
}

export interface SearchOptions {
  caseSensitive?: boolean;
  searchProps?: boolean;
  searchState?: boolean;
  maxResults?: number;
  fuzzyThreshold?: number;
}

const defaultOptions: SearchOptions = {
  caseSensitive: false,
  searchProps: true,
  searchState: true,
  maxResults: 50,
  fuzzyThreshold: 0.6
};

export class SearchBar {
  private container: HTMLElement | null = null;
  private inputElement: HTMLInputElement | null = null;
  private resultsElement: HTMLElement | null = null;
  private options: SearchOptions;
  private currentQuery: string = '';
  private results: SearchResult[] = [];
  private selectedIndex: number = -1;
  private onSelect?: (node: ComponentNode) => void;
  private onHover?: (node: ComponentNode | null) => void;

  constructor(container: HTMLElement, options: SearchOptions = {}) {
    this.container = container;
    this.options = { ...defaultOptions, ...options };
    this.render();
  }

  private render(): void {
    if (!this.container) return;

    this.container.innerHTML = `
      <div style="position: relative;">
        <input
          type="text"
          id="inspector-search-input"
          placeholder="Search components... (⌘F)"
          style="
            width: 100%;
            padding: 8px 12px;
            padding-right: 32px;
            background: #2d2d2d;
            border: 1px solid #444;
            border-radius: 6px;
            color: #e5e5e5;
            font-size: 12px;
            outline: none;
          "
        />
        <svg
          style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); color: #666;"
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
        >
          <circle cx="11" cy="11" r="8"/>
          <path d="M21 21l-4.35-4.35"/>
        </svg>
      </div>
      <div id="inspector-search-results" style="
        position: absolute;
        left: 0;
        right: 0;
        top: 100%;
        max-height: 300px;
        overflow-y: auto;
        background: #1e1e1e;
        border: 1px solid #444;
        border-radius: 6px;
        margin-top: 4px;
        display: none;
        z-index: 10;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      "></div>
    `;

    this.inputElement = this.container.querySelector('#inspector-search-input');
    this.resultsElement = this.container.querySelector('#inspector-search-results');

    this.attachEventListeners();
  }

  private attachEventListeners(): void {
    if (!this.inputElement || !this.resultsElement) return;

    // Input events
    this.inputElement.addEventListener('input', (e) => {
      this.currentQuery = (e.target as HTMLInputElement).value;
      this.performSearch();
    });

    this.inputElement.addEventListener('focus', () => {
      if (this.results.length > 0) {
        this.showResults();
      }
    });

    this.inputElement.addEventListener('blur', () => {
      // Delay to allow click on result
      setTimeout(() => this.hideResults(), 150);
    });

    // Keyboard navigation
    this.inputElement.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          this.selectNext();
          break;
        case 'ArrowUp':
          e.preventDefault();
          this.selectPrevious();
          break;
        case 'Enter':
          e.preventDefault();
          this.confirmSelection();
          break;
        case 'Escape':
          this.hideResults();
          this.inputElement?.blur();
          break;
      }
    });
  }

  public search(tree: ComponentNode, query: string): SearchResult[] {
    if (!query.trim()) {
      return [];
    }

    const results: SearchResult[] = [];
    const normalizedQuery = this.options.caseSensitive ? query : query.toLowerCase();

    this.searchNode(tree, normalizedQuery, results);

    // Sort by score
    results.sort((a, b) => b.score - a.score);

    // Limit results
    return results.slice(0, this.options.maxResults);
  }

  private searchNode(node: ComponentNode, query: string, results: SearchResult[]): void {
    const name = this.options.caseSensitive ? node.name : node.name.toLowerCase();

    // Check component name
    const nameResult = this.matchString(name, query);
    if (nameResult) {
      results.push({
        node,
        score: nameResult.score * 2, // Boost name matches
        matchType: nameResult.matchType,
        highlights: nameResult.highlights
      });
    }

    // Check props
    if (this.options.searchProps) {
      for (const [key, value] of Object.entries(node.props)) {
        const propString = `${key}:${JSON.stringify(value)}`.toLowerCase();
        if (propString.includes(query)) {
          if (!results.find(r => r.node === node)) {
            results.push({
              node,
              score: 0.5,
              matchType: 'contains',
              highlights: []
            });
          }
          break;
        }
      }
    }

    // Check state
    if (this.options.searchState) {
      const stateString = JSON.stringify(node.state).toLowerCase();
      if (stateString.includes(query)) {
        if (!results.find(r => r.node === node)) {
          results.push({
            node,
            score: 0.3,
            matchType: 'contains',
            highlights: []
          });
        }
      }
    }

    // Search children
    for (const child of node.children) {
      this.searchNode(child, query, results);
    }
  }

  private matchString(text: string, query: string): {
    score: number;
    matchType: SearchResult['matchType'];
    highlights: SearchResult['highlights'];
  } | null {
    // Exact match
    if (text === query) {
      return {
        score: 1,
        matchType: 'exact',
        highlights: [{ start: 0, end: text.length }]
      };
    }

    // Prefix match
    if (text.startsWith(query)) {
      return {
        score: 0.9,
        matchType: 'prefix',
        highlights: [{ start: 0, end: query.length }]
      };
    }

    // Contains match
    const containsIndex = text.indexOf(query);
    if (containsIndex !== -1) {
      return {
        score: 0.7,
        matchType: 'contains',
        highlights: [{ start: containsIndex, end: containsIndex + query.length }]
      };
    }

    // Fuzzy match
    const fuzzyResult = this.fuzzyMatch(text, query);
    if (fuzzyResult && fuzzyResult.score >= (this.options.fuzzyThreshold || 0.6)) {
      return {
        score: fuzzyResult.score * 0.5, // Lower weight for fuzzy
        matchType: 'fuzzy',
        highlights: fuzzyResult.highlights
      };
    }

    return null;
  }

  private fuzzyMatch(text: string, query: string): {
    score: number;
    highlights: SearchResult['highlights'];
  } | null {
    const highlights: SearchResult['highlights'] = [];
    let queryIndex = 0;
    let consecutiveMatches = 0;
    let totalScore = 0;

    for (let i = 0; i < text.length && queryIndex < query.length; i++) {
      if (text[i] === query[queryIndex]) {
        highlights.push({ start: i, end: i + 1 });
        consecutiveMatches++;
        totalScore += consecutiveMatches; // Reward consecutive matches
        queryIndex++;
      } else {
        consecutiveMatches = 0;
      }
    }

    // All characters must be found
    if (queryIndex !== query.length) {
      return null;
    }

    // Calculate score based on matches and text length
    const score = (totalScore / (text.length + query.length)) * 2;
    return { score: Math.min(score, 1), highlights };
  }

  private performSearch(): void {
    // This would be called with the actual component tree
    // For now, we just update the UI
    if (this.currentQuery.trim()) {
      this.showResults();
    } else {
      this.hideResults();
    }
  }

  public updateResults(tree: ComponentNode): void {
    this.results = this.search(tree, this.currentQuery);
    this.renderResults();

    if (this.results.length > 0) {
      this.showResults();
    } else {
      this.hideResults();
    }
  }

  private renderResults(): void {
    if (!this.resultsElement) return;

    if (this.results.length === 0) {
      this.resultsElement.innerHTML = `
        <div style="padding: 12px; text-align: center; color: #666;">
          No components found
        </div>
      `;
      return;
    }

    this.resultsElement.innerHTML = this.results.map((result, index) => {
      const isSelected = index === this.selectedIndex;
      const highlightedName = this.highlightText(result.node.name, result.highlights);

      return `
        <div
          class="search-result-item"
          data-index="${index}"
          style="
            padding: 8px 12px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            background: ${isSelected ? '#3b82f6' : 'transparent'};
            color: ${isSelected ? 'white' : '#e5e5e5'};
          "
        >
          <span style="
            color: ${this.getTypeColor(result.node.type)};
            font-size: 10px;
            padding: 1px 4px;
            background: ${isSelected ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)'};
            border-radius: 2px;
          ">
            ${result.node.type}
          </span>
          <span>${highlightedName}</span>
          <span style="font-size: 10px; color: ${isSelected ? 'rgba(255,255,255,0.7)' : '#666'}; margin-left: auto;">
            ${result.matchType}
          </span>
        </div>
      `;
    }).join('');

    // Attach click handlers
    this.resultsElement.querySelectorAll('.search-result-item').forEach((item) => {
      item.addEventListener('click', () => {
        const index = parseInt((item as HTMLElement).dataset['index'] || '0');
        this.selectedIndex = index;
        this.confirmSelection();
      });

      item.addEventListener('mouseenter', () => {
        const index = parseInt((item as HTMLElement).dataset['index'] || '0');
        this.selectedIndex = index;
        this.renderResults();
        this.onHover?.(this.results[index]?.node || null);
      });

      item.addEventListener('mouseleave', () => {
        this.onHover?.(null);
      });
    });
  }

  private highlightText(text: string, highlights: SearchResult['highlights']): string {
    if (highlights.length === 0) return text;

    let result = '';
    let lastIndex = 0;

    for (const { start, end } of highlights) {
      result += text.slice(lastIndex, start);
      result += `<mark style="background: #f59e0b; color: black; padding: 0 1px; border-radius: 1px;">${text.slice(start, end)}</mark>`;
      lastIndex = end;
    }

    result += text.slice(lastIndex);
    return result;
  }

  private getTypeColor(type: string): string {
    const colors: Record<string, string> = {
      component: '#3b82f6',
      element: '#888',
      island: '#10b981',
      portal: '#f59e0b',
      fragment: '#666'
    };
    return colors[type] || '#888';
  }

  private showResults(): void {
    if (this.resultsElement) {
      this.resultsElement.style.display = 'block';
    }
  }

  private hideResults(): void {
    if (this.resultsElement) {
      this.resultsElement.style.display = 'none';
    }
  }

  private selectNext(): void {
    if (this.results.length === 0) return;
    this.selectedIndex = (this.selectedIndex + 1) % this.results.length;
    this.renderResults();
    this.scrollToSelected();
  }

  private selectPrevious(): void {
    if (this.results.length === 0) return;
    this.selectedIndex = this.selectedIndex <= 0 ? this.results.length - 1 : this.selectedIndex - 1;
    this.renderResults();
    this.scrollToSelected();
  }

  private scrollToSelected(): void {
    if (!this.resultsElement) return;
    const selected = this.resultsElement.querySelector(`[data-index="${this.selectedIndex}"]`);
    selected?.scrollIntoView({ block: 'nearest' });
  }

  private confirmSelection(): void {
    if (this.selectedIndex >= 0 && this.selectedIndex < this.results.length) {
      const result = this.results[this.selectedIndex];
      if (result) {
        this.onSelect?.(result.node);
      }
      this.hideResults();
    }
  }

  public onComponentSelect(callback: (node: ComponentNode) => void): void {
    this.onSelect = callback;
  }

  public onComponentHover(callback: (node: ComponentNode | null) => void): void {
    this.onHover = callback;
  }

  public focus(): void {
    this.inputElement?.focus();
  }

  public clear(): void {
    if (this.inputElement) {
      this.inputElement.value = '';
    }
    this.currentQuery = '';
    this.results = [];
    this.selectedIndex = -1;
    this.hideResults();
  }

  public getValue(): string {
    return this.currentQuery;
  }
}
