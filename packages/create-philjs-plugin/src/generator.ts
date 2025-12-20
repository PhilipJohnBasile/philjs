/**
 * Plugin generator - Creates plugin files from templates
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as pc from 'picocolors';
import {
  createContext,
  generateConfigInterface,
  generatePluginFactory,
  generateImports,
  generateTestTemplate,
  generateReadmeTemplate,
  generatePackageJsonTemplate,
  generateTSConfigTemplate,
  generateVitestConfigTemplate,
  generateGitignoreTemplate,
  fileHeader,
  type TemplateContext,
} from './template-engine.js';

export interface PluginOptions {
  name: string;
  type: 'basic' | 'vite' | 'transform' | 'ui-addon' | 'api' | 'database' | 'auth';
  description: string;
  author: string;
  license: string;
  features: string[];
  typescript: boolean;
  testing: boolean;
  gitInit: boolean;
  targetDir: string;
}

/**
 * Create a new plugin from templates
 */
export async function createPlugin(options: PluginOptions): Promise<void> {
  const {
    name,
    type,
    description,
    author,
    license,
    features,
    typescript,
    testing,
    gitInit,
    targetDir,
  } = options;

  // Create context
  const context = createContext(name, {
    type,
    description,
    author,
    license,
    features,
    typescript,
    testing,
  });

  // Create plugin directory
  const pluginDir = path.resolve(process.cwd(), targetDir, name);
  await fs.mkdir(pluginDir, { recursive: true });

  console.log(pc.dim(`  Creating plugin in ${pluginDir}`));

  // Create directory structure
  await createDirectoryStructure(pluginDir, context);

  // Generate files
  await generatePluginFiles(pluginDir, context);

  // Initialize git if requested
  if (gitInit) {
    await initializeGit(pluginDir);
  }

  console.log(pc.green(`  ✓ Plugin created successfully!`));
}

/**
 * Create directory structure
 */
async function createDirectoryStructure(
  pluginDir: string,
  context: TemplateContext
): Promise<void> {
  const dirs = [
    'src',
    context.testing ? 'src/__tests__' : null,
    'examples',
  ].filter(Boolean) as string[];

  for (const dir of dirs) {
    await fs.mkdir(path.join(pluginDir, dir), { recursive: true });
  }
}

/**
 * Generate all plugin files
 */
async function generatePluginFiles(
  pluginDir: string,
  context: TemplateContext
): Promise<void> {
  // Generate main plugin file
  await generateMainPlugin(pluginDir, context);

  // Generate package.json
  await generatePackageJson(pluginDir, context);

  // Generate tsconfig.json
  if (context.typescript) {
    await generateTSConfig(pluginDir, context);
  }

  // Generate README.md
  await generateReadme(pluginDir, context);

  // Generate .gitignore
  await generateGitignore(pluginDir);

  // Generate tests
  if (context.testing) {
    await generateTests(pluginDir, context);
    await generateVitestConfig(pluginDir);
  }

  // Generate examples
  await generateExamples(pluginDir, context);

  // Generate type-specific files
  if (context.type === 'ui-addon') {
    await generateUIAddonFiles(pluginDir, context);
  }

  if (context.type === 'transform') {
    await generateTransformFiles(pluginDir, context);
  }
}

/**
 * Generate main plugin file
 */
async function generateMainPlugin(
  pluginDir: string,
  context: TemplateContext
): Promise<void> {
  const imports = generateImports(context.features, context.typescript);
  const configInterface = generateConfigInterface(context);
  const pluginFactory = generatePluginFactory(context);

  const content = `${fileHeader(context, 'index.ts')}

${imports}

${configInterface}

${pluginFactory}
`;

  const filename = context.typescript ? 'index.ts' : 'index.js';
  await fs.writeFile(path.join(pluginDir, 'src', filename), content);
  console.log(pc.green(`  + Created src/${filename}`));
}

/**
 * Generate package.json
 */
async function generatePackageJson(
  pluginDir: string,
  context: TemplateContext
): Promise<void> {
  const pkg = generatePackageJsonTemplate(context);
  await fs.writeFile(
    path.join(pluginDir, 'package.json'),
    JSON.stringify(pkg, null, 2) + '\n'
  );
  console.log(pc.green(`  + Created package.json`));
}

/**
 * Generate tsconfig.json
 */
async function generateTSConfig(
  pluginDir: string,
  context: TemplateContext
): Promise<void> {
  const tsconfig = generateTSConfigTemplate();
  await fs.writeFile(
    path.join(pluginDir, 'tsconfig.json'),
    JSON.stringify(tsconfig, null, 2) + '\n'
  );
  console.log(pc.green(`  + Created tsconfig.json`));
}

/**
 * Generate README.md
 */
async function generateReadme(
  pluginDir: string,
  context: TemplateContext
): Promise<void> {
  const readme = generateReadmeTemplate(context);
  await fs.writeFile(path.join(pluginDir, 'README.md'), readme);
  console.log(pc.green(`  + Created README.md`));
}

/**
 * Generate .gitignore
 */
async function generateGitignore(pluginDir: string): Promise<void> {
  const gitignore = generateGitignoreTemplate();
  await fs.writeFile(path.join(pluginDir, '.gitignore'), gitignore);
  console.log(pc.green(`  + Created .gitignore`));
}

/**
 * Generate tests
 */
async function generateTests(
  pluginDir: string,
  context: TemplateContext
): Promise<void> {
  const testContent = generateTestTemplate(context);
  const testFile = context.typescript ? 'index.test.ts' : 'index.test.js';
  await fs.writeFile(
    path.join(pluginDir, 'src', '__tests__', testFile),
    testContent
  );
  console.log(pc.green(`  + Created src/__tests__/${testFile}`));
}

/**
 * Generate vitest config
 */
async function generateVitestConfig(pluginDir: string): Promise<void> {
  const config = generateVitestConfigTemplate();
  await fs.writeFile(path.join(pluginDir, 'vitest.config.ts'), config);
  console.log(pc.green(`  + Created vitest.config.ts`));
}

/**
 * Generate examples
 */
async function generateExamples(
  pluginDir: string,
  context: TemplateContext
): Promise<void> {
  const { pascalName, pluginName, typescript } = context;
  const ext = typescript ? 'ts' : 'js';

  const basicExample = `/**
 * Basic usage example for ${pluginName}
 */

import { defineConfig } from 'philjs-core';
import ${pascalName.replace(/Plugin$/, '')}Plugin from '${pluginName}';

export default defineConfig({
  plugins: [
    ${pascalName.replace(/Plugin$/, '')}Plugin({
      enabled: true,
    }),
  ],
});
`;

  await fs.writeFile(
    path.join(pluginDir, 'examples', `basic.${ext}`),
    basicExample
  );
  console.log(pc.green(`  + Created examples/basic.${ext}`));

  // Add advanced example if features are present
  if (context.features.length > 0) {
    const advancedExample = `/**
 * Advanced usage example for ${pluginName}
 */

import { defineConfig } from 'philjs-core';
import ${pascalName.replace(/Plugin$/, '')}Plugin from '${pluginName}';

export default defineConfig({
  plugins: [
    ${pascalName.replace(/Plugin$/, '')}Plugin({
      enabled: true,
      // Add feature-specific configuration here
    }),
  ],
});
`;

    await fs.writeFile(
      path.join(pluginDir, 'examples', `advanced.${ext}`),
      advancedExample
    );
    console.log(pc.green(`  + Created examples/advanced.${ext}`));
  }
}

/**
 * Generate UI addon specific files
 */
async function generateUIAddonFiles(
  pluginDir: string,
  context: TemplateContext
): Promise<void> {
  const { pascalName, typescript } = context;
  const ext = typescript ? 'tsx' : 'jsx';

  // Generate a sample component
  const componentContent = `${fileHeader(context, 'components/Button.tsx')}

import * as React from 'react';

export interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={\`btn btn-\${variant}\`}
    >
      {children}
    </button>
  );
};
`;

  await fs.mkdir(path.join(pluginDir, 'src', 'components'), { recursive: true });
  await fs.writeFile(
    path.join(pluginDir, 'src', 'components', `Button.${ext}`),
    componentContent
  );
  console.log(pc.green(`  + Created src/components/Button.${ext}`));

  // Generate styles
  const stylesContent = `/**
 * Styles for ${pascalName}
 */

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.25rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover {
  background-color: #0056b3;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background-color: #545b62;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
`;

  await fs.mkdir(path.join(pluginDir, 'src', 'styles'), { recursive: true });
  await fs.writeFile(
    path.join(pluginDir, 'src', 'styles', 'index.css'),
    stylesContent
  );
  console.log(pc.green(`  + Created src/styles/index.css`));
}

/**
 * Generate transform plugin specific files
 */
async function generateTransformFiles(
  pluginDir: string,
  context: TemplateContext
): Promise<void> {
  const { typescript } = context;
  const ext = typescript ? 'ts' : 'js';

  const transformerContent = `${fileHeader(context, 'transformer.ts')}

/**
 * Code transformer utility
 */
export function transform(code: string, id: string): { code: string; map?: any } | null {
  // Add your transformation logic here

  // Example: Simple string replacement
  if (code.includes('__REPLACE_ME__')) {
    return {
      code: code.replace(/__REPLACE_ME__/g, 'REPLACED'),
    };
  }

  return null;
}

/**
 * AST-based transformation (if using Babel)
 */
export function transformAST(ast: any): any {
  // Add AST transformation logic here
  return ast;
}
`;

  await fs.mkdir(path.join(pluginDir, 'src', 'utils'), { recursive: true });
  await fs.writeFile(
    path.join(pluginDir, 'src', 'utils', `transformer.${ext}`),
    transformerContent
  );
  console.log(pc.green(`  + Created src/utils/transformer.${ext}`));
}

/**
 * Initialize git repository
 */
async function initializeGit(pluginDir: string): Promise<void> {
  try {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    await execAsync('git init', { cwd: pluginDir });
    await execAsync('git add .', { cwd: pluginDir });
    await execAsync('git commit -m "Initial commit"', { cwd: pluginDir });

    console.log(pc.green(`  + Initialized git repository`));
  } catch (error) {
    console.log(pc.yellow(`  ⚠ Could not initialize git repository`));
  }
}
