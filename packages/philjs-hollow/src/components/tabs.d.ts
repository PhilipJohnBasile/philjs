/**
 * Hollow Tabs Component
 * A tab container with tab panels and keyboard navigation
 */
import { HollowElement } from '../core/base-element.js';
/**
 * Tabs variants
 */
export type TabsVariant = 'default' | 'pills' | 'underline' | 'enclosed';
/**
 * Tabs sizes
 */
export type TabsSize = 'sm' | 'md' | 'lg';
/**
 * Tab alignment
 */
export type TabsAlignment = 'start' | 'center' | 'end' | 'stretch';
/**
 * Tab definition
 */
export interface TabDefinition {
    id: string;
    label: string;
    disabled?: boolean;
    icon?: string;
}
/**
 * Hollow Tabs Web Component
 *
 * @example
 * ```html
 * <hollow-tabs active="tab1" variant="underline">
 *   <hollow-tab-list>
 *     <hollow-tab id="tab1">Tab 1</hollow-tab>
 *     <hollow-tab id="tab2">Tab 2</hollow-tab>
 *   </hollow-tab-list>
 *   <hollow-tab-panel tab="tab1">Content 1</hollow-tab-panel>
 *   <hollow-tab-panel tab="tab2">Content 2</hollow-tab-panel>
 * </hollow-tabs>
 * ```
 */
export declare class HollowTabs extends HollowElement {
    static observedAttributes: string[];
    variant: TabsVariant;
    size: TabsSize;
    active: string;
    alignment: TabsAlignment;
    tabs: TabDefinition[];
    protected template(): string;
    protected styles(): string;
    protected onConnect(): void;
    /**
     * Handle tab click
     */
    private handleTabClick;
    /**
     * Handle keyboard navigation
     */
    private handleKeyDown;
    /**
     * Select a tab by ID
     */
    selectTab(tabId: string): void;
    /**
     * Get the currently active tab ID
     */
    getActiveTab(): string;
    /**
     * Set tabs programmatically
     */
    setTabs(tabs: TabDefinition[]): void;
}
/**
 * Hollow Tab List Component (for slotted usage)
 */
export declare class HollowTabList extends HollowElement {
    protected template(): string;
    protected styles(): string;
}
/**
 * Hollow Tab Component (for slotted usage)
 */
export declare class HollowTab extends HollowElement {
    static observedAttributes: string[];
    active: boolean;
    disabled: boolean;
    protected template(): string;
    protected styles(): string;
    private handleClick;
}
/**
 * Hollow Tab Panel Component (for slotted usage)
 */
export declare class HollowTabPanel extends HollowElement {
    static observedAttributes: string[];
    tab: string;
    active: boolean;
    protected template(): string;
    protected styles(): string;
}
export default HollowTabs;
//# sourceMappingURL=tabs.d.ts.map