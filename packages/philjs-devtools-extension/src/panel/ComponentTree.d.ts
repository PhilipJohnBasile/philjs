/**
 * PhilJS DevTools - Component Tree
 */
import type { ComponentNode } from '../types';
export declare class ComponentTree {
    private root;
    private selectedId;
    private expandedNodes;
    private searchQuery;
    update(root: ComponentNode | null): void;
    select(nodeId: string | null): void;
    toggle(nodeId: string): void;
    search(query: string): void;
    render(): string;
    private renderNode;
    private getNodeIcon;
    private matchesSearch;
    private hasMatchingDescendant;
    private renderEmptyState;
    expandAll(): void;
    collapseAll(): void;
    private expandNodeRecursive;
}
//# sourceMappingURL=ComponentTree.d.ts.map