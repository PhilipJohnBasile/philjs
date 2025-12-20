/**
 * @fileoverview Virtual modules plugin for Vite
 * Provides virtual modules like virtual:philjs-routes, virtual:philjs-content, etc.
 */

import type { Plugin } from 'vite';
import { glob } from 'fast-glob';
import { readFile } from 'fs/promises';
import { resolve, relative } from 'path';

/**
 * Virtual module configuration
 */
export interface VirtualModuleConfig {
  /** Routes directory */
  routesDir?: string;
  /** Content directory */
  contentDir?: string;
  /** Plugins directory */
  pluginsDir?: string;
  /** App configuration */
  appConfig?: Record<string, any>;
  /** Base path */
  basePath?: string;
}

/**
 * Route metadata
 */
export interface RouteMetadata {
  /** Route path */
  path: string;
  /** File path */
  filePath: string;
  /** Has loader */
  hasLoader?: boolean;
  /** Has action */
  hasAction?: boolean;
  /** Route metadata */
  meta?: Record<string, any>;
}

/**
 * Create virtual modules plugin for Vite
 */
export function virtualModulesPlugin(config: VirtualModuleConfig = {}): Plugin {
  const {
    routesDir = './src/routes',
    contentDir = './src/content',
    pluginsDir = './src/plugins',
    appConfig = {},
    basePath = '',
  } = config;

  let root = '';

  // Virtual module IDs
  const VIRTUAL_ROUTES = 'virtual:philjs-routes';
  const VIRTUAL_CONTENT = 'virtual:philjs-content';
  const VIRTUAL_CONFIG = 'virtual:philjs-config';
  const VIRTUAL_PLUGINS = 'virtual:philjs-plugins';

  const resolvedVirtualModuleIds = new Map([
    [VIRTUAL_ROUTES, '\0' + VIRTUAL_ROUTES],
    [VIRTUAL_CONTENT, '\0' + VIRTUAL_CONTENT],
    [VIRTUAL_CONFIG, '\0' + VIRTUAL_CONFIG],
    [VIRTUAL_PLUGINS, '\0' + VIRTUAL_PLUGINS],
  ]);

  return {
    name: 'philjs:virtual-modules',

    configResolved(resolvedConfig) {
      root = resolvedConfig.root;
    },

    resolveId(id) {
      if (resolvedVirtualModuleIds.has(id)) {
        return resolvedVirtualModuleIds.get(id);
      }
    },

    async load(id) {
      // virtual:philjs-routes
      if (id === resolvedVirtualModuleIds.get(VIRTUAL_ROUTES)) {
        const routesPath = resolve(root, routesDir);
        const files = await glob('**/*.{js,jsx,ts,tsx}', {
          cwd: routesPath,
          absolute: false,
        });

        const routes: RouteMetadata[] = [];

        for (const file of files) {
          const filePath = resolve(routesPath, file);
          const routePath = filePathToRoute(file);

          // Read file to check for loader/action
          const content = await readFile(filePath, 'utf-8');
          const hasLoader = /export\s+(const|function)\s+loader/.test(content);
          const hasAction = /export\s+(const|function)\s+action/.test(content);

          routes.push({
            path: routePath,
            filePath: relative(root, filePath),
            hasLoader,
            hasAction,
          });
        }

        return generateRoutesModule(routes, routesPath, root);
      }

      // virtual:philjs-content
      if (id === resolvedVirtualModuleIds.get(VIRTUAL_CONTENT)) {
        const contentPath = resolve(root, contentDir);
        const files = await glob('**/*.{md,mdx,json}', {
          cwd: contentPath,
          absolute: false,
        });

        return generateContentModule(files, contentPath, root);
      }

      // virtual:philjs-config
      if (id === resolvedVirtualModuleIds.get(VIRTUAL_CONFIG)) {
        return generateConfigModule(appConfig, basePath);
      }

      // virtual:philjs-plugins
      if (id === resolvedVirtualModuleIds.get(VIRTUAL_PLUGINS)) {
        const pluginsPath = resolve(root, pluginsDir);
        const files = await glob('**/*.{js,ts}', {
          cwd: pluginsPath,
          absolute: false,
        });

        return generatePluginsModule(files, pluginsPath, root);
      }
    },

    async handleHotUpdate({ file, server }) {
      const routesPath = resolve(root, routesDir);
      const contentPath = resolve(root, contentDir);
      const pluginsPath = resolve(root, pluginsDir);

      // Invalidate virtual modules when source files change
      if (file.startsWith(routesPath)) {
        const module = server.moduleGraph.getModuleById(
          resolvedVirtualModuleIds.get(VIRTUAL_ROUTES)!
        );
        if (module) {
          return [module];
        }
      }

      if (file.startsWith(contentPath)) {
        const module = server.moduleGraph.getModuleById(
          resolvedVirtualModuleIds.get(VIRTUAL_CONTENT)!
        );
        if (module) {
          return [module];
        }
      }

      if (file.startsWith(pluginsPath)) {
        const module = server.moduleGraph.getModuleById(
          resolvedVirtualModuleIds.get(VIRTUAL_PLUGINS)!
        );
        if (module) {
          return [module];
        }
      }
    },
  };
}

/**
 * Generate routes module code
 */
function generateRoutesModule(
  routes: RouteMetadata[],
  routesPath: string,
  root: string
): string {
  const imports = routes
    .map((route, index) => {
      const relativePath = './' + relative(root, resolve(routesPath, route.filePath))
        .replace(/\\/g, '/');
      return `import * as route${index} from '${relativePath}';`;
    })
    .join('\n');

  const routesArray = routes
    .map((route, index) => {
      return `{
    path: '${route.path}',
    filePath: '${route.filePath}',
    component: route${index}.default,
    loader: route${index}.loader,
    action: route${index}.action,
    meta: route${index}.meta,
  }`;
    })
    .join(',\n  ');

  return `${imports}

export const routes = [
  ${routesArray}
];

export function getRoute(path) {
  return routes.find(r => r.path === path);
}

export function matchRoute(pathname) {
  // Simple matching - can be enhanced with path-to-regexp
  for (const route of routes) {
    const pattern = route.path
      .replace(/:[^/]+/g, '([^/]+)')
      .replace(/\*/g, '.*');
    const regex = new RegExp('^' + pattern + '$');
    const match = pathname.match(regex);
    if (match) {
      return { route, params: {} }; // TODO: extract params
    }
  }
  return null;
}
`;
}

/**
 * Generate content module code
 */
function generateContentModule(
  files: string[],
  contentPath: string,
  root: string
): string {
  const imports = files
    .map((file, index) => {
      const relativePath = './' + relative(root, resolve(contentPath, file))
        .replace(/\\/g, '/');
      return `const content${index} = () => import('${relativePath}');`;
    })
    .join('\n');

  const contentArray = files
    .map((file, index) => {
      const collection = file.split('/')[0] || 'default';
      return `{
    path: '${file}',
    collection: '${collection}',
    load: content${index},
  }`;
    })
    .join(',\n  ');

  return `${imports}

export const content = [
  ${contentArray}
];

export function getCollection(name) {
  return content.filter(c => c.collection === name);
}

export async function loadContent(path) {
  const item = content.find(c => c.path === path);
  if (!item) throw new Error(\`Content not found: \${path}\`);
  return item.load();
}
`;
}

/**
 * Generate config module code
 */
function generateConfigModule(
  config: Record<string, any>,
  basePath: string
): string {
  return `export const config = ${JSON.stringify(config, null, 2)};
export const basePath = '${basePath}';
export default config;
`;
}

/**
 * Generate plugins module code
 */
function generatePluginsModule(
  files: string[],
  pluginsPath: string,
  root: string
): string {
  const imports = files
    .map((file, index) => {
      const relativePath = './' + relative(root, resolve(pluginsPath, file))
        .replace(/\\/g, '/');
      return `import * as plugin${index} from '${relativePath}';`;
    })
    .join('\n');

  const pluginsArray = files
    .map((file, index) => {
      const name = file.replace(/\.(js|ts)$/, '').replace(/\//g, '-');
      return `{
    name: '${name}',
    module: plugin${index}.default || plugin${index},
  }`;
    })
    .join(',\n  ');

  return `${imports}

export const plugins = [
  ${pluginsArray}
];

export async function initializePlugins(context) {
  for (const plugin of plugins) {
    if (plugin.module && typeof plugin.module.setup === 'function') {
      await plugin.module.setup(context);
    }
  }
}
`;
}

/**
 * Convert file path to route path
 */
function filePathToRoute(filePath: string): string {
  let route = filePath
    // Remove file extension
    .replace(/\.(js|jsx|ts|tsx)$/, '')
    // Handle index files
    .replace(/\/index$/, '/')
    .replace(/^index$/, '/')
    // Handle [param] -> :param
    .replace(/\[([^\]]+)\]/g, ':$1')
    // Handle [...param] -> *param (catch-all)
    .replace(/\[\.\.\.([^\]]+)\]/g, '*$1');

  // Ensure leading slash
  if (!route.startsWith('/')) {
    route = `/${route}`;
  }

  // Remove trailing slash (except for root)
  if (route !== '/' && route.endsWith('/')) {
    route = route.slice(0, -1);
  }

  return route;
}

/**
 * Generate TypeScript declarations for virtual modules
 */
export function generateVirtualModuleTypes(): string {
  return `declare module 'virtual:philjs-routes' {
  export interface RouteMetadata {
    path: string;
    filePath: string;
    component?: any;
    loader?: (...args: any[]) => any;
    action?: (...args: any[]) => any;
    meta?: Record<string, any>;
  }

  export const routes: RouteMetadata[];
  export function getRoute(path: string): RouteMetadata | undefined;
  export function matchRoute(pathname: string): { route: RouteMetadata; params: Record<string, string> } | null;
}

declare module 'virtual:philjs-content' {
  export interface ContentItem {
    path: string;
    collection: string;
    load: () => Promise<any>;
  }

  export const content: ContentItem[];
  export function getCollection(name: string): ContentItem[];
  export function loadContent(path: string): Promise<any>;
}

declare module 'virtual:philjs-config' {
  export const config: Record<string, any>;
  export const basePath: string;
  export default config;
}

declare module 'virtual:philjs-plugins' {
  export interface Plugin {
    name: string;
    module: any;
  }

  export const plugins: Plugin[];
  export function initializePlugins(context: any): Promise<void>;
}
`;
}

/**
 * Write TypeScript declarations to file
 */
export async function writeVirtualModuleTypes(outPath: string): Promise<void> {
  const { writeFile } = await import('fs/promises');
  const { dirname } = await import('path');
  const { mkdir } = await import('fs/promises');

  const types = generateVirtualModuleTypes();
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, types, 'utf-8');
}
