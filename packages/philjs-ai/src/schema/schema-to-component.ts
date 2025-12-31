/**
 * Schema-to-Component Generator
 *
 * Generates PhilJS components from various schema formats:
 * - JSON Schema
 * - GraphQL Schema
 * - OpenAPI/Swagger
 * - Prisma Schema
 * - Database Schema (SQL)
 * - TypeScript Interfaces
 */

import type { AIProvider, CompletionOptions } from '../types.js';
import { extractCode, extractJSON } from '../utils/parser.js';
import { SYSTEM_PROMPTS } from '../utils/prompts.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Schema type
 */
export type SchemaType =
  | 'json-schema'
  | 'graphql'
  | 'openapi'
  | 'prisma'
  | 'sql'
  | 'typescript';

/**
 * Generated component type
 */
export type GeneratedComponentType =
  | 'form'
  | 'table'
  | 'list'
  | 'detail'
  | 'card'
  | 'crud'
  | 'filter'
  | 'search'
  | 'stats'
  | 'chart';

/**
 * Schema to component options
 */
export interface SchemaToComponentOptions extends Partial<CompletionOptions> {
  /** Schema format */
  schemaType: SchemaType;
  /** Component types to generate */
  componentTypes?: GeneratedComponentType[];
  /** Include validation */
  includeValidation?: boolean;
  /** Include loading states */
  includeLoadingStates?: boolean;
  /** Include error handling */
  includeErrorHandling?: boolean;
  /** Styling approach */
  styleApproach?: 'tailwind' | 'css-modules' | 'styled-components' | 'none';
  /** Generate API hooks */
  generateAPIHooks?: boolean;
  /** Generate types alongside components */
  generateTypes?: boolean;
  /** Entity name override */
  entityName?: string;
}

/**
 * Schema field definition
 */
export interface SchemaField {
  /** Field name */
  name: string;
  /** Field type */
  type: string;
  /** Is required */
  required: boolean;
  /** Is array */
  isArray: boolean;
  /** Is primary key */
  isPrimaryKey?: boolean;
  /** Is foreign key */
  isForeignKey?: boolean;
  /** Referenced entity */
  referencedEntity?: string;
  /** Default value */
  default?: unknown;
  /** Description */
  description?: string;
  /** Validation rules */
  validation?: FieldValidation;
  /** UI hints */
  uiHints?: UIHints;
}

/**
 * Field validation
 */
export interface FieldValidation {
  /** Minimum value/length */
  min?: number;
  /** Maximum value/length */
  max?: number;
  /** Pattern (regex) */
  pattern?: string;
  /** Enum values */
  enum?: string[];
  /** Custom validation message */
  message?: string;
}

/**
 * UI hints for rendering
 */
export interface UIHints {
  /** Display label */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Input type */
  inputType?: 'text' | 'number' | 'email' | 'password' | 'date' | 'select' | 'checkbox' | 'textarea' | 'file';
  /** Is hidden */
  hidden?: boolean;
  /** Is readonly */
  readonly?: boolean;
  /** Display order */
  order?: number;
  /** Field group */
  group?: string;
}

/**
 * Parsed schema
 */
export interface ParsedSchema {
  /** Entity name */
  name: string;
  /** Entity description */
  description?: string;
  /** Fields */
  fields: SchemaField[];
  /** Relations */
  relations: SchemaRelation[];
  /** Original schema type */
  sourceType: SchemaType;
}

/**
 * Schema relation
 */
export interface SchemaRelation {
  /** Relation name */
  name: string;
  /** Relation type */
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
  /** Related entity */
  entity: string;
  /** Foreign key field */
  foreignKey?: string;
}

/**
 * Generated component result
 */
export interface GeneratedSchemaComponent {
  /** Component name */
  name: string;
  /** Component type */
  type: GeneratedComponentType;
  /** Component code */
  code: string;
  /** TypeScript types */
  types?: string;
  /** Validation schema (Zod/Yup) */
  validationSchema?: string;
  /** API hooks if generated */
  apiHooks?: string;
  /** Styles if generated */
  styles?: string;
  /** Usage example */
  example: string;
  /** Props interface */
  propsInterface: string;
}

/**
 * Schema to component result
 */
export interface SchemaToComponentResult {
  /** Parsed schema */
  schema: ParsedSchema;
  /** Generated components */
  components: GeneratedSchemaComponent[];
  /** Shared types */
  types: string;
  /** Index file for exports */
  indexFile: string;
  /** Usage documentation */
  documentation: string;
}

/**
 * CRUD generation result
 */
export interface CRUDGenerationResult {
  /** Create form component */
  createForm: GeneratedSchemaComponent;
  /** Edit form component */
  editForm: GeneratedSchemaComponent;
  /** List/table component */
  list: GeneratedSchemaComponent;
  /** Detail view component */
  detail: GeneratedSchemaComponent;
  /** Delete confirmation component */
  deleteConfirm: GeneratedSchemaComponent;
  /** API hooks */
  apiHooks: string;
  /** Types */
  types: string;
  /** Page component combining all */
  page: GeneratedSchemaComponent;
}

// ============================================================================
// Schema Parser
// ============================================================================

/**
 * Parse schema from various formats
 */
async function parseSchema(
  schema: string,
  type: SchemaType,
  provider: AIProvider
): Promise<ParsedSchema> {
  const prompt = `Parse this ${type} schema into a normalized format:

\`\`\`
${schema}
\`\`\`

Extract:
1. Entity name (singular, PascalCase)
2. Description if available
3. All fields with:
   - name (camelCase)
   - type (TypeScript type)
   - required
   - isArray
   - isPrimaryKey
   - isForeignKey and referencedEntity if applicable
   - default value
   - description
   - validation (min, max, pattern, enum)
   - uiHints (label, placeholder, inputType)

4. Relations with:
   - name
   - type (one-to-one, one-to-many, many-to-many)
   - entity
   - foreignKey

Return JSON matching ParsedSchema interface.`;

  const response = await provider.generateCompletion(prompt, {
    temperature: 0.1,
    systemPrompt: 'You are a schema parsing expert. Extract schema information accurately.',
  });

  return extractJSON<ParsedSchema>(response) || {
    name: 'Entity',
    fields: [],
    relations: [],
    sourceType: type,
  };
}

// ============================================================================
// Schema to Component Generator
// ============================================================================

/**
 * Schema to Component Generator Engine
 *
 * Generates PhilJS components from schema definitions.
 *
 * @example
 * ```typescript
 * const generator = new SchemaToComponentGenerator(provider);
 *
 * // Generate from JSON Schema
 * const result = await generator.generate(jsonSchema, {
 *   schemaType: 'json-schema',
 *   componentTypes: ['form', 'table', 'detail'],
 * });
 *
 * // Generate CRUD from Prisma schema
 * const crud = await generator.generateCRUD(prismaModel, {
 *   schemaType: 'prisma',
 *   generateAPIHooks: true,
 * });
 *
 * // Generate from GraphQL
 * const graphqlComponents = await generator.generate(graphqlType, {
 *   schemaType: 'graphql',
 *   componentTypes: ['form', 'list'],
 * });
 * ```
 */
export class SchemaToComponentGenerator {
  private provider: AIProvider;
  private defaultOptions: Partial<CompletionOptions>;

  constructor(provider: AIProvider, options?: Partial<CompletionOptions>) {
    this.provider = provider;
    this.defaultOptions = {
      temperature: 0.2,
      maxTokens: 8192,
      ...options,
    };
  }

  /**
   * Generate components from schema
   *
   * @param schema - Schema string
   * @param options - Generation options
   * @returns Generated components
   */
  async generate(
    schema: string,
    options: SchemaToComponentOptions
  ): Promise<SchemaToComponentResult> {
    // Parse the schema
    const parsedSchema = await parseSchema(schema, options.schemaType, this.provider);

    // Override entity name if provided
    if (options.entityName) {
      parsedSchema.name = options.entityName;
    }

    // Generate types first
    const types = this.generateTypes(parsedSchema);

    // Generate requested component types
    const componentTypes = options.componentTypes || ['form', 'table'];
    const components: GeneratedSchemaComponent[] = [];

    for (const componentType of componentTypes) {
      const component = await this.generateComponent(parsedSchema, componentType, options);
      components.push(component);
    }

    // Generate API hooks if requested
    if (options.generateAPIHooks) {
      const apiHooks = await this.generateAPIHooks(parsedSchema);
      // Add to each component
      components.forEach(c => c.apiHooks = apiHooks);
    }

    // Generate index file
    const indexFile = this.generateIndexFile(parsedSchema.name, components);

    // Generate documentation
    const documentation = this.generateDocumentation(parsedSchema, components);

    return {
      schema: parsedSchema,
      components,
      types,
      indexFile,
      documentation,
    };
  }

  /**
   * Generate full CRUD components
   *
   * @param schema - Schema string
   * @param options - Generation options
   * @returns CRUD generation result
   */
  async generateCRUD(
    schema: string,
    options: SchemaToComponentOptions
  ): Promise<CRUDGenerationResult> {
    // Parse schema
    const parsedSchema = await parseSchema(schema, options.schemaType, this.provider);

    if (options.entityName) {
      parsedSchema.name = options.entityName;
    }

    // Generate types
    const types = this.generateTypes(parsedSchema);

    // Generate all CRUD components in parallel
    const [createForm, editForm, list, detail, deleteConfirm] = await Promise.all([
      this.generateComponent(parsedSchema, 'form', { ...options, formMode: 'create' } as any),
      this.generateComponent(parsedSchema, 'form', { ...options, formMode: 'edit' } as any),
      this.generateComponent(parsedSchema, 'table', options),
      this.generateComponent(parsedSchema, 'detail', options),
      this.generateDeleteConfirm(parsedSchema, options),
    ]);

    // Rename form components
    createForm.name = `Create${parsedSchema.name}Form`;
    editForm.name = `Edit${parsedSchema.name}Form`;

    // Generate API hooks
    const apiHooks = await this.generateAPIHooks(parsedSchema);

    // Generate page component
    const page = await this.generateCRUDPage(parsedSchema, options);

    return {
      createForm,
      editForm,
      list,
      detail,
      deleteConfirm,
      apiHooks,
      types,
      page,
    };
  }

  /**
   * Generate a single component from schema
   */
  private async generateComponent(
    schema: ParsedSchema,
    type: GeneratedComponentType,
    options: SchemaToComponentOptions
  ): Promise<GeneratedSchemaComponent> {
    const prompt = this.buildComponentPrompt(schema, type, options);

    const response = await this.provider.generateCompletion(prompt, {
      ...this.defaultOptions,
      systemPrompt: this.getSystemPrompt(type, options),
    });

    const code = extractCode(response) || '';
    const name = `${schema.name}${this.getComponentSuffix(type)}`;

    // Generate validation schema if requested
    let validationSchema: string | undefined;
    if (options.includeValidation) {
      validationSchema = await this.generateValidationSchema(schema);
    }

    // Generate props interface
    const propsInterface = this.generatePropsInterface(schema, type);

    // Generate example
    const example = this.generateExample(name, type, schema);

    const types = options.generateTypes ? this.generateTypes(schema) : undefined;

    return {
      name,
      type,
      code,
      example,
      propsInterface,
      ...(types !== undefined && { types }),
      ...(validationSchema !== undefined && { validationSchema }),
    };
  }

  /**
   * Build prompt for component generation
   */
  private buildComponentPrompt(
    schema: ParsedSchema,
    type: GeneratedComponentType,
    options: SchemaToComponentOptions
  ): string {
    const fieldsDescription = schema.fields
      .map(f => `- ${f.name}: ${f.type}${f.required ? ' (required)' : ''}${f.description ? ` - ${f.description}` : ''}`)
      .join('\n');

    const typePrompts: Record<GeneratedComponentType, string> = {
      form: `Generate a PhilJS form component for ${schema.name}:
- Create a controlled form with signals for each field
- Include proper input types based on field types
- Add validation using the field constraints
- Handle form submission
- Show loading and error states
- Include accessibility (labels, aria)`,

      table: `Generate a PhilJS table component for ${schema.name}:
- Display all fields in columns
- Include sorting functionality
- Include pagination if requested
- Add row actions (view, edit, delete)
- Handle loading and empty states`,

      list: `Generate a PhilJS list component for ${schema.name}:
- Display items in a list/card format
- Include essential fields
- Add click handler for selection
- Handle loading and empty states`,

      detail: `Generate a PhilJS detail view component for ${schema.name}:
- Display all fields in a readable format
- Group related fields if applicable
- Include edit and delete actions
- Handle loading state`,

      card: `Generate a PhilJS card component for ${schema.name}:
- Display key information in a card layout
- Include primary action button
- Make it clickable for navigation`,

      crud: `Generate a complete CRUD interface for ${schema.name}:
- Include create, read, update, delete operations
- Use modal for forms
- Include confirmation for delete
- Handle all states (loading, error, success)`,

      filter: `Generate a filter component for ${schema.name}:
- Include filter inputs for key fields
- Add clear filters button
- Emit filter changes to parent`,

      search: `Generate a search component for ${schema.name}:
- Include search input with debounce
- Support filtering by multiple fields
- Show search suggestions if applicable`,

      stats: `Generate a stats/summary component for ${schema.name}:
- Display key metrics
- Include visual indicators (icons, colors)
- Support loading state`,

      chart: `Generate a chart component for ${schema.name}:
- Display data in appropriate chart type
- Include legend and tooltips
- Make it responsive`,
    };

    return `${typePrompts[type]}

Entity: ${schema.name}
${schema.description ? `Description: ${schema.description}` : ''}

Fields:
${fieldsDescription}

${schema.relations.length ? `Relations:\n${schema.relations.map(r => `- ${r.name}: ${r.type} -> ${r.entity}`).join('\n')}` : ''}

Requirements:
- Use PhilJS signals for state
- ${options.styleApproach === 'tailwind' ? 'Use Tailwind CSS classes' : options.styleApproach === 'none' ? 'No styling' : 'Use CSS-in-JS'}
- ${options.includeValidation ? 'Include form validation' : ''}
- ${options.includeLoadingStates ? 'Include loading states' : ''}
- ${options.includeErrorHandling ? 'Include error handling' : ''}
- Use proper TypeScript types
- Export as named export

Return the complete component code.`;
  }

  /**
   * Get system prompt for component type
   */
  private getSystemPrompt(type: GeneratedComponentType, options: SchemaToComponentOptions): string {
    return `${SYSTEM_PROMPTS.philjs}
${SYSTEM_PROMPTS.typescript}

You are generating a ${type} component from a schema.
${options.styleApproach === 'tailwind' ? 'Use Tailwind CSS for styling.' : ''}
Create production-ready, accessible components.
Follow PhilJS patterns (signals, memo, effect).`;
  }

  /**
   * Get component name suffix
   */
  private getComponentSuffix(type: GeneratedComponentType): string {
    const suffixes: Record<GeneratedComponentType, string> = {
      form: 'Form',
      table: 'Table',
      list: 'List',
      detail: 'Detail',
      card: 'Card',
      crud: 'CRUD',
      filter: 'Filter',
      search: 'Search',
      stats: 'Stats',
      chart: 'Chart',
    };
    return suffixes[type];
  }

  /**
   * Generate TypeScript types from schema
   */
  private generateTypes(schema: ParsedSchema): string {
    const props = schema.fields
      .map(f => {
        const typeStr = f.isArray ? `${f.type}[]` : f.type;
        const optional = f.required ? '' : '?';
        const comment = f.description ? `  /** ${f.description} */\n` : '';
        return `${comment}  ${f.name}${optional}: ${typeStr};`;
      })
      .join('\n');

    return `/**
 * ${schema.name} entity type
 */
export interface ${schema.name} {
${props}
}

/**
 * ${schema.name} creation input
 */
export interface Create${schema.name}Input {
${schema.fields
  .filter(f => !f.isPrimaryKey)
  .map(f => `  ${f.name}${f.required ? '' : '?'}: ${f.isArray ? `${f.type}[]` : f.type};`)
  .join('\n')}
}

/**
 * ${schema.name} update input
 */
export interface Update${schema.name}Input extends Partial<Create${schema.name}Input> {
  id: string;
}
`;
  }

  /**
   * Generate props interface
   */
  private generatePropsInterface(schema: ParsedSchema, type: GeneratedComponentType): string {
    const name = `${schema.name}${this.getComponentSuffix(type)}Props`;

    switch (type) {
      case 'form':
        return `interface ${name} {
  initialData?: Partial<${schema.name}>;
  onSubmit: (data: ${schema.name}) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}`;
      case 'table':
        return `interface ${name} {
  data: ${schema.name}[];
  onRowClick?: (item: ${schema.name}) => void;
  onEdit?: (item: ${schema.name}) => void;
  onDelete?: (item: ${schema.name}) => void;
  isLoading?: boolean;
}`;
      case 'detail':
        return `interface ${name} {
  data: ${schema.name};
  onEdit?: () => void;
  onDelete?: () => void;
  isLoading?: boolean;
}`;
      case 'list':
        return `interface ${name} {
  data: ${schema.name}[];
  isLoading?: boolean;
}`;
      default:
        return `interface ${name} {
  data: ${schema.name};
  isLoading?: boolean;
}`;
    }
  }

  /**
   * Generate validation schema (Zod)
   */
  private async generateValidationSchema(schema: ParsedSchema): Promise<string> {
    const fields = schema.fields
      .filter(f => !f.isPrimaryKey)
      .map(f => {
        let zodType = this.mapToZodType(f.type);

        if (f.validation) {
          if (f.validation.min !== undefined) {
            zodType += f.type === 'string' ? `.min(${f.validation.min})` : `.gte(${f.validation.min})`;
          }
          if (f.validation.max !== undefined) {
            zodType += f.type === 'string' ? `.max(${f.validation.max})` : `.lte(${f.validation.max})`;
          }
          if (f.validation.pattern) {
            zodType += `.regex(/${f.validation.pattern}/)`;
          }
          if (f.validation.enum) {
            zodType = `z.enum([${f.validation.enum.map(e => `'${e}'`).join(', ')}])`;
          }
        }

        if (!f.required) {
          zodType += '.optional()';
        }

        if (f.isArray) {
          zodType = `z.array(${zodType})`;
        }

        return `  ${f.name}: ${zodType},`;
      })
      .join('\n');

    return `import { z } from 'zod';

export const ${schema.name.toLowerCase()}Schema = z.object({
${fields}
});

export type ${schema.name}FormData = z.infer<typeof ${schema.name.toLowerCase()}Schema>;
`;
  }

  /**
   * Map TypeScript type to Zod type
   */
  private mapToZodType(type: string): string {
    const mapping: Record<string, string> = {
      'string': 'z.string()',
      'number': 'z.number()',
      'boolean': 'z.boolean()',
      'Date': 'z.date()',
      'object': 'z.object({})',
      'any': 'z.any()',
    };
    return mapping[type] || 'z.unknown()';
  }

  /**
   * Generate API hooks
   */
  private async generateAPIHooks(schema: ParsedSchema): Promise<string> {
    const name = schema.name;
    const lower = name.toLowerCase();

    return `import { signal, effect } from '@philjs/core';
import type { ${name}, Create${name}Input, Update${name}Input } from './${lower}.types';

const API_BASE = '/api/${lower}s';

/**
 * Fetch all ${name}s
 */
export function use${name}s() {
  const items = signal<${name}[]>([]);
  const isLoading = signal(true);
  const error = signal<Error | null>(null);

  const fetch${name}s = async () => {
    isLoading.set(true);
    error.set(null);
    try {
      const response = await fetch(API_BASE);
      const data = await response.json();
      items.set(data);
    } catch (e) {
      error.set(e instanceof Error ? e : new Error('Failed to fetch'));
    } finally {
      isLoading.set(false);
    }
  };

  effect(() => {
    fetch${name}s();
  });

  return {
    items: () => items(),
    isLoading: () => isLoading(),
    error: () => error(),
    refetch: fetch${name}s,
  };
}

/**
 * Fetch single ${name}
 */
export function use${name}(id: string) {
  const item = signal<${name} | null>(null);
  const isLoading = signal(true);
  const error = signal<Error | null>(null);

  effect(() => {
    if (!id) return;
    isLoading.set(true);
    fetch(\`\${API_BASE}/\${id}\`)
      .then(r => r.json())
      .then(data => item.set(data))
      .catch(e => error.set(e))
      .finally(() => isLoading.set(false));
  });

  return {
    item: () => item(),
    isLoading: () => isLoading(),
    error: () => error(),
  };
}

/**
 * Create ${name}
 */
export function useCreate${name}() {
  const isLoading = signal(false);
  const error = signal<Error | null>(null);

  const create = async (data: Create${name}Input): Promise<${name} | null> => {
    isLoading.set(true);
    error.set(null);
    try {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (e) {
      error.set(e instanceof Error ? e : new Error('Failed to create'));
      return null;
    } finally {
      isLoading.set(false);
    }
  };

  return { create, isLoading: () => isLoading(), error: () => error() };
}

/**
 * Update ${name}
 */
export function useUpdate${name}() {
  const isLoading = signal(false);
  const error = signal<Error | null>(null);

  const update = async (data: Update${name}Input): Promise<${name} | null> => {
    isLoading.set(true);
    error.set(null);
    try {
      const response = await fetch(\`\${API_BASE}/\${data.id}\`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (e) {
      error.set(e instanceof Error ? e : new Error('Failed to update'));
      return null;
    } finally {
      isLoading.set(false);
    }
  };

  return { update, isLoading: () => isLoading(), error: () => error() };
}

/**
 * Delete ${name}
 */
export function useDelete${name}() {
  const isLoading = signal(false);
  const error = signal<Error | null>(null);

  const remove = async (id: string): Promise<boolean> => {
    isLoading.set(true);
    error.set(null);
    try {
      await fetch(\`\${API_BASE}/\${id}\`, { method: 'DELETE' });
      return true;
    } catch (e) {
      error.set(e instanceof Error ? e : new Error('Failed to delete'));
      return false;
    } finally {
      isLoading.set(false);
    }
  };

  return { remove, isLoading: () => isLoading(), error: () => error() };
}
`;
  }

  /**
   * Generate delete confirmation component
   */
  private async generateDeleteConfirm(
    schema: ParsedSchema,
    options: SchemaToComponentOptions
  ): Promise<GeneratedSchemaComponent> {
    const name = schema.name;

    const code = `import { signal } from '@philjs/core';
import type { ${name} } from './${name.toLowerCase()}.types';

interface Delete${name}ConfirmProps {
  item: ${name};
  open: boolean;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export function Delete${name}Confirm({ item, open, onConfirm, onCancel }: Delete${name}ConfirmProps) {
  const [isDeleting, setIsDeleting] = signal(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
    }
  };

  if (!open) return null;

  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="fixed inset-0 bg-black/50" onClick={onCancel} />
      <div class="relative bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
        <h2 class="text-lg font-semibold mb-4">Delete ${name}</h2>
        <p class="text-gray-600 mb-6">
          Are you sure you want to delete this ${name.toLowerCase()}? This action cannot be undone.
        </p>
        <div class="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            class="px-4 py-2 border rounded-md hover:bg-gray-50"
            disabled={isDeleting()}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            disabled={isDeleting()}
          >
            {isDeleting() ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
`;

    return {
      name: `Delete${name}Confirm`,
      type: 'crud',
      code,
      example: `<Delete${name}Confirm item={item} open={isOpen} onConfirm={handleDelete} onCancel={close} />`,
      propsInterface: `interface Delete${name}ConfirmProps { item: ${name}; open: boolean; onConfirm: () => Promise<void>; onCancel: () => void; }`,
    };
  }

  /**
   * Generate CRUD page component
   */
  private async generateCRUDPage(
    schema: ParsedSchema,
    options: SchemaToComponentOptions
  ): Promise<GeneratedSchemaComponent> {
    const name = schema.name;

    const code = `import { signal } from '@philjs/core';
import { ${name}Table } from './${name}Table';
import { Create${name}Form } from './Create${name}Form';
import { Edit${name}Form } from './Edit${name}Form';
import { ${name}Detail } from './${name}Detail';
import { Delete${name}Confirm } from './Delete${name}Confirm';
import { use${name}s, useCreate${name}, useUpdate${name}, useDelete${name} } from './${name.toLowerCase()}.hooks';
import type { ${name} } from './${name.toLowerCase()}.types';

export function ${name}Page() {
  const { items, isLoading, error, refetch } = use${name}s();
  const { create, isLoading: isCreating } = useCreate${name}();
  const { update, isLoading: isUpdating } = useUpdate${name}();
  const { remove, isLoading: isDeleting } = useDelete${name}();

  const [view, setView] = signal<'list' | 'create' | 'edit' | 'detail'>('list');
  const [selected, setSelected] = signal<${name} | null>(null);
  const [showDelete, setShowDelete] = signal(false);

  const handleCreate = async (data: Omit<${name}, 'id'>) => {
    const result = await create(data);
    if (result) {
      setView('list');
      refetch();
    }
  };

  const handleUpdate = async (data: ${name}) => {
    const result = await update(data);
    if (result) {
      setView('list');
      setSelected(null);
      refetch();
    }
  };

  const handleDelete = async () => {
    if (selected()) {
      const success = await remove(selected()!.id);
      if (success) {
        setShowDelete(false);
        setSelected(null);
        refetch();
      }
    }
  };

  if (error()) {
    return <div class="p-4 text-red-600">Error: {error()?.message}</div>;
  }

  return (
    <div class="p-6">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold">${name}s</h1>
        {view() === 'list' && (
          <button
            onClick={() => setView('create')}
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Create ${name}
          </button>
        )}
      </div>

      {view() === 'list' && (
        <${name}Table
          data={items()}
          isLoading={isLoading()}
          onRowClick={(item) => { setSelected(item); setView('detail'); }}
          onEdit={(item) => { setSelected(item); setView('edit'); }}
          onDelete={(item) => { setSelected(item); setShowDelete(true); }}
        />
      )}

      {view() === 'create' && (
        <Create${name}Form
          onSubmit={handleCreate}
          onCancel={() => setView('list')}
          isLoading={isCreating()}
        />
      )}

      {view() === 'edit' && selected() && (
        <Edit${name}Form
          initialData={selected()!}
          onSubmit={handleUpdate}
          onCancel={() => { setView('list'); setSelected(null); }}
          isLoading={isUpdating()}
        />
      )}

      {view() === 'detail' && selected() && (
        <${name}Detail
          data={selected()!}
          onEdit={() => setView('edit')}
          onDelete={() => setShowDelete(true)}
        />
      )}

      <Delete${name}Confirm
        item={selected()!}
        open={showDelete()}
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </div>
  );
}
`;

    return {
      name: `${name}Page`,
      type: 'crud',
      code,
      example: `<${name}Page />`,
      propsInterface: `// No props required`,
    };
  }

  /**
   * Generate index file
   */
  private generateIndexFile(entityName: string, components: GeneratedSchemaComponent[]): string {
    const exports = components.map(c => `export { ${c.name} } from './${c.name}';`).join('\n');

    return `// ${entityName} Components
${exports}

// Types
export type { ${entityName}, Create${entityName}Input, Update${entityName}Input } from './${entityName.toLowerCase()}.types';

// Hooks
export { use${entityName}s, use${entityName}, useCreate${entityName}, useUpdate${entityName}, useDelete${entityName} } from './${entityName.toLowerCase()}.hooks';
`;
  }

  /**
   * Generate documentation
   */
  private generateDocumentation(schema: ParsedSchema, components: GeneratedSchemaComponent[]): string {
    return `# ${schema.name} Components

Generated from ${schema.sourceType} schema.

## Components

${components.map(c => `### ${c.name}

Type: ${c.type}

\`\`\`typescript
${c.propsInterface}
\`\`\`

**Usage:**
\`\`\`tsx
${c.example}
\`\`\`
`).join('\n')}

## Types

See \`${schema.name.toLowerCase()}.types.ts\` for type definitions.

## API Hooks

- \`use${schema.name}s()\` - Fetch all ${schema.name}s
- \`use${schema.name}(id)\` - Fetch single ${schema.name}
- \`useCreate${schema.name}()\` - Create new ${schema.name}
- \`useUpdate${schema.name}()\` - Update existing ${schema.name}
- \`useDelete${schema.name}()\` - Delete ${schema.name}
`;
  }

  /**
   * Generate usage example
   */
  private generateExample(name: string, type: GeneratedComponentType, schema: ParsedSchema): string {
    switch (type) {
      case 'form':
        return `<${name} onSubmit={handleSubmit} onCancel={handleCancel} />`;
      case 'table':
        return `<${name} data={items} onRowClick={handleRowClick} onEdit={handleEdit} onDelete={handleDelete} />`;
      case 'detail':
        return `<${name} data={item} onEdit={handleEdit} onDelete={handleDelete} />`;
      case 'list':
        return `<${name} data={items} onItemClick={handleItemClick} />`;
      default:
        return `<${name} data={data} />`;
    }
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a schema to component generator instance
 */
export function createSchemaToComponentGenerator(
  provider: AIProvider,
  options?: Partial<CompletionOptions>
): SchemaToComponentGenerator {
  return new SchemaToComponentGenerator(provider, options);
}

/**
 * Quick schema to component helper
 */
export async function generateComponentsFromSchema(
  provider: AIProvider,
  schema: string,
  options: SchemaToComponentOptions
): Promise<SchemaToComponentResult> {
  const generator = new SchemaToComponentGenerator(provider);
  return generator.generate(schema, options);
}

/**
 * Quick CRUD generation helper
 */
export async function generateCRUDFromSchema(
  provider: AIProvider,
  schema: string,
  options: SchemaToComponentOptions
): Promise<CRUDGenerationResult> {
  const generator = new SchemaToComponentGenerator(provider);
  return generator.generateCRUD(schema, options);
}

/**
 * Quick JSON Schema to component helper
 */
export async function generateFromJSONSchema(
  provider: AIProvider,
  jsonSchema: object,
  componentTypes?: GeneratedComponentType[]
): Promise<SchemaToComponentResult> {
  const generator = new SchemaToComponentGenerator(provider);
  return generator.generate(JSON.stringify(jsonSchema, null, 2), {
    schemaType: 'json-schema',
    componentTypes: componentTypes || ['form', 'table'],
    generateTypes: true,
  });
}

/**
 * Quick GraphQL to component helper
 */
export async function generateFromGraphQL(
  provider: AIProvider,
  graphqlSchema: string,
  componentTypes?: GeneratedComponentType[]
): Promise<SchemaToComponentResult> {
  const generator = new SchemaToComponentGenerator(provider);
  return generator.generate(graphqlSchema, {
    schemaType: 'graphql',
    componentTypes: componentTypes || ['form', 'table'],
    generateTypes: true,
  });
}
