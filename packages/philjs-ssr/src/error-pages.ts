/**
 * Enhanced error pages with beautiful UI and diagnostics.
 * Provides development overlay and production error tracking.
 */

import type { JSXElement } from 'philjs-core/jsx-runtime';

// ============================================================================
// Types
// ============================================================================

export interface ErrorPageProps {
  error: Error;
  statusCode: number;
  url?: string;
  timestamp?: Date;
  requestId?: string;
}

export interface ErrorDiagnostic {
  type: 'error' | 'warning' | 'info';
  message: string;
  file?: string;
  line?: number;
  column?: number;
  stack?: string;
  suggestions?: string[];
}

export interface ErrorPageConfig {
  /**
   * Whether to show detailed error information (dev mode)
   */
  showDetails?: boolean;

  /**
   * Custom logo URL
   */
  logo?: string;

  /**
   * Support email or link
   */
  supportLink?: string;

  /**
   * Custom CSS
   */
  customCSS?: string;

  /**
   * Error tracking service endpoint
   */
  trackingEndpoint?: string;

  /**
   * App name
   */
  appName?: string;
}

// ============================================================================
// Error Tracking
// ============================================================================

let errorTracker: ((error: Error, context: any) => void) | null = null;

/**
 * Configure error tracking
 */
export function configureErrorTracking(tracker: (error: Error, context: any) => void) {
  errorTracker = tracker;
}

/**
 * Track an error
 */
export function trackError(error: Error, context: any = {}) {
  if (errorTracker) {
    errorTracker(error, context);
  }

  // Also log to console in development
  if (typeof process !== 'undefined' && process.env?.['NODE_ENV'] !== 'production') {
    console.error('[Error Tracking]', error, context);
  }
}

// ============================================================================
// Error Parsing
// ============================================================================

/**
 * Parse error stack trace to extract diagnostics
 */
export function parseErrorStack(error: Error): ErrorDiagnostic[] {
  const diagnostics: ErrorDiagnostic[] = [];

  // Main error
  const mainDiagnostic: ErrorDiagnostic = {
    type: 'error',
    message: error.message,
  };
  if (error.stack) mainDiagnostic.stack = error.stack;
  diagnostics.push(mainDiagnostic);

  // Parse stack trace
  if (error.stack) {
    const stackLines = error.stack.split('\n').slice(1); // Skip first line (error message)
    const filePattern = /at\s+(?:(.+?)\s+\()?(?:(.+?):(\d+):(\d+))/;

    for (const line of stackLines.slice(0, 5)) { // Show first 5 frames
      const match = line.match(filePattern);
      if (match) {
        const [, , file, lineStr, columnStr] = match;
        const frameDiagnostic: ErrorDiagnostic = {
          type: 'info',
          message: line.trim(),
        };
        if (file) frameDiagnostic.file = file;
        if (lineStr) frameDiagnostic.line = parseInt(lineStr, 10);
        if (columnStr) frameDiagnostic.column = parseInt(columnStr, 10);
        diagnostics.push(frameDiagnostic);
      }
    }
  }

  return diagnostics;
}

/**
 * Generate error suggestions based on error type
 */
export function generateErrorSuggestions(error: Error): string[] {
  const suggestions: string[] = [];
  const message = error.message.toLowerCase();

  if (message.includes('cannot read property') || message.includes('undefined')) {
    suggestions.push('Check if the object or variable is properly initialized');
    suggestions.push('Add null/undefined checks before accessing properties');
  }

  if (message.includes('network') || message.includes('fetch')) {
    suggestions.push('Check your internet connection');
    suggestions.push('Verify the API endpoint is correct and accessible');
    suggestions.push('Check CORS settings if calling a different domain');
  }

  if (message.includes('not found') || message.includes('404')) {
    suggestions.push('Verify the URL path is correct');
    suggestions.push('Check if the resource exists on the server');
  }

  if (message.includes('permission') || message.includes('403')) {
    suggestions.push('Check authentication credentials');
    suggestions.push('Verify you have the required permissions');
  }

  if (message.includes('timeout')) {
    suggestions.push('The request took too long - try again');
    suggestions.push('Check if the server is responding slowly');
  }

  if (suggestions.length === 0) {
    suggestions.push('Check the browser console for more details');
    suggestions.push('Try refreshing the page');
  }

  return suggestions;
}

// ============================================================================
// Error Page Components
// ============================================================================

/**
 * Beautiful 404 Not Found page
 */
export function NotFoundPage(props: {
  url?: string;
  config?: ErrorPageConfig;
}): string {
  const { url, config = {} } = props;
  const appName = config.appName || 'PhilJS App';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>404 - Page Not Found</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #333;
    }

    .container {
      text-align: center;
      padding: 2rem;
      max-width: 600px;
    }

    .error-code {
      font-size: 8rem;
      font-weight: 800;
      color: white;
      text-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
      margin-bottom: 1rem;
      animation: float 3s ease-in-out infinite;
    }

    @keyframes float {
      0%, 100% {
        transform: translateY(0px);
      }
      50% {
        transform: translateY(-20px);
      }
    }

    .error-title {
      font-size: 2rem;
      color: white;
      margin-bottom: 1rem;
      font-weight: 600;
    }

    .error-message {
      font-size: 1.1rem;
      color: rgba(255, 255, 255, 0.9);
      margin-bottom: 2rem;
      line-height: 1.6;
    }

    .url-box {
      background: rgba(255, 255, 255, 0.1);
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 2rem;
      word-break: break-all;
      color: rgba(255, 255, 255, 0.8);
      font-family: 'Courier New', monospace;
    }

    .actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      transition: transform 0.2s, box-shadow 0.2s;
      cursor: pointer;
      border: none;
      font-size: 1rem;
    }

    .btn-primary {
      background: white;
      color: #667eea;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .btn-secondary {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
    }

    .support-link {
      margin-top: 2rem;
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.9rem;
    }

    .support-link a {
      color: white;
      text-decoration: underline;
    }

    ${config.customCSS || ''}
  </style>
</head>
<body>
  <div class="container">
    <div class="error-code">404</div>
    <h1 class="error-title">Page Not Found</h1>
    <p class="error-message">
      Sorry, we couldn't find the page you're looking for.
      It might have been moved or deleted.
    </p>
    ${url ? `<div class="url-box">${escapeHtml(url)}</div>` : ''}
    <div class="actions">
      <a href="/" class="btn btn-primary">Go Home</a>
      <button onclick="history.back()" class="btn btn-secondary">Go Back</button>
    </div>
    ${config.supportLink ? `
      <div class="support-link">
        Need help? <a href="${escapeHtml(config.supportLink)}">Contact Support</a>
      </div>
    ` : ''}
  </div>
</body>
</html>`;
}

/**
 * 500 Internal Server Error page with diagnostics
 */
export function InternalErrorPage(props: {
  error: Error;
  config?: ErrorPageConfig;
  requestId?: string;
  timestamp?: Date;
}): string {
  const { error, config = {}, requestId, timestamp } = props;
  const diagnostics = parseErrorStack(error);
  const suggestions = generateErrorSuggestions(error);
  const showDetails = config.showDetails ?? (typeof process !== 'undefined' && process.env?.['NODE_ENV'] !== 'production');

  // Track error
  trackError(error, { requestId, timestamp });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>500 - Internal Server Error</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: #f5f5f5;
      min-height: 100vh;
      padding: 2rem;
      color: #333;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
    }

    .header {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: white;
      padding: 2rem;
      border-radius: 12px;
      margin-bottom: 2rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .error-code {
      font-size: 3rem;
      font-weight: 800;
      margin-bottom: 0.5rem;
    }

    .error-title {
      font-size: 1.5rem;
      font-weight: 600;
      opacity: 0.9;
    }

    .metadata {
      display: flex;
      gap: 2rem;
      margin-top: 1rem;
      font-size: 0.9rem;
      opacity: 0.8;
    }

    .card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .card-title {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 1rem;
      color: #333;
    }

    .error-message {
      background: #fee;
      border-left: 4px solid #f5576c;
      padding: 1rem;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 0.9rem;
      margin-bottom: 1rem;
      color: #c33;
    }

    .stack-trace {
      background: #1e1e1e;
      color: #d4d4d4;
      padding: 1rem;
      border-radius: 4px;
      overflow-x: auto;
      font-family: 'Courier New', monospace;
      font-size: 0.85rem;
      line-height: 1.5;
    }

    .stack-trace .line {
      opacity: 0.7;
      transition: opacity 0.2s;
    }

    .stack-trace .line:hover {
      opacity: 1;
      background: rgba(255, 255, 255, 0.05);
    }

    .suggestions {
      list-style: none;
    }

    .suggestion {
      padding: 0.75rem;
      background: #f0f7ff;
      border-left: 3px solid #3b82f6;
      margin-bottom: 0.5rem;
      border-radius: 4px;
      display: flex;
      align-items: start;
      gap: 0.5rem;
    }

    .suggestion::before {
      content: '💡';
      flex-shrink: 0;
    }

    .actions {
      display: flex;
      gap: 1rem;
      margin-top: 1.5rem;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      transition: transform 0.2s, box-shadow 0.2s;
      cursor: pointer;
      border: none;
      font-size: 1rem;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
      box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
    }

    .btn-secondary {
      background: #e5e7eb;
      color: #333;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }

    .hidden {
      display: none;
    }

    ${config.customCSS || ''}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="error-code">500</div>
      <div class="error-title">Internal Server Error</div>
      ${requestId || timestamp ? `
        <div class="metadata">
          ${requestId ? `<div>Request ID: ${escapeHtml(requestId)}</div>` : ''}
          ${timestamp ? `<div>Time: ${timestamp.toISOString()}</div>` : ''}
        </div>
      ` : ''}
    </div>

    ${showDetails ? `
      <div class="card">
        <h2 class="card-title">Error Details</h2>
        <div class="error-message">${escapeHtml(error.message)}</div>
        ${error.stack ? `
          <details>
            <summary style="cursor: pointer; font-weight: 600; margin-bottom: 1rem;">Stack Trace</summary>
            <div class="stack-trace">
              ${error.stack.split('\n').map(line =>
                `<div class="line">${escapeHtml(line)}</div>`
              ).join('')}
            </div>
          </details>
        ` : ''}
      </div>
    ` : `
      <div class="card">
        <h2 class="card-title">Something Went Wrong</h2>
        <p>We're sorry, but something went wrong on our end. Our team has been notified and is working to fix the issue.</p>
      </div>
    `}

    <div class="card">
      <h2 class="card-title">What You Can Do</h2>
      <ul class="suggestions">
        ${suggestions.map(suggestion =>
          `<li class="suggestion">${escapeHtml(suggestion)}</li>`
        ).join('')}
      </ul>
      <div class="actions">
        <a href="/" class="btn btn-primary">Go Home</a>
        <button onclick="location.reload()" class="btn btn-secondary">Reload Page</button>
      </div>
    </div>

    ${config.supportLink ? `
      <div class="card">
        <p style="text-align: center; color: #666;">
          Still having issues? <a href="${escapeHtml(config.supportLink)}" style="color: #3b82f6;">Contact Support</a>
        </p>
      </div>
    ` : ''}
  </div>
</body>
</html>`;
}

/**
 * Development error overlay (injected into page)
 */
export function DevErrorOverlay(props: {
  error: Error;
  componentStack?: string;
}): string {
  const { error, componentStack } = props;
  const diagnostics = parseErrorStack(error);

  return `
<div id="philjs-error-overlay" style="
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  z-index: 999999;
  overflow: auto;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
">
  <div style="max-width: 1200px; margin: 2rem auto; padding: 2rem;">
    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 2rem;">
      <div>
        <h1 style="color: #ff6b6b; font-size: 2rem; margin-bottom: 0.5rem;">
          ⚠️ Runtime Error
        </h1>
        <p style="color: #ccc; font-size: 1rem;">
          The application encountered an error during execution
        </p>
      </div>
      <button onclick="document.getElementById('philjs-error-overlay').remove()" style="
        background: #444;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        cursor: pointer;
        font-size: 1rem;
      ">
        ✕ Close
      </button>
    </div>

    <div style="background: #1e1e1e; border-radius: 8px; padding: 1.5rem; margin-bottom: 1.5rem;">
      <h2 style="color: #ff6b6b; font-size: 1.25rem; margin-bottom: 1rem;">
        ${escapeHtml(error.name || 'Error')}
      </h2>
      <pre style="color: #fff; font-family: 'Courier New', monospace; font-size: 0.9rem; white-space: pre-wrap; margin: 0;">
${escapeHtml(error.message)}
      </pre>
    </div>

    ${error.stack ? `
      <div style="background: #1e1e1e; border-radius: 8px; padding: 1.5rem; margin-bottom: 1.5rem;">
        <h2 style="color: #4fc3f7; font-size: 1.25rem; margin-bottom: 1rem;">
          Stack Trace
        </h2>
        <pre style="color: #d4d4d4; font-family: 'Courier New', monospace; font-size: 0.85rem; line-height: 1.6; margin: 0; overflow-x: auto;">
${escapeHtml(error.stack)}
        </pre>
      </div>
    ` : ''}

    ${componentStack ? `
      <div style="background: #1e1e1e; border-radius: 8px; padding: 1.5rem;">
        <h2 style="color: #81c784; font-size: 1.25rem; margin-bottom: 1rem;">
          Component Stack
        </h2>
        <pre style="color: #d4d4d4; font-family: 'Courier New', monospace; font-size: 0.85rem; line-height: 1.6; margin: 0; overflow-x: auto;">
${escapeHtml(componentStack)}
        </pre>
      </div>
    ` : ''}
  </div>
</div>
`;
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char]!);
}

/**
 * Generate error response
 */
export function generateErrorResponse(
  error: Error,
  statusCode: number,
  config?: ErrorPageConfig,
  context?: {
    url?: string;
    requestId?: string;
    timestamp?: Date;
  }
): Response {
  const { url, requestId, timestamp = new Date() } = context || {};

  let html: string;

  if (statusCode === 404) {
    const notFoundProps: { url?: string; config?: ErrorPageConfig } = {};
    if (url) notFoundProps.url = url;
    if (config) notFoundProps.config = config;
    html = NotFoundPage(notFoundProps);
  } else {
    const errorProps: { error: Error; config?: ErrorPageConfig; requestId?: string; timestamp?: Date } = { error, timestamp };
    if (config) errorProps.config = config;
    if (requestId) errorProps.requestId = requestId;
    html = InternalErrorPage(errorProps);
  }

  return new Response(html, {
    status: statusCode,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'X-Error-ID': requestId || crypto.randomUUID?.() || String(Date.now()),
    },
  });
}

/**
 * Custom error component (for use in JSX)
 */
export function ErrorPage(props: {
  statusCode: number;
  error?: Error;
  title?: string;
  message?: string;
  children?: any;
}): JSXElement {
  const { statusCode, error, title, message, children } = props;

  return {
    type: 'div',
    props: {
      className: 'error-page',
      children: [
        {
          type: 'h1',
          props: { children: statusCode },
        },
        title && {
          type: 'h2',
          props: { children: title },
        },
        message && {
          type: 'p',
          props: { children: message },
        },
        error && {
          type: 'pre',
          props: { children: error.message },
        },
        children,
      ].filter(Boolean),
    },
  };
}
