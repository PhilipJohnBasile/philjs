/**
 * Template engine for plugin generation
 */

export interface TemplateContext {
  [key: string]: string | number | boolean | undefined;
}

/**
 * Simple template engine
 */
export function renderTemplate(template: string, context: TemplateContext): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const value = context[key];
    return value !== undefined ? String(value) : '';
  });
}

/**
 * Parse a template file
 */
export function parseTemplate(content: string): {
  frontmatter: Record<string, string>;
  body: string;
} {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

  if (!frontmatterMatch) {
    return { frontmatter: {}, body: content };
  }

  const frontmatter: Record<string, string> = {};
  const lines = frontmatterMatch[1]?.split('\n') ?? [];

  for (const line of lines) {
    const [key, ...valueParts] = line.split(':');
    if (key) {
      frontmatter[key.trim()] = valueParts.join(':').trim();
    }
  }

  return {
    frontmatter,
    body: frontmatterMatch[2] ?? '',
  };
}

/**
 * Available template types
 */
export type TemplateType = 'basic' | 'vite' | 'full' | 'minimal';

/**
 * Template registry
 */
export const templates: Record<TemplateType, string> = {
  basic: `
import { Plugin } from 'create-philjs-plugin';

export default {
  meta: {
    name: '{{name}}',
    version: '1.0.0',
    description: '{{description}}',
  },
  hooks: {
    init: async (ctx) => {
      ctx.logger.info('Plugin initialized');
    },
  },
} satisfies Plugin;
`,
  vite: `
import { Plugin } from 'create-philjs-plugin';

export default {
  meta: {
    name: '{{name}}',
    version: '1.0.0',
    description: '{{description}}',
  },
  vitePlugin: (config) => ({
    name: '{{name}}',
    configResolved(resolvedConfig) {
      // Store config if needed
    },
    transform(code, id) {
      // Transform code if needed
      return null;
    },
  }),
} satisfies Plugin;
`,
  full: `
import { Plugin, PluginBuilder } from 'create-philjs-plugin';

export default new PluginBuilder()
  .meta({
    name: '{{name}}',
    version: '1.0.0',
    description: '{{description}}',
  })
  .hook('init', async (ctx) => {
    ctx.logger.info('Plugin initialized');
  })
  .hook('buildStart', async (ctx, config) => {
    ctx.logger.info('Build starting...');
  })
  .hook('buildEnd', async (ctx, result) => {
    ctx.logger.info('Build complete');
  })
  .build();
`,
  minimal: `
export default {
  meta: { name: '{{name}}', version: '1.0.0' },
};
`,
};

/**
 * Get template by type
 */
export function getTemplate(type: TemplateType): string {
  return templates[type] || templates.basic;
}
