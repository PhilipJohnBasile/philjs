/**
 * PhilJS CLI - Scaffold Generator
 *
 * Generate full CRUD: model, API routes, list page, detail page, form components
 * Inspired by RedwoodJS scaffold command
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import * as pc from 'picocolors';
import { parseFieldDefinition } from '../prompts.js';
import { generateModel } from './model.js';
import { generateApi } from './api.js';
import { generatePage } from './page.js';
import { generateComponent } from './component.js';
import { toPascalCase, toCamelCase, toKebabCase, createContext, } from './template-engine.js';
/**
 * Generate a full CRUD scaffold
 */
export async function generateScaffold(options) {
    const { name, fields = [], provider = 'prisma', typescript = true, withTests = true, skipModel = false, skipApi = false, skipPages = false, skipComponents = false, } = options;
    const modelName = toPascalCase(name);
    const camelName = toCamelCase(name);
    const kebabName = toKebabCase(name);
    const parsedFields = fields.map(f => parseFieldDefinition(f)).filter((f) => f !== null);
    const createdFiles = [];
    console.log(pc.cyan(`\nGenerating scaffold for ${modelName}...\n`));
    // 1. Generate Model
    if (!skipModel) {
        const modelFiles = await generateModel({
            name: modelName,
            fields,
            provider,
            typescript,
        });
        createdFiles.push(...modelFiles);
    }
    // 2. Generate API Routes
    if (!skipApi) {
        // List/Create endpoint
        const listApiFiles = await generateApi({
            name: camelName,
            directory: 'src/api',
            typescript,
            withTest: withTests,
            methods: ['GET', 'POST'],
        });
        createdFiles.push(...listApiFiles);
        // Detail/Update/Delete endpoint
        const detailApiFiles = await generateApi({
            name: `${camelName}/[id]`,
            directory: 'src/api',
            typescript,
            withTest: withTests,
            methods: ['GET', 'PUT', 'DELETE'],
        });
        createdFiles.push(...detailApiFiles);
    }
    // 3. Generate Pages
    if (!skipPages) {
        // List page
        const listPagePath = path.join(process.cwd(), 'src/pages', kebabName);
        await fs.mkdir(listPagePath, { recursive: true });
        const listPageFiles = await generateListPage(modelName, parsedFields, typescript, withTests);
        createdFiles.push(...listPageFiles);
        // Detail page
        const detailPageFiles = await generateDetailPage(modelName, parsedFields, typescript, withTests);
        createdFiles.push(...detailPageFiles);
        // New page (create form)
        const newPageFiles = await generateNewPage(modelName, parsedFields, typescript, withTests);
        createdFiles.push(...newPageFiles);
        // Edit page
        const editPageFiles = await generateEditPage(modelName, parsedFields, typescript, withTests);
        createdFiles.push(...editPageFiles);
    }
    // 4. Generate Components
    if (!skipComponents) {
        // Form component
        const formFiles = await generateFormComponent(modelName, parsedFields, typescript, withTests);
        createdFiles.push(...formFiles);
        // List component
        const listComponentFiles = await generateListComponent(modelName, parsedFields, typescript, withTests);
        createdFiles.push(...listComponentFiles);
        // Detail component
        const detailComponentFiles = await generateDetailComponent(modelName, parsedFields, typescript, withTests);
        createdFiles.push(...detailComponentFiles);
    }
    console.log(pc.green(`\nScaffold for ${modelName} created successfully!`));
    console.log(pc.dim(`  1. Run database migrations: npx prisma migrate dev`));
    console.log(pc.dim(`  2. Update API routes with your business logic`));
    console.log(pc.dim(`  3. Customize form validation`));
    console.log(pc.dim(`  4. Add routes to your router configuration\n`));
    return createdFiles;
}
/**
 * Generate list page
 */
async function generateListPage(modelName, fields, typescript, withTest) {
    const kebabName = toKebabCase(modelName);
    const camelName = toCamelCase(modelName);
    const ext = typescript ? 'tsx' : 'jsx';
    const pageDir = path.join(process.cwd(), 'src/pages', kebabName);
    await fs.mkdir(pageDir, { recursive: true });
    const files = [];
    // Page component
    const pageContent = `/**
 * ${modelName} List Page
 */

import { JSX } from '@philjs/core';
import { Head, Title, Meta } from 'philjs-meta';
import { Link } from 'philjs-router';
import { ${modelName}List } from '../../components/${modelName}/${modelName}List';

export function ${modelName}ListPage() {
  return (
    <>
      <Head>
        <Title>${modelName}s</Title>
        <Meta name="description" content="Manage ${modelName.toLowerCase()}s" />
      </Head>

      <main className="${kebabName}-list-page">
        <header className="page-header">
          <h1>${modelName}s</h1>
          <Link to="/${kebabName}/new" className="btn btn-primary">
            Create New ${modelName}
          </Link>
        </header>

        <${modelName}List />
      </main>
    </>
  );
}

export default ${modelName}ListPage;
`;
    const pagePath = path.join(pageDir, `index.${ext}`);
    await fs.writeFile(pagePath, pageContent);
    files.push(pagePath);
    console.log(pc.green(`  + Created ${kebabName}/index.${ext}`));
    // Loader
    const loaderContent = `/**
 * Loader for ${modelName} List Page
 */

export async function loader() {
  const response = await fetch('/api/${kebabName}');
  if (!response.ok) {
    throw new Error('Failed to fetch ${camelName}s');
  }
  return response.json();
}
`;
    const loaderPath = path.join(pageDir, `loader.${typescript ? 'ts' : 'js'}`);
    await fs.writeFile(loaderPath, loaderContent);
    files.push(loaderPath);
    console.log(pc.green(`  + Created ${kebabName}/loader.${typescript ? 'ts' : 'js'}`));
    return files;
}
/**
 * Generate detail page
 */
async function generateDetailPage(modelName, fields, typescript, withTest) {
    const kebabName = toKebabCase(modelName);
    const camelName = toCamelCase(modelName);
    const ext = typescript ? 'tsx' : 'jsx';
    const pageDir = path.join(process.cwd(), 'src/pages', kebabName, '[id]');
    await fs.mkdir(pageDir, { recursive: true });
    const files = [];
    const pageContent = `/**
 * ${modelName} Detail Page
 */

import { JSX } from '@philjs/core';
import { Head, Title, Meta } from 'philjs-meta';
import { useParams, Link } from 'philjs-router';
import { useLoaderData } from 'philjs-router';
import { ${modelName}Detail } from '../../../components/${modelName}/${modelName}Detail';
import type { loader } from './loader';

${typescript ? `interface PageParams {\n  id: string;\n}\n` : ''}
export function ${modelName}DetailPage() {
  const params = useParams${typescript ? '<PageParams>' : ''}();
  const data = useLoaderData<typeof loader>();

  return (
    <>
      <Head>
        <Title>{data?.${camelName}?.name || '${modelName}'}</Title>
        <Meta name="description" content="${modelName} details" />
      </Head>

      <main className="${kebabName}-detail-page">
        <header className="page-header">
          <Link to="/${kebabName}" className="btn-back">Back to List</Link>
          <div className="actions">
            <Link to={\`/${kebabName}/\${params.id}/edit\`} className="btn">Edit</Link>
          </div>
        </header>

        <${modelName}Detail ${camelName}={data?.${camelName}} />
      </main>
    </>
  );
}

export default ${modelName}DetailPage;
`;
    const pagePath = path.join(pageDir, `index.${ext}`);
    await fs.writeFile(pagePath, pageContent);
    files.push(pagePath);
    console.log(pc.green(`  + Created ${kebabName}/[id]/index.${ext}`));
    // Loader
    const loaderContent = `/**
 * Loader for ${modelName} Detail Page
 */

export async function loader({ params }${typescript ? ': { params: { id: string } }' : ''}) {
  const response = await fetch(\`/api/${kebabName}/\${params.id}\`);
  if (!response.ok) {
    throw new Error('${modelName} not found');
  }
  return response.json();
}
`;
    const loaderPath = path.join(pageDir, `loader.${typescript ? 'ts' : 'js'}`);
    await fs.writeFile(loaderPath, loaderContent);
    files.push(loaderPath);
    console.log(pc.green(`  + Created ${kebabName}/[id]/loader.${typescript ? 'ts' : 'js'}`));
    return files;
}
/**
 * Generate new (create) page
 */
async function generateNewPage(modelName, fields, typescript, withTest) {
    const kebabName = toKebabCase(modelName);
    const ext = typescript ? 'tsx' : 'jsx';
    const pageDir = path.join(process.cwd(), 'src/pages', kebabName, 'new');
    await fs.mkdir(pageDir, { recursive: true });
    const files = [];
    const pageContent = `/**
 * New ${modelName} Page
 */

import { JSX } from '@philjs/core';
import { Head, Title, Meta } from 'philjs-meta';
import { Link, useNavigate } from 'philjs-router';
import { ${modelName}Form } from '../../../components/${modelName}/${modelName}Form';

export function New${modelName}Page() {
  const navigate = useNavigate();

  const handleSubmit = async (data${typescript ? `: Record<string, unknown>` : ''}) => {
    const response = await fetch('/api/${kebabName}', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      const created = await response.json();
      navigate(\`/${kebabName}/\${created.id}\`);
    }
  };

  return (
    <>
      <Head>
        <Title>New ${modelName}</Title>
        <Meta name="description" content="Create a new ${modelName.toLowerCase()}" />
      </Head>

      <main className="${kebabName}-new-page">
        <header className="page-header">
          <Link to="/${kebabName}" className="btn-back">Back to List</Link>
          <h1>Create New ${modelName}</h1>
        </header>

        <${modelName}Form onSubmit={handleSubmit} />
      </main>
    </>
  );
}

export default New${modelName}Page;
`;
    const pagePath = path.join(pageDir, `index.${ext}`);
    await fs.writeFile(pagePath, pageContent);
    files.push(pagePath);
    console.log(pc.green(`  + Created ${kebabName}/new/index.${ext}`));
    return files;
}
/**
 * Generate edit page
 */
async function generateEditPage(modelName, fields, typescript, withTest) {
    const kebabName = toKebabCase(modelName);
    const camelName = toCamelCase(modelName);
    const ext = typescript ? 'tsx' : 'jsx';
    const pageDir = path.join(process.cwd(), 'src/pages', kebabName, '[id]', 'edit');
    await fs.mkdir(pageDir, { recursive: true });
    const files = [];
    const pageContent = `/**
 * Edit ${modelName} Page
 */

import { JSX } from '@philjs/core';
import { Head, Title, Meta } from 'philjs-meta';
import { useParams, Link, useNavigate } from 'philjs-router';
import { useLoaderData } from 'philjs-router';
import { ${modelName}Form } from '../../../../components/${modelName}/${modelName}Form';
import type { loader } from './loader';

${typescript ? `interface PageParams {\n  id: string;\n}\n` : ''}
export function Edit${modelName}Page() {
  const params = useParams${typescript ? '<PageParams>' : ''}();
  const data = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  const handleSubmit = async (formData${typescript ? `: Record<string, unknown>` : ''}) => {
    const response = await fetch(\`/api/${kebabName}/\${params.id}\`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      navigate(\`/${kebabName}/\${params.id}\`);
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this ${modelName.toLowerCase()}?')) {
      const response = await fetch(\`/api/${kebabName}/\${params.id}\`, {
        method: 'DELETE',
      });

      if (response.ok) {
        navigate('/${kebabName}');
      }
    }
  };

  return (
    <>
      <Head>
        <Title>Edit ${modelName}</Title>
        <Meta name="description" content="Edit ${modelName.toLowerCase()}" />
      </Head>

      <main className="${kebabName}-edit-page">
        <header className="page-header">
          <Link to={\`/${kebabName}/\${params.id}\`} className="btn-back">Back</Link>
          <h1>Edit ${modelName}</h1>
          <button onClick={handleDelete} className="btn btn-danger">Delete</button>
        </header>

        <${modelName}Form
          defaultValues={data?.${camelName}}
          onSubmit={handleSubmit}
          mode="edit"
        />
      </main>
    </>
  );
}

export default Edit${modelName}Page;
`;
    const pagePath = path.join(pageDir, `index.${ext}`);
    await fs.writeFile(pagePath, pageContent);
    files.push(pagePath);
    console.log(pc.green(`  + Created ${kebabName}/[id]/edit/index.${ext}`));
    // Loader
    const loaderContent = `/**
 * Loader for Edit ${modelName} Page
 */

export async function loader({ params }${typescript ? ': { params: { id: string } }' : ''}) {
  const response = await fetch(\`/api/${kebabName}/\${params.id}\`);
  if (!response.ok) {
    throw new Error('${modelName} not found');
  }
  return response.json();
}
`;
    const loaderPath = path.join(pageDir, `loader.${typescript ? 'ts' : 'js'}`);
    await fs.writeFile(loaderPath, loaderContent);
    files.push(loaderPath);
    console.log(pc.green(`  + Created ${kebabName}/[id]/edit/loader.${typescript ? 'ts' : 'js'}`));
    return files;
}
/**
 * Generate form component
 */
async function generateFormComponent(modelName, fields, typescript, withTest) {
    const kebabName = toKebabCase(modelName);
    const camelName = toCamelCase(modelName);
    const ext = typescript ? 'tsx' : 'jsx';
    const componentDir = path.join(process.cwd(), 'src/components', modelName);
    await fs.mkdir(componentDir, { recursive: true });
    const files = [];
    // Generate form fields based on model fields
    const formFields = fields.map(f => {
        const inputType = getInputType(f.type);
        return `      <div className="form-group">
        <label htmlFor="${f.name}">${toPascalCase(f.name)}</label>
        <input
          type="${inputType}"
          id="${f.name}"
          name="${f.name}"
          value={formData.${f.name} ?? ''}
          onChange={handleChange}
          ${f.modifiers.includes('optional') ? '' : 'required'}
        />
      </div>`;
    }).join('\n\n');
    const defaultValuesType = typescript
        ? `${modelName}FormData`
        : '';
    const pageContent = `/**
 * ${modelName} Form Component
 */

import { JSX, signal } from '@philjs/core';

${typescript ? `export interface ${modelName}FormData {\n${fields.map(f => `  ${f.name}${f.modifiers.includes('optional') ? '?' : ''}: ${getTypeScriptType(f.type)};`).join('\n')}\n}\n` : ''}
${typescript ? `export interface ${modelName}FormProps {\n  defaultValues?: Partial<${modelName}FormData>;\n  onSubmit: (data: ${modelName}FormData) => void | Promise<void>;\n  mode?: 'create' | 'edit';\n}\n` : ''}
export function ${modelName}Form(${typescript ? `props: ${modelName}FormProps` : 'props'}) {
  const { defaultValues = {}, onSubmit, mode = 'create' } = props;

  const formData = signal${typescript ? `<Partial<${modelName}FormData>>` : ''}({
${fields.map(f => `    ${f.name}: defaultValues.${f.name} ?? ${getDefaultValue(f.type)},`).join('\n')}
  });

  const handleChange = (e${typescript ? ': Event' : ''}) => {
    const target = e.target as HTMLInputElement;
    formData.set({
      ...formData.get(),
      [target.name]: target.type === 'checkbox' ? target.checked : target.value,
    });
  };

  const handleSubmit = async (e${typescript ? ': Event' : ''}) => {
    e.preventDefault();
    await onSubmit(formData.get() as ${typescript ? modelName + 'FormData' : 'any'});
  };

  return (
    <form onSubmit={handleSubmit} className="${kebabName}-form">
${formFields}

      <div className="form-actions">
        <button type="submit" className="btn btn-primary">
          {mode === 'edit' ? 'Update' : 'Create'} ${modelName}
        </button>
      </div>
    </form>
  );
}
`;
    const pagePath = path.join(componentDir, `${modelName}Form.${ext}`);
    await fs.writeFile(pagePath, pageContent);
    files.push(pagePath);
    console.log(pc.green(`  + Created ${modelName}/${modelName}Form.${ext}`));
    return files;
}
/**
 * Generate list component
 */
async function generateListComponent(modelName, fields, typescript, withTest) {
    const kebabName = toKebabCase(modelName);
    const camelName = toCamelCase(modelName);
    const ext = typescript ? 'tsx' : 'jsx';
    const componentDir = path.join(process.cwd(), 'src/components', modelName);
    await fs.mkdir(componentDir, { recursive: true });
    const files = [];
    // Show first 3 fields in the list
    const displayFields = fields.slice(0, 3);
    const pageContent = `/**
 * ${modelName} List Component
 */

import { JSX, signal, effect } from '@philjs/core';
import { Link } from 'philjs-router';

${typescript ? `export interface ${modelName}Item {\n  id: string;\n${fields.map(f => `  ${f.name}${f.modifiers.includes('optional') ? '?' : ''}: ${getTypeScriptType(f.type)};`).join('\n')}\n}\n` : ''}
${typescript ? `export interface ${modelName}ListProps {\n  items?: ${modelName}Item[];\n}\n` : ''}
export function ${modelName}List(${typescript ? `props: ${modelName}ListProps = {}` : 'props = {}'}) {
  const items = signal${typescript ? `<${modelName}Item[]>` : ''}([]);
  const loading = signal(true);
  const error = signal${typescript ? '<string | null>' : ''}(null);

  effect(() => {
    if (props.items) {
      items.set(props.items);
      loading.set(false);
      return;
    }

    fetch('/api/${kebabName}')
      .then(res => res.json())
      .then(data => {
        items.set(data.data || []);
        loading.set(false);
      })
      .catch(err => {
        error.set(err.message);
        loading.set(false);
      });
  });

  if (loading.get()) {
    return <div className="${kebabName}-list-loading">Loading...</div>;
  }

  if (error.get()) {
    return <div className="${kebabName}-list-error">Error: {error.get()}</div>;
  }

  if (items.get().length === 0) {
    return (
      <div className="${kebabName}-list-empty">
        <p>No ${modelName.toLowerCase()}s found.</p>
        <Link to="/${kebabName}/new" className="btn btn-primary">Create your first ${modelName}</Link>
      </div>
    );
  }

  return (
    <div className="${kebabName}-list">
      <table>
        <thead>
          <tr>
${displayFields.map(f => `            <th>${toPascalCase(f.name)}</th>`).join('\n')}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.get().map(${camelName} => (
            <tr key={${camelName}.id}>
${displayFields.map(f => `              <td>{${camelName}.${f.name}}</td>`).join('\n')}
              <td>
                <Link to={\`/${kebabName}/\${${camelName}.id}\`} className="btn-link">View</Link>
                <Link to={\`/${kebabName}/\${${camelName}.id}/edit\`} className="btn-link">Edit</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
`;
    const pagePath = path.join(componentDir, `${modelName}List.${ext}`);
    await fs.writeFile(pagePath, pageContent);
    files.push(pagePath);
    console.log(pc.green(`  + Created ${modelName}/${modelName}List.${ext}`));
    return files;
}
/**
 * Generate detail component
 */
async function generateDetailComponent(modelName, fields, typescript, withTest) {
    const kebabName = toKebabCase(modelName);
    const camelName = toCamelCase(modelName);
    const ext = typescript ? 'tsx' : 'jsx';
    const componentDir = path.join(process.cwd(), 'src/components', modelName);
    await fs.mkdir(componentDir, { recursive: true });
    const files = [];
    const pageContent = `/**
 * ${modelName} Detail Component
 */

import { JSX } from '@philjs/core';

${typescript ? `export interface ${modelName}Data {\n  id: string;\n${fields.map(f => `  ${f.name}${f.modifiers.includes('optional') ? '?' : ''}: ${getTypeScriptType(f.type)};`).join('\n')}\n  createdAt?: string;\n  updatedAt?: string;\n}\n` : ''}
${typescript ? `export interface ${modelName}DetailProps {\n  ${camelName}?: ${modelName}Data | null;\n}\n` : ''}
export function ${modelName}Detail(${typescript ? `props: ${modelName}DetailProps` : 'props'}) {
  const { ${camelName} } = props;

  if (!${camelName}) {
    return <div className="${kebabName}-detail-not-found">${modelName} not found</div>;
  }

  return (
    <div className="${kebabName}-detail">
      <dl className="detail-list">
${fields.map(f => `        <div className="detail-row">
          <dt>${toPascalCase(f.name)}</dt>
          <dd>{${camelName}.${f.name}${f.modifiers.includes('optional') ? ' ?? "-"' : ''}}</dd>
        </div>`).join('\n')}

        {${camelName}.createdAt && (
          <div className="detail-row">
            <dt>Created</dt>
            <dd>{new Date(${camelName}.createdAt).toLocaleString()}</dd>
          </div>
        )}

        {${camelName}.updatedAt && (
          <div className="detail-row">
            <dt>Updated</dt>
            <dd>{new Date(${camelName}.updatedAt).toLocaleString()}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}
`;
    const pagePath = path.join(componentDir, `${modelName}Detail.${ext}`);
    await fs.writeFile(pagePath, pageContent);
    files.push(pagePath);
    console.log(pc.green(`  + Created ${modelName}/${modelName}Detail.${ext}`));
    // Create index file
    const indexContent = `export { ${modelName}Form } from './${modelName}Form';
export { ${modelName}List } from './${modelName}List';
export { ${modelName}Detail } from './${modelName}Detail';
${typescript ? `export type { ${modelName}FormData, ${modelName}FormProps } from './${modelName}Form';
export type { ${modelName}Item, ${modelName}ListProps } from './${modelName}List';
export type { ${modelName}Data, ${modelName}DetailProps } from './${modelName}Detail';
` : ''}`;
    const indexPath = path.join(componentDir, `index.${typescript ? 'ts' : 'js'}`);
    await fs.writeFile(indexPath, indexContent);
    files.push(indexPath);
    console.log(pc.green(`  + Created ${modelName}/index.${typescript ? 'ts' : 'js'}`));
    return files;
}
// Helper functions
function getInputType(fieldType) {
    switch (fieldType.toLowerCase()) {
        case 'int':
        case 'integer':
        case 'float':
        case 'double':
            return 'number';
        case 'boolean':
            return 'checkbox';
        case 'datetime':
        case 'date':
            return 'datetime-local';
        case 'text':
            return 'textarea';
        case 'email':
            return 'email';
        case 'url':
            return 'url';
        default:
            return 'text';
    }
}
function getTypeScriptType(fieldType) {
    switch (fieldType.toLowerCase()) {
        case 'int':
        case 'integer':
        case 'float':
        case 'double':
            return 'number';
        case 'boolean':
            return 'boolean';
        case 'datetime':
        case 'date':
            return 'string';
        case 'json':
            return 'Record<string, unknown>';
        default:
            return 'string';
    }
}
function getDefaultValue(fieldType) {
    switch (fieldType.toLowerCase()) {
        case 'int':
        case 'integer':
        case 'float':
        case 'double':
            return '0';
        case 'boolean':
            return 'false';
        default:
            return "''";
    }
}
//# sourceMappingURL=scaffold.js.map