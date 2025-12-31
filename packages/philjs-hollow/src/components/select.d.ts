/**
 * Hollow Select Component
 * A dropdown select with searchable options and keyboard navigation
 */
import { HollowElement } from '../core/base-element.js';
/**
 * Select variants
 */
export type SelectVariant = 'default' | 'outline' | 'filled';
/**
 * Select sizes
 */
export type SelectSize = 'sm' | 'md' | 'lg';
/**
 * Option type
 */
export interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
    group?: string;
}
/**
 * Hollow Select Web Component
 *
 * @example
 * ```html
 * <hollow-select
 *   placeholder="Select an option"
 *   searchable
 *   options='[{"value":"1","label":"Option 1"},{"value":"2","label":"Option 2"}]'
 * ></hollow-select>
 * ```
 */
export declare class HollowSelect extends HollowElement {
    static observedAttributes: string[];
    /** Form association */
    static formAssociated: boolean;
    variant: SelectVariant;
    size: SelectSize;
    value: string;
    placeholder: string;
    disabled: boolean;
    required: boolean;
    searchable: boolean;
    clearable: boolean;
    multiple: boolean;
    options: SelectOption[];
    name: string;
    error: string;
    private _isOpen;
    private _searchQuery;
    private _highlightedIndex;
    protected template(): string;
    protected styles(): string;
    protected onConnect(): void;
    protected onDisconnect(): void;
    /**
     * Handle trigger click
     */
    private handleTriggerClick;
    /**
     * Handle option click
     */
    private handleOptionClick;
    /**
     * Handle search input
     */
    private handleSearchInput;
    /**
     * Handle clear button
     */
    private handleClear;
    /**
     * Handle outside click
     */
    private handleOutsideClick;
    /**
     * Handle keyboard navigation
     */
    private handleKeyDown;
    /**
     * Get filtered options
     */
    private getFilteredOptions;
    /**
     * Scroll to highlighted option
     */
    private scrollToHighlighted;
    /**
     * Select a value
     */
    private selectValue;
    /**
     * Manual render scheduling
     */
    private scheduleRenderManual;
    /**
     * Open the dropdown
     */
    show(): void;
    /**
     * Close the dropdown
     */
    hide(): void;
    /**
     * Focus the select
     */
    focus(): void;
}
export default HollowSelect;
//# sourceMappingURL=select.d.ts.map