/**
 * PhilJS CLI - Component Generator
 *
 * Generate component files with tests and styles
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as pc from 'picocolors';
import {
  createContext,
  toPascalCase,
  type TemplateContext,
} from './template-engine.js';

export interface ComponentOptions {
  name: string;
  directory?: string;
  typescript?: boolean;
  withTest?: boolean;
  withStyles?: boolean;
  styleType?: 'css-modules' | 'tailwind' | 'styled' | 'none';
}

/**
 * Generate a component
 */
export async function generateComponent(options: ComponentOptions): Promise<string[]> {
  const {
    name,
    directory = 'src/components',
    typescript = true,
    withTest = true,
    withStyles = false,
    styleType = 'css-modules',
  } = options;

  const componentName = toPascalCase(name);
  const ext = typescript ? 'tsx' : 'jsx';
  const componentDir = path.join(process.cwd(), directory, componentName);
  const createdFiles: string[] = [];

  // Create directory
  await fs.mkdir(componentDir, { recursive: true });

  const context = createContext(name, {
    typescript,
    withTest,
    withStyles,
    styleType,
  });

  // Generate component file
  const componentContent = generateComponentTemplate(context);
  const componentPath = path.join(componentDir, `${componentName}.${ext}`);
  await fs.writeFile(componentPath, componentContent);
  createdFiles.push(componentPath);
  console.log(pc.green(`  + Created ${componentName}.${ext}`));

  // Generate index file
  const indexContent = generateIndexTemplate(context);
  const indexPath = path.join(componentDir, `index.${typescript ? 'ts' : 'js'}`);
  await fs.writeFile(indexPath, indexContent);
  createdFiles.push(indexPath);
  console.log(pc.green(`  + Created index.${typescript ? 'ts' : 'js'}`));

  // Generate test file
  if (withTest) {
    const testContent = generateTestTemplate(context);
    const testPath = path.join(componentDir, `${componentName}.test.${ext}`);
    await fs.writeFile(testPath, testContent);
    createdFiles.push(testPath);
    console.log(pc.green(`  + Created ${componentName}.test.${ext}`));
  }

  // Generate styles file
  if (withStyles && styleType !== 'none') {
    const stylesContent = generateStylesTemplate(context);
    const stylesExt = styleType === 'styled' ? (typescript ? 'ts' : 'js') : 'css';
    const stylesName = styleType === 'css-modules' ? `${componentName}.module.css` : `${componentName}.styles.${stylesExt}`;
    const stylesPath = path.join(componentDir, stylesName);
    await fs.writeFile(stylesPath, stylesContent);
    createdFiles.push(stylesPath);
    console.log(pc.green(`  + Created ${stylesName}`));
  }

  return createdFiles;
}

function generateComponentTemplate(context: TemplateContext): string {
  const { pascalName, typescript, withStyles, styleType } = context;

  const propsType = typescript
    ? `\nexport interface ${pascalName}Props {\n  children?: JSX.Element;\n  className?: string;\n}\n`
    : '';

  const propsParam = typescript ? `props: ${pascalName}Props` : 'props';

  let styleImport = '';
  if (withStyles) {
    if (styleType === 'css-modules') {
      styleImport = `import styles from './${pascalName}.module.css';\n`;
    } else if (styleType === 'styled') {
      styleImport = `import { container } from './${pascalName}.styles';\n`;
    }
  }

  const className = withStyles && styleType === 'css-modules'
    ? `className={styles.container}`
    : `className={\`${pascalName.toLowerCase()} \${className}\`}`;

  return `/**
 * ${pascalName} Component
 */

import { JSX } from 'philjs-core';
${styleImport}${propsType}
export function ${pascalName}(${propsParam}) {
  const { children, className = '' } = props;

  return (
    <div ${className}>
      {children}
    </div>
  );
}
`;
}

function generateIndexTemplate(context: TemplateContext): string {
  const { pascalName, typescript } = context;

  if (typescript) {
    return `export { ${pascalName} } from './${pascalName}';
export type { ${pascalName}Props } from './${pascalName}';
`;
  }

  return `export { ${pascalName} } from './${pascalName}';
`;
}

function generateTestTemplate(context: TemplateContext): string {
  const { pascalName } = context;

  return `import { describe, it, expect } from 'vitest';
import { render, screen } from 'philjs-testing';
import { ${pascalName} } from './${pascalName}';

describe('${pascalName}', () => {
  it('renders children correctly', () => {
    render(<${pascalName}>Test Content</${pascalName}>);
    expect(screen.getByText('Test Content')).toBeTruthy();
  });

  it('applies custom className', () => {
    const { container } = render(<${pascalName} className="custom" />);
    expect(container.querySelector('.custom')).toBeTruthy();
  });
});
`;
}

function generateStylesTemplate(context: TemplateContext): string {
  const { pascalName, styleType } = context;

  if (styleType === 'styled') {
    return `/**
 * ${pascalName} Styles
 */

import { css } from 'philjs-styles';

export const container = css\`
  /* Component styles */
\`;
`;
  }

  if (styleType === 'tailwind') {
    return `/* ${pascalName} - Tailwind styles */
/* Use className="..." directly in the component */
`;
  }

  // Default: css-modules
  return `.container {
  /* Component styles */
}
`;
}
