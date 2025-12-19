/**
 * PhilJS DevTools - Search & Filter
 * Advanced filtering of signals by name, value, or dependency
 */

export class SearchFilter {
  constructor(container) {
    this.container = container;
    this.filters = {
      search: '',
      type: [],
      hasSubscribers: null,
      hasDependencies: null,
      updateCountMin: null,
      updateCountMax: null,
      customExpression: ''
    };
    this.savedFilters = this.loadSavedFilters();

    this.init();
  }

  init() {
    this.container.innerHTML = `
      <div class="search-filter">
        <div class="filter-header">
          <input type="text" id="search-input" class="search-input" placeholder="Search signals...">
          <button id="clear-filters-btn" class="btn">Clear Filters</button>
        </div>

        <div class="filter-sections">
          <div class="filter-section">
            <h3>Type</h3>
            <div class="filter-options">
              <label>
                <input type="checkbox" value="string" class="type-filter">
                String
              </label>
              <label>
                <input type="checkbox" value="number" class="type-filter">
                Number
              </label>
              <label>
                <input type="checkbox" value="boolean" class="type-filter">
                Boolean
              </label>
              <label>
                <input type="checkbox" value="object" class="type-filter">
                Object
              </label>
              <label>
                <input type="checkbox" value="array" class="type-filter">
                Array
              </label>
            </div>
          </div>

          <div class="filter-section">
            <h3>Relationships</h3>
            <div class="filter-options">
              <label>
                <input type="checkbox" id="has-subscribers-filter">
                Has Subscribers
              </label>
              <label>
                <input type="checkbox" id="has-dependencies-filter">
                Has Dependencies
              </label>
              <label>
                <input type="checkbox" id="is-computed-filter">
                Is Computed
              </label>
              <label>
                <input type="checkbox" id="is-isolated-filter">
                Is Isolated (no connections)
              </label>
            </div>
          </div>

          <div class="filter-section">
            <h3>Activity</h3>
            <div class="filter-range">
              <label>Update Count</label>
              <div class="range-inputs">
                <input type="number" id="update-min" placeholder="Min" min="0">
                <span>to</span>
                <input type="number" id="update-max" placeholder="Max" min="0">
              </div>
            </div>
            <div class="filter-options">
              <label>
                <input type="checkbox" id="recently-updated-filter">
                Updated in last 5s
              </label>
              <label>
                <input type="checkbox" id="never-updated-filter">
                Never Updated
              </label>
            </div>
          </div>

          <div class="filter-section">
            <h3>Value Matching</h3>
            <div class="filter-value-match">
              <select id="value-match-type" class="form-control">
                <option value="">No value filter</option>
                <option value="equals">Equals</option>
                <option value="contains">Contains</option>
                <option value="matches">Matches regex</option>
                <option value="truthy">Is truthy</option>
                <option value="falsy">Is falsy</option>
              </select>
              <input type="text" id="value-match-input" class="form-control" placeholder="Value">
            </div>
          </div>

          <div class="filter-section">
            <h3>Custom Expression</h3>
            <textarea id="custom-expression" class="custom-expression"
                      placeholder="signal => signal.updateCount > 10 && signal.name.includes('user')"></textarea>
            <small class="help-text">
              Write a JavaScript expression. Available: signal object with properties
              (id, name, value, updateCount, subscribers, dependencies)
            </small>
          </div>

          <div class="filter-section">
            <h3>Saved Filters</h3>
            <div class="saved-filters">
              <div class="saved-filter-actions">
                <input type="text" id="filter-name-input" placeholder="Filter name" class="form-control">
                <button id="save-filter-btn" class="btn">Save Current</button>
              </div>
              <div id="saved-filters-list" class="saved-filters-list"></div>
            </div>
          </div>
        </div>

        <div class="filter-summary">
          <div id="filter-summary-content"></div>
        </div>
      </div>
    `;

    this.setupEventListeners();
    this.renderSavedFilters();
    this.updateSummary();
  }

  setupEventListeners() {
    const searchInput = this.container.querySelector('#search-input');
    const clearBtn = this.container.querySelector('#clear-filters-btn');
    const typeFilters = this.container.querySelectorAll('.type-filter');
    const hasSubscribers = this.container.querySelector('#has-subscribers-filter');
    const hasDependencies = this.container.querySelector('#has-dependencies-filter');
    const isComputed = this.container.querySelector('#is-computed-filter');
    const isIsolated = this.container.querySelector('#is-isolated-filter');
    const updateMin = this.container.querySelector('#update-min');
    const updateMax = this.container.querySelector('#update-max');
    const recentlyUpdated = this.container.querySelector('#recently-updated-filter');
    const neverUpdated = this.container.querySelector('#never-updated-filter');
    const valueMatchType = this.container.querySelector('#value-match-type');
    const valueMatchInput = this.container.querySelector('#value-match-input');
    const customExpression = this.container.querySelector('#custom-expression');
    const saveFilterBtn = this.container.querySelector('#save-filter-btn');

    // Search input with debounce
    let searchTimeout;
    searchInput?.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        this.filters.search = e.target.value;
        this.updateSummary();
        this.dispatchFilterChange();
      }, 300);
    });

    clearBtn?.addEventListener('click', () => this.clearFilters());

    typeFilters.forEach(cb => {
      cb.addEventListener('change', () => {
        this.filters.type = Array.from(typeFilters)
          .filter(cb => cb.checked)
          .map(cb => cb.value);
        this.updateSummary();
        this.dispatchFilterChange();
      });
    });

    hasSubscribers?.addEventListener('change', (e) => {
      this.filters.hasSubscribers = e.target.checked ? true : null;
      this.updateSummary();
      this.dispatchFilterChange();
    });

    hasDependencies?.addEventListener('change', (e) => {
      this.filters.hasDependencies = e.target.checked ? true : null;
      this.updateSummary();
      this.dispatchFilterChange();
    });

    isComputed?.addEventListener('change', (e) => {
      this.filters.isComputed = e.target.checked ? true : null;
      this.updateSummary();
      this.dispatchFilterChange();
    });

    isIsolated?.addEventListener('change', (e) => {
      this.filters.isIsolated = e.target.checked ? true : null;
      this.updateSummary();
      this.dispatchFilterChange();
    });

    updateMin?.addEventListener('input', (e) => {
      this.filters.updateCountMin = e.target.value ? parseInt(e.target.value) : null;
      this.updateSummary();
      this.dispatchFilterChange();
    });

    updateMax?.addEventListener('input', (e) => {
      this.filters.updateCountMax = e.target.value ? parseInt(e.target.value) : null;
      this.updateSummary();
      this.dispatchFilterChange();
    });

    recentlyUpdated?.addEventListener('change', (e) => {
      this.filters.recentlyUpdated = e.target.checked;
      this.updateSummary();
      this.dispatchFilterChange();
    });

    neverUpdated?.addEventListener('change', (e) => {
      this.filters.neverUpdated = e.target.checked;
      this.updateSummary();
      this.dispatchFilterChange();
    });

    valueMatchType?.addEventListener('change', (e) => {
      this.filters.valueMatchType = e.target.value;
      const input = this.container.querySelector('#value-match-input');
      if (input) {
        input.disabled = !e.target.value || e.target.value === 'truthy' || e.target.value === 'falsy';
      }
      this.updateSummary();
      this.dispatchFilterChange();
    });

    valueMatchInput?.addEventListener('input', (e) => {
      this.filters.valueMatchValue = e.target.value;
      this.updateSummary();
      this.dispatchFilterChange();
    });

    let expressionTimeout;
    customExpression?.addEventListener('input', (e) => {
      clearTimeout(expressionTimeout);
      expressionTimeout = setTimeout(() => {
        this.filters.customExpression = e.target.value;
        this.updateSummary();
        this.dispatchFilterChange();
      }, 500);
    });

    saveFilterBtn?.addEventListener('click', () => this.saveCurrentFilter());
  }

  applyFilters(signals) {
    if (!signals || signals.length === 0) return [];

    return signals.filter(signal => {
      // Search filter
      if (this.filters.search) {
        const search = this.filters.search.toLowerCase();
        const matchesName = signal.name.toLowerCase().includes(search);
        const matchesId = signal.id.toLowerCase().includes(search);
        const matchesValue = JSON.stringify(signal.value).toLowerCase().includes(search);

        if (!matchesName && !matchesId && !matchesValue) {
          return false;
        }
      }

      // Type filter
      if (this.filters.type.length > 0) {
        const valueType = Array.isArray(signal.value) ? 'array' : typeof signal.value;
        if (!this.filters.type.includes(valueType)) {
          return false;
        }
      }

      // Relationship filters
      if (this.filters.hasSubscribers && (!signal.subscribers || signal.subscribers === 0)) {
        return false;
      }

      if (this.filters.hasDependencies && (!signal.dependencies || signal.dependencies.length === 0)) {
        return false;
      }

      if (this.filters.isComputed && !signal.isComputed) {
        return false;
      }

      if (this.filters.isIsolated) {
        const hasConnections = (signal.subscribers && signal.subscribers > 0) ||
                              (signal.dependencies && signal.dependencies.length > 0);
        if (hasConnections) {
          return false;
        }
      }

      // Update count filter
      if (this.filters.updateCountMin !== null && signal.updateCount < this.filters.updateCountMin) {
        return false;
      }

      if (this.filters.updateCountMax !== null && signal.updateCount > this.filters.updateCountMax) {
        return false;
      }

      // Activity filters
      if (this.filters.recentlyUpdated) {
        const fiveSecondsAgo = Date.now() - 5000;
        if (!signal.lastUpdated || signal.lastUpdated < fiveSecondsAgo) {
          return false;
        }
      }

      if (this.filters.neverUpdated && signal.updateCount > 0) {
        return false;
      }

      // Value matching
      if (this.filters.valueMatchType) {
        if (!this.matchValue(signal.value, this.filters.valueMatchType, this.filters.valueMatchValue)) {
          return false;
        }
      }

      // Custom expression
      if (this.filters.customExpression) {
        try {
          // eslint-disable-next-line no-new-func
          const fn = new Function('signal', `return ${this.filters.customExpression}`);
          if (!fn(signal)) {
            return false;
          }
        } catch (error) {
          console.warn('Custom expression error:', error);
          return false;
        }
      }

      return true;
    });
  }

  matchValue(value, type, matchValue) {
    switch (type) {
      case 'equals':
        try {
          return JSON.stringify(value) === JSON.stringify(JSON.parse(matchValue));
        } catch {
          return String(value) === matchValue;
        }

      case 'contains':
        if (typeof value === 'string') {
          return value.includes(matchValue);
        }
        if (Array.isArray(value)) {
          return JSON.stringify(value).includes(matchValue);
        }
        if (typeof value === 'object') {
          return JSON.stringify(value).includes(matchValue);
        }
        return false;

      case 'matches':
        try {
          const regex = new RegExp(matchValue);
          return regex.test(String(value));
        } catch {
          return false;
        }

      case 'truthy':
        return !!value;

      case 'falsy':
        return !value;

      default:
        return true;
    }
  }

  clearFilters() {
    this.filters = {
      search: '',
      type: [],
      hasSubscribers: null,
      hasDependencies: null,
      updateCountMin: null,
      updateCountMax: null,
      customExpression: ''
    };

    // Reset UI
    this.container.querySelector('#search-input').value = '';
    this.container.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    this.container.querySelectorAll('input[type="number"]').forEach(input => input.value = '');
    this.container.querySelector('#value-match-type').selectedIndex = 0;
    this.container.querySelector('#value-match-input').value = '';
    this.container.querySelector('#custom-expression').value = '';

    this.updateSummary();
    this.dispatchFilterChange();
  }

  updateSummary() {
    const summary = this.container.querySelector('#filter-summary-content');
    if (!summary) return;

    const activeFilters = [];

    if (this.filters.search) {
      activeFilters.push(`Search: "${this.filters.search}"`);
    }

    if (this.filters.type.length > 0) {
      activeFilters.push(`Type: ${this.filters.type.join(', ')}`);
    }

    if (this.filters.hasSubscribers) {
      activeFilters.push('Has subscribers');
    }

    if (this.filters.hasDependencies) {
      activeFilters.push('Has dependencies');
    }

    if (this.filters.isComputed) {
      activeFilters.push('Is computed');
    }

    if (this.filters.isIsolated) {
      activeFilters.push('Is isolated');
    }

    if (this.filters.updateCountMin !== null || this.filters.updateCountMax !== null) {
      const min = this.filters.updateCountMin ?? 0;
      const max = this.filters.updateCountMax ?? '∞';
      activeFilters.push(`Updates: ${min} - ${max}`);
    }

    if (this.filters.recentlyUpdated) {
      activeFilters.push('Recently updated');
    }

    if (this.filters.neverUpdated) {
      activeFilters.push('Never updated');
    }

    if (this.filters.valueMatchType) {
      activeFilters.push(`Value ${this.filters.valueMatchType} ${this.filters.valueMatchValue || ''}`);
    }

    if (this.filters.customExpression) {
      activeFilters.push(`Custom: ${this.filters.customExpression.slice(0, 50)}...`);
    }

    if (activeFilters.length === 0) {
      summary.innerHTML = '<p class="no-filters">No active filters</p>';
    } else {
      summary.innerHTML = `
        <p class="active-filters-label">Active Filters:</p>
        <div class="active-filters">
          ${activeFilters.map(f => `<span class="filter-badge">${this.escapeHtml(f)}</span>`).join('')}
        </div>
      `;
    }
  }

  saveCurrentFilter() {
    const nameInput = this.container.querySelector('#filter-name-input');
    const name = nameInput?.value.trim();

    if (!name) {
      alert('Please enter a filter name');
      return;
    }

    const savedFilter = {
      id: `filter-${Date.now()}`,
      name,
      filters: { ...this.filters },
      createdAt: Date.now()
    };

    this.savedFilters.push(savedFilter);
    this.persistSavedFilters();
    this.renderSavedFilters();

    if (nameInput) {
      nameInput.value = '';
    }
  }

  loadFilter(filterId) {
    const saved = this.savedFilters.find(f => f.id === filterId);
    if (!saved) return;

    this.filters = { ...saved.filters };
    this.applyFiltersToUI();
    this.updateSummary();
    this.dispatchFilterChange();
  }

  applyFiltersToUI() {
    // Apply filters to UI elements
    const searchInput = this.container.querySelector('#search-input');
    if (searchInput) searchInput.value = this.filters.search || '';

    this.container.querySelectorAll('.type-filter').forEach(cb => {
      cb.checked = this.filters.type.includes(cb.value);
    });

    const hasSubscribers = this.container.querySelector('#has-subscribers-filter');
    if (hasSubscribers) hasSubscribers.checked = this.filters.hasSubscribers || false;

    const hasDependencies = this.container.querySelector('#has-dependencies-filter');
    if (hasDependencies) hasDependencies.checked = this.filters.hasDependencies || false;

    // ... apply other filters
  }

  renderSavedFilters() {
    const list = this.container.querySelector('#saved-filters-list');
    if (!list) return;

    if (this.savedFilters.length === 0) {
      list.innerHTML = '<p class="empty-state">No saved filters</p>';
      return;
    }

    list.innerHTML = this.savedFilters.map(filter => `
      <div class="saved-filter-item">
        <span class="filter-name">${this.escapeHtml(filter.name)}</span>
        <div class="filter-item-actions">
          <button class="btn-icon load-filter-btn" data-filter-id="${filter.id}" title="Load">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 12V2M4 6l4-4 4 4"/>
            </svg>
          </button>
          <button class="btn-icon delete-filter-btn" data-filter-id="${filter.id}" title="Delete">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M2 2L14 14M2 14L14 2"/>
            </svg>
          </button>
        </div>
      </div>
    `).join('');

    // Add event listeners
    list.querySelectorAll('.load-filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const filterId = e.currentTarget.dataset.filterId;
        this.loadFilter(filterId);
      });
    });

    list.querySelectorAll('.delete-filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const filterId = e.currentTarget.dataset.filterId;
        this.deleteSavedFilter(filterId);
      });
    });
  }

  deleteSavedFilter(filterId) {
    const index = this.savedFilters.findIndex(f => f.id === filterId);
    if (index === -1) return;

    this.savedFilters.splice(index, 1);
    this.persistSavedFilters();
    this.renderSavedFilters();
  }

  loadSavedFilters() {
    try {
      const saved = localStorage.getItem('philjs-devtools-saved-filters');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  persistSavedFilters() {
    try {
      localStorage.setItem('philjs-devtools-saved-filters', JSON.stringify(this.savedFilters));
    } catch (error) {
      console.warn('Failed to save filters:', error);
    }
  }

  dispatchFilterChange() {
    this.dispatchEvent('filterChange', { filters: this.filters });
  }

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  dispatchEvent(eventName, detail) {
    const event = new CustomEvent(eventName, { detail });
    this.container.dispatchEvent(event);
  }

  destroy() {
    this.container.innerHTML = '';
  }
}
