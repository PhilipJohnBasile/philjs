/**
 * Hollow Select Component
 * A dropdown select with searchable options and keyboard navigation
 */
import { HollowElement, property, defineElement } from '../core/base-element.js';
/**
 * Hollow Select Web Component
 *
 * @example
 * ```html
 * <hollow-select
 *   placeholder="Select an option"
 *   searchable
 *   options='[{"value":"1","label":"Option 1"},{"value":"2","label":"Option 2"}]'
 * ></hollow-select>
 * ```
 */
export class HollowSelect extends HollowElement {
    static observedAttributes = [
        'variant',
        'size',
        'value',
        'placeholder',
        'disabled',
        'required',
        'searchable',
        'clearable',
        'multiple',
        'options',
        'name',
        'error',
    ];
    /** Form association */
    static formAssociated = true;
    @property({ type: 'string' })
    variant = 'default';
    @property({ type: 'string' })
    size = 'md';
    @property({ type: 'string' })
    value = '';
    @property({ type: 'string' })
    placeholder = 'Select...';
    @property({ type: 'boolean', reflect: true })
    disabled = false;
    @property({ type: 'boolean' })
    required = false;
    @property({ type: 'boolean' })
    searchable = false;
    @property({ type: 'boolean' })
    clearable = false;
    @property({ type: 'boolean' })
    multiple = false;
    @property({ type: 'array' })
    options = [];
    @property({ type: 'string' })
    name = '';
    @property({ type: 'string' })
    error = '';
    _isOpen = false;
    _searchQuery = '';
    _highlightedIndex = -1;
    template() {
        const variant = this.getProp('variant', 'default');
        const size = this.getProp('size', 'md');
        const value = this.getProp('value', '');
        const placeholder = this.getProp('placeholder', 'Select...');
        const disabled = this.getProp('disabled', false);
        const searchable = this.getProp('searchable', false);
        const clearable = this.getProp('clearable', false);
        const options = this.getProp('options', []);
        const error = this.getProp('error', '');
        const selectedOption = options.find((opt) => opt.value === value);
        const displayValue = selectedOption?.label ?? '';
        const filteredOptions = this._searchQuery
            ? options.filter((opt) => opt.label.toLowerCase().includes(this._searchQuery.toLowerCase()))
            : options;
        // Group options
        const groupedOptions = new Map();
        for (const opt of filteredOptions) {
            const group = opt.group ?? '';
            if (!groupedOptions.has(group)) {
                groupedOptions.set(group, []);
            }
            groupedOptions.get(group).push(opt);
        }
        const renderOptions = () => {
            const parts = [];
            let globalIndex = 0;
            for (const [group, opts] of groupedOptions) {
                if (group) {
                    parts.push(`<div class="option-group-label" part="group-label">${group}</div>`);
                }
                for (const opt of opts) {
                    const isSelected = opt.value === value;
                    const isHighlighted = globalIndex === this._highlightedIndex;
                    parts.push(`
            <div
              class="option ${isSelected ? 'option--selected' : ''} ${isHighlighted ? 'option--highlighted' : ''} ${opt.disabled ? 'option--disabled' : ''}"
              part="option"
              role="option"
              aria-selected="${isSelected}"
              data-value="${opt.value}"
              data-index="${globalIndex}"
              data-on-click="handleOptionClick"
            >
              ${opt.label}
              ${isSelected ? `
                <svg class="check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              ` : ''}
            </div>
          `);
                    globalIndex++;
                }
            }
            return parts.join('');
        };
        return `
      <div
        class="select-wrapper select-wrapper--${variant} select-wrapper--${size} ${this._isOpen ? 'select-wrapper--open' : ''} ${error ? 'select-wrapper--error' : ''}"
        part="wrapper"
      >
        <div
          class="select-trigger"
          part="trigger"
          role="combobox"
          aria-expanded="${this._isOpen}"
          aria-haspopup="listbox"
          aria-controls="options-list"
          aria-disabled="${disabled}"
          tabindex="${disabled ? '-1' : '0'}"
          data-on-click="handleTriggerClick"
        >
          ${searchable && this._isOpen ? `
            <input
              class="search-input"
              part="search"
              type="text"
              placeholder="${placeholder}"
              value="${this._searchQuery}"
              data-on-input="handleSearchInput"
              autocomplete="off"
            />
          ` : `
            <span class="select-value ${!displayValue ? 'select-placeholder' : ''}" part="value">
              ${displayValue || placeholder}
            </span>
          `}
          <div class="select-icons">
            ${clearable && value ? `
              <button
                class="clear-button"
                part="clear"
                aria-label="Clear selection"
                data-on-click="handleClear"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            ` : ''}
            <svg class="chevron-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </div>
        <div
          class="options-dropdown"
          part="dropdown"
          role="listbox"
          id="options-list"
          aria-label="Options"
        >
          ${filteredOptions.length > 0 ? renderOptions() : `
            <div class="no-options" part="no-options">No options available</div>
          `}
        </div>
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

      .select-wrapper {
        position: relative;
        font-family: var(--hollow-font-family);
      }

      .select-trigger {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--hollow-spacing-2);
        border-radius: var(--hollow-radius-md);
        cursor: pointer;
        transition: all var(--hollow-transition-normal) var(--hollow-transition-easing);
        width: 100%;
        box-sizing: border-box;
      }

      /* Sizes */
      .select-wrapper--sm .select-trigger {
        padding: var(--hollow-spacing-1) var(--hollow-spacing-2);
        font-size: var(--hollow-font-size-sm);
        min-height: 2rem;
      }

      .select-wrapper--md .select-trigger {
        padding: var(--hollow-spacing-2) var(--hollow-spacing-3);
        font-size: var(--hollow-font-size-md);
        min-height: 2.5rem;
      }

      .select-wrapper--lg .select-trigger {
        padding: var(--hollow-spacing-3) var(--hollow-spacing-4);
        font-size: var(--hollow-font-size-lg);
        min-height: 3rem;
      }

      /* Variants */
      .select-wrapper--default .select-trigger {
        background: var(--hollow-color-background);
        border: 1px solid var(--hollow-color-border);
        color: var(--hollow-color-text);
      }

      .select-wrapper--default .select-trigger:hover:not([aria-disabled="true"]) {
        border-color: var(--hollow-color-border-focus);
      }

      .select-wrapper--outline .select-trigger {
        background: transparent;
        border: 2px solid var(--hollow-color-border);
        color: var(--hollow-color-text);
      }

      .select-wrapper--outline .select-trigger:hover:not([aria-disabled="true"]) {
        border-color: var(--hollow-color-primary);
      }

      .select-wrapper--filled .select-trigger {
        background: var(--hollow-color-background-muted);
        border: 1px solid transparent;
        color: var(--hollow-color-text);
      }

      .select-wrapper--filled .select-trigger:hover:not([aria-disabled="true"]) {
        background: var(--hollow-color-secondary);
      }

      /* Focus state */
      .select-trigger:focus-visible {
        outline: none;
        border-color: var(--hollow-color-primary);
        box-shadow: 0 0 0 3px var(--hollow-color-ring);
      }

      /* Disabled */
      .select-trigger[aria-disabled="true"] {
        opacity: 0.5;
        cursor: not-allowed;
        background: var(--hollow-color-background-muted);
      }

      /* Value */
      .select-value {
        flex: 1;
        text-align: left;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .select-placeholder {
        color: var(--hollow-color-text-muted);
      }

      /* Icons */
      .select-icons {
        display: flex;
        align-items: center;
        gap: var(--hollow-spacing-1);
        color: var(--hollow-color-text-muted);
      }

      .chevron-icon {
        transition: transform var(--hollow-transition-fast) var(--hollow-transition-easing);
      }

      .select-wrapper--open .chevron-icon {
        transform: rotate(180deg);
      }

      .clear-button {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        border: none;
        background: transparent;
        cursor: pointer;
        color: var(--hollow-color-text-muted);
        border-radius: var(--hollow-radius-sm);
      }

      .clear-button:hover {
        color: var(--hollow-color-text);
      }

      /* Search input */
      .search-input {
        flex: 1;
        border: none;
        background: transparent;
        outline: none;
        font-family: inherit;
        font-size: inherit;
        color: var(--hollow-color-text);
        width: 100%;
      }

      .search-input::placeholder {
        color: var(--hollow-color-text-muted);
      }

      /* Dropdown */
      .options-dropdown {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        z-index: 100;
        margin-top: var(--hollow-spacing-1);
        background: var(--hollow-color-background);
        border: 1px solid var(--hollow-color-border);
        border-radius: var(--hollow-radius-md);
        box-shadow: var(--hollow-shadow-lg);
        max-height: 15rem;
        overflow-y: auto;
        opacity: 0;
        visibility: hidden;
        transform: translateY(-4px);
        transition: opacity var(--hollow-transition-fast) var(--hollow-transition-easing),
                    transform var(--hollow-transition-fast) var(--hollow-transition-easing),
                    visibility var(--hollow-transition-fast) var(--hollow-transition-easing);
      }

      .select-wrapper--open .options-dropdown {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
      }

      /* Options */
      .option {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--hollow-spacing-2) var(--hollow-spacing-3);
        cursor: pointer;
        transition: background var(--hollow-transition-fast) var(--hollow-transition-easing);
      }

      .option:hover:not(.option--disabled) {
        background: var(--hollow-color-secondary);
      }

      .option--highlighted {
        background: var(--hollow-color-secondary);
      }

      .option--selected {
        background: color-mix(in srgb, var(--hollow-color-primary) 10%, var(--hollow-color-background));
        color: var(--hollow-color-primary);
      }

      .option--disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .check-icon {
        color: var(--hollow-color-primary);
      }

      /* Option groups */
      .option-group-label {
        padding: var(--hollow-spacing-2) var(--hollow-spacing-3);
        font-size: var(--hollow-font-size-sm);
        font-weight: var(--hollow-font-weight-semibold);
        color: var(--hollow-color-text-muted);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      /* No options */
      .no-options {
        padding: var(--hollow-spacing-4);
        text-align: center;
        color: var(--hollow-color-text-muted);
      }

      /* Error state */
      .select-wrapper--error .select-trigger {
        border-color: var(--hollow-color-error);
      }

      .select-wrapper--error .select-trigger:focus-visible {
        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.25);
      }

      .error-message {
        display: block;
        margin-top: var(--hollow-spacing-1);
        font-size: var(--hollow-font-size-sm);
        color: var(--hollow-color-error);
      }
    `;
    }
    onConnect() {
        document.addEventListener('click', this.handleOutsideClick.bind(this));
        this.addEventListener('keydown', this.handleKeyDown.bind(this));
    }
    onDisconnect() {
        document.removeEventListener('click', this.handleOutsideClick.bind(this));
    }
    /**
     * Handle trigger click
     */
    handleTriggerClick(event) {
        event.stopPropagation();
        if (this.getProp('disabled'))
            return;
        this._isOpen = !this._isOpen;
        this._highlightedIndex = -1;
        if (this._isOpen && this.getProp('searchable')) {
            requestAnimationFrame(() => {
                const input = this.query('.search-input');
                input?.focus();
            });
        }
        this.emit('hollow-toggle', { open: this._isOpen });
        this.scheduleRenderManual();
    }
    /**
     * Handle option click
     */
    handleOptionClick(event) {
        event.stopPropagation();
        const target = event.currentTarget;
        const value = target.dataset.value;
        const options = this.getProp('options', []);
        const option = options.find((opt) => opt.value === value);
        if (option?.disabled)
            return;
        this.selectValue(value ?? '');
    }
    /**
     * Handle search input
     */
    handleSearchInput(event) {
        const target = event.target;
        this._searchQuery = target.value;
        this._highlightedIndex = 0;
        this.scheduleRenderManual();
    }
    /**
     * Handle clear button
     */
    handleClear(event) {
        event.stopPropagation();
        this.selectValue('');
    }
    /**
     * Handle outside click
     */
    handleOutsideClick(event) {
        if (!this.contains(event.target) && this._isOpen) {
            this._isOpen = false;
            this._searchQuery = '';
            this.scheduleRenderManual();
        }
    }
    /**
     * Handle keyboard navigation
     */
    handleKeyDown(event) {
        const options = this.getFilteredOptions();
        switch (event.key) {
            case 'Enter':
            case ' ':
                event.preventDefault();
                if (!this._isOpen) {
                    this._isOpen = true;
                    this.scheduleRenderManual();
                }
                else if (this._highlightedIndex >= 0 && options[this._highlightedIndex]) {
                    const opt = options[this._highlightedIndex];
                    if (!opt.disabled) {
                        this.selectValue(opt.value);
                    }
                }
                break;
            case 'Escape':
                if (this._isOpen) {
                    event.preventDefault();
                    this._isOpen = false;
                    this._searchQuery = '';
                    this.scheduleRenderManual();
                }
                break;
            case 'ArrowDown':
                event.preventDefault();
                if (!this._isOpen) {
                    this._isOpen = true;
                }
                this._highlightedIndex = Math.min(this._highlightedIndex + 1, options.length - 1);
                this.scrollToHighlighted();
                this.scheduleRenderManual();
                break;
            case 'ArrowUp':
                event.preventDefault();
                if (!this._isOpen) {
                    this._isOpen = true;
                }
                this._highlightedIndex = Math.max(this._highlightedIndex - 1, 0);
                this.scrollToHighlighted();
                this.scheduleRenderManual();
                break;
            case 'Home':
                if (this._isOpen) {
                    event.preventDefault();
                    this._highlightedIndex = 0;
                    this.scrollToHighlighted();
                    this.scheduleRenderManual();
                }
                break;
            case 'End':
                if (this._isOpen) {
                    event.preventDefault();
                    this._highlightedIndex = options.length - 1;
                    this.scrollToHighlighted();
                    this.scheduleRenderManual();
                }
                break;
        }
    }
    /**
     * Get filtered options
     */
    getFilteredOptions() {
        const options = this.getProp('options', []);
        if (!this._searchQuery)
            return options;
        return options.filter((opt) => opt.label.toLowerCase().includes(this._searchQuery.toLowerCase()));
    }
    /**
     * Scroll to highlighted option
     */
    scrollToHighlighted() {
        requestAnimationFrame(() => {
            const highlighted = this.query(`.option[data-index="${this._highlightedIndex}"]`);
            highlighted?.scrollIntoView({ block: 'nearest' });
        });
    }
    /**
     * Select a value
     */
    selectValue(value) {
        const oldValue = this.getProp('value', '');
        this.setProp('value', value);
        this._isOpen = false;
        this._searchQuery = '';
        // Update form value
        if (this._internals) {
            this._internals.setFormValue(value);
        }
        // Emit change event
        this.emit('hollow-change', {
            value,
            previousValue: oldValue,
            option: this.getProp('options', []).find((opt) => opt.value === value),
        });
        this.scheduleRenderManual();
    }
    /**
     * Manual render scheduling
     */
    scheduleRenderManual() {
        queueMicrotask(() => {
            this.render();
        });
    }
    /**
     * Open the dropdown
     */
    show() {
        this._isOpen = true;
        this.scheduleRenderManual();
    }
    /**
     * Close the dropdown
     */
    hide() {
        this._isOpen = false;
        this._searchQuery = '';
        this.scheduleRenderManual();
    }
    /**
     * Focus the select
     */
    focus() {
        const trigger = this.query('.select-trigger');
        trigger?.focus();
    }
}
// Register the element
defineElement('hollow-select', HollowSelect);
export default HollowSelect;
//# sourceMappingURL=select.js.map