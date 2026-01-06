/**
 * PhilJS ISR Static Generator
 *
 * Orchestrates the static generation process at build time.
 * Coordinates path collection, HTML generation, and manifest creation.
 */

import type {
  BuildManifest,
  BuildManifestEntry,
  ISRConfig,
  ISREvent,
  ISRLogger,
  ISRPageModule,
  PrerenderedPage,
  StaticPropsContext,
} from '../types.js';
import { createPathCollector, type CollectedPath, type PathCollector } from './path-collector.js';
import { createHTMLGenerator, createPrerenderedPage, type HTMLGenerator } from './html-generator.js';

/**
 * Static generation options
 */
export interface StaticGeneratorOptions {
  /** Pages directory */
  pagesDir: string;
  /** Output directory */
  outDir: string;
  /** Concurrency for page generation */
  concurrency?: number;
  /** Whether to minify HTML */
  minify?: boolean;
  /** Whether to include source maps */
  sourceMaps?: boolean;
  /** Locales to generate */
  locales?: string[];
  /** Default locale */
  defaultLocale?: string;
  /** Use trailing slashes */
  trailingSlash?: boolean;
  /** Event handler */
  onEvent?: (event: ISREvent) => void | Promise<void>;
  /** Logger */
  logger?: ISRLogger;
  /** Log level */
  logLevel?: 'debug' | 'info' | 'warn' | 'error' | 'silent';
}

/**
 * Static generation result
 */
export interface StaticGenerationResult {
  /** All generated pages */
  pages: PrerenderedPage[];
  /** Build manifest */
  manifest: BuildManifest;
  /** Pages that failed to generate */
  errors: Array<{ path: string; error: Error }>;
  /** Total duration in ms */
  duration: number;
  /** Statistics */
  stats: {
    totalPages: number;
    successCount: number;
    errorCount: number;
    avgGenerationTime: number;
  };
}

/**
 * Page loader function type
 */
export type PageLoader = (sourcePath: string) => Promise<ISRPageModule>;

/**
 * Component renderer function type
 */
export type ComponentRenderer = (component: unknown, props: Record<string, unknown>) => string;

/**
 * Static generator class
 */
export class StaticGenerator {
  private options: Required<StaticGeneratorOptions>;
  private pathCollector: PathCollector;
  private htmlGenerator: HTMLGenerator;
  private logger: ISRLogger;
  private pageLoader?: PageLoader;
  private componentRenderer?: ComponentRenderer;

  constructor(options: StaticGeneratorOptions) {
    this.options = {
      pagesDir: options.pagesDir,
      outDir: options.outDir,
      concurrency: options.concurrency ?? 10,
      minify: options.minify ?? true,
      sourceMaps: options.sourceMaps ?? false,
      locales: options.locales ?? [],
      defaultLocale: options.defaultLocale ?? 'en',
      trailingSlash: options.trailingSlash ?? false,
      onEvent: options.onEvent ?? (() => {}),
      logger: options.logger ?? this.createDefaultLogger(options.logLevel ?? 'info'),
      logLevel: options.logLevel ?? 'info',
    };

    this.logger = this.options.logger;

    this.pathCollector = createPathCollector({
      pagesDir: this.options.pagesDir,
      locales: this.options.locales,
      defaultLocale: this.options.defaultLocale,
    });

    this.htmlGenerator = createHTMLGenerator({
      outDir: this.options.outDir,
      minify: this.options.minify,
      trailingSlash: this.options.trailingSlash,
    });
  }

  /**
   * Set the page loader function
   */
  setPageLoader(loader: PageLoader): void {
    this.pageLoader = loader;
  }

  /**
   * Set the component renderer function
   */
  setComponentRenderer(renderer: ComponentRenderer): void {
    this.componentRenderer = renderer;
    this.htmlGenerator.setRenderFunction(renderer);
  }

  /**
   * Register a page for static generation
   */
  registerPage(sourcePath: string, module: ISRPageModule): void {
    this.pathCollector.registerPage(sourcePath, module);
  }

  /**
   * Generate all static pages
   */
  async generate(): Promise<StaticGenerationResult> {
    const startTime = Date.now();
    const pages: PrerenderedPage[] = [];
    const errors: Array<{ path: string; error: Error }> = [];
    const generationTimes: number[] = [];

    await this.emitEvent({
      type: 'build:start',
      path: '',
      timestamp: Date.now(),
    });

    this.logger.info('Starting static generation...');

    // Collect all paths
    const collectionResult = await this.pathCollector.collect();
    this.logger.info(`Collected ${collectionResult.paths.length} paths to generate`);

    // Handle collection errors
    for (const error of collectionResult.errors) {
      errors.push({ path: error.sourcePath, error: error.error });
      this.logger.error(`Error collecting paths from ${error.sourcePath}`, { error: error.error.message });
    }

    // Generate pages with concurrency control
    const chunks = this.chunkArray(collectionResult.paths, this.options.concurrency);

    for (const chunk of chunks) {
      const results = await Promise.all(
        chunk.map(async (collectedPath) => {
          try {
            const result = await this.generatePage(collectedPath);
            generationTimes.push(result.duration);
            return { success: true as const, path: collectedPath.path, page: result.page };
          } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            this.logger.error(`Failed to generate ${collectedPath.path}`, { error: err.message });
            return { success: false as const, path: collectedPath.path, error: err };
          }
        })
      );

      for (const result of results) {
        if (result.success) {
          pages.push(result.page);
        } else {
          errors.push({ path: result.path, error: result.error });
        }
      }
    }

    // Create build manifest
    const manifest = this.createManifest(pages, collectionResult.patterns);

    const duration = Date.now() - startTime;
    const avgGenerationTime =
      generationTimes.length > 0
        ? generationTimes.reduce((a, b) => a + b, 0) / generationTimes.length
        : 0;

    await this.emitEvent({
      type: 'build:complete',
      path: '',
      timestamp: Date.now(),
      duration,
      meta: {
        totalPages: pages.length,
        errorCount: errors.length,
      },
    });

    this.logger.info(
      `Static generation complete: ${pages.length} pages in ${duration}ms (avg: ${Math.round(avgGenerationTime)}ms)`
    );

    return {
      pages,
      manifest,
      errors,
      duration,
      stats: {
        totalPages: pages.length + errors.length,
        successCount: pages.length,
        errorCount: errors.length,
        avgGenerationTime: Math.round(avgGenerationTime),
      },
    };
  }

  /**
   * Generate a single page
   */
  private async generatePage(
    collectedPath: CollectedPath
  ): Promise<{ page: PrerenderedPage; duration: number }> {
    const startTime = Date.now();

    // Load page module if needed
    let module: ISRPageModule;
    if (this.pageLoader) {
      module = await this.pageLoader(collectedPath.sourcePath);
    } else {
      throw new Error('Page loader not set. Call setPageLoader first.');
    }

    // Create context
    const context: StaticPropsContext = {
      params: collectedPath.params as Record<string, string>,
      locale: collectedPath.locale,
      defaultLocale: this.options.defaultLocale,
      locales: this.options.locales,
    };

    // Generate HTML
    const result = await this.htmlGenerator.generate(collectedPath.path, module, context);
    const duration = Date.now() - startTime;

    // Handle redirect/notFound
    if (result.notFound || result.redirect) {
      // Still create a page entry for the manifest
      const page: PrerenderedPage = {
        path: collectedPath.path,
        html: '',
        revalidate: result.revalidate,
        tags: result.tags,
        generatedAt: Date.now(),
      };
      return { page, duration };
    }

    const page = createPrerenderedPage(collectedPath.path, result);

    await this.emitEvent({
      type: 'build:page',
      path: collectedPath.path,
      timestamp: Date.now(),
      duration,
    });

    this.logger.debug(`Generated: ${collectedPath.path} (${duration}ms)`);

    return { page, duration };
  }

  /**
   * Create build manifest
   */
  private createManifest(
    pages: PrerenderedPage[],
    patterns: import('./path-collector.js').RoutePattern[]
  ): BuildManifest {
    const entries: BuildManifestEntry[] = pages.map((page) => ({
      path: page.path,
      sourcePath: this.findSourcePath(page.path, patterns),
      isDynamic: this.isDynamicPath(page.path, patterns),
      revalidate: page.revalidate,
      tags: page.tags,
    }));

    const dynamicRoutes = patterns
      .filter((p) => p.paramNames.length > 0)
      .map((p) => ({
        pattern: p.pattern,
        regex: p.regex.source,
        paramNames: p.paramNames,
      }));

    return {
      buildTime: Date.now(),
      buildId: this.generateBuildId(),
      pages: entries,
      dynamicRoutes,
    };
  }

  /**
   * Find source path for a generated page
   */
  private findSourcePath(
    pagePath: string,
    patterns: import('./path-collector.js').RoutePattern[]
  ): string {
    for (const pattern of patterns) {
      if (pattern.regex.test(pagePath)) {
        return pattern.sourcePath;
      }
    }
    return '';
  }

  /**
   * Check if a path is from a dynamic route
   */
  private isDynamicPath(
    pagePath: string,
    patterns: import('./path-collector.js').RoutePattern[]
  ): boolean {
    for (const pattern of patterns) {
      if (pattern.regex.test(pagePath) && pattern.paramNames.length > 0) {
        return true;
      }
    }
    return false;
  }

  /**
   * Generate a unique build ID
   */
  private generateBuildId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}-${random}`;
  }

  /**
   * Split array into chunks
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Emit an ISR event
   */
  private async emitEvent(event: ISREvent): Promise<void> {
    try {
      await this.options.onEvent(event);
    } catch (error) {
      this.logger.error('Event handler error', { error });
    }
  }

  /**
   * Create default logger
   */
  private createDefaultLogger(level: string): ISRLogger {
    const levels = ['debug', 'info', 'warn', 'error', 'silent'];
    const currentLevel = levels.indexOf(level);
    const shouldLog = (msgLevel: string) => levels.indexOf(msgLevel) >= currentLevel;

    return {
      debug: (msg, meta) => shouldLog('debug') && console.debug(`[ISR:Build] ${msg}`, meta || ''),
      info: (msg, meta) => shouldLog('info') && console.info(`[ISR:Build] ${msg}`, meta || ''),
      warn: (msg, meta) => shouldLog('warn') && console.warn(`[ISR:Build] ${msg}`, meta || ''),
      error: (msg, meta) => shouldLog('error') && console.error(`[ISR:Build] ${msg}`, meta || ''),
    };
  }
}

/**
 * Create a static generator
 */
export function createStaticGenerator(options: StaticGeneratorOptions): StaticGenerator {
  return new StaticGenerator(options);
}

/**
 * Quick build helper for simple use cases
 */
export async function buildStaticPages(
  pages: Map<string, ISRPageModule>,
  options: StaticGeneratorOptions & {
    pageLoader?: PageLoader;
    componentRenderer: ComponentRenderer;
  }
): Promise<StaticGenerationResult> {
  const generator = createStaticGenerator(options);

  if (options.pageLoader) {
    generator.setPageLoader(options.pageLoader);
  } else {
    // Create a simple loader that returns from the map
    generator.setPageLoader(async (sourcePath) => {
      const module = pages.get(sourcePath);
      if (!module) {
        throw new Error(`Page not found: ${sourcePath}`);
      }
      return module;
    });
  }

  generator.setComponentRenderer(options.componentRenderer);

  // Register all pages
  for (const [sourcePath, module] of pages) {
    generator.registerPage(sourcePath, module);
  }

  return generator.generate();
}
