/**
 * Shell APIs
 */
export interface CommandOptions {
    /** Current working directory */
    cwd?: string;
    /** Environment variables */
    env?: Record<string, string>;
    /** Encoding for output */
    encoding?: string;
}
export interface CommandOutput {
    /** Exit code */
    code: number;
    /** Standard output */
    stdout: string;
    /** Standard error */
    stderr: string;
    /** Whether command succeeded */
    success: boolean;
}
export interface SpawnedProcess {
    /** Process ID */
    pid: number;
    /** Kill the process */
    kill: () => Promise<void>;
    /** Write to stdin */
    write: (data: string | Uint8Array) => Promise<void>;
}
/**
 * Shell API
 */
export declare const Shell: {
    /**
     * Open a URL in the default browser
     */
    openUrl(url: string): Promise<void>;
    /**
     * Open a path with the default application
     */
    openPath(path: string): Promise<void>;
    /**
     * Execute a command and wait for completion
     */
    execute(program: string, args?: string[], options?: CommandOptions): Promise<CommandOutput>;
    /**
     * Spawn a command (run in background)
     */
    spawn(program: string, args?: string[], options?: CommandOptions & {
        onStdout?: (line: string) => void;
        onStderr?: (line: string) => void;
        onClose?: (code: number) => void;
        onError?: (error: string) => void;
    }): Promise<SpawnedProcess>;
    /**
     * Run a script (platform-specific shell)
     */
    runScript(script: string, options?: CommandOptions): Promise<CommandOutput>;
    /**
     * Run PowerShell command (Windows)
     */
    powershell(script: string, options?: CommandOptions): Promise<CommandOutput>;
    /**
     * Run a sidecar binary
     */
    sidecar(name: string, args?: string[], options?: CommandOptions): Promise<CommandOutput>;
};
export declare const openUrl: (url: string) => Promise<void>;
export declare const openPath: (path: string) => Promise<void>;
export declare const execute: (program: string, args?: string[], options?: CommandOptions) => Promise<CommandOutput>;
export declare const spawn: (program: string, args?: string[], options?: CommandOptions & {
    onStdout?: (line: string) => void;
    onStderr?: (line: string) => void;
    onClose?: (code: number) => void;
    onError?: (error: string) => void;
}) => Promise<SpawnedProcess>;
export declare const runScript: (script: string, options?: CommandOptions) => Promise<CommandOutput>;
export declare const powershell: (script: string, options?: CommandOptions) => Promise<CommandOutput>;
export declare const sidecar: (name: string, args?: string[], options?: CommandOptions) => Promise<CommandOutput>;
//# sourceMappingURL=shell.d.ts.map