/**
 * PhilJS CLI - API Route Generator
 *
 * Generate API routes with handlers for GET, POST, PUT, DELETE
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as pc from 'picocolors';
import {
  createContext,
  toPascalCase,
  toKebabCase,
  toCamelCase,
  extractRouteParams,
  isDynamicRoute,
  type TemplateContext,
} from './template-engine.js';

export interface ApiOptions {
  name: string;
  directory?: string;
  typescript?: boolean;
  withTest?: boolean;
  methods?: ('GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE')[];
}

/**
 * Generate an API route
 */
export async function generateApi(options: ApiOptions): Promise<string[]> {
  const {
    name,
    directory = 'src/api',
    typescript = true,
    withTest = true,
    methods = ['GET', 'POST', 'PUT', 'DELETE'],
  } = options;

  const routePath = toKebabCase(name);
  const routeParams = extractRouteParams(name);
  const isDynamic = isDynamicRoute(name);
  const ext = typescript ? 'ts' : 'js';

  // Determine directory structure
  const apiDir = path.join(process.cwd(), directory, routePath);
  const createdFiles: string[] = [];

  // Create directory
  await fs.mkdir(apiDir, { recursive: true });

  const context = createContext(name, {
    typescript,
    withTest,
    routeParams,
    isDynamic,
    methods,
    resourceName: toCamelCase(name.replace(/\[.*\]/g, '')),
    resourcePascal: toPascalCase(name.replace(/\[.*\]/g, '')),
  });

  // Generate route handler
  const routeContent = generateRouteTemplate(context);
  const routeFilePath = path.join(apiDir, `route.${ext}`);
  await fs.writeFile(routeFilePath, routeContent);
  createdFiles.push(routeFilePath);
  console.log(pc.green(`  + Created ${routePath}/route.${ext}`));

  // Generate types file for TypeScript
  if (typescript) {
    const typesContent = generateTypesTemplate(context);
    const typesPath = path.join(apiDir, `types.ts`);
    await fs.writeFile(typesPath, typesContent);
    createdFiles.push(typesPath);
    console.log(pc.green(`  + Created ${routePath}/types.ts`));
  }

  // Generate test file
  if (withTest) {
    const testContent = generateTestTemplate(context);
    const testPath = path.join(apiDir, `route.test.${ext}`);
    await fs.writeFile(testPath, testContent);
    createdFiles.push(testPath);
    console.log(pc.green(`  + Created ${routePath}/route.test.${ext}`));
  }

  return createdFiles;
}

function generateRouteTemplate(context: TemplateContext): string {
  const {
    typescript,
    isDynamic,
    routeParams,
    methods,
    resourceName,
    resourcePascal,
  } = context;

  const methodsArr = methods as string[];
  const hasGet = methodsArr.includes('GET');
  const hasPost = methodsArr.includes('POST');
  const hasPut = methodsArr.includes('PUT');
  const hasPatch = methodsArr.includes('PATCH');
  const hasDelete = methodsArr.includes('DELETE');

  const requestType = typescript ? ': Request' : '';
  const paramsType = typescript && isDynamic
    ? `: { ${(routeParams as string[]).map(p => `${p}: string`).join('; ')} }`
    : '';

  const typeImport = typescript
    ? `import type { ${resourcePascal}Data, Create${resourcePascal}Input, Update${resourcePascal}Input } from './types';\n`
    : '';

  let handlers = '';

  if (hasGet) {
    handlers += `
/**
 * GET /${context.kebabName}${isDynamic ? `/:${(routeParams as string[])[0]}` : ''}
 * ${isDynamic ? `Fetch a single ${resourceName} by ID` : `Fetch all ${resourceName}s`}
 */
export async function GET(request${requestType}${isDynamic ? `, params${paramsType}` : ''}) {
  try {
    ${isDynamic ? `const { ${(routeParams as string[])[0]} } = params;` : ''}
    // Implement your ${isDynamic ? 'fetch single' : 'fetch all'} logic here
    // Example: const data = await db.query(...)
    ${isDynamic
      ? `const data${typescript ? `: ${resourcePascal}Data` : ''} = { id: ${(routeParams as string[])[0]}, /* ... */ };`
      : `const data${typescript ? `: ${resourcePascal}Data[]` : ''} = [];`
    }

    return new Response(JSON.stringify(${isDynamic ? 'data' : '{ data }'}), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: '${isDynamic ? `${resourcePascal} not found` : `Failed to fetch ${resourceName}s`}' }), {
      status: ${isDynamic ? '404' : '500'},
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
`;
  }

  if (hasPost && !isDynamic) {
    handlers += `
/**
 * POST /${context.kebabName}
 * Create a new ${resourceName}
 */
export async function POST(request${requestType}) {
  try {
    const body${typescript ? ` = await request.json() as Create${resourcePascal}Input` : ' = await request.json()'};

    // Validate input (consider using zod or similar)
    // Create ${resourceName} in database

    const created${typescript ? `: ${resourcePascal}Data` : ''} = {
      id: crypto.randomUUID(),
      ...body,
      createdAt: new Date().toISOString(),
    };

    return new Response(JSON.stringify(created), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to create ${resourceName}' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
`;
  }

  if ((hasPut || hasPatch) && isDynamic) {
    handlers += `
/**
 * ${hasPut ? 'PUT' : 'PATCH'} /${context.kebabName}/:${(routeParams as string[])[0]}
 * Update an existing ${resourceName}
 */
export async function ${hasPut ? 'PUT' : 'PATCH'}(request${requestType}, params${paramsType}) {
  try {
    const { ${(routeParams as string[])[0]} } = params;
    const body${typescript ? ` = await request.json() as Update${resourcePascal}Input` : ' = await request.json()'};

    // Validate input (consider using zod or similar)
    // Update ${resourceName} in database

    const updated${typescript ? `: ${resourcePascal}Data` : ''} = {
      id: ${(routeParams as string[])[0]},
      ...body,
      updatedAt: new Date().toISOString(),
    };

    return new Response(JSON.stringify(updated), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to update ${resourceName}' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
`;
  }

  if (hasDelete && isDynamic) {
    handlers += `
/**
 * DELETE /${context.kebabName}/:${(routeParams as string[])[0]}
 * Delete a ${resourceName}
 */
export async function DELETE(request${requestType}, params${paramsType}) {
  try {
    const { ${(routeParams as string[])[0]} } = params;

    // Delete ${resourceName} from database

    return new Response(null, { status: 204 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to delete ${resourceName}' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
`;
  }

  return `/**
 * API Route: /${context.kebabName}
 */

${typeImport}${handlers}`;
}

function generateTypesTemplate(context: TemplateContext): string {
  const { resourcePascal } = context;

  return `/**
 * Types for ${resourcePascal} API
 */

export interface ${resourcePascal}Data {
  id: string;
  createdAt: string;
  updatedAt?: string;
  // Add your ${resourcePascal} fields here
}

export interface Create${resourcePascal}Input {
  // Add your create input fields here
}

export interface Update${resourcePascal}Input {
  // Add your update input fields here (all optional for partial updates)
}

export interface ${resourcePascal}ListResponse {
  data: ${resourcePascal}Data[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ${resourcePascal}ErrorResponse {
  error: string;
  details?: Record<string, string[]>;
}
`;
}

function generateTestTemplate(context: TemplateContext): string {
  const { kebabName, isDynamic, routeParams, resourcePascal, methods } = context;
  const methodsArr = methods as string[];

  let tests = '';

  if (methodsArr.includes('GET')) {
    if (isDynamic) {
      tests += `
  describe('GET /${kebabName}/:${(routeParams as string[])[0]}', () => {
    it('returns a ${resourcePascal} by ID', async () => {
      const request = new Request('http://localhost/${kebabName}/123');
      const response = await GET(request, { ${(routeParams as string[])[0]}: '123' });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('id');
    });

    it('returns 404 for non-existent ${resourcePascal}', async () => {
      const request = new Request('http://localhost/${kebabName}/invalid');
      const response = await GET(request, { ${(routeParams as string[])[0]}: 'invalid' });

      expect(response.status).toBe(404);
    });
  });
`;
    } else {
      tests += `
  describe('GET /${kebabName}', () => {
    it('returns a list of ${resourcePascal}s', async () => {
      const request = new Request('http://localhost/${kebabName}');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const { data } = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });
  });
`;
    }
  }

  if (methodsArr.includes('POST') && !isDynamic) {
    tests += `
  describe('POST /${kebabName}', () => {
    it('creates a new ${resourcePascal}', async () => {
      const request = new Request('http://localhost/${kebabName}', {
        method: 'POST',
        body: JSON.stringify({ /* test data */ }),
        headers: { 'Content-Type': 'application/json' },
      });
      const response = await POST(request);

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data).toHaveProperty('id');
    });

    it('returns 400 for invalid input', async () => {
      const request = new Request('http://localhost/${kebabName}', {
        method: 'POST',
        body: 'invalid json',
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });
`;
  }

  if ((methodsArr.includes('PUT') || methodsArr.includes('PATCH')) && isDynamic) {
    const method = methodsArr.includes('PUT') ? 'PUT' : 'PATCH';
    tests += `
  describe('${method} /${kebabName}/:${(routeParams as string[])[0]}', () => {
    it('updates a ${resourcePascal}', async () => {
      const request = new Request('http://localhost/${kebabName}/123', {
        method: '${method}',
        body: JSON.stringify({ /* update data */ }),
        headers: { 'Content-Type': 'application/json' },
      });
      const response = await ${method}(request, { ${(routeParams as string[])[0]}: '123' });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('updatedAt');
    });
  });
`;
  }

  if (methodsArr.includes('DELETE') && isDynamic) {
    tests += `
  describe('DELETE /${kebabName}/:${(routeParams as string[])[0]}', () => {
    it('deletes a ${resourcePascal}', async () => {
      const request = new Request('http://localhost/${kebabName}/123', {
        method: 'DELETE',
      });
      const response = await DELETE(request, { ${(routeParams as string[])[0]}: '123' });

      expect(response.status).toBe(204);
    });
  });
`;
  }

  const imports = methodsArr.filter(m => {
    if (m === 'POST' && isDynamic) return false;
    if ((m === 'PUT' || m === 'PATCH' || m === 'DELETE') && !isDynamic) return false;
    return true;
  }).join(', ');

  return `import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ${imports} } from './route';

describe('API: /${kebabName}', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });
${tests}});
`;
}
