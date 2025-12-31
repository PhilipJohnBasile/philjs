/**
 * PhilJS CLI - Page Generator
 *
 * Generate page components with routes, loaders, and SEO
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import * as pc from 'picocolors';
import { createContext, toPascalCase, toKebabCase, extractRouteParams, isDynamicRoute, } from './template-engine.js';
/**
 * Generate a page with route
 */
export async function generatePage(options) {
    const { name, directory = 'src/pages', typescript = true, withTest = true, withStyles = false, withLoader = true, } = options;
    const pageName = toKebabCase(name);
    const componentName = toPascalCase(name) + 'Page';
    const ext = typescript ? 'tsx' : 'jsx';
    const routeParams = extractRouteParams(name);
    const isDynamic = isDynamicRoute(name);
    // Determine directory structure
    // For "users/[id]", create src/pages/users/[id]/
    const pageDir = path.join(process.cwd(), directory, pageName);
    const createdFiles = [];
    // Create directory
    await fs.mkdir(pageDir, { recursive: true });
    const context = createContext(name, {
        typescript,
        withTest,
        withStyles,
        routeParams,
        isDynamic,
        hasLoader: withLoader,
    });
    // Generate page component
    const pageContent = generatePageTemplate(context);
    const pagePath = path.join(pageDir, `index.${ext}`);
    await fs.writeFile(pagePath, pageContent);
    createdFiles.push(pagePath);
    console.log(pc.green(`  + Created ${pageName}/index.${ext}`));
    // Generate loader file
    if (withLoader) {
        const loaderContent = generateLoaderTemplate(context);
        const loaderPath = path.join(pageDir, `loader.${typescript ? 'ts' : 'js'}`);
        await fs.writeFile(loaderPath, loaderContent);
        createdFiles.push(loaderPath);
        console.log(pc.green(`  + Created ${pageName}/loader.${typescript ? 'ts' : 'js'}`));
    }
    // Generate test file
    if (withTest) {
        const testContent = generateTestTemplate(context);
        const testPath = path.join(pageDir, `index.test.${ext}`);
        await fs.writeFile(testPath, testContent);
        createdFiles.push(testPath);
        console.log(pc.green(`  + Created ${pageName}/index.test.${ext}`));
    }
    // Generate styles file
    if (withStyles) {
        const stylesContent = generateStylesTemplate(context);
        const stylesPath = path.join(pageDir, `styles.module.css`);
        await fs.writeFile(stylesPath, stylesContent);
        createdFiles.push(stylesPath);
        console.log(pc.green(`  + Created ${pageName}/styles.module.css`));
    }
    return createdFiles;
}
function generatePageTemplate(context) {
    const { pascalName, kebabName, typescript, isDynamic, routeParams, hasLoader, withStyles } = context;
    const componentName = `${pascalName}Page`;
    const propsType = typescript
        ? `\nexport interface ${componentName}Props {\n  // Page props\n}\n`
        : '';
    const loaderImport = hasLoader
        ? `import { useLoaderData } from 'philjs-router';\nimport type { loader } from './loader';\n`
        : '';
    const loaderHook = hasLoader
        ? `const data = useLoaderData<typeof loader>();\n`
        : '';
    const styleImport = withStyles
        ? `import styles from './styles.module.css';\n`
        : '';
    const paramsType = isDynamic && typescript
        ? `\ninterface PageParams {\n${routeParams.map(p => `  ${p}: string;`).join('\n')}\n}\n`
        : '';
    const paramsHook = isDynamic
        ? `const params = useParams${typescript ? '<PageParams>' : ''}();\n  `
        : '';
    const paramsImport = isDynamic
        ? ', useParams'
        : '';
    return `/**
 * ${componentName} - Page component
 */

import { JSX } from 'philjs-core';
import { Head, Title, Meta } from 'philjs-meta';
${loaderImport}${isDynamic ? `import { useParams${paramsImport.slice(2)} } from 'philjs-router';\n` : ''}${styleImport}${propsType}${paramsType}
export function ${componentName}() {
  ${loaderHook}${paramsHook}
  return (
    <>
      <Head>
        <Title>${pascalName}</Title>
        <Meta name="description" content="${pascalName} page" />
      </Head>

      <main className="${withStyles ? 'styles.page' : `${kebabName}-page`}">
        <h1>${pascalName}</h1>
        {/* Page content */}
      </main>
    </>
  );
}

export default ${componentName};
`;
}
function generateLoaderTemplate(context) {
    const { pascalName, typescript, isDynamic, routeParams } = context;
    const componentName = `${pascalName}Page`;
    const paramsType = isDynamic && typescript
        ? `{ params }: { params: { ${routeParams.map(p => `${p}: string`).join('; ')} } }`
        : '';
    const returnType = typescript ? `: Promise<{ title: string }>` : '';
    return `/**
 * Loader for ${componentName}
 */

export async function loader(${paramsType})${returnType} {
  // Fetch data for the page
  ${isDynamic ? `// Access params: ${routeParams.map(p => `params.${p}`).join(', ')}` : ''}

  return {
    title: '${pascalName}',
  };
}
`;
}
function generateTestTemplate(context) {
    const { pascalName, kebabName } = context;
    const componentName = `${pascalName}Page`;
    return `import { describe, it, expect, vi } from 'vitest';
import { render, screen } from 'philjs-testing';
import { createMemoryRouter, RouterProvider } from 'philjs-router';
import { ${componentName} } from './index';
import { loader } from './loader';

describe('${componentName}', () => {
  it('renders the page', async () => {
    const router = createMemoryRouter([
      { path: '/${kebabName}', element: <${componentName} />, loader },
    ], { initialEntries: ['/${kebabName}'] });

    render(<RouterProvider router={router} />);

    await screen.findByRole('heading');
    expect(screen.getByRole('heading')).toHaveTextContent('${pascalName}');
  });
});
`;
}
function generateStylesTemplate(context) {
    return `.page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.page h1 {
  margin-bottom: 1.5rem;
}
`;
}
//# sourceMappingURL=page.js.map