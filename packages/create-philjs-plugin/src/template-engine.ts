/**
 * Template engine for plugin generation
 */

export interface TemplateContext {
  [key: string]: string | number | boolean | undefined;
}

export interface GeneratorContext {
  pluginName: string;
  pascalName: string;
  camelName: string;
  kebabName: string;
  description?: string;
  author?: string;
  license?: string;
  typescript: boolean;
  testing: boolean;
  features: string[];
  type: TemplateType;
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

function splitWords(input: string): string[] {
  const normalized = input
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_\-\s]+/g, ' ')
    .trim();
  return normalized ? normalized.split(' ') : [];
}

export function toPascalCase(input: string): string {
  return splitWords(input)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

export function toCamelCase(input: string): string {
  const pascal = toPascalCase(input);
  return pascal ? pascal.charAt(0).toLowerCase() + pascal.slice(1) : '';
}

export function toKebabCase(input: string): string {
  const normalized = input
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[_\s]+/g, '-')
    .replace(/-+/g, '-')
    .trim();
  return normalized.toLowerCase();
}

export function createContext(
  pluginName: string,
  options: Partial<GeneratorContext> = {}
): GeneratorContext {
  const normalized = pluginName.replace(/^philjs-plugin-/, '');
  const pascalName = toPascalCase(normalized);
  const camelName = toCamelCase(normalized);
  const kebabName = toKebabCase(normalized);

  return {
    pluginName,
    pascalName,
    camelName,
    kebabName,
    description: options.description,
    author: options.author,
    license: options.license,
    typescript: options.typescript ?? true,
    testing: options.testing ?? true,
    features: options.features ?? [],
    type: options.type ?? 'basic',
  };
}

export function generateImports(features: string[], typescript: boolean): string {
  const lines: string[] = [];

  if (typescript) {
    lines.push(`import type { Plugin, PluginContext } from 'create-philjs-plugin';`);
  } else {
    lines.push(`import { Plugin } from 'create-philjs-plugin';`);
  }

  if (features.includes('vite') || features.includes('virtual-modules')) {
    lines.push(`import type { Plugin as VitePlugin } from 'vite';`);
  }

  if (features.includes('ast')) {
    lines.push(`import * as babel from '@babel/core';`);
    lines.push(`import * as t from '@babel/types';`);
  }

  if (features.includes('sourcemaps')) {
    lines.push(`import { SourceMapGenerator } from 'source-map';`);
  }

  if (features.includes('components')) {
    lines.push(`import { defineConfig } from '@philjs/core';`);
  }

  return lines.join('\n');
}

export function generateConfigInterface(context: GeneratorContext): string {
  const lines: string[] = [];
  lines.push(`export interface ${context.pascalName}Config {`);
  lines.push(`  enabled?: boolean;`);

  if (context.features.includes('config')) {
    lines.push(`  config?: Record<string, any>;`);
  }
  if (context.features.includes('virtual-modules')) {
    lines.push(`  virtualModules?: Record<string, string>;`);
  }
  if (context.features.includes('theme')) {
    lines.push(`  theme?: Record<string, string>;`);
  }

  lines.push(`}`);
  return lines.join('\n');
}

export function generateTestTemplate(context: GeneratorContext): string {
  return `import { describe, it, expect } from 'vitest';
import plugin from '../src/index.js';

describe('${context.pluginName}', () => {
  it('should have correct metadata', () => {
    expect(plugin.meta.name).toBe('${context.pluginName}');
  });

  it('should setup successfully with default config', async () => {
    if (plugin.setup) {
      await plugin.setup({}, { version: '0.1.0' } as any);
    }
    expect(true).toBe(true);
  });

  it('should execute buildEnd hook', async () => {
    if (plugin.hooks?.buildEnd) {
      await plugin.hooks.buildEnd({} as any, { ok: true });
    }
    expect(true).toBe(true);
  });
});
`;
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
    version: '0.1.0',
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
    version: '0.1.0',
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
    version: '0.1.0',
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
  meta: { name: '{{name}}', version: '0.1.0' },
};
`,
};

/**
 * Get template by type
 */
export function getTemplate(type: TemplateType): string {
  return templates[type] || templates.basic;
}
