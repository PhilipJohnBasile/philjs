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
// Debug Logger
// ============================================================================
export class DebugLogger {
    logs = [];
    groups = [];
    currentGroup = null;
    contexts = new Map();
    config;
    idCounter = 0;
    levelOrder = {
        trace: 0,
        debug: 1,
        info: 2,
        warn: 3,
        error: 4,
    };
    constructor(config = {}) {
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
    debug(message, data, context) {
        this.log("debug", message, data, context);
    }
    /**
     * Log an info message
     */
    info(message, data, context) {
        this.log("info", message, data, context);
    }
    /**
     * Log a warning message
     */
    warn(message, data, context) {
        this.log("warn", message, data, context);
    }
    /**
     * Log an error message
     */
    error(message, data, context) {
        this.log("error", message, data, context);
    }
    /**
     * Log a trace message
     */
    trace(message, data, context) {
        this.log("trace", message, data, context);
    }
    /**
     * Start a log group
     */
    group(name, collapsed = false) {
        const group = {
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
            }
            else if (console.group) {
                console.group(name);
            }
        }
    }
    /**
     * End current log group
     */
    groupEnd() {
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
    setContext(key, value) {
        this.contexts.set(key, value);
    }
    /**
     * Clear context
     */
    clearContext(key) {
        this.contexts.delete(key);
    }
    /**
     * Get all log entries
     */
    getLogs(filter) {
        let logs = this.logs.slice();
        if (filter) {
            // Filter by level
            if (filter.levels && filter.levels.length > 0) {
                logs = logs.filter((log) => filter.levels.includes(log.level));
            }
            // Filter by context
            if (filter.contexts && filter.contexts.length > 0) {
                logs = logs.filter((log) => log.context && filter.contexts.includes(log.context));
            }
            // Filter by search term
            if (filter.search) {
                const searchLower = filter.search.toLowerCase();
                logs = logs.filter((log) => log.message.toLowerCase().includes(searchLower) ||
                    (log.context && log.context.toLowerCase().includes(searchLower)));
            }
            // Filter by time range
            if (filter.startTime) {
                logs = logs.filter((log) => log.timestamp >= filter.startTime);
            }
            if (filter.endTime) {
                logs = logs.filter((log) => log.timestamp <= filter.endTime);
            }
        }
        return logs;
    }
    /**
     * Get log groups
     */
    getGroups() {
        return this.groups.slice();
    }
    /**
     * Get logs by level
     */
    getLogsByLevel(level) {
        return this.logs.filter((log) => log.level === level);
    }
    /**
     * Get logs by context
     */
    getLogsByContext(context) {
        return this.logs.filter((log) => log.context === context);
    }
    /**
     * Search logs
     */
    search(query) {
        const queryLower = query.toLowerCase();
        return this.logs.filter((log) => log.message.toLowerCase().includes(queryLower) ||
            (log.context && log.context.toLowerCase().includes(queryLower)) ||
            (log.data && JSON.stringify(log.data).toLowerCase().includes(queryLower)));
    }
    /**
     * Count logs by level
     */
    countByLevel() {
        const counts = {
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
    getContexts() {
        const contexts = new Set();
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
    clear() {
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
    export() {
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
    import(json) {
        try {
            const data = JSON.parse(json);
            this.logs = data.logs || [];
            this.groups = data.groups || [];
            this.contexts = new Map(data.contexts || []);
        }
        catch (error) {
            console.error("Failed to import logs:", error);
        }
    }
    /**
     * Print logs to console with formatting
     */
    printToConsole(filter) {
        const logs = this.getLogs(filter);
        for (const log of logs) {
            this.printLogToConsole(log);
        }
    }
    /**
     * Get log statistics
     */
    getStatistics() {
        const byLevel = this.countByLevel();
        const timeRange = this.logs.length > 0
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
    log(level, message, data, context) {
        // Check minimum level
        if (this.levelOrder[level] < this.levelOrder[this.config.minLevel]) {
            return;
        }
        const contextValue = context || this.getCurrentContext();
        const entry = {
            id: `log-${this.idCounter++}`,
            level,
            message,
            timestamp: Date.now(),
            data,
            metadata: {},
            ...(contextValue !== undefined && { context: contextValue }),
        };
        // Capture stack trace for errors
        if (level === "error" &&
            this.config.captureStackTraces &&
            typeof Error !== "undefined") {
            try {
                throw new Error();
            }
            catch (e) {
                entry.stackTrace = e.stack;
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
    getCurrentContext() {
        if (this.contexts.size === 0)
            return undefined;
        const contextParts = [];
        for (const [key, value] of this.contexts.entries()) {
            contextParts.push(`${key}:${value}`);
        }
        return contextParts.join(",");
    }
    printLogToConsole(entry) {
        if (typeof console === "undefined")
            return;
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
        }
        else {
            consoleMethod(fullMessage);
        }
        // Log stack trace if present
        if (entry.stackTrace && console.debug) {
            console.debug("Stack trace:", entry.stackTrace);
        }
    }
    getConsoleMethod(level) {
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
let globalLogger = null;
export function initDebugLogger(config) {
    if (!globalLogger) {
        globalLogger = new DebugLogger(config);
    }
    return globalLogger;
}
export function getDebugLogger() {
    return globalLogger;
}
/**
 * Create a logger with a specific context
 */
export function createContextLogger(context) {
    const logger = getDebugLogger() || initDebugLogger();
    return {
        debug: (message, data) => logger.debug(message, data, context),
        info: (message, data) => logger.info(message, data, context),
        warn: (message, data) => logger.warn(message, data, context),
        error: (message, data) => logger.error(message, data, context),
        trace: (message, data) => logger.trace(message, data, context),
    };
}
/**
 * Log with automatic timing
 */
export async function logWithTiming(message, fn, context) {
    const logger = getDebugLogger() || initDebugLogger();
    const startTime = Date.now();
    logger.debug(`${message} - starting...`, undefined, context);
    try {
        const result = await Promise.resolve(fn());
        const duration = Date.now() - startTime;
        logger.debug(`${message} - completed in ${duration}ms`, { duration }, context);
        return result;
    }
    catch (error) {
        const duration = Date.now() - startTime;
        logger.error(`${message} - failed after ${duration}ms`, { error, duration }, context);
        throw error;
    }
}
/**
 * Create a scoped logger that automatically groups logs
 */
export function createScopedLogger(name, collapsed = false) {
    const logger = getDebugLogger() || initDebugLogger();
    logger.group(name, collapsed);
    return {
        debug: (message, data) => logger.debug(message, data, name),
        info: (message, data) => logger.info(message, data, name),
        warn: (message, data) => logger.warn(message, data, name),
        error: (message, data) => logger.error(message, data, name),
        trace: (message, data) => logger.trace(message, data, name),
        end: () => logger.groupEnd(),
    };
}
/**
 * Format log entry for display
 */
export function formatLogEntry(entry) {
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
//# sourceMappingURL=debug-logger.js.map