/**
 * PhilJS DevTools - Signal Diff
 * Show what changed between signal updates
 */

export class SignalDiff {
  constructor(container) {
    this.container = container;
    this.signalHistory = new Map();
    this.selectedSignal = null;
    this.selectedVersions = { before: null, after: null };

    this.init();
  }

  init() {
    this.container.innerHTML = `
      <div class="signal-diff">
        <div class="diff-header">
          <select id="signal-select" class="signal-select">
            <option value="">Select a signal...</option>
          </select>
          <div class="diff-mode">
            <label>
              <input type="radio" name="diff-mode" value="unified" checked>
              Unified
            </label>
            <label>
              <input type="radio" name="diff-mode" value="split">
              Split
            </label>
          </div>
        </div>

        <div class="version-selectors">
          <div class="version-selector">
            <label>Before</label>
            <select id="before-version" class="version-select"></select>
          </div>
          <div class="version-selector">
            <label>After</label>
            <select id="after-version" class="version-select"></select>
          </div>
        </div>

        <div class="diff-stats">
          <div id="diff-stats-content"></div>
        </div>

        <div class="diff-viewer" id="diff-viewer"></div>
      </div>
    `;

    this.setupEventListeners();
  }

  setupEventListeners() {
    const signalSelect = this.container.querySelector('#signal-select');
    const beforeSelect = this.container.querySelector('#before-version');
    const afterSelect = this.container.querySelector('#after-version');
    const diffModes = this.container.querySelectorAll('input[name="diff-mode"]');

    signalSelect?.addEventListener('change', (e) => {
      this.selectSignal(e.target.value);
    });

    beforeSelect?.addEventListener('change', (e) => {
      this.selectedVersions.before = e.target.value;
      this.renderDiff();
    });

    afterSelect?.addEventListener('change', (e) => {
      this.selectedVersions.after = e.target.value;
      this.renderDiff();
    });

    diffModes.forEach(radio => {
      radio.addEventListener('change', () => {
        this.renderDiff();
      });
    });
  }

  trackSignalUpdate(signal) {
    if (!this.signalHistory.has(signal.id)) {
      this.signalHistory.set(signal.id, []);
    }

    const history = this.signalHistory.get(signal.id);
    history.push({
      version: history.length,
      timestamp: Date.now(),
      value: this.deepClone(signal.value),
      trigger: signal.trigger || 'update'
    });

    // Keep last 50 versions
    if (history.length > 50) {
      history.shift();
      // Re-index versions
      history.forEach((entry, i) => {
        entry.version = i;
      });
    }

    this.updateSignalList();

    // Auto-select if this is the selected signal
    if (this.selectedSignal === signal.id) {
      this.updateVersionSelectors();
    }
  }

  updateSignalList() {
    const signalSelect = this.container.querySelector('#signal-select');
    if (!signalSelect) return;

    const currentValue = signalSelect.value;

    signalSelect.innerHTML = '<option value="">Select a signal...</option>';

    Array.from(this.signalHistory.entries()).forEach(([signalId, history]) => {
      const option = document.createElement('option');
      option.value = signalId;
      option.textContent = `${signalId} (${history.length} versions)`;
      signalSelect.appendChild(option);
    });

    // Restore selection
    if (currentValue) {
      signalSelect.value = currentValue;
    }
  }

  selectSignal(signalId) {
    if (!signalId) {
      this.selectedSignal = null;
      this.clearDiff();
      return;
    }

    this.selectedSignal = signalId;
    this.updateVersionSelectors();
  }

  updateVersionSelectors() {
    const history = this.signalHistory.get(this.selectedSignal);
    if (!history || history.length === 0) return;

    const beforeSelect = this.container.querySelector('#before-version');
    const afterSelect = this.container.querySelector('#after-version');

    if (!beforeSelect || !afterSelect) return;

    // Clear and populate selectors
    beforeSelect.innerHTML = '';
    afterSelect.innerHTML = '';

    history.forEach((entry, i) => {
      const beforeOption = document.createElement('option');
      beforeOption.value = i;
      beforeOption.textContent = `v${entry.version} - ${new Date(entry.timestamp).toLocaleTimeString()}`;
      beforeSelect.appendChild(beforeOption);

      const afterOption = document.createElement('option');
      afterOption.value = i;
      afterOption.textContent = `v${entry.version} - ${new Date(entry.timestamp).toLocaleTimeString()}`;
      afterSelect.appendChild(afterOption);
    });

    // Select last two versions by default
    if (history.length >= 2) {
      beforeSelect.value = history.length - 2;
      afterSelect.value = history.length - 1;
      this.selectedVersions.before = history.length - 2;
      this.selectedVersions.after = history.length - 1;
    } else {
      beforeSelect.value = 0;
      afterSelect.value = 0;
      this.selectedVersions.before = 0;
      this.selectedVersions.after = 0;
    }

    this.renderDiff();
  }

  renderDiff() {
    if (!this.selectedSignal ||
        this.selectedVersions.before === null ||
        this.selectedVersions.after === null) {
      this.clearDiff();
      return;
    }

    const history = this.signalHistory.get(this.selectedSignal);
    if (!history) return;

    const beforeEntry = history[this.selectedVersions.before];
    const afterEntry = history[this.selectedVersions.after];

    if (!beforeEntry || !afterEntry) return;

    // Calculate diff
    const diff = this.calculateDiff(beforeEntry.value, afterEntry.value);

    // Render stats
    this.renderStats(diff);

    // Render diff viewer
    const mode = this.container.querySelector('input[name="diff-mode"]:checked')?.value || 'unified';
    if (mode === 'unified') {
      this.renderUnifiedDiff(diff, beforeEntry, afterEntry);
    } else {
      this.renderSplitDiff(diff, beforeEntry, afterEntry);
    }
  }

  calculateDiff(before, after) {
    const beforeStr = JSON.stringify(before, null, 2);
    const afterStr = JSON.stringify(after, null, 2);

    const beforeLines = beforeStr.split('\n');
    const afterLines = afterStr.split('\n');

    // Simple line-by-line diff
    const diff = {
      added: 0,
      removed: 0,
      modified: 0,
      lines: []
    };

    const maxLen = Math.max(beforeLines.length, afterLines.length);

    for (let i = 0; i < maxLen; i++) {
      const beforeLine = beforeLines[i];
      const afterLine = afterLines[i];

      if (beforeLine === afterLine) {
        diff.lines.push({ type: 'unchanged', before: beforeLine, after: afterLine, lineNum: i + 1 });
      } else if (beforeLine === undefined) {
        diff.lines.push({ type: 'added', before: '', after: afterLine, lineNum: i + 1 });
        diff.added++;
      } else if (afterLine === undefined) {
        diff.lines.push({ type: 'removed', before: beforeLine, after: '', lineNum: i + 1 });
        diff.removed++;
      } else {
        diff.lines.push({ type: 'modified', before: beforeLine, after: afterLine, lineNum: i + 1 });
        diff.modified++;
      }
    }

    return diff;
  }

  renderStats(diff) {
    const statsContent = this.container.querySelector('#diff-stats-content');
    if (!statsContent) return;

    const total = diff.added + diff.removed + diff.modified;

    if (total === 0) {
      statsContent.innerHTML = '<div class="stat-item"><span class="badge success">No changes</span></div>';
      return;
    }

    statsContent.innerHTML = `
      <div class="diff-stat-item">
        <span class="stat-label">Added</span>
        <span class="stat-value added">${diff.added}</span>
      </div>
      <div class="diff-stat-item">
        <span class="stat-label">Removed</span>
        <span class="stat-value removed">${diff.removed}</span>
      </div>
      <div class="diff-stat-item">
        <span class="stat-label">Modified</span>
        <span class="stat-value modified">${diff.modified}</span>
      </div>
    `;
  }

  renderUnifiedDiff(diff, beforeEntry, afterEntry) {
    const viewer = this.container.querySelector('#diff-viewer');
    if (!viewer) return;

    viewer.innerHTML = `
      <div class="diff-unified">
        <div class="diff-header-info">
          <div class="diff-version">
            <span class="version-label">Before:</span>
            <span class="version-info">v${beforeEntry.version} - ${new Date(beforeEntry.timestamp).toLocaleString()}</span>
          </div>
          <div class="diff-version">
            <span class="version-label">After:</span>
            <span class="version-info">v${afterEntry.version} - ${new Date(afterEntry.timestamp).toLocaleString()}</span>
          </div>
        </div>
        <div class="diff-content">
          ${diff.lines.map(line => this.renderUnifiedLine(line)).join('')}
        </div>
      </div>
    `;
  }

  renderUnifiedLine(line) {
    const prefix = {
      'added': '+',
      'removed': '-',
      'modified': '~',
      'unchanged': ' '
    }[line.type];

    const text = line.type === 'removed' ? line.before : line.after;

    return `
      <div class="diff-line diff-line-${line.type}">
        <span class="line-number">${line.lineNum}</span>
        <span class="line-prefix">${prefix}</span>
        <span class="line-content">${this.escapeHtml(text)}</span>
      </div>
    `;
  }

  renderSplitDiff(diff, beforeEntry, afterEntry) {
    const viewer = this.container.querySelector('#diff-viewer');
    if (!viewer) return;

    viewer.innerHTML = `
      <div class="diff-split">
        <div class="diff-pane diff-pane-before">
          <div class="diff-pane-header">
            <span class="version-label">Before:</span>
            <span class="version-info">v${beforeEntry.version}</span>
          </div>
          <div class="diff-pane-content">
            ${diff.lines.map(line => this.renderSplitLineBefore(line)).join('')}
          </div>
        </div>
        <div class="diff-pane diff-pane-after">
          <div class="diff-pane-header">
            <span class="version-label">After:</span>
            <span class="version-info">v${afterEntry.version}</span>
          </div>
          <div class="diff-pane-content">
            ${diff.lines.map(line => this.renderSplitLineAfter(line)).join('')}
          </div>
        </div>
      </div>
    `;
  }

  renderSplitLineBefore(line) {
    if (line.type === 'added') return '<div class="diff-line diff-line-empty"></div>';

    const className = line.type === 'removed' || line.type === 'modified' ? `diff-line-${line.type}` : '';

    return `
      <div class="diff-line ${className}">
        <span class="line-number">${line.lineNum}</span>
        <span class="line-content">${this.escapeHtml(line.before)}</span>
      </div>
    `;
  }

  renderSplitLineAfter(line) {
    if (line.type === 'removed') return '<div class="diff-line diff-line-empty"></div>';

    const className = line.type === 'added' || line.type === 'modified' ? `diff-line-${line.type}` : '';

    return `
      <div class="diff-line ${className}">
        <span class="line-number">${line.lineNum}</span>
        <span class="line-content">${this.escapeHtml(line.after)}</span>
      </div>
    `;
  }

  clearDiff() {
    const viewer = this.container.querySelector('#diff-viewer');
    const stats = this.container.querySelector('#diff-stats-content');

    if (viewer) {
      viewer.innerHTML = `
        <div class="empty-state">
          <p>Select a signal and versions to view diff</p>
        </div>
      `;
    }

    if (stats) {
      stats.innerHTML = '';
    }
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

  clear() {
    this.signalHistory.clear();
    this.selectedSignal = null;
    this.selectedVersions = { before: null, after: null };
    this.updateSignalList();
    this.clearDiff();
  }

  destroy() {
    this.container.innerHTML = '';
  }
}
