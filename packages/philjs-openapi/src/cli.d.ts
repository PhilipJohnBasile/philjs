#!/usr/bin/env node
/**
 * PhilJS OpenAPI - CLI Tool
 *
 * Generate TypeScript types and API clients from OpenAPI specifications.
 *
 * Usage:
 *   philjs-openapi generate --input openapi.json --output types.ts
 *   philjs-openapi generate --input https://api.example.com/openapi.json --output types.ts
 *   philjs-openapi generate --input openapi.json --output types.ts --client --zod
 */
import type { OpenAPISpec, TypeGenerationOptions, GeneratedTypes } from './types.js';
/**
 * Generate TypeScript types from OpenAPI spec
 */
export declare function generateTypes(spec: OpenAPISpec, options: TypeGenerationOptions): GeneratedTypes;
/**
 * Main CLI entry point
 */
export declare function main(args: string[]): Promise<void>;
//# sourceMappingURL=cli.d.ts.map