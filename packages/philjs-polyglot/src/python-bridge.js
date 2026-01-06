"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PythonBridge = void 0;
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const events_1 = require("events");
/**
 * A bridge to run Python code from Node.js with zero-latency IPC.
 */
class PythonBridge extends events_1.EventEmitter {
    pythonProcess = null;
    pythonPath;
    scriptPath;
    pendingCommands = new Map();
    commandId = 0;
    constructor(options = {}) {
        super();
        this.pythonPath = options.pythonPath || 'python3';
        this.scriptPath = path_1.default.join(__dirname, 'bridge.py');
        this.init();
    }
    init() {
        this.pythonProcess = (0, child_process_1.spawn)(this.pythonPath, [this.scriptPath], {
            stdio: ['pipe', 'pipe', 'pipe']
        });
        this.pythonProcess.stdout?.on('data', (data) => {
            const lines = data.toString().split('\n');
            for (const line of lines) {
                if (!line.trim())
                    continue;
                try {
                    const response = JSON.parse(line);
                    if (response.id && this.pendingCommands.has(response.id)) {
                        const { resolve, reject } = this.pendingCommands.get(response.id);
                        if (response.status === 'ok') {
                            resolve(response.result);
                        }
                        else {
                            reject(new Error(response.error || 'Unknown Python Error'));
                        }
                        this.pendingCommands.delete(response.id);
                    }
                }
                catch (e) {
                    console.error('PythonBridge JSON Parse Error:', e);
                }
            }
        });
        this.pythonProcess.stderr?.on('data', (data) => {
            console.error('Python Stderr:', data.toString());
        });
    }
    send(cmd) {
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
    async exec(code) {
        await this.send({ type: 'exec', code });
    }
    /**
     * Evaluates python code (expects return value).
     */
    async eval(code) {
        return this.send({ type: 'eval', code });
    }
    /**
     * Calls a defined python function with arguments.
     */
    async call(functionName, ...args) {
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
exports.PythonBridge = PythonBridge;
//# sourceMappingURL=python-bridge.js.map