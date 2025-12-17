/**
 * PhilJS Vite Plugin
 * Integrates PhilJS features into Vite build pipeline
 */
import * as pc from "picocolors";
export function philJSPlugin() {
    return {
        name: "philjs",
        config() {
            return {
                esbuild: {
                    jsxFactory: "jsx",
                    jsxFragment: "Fragment",
                    jsxInject: `import { jsx, Fragment } from 'philjs-core/jsx-runtime'`,
                },
                resolve: {
                    alias: {
                        "philjs-core/jsx-runtime": "philjs-core/dist/jsx-runtime.js",
                    },
                },
            };
        },
        configResolved(config) {
            console.log(pc.cyan("🔧 PhilJS plugin loaded") +
                pc.dim(` (mode: ${config.mode})`));
        },
        transform(code, id) {
            // Transform PhilJS-specific syntax
            if (id.endsWith(".tsx") || id.endsWith(".jsx")) {
                // Add automatic signal tracking for dev mode
                if (process.env.NODE_ENV !== "production") {
                    // Inject dev-only helpers
                    return {
                        code: `import { __DEV__ } from 'philjs-core';\n${code}`,
                        map: null,
                    };
                }
            }
            return null;
        },
        handleHotUpdate({ file, server }) {
            // Custom HMR for PhilJS components
            if (file.endsWith(".tsx") || file.endsWith(".jsx")) {
                console.log(pc.green("♻️  ") + pc.dim(`Updated: ${file}`));
            }
        },
        buildStart() {
            console.log(pc.cyan("\n🚀 Building with PhilJS...\n"));
        },
        buildEnd() {
            console.log(pc.green("\n✓ PhilJS build complete!\n"));
        },
    };
}
/**
 * Plugin for SSR builds
 */
export function philJSSSRPlugin() {
    return {
        name: "philjs-ssr",
        config() {
            return {
                ssr: {
                    noExternal: ["philjs-core", "philjs-router", "philjs-ssr"],
                },
            };
        },
        transform(code, id, options) {
            if (options?.ssr && id.includes("philjs")) {
                // SSR-specific transformations
                return {
                    code,
                    map: null,
                };
            }
            return null;
        },
    };
}
//# sourceMappingURL=vite-plugin.js.map