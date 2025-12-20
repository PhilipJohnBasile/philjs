/**
 * PhilJS CLI - Model Generator
 *
 * Generate database models for Prisma or Drizzle
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as pc from 'picocolors';
import { parseFieldDefinition, type ModelField } from '../prompts.js';
import { toPascalCase, toCamelCase, toSnakeCase } from './template-engine.js';

export interface ModelOptions {
  name: string;
  fields?: string[];
  provider?: 'prisma' | 'drizzle';
  schemaPath?: string;
  typescript?: boolean;
}

export type { ModelField };

/**
 * Generate a database model
 */
export async function generateModel(options: ModelOptions): Promise<string[]> {
  const {
    name,
    fields = [],
    provider = 'prisma',
    schemaPath,
    typescript = true,
  } = options;

  const modelName = toPascalCase(name);
  const parsedFields = fields.map(f => parseFieldDefinition(f)).filter((f): f is ModelField => f !== null);
  const createdFiles: string[] = [];

  if (provider === 'prisma') {
    const filePath = await generatePrismaModel(modelName, parsedFields, schemaPath);
    createdFiles.push(filePath);
  } else {
    const filePath = await generateDrizzleModel(modelName, parsedFields, typescript);
    createdFiles.push(filePath);
  }

  return createdFiles;
}

/**
 * Generate Prisma model and append to schema.prisma
 */
async function generatePrismaModel(
  modelName: string,
  fields: ModelField[],
  schemaPath?: string
): Promise<string> {
  const prismaSchemaPath = schemaPath || path.join(process.cwd(), 'prisma', 'schema.prisma');

  // Ensure prisma directory exists
  await fs.mkdir(path.dirname(prismaSchemaPath), { recursive: true });

  // Check if schema.prisma exists
  let existingSchema = '';
  try {
    existingSchema = await fs.readFile(prismaSchemaPath, 'utf-8');
  } catch {
    // Create new schema with default datasource
    existingSchema = `// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

`;
  }

  // Check if model already exists
  if (existingSchema.includes(`model ${modelName} {`)) {
    console.log(pc.yellow(`  ! Model ${modelName} already exists in schema.prisma`));
    return prismaSchemaPath;
  }

  // Generate model definition
  const modelDef = generatePrismaModelDefinition(modelName, fields);

  // Append to schema
  const updatedSchema = existingSchema.trimEnd() + '\n\n' + modelDef;
  await fs.writeFile(prismaSchemaPath, updatedSchema);

  console.log(pc.green(`  + Added model ${modelName} to schema.prisma`));
  console.log(pc.dim(`    Run 'npx prisma migrate dev' to apply changes`));

  return prismaSchemaPath;
}

/**
 * Generate Prisma model definition string
 */
function generatePrismaModelDefinition(name: string, fields: ModelField[]): string {
  const tableName = toSnakeCase(name) + 's';
  let model = `model ${name} {\n`;

  // Add default id field
  model += `  id        String   @id @default(cuid())\n`;

  // Add user-defined fields
  for (const field of fields) {
    model += `  ${formatPrismaField(field)}\n`;
  }

  // Add timestamps
  model += `  createdAt DateTime @default(now())\n`;
  model += `  updatedAt DateTime @updatedAt\n`;

  // Add table mapping if needed
  model += `\n  @@map("${tableName}")\n`;
  model += `}\n`;

  return model;
}

/**
 * Format a field for Prisma schema
 */
function formatPrismaField(field: ModelField): string {
  let type = field.type;
  let attributes: string[] = [];

  // Handle optionality
  if (field.modifiers.includes('optional')) {
    type += '?';
  }

  // Handle unique
  if (field.modifiers.includes('unique')) {
    attributes.push('@unique');
  }

  // Handle default values
  const defaultMod = field.modifiers.find(m => m.startsWith('default='));
  if (defaultMod) {
    const defaultValue = defaultMod.replace('default=', '');
    if (type === 'Boolean') {
      attributes.push(`@default(${defaultValue})`);
    } else if (type === 'Int' || type === 'Float') {
      attributes.push(`@default(${defaultValue})`);
    } else {
      attributes.push(`@default("${defaultValue}")`);
    }
  }

  // Handle references (relations)
  if (field.references) {
    const relatedModel = toPascalCase(field.references);
    return `${field.name}   ${relatedModel}  @relation(fields: [${field.name}Id], references: [id])\n  ${field.name}Id String`;
  }

  // Handle database column mapping for snake_case
  const columnName = toSnakeCase(field.name);
  if (columnName !== field.name) {
    attributes.push(`@map("${columnName}")`);
  }

  const attrStr = attributes.length > 0 ? ' ' + attributes.join(' ') : '';
  const padding = ' '.repeat(Math.max(1, 10 - field.name.length));

  return `${field.name}${padding}${type}${attrStr}`;
}

/**
 * Generate Drizzle model
 */
async function generateDrizzleModel(
  modelName: string,
  fields: ModelField[],
  typescript: boolean
): Promise<string> {
  const modelsDir = path.join(process.cwd(), 'src', 'db', 'schema');
  await fs.mkdir(modelsDir, { recursive: true });

  const fileName = toSnakeCase(modelName);
  const ext = typescript ? 'ts' : 'js';
  const filePath = path.join(modelsDir, `${fileName}.${ext}`);

  const content = generateDrizzleModelContent(modelName, fields, typescript);
  await fs.writeFile(filePath, content);

  console.log(pc.green(`  + Created src/db/schema/${fileName}.${ext}`));

  // Update index file
  await updateDrizzleIndex(modelsDir, fileName, modelName, typescript);

  return filePath;
}

/**
 * Generate Drizzle model content
 */
function generateDrizzleModelContent(
  name: string,
  fields: ModelField[],
  typescript: boolean
): string {
  const tableName = toSnakeCase(name) + 's';
  const camelName = toCamelCase(name);

  let imports = new Set(['pgTable', 'text', 'timestamp']);
  let columns: string[] = [];

  // Add id column
  imports.add('text');
  columns.push(`  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),`);

  // Add user-defined fields
  for (const field of fields) {
    const { columnDef, requiredImports } = formatDrizzleField(field);
    requiredImports.forEach(i => imports.add(i));
    columns.push(`  ${columnDef},`);
  }

  // Add timestamps
  columns.push(`  createdAt: timestamp('created_at').defaultNow().notNull(),`);
  columns.push(`  updatedAt: timestamp('updated_at').defaultNow().notNull(),`);

  const importList = Array.from(imports).sort().join(', ');

  return `/**
 * ${name} - Database schema
 */

import { ${importList} } from 'drizzle-orm/pg-core';
${fields.some(f => f.references) ? `import { ${fields.filter(f => f.references).map(f => toCamelCase(f.references!) + 's').join(', ')} } from './index';\n` : ''}
export const ${camelName}s = pgTable('${tableName}', {
${columns.join('\n')}
});

${typescript ? `export type ${name} = typeof ${camelName}s.$inferSelect;
export type New${name} = typeof ${camelName}s.$inferInsert;
` : ''}`;
}

/**
 * Format a field for Drizzle schema
 */
function formatDrizzleField(field: ModelField): { columnDef: string; requiredImports: string[] } {
  const imports: string[] = [];
  const columnName = toSnakeCase(field.name);

  let typeFunc: string;
  switch (field.type.toLowerCase()) {
    case 'string':
    case 'text':
      typeFunc = 'text';
      imports.push('text');
      break;
    case 'int':
    case 'integer':
      typeFunc = 'integer';
      imports.push('integer');
      break;
    case 'float':
    case 'double':
      typeFunc = 'real';
      imports.push('real');
      break;
    case 'boolean':
      typeFunc = 'boolean';
      imports.push('boolean');
      break;
    case 'datetime':
      typeFunc = 'timestamp';
      imports.push('timestamp');
      break;
    case 'json':
      typeFunc = 'json';
      imports.push('json');
      break;
    default:
      typeFunc = 'text';
      imports.push('text');
  }

  let modifiers: string[] = [];

  // Handle unique
  if (field.modifiers.includes('unique')) {
    modifiers.push('.unique()');
  }

  // Handle optional/notNull
  if (!field.modifiers.includes('optional')) {
    modifiers.push('.notNull()');
  }

  // Handle default values
  const defaultMod = field.modifiers.find(m => m.startsWith('default='));
  if (defaultMod) {
    const defaultValue = defaultMod.replace('default=', '');
    if (field.type === 'Boolean') {
      modifiers.push(`.default(${defaultValue})`);
    } else if (field.type === 'Int' || field.type === 'Float') {
      modifiers.push(`.default(${defaultValue})`);
    } else {
      modifiers.push(`.default('${defaultValue}')`);
    }
  }

  // Handle references
  if (field.references) {
    const refTable = toCamelCase(field.references) + 's';
    modifiers.push(`.references(() => ${refTable}.id)`);
  }

  const columnDef = `${field.name}: ${typeFunc}('${columnName}')${modifiers.join('')}`;

  return { columnDef, requiredImports: imports };
}

/**
 * Update Drizzle schema index file
 */
async function updateDrizzleIndex(
  modelsDir: string,
  fileName: string,
  modelName: string,
  typescript: boolean
): Promise<void> {
  const indexPath = path.join(modelsDir, `index.${typescript ? 'ts' : 'js'}`);
  const exportLine = `export * from './${fileName}';\n`;

  let existingContent = '';
  try {
    existingContent = await fs.readFile(indexPath, 'utf-8');
  } catch {
    // Index doesn't exist
  }

  if (!existingContent.includes(exportLine)) {
    await fs.writeFile(indexPath, existingContent + exportLine);
    console.log(pc.green(`  + Updated src/db/schema/index.${typescript ? 'ts' : 'js'}`));
  }
}
