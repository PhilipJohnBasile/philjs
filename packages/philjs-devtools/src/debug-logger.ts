/**
 * Debug Logging Utilities
 *
 * Provides comprehensive logging and debugging capabilities:
 * - Structured logging with levels
 * - Log filtering and searching
 * - Log grouping and context
 * - Performance annotations
 * - Export and replay functionality
 */

// ============================================================================
// Types
// ============================================================================

export type LogLevel = "debug" | "info" | "warn" | "error" | "trace";

export type LogEntry = {
  id: string;
  level: LogLevel;
  message: string;
  timestamp: number;
  context?: string;
  data?: any;
  stackTrace?: string | undefined;
  duration?: number;
  metadata?: Record<string, any>;
};

export type LogFilter = {
  levels?: LogLevel[];
  contexts?: string[];
  search?: string;
  startTime?: number;
  endTime?: number;
};

export type LoggerConfig = {
  maxLogs?: number; // Max logs to keep in memory (default 1000)
  captureStackTraces?: boolean; // Capture stack traces for errors (default true)
  enableTimestamps?: boolean; // Include timestamps (default true)
  enableColors?: boolean; // Use colored output (default true)
  minLevel?: LogLevel; // Minimum level to log (default 'debug')
};

export type LogGroup = {
  name: string;
  startTime: number;
  endTime?: number;
  logs: LogEntry[];
  collapsed: boolean;
};

// ============================================================================
// Debug Logger
// ============================================================================

export class DebugLogger {
  private logs: LogEntry[] = [];
  private groups: LogGroup[] = [];
  private currentGroup: LogGroup | null = null;
  private contexts = new Map<string, string>();
  private config: Required<LoggerConfig>;
  private idCounter = 0;
  private levelOrder: Record<LogLevel, number> = {
    trace: 0,
    debug: 1,
    info: 2,
    warn: 3,
    error: 4,
  };

  constructor(config: LoggerConfig = {}) {
    this.config = {
      maxLogs: config.maxLogs ?? 1000,
      captureStackTraces: config.captureStackTraces ?? true,
      enableTimestamps: config.enableTimestamps ?? true,
      enableColors: config.enableColors ?? true,
      minLevel: config.minLevel ?? "debug",
    };
  }

  /**
   * Log a debug message
   */
  public debug(message: string, data?: any, context?: string): void {
    this.log("debug", message, data, context);
  }

  /**
   * Log an info message
   */
  public info(message: string, data?: any, context?: string): void {
    this.log("info", message, data, context);
  }

  /**
   * Log a warning message
   */
  public warn(message: string, data?: any, context?: string): void {
    this.log("warn", message, data, context);
  }

  /**
   * Log an error message
   */
  public error(message: string, data?: any, context?: string): void {
    this.log("error", message, data, context);
  }

  /**
   * Log a trace message
   */
  public trace(message: string, data?: any, context?: string): void {
    this.log("trace", message, data, context);
  }

  /**
   * Start a log group
   */
  public group(name: string, collapsed = false): void {
    const group: LogGroup = {
      name,
      startTime: Date.now(),
      logs: [],
      collapsed,
    };

    this.groups.push(group);
    this.currentGroup = group;

    // Also use native console.group
    if (typeof console !== "undefined") {
      if (collapsed && console.groupCollapsed) {
        console.groupCollapsed(name);
      } else if (console.group) {
        console.group(name);
      }
    }
  }

  /**
   * End current log group
   */
  public groupEnd(): void {
    if (this.currentGroup) {
      this.currentGroup.endTime = Date.now();
      this.currentGroup = null;

      // Also use native console.groupEnd
      if (typeof console !== "undefined" && console.groupEnd) {
        console.groupEnd();
      }
    }
  }

  /**
   * Set context for subsequent logs
   */
  public setContext(key: string, value: string): void {
    this.contexts.set(key, value);
  }

  /**
   * Clear context
   */
  public clearContext(key: string): void {
    this.contexts.delete(key);
  }

  /**
   * Get all log entries
   */
  public getLogs(filter?: LogFilter): LogEntry[] {
    let logs = this.logs.slice();

    if (filter) {
      // Filter by level
      if (filter.levels && filter.levels.length > 0) {
        logs = logs.filter((log) => filter.levels!.includes(log.level));
      }

      // Filter by context
      if (filter.contexts && filter.contexts.length > 0) {
        logs = logs.filter(
          (log) => log.context && filter.contexts!.includes(log.context)
        );
      }

      // Filter by search term
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        logs = logs.filter(
          (log) =>
            log.message.toLowerCase().includes(searchLower) ||
            (log.context && log.context.toLowerCase().includes(searchLower))
        );
      }

      // Filter by time range
      if (filter.startTime) {
        logs = logs.filter((log) => log.timestamp >= filter.startTime!);
      }

      if (filter.endTime) {
        logs = logs.filter((log) => log.timestamp <= filter.endTime!);
      }
    }

    return logs;
  }

  /**
   * Get log groups
   */
  public getGroups(): LogGroup[] {
    return this.groups.slice();
  }

  /**
   * Get logs by level
   */
  public getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter((log) => log.level === level);
  }

  /**
   * Get logs by context
   */
  public getLogsByContext(context: string): LogEntry[] {
    return this.logs.filter((log) => log.context === context);
  }

  /**
   * Search logs
   */
  public search(query: string): LogEntry[] {
    const queryLower = query.toLowerCase();
    return this.logs.filter(
      (log) =>
        log.message.toLowerCase().includes(queryLower) ||
        (log.context && log.context.toLowerCase().includes(queryLower)) ||
        (log.data && JSON.stringify(log.data).toLowerCase().includes(queryLower))
    );
  }

  /**
   * Count logs by level
   */
  public countByLevel(): Record<LogLevel, number> {
    const counts: Record<LogLevel, number> = {
      trace: 0,
      debug: 0,
      info: 0,
      warn: 0,
      error: 0,
    };

    for (const log of this.logs) {
      counts[log.level]++;
    }

    return counts;
  }

  /**
   * Get unique contexts
   */
  public getContexts(): string[] {
    const contexts = new Set<string>();
    for (const log of this.logs) {
      if (log.context) {
        contexts.add(log.context);
      }
    }
    return Array.from(contexts);
  }

  /**
   * Clear all logs
   */
  public clear(): void {
    this.logs = [];
    this.groups = [];
    this.currentGroup = null;
    this.idCounter = 0;

    // Also clear native console
    if (typeof console !== "undefined" && console.clear) {
      console.clear();
    }
  }

  /**
   * Export logs as JSON
   */
  public export(): string {
    return JSON.stringify({
      logs: this.logs,
      groups: this.groups,
      contexts: Array.from(this.contexts.entries()),
      config: this.config,
      exportedAt: new Date().toISOString(),
    });
  }

  /**
   * Import logs from JSON
   */
  public import(json: string): void {
    try {
      const data = JSON.parse(json);
      this.logs = data.logs || [];
      this.groups = data.groups || [];
      this.contexts = new Map(data.contexts || []);
    } catch (error) {
      console.error("Failed to import logs:", error);
    }
  }

  /**
   * Print logs to console with formatting
   */
  public printToConsole(filter?: LogFilter): void {
    const logs = this.getLogs(filter);

    for (const log of logs) {
      this.printLogToConsole(log);
    }
  }

  /**
   * Get log statistics
   */
  public getStatistics(): {
    total: number;
    byLevel: Record<LogLevel, number>;
    contexts: number;
    groups: number;
    timeRange: { start: number; end: number } | null;
  } {
    const byLevel = this.countByLevel();

    const timeRange =
      this.logs.length > 0
        ? {
            start: this.logs[0]?.timestamp ?? 0,
            end: this.logs[this.logs.length - 1]?.timestamp ?? 0,
          }
        : null;

    return {
      total: this.logs.length,
      byLevel,
      contexts: this.getContexts().length,
      groups: this.groups.length,
      timeRange,
    };
  }

  // Private methods

  private log(
    level: LogLevel,
    message: string,
    data?: any,
    context?: string
  ): void {
    // Check minimum level
    if (this.levelOrder[level] < this.levelOrder[this.config.minLevel]) {
      return;
    }

    const contextValue = context || this.getCurrentContext();
    const entry: LogEntry = {
      id: `log-${this.idCounter++}`,
      level,
      message,
      timestamp: Date.now(),
      data,
      metadata: {},
      ...(contextValue !== undefined && { context: contextValue }),
    };

    // Capture stack trace for errors
    if (
      level === "error" &&
      this.config.captureStackTraces &&
      typeof Error !== "undefined"
    ) {
      try {
        throw new Error();
      } catch (e) {
        entry.stackTrace = (e as Error).stack;
      }
    }

    this.logs.push(entry);

    // Add to current group
    if (this.currentGroup) {
      this.currentGroup.logs.push(entry);
    }

    // Maintain max size
    if (this.logs.length > this.config.maxLogs) {
      this.logs.shift();
    }

    // Print to console
    this.printLogToConsole(entry);
  }

  private getCurrentContext(): string | undefined {
    if (this.contexts.size === 0) return undefined;

    const contextParts: string[] = [];
    for (const [key, value] of this.contexts.entries()) {
      contextParts.push(`${key}:${value}`);
    }

    return contextParts.join(",");
  }

  private printLogToConsole(entry: LogEntry): void {
    if (typeof console === "undefined") return;

    const timestamp = this.config.enableTimestamps
      ? `[${new Date(entry.timestamp).toISOString()}]`
      : "";

    const context = entry.context ? `[${entry.context}]` : "";

    const prefix = `${timestamp}${context}`.trim();
    const fullMessage = prefix ? `${prefix} ${entry.message}` : entry.message;

    // Get console method
    const consoleMethod = this.getConsoleMethod(entry.level);

    // Log with data if present
    if (entry.data !== undefined) {
      consoleMethod(fullMessage, entry.data);
    } else {
      consoleMethod(fullMessage);
    }

    // Log stack trace if present
    if (entry.stackTrace && console.debug) {
      console.debug("Stack trace:", entry.stackTrace);
    }
  }

  private getConsoleMethod(level: LogLevel): (...args: any[]) => void {
    switch (level) {
      case "error":
        return console.error.bind(console);
      case "warn":
        return console.warn.bind(console);
      case "info":
        return console.info.bind(console);
      case "debug":
        return console.debug?.bind(console) || console.log.bind(console);
      case "trace":
        return console.trace?.bind(console) || console.log.bind(console);
      default:
        return console.log.bind(console);
    }
  }
}

// ============================================================================
// Global Instance & Utilities
// ============================================================================

let globalLogger: DebugLogger | null = null;

export function initDebugLogger(config?: LoggerConfig): DebugLogger {
  if (!globalLogger) {
    globalLogger = new DebugLogger(config);
  }
  return globalLogger;
}

export function getDebugLogger(): DebugLogger | null {
  return globalLogger;
}

/**
 * Create a logger with a specific context
 */
export function createContextLogger(context: string): {
  debug: (message: string, data?: any) => void;
  info: (message: string, data?: any) => void;
  warn: (message: string, data?: any) => void;
  error: (message: string, data?: any) => void;
  trace: (message: string, data?: any) => void;
} {
  const logger = getDebugLogger() || initDebugLogger();

  return {
    debug: (message: string, data?: any) => logger.debug(message, data, context),
    info: (message: string, data?: any) => logger.info(message, data, context),
    warn: (message: string, data?: any) => logger.warn(message, data, context),
    error: (message: string, data?: any) => logger.error(message, data, context),
    trace: (message: string, data?: any) => logger.trace(message, data, context),
  };
}

/**
 * Log with automatic timing
 */
export async function logWithTiming<T>(
  message: string,
  fn: () => T | Promise<T>,
  context?: string
): Promise<T> {
  const logger = getDebugLogger() || initDebugLogger();
  const startTime = Date.now();

  logger.debug(`${message} - starting...`, undefined, context);

  try {
    const result = await Promise.resolve(fn());
    const duration = Date.now() - startTime;
    logger.debug(`${message} - completed in ${duration}ms`, { duration }, context);
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(
      `${message} - failed after ${duration}ms`,
      { error, duration },
      context
    );
    throw error;
  }
}

/**
 * Create a scoped logger that automatically groups logs
 */
export function createScopedLogger(
  name: string,
  collapsed = false
): {
  debug: (message: string, data?: any) => void;
  info: (message: string, data?: any) => void;
  warn: (message: string, data?: any) => void;
  error: (message: string, data?: any) => void;
  trace: (message: string, data?: any) => void;
  end: () => void;
} {
  const logger = getDebugLogger() || initDebugLogger();
  logger.group(name, collapsed);

  return {
    debug: (message: string, data?: any) => logger.debug(message, data, name),
    info: (message: string, data?: any) => logger.info(message, data, name),
    warn: (message: string, data?: any) => logger.warn(message, data, name),
    error: (message: string, data?: any) => logger.error(message, data, name),
    trace: (message: string, data?: any) => logger.trace(message, data, name),
    end: () => logger.groupEnd(),
  };
}

/**
 * Format log entry for display
 */
export function formatLogEntry(entry: LogEntry): string {
  const timestamp = new Date(entry.timestamp).toISOString();
  const level = entry.level.toUpperCase().padEnd(5);
  const context = entry.context ? `[${entry.context}]` : "";
  const message = entry.message;

  let output = `${timestamp} ${level} ${context} ${message}`.trim();

  if (entry.data !== undefined) {
    output += `\n  Data: ${JSON.stringify(entry.data, null, 2)}`;
  }

  if (entry.duration !== undefined) {
    output += `\n  Duration: ${entry.duration}ms`;
  }

  return output;
}
