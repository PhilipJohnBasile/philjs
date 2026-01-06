import { readFileSync, existsSync } from 'node:fs';
import { resolve, isAbsolute } from 'node:path';

export class PromptTemplate<Variables extends Record<string, any>> {
    constructor(private template: string) { }

    format(variables: Variables): string {
        return this.template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
            if (key in variables) {
                return String(variables[key]);
            }
            console.warn(`PromptTemplate: Missing variable "${key}"`);
            return `{{${key}}}`;
        });
    }

    /**
     * Load a prompt template from a file.
     * Supports .txt, .md, and .prompt files.
     *
     * @param path - Absolute or relative path to the template file
     * @returns PromptTemplate instance with the file contents
     * @throws Error if file doesn't exist or cannot be read
     */
    static fromFile(path: string): PromptTemplate<any> {
        // Resolve path relative to current working directory if not absolute
        const resolvedPath = isAbsolute(path) ? path : resolve(process.cwd(), path);

        if (!existsSync(resolvedPath)) {
            throw new Error(
                `PromptTemplate file not found: ${resolvedPath}\n` +
                'Make sure the path is correct and the file exists.'
            );
        }

        try {
            const content = readFileSync(resolvedPath, 'utf-8');
            return new PromptTemplate(content);
        } catch (error) {
            throw new Error(
                `Failed to read prompt template from ${resolvedPath}: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }

    /**
     * Load a prompt template asynchronously from a file.
     * Useful for large templates or when blocking I/O should be avoided.
     */
    static async fromFileAsync(path: string): Promise<PromptTemplate<any>> {
        const { readFile } = await import('node:fs/promises');

        const resolvedPath = isAbsolute(path) ? path : resolve(process.cwd(), path);

        if (!existsSync(resolvedPath)) {
            throw new Error(
                `PromptTemplate file not found: ${resolvedPath}\n` +
                'Make sure the path is correct and the file exists.'
            );
        }

        try {
            const content = await readFile(resolvedPath, 'utf-8');
            return new PromptTemplate(content);
        } catch (error) {
            throw new Error(
                `Failed to read prompt template from ${resolvedPath}: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }

    /**
     * Create a template from a string directly
     */
    static fromString(template: string): PromptTemplate<any> {
        return new PromptTemplate(template);
    }

    /**
     * Get the raw template string
     */
    toString(): string {
        return this.template;
    }
}
