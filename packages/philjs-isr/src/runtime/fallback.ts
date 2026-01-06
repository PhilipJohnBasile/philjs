/**
 * PhilJS ISR Fallback Handling
 *
 * Handles fallback behavior for pages that haven't been pre-rendered.
 * Implements blocking, true (loading state), and false (404) modes.
 */

import type { FallbackMode, ISRLogger, StaticPropsContext } from '../types.js';
import type { RuntimeCache } from './cache.js';
import type { RuntimeRevalidator } from './revalidate.js';

/**
 * Fallback handler options
 */
export interface FallbackHandlerOptions {
  /** Cache instance */
  cache: RuntimeCache;
  /** Revalidator instance */
  revalidator: RuntimeRevalidator;
  /** Custom loading HTML */
  loadingHtml?: string | ((path: string) => string);
  /** Custom 404 HTML */
  notFoundHtml?: string | ((path: string) => string);
  /** Logger */
  logger?: ISRLogger;
}

/**
 * Fallback result
 */
export interface FallbackResult {
  /** Response type */
  type: 'content' | 'loading' | 'notFound' | 'redirect';
  /** HTML content (for content and loading types) */
  html?: string;
  /** Redirect location (for redirect type) */
  redirect?: string;
  /** HTTP status code */
  status: number;
  /** Additional headers */
  headers: Record<string, string>;
  /** Whether content should be cached */
  shouldCache: boolean;
}

/**
 * Default loading HTML
 */
const DEFAULT_LOADING_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Loading...</title>
  <style>
    body {
      font-family: system-ui, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: #f5f5f5;
    }
    .loader {
      text-align: center;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e0e0e0;
      border-top-color: #333;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 16px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="loader">
    <div class="spinner"></div>
    <p>Loading...</p>
  </div>
  <script>
    // Refresh when content is ready
    setTimeout(() => location.reload(), 1000);
  </script>
</body>
</html>`;

/**
 * Default 404 HTML
 */
const DEFAULT_NOT_FOUND_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Page Not Found</title>
  <style>
    body {
      font-family: system-ui, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: #f5f5f5;
    }
    .error {
      text-align: center;
    }
    h1 { color: #333; margin-bottom: 8px; }
    p { color: #666; }
  </style>
</head>
<body>
  <div class="error">
    <h1>404</h1>
    <p>Page not found</p>
  </div>
</body>
</html>`;

/**
 * Fallback handler class
 */
export class FallbackHandler {
  private cache: RuntimeCache;
  private revalidator: RuntimeRevalidator;
  private loadingHtml: string | ((path: string) => string);
  private notFoundHtml: string | ((path: string) => string);
  private logger: ISRLogger;
  private generatingPaths: Set<string> = new Set();

  constructor(options: FallbackHandlerOptions) {
    this.cache = options.cache;
    this.revalidator = options.revalidator;
    this.loadingHtml = options.loadingHtml ?? DEFAULT_LOADING_HTML;
    this.notFoundHtml = options.notFoundHtml ?? DEFAULT_NOT_FOUND_HTML;
    this.logger = options.logger ?? this.createDefaultLogger();
  }

  /**
   * Handle a fallback request
   */
  async handle(
    path: string,
    fallbackMode: FallbackMode,
    context?: StaticPropsContext
  ): Promise<FallbackResult> {
    this.logger.debug(`Handling fallback for ${path} (mode: ${fallbackMode})`);

    // Check if page is already being generated
    const isGenerating = this.generatingPaths.has(path);

    switch (fallbackMode) {
      case 'blocking':
        return this.handleBlocking(path, context);

      case true:
        return this.handleLoading(path, context, isGenerating);

      case false:
      default:
        return this.handleNotFound(path);
    }
  }

  /**
   * Handle blocking fallback - wait for generation
   */
  private async handleBlocking(
    path: string,
    context?: StaticPropsContext
  ): Promise<FallbackResult> {
    this.generatingPaths.add(path);

    try {
      // Generate the page and wait
      const result = await this.revalidator.revalidate(path, {
        force: true,
        context,
      });

      if (!result.success) {
        this.logger.error(`Blocking generation failed: ${path}`, { error: result.error });
        return this.handleNotFound(path);
      }

      // Get the generated content
      const entry = await this.cache.get(path);
      if (!entry) {
        return this.handleNotFound(path);
      }

      return {
        type: 'content',
        html: entry.html,
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': this.cache.getCacheControl(entry),
          'ETag': this.cache.getETag(entry),
          'X-ISR-Fallback': 'blocking',
        },
        shouldCache: true,
      };
    } finally {
      this.generatingPaths.delete(path);
    }
  }

  /**
   * Handle loading fallback - return loading state and generate in background
   */
  private async handleLoading(
    path: string,
    context?: StaticPropsContext,
    alreadyGenerating: boolean = false
  ): Promise<FallbackResult> {
    // Start background generation if not already running
    if (!alreadyGenerating && !this.generatingPaths.has(path)) {
      this.generatingPaths.add(path);

      this.revalidator
        .revalidate(path, { force: true, context })
        .then((result) => {
          if (!result.success) {
            this.logger.error(`Background generation failed: ${path}`, { error: result.error });
          }
        })
        .finally(() => {
          this.generatingPaths.delete(path);
        });
    }

    // Return loading state
    const loadingContent =
      typeof this.loadingHtml === 'function'
        ? this.loadingHtml(path)
        : this.loadingHtml;

    return {
      type: 'loading',
      html: loadingContent,
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-ISR-Fallback': 'loading',
      },
      shouldCache: false,
    };
  }

  /**
   * Handle not found fallback - return 404
   */
  private handleNotFound(path: string): FallbackResult {
    const notFoundContent =
      typeof this.notFoundHtml === 'function'
        ? this.notFoundHtml(path)
        : this.notFoundHtml;

    return {
      type: 'notFound',
      html: notFoundContent,
      status: 404,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-ISR-Fallback': 'not-found',
      },
      shouldCache: false,
    };
  }

  /**
   * Check if a path is currently being generated
   */
  isGenerating(path: string): boolean {
    return this.generatingPaths.has(path);
  }

  /**
   * Get all paths currently being generated
   */
  getGeneratingPaths(): string[] {
    return Array.from(this.generatingPaths);
  }

  /**
   * Set custom loading HTML
   */
  setLoadingHtml(html: string | ((path: string) => string)): void {
    this.loadingHtml = html;
  }

  /**
   * Set custom 404 HTML
   */
  setNotFoundHtml(html: string | ((path: string) => string)): void {
    this.notFoundHtml = html;
  }

  private createDefaultLogger(): ISRLogger {
    return {
      debug: () => {},
      info: () => {},
      warn: (msg) => console.warn(`[ISR:Fallback] ${msg}`),
      error: (msg) => console.error(`[ISR:Fallback] ${msg}`),
    };
  }
}

/**
 * Create a fallback handler
 */
export function createFallbackHandler(options: FallbackHandlerOptions): FallbackHandler {
  return new FallbackHandler(options);
}

/**
 * Create custom loading HTML with meta refresh
 */
export function createLoadingHtml(options: {
  title?: string;
  message?: string;
  refreshInterval?: number;
  styles?: string;
}): string {
  const {
    title = 'Loading...',
    message = 'Please wait while the page is being generated.',
    refreshInterval = 1,
    styles = '',
  } = options;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="refresh" content="${refreshInterval}">
  <title>${title}</title>
  <style>
    body {
      font-family: system-ui, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: #f5f5f5;
    }
    .loader {
      text-align: center;
      max-width: 400px;
      padding: 24px;
    }
    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid #e0e0e0;
      border-top-color: #333;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 24px;
    }
    h1 { color: #333; font-size: 24px; margin: 0 0 8px; }
    p { color: #666; margin: 0; }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    ${styles}
  </style>
</head>
<body>
  <div class="loader">
    <div class="spinner"></div>
    <h1>${title}</h1>
    <p>${message}</p>
  </div>
</body>
</html>`;
}

/**
 * Create custom 404 HTML
 */
export function createNotFoundHtml(options: {
  title?: string;
  message?: string;
  homeLink?: boolean;
  styles?: string;
}): string {
  const {
    title = 'Page Not Found',
    message = "The page you're looking for doesn't exist.",
    homeLink = true,
    styles = '',
  } = options;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <style>
    body {
      font-family: system-ui, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: #f5f5f5;
    }
    .error {
      text-align: center;
      max-width: 400px;
      padding: 24px;
    }
    h1 { color: #333; font-size: 72px; margin: 0; }
    h2 { color: #333; margin: 8px 0 16px; }
    p { color: #666; margin: 0 0 24px; }
    a {
      color: #0070f3;
      text-decoration: none;
    }
    a:hover { text-decoration: underline; }
    ${styles}
  </style>
</head>
<body>
  <div class="error">
    <h1>404</h1>
    <h2>${title}</h2>
    <p>${message}</p>
    ${homeLink ? '<a href="/">Go to homepage</a>' : ''}
  </div>
</body>
</html>`;
}
