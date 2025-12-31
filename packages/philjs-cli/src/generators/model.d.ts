/**
 * PhilJS CLI - Model Generator
 *
 * Generate database models for Prisma or Drizzle
 */
import { type ModelField } from '../prompts.js';
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
export declare function generateModel(options: ModelOptions): Promise<string[]>;
//# sourceMappingURL=model.d.ts.map