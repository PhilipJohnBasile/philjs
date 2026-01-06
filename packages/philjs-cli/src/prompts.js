/**
 * PhilJS CLI - Interactive Prompts
 *
 * RedwoodJS-inspired interactive prompts for code generation
 */
import prompts from 'prompts';
import * as pc from 'picocolors';
/**
 * Interactive prompt for generator type selection
 */
export async function promptGeneratorType() {
    const response = await prompts({
        type: 'select',
        name: 'type',
        message: 'What would you like to generate?',
        choices: [
            { title: 'Component', description: 'A reusable UI component', value: 'component' },
            { title: 'Page', description: 'A page component with route', value: 'page' },
            { title: 'API Route', description: 'An API endpoint', value: 'api' },
            { title: 'Model', description: 'A database model (Prisma/Drizzle)', value: 'model' },
            { title: 'Scaffold', description: 'Full CRUD: model, API, pages, components', value: 'scaffold' },
            { title: 'Hook', description: 'A custom React hook', value: 'hook' },
            { title: 'Context', description: 'A context provider', value: 'context' },
            { title: 'Route', description: 'A route with loader', value: 'route' },
            { title: 'Store', description: 'A state store', value: 'store' },
        ],
        initial: 0,
    });
    return response['type'] || null;
}
/**
 * Interactive prompt for generator name
 */
export async function promptName(type) {
    const examples = {
        component: 'Button, UserCard, Modal',
        page: 'dashboard, users/[id], settings',
        api: 'users, posts/[id], auth/login',
        model: 'User, Post, Comment',
        scaffold: 'Post, User, Product',
        hook: 'useAuth, useCounter, useFetch',
        context: 'Theme, Auth, User',
        route: 'users, dashboard, settings',
        store: 'user, cart, notifications',
    };
    const response = await prompts({
        type: 'text',
        name: 'name',
        message: `Name for the ${type}:`,
        hint: `e.g., ${examples[type]}`,
        validate: (value) => {
            if (!value || !value.trim()) {
                return 'Name is required';
            }
            if (!/^[a-zA-Z][a-zA-Z0-9_\-\/\[\]]*$/.test(value)) {
                return 'Name must start with a letter and contain only letters, numbers, underscores, hyphens, slashes, and brackets';
            }
            return true;
        },
    });
    return response['name'] || null;
}
/**
 * Interactive prompt for model fields
 */
export async function promptModelFields() {
    const fields = [];
    console.log(pc.dim('\nDefine model fields (press Enter with empty name to finish):'));
    console.log(pc.dim('Format: fieldName:type[:modifier1:modifier2...]'));
    console.log(pc.dim('Types: string, int, float, boolean, datetime, text, json'));
    console.log(pc.dim('Modifiers: unique, optional, default=value, references=Model\n'));
    while (true) {
        const response = await prompts({
            type: 'text',
            name: 'field',
            message: 'Field definition:',
            hint: 'e.g., email:string:unique or title:string',
        });
        const fieldDef = response['field']?.trim();
        if (!fieldDef)
            break;
        const field = parseFieldDefinition(fieldDef);
        if (field) {
            fields.push(field);
            console.log(pc.green(`  + Added field: ${field.name} (${field.type})`));
        }
        else {
            console.log(pc.yellow('  ! Invalid field format, try again'));
        }
    }
    return fields;
}
/**
 * Parse a field definition string
 */
export function parseFieldDefinition(definition) {
    const parts = definition.split(':');
    if (parts.length < 2)
        return null;
    const [name, type, ...modifierParts] = parts;
    if (!name || !type)
        return null;
    const modifiers = [];
    let references;
    for (const mod of modifierParts) {
        if (mod.startsWith('references=')) {
            references = mod.replace('references=', '');
        }
        else {
            modifiers.push(mod);
        }
    }
    return {
        name: name.trim(),
        type: normalizeType(type.trim()),
        modifiers,
        ...(references !== undefined && { references }),
    };
}
/**
 * Normalize type aliases to Prisma/Drizzle types
 */
function normalizeType(type) {
    const typeMap = {
        string: 'String',
        str: 'String',
        int: 'Int',
        integer: 'Int',
        float: 'Float',
        double: 'Float',
        bool: 'Boolean',
        boolean: 'Boolean',
        date: 'DateTime',
        datetime: 'DateTime',
        time: 'DateTime',
        text: 'String',
        json: 'Json',
        bigint: 'BigInt',
    };
    return typeMap[type.toLowerCase()] || type;
}
/**
 * Interactive prompt for generator options
 */
export async function promptOptions(type) {
    const questions = [];
    // Tests option (for most generators)
    if (!['model'].includes(type)) {
        questions.push({
            type: 'confirm',
            name: 'includeTests',
            message: 'Include tests?',
            initial: true,
        });
    }
    // Styles option (for component)
    if (['component', 'page'].includes(type)) {
        questions.push({
            type: 'confirm',
            name: 'includeStyles',
            message: 'Include styles?',
            initial: type === 'component',
        });
    }
    // TypeScript option
    questions.push({
        type: 'confirm',
        name: 'typescript',
        message: 'Use TypeScript?',
        initial: true,
    });
    const response = await prompts(questions);
    return response;
}
/**
 * Full interactive mode
 */
export async function runInteractiveMode() {
    const type = await promptGeneratorType();
    if (!type)
        return null;
    const name = await promptName(type);
    if (!name)
        return null;
    const options = await promptOptions(type);
    if (Object.keys(options).length === 0)
        return null;
    let fields;
    if (type === 'model' || type === 'scaffold') {
        const modelFields = await promptModelFields();
        fields = modelFields.map((f) => {
            let def = `${f.name}:${f.type.toLowerCase()}`;
            if (f.modifiers.length > 0) {
                def += ':' + f.modifiers.join(':');
            }
            if (f.references) {
                def += `:references=${f.references}`;
            }
            return def;
        });
    }
    return {
        type,
        name,
        includeTests: options.includeTests ?? true,
        includeStyles: options.includeStyles ?? false,
        typescript: options.typescript ?? true,
        ...(fields !== undefined && { fields }),
    };
}
/**
 * Confirm generation before proceeding
 */
export async function confirmGeneration(files) {
    for (const file of files) {
        console.log(pc.dim(`  ${file}`));
    }
    const response = await prompts({
        type: 'confirm',
        name: 'confirm',
        message: 'Proceed with generation?',
        initial: true,
    });
    return response['confirm'] ?? false;
}
//# sourceMappingURL=prompts.js.map