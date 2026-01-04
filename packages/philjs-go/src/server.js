/**
 * Go Server Integration for PhilJS
 *
 * Manages Go server lifecycle and communication with PhilJS.
 */
import { execa } from 'execa';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
/**
 * Go server instance
 */
export class GoServer {
    process = null;
    config;
    binaryPath;
    constructor(config, binaryPath) {
        this.config = {
            port: 3000,
            host: '0.0.0.0',
            ssr: true,
            compress: true,
            http2: true,
            timeout: 30000,
            maxBodySize: '10mb',
            ...config,
        };
        this.binaryPath = binaryPath || './dist/go/server';
    }
    /**
     * Start the Go server
     */
    async start() {
        if (this.process) {
            throw new Error('Server already running');
        }
        const env = {
            PHILJS_PORT: String(this.config.port),
            PHILJS_HOST: this.config.host,
            PHILJS_SSR: String(this.config.ssr),
            PHILJS_COMPRESS: String(this.config.compress),
            PHILJS_HTTP2: String(this.config.http2),
            PHILJS_TIMEOUT: String(this.config.timeout),
            PHILJS_MAX_BODY: this.config.maxBodySize,
        };
        if (this.config.static) {
            env['PHILJS_STATIC'] = resolve(this.config.static);
        }
        if (this.config.apiDir) {
            env['PHILJS_API_DIR'] = resolve(this.config.apiDir);
        }
        if (this.config.edge) {
            env['PHILJS_EDGE'] = 'true';
        }
        if (this.config.cors) {
            if (typeof this.config.cors === 'boolean') {
                env['PHILJS_CORS'] = 'true';
            }
            else {
                env['PHILJS_CORS_ORIGINS'] = this.config.cors.origins?.join(',') || '*';
                env['PHILJS_CORS_METHODS'] = this.config.cors.methods?.join(',') || 'GET,POST,PUT,DELETE';
                env['PHILJS_CORS_HEADERS'] = this.config.cors.headers?.join(',') || '*';
                env['PHILJS_CORS_CREDENTIALS'] = String(this.config.cors.credentials ?? false);
            }
        }
        this.process = execa(this.binaryPath, [], {
            env: { ...process.env, ...env },
            stdio: 'inherit',
        });
        // Wait for server to be ready
        await this.waitForReady();
    }
    /**
     * Stop the Go server
     */
    async stop() {
        if (!this.process) {
            return;
        }
        this.process.kill('SIGTERM');
        // Wait for graceful shutdown
        try {
            await Promise.race([
                this.process,
                new Promise((_, reject) => setTimeout(() => reject(new Error('Shutdown timeout')), 5000)),
            ]);
        }
        catch {
            // Force kill if graceful shutdown fails
            this.process.kill('SIGKILL');
        }
        this.process = null;
    }
    /**
     * Restart the Go server
     */
    async restart() {
        await this.stop();
        await this.start();
    }
    /**
     * Check if server is running
     */
    isRunning() {
        return this.process !== null && !this.process.killed;
    }
    /**
     * Wait for server to be ready
     */
    async waitForReady(timeout = 10000) {
        const start = Date.now();
        const url = `http://${this.config.host}:${this.config.port}/health`;
        while (Date.now() - start < timeout) {
            try {
                const response = await fetch(url);
                if (response.ok) {
                    return;
                }
            }
            catch {
                // Server not ready yet
            }
            await new Promise((resolve) => setTimeout(resolve, 100));
        }
        throw new Error(`Server failed to start within ${timeout}ms`);
    }
}
/**
 * Create and start a Go server
 */
export async function createGoServer(config) {
    const server = new GoServer(config);
    await server.start();
    return server;
}
/**
 * Build Go server binary
 */
export async function buildGoServer(options = {}) {
    const { outDir = './dist/go', goos = process.platform === 'win32' ? 'windows' : process.platform === 'darwin' ? 'darwin' : 'linux', goarch = process.arch === 'arm64' ? 'arm64' : 'amd64', mode = 'release', cgo = false, flags = [], docker = false, } = options;
    const goDir = join(__dirname, '..', 'go');
    const outputName = goos === 'windows' ? 'server.exe' : 'server';
    const outputPath = join(outDir, outputName);
    const buildFlags = [
        'build',
        '-o', outputPath,
    ];
    if (mode === 'release') {
        buildFlags.push('-ldflags', '-s -w');
        buildFlags.push('-trimpath');
    }
    buildFlags.push(...flags, '.');
    await execa('go', buildFlags, {
        cwd: goDir,
        env: {
            ...process.env,
            GOOS: goos,
            GOARCH: goarch,
            CGO_ENABLED: cgo ? '1' : '0',
        },
        stdio: 'inherit',
    });
    if (docker) {
        await buildDockerImage(outDir, goos, goarch);
    }
    return outputPath;
}
/**
 * Build Docker image for Go server
 */
async function buildDockerImage(outDir, goos, goarch) {
    const dockerfile = `
FROM scratch
COPY server /server
EXPOSE 3000
ENTRYPOINT ["/server"]
`;
    const { writeFile } = await import('node:fs/promises');
    await writeFile(join(outDir, 'Dockerfile'), dockerfile);
    await execa('docker', [
        'build',
        '-t', 'philjs-server',
        '--platform', `${goos}/${goarch}`,
        outDir,
    ], {
        stdio: 'inherit',
    });
}
/**
 * Initialize a new Go project for PhilJS
 */
export async function initGoProject(dir, config) {
    const { mkdir, writeFile } = await import('node:fs/promises');
    const goDir = join(dir, 'go');
    await mkdir(goDir, { recursive: true });
    // Create go.mod
    const goMod = `module ${config.module}

go ${config.goVersion || '1.22'}

require (
    github.com/philjs/philjs-go v0.1.0
)
`;
    await writeFile(join(goDir, 'go.mod'), goMod);
    // Create main.go
    const mainGo = `package main

import (
    "github.com/philjs/philjs-go/server"
)

func main() {
    s := server.New()

    // Add your routes here
    s.Get("/api/hello", func(c *server.Context) error {
        return c.JSON(map[string]string{
            "message": "Hello from PhilJS Go!",
        })
    })

    s.Start()
}
`;
    await writeFile(join(goDir, 'main.go'), mainGo);
    // Create philjs.go.json config
    await writeFile(join(dir, 'philjs.go.json'), JSON.stringify(config, null, 2));
}
/**
 * Check if Go is installed
 */
export async function checkGoInstalled() {
    try {
        const { stdout } = await execa('go', ['version']);
        const match = stdout.match(/go(\d+\.\d+(\.\d+)?)/);
        return {
            installed: true,
            version: match?.[1],
        };
    }
    catch {
        return { installed: false };
    }
}
//# sourceMappingURL=server.js.map