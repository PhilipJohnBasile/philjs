/**
 * PhilJS VS Code - Code Generators
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

const config = () => vscode.workspace.getConfiguration('philjs');

export async function createComponent(name: string): Promise<void> {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) {
    vscode.window.showErrorMessage('No workspace folder open');
    return;
  }

  const componentDir = config().get<string>('componentDirectory', 'src/components');
  const pascalName = toPascalCase(name);
  const targetDir = path.join(workspaceFolder.uri.fsPath, componentDir, pascalName);

  // Create directory
  await fs.promises.mkdir(targetDir, { recursive: true });

  // Create component file
  const componentContent = `/**
 * ${pascalName} Component
 */

import { JSX } from 'philjs-core';

export interface ${pascalName}Props {
  children?: JSX.Element;
  className?: string;
}

export function ${pascalName}(props: ${pascalName}Props) {
  const { children, className = '' } = props;

  return (
    <div className={\`${name.toLowerCase()} \${className}\`}>
      {children}
    </div>
  );
}
`;

  await fs.promises.writeFile(
    path.join(targetDir, `${pascalName}.tsx`),
    componentContent
  );

  // Create index file
  const indexContent = `export { ${pascalName} } from './${pascalName}';
export type { ${pascalName}Props } from './${pascalName}';
`;

  await fs.promises.writeFile(
    path.join(targetDir, 'index.ts'),
    indexContent
  );

  // Create test file
  const testContent = `import { describe, it, expect } from 'vitest';
import { render, screen } from 'philjs-testing';
import { ${pascalName} } from './${pascalName}';

describe('${pascalName}', () => {
  it('renders children correctly', () => {
    render(<${pascalName}>Test Content</${pascalName}>);
    expect(screen.getByText('Test Content')).toBeTruthy();
  });
});
`;

  await fs.promises.writeFile(
    path.join(targetDir, `${pascalName}.test.tsx`),
    testContent
  );

  // Open the component file
  const doc = await vscode.workspace.openTextDocument(
    path.join(targetDir, `${pascalName}.tsx`)
  );
  await vscode.window.showTextDocument(doc);

  vscode.window.showInformationMessage(`Component ${pascalName} created successfully!`);
}

export async function createRoute(name: string): Promise<void> {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) {
    vscode.window.showErrorMessage('No workspace folder open');
    return;
  }

  const routesDir = config().get<string>('routesDirectory', 'src/routes');
  const kebabName = toKebabCase(name);
  const pascalName = toPascalCase(name) + 'Route';
  const targetDir = path.join(workspaceFolder.uri.fsPath, routesDir, kebabName);

  // Create directory
  await fs.promises.mkdir(targetDir, { recursive: true });

  // Create route component
  const routeContent = `/**
 * ${pascalName} - Route component for /${kebabName}
 */

import { JSX } from 'philjs-core';
import { useLoaderData } from 'philjs-router';
import type { loader } from './loader';

export default function ${pascalName}() {
  const data = useLoaderData<typeof loader>();

  return (
    <div className="${kebabName}-route">
      <h1>${toPascalCase(name)}</h1>
      {/* Route content */}
    </div>
  );
}
`;

  await fs.promises.writeFile(
    path.join(targetDir, 'index.tsx'),
    routeContent
  );

  // Create loader
  const loaderContent = `/**
 * Loader for ${pascalName}
 */

export async function loader(): Promise<{ title: string }> {
  return {
    title: '${toPascalCase(name)}',
  };
}
`;

  await fs.promises.writeFile(
    path.join(targetDir, 'loader.ts'),
    loaderContent
  );

  // Open the route file
  const doc = await vscode.workspace.openTextDocument(
    path.join(targetDir, 'index.tsx')
  );
  await vscode.window.showTextDocument(doc);

  vscode.window.showInformationMessage(`Route ${kebabName} created successfully!`);
}

export async function createPage(name: string): Promise<void> {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) {
    vscode.window.showErrorMessage('No workspace folder open');
    return;
  }

  const pagesDir = 'src/pages';
  const kebabName = toKebabCase(name);
  const pascalName = toPascalCase(name) + 'Page';
  const targetDir = path.join(workspaceFolder.uri.fsPath, pagesDir);

  // Create directory
  await fs.promises.mkdir(targetDir, { recursive: true });

  // Create page component
  const pageContent = `/**
 * ${pascalName} - Page component
 */

import { JSX } from 'philjs-core';
import { Head, Title, Meta } from 'philjs-meta';

export function ${pascalName}() {
  return (
    <>
      <Head>
        <Title>${toPascalCase(name)}</Title>
        <Meta name="description" content="${toPascalCase(name)} page" />
      </Head>

      <main className="${kebabName}-page">
        <h1>${toPascalCase(name)}</h1>
        {/* Page content */}
      </main>
    </>
  );
}

export default ${pascalName};
`;

  await fs.promises.writeFile(
    path.join(targetDir, `${kebabName}.tsx`),
    pageContent
  );

  // Open the page file
  const doc = await vscode.workspace.openTextDocument(
    path.join(targetDir, `${kebabName}.tsx`)
  );
  await vscode.window.showTextDocument(doc);

  vscode.window.showInformationMessage(`Page ${pascalName} created successfully!`);
}

export async function createHook(name: string): Promise<void> {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) {
    vscode.window.showErrorMessage('No workspace folder open');
    return;
  }

  const hooksDir = 'src/hooks';
  const hookName = name.startsWith('use') ? name : `use${toPascalCase(name)}`;
  const targetDir = path.join(workspaceFolder.uri.fsPath, hooksDir);

  // Create directory
  await fs.promises.mkdir(targetDir, { recursive: true });

  // Create hook
  const hookContent = `/**
 * ${hookName} - Custom hook
 */

import { signal } from 'philjs-core';

export function ${hookName}(initialValue: string = ''): {
  value: string;
  setValue: (v: string) => void;
} {
  const state = signal(initialValue);

  const setValue = (newValue: string) => {
    state.set(newValue);
  };

  return {
    value: state.get(),
    setValue,
  };
}
`;

  await fs.promises.writeFile(
    path.join(targetDir, `${hookName}.ts`),
    hookContent
  );

  // Open the hook file
  const doc = await vscode.workspace.openTextDocument(
    path.join(targetDir, `${hookName}.ts`)
  );
  await vscode.window.showTextDocument(doc);

  vscode.window.showInformationMessage(`Hook ${hookName} created successfully!`);
}

export async function createStore(name: string): Promise<void> {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) {
    vscode.window.showErrorMessage('No workspace folder open');
    return;
  }

  const storesDir = 'src/stores';
  const kebabName = toKebabCase(name);
  const pascalName = toPascalCase(name);
  const targetDir = path.join(workspaceFolder.uri.fsPath, storesDir);

  // Create directory
  await fs.promises.mkdir(targetDir, { recursive: true });

  // Create store
  const storeContent = `/**
 * ${pascalName} Store
 */

import { signal, computed } from 'philjs-core';

interface ${pascalName}State {
  items: string[];
  loading: boolean;
}

const state = signal<${pascalName}State>({
  items: [],
  loading: false,
});

export const ${kebabName}Store = {
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
  addItem(item: string) {
    const current = state.get();
    state.set({
      ...current,
      items: [...current.items, item],
    });
  },

  removeItem(item: string) {
    const current = state.get();
    state.set({
      ...current,
      items: current.items.filter(i => i !== item),
    });
  },

  setLoading(loading: boolean) {
    state.set({ ...state.get(), loading });
  },

  reset() {
    state.set({ items: [], loading: false });
  },
};
`;

  await fs.promises.writeFile(
    path.join(targetDir, `${kebabName}.ts`),
    storeContent
  );

  // Open the store file
  const doc = await vscode.workspace.openTextDocument(
    path.join(targetDir, `${kebabName}.ts`)
  );
  await vscode.window.showTextDocument(doc);

  vscode.window.showInformationMessage(`Store ${kebabName}Store created successfully!`);
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
