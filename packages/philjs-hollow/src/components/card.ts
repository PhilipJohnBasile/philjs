/**
 * Hollow Card Component
 * A flexible card container with header, body, and footer sections
 */

import { HollowElement, property, defineElement } from '../core/base-element.js';

/**
 * Card variants
 */
export type CardVariant = 'default' | 'outline' | 'elevated' | 'ghost';

/**
 * Card padding sizes
 */
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

/**
 * Hollow Card Web Component
 *
 * @example
 * ```html
 * <hollow-card variant="elevated" padding="md">
 *   <div slot="header">Card Title</div>
 *   <p>Card content goes here</p>
 *   <div slot="footer">
 *     <hollow-button>Action</hollow-button>
 *   </div>
 * </hollow-card>
 * ```
 */
export class HollowCard extends HollowElement {
  static override observedAttributes = ['variant', 'padding', 'interactive', 'selected'];

  @property({ type: 'string' })
  variant: CardVariant = 'default';

  @property({ type: 'string' })
  padding: CardPadding = 'md';

  @property({ type: 'boolean' })
  interactive = false;

  @property({ type: 'boolean', reflect: true })
  selected = false;

  protected override template(): string {
    const variant = this.getProp('variant', 'default');
    const padding = this.getProp('padding', 'md');
    const interactive = this.getProp('interactive', false);
    const selected = this.getProp('selected', false);

    return `
      <div
        part="card"
        class="card card--${variant} card--padding-${padding} ${interactive ? 'card--interactive' : ''} ${selected ? 'card--selected' : ''}"
        ${interactive ? 'tabindex="0" role="button" data-on-click="handleClick"' : ''}
      >
        <div class="header" part="header">
          <slot name="header"></slot>
        </div>
        <div class="body" part="body">
          <slot></slot>
        </div>
        <div class="footer" part="footer">
          <slot name="footer"></slot>
        </div>
      </div>
    `;
  }

  protected override styles(): string {
    return `
      :host {
        display: block;
      }

      .card {
        font-family: var(--hollow-font-family);
        border-radius: var(--hollow-radius-lg);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        transition: all var(--hollow-transition-normal) var(--hollow-transition-easing);
      }

      /* Variants */
      .card--default {
        background: var(--hollow-color-background);
        border: 1px solid var(--hollow-color-border);
      }

      .card--outline {
        background: transparent;
        border: 2px solid var(--hollow-color-border);
      }

      .card--elevated {
        background: var(--hollow-color-background);
        border: none;
        box-shadow: var(--hollow-shadow-md);
      }

      .card--ghost {
        background: transparent;
        border: none;
      }

      /* Padding */
      .card--padding-none .body {
        padding: 0;
      }

      .card--padding-sm .header,
      .card--padding-sm .body,
      .card--padding-sm .footer {
        padding: var(--hollow-spacing-2) var(--hollow-spacing-3);
      }

      .card--padding-md .header,
      .card--padding-md .body,
      .card--padding-md .footer {
        padding: var(--hollow-spacing-4) var(--hollow-spacing-5);
      }

      .card--padding-lg .header,
      .card--padding-lg .body,
      .card--padding-lg .footer {
        padding: var(--hollow-spacing-6) var(--hollow-spacing-8);
      }

      /* Header */
      .header {
        font-weight: var(--hollow-font-weight-semibold);
        font-size: var(--hollow-font-size-lg);
        border-bottom: 1px solid var(--hollow-color-border);
      }

      .header:empty,
      .header:not(:has(*)) {
        display: none;
      }

      /* Body */
      .body {
        flex: 1;
        color: var(--hollow-color-text);
      }

      /* Footer */
      .footer {
        border-top: 1px solid var(--hollow-color-border);
        display: flex;
        gap: var(--hollow-spacing-2);
        justify-content: flex-end;
      }

      .footer:empty,
      .footer:not(:has(*)) {
        display: none;
      }

      /* Interactive */
      .card--interactive {
        cursor: pointer;
        user-select: none;
      }

      .card--interactive:hover {
        border-color: var(--hollow-color-border-focus);
      }

      .card--interactive.card--elevated:hover {
        box-shadow: var(--hollow-shadow-lg);
        transform: translateY(-2px);
      }

      .card--interactive:focus-visible {
        outline: 2px solid var(--hollow-color-ring);
        outline-offset: 2px;
      }

      .card--interactive:active {
        transform: scale(0.99);
      }

      /* Selected */
      .card--selected {
        border-color: var(--hollow-color-primary);
        background: color-mix(in srgb, var(--hollow-color-primary) 5%, var(--hollow-color-background));
      }

      .card--selected.card--elevated {
        box-shadow: 0 0 0 2px var(--hollow-color-primary), var(--hollow-shadow-md);
      }
    `;
  }

  /**
   * Handle click on interactive card
   */
  private handleClick(event: Event): void {
    if (!this.getProp('interactive')) return;

    // Toggle selected state if interactive
    const wasSelected = this.getProp('selected', false);
    this.setProp('selected', !wasSelected);

    this.emit('hollow-click', {
      selected: !wasSelected,
      originalEvent: event,
    });
  }

  /**
   * Handle keyboard navigation for interactive cards
   */
  protected override onConnect(): void {
    if (this.getProp('interactive')) {
      this.addEventListener('keydown', this.handleKeyDown.bind(this));
    }
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.handleClick(event);
    }
  }
}

// Register the element
defineElement('hollow-card', HollowCard);

export default HollowCard;
