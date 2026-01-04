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
    maxLogs?: number;
    captureStackTraces?: boolean;
    enableTimestamps?: boolean;
    enableColors?: boolean;
    minLevel?: LogLevel;
};
export type LogGroup = {
    name: string;
    startTime: number;
    endTime?: number;
    logs: LogEntry[];
    collapsed: boolean;
};
export declare class DebugLogger {
    private logs;
    private groups;
    private currentGroup;
    private contexts;
    private config;
    private idCounter;
    private levelOrder;
    constructor(config?: LoggerConfig);
    /**
     * Log a debug message
     */
    debug(message: string, data?: any, context?: string): void;
    /**
     * Log an info message
     */
    info(message: string, data?: any, context?: string): void;
    /**
     * Log a warning message
     */
    warn(message: string, data?: any, context?: string): void;
    /**
     * Log an error message
     */
    error(message: string, data?: any, context?: string): void;
    /**
     * Log a trace message
     */
    trace(message: string, data?: any, context?: string): void;
    /**
     * Start a log group
     */
    group(name: string, collapsed?: boolean): void;
    /**
     * End current log group
     */
    groupEnd(): void;
    /**
     * Set context for subsequent logs
     */
    setContext(key: string, value: string): void;
    /**
     * Clear context
     */
    clearContext(key: string): void;
    /**
     * Get all log entries
     */
    getLogs(filter?: LogFilter): LogEntry[];
    /**
     * Get log groups
     */
    getGroups(): LogGroup[];
    /**
     * Get logs by level
     */
    getLogsByLevel(level: LogLevel): LogEntry[];
    /**
     * Get logs by context
     */
    getLogsByContext(context: string): LogEntry[];
    /**
     * Search logs
     */
    search(query: string): LogEntry[];
    /**
     * Count logs by level
     */
    countByLevel(): Record<LogLevel, number>;
    /**
     * Get unique contexts
     */
    getContexts(): string[];
    /**
     * Clear all logs
     */
    clear(): void;
    /**
     * Export logs as JSON
     */
    export(): string;
    /**
     * Import logs from JSON
     */
    import(json: string): void;
    /**
     * Print logs to console with formatting
     */
    printToConsole(filter?: LogFilter): void;
    /**
     * Get log statistics
     */
    getStatistics(): {
        total: number;
        byLevel: Record<LogLevel, number>;
        contexts: number;
        groups: number;
        timeRange: {
            start: number;
            end: number;
        } | null;
    };
    private log;
    private getCurrentContext;
    private printLogToConsole;
    private getConsoleMethod;
}
export declare function initDebugLogger(config?: LoggerConfig): DebugLogger;
export declare function getDebugLogger(): DebugLogger | null;
/**
 * Create a logger with a specific context
 */
export declare function createContextLogger(context: string): {
    debug: (message: string, data?: any) => void;
    info: (message: string, data?: any) => void;
    warn: (message: string, data?: any) => void;
    error: (message: string, data?: any) => void;
    trace: (message: string, data?: any) => void;
};
/**
 * Log with automatic timing
 */
export declare function logWithTiming<T>(message: string, fn: () => T | Promise<T>, context?: string): Promise<T>;
/**
 * Create a scoped logger that automatically groups logs
 */
export declare function createScopedLogger(name: string, collapsed?: boolean): {
    debug: (message: string, data?: any) => void;
    info: (message: string, data?: any) => void;
    warn: (message: string, data?: any) => void;
    error: (message: string, data?: any) => void;
    trace: (message: string, data?: any) => void;
    end: () => void;
};
/**
 * Format log entry for display
 */
export declare function formatLogEntry(entry: LogEntry): string;
//# sourceMappingURL=debug-logger.d.ts.map