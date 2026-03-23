/**
 * PhilJS Documentation Components
 *
 * Reusable components for building interactive documentation.
 */

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

export declare function LiveCode(props: LiveCodeProps): any;

export declare const liveCodeStyles: string;
