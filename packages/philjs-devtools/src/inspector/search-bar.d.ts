/**
 * Search Bar - Component search with fuzzy matching
 */
import type { ComponentNode } from './types.js';
export interface SearchResult {
    node: ComponentNode;
    score: number;
    matchType: 'exact' | 'prefix' | 'contains' | 'fuzzy';
    highlights: Array<{
        start: number;
        end: number;
    }>;
}
export interface SearchOptions {
    caseSensitive?: boolean;
    searchProps?: boolean;
    searchState?: boolean;
    maxResults?: number;
    fuzzyThreshold?: number;
}
export declare class SearchBar {
    private container;
    private inputElement;
    private resultsElement;
    private options;
    private currentQuery;
    private results;
    private selectedIndex;
    private onSelect?;
    private onHover?;
    constructor(container: HTMLElement, options?: SearchOptions);
    private render;
    private attachEventListeners;
    search(tree: ComponentNode, query: string): SearchResult[];
    private searchNode;
    private matchString;
    private fuzzyMatch;
    private performSearch;
    updateResults(tree: ComponentNode): void;
    private renderResults;
    private highlightText;
    private getTypeColor;
    private showResults;
    private hideResults;
    private selectNext;
    private selectPrevious;
    private scrollToSelected;
    private confirmSelection;
    onComponentSelect(callback: (node: ComponentNode) => void): void;
    onComponentHover(callback: (node: ComponentNode | null) => void): void;
    focus(): void;
    clear(): void;
    getValue(): string;
}
//# sourceMappingURL=search-bar.d.ts.map