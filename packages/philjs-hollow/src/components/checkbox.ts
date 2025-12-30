/**
 * Hollow Checkbox Component
 * A checkbox with checked state, indeterminate support, and accessibility
 */

import { HollowElement, property, defineElement } from '../core/base-element.js';

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
export class HollowCheckbox extends HollowElement {
  static override observedAttributes = [
    'variant',
    'size',
    'checked',
    'indeterminate',
    'disabled',
    'required',
    'name',
    'value',
  ];

  /** Form association */
  static formAssociated = true;

  @property({ type: 'string' })
  variant: CheckboxVariant = 'primary';

  @property({ type: 'string' })
  size: CheckboxSize = 'md';

  @property({ type: 'boolean', reflect: true })
  checked = false;

  @property({ type: 'boolean', reflect: true })
  indeterminate = false;

  @property({ type: 'boolean', reflect: true })
  disabled = false;

  @property({ type: 'boolean' })
  required = false;

  @property({ type: 'string' })
  name = '';

  @property({ type: 'string' })
  value = 'on';

  protected override template(): string {
    const variant = this.getProp('variant', 'primary');
    const size = this.getProp('size', 'md');
    const checked = this.getProp('checked', false);
    const indeterminate = this.getProp('indeterminate', false);
    const disabled = this.getProp('disabled', false);

    return `
      <label
        class="checkbox-wrapper checkbox-wrapper--${size}"
        part="wrapper"
      >
        <input
          type="checkbox"
          class="checkbox-input"
          part="input"
          ${checked ? 'checked' : ''}
          ${disabled ? 'disabled' : ''}
          ${this.getProp('required') ? 'required' : ''}
          name="${this.getProp('name', '')}"
          value="${this.getProp('value', 'on')}"
          aria-checked="${indeterminate ? 'mixed' : checked}"
          data-on-change="handleChange"
        />
        <span
          class="checkbox-control checkbox-control--${variant} ${checked ? 'checkbox-control--checked' : ''} ${indeterminate ? 'checkbox-control--indeterminate' : ''}"
          part="control"
          aria-hidden="true"
        >
          ${indeterminate ? `
            <svg class="checkbox-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          ` : checked ? `
            <svg class="checkbox-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          ` : ''}
        </span>
        <span class="checkbox-label" part="label">
          <slot></slot>
        </span>
      </label>
    `;
  }

  protected override styles(): string {
    return `
      :host {
        display: inline-block;
      }

      :host([disabled]) {
        pointer-events: none;
      }

      .checkbox-wrapper {
        display: inline-flex;
        align-items: flex-start;
        gap: var(--hollow-spacing-2);
        cursor: pointer;
        user-select: none;
        font-family: var(--hollow-font-family);
      }

      .checkbox-input {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }

      .checkbox-control {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--hollow-radius-sm);
        border: 2px solid var(--hollow-color-border);
        background: var(--hollow-color-background);
        transition: all var(--hollow-transition-fast) var(--hollow-transition-easing);
      }

      /* Sizes */
      .checkbox-wrapper--sm .checkbox-control {
        width: 1rem;
        height: 1rem;
      }

      .checkbox-wrapper--sm .checkbox-label {
        font-size: var(--hollow-font-size-sm);
        line-height: 1rem;
      }

      .checkbox-wrapper--md .checkbox-control {
        width: 1.25rem;
        height: 1.25rem;
      }

      .checkbox-wrapper--md .checkbox-label {
        font-size: var(--hollow-font-size-md);
        line-height: 1.25rem;
      }

      .checkbox-wrapper--lg .checkbox-control {
        width: 1.5rem;
        height: 1.5rem;
      }

      .checkbox-wrapper--lg .checkbox-label {
        font-size: var(--hollow-font-size-lg);
        line-height: 1.5rem;
      }

      /* Variant colors */
      .checkbox-control--default.checkbox-control--checked,
      .checkbox-control--default.checkbox-control--indeterminate {
        background: var(--hollow-color-text);
        border-color: var(--hollow-color-text);
        color: var(--hollow-color-background);
      }

      .checkbox-control--primary.checkbox-control--checked,
      .checkbox-control--primary.checkbox-control--indeterminate {
        background: var(--hollow-color-primary);
        border-color: var(--hollow-color-primary);
        color: var(--hollow-color-primary-foreground);
      }

      .checkbox-control--success.checkbox-control--checked,
      .checkbox-control--success.checkbox-control--indeterminate {
        background: var(--hollow-color-success);
        border-color: var(--hollow-color-success);
        color: var(--hollow-color-success-foreground);
      }

      .checkbox-control--warning.checkbox-control--checked,
      .checkbox-control--warning.checkbox-control--indeterminate {
        background: var(--hollow-color-warning);
        border-color: var(--hollow-color-warning);
        color: var(--hollow-color-warning-foreground);
      }

      .checkbox-control--error.checkbox-control--checked,
      .checkbox-control--error.checkbox-control--indeterminate {
        background: var(--hollow-color-error);
        border-color: var(--hollow-color-error);
        color: var(--hollow-color-error-foreground);
      }

      /* Hover state */
      .checkbox-wrapper:hover .checkbox-control:not(.checkbox-control--checked):not(.checkbox-control--indeterminate) {
        border-color: var(--hollow-color-border-focus);
      }

      /* Focus state */
      .checkbox-input:focus-visible + .checkbox-control {
        outline: 2px solid var(--hollow-color-ring);
        outline-offset: 2px;
      }

      /* Disabled state */
      .checkbox-input:disabled + .checkbox-control {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .checkbox-input:disabled ~ .checkbox-label {
        opacity: 0.5;
        cursor: not-allowed;
      }

      /* Icon */
      .checkbox-icon {
        width: 80%;
        height: 80%;
      }

      /* Label */
      .checkbox-label {
        color: var(--hollow-color-text);
      }

      .checkbox-label:empty {
        display: none;
      }

      /* Animation */
      .checkbox-control--checked .checkbox-icon,
      .checkbox-control--indeterminate .checkbox-icon {
        animation: checkmark 0.2s ease-out;
      }

      @keyframes checkmark {
        from {
          transform: scale(0);
          opacity: 0;
        }
        to {
          transform: scale(1);
          opacity: 1;
        }
      }
    `;
  }

  protected override onConnect(): void {
    this.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  protected override onRender(): void {
    // Set indeterminate state on native input
    const input = this.query<HTMLInputElement>('.checkbox-input');
    if (input) {
      input.indeterminate = this.getProp('indeterminate', false);
    }
  }

  /**
   * Handle change event
   */
  private handleChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const oldChecked = this.getProp('checked', false);

    // Clear indeterminate when user interacts
    this.setProp('indeterminate', false);
    this.setProp('checked', target.checked);

    // Update form value
    if (this._internals) {
      this._internals.setFormValue(target.checked ? this.getProp('value', 'on') : null);
    }

    // Emit change event
    this.emit('hollow-change', {
      checked: target.checked,
      previousChecked: oldChecked,
      value: this.getProp('value', 'on'),
      originalEvent: event,
    });
  }

  /**
   * Handle keyboard events
   */
  private handleKeyDown(event: KeyboardEvent): void {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      this.toggle();
    }
  }

  /**
   * Toggle the checkbox
   */
  public toggle(): void {
    if (this.getProp('disabled')) return;

    const newChecked = !this.getProp('checked', false);
    this.setProp('indeterminate', false);
    this.setProp('checked', newChecked);

    // Update form value
    if (this._internals) {
      this._internals.setFormValue(newChecked ? this.getProp('value', 'on') : null);
    }

    // Emit change event
    this.emit('hollow-change', {
      checked: newChecked,
      previousChecked: !newChecked,
      value: this.getProp('value', 'on'),
    });
  }

  /**
   * Set checked state programmatically
   */
  public setChecked(checked: boolean): void {
    this.setProp('checked', checked);
    this.setProp('indeterminate', false);

    if (this._internals) {
      this._internals.setFormValue(checked ? this.getProp('value', 'on') : null);
    }
  }

  /**
   * Set indeterminate state
   */
  public setIndeterminate(indeterminate: boolean): void {
    this.setProp('indeterminate', indeterminate);
  }
}

// Register the element
defineElement('hollow-checkbox', HollowCheckbox);

export default HollowCheckbox;
