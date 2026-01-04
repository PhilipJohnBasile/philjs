/**
 * Shell APIs
 */
import { isTauri } from '../tauri/context.js';
/**
 * Shell API
 */
export const Shell = {
    /**
     * Open a URL in the default browser
     */
    async openUrl(url) {
        if (!isTauri()) {
            window.open(url, '_blank');
            return;
        }
        const { open } = await import('@tauri-apps/plugin-shell');
        await open(url);
    },
    /**
     * Open a path with the default application
     */
    async openPath(path) {
        if (!isTauri()) {
            throw new Error('Cannot open path in browser');
        }
        const { open } = await import('@tauri-apps/plugin-shell');
        await open(path);
    },
    /**
     * Execute a command and wait for completion
     */
    async execute(program, args = [], options = {}) {
        if (!isTauri()) {
            throw new Error('Command execution not available in browser');
        }
        const { Command } = await import('@tauri-apps/plugin-shell');
        const command = Command.create(program, args, {
            ...(options.cwd && { cwd: options.cwd }),
            ...(options.env && { env: options.env }),
            ...(options.encoding && { encoding: options.encoding }),
        });
        const output = await command.execute();
        return {
            code: output.code ?? -1,
            stdout: output.stdout,
            stderr: output.stderr,
            success: output.code === 0,
        };
    },
    /**
     * Spawn a command (run in background)
     */
    async spawn(program, args = [], options = {}) {
        if (!isTauri()) {
            throw new Error('Command spawning not available in browser');
        }
        const { Command } = await import('@tauri-apps/plugin-shell');
        const command = Command.create(program, args, {
            ...(options.cwd && { cwd: options.cwd }),
            ...(options.env && { env: options.env }),
            ...(options.encoding && { encoding: options.encoding }),
        });
        // Set up event handlers
        command.on('close', (data) => {
            options.onClose?.(data.code);
        });
        command.on('error', (error) => {
            options.onError?.(error);
        });
        command.stdout.on('data', (line) => {
            options.onStdout?.(line);
        });
        command.stderr.on('data', (line) => {
            options.onStderr?.(line);
        });
        const child = await command.spawn();
        return {
            pid: child.pid,
            kill: async () => {
                await child.kill();
            },
            write: async (data) => {
                await child.write(data);
            },
        };
    },
    /**
     * Run a script (platform-specific shell)
     */
    async runScript(script, options = {}) {
        const platform = await getPlatform();
        if (platform === 'windows') {
            return this.execute('cmd', ['/c', script], options);
        }
        else {
            return this.execute('sh', ['-c', script], options);
        }
    },
    /**
     * Run PowerShell command (Windows)
     */
    async powershell(script, options = {}) {
        return this.execute('powershell', ['-Command', script], options);
    },
    /**
     * Run a sidecar binary
     */
    async sidecar(name, args = [], options = {}) {
        if (!isTauri()) {
            throw new Error('Sidecar execution not available in browser');
        }
        const { Command } = await import('@tauri-apps/plugin-shell');
        const command = Command.sidecar(name, args, {
            ...(options.cwd && { cwd: options.cwd }),
            ...(options.env && { env: options.env }),
            ...(options.encoding && { encoding: options.encoding }),
        });
        const output = await command.execute();
        return {
            code: output.code ?? -1,
            stdout: output.stdout,
            stderr: output.stderr,
            success: output.code === 0,
        };
    },
};
/**
 * Get current platform
 */
async function getPlatform() {
    if (!isTauri()) {
        const ua = navigator.userAgent.toLowerCase();
        if (ua.includes('win'))
            return 'windows';
        if (ua.includes('mac'))
            return 'macos';
        if (ua.includes('linux'))
            return 'linux';
        return 'unknown';
    }
    const { platform } = await import('@tauri-apps/plugin-os');
    return platform();
}
// Convenience exports
export const openUrl = Shell.openUrl;
export const openPath = Shell.openPath;
export const execute = Shell.execute;
export const spawn = Shell.spawn;
export const runScript = Shell.runScript;
export const powershell = Shell.powershell;
export const sidecar = Shell.sidecar;
//# sourceMappingURL=shell.js.map