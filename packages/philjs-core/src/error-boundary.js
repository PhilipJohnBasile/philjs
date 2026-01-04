/**
 * Error boundaries with intelligent recovery suggestions.
 * Catches errors, suggests fixes, and provides recovery options.
 */
import { signal } from "./signals.js";
import { createElement } from "./jsx-runtime.js";
/**
 * Circuit breaker to prevent repeated error cascades
 */
class CircuitBreaker {
    failureCount = 0;
    lastFailureTime = 0;
    state = "closed";
    threshold = 5;
    timeout = 60000; // 1 minute
    recordFailure() {
        this.failureCount++;
        this.lastFailureTime = Date.now();
        if (this.failureCount >= this.threshold) {
            this.state = "open";
        }
    }
    recordSuccess() {
        this.failureCount = 0;
        this.state = "closed";
    }
    canAttempt() {
        if (this.state === "closed")
            return true;
        if (this.state === "open") {
            if (Date.now() - this.lastFailureTime > this.timeout) {
                this.state = "half-open";
                return true;
            }
            return false;
        }
        return true; // half-open
    }
    reset() {
        this.failureCount = 0;
        this.state = "closed";
    }
}
// Global error tracking
const errorCache = new Map();
/**
 * Error boundary component.
 */
export function ErrorBoundary(props) {
    const error = signal(null);
    const retryCount = signal(0);
    const isRetrying = signal(false);
    const circuitBreaker = new CircuitBreaker();
    const maxRetries = props.maxRetries ?? 3;
    const retryDelay = props.retryDelay ?? 1000;
    const handleError = (err, componentStack) => {
        // Track error occurrences
        const errorKey = `${err.message}:${err.stack?.split('\n')[0]}`;
        const cached = errorCache.get(errorKey);
        const occurrences = cached ? cached.count + 1 : 1;
        errorCache.set(errorKey, { count: occurrences, lastSeen: Date.now() });
        const errorInfo = analyzeError(err, componentStack, occurrences);
        error.set(errorInfo);
        props.onError?.(errorInfo);
        // Log to error tracking service
        logError(errorInfo, props.name);
        // Record failure in circuit breaker
        circuitBreaker.recordFailure();
        // Auto-recover for certain error types
        if (props.autoRecover && errorInfo.recoverable && retryCount() < maxRetries) {
            scheduleAutoRetry();
        }
    };
    const scheduleAutoRetry = () => {
        const delay = calculateRetryDelay(retryCount(), retryDelay);
        setTimeout(() => {
            if (retryCount() < maxRetries) {
                retry();
            }
        }, delay);
    };
    const retry = async () => {
        if (!circuitBreaker.canAttempt()) {
            console.warn(`[ErrorBoundary${props.name ? ` ${props.name}` : ""}] Circuit breaker is open, skipping retry`);
            return;
        }
        if (retryCount() >= maxRetries) {
            console.warn(`[ErrorBoundary${props.name ? ` ${props.name}` : ""}] Max retries (${maxRetries}) reached`);
            return;
        }
        isRetrying.set(true);
        retryCount.set(retryCount() + 1);
        // Add delay before retry with exponential backoff
        const delay = calculateRetryDelay(retryCount(), retryDelay);
        await new Promise(resolve => setTimeout(resolve, delay));
        error.set(null);
        isRetrying.set(false);
        circuitBreaker.recordSuccess();
        props.onRecover?.();
    };
    const currentError = error();
    if (currentError) {
        if (props.fallback) {
            return props.fallback(currentError, retry);
        }
        const fallbackProps = {
            error: currentError,
            retry: retry,
            pattern: props.fallbackPattern || "default",
            isRetrying: isRetrying(),
            retryCount: retryCount(),
            maxRetries,
        };
        if (props.name !== undefined) {
            fallbackProps.boundaryName = props.name;
        }
        return DefaultErrorFallback(fallbackProps);
    }
    try {
        // Reset on successful render if configured
        if (props.resetOnSuccess && retryCount() > 0) {
            retryCount.set(0);
            circuitBreaker.reset();
        }
        return props.children;
    }
    catch (err) {
        handleError(err);
        return null;
    }
}
/**
 * Calculate retry delay with exponential backoff
 */
function calculateRetryDelay(attempt, baseDelay) {
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 0.3 * exponentialDelay; // Add 0-30% jitter
    return Math.min(exponentialDelay + jitter, 30000); // Cap at 30 seconds
}
/**
 * Analyze error and generate suggestions.
 */
function analyzeError(error, componentStack, occurrences = 1) {
    const category = categorizeError(error);
    const suggestions = generateSuggestions(error, category);
    const source = extractErrorSource(error);
    const recoverable = isRecoverable(error, category);
    const result = {
        error,
        category,
        suggestions,
        timestamp: Date.now(),
        occurrences,
        recoverable,
    };
    if (componentStack !== undefined) {
        result.componentStack = componentStack;
    }
    if (source !== undefined) {
        result.source = source;
    }
    return result;
}
/**
 * Determine if an error is recoverable
 */
function isRecoverable(error, category) {
    // Network errors are usually recoverable
    if (category === "network" || category === "data-fetch") {
        return true;
    }
    // Permission errors might be recoverable after user action
    if (category === "permission") {
        return true;
    }
    // Some type errors can be recovered with fallback values
    if (category === "type" && (error.message.includes("undefined") ||
        error.message.includes("null"))) {
        return true;
    }
    // Render errors are generally not recoverable automatically
    return false;
}
/**
 * Categorize error type.
 */
function categorizeError(error) {
    const message = error.message.toLowerCase();
    if (message.includes("fetch") || message.includes("network")) {
        return "network";
    }
    if (message.includes("permission") || message.includes("denied")) {
        return "permission";
    }
    if (message.includes("type") || message.includes("undefined")) {
        return "type";
    }
    if (message.includes("render") || error.stack?.includes("render")) {
        return "render";
    }
    return "unknown";
}
/**
 * Generate helpful suggestions based on error.
 */
function generateSuggestions(error, category) {
    const suggestions = [];
    // Common patterns and their fixes
    if (error.message.includes("Cannot read property") || error.message.includes("undefined")) {
        const match = error.message.match(/Cannot read propert(?:y|ies) '(\w+)' of (undefined|null)/);
        if (match) {
            const property = match[1];
            suggestions.push({
                description: `Add optional chaining to safely access '${property}'`,
                codeChange: {
                    before: `obj.${property}`,
                    after: `obj?.${property}`,
                },
                confidence: 0.9,
                autoFixable: true,
            });
            suggestions.push({
                description: `Add null check before accessing '${property}'`,
                codeChange: {
                    before: `obj.${property}`,
                    after: `obj && obj.${property}`,
                },
                confidence: 0.8,
                autoFixable: true,
            });
        }
    }
    if (error.message.includes("is not a function")) {
        suggestions.push({
            description: "Check if the function is properly imported and defined",
            confidence: 0.7,
            autoFixable: false,
        });
        suggestions.push({
            description: "Ensure the function is not being called before it's declared",
            confidence: 0.6,
            autoFixable: false,
        });
    }
    if (category === "network") {
        suggestions.push({
            description: "Add error handling for network requests",
            codeChange: {
                before: "const data = await fetch(url).then(r => r.json())",
                after: `try {
  const data = await fetch(url).then(r => r.json())
} catch (err) {
  console.error('Fetch failed:', err)
}`,
            },
            confidence: 0.85,
            autoFixable: true,
        });
        suggestions.push({
            description: "Check network connection and API endpoint",
            confidence: 0.7,
            autoFixable: false,
        });
    }
    if (category === "render") {
        suggestions.push({
            description: "Check if all required props are provided",
            confidence: 0.75,
            autoFixable: false,
        });
        suggestions.push({
            description: "Ensure JSX syntax is valid and properly closed",
            confidence: 0.7,
            autoFixable: false,
        });
    }
    return suggestions.sort((a, b) => b.confidence - a.confidence);
}
/**
 * Extract source location from error stack.
 */
function extractErrorSource(error) {
    if (!error.stack)
        return undefined;
    // Parse stack trace to find source location
    const stackLines = error.stack.split("\n");
    for (const line of stackLines) {
        const match = line.match(/at\s+(?:.*\s+)?\(?(.+):(\d+):(\d+)\)?/);
        if (match) {
            return {
                file: match[1],
                line: parseInt(match[2], 10),
                column: parseInt(match[3], 10),
            };
        }
    }
    return undefined;
}
/**
 * Skeleton fallback UI pattern
 */
function SkeletonFallback() {
    return createElement("div", {
        style: {
            padding: "1rem",
            background: "#f5f5f5",
            borderRadius: "8px",
            animation: "pulse 2s infinite",
        },
    }, createElement("div", {
        style: {
            height: "20px",
            background: "#ddd",
            borderRadius: "4px",
            marginBottom: "0.5rem",
        },
    }), createElement("div", {
        style: {
            height: "20px",
            background: "#ddd",
            borderRadius: "4px",
            width: "80%",
            marginBottom: "0.5rem",
        },
    }), createElement("div", {
        style: {
            height: "20px",
            background: "#ddd",
            borderRadius: "4px",
            width: "60%",
        },
    }));
}
/**
 * Empty state fallback UI pattern
 */
function EmptyStateFallback(props) {
    return createElement("div", {
        style: {
            textAlign: "center",
            padding: "3rem 1rem",
            color: "#666",
        },
    }, createElement("div", { style: { fontSize: "3rem", marginBottom: "1rem" } }, "🔍"), createElement("p", { style: { fontSize: "1.2rem", marginBottom: "1rem" } }, props.message || "Something went wrong"), createElement("button", {
        onClick: props.retry,
        style: {
            padding: "0.75rem 1.5rem",
            background: "#667eea",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "1rem",
        },
    }, "Try Again"));
}
/**
 * Minimal fallback UI pattern
 */
function MinimalFallback(props) {
    return createElement("div", {
        style: {
            padding: "1rem",
            background: "#fff3cd",
            border: "1px solid #ffc107",
            borderRadius: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
        },
    }, createElement("span", {}, "An error occurred"), createElement("button", {
        onClick: props.retry,
        style: {
            padding: "0.5rem 1rem",
            background: "#ffc107",
            color: "#000",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
        },
    }, "Retry"));
}
/**
 * Default error fallback UI.
 */
function DefaultErrorFallback(props) {
    const { error, retry, boundaryName, pattern = "default", isRetrying, retryCount = 0, maxRetries = 3 } = props;
    // Return different patterns based on configuration
    if (pattern === "skeleton") {
        return SkeletonFallback();
    }
    if (pattern === "empty-state") {
        return EmptyStateFallback({ retry, message: error.error.message });
    }
    if (pattern === "minimal") {
        return MinimalFallback({ retry });
    }
    return createElement("div", {
        style: {
            padding: "2rem",
            background: "#fee",
            border: "2px solid #c33",
            borderRadius: "8px",
            fontFamily: "monospace",
        },
    }, createElement("h2", { style: { color: "#c33", marginBottom: "1rem" } }, `⚠️ Error in ${boundaryName || "Component"}`), createElement("div", {
        style: {
            background: "white",
            padding: "1rem",
            borderRadius: "4px",
            marginBottom: "1rem",
        },
    }, createElement("strong", {}, "Error:"), " ", error.error.message), error.source &&
        createElement("div", { style: { marginBottom: "1rem", fontSize: "0.9rem" } }, createElement("strong", {}, "Location:"), ` ${error.source.file}:${error.source.line}:${error.source.column}`), error.suggestions.length > 0 &&
        createElement("div", { style: { marginBottom: "1rem" } }, createElement("h3", { style: { marginBottom: "0.5rem" } }, "💡 Suggested Fixes:"), createElement("ul", { style: { margin: 0, paddingLeft: "1.5rem" } }, ...error.suggestions.map((suggestion, i) => createElement("li", { key: i, style: { marginBottom: "0.5rem" } }, suggestion.description, suggestion.autoFixable &&
            createElement("span", { style: { color: "#28a745", marginLeft: "0.5rem" } }, "(Auto-fixable)"), createElement("br", {}), createElement("small", { style: { color: "#666" } }, `Confidence: ${(suggestion.confidence * 100).toFixed(0)}%`))))), createElement("button", {
        onClick: retry,
        style: {
            padding: "0.5rem 1rem",
            background: "#667eea",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "1rem",
        },
    }, "🔄 Retry"), process.env["NODE_ENV"] === "development" &&
        error.componentStack &&
        createElement("details", { style: { marginTop: "1rem" } }, createElement("summary", { style: { cursor: "pointer" } }, "Component Stack"), createElement("pre", {
            style: {
                background: "white",
                padding: "1rem",
                borderRadius: "4px",
                overflow: "auto",
                fontSize: "0.85rem",
            },
        }, error.componentStack)));
}
/**
 * Log error to tracking service.
 */
function logError(error, boundaryName) {
    // Integration with error tracking services (Sentry, LogRocket, etc.)
    console.error(`[ErrorBoundary${boundaryName ? ` ${boundaryName}` : ""}]`, {
        message: error.error.message,
        stack: error.error.stack,
        category: error.category,
        source: error.source,
        suggestions: error.suggestions,
    });
    // Send to analytics
    if (typeof window !== "undefined" && window.analytics) {
        window.analytics.track("Error Caught", {
            category: error.category,
            message: error.error.message,
            boundaryName,
        });
    }
}
/**
 * Global error handler.
 */
export function setupGlobalErrorHandler(onError) {
    const handleWindowError = (event) => {
        const errorInfo = analyzeError(event.error || new Error(event.message));
        onError(errorInfo);
    };
    const handleUnhandledRejection = (event) => {
        const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
        const errorInfo = analyzeError(error);
        onError(errorInfo);
    };
    window.addEventListener("error", handleWindowError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    return () => {
        window.removeEventListener("error", handleWindowError);
        window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
}
/**
 * Error recovery strategies.
 */
export class ErrorRecovery {
    recoveryStrategies = new Map();
    constructor() {
        this.setupDefaultStrategies();
    }
    setupDefaultStrategies() {
        // Network errors: retry with exponential backoff
        this.addStrategy("network", {
            name: "Exponential Backoff Retry",
            execute: async (error, context) => {
                const maxRetries = 3;
                let delay = 1000;
                for (let i = 0; i < maxRetries; i++) {
                    await new Promise((resolve) => setTimeout(resolve, delay));
                    try {
                        return await context.retry();
                    }
                    catch (err) {
                        if (i === maxRetries - 1)
                            throw err;
                        delay *= 2;
                    }
                }
            },
            shouldApply: (error) => error.message.includes("fetch") || error.message.includes("network"),
        });
        // Type errors: provide fallback values
        this.addStrategy("type", {
            name: "Fallback Value",
            execute: async (error, context) => {
                return context.fallbackValue ?? null;
            },
            shouldApply: (error) => error.message.includes("undefined") || error.message.includes("null"),
        });
    }
    addStrategy(category, strategy) {
        const strategies = this.recoveryStrategies.get(category) || [];
        strategies.push(strategy);
        this.recoveryStrategies.set(category, strategies);
    }
    async recover(error, category, context) {
        const strategies = this.recoveryStrategies.get(category) || [];
        for (const strategy of strategies) {
            if (strategy.shouldApply(error)) {
                try {
                    return await strategy.execute(error, context);
                }
                catch (err) {
                    console.error(`Recovery strategy "${strategy.name}" failed:`, err);
                }
            }
        }
        throw error; // No recovery possible
    }
}
/**
 * Global error recovery instance.
 */
export const errorRecovery = new ErrorRecovery();
//# sourceMappingURL=error-boundary.js.map