import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { EventEmitter } from 'events';

interface PythonBridgeOptions {
    pythonPath?: string;
    cwd?: string;
}

interface Command {
    id: string;
    type: 'exec' | 'eval' | 'call';
    code?: string;
    fn?: string;
    args?: any[];
}

/**
 * A bridge to run Python code from Node.js with zero-latency IPC.
 */
export class PythonBridge extends EventEmitter {
    private pythonProcess: ChildProcess | null = null;
    private pythonPath: string;
    private scriptPath: string;
    private pendingCommands = new Map<string, { resolve: Function, reject: Function }>();
    private commandId = 0;

    constructor(options: PythonBridgeOptions = {}) {
        super();
        this.pythonPath = options.pythonPath || 'python3';
        this.scriptPath = path.join(__dirname, 'bridge.py');
        this.init();
    }

    private init() {
        this.pythonProcess = spawn(this.pythonPath, [this.scriptPath], {
            stdio: ['pipe', 'pipe', 'pipe']
        });

        this.pythonProcess.stdout?.on('data', (data) => {
            const lines = data.toString().split('\n');
            for (const line of lines) {
                if (!line.trim()) continue;
                try {
                    const response = JSON.parse(line);
                    if (response.id && this.pendingCommands.has(response.id)) {
                        const { resolve, reject } = this.pendingCommands.get(response.id)!;
                        if (response.status === 'ok') {
                            resolve(response.result);
                        } else {
                            reject(new Error(response.error || 'Unknown Python Error'));
                        }
                        this.pendingCommands.delete(response.id);
                    }
                } catch (e) {
                    console.error('PythonBridge JSON Parse Error:', e);
                }
            }
        });

        this.pythonProcess.stderr?.on('data', (data) => {
            console.error('Python Stderr:', data.toString());
        });
    }

    private send(cmd: Omit<Command, 'id'>): Promise<any> {
        return new Promise((resolve, reject) => {
            const id = String(++this.commandId);
            this.pendingCommands.set(id, { resolve, reject });
            const payload = JSON.stringify({ ...cmd, id }) + '\n';
            this.pythonProcess?.stdin?.write(payload);
        });
    }

    /**
     * Executes python code (no return value expected).
     */
    async exec(code: string): Promise<void> {
        await this.send({ type: 'exec', code });
    }

    /**
     * Evaluates python code (expects return value).
     */
    async eval(code: string): Promise<any> {
        return this.send({ type: 'eval', code });
    }

    /**
     * Calls a defined python function with arguments.
     */
    async call(functionName: string, ...args: any[]): Promise<any> {
        return this.send({ type: 'call', fn: functionName, args });
    }

    /**
     * close the bridge
     */
    close() {
        if (this.pythonProcess) {
            this.pythonProcess.kill();
        }
    }
}
