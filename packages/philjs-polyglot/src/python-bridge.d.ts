import { EventEmitter } from 'events';
interface PythonBridgeOptions {
    pythonPath?: string;
    cwd?: string;
}
/**
 * A bridge to run Python code from Node.js with zero-latency IPC.
 */
export declare class PythonBridge extends EventEmitter {
    private pythonProcess;
    private pythonPath;
    private scriptPath;
    private pendingCommands;
    private commandId;
    constructor(options?: PythonBridgeOptions);
    private init;
    private send;
    /**
     * Executes python code (no return value expected).
     */
    exec(code: string): Promise<void>;
    /**
     * Evaluates python code (expects return value).
     */
    eval(code: string): Promise<any>;
    /**
     * Calls a defined python function with arguments.
     */
    call(functionName: string, ...args: any[]): Promise<any>;
    /**
     * close the bridge
     */
    close(): void;
}
export {};
//# sourceMappingURL=python-bridge.d.ts.map