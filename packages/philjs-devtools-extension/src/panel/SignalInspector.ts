/**
 * PhilJS DevTools - Signal Inspector
 */

import type { SignalData } from '../types';

export class SignalInspector {
  private signals: Map<string, SignalData> = new Map();
  private selectedSignal: string | null = null;

  update(signals: Map<string, SignalData>): void {
    this.signals = signals;
  }

  select(signalId: string | null): void {
    this.selectedSignal = signalId;
  }

  render(): string {
    const signalList = Array.from(this.signals.values());
    const selected = this.selectedSignal ? this.signals.get(this.selectedSignal) : null;

    return `
      <div class="signal-inspector">
        <div class="signal-list">
          <div class="signal-list-header">
            <input type="text" placeholder="Search signals..." class="signal-search" />
          </div>
          <div class="signal-list-content">
            ${signalList.map(signal => this.renderSignalItem(signal)).join('')}
          </div>
        </div>

        <div class="signal-details">
          ${selected ? this.renderSignalDetails(selected) : this.renderEmptyState()}
        </div>
      </div>
    `;
  }

  private renderSignalItem(signal: SignalData): string {
    const isSelected = signal.id === this.selectedSignal;

    return `
      <div
        class="signal-item ${isSelected ? 'selected' : ''}"
        data-signal-id="${signal.id}"
      >
        <div class="signal-item-header">
          <span class="signal-name">${signal.name}</span>
          <span class="signal-updates">${signal.updateCount}</span>
        </div>
        <div class="signal-item-value">
          ${this.formatValue(signal.value)}
        </div>
      </div>
    `;
  }

  private renderSignalDetails(signal: SignalData): string {
    return `
      <div class="signal-details-content">
        <h3>${signal.name}</h3>

        <section class="detail-section">
          <h4>Current Value</h4>
          <div class="value-editor">
            <pre contenteditable="true" data-signal-id="${signal.id}">${JSON.stringify(signal.value, null, 2)}</pre>
            <button class="update-btn" data-signal-id="${signal.id}">Update</button>
          </div>
        </section>

        <section class="detail-section">
          <h4>Metadata</h4>
          <dl>
            <dt>Subscribers</dt>
            <dd>${signal.subscribers}</dd>
            <dt>Update Count</dt>
            <dd>${signal.updateCount}</dd>
            <dt>Last Updated</dt>
            <dd>${new Date(signal.lastUpdated).toLocaleTimeString()}</dd>
            <dt>Source</dt>
            <dd class="source">${signal.source}</dd>
          </dl>
        </section>

        <section class="detail-section">
          <h4>History (Last 10)</h4>
          <div class="history-timeline">
            ${signal.history.slice(-10).reverse().map(entry => `
              <div class="history-entry">
                <span class="history-time">${new Date(entry.timestamp).toLocaleTimeString()}</span>
                <span class="history-value">${this.formatValue(entry.value)}</span>
                <span class="history-trigger">${entry.trigger}</span>
              </div>
            `).join('')}
          </div>
        </section>
      </div>
    `;
  }

  private renderEmptyState(): string {
    return `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" width="48" height="48">
          <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
        </svg>
        <p>Select a signal to inspect its details and history</p>
      </div>
    `;
  }

  private formatValue(value: unknown): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return `"${value}"`;
    if (typeof value === 'object') {
      const str = JSON.stringify(value);
      return str.length > 50 ? str.slice(0, 50) + '...' : str;
    }
    return String(value);
  }
}
