/**
 * Code generation for file-based routes
 *
 * Generates TypeScript types and route manifest from file structure
 */

import { writeFileSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import type { RoutePattern } from './discovery.js';
import { discoverRoutes } from './discovery.js';

export interface CodegenOptions {
  /**
   * Routes directory
   */
  routesDir: string;

  /**
   * Output file for generated types
   */
  outputFile?: string;

  /**
   * Generate route manifest
   */
  generateManifest?: boolean;

  /**
   * Watch mode for development
   */
  watch?: boolean;
}

export interface GeneratedRoute {
  path: string;
  pattern: string;
  params: string[];
  component: string;
  loader?: string;
  action?: string;
}

/**
 * Generate TypeScript types from route files
 */
export async function generateRouteTypes(options: CodegenOptions): Promise<string> {
  const { routesDir, outputFile } = options;

  const routes = discoverRoutes(routesDir);

  const typeDefinitions: string[] = [
    '/**',
    ' * Auto-generated route types',
    ' * DO NOT EDIT MANUALLY',
    ' */',
    '',
    '// Route paths',
    'export type RoutePaths =',
  ];

  // Generate union type of all route paths
  const paths = routes.map(r => `  | '${r.pattern}'`);
  typeDefinitions.push(...paths);
  typeDefinitions.push('  ;');
  typeDefinitions.push('');

  // Generate route params types
  typeDefinitions.push('// Route parameters by path');
  typeDefinitions.push('export type RouteParams<T extends RoutePaths> =');

  const paramMappings = routes
    .filter(r => r.params.length > 0)
    .map(r => {
      const paramsType = r.params
        .filter(p => p !== '*')
        .map(p => `${p}: string`)
        .join('; ');
      return `  T extends '${r.pattern}' ? { ${paramsType} } :`;
    });

  if (paramMappings.length > 0) {
    typeDefinitions.push(...paramMappings);
    typeDefinitions.push('  Record<string, never>;');
  } else {
    typeDefinitions.push('  Record<string, never>;');
  }

  typeDefinitions.push('');

  // Generate search params type helper
  typeDefinitions.push('// Search params helper');
  typeDefinitions.push('export type SearchParams = Record<string, string | string[] | undefined>;');
  typeDefinitions.push('');

  // Generate loader data types
  typeDefinitions.push('// Loader data types');
  typeDefinitions.push('export type LoaderData<T extends RoutePaths> = any; // Override with your loader types');
  typeDefinitions.push('');

  // Generate action data types
  typeDefinitions.push('// Action data types');
  typeDefinitions.push('export type ActionData<T extends RoutePaths> = any; // Override with your action types');
  typeDefinitions.push('');

  // Generate navigation helper type
  typeDefinitions.push('// Navigation helper');
  typeDefinitions.push('export interface NavigateOptions<T extends RoutePaths> {');
  typeDefinitions.push('  to: T;');
  typeDefinitions.push('  params?: RouteParams<T>;');
  typeDefinitions.push('  search?: SearchParams;');
  typeDefinitions.push('  replace?: boolean;');
  typeDefinitions.push('  state?: any;');
  typeDefinitions.push('}');
  typeDefinitions.push('');

  // Generate route manifest type
  typeDefinitions.push('// Route manifest');
  typeDefinitions.push('export interface RouteManifest {');
  for (const route of routes) {
    const routeKey = route.pattern.slice(1).replace(/\//g, '_').replace(/:/g, '') || 'index';
    typeDefinitions.push(`  '${routeKey}': {`);
    typeDefinitions.push(`    path: '${route.pattern}';`);
    typeDefinitions.push(`    params: RouteParams<'${route.pattern}'>;`);
    typeDefinitions.push(`    file: '${route.filePath}';`);
    typeDefinitions.push('  };');
  }
  typeDefinitions.push('}');
  typeDefinitions.push('');

  const output = typeDefinitions.join('\n');

  // Write to file if specified
  if (outputFile) {
    writeFileSync(outputFile, output, 'utf-8');
  }

  return output;
}

/**
 * Generate route manifest JSON
 */
export async function generateRouteManifest(options: CodegenOptions): Promise<GeneratedRoute[]> {
  const { routesDir } = options;

  const routes = discoverRoutes(routesDir);

  return routes.map(route => ({
    path: route.filePath,
    pattern: route.pattern,
    params: route.params,
    component: route.filePath,
  }));
}

/**
 * Generate runtime route matcher
 */
export function generateRouteMatcher(routes: RoutePattern[]): string {
  const lines: string[] = [
    '/**',
    ' * Auto-generated route matcher',
    ' * DO NOT EDIT MANUALLY',
    ' */',
    '',
    'export function matchRoute(pathname: string): {',
    '  route: string;',
    '  params: Record<string, string>;',
    '  component: () => Promise<any>;',
    '} | null {',
  ];

  for (const route of routes) {
    const matchCondition = `  if (${generateRegexTest(route)}) {`;
    lines.push(matchCondition);

    if (route.params.length > 0) {
      lines.push(`    const match = pathname.match(${route.regex});`);
      lines.push('    const params: Record<string, string> = {};');
      route.params.forEach((param, idx) => {
        lines.push(`    params['${param}'] = match![${idx + 1}];`);
      });
    } else {
      lines.push('    const params = {};');
    }

    lines.push('    return {');
    lines.push(`      route: '${route.pattern}',`);
    lines.push('      params,');
    lines.push(`      component: () => import('./${route.filePath}'),`);
    lines.push('    };');
    lines.push('  }');
  }

  lines.push('  return null;');
  lines.push('}');

  return lines.join('\n');
}

function generateRegexTest(route: RoutePattern): string {
  return `/${route.regex.source}/.test(pathname)`;
}

/**
 * Watch routes directory and regenerate types on changes
 */
export async function watchRoutes(options: CodegenOptions): Promise<() => void> {
  const { watch } = await import('node:fs');
  const { routesDir, outputFile } = options;

  console.log(`[PhilJS] Watching routes in ${routesDir}...`);

  const watcher = watch(routesDir, { recursive: true }, async (eventType, filename) => {
    if (filename && (filename.endsWith('.tsx') || filename.endsWith('.ts'))) {
      console.log(`[PhilJS] Route file changed: ${filename}`);
      console.log('[PhilJS] Regenerating route types...');

      try {
        await generateRouteTypes(options);
        console.log(`[PhilJS] Types generated to ${outputFile}`);
      } catch (error) {
        console.error('[PhilJS] Failed to generate types:', error);
      }
    }
  });

  return () => {
    watcher.close();
  };
}

/**
 * CLI command to generate route types
 */
export async function codegenCommand(args: string[]): Promise<void> {
  const routesDir = args[0] || './src/routes';
  const outputFile = args[1] || './src/routes.generated.ts';

  console.log('[PhilJS] Generating route types...');
  console.log(`  Routes: ${routesDir}`);
  console.log(`  Output: ${outputFile}`);

  await generateRouteTypes({
    routesDir,
    outputFile,
    generateManifest: true,
  });

  console.log('[PhilJS] ✓ Route types generated successfully');
}
