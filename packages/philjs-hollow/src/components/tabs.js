/**
 * Hollow Tabs Component
 * A tab container with tab panels and keyboard navigation
 */
import { HollowElement, property, defineElement } from '../core/base-element.js';
/**
 * Hollow Tabs Web Component
 *
 * @example
 * ```html
 * <hollow-tabs active="tab1" variant="underline">
 *   <hollow-tab-list>
 *     <hollow-tab id="tab1">Tab 1</hollow-tab>
 *     <hollow-tab id="tab2">Tab 2</hollow-tab>
 *   </hollow-tab-list>
 *   <hollow-tab-panel tab="tab1">Content 1</hollow-tab-panel>
 *   <hollow-tab-panel tab="tab2">Content 2</hollow-tab-panel>
 * </hollow-tabs>
 * ```
 */
export class HollowTabs extends HollowElement {
    static observedAttributes = [
        'variant',
        'size',
        'active',
        'alignment',
        'tabs',
    ];
    @property({ type: 'string' })
    variant = 'default';
    @property({ type: 'string' })
    size = 'md';
    @property({ type: 'string', reflect: true })
    active = '';
    @property({ type: 'string' })
    alignment = 'start';
    @property({ type: 'array' })
    tabs = [];
    template() {
        const variant = this.getProp('variant', 'default');
        const size = this.getProp('size', 'md');
        const active = this.getProp('active', '');
        const alignment = this.getProp('alignment', 'start');
        const tabs = this.getProp('tabs', []);
        // If tabs are provided via property, render them
        const hasTabs = tabs.length > 0;
        return `
      <div class="tabs tabs--${variant} tabs--${size}" part="container">
        <div
          class="tabs-list tabs-list--${alignment}"
          part="list"
          role="tablist"
        >
          ${hasTabs ? tabs.map((tab, index) => `
            <button
              class="tab ${active === tab.id ? 'tab--active' : ''} ${tab.disabled ? 'tab--disabled' : ''}"
              part="tab"
              role="tab"
              id="tab-${tab.id}"
              aria-selected="${active === tab.id}"
              aria-controls="panel-${tab.id}"
              tabindex="${active === tab.id ? '0' : '-1'}"
              ${tab.disabled ? 'disabled' : ''}
              data-tab-id="${tab.id}"
              data-tab-index="${index}"
              data-on-click="handleTabClick"
            >
              ${tab.icon ? `<span class="tab-icon">${tab.icon}</span>` : ''}
              <span class="tab-label">${tab.label}</span>
            </button>
          `).join('') : `
            <slot name="tabs"></slot>
          `}
          <div class="tabs-indicator" part="indicator"></div>
        </div>
        <div class="tabs-panels" part="panels">
          ${hasTabs ? tabs.map((tab) => `
            <div
              class="tab-panel ${active === tab.id ? 'tab-panel--active' : ''}"
              part="panel"
              role="tabpanel"
              id="panel-${tab.id}"
              aria-labelledby="tab-${tab.id}"
              ${active !== tab.id ? 'hidden' : ''}
            >
              <slot name="${tab.id}"></slot>
            </div>
          `).join('') : `
            <slot></slot>
          `}
        </div>
      </div>
    `;
    }
    styles() {
        return `
      :host {
        display: block;
      }

      .tabs {
        display: flex;
        flex-direction: column;
        font-family: var(--hollow-font-family);
      }

      .tabs-list {
        position: relative;
        display: flex;
        gap: var(--hollow-spacing-1);
      }

      /* Alignment */
      .tabs-list--start { justify-content: flex-start; }
      .tabs-list--center { justify-content: center; }
      .tabs-list--end { justify-content: flex-end; }
      .tabs-list--stretch .tab { flex: 1; }

      /* Tab button */
      .tab {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: var(--hollow-spacing-2);
        font-family: inherit;
        font-weight: var(--hollow-font-weight-medium);
        border: none;
        background: transparent;
        cursor: pointer;
        white-space: nowrap;
        transition: all var(--hollow-transition-normal) var(--hollow-transition-easing);
        color: var(--hollow-color-text-muted);
      }

      .tab:hover:not(:disabled) {
        color: var(--hollow-color-text);
      }

      .tab--active {
        color: var(--hollow-color-primary);
      }

      .tab--disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .tab:focus-visible {
        outline: 2px solid var(--hollow-color-ring);
        outline-offset: 2px;
        border-radius: var(--hollow-radius-md);
      }

      /* Sizes */
      .tabs--sm .tab {
        padding: var(--hollow-spacing-1) var(--hollow-spacing-3);
        font-size: var(--hollow-font-size-sm);
      }

      .tabs--md .tab {
        padding: var(--hollow-spacing-2) var(--hollow-spacing-4);
        font-size: var(--hollow-font-size-md);
      }

      .tabs--lg .tab {
        padding: var(--hollow-spacing-3) var(--hollow-spacing-5);
        font-size: var(--hollow-font-size-lg);
      }

      /* Variant: Default */
      .tabs--default .tabs-list {
        border-bottom: 1px solid var(--hollow-color-border);
      }

      .tabs--default .tab--active::after {
        content: '';
        position: absolute;
        bottom: -1px;
        left: 0;
        right: 0;
        height: 2px;
        background: var(--hollow-color-primary);
      }

      /* Variant: Pills */
      .tabs--pills .tabs-list {
        background: var(--hollow-color-background-muted);
        border-radius: var(--hollow-radius-lg);
        padding: var(--hollow-spacing-1);
      }

      .tabs--pills .tab {
        border-radius: var(--hollow-radius-md);
      }

      .tabs--pills .tab--active {
        background: var(--hollow-color-background);
        color: var(--hollow-color-text);
        box-shadow: var(--hollow-shadow-sm);
      }

      /* Variant: Underline */
      .tabs--underline .tabs-list {
        border-bottom: 2px solid var(--hollow-color-border);
      }

      .tabs--underline .tab {
        padding-bottom: calc(var(--hollow-spacing-2) + 2px);
        margin-bottom: -2px;
      }

      .tabs--underline .tab--active::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: var(--hollow-color-primary);
      }

      /* Variant: Enclosed */
      .tabs--enclosed .tabs-list {
        border: 1px solid var(--hollow-color-border);
        border-bottom: none;
        border-radius: var(--hollow-radius-lg) var(--hollow-radius-lg) 0 0;
        background: var(--hollow-color-background-muted);
      }

      .tabs--enclosed .tab {
        border-right: 1px solid var(--hollow-color-border);
      }

      .tabs--enclosed .tab:last-child {
        border-right: none;
      }

      .tabs--enclosed .tab--active {
        background: var(--hollow-color-background);
        margin-bottom: -1px;
        padding-bottom: calc(var(--hollow-spacing-2) + 1px);
      }

      .tabs--enclosed .tabs-panels {
        border: 1px solid var(--hollow-color-border);
        border-radius: 0 0 var(--hollow-radius-lg) var(--hollow-radius-lg);
      }

      /* Tab icon */
      .tab-icon {
        display: flex;
        align-items: center;
        justify-content: center;
      }

      /* Panels */
      .tabs-panels {
        padding: var(--hollow-spacing-4);
      }

      .tab-panel {
        display: none;
        animation: fadeIn var(--hollow-transition-normal) var(--hollow-transition-easing);
      }

      .tab-panel--active {
        display: block;
      }

      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(4px); }
        to { opacity: 1; transform: translateY(0); }
      }

      /* Slotted tab panels */
      ::slotted([slot]) {
        display: none;
      }

      ::slotted([slot][active]) {
        display: block;
      }
    `;
    }
    onConnect() {
        this.addEventListener('keydown', this.handleKeyDown.bind(this));
        // Initialize first tab if none active
        const tabs = this.getProp('tabs', []);
        const active = this.getProp('active', '');
        if (!active && tabs.length > 0) {
            this.setProp('active', tabs[0].id);
        }
    }
    /**
     * Handle tab click
     */
    handleTabClick(event) {
        const target = event.currentTarget;
        const tabId = target.dataset.tabId;
        if (tabId) {
            this.selectTab(tabId);
        }
    }
    /**
     * Handle keyboard navigation
     */
    handleKeyDown(event) {
        const tabs = this.getProp('tabs', []);
        if (tabs.length === 0)
            return;
        const enabledTabs = tabs.filter((tab) => !tab.disabled);
        const currentIndex = enabledTabs.findIndex((tab) => tab.id === this.getProp('active'));
        let newIndex = currentIndex;
        switch (event.key) {
            case 'ArrowLeft':
            case 'ArrowUp':
                event.preventDefault();
                newIndex = currentIndex <= 0 ? enabledTabs.length - 1 : currentIndex - 1;
                break;
            case 'ArrowRight':
            case 'ArrowDown':
                event.preventDefault();
                newIndex = currentIndex >= enabledTabs.length - 1 ? 0 : currentIndex + 1;
                break;
            case 'Home':
                event.preventDefault();
                newIndex = 0;
                break;
            case 'End':
                event.preventDefault();
                newIndex = enabledTabs.length - 1;
                break;
            default:
                return;
        }
        if (enabledTabs[newIndex]) {
            this.selectTab(enabledTabs[newIndex].id);
            // Focus the new tab
            requestAnimationFrame(() => {
                const tabEl = this.query(`[data-tab-id="${enabledTabs[newIndex].id}"]`);
                tabEl?.focus();
            });
        }
    }
    /**
     * Select a tab by ID
     */
    selectTab(tabId) {
        const tabs = this.getProp('tabs', []);
        const tab = tabs.find((t) => t.id === tabId);
        if (tab?.disabled)
            return;
        const previousTab = this.getProp('active', '');
        if (previousTab === tabId)
            return;
        this.setProp('active', tabId);
        // Emit change event
        this.emit('hollow-change', {
            tab: tabId,
            previousTab,
            tabIndex: tabs.findIndex((t) => t.id === tabId),
        });
    }
    /**
     * Get the currently active tab ID
     */
    getActiveTab() {
        return this.getProp('active', '');
    }
    /**
     * Set tabs programmatically
     */
    setTabs(tabs) {
        this.setProp('tabs', tabs);
        if (tabs.length > 0 && !tabs.find((t) => t.id === this.getProp('active'))) {
            this.setProp('active', tabs[0].id);
        }
    }
}
/**
 * Hollow Tab List Component (for slotted usage)
 */
export class HollowTabList extends HollowElement {
    template() {
        return `<slot></slot>`;
    }
    styles() {
        return `
      :host {
        display: flex;
        gap: var(--hollow-spacing-1);
      }
    `;
    }
}
/**
 * Hollow Tab Component (for slotted usage)
 */
export class HollowTab extends HollowElement {
    static observedAttributes = ['active', 'disabled'];
    @property({ type: 'boolean', reflect: true })
    active = false;
    @property({ type: 'boolean', reflect: true })
    disabled = false;
    template() {
        const active = this.getProp('active', false);
        const disabled = this.getProp('disabled', false);
        return `
      <button
        class="tab ${active ? 'tab--active' : ''} ${disabled ? 'tab--disabled' : ''}"
        role="tab"
        aria-selected="${active}"
        tabindex="${active ? '0' : '-1'}"
        ${disabled ? 'disabled' : ''}
        data-on-click="handleClick"
      >
        <slot></slot>
      </button>
    `;
    }
    styles() {
        return `
      :host {
        display: inline-block;
      }

      .tab {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: var(--hollow-spacing-2);
        padding: var(--hollow-spacing-2) var(--hollow-spacing-4);
        font-family: var(--hollow-font-family);
        font-size: var(--hollow-font-size-md);
        font-weight: var(--hollow-font-weight-medium);
        border: none;
        background: transparent;
        cursor: pointer;
        color: var(--hollow-color-text-muted);
        transition: all var(--hollow-transition-normal) var(--hollow-transition-easing);
      }

      .tab:hover:not(:disabled) {
        color: var(--hollow-color-text);
      }

      .tab--active {
        color: var(--hollow-color-primary);
      }

      .tab--disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .tab:focus-visible {
        outline: 2px solid var(--hollow-color-ring);
        outline-offset: 2px;
        border-radius: var(--hollow-radius-md);
      }
    `;
    }
    handleClick() {
        if (this.getProp('disabled'))
            return;
        this.emit('hollow-tab-click', {
            id: this.id,
        });
    }
}
/**
 * Hollow Tab Panel Component (for slotted usage)
 */
export class HollowTabPanel extends HollowElement {
    static observedAttributes = ['tab', 'active'];
    @property({ type: 'string' })
    tab = '';
    @property({ type: 'boolean', reflect: true })
    active = false;
    template() {
        const active = this.getProp('active', false);
        return `
      <div
        class="panel ${active ? 'panel--active' : ''}"
        role="tabpanel"
        ${!active ? 'hidden' : ''}
      >
        <slot></slot>
      </div>
    `;
    }
    styles() {
        return `
      :host {
        display: block;
      }

      :host([hidden]),
      :host(:not([active])) {
        display: none;
      }

      .panel {
        animation: fadeIn var(--hollow-transition-normal) var(--hollow-transition-easing);
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
    `;
    }
}
// Register the elements
defineElement('hollow-tabs', HollowTabs);
defineElement('hollow-tab-list', HollowTabList);
defineElement('hollow-tab', HollowTab);
defineElement('hollow-tab-panel', HollowTabPanel);
export default HollowTabs;
//# sourceMappingURL=tabs.js.map