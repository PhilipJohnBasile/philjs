/**
 * Error Tracking Module
 * Captures errors, parses stack traces, supports source maps, and groups errors
 */

import type { SourceMapConsumer, RawSourceMap } from 'source-map';

// ============================================================================
// Types
// ============================================================================

export interface StackFrame {
  /** Function name */
  functionName: string | null;
  /** File name/URL */
  fileName: string | null;
  /** Line number */
  lineNumber: number | null;
  /** Column number */
  columnNumber: number | null;
  /** Source code context (if available) */
  context?: {
    pre: string[];
    line: string;
    post: string[];
  };
  /** Whether this frame is in-app code */
  inApp: boolean;
}

export interface ParsedError {
  /** Error type/name */
  name: string;
  /** Error message */
  message: string;
  /** Parsed stack frames */
  stack: StackFrame[];
  /** Raw stack trace string */
  rawStack: string;
  /** Original error object */
  originalError: Error;
}

export interface CapturedError {
  /** Unique error ID */
  id: string;
  /** Error fingerprint for grouping */
  fingerprint: string;
  /** Timestamp when captured */
  timestamp: number;
  /** Parsed error information */
  error: ParsedError;
  /** URL where error occurred */
  url: string;
  /** User agent */
  userAgent: string;
  /** Breadcrumbs leading up to the error */
  breadcrumbs: Breadcrumb[];
  /** Additional context */
  context: ErrorContext;
  /** Tags for filtering */
  tags: Record<string, string>;
  /** User information */
  user?: UserInfo;
  /** Release/version information */
  release?: string;
  /** Environment */
  environment?: string;
  /** Trace ID (if part of a trace) */
  traceId?: string;
  /** Span ID (if part of a span) */
  spanId?: string;
}

export interface Breadcrumb {
  /** Breadcrumb type */
  type: 'navigation' | 'click' | 'console' | 'xhr' | 'fetch' | 'dom' | 'custom';
  /** Category */
  category: string;
  /** Message */
  message: string;
  /** Timestamp */
  timestamp: number;
  /** Level */
  level: 'debug' | 'info' | 'warning' | 'error';
  /** Additional data */
  data?: Record<string, unknown>;
}

export interface ErrorContext {
  /** DOM element that triggered the error */
  element?: string;
  /** Component name (for React/framework errors) */
  componentName?: string;
  /** Component stack (for React errors) */
  componentStack?: string;
  /** Additional metadata */
  extra?: Record<string, unknown>;
}

export interface UserInfo {
  /** User ID */
  id?: string;
  /** Username */
  username?: string;
  /** Email */
  email?: string;
  /** IP address */
  ipAddress?: string;
}

export interface ErrorTrackerConfig {
  /** Maximum breadcrumbs to keep */
  maxBreadcrumbs?: number;
  /** Maximum errors to store */
  maxErrors?: number;
  /** Patterns to ignore (regex or string) */
  ignorePatterns?: (string | RegExp)[];
  /** Patterns to consider as in-app code */
  inAppPatterns?: (string | RegExp)[];
  /** Sample rate (0-1) */
  sampleRate?: number;
  /** Attach source maps */
  attachSourceMaps?: boolean;
  /** Source map URLs */
  sourceMapUrls?: Record<string, string>;
  /** Callback when an error is captured */
  onError?: (error: CapturedError) => void;
  /** Automatic global error handling */
  captureGlobalErrors?: boolean;
  /** Capture unhandled promise rejections */
  captureUnhandledRejections?: boolean;
  /** Capture console errors */
  captureConsoleErrors?: boolean;
}

export interface ErrorGroup {
  /** Group fingerprint */
  fingerprint: string;
  /** Error name */
  name: string;
  /** Error message (first occurrence) */
  message: string;
  /** Number of occurrences */
  count: number;
  /** First occurrence timestamp */
  firstSeen: number;
  /** Last occurrence timestamp */
  lastSeen: number;
  /** Sample of error IDs in this group */
  errorIds: string[];
  /** Affected users count */
  usersAffected: number;
  /** User IDs affected */
  affectedUserIds: Set<string>;
}

// ============================================================================
// Stack Trace Parser
// ============================================================================

const CHROME_STACK_REGEX = /^\s*at\s+(?:(.+?)\s+\()?(?:(.+?):(\d+):(\d+)|([^)]+))\)?$/;
const FIREFOX_STACK_REGEX = /^(.*)@(.+?):(\d+):(\d+)$/;
const SAFARI_STACK_REGEX = /^(.*)@(.+?):(\d+):(\d+)$/;

export function parseStackTrace(error: Error, inAppPatterns: (string | RegExp)[] = []): StackFrame[] {
  const stack = error.stack || '';
  const lines = stack.split('\n');
  const frames: StackFrame[] = [];

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine === `${error.name}: ${error.message}`) {
      continue;
    }

    let match: RegExpMatchArray | null = null;
    let functionName: string | null = null;
    let fileName: string | null = null;
    let lineNumber: number | null = null;
    let columnNumber: number | null = null;

    // Try Chrome format
    match = trimmedLine.match(CHROME_STACK_REGEX);
    if (match) {
      functionName = match[1] || null;
      fileName = match[2] || match[5] || null;
      lineNumber = match[3] ? parseInt(match[3], 10) : null;
      columnNumber = match[4] ? parseInt(match[4], 10) : null;
    }

    // Try Firefox/Safari format
    if (!match) {
      match = trimmedLine.match(FIREFOX_STACK_REGEX) || trimmedLine.match(SAFARI_STACK_REGEX);
      if (match) {
        functionName = match[1] || null;
        fileName = match[2] || null;
        lineNumber = match[3] ? parseInt(match[3], 10) : null;
        columnNumber = match[4] ? parseInt(match[4], 10) : null;
      }
    }

    if (fileName) {
      const isInApp = inAppPatterns.length === 0 || inAppPatterns.some((pattern) => {
        if (typeof pattern === 'string') {
          return fileName?.includes(pattern);
        }
        return pattern.test(fileName || '');
      });

      frames.push({
        functionName,
        fileName,
        lineNumber,
        columnNumber,
        inApp: isInApp,
      });
    }
  }

  return frames;
}

export function parseError(error: Error, inAppPatterns: (string | RegExp)[] = []): ParsedError {
  return {
    name: error.name || 'Error',
    message: error.message || 'Unknown error',
    stack: parseStackTrace(error, inAppPatterns),
    rawStack: error.stack || '',
    originalError: error,
  };
}

// ============================================================================
// Source Map Support
// ============================================================================

export class SourceMapResolver {
  private sourceMapCache: Map<string, SourceMapConsumer> = new Map();
  private sourceMapUrls: Record<string, string>;

  constructor(sourceMapUrls: Record<string, string> = {}) {
    this.sourceMapUrls = sourceMapUrls;
  }

  async loadSourceMap(fileUrl: string): Promise<SourceMapConsumer | null> {
    if (this.sourceMapCache.has(fileUrl)) {
      return this.sourceMapCache.get(fileUrl) || null;
    }

    const sourceMapUrl = this.sourceMapUrls[fileUrl] || `${fileUrl}.map`;

    try {
      const response = await fetch(sourceMapUrl);
      if (!response.ok) {
        return null;
      }

      const rawSourceMap: RawSourceMap = await response.json();
      const { SourceMapConsumer: SMC } = await import('source-map');
      const consumer = await new SMC(rawSourceMap);

      this.sourceMapCache.set(fileUrl, consumer);
      return consumer;
    } catch {
      return null;
    }
  }

  async resolveFrame(frame: StackFrame): Promise<StackFrame> {
    if (!frame.fileName || frame.lineNumber === null) {
      return frame;
    }

    const consumer = await this.loadSourceMap(frame.fileName);
    if (!consumer) {
      return frame;
    }

    const position = consumer.originalPositionFor({
      line: frame.lineNumber,
      column: frame.columnNumber || 0,
    });

    if (!position.source) {
      return frame;
    }

    return {
      ...frame,
      functionName: position.name || frame.functionName,
      fileName: position.source,
      lineNumber: position.line,
      columnNumber: position.column,
    };
  }

  async resolveStackTrace(frames: StackFrame[]): Promise<StackFrame[]> {
    return Promise.all(frames.map((frame) => this.resolveFrame(frame)));
  }

  destroy(): void {
    this.sourceMapCache.forEach((consumer) => {
      if ('destroy' in consumer && typeof consumer.destroy === 'function') {
        consumer.destroy();
      }
    });
    this.sourceMapCache.clear();
  }
}

// ============================================================================
// Error Fingerprinting
// ============================================================================

export function generateErrorFingerprint(error: ParsedError): string {
  const parts: string[] = [error.name];

  // Use the first in-app frame for fingerprinting
  const inAppFrame = error.stack.find((frame) => frame.inApp);
  if (inAppFrame) {
    if (inAppFrame.fileName) {
      parts.push(inAppFrame.fileName);
    }
    if (inAppFrame.functionName) {
      parts.push(inAppFrame.functionName);
    }
    if (inAppFrame.lineNumber !== null) {
      parts.push(String(inAppFrame.lineNumber));
    }
  } else if (error.stack.length > 0) {
    // Fallback to first frame
    const firstFrame = error.stack[0]!;
    if (firstFrame.fileName) {
      parts.push(firstFrame.fileName);
    }
    if (firstFrame.lineNumber !== null) {
      parts.push(String(firstFrame.lineNumber));
    }
  }

  // Normalize message (remove variable parts)
  const normalizedMessage = error.message
    .replace(/\d+/g, '<number>')
    .replace(/'[^']*'/g, '<string>')
    .replace(/"[^"]*"/g, '<string>')
    .substring(0, 100);

  parts.push(normalizedMessage);

  // Create hash
  const str = parts.join('|');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  return Math.abs(hash).toString(16);
}

// ============================================================================
// Error Tracker
// ============================================================================

export class ErrorTracker {
  private config: Required<ErrorTrackerConfig>;
  private errors: CapturedError[] = [];
  private breadcrumbs: Breadcrumb[] = [];
  private errorGroups: Map<string, ErrorGroup> = new Map();
  private sourceMapResolver: SourceMapResolver | null = null;
  private user: UserInfo | undefined;
  private release: string | undefined;
  private environment: string | undefined;
  private traceId: string | undefined;
  private spanId: string | undefined;

  constructor(config: ErrorTrackerConfig = {}) {
    this.config = {
      maxBreadcrumbs: config.maxBreadcrumbs ?? 50,
      maxErrors: config.maxErrors ?? 100,
      ignorePatterns: config.ignorePatterns ?? [],
      inAppPatterns: config.inAppPatterns ?? [],
      sampleRate: config.sampleRate ?? 1,
      attachSourceMaps: config.attachSourceMaps ?? false,
      sourceMapUrls: config.sourceMapUrls ?? {},
      onError: config.onError ?? (() => {}),
      captureGlobalErrors: config.captureGlobalErrors ?? true,
      captureUnhandledRejections: config.captureUnhandledRejections ?? true,
      captureConsoleErrors: config.captureConsoleErrors ?? false,
    };

    if (this.config.attachSourceMaps) {
      this.sourceMapResolver = new SourceMapResolver(this.config.sourceMapUrls);
    }

    if (typeof window !== 'undefined') {
      this.setupGlobalHandlers();
    }
  }

  /**
   * Set user information
   */
  setUser(user: UserInfo | undefined): void {
    this.user = user;
  }

  /**
   * Set release version
   */
  setRelease(release: string | undefined): void {
    this.release = release;
  }

  /**
   * Set environment
   */
  setEnvironment(environment: string | undefined): void {
    this.environment = environment;
  }

  /**
   * Set trace context
   */
  setTraceContext(traceId: string | undefined, spanId: string | undefined): void {
    this.traceId = traceId;
    this.spanId = spanId;
  }

  /**
   * Add a breadcrumb
   */
  addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>): void {
    const crumb: Breadcrumb = {
      ...breadcrumb,
      timestamp: Date.now(),
    };

    this.breadcrumbs.push(crumb);

    if (this.breadcrumbs.length > this.config.maxBreadcrumbs) {
      this.breadcrumbs.shift();
    }
  }

  /**
   * Capture an error
   */
  async captureError(
    error: Error,
    context: ErrorContext = {},
    tags: Record<string, string> = {}
  ): Promise<CapturedError | null> {
    if (!this.shouldCapture(error)) {
      return null;
    }

    let parsedError = parseError(error, this.config.inAppPatterns);

    // Resolve source maps if configured
    if (this.sourceMapResolver) {
      parsedError = {
        ...parsedError,
        stack: await this.sourceMapResolver.resolveStackTrace(parsedError.stack),
      };
    }

    const fingerprint = generateErrorFingerprint(parsedError);

    const capturedError: CapturedError = {
      id: this.generateId(),
      fingerprint,
      timestamp: Date.now(),
      error: parsedError,
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      breadcrumbs: [...this.breadcrumbs],
      context,
      tags,
    };
    if (this.user !== undefined) capturedError.user = this.user;
    if (this.release !== undefined) capturedError.release = this.release;
    if (this.environment !== undefined) capturedError.environment = this.environment;
    if (this.traceId !== undefined) capturedError.traceId = this.traceId;
    if (this.spanId !== undefined) capturedError.spanId = this.spanId;

    this.errors.push(capturedError);
    this.updateErrorGroup(capturedError);

    if (this.errors.length > this.config.maxErrors) {
      this.errors.shift();
    }

    this.config.onError(capturedError);

    return capturedError;
  }

  /**
   * Capture a message as an error
   */
  async captureMessage(
    message: string,
    level: 'info' | 'warning' | 'error' = 'info',
    context: ErrorContext = {},
    tags: Record<string, string> = {}
  ): Promise<CapturedError | null> {
    const error = new Error(message);
    error.name = level.charAt(0).toUpperCase() + level.slice(1);
    return this.captureError(error, context, tags);
  }

  /**
   * Get all captured errors
   */
  getErrors(): CapturedError[] {
    return [...this.errors];
  }

  /**
   * Get error by ID
   */
  getError(id: string): CapturedError | undefined {
    return this.errors.find((e) => e.id === id);
  }

  /**
   * Get all error groups
   */
  getErrorGroups(): ErrorGroup[] {
    return Array.from(this.errorGroups.values());
  }

  /**
   * Get errors in a group
   */
  getGroupErrors(fingerprint: string): CapturedError[] {
    return this.errors.filter((e) => e.fingerprint === fingerprint);
  }

  /**
   * Clear all errors
   */
  clear(): void {
    this.errors = [];
    this.breadcrumbs = [];
    this.errorGroups.clear();
  }

  /**
   * Destroy the tracker
   */
  destroy(): void {
    this.clear();
    if (this.sourceMapResolver) {
      this.sourceMapResolver.destroy();
    }
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  private shouldCapture(error: Error): boolean {
    if (Math.random() >= this.config.sampleRate) {
      return false;
    }

    const message = error.message || '';

    for (const pattern of this.config.ignorePatterns) {
      if (typeof pattern === 'string') {
        if (message.includes(pattern)) {
          return false;
        }
      } else if (pattern.test(message)) {
        return false;
      }
    }

    return true;
  }

  private updateErrorGroup(error: CapturedError): void {
    const existing = this.errorGroups.get(error.fingerprint);

    if (existing) {
      existing.count++;
      existing.lastSeen = error.timestamp;
      existing.errorIds.push(error.id);

      if (error.user?.id && !existing.affectedUserIds.has(error.user.id)) {
        existing.affectedUserIds.add(error.user.id);
        existing.usersAffected = existing.affectedUserIds.size;
      }

      // Keep only recent error IDs
      if (existing.errorIds.length > 10) {
        existing.errorIds.shift();
      }
    } else {
      const affectedUserIds = new Set<string>();
      if (error.user?.id) {
        affectedUserIds.add(error.user.id);
      }

      this.errorGroups.set(error.fingerprint, {
        fingerprint: error.fingerprint,
        name: error.error.name,
        message: error.error.message,
        count: 1,
        firstSeen: error.timestamp,
        lastSeen: error.timestamp,
        errorIds: [error.id],
        usersAffected: affectedUserIds.size,
        affectedUserIds,
      });
    }
  }

  private setupGlobalHandlers(): void {
    if (this.config.captureGlobalErrors) {
      window.addEventListener('error', (event) => {
        if (event.error) {
          const errorContext: ErrorContext = {};
          if (event.target instanceof Element) {
            errorContext.element = event.target.outerHTML.substring(0, 200);
          }
          this.captureError(event.error, errorContext);
        }
      });
    }

    if (this.config.captureUnhandledRejections) {
      window.addEventListener('unhandledrejection', (event) => {
        const error = event.reason instanceof Error
          ? event.reason
          : new Error(String(event.reason));
        error.name = 'UnhandledPromiseRejection';
        this.captureError(error);
      });
    }

    if (this.config.captureConsoleErrors) {
      const originalConsoleError = console.error;
      console.error = (...args) => {
        const error = args.find((arg) => arg instanceof Error);
        if (error) {
          this.captureError(error);
        } else {
          this.captureMessage(args.map(String).join(' '), 'error');
        }
        originalConsoleError.apply(console, args);
      };
    }

    // Auto-breadcrumbs for navigation
    window.addEventListener('popstate', () => {
      this.addBreadcrumb({
        type: 'navigation',
        category: 'navigation',
        message: `Navigated to ${window.location.href}`,
        level: 'info',
      });
    });

    // Auto-breadcrumbs for clicks
    document.addEventListener('click', (event) => {
      const target = event.target as Element;
      const selector = this.getElementSelector(target);
      this.addBreadcrumb({
        type: 'click',
        category: 'ui',
        message: `Clicked on ${selector}`,
        level: 'info',
        data: {
          selector,
          innerText: target.textContent?.substring(0, 50),
        },
      });
    }, { capture: true });
  }

  private getElementSelector(element: Element): string {
    const parts: string[] = [];

    if (element.id) {
      return `#${element.id}`;
    }

    const tagName = element.tagName.toLowerCase();
    parts.push(tagName);

    if (element.className && typeof element.className === 'string') {
      const classes = element.className.split(/\s+/).filter(Boolean).slice(0, 2);
      if (classes.length > 0) {
        parts.push(`.${classes.join('.')}`);
      }
    }

    return parts.join('');
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let defaultTracker: ErrorTracker | null = null;

export function getErrorTracker(config?: ErrorTrackerConfig): ErrorTracker {
  if (!defaultTracker) {
    defaultTracker = new ErrorTracker(config);
  }
  return defaultTracker;
}

export function initErrorTracking(config: ErrorTrackerConfig): ErrorTracker {
  if (defaultTracker) {
    console.warn('[ErrorTracker] Already initialized, returning existing instance');
    return defaultTracker;
  }
  defaultTracker = new ErrorTracker(config);
  return defaultTracker;
}

export function resetErrorTracking(): void {
  if (defaultTracker) {
    defaultTracker.destroy();
    defaultTracker = null;
  }
}

// ============================================================================
// React Error Boundary Helper
// ============================================================================

export interface ErrorBoundaryInfo {
  componentStack: string;
}

export function captureReactError(
  error: Error,
  errorInfo: ErrorBoundaryInfo,
  componentName?: string
): Promise<CapturedError | null> {
  const tracker = getErrorTracker();

  const errorContext: ErrorContext = {
    componentStack: errorInfo.componentStack,
  };
  if (componentName !== undefined) {
    errorContext.componentName = componentName;
  }

  return tracker.captureError(error, errorContext);
}
