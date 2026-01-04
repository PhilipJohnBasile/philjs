/**
 * Hollow Input Component
 * A versatile text input with validation support
 */
import { HollowElement } from '../core/base-element.js';
/**
 * Input variants
 */
export type InputVariant = 'default' | 'outline' | 'filled';
/**
 * Input sizes
 */
export type InputSize = 'sm' | 'md' | 'lg';
/**
 * Input types
 */
export type InputType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
/**
 * Hollow Input Web Component
 *
 * @example
 * ```html
 * <hollow-input
 *   placeholder="Enter your email"
 *   type="email"
 *   required
 * ></hollow-input>
 * ```
 */
export declare class HollowInput extends HollowElement {
    static observedAttributes: string[];
    /** Form association */
    static formAssociated: boolean;
    variant: InputVariant;
    size: InputSize;
    type: InputType;
    value: string;
    placeholder: string;
    disabled: boolean;
    readonly: boolean;
    required: boolean;
    minlength?: number;
    maxlength?: number;
    pattern?: string;
    name: string;
    autocomplete: string;
    error: string;
    protected template(): string;
    protected styles(): string;
    /**
     * Handle input event
     */
    private handleInput;
    /**
     * Handle change event
     */
    private handleChange;
    /**
     * Focus the input
     */
    focus(): void;
    /**
     * Blur the input
     */
    blur(): void;
    /**
     * Select all text
     */
    select(): void;
    /**
     * Check validity
     */
    checkValidity(): boolean;
    /**
     * Report validity with browser UI
     */
    reportValidity(): boolean;
}
export default HollowInput;
//# sourceMappingURL=input.d.ts.map