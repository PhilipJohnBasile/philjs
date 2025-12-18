/**
 * Enhanced error overlay for HMR-specific errors
 *
 * Provides a better developer experience by showing HMR-specific errors
 * with context, suggestions, and the ability to retry or rollback.
 */

/**
 * HMR error types
 */
export type HMRErrorType =
  | 'snapshot-failed'
  | 'restore-failed'
  | 'update-failed'
  | 'boundary-error'
  | 'state-corruption'
  | 'timeout';

/**
 * HMR error information
 */
export interface HMRError {
  type: HMRErrorType;
  message: string;
  file?: string;
  stack?: string;
  suggestion?: string;
  canRetry?: boolean;
  canRollback?: boolean;
  timestamp: number;
}

/**
 * Error overlay state
 */
interface OverlayState {
  errors: HMRError[];
  visible: boolean;
  retryCount: number;
}

const state: OverlayState = {
  errors: [],
  visible: false,
  retryCount: 0,
};

/**
 * Create the error overlay DOM element
 */
function createOverlay(): HTMLDivElement {
  const overlay = document.createElement('div');
  overlay.id = 'philjs-hmr-error-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 999999;
    background: rgba(0, 0, 0, 0.85);
    color: #fff;
    font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
    font-size: 14px;
    line-height: 1.5;
    overflow: auto;
    padding: 20px;
    box-sizing: border-box;
  `;
  return overlay;
}

/**
 * Get error icon for error type
 */
function getErrorIcon(type: HMRErrorType): string {
  const icons: Record<HMRErrorType, string> = {
    'snapshot-failed': '📸',
    'restore-failed': '🔄',
    'update-failed': '❌',
    'boundary-error': '🚧',
    'state-corruption': '⚠️',
    'timeout': '⏱️',
  };
  return icons[type] || '❌';
}

/**
 * Get error title for error type
 */
function getErrorTitle(type: HMRErrorType): string {
  const titles: Record<HMRErrorType, string> = {
    'snapshot-failed': 'HMR Snapshot Failed',
    'restore-failed': 'HMR State Restore Failed',
    'update-failed': 'HMR Update Failed',
    'boundary-error': 'HMR Boundary Error',
    'state-corruption': 'HMR State Corrupted',
    'timeout': 'HMR Timeout',
  };
  return titles[type] || 'HMR Error';
}

/**
 * Get default suggestion for error type
 */
function getDefaultSuggestion(type: HMRErrorType): string {
  const suggestions: Record<HMRErrorType, string> = {
    'snapshot-failed': 'Try refreshing the page. Some signal values may not be serializable.',
    'restore-failed': 'State restoration failed. The page will reload to recover.',
    'update-failed': 'The HMR update could not be applied. Check the console for details.',
    'boundary-error': 'Component boundary detection failed. Try adding explicit HMR boundaries.',
    'state-corruption': 'Signal state may be corrupted. A full page reload is recommended.',
    'timeout': 'HMR update took too long (>100ms). Consider optimizing your components.',
  };
  return suggestions[type] || 'An unexpected HMR error occurred.';
}

/**
 * Format stack trace for display
 */
function formatStack(stack?: string): string {
  if (!stack) return '';

  return stack
    .split('\n')
    .filter(line => line.trim())
    .slice(0, 10) // Show first 10 lines
    .map(line => `  ${line.trim()}`)
    .join('\n');
}

/**
 * Render error overlay content
 */
function renderOverlayContent(error: HMRError): string {
  const icon = getErrorIcon(error.type);
  const title = getErrorTitle(error.type);
  const suggestion = error.suggestion || getDefaultSuggestion(error.type);
  const stack = formatStack(error.stack);
  const time = new Date(error.timestamp).toLocaleTimeString();

  return `
    <div style="max-width: 900px; margin: 0 auto; background: #1a1a1a; border-radius: 8px; padding: 30px; box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
      <div style="display: flex; align-items: center; margin-bottom: 20px;">
        <span style="font-size: 48px; margin-right: 20px;">${icon}</span>
        <div>
          <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #ff6b6b;">${title}</h1>
          <p style="margin: 5px 0 0; color: #888; font-size: 12px;">PhilJS HMR Error at ${time}</p>
        </div>
      </div>

      ${error.file ? `
        <div style="margin-bottom: 20px; padding: 15px; background: #2a2a2a; border-left: 4px solid #4a9eff; border-radius: 4px;">
          <strong style="color: #4a9eff;">File:</strong>
          <code style="color: #fff; margin-left: 10px;">${error.file}</code>
        </div>
      ` : ''}

      <div style="margin-bottom: 20px; padding: 15px; background: #2a2a2a; border-left: 4px solid #ff6b6b; border-radius: 4px;">
        <strong style="color: #ff6b6b;">Error:</strong>
        <pre style="margin: 10px 0 0; color: #fff; white-space: pre-wrap; word-break: break-word;">${error.message}</pre>
      </div>

      ${suggestion ? `
        <div style="margin-bottom: 20px; padding: 15px; background: #2a2a2a; border-left: 4px solid #ffd93d; border-radius: 4px;">
          <strong style="color: #ffd93d;">💡 Suggestion:</strong>
          <p style="margin: 10px 0 0; color: #ccc;">${suggestion}</p>
        </div>
      ` : ''}

      ${stack ? `
        <details style="margin-bottom: 20px; cursor: pointer;">
          <summary style="padding: 10px; background: #2a2a2a; border-radius: 4px; color: #888; user-select: none;">
            <strong>Stack Trace</strong>
          </summary>
          <pre style="margin: 10px 0 0; padding: 15px; background: #1f1f1f; border-radius: 4px; overflow-x: auto; color: #888; font-size: 12px;">${stack}</pre>
        </details>
      ` : ''}

      <div style="display: flex; gap: 10px; margin-top: 30px;">
        ${error.canRetry !== false ? `
          <button
            onclick="window.__philjs_hmr_retry()"
            style="flex: 1; padding: 12px 24px; background: #4a9eff; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.2s;"
            onmouseover="this.style.background='#3a8eef'"
            onmouseout="this.style.background='#4a9eff'"
          >
            🔄 Retry Update
          </button>
        ` : ''}

        ${error.canRollback !== false ? `
          <button
            onclick="window.__philjs_hmr_rollback()"
            style="flex: 1; padding: 12px 24px; background: #666; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.2s;"
            onmouseover="this.style.background='#777'"
            onmouseout="this.style.background='#666'"
          >
            ⏮️ Rollback State
          </button>
        ` : ''}

        <button
          onclick="window.__philjs_hmr_reload()"
          style="flex: 1; padding: 12px 24px; background: #ff6b6b; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.2s;"
          onmouseover="this.style.background='#ff5252'"
          onmouseout="this.style.background='#ff6b6b'"
        >
          🔃 Full Reload
        </button>

        <button
          onclick="window.__philjs_hmr_dismiss()"
          style="padding: 12px 24px; background: transparent; color: #888; border: 2px solid #888; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s;"
          onmouseover="this.style.borderColor='#fff'; this.style.color='#fff'"
          onmouseout="this.style.borderColor='#888'; this.style.color='#888'"
        >
          ✕ Dismiss
        </button>
      </div>

      ${state.retryCount > 0 ? `
        <p style="margin-top: 15px; color: #888; font-size: 12px; text-align: center;">
          Retry attempts: ${state.retryCount}
        </p>
      ` : ''}
    </div>
  `;
}

/**
 * Show the error overlay
 */
export function showHMRErrorOverlay(error: HMRError): void {
  // Add to error list
  state.errors.push(error);

  // Remove existing overlay if present
  const existing = document.getElementById('philjs-hmr-error-overlay');
  if (existing) {
    existing.remove();
  }

  // Create and show new overlay
  const overlay = createOverlay();
  overlay.innerHTML = renderOverlayContent(error);
  document.body.appendChild(overlay);

  state.visible = true;

  console.error('[PhilJS HMR] Error:', error);
}

/**
 * Hide the error overlay
 */
export function hideHMRErrorOverlay(): void {
  const overlay = document.getElementById('philjs-hmr-error-overlay');
  if (overlay) {
    overlay.remove();
  }
  state.visible = false;
}

/**
 * Setup global handlers for overlay actions
 */
export function setupOverlayHandlers(): void {
  if (typeof window === 'undefined') {
    return;
  }

  // Retry handler
  (window as any).__philjs_hmr_retry = () => {
    state.retryCount++;
    hideHMRErrorOverlay();

    // Trigger a manual HMR update
    if (import.meta.hot) {
      import.meta.hot.invalidate();
    }
  };

  // Rollback handler
  (window as any).__philjs_hmr_rollback = async () => {
    hideHMRErrorOverlay();

    try {
      const { rollbackHMRState, getHMRStats } = await import('philjs-core/signals');
      const stats = getHMRStats();

      if (stats.hasSnapshot) {
        // Rollback is handled automatically by the HMR client
        console.log('[PhilJS HMR] Rolling back to previous state...');
        window.location.reload();
      } else {
        console.warn('[PhilJS HMR] No snapshot available for rollback');
        window.location.reload();
      }
    } catch (error) {
      console.error('[PhilJS HMR] Rollback failed:', error);
      window.location.reload();
    }
  };

  // Reload handler
  (window as any).__philjs_hmr_reload = () => {
    window.location.reload();
  };

  // Dismiss handler
  (window as any).__philjs_hmr_dismiss = () => {
    hideHMRErrorOverlay();
  };

  // Listen for ESC key to dismiss
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && state.visible) {
      hideHMRErrorOverlay();
    }
  });
}

/**
 * Get error history
 */
export function getHMRErrorHistory(): HMRError[] {
  return [...state.errors];
}

/**
 * Clear error history
 */
export function clearHMRErrorHistory(): void {
  state.errors = [];
  state.retryCount = 0;
}

// Auto-setup in development mode
if (import.meta.env?.DEV) {
  setupOverlayHandlers();
}
