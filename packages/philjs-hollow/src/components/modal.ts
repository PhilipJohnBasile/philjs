/**
 * Hollow Modal Component
 * A dialog/modal with backdrop, animations, and accessibility support
 */

import { HollowElement, property, defineElement } from '../core/base-element.js';

/**
 * Modal sizes
 */
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

/**
 * Modal animation types
 */
export type ModalAnimation = 'fade' | 'slide' | 'scale' | 'none';

/**
 * Hollow Modal Web Component
 *
 * @example
 * ```html
 * <hollow-modal open size="md" animation="scale">
 *   <div slot="header">Modal Title</div>
 *   <p>Modal content goes here</p>
 *   <div slot="footer">
 *     <hollow-button variant="ghost">Cancel</hollow-button>
 *     <hollow-button variant="primary">Confirm</hollow-button>
 *   </div>
 * </hollow-modal>
 * ```
 */
export class HollowModal extends HollowElement {
  static override observedAttributes = [
    'open',
    'size',
    'animation',
    'closable',
    'close-on-backdrop',
    'close-on-escape',
    'persistent',
  ];

  @property({ type: 'boolean', reflect: true })
  open = false;

  @property({ type: 'string' })
  size: ModalSize = 'md';

  @property({ type: 'string' })
  animation: ModalAnimation = 'scale';

  @property({ type: 'boolean' })
  closable = true;

  @property({ type: 'boolean', attribute: 'close-on-backdrop' })
  closeOnBackdrop = true;

  @property({ type: 'boolean', attribute: 'close-on-escape' })
  closeOnEscape = true;

  @property({ type: 'boolean' })
  persistent = false;

  private _previousActiveElement: HTMLElement | null = null;

  protected override template(): string {
    const open = this.getProp('open', false);
    const size = this.getProp('size', 'md');
    const animation = this.getProp('animation', 'scale');
    const closable = this.getProp('closable', true);

    return `
      <div
        class="modal-backdrop ${open ? 'modal-backdrop--open' : ''} modal-backdrop--${animation}"
        part="backdrop"
        data-on-click="handleBackdropClick"
        aria-hidden="${!open}"
      >
        <div
          class="modal modal--${size} modal--${animation} ${open ? 'modal--open' : ''}"
          part="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          tabindex="-1"
        >
          <div class="modal-header" part="header">
            <span id="modal-title" class="modal-title">
              <slot name="header"></slot>
            </span>
            ${closable ? `
              <button
                class="modal-close"
                part="close-button"
                aria-label="Close modal"
                data-on-click="handleClose"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            ` : ''}
          </div>
          <div class="modal-body" part="body">
            <slot></slot>
          </div>
          <div class="modal-footer" part="footer">
            <slot name="footer"></slot>
          </div>
        </div>
      </div>
    `;
  }

  protected override styles(): string {
    return `
      :host {
        display: contents;
      }

      .modal-backdrop {
        position: fixed;
        inset: 0;
        z-index: 1000;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: var(--hollow-spacing-4);
        opacity: 0;
        visibility: hidden;
        transition: opacity var(--hollow-transition-normal) var(--hollow-transition-easing),
                    visibility var(--hollow-transition-normal) var(--hollow-transition-easing);
      }

      .modal-backdrop--open {
        opacity: 1;
        visibility: visible;
      }

      .modal {
        background: var(--hollow-color-background);
        border-radius: var(--hollow-radius-lg);
        box-shadow: var(--hollow-shadow-xl);
        display: flex;
        flex-direction: column;
        max-height: calc(100vh - var(--hollow-spacing-8));
        overflow: hidden;
        position: relative;
      }

      /* Sizes */
      .modal--sm { width: 100%; max-width: 24rem; }
      .modal--md { width: 100%; max-width: 32rem; }
      .modal--lg { width: 100%; max-width: 48rem; }
      .modal--xl { width: 100%; max-width: 64rem; }
      .modal--full {
        width: calc(100vw - var(--hollow-spacing-8));
        height: calc(100vh - var(--hollow-spacing-8));
        max-width: none;
        max-height: none;
      }

      /* Animations */
      .modal--fade {
        opacity: 0;
        transition: opacity var(--hollow-transition-normal) var(--hollow-transition-easing);
      }
      .modal--fade.modal--open { opacity: 1; }

      .modal--slide {
        opacity: 0;
        transform: translateY(-20px);
        transition: opacity var(--hollow-transition-normal) var(--hollow-transition-easing),
                    transform var(--hollow-transition-normal) var(--hollow-transition-easing);
      }
      .modal--slide.modal--open { opacity: 1; transform: translateY(0); }

      .modal--scale {
        opacity: 0;
        transform: scale(0.95);
        transition: opacity var(--hollow-transition-normal) var(--hollow-transition-easing),
                    transform var(--hollow-transition-normal) var(--hollow-transition-easing);
      }
      .modal--scale.modal--open { opacity: 1; transform: scale(1); }

      .modal--none { }

      /* Header */
      .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--hollow-spacing-4) var(--hollow-spacing-5);
        border-bottom: 1px solid var(--hollow-color-border);
        flex-shrink: 0;
      }

      .modal-header:not(:has(*:not(.modal-close))) {
        display: none;
      }

      .modal-title {
        font-size: var(--hollow-font-size-lg);
        font-weight: var(--hollow-font-weight-semibold);
        color: var(--hollow-color-text);
      }

      .modal-close {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 2rem;
        height: 2rem;
        padding: 0;
        border: none;
        background: transparent;
        border-radius: var(--hollow-radius-md);
        cursor: pointer;
        color: var(--hollow-color-text-muted);
        transition: background var(--hollow-transition-fast) var(--hollow-transition-easing),
                    color var(--hollow-transition-fast) var(--hollow-transition-easing);
      }

      .modal-close:hover {
        background: var(--hollow-color-secondary);
        color: var(--hollow-color-text);
      }

      .modal-close:focus-visible {
        outline: 2px solid var(--hollow-color-ring);
        outline-offset: 2px;
      }

      /* Body */
      .modal-body {
        flex: 1;
        overflow-y: auto;
        padding: var(--hollow-spacing-5);
        color: var(--hollow-color-text);
      }

      /* Footer */
      .modal-footer {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: var(--hollow-spacing-2);
        padding: var(--hollow-spacing-4) var(--hollow-spacing-5);
        border-top: 1px solid var(--hollow-color-border);
        flex-shrink: 0;
      }

      .modal-footer:empty,
      .modal-footer:not(:has(*)) {
        display: none;
      }

      /* Responsive */
      @media (max-width: 640px) {
        .modal-backdrop {
          padding: var(--hollow-spacing-2);
          align-items: flex-end;
        }

        .modal {
          max-height: calc(100vh - var(--hollow-spacing-4));
          border-radius: var(--hollow-radius-lg) var(--hollow-radius-lg) 0 0;
        }

        .modal--slide {
          transform: translateY(100%);
        }
      }
    `;
  }

  protected override onConnect(): void {
    this.addEventListener('keydown', this.handleKeyDown.bind(this));

    // Observe open changes
    if (this.getProp('open')) {
      this.handleOpen();
    }
  }

  protected override onPropChange(name: string, newValue: unknown, _oldValue: unknown): void {
    if (name === 'open') {
      if (newValue) {
        this.handleOpen();
      } else {
        this.handleClosed();
      }
    }
  }

  /**
   * Handle modal opening
   */
  private handleOpen(): void {
    // Store currently focused element
    this._previousActiveElement = document.activeElement as HTMLElement;

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    // Focus the modal
    requestAnimationFrame(() => {
      const modal = this.query<HTMLElement>('.modal');
      modal?.focus();
    });

    // Emit open event
    this.emit('hollow-open', { timestamp: Date.now() });
  }

  /**
   * Handle modal closing
   */
  private handleClosed(): void {
    // Restore body scroll
    document.body.style.overflow = '';

    // Restore focus
    this._previousActiveElement?.focus();
    this._previousActiveElement = null;

    // Emit close event
    this.emit('hollow-close', { timestamp: Date.now() });
  }

  /**
   * Handle close button click
   */
  private handleClose(event: Event): void {
    event.stopPropagation();
    this.close();
  }

  /**
   * Handle backdrop click
   */
  private handleBackdropClick(event: Event): void {
    const target = event.target as HTMLElement;
    const closeOnBackdrop = this.getProp('closeOnBackdrop', true);

    if (closeOnBackdrop && target.classList.contains('modal-backdrop')) {
      const persistent = this.getProp('persistent', false);
      if (persistent) {
        // Shake animation for persistent modal
        const modal = this.query<HTMLElement>('.modal');
        modal?.animate(
          [
            { transform: 'translateX(-5px)' },
            { transform: 'translateX(5px)' },
            { transform: 'translateX(-5px)' },
            { transform: 'translateX(5px)' },
            { transform: 'translateX(0)' },
          ],
          { duration: 300, easing: 'ease-out' }
        );
      } else {
        this.close();
      }
    }
  }

  /**
   * Handle keyboard events
   */
  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.getProp('open')) return;

    const closeOnEscape = this.getProp('closeOnEscape', true);

    if (event.key === 'Escape' && closeOnEscape) {
      const persistent = this.getProp('persistent', false);
      if (!persistent) {
        this.close();
      }
    }

    // Trap focus within modal
    if (event.key === 'Tab') {
      this.trapFocus(event);
    }
  }

  /**
   * Trap focus within the modal
   */
  private trapFocus(event: KeyboardEvent): void {
    const focusableElements = this.queryAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstFocusable) {
      event.preventDefault();
      lastFocusable?.focus();
    } else if (!event.shiftKey && document.activeElement === lastFocusable) {
      event.preventDefault();
      firstFocusable?.focus();
    }
  }

  /**
   * Open the modal programmatically
   */
  public show(): void {
    this.setProp('open', true);
  }

  /**
   * Close the modal programmatically
   */
  public close(): void {
    this.setProp('open', false);
  }

  /**
   * Toggle the modal
   */
  public toggle(): void {
    this.setProp('open', !this.getProp('open'));
  }
}

// Register the element
defineElement('hollow-modal', HollowModal);

export default HollowModal;
