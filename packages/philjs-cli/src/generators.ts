/**
 * PhilJS CLI - Code Generators
 *
 * Generate components, routes, pages, and more with best practices built-in.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as pc from 'picocolors';

export interface GeneratorOptions {
  name: string;
  directory?: string;
  typescript?: boolean;
  withTest?: boolean;
  withStyles?: boolean;
}

/**
 * Component Generator
 */
export async function generateComponent(options: GeneratorOptions): Promise<void> {
  const {
    name,
    directory = 'src/components',
    typescript = true,
    withTest = true,
    withStyles = false,
  } = options;

  const componentName = toPascalCase(name);
  const ext = typescript ? 'tsx' : 'jsx';
  const componentDir = path.join(process.cwd(), directory, componentName);

  // Create directory
  await fs.mkdir(componentDir, { recursive: true });

  // Generate component file
  const componentContent = generateComponentTemplate(componentName, typescript, withStyles);
  await fs.writeFile(
    path.join(componentDir, `${componentName}.${ext}`),
    componentContent
  );
  console.log(pc.green(`  ✓ Created ${componentName}.${ext}`));

  // Generate index file
  const indexContent = `export { ${componentName} } from './${componentName}';\nexport type { ${componentName}Props } from './${componentName}';\n`;
  await fs.writeFile(
    path.join(componentDir, `index.${typescript ? 'ts' : 'js'}`),
    indexContent
  );
  console.log(pc.green(`  ✓ Created index.${typescript ? 'ts' : 'js'}`));

  // Generate test file
  if (withTest) {
    const testContent = generateTestTemplate(componentName, typescript);
    await fs.writeFile(
      path.join(componentDir, `${componentName}.test.${ext}`),
      testContent
    );
    console.log(pc.green(`  ✓ Created ${componentName}.test.${ext}`));
  }

  // Generate styles file
  if (withStyles) {
    const stylesContent = generateStylesTemplate(componentName);
    await fs.writeFile(
      path.join(componentDir, `${componentName}.module.css`),
      stylesContent
    );
    console.log(pc.green(`  ✓ Created ${componentName}.module.css`));
  }
}

/**
 * Route Generator
 */
export async function generateRoute(options: GeneratorOptions): Promise<void> {
  const {
    name,
    directory = 'src/routes',
    typescript = true,
    withTest = true,
  } = options;

  const routeName = toKebabCase(name);
  const componentName = toPascalCase(name) + 'Route';
  const ext = typescript ? 'tsx' : 'jsx';
  const routeDir = path.join(process.cwd(), directory, routeName);

  // Create directory
  await fs.mkdir(routeDir, { recursive: true });

  // Generate route component
  const routeContent = generateRouteTemplate(componentName, routeName, typescript);
  await fs.writeFile(
    path.join(routeDir, `index.${ext}`),
    routeContent
  );
  console.log(pc.green(`  ✓ Created ${routeName}/index.${ext}`));

  // Generate loader file
  const loaderContent = generateLoaderTemplate(componentName, typescript);
  await fs.writeFile(
    path.join(routeDir, `loader.${typescript ? 'ts' : 'js'}`),
    loaderContent
  );
  console.log(pc.green(`  ✓ Created ${routeName}/loader.${typescript ? 'ts' : 'js'}`));

  // Generate test file
  if (withTest) {
    const testContent = generateRouteTestTemplate(componentName, routeName, typescript);
    await fs.writeFile(
      path.join(routeDir, `index.test.${ext}`),
      testContent
    );
    console.log(pc.green(`  ✓ Created ${routeName}/index.test.${ext}`));
  }
}

/**
 * Page Generator
 */
export async function generatePage(options: GeneratorOptions): Promise<void> {
  const {
    name,
    directory = 'src/pages',
    typescript = true,
    withTest = true,
  } = options;

  const pageName = toKebabCase(name);
  const componentName = toPascalCase(name) + 'Page';
  const ext = typescript ? 'tsx' : 'jsx';
  const pageDir = path.join(process.cwd(), directory);

  // Create directory if needed
  await fs.mkdir(pageDir, { recursive: true });

  // Generate page component
  const pageContent = generatePageTemplate(componentName, pageName, typescript);
  await fs.writeFile(
    path.join(pageDir, `${pageName}.${ext}`),
    pageContent
  );
  console.log(pc.green(`  ✓ Created ${pageName}.${ext}`));

  // Generate test file
  if (withTest) {
    const testContent = generatePageTestTemplate(componentName, pageName, typescript);
    await fs.writeFile(
      path.join(pageDir, `${pageName}.test.${ext}`),
      testContent
    );
    console.log(pc.green(`  ✓ Created ${pageName}.test.${ext}`));
  }
}

/**
 * Hook Generator
 */
export async function generateHook(options: GeneratorOptions): Promise<void> {
  const {
    name,
    directory = 'src/hooks',
    typescript = true,
    withTest = true,
  } = options;

  const hookName = name.startsWith('use') ? name : `use${toPascalCase(name)}`;
  const ext = typescript ? 'ts' : 'js';
  const hookDir = path.join(process.cwd(), directory);

  // Create directory if needed
  await fs.mkdir(hookDir, { recursive: true });

  // Generate hook file
  const hookContent = generateHookTemplate(hookName, typescript);
  await fs.writeFile(
    path.join(hookDir, `${hookName}.${ext}`),
    hookContent
  );
  console.log(pc.green(`  ✓ Created ${hookName}.${ext}`));

  // Generate test file
  if (withTest) {
    const testContent = generateHookTestTemplate(hookName, typescript);
    await fs.writeFile(
      path.join(hookDir, `${hookName}.test.${ext}`),
      testContent
    );
    console.log(pc.green(`  ✓ Created ${hookName}.test.${ext}`));
  }
}

/**
 * Cell Generator Options
 */
export interface CellGeneratorOptions extends GeneratorOptions {
  /** Use GraphQL QUERY instead of fetch */
  graphql?: boolean;
}

/**
 * Cell Generator - Creates RedwoodJS-style Cell components
 */
export async function generateCell(options: CellGeneratorOptions): Promise<void> {
  const {
    name,
    directory = 'src/cells',
    typescript = true,
    withTest = true,
    graphql = true,
  } = options;

  const cellName = toPascalCase(name) + 'Cell';
  const entityName = toPascalCase(name);
  const ext = typescript ? 'tsx' : 'jsx';
  const cellDir = path.join(process.cwd(), directory);

  // Create directory if needed
  await fs.mkdir(cellDir, { recursive: true });

  // Generate cell file
  const cellContent = generateCellTemplate(cellName, entityName, typescript, graphql);
  await fs.writeFile(
    path.join(cellDir, `${cellName}.${ext}`),
    cellContent
  );
  console.log(pc.green(`  ✓ Created ${cellName}.${ext}`));

  // Generate test file
  if (withTest) {
    const testContent = generateCellTestTemplate(cellName, entityName, typescript);
    await fs.writeFile(
      path.join(cellDir, `${cellName}.test.${ext}`),
      testContent
    );
    console.log(pc.green(`  ✓ Created ${cellName}.test.${ext}`));
  }
}

/**
 * Store Generator
 */
export async function generateStore(options: GeneratorOptions): Promise<void> {
  const {
    name,
    directory = 'src/stores',
    typescript = true,
    withTest = true,
  } = options;

  const storeName = toKebabCase(name);
  const ext = typescript ? 'ts' : 'js';
  const storeDir = path.join(process.cwd(), directory);

  // Create directory if needed
  await fs.mkdir(storeDir, { recursive: true });

  // Generate store file
  const storeContent = generateStoreTemplate(storeName, toPascalCase(name), typescript);
  await fs.writeFile(
    path.join(storeDir, `${storeName}.${ext}`),
    storeContent
  );
  console.log(pc.green(`  ✓ Created ${storeName}.${ext}`));

  // Generate test file
  if (withTest) {
    const testContent = generateStoreTestTemplate(storeName, toPascalCase(name), typescript);
    await fs.writeFile(
      path.join(storeDir, `${storeName}.test.${ext}`),
      testContent
    );
    console.log(pc.green(`  ✓ Created ${storeName}.test.${ext}`));
  }
}

// Template generators
function generateComponentTemplate(name: string, ts: boolean, withStyles: boolean): string {
  const propsType = ts ? `\nexport interface ${name}Props {\n  children?: JSX.Element;\n  className?: string;\n}\n` : '';
  const propsParam = ts ? `props: ${name}Props` : 'props';
  const styleImport = withStyles ? `import styles from './${name}.module.css';\n` : '';

  return `/**
 * ${name} Component
 */

import { JSX } from '@philjs/core';
${styleImport}${propsType}
export function ${name}(${propsParam}) {
  const { children, className = '' } = props;

  return (
    <div className={\`${name.toLowerCase()} \${className}\`}>
      {children}
    </div>
  );
}
`;
}

function generateTestTemplate(name: string, ts: boolean): string {
  return `import { describe, it, expect } from 'vitest';
import { render, screen } from 'philjs-testing';
import { ${name} } from './${name}';

describe('${name}', () => {
  it('renders children correctly', () => {
    render(<${name}>Test Content</${name}>);
    expect(screen.getByText('Test Content')).toBeTruthy();
  });

  it('applies custom className', () => {
    const { container } = render(<${name} className="custom" />);
    expect(container.querySelector('.custom')).toBeTruthy();
  });
});
`;
}

function generateStylesTemplate(name: string): string {
  return `.${name.toLowerCase()} {
  /* Component styles */
}
`;
}

function generateRouteTemplate(name: string, routePath: string, ts: boolean): string {
  const propsType = ts ? `\ninterface ${name}Props {\n  data: Awaited<ReturnType<typeof loader>>;\n}\n` : '';

  return `/**
 * ${name} - Route component for /${routePath}
 */

import { JSX } from '@philjs/core';
import { useLoaderData } from 'philjs-router';
import type { loader } from './loader';
${propsType}
export default function ${name}() {
  const data = useLoaderData<typeof loader>();

  return (
    <div className="${routePath}-route">
      <h1>${name.replace('Route', '')}</h1>
      {/* Route content */}
    </div>
  );
}
`;
}

function generateLoaderTemplate(name: string, ts: boolean): string {
  const returnType = ts ? ': Promise<{ title: string }>' : '';

  return `/**
 * Loader for ${name}
 */

export async function loader()${returnType} {
  // Fetch data for the route
  return {
    title: '${name.replace('Route', '')}',
  };
}
`;
}

function generateRouteTestTemplate(name: string, routePath: string, ts: boolean): string {
  return `import { describe, it, expect, vi } from 'vitest';
import { render, screen } from 'philjs-testing';
import { createMemoryRouter, RouterProvider } from 'philjs-router';
import ${name} from './index';
import { loader } from './loader';

describe('${name}', () => {
  it('renders the route', async () => {
    const router = createMemoryRouter([
      { path: '/${routePath}', element: <${name} />, loader },
    ], { initialEntries: ['/${routePath}'] });

    render(<RouterProvider router={router} />);

    await screen.findByRole('heading');
  });
});
`;
}

function generatePageTemplate(name: string, pageName: string, ts: boolean): string {
  const propsType = ts ? `\nexport interface ${name}Props {\n  // Page props\n}\n` : '';

  return `/**
 * ${name} - Page component
 */

import { JSX } from '@philjs/core';
import { Head, Title, Meta } from 'philjs-meta';
${propsType}
export function ${name}() {
  return (
    <>
      <Head>
        <Title>${name.replace('Page', '')}</Title>
        <Meta name="description" content="${name.replace('Page', '')} page" />
      </Head>

      <main className="${pageName}-page">
        <h1>${name.replace('Page', '')}</h1>
        {/* Page content */}
      </main>
    </>
  );
}

export default ${name};
`;
}

function generatePageTestTemplate(name: string, pageName: string, ts: boolean): string {
  return `import { describe, it, expect } from 'vitest';
import { render, screen } from 'philjs-testing';
import { ${name} } from './${pageName}';

describe('${name}', () => {
  it('renders the page heading', () => {
    render(<${name} />);
    expect(screen.getByRole('heading')).toBeTruthy();
  });
});
`;
}

function generateHookTemplate(name: string, ts: boolean): string {
  const returnType = ts ? `: { value: string; setValue: (v: string) => void }` : '';

  return `/**
 * ${name} - Custom hook
 */

import { signal } from '@philjs/core';

export function ${name}(initialValue${ts ? ': string' : ''} = '')${returnType} {
  const state = signal(initialValue);

  const setValue = (newValue${ts ? ': string' : ''}) => {
    state.set(newValue);
  };

  return {
    value: state.get(),
    setValue,
  };
}
`;
}

function generateHookTestTemplate(name: string, ts: boolean): string {
  return `import { describe, it, expect } from 'vitest';
import { renderHook, act } from 'philjs-testing';
import { ${name} } from './${name}';

describe('${name}', () => {
  it('returns initial value', () => {
    const { result } = renderHook(() => ${name}('test'));
    expect(result.current.value).toBe('test');
  });

  it('updates value', () => {
    const { result } = renderHook(() => ${name}('initial'));

    act(() => {
      result.current.setValue('updated');
    });

    expect(result.current.value).toBe('updated');
  });
});
`;
}

function generateStoreTemplate(storeName: string, pascalName: string, ts: boolean): string {
  const stateType = ts ? `\ninterface ${pascalName}State {\n  items: string[];\n  loading: boolean;\n}\n` : '';

  return `/**
 * ${pascalName} Store
 */

import { signal, computed } from '@philjs/core';
${stateType}
const state = signal${ts ? `<${pascalName}State>` : ''}({
  items: [],
  loading: false,
});

export const ${storeName}Store = {
  // State accessors
  get items() {
    return state.get().items;
  },

  get loading() {
    return state.get().loading;
  },

  // Computed values
  itemCount: computed(() => state.get().items.length),

  // Actions
  addItem(item${ts ? ': string' : ''}) {
    const current = state.get();
    state.set({
      ...current,
      items: [...current.items, item],
    });
  },

  removeItem(item${ts ? ': string' : ''}) {
    const current = state.get();
    state.set({
      ...current,
      items: current.items.filter(i => i !== item),
    });
  },

  setLoading(loading${ts ? ': boolean' : ''}) {
    state.set({ ...state.get(), loading });
  },

  reset() {
    state.set({ items: [], loading: false });
  },
};
`;
}

function generateStoreTestTemplate(storeName: string, pascalName: string, ts: boolean): string {
  return `import { describe, it, expect, beforeEach } from 'vitest';
import { ${storeName}Store } from './${storeName}';

describe('${pascalName} Store', () => {
  beforeEach(() => {
    ${storeName}Store.reset();
  });

  it('starts with empty items', () => {
    expect(${storeName}Store.items).toEqual([]);
  });

  it('adds items', () => {
    ${storeName}Store.addItem('test');
    expect(${storeName}Store.items).toContain('test');
  });

  it('removes items', () => {
    ${storeName}Store.addItem('test');
    ${storeName}Store.removeItem('test');
    expect(${storeName}Store.items).not.toContain('test');
  });

  it('tracks item count', () => {
    ${storeName}Store.addItem('one');
    ${storeName}Store.addItem('two');
    expect(${storeName}Store.itemCount.get()).toBe(2);
  });
});
`;
}

// Utility functions
function toPascalCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    .replace(/^(.)/, (c) => c.toUpperCase());
}

function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

// Cell template generators
function generateCellTemplate(cellName: string, entityName: string, ts: boolean, graphql: boolean): string {
  const entityLower = entityName.toLowerCase();
  const entityPlural = entityLower + 's';

  if (graphql) {
    return `/**
 * ${cellName} - Declarative data loading component
 *
 * This Cell fetches ${entityPlural} using GraphQL and handles loading, error, and empty states.
 */

import { createCell } from 'philjs-cells';
${ts ? `import type { LoadingProps, EmptyProps, FailureProps, SuccessProps } from 'philjs-cells';\n` : ''}
// GraphQL Query
export const QUERY = \`
  query ${entityName}s {
    ${entityPlural} {
      id
      name
      createdAt
    }
  }
\`;
${ts ? `
// TypeScript types
export interface ${entityName} {
  id: string;
  name: string;
  createdAt: string;
}

export interface ${entityName}sData {
  ${entityPlural}: ${entityName}[];
}
` : ''}
/**
 * Loading state component
 */
export const Loading = (${ts ? 'props: LoadingProps' : 'props'}) => (
  <div className="${entityLower}-cell-loading" aria-busy="true" aria-live="polite">
    <div className="spinner" />
    <p>Loading ${entityPlural}...</p>
  </div>
);

/**
 * Empty state component
 */
export const Empty = (${ts ? 'props: EmptyProps' : 'props'}) => (
  <div className="${entityLower}-cell-empty">
    <p>No ${entityPlural} found.</p>
  </div>
);

/**
 * Error/Failure state component
 */
export const Failure = (${ts ? 'props: FailureProps' : 'props'}) => (
  <div className="${entityLower}-cell-error" role="alert">
    <p>Error loading ${entityPlural}: {props.error.message}</p>
    <button onClick={props.retry} disabled={props.isRetrying}>
      {props.isRetrying ? 'Retrying...' : 'Try Again'}
    </button>
  </div>
);

/**
 * Success state component - receives the fetched data
 */
export const Success = (${ts ? `props: SuccessProps<${entityName}sData>` : 'props'}) => {
  const { ${entityPlural}, refetch, isRefetching } = props;

  return (
    <div className="${entityLower}-cell-success">
      {isRefetching && <div className="refetching-indicator">Updating...</div>}
      <ul>
        {${entityPlural}.map((${entityLower}${ts ? `: ${entityName}` : ''}) => (
          <li key={${entityLower}.id}>
            <span>{${entityLower}.name}</span>
          </li>
        ))}
      </ul>
      <button onClick={() => refetch()}>Refresh</button>
    </div>
  );
};

/**
 * Export the Cell component
 */
export default createCell${ts ? `<${entityName}sData>` : ''}({
  QUERY,
  Loading,
  Empty,
  Failure,
  Success,
  displayName: '${cellName}',
});
`;
  } else {
    // Fetch-based cell template
    return `/**
 * ${cellName} - Declarative data loading component
 *
 * This Cell fetches ${entityPlural} using fetch and handles loading, error, and empty states.
 */

import { createCell } from 'philjs-cells';
${ts ? `import type { LoadingProps, EmptyProps, FailureProps, SuccessProps } from 'philjs-cells';\n` : ''}
${ts ? `
// TypeScript types
export interface ${entityName} {
  id: string;
  name: string;
  createdAt: string;
}

export interface ${entityName}sData {
  ${entityPlural}: ${entityName}[];
}

interface FetchVariables {
  // Add your fetch variables here
}
` : ''}
/**
 * Fetch function - fetches data from your API
 */
export const fetch = async (${ts ? 'variables: FetchVariables' : 'variables'})${ts ? `: Promise<${entityName}sData>` : ''} => {
  const response = await globalThis.fetch('/api/${entityPlural}');
  if (!response.ok) {
    throw new Error(\`Failed to fetch ${entityPlural}: \${response.statusText}\`);
  }
  return response.json();
};

/**
 * Loading state component
 */
export const Loading = (${ts ? 'props: LoadingProps' : 'props'}) => (
  <div className="${entityLower}-cell-loading" aria-busy="true" aria-live="polite">
    <div className="spinner" />
    <p>Loading ${entityPlural}...</p>
  </div>
);

/**
 * Empty state component
 */
export const Empty = (${ts ? 'props: EmptyProps' : 'props'}) => (
  <div className="${entityLower}-cell-empty">
    <p>No ${entityPlural} found.</p>
  </div>
);

/**
 * Error/Failure state component
 */
export const Failure = (${ts ? 'props: FailureProps' : 'props'}) => (
  <div className="${entityLower}-cell-error" role="alert">
    <p>Error loading ${entityPlural}: {props.error.message}</p>
    <button onClick={props.retry} disabled={props.isRetrying}>
      {props.isRetrying ? 'Retrying...' : 'Try Again'}
    </button>
  </div>
);

/**
 * Success state component - receives the fetched data
 */
export const Success = (${ts ? `props: SuccessProps<${entityName}sData>` : 'props'}) => {
  const { ${entityPlural}, refetch, isRefetching } = props;

  return (
    <div className="${entityLower}-cell-success">
      {isRefetching && <div className="refetching-indicator">Updating...</div>}
      <ul>
        {${entityPlural}.map((${entityLower}${ts ? `: ${entityName}` : ''}) => (
          <li key={${entityLower}.id}>
            <span>{${entityLower}.name}</span>
          </li>
        ))}
      </ul>
      <button onClick={() => refetch()}>Refresh</button>
    </div>
  );
};

/**
 * Export the Cell component
 */
export default createCell${ts ? `<${entityName}sData>` : ''}({
  fetch,
  Loading,
  Empty,
  Failure,
  Success,
  displayName: '${cellName}',
});
`;
  }
}

function generateCellTestTemplate(cellName: string, entityName: string, ts: boolean): string {
  const entityLower = entityName.toLowerCase();
  const entityPlural = entityLower + 's';

  return `import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from 'philjs-testing';
import ${cellName}, { Loading, Empty, Failure, Success } from './${cellName}';
${ts ? `import type { ${entityName} } from './${cellName}';\n` : ''}
// Mock data
const mock${entityName}s${ts ? `: ${entityName}[]` : ''} = [
  { id: '1', name: 'Test ${entityName} 1', createdAt: '2024-01-01' },
  { id: '2', name: 'Test ${entityName} 2', createdAt: '2024-01-02' },
];

describe('${cellName}', () => {
  describe('Loading component', () => {
    it('renders loading state', () => {
      render(<Loading attempts={0} />);
      expect(screen.getByText(/loading ${entityPlural}/i)).toBeTruthy();
    });
  });

  describe('Empty component', () => {
    it('renders empty state', () => {
      render(<Empty variables={{}} />);
      expect(screen.getByText(/no ${entityPlural} found/i)).toBeTruthy();
    });
  });

  describe('Failure component', () => {
    it('renders error state', () => {
      const retry = vi.fn();
      render(
        <Failure
          error={new Error('Test error')}
          retryCount={0}
          retry={retry}
          isRetrying={false}
        />
      );
      expect(screen.getByText(/test error/i)).toBeTruthy();
    });

    it('calls retry on button click', () => {
      const retry = vi.fn();
      render(
        <Failure
          error={new Error('Test error')}
          retryCount={0}
          retry={retry}
          isRetrying={false}
        />
      );
      screen.getByRole('button').click();
      expect(retry).toHaveBeenCalled();
    });
  });

  describe('Success component', () => {
    it('renders ${entityPlural} list', () => {
      const refetch = vi.fn();
      render(
        <Success
          ${entityPlural}={mock${entityName}s}
          refetch={refetch}
          isRefetching={false}
        />
      );
      expect(screen.getByText('Test ${entityName} 1')).toBeTruthy();
      expect(screen.getByText('Test ${entityName} 2')).toBeTruthy();
    });

    it('shows refetching indicator', () => {
      const refetch = vi.fn();
      render(
        <Success
          ${entityPlural}={mock${entityName}s}
          refetch={refetch}
          isRefetching={true}
        />
      );
      expect(screen.getByText(/updating/i)).toBeTruthy();
    });
  });
});
`;
}
