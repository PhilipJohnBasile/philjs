/**
 * Tests for Tailwind CSS plugin
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTailwindPlugin, tailwindUtils } from "./index.js";
import type { PluginContext } from "philjs-core/plugin-system";

describe("createTailwindPlugin", () => {
  it("should create plugin with correct metadata", () => {
    const plugin = createTailwindPlugin();

    expect(plugin.meta.name).toBe("philjs-plugin-tailwind");
    expect(plugin.meta.version).toBe("1.0.0");
    expect(plugin.meta.philjs).toBe("^2.0.0");
  });

  it("should accept custom configuration", () => {
    const plugin = createTailwindPlugin({
      jit: false,
      darkMode: "media",
      content: ["./custom/**/*.tsx"],
    });

    expect(plugin).toBeDefined();
    expect(plugin.configSchema).toBeDefined();
  });

  it("should have required hooks", () => {
    const plugin = createTailwindPlugin();

    expect(plugin.hooks?.init).toBeDefined();
    expect(plugin.hooks?.buildStart).toBeDefined();
    expect(plugin.hooks?.buildEnd).toBeDefined();
  });

  it("should have vitePlugin method", () => {
    const plugin = createTailwindPlugin();

    expect(plugin.vitePlugin).toBeDefined();
  });

  it("should have setup method", () => {
    const plugin = createTailwindPlugin();

    expect(plugin.setup).toBeDefined();
  });
});

describe("plugin.setup", () => {
  let mockContext: PluginContext;
  let writeFileCalls: Array<{ path: string; content: string }>;
  let existsCalls: string[];

  beforeEach(() => {
    writeFileCalls = [];
    existsCalls = [];

    mockContext = {
      version: "2.0.0",
      root: "/test/project",
      mode: "development",
      config: {},
      logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
        success: vi.fn(),
      },
      fs: {
        readFile: vi.fn(),
        writeFile: vi.fn(async (path: string, content: string) => {
          writeFileCalls.push({ path, content });
        }),
        exists: vi.fn(async (path: string) => {
          existsCalls.push(path);
          return false; // Default to not existing
        }),
        mkdir: vi.fn(),
        readdir: vi.fn(),
        copy: vi.fn(),
        remove: vi.fn(),
      },
      utils: {
        resolve: vi.fn((...paths: string[]) => paths.join("/")),
        exec: vi.fn(),
        getPackageManager: vi.fn(async () => "npm"),
        installPackages: vi.fn(),
        readPackageJson: vi.fn(async () => ({
          name: "test-project",
          dependencies: {},
          devDependencies: {},
        })),
        writePackageJson: vi.fn(),
      },
    };
  });

  it("should create tailwind.config.js", async () => {
    const plugin = createTailwindPlugin();
    await plugin.setup!({}, mockContext);

    const tailwindConfig = writeFileCalls.find((call) =>
      call.path === "tailwind.config.js"
    );

    expect(tailwindConfig).toBeDefined();
    expect(tailwindConfig?.content).toContain("export default");
    expect(tailwindConfig?.content).toContain("content:");
  });

  it("should create postcss.config.js", async () => {
    const plugin = createTailwindPlugin();
    await plugin.setup!({}, mockContext);

    const postcssConfig = writeFileCalls.find((call) =>
      call.path === "postcss.config.js"
    );

    expect(postcssConfig).toBeDefined();
    expect(postcssConfig?.content).toContain("tailwindcss");
    expect(postcssConfig?.content).toContain("autoprefixer");
  });

  it("should create base CSS file", async () => {
    const plugin = createTailwindPlugin();
    await plugin.setup!({}, mockContext);

    const cssFile = writeFileCalls.find((call) =>
      call.path === "src/styles/tailwind.css"
    );

    expect(cssFile).toBeDefined();
    expect(cssFile?.content).toContain("@tailwind base");
    expect(cssFile?.content).toContain("@tailwind components");
    expect(cssFile?.content).toContain("@tailwind utilities");
  });

  it("should skip existing files", async () => {
    mockContext.fs.exists = vi.fn(async () => true);

    const plugin = createTailwindPlugin();
    await plugin.setup!({}, mockContext);

    expect(writeFileCalls.length).toBe(0);
    expect(mockContext.logger.warn).toHaveBeenCalled();
  });

  it("should install dependencies if needed", async () => {
    const plugin = createTailwindPlugin();
    await plugin.setup!({}, mockContext);

    expect(mockContext.utils.installPackages).toHaveBeenCalledWith(
      ["tailwindcss", "autoprefixer", "postcss"],
      true
    );
  });

  it("should use custom content paths", async () => {
    const plugin = createTailwindPlugin({
      content: ["./custom/**/*.tsx"],
    });
    await plugin.setup!({}, mockContext);

    const tailwindConfig = writeFileCalls.find((call) =>
      call.path === "tailwind.config.js"
    );

    expect(tailwindConfig?.content).toContain("./custom/**/*.tsx");
  });
});

describe("tailwindUtils", () => {
  describe("mergeClasses", () => {
    it("should merge classes without duplicates", () => {
      const result = tailwindUtils.mergeClasses("px-4 py-2", "bg-blue-500");
      expect(result).toBe("px-4 py-2 bg-blue-500");
    });

    it("should remove duplicate classes", () => {
      const result = tailwindUtils.mergeClasses("px-4 py-2", "px-4");
      expect(result.split(" ").filter((c) => c === "px-4").length).toBe(1);
    });

    it("should handle undefined and null", () => {
      const result = tailwindUtils.mergeClasses("px-4", undefined, null, "py-2");
      expect(result).toContain("px-4");
      expect(result).toContain("py-2");
    });

    it("should handle false values", () => {
      const result = tailwindUtils.mergeClasses("px-4", false && "hidden", "py-2");
      expect(result).toBe("px-4 py-2");
    });
  });

  describe("cssVarsToTheme", () => {
    it("should convert CSS variables to theme", () => {
      const result = tailwindUtils.cssVarsToTheme({
        "--primary-color": "#3b82f6",
        "--secondary-color": "#8b5cf6",
      });

      expect(result.primary).toBeDefined();
      expect(result.secondary).toBeDefined();
    });

    it("should handle nested variables", () => {
      const result = tailwindUtils.cssVarsToTheme({
        "--color-primary-500": "#3b82f6",
        "--color-primary-600": "#2563eb",
      });

      expect(result.color.primary).toBeDefined();
    });
  });

  describe("detectContentPaths", () => {
    it("should detect content paths", async () => {
      const result = await tailwindUtils.detectContentPaths("/test/project");

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("responsive", () => {
    it("should generate responsive classes", () => {
      const result = tailwindUtils.responsive("text-base", {
        md: "text-lg",
        lg: "text-xl",
      });

      expect(result).toContain("text-base");
      expect(result).toContain("md:text-lg");
      expect(result).toContain("lg:text-xl");
    });
  });

  describe("withStates", () => {
    it("should generate state variants", () => {
      const result = tailwindUtils.withStates("bg-blue-500");

      expect(result).toContain("bg-blue-500");
      expect(result).toContain("hover:bg-blue-500");
      expect(result).toContain("focus:bg-blue-500");
      expect(result).toContain("active:bg-blue-500");
    });

    it("should accept custom states", () => {
      const result = tailwindUtils.withStates("bg-blue-500", ["hover", "focus"]);

      expect(result).toContain("hover:bg-blue-500");
      expect(result).toContain("focus:bg-blue-500");
      expect(result).not.toContain("active:bg-blue-500");
    });
  });
});

describe("vitePlugin", () => {
  it("should return Vite plugin configuration", () => {
    const plugin = createTailwindPlugin();
    const vitePlugin = plugin.vitePlugin!({});

    expect(vitePlugin).toBeDefined();
    expect(vitePlugin.name).toBe("philjs-tailwind");
  });

  it("should configure PostCSS", () => {
    const plugin = createTailwindPlugin();
    const vitePlugin = plugin.vitePlugin!({});

    expect(vitePlugin.config).toBeDefined();
  });
});

describe("plugin hooks", () => {
  let mockContext: PluginContext;

  beforeEach(() => {
    mockContext = {
      version: "2.0.0",
      root: "/test/project",
      mode: "development",
      config: {},
      logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
        success: vi.fn(),
      },
      fs: {
        readFile: vi.fn(),
        writeFile: vi.fn(),
        exists: vi.fn(),
        mkdir: vi.fn(),
        readdir: vi.fn(),
        copy: vi.fn(),
        remove: vi.fn(),
      },
      utils: {
        resolve: vi.fn(),
        exec: vi.fn(),
        getPackageManager: vi.fn(),
        installPackages: vi.fn(),
        readPackageJson: vi.fn(),
        writePackageJson: vi.fn(),
      },
    };
  });

  it("should execute init hook", async () => {
    const plugin = createTailwindPlugin();
    await plugin.hooks!.init!(mockContext);

    expect(mockContext.logger.info).toHaveBeenCalledWith(
      "Tailwind CSS plugin initialized"
    );
  });

  it("should execute buildStart hook", async () => {
    const plugin = createTailwindPlugin();
    const buildConfig = {
      entry: "src/index.ts",
      outDir: "dist",
      minify: true,
      sourcemap: true,
      target: "es2020",
      format: "esm" as const,
      splitting: true,
    };

    await plugin.hooks!.buildStart!(mockContext, buildConfig);

    expect(mockContext.logger.debug).toHaveBeenCalled();
  });

  it("should execute buildEnd hook", async () => {
    const plugin = createTailwindPlugin();
    const buildResult = {
      success: true,
      duration: 1000,
      outputs: [
        { path: "dist/style.css", size: 50000, type: "css" as const },
      ],
    };

    await plugin.hooks!.buildEnd!(mockContext, buildResult);

    expect(mockContext.logger.success).toHaveBeenCalled();
  });
});
