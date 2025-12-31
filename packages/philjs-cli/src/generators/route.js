/**
 * PhilJS CLI - Route Generator
 *
 * Generate routes with loaders
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import * as pc from 'picocolors';
import { toPascalCase, toKebabCase, extractRouteParams, isDynamicRoute, } from './template-engine.js';
/**
 * Generate a route with loader
 */
export async function generateRoute(options) {
    const { name, directory = 'src/routes', typescript = true, withTest = true, } = options;
    const routeName = toKebabCase(name);
    const componentName = toPascalCase(name) + 'Route';
    const ext = typescript ? 'tsx' : 'jsx';
    const routeParams = extractRouteParams(name);
    const isDynamic = isDynamicRoute(name);
    const routeDir = path.join(process.cwd(), directory, routeName);
    const createdFiles = [];
    // Create directory
    await fs.mkdir(routeDir, { recursive: true });
    // Generate route component
    const routeContent = generateRouteTemplate(componentName, routeName, routeParams, isDynamic, typescript);
    const routePath = path.join(routeDir, `index.${ext}`);
    await fs.writeFile(routePath, routeContent);
    createdFiles.push(routePath);
    console.log(pc.green(`  + Created ${routeName}/index.${ext}`));
    // Generate loader file
    const loaderContent = generateLoaderTemplate(componentName, routeParams, isDynamic, typescript);
    const loaderPath = path.join(routeDir, `loader.${typescript ? 'ts' : 'js'}`);
    await fs.writeFile(loaderPath, loaderContent);
    createdFiles.push(loaderPath);
    console.log(pc.green(`  + Created ${routeName}/loader.${typescript ? 'ts' : 'js'}`));
    // Generate action file (for form submissions)
    const actionContent = generateActionTemplate(componentName, routeParams, isDynamic, typescript);
    const actionPath = path.join(routeDir, `action.${typescript ? 'ts' : 'js'}`);
    await fs.writeFile(actionPath, actionContent);
    createdFiles.push(actionPath);
    console.log(pc.green(`  + Created ${routeName}/action.${typescript ? 'ts' : 'js'}`));
    // Generate test file
    if (withTest) {
        const testContent = generateTestTemplate(componentName, routeName, typescript);
        const testPath = path.join(routeDir, `index.test.${ext}`);
        await fs.writeFile(testPath, testContent);
        createdFiles.push(testPath);
        console.log(pc.green(`  + Created ${routeName}/index.test.${ext}`));
    }
    return createdFiles;
}
function generateRouteTemplate(name, routePath, routeParams, isDynamic, typescript) {
    const propsType = typescript
        ? `\ninterface ${name}Props {\n  data: Awaited<ReturnType<typeof loader>>;\n}\n`
        : '';
    const paramsType = isDynamic && typescript
        ? `\ninterface RouteParams {\n${routeParams.map(p => `  ${p}: string;`).join('\n')}\n}\n`
        : '';
    const paramsHook = isDynamic
        ? `const params = useParams${typescript ? '<RouteParams>' : ''}();\n  `
        : '';
    return `/**
 * ${name} - Route component for /${routePath}
 */

import { JSX } from 'philjs-core';
import { useLoaderData${isDynamic ? ', useParams' : ''} } from 'philjs-router';
import type { loader } from './loader';
${propsType}${paramsType}
export default function ${name}() {
  const data = useLoaderData<typeof loader>();
  ${paramsHook}
  return (
    <div className="${routePath}-route">
      <h1>${name.replace('Route', '')}</h1>
      {/* Route content */}
      {/* Data from loader: {JSON.stringify(data)} */}
    </div>
  );
}

// Optional: Error boundary for this route
export function ErrorBoundary() {
  return (
    <div className="${routePath}-error">
      <h1>Error</h1>
      <p>Something went wrong loading this route.</p>
    </div>
  );
}

// Optional: Loading state for this route
export function Loading() {
  return (
    <div className="${routePath}-loading">
      <p>Loading...</p>
    </div>
  );
}
`;
}
function generateLoaderTemplate(name, routeParams, isDynamic, typescript) {
    const paramsType = isDynamic && typescript
        ? `{ params }: { params: { ${routeParams.map(p => `${p}: string`).join('; ')} } }`
        : isDynamic ? '{ params }' : '';
    const returnType = typescript ? `: Promise<{ title: string; data: unknown }>` : '';
    return `/**
 * Loader for ${name}
 *
 * This function runs on the server before the route component renders.
 * Use it to fetch data, check authentication, etc.
 */

${isDynamic && typescript ? `interface LoaderParams {\n  params: { ${routeParams.map(p => `${p}: string`).join('; ')} };\n}\n` : ''}
export async function loader(${paramsType})${returnType} {
  ${isDynamic ? `// Access route params: ${routeParams.map(p => `params.${p}`).join(', ')}` : '// Fetch data for the route'}

  // Example: Fetch data from an API
  // const response = await fetch('/api/...');
  // const data = await response.json();

  return {
    title: '${name.replace('Route', '')}',
    data: null, // Replace with actual data
  };
}
`;
}
function generateActionTemplate(name, routeParams, isDynamic, typescript) {
    const paramsType = isDynamic && typescript
        ? `, params: { ${routeParams.map(p => `${p}: string`).join('; ')} }`
        : isDynamic ? ', params' : '';
    return `/**
 * Action for ${name}
 *
 * This function handles form submissions and other mutations.
 * Use it for POST, PUT, PATCH, DELETE operations.
 */

${typescript ? `interface ActionRequest {\n  request: Request;\n${isDynamic ? `  params: { ${routeParams.map(p => `${p}: string`).join('; ')} };\n` : ''}}\n` : ''}
export async function action(${typescript ? '{ request' + (isDynamic ? ', params' : '') + ' }: ActionRequest' : '{ request' + (isDynamic ? ', params' : '') + ' }'}) {
  const formData = await request.formData();
  const intent = formData.get('intent');

  switch (intent) {
    case 'create': {
      // Handle create
      const data = Object.fromEntries(formData);
      // await createItem(data);
      return { success: true, message: 'Created successfully' };
    }

    case 'update': {
      // Handle update
      ${isDynamic ? `// const id = params.${routeParams[0]};` : ''}
      const data = Object.fromEntries(formData);
      // await updateItem(id, data);
      return { success: true, message: 'Updated successfully' };
    }

    case 'delete': {
      // Handle delete
      ${isDynamic ? `// const id = params.${routeParams[0]};` : ''}
      // await deleteItem(id);
      return { success: true, message: 'Deleted successfully' };
    }

    default:
      return { success: false, error: 'Unknown action' };
  }
}
`;
}
function generateTestTemplate(name, routePath, typescript) {
    return `import { describe, it, expect, vi } from 'vitest';
import { render, screen } from 'philjs-testing';
import { createMemoryRouter, RouterProvider } from 'philjs-router';
import ${name} from './index';
import { loader } from './loader';
import { action } from './action';

describe('${name}', () => {
  it('renders the route', async () => {
    const router = createMemoryRouter([
      { path: '/${routePath}', element: <${name} />, loader },
    ], { initialEntries: ['/${routePath}'] });

    render(<RouterProvider router={router} />);

    await screen.findByRole('heading');
  });

  it('displays data from loader', async () => {
    const mockLoader = vi.fn().mockResolvedValue({
      title: 'Test Title',
      data: { id: '1' },
    });

    const router = createMemoryRouter([
      { path: '/${routePath}', element: <${name} />, loader: mockLoader },
    ], { initialEntries: ['/${routePath}'] });

    render(<RouterProvider router={router} />);

    await screen.findByRole('heading');
    expect(mockLoader).toHaveBeenCalled();
  });

  describe('action', () => {
    it('handles create intent', async () => {
      const formData = new FormData();
      formData.set('intent', 'create');
      formData.set('name', 'Test');

      const request = new Request('http://localhost/${routePath}', {
        method: 'POST',
        body: formData,
      });

      const result = await action({ request${routePath.includes('[') ? ', params: { id: "1" }' : ''} });
      expect(result.success).toBe(true);
    });

    it('returns error for unknown intent', async () => {
      const formData = new FormData();
      formData.set('intent', 'unknown');

      const request = new Request('http://localhost/${routePath}', {
        method: 'POST',
        body: formData,
      });

      const result = await action({ request${routePath.includes('[') ? ', params: { id: "1" }' : ''} });
      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown action');
    });
  });
});
`;
}
//# sourceMappingURL=route.js.map