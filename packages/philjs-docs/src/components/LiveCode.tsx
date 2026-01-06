/**
 * LiveCode Component
 *
 * Interactive code playground for PhilJS documentation.
 * Allows users to edit and run code examples in real-time.
 *
 * @example
 * ```tsx
 * import { LiveCode } from '@philjs/docs/components/LiveCode';
 *
 * <LiveCode
 *   code={`
 *     const count = signal(0);
 *     return <button onClick={() => count.set(count() + 1)}>
 *       Count: {count()}
 *     </button>
 *   `}
 *   scope={{ signal }}
 * />
 * ```
 */

import { signal, computed, effect, type Signal } from "@philjs/core";

// ============================================================================
// Types
// ============================================================================

export interface LiveCodeProps {
  /** Initial code to display */
  code: string;
  /** Scope variables available in the code */
  scope?: Record<string, unknown>;
  /** Language for syntax highlighting */
  language?: "tsx" | "ts" | "jsx" | "js";
  /** Whether the code is editable */
  editable?: boolean;
  /** Whether to show line numbers */
  lineNumbers?: boolean;
  /** Show/hide preview pane */
  showPreview?: boolean;
  /** Show/hide console output */
  showConsole?: boolean;
  /** Title for the code block */
  title?: string;
  /** Description text */
  description?: string;
  /** Height of the editor */
  height?: string;
  /** Theme */
  theme?: "light" | "dark" | "auto";
  /** Callback when code changes */
  onChange?: (code: string) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
  /** Auto-run on code change */
  autoRun?: boolean;
  /** Debounce delay for auto-run (ms) */
  debounceMs?: number;
}

export interface LiveCodeState {
  code: string;
  output: unknown | null;
  error: Error | null;
  consoleOutput: ConsoleEntry[];
  isRunning: boolean;
  lastRun: number | null;
}

export interface ConsoleEntry {
  type: "log" | "warn" | "error" | "info";
  args: unknown[];
  timestamp: number;
}

// ============================================================================
// State
// ============================================================================

function createLiveCodeState(initialCode: string): {
  state: Signal<LiveCodeState>;
  updateCode: (code: string) => void;
  runCode: () => void;
  clearConsole: () => void;
  reset: () => void;
} {
  const state = signal<LiveCodeState>({
    code: initialCode,
    output: null,
    error: null,
    consoleOutput: [],
    isRunning: false,
    lastRun: null,
  });

  const updateCode = (code: string) => {
    state.set({ ...state(), code, error: null });
  };

  const runCode = () => {
    const current = state();
    state.set({ ...current, isRunning: true, error: null });
  };

  const clearConsole = () => {
    state.set({ ...state(), consoleOutput: [] });
  };

  const reset = () => {
    state.set({
      code: initialCode,
      output: null,
      error: null,
      consoleOutput: [],
      isRunning: false,
      lastRun: null,
    });
  };

  return { state, updateCode, runCode, clearConsole, reset };
}

// ============================================================================
// LiveCode Component
// ============================================================================

export function LiveCode(props: LiveCodeProps) {
  const {
    code: initialCode,
    scope = {},
    language = "tsx",
    editable = true,
    lineNumbers = true,
    showPreview = true,
    showConsole = false,
    title,
    description,
    height = "300px",
    theme = "auto",
    onChange,
    onError,
    autoRun = true,
    debounceMs = 500,
  } = props;

  const { state, updateCode, runCode, clearConsole, reset } =
    createLiveCodeState(initialCode.trim());

  // Debounced run effect
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  const handleCodeChange = (newCode: string) => {
    updateCode(newCode);
    onChange?.(newCode);

    if (autoRun) {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        executeCode(newCode, scope, state, onError);
      }, debounceMs);
    }
  };

  // Initial run
  effect(() => {
    if (autoRun) {
      executeCode(state().code, scope, state, onError);
    }
  });

  const currentState = state();
  const resolvedTheme =
    theme === "auto"
      ? typeof window !== "undefined" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;

  return (
    <div
      class={`live-code live-code--${resolvedTheme}`}
      style={{ "--editor-height": height }}
    >
      {title && <div class="live-code__title">{title}</div>}
      {description && <div class="live-code__description">{description}</div>}

      <div class="live-code__container">
        {/* Editor Panel */}
        <div class="live-code__editor-panel">
          <div class="live-code__toolbar">
            <span class="live-code__language">{language.toUpperCase()}</span>
            <div class="live-code__actions">
              {!autoRun && (
                <button
                  class="live-code__btn live-code__btn--run"
                  onClick={() => executeCode(state().code, scope, state, onError)}
                  disabled={currentState.isRunning}
                >
                  {currentState.isRunning ? "Running..." : "Run"}
                </button>
              )}
              <button class="live-code__btn live-code__btn--reset" onClick={reset}>
                Reset
              </button>
              <button
                class="live-code__btn live-code__btn--copy"
                onClick={() => copyToClipboard(state().code)}
              >
                Copy
              </button>
            </div>
          </div>

          <CodeEditor
            code={currentState.code}
            language={language}
            editable={editable}
            lineNumbers={lineNumbers}
            theme={resolvedTheme}
            onChange={handleCodeChange}
          />
        </div>

        {/* Preview Panel */}
        {showPreview && (
          <div class="live-code__preview-panel">
            <div class="live-code__preview-header">Preview</div>
            <div class="live-code__preview-content">
              {currentState.error ? (
                <div class="live-code__error">
                  <span class="live-code__error-icon">⚠️</span>
                  <span class="live-code__error-message">
                    {currentState.error.message}
                  </span>
                </div>
              ) : (
                <div class="live-code__output">{currentState.output}</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Console Panel */}
      {showConsole && (
        <div class="live-code__console">
          <div class="live-code__console-header">
            <span>Console</span>
            <button
              class="live-code__btn live-code__btn--clear"
              onClick={clearConsole}
            >
              Clear
            </button>
          </div>
          <div class="live-code__console-content">
            {currentState.consoleOutput.map((entry, i) => (
              <div class={`live-code__console-entry live-code__console-entry--${entry.type}`}>
                <span class="live-code__console-type">[{entry.type}]</span>
                <span class="live-code__console-message">
                  {entry.args.map((arg) => formatValue(arg)).join(" ")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// CodeEditor Component
// ============================================================================

interface CodeEditorProps {
  code: string;
  language: string;
  editable: boolean;
  lineNumbers: boolean;
  theme: "light" | "dark";
  onChange: (code: string) => void;
}

function CodeEditor(props: CodeEditorProps) {
  const { code, language, editable, lineNumbers, theme, onChange } = props;

  const lines = code.split("\n");

  return (
    <div class={`code-editor code-editor--${theme}`}>
      {lineNumbers && (
        <div class="code-editor__line-numbers">
          {lines.map((_, i) => (
            <span class="code-editor__line-number">{i + 1}</span>
          ))}
        </div>
      )}
      <textarea
        class="code-editor__textarea"
        value={code}
        onInput={(e) => onChange((e.target as HTMLTextAreaElement).value)}
        disabled={!editable}
        spellcheck={false}
        autocomplete="off"
        autocorrect="off"
        autocapitalize="off"
        data-language={language}
      />
      <pre class="code-editor__highlight" aria-hidden="true">
        <code class={`language-${language}`}>
          {highlightCode(code, language)}
        </code>
      </pre>
    </div>
  );
}

// ============================================================================
// Code Execution
// ============================================================================

async function executeCode(
  code: string,
  scope: Record<string, unknown>,
  state: Signal<LiveCodeState>,
  onError?: (error: Error) => void
): Promise<void> {
  const current = state();
  state.set({ ...current, isRunning: true, error: null });

  const consoleOutput: ConsoleEntry[] = [];

  // Create mock console
  const mockConsole = {
    log: (...args: unknown[]) => {
      consoleOutput.push({ type: "log", args, timestamp: Date.now() });
    },
    warn: (...args: unknown[]) => {
      consoleOutput.push({ type: "warn", args, timestamp: Date.now() });
    },
    error: (...args: unknown[]) => {
      consoleOutput.push({ type: "error", args, timestamp: Date.now() });
    },
    info: (...args: unknown[]) => {
      consoleOutput.push({ type: "info", args, timestamp: Date.now() });
    },
  };

  try {
    // Build scope with PhilJS core exports
    const fullScope = {
      signal,
      computed,
      effect,
      console: mockConsole,
      ...scope,
    };

    // Create function from code
    const scopeKeys = Object.keys(fullScope);
    const scopeValues = Object.values(fullScope);

    // Wrap code to return the result
    const wrappedCode = `
      "use strict";
      return (function() {
        ${code}
      })();
    `;

    const fn = new Function(...scopeKeys, wrappedCode);
    const result = await fn(...scopeValues);

    state.set({
      ...state(),
      output: result,
      error: null,
      consoleOutput: [...state().consoleOutput, ...consoleOutput],
      isRunning: false,
      lastRun: Date.now(),
    });
  } catch (error) {
    const err = error as Error;
    onError?.(err);
    state.set({
      ...state(),
      output: null,
      error: err,
      consoleOutput: [...state().consoleOutput, ...consoleOutput],
      isRunning: false,
      lastRun: Date.now(),
    });
  }
}

// ============================================================================
// Syntax Highlighting (Basic)
// ============================================================================

function highlightCode(code: string, language: string): string {
  // Basic syntax highlighting - in production, use a proper highlighter
  return code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(
      /(const|let|var|function|return|if|else|for|while|import|export|from|async|await|class|extends|new|this|typeof|instanceof)/g,
      '<span class="token keyword">$1</span>'
    )
    .replace(
      /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g,
      '<span class="token string">$1</span>'
    )
    .replace(/(\d+)/g, '<span class="token number">$1</span>')
    .replace(
      /(\/\/[^\n]*)/g,
      '<span class="token comment">$1</span>'
    )
    .replace(
      /(signal|computed|effect)/g,
      '<span class="token function">$1</span>'
    );
}

// ============================================================================
// Utilities
// ============================================================================

function formatValue(value: unknown): string {
  if (value === undefined) return "undefined";
  if (value === null) return "null";
  if (typeof value === "object") {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

async function copyToClipboard(text: string): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    await navigator.clipboard.writeText(text);
  }
}

// ============================================================================
// CSS Styles (can be extracted to separate file)
// ============================================================================

export const liveCodeStyles = `
.live-code {
  --lc-bg: #1e1e1e;
  --lc-fg: #d4d4d4;
  --lc-border: #3c3c3c;
  --lc-accent: #0078d4;
  --lc-error: #f14c4c;
  --lc-success: #89d185;
  --lc-warning: #cca700;

  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--lc-border);
  background: var(--lc-bg);
  color: var(--lc-fg);
}

.live-code--light {
  --lc-bg: #ffffff;
  --lc-fg: #1e1e1e;
  --lc-border: #e1e1e1;
}

.live-code__title {
  font-weight: 600;
  padding: 12px 16px;
  border-bottom: 1px solid var(--lc-border);
}

.live-code__description {
  padding: 8px 16px;
  font-size: 14px;
  color: var(--lc-fg);
  opacity: 0.8;
}

.live-code__container {
  display: flex;
  min-height: var(--editor-height, 300px);
}

.live-code__editor-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--lc-border);
}

.live-code__toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.1);
  border-bottom: 1px solid var(--lc-border);
}

.live-code__language {
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  opacity: 0.7;
}

.live-code__actions {
  display: flex;
  gap: 8px;
}

.live-code__btn {
  padding: 4px 12px;
  border: 1px solid var(--lc-border);
  border-radius: 4px;
  background: transparent;
  color: var(--lc-fg);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.live-code__btn:hover {
  background: var(--lc-accent);
  border-color: var(--lc-accent);
  color: white;
}

.live-code__btn--run {
  background: var(--lc-accent);
  border-color: var(--lc-accent);
  color: white;
}

.live-code__preview-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.live-code__preview-header {
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  opacity: 0.7;
  background: rgba(0, 0, 0, 0.1);
  border-bottom: 1px solid var(--lc-border);
}

.live-code__preview-content {
  flex: 1;
  padding: 16px;
  overflow: auto;
}

.live-code__error {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  color: var(--lc-error);
  font-family: monospace;
  font-size: 13px;
}

.live-code__console {
  border-top: 1px solid var(--lc-border);
}

.live-code__console-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 500;
  background: rgba(0, 0, 0, 0.1);
}

.live-code__console-content {
  max-height: 150px;
  overflow: auto;
  padding: 8px 12px;
  font-family: monospace;
  font-size: 12px;
}

.live-code__console-entry {
  padding: 4px 0;
}

.live-code__console-entry--warn { color: var(--lc-warning); }
.live-code__console-entry--error { color: var(--lc-error); }

.code-editor {
  position: relative;
  flex: 1;
  display: flex;
}

.code-editor__line-numbers {
  padding: 12px 8px;
  text-align: right;
  font-family: 'Fira Code', monospace;
  font-size: 13px;
  line-height: 1.5;
  color: var(--lc-fg);
  opacity: 0.4;
  user-select: none;
}

.code-editor__textarea {
  position: absolute;
  inset: 0;
  padding: 12px;
  padding-left: 48px;
  font-family: 'Fira Code', monospace;
  font-size: 13px;
  line-height: 1.5;
  color: transparent;
  background: transparent;
  border: none;
  resize: none;
  outline: none;
  caret-color: var(--lc-fg);
  white-space: pre;
  overflow: auto;
}

.code-editor__highlight {
  padding: 12px;
  padding-left: 48px;
  font-family: 'Fira Code', monospace;
  font-size: 13px;
  line-height: 1.5;
  margin: 0;
  pointer-events: none;
  white-space: pre;
  overflow: hidden;
}

.token.keyword { color: #569cd6; }
.token.string { color: #ce9178; }
.token.number { color: #b5cea8; }
.token.comment { color: #6a9955; }
.token.function { color: #dcdcaa; }

.live-code--light .token.keyword { color: #0000ff; }
.live-code--light .token.string { color: #a31515; }
.live-code--light .token.number { color: #098658; }
.live-code--light .token.comment { color: #008000; }
.live-code--light .token.function { color: #795e26; }
`;

// ============================================================================
// Exports
// ============================================================================

export default LiveCode;
