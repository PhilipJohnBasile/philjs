/**
 * Schema to Component Generator
 *
 * @module schema
 */

export {
  SchemaToComponentGenerator,
  createSchemaToComponentGenerator,
  generateComponentsFromSchema,
  generateCRUDFromSchema,
  generateFromJSONSchema,
  generateFromGraphQL,
  type SchemaType,
  type GeneratedComponentType,
  type SchemaToComponentOptions,
  type SchemaField,
  type FieldValidation,
  type UIHints,
  type ParsedSchema,
  type SchemaRelation,
  type GeneratedSchemaComponent,
  type SchemaToComponentResult,
  type CRUDGenerationResult,
} from './schema-to-component.js';
