/**
 * PhilJS DevTools - Breakpoints
 * Set breakpoints on signal value changes
 */

export class Breakpoints {
  constructor(container) {
    this.container = container;
    this.breakpoints = new Map();
    this.breakpointHits = [];
    this.isPaused = false;
    this.pausedOnBreakpoint = null;

    this.init();
  }

  init() {
    this.container.innerHTML = `
      <div class="breakpoints">
        <div class="breakpoints-header">
          <div class="breakpoints-actions">
            <button id="add-breakpoint-btn" class="btn primary">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 2v12M2 8h12"/>
              </svg>
              Add Breakpoint
            </button>
            <button id="clear-breakpoints-btn" class="btn">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M2 2L14 14M2 14L14 2"/>
              </svg>
              Clear All
            </button>
            <button id="resume-btn" class="btn" disabled>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M4 2l10 6-10 6V2z"/>
              </svg>
              Resume
            </button>
          </div>
        </div>

        <div class="breakpoints-list">
          <h3>Breakpoints</h3>
          <div id="breakpoints-items" class="breakpoints-items"></div>
        </div>

        <div class="breakpoint-hits">
          <h3>Breakpoint Hits</h3>
          <div id="hits-items" class="hits-items"></div>
        </div>

        <div id="breakpoint-modal" class="modal" style="display: none">
          <div class="modal-content">
            <div class="modal-header">
              <h3>Add Breakpoint</h3>
              <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label>Signal</label>
                <select id="bp-signal-select" class="form-control"></select>
              </div>
              <div class="form-group">
                <label>Condition</label>
                <select id="bp-condition-type" class="form-control">
                  <option value="any">Any change</option>
                  <option value="equals">Equals</option>
                  <option value="notEquals">Not equals</option>
                  <option value="greater">Greater than</option>
                  <option value="less">Less than</option>
                  <option value="contains">Contains</option>
                  <option value="matches">Matches regex</option>
                  <option value="custom">Custom expression</option>
                </select>
              </div>
              <div class="form-group" id="bp-value-group">
                <label>Value</label>
                <input type="text" id="bp-value" class="form-control" placeholder="Value to compare">
              </div>
              <div class="form-group">
                <label>
                  <input type="checkbox" id="bp-enabled" checked>
                  Enabled
                </label>
              </div>
              <div class="form-group">
                <label>
                  <input type="checkbox" id="bp-log-only">
                  Log only (don't pause execution)
                </label>
              </div>
            </div>
            <div class="modal-footer">
              <button id="bp-cancel-btn" class="btn">Cancel</button>
              <button id="bp-save-btn" class="btn primary">Save</button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.setupEventListeners();
    this.renderBreakpoints();
    this.renderHits();
  }

  setupEventListeners() {
    const addBtn = this.container.querySelector('#add-breakpoint-btn');
    const clearBtn = this.container.querySelector('#clear-breakpoints-btn');
    const resumeBtn = this.container.querySelector('#resume-btn');
    const modal = this.container.querySelector('#breakpoint-modal');
    const closeBtn = this.container.querySelector('.modal-close');
    const cancelBtn = this.container.querySelector('#bp-cancel-btn');
    const saveBtn = this.container.querySelector('#bp-save-btn');
    const conditionType = this.container.querySelector('#bp-condition-type');

    addBtn?.addEventListener('click', () => this.showAddModal());
    clearBtn?.addEventListener('click', () => this.clearAllBreakpoints());
    resumeBtn?.addEventListener('click', () => this.resume());
    closeBtn?.addEventListener('click', () => this.hideModal());
    cancelBtn?.addEventListener('click', () => this.hideModal());
    saveBtn?.addEventListener('click', () => this.saveBreakpoint());

    conditionType?.addEventListener('change', (e) => {
      const valueGroup = this.container.querySelector('#bp-value-group');
      if (valueGroup) {
        valueGroup.style.display = e.target.value === 'any' ? 'none' : 'block';
      }
    });

    // Close modal on background click
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.hideModal();
      }
    });
  }

  showAddModal(signals = []) {
    const modal = this.container.querySelector('#breakpoint-modal');
    const signalSelect = this.container.querySelector('#bp-signal-select');

    if (!modal || !signalSelect) return;

    // Populate signal list
    signalSelect.innerHTML = '<option value="">Select signal...</option>';
    signals.forEach(signal => {
      const option = document.createElement('option');
      option.value = signal.id;
      option.textContent = signal.name;
      signalSelect.appendChild(option);
    });

    modal.style.display = 'flex';
  }

  hideModal() {
    const modal = this.container.querySelector('#breakpoint-modal');
    if (modal) {
      modal.style.display = 'none';
    }

    // Reset form
    const form = this.container.querySelector('.modal-body');
    if (form) {
      form.querySelectorAll('input, select').forEach(input => {
        if (input.type === 'checkbox') {
          input.checked = input.id === 'bp-enabled';
        } else if (input.tagName === 'SELECT') {
          input.selectedIndex = 0;
        } else {
          input.value = '';
        }
      });
    }
  }

  saveBreakpoint() {
    const signalId = this.container.querySelector('#bp-signal-select')?.value;
    const conditionType = this.container.querySelector('#bp-condition-type')?.value;
    const value = this.container.querySelector('#bp-value')?.value;
    const enabled = this.container.querySelector('#bp-enabled')?.checked;
    const logOnly = this.container.querySelector('#bp-log-only')?.checked;

    if (!signalId) {
      alert('Please select a signal');
      return;
    }

    const breakpoint = {
      id: `bp-${Date.now()}`,
      signalId,
      conditionType,
      value,
      enabled,
      logOnly,
      hitCount: 0,
      createdAt: Date.now()
    };

    this.breakpoints.set(breakpoint.id, breakpoint);
    this.renderBreakpoints();
    this.hideModal();

    // Notify
    this.dispatchEvent('breakpointAdded', breakpoint);
  }

  checkBreakpoint(signal, oldValue, newValue) {
    let triggered = false;

    this.breakpoints.forEach(bp => {
      if (bp.signalId !== signal.id || !bp.enabled) return;

      const shouldBreak = this.evaluateCondition(bp, oldValue, newValue);

      if (shouldBreak) {
        bp.hitCount++;

        const hit = {
          id: `hit-${Date.now()}`,
          breakpointId: bp.id,
          signalId: signal.id,
          signalName: signal.name,
          oldValue: this.deepClone(oldValue),
          newValue: this.deepClone(newValue),
          timestamp: Date.now(),
          stackTrace: this.captureStackTrace()
        };

        this.breakpointHits.unshift(hit);

        // Keep last 100 hits
        if (this.breakpointHits.length > 100) {
          this.breakpointHits.pop();
        }

        this.renderHits();

        if (!bp.logOnly) {
          this.pause(hit);
          triggered = true;
        } else {
          console.log('[PhilJS Breakpoint]', signal.name, 'changed from', oldValue, 'to', newValue);
        }
      }
    });

    this.renderBreakpoints();
    return triggered;
  }

  evaluateCondition(breakpoint, oldValue, newValue) {
    const { conditionType, value } = breakpoint;

    switch (conditionType) {
      case 'any':
        return oldValue !== newValue;

      case 'equals':
        return this.compareValues(newValue, this.parseValue(value));

      case 'notEquals':
        return !this.compareValues(newValue, this.parseValue(value));

      case 'greater':
        return typeof newValue === 'number' && newValue > parseFloat(value);

      case 'less':
        return typeof newValue === 'number' && newValue < parseFloat(value);

      case 'contains':
        if (typeof newValue === 'string') {
          return newValue.includes(value);
        }
        if (Array.isArray(newValue)) {
          return newValue.some(item => this.compareValues(item, this.parseValue(value)));
        }
        return false;

      case 'matches':
        try {
          const regex = new RegExp(value);
          return regex.test(String(newValue));
        } catch {
          return false;
        }

      case 'custom':
        try {
          // Evaluate custom expression
          // eslint-disable-next-line no-new-func
          const fn = new Function('oldValue', 'newValue', `return ${value}`);
          return fn(oldValue, newValue);
        } catch {
          return false;
        }

      default:
        return false;
    }
  }

  compareValues(a, b) {
    if (a === b) return true;
    if (typeof a !== typeof b) return false;
    if (typeof a === 'object') {
      return JSON.stringify(a) === JSON.stringify(b);
    }
    return false;
  }

  parseValue(str) {
    try {
      return JSON.parse(str);
    } catch {
      return str;
    }
  }

  pause(hit) {
    this.isPaused = true;
    this.pausedOnBreakpoint = hit;

    const resumeBtn = this.container.querySelector('#resume-btn');
    if (resumeBtn) {
      resumeBtn.disabled = false;
    }

    // Highlight the hit
    this.renderHits();

    // Dispatch event
    this.dispatchEvent('paused', hit);

    // Show notification
    this.showNotification(
      `Breakpoint hit: ${hit.signalName}\n` +
      `Old value: ${JSON.stringify(hit.oldValue)}\n` +
      `New value: ${JSON.stringify(hit.newValue)}`
    );
  }

  resume() {
    this.isPaused = false;
    this.pausedOnBreakpoint = null;

    const resumeBtn = this.container.querySelector('#resume-btn');
    if (resumeBtn) {
      resumeBtn.disabled = true;
    }

    this.renderHits();
    this.dispatchEvent('resumed', {});
  }

  renderBreakpoints() {
    const container = this.container.querySelector('#breakpoints-items');
    if (!container) return;

    if (this.breakpoints.size === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>No breakpoints set</p>
          <small>Click "Add Breakpoint" to create one</small>
        </div>
      `;
      return;
    }

    container.innerHTML = Array.from(this.breakpoints.values()).map(bp => `
      <div class="breakpoint-item ${bp.enabled ? 'enabled' : 'disabled'}">
        <div class="breakpoint-checkbox">
          <input type="checkbox" ${bp.enabled ? 'checked' : ''} data-bp-id="${bp.id}">
        </div>
        <div class="breakpoint-info">
          <div class="breakpoint-signal">${this.escapeHtml(bp.signalId)}</div>
          <div class="breakpoint-condition">
            ${this.formatCondition(bp)}
            ${bp.logOnly ? '<span class="badge warning">Log only</span>' : ''}
          </div>
          <div class="breakpoint-meta">
            Hits: ${bp.hitCount}
          </div>
        </div>
        <div class="breakpoint-actions">
          <button class="btn-icon edit-bp-btn" data-bp-id="${bp.id}" title="Edit">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M2 14h12M3 11l8-8 2 2-8 8H3v-2z"/>
            </svg>
          </button>
          <button class="btn-icon delete-bp-btn" data-bp-id="${bp.id}" title="Delete">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M2 2L14 14M2 14L14 2"/>
            </svg>
          </button>
        </div>
      </div>
    `).join('');

    // Add event listeners
    container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const bpId = e.target.dataset.bpId;
        this.toggleBreakpoint(bpId, e.target.checked);
      });
    });

    container.querySelectorAll('.delete-bp-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const bpId = e.currentTarget.dataset.bpId;
        this.deleteBreakpoint(bpId);
      });
    });
  }

  renderHits() {
    const container = this.container.querySelector('#hits-items');
    if (!container) return;

    if (this.breakpointHits.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>No breakpoint hits</p>
        </div>
      `;
      return;
    }

    container.innerHTML = this.breakpointHits.map(hit => `
      <div class="hit-item ${this.pausedOnBreakpoint?.id === hit.id ? 'active' : ''}">
        <div class="hit-header">
          <strong>${this.escapeHtml(hit.signalName)}</strong>
          <span class="hit-time">${new Date(hit.timestamp).toLocaleTimeString()}</span>
        </div>
        <div class="hit-values">
          <div class="hit-value">
            <span class="value-label">Old:</span>
            <code>${JSON.stringify(hit.oldValue)}</code>
          </div>
          <div class="hit-value">
            <span class="value-label">New:</span>
            <code>${JSON.stringify(hit.newValue)}</code>
          </div>
        </div>
        ${hit.stackTrace ? `
          <details class="hit-stack">
            <summary>Stack Trace</summary>
            <pre>${this.escapeHtml(hit.stackTrace)}</pre>
          </details>
        ` : ''}
      </div>
    `).join('');
  }

  formatCondition(breakpoint) {
    const { conditionType, value } = breakpoint;

    switch (conditionType) {
      case 'any':
        return 'Any change';
      case 'equals':
        return `= ${value}`;
      case 'notEquals':
        return `≠ ${value}`;
      case 'greater':
        return `> ${value}`;
      case 'less':
        return `< ${value}`;
      case 'contains':
        return `contains "${value}"`;
      case 'matches':
        return `matches /${value}/`;
      case 'custom':
        return `custom: ${value}`;
      default:
        return conditionType;
    }
  }

  toggleBreakpoint(id, enabled) {
    const bp = this.breakpoints.get(id);
    if (bp) {
      bp.enabled = enabled;
      this.renderBreakpoints();
      this.dispatchEvent('breakpointToggled', { id, enabled });
    }
  }

  deleteBreakpoint(id) {
    const confirmed = confirm('Delete this breakpoint?');
    if (!confirmed) return;

    this.breakpoints.delete(id);
    this.renderBreakpoints();
    this.dispatchEvent('breakpointDeleted', { id });
  }

  clearAllBreakpoints() {
    const confirmed = confirm('Clear all breakpoints?');
    if (!confirmed) return;

    this.breakpoints.clear();
    this.renderBreakpoints();
    this.dispatchEvent('breakpointsCleared', {});
  }

  captureStackTrace() {
    try {
      throw new Error();
    } catch (e) {
      return e.stack || '';
    }
  }

  showNotification(message) {
    // Simple alert for now
    alert(`[PhilJS Breakpoint]\n\n${message}`);
  }

  deepClone(obj) {
    try {
      return JSON.parse(JSON.stringify(obj));
    } catch {
      return obj;
    }
  }

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  updateSignals(signals) {
    // Update the signal list in the modal
    const signalSelect = this.container.querySelector('#bp-signal-select');
    if (!signalSelect) return;

    const currentValue = signalSelect.value;
    signalSelect.innerHTML = '<option value="">Select signal...</option>';

    signals.forEach(signal => {
      const option = document.createElement('option');
      option.value = signal.id;
      option.textContent = signal.name;
      signalSelect.appendChild(option);
    });

    if (currentValue) {
      signalSelect.value = currentValue;
    }
  }

  dispatchEvent(eventName, detail) {
    const event = new CustomEvent(eventName, { detail });
    this.container.dispatchEvent(event);
  }

  destroy() {
    this.container.innerHTML = '';
  }
}
