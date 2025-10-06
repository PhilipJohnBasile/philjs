/**
 * Error boundaries with intelligent recovery suggestions.
 * Catches errors, suggests fixes, and provides recovery options.
 */

import { signal } from "./signals.js";
import { createElement } from "./jsx-runtime.js";
import type { VNode } from "./jsx-runtime.js";

export type ErrorInfo = {
  /** The error that was caught */
  error: Error;
  /** Component stack trace */
  componentStack?: string;
  /** File and line where error occurred */
  source?: { file: string; line: number; column: number };
  /** Error category */
  category: ErrorCategory;
  /** Suggested fixes */
  suggestions: ErrorSuggestion[];
  /** Similar errors from community */
  similarErrors?: SimilarError[];
};

export type ErrorCategory =
  | "render"
  | "data-fetch"
  | "type"
  | "network"
  | "permission"
  | "unknown";

export type ErrorSuggestion = {
  /** Description of the fix */
  description: string;
  /** Code change to apply */
  codeChange?: {
    before: string;
    after: string;
  };
  /** Confidence level (0-1) */
  confidence: number;
  /** Can be auto-fixed */
  autoFixable: boolean;
};

export type SimilarError = {
  /** Error message */
  message: string;
  /** How it was resolved */
  resolution: string;
  /** Link to discussion/issue */
  link?: string;
  /** Similarity score (0-1) */
  similarity: number;
};

export type ErrorBoundaryProps = {
  /** Fallback UI when error occurs */
  fallback?: (error: ErrorInfo, retry: () => void) => VNode;
  /** Callback when error is caught */
  onError?: (error: ErrorInfo) => void;
  /** Callback when error is recovered */
  onRecover?: () => void;
  /** Children to render */
  children: VNode;
  /** Name for debugging */
  name?: string;
};

/**
 * Error boundary component.
 */
export function ErrorBoundary(props: ErrorBoundaryProps) {
  const error = signal<ErrorInfo | null>(null);
  const retryCount = signal(0);

  const handleError = (err: Error, componentStack?: string) => {
    const errorInfo = analyzeError(err, componentStack);
    error.set(errorInfo);
    props.onError?.(errorInfo);

    // Log to error tracking service
    logError(errorInfo, props.name);
  };

  const retry = () => {
    retryCount.set(retryCount() + 1);
    error.set(null);
    props.onRecover?.();
  };

  const currentError = error();

  if (currentError) {
    if (props.fallback) {
      return props.fallback(currentError, retry);
    }

    return DefaultErrorFallback({
      error: currentError,
      retry: retry,
      boundaryName: props.name,
    });
  }

  try {
    return props.children;
  } catch (err) {
    handleError(err as Error);
    return null;
  }
}

/**
 * Analyze error and generate suggestions.
 */
function analyzeError(error: Error, componentStack?: string): ErrorInfo {
  const category = categorizeError(error);
  const suggestions = generateSuggestions(error, category);
  const source = extractErrorSource(error);

  return {
    error,
    componentStack,
    source,
    category,
    suggestions,
  };
}

/**
 * Categorize error type.
 */
function categorizeError(error: Error): ErrorCategory {
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
function generateSuggestions(error: Error, category: ErrorCategory): ErrorSuggestion[] {
  const suggestions: ErrorSuggestion[] = [];

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
function extractErrorSource(error: Error): { file: string; line: number; column: number } | undefined {
  if (!error.stack) return undefined;

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
 * Default error fallback UI.
 */
function DefaultErrorFallback(props: {
  error: ErrorInfo;
  retry: () => void;
  boundaryName?: string;
}) {
  const { error, retry, boundaryName } = props;

  return createElement(
    "div",
    {
      style: {
        padding: "2rem",
        background: "#fee",
        border: "2px solid #c33",
        borderRadius: "8px",
        fontFamily: "monospace",
      },
    },
    createElement(
      "h2",
      { style: { color: "#c33", marginBottom: "1rem" } },
      `⚠️ Error in ${boundaryName || "Component"}`
    ),
    createElement(
      "div",
      {
        style: {
          background: "white",
          padding: "1rem",
          borderRadius: "4px",
          marginBottom: "1rem",
        },
      },
      createElement("strong", {}, "Error:"),
      " ",
      error.error.message
    ),
    error.source &&
      createElement(
        "div",
        { style: { marginBottom: "1rem", fontSize: "0.9rem" } },
        createElement("strong", {}, "Location:"),
        ` ${error.source.file}:${error.source.line}:${error.source.column}`
      ),
    error.suggestions.length > 0 &&
      createElement(
        "div",
        { style: { marginBottom: "1rem" } },
        createElement(
          "h3",
          { style: { marginBottom: "0.5rem" } },
          "💡 Suggested Fixes:"
        ),
        createElement(
          "ul",
          { style: { margin: 0, paddingLeft: "1.5rem" } },
          ...error.suggestions.map((suggestion, i) =>
            createElement(
              "li",
              { key: i, style: { marginBottom: "0.5rem" } },
              suggestion.description,
              suggestion.autoFixable &&
                createElement(
                  "span",
                  { style: { color: "#28a745", marginLeft: "0.5rem" } },
                  "(Auto-fixable)"
                ),
              createElement("br", {}),
              createElement(
                "small",
                { style: { color: "#666" } },
                `Confidence: ${(suggestion.confidence * 100).toFixed(0)}%`
              )
            )
          )
        )
      ),
    createElement(
      "button",
      {
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
      },
      "🔄 Retry"
    ),
    process.env.NODE_ENV === "development" &&
      error.componentStack &&
      createElement(
        "details",
        { style: { marginTop: "1rem" } },
        createElement("summary", { style: { cursor: "pointer" } }, "Component Stack"),
        createElement(
          "pre",
          {
            style: {
              background: "white",
              padding: "1rem",
              borderRadius: "4px",
              overflow: "auto",
              fontSize: "0.85rem",
            },
          },
          error.componentStack
        )
      )
  );
}

/**
 * Log error to tracking service.
 */
function logError(error: ErrorInfo, boundaryName?: string): void {
  // Integration with error tracking services (Sentry, LogRocket, etc.)
  console.error(`[ErrorBoundary${boundaryName ? ` ${boundaryName}` : ""}]`, {
    message: error.error.message,
    stack: error.error.stack,
    category: error.category,
    source: error.source,
    suggestions: error.suggestions,
  });

  // Send to analytics
  if (typeof window !== "undefined" && (window as any).analytics) {
    (window as any).analytics.track("Error Caught", {
      category: error.category,
      message: error.error.message,
      boundaryName,
    });
  }
}

/**
 * Global error handler.
 */
export function setupGlobalErrorHandler(
  onError: (error: ErrorInfo) => void
): () => void {
  const handleWindowError = (event: ErrorEvent) => {
    const errorInfo = analyzeError(event.error || new Error(event.message));
    onError(errorInfo);
  };

  const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
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
  private recoveryStrategies = new Map<ErrorCategory, RecoveryStrategy[]>();

  constructor() {
    this.setupDefaultStrategies();
  }

  private setupDefaultStrategies() {
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
          } catch (err) {
            if (i === maxRetries - 1) throw err;
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

  addStrategy(category: ErrorCategory, strategy: RecoveryStrategy) {
    const strategies = this.recoveryStrategies.get(category) || [];
    strategies.push(strategy);
    this.recoveryStrategies.set(category, strategies);
  }

  async recover(
    error: Error,
    category: ErrorCategory,
    context: RecoveryContext
  ): Promise<any> {
    const strategies = this.recoveryStrategies.get(category) || [];

    for (const strategy of strategies) {
      if (strategy.shouldApply(error)) {
        try {
          return await strategy.execute(error, context);
        } catch (err) {
          console.error(`Recovery strategy "${strategy.name}" failed:`, err);
        }
      }
    }

    throw error; // No recovery possible
  }
}

type RecoveryStrategy = {
  name: string;
  execute: (error: Error, context: RecoveryContext) => Promise<any>;
  shouldApply: (error: Error) => boolean;
};

type RecoveryContext = {
  retry: () => Promise<any>;
  fallbackValue?: any;
  componentName?: string;
};

/**
 * Global error recovery instance.
 */
export const errorRecovery = new ErrorRecovery();