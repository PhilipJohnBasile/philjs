/**
 * Hollow Button Component
 * A versatile button with multiple variants and sizes
 */
import { HollowElement, property, defineElement } from '../core/base-element.js';
/**
 * Hollow Button Web Component
 *
 * @example
 * ```html
 * <hollow-button variant="primary" size="md">Click me</hollow-button>
 * ```
 */
export class HollowButton extends HollowElement {
    static observedAttributes = ['variant', 'size', 'disabled', 'loading', 'type'];
    /** Form association */
    static formAssociated = true;
    @property({ type: 'string' })
    variant = 'primary';
    @property({ type: 'string' })
    size = 'md';
    @property({ type: 'boolean', reflect: true })
    disabled = false;
    @property({ type: 'boolean', reflect: true })
    loading = false;
    @property({ type: 'string' })
    type = 'button';
    template() {
        const variant = this.getProp('variant', 'primary');
        const size = this.getProp('size', 'md');
        const disabled = this.getProp('disabled', false);
        const loading = this.getProp('loading', false);
        const type = this.getProp('type', 'button');
        return `
      <button
        part="button"
        class="button button--${variant} button--${size}"
        type="${type}"
        ${disabled || loading ? 'disabled' : ''}
        data-on-click="handleClick"
      >
        ${loading ? '<span class="spinner" part="spinner"></span>' : ''}
        <span class="content" part="content">
          <slot></slot>
        </span>
      </button>
    `;
    }
    styles() {
        return `
      :host {
        display: inline-block;
      }

      :host([disabled]) {
        pointer-events: none;
      }

      .button {
        font-family: var(--hollow-font-family);
        font-weight: var(--hollow-font-weight-medium);
        border-radius: var(--hollow-radius-md);
        cursor: pointer;
        transition: all var(--hollow-transition-normal) var(--hollow-transition-easing);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: var(--hollow-spacing-2);
        border: none;
        outline: none;
        text-decoration: none;
        white-space: nowrap;
        user-select: none;
        -webkit-tap-highlight-color: transparent;
      }

      /* Sizes */
      .button--sm {
        padding: var(--hollow-spacing-1) var(--hollow-spacing-3);
        font-size: var(--hollow-font-size-sm);
        height: 2rem;
      }

      .button--md {
        padding: var(--hollow-spacing-2) var(--hollow-spacing-4);
        font-size: var(--hollow-font-size-md);
        height: 2.5rem;
      }

      .button--lg {
        padding: var(--hollow-spacing-3) var(--hollow-spacing-6);
        font-size: var(--hollow-font-size-lg);
        height: 3rem;
      }

      /* Variants */
      .button--primary {
        background: var(--hollow-color-primary);
        color: var(--hollow-color-primary-foreground);
      }

      .button--primary:hover:not(:disabled) {
        filter: brightness(0.9);
      }

      .button--secondary {
        background: var(--hollow-color-secondary);
        color: var(--hollow-color-secondary-foreground);
      }

      .button--secondary:hover:not(:disabled) {
        filter: brightness(0.95);
      }

      .button--outline {
        background: transparent;
        color: var(--hollow-color-primary);
        border: 1px solid currentColor;
      }

      .button--outline:hover:not(:disabled) {
        background: var(--hollow-color-primary);
        color: var(--hollow-color-primary-foreground);
      }

      .button--ghost {
        background: transparent;
        color: var(--hollow-color-text);
      }

      .button--ghost:hover:not(:disabled) {
        background: var(--hollow-color-secondary);
      }

      .button--destructive {
        background: var(--hollow-color-error);
        color: var(--hollow-color-error-foreground);
      }

      .button--destructive:hover:not(:disabled) {
        filter: brightness(0.9);
      }

      /* States */
      .button:focus-visible {
        outline: 2px solid var(--hollow-color-ring);
        outline-offset: 2px;
      }

      .button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .button:active:not(:disabled) {
        transform: scale(0.98);
      }

      /* Content */
      .content {
        display: inline-flex;
        align-items: center;
        gap: var(--hollow-spacing-2);
      }

      /* Spinner */
      .spinner {
        width: 1em;
        height: 1em;
        border: 2px solid transparent;
        border-top-color: currentColor;
        border-radius: 50%;
        animation: spin 0.6s linear infinite;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;
    }
    /**
     * Handle click event
     */
    handleClick(event) {
        if (this.getProp('disabled') || this.getProp('loading')) {
            event.preventDefault();
            event.stopPropagation();
            return;
        }
        // Emit custom event
        this.emit('hollow-click', {
            originalEvent: event,
            timestamp: Date.now(),
        });
        // Handle form submission
        const type = this.getProp('type', 'button');
        if (type === 'submit' && this._internals?.form) {
            this._internals.form.requestSubmit();
        }
        else if (type === 'reset' && this._internals?.form) {
            this._internals.form.reset();
        }
    }
}
// Register the element
defineElement('hollow-button', HollowButton);
export default HollowButton;
//# sourceMappingURL=button.js.map