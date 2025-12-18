/**
 * Development Error Overlay
 *
 * Beautiful, helpful error overlay for development mode.
 * Shows errors with syntax highlighting, suggestions, and docs links.
 */

import type { PhilJSError } from './error-codes';
import { formatErrorForDev } from './stack-trace';

/**
 * Error overlay state
 */
let overlayElement: HTMLElement | null = null;
let currentError: PhilJSError | null = null;

/**
 * Show error overlay
 */
export function showErrorOverlay(error: PhilJSError): void {
  currentError = error;

  // Remove existing overlay
  if (overlayElement) {
    overlayElement.remove();
  }

  // Create new overlay
  overlayElement = createOverlayElement(error);
  document.body.appendChild(overlayElement);

  // Add keyboard shortcut to close (Escape)
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      hideErrorOverlay();
      document.removeEventListener('keydown', handleKeyDown);
    }
  };
  document.addEventListener('keydown', handleKeyDown);
}

/**
 * Hide error overlay
 */
export function hideErrorOverlay(): void {
  if (overlayElement) {
    overlayElement.remove();
    overlayElement = null;
  }
  currentError = null;
}

/**
 * Create overlay DOM element
 */
function createOverlayElement(error: PhilJSError): HTMLElement {
  const overlay = document.createElement('div');
  overlay.id = 'philjs-error-overlay';

  const formatted = formatErrorForDev(error);

  overlay.innerHTML = `
    <style>
      #philjs-error-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 999999;
        background: rgba(0, 0, 0, 0.9);
        color: #fff;
        font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
        font-size: 14px;
        line-height: 1.6;
        overflow: auto;
        animation: philjs-overlay-fadein 0.2s ease-out;
      }

      @keyframes philjs-overlay-fadein {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      .philjs-error-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 40px 20px;
      }

      .philjs-error-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 30px;
        padding-bottom: 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }

      .philjs-error-title {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .philjs-error-icon {
        font-size: 32px;
      }

      .philjs-error-heading {
        margin: 0;
        font-size: 24px;
        font-weight: 600;
      }

      .philjs-error-code {
        display: inline-block;
        background: #dc2626;
        color: white;
        padding: 4px 12px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 600;
        margin-left: 12px;
      }

      .philjs-error-close {
        background: rgba(255, 255, 255, 0.1);
        border: none;
        color: white;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        transition: background 0.2s;
      }

      .philjs-error-close:hover {
        background: rgba(255, 255, 255, 0.2);
      }

      .philjs-error-message {
        background: rgba(220, 38, 38, 0.1);
        border-left: 4px solid #dc2626;
        padding: 20px;
        margin-bottom: 30px;
        border-radius: 8px;
        font-size: 16px;
      }

      .philjs-error-location {
        background: rgba(255, 255, 255, 0.05);
        padding: 12px 16px;
        margin-bottom: 30px;
        border-radius: 6px;
        font-size: 13px;
        color: #a0a0a0;
      }

      .philjs-error-location strong {
        color: #fff;
        margin-right: 8px;
      }

      .philjs-suggestions {
        margin-bottom: 30px;
      }

      .philjs-suggestions-title {
        font-size: 18px;
        font-weight: 600;
        margin-bottom: 16px;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .philjs-suggestion {
        background: rgba(34, 197, 94, 0.1);
        border-left: 4px solid #22c55e;
        padding: 16px;
        margin-bottom: 16px;
        border-radius: 8px;
      }

      .philjs-suggestion-description {
        margin-bottom: 12px;
        color: #e0e0e0;
      }

      .philjs-suggestion-confidence {
        font-size: 12px;
        color: #a0a0a0;
        margin-bottom: 12px;
      }

      .philjs-code-example {
        margin-top: 12px;
      }

      .philjs-code-label {
        font-size: 12px;
        color: #a0a0a0;
        margin-bottom: 4px;
        font-weight: 600;
        text-transform: uppercase;
      }

      .philjs-code-block {
        background: rgba(0, 0, 0, 0.4);
        padding: 12px;
        border-radius: 6px;
        overflow-x: auto;
        margin-bottom: 8px;
      }

      .philjs-code-block code {
        color: #e0e0e0;
        white-space: pre;
      }

      .philjs-stack-trace {
        margin-bottom: 30px;
      }

      .philjs-stack-title {
        font-size: 18px;
        font-weight: 600;
        margin-bottom: 16px;
      }

      .philjs-stack-content {
        background: rgba(0, 0, 0, 0.4);
        padding: 16px;
        border-radius: 8px;
        overflow-x: auto;
        white-space: pre;
        font-size: 13px;
        line-height: 1.8;
      }

      .philjs-docs-link {
        background: rgba(59, 130, 246, 0.1);
        border-left: 4px solid #3b82f6;
        padding: 16px;
        border-radius: 8px;
        margin-bottom: 30px;
      }

      .philjs-docs-link a {
        color: #60a5fa;
        text-decoration: none;
        font-weight: 600;
      }

      .philjs-docs-link a:hover {
        text-decoration: underline;
      }

      .philjs-footer {
        text-align: center;
        color: #a0a0a0;
        font-size: 12px;
        padding-top: 20px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
      }

      .philjs-footer kbd {
        background: rgba(255, 255, 255, 0.1);
        padding: 2px 8px;
        border-radius: 4px;
        font-family: inherit;
      }
    </style>

    <div class="philjs-error-container">
      <div class="philjs-error-header">
        <div class="philjs-error-title">
          <span class="philjs-error-icon">⚠️</span>
          <div>
            <h1 class="philjs-error-heading">
              ${escapeHtml(error.name)}
              <span class="philjs-error-code">${escapeHtml(error.code)}</span>
            </h1>
          </div>
        </div>
        <button class="philjs-error-close" onclick="window.__PHILJS_HIDE_ERROR_OVERLAY__()">
          Close
        </button>
      </div>

      <div class="philjs-error-message">
        ${escapeHtml(error.message)}
      </div>

      ${error.sourceLocation ? `
        <div class="philjs-error-location">
          <strong>Location:</strong>
          ${escapeHtml(error.sourceLocation.file)}:${error.sourceLocation.line}:${error.sourceLocation.column}
        </div>
      ` : ''}

      ${error.suggestions.length > 0 ? `
        <div class="philjs-suggestions">
          <h2 class="philjs-suggestions-title">
            💡 Suggestions
          </h2>
          ${error.suggestions.map((suggestion, idx) => `
            <div class="philjs-suggestion">
              <div class="philjs-suggestion-description">
                ${idx + 1}. ${escapeHtml(suggestion.description)}
              </div>
              ${suggestion.confidence ? `
                <div class="philjs-suggestion-confidence">
                  Confidence: ${Math.round(suggestion.confidence * 100)}%
                  ${suggestion.autoFixable ? ' • Auto-fixable' : ''}
                </div>
              ` : ''}
              ${suggestion.codeExample ? `
                <div class="philjs-code-example">
                  <div class="philjs-code-label">Before:</div>
                  <div class="philjs-code-block">
                    <code>${escapeHtml(suggestion.codeExample.before)}</code>
                  </div>
                  <div class="philjs-code-label">After:</div>
                  <div class="philjs-code-block">
                    <code>${escapeHtml(suggestion.codeExample.after)}</code>
                  </div>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${error.documentationUrl ? `
        <div class="philjs-docs-link">
          📚 <a href="${escapeHtml(error.documentationUrl)}" target="_blank" rel="noopener">
            Learn more in the documentation
          </a>
        </div>
      ` : ''}

      <div class="philjs-stack-trace">
        <h2 class="philjs-stack-title">Stack Trace</h2>
        <div class="philjs-stack-content">${escapeHtml(formatted.stack || error.stack || 'No stack trace available')}</div>
      </div>

      <div class="philjs-footer">
        Press <kbd>Esc</kbd> to close this overlay
      </div>
    </div>
  `;

  return overlay;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Initialize error overlay system
 */
export function initErrorOverlay(): void {
  if (typeof window === 'undefined') return;

  // Make hide function globally accessible for close button
  (window as any).__PHILJS_HIDE_ERROR_OVERLAY__ = hideErrorOverlay;

  // Intercept unhandled errors in development
  if (process.env.NODE_ENV === 'development') {
    window.addEventListener('error', (event) => {
      // Check if this is a PhilJS error
      if ((event.error as any)?.code?.startsWith('PHIL-')) {
        event.preventDefault();
        showErrorOverlay(event.error as PhilJSError);
      }
    });

    window.addEventListener('unhandledrejection', (event) => {
      // Check if this is a PhilJS error
      if ((event.reason as any)?.code?.startsWith('PHIL-')) {
        event.preventDefault();
        showErrorOverlay(event.reason as PhilJSError);
      }
    });
  }
}

/**
 * Check if error overlay is currently shown
 */
export function isErrorOverlayVisible(): boolean {
  return overlayElement !== null;
}

/**
 * Get current error shown in overlay
 */
export function getCurrentError(): PhilJSError | null {
  return currentError;
}

/**
 * Update error overlay content (useful for live updates)
 */
export function updateErrorOverlay(error: PhilJSError): void {
  if (overlayElement && currentError) {
    currentError = error;
    const newOverlay = createOverlayElement(error);
    overlayElement.replaceWith(newOverlay);
    overlayElement = newOverlay;
  }
}
