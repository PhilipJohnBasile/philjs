/**
 * PhilJS CLI - Template Engine
 *
 * Simple Handlebars-like template engine for code generation
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
/**
 * Simple template engine with Handlebars-like syntax
 */
export function renderTemplate(template, context) {
    let result = template;
    // Handle conditionals: {{#if condition}}...{{/if}}
    result = result.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)(?:\{\{else\}\}([\s\S]*?))?\{\{\/if\}\}/g, (_, condition, ifContent, elseContent = '') => {
        const value = context[condition];
        if (value) {
            return ifContent;
        }
        return elseContent;
    });
    // Handle unless: {{#unless condition}}...{{/unless}}
    result = result.replace(/\{\{#unless\s+(\w+)\}\}([\s\S]*?)\{\{\/unless\}\}/g, (_, condition, content) => {
        const value = context[condition];
        if (!value) {
            return content;
        }
        return '';
    });
    // Handle each: {{#each items}}...{{/each}}
    result = result.replace(/\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (_, arrayName, itemTemplate) => {
        const items = context[arrayName];
        if (!Array.isArray(items))
            return '';
        return items.map((item, index) => {
            let itemResult = itemTemplate;
            if (typeof item === 'object' && item !== null) {
                for (const [key, value] of Object.entries(item)) {
                    itemResult = itemResult.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value));
                }
            }
            else {
                itemResult = itemResult.replace(/\{\{this\}\}/g, String(item));
            }
            itemResult = itemResult.replace(/\{\{@index\}\}/g, String(index));
            itemResult = itemResult.replace(/\{\{@first\}\}/g, String(index === 0));
            itemResult = itemResult.replace(/\{\{@last\}\}/g, String(index === items.length - 1));
            return itemResult;
        }).join('');
    });
    // Handle simple variable substitution: {{variable}}
    result = result.replace(/\{\{(\w+)\}\}/g, (_, key) => {
        const value = context[key];
        if (value === undefined || value === null)
            return '';
        return String(value);
    });
    // Handle nested variable substitution: {{object.property}}
    result = result.replace(/\{\{(\w+)\.(\w+)\}\}/g, (_, obj, prop) => {
        const value = context[obj];
        if (value && typeof value === 'object' && prop in value) {
            return String(value[prop]);
        }
        return '';
    });
    return result;
}
/**
 * Load a template file from the templates directory
 */
export async function loadTemplate(generator, templateName) {
    // Try to load from the templates directory relative to this file
    const templatesDir = path.resolve(__dirname, '../../templates/generators');
    const templatePath = path.join(templatesDir, generator, `${templateName}.hbs`);
    try {
        return await fs.readFile(templatePath, 'utf-8');
    }
    catch {
        // Template file not found, return empty string
        throw new Error(`Template not found: ${templatePath}`);
    }
}
/**
 * Check if templates directory exists
 */
export async function templatesExist() {
    const templatesDir = path.resolve(__dirname, '../../templates/generators');
    try {
        await fs.access(templatesDir);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * String transformation helpers
 */
export function toPascalCase(str) {
    return str
        .replace(/[-_\s\/\[\]]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
        .replace(/^(.)/, (c) => c.toUpperCase());
}
export function toCamelCase(str) {
    const pascal = toPascalCase(str);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}
export function toKebabCase(str) {
    return str
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/[\s_\/\[\]]+/g, '-')
        .toLowerCase();
}
export function toSnakeCase(str) {
    return str
        .replace(/([a-z])([A-Z])/g, '$1_$2')
        .replace(/[\s\-\/\[\]]+/g, '_')
        .toLowerCase();
}
/**
 * Create template context with common transformations
 */
export function createContext(name, options = {}) {
    return {
        name,
        pascalName: toPascalCase(name),
        camelName: toCamelCase(name),
        kebabName: toKebabCase(name),
        typescript: true,
        withTest: true,
        withStyles: false,
        ...options,
    };
}
/**
 * Extract route parameters from a path
 * e.g., "users/[id]" -> ["id"]
 */
export function extractRouteParams(routePath) {
    const matches = routePath.match(/\[(\w+)\]/g);
    if (!matches)
        return [];
    return matches.map(m => m.replace(/[\[\]]/g, ''));
}
/**
 * Check if a route path is dynamic
 */
export function isDynamicRoute(routePath) {
    return /\[(\w+)\]/.test(routePath);
}
//# sourceMappingURL=template-engine.js.map