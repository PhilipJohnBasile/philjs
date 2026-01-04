/**
 * Hollow Accordion Component
 * Collapsible sections with smooth animations and keyboard navigation
 */
import { HollowElement } from '../core/base-element.js';
/**
 * Accordion variants
 */
export type AccordionVariant = 'default' | 'bordered' | 'separated' | 'ghost';
/**
 * Accordion item definition
 */
export interface AccordionItem {
    id: string;
    title: string;
    content?: string;
    disabled?: boolean;
    icon?: string;
}
/**
 * Hollow Accordion Web Component
 *
 * @example
 * ```html
 * <hollow-accordion multiple>
 *   <hollow-accordion-item id="item1" title="Section 1">
 *     Content for section 1
 *   </hollow-accordion-item>
 *   <hollow-accordion-item id="item2" title="Section 2">
 *     Content for section 2
 *   </hollow-accordion-item>
 * </hollow-accordion>
 * ```
 */
export declare class HollowAccordion extends HollowElement {
    static observedAttributes: string[];
    variant: AccordionVariant;
    multiple: boolean;
    collapsible: boolean;
    expanded: string;
    items: AccordionItem[];
    private _expandedItems;
    protected template(): string;
    protected styles(): string;
    protected onConnect(): void;
    /**
     * Handle trigger click
     */
    private handleTriggerClick;
    /**
     * Handle keyboard navigation
     */
    private handleKeyDown;
    /**
     * Toggle an accordion item
     */
    toggleItem(itemId: string): void;
    /**
     * Expand an item
     */
    expand(itemId: string): void;
    /**
     * Collapse an item
     */
    collapse(itemId: string): void;
    /**
     * Expand all items (only in multiple mode)
     */
    expandAll(): void;
    /**
     * Collapse all items
     */
    collapseAll(): void;
    /**
     * Get expanded items
     */
    getExpandedItems(): string[];
    /**
     * Check if an item is expanded
     */
    isExpanded(itemId: string): boolean;
}
/**
 * Hollow Accordion Item Component (for slotted usage)
 */
export declare class HollowAccordionItem extends HollowElement {
    static observedAttributes: string[];
    title: string;
    expanded: boolean;
    disabled: boolean;
    icon: string;
    protected template(): string;
    protected styles(): string;
    protected onConnect(): void;
    private handleTriggerClick;
    private handleKeyDown;
    /**
     * Toggle the accordion item
     */
    toggle(): void;
    /**
     * Expand the item
     */
    expand(): void;
    /**
     * Collapse the item
     */
    collapse(): void;
}
export default HollowAccordion;
//# sourceMappingURL=accordion.d.ts.map