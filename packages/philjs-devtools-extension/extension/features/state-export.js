/**
 * PhilJS DevTools - State Export/Import
 * Save and restore application state for debugging
 */

export class StateExporter {
  constructor(container) {
    this.container = container;
    this.savedStates = this.loadSavedStates();

    this.init();
  }

  init() {
    this.container.innerHTML = `
      <div class="state-exporter">
        <div class="exporter-header">
          <div class="exporter-actions">
            <button id="export-state-btn" class="btn primary">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 2v10M4 8l4 4 4-4"/>
              </svg>
              Export Current State
            </button>
            <button id="import-state-btn" class="btn">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 12V2M4 6l4-4 4 4"/>
              </svg>
              Import State
            </button>
            <input type="file" id="import-file-input" accept=".json" style="display: none">
          </div>
        </div>

        <div class="state-format-options">
          <label>
            <input type="checkbox" id="include-history-cb" checked>
            Include History
          </label>
          <label>
            <input type="checkbox" id="include-components-cb" checked>
            Include Components
          </label>
          <label>
            <input type="checkbox" id="include-performance-cb">
            Include Performance Data
          </label>
          <label>
            <input type="checkbox" id="pretty-print-cb" checked>
            Pretty Print JSON
          </label>
        </div>

        <div class="saved-states">
          <div class="saved-states-header">
            <h3>Saved States</h3>
            <button id="clear-saved-btn" class="btn-icon" title="Clear all saved states">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M2 2L14 14M2 14L14 2"/>
              </svg>
            </button>
          </div>
          <div id="saved-states-list" class="saved-states-list"></div>
        </div>

        <div class="state-preview">
          <h3>State Preview</h3>
          <div id="state-preview-content" class="code-block"></div>
        </div>
      </div>
    `;

    this.setupEventListeners();
    this.renderSavedStates();
  }

  setupEventListeners() {
    const exportBtn = this.container.querySelector('#export-state-btn');
    const importBtn = this.container.querySelector('#import-state-btn');
    const importInput = this.container.querySelector('#import-file-input');
    const clearBtn = this.container.querySelector('#clear-saved-btn');

    exportBtn?.addEventListener('click', () => this.exportState());
    importBtn?.addEventListener('click', () => importInput?.click());
    importInput?.addEventListener('change', (e) => this.handleImport(e));
    clearBtn?.addEventListener('click', () => this.clearSavedStates());
  }

  async exportState() {
    const includeHistory = this.container.querySelector('#include-history-cb')?.checked;
    const includeComponents = this.container.querySelector('#include-components-cb')?.checked;
    const includePerformance = this.container.querySelector('#include-performance-cb')?.checked;
    const prettyPrint = this.container.querySelector('#pretty-print-cb')?.checked;

    // Request state from page
    const state = await this.requestState();

    if (!state) {
      alert('Failed to get application state');
      return;
    }

    // Build export data
    const exportData = {
      version: '1.0.0',
      timestamp: Date.now(),
      date: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      state: {
        signals: state.signals || []
      }
    };

    if (includeHistory) {
      exportData.state.history = state.history || [];
    }

    if (includeComponents) {
      exportData.state.components = state.components || [];
      exportData.state.componentTree = state.componentTree || null;
    }

    if (includePerformance) {
      exportData.state.performance = state.performance || {};
    }

    // Convert to JSON
    const json = JSON.stringify(exportData, null, prettyPrint ? 2 : 0);

    // Save locally
    this.saveStateLocally(exportData);

    // Download as file
    this.downloadState(json, `philjs-state-${Date.now()}.json`);

    // Update preview
    this.updatePreview(json);
  }

  async requestState() {
    return new Promise((resolve) => {
      // This would be implemented to communicate with the page
      // For now, return a mock state
      this.dispatchEvent('requestState', {});

      // Listen for response
      const handler = (e) => {
        if (e.detail && e.detail.type === 'stateResponse') {
          resolve(e.detail.state);
          this.container.removeEventListener('stateResponse', handler);
        }
      };

      this.container.addEventListener('stateResponse', handler);

      // Timeout after 5 seconds
      setTimeout(() => {
        this.container.removeEventListener('stateResponse', handler);
        resolve(null);
      }, 5000);
    });
  }

  handleImport(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = e.target.result;
        const data = JSON.parse(json);

        // Validate format
        if (!this.validateImportData(data)) {
          alert('Invalid state file format');
          return;
        }

        // Confirm import
        const confirmed = confirm(
          `Import state from ${new Date(data.timestamp).toLocaleString()}?\n\n` +
          `This will restore:\n` +
          `- ${data.state.signals?.length || 0} signals\n` +
          `- ${data.state.components?.length || 0} components\n` +
          `- ${data.state.history?.length || 0} history entries`
        );

        if (!confirmed) return;

        // Restore state
        this.restoreState(data.state);

        // Update preview
        this.updatePreview(json);
      } catch (error) {
        alert('Failed to import state: ' + error.message);
      }
    };

    reader.readAsText(file);

    // Reset input
    event.target.value = '';
  }

  validateImportData(data) {
    if (!data || typeof data !== 'object') return false;
    if (!data.version || !data.timestamp || !data.state) return false;
    if (!data.state.signals || !Array.isArray(data.state.signals)) return false;
    return true;
  }

  restoreState(state) {
    // Dispatch event to restore state
    this.dispatchEvent('restoreState', { state });

    // Show success message
    this.showNotification('State imported successfully', 'success');
  }

  saveStateLocally(exportData) {
    const savedState = {
      id: `state-${Date.now()}`,
      timestamp: exportData.timestamp,
      date: exportData.date,
      url: exportData.url,
      signalCount: exportData.state.signals?.length || 0,
      componentCount: exportData.state.components?.length || 0,
      data: exportData
    };

    this.savedStates.push(savedState);

    // Keep only last 10 states
    if (this.savedStates.length > 10) {
      this.savedStates.shift();
    }

    // Persist to localStorage
    try {
      localStorage.setItem('philjs-devtools-saved-states', JSON.stringify(this.savedStates));
    } catch (error) {
      console.warn('Failed to save state to localStorage:', error);
    }

    this.renderSavedStates();
  }

  loadSavedStates() {
    try {
      const saved = localStorage.getItem('philjs-devtools-saved-states');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.warn('Failed to load saved states:', error);
      return [];
    }
  }

  renderSavedStates() {
    const list = this.container.querySelector('#saved-states-list');
    if (!list) return;

    if (this.savedStates.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <p>No saved states</p>
          <small>Export the current state to save it locally</small>
        </div>
      `;
      return;
    }

    list.innerHTML = this.savedStates.slice().reverse().map((state, i) => `
      <div class="saved-state-item" data-state-id="${state.id}">
        <div class="saved-state-header">
          <div class="saved-state-info">
            <strong>State ${this.savedStates.length - i}</strong>
            <small>${new Date(state.timestamp).toLocaleString()}</small>
          </div>
          <div class="saved-state-actions">
            <button class="btn-icon load-state-btn" data-state-id="${state.id}" title="Load state">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 12V2M4 6l4-4 4 4"/>
              </svg>
            </button>
            <button class="btn-icon download-state-btn" data-state-id="${state.id}" title="Download">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 2v10M4 8l4 4 4-4"/>
              </svg>
            </button>
            <button class="btn-icon delete-state-btn" data-state-id="${state.id}" title="Delete">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M2 2L14 14M2 14L14 2"/>
              </svg>
            </button>
          </div>
        </div>
        <div class="saved-state-meta">
          <span>${state.signalCount} signals</span>
          <span>${state.componentCount} components</span>
          <span>${this.formatBytes(JSON.stringify(state.data).length)}</span>
        </div>
      </div>
    `).join('');

    // Add event listeners
    list.querySelectorAll('.load-state-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const stateId = e.currentTarget.dataset.stateId;
        this.loadState(stateId);
      });
    });

    list.querySelectorAll('.download-state-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const stateId = e.currentTarget.dataset.stateId;
        this.downloadSavedState(stateId);
      });
    });

    list.querySelectorAll('.delete-state-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const stateId = e.currentTarget.dataset.stateId;
        this.deleteSavedState(stateId);
      });
    });
  }

  loadState(stateId) {
    const state = this.savedStates.find(s => s.id === stateId);
    if (!state) return;

    const confirmed = confirm(
      `Load state from ${new Date(state.timestamp).toLocaleString()}?`
    );

    if (confirmed) {
      this.restoreState(state.data.state);
      this.updatePreview(JSON.stringify(state.data, null, 2));
    }
  }

  downloadSavedState(stateId) {
    const state = this.savedStates.find(s => s.id === stateId);
    if (!state) return;

    const json = JSON.stringify(state.data, null, 2);
    this.downloadState(json, `philjs-state-${state.timestamp}.json`);
  }

  deleteSavedState(stateId) {
    const index = this.savedStates.findIndex(s => s.id === stateId);
    if (index === -1) return;

    const confirmed = confirm('Delete this saved state?');
    if (!confirmed) return;

    this.savedStates.splice(index, 1);

    try {
      localStorage.setItem('philjs-devtools-saved-states', JSON.stringify(this.savedStates));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }

    this.renderSavedStates();
  }

  clearSavedStates() {
    const confirmed = confirm('Clear all saved states?');
    if (!confirmed) return;

    this.savedStates = [];

    try {
      localStorage.removeItem('philjs-devtools-saved-states');
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }

    this.renderSavedStates();
  }

  downloadState(json, filename) {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    this.showNotification('State exported successfully', 'success');
  }

  updatePreview(json) {
    const preview = this.container.querySelector('#state-preview-content');
    if (!preview) return;

    // Truncate if too long
    const truncated = json.length > 5000 ? json.slice(0, 5000) + '\n...(truncated)' : json;
    preview.textContent = truncated;
  }

  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.padding = '12px 20px';
    notification.style.background = type === 'success' ? '#10b981' : '#3b82f6';
    notification.style.color = '#fff';
    notification.style.borderRadius = '4px';
    notification.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
    notification.style.zIndex = '10000';
    notification.style.animation = 'slideIn 0.3s ease-out';

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
  }

  dispatchEvent(eventName, detail) {
    const event = new CustomEvent(eventName, { detail });
    this.container.dispatchEvent(event);
  }

  destroy() {
    this.container.innerHTML = '';
  }
}
