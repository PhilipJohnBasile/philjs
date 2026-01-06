/**
 * @philjs/docs - Live Code Documentation Component
 *
 * Embeddable playground component for interactive code examples in documentation.
 * Supports code editing, live preview, copy-to-clipboard, and fork to playground.
 *
 * @example
 * ```tsx
 * import { LiveCode, LiveCodeProvider } from '@philjs/docs/components/LiveCode';
 *
 * function DocsPage() {
 *   return (
 *     <LiveCodeProvider>
 *       <LiveCode
 *         code={`const greeting = signal('Hello');`}
 *         language="tsx"
 *         preview
 *       />
 *     </LiveCodeProvider>
 *   );
 * }
 * ```
 */

import { signal, computed, effect, type Signal } from "@philjs/core";

// ============================================================================
// Types
// ============================================================================

export interface LiveCodeConfig {
  /** Theme for code editor */
  theme?: "light" | "dark" | "system";
  /** Default language */
  defaultLanguage?: string;
  /** Enable preview by default */
  previewByDefault?: boolean;
  /** Playground URL for forking */
  playgroundUrl?: string;
  /** Whether to show line numbers */
  lineNumbers?: boolean;
  /** Tab size */
  tabSize?: number;
  /** Enable syntax highlighting */
  syntaxHighlight?: boolean;
  /** Custom scope for code execution */
  scope?: Record<string, unknown>;
  /** Imports to include in preview */
  imports?: Record<string, string>;
}

export interface LiveCodeProps {
  /** The code to display and edit */
  code: string;
  /** Programming language for syntax highlighting */
  language?: string;
  /** Whether to show live preview */
  preview?: boolean;
  /** Title for the code block */
  title?: string;
  /** Description */
  description?: string;
  /** Whether code is editable */
  editable?: boolean;
  /** Show line numbers */
  lineNumbers?: boolean;
  /** Show copy button */
  showCopy?: boolean;
  /** Show reset button */
  showReset?: boolean;
  /** Show fork button */
  showFork?: boolean;
  /** Height of the editor */
  height?: string;
  /** Custom class name */
  class?: string;
  /** Custom styles */
  style?: string;
  /** Callback when code changes */
  onChange?: (code: string) => void;
  /** Custom scope for preview */
  scope?: Record<string, unknown>;
  /** Files for multi-file examples */
  files?: Record<string, string>;
  /** Active file in multi-file mode */
  activeFile?: string;
  /** Render function for custom preview */
  renderPreview?: (code: string) => any;
}

export interface CodeFile {
  name: string;
  content: string;
  language: string;
}

export interface PreviewResult {
  output: any;
  error: Error | null;
  logs: string[];
}

// ============================================================================
// State
// ============================================================================

const defaultConfig: Required<LiveCodeConfig> = {
  theme: "system",
  defaultLanguage: "tsx",
  previewByDefault: true,
  playgroundUrl: "/playground",
  lineNumbers: true,
  tabSize: 2,
  syntaxHighlight: true,
  scope: {},
  imports: {
    "@philjs/core": "signal, computed, effect, memo, batch",
  },
};

const configSignal: Signal<Required<LiveCodeConfig>> = signal({ ...defaultConfig });

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Initialize Live Code configuration
 */
export function initLiveCode(config?: Partial<LiveCodeConfig>): void {
  configSignal.set({ ...defaultConfig, ...config });
}

/**
 * Get current Live Code configuration
 */
export function getLiveCodeConfig(): Required<LiveCodeConfig> {
  return configSignal();
}

/**
 * Execute code and return result
 */
export async function executeCode(
  code: string,
  scope?: Record<string, unknown>
): Promise<PreviewResult> {
  const logs: string[] = [];
  const config = configSignal();
  const mergedScope = { ...config.scope, ...scope };

  // Capture console output
  const originalConsole = { ...console };
  const mockConsole = {
    log: (...args: unknown[]) => logs.push(args.map(String).join(" ")),
    warn: (...args: unknown[]) => logs.push(`[warn] ${args.map(String).join(" ")}`),
    error: (...args: unknown[]) => logs.push(`[error] ${args.map(String).join(" ")}`),
    info: (...args: unknown[]) => logs.push(`[info] ${args.map(String).join(" ")}`),
  };

  try {
    // Create a function with the scope
    const scopeKeys = Object.keys(mergedScope);
    const scopeValues = Object.values(mergedScope);

    // Wrap in async IIFE if needed
    const wrappedCode = code.includes("await")
      ? `return (async () => { ${code} })()`
      : code;

    const fn = new Function("console", ...scopeKeys, wrappedCode);

    Object.assign(console, mockConsole);
    const output = await fn(mockConsole, ...scopeValues);
    Object.assign(console, originalConsole);

    return { output, error: null, logs };
  } catch (error) {
    Object.assign(console, originalConsole);
    return { output: null, error: error as Error, logs };
  }
}

/**
 * Transform code for preview (add imports, etc.)
 */
export function transformCode(code: string, language: string): string {
  const config = configSignal();

  // Add automatic imports for TSX/JSX
  if (language === "tsx" || language === "jsx") {
    const importLines: string[] = [];
    for (const [pkg, exports] of Object.entries(config.imports)) {
      importLines.push(`import { ${exports} } from '${pkg}';`);
    }
    return `${importLines.join("\n")}\n\n${code}`;
  }

  return code;
}

/**
 * Generate syntax-highlighted HTML
 */
export function highlightCode(code: string, language: string): string {
  // Simple syntax highlighting - in production you'd use Prism/Shiki
  const patterns: Array<{ regex: RegExp; class: string }> = [
    { regex: /\/\/.*$/gm, class: "comment" },
    { regex: /\/\*[\s\S]*?\*\//g, class: "comment" },
    { regex: /'[^']*'|"[^"]*"|`[^`]*`/g, class: "string" },
    { regex: /\b(const|let|var|function|return|if|else|for|while|class|import|export|from|async|await|try|catch|throw|new|this|typeof|instanceof)\b/g, class: "keyword" },
    { regex: /\b(true|false|null|undefined|NaN|Infinity)\b/g, class: "literal" },
    { regex: /\b\d+\.?\d*\b/g, class: "number" },
    { regex: /\b(signal|computed|effect|memo|batch)\b/g, class: "builtin" },
    { regex: /\b([A-Z][a-zA-Z0-9]*)\b/g, class: "type" },
    { regex: /\b([a-z_$][a-zA-Z0-9_$]*)\s*(?=\()/g, class: "function" },
  ];

  let highlighted = escapeHtml(code);

  for (const pattern of patterns) {
    highlighted = highlighted.replace(pattern.regex, (match) => {
      return `<span class="live-code__${pattern.class}">${match}</span>`;
    });
  }

  return highlighted;
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.clipboard) {
    return false;
  }
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate playground URL for forking
 */
export function generatePlaygroundUrl(code: string, language: string): string {
  const config = configSignal();
  const encoded = encodeURIComponent(code);
  return `${config.playgroundUrl}?code=${encoded}&lang=${language}`;
}

// ============================================================================
// Components
// ============================================================================

/**
 * Live Code Provider component
 */
export function LiveCodeProvider(props: {
  config?: Partial<LiveCodeConfig>;
  children: any;
}) {
  if (props.config) {
    initLiveCode(props.config);
  }

  return props.children;
}

/**
 * Main Live Code component
 */
export function LiveCode(props: LiveCodeProps) {
  const config = configSignal();
  const initialCode = props.code.trim();

  // State signals
  const currentCode: Signal<string> = signal(initialCode);
  const isEditing: Signal<boolean> = signal(false);
  const showPreview: Signal<boolean> = signal(props.preview ?? config.previewByDefault);
  const copied: Signal<boolean> = signal(false);
  const previewResult: Signal<PreviewResult | null> = signal(null);
  const activeFile: Signal<string> = signal(props.activeFile || "main.tsx");

  // Derived state
  const hasChanges = computed(() => currentCode() !== initialCode);
  const language = props.language || config.defaultLanguage;

  // Run preview when code changes
  if (props.preview !== false) {
    effect(() => {
      const code = currentCode();
      if (showPreview()) {
        executeCode(code, props.scope).then((result) => {
          previewResult.set(result);
        });
      }
    });
  }

  // Handle code change
  function handleCodeChange(newCode: string) {
    currentCode.set(newCode);
    props.onChange?.(newCode);
  }

  // Reset to original
  function handleReset() {
    currentCode.set(initialCode);
    props.onChange?.(initialCode);
  }

  // Copy to clipboard
  async function handleCopy() {
    const success = await copyToClipboard(currentCode());
    if (success) {
      copied.set(true);
      setTimeout(() => copied.set(false), 2000);
    }
  }

  // Fork to playground
  function handleFork() {
    const url = generatePlaygroundUrl(currentCode(), language);
    if (typeof window !== "undefined") {
      window.open(url, "_blank");
    }
  }

  // Toggle preview
  function togglePreview() {
    showPreview.set(!showPreview());
  }

  return {
    type: "div",
    props: {
      class: `live-code ${props.class || ""} live-code--${config.theme}`,
      style: props.style,
      children: [
        // Header
        LiveCodeHeader({
          title: props.title,
          language,
          showCopy: props.showCopy !== false,
          showReset: props.showReset !== false && hasChanges(),
          showFork: props.showFork !== false,
          showPreviewToggle: props.preview !== false,
          showingPreview: showPreview(),
          copied: copied(),
          onCopy: handleCopy,
          onReset: handleReset,
          onFork: handleFork,
          onTogglePreview: togglePreview,
        }),

        // Multi-file tabs
        props.files && LiveCodeTabs({
          files: Object.keys(props.files),
          activeFile: activeFile(),
          onSelect: (file: string) => activeFile.set(file),
        }),

        // Main content area
        {
          type: "div",
          props: {
            class: "live-code__content",
            children: [
              // Editor
              LiveCodeEditor({
                code: currentCode(),
                language,
                lineNumbers: props.lineNumbers ?? config.lineNumbers,
                editable: props.editable !== false,
                height: props.height,
                onChange: handleCodeChange,
              }),

              // Preview
              showPreview() && LiveCodePreview({
                result: previewResult(),
                renderPreview: props.renderPreview,
                code: currentCode(),
              }),
            ],
          },
        },

        // Description
        props.description && {
          type: "div",
          props: {
            class: "live-code__description",
            children: props.description,
          },
        },
      ].filter(Boolean),
    },
  };
}

/**
 * Header with title and actions
 */
function LiveCodeHeader(props: {
  title?: string;
  language: string;
  showCopy: boolean;
  showReset: boolean;
  showFork: boolean;
  showPreviewToggle: boolean;
  showingPreview: boolean;
  copied: boolean;
  onCopy: () => void;
  onReset: () => void;
  onFork: () => void;
  onTogglePreview: () => void;
}) {
  return {
    type: "div",
    props: {
      class: "live-code__header",
      children: [
        {
          type: "div",
          props: {
            class: "live-code__title-area",
            children: [
              props.title && {
                type: "span",
                props: {
                  class: "live-code__title",
                  children: props.title,
                },
              },
              {
                type: "span",
                props: {
                  class: "live-code__language",
                  children: props.language,
                },
              },
            ].filter(Boolean),
          },
        },
        {
          type: "div",
          props: {
            class: "live-code__actions",
            children: [
              props.showPreviewToggle && {
                type: "button",
                props: {
                  class: `live-code__action ${props.showingPreview ? "live-code__action--active" : ""}`,
                  onClick: props.onTogglePreview,
                  title: props.showingPreview ? "Hide Preview" : "Show Preview",
                  children: props.showingPreview ? "Hide Preview" : "Show Preview",
                },
              },
              props.showReset && {
                type: "button",
                props: {
                  class: "live-code__action",
                  onClick: props.onReset,
                  title: "Reset to original",
                  children: "Reset",
                },
              },
              props.showCopy && {
                type: "button",
                props: {
                  class: "live-code__action",
                  onClick: props.onCopy,
                  title: "Copy to clipboard",
                  children: props.copied ? "Copied!" : "Copy",
                },
              },
              props.showFork && {
                type: "button",
                props: {
                  class: "live-code__action live-code__action--primary",
                  onClick: props.onFork,
                  title: "Open in Playground",
                  children: "Fork",
                },
              },
            ].filter(Boolean),
          },
        },
      ],
    },
  };
}

/**
 * Multi-file tabs
 */
function LiveCodeTabs(props: {
  files: string[];
  activeFile: string;
  onSelect: (file: string) => void;
}) {
  return {
    type: "div",
    props: {
      class: "live-code__tabs",
      children: props.files.map((file) => ({
        type: "button",
        props: {
          class: `live-code__tab ${file === props.activeFile ? "live-code__tab--active" : ""}`,
          onClick: () => props.onSelect(file),
          children: file,
        },
      })),
    },
  };
}

/**
 * Code editor component
 */
function LiveCodeEditor(props: {
  code: string;
  language: string;
  lineNumbers: boolean;
  editable: boolean;
  height?: string;
  onChange: (code: string) => void;
}) {
  const config = configSignal();
  const highlighted = highlightCode(props.code, props.language);
  const lines = props.code.split("\n");

  return {
    type: "div",
    props: {
      class: "live-code__editor",
      style: props.height ? `height: ${props.height}` : undefined,
      children: [
        // Line numbers
        props.lineNumbers && {
          type: "div",
          props: {
            class: "live-code__line-numbers",
            children: lines.map((_, i) => ({
              type: "span",
              props: {
                class: "live-code__line-number",
                children: String(i + 1),
              },
            })),
          },
        },

        // Code area
        props.editable
          ? {
              type: "textarea",
              props: {
                class: "live-code__textarea",
                value: props.code,
                spellcheck: "false",
                onInput: (e: Event) => {
                  const target = e.target as HTMLTextAreaElement;
                  props.onChange(target.value);
                },
                onKeyDown: (e: KeyboardEvent) => {
                  // Handle tab key
                  if (e.key === "Tab") {
                    e.preventDefault();
                    const target = e.target as HTMLTextAreaElement;
                    const start = target.selectionStart;
                    const end = target.selectionEnd;
                    const spaces = " ".repeat(config.tabSize);
                    const newValue =
                      target.value.substring(0, start) +
                      spaces +
                      target.value.substring(end);
                    props.onChange(newValue);
                    // Restore cursor position
                    requestAnimationFrame(() => {
                      target.selectionStart = target.selectionEnd = start + config.tabSize;
                    });
                  }
                },
              },
            }
          : {
              type: "pre",
              props: {
                class: "live-code__pre",
                children: {
                  type: "code",
                  props: {
                    class: `live-code__code language-${props.language}`,
                    innerHTML: highlighted,
                  },
                },
              },
            },
      ].filter(Boolean),
    },
  };
}

/**
 * Preview component
 */
function LiveCodePreview(props: {
  result: PreviewResult | null;
  renderPreview?: (code: string) => any;
  code: string;
}) {
  // Custom render function
  if (props.renderPreview) {
    try {
      return {
        type: "div",
        props: {
          class: "live-code__preview",
          children: props.renderPreview(props.code),
        },
      };
    } catch (error) {
      return {
        type: "div",
        props: {
          class: "live-code__preview live-code__preview--error",
          children: `Render error: ${(error as Error).message}`,
        },
      };
    }
  }

  // Default preview
  if (!props.result) {
    return {
      type: "div",
      props: {
        class: "live-code__preview live-code__preview--loading",
        children: "Running...",
      },
    };
  }

  const { output, error, logs } = props.result;

  return {
    type: "div",
    props: {
      class: `live-code__preview ${error ? "live-code__preview--error" : ""}`,
      children: [
        // Console output
        logs.length > 0 && {
          type: "div",
          props: {
            class: "live-code__console",
            children: [
              {
                type: "div",
                props: {
                  class: "live-code__console-header",
                  children: "Console",
                },
              },
              ...logs.map((log) => ({
                type: "div",
                props: {
                  class: "live-code__console-line",
                  children: log,
                },
              })),
            ],
          },
        },

        // Error
        error && {
          type: "div",
          props: {
            class: "live-code__error",
            children: [
              {
                type: "div",
                props: {
                  class: "live-code__error-title",
                  children: error.name,
                },
              },
              {
                type: "div",
                props: {
                  class: "live-code__error-message",
                  children: error.message,
                },
              },
            ],
          },
        },

        // Output
        !error && output !== undefined && output !== null && {
          type: "div",
          props: {
            class: "live-code__output",
            children: [
              {
                type: "div",
                props: {
                  class: "live-code__output-header",
                  children: "Output",
                },
              },
              {
                type: "pre",
                props: {
                  class: "live-code__output-value",
                  children: formatOutput(output),
                },
              },
            ],
          },
        },
      ].filter(Boolean),
    },
  };
}

// ============================================================================
// Additional Components
// ============================================================================

/**
 * Inline code with copy button
 */
export function InlineCode(props: {
  code: string;
  showCopy?: boolean;
  class?: string;
}) {
  const copied: Signal<boolean> = signal(false);

  async function handleCopy() {
    const success = await copyToClipboard(props.code);
    if (success) {
      copied.set(true);
      setTimeout(() => copied.set(false), 2000);
    }
  }

  return {
    type: "span",
    props: {
      class: `inline-code ${props.class || ""}`,
      children: [
        {
          type: "code",
          props: {
            children: props.code,
          },
        },
        props.showCopy !== false && {
          type: "button",
          props: {
            class: "inline-code__copy",
            onClick: handleCopy,
            title: "Copy",
            children: copied() ? "Copied!" : "Copy",
          },
        },
      ].filter(Boolean),
    },
  };
}

/**
 * Code comparison (before/after)
 */
export function CodeComparison(props: {
  before: string;
  after: string;
  language?: string;
  beforeTitle?: string;
  afterTitle?: string;
}) {
  return {
    type: "div",
    props: {
      class: "code-comparison",
      children: [
        {
          type: "div",
          props: {
            class: "code-comparison__panel code-comparison__before",
            children: LiveCode({
              code: props.before,
              language: props.language,
              title: props.beforeTitle || "Before",
              editable: false,
              preview: false,
            }),
          },
        },
        {
          type: "div",
          props: {
            class: "code-comparison__arrow",
            children: "->",
          },
        },
        {
          type: "div",
          props: {
            class: "code-comparison__panel code-comparison__after",
            children: LiveCode({
              code: props.after,
              language: props.language,
              title: props.afterTitle || "After",
              editable: false,
              preview: false,
            }),
          },
        },
      ],
    },
  };
}

/**
 * Code tabs for multiple examples
 */
export function CodeTabs(props: {
  examples: Array<{ name: string; code: string; language?: string }>;
  defaultTab?: number;
}) {
  const activeTab: Signal<number> = signal(props.defaultTab || 0);

  return {
    type: "div",
    props: {
      class: "code-tabs",
      children: [
        {
          type: "div",
          props: {
            class: "code-tabs__headers",
            children: props.examples.map((example, index) => ({
              type: "button",
              props: {
                class: `code-tabs__tab ${index === activeTab() ? "code-tabs__tab--active" : ""}`,
                onClick: () => activeTab.set(index),
                children: example.name,
              },
            })),
          },
        },
        {
          type: "div",
          props: {
            class: "code-tabs__content",
            children: LiveCode({
              code: props.examples[activeTab()].code,
              language: props.examples[activeTab()].language,
              preview: true,
            }),
          },
        },
      ],
    },
  };
}

// ============================================================================
// Styles
// ============================================================================

/**
 * Get CSS styles for Live Code components
 */
export function getLiveCodeStyles(): string {
  return `
.live-code {
  background: #1e1e1e;
  border-radius: 8px;
  overflow: hidden;
  font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 14px;
  margin: 16px 0;
  border: 1px solid #3e3e42;
}

.live-code--light {
  background: #f5f5f5;
  border-color: #e0e0e0;
}

.live-code__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #2d2d30;
  border-bottom: 1px solid #3e3e42;
}

.live-code--light .live-code__header {
  background: #e8e8e8;
  border-color: #d0d0d0;
}

.live-code__title-area {
  display: flex;
  align-items: center;
  gap: 12px;
}

.live-code__title {
  color: #d4d4d4;
  font-weight: 500;
}

.live-code--light .live-code__title {
  color: #333;
}

.live-code__language {
  background: #3e3e42;
  color: #9cdcfe;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  text-transform: uppercase;
}

.live-code__actions {
  display: flex;
  gap: 8px;
}

.live-code__action {
  background: transparent;
  border: 1px solid #3e3e42;
  color: #d4d4d4;
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.live-code__action:hover {
  background: #3e3e42;
}

.live-code__action--active {
  background: #264f78;
  border-color: #264f78;
}

.live-code__action--primary {
  background: #0e639c;
  border-color: #0e639c;
}

.live-code__action--primary:hover {
  background: #1177bb;
}

.live-code__tabs {
  display: flex;
  background: #252526;
  border-bottom: 1px solid #3e3e42;
}

.live-code__tab {
  background: transparent;
  border: none;
  color: #969696;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 12px;
  border-bottom: 2px solid transparent;
}

.live-code__tab:hover {
  color: #d4d4d4;
}

.live-code__tab--active {
  color: #d4d4d4;
  border-bottom-color: #0e639c;
}

.live-code__content {
  display: flex;
}

.live-code__editor {
  flex: 1;
  display: flex;
  overflow: auto;
  max-height: 400px;
}

.live-code__line-numbers {
  display: flex;
  flex-direction: column;
  padding: 12px 8px;
  background: #1e1e1e;
  border-right: 1px solid #3e3e42;
  user-select: none;
}

.live-code__line-number {
  color: #858585;
  text-align: right;
  min-width: 24px;
  font-size: 12px;
  line-height: 1.5;
}

.live-code__textarea {
  flex: 1;
  background: transparent;
  border: none;
  color: #d4d4d4;
  padding: 12px;
  font-family: inherit;
  font-size: inherit;
  resize: none;
  outline: none;
  line-height: 1.5;
  tab-size: 2;
}

.live-code__pre {
  margin: 0;
  padding: 12px;
  overflow: auto;
  flex: 1;
}

.live-code__code {
  color: #d4d4d4;
  line-height: 1.5;
}

/* Syntax highlighting */
.live-code__keyword { color: #569cd6; }
.live-code__string { color: #ce9178; }
.live-code__number { color: #b5cea8; }
.live-code__comment { color: #6a9955; font-style: italic; }
.live-code__function { color: #dcdcaa; }
.live-code__type { color: #4ec9b0; }
.live-code__builtin { color: #c586c0; }
.live-code__literal { color: #569cd6; }

.live-code__preview {
  flex: 1;
  border-left: 1px solid #3e3e42;
  padding: 12px;
  background: #252526;
  overflow: auto;
  max-height: 400px;
}

.live-code__preview--loading {
  color: #969696;
  display: flex;
  align-items: center;
  justify-content: center;
}

.live-code__preview--error {
  background: #3a1d1d;
}

.live-code__console {
  margin-bottom: 12px;
}

.live-code__console-header,
.live-code__output-header {
  color: #9cdcfe;
  font-size: 11px;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.live-code__console-line {
  color: #d4d4d4;
  font-size: 12px;
  padding: 2px 0;
  font-family: monospace;
}

.live-code__error {
  background: #5a1d1d;
  padding: 12px;
  border-radius: 4px;
}

.live-code__error-title {
  color: #f48771;
  font-weight: bold;
  margin-bottom: 4px;
}

.live-code__error-message {
  color: #d4d4d4;
  font-size: 12px;
}

.live-code__output-value {
  margin: 0;
  color: #d4d4d4;
  font-size: 12px;
  white-space: pre-wrap;
}

.live-code__description {
  padding: 12px;
  background: #252526;
  border-top: 1px solid #3e3e42;
  color: #969696;
  font-size: 13px;
}

/* Inline code */
.inline-code {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.inline-code code {
  background: #2d2d30;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 13px;
  color: #ce9178;
}

.inline-code__copy {
  background: transparent;
  border: none;
  color: #969696;
  cursor: pointer;
  font-size: 11px;
  padding: 2px 4px;
}

.inline-code__copy:hover {
  color: #d4d4d4;
}

/* Code comparison */
.code-comparison {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.code-comparison__panel {
  flex: 1;
}

.code-comparison__arrow {
  color: #969696;
  font-size: 24px;
  padding-top: 60px;
}

/* Code tabs */
.code-tabs {
  background: #1e1e1e;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #3e3e42;
  margin: 16px 0;
}

.code-tabs__headers {
  display: flex;
  background: #2d2d30;
  border-bottom: 1px solid #3e3e42;
}

.code-tabs__tab {
  background: transparent;
  border: none;
  color: #969696;
  padding: 12px 20px;
  cursor: pointer;
  font-size: 13px;
}

.code-tabs__tab:hover {
  color: #d4d4d4;
}

.code-tabs__tab--active {
  color: #d4d4d4;
  background: #1e1e1e;
}

.code-tabs__content .live-code {
  border: none;
  margin: 0;
  border-radius: 0;
}
`;
}

// ============================================================================
// Helper Functions
// ============================================================================

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

function formatOutput(value: unknown): string {
  if (value === undefined) return "undefined";
  if (value === null) return "null";
  if (typeof value === "function") return value.toString();
  if (typeof value === "object") {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

// ============================================================================
// Exports
// ============================================================================

export type {
  LiveCodeConfig,
  LiveCodeProps,
  CodeFile,
  PreviewResult,
};
