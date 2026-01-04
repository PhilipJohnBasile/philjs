/**
 * Create PhilJS Plugin - Plugin SDK
 * Tools and utilities for building PhilJS plugins
 */
// Export generator
export { createPlugin } from './generator.js';
// Export template utilities
export * from './template-engine.js';
/**
 * Plugin builder for easier plugin creation
 */
export class PluginBuilder {
    plugin = {
        meta: {
            name: "",
            version: "0.1.0",
            description: "",
            philjs: "^0.1.0",
        },
        hooks: {},
    };
    /**
     * Set plugin metadata
     */
    meta(meta) {
        this.plugin.meta = { ...this.plugin.meta, ...meta };
        return this;
    }
    /**
     * Add lifecycle hook
     */
    hook(hookName, handler) {
        this.plugin.hooks = this.plugin.hooks || {};
        this.plugin.hooks[hookName] = handler;
        return this;
    }
    /**
     * Add setup function
     */
    setup(handler) {
        this.plugin.setup = handler;
        return this;
    }
    /**
     * Add Vite plugin integration
     */
    vitePlugin(handler) {
        this.plugin.vitePlugin = handler;
        return this;
    }
    /**
     * Add config schema
     */
    configSchema(schema) {
        this.plugin.configSchema = schema;
        return this;
    }
    /**
     * Build the plugin
     */
    build() {
        if (!this.plugin.meta?.name) {
            throw new Error("Plugin name is required");
        }
        return this.plugin;
    }
}
/**
 * Create a plugin builder
 */
export function createBuilder() {
    return new PluginBuilder();
}
/**
 * Plugin testing utilities
 */
export class PluginTester {
    plugin;
    mockContext;
    files;
    constructor(plugin) {
        this.plugin = plugin;
        this.files = new Map();
        this.mockContext = this.createMockContext();
    }
    /**
     * Create mock plugin context
     */
    createMockContext() {
        const logs = [];
        const files = this.files;
        return {
            version: "0.1.0",
            root: "/mock/project",
            mode: "development",
            config: {},
            logger: {
                info: (msg, ...args) => logs.push({ level: "info", message: msg, args }),
                warn: (msg, ...args) => logs.push({ level: "warn", message: msg, args }),
                error: (msg, ...args) => logs.push({ level: "error", message: msg, args }),
                debug: (msg, ...args) => logs.push({ level: "debug", message: msg, args }),
                success: (msg, ...args) => logs.push({ level: "success", message: msg, args }),
            },
            fs: {
                readFile: async (path) => files.get(path) || "",
                writeFile: async (path, content) => { files.set(path, content); },
                exists: async (path) => files.has(path),
                mkdir: async () => { },
                readdir: async () => [],
                copy: async () => { },
                remove: async (path) => { files.delete(path); },
            },
            utils: {
                resolve: (...paths) => paths.join("/"),
                exec: async () => ({ stdout: "", stderr: "" }),
                getPackageManager: async () => "npm",
                installPackages: async () => { },
                readPackageJson: async () => ({ name: "test", version: "0.1.0" }),
                writePackageJson: async () => { },
            },
        };
    }
    /**
     * Test plugin setup
     */
    async testSetup(config = {}) {
        if (this.plugin.setup) {
            await this.plugin.setup(config, this.mockContext);
        }
    }
    /**
     * Test plugin hooks
     */
    async testHook(hookName, ...args) {
        const hook = this.plugin.hooks?.[hookName];
        if (!hook) {
            throw new Error(`Hook "${String(hookName)}" not found`);
        }
        // @ts-ignore
        return await hook(this.mockContext, ...args.slice(1));
    }
    /**
     * Get mock context for assertions
     */
    getContext() {
        return this.mockContext;
    }
    /**
     * Set mock file
     */
    setFile(path, content) {
        this.files.set(path, content);
    }
    /**
     * Get mock file
     */
    async getFile(path) {
        return await this.mockContext.fs.readFile(path);
    }
}
/**
 * Create plugin tester
 */
export function createTester(plugin) {
    return new PluginTester(plugin);
}
/**
 * Plugin validation utilities
 */
export const pluginValidator = {
    /**
     * Validate plugin structure
     */
    validate(plugin) {
        const errors = [];
        // Check required fields
        if (!plugin.meta?.name) {
            errors.push("Plugin must have a name");
        }
        if (!plugin.meta?.version) {
            errors.push("Plugin must have a version");
        }
        // Validate version format
        if (plugin.meta?.version && !/^\d+\.\d+\.\d+/.test(plugin.meta.version)) {
            errors.push("Version must be valid semver");
        }
        // Check for at least one hook or setup
        if (!plugin.setup && (!plugin.hooks || Object.keys(plugin.hooks).length === 0)) {
            errors.push("Plugin must have at least a setup function or lifecycle hooks");
        }
        return {
            valid: errors.length === 0,
            errors,
        };
    },
    /**
     * Validate config against schema
     */
    validateConfig(config, schema) {
        const errors = [];
        if (!schema)
            return { valid: true, errors };
        // Simple validation (can be enhanced with JSON schema validator)
        if (schema.required) {
            for (const field of schema.required) {
                if (!(field in config)) {
                    errors.push(`Required field "${field}" is missing`);
                }
            }
        }
        if (schema.properties) {
            for (const [key, prop] of Object.entries(schema.properties)) {
                if (key in config) {
                    const value = config[key];
                    const propSchema = prop;
                    // Type checking
                    if (propSchema.type) {
                        const actualType = Array.isArray(value) ? "array" : typeof value;
                        if (actualType !== propSchema.type) {
                            errors.push(`Field "${key}" should be ${propSchema.type}, got ${actualType}`);
                        }
                    }
                    // Enum validation
                    if (propSchema.enum && !propSchema.enum.includes(value)) {
                        errors.push(`Field "${key}" must be one of: ${propSchema.enum.join(", ")}`);
                    }
                }
            }
        }
        return {
            valid: errors.length === 0,
            errors,
        };
    },
};
/**
 * Plugin publishing utilities
 */
export const pluginPublisher = {
    /**
     * Generate package.json for plugin
     */
    generatePackageJson(plugin) {
        return {
            name: plugin.meta.name,
            version: plugin.meta.version,
            description: plugin.meta.description,
            author: plugin.meta.author,
            license: plugin.meta.license || "MIT",
            keywords: ["philjs", "plugin", ...(plugin.meta.keywords || [])],
            repository: plugin.meta.repository,
            homepage: plugin.meta.homepage,
            type: "module",
            main: "./dist/index.js",
            types: "./dist/index.d.ts",
            exports: {
                ".": {
                    types: "./dist/index.d.ts",
                    import: "./dist/index.js",
                },
            },
            files: ["dist"],
            peerDependencies: {
                "@philjs/core": plugin.meta.philjs || "^0.1.0",
            },
            scripts: {
                build: "tsc",
                test: "vitest run",
                prepublishOnly: "npm run build && npm test",
            },
        };
    },
    /**
     * Generate README.md for plugin
     */
    generateReadme(plugin) {
        return `# ${plugin.meta.name}

${plugin.meta.description}

## Installation

\`\`\`bash
# Using PhilJS CLI
philjs plugin add ${plugin.meta.name}

# Or with npm
npm install ${plugin.meta.name}
\`\`\`

## Usage

\`\`\`typescript
import { defineConfig } from '@philjs/core';
import ${plugin.meta.name.replace(/^philjs-plugin-/, "")}Plugin from '${plugin.meta.name}';

export default defineConfig({
  plugins: [
    ${plugin.meta.name.replace(/^philjs-plugin-/, "")}Plugin({
      // Configuration options
    }),
  ],
});
\`\`\`

## Configuration

${plugin.configSchema ? this.generateConfigDocs(plugin.configSchema) : "No configuration options available."}

## License

${plugin.meta.license || "MIT"}

## Author

${plugin.meta.author || ""}
`;
    },
    /**
     * Generate configuration documentation
     */
    generateConfigDocs(schema) {
        if (!schema.properties)
            return "No options";
        let docs = "| Option | Type | Description | Default |\n";
        docs += "|--------|------|-------------|----------|\n";
        for (const [key, prop] of Object.entries(schema.properties)) {
            const p = prop;
            docs += `| \`${key}\` | ${p.type || "any"} | ${p.description || "-"} | ${JSON.stringify(p.default) || "-"} |\n`;
        }
        return docs;
    },
    /**
     * Generate tsconfig.json
     */
    generateTSConfig() {
        return {
            compilerOptions: {
                target: "ES2020",
                module: "ESNext",
                lib: ["ES2020", "DOM"],
                declaration: true,
                declarationMap: true,
                outDir: "./dist",
                rootDir: "./src",
                strict: true,
                esModuleInterop: true,
                skipLibCheck: true,
                moduleResolution: "node",
            },
            include: ["src/**/*"],
            exclude: ["node_modules", "dist"],
        };
    },
};
/**
 * Plugin development helpers
 */
export const pluginHelpers = {
    /**
     * Create a logger that prefixes messages
     */
    createLogger(pluginName) {
        const prefix = `[${pluginName}]`;
        return {
            info: (msg, ...args) => console.log(prefix, msg, ...args),
            warn: (msg, ...args) => console.warn(prefix, msg, ...args),
            error: (msg, ...args) => console.error(prefix, msg, ...args),
            debug: (msg, ...args) => console.debug(prefix, msg, ...args),
            success: (msg, ...args) => console.log(prefix, "✓", msg, ...args),
        };
    },
    /**
     * Async retry utility
     */
    async retry(fn, options = {}) {
        const { retries = 3, delay = 1000 } = options;
        for (let i = 0; i < retries; i++) {
            try {
                return await fn();
            }
            catch (error) {
                if (i === retries - 1)
                    throw error;
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }
        throw new Error("Max retries exceeded");
    },
    /**
     * Debounce utility
     */
    debounce(fn, delay) {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => fn(...args), delay);
        };
    },
};
// Types are already exported at the top of this file
//# sourceMappingURL=index.js.map