/**
 * PhilJS Tailwind CSS Plugin
 * Automatic Tailwind CSS setup and optimization
 */
import * as path from "path";
import * as fs from "fs/promises";
/**
 * Default configuration
 */
const defaultConfig = {
    jit: true,
    darkMode: "class",
    content: ["./src/**/*.{js,jsx,ts,tsx}", "./index.html"],
    optimization: {
        purge: true,
        minify: true,
        removeComments: true,
    },
};
/**
 * Tailwind config template
 */
const tailwindConfigTemplate = (config) => `/** @type {import('tailwindcss').Config} */
export default {
  content: ${JSON.stringify(config.content || defaultConfig.content, null, 2)},
  darkMode: ${JSON.stringify(config.darkMode || defaultConfig.darkMode)},
  theme: {
    extend: ${JSON.stringify(config.theme || {}, null, 6)},
  },
  plugins: [
    ${config.plugins?.map((p) => `require('${p}')`).join(",\n    ") || ""}
  ],
};
`;
/**
 * PostCSS config template
 */
const postcssConfigTemplate = () => `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`;
/**
 * Base CSS template
 */
const baseCssTemplate = () => `@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom utilities */
@layer components {
  .btn {
    @apply px-4 py-2 rounded-lg font-medium transition-colors;
  }

  .btn-primary {
    @apply bg-blue-600 text-white hover:bg-blue-700;
  }

  .btn-secondary {
    @apply bg-gray-200 text-gray-800 hover:bg-gray-300;
  }

  .card {
    @apply bg-white rounded-lg shadow-md p-6;
  }

  .input {
    @apply w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500;
  }
}

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
}
`;
/**
 * Create Tailwind plugin
 */
export function createTailwindPlugin(userConfig = {}) {
    const config = { ...defaultConfig, ...userConfig };
    return {
        meta: {
            name: "philjs-plugin-tailwind",
            version: "1.0.0",
            description: "Automatic Tailwind CSS setup and optimization for PhilJS",
            author: "PhilJS Team",
            homepage: "https://philjs.dev/plugins/tailwind",
            repository: "https://github.com/yourusername/philjs",
            license: "MIT",
            keywords: ["tailwind", "css", "styling", "design"],
            philjs: "^2.0.0",
        },
        configSchema: {
            type: "object",
            properties: {
                configPath: {
                    type: "string",
                    description: "Path to Tailwind config file",
                },
                jit: {
                    type: "boolean",
                    description: "Enable JIT mode",
                    default: true,
                },
                content: {
                    type: "array",
                    items: { type: "string" },
                    description: "Content paths for Tailwind",
                },
                darkMode: {
                    type: "string",
                    enum: ["media", "class", false],
                    description: "Dark mode strategy",
                    default: "class",
                },
            },
        },
        async setup(pluginConfig, ctx) {
            const mergedConfig = { ...config, ...pluginConfig };
            ctx.logger.info("Setting up Tailwind CSS...");
            // Check if Tailwind is already configured
            const hasTailwindConfig = await ctx.fs.exists("tailwind.config.js");
            const hasPostCSSConfig = await ctx.fs.exists("postcss.config.js");
            // Create Tailwind config if it doesn't exist
            if (!hasTailwindConfig) {
                ctx.logger.info("Creating tailwind.config.js...");
                await ctx.fs.writeFile("tailwind.config.js", tailwindConfigTemplate(mergedConfig));
            }
            else {
                ctx.logger.warn("tailwind.config.js already exists, skipping...");
            }
            // Create PostCSS config if it doesn't exist
            if (!hasPostCSSConfig) {
                ctx.logger.info("Creating postcss.config.js...");
                await ctx.fs.writeFile("postcss.config.js", postcssConfigTemplate());
            }
            else {
                ctx.logger.warn("postcss.config.js already exists, skipping...");
            }
            // Create base CSS file
            const cssPath = "src/styles/tailwind.css";
            const hasCss = await ctx.fs.exists(cssPath);
            if (!hasCss) {
                ctx.logger.info(`Creating ${cssPath}...`);
                await ctx.fs.mkdir("src/styles");
                await ctx.fs.writeFile(cssPath, baseCssTemplate());
                ctx.logger.success("Created Tailwind base styles");
            }
            // Update package.json to ensure Tailwind is installed
            const pkg = await ctx.utils.readPackageJson();
            const requiredDeps = {
                tailwindcss: "^3.4.0",
                autoprefixer: "^10.4.16",
                postcss: "^8.4.32",
            };
            let needsInstall = false;
            for (const [dep, version] of Object.entries(requiredDeps)) {
                const devDeps = pkg['devDependencies'];
                const deps = pkg['dependencies'];
                if (!devDeps?.[dep] && !deps?.[dep]) {
                    if (!pkg['devDependencies']) {
                        pkg['devDependencies'] = {};
                    }
                    pkg['devDependencies'][dep] = version;
                    needsInstall = true;
                }
            }
            if (needsInstall) {
                await ctx.utils.writePackageJson(pkg);
                ctx.logger.info("Installing Tailwind CSS dependencies...");
                await ctx.utils.installPackages(Object.keys(requiredDeps), true);
            }
            ctx.logger.success("Tailwind CSS setup complete!");
            ctx.logger.info(`\nImport the base styles in your app:\nimport './styles/tailwind.css';`);
        },
        vitePlugin(pluginConfig) {
            const mergedConfig = { ...config, ...pluginConfig };
            const plugin = {
                name: "philjs-tailwind",
                async config(viteConfig) {
                    const tailwindcss = (await import("tailwindcss")).default;
                    const autoprefixer = (await import("autoprefixer")).default;
                    return {
                        css: {
                            postcss: {
                                plugins: [
                                    tailwindcss,
                                    autoprefixer,
                                ],
                            },
                        },
                    };
                },
                configResolved(resolvedConfig) {
                    const isProd = resolvedConfig.mode === "production";
                    // Apply optimization in production
                    if (isProd && mergedConfig.optimization?.purge) {
                        // Tailwind handles purging automatically via content config
                    }
                },
            };
            return plugin;
        },
        hooks: {
            async init(ctx) {
                ctx.logger.info("Tailwind CSS plugin initialized");
            },
            async buildStart(ctx, buildConfig) {
                // Ensure Tailwind processing is enabled
                ctx.logger.debug("Processing Tailwind CSS...");
            },
            async buildEnd(ctx, result) {
                if (result.success) {
                    // Find CSS output
                    const cssOutputs = result.outputs.filter((o) => o.type === "css");
                    if (cssOutputs.length > 0) {
                        const totalSize = cssOutputs.reduce((sum, o) => sum + o.size, 0);
                        ctx.logger.success(`Tailwind CSS processed: ${(totalSize / 1024).toFixed(2)} KB`);
                    }
                }
            },
        },
    };
}
/**
 * Default export
 */
export default createTailwindPlugin();
/**
 * Tailwind utility helpers
 */
export const tailwindUtils = {
    /**
     * Generate Tailwind class validator
     */
    createClassValidator() {
        return (className) => {
            // Simple validation - can be enhanced with Tailwind IntelliSense
            return typeof className === "string" && className.length > 0;
        };
    },
    /**
     * Merge Tailwind classes (removes duplicates, handles conflicts)
     */
    mergeClasses(...classes) {
        const validClasses = classes.filter(Boolean);
        const classArray = validClasses.flatMap((c) => c.split(" "));
        // Remove duplicates (keep last occurrence for conflict resolution)
        const seen = new Set();
        const merged = classArray.reverse().filter((c) => {
            if (seen.has(c))
                return false;
            seen.add(c);
            return true;
        });
        return merged.reverse().join(" ");
    },
    /**
     * Convert CSS variables to Tailwind theme
     */
    cssVarsToTheme(cssVars) {
        const theme = {};
        for (const [key, value] of Object.entries(cssVars)) {
            // Convert --primary-color to primary.color
            const pathParts = key.replace(/^--/, "").split("-");
            let current = theme;
            for (let i = 0; i < pathParts.length - 1; i++) {
                current[pathParts[i]] = current[pathParts[i]] || {};
                current = current[pathParts[i]];
            }
            current[pathParts[pathParts.length - 1]] = value;
        }
        return theme;
    },
    /**
     * Detect content paths from project structure
     */
    async detectContentPaths(rootDir) {
        const patterns = [];
        const dirs = ["src", "pages", "components", "app", "lib"];
        for (const dir of dirs) {
            try {
                const fullPath = path.join(rootDir, dir);
                await fs.access(fullPath);
                patterns.push(`./${dir}/**/*.{js,jsx,ts,tsx,html,vue,svelte}`);
            }
            catch {
                // Directory doesn't exist, skip
            }
        }
        // Always include index.html if it exists
        try {
            await fs.access(path.join(rootDir, "index.html"));
            patterns.push("./index.html");
        }
        catch {
            // index.html doesn't exist
        }
        return patterns.length > 0 ? patterns : ["./src/**/*.{js,jsx,ts,tsx}", "./index.html"];
    },
    /**
     * Generate responsive utilities helper
     */
    responsive(base, variants) {
        const classes = [base];
        for (const [breakpoint, value] of Object.entries(variants)) {
            classes.push(`${breakpoint}:${value}`);
        }
        return classes.join(" ");
    },
    /**
     * Generate state variants
     */
    withStates(base, states = ["hover", "focus", "active"]) {
        const classes = [base];
        for (const state of states) {
            classes.push(`${state}:${base}`);
        }
        return classes.join(" ");
    },
};
/**
 * Re-export utilities
 */
export * from './utils.js';
export * from './content-detector.js';
// theme-generator.js exports are excluded due to mergeThemes conflict with utils.js
export { generateColorPalette, generateBrandTheme, generateTypographyScale, generateSpacingScale, generateBorderRadiusScale, generateShadowScale, generateBreakpoints, generateFontFamilies, generateCompleteTheme, cssVarsToTheme, presetThemes, } from './theme-generator.js';
export * from './optimizer.js';
//# sourceMappingURL=index.js.map