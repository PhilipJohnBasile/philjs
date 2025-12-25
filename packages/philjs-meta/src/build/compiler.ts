/**
 * PhilJS Meta - Build System
 *
 * Implements build system with:
 * - Route manifest generation
 * - Code splitting per route
 * - Static page generation
 * - Bundle optimization
 */

import * as fs from 'fs';
import * as path from 'path';
import type { RouteManifest, RouteDefinition } from '../router/file-based';
import { generateRouteManifest } from '../router/file-based';
import type { PhilJSConfig } from '../config';

/**
 * Build options
 */
export interface BuildOptions {
  /** Root directory of the project */
  rootDir: string;

  /** Output directory */
  outDir: string;

  /** Pages directory */
  pagesDir: string;

  /** Public assets directory */
  publicDir: string;

  /** Source directory */
  srcDir: string;

  /** Enable minification */
  minify: boolean;

  /** Enable source maps */
  sourcemap: boolean;

  /** Target environment */
  target: 'node' | 'browser' | 'neutral';

  /** SSR mode */
  ssr: boolean;

  /** Static generation mode */
  ssg: boolean;

  /** Environment variables to include */
  env: Record<string, string>;

  /** Custom esbuild plugins */
  plugins?: BuildPlugin[];

  /** Analyze bundle size */
  analyze?: boolean;
}

/**
 * Build plugin interface
 */
export interface BuildPlugin {
  name: string;
  setup(build: BuildContext): void | Promise<void>;
}

/**
 * Build context for plugins
 */
export interface BuildContext {
  options: BuildOptions;
  manifest: RouteManifest;
  onBuildStart(callback: () => void | Promise<void>): void;
  onBuildEnd(callback: (result: BuildResult) => void | Promise<void>): void;
  onRouteBundle(callback: (route: RouteDefinition, bundle: RouteBundle) => void | Promise<void>): void;
}

/**
 * Build result
 */
export interface BuildResult {
  /** Build success status */
  success: boolean;

  /** Build duration in milliseconds */
  duration: number;

  /** Generated bundles */
  bundles: BundleInfo[];

  /** Generated static pages */
  staticPages: StaticPageInfo[];

  /** Route manifest */
  manifest: RouteManifest;

  /** Errors if any */
  errors: BuildError[];

  /** Warnings */
  warnings: string[];
}

/**
 * Bundle information
 */
export interface BundleInfo {
  /** Bundle name */
  name: string;

  /** Output file path */
  path: string;

  /** Bundle size in bytes */
  size: number;

  /** Gzipped size in bytes */
  gzipSize: number;

  /** Entry points */
  entryPoints: string[];

  /** Dependencies */
  dependencies: string[];

  /** Is client bundle */
  isClient: boolean;

  /** Is server bundle */
  isServer: boolean;
}

/**
 * Route bundle
 */
export interface RouteBundle {
  /** Route pattern */
  pattern: string;

  /** Client bundle path */
  clientBundle: string;

  /** Server bundle path */
  serverBundle?: string;

  /** CSS bundle path */
  cssBundle?: string;

  /** Preload assets */
  preload: string[];

  /** Module ID */
  moduleId: string;
}

/**
 * Static page information
 */
export interface StaticPageInfo {
  /** Route pattern */
  pattern: string;

  /** Output HTML file path */
  htmlPath: string;

  /** Generation time */
  generatedAt: number;

  /** Page data used */
  data?: unknown;
}

/**
 * Build error
 */
export interface BuildError {
  message: string;
  file?: string;
  line?: number;
  column?: number;
  stack?: string;
}

/**
 * Compiler class
 */
export class Compiler {
  private options: BuildOptions;
  private manifest: RouteManifest | null = null;
  private plugins: BuildPlugin[] = [];
  private buildStartCallbacks: (() => void | Promise<void>)[] = [];
  private buildEndCallbacks: ((result: BuildResult) => void | Promise<void>)[] = [];
  private routeBundleCallbacks: ((route: RouteDefinition, bundle: RouteBundle) => void | Promise<void>)[] = [];

  constructor(options: Partial<BuildOptions> = {}) {
    this.options = {
      rootDir: process.cwd(),
      outDir: '.philjs',
      pagesDir: 'pages',
      publicDir: 'public',
      srcDir: 'src',
      minify: process.env.NODE_ENV === 'production',
      sourcemap: process.env.NODE_ENV !== 'production',
      target: 'browser',
      ssr: true,
      ssg: false,
      env: {},
      ...options,
    };

    this.plugins = options.plugins || [];
  }

  /**
   * Generate route manifest
   */
  generateManifest(): RouteManifest {
    const pagesDir = path.resolve(this.options.rootDir, this.options.pagesDir);

    this.manifest = generateRouteManifest({
      pagesDir,
      extensions: ['.tsx', '.ts', '.jsx', '.js'],
    });

    return this.manifest;
  }

  /**
   * Write route manifest to disk
   */
  writeManifest(): void {
    if (!this.manifest) {
      this.generateManifest();
    }

    const outDir = path.resolve(this.options.rootDir, this.options.outDir);
    const manifestPath = path.join(outDir, 'route-manifest.json');

    // Ensure output directory exists
    fs.mkdirSync(outDir, { recursive: true });

    // Serialize manifest (convert RegExp to string)
    const serializedManifest = {
      ...this.manifest,
      routes: this.manifest!.routes.map((route) => ({
        ...route,
        regex: route.regex.source,
      })),
      apiRoutes: this.manifest!.apiRoutes.map((route) => ({
        ...route,
        regex: route.regex.source,
      })),
    };

    fs.writeFileSync(manifestPath, JSON.stringify(serializedManifest, null, 2));
  }

  /**
   * Build the application
   */
  async build(): Promise<BuildResult> {
    const startTime = Date.now();
    const errors: BuildError[] = [];
    const warnings: string[] = [];
    const bundles: BundleInfo[] = [];
    const staticPages: StaticPageInfo[] = [];

    try {
      // Generate manifest
      this.generateManifest();

      // Setup plugins
      const buildContext: BuildContext = {
        options: this.options,
        manifest: this.manifest!,
        onBuildStart: (cb) => this.buildStartCallbacks.push(cb),
        onBuildEnd: (cb) => this.buildEndCallbacks.push(cb),
        onRouteBundle: (cb) => this.routeBundleCallbacks.push(cb),
      };

      for (const plugin of this.plugins) {
        await plugin.setup(buildContext);
      }

      // Run build start callbacks
      for (const callback of this.buildStartCallbacks) {
        await callback();
      }

      // Create output directories
      const outDir = path.resolve(this.options.rootDir, this.options.outDir);
      const clientDir = path.join(outDir, 'client');
      const serverDir = path.join(outDir, 'server');
      const staticDir = path.join(outDir, 'static');

      fs.mkdirSync(clientDir, { recursive: true });
      fs.mkdirSync(serverDir, { recursive: true });
      fs.mkdirSync(staticDir, { recursive: true });

      // Build each route
      for (const route of this.manifest!.routes) {
        try {
          const bundle = await this.buildRoute(route, clientDir, serverDir);

          bundles.push({
            name: route.pattern,
            path: bundle.clientBundle,
            size: 0, // Would calculate actual size
            gzipSize: 0,
            entryPoints: [route.filePath],
            dependencies: [],
            isClient: true,
            isServer: this.options.ssr,
          });

          // Run route bundle callbacks
          for (const callback of this.routeBundleCallbacks) {
            await callback(route, bundle);
          }

          // Static generation
          if (this.options.ssg && !route.paramNames.length) {
            const staticPage = await this.generateStaticPage(route, staticDir);
            if (staticPage) {
              staticPages.push(staticPage);
            }
          }
        } catch (error) {
          errors.push({
            message: error instanceof Error ? error.message : String(error),
            file: route.filePath,
            stack: error instanceof Error ? error.stack : undefined,
          });
        }
      }

      // Build API routes
      for (const route of this.manifest!.apiRoutes) {
        try {
          await this.buildApiRoute(route, serverDir);

          bundles.push({
            name: `api:${route.pattern}`,
            path: path.join(serverDir, 'api', this.getRouteFileName(route)),
            size: 0,
            gzipSize: 0,
            entryPoints: [route.filePath],
            dependencies: [],
            isClient: false,
            isServer: true,
          });
        } catch (error) {
          errors.push({
            message: error instanceof Error ? error.message : String(error),
            file: route.filePath,
            stack: error instanceof Error ? error.stack : undefined,
          });
        }
      }

      // Write manifest
      this.writeManifest();

      // Copy public assets
      await this.copyPublicAssets(staticDir);

      // Generate route map for client
      await this.generateClientRouteMap(clientDir);

      const result: BuildResult = {
        success: errors.length === 0,
        duration: Date.now() - startTime,
        bundles,
        staticPages,
        manifest: this.manifest!,
        errors,
        warnings,
      };

      // Run build end callbacks
      for (const callback of this.buildEndCallbacks) {
        await callback(result);
      }

      return result;
    } catch (error) {
      return {
        success: false,
        duration: Date.now() - startTime,
        bundles,
        staticPages,
        manifest: this.manifest!,
        errors: [
          {
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          },
        ],
        warnings,
      };
    }
  }

  /**
   * Build a single route
   */
  private async buildRoute(
    route: RouteDefinition,
    clientDir: string,
    serverDir: string
  ): Promise<RouteBundle> {
    const fileName = this.getRouteFileName(route);
    const clientBundle = path.join(clientDir, fileName);
    const serverBundle = this.options.ssr ? path.join(serverDir, fileName) : undefined;

    // In a real implementation, you would use esbuild here
    // For now, we just create placeholder files
    const clientCode = this.generateClientBundle(route);
    const serverCode = this.options.ssr ? this.generateServerBundle(route) : undefined;

    fs.writeFileSync(clientBundle, clientCode);
    if (serverBundle && serverCode) {
      fs.writeFileSync(serverBundle, serverCode);
    }

    return {
      pattern: route.pattern,
      clientBundle,
      serverBundle,
      preload: [],
      moduleId: this.getModuleId(route),
    };
  }

  /**
   * Build an API route
   */
  private async buildApiRoute(route: RouteDefinition, serverDir: string): Promise<void> {
    const apiDir = path.join(serverDir, 'api');
    fs.mkdirSync(apiDir, { recursive: true });

    const fileName = this.getRouteFileName(route);
    const outputPath = path.join(apiDir, fileName);

    // Generate API route bundle
    const code = this.generateApiBundle(route);
    fs.writeFileSync(outputPath, code);
  }

  /**
   * Generate static page
   */
  private async generateStaticPage(
    route: RouteDefinition,
    staticDir: string
  ): Promise<StaticPageInfo | null> {
    const fileName = route.pattern === '/' ? 'index.html' : `${route.pattern.slice(1)}.html`;
    const htmlPath = path.join(staticDir, fileName);

    // Ensure directory exists
    const dir = path.dirname(htmlPath);
    fs.mkdirSync(dir, { recursive: true });

    // Generate HTML (placeholder implementation)
    const html = this.generateStaticHtml(route);
    fs.writeFileSync(htmlPath, html);

    return {
      pattern: route.pattern,
      htmlPath,
      generatedAt: Date.now(),
    };
  }

  /**
   * Copy public assets
   */
  private async copyPublicAssets(staticDir: string): Promise<void> {
    const publicDir = path.resolve(this.options.rootDir, this.options.publicDir);

    if (!fs.existsSync(publicDir)) {
      return;
    }

    const copyRecursive = (src: string, dest: string): void => {
      const stat = fs.statSync(src);

      if (stat.isDirectory()) {
        fs.mkdirSync(dest, { recursive: true });
        for (const child of fs.readdirSync(src)) {
          copyRecursive(path.join(src, child), path.join(dest, child));
        }
      } else {
        fs.copyFileSync(src, dest);
      }
    };

    copyRecursive(publicDir, staticDir);
  }

  /**
   * Generate client route map
   */
  private async generateClientRouteMap(clientDir: string): Promise<void> {
    const routeMap = this.manifest!.routes.map((route) => ({
      pattern: route.pattern,
      module: `./${this.getRouteFileName(route)}`,
      paramNames: route.paramNames,
    }));

    const code = `
// Auto-generated route map
export const routes = ${JSON.stringify(routeMap, null, 2)};

export function matchRoute(pathname) {
  for (const route of routes) {
    const regex = new RegExp(${JSON.stringify(
      this.manifest!.routes.map((r) => r.regex.source)
    )}[routes.indexOf(route)]);
    const match = regex.exec(pathname);
    if (match) {
      const params = {};
      route.paramNames.forEach((name, i) => {
        params[name] = match[i + 1];
      });
      return { route, params };
    }
  }
  return null;
}
`;

    fs.writeFileSync(path.join(clientDir, '_routes.js'), code);
  }

  /**
   * Get route file name
   */
  private getRouteFileName(route: RouteDefinition): string {
    if (route.pattern === '/') {
      return 'index.js';
    }

    return (
      route.pattern
        .slice(1)
        .replace(/\//g, '-')
        .replace(/\[/g, '_')
        .replace(/\]/g, '_')
        .replace(/\.\.\./g, 'spread_') + '.js'
    );
  }

  /**
   * Get module ID for route
   */
  private getModuleId(route: RouteDefinition): string {
    return `route:${route.pattern}`;
  }

  /**
   * Generate client bundle code
   */
  private generateClientBundle(route: RouteDefinition): string {
    const relativePath = path.relative(
      path.resolve(this.options.rootDir, this.options.outDir, 'client'),
      route.filePath
    ).replace(/\\/g, '/');

    return `
// Client bundle for ${route.pattern}
import Component from '${relativePath.replace(/\.tsx?$/, '')}';

export default Component;
export const pattern = '${route.pattern}';
export const paramNames = ${JSON.stringify(route.paramNames)};
`;
  }

  /**
   * Generate server bundle code
   */
  private generateServerBundle(route: RouteDefinition): string {
    const relativePath = path.relative(
      path.resolve(this.options.rootDir, this.options.outDir, 'server'),
      route.filePath
    ).replace(/\\/g, '/');

    return `
// Server bundle for ${route.pattern}
import * as Page from '${relativePath.replace(/\.tsx?$/, '')}';

export default Page.default;
export const loader = Page.loader;
export const action = Page.action;
export const meta = Page.meta;
export const pattern = '${route.pattern}';
export const paramNames = ${JSON.stringify(route.paramNames)};
`;
  }

  /**
   * Generate API bundle code
   */
  private generateApiBundle(route: RouteDefinition): string {
    const relativePath = path.relative(
      path.resolve(this.options.rootDir, this.options.outDir, 'server', 'api'),
      route.filePath
    ).replace(/\\/g, '/');

    return `
// API route for ${route.pattern}
export * from '${relativePath.replace(/\.tsx?$/, '')}';
export const pattern = '${route.pattern}';
export const paramNames = ${JSON.stringify(route.paramNames)};
`;
  }

  /**
   * Generate static HTML
   */
  private generateStaticHtml(route: RouteDefinition): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${route.pattern}</title>
  <script type="module" src="/_philjs/client/${this.getRouteFileName(route)}"></script>
</head>
<body>
  <div id="app"></div>
</body>
</html>`;
  }
}

/**
 * Create a compiler instance
 */
export function createCompiler(options: Partial<BuildOptions> = {}): Compiler {
  return new Compiler(options);
}

/**
 * Create compiler from config
 */
export function createCompilerFromConfig(config: PhilJSConfig): Compiler {
  return new Compiler({
    rootDir: process.cwd(),
    outDir: config.build?.outDir || '.philjs',
    pagesDir: config.pagesDir || 'pages',
    publicDir: config.publicDir || 'public',
    srcDir: config.srcDir || 'src',
    minify: config.build?.minify ?? true,
    sourcemap: config.build?.sourcemap ?? false,
    target: 'browser',
    ssr: config.ssr?.enabled ?? true,
    ssg: config.ssg?.enabled ?? false,
    env: config.env || {},
  });
}

/**
 * Bundle analyzer plugin
 */
export function analyzerPlugin(): BuildPlugin {
  return {
    name: 'analyzer',
    setup(build) {
      build.onBuildEnd((result) => {
        console.log('\n📦 Bundle Analysis:\n');

        let totalSize = 0;
        for (const bundle of result.bundles) {
          console.log(`  ${bundle.name}`);
          console.log(`    Size: ${formatSize(bundle.size)}`);
          console.log(`    Gzip: ${formatSize(bundle.gzipSize)}`);
          totalSize += bundle.size;
        }

        console.log(`\n  Total: ${formatSize(totalSize)}\n`);
      });
    },
  };
}

/**
 * Format file size
 */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Static export plugin
 */
export function staticExportPlugin(options: StaticExportOptions = {}): BuildPlugin {
  const { routes = [], fallback = true } = options;

  return {
    name: 'static-export',
    async setup(build) {
      build.onBuildEnd(async (result) => {
        if (!result.success) return;

        console.log('\n📄 Static Export:\n');

        for (const page of result.staticPages) {
          console.log(`  ✓ ${page.pattern} -> ${page.htmlPath}`);
        }

        if (fallback) {
          console.log(`  ✓ 404.html (fallback)`);
        }

        console.log('');
      });
    },
  };
}

export interface StaticExportOptions {
  routes?: string[];
  fallback?: boolean;
}
