/**
 * PhilJS CLI - Storybook Command
 *
 * Initialize and run Storybook for PhilJS components
 */
import { Command } from 'commander';
import * as pc from 'picocolors';
import { existsSync } from 'fs';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
/**
 * Register Storybook commands
 */
export function registerStorybookCommand(program) {
    const storybook = program
        .command('storybook')
        .description('Manage Storybook for component development');
    // Init command
    storybook
        .command('init')
        .description('Initialize Storybook in your project')
        .option('--port <port>', 'Port to run Storybook on', '6006')
        .action(async (options) => {
        console.log(pc.cyan('\nInitializing Storybook for PhilJS...\n'));
        try {
            await initStorybook(options.port);
            console.log(pc.green('\nStorybook initialized successfully!\n'));
            console.log(pc.white('Run'), pc.cyan('philjs storybook dev'), pc.white('to start Storybook'));
        }
        catch (error) {
            console.error(pc.red('Failed to initialize Storybook:'), error);
            process.exit(1);
        }
    });
    // Dev command
    storybook
        .command('dev')
        .description('Start Storybook dev server')
        .option('-p, --port <port>', 'Port to run on', '6006')
        .option('--no-open', 'Do not open browser automatically')
        .action(async (options) => {
        console.log(pc.cyan('\nStarting Storybook dev server...\n'));
        try {
            await startStorybook({
                port: parseInt(options.port),
                open: options.open,
            });
        }
        catch (error) {
            console.error(pc.red('Failed to start Storybook:'), error);
            process.exit(1);
        }
    });
    // Build command
    storybook
        .command('build')
        .description('Build Storybook for production')
        .option('-o, --output-dir <dir>', 'Output directory', 'storybook-static')
        .action(async (options) => {
        console.log(pc.cyan('\nBuilding Storybook...\n'));
        try {
            await buildStorybook({
                outputDir: options.outputDir,
            });
            console.log(pc.green('\nStorybook built successfully!\n'));
        }
        catch (error) {
            console.error(pc.red('Failed to build Storybook:'), error);
            process.exit(1);
        }
    });
    // Generate story command
    const generateCmd = storybook.command('generate <component>');
    generateCmd.alias('gen');
    generateCmd
        .description('Generate a story for a component')
        .option('-d, --directory <dir>', 'Component directory')
        .option('--type <type>', 'Story type: component, route, form, island', 'component')
        .action(async (component, options) => {
        console.log(pc.cyan(`\nGenerating story for ${component}...\n`));
        try {
            await generateStory({
                component,
                directory: options.directory,
                type: options.type,
            });
            console.log(pc.green(`\nStory for ${component} created successfully!\n`));
        }
        catch (error) {
            console.error(pc.red('Failed to generate story:'), error);
            process.exit(1);
        }
    });
}
/**
 * Initialize Storybook configuration
 */
async function initStorybook(port) {
    const storybookDir = join(process.cwd(), '.storybook');
    // Create .storybook directory
    if (!existsSync(storybookDir)) {
        await mkdir(storybookDir, { recursive: true });
    }
    // Create main.ts
    const mainConfig = `import type { StorybookConfig } from 'philjs-storybook';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-links',
    'philjs-storybook/addons/signal-inspector',
    'philjs-storybook/addons/route-tester',
    'philjs-storybook/addons/theme-switcher',
    'philjs-storybook/addons/viewport',
    'msw-storybook-addon',
  ],
  framework: {
    name: 'philjs-storybook',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  core: {
    builder: '@storybook/builder-vite',
  },
};

export default config;
`;
    await writeFile(join(storybookDir, 'main.ts'), mainConfig);
    // Create preview.ts
    const previewConfig = `import type { Preview } from 'philjs-storybook';
import { withRouter, withTheme, withLayout } from 'philjs-storybook/decorators';
import { initialize, mswLoader } from 'msw-storybook-addon';

// Initialize MSW
initialize();

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
  decorators: [withRouter, withTheme, withLayout],
  loaders: [mswLoader],
};

export default preview;
`;
    await writeFile(join(storybookDir, 'preview.ts'), previewConfig);
    // Create package.json scripts
    console.log(pc.dim('\nAdd these scripts to your package.json:'));
        "storybook": "storybook dev -p 6006",
        "build-storybook": "storybook build"
    }, null, 2)));
    // Install dependencies
    console.log(pc.dim('\nInstalling Storybook dependencies...'));
    const { spawn } = await import('child_process');
    const packageManager = existsSync('pnpm-lock.yaml')
        ? 'pnpm'
        : existsSync('yarn.lock')
            ? 'yarn'
            : 'npm';
    const deps = [
        'storybook@^8.4.7',
        'philjs-storybook@workspace:*',
        '@storybook/addon-essentials@^8.4.7',
        '@storybook/addon-interactions@^8.4.7',
        '@storybook/addon-links@^8.4.7',
        '@storybook/blocks@^8.4.7',
        '@storybook/test@^8.4.7',
        '@storybook/builder-vite@^8.4.7',
        'msw@^2.6.8',
        'msw-storybook-addon@^2.0.4',
    ];
    return new Promise((resolve, reject) => {
        // Use spawn without shell: true for security
        const install = spawn(packageManager, [packageManager === 'npm' ? 'install' : 'add', '-D', ...deps], { stdio: 'inherit' });
        install.on('error', (err) => {
            reject(new Error(`Failed to start installation: ${err.message}`));
        });
        install.on('exit', (code) => {
            if (code === 0) {
                resolve(undefined);
            }
            else {
                reject(new Error(`Installation failed with code ${code}`));
            }
        });
    });
}
/**
 * Start Storybook dev server
 */
async function startStorybook(options) {
    const { spawn } = await import('child_process');
    // Validate port is a number to prevent injection
    const port = Math.abs(Math.floor(options.port));
    if (port < 1 || port > 65535) {
        throw new Error('Invalid port number');
    }
    const args = ['storybook', 'dev', '-p', port.toString()];
    if (!options.open) {
        args.push('--no-open');
    }
    // Use spawn without shell: true for security
    const storybook = spawn('npx', args, { stdio: 'inherit' });
    storybook.on('error', (err) => {
        console.error('Failed to start Storybook:', err.message);
        process.exit(1);
    });
    storybook.on('exit', (code) => {
        process.exit(code || 0);
    });
}
/**
 * Build Storybook
 */
async function buildStorybook(options) {
    const { spawn } = await import('child_process');
    // Validate output directory to prevent path traversal
    const outputDir = options.outputDir.replace(/[^a-zA-Z0-9_\-./]/g, '');
    if (outputDir.includes('..') || outputDir.startsWith('/')) {
        throw new Error('Invalid output directory');
    }
    const args = ['storybook', 'build', '-o', outputDir];
    return new Promise((resolve, reject) => {
        // Use spawn without shell: true for security
        const build = spawn('npx', args, { stdio: 'inherit' });
        build.on('error', (err) => {
            reject(new Error(`Failed to start build: ${err.message}`));
        });
        build.on('exit', (code) => {
            if (code === 0) {
                resolve();
            }
            else {
                reject(new Error(`Build failed with code ${code}`));
            }
        });
    });
}
/**
 * Generate a story for a component
 */
async function generateStory(options) {
    const { component, directory, type } = options;
    const componentName = component.replace(/\.tsx?$/, '');
    // Determine story path
    const basePath = directory || 'src/components';
    const storyPath = join(process.cwd(), basePath, `${componentName}.stories.tsx`);
    // Check if story already exists
    if (existsSync(storyPath)) {
        console.log(pc.yellow(`Story already exists: ${storyPath}`));
        return;
    }
    // Generate story content based on type
    let storyContent = '';
    switch (type) {
        case 'component':
            storyContent = generateComponentStory(componentName);
            break;
        case 'route':
            storyContent = generateRouteStory(componentName);
            break;
        case 'form':
            storyContent = generateFormStory(componentName);
            break;
        case 'island':
            storyContent = generateIslandStory(componentName);
            break;
    }
    await writeFile(storyPath, storyContent);
    console.log(pc.green(`Created: ${storyPath}`));
}
/**
 * Generate component story template
 */
function generateComponentStory(componentName) {
    return `import type { Meta, StoryObj } from 'philjs-storybook';
import { ${componentName} } from './${componentName}';

const meta: Meta<typeof ${componentName}> = {
  title: 'Components/${componentName}',
  component: ${componentName},
  tags: ['autodocs'],
  argTypes: {
    // Define your argTypes here
  },
};

export default meta;
type Story = StoryObj<typeof ${componentName}>;

export const Default: Story = {
  args: {
    // Default props
  },
};

export const WithProps: Story = {
  args: {
    // Props for this variant
  },
};
`;
}
/**
 * Generate route story template
 */
function generateRouteStory(componentName) {
    return `import type { Meta, StoryObj } from 'philjs-storybook';
import { ${componentName} } from './${componentName}';
import { withRouter } from 'philjs-storybook/decorators';
import { createMockLoader } from 'philjs-storybook/mocks';

const meta: Meta<typeof ${componentName}> = {
  title: 'Routes/${componentName}',
  component: ${componentName},
  tags: ['autodocs'],
  decorators: [withRouter],
  parameters: {
    router: {
      pathname: '/',
      params: {},
      searchParams: '',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ${componentName}>;

export const Default: Story = {
  args: {},
};

export const WithParams: Story = {
  parameters: {
    router: {
      pathname: '/item/123',
      params: { id: '123' },
    },
  },
};
`;
}
/**
 * Generate form story template
 */
function generateFormStory(componentName) {
    return `import type { Meta, StoryObj } from 'philjs-storybook';
import { ${componentName} } from './${componentName}';
import { within, userEvent, expect } from '@storybook/test';

const meta: Meta<typeof ${componentName}> = {
  title: 'Forms/${componentName}',
  component: ${componentName},
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ${componentName}>;

export const Default: Story = {
  args: {},
};

export const FilledForm: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Interact with form fields
    // await userEvent.type(canvas.getByLabelText('Name'), 'John Doe');
    // await userEvent.click(canvas.getByRole('button', { name: /submit/i }));
  },
};

export const WithValidation: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Test validation
    // await userEvent.click(canvas.getByRole('button', { name: /submit/i }));
    // await expect(canvas.getByText(/required/i)).toBeInTheDocument();
  },
};
`;
}
/**
 * Generate island story template
 */
function generateIslandStory(componentName) {
    return `import type { Meta, StoryObj } from 'philjs-storybook';
import { ${componentName} } from './${componentName}';
import { withSignals } from 'philjs-storybook/decorators';

const meta: Meta<typeof ${componentName}> = {
  title: 'Islands/${componentName}',
  component: ${componentName},
  tags: ['autodocs'],
  decorators: [withSignals],
  parameters: {
    signals: {
      // Initial signal values
    },
  },
};

export default meta;
type Story = StoryObj<typeof ${componentName}>;

export const Default: Story = {
  args: {},
};

export const Interactive: Story = {
  args: {},
  parameters: {
    signals: {
      count: 0,
    },
  },
};
`;
}
//# sourceMappingURL=storybook.js.map