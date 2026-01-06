/**
 * PhilJS ISR HTML Generator
 *
 * Generates static HTML files from page components and their props.
 */

import type {
  GetStaticProps,
  ISRPageModule,
  PrerenderedPage,
  StaticPropsContext,
  StaticPropsResult,
} from '../types.js';

/**
 * HTML generation options
 */
export interface HTMLGeneratorOptions {
  /** Base directory for output */
  outDir: string;
  /** Whether to minify HTML */
  minify?: boolean;
  /** Whether to include props as JSON in HTML */
  embedProps?: boolean;
  /** Custom document wrapper */
  document?: DocumentWrapper;
  /** HTML beautify options */
  beautify?: boolean;
  /** Add trailing slashes to paths */
  trailingSlash?: boolean;
}

/**
 * Document wrapper for HTML generation
 */
export interface DocumentWrapper {
  /** Wrap content in document structure */
  wrap(content: string, options: DocumentWrapOptions): string;
}

/**
 * Options for document wrapping
 */
export interface DocumentWrapOptions {
  /** Page path */
  path: string;
  /** Page props */
  props?: Record<string, unknown>;
  /** Page metadata */
  meta?: PageMeta;
  /** Scripts to include */
  scripts?: string[];
  /** Styles to include */
  styles?: string[];
}

/**
 * Page metadata
 */
export interface PageMeta {
  title?: string;
  description?: string;
  keywords?: string[];
  canonical?: string;
  openGraph?: Record<string, string>;
  twitter?: Record<string, string>;
  jsonLd?: Record<string, unknown>;
}

/**
 * HTML generation result
 */
export interface HTMLGenerationResult {
  /** Generated HTML */
  html: string;
  /** Page props */
  props?: Record<string, unknown>;
  /** Whether to redirect */
  redirect?: { destination: string; permanent?: boolean };
  /** Whether to return 404 */
  notFound?: boolean;
  /** Revalidation interval */
  revalidate: number | false;
  /** Cache tags */
  tags: string[];
  /** Generation time in ms */
  duration: number;
}

/**
 * Default document wrapper
 */
export class DefaultDocumentWrapper implements DocumentWrapper {
  wrap(content: string, options: DocumentWrapOptions): string {
    const { meta = {}, scripts = [], styles = [], props } = options;

    const metaTags = this.generateMetaTags(meta);
    const scriptTags = scripts.map(s => `<script src="${s}"></script>`).join('\n    ');
    const styleTags = styles.map(s => `<link rel="stylesheet" href="${s}">`).join('\n    ');
    const propsScript = props
      ? `<script id="__ISR_PROPS__" type="application/json">${JSON.stringify(props)}</script>`
      : '';

    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    ${metaTags}
    ${styleTags}
  </head>
  <body>
    <div id="root">${content}</div>
    ${propsScript}
    ${scriptTags}
  </body>
</html>`;
  }

  private generateMetaTags(meta: PageMeta): string {
    const tags: string[] = [];

    if (meta.title) {
      tags.push(`<title>${this.escapeHtml(meta.title)}</title>`);
    }

    if (meta.description) {
      tags.push(`<meta name="description" content="${this.escapeHtml(meta.description)}">`);
    }

    if (meta.keywords?.length) {
      tags.push(`<meta name="keywords" content="${this.escapeHtml(meta.keywords.join(', '))}">`);
    }

    if (meta.canonical) {
      tags.push(`<link rel="canonical" href="${meta.canonical}">`);
    }

    if (meta.openGraph) {
      for (const [key, value] of Object.entries(meta.openGraph)) {
        tags.push(`<meta property="og:${key}" content="${this.escapeHtml(value)}">`);
      }
    }

    if (meta.twitter) {
      for (const [key, value] of Object.entries(meta.twitter)) {
        tags.push(`<meta name="twitter:${key}" content="${this.escapeHtml(value)}">`);
      }
    }

    if (meta.jsonLd) {
      tags.push(`<script type="application/ld+json">${JSON.stringify(meta.jsonLd)}</script>`);
    }

    return tags.join('\n    ');
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

/**
 * HTML Generator class
 */
export class HTMLGenerator {
  private options: Required<HTMLGeneratorOptions>;
  private document: DocumentWrapper;
  private renderFn?: (component: unknown, props: Record<string, unknown>) => string;

  constructor(options: HTMLGeneratorOptions) {
    this.options = {
      outDir: options.outDir,
      minify: options.minify ?? false,
      embedProps: options.embedProps ?? true,
      document: options.document ?? new DefaultDocumentWrapper(),
      beautify: options.beautify ?? false,
      trailingSlash: options.trailingSlash ?? false,
    };
    this.document = this.options.document;
  }

  /**
   * Set the render function for components
   */
  setRenderFunction(fn: (component: unknown, props: Record<string, unknown>) => string): void {
    this.renderFn = fn;
  }

  /**
   * Generate HTML for a page
   */
  async generate(
    path: string,
    module: ISRPageModule,
    context: StaticPropsContext
  ): Promise<HTMLGenerationResult> {
    const startTime = Date.now();

    // Get static props if available
    let propsResult: StaticPropsResult | undefined;
    if (module.staticProps) {
      propsResult = await this.executeGetStaticProps(module.staticProps, context);

      // Handle notFound
      if (propsResult.notFound) {
        return {
          html: '',
          notFound: true,
          revalidate: propsResult.revalidate ?? false,
          tags: propsResult.tags ?? [],
          duration: Date.now() - startTime,
        };
      }

      // Handle redirect
      if (propsResult.redirect) {
        return {
          html: '',
          redirect: propsResult.redirect,
          revalidate: propsResult.revalidate ?? false,
          tags: propsResult.tags ?? [],
          duration: Date.now() - startTime,
        };
      }
    }

    const props = propsResult?.props ?? {};
    const revalidate = propsResult?.revalidate ?? module.config?.revalidate ?? 3600;
    const tags = [...(propsResult?.tags ?? []), ...(module.config?.tags ?? [])];

    // Render the component
    const content = await this.renderComponent(module.default, props);

    // Wrap in document
    const html = this.document.wrap(content, {
      path,
      props: this.options.embedProps ? props : undefined,
    });

    // Post-process HTML
    const processedHtml = this.postProcess(html);

    return {
      html: processedHtml,
      props,
      revalidate,
      tags,
      duration: Date.now() - startTime,
    };
  }

  /**
   * Execute getStaticProps
   */
  private async executeGetStaticProps(
    fn: GetStaticProps,
    context: StaticPropsContext
  ): Promise<StaticPropsResult> {
    return await fn(context);
  }

  /**
   * Render a component to HTML string
   */
  private async renderComponent(
    component: unknown,
    props: Record<string, unknown>
  ): Promise<string> {
    if (!this.renderFn) {
      throw new Error('Render function not set. Call setRenderFunction first.');
    }

    return this.renderFn(component, props);
  }

  /**
   * Post-process generated HTML
   */
  private postProcess(html: string): string {
    let result = html;

    if (this.options.minify) {
      result = this.minifyHtml(result);
    } else if (this.options.beautify) {
      result = this.beautifyHtml(result);
    }

    return result;
  }

  /**
   * Minify HTML
   */
  private minifyHtml(html: string): string {
    return html
      // Remove comments (except conditionals)
      .replace(/<!--(?!\[if)[\s\S]*?-->/g, '')
      // Remove whitespace between tags
      .replace(/>\s+</g, '><')
      // Remove leading/trailing whitespace
      .trim();
  }

  /**
   * Beautify HTML (basic formatting)
   */
  private beautifyHtml(html: string): string {
    // Simple indentation
    let indent = 0;
    const lines = html.split(/>\s*</);

    return lines
      .map((line, i) => {
        let result = line;
        if (i > 0) result = '<' + result;
        if (i < lines.length - 1) result = result + '>';

        // Decrease indent for closing tags
        if (result.match(/^<\//)) {
          indent = Math.max(0, indent - 1);
        }

        const indented = '  '.repeat(indent) + result;

        // Increase indent for opening tags (except self-closing)
        if (result.match(/^<[^/]/) && !result.match(/\/>$/)) {
          indent++;
        }

        return indented;
      })
      .join('\n');
  }

  /**
   * Get output file path for a page
   */
  getOutputPath(pagePath: string): string {
    let outputPath = pagePath;

    // Handle trailing slash
    if (this.options.trailingSlash) {
      if (!outputPath.endsWith('/')) {
        outputPath += '/';
      }
      outputPath += 'index.html';
    } else {
      if (outputPath === '/' || outputPath === '') {
        outputPath = '/index.html';
      } else if (!outputPath.endsWith('.html')) {
        outputPath += '.html';
      }
    }

    return `${this.options.outDir}${outputPath}`;
  }
}

/**
 * Create an HTML generator
 */
export function createHTMLGenerator(options: HTMLGeneratorOptions): HTMLGenerator {
  return new HTMLGenerator(options);
}

/**
 * Helper to create getStaticProps function
 */
export function getStaticProps<T = Record<string, unknown>>(
  fn: (context: StaticPropsContext) => Promise<StaticPropsResult<T>> | StaticPropsResult<T>
): GetStaticProps<T> {
  return fn;
}

/**
 * Generate a prerendered page object
 */
export function createPrerenderedPage(
  path: string,
  result: HTMLGenerationResult
): PrerenderedPage {
  return {
    path,
    html: result.html,
    props: result.props,
    revalidate: result.revalidate,
    tags: result.tags,
    generatedAt: Date.now(),
  };
}
