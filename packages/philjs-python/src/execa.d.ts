/**
 * Ambient type declarations for execa v9+
 *
 * execa is an ESM-only package with bundled types.
 * This ambient declaration provides the minimal types needed for this package.
 */

declare module 'execa' {
  import type { ChildProcess, SpawnOptions } from 'node:child_process';
  import type { Readable, Writable } from 'node:stream';

  export interface ExecaChildProcess<StdoutType = string> extends Promise<ExecaReturnValue<StdoutType>> {
    /** The process ID */
    pid?: number;

    /** Whether the process has been killed */
    killed: boolean;

    /** Send a signal to the process */
    kill(signal?: NodeJS.Signals | number): boolean;

    /** The stdin stream */
    stdin?: Writable;

    /** The stdout stream */
    stdout?: Readable;

    /** The stderr stream */
    stderr?: Readable;

    /** Cancel the process */
    cancel(): void;
  }

  export interface ExecaReturnValue<StdoutType = string> {
    /** The command that was run */
    command: string;

    /** The escaped command that was run */
    escapedCommand: string;

    /** The exit code of the process */
    exitCode: number;

    /** The stdout output */
    stdout: StdoutType;

    /** The stderr output */
    stderr: string;

    /** Whether the process was killed */
    killed: boolean;

    /** Whether the process timed out */
    timedOut: boolean;

    /** Whether the process was canceled */
    isCanceled: boolean;

    /** The signal that killed the process */
    signal?: NodeJS.Signals;

    /** The signal description */
    signalDescription?: string;

    /** The current working directory */
    cwd: string;

    /** Whether the process failed */
    failed: boolean;
  }

  export interface ExecaOptions extends SpawnOptions {
    /** Current working directory */
    cwd?: string;

    /** Environment variables */
    env?: NodeJS.ProcessEnv;

    /** How to handle stdin/stdout/stderr */
    stdio?: 'pipe' | 'inherit' | 'ignore' | readonly ('pipe' | 'inherit' | 'ignore' | 'ipc' | null | undefined | number)[];

    /** Timeout in milliseconds */
    timeout?: number;

    /** Encoding for stdout/stderr */
    encoding?: BufferEncoding | 'buffer' | null;

    /** Whether to reject on non-zero exit code */
    reject?: boolean;

    /** Whether to strip final newline */
    stripFinalNewline?: boolean;

    /** Kill signal */
    killSignal?: NodeJS.Signals | number;

    /** Force kill after timeout */
    forceKillAfterTimeout?: number | boolean;

    /** Whether to prefer local binaries */
    preferLocal?: boolean;

    /** Local directory for preferLocal */
    localDir?: string;

    /** Whether to use shell */
    shell?: boolean | string;

    /** Path to executable */
    execPath?: string;

    /** Whether to buffer output */
    buffer?: boolean;

    /** Max buffer size */
    maxBuffer?: number;

    /** Write input to stdin */
    input?: string | Buffer | Readable;

    /** Input file path */
    inputFile?: string;

    /** Whether to run in verbose mode */
    verbose?: boolean;

    /** Cleanup on exit */
    cleanup?: boolean;

    /** Extend env with process.env */
    extendEnv?: boolean;

    /** Argv0 */
    argv0?: string;

    /** Windows specific: whether to hide the subprocess console window */
    windowsHide?: boolean;

    /** Windows specific: verbatim arguments */
    windowsVerbatimArguments?: boolean;

    /** Detach the subprocess */
    detached?: boolean;

    /** User ID */
    uid?: number;

    /** Group ID */
    gid?: number;
  }

  /**
   * Execute a file
   */
  export function execa(
    file: string,
    args?: readonly string[],
    options?: ExecaOptions
  ): ExecaChildProcess;

  export function execa(
    file: string,
    options?: ExecaOptions
  ): ExecaChildProcess;

  /**
   * Execute a command
   */
  export function execaCommand(
    command: string,
    options?: ExecaOptions
  ): ExecaChildProcess;

  /**
   * Execute a command synchronously
   */
  export function execaSync(
    file: string,
    args?: readonly string[],
    options?: ExecaOptions
  ): ExecaReturnValue;

  /**
   * Execute a command synchronously
   */
  export function execaCommandSync(
    command: string,
    options?: ExecaOptions
  ): ExecaReturnValue;

  /**
   * Execute a Node.js script
   */
  export function execaNode(
    scriptPath: string,
    args?: readonly string[],
    options?: ExecaOptions
  ): ExecaChildProcess;

  /**
   * Create an execa instance with default options
   */
  export function $(...args: Parameters<typeof execa>): ExecaChildProcess;

  export { execa as default };
}
