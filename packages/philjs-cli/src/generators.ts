/**
 * @philjs/cli - Scaffold Generators
 *
 * Generate components from registries (shadcn/ui, PhilJS UI)
 * with real file writing and dependency management.
 */

import * as fs from 'fs';
import * as path from 'path';

export type ScaffoldType = 'shadcn' | 'component' | 'route' | 'api' | 'store';

export interface ScaffoldOptions {
    type: ScaffoldType;
    name: string;
    directory?: string;
    typescript?: boolean;
    overwrite?: boolean;
    dependencies?: boolean;
}

export interface ScaffoldResult {
    files: string[];
    dependencies: string[];
    devDependencies: string[];
    success: boolean;
    error?: string;
}

// shadcn/ui component registry
const SHADCN_REGISTRY_URL = 'https://ui.shadcn.com/registry';

// Component registry mapping
const SHADCN_COMPONENTS: Record<string, ShadcnComponent> = {
    button: {
        name: 'button',
        dependencies: ['@radix-ui/react-slot', 'class-variance-authority'],
        registryDependencies: [],
        files: ['button.tsx'],
    },
    card: {
        name: 'card',
        dependencies: [],
        registryDependencies: [],
        files: ['card.tsx'],
    },
    input: {
        name: 'input',
        dependencies: [],
        registryDependencies: [],
        files: ['input.tsx'],
    },
    label: {
        name: 'label',
        dependencies: ['@radix-ui/react-label'],
        registryDependencies: [],
        files: ['label.tsx'],
    },
    dialog: {
        name: 'dialog',
        dependencies: ['@radix-ui/react-dialog'],
        registryDependencies: [],
        files: ['dialog.tsx'],
    },
    dropdown: {
        name: 'dropdown-menu',
        dependencies: ['@radix-ui/react-dropdown-menu'],
        registryDependencies: [],
        files: ['dropdown-menu.tsx'],
    },
    select: {
        name: 'select',
        dependencies: ['@radix-ui/react-select'],
        registryDependencies: [],
        files: ['select.tsx'],
    },
    tabs: {
        name: 'tabs',
        dependencies: ['@radix-ui/react-tabs'],
        registryDependencies: [],
        files: ['tabs.tsx'],
    },
    toast: {
        name: 'toast',
        dependencies: ['@radix-ui/react-toast'],
        registryDependencies: [],
        files: ['toast.tsx', 'toaster.tsx', 'use-toast.ts'],
    },
    form: {
        name: 'form',
        dependencies: ['@hookform/resolvers', 'react-hook-form', 'zod'],
        registryDependencies: ['button', 'label'],
        files: ['form.tsx'],
    },
    table: {
        name: 'table',
        dependencies: [],
        registryDependencies: [],
        files: ['table.tsx'],
    },
    avatar: {
        name: 'avatar',
        dependencies: ['@radix-ui/react-avatar'],
        registryDependencies: [],
        files: ['avatar.tsx'],
    },
    badge: {
        name: 'badge',
        dependencies: ['class-variance-authority'],
        registryDependencies: [],
        files: ['badge.tsx'],
    },
    checkbox: {
        name: 'checkbox',
        dependencies: ['@radix-ui/react-checkbox'],
        registryDependencies: [],
        files: ['checkbox.tsx'],
    },
    switch: {
        name: 'switch',
        dependencies: ['@radix-ui/react-switch'],
        registryDependencies: [],
        files: ['switch.tsx'],
    },
    slider: {
        name: 'slider',
        dependencies: ['@radix-ui/react-slider'],
        registryDependencies: [],
        files: ['slider.tsx'],
    },
    progress: {
        name: 'progress',
        dependencies: ['@radix-ui/react-progress'],
        registryDependencies: [],
        files: ['progress.tsx'],
    },
    skeleton: {
        name: 'skeleton',
        dependencies: [],
        registryDependencies: [],
        files: ['skeleton.tsx'],
    },
    separator: {
        name: 'separator',
        dependencies: ['@radix-ui/react-separator'],
        registryDependencies: [],
        files: ['separator.tsx'],
    },
    tooltip: {
        name: 'tooltip',
        dependencies: ['@radix-ui/react-tooltip'],
        registryDependencies: [],
        files: ['tooltip.tsx'],
    },
    popover: {
        name: 'popover',
        dependencies: ['@radix-ui/react-popover'],
        registryDependencies: [],
        files: ['popover.tsx'],
    },
    command: {
        name: 'command',
        dependencies: ['cmdk'],
        registryDependencies: ['dialog'],
        files: ['command.tsx'],
    },
    calendar: {
        name: 'calendar',
        dependencies: ['react-day-picker', 'date-fns'],
        registryDependencies: ['button'],
        files: ['calendar.tsx'],
    },
    'date-picker': {
        name: 'date-picker',
        dependencies: [],
        registryDependencies: ['button', 'calendar', 'popover'],
        files: ['date-picker.tsx'],
    },
    accordion: {
        name: 'accordion',
        dependencies: ['@radix-ui/react-accordion'],
        registryDependencies: [],
        files: ['accordion.tsx'],
    },
    alert: {
        name: 'alert',
        dependencies: ['class-variance-authority'],
        registryDependencies: [],
        files: ['alert.tsx'],
    },
    'alert-dialog': {
        name: 'alert-dialog',
        dependencies: ['@radix-ui/react-alert-dialog'],
        registryDependencies: ['button'],
        files: ['alert-dialog.tsx'],
    },
    'aspect-ratio': {
        name: 'aspect-ratio',
        dependencies: ['@radix-ui/react-aspect-ratio'],
        registryDependencies: [],
        files: ['aspect-ratio.tsx'],
    },
    collapsible: {
        name: 'collapsible',
        dependencies: ['@radix-ui/react-collapsible'],
        registryDependencies: [],
        files: ['collapsible.tsx'],
    },
    'context-menu': {
        name: 'context-menu',
        dependencies: ['@radix-ui/react-context-menu'],
        registryDependencies: [],
        files: ['context-menu.tsx'],
    },
    'hover-card': {
        name: 'hover-card',
        dependencies: ['@radix-ui/react-hover-card'],
        registryDependencies: [],
        files: ['hover-card.tsx'],
    },
    menubar: {
        name: 'menubar',
        dependencies: ['@radix-ui/react-menubar'],
        registryDependencies: [],
        files: ['menubar.tsx'],
    },
    'navigation-menu': {
        name: 'navigation-menu',
        dependencies: ['@radix-ui/react-navigation-menu'],
        registryDependencies: [],
        files: ['navigation-menu.tsx'],
    },
    'radio-group': {
        name: 'radio-group',
        dependencies: ['@radix-ui/react-radio-group'],
        registryDependencies: [],
        files: ['radio-group.tsx'],
    },
    'scroll-area': {
        name: 'scroll-area',
        dependencies: ['@radix-ui/react-scroll-area'],
        registryDependencies: [],
        files: ['scroll-area.tsx'],
    },
    sheet: {
        name: 'sheet',
        dependencies: ['@radix-ui/react-dialog'],
        registryDependencies: [],
        files: ['sheet.tsx'],
    },
    textarea: {
        name: 'textarea',
        dependencies: [],
        registryDependencies: [],
        files: ['textarea.tsx'],
    },
    'toggle-group': {
        name: 'toggle-group',
        dependencies: ['@radix-ui/react-toggle-group'],
        registryDependencies: ['toggle'],
        files: ['toggle-group.tsx'],
    },
    toggle: {
        name: 'toggle',
        dependencies: ['@radix-ui/react-toggle', 'class-variance-authority'],
        registryDependencies: [],
        files: ['toggle.tsx'],
    },
};

interface ShadcnComponent {
    name: string;
    dependencies: string[];
    registryDependencies: string[];
    files: string[];
}

interface RegistryResponse {
    name: string;
    type: string;
    registryDependencies: string[];
    dependencies: string[];
    devDependencies: string[];
    files: Array<{
        name: string;
        content: string;
    }>;
}

/**
 * Main scaffold function - generates components/routes/etc
 */
export async function scaffold(
    type: ScaffoldType,
    name: string,
    dir: string = '.'
): Promise<ScaffoldResult> {
    const options: ScaffoldOptions = {
        type,
        name,
        directory: dir,
        typescript: true,
        overwrite: false,
        dependencies: true,
    };

    switch (type) {
        case 'shadcn':
            return scaffoldShadcn(options);
        case 'component':
            return scaffoldComponent(options);
        case 'route':
            return scaffoldRoute(options);
        case 'api':
            return scaffoldApi(options);
        case 'store':
            return scaffoldStore(options);
        default:
            return {
                files: [],
                dependencies: [],
                devDependencies: [],
                success: false,
                error: `Unknown scaffold type: ${type}`,
            };
    }
}

/**
 * Scaffold a shadcn/ui component
 */
async function scaffoldShadcn(options: ScaffoldOptions): Promise<ScaffoldResult> {
    const { name, directory = '.', typescript = true, overwrite = false } = options;
    const componentName = name.toLowerCase();

    console.log(`🎨 Scaffolding shadcn/ui component: ${componentName}`);

    // Check if component exists in registry
    const componentInfo = SHADCN_COMPONENTS[componentName];
    if (!componentInfo) {
        // Try to fetch from remote registry
        try {
            return await fetchFromRemoteRegistry(componentName, directory, typescript, overwrite);
        } catch (error) {
            return {
                files: [],
                dependencies: [],
                devDependencies: [],
                success: false,
                error: `Component "${componentName}" not found in shadcn/ui registry. Available: ${Object.keys(SHADCN_COMPONENTS).join(', ')}`,
            };
        }
    }

    const result: ScaffoldResult = {
        files: [],
        dependencies: [...componentInfo.dependencies],
        devDependencies: [],
        success: true,
    };

    // Resolve registry dependencies (other shadcn components this one depends on)
    for (const dep of componentInfo.registryDependencies) {
        const depResult = await scaffoldShadcn({
            ...options,
            name: dep,
        });
        result.files.push(...depResult.files);
        result.dependencies.push(...depResult.dependencies);
    }

    // Create component directory
    const componentDir = path.join(directory, 'components', 'ui');
    ensureDir(componentDir);

    // Generate component files
    for (const fileName of componentInfo.files) {
        const filePath = path.join(componentDir, fileName);

        // Check if file already exists
        if (fs.existsSync(filePath) && !overwrite) {
            console.log(`  ⚠️  Skipping ${fileName} (already exists, use --overwrite to replace)`);
            continue;
        }

        const content = generateShadcnComponent(componentName, fileName, typescript);
        fs.writeFileSync(filePath, content, 'utf-8');
        result.files.push(filePath);
        console.log(`  ✅ Created ${filePath}`);
    }

    // Ensure utils file exists
    await ensureUtilsFile(directory, typescript);

    console.log(`\n📦 Required dependencies: ${result.dependencies.join(', ') || 'none'}`);

    return result;
}

/**
 * Fetch component from remote shadcn registry
 */
async function fetchFromRemoteRegistry(
    componentName: string,
    directory: string,
    typescript: boolean,
    overwrite: boolean
): Promise<ScaffoldResult> {
    const registryUrl = `${SHADCN_REGISTRY_URL}/styles/default/${componentName}.json`;

    console.log(`  📡 Fetching from registry: ${registryUrl}`);

    const response = await fetch(registryUrl);
    if (!response.ok) {
        throw new Error(`Failed to fetch component: ${response.statusText}`);
    }

    const data: RegistryResponse = await response.json();

    const result: ScaffoldResult = {
        files: [],
        dependencies: data.dependencies || [],
        devDependencies: data.devDependencies || [],
        success: true,
    };

    // Create component directory
    const componentDir = path.join(directory, 'components', 'ui');
    ensureDir(componentDir);

    // Write component files
    for (const file of data.files) {
        const filePath = path.join(componentDir, file.name);

        if (fs.existsSync(filePath) && !overwrite) {
            console.log(`  ⚠️  Skipping ${file.name} (already exists)`);
            continue;
        }

        let content = file.content;

        // Convert to JS if not using TypeScript
        if (!typescript && file.name.endsWith('.tsx')) {
            content = convertToJavaScript(content);
            const jsFileName = file.name.replace('.tsx', '.jsx');
            const jsFilePath = path.join(componentDir, jsFileName);
            fs.writeFileSync(jsFilePath, content, 'utf-8');
            result.files.push(jsFilePath);
            console.log(`  ✅ Created ${jsFilePath}`);
        } else {
            fs.writeFileSync(filePath, content, 'utf-8');
            result.files.push(filePath);
            console.log(`  ✅ Created ${filePath}`);
        }
    }

    // Handle registry dependencies
    for (const dep of data.registryDependencies || []) {
        console.log(`  📦 Installing dependency: ${dep}`);
        const depResult = await fetchFromRemoteRegistry(dep, directory, typescript, overwrite);
        result.files.push(...depResult.files);
        result.dependencies.push(...depResult.dependencies);
    }

    return result;
}

/**
 * Scaffold a basic PhilJS component
 */
async function scaffoldComponent(options: ScaffoldOptions): Promise<ScaffoldResult> {
    const { name, directory = '.', typescript = true, overwrite = false } = options;
    const pascalName = toPascalCase(name);
    const ext = typescript ? 'tsx' : 'jsx';

    console.log(`🧩 Scaffolding component: ${pascalName}`);

    const componentDir = path.join(directory, 'components', pascalName);
    ensureDir(componentDir);

    const result: ScaffoldResult = {
        files: [],
        dependencies: [],
        devDependencies: [],
        success: true,
    };

    // Component file
    const componentPath = path.join(componentDir, `${pascalName}.${ext}`);
    if (!fs.existsSync(componentPath) || overwrite) {
        const componentContent = generatePhilJSComponent(pascalName, typescript);
        fs.writeFileSync(componentPath, componentContent, 'utf-8');
        result.files.push(componentPath);
        console.log(`  ✅ Created ${componentPath}`);
    }

    // Index file
    const indexPath = path.join(componentDir, `index.${typescript ? 'ts' : 'js'}`);
    if (!fs.existsSync(indexPath) || overwrite) {
        const indexContent = `export { ${pascalName} } from './${pascalName}';\n${typescript ? `export type { ${pascalName}Props } from './${pascalName}';\n` : ''}`;
        fs.writeFileSync(indexPath, indexContent, 'utf-8');
        result.files.push(indexPath);
        console.log(`  ✅ Created ${indexPath}`);
    }

    // Test file
    const testPath = path.join(componentDir, `${pascalName}.test.${ext}`);
    if (!fs.existsSync(testPath) || overwrite) {
        const testContent = generateTestFile(pascalName, typescript);
        fs.writeFileSync(testPath, testContent, 'utf-8');
        result.files.push(testPath);
        console.log(`  ✅ Created ${testPath}`);
    }

    return result;
}

/**
 * Scaffold a route
 */
async function scaffoldRoute(options: ScaffoldOptions): Promise<ScaffoldResult> {
    const { name, directory = '.', typescript = true, overwrite = false } = options;
    const routePath = name.startsWith('/') ? name.slice(1) : name;
    const routeName = routePath.split('/').pop() || 'page';
    const pascalName = toPascalCase(routeName);
    const ext = typescript ? 'tsx' : 'jsx';

    console.log(`🛣️  Scaffolding route: /${routePath}`);

    const routeDir = path.join(directory, 'routes', routePath);
    ensureDir(routeDir);

    const result: ScaffoldResult = {
        files: [],
        dependencies: [],
        devDependencies: [],
        success: true,
    };

    // Page component
    const pagePath = path.join(routeDir, `page.${ext}`);
    if (!fs.existsSync(pagePath) || overwrite) {
        const pageContent = generateRoutePage(pascalName, routePath, typescript);
        fs.writeFileSync(pagePath, pageContent, 'utf-8');
        result.files.push(pagePath);
        console.log(`  ✅ Created ${pagePath}`);
    }

    // Layout (optional)
    const layoutPath = path.join(routeDir, `layout.${ext}`);
    if (!fs.existsSync(layoutPath) || overwrite) {
        const layoutContent = generateRouteLayout(pascalName, typescript);
        fs.writeFileSync(layoutPath, layoutContent, 'utf-8');
        result.files.push(layoutPath);
        console.log(`  ✅ Created ${layoutPath}`);
    }

    return result;
}

/**
 * Scaffold an API route
 */
async function scaffoldApi(options: ScaffoldOptions): Promise<ScaffoldResult> {
    const { name, directory = '.', typescript = true, overwrite = false } = options;
    const apiPath = name.startsWith('/') ? name.slice(1) : name;
    const ext = typescript ? 'ts' : 'js';

    console.log(`🔌 Scaffolding API route: /api/${apiPath}`);

    const apiDir = path.join(directory, 'routes', 'api', apiPath);
    ensureDir(apiDir);

    const result: ScaffoldResult = {
        files: [],
        dependencies: [],
        devDependencies: [],
        success: true,
    };

    // API handler
    const handlerPath = path.join(apiDir, `route.${ext}`);
    if (!fs.existsSync(handlerPath) || overwrite) {
        const handlerContent = generateApiHandler(apiPath, typescript);
        fs.writeFileSync(handlerPath, handlerContent, 'utf-8');
        result.files.push(handlerPath);
        console.log(`  ✅ Created ${handlerPath}`);
    }

    return result;
}

/**
 * Scaffold a store
 */
async function scaffoldStore(options: ScaffoldOptions): Promise<ScaffoldResult> {
    const { name, directory = '.', typescript = true, overwrite = false } = options;
    const storeName = toCamelCase(name);
    const ext = typescript ? 'ts' : 'js';

    console.log(`📦 Scaffolding store: ${storeName}`);

    const storeDir = path.join(directory, 'stores');
    ensureDir(storeDir);

    const result: ScaffoldResult = {
        files: [],
        dependencies: ['@philjs/core'],
        devDependencies: [],
        success: true,
    };

    const storePath = path.join(storeDir, `${storeName}.${ext}`);
    if (!fs.existsSync(storePath) || overwrite) {
        const storeContent = generateStore(storeName, typescript);
        fs.writeFileSync(storePath, storeContent, 'utf-8');
        result.files.push(storePath);
        console.log(`  ✅ Created ${storePath}`);
    }

    return result;
}

// --- Template Generators ---

function generateShadcnComponent(name: string, fileName: string, typescript: boolean): string {
    const pascalName = toPascalCase(name);
    const isHook = fileName.startsWith('use-');

    if (isHook) {
        return generateShadcnHook(name, fileName, typescript);
    }

    const propsType = typescript
        ? `\nexport interface ${pascalName}Props extends React.HTMLAttributes<HTMLDivElement> {\n  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';\n  size?: 'default' | 'sm' | 'lg' | 'icon';\n}\n`
        : '';

    const propsParam = typescript ? `{ className, variant = 'default', size = 'default', ...props }: ${pascalName}Props` : '{ className, variant = "default", size = "default", ...props }';

    return `/**
 * ${pascalName} Component (shadcn/ui)
 *
 * @see https://ui.shadcn.com/docs/components/${name}
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
${propsType}
const ${pascalName} = React.forwardRef<HTMLDivElement, ${typescript ? `${pascalName}Props` : 'any'}>(
  (${propsParam}, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'philjs-${name}',
          className
        )}
        {...props}
      />
    );
  }
);
${pascalName}.displayName = '${pascalName}';

export { ${pascalName} };
`;
}

function generateShadcnHook(name: string, fileName: string, typescript: boolean): string {
    const hookName = toCamelCase(fileName.replace('.ts', ''));

    return `/**
 * ${hookName} Hook (shadcn/ui)
 */

import * as React from 'react';

${typescript ? `export interface ${toPascalCase(hookName)}State {\n  // Add state properties\n}\n` : ''}
export function ${hookName}() {
  const [state, setState] = React.useState${typescript ? `<${toPascalCase(hookName)}State>` : ''}({});

  return {
    state,
    setState,
  };
}
`;
}

function generatePhilJSComponent(name: string, typescript: boolean): string {
    const propsType = typescript
        ? `\nexport interface ${name}Props {\n  children?: JSX.Element;\n  className?: string;\n}\n`
        : '';

    return `/**
 * ${name} Component
 */

import { JSX } from '@philjs/core';
${propsType}
export function ${name}(props${typescript ? `: ${name}Props` : ''}) {
  const { children, className = '' } = props;

  return (
    <div className={\`${name.toLowerCase()} \${className}\`}>
      {children}
    </div>
  );
}
`;
}

function generateTestFile(name: string, typescript: boolean): string {
    return `import { describe, it, expect } from 'vitest';
import { render, screen } from '@philjs/testing';
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

function generateRoutePage(name: string, routePath: string, typescript: boolean): string {
    return `/**
 * ${name} Page
 * Route: /${routePath}
 */

import { JSX } from '@philjs/core';

export default function ${name}Page() {
  return (
    <main className="${name.toLowerCase()}-page">
      <h1>${name}</h1>
      <p>Welcome to the ${name} page.</p>
    </main>
  );
}
`;
}

function generateRouteLayout(name: string, typescript: boolean): string {
    const childrenType = typescript ? ': { children: JSX.Element }' : '';

    return `/**
 * ${name} Layout
 */

import { JSX } from '@philjs/core';

export default function ${name}Layout({ children }${childrenType}) {
  return (
    <div className="${name.toLowerCase()}-layout">
      {children}
    </div>
  );
}
`;
}

function generateApiHandler(apiPath: string, typescript: boolean): string {
    const reqType = typescript ? ': Request' : '';
    const returnType = typescript ? ': Promise<Response>' : '';

    return `/**
 * API Route: /api/${apiPath}
 */

export async function GET(request${reqType})${returnType} {
  return Response.json({
    message: 'GET /api/${apiPath}',
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request${reqType})${returnType} {
  const body = await request.json();

  return Response.json({
    message: 'POST /api/${apiPath}',
    received: body,
    timestamp: new Date().toISOString(),
  });
}

export async function PUT(request${reqType})${returnType} {
  const body = await request.json();

  return Response.json({
    message: 'PUT /api/${apiPath}',
    updated: body,
    timestamp: new Date().toISOString(),
  });
}

export async function DELETE(request${reqType})${returnType} {
  return Response.json({
    message: 'DELETE /api/${apiPath}',
    deleted: true,
    timestamp: new Date().toISOString(),
  });
}
`;
}

function generateStore(name: string, typescript: boolean): string {
    const pascalName = toPascalCase(name);
    const stateType = typescript
        ? `\nexport interface ${pascalName}State {\n  count: number;\n  loading: boolean;\n  error: string | null;\n}\n`
        : '';

    return `/**
 * ${pascalName} Store
 */

import { createSignal, createMemo } from '@philjs/core';
${stateType}
const initialState${typescript ? `: ${pascalName}State` : ''} = {
  count: 0,
  loading: false,
  error: null,
};

// Create reactive signals
const [state, setState] = createSignal(initialState);

// Derived state
export const isLoading = createMemo(() => state().loading);
export const hasError = createMemo(() => state().error !== null);

// Actions
export function increment() {
  setState(s => ({ ...s, count: s.count + 1 }));
}

export function decrement() {
  setState(s => ({ ...s, count: s.count - 1 }));
}

export function reset() {
  setState(initialState);
}

export async function fetchData() {
  setState(s => ({ ...s, loading: true, error: null }));

  try {
    // Simulated async operation
    await new Promise(r => setTimeout(r, 1000));
    setState(s => ({ ...s, loading: false }));
  } catch (e) {
    setState(s => ({ ...s, loading: false, error: String(e) }));
  }
}

// Export store
export const ${name}Store = {
  get state() { return state(); },
  increment,
  decrement,
  reset,
  fetchData,
  isLoading,
  hasError,
};
`;
}

// --- Utilities ---

function ensureDir(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

async function ensureUtilsFile(directory: string, typescript: boolean): Promise<void> {
    const libDir = path.join(directory, 'lib');
    ensureDir(libDir);

    const utilsPath = path.join(libDir, `utils.${typescript ? 'ts' : 'js'}`);

    if (!fs.existsSync(utilsPath)) {
        const utilsContent = `import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs${typescript ? ': ClassValue[]' : ''}) {
  return twMerge(clsx(inputs));
}
`;
        fs.writeFileSync(utilsPath, utilsContent, 'utf-8');
        console.log(`  ✅ Created ${utilsPath}`);
    }
}

function toPascalCase(str: string): string {
    return str
        .split(/[-_\s]+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('');
}

function toCamelCase(str: string): string {
    const pascal = toPascalCase(str);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

function convertToJavaScript(tsContent: string): string {
    // Basic TypeScript to JavaScript conversion
    return tsContent
        // Remove type annotations
        .replace(/: \w+(\[\])?/g, '')
        .replace(/: \w+<[^>]+>/g, '')
        // Remove interface/type declarations
        .replace(/^(export )?(interface|type) \w+[^}]+}/gm, '')
        // Remove generic type parameters
        .replace(/<[^>]+>/g, '')
        // Remove 'as' type assertions
        .replace(/ as \w+/g, '')
        // Clean up extra newlines
        .replace(/\n{3,}/g, '\n\n');
}

/**
 * List available shadcn components
 */
export function listAvailableComponents(): string[] {
    return Object.keys(SHADCN_COMPONENTS).sort();
}

/**
 * Get info about a shadcn component
 */
export function getComponentInfo(name: string): ShadcnComponent | null {
    return SHADCN_COMPONENTS[name.toLowerCase()] || null;
}
