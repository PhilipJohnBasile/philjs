/**
 * Hollow Checkbox Component
 * A checkbox with checked state, indeterminate support, and accessibility
 */
import { HollowElement } from '../core/base-element.js';
/**
 * Checkbox sizes
 */
export type CheckboxSize = 'sm' | 'md' | 'lg';
/**
 * Checkbox variants
 */
export type CheckboxVariant = 'default' | 'primary' | 'success' | 'warning' | 'error';
/**
 * Hollow Checkbox Web Component
 *
 * @example
 * ```html
 * <hollow-checkbox checked>
 *   Accept terms and conditions
 * </hollow-checkbox>
 * ```
 */
export declare class HollowCheckbox extends HollowElement {
    static observedAttributes: string[];
    /** Form association */
    static formAssociated: boolean;
    variant: CheckboxVariant;
    size: CheckboxSize;
    checked: boolean;
    indeterminate: boolean;
    disabled: boolean;
    required: boolean;
    name: string;
    value: string;
    protected template(): string;
    protected styles(): string;
    protected onConnect(): void;
    protected onRender(): void;
    /**
     * Handle change event
     */
    private handleChange;
    /**
     * Handle keyboard events
     */
    private handleKeyDown;
    /**
     * Toggle the checkbox
     */
    toggle(): void;
    /**
     * Set checked state programmatically
     */
    setChecked(checked: boolean): void;
    /**
     * Set indeterminate state
     */
    setIndeterminate(indeterminate: boolean): void;
}
export default HollowCheckbox;
//# sourceMappingURL=checkbox.d.ts.map