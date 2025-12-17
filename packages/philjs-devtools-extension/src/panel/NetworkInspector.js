/**
 * PhilJS DevTools - Network Inspector
 */
export class NetworkInspector {
    requests = [];
    selectedRequest = null;
    filter = '';
    typeFilter = 'all';
    update(requests) {
        this.requests = requests;
    }
    addRequest(request) {
        this.requests.push(request);
    }
    select(requestId) {
        this.selectedRequest = requestId;
    }
    setFilter(filter) {
        this.filter = filter.toLowerCase();
    }
    setTypeFilter(type) {
        this.typeFilter = type;
    }
    clear() {
        this.requests = [];
        this.selectedRequest = null;
    }
    render() {
        const filteredRequests = this.getFilteredRequests();
        const selected = this.selectedRequest
            ? this.requests.find(r => r.id === this.selectedRequest)
            : null;
        return `
      <div class="network-inspector">
        <div class="network-toolbar">
          <button class="network-btn" data-action="clear">Clear</button>
          <input
            type="text"
            placeholder="Filter requests..."
            class="network-filter"
            value="${this.filter}"
          />
          <select class="network-type-filter" value="${this.typeFilter}">
            <option value="all">All Types</option>
            <option value="fetch">Fetch</option>
            <option value="xhr">XHR</option>
            <option value="loader">Loader</option>
            <option value="action">Action</option>
          </select>
        </div>

        <div class="network-content">
          <div class="network-list">
            ${this.renderRequestList(filteredRequests)}
          </div>

          <div class="network-details">
            ${selected ? this.renderRequestDetails(selected) : this.renderEmptyState()}
          </div>
        </div>
      </div>
    `;
    }
    getFilteredRequests() {
        return this.requests.filter(req => {
            if (this.typeFilter !== 'all' && req.type !== this.typeFilter) {
                return false;
            }
            if (this.filter && !req.url.toLowerCase().includes(this.filter)) {
                return false;
            }
            return true;
        });
    }
    renderRequestList(requests) {
        if (requests.length === 0) {
            return '<div class="network-empty">No requests captured</div>';
        }
        return `
      <table class="network-table">
        <thead>
          <tr>
            <th class="col-status">Status</th>
            <th class="col-method">Method</th>
            <th class="col-url">URL</th>
            <th class="col-type">Type</th>
            <th class="col-size">Size</th>
            <th class="col-time">Time</th>
          </tr>
        </thead>
        <tbody>
          ${requests.map(req => this.renderRequestRow(req)).join('')}
        </tbody>
      </table>
    `;
    }
    renderRequestRow(request) {
        const isSelected = request.id === this.selectedRequest;
        const statusClass = this.getStatusClass(request.status);
        return `
      <tr
        class="network-row ${isSelected ? 'selected' : ''} ${statusClass}"
        data-request-id="${request.id}"
      >
        <td class="col-status">
          <span class="status-badge ${statusClass}">${request.status || '—'}</span>
        </td>
        <td class="col-method">
          <span class="method-badge ${request.method.toLowerCase()}">${request.method}</span>
        </td>
        <td class="col-url" title="${request.url}">
          ${this.formatUrl(request.url)}
        </td>
        <td class="col-type">
          <span class="type-badge">${request.type}</span>
        </td>
        <td class="col-size">${this.formatSize(request.size)}</td>
        <td class="col-time">${request.duration}ms</td>
      </tr>
    `;
    }
    renderRequestDetails(request) {
        return `
      <div class="request-details">
        <div class="details-header">
          <span class="status-badge ${this.getStatusClass(request.status)}">${request.status}</span>
          <span class="method-badge ${request.method.toLowerCase()}">${request.method}</span>
          <span class="request-url">${request.url}</span>
        </div>

        <div class="details-tabs">
          <button class="details-tab active" data-tab="headers">Headers</button>
          <button class="details-tab" data-tab="request">Request</button>
          <button class="details-tab" data-tab="response">Response</button>
          <button class="details-tab" data-tab="timing">Timing</button>
        </div>

        <div class="details-content">
          ${this.renderHeaders(request)}
        </div>
      </div>
    `;
    }
    renderHeaders(request) {
        const headers = Object.entries(request.headers);
        return `
      <div class="headers-section">
        <h4>Response Headers</h4>
        ${headers.length > 0 ? `
          <dl class="headers-list">
            ${headers.map(([name, value]) => `
              <dt>${name}</dt>
              <dd>${value}</dd>
            `).join('')}
          </dl>
        ` : '<p>No headers</p>'}

        <h4>General</h4>
        <dl class="headers-list">
          <dt>Request URL</dt>
          <dd>${request.url}</dd>
          <dt>Request Method</dt>
          <dd>${request.method}</dd>
          <dt>Status Code</dt>
          <dd>${request.status} ${request.statusText}</dd>
          <dt>Type</dt>
          <dd>${request.type}</dd>
        </dl>
      </div>
    `;
    }
    renderEmptyState() {
        return `
      <div class="details-empty">
        <p>Select a request to view details</p>
      </div>
    `;
    }
    getStatusClass(status) {
        if (status === 0)
            return 'error';
        if (status >= 500)
            return 'error';
        if (status >= 400)
            return 'warning';
        if (status >= 300)
            return 'redirect';
        return 'success';
    }
    formatUrl(url) {
        try {
            const parsed = new URL(url);
            return parsed.pathname + parsed.search;
        }
        catch {
            return url.length > 50 ? url.slice(0, 50) + '...' : url;
        }
    }
    formatSize(bytes) {
        if (bytes === 0)
            return '—';
        if (bytes < 1024)
            return `${bytes}B`;
        if (bytes < 1024 * 1024)
            return `${(bytes / 1024).toFixed(1)}KB`;
        return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
    }
}
//# sourceMappingURL=NetworkInspector.js.map