/**
 * Hollow Switch Component
 * An iOS-style toggle switch with smooth animations
 */

import { HollowElement, property, defineElement } from '../core/base-element.js';

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
export class HollowSwitch extends HollowElement {
  static override observedAttributes = [
    'variant',
    'size',
    'checked',
    'disabled',
    'required',
    'name',
    'value',
    'label-on',
    'label-off',
  ];

  /** Form association */
  static formAssociated = true;

  @property({ type: 'string' })
  variant: SwitchVariant = 'primary';

  @property({ type: 'string' })
  size: SwitchSize = 'md';

  @property({ type: 'boolean', reflect: true })
  checked = false;

  @property({ type: 'boolean', reflect: true })
  disabled = false;

  @property({ type: 'boolean' })
  required = false;

  @property({ type: 'string' })
  name = '';

  @property({ type: 'string' })
  value = 'on';

  @property({ type: 'string', attribute: 'label-on' })
  labelOn = '';

  @property({ type: 'string', attribute: 'label-off' })
  labelOff = '';

  protected override template(): string {
    const variant = this.getProp('variant', 'primary');
    const size = this.getProp('size', 'md');
    const checked = this.getProp('checked', false);
    const disabled = this.getProp('disabled', false);
    const labelOn = this.getProp('labelOn', '');
    const labelOff = this.getProp('labelOff', '');

    return `
      <label
        class="switch-wrapper switch-wrapper--${size}"
        part="wrapper"
      >
        <input
          type="checkbox"
          class="switch-input"
          part="input"
          role="switch"
          ${checked ? 'checked' : ''}
          ${disabled ? 'disabled' : ''}
          ${this.getProp('required') ? 'required' : ''}
          name="${this.getProp('name', '')}"
          value="${this.getProp('value', 'on')}"
          aria-checked="${checked}"
          data-on-change="handleChange"
        />
        <span
          class="switch-track switch-track--${variant} ${checked ? 'switch-track--checked' : ''}"
          part="track"
        >
          ${labelOn || labelOff ? `
            <span class="switch-labels" part="labels">
              <span class="switch-label-on">${labelOn}</span>
              <span class="switch-label-off">${labelOff}</span>
            </span>
          ` : ''}
          <span class="switch-thumb" part="thumb"></span>
        </span>
        <span class="switch-label" part="label">
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

      .switch-wrapper {
        display: inline-flex;
        align-items: center;
        gap: var(--hollow-spacing-3);
        cursor: pointer;
        user-select: none;
        font-family: var(--hollow-font-family);
      }

      .switch-input {
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

      .switch-track {
        position: relative;
        display: inline-flex;
        align-items: center;
        flex-shrink: 0;
        border-radius: 9999px;
        background: var(--hollow-color-border);
        transition: background var(--hollow-transition-normal) var(--hollow-transition-easing);
      }

      /* Sizes */
      .switch-wrapper--sm .switch-track {
        width: 2rem;
        height: 1.125rem;
        padding: 2px;
      }

      .switch-wrapper--sm .switch-thumb {
        width: 0.875rem;
        height: 0.875rem;
      }

      .switch-wrapper--sm .switch-label {
        font-size: var(--hollow-font-size-sm);
      }

      .switch-wrapper--md .switch-track {
        width: 2.75rem;
        height: 1.5rem;
        padding: 2px;
      }

      .switch-wrapper--md .switch-thumb {
        width: 1.25rem;
        height: 1.25rem;
      }

      .switch-wrapper--md .switch-label {
        font-size: var(--hollow-font-size-md);
      }

      .switch-wrapper--lg .switch-track {
        width: 3.5rem;
        height: 2rem;
        padding: 3px;
      }

      .switch-wrapper--lg .switch-thumb {
        width: 1.625rem;
        height: 1.625rem;
      }

      .switch-wrapper--lg .switch-label {
        font-size: var(--hollow-font-size-lg);
      }

      /* Thumb */
      .switch-thumb {
        position: relative;
        border-radius: 50%;
        background: white;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2), 0 1px 1px rgba(0, 0, 0, 0.1);
        transition: transform var(--hollow-transition-normal) cubic-bezier(0.4, 0, 0.2, 1);
        z-index: 1;
      }

      /* Checked state - thumb position */
      .switch-wrapper--sm .switch-track--checked .switch-thumb {
        transform: translateX(0.875rem);
      }

      .switch-wrapper--md .switch-track--checked .switch-thumb {
        transform: translateX(1.25rem);
      }

      .switch-wrapper--lg .switch-track--checked .switch-thumb {
        transform: translateX(1.5rem);
      }

      /* Variant colors */
      .switch-track--default.switch-track--checked {
        background: var(--hollow-color-text);
      }

      .switch-track--primary.switch-track--checked {
        background: var(--hollow-color-primary);
      }

      .switch-track--success.switch-track--checked {
        background: var(--hollow-color-success);
      }

      .switch-track--warning.switch-track--checked {
        background: var(--hollow-color-warning);
      }

      .switch-track--error.switch-track--checked {
        background: var(--hollow-color-error);
      }

      /* Hover state */
      .switch-wrapper:hover .switch-track:not(.switch-track--checked) {
        background: var(--hollow-color-border-focus);
      }

      /* Focus state */
      .switch-input:focus-visible + .switch-track {
        outline: 2px solid var(--hollow-color-ring);
        outline-offset: 2px;
      }

      /* Disabled state */
      .switch-input:disabled + .switch-track {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .switch-input:disabled ~ .switch-label {
        opacity: 0.5;
        cursor: not-allowed;
      }

      /* Active/press state */
      .switch-wrapper:active .switch-thumb {
        transform: scaleX(1.1);
      }

      .switch-wrapper:active .switch-track--checked .switch-thumb {
        transform: translateX(1.25rem) scaleX(1.1);
      }

      .switch-wrapper--sm:active .switch-track--checked .switch-thumb {
        transform: translateX(0.875rem) scaleX(1.1);
      }

      .switch-wrapper--lg:active .switch-track--checked .switch-thumb {
        transform: translateX(1.5rem) scaleX(1.1);
      }

      /* Labels inside track */
      .switch-labels {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 6px;
        font-size: 0.625rem;
        font-weight: var(--hollow-font-weight-semibold);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        pointer-events: none;
      }

      .switch-label-on {
        color: white;
        opacity: 0;
        transition: opacity var(--hollow-transition-fast) var(--hollow-transition-easing);
      }

      .switch-label-off {
        color: var(--hollow-color-text-muted);
        transition: opacity var(--hollow-transition-fast) var(--hollow-transition-easing);
      }

      .switch-track--checked .switch-label-on {
        opacity: 1;
      }

      .switch-track--checked .switch-label-off {
        opacity: 0;
      }

      /* Label text */
      .switch-label {
        color: var(--hollow-color-text);
      }

      .switch-label:empty {
        display: none;
      }
    `;
  }

  protected override onConnect(): void {
    this.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  /**
   * Handle change event
   */
  private handleChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const oldChecked = this.getProp('checked', false);

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
   * Toggle the switch
   */
  public toggle(): void {
    if (this.getProp('disabled')) return;

    const newChecked = !this.getProp('checked', false);
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

    if (this._internals) {
      this._internals.setFormValue(checked ? this.getProp('value', 'on') : null);
    }
  }
}

// Register the element
defineElement('hollow-switch', HollowSwitch);

export default HollowSwitch;
