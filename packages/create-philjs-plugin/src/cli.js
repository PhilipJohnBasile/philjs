#!/usr/bin/env node
/**
 * create-philjs-plugin CLI
 * Interactive CLI for scaffolding PhilJS plugins
 */
import * as path from 'path';
import { fileURLToPath } from 'url';
import prompts from 'prompts';
import * as pc from 'picocolors';
import { createPlugin } from './generator.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN_TYPES = [
    {
        title: 'Basic Plugin',
        value: 'basic',
        description: 'Simple plugin with lifecycle hooks',
    },
    {
        title: 'Vite Plugin',
        value: 'vite',
        description: 'Vite build plugin with transform hooks',
    },
    {
        title: 'Transform Plugin',
        value: 'transform',
        description: 'Code transformation plugin',
    },
    {
        title: 'UI Addon',
        value: 'ui-addon',
        description: 'UI components and styles addon',
    },
    {
        title: 'API Integration',
        value: 'api',
        description: 'External API integration with caching and retries',
    },
    {
        title: 'Database Plugin',
        value: 'database',
        description: 'Database connection and query utilities',
    },
    {
        title: 'Authentication Plugin',
        value: 'auth',
        description: 'User authentication and session management',
    },
];
const FEATURES_BY_TYPE = {
    basic: [
        { title: 'Configuration schema', value: 'config', selected: true },
        { title: 'Runtime API', value: 'runtime-api' },
        { title: 'CLI commands', value: 'cli' },
        { title: 'Server middleware', value: 'middleware' },
    ],
    vite: [
        { title: 'Virtual modules', value: 'virtual-modules', selected: true },
        { title: 'Custom HMR', value: 'hmr' },
        { title: 'Asset handling', value: 'assets' },
        { title: 'SSR support', value: 'ssr' },
    ],
    transform: [
        { title: 'AST transformation', value: 'ast', selected: true },
        { title: 'Source maps', value: 'sourcemaps', selected: true },
        { title: 'Type generation', value: 'types' },
        { title: 'Code splitting', value: 'splitting' },
    ],
    'ui-addon': [
        { title: 'PhilJS components', value: 'components', selected: true },
        { title: 'CSS utilities', value: 'css', selected: true },
        { title: 'Theme system', value: 'theme' },
        { title: 'Icons package', value: 'icons' },
    ],
    api: [
        { title: 'Request caching', value: 'cache', selected: true },
        { title: 'Retry logic', value: 'retry', selected: true },
        { title: 'Request interceptors', value: 'interceptors' },
        { title: 'Response transformers', value: 'transformers' },
        { title: 'Rate limiting', value: 'rate-limit' },
        { title: 'Offline queue', value: 'offline-queue' },
    ],
    database: [
        { title: 'Connection pooling', value: 'pooling', selected: true },
        { title: 'Migrations', value: 'migrations', selected: true },
        { title: 'Query builder', value: 'query-builder' },
        { title: 'Transactions', value: 'transactions', selected: true },
        { title: 'Seeding', value: 'seeding' },
        { title: 'Logging', value: 'logging' },
    ],
    auth: [
        { title: 'Email/Password', value: 'credentials', selected: true },
        { title: 'OAuth providers', value: 'oauth', selected: true },
        { title: 'JWT tokens', value: 'jwt', selected: true },
        { title: 'Session management', value: 'sessions', selected: true },
        { title: 'Role-based access', value: 'rbac' },
        { title: 'Two-factor auth', value: '2fa' },
    ],
};
const LICENSES = [
    { title: 'MIT', value: 'MIT' },
    { title: 'Apache 2.0', value: 'Apache-2.0' },
    { title: 'BSD 3-Clause', value: 'BSD-3-Clause' },
    { title: 'ISC', value: 'ISC' },
    { title: 'GPL 3.0', value: 'GPL-3.0' },
];
async function main() {
    console.log(pc.cyan('\n🔌 Create PhilJS Plugin\n'));
    const args = process.argv.slice(2);
    const targetDir = args[0] ?? '.';
    try {
        // Define feature choices callback with proper typing
        const getFeatureChoices = (_prev, answers) => {
            const pluginType = String(answers['pluginType'] ?? '');
            if (pluginType && pluginType in FEATURES_BY_TYPE) {
                return FEATURES_BY_TYPE[pluginType] ?? [];
            }
            return [];
        };
        const questions = [
            {
                type: 'text',
                name: 'pluginName',
                message: 'Plugin name:',
                initial: 'philjs-plugin-awesome',
                validate: (value) => {
                    if (!value)
                        return 'Plugin name is required';
                    if (!/^[a-z0-9-]+$/.test(value)) {
                        return 'Plugin name must be lowercase alphanumeric with hyphens';
                    }
                    if (!value.startsWith('philjs-plugin-')) {
                        return 'Plugin name should start with "philjs-plugin-"';
                    }
                    return true;
                },
            },
            {
                type: 'select',
                name: 'pluginType',
                message: 'Select plugin type:',
                choices: PLUGIN_TYPES,
                initial: 0,
            },
            {
                type: 'text',
                name: 'description',
                message: 'Plugin description:',
                initial: 'A PhilJS plugin',
            },
            {
                type: 'text',
                name: 'author',
                message: 'Author name:',
                initial: '',
            },
            {
                type: 'select',
                name: 'license',
                message: 'License:',
                choices: LICENSES,
                initial: 0,
            },
            {
                type: 'multiselect',
                name: 'features',
                message: 'Select features to include:',
                choices: getFeatureChoices,
                instructions: false,
                hint: '- Space to select. Return to submit',
            },
            {
                type: 'confirm',
                name: 'typescript',
                message: 'Use TypeScript?',
                initial: true,
            },
            {
                type: 'confirm',
                name: 'testing',
                message: 'Include testing setup?',
                initial: true,
            },
            {
                type: 'confirm',
                name: 'gitInit',
                message: 'Initialize git repository?',
                initial: true,
            },
        ];
        const answers = await prompts(questions);
        if (!answers.pluginName) {
            console.log(pc.red('\n❌ Plugin creation cancelled'));
            process.exit(1);
        }
        const pluginName = answers.pluginName;
        const pluginDescription = answers.description ?? 'A PhilJS plugin';
        const pluginAuthor = answers.author ?? '';
        const pluginLicense = answers.license ?? 'MIT';
        const options = {
            name: pluginName,
            ...(pluginDescription ? { description: pluginDescription } : {}),
            ...(pluginAuthor ? { author: pluginAuthor } : {}),
            ...(pluginLicense ? { license: pluginLicense } : {}),
        };
        console.log(pc.cyan('\n📦 Creating plugin...\n'));
        createPlugin(options);
        const pluginPath = path.resolve(process.cwd(), targetDir, pluginName);
        console.log(pc.green('\n✅ Plugin created successfully!\n'));
        console.log('Next steps:');
        console.log(pc.cyan(`  cd ${path.relative(process.cwd(), pluginPath) || pluginName}`));
        console.log(pc.cyan('  npm install'));
        if (answers.testing) {
            console.log(pc.cyan('  npm test'));
        }
        console.log(pc.cyan('  npm run build'));
        console.log();
    }
    catch (error) {
        console.error(pc.red('\n❌ Error creating plugin:'), error);
        process.exit(1);
    }
}
main();
//# sourceMappingURL=cli.js.map