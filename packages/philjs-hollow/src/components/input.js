/**
 * Hollow Input Component
 * A versatile text input with validation support
 */
import { HollowElement, property, defineElement } from '../core/base-element.js';
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
export class HollowInput extends HollowElement {
    static observedAttributes = [
        'variant',
        'size',
        'type',
        'value',
        'placeholder',
        'disabled',
        'readonly',
        'required',
        'minlength',
        'maxlength',
        'pattern',
        'name',
        'autocomplete',
        'error',
    ];
    /** Form association */
    static formAssociated = true;
    @property({ type: 'string' })
    variant = 'default';
    @property({ type: 'string' })
    size = 'md';
    @property({ type: 'string' })
    type = 'text';
    @property({ type: 'string' })
    value = '';
    @property({ type: 'string' })
    placeholder = '';
    @property({ type: 'boolean', reflect: true })
    disabled = false;
    @property({ type: 'boolean' })
    readonly = false;
    @property({ type: 'boolean' })
    required = false;
    @property({ type: 'number' })
    minlength;
    @property({ type: 'number' })
    maxlength;
    @property({ type: 'string' })
    pattern;
    @property({ type: 'string' })
    name = '';
    @property({ type: 'string' })
    autocomplete = 'off';
    @property({ type: 'string' })
    error = '';
    template() {
        const variant = this.getProp('variant', 'default');
        const size = this.getProp('size', 'md');
        const type = this.getProp('type', 'text');
        const value = this.getProp('value', '');
        const placeholder = this.getProp('placeholder', '');
        const disabled = this.getProp('disabled', false);
        const readonly = this.getProp('readonly', false);
        const required = this.getProp('required', false);
        const minlength = this.getProp('minlength', undefined);
        const maxlength = this.getProp('maxlength', undefined);
        const pattern = this.getProp('pattern', undefined);
        const name = this.getProp('name', '');
        const autocomplete = this.getProp('autocomplete', 'off');
        const error = this.getProp('error', '');
        return `
      <div class="input-wrapper input-wrapper--${variant} input-wrapper--${size} ${error ? 'input-wrapper--error' : ''}" part="wrapper">
        <input
          part="input"
          class="input"
          type="${type}"
          value="${value}"
          placeholder="${placeholder}"
          name="${name}"
          autocomplete="${autocomplete}"
          ${disabled ? 'disabled' : ''}
          ${readonly ? 'readonly' : ''}
          ${required ? 'required' : ''}
          ${minlength !== undefined ? `minlength="${minlength}"` : ''}
          ${maxlength !== undefined ? `maxlength="${maxlength}"` : ''}
          ${pattern !== undefined ? `pattern="${pattern}"` : ''}
          data-on-input="handleInput"
          data-on-change="handleChange"
        />
        ${error ? `<span class="error-message" part="error">${error}</span>` : ''}
      </div>
    `;
    }
    styles() {
        return `
      :host {
        display: block;
      }

      :host([disabled]) {
        pointer-events: none;
      }

      .input-wrapper {
        position: relative;
        display: flex;
        flex-direction: column;
        gap: var(--hollow-spacing-1);
      }

      .input {
        font-family: var(--hollow-font-family);
        width: 100%;
        border-radius: var(--hollow-radius-md);
        transition: all var(--hollow-transition-normal) var(--hollow-transition-easing);
        outline: none;
        box-sizing: border-box;
      }

      /* Sizes */
      .input-wrapper--sm .input {
        padding: var(--hollow-spacing-1) var(--hollow-spacing-2);
        font-size: var(--hollow-font-size-sm);
        height: 2rem;
      }

      .input-wrapper--md .input {
        padding: var(--hollow-spacing-2) var(--hollow-spacing-3);
        font-size: var(--hollow-font-size-md);
        height: 2.5rem;
      }

      .input-wrapper--lg .input {
        padding: var(--hollow-spacing-3) var(--hollow-spacing-4);
        font-size: var(--hollow-font-size-lg);
        height: 3rem;
      }

      /* Variants */
      .input-wrapper--default .input {
        background: var(--hollow-color-background);
        border: 1px solid var(--hollow-color-border);
        color: var(--hollow-color-text);
      }

      .input-wrapper--default .input:hover:not(:disabled) {
        border-color: var(--hollow-color-border-focus);
      }

      .input-wrapper--outline .input {
        background: transparent;
        border: 2px solid var(--hollow-color-border);
        color: var(--hollow-color-text);
      }

      .input-wrapper--outline .input:hover:not(:disabled) {
        border-color: var(--hollow-color-primary);
      }

      .input-wrapper--filled .input {
        background: var(--hollow-color-background-muted);
        border: 1px solid transparent;
        color: var(--hollow-color-text);
      }

      .input-wrapper--filled .input:hover:not(:disabled) {
        background: var(--hollow-color-secondary);
      }

      /* States */
      .input:focus {
        border-color: var(--hollow-color-primary);
        box-shadow: 0 0 0 3px var(--hollow-color-ring);
      }

      .input:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        background: var(--hollow-color-background-muted);
      }

      .input::placeholder {
        color: var(--hollow-color-text-muted);
      }

      /* Error state */
      .input-wrapper--error .input {
        border-color: var(--hollow-color-error);
      }

      .input-wrapper--error .input:focus {
        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.25);
      }

      .error-message {
        font-size: var(--hollow-font-size-sm);
        color: var(--hollow-color-error);
      }
    `;
    }
    /**
     * Handle input event
     */
    handleInput(event) {
        const target = event.target;
        const oldValue = this.getProp('value', '');
        this.setProp('value', target.value);
        // Update form value
        if (this._internals) {
            this._internals.setFormValue(target.value);
        }
        // Emit custom event
        this.emit('hollow-input', {
            value: target.value,
            previousValue: oldValue,
            originalEvent: event,
        });
    }
    /**
     * Handle change event
     */
    handleChange(event) {
        const target = event.target;
        // Emit custom event
        this.emit('hollow-change', {
            value: target.value,
            valid: target.checkValidity(),
            originalEvent: event,
        });
    }
    /**
     * Focus the input
     */
    focus() {
        const input = this.query('input');
        input?.focus();
    }
    /**
     * Blur the input
     */
    blur() {
        const input = this.query('input');
        input?.blur();
    }
    /**
     * Select all text
     */
    select() {
        const input = this.query('input');
        input?.select();
    }
    /**
     * Check validity
     */
    checkValidity() {
        const input = this.query('input');
        return input?.checkValidity() ?? true;
    }
    /**
     * Report validity with browser UI
     */
    reportValidity() {
        const input = this.query('input');
        return input?.reportValidity() ?? true;
    }
}
// Register the element
defineElement('hollow-input', HollowInput);
export default HollowInput;
//# sourceMappingURL=input.js.map