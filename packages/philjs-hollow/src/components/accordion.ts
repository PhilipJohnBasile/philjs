/**
 * Hollow Accordion Component
 * Collapsible sections with smooth animations and keyboard navigation
 */

import { HollowElement, property, defineElement } from '../core/base-element.js';

/**
 * Accordion variants
 */
export type AccordionVariant = 'default' | 'bordered' | 'separated' | 'ghost';

/**
 * Accordion item definition
 */
export interface AccordionItem {
  id: string;
  title: string;
  content?: string;
  disabled?: boolean;
  icon?: string;
}

/**
 * Hollow Accordion Web Component
 *
 * @example
 * ```html
 * <hollow-accordion multiple>
 *   <hollow-accordion-item id="item1" title="Section 1">
 *     Content for section 1
 *   </hollow-accordion-item>
 *   <hollow-accordion-item id="item2" title="Section 2">
 *     Content for section 2
 *   </hollow-accordion-item>
 * </hollow-accordion>
 * ```
 */
export class HollowAccordion extends HollowElement {
  static override observedAttributes = [
    'variant',
    'multiple',
    'collapsible',
    'expanded',
    'items',
  ];

  @property({ type: 'string' })
  variant: AccordionVariant = 'default';

  @property({ type: 'boolean' })
  multiple = false;

  @property({ type: 'boolean' })
  collapsible = true;

  @property({ type: 'string' })
  expanded = '';

  @property({ type: 'array' })
  items: AccordionItem[] = [];

  private _expandedItems: Set<string> = new Set();

  protected override template(): string {
    const variant = this.getProp('variant', 'default');
    const items = this.getProp<AccordionItem[]>('items', []);
    const hasItems = items.length > 0;

    // Parse expanded string to set
    const expanded = this.getProp('expanded', '');
    this._expandedItems = new Set(expanded.split(',').filter(Boolean));

    return `
      <div class="accordion accordion--${variant}" part="container" role="presentation">
        ${hasItems ? items.map((item, index) => `
          <div
            class="accordion-item ${this._expandedItems.has(item.id) ? 'accordion-item--expanded' : ''} ${item.disabled ? 'accordion-item--disabled' : ''}"
            part="item"
            data-item-id="${item.id}"
          >
            <button
              class="accordion-trigger"
              part="trigger"
              id="trigger-${item.id}"
              aria-expanded="${this._expandedItems.has(item.id)}"
              aria-controls="panel-${item.id}"
              ${item.disabled ? 'disabled' : ''}
              data-item-id="${item.id}"
              data-item-index="${index}"
              data-on-click="handleTriggerClick"
            >
              ${item.icon ? `<span class="accordion-icon" part="icon">${item.icon}</span>` : ''}
              <span class="accordion-title" part="title">${item.title}</span>
              <svg class="accordion-chevron" part="chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            <div
              class="accordion-panel"
              part="panel"
              id="panel-${item.id}"
              role="region"
              aria-labelledby="trigger-${item.id}"
              ${!this._expandedItems.has(item.id) ? 'hidden' : ''}
            >
              <div class="accordion-content" part="content">
                ${item.content ?? ''}
                <slot name="${item.id}"></slot>
              </div>
            </div>
          </div>
        `).join('') : `
          <slot></slot>
        `}
      </div>
    `;
  }

  protected override styles(): string {
    return `
      :host {
        display: block;
      }

      .accordion {
        font-family: var(--hollow-font-family);
      }

      .accordion-item {
        overflow: hidden;
      }

      /* Variant: Default */
      .accordion--default .accordion-item {
        border-bottom: 1px solid var(--hollow-color-border);
      }

      .accordion--default .accordion-item:last-child {
        border-bottom: none;
      }

      /* Variant: Bordered */
      .accordion--bordered {
        border: 1px solid var(--hollow-color-border);
        border-radius: var(--hollow-radius-lg);
      }

      .accordion--bordered .accordion-item {
        border-bottom: 1px solid var(--hollow-color-border);
      }

      .accordion--bordered .accordion-item:last-child {
        border-bottom: none;
      }

      .accordion--bordered .accordion-item:first-child .accordion-trigger {
        border-radius: var(--hollow-radius-lg) var(--hollow-radius-lg) 0 0;
      }

      .accordion--bordered .accordion-item:last-child:not(.accordion-item--expanded) .accordion-trigger {
        border-radius: 0 0 var(--hollow-radius-lg) var(--hollow-radius-lg);
      }

      /* Variant: Separated */
      .accordion--separated .accordion-item {
        margin-bottom: var(--hollow-spacing-2);
        border: 1px solid var(--hollow-color-border);
        border-radius: var(--hollow-radius-lg);
      }

      .accordion--separated .accordion-item:last-child {
        margin-bottom: 0;
      }

      .accordion--separated .accordion-trigger {
        border-radius: var(--hollow-radius-lg);
      }

      .accordion--separated .accordion-item--expanded .accordion-trigger {
        border-radius: var(--hollow-radius-lg) var(--hollow-radius-lg) 0 0;
      }

      /* Variant: Ghost */
      .accordion--ghost .accordion-trigger {
        border-radius: var(--hollow-radius-md);
      }

      .accordion--ghost .accordion-trigger:hover {
        background: var(--hollow-color-secondary);
      }

      /* Trigger button */
      .accordion-trigger {
        display: flex;
        align-items: center;
        width: 100%;
        padding: var(--hollow-spacing-4);
        font-family: inherit;
        font-size: var(--hollow-font-size-md);
        font-weight: var(--hollow-font-weight-medium);
        text-align: left;
        background: transparent;
        border: none;
        cursor: pointer;
        color: var(--hollow-color-text);
        transition: all var(--hollow-transition-normal) var(--hollow-transition-easing);
      }

      .accordion-trigger:hover:not(:disabled) {
        background: var(--hollow-color-background-muted);
      }

      .accordion-trigger:focus-visible {
        outline: 2px solid var(--hollow-color-ring);
        outline-offset: -2px;
      }

      .accordion-trigger:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      /* Icon */
      .accordion-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: var(--hollow-spacing-3);
        color: var(--hollow-color-text-muted);
      }

      /* Title */
      .accordion-title {
        flex: 1;
      }

      /* Chevron */
      .accordion-chevron {
        flex-shrink: 0;
        color: var(--hollow-color-text-muted);
        transition: transform var(--hollow-transition-normal) var(--hollow-transition-easing);
      }

      .accordion-item--expanded .accordion-chevron {
        transform: rotate(180deg);
      }

      /* Panel */
      .accordion-panel {
        display: grid;
        grid-template-rows: 0fr;
        transition: grid-template-rows var(--hollow-transition-normal) var(--hollow-transition-easing);
      }

      .accordion-item--expanded .accordion-panel {
        grid-template-rows: 1fr;
      }

      .accordion-panel[hidden] {
        display: none;
      }

      /* Content */
      .accordion-content {
        overflow: hidden;
        padding: 0 var(--hollow-spacing-4);
        color: var(--hollow-color-text-muted);
      }

      .accordion-item--expanded .accordion-content {
        padding: 0 var(--hollow-spacing-4) var(--hollow-spacing-4);
      }

      /* Animations */
      .accordion-item--expanded .accordion-content {
        animation: slideDown var(--hollow-transition-normal) var(--hollow-transition-easing);
      }

      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateY(-8px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `;
  }

  protected override onConnect(): void {
    this.addEventListener('keydown', this.handleKeyDown.bind(this));

    // Initialize from expanded attribute
    const expanded = this.getProp('expanded', '');
    if (expanded) {
      this._expandedItems = new Set(expanded.split(',').filter(Boolean));
    }
  }

  /**
   * Handle trigger click
   */
  private handleTriggerClick(event: Event): void {
    const target = event.currentTarget as HTMLElement;
    const itemId = target.dataset.itemId;

    if (itemId) {
      this.toggleItem(itemId);
    }
  }

  /**
   * Handle keyboard navigation
   */
  private handleKeyDown(event: KeyboardEvent): void {
    const items = this.getProp<AccordionItem[]>('items', []);
    if (items.length === 0) return;

    const target = event.target as HTMLElement;
    if (!target.classList.contains('accordion-trigger')) return;

    const enabledItems = items.filter((item) => !item.disabled);
    const currentIndex = enabledItems.findIndex(
      (item) => item.id === target.dataset.itemId
    );

    let newIndex = currentIndex;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        newIndex = currentIndex >= enabledItems.length - 1 ? 0 : currentIndex + 1;
        break;

      case 'ArrowUp':
        event.preventDefault();
        newIndex = currentIndex <= 0 ? enabledItems.length - 1 : currentIndex - 1;
        break;

      case 'Home':
        event.preventDefault();
        newIndex = 0;
        break;

      case 'End':
        event.preventDefault();
        newIndex = enabledItems.length - 1;
        break;

      default:
        return;
    }

    if (enabledItems[newIndex]) {
      const triggerEl = this.query<HTMLElement>(
        `[data-item-id="${enabledItems[newIndex]!.id}"].accordion-trigger`
      );
      triggerEl?.focus();
    }
  }

  /**
   * Toggle an accordion item
   */
  public toggleItem(itemId: string): void {
    const items = this.getProp<AccordionItem[]>('items', []);
    const item = items.find((i) => i.id === itemId);
    const collapsible = this.getProp('collapsible', true);
    const multiple = this.getProp('multiple', false);

    if (item?.disabled) return;

    const isExpanded = this._expandedItems.has(itemId);

    // If trying to collapse the only expanded item and not collapsible, prevent
    if (isExpanded && !collapsible && this._expandedItems.size === 1) {
      return;
    }

    if (isExpanded) {
      // Collapse
      this._expandedItems.delete(itemId);
    } else {
      // Expand
      if (!multiple) {
        this._expandedItems.clear();
      }
      this._expandedItems.add(itemId);
    }

    // Update expanded attribute
    this.setProp('expanded', Array.from(this._expandedItems).join(','));

    // Emit event
    this.emit('hollow-change', {
      itemId,
      expanded: !isExpanded,
      expandedItems: Array.from(this._expandedItems),
    });
  }

  /**
   * Expand an item
   */
  public expand(itemId: string): void {
    if (!this._expandedItems.has(itemId)) {
      this.toggleItem(itemId);
    }
  }

  /**
   * Collapse an item
   */
  public collapse(itemId: string): void {
    if (this._expandedItems.has(itemId)) {
      this.toggleItem(itemId);
    }
  }

  /**
   * Expand all items (only in multiple mode)
   */
  public expandAll(): void {
    if (!this.getProp('multiple', false)) return;

    const items = this.getProp<AccordionItem[]>('items', []);
    for (const item of items) {
      if (!item.disabled) {
        this._expandedItems.add(item.id);
      }
    }

    this.setProp('expanded', Array.from(this._expandedItems).join(','));

    this.emit('hollow-change', {
      expandedItems: Array.from(this._expandedItems),
      action: 'expand-all',
    });
  }

  /**
   * Collapse all items
   */
  public collapseAll(): void {
    if (!this.getProp('collapsible', true)) return;

    this._expandedItems.clear();
    this.setProp('expanded', '');

    this.emit('hollow-change', {
      expandedItems: [],
      action: 'collapse-all',
    });
  }

  /**
   * Get expanded items
   */
  public getExpandedItems(): string[] {
    return Array.from(this._expandedItems);
  }

  /**
   * Check if an item is expanded
   */
  public isExpanded(itemId: string): boolean {
    return this._expandedItems.has(itemId);
  }
}

/**
 * Hollow Accordion Item Component (for slotted usage)
 */
export class HollowAccordionItem extends HollowElement {
  static override observedAttributes = ['title', 'expanded', 'disabled', 'icon'];

  @property({ type: 'string' })
  override title = '';

  @property({ type: 'boolean', reflect: true })
  expanded = false;

  @property({ type: 'boolean', reflect: true })
  disabled = false;

  @property({ type: 'string' })
  icon = '';

  protected override template(): string {
    const title = this.getProp('title', '');
    const expanded = this.getProp('expanded', false);
    const disabled = this.getProp('disabled', false);
    const icon = this.getProp('icon', '');

    return `
      <div
        class="accordion-item ${expanded ? 'accordion-item--expanded' : ''} ${disabled ? 'accordion-item--disabled' : ''}"
        part="item"
      >
        <button
          class="accordion-trigger"
          part="trigger"
          aria-expanded="${expanded}"
          ${disabled ? 'disabled' : ''}
          data-on-click="handleTriggerClick"
        >
          ${icon ? `<span class="accordion-icon" part="icon">${icon}</span>` : ''}
          <span class="accordion-title" part="title">${title}</span>
          <svg class="accordion-chevron" part="chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
        <div
          class="accordion-panel"
          part="panel"
          role="region"
          ${!expanded ? 'hidden' : ''}
        >
          <div class="accordion-content" part="content">
            <slot></slot>
          </div>
        </div>
      </div>
    `;
  }

  protected override styles(): string {
    return `
      :host {
        display: block;
        border-bottom: 1px solid var(--hollow-color-border);
      }

      :host(:last-child) {
        border-bottom: none;
      }

      .accordion-item {
        overflow: hidden;
      }

      .accordion-trigger {
        display: flex;
        align-items: center;
        width: 100%;
        padding: var(--hollow-spacing-4);
        font-family: var(--hollow-font-family);
        font-size: var(--hollow-font-size-md);
        font-weight: var(--hollow-font-weight-medium);
        text-align: left;
        background: transparent;
        border: none;
        cursor: pointer;
        color: var(--hollow-color-text);
        transition: all var(--hollow-transition-normal) var(--hollow-transition-easing);
      }

      .accordion-trigger:hover:not(:disabled) {
        background: var(--hollow-color-background-muted);
      }

      .accordion-trigger:focus-visible {
        outline: 2px solid var(--hollow-color-ring);
        outline-offset: -2px;
      }

      .accordion-trigger:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .accordion-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: var(--hollow-spacing-3);
        color: var(--hollow-color-text-muted);
      }

      .accordion-title {
        flex: 1;
      }

      .accordion-chevron {
        flex-shrink: 0;
        color: var(--hollow-color-text-muted);
        transition: transform var(--hollow-transition-normal) var(--hollow-transition-easing);
      }

      .accordion-item--expanded .accordion-chevron {
        transform: rotate(180deg);
      }

      .accordion-panel {
        display: grid;
        grid-template-rows: 0fr;
        transition: grid-template-rows var(--hollow-transition-normal) var(--hollow-transition-easing);
      }

      .accordion-item--expanded .accordion-panel {
        grid-template-rows: 1fr;
      }

      .accordion-panel[hidden] {
        display: none;
      }

      .accordion-content {
        overflow: hidden;
        padding: 0 var(--hollow-spacing-4);
        color: var(--hollow-color-text-muted);
      }

      .accordion-item--expanded .accordion-content {
        padding: 0 var(--hollow-spacing-4) var(--hollow-spacing-4);
        animation: slideDown var(--hollow-transition-normal) var(--hollow-transition-easing);
      }

      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateY(-8px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `;
  }

  protected override onConnect(): void {
    this.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  private handleTriggerClick(): void {
    if (this.getProp('disabled')) return;
    this.toggle();
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.toggle();
    }
  }

  /**
   * Toggle the accordion item
   */
  public toggle(): void {
    if (this.getProp('disabled')) return;

    const newExpanded = !this.getProp('expanded', false);
    this.setProp('expanded', newExpanded);

    this.emit('hollow-toggle', {
      id: this.id,
      expanded: newExpanded,
    });
  }

  /**
   * Expand the item
   */
  public expand(): void {
    this.setProp('expanded', true);
  }

  /**
   * Collapse the item
   */
  public collapse(): void {
    this.setProp('expanded', false);
  }
}

// Register the elements
defineElement('hollow-accordion', HollowAccordion);
defineElement('hollow-accordion-item', HollowAccordionItem);

export default HollowAccordion;
