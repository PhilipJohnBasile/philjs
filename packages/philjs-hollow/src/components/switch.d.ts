/**
 * Hollow Switch Component
 * An iOS-style toggle switch with smooth animations
 */
import { HollowElement } from '../core/base-element.js';
/**
 * Switch sizes
 */
export type SwitchSize = 'sm' | 'md' | 'lg';
/**
 * Switch variants
 */
export type SwitchVariant = 'default' | 'primary' | 'success' | 'warning' | 'error';
/**
 * Hollow Switch Web Component
 *
 * @example
 * ```html
 * <hollow-switch checked variant="success">
 *   Enable notifications
 * </hollow-switch>
 * ```
 */
export declare class HollowSwitch extends HollowElement {
    static observedAttributes: string[];
    /** Form association */
    static formAssociated: boolean;
    variant: SwitchVariant;
    size: SwitchSize;
    checked: boolean;
    disabled: boolean;
    required: boolean;
    name: string;
    value: string;
    labelOn: string;
    labelOff: string;
    protected template(): string;
    protected styles(): string;
    protected onConnect(): void;
    /**
     * Handle change event
     */
    private handleChange;
    /**
     * Handle keyboard events
     */
    private handleKeyDown;
    /**
     * Toggle the switch
     */
    toggle(): void;
    /**
     * Set checked state programmatically
     */
    setChecked(checked: boolean): void;
}
export default HollowSwitch;
//# sourceMappingURL=switch.d.ts.map