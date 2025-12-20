/**
 * PhilJS CLI - Generate Command
 *
 * Main entry point for all code generation commands.
 * Inspired by RedwoodJS scaffolding.
 */

import { Command } from 'commander';
import * as pc from 'picocolors';
import {
  runInteractiveMode,
  promptModelFields,
  type GeneratorType,
} from '../prompts.js';
import { loadConfig, getGeneratorConfig } from '../config.js';
import {
  generateComponent,
  generatePage,
  generateApi,
  generateModel,
  generateScaffold,
  generateHook,
  generateContext,
  generateRoute,
  generateStore,
  generateAuth,
  generateRSS,
  generateSitemap,
} from '../generators/index.js';

/**
 * Register generate commands on the commander program
 */
export function registerGenerateCommand(program: Command): void {
  const generate = program
    .command('generate')
    .alias('g')
    .description('Generate components, pages, API routes, models, and more')
    .action(async () => {
      // Interactive mode when no subcommand is provided
      try {
        const answers = await runInteractiveMode();
        if (!answers) {
          console.log(pc.yellow('\nGeneration cancelled.\n'));
          return;
        }

        await runGenerator(answers.type, answers.name, {
          typescript: answers.typescript,
          withTest: answers.includeTests,
          withStyles: answers.includeStyles,
          fields: answers.fields,
        });
      } catch (error) {
        console.error(pc.red('Generation failed:'), error);
        process.exit(1);
      }
    });

  // Component generator
  generate
    .command('component <name>')
    .alias('c')
    .description('Generate a new component')
    .option('-d, --directory <dir>', 'Target directory')
    .option('--no-test', 'Skip test file generation')
    .option('--with-styles', 'Generate CSS module file')
    .option('--style <type>', 'Style type: css-modules, tailwind, styled, none', 'css-modules')
    .option('--js', 'Use JavaScript instead of TypeScript')
    .action(async (name, options) => {
      console.log(pc.cyan(`\nGenerating component: ${name}\n`));
      try {
        const config = await loadConfig();
        const genConfig = getGeneratorConfig(config, 'component');

        await generateComponent({
          name,
          directory: options.directory || genConfig.path,
          typescript: !options.js && genConfig.typescript !== false,
          withTest: options.test !== false && genConfig.tests !== false,
          withStyles: options.withStyles || genConfig.style !== 'none',
          styleType: options.style || genConfig.style,
        });

        console.log(pc.green(`\nComponent ${name} created successfully!\n`));
      } catch (error) {
        console.error(pc.red('Failed to generate component:'), error);
        process.exit(1);
      }
    });

  // Page generator
  generate
    .command('page <name>')
    .alias('p')
    .description('Generate a page with route (supports dynamic routes like users/[id])')
    .option('-d, --directory <dir>', 'Target directory')
    .option('--no-test', 'Skip test file generation')
    .option('--no-loader', 'Skip loader file generation')
    .option('--with-styles', 'Generate CSS module file')
    .option('--js', 'Use JavaScript instead of TypeScript')
    .action(async (name, options) => {
      console.log(pc.cyan(`\nGenerating page: ${name}\n`));
      try {
        const config = await loadConfig();
        const genConfig = getGeneratorConfig(config, 'page');

        await generatePage({
          name,
          directory: options.directory || genConfig.path,
          typescript: !options.js && genConfig.typescript !== false,
          withTest: options.test !== false && genConfig.tests !== false,
          withLoader: options.loader !== false,
          withStyles: options.withStyles,
        });

        console.log(pc.green(`\nPage ${name} created successfully!\n`));
      } catch (error) {
        console.error(pc.red('Failed to generate page:'), error);
        process.exit(1);
      }
    });

  // API route generator
  generate
    .command('api <name>')
    .description('Generate an API route (supports dynamic routes like posts/[id])')
    .option('-d, --directory <dir>', 'Target directory')
    .option('--no-test', 'Skip test file generation')
    .option('--methods <methods>', 'HTTP methods to generate (comma-separated)', 'GET,POST,PUT,DELETE')
    .option('--js', 'Use JavaScript instead of TypeScript')
    .action(async (name, options) => {
      console.log(pc.cyan(`\nGenerating API route: ${name}\n`));
      try {
        const config = await loadConfig();
        const genConfig = getGeneratorConfig(config, 'api');

        const methods = options.methods.split(',').map((m: string) => m.trim().toUpperCase());

        await generateApi({
          name,
          directory: options.directory || genConfig.path,
          typescript: !options.js && genConfig.typescript !== false,
          withTest: options.test !== false && genConfig.tests !== false,
          methods,
        });

        console.log(pc.green(`\nAPI route ${name} created successfully!\n`));
      } catch (error) {
        console.error(pc.red('Failed to generate API route:'), error);
        process.exit(1);
      }
    });

  // Model generator
  generate
    .command('model <name> [fields...]')
    .description('Generate a database model (e.g., model User name:string email:string:unique)')
    .option('--provider <provider>', 'Database provider: prisma or drizzle', 'prisma')
    .option('--schema <path>', 'Path to schema file')
    .option('--js', 'Use JavaScript instead of TypeScript (Drizzle only)')
    .option('-i, --interactive', 'Interactive field definition')
    .action(async (name, fields, options) => {
      console.log(pc.cyan(`\nGenerating model: ${name}\n`));
      try {
        const config = await loadConfig();

        let finalFields = fields;
        if (options.interactive || fields.length === 0) {
          const interactiveFields = await promptModelFields();
          finalFields = interactiveFields.map(f => {
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

        await generateModel({
          name,
          fields: finalFields,
          provider: options.provider || config.database?.provider,
          schemaPath: options.schema || config.database?.schema,
          typescript: !options.js,
        });

        console.log(pc.green(`\nModel ${name} created successfully!\n`));
      } catch (error) {
        console.error(pc.red('Failed to generate model:'), error);
        process.exit(1);
      }
    });

  // Scaffold generator (full CRUD)
  generate
    .command('scaffold <name> [fields...]')
    .description('Generate full CRUD: model, API routes, pages, and components')
    .option('--provider <provider>', 'Database provider: prisma or drizzle', 'prisma')
    .option('--no-test', 'Skip test file generation')
    .option('--js', 'Use JavaScript instead of TypeScript')
    .option('--skip-model', 'Skip model generation')
    .option('--skip-api', 'Skip API routes generation')
    .option('--skip-pages', 'Skip pages generation')
    .option('--skip-components', 'Skip components generation')
    .option('-i, --interactive', 'Interactive field definition')
    .action(async (name, fields, options) => {
      console.log(pc.cyan(`\nGenerating scaffold for: ${name}\n`));
      try {
        const config = await loadConfig();

        let finalFields = fields;
        if (options.interactive || fields.length === 0) {
          console.log(pc.dim('\nDefine the fields for your model:'));
          const interactiveFields = await promptModelFields();
          finalFields = interactiveFields.map(f => {
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

        await generateScaffold({
          name,
          fields: finalFields,
          provider: options.provider || config.database?.provider,
          typescript: !options.js,
          withTests: options.test !== false,
          skipModel: options.skipModel,
          skipApi: options.skipApi,
          skipPages: options.skipPages,
          skipComponents: options.skipComponents,
        });
      } catch (error) {
        console.error(pc.red('Failed to generate scaffold:'), error);
        process.exit(1);
      }
    });

  // Hook generator
  generate
    .command('hook <name>')
    .alias('h')
    .description('Generate a custom hook')
    .option('-d, --directory <dir>', 'Target directory')
    .option('--no-test', 'Skip test file generation')
    .option('--js', 'Use JavaScript instead of TypeScript')
    .action(async (name, options) => {
      console.log(pc.cyan(`\nGenerating hook: ${name}\n`));
      try {
        const config = await loadConfig();
        const genConfig = getGeneratorConfig(config, 'hook');

        await generateHook({
          name,
          directory: options.directory || genConfig.path,
          typescript: !options.js && genConfig.typescript !== false,
          withTest: options.test !== false && genConfig.tests !== false,
        });

        console.log(pc.green(`\nHook ${name} created successfully!\n`));
      } catch (error) {
        console.error(pc.red('Failed to generate hook:'), error);
        process.exit(1);
      }
    });

  // Context generator
  generate
    .command('context <name>')
    .alias('ctx')
    .description('Generate a context provider with hook')
    .option('-d, --directory <dir>', 'Target directory')
    .option('--no-test', 'Skip test file generation')
    .option('--js', 'Use JavaScript instead of TypeScript')
    .action(async (name, options) => {
      console.log(pc.cyan(`\nGenerating context: ${name}\n`));
      try {
        const config = await loadConfig();
        const genConfig = getGeneratorConfig(config, 'context');

        await generateContext({
          name,
          directory: options.directory || genConfig.path,
          typescript: !options.js && genConfig.typescript !== false,
          withTest: options.test !== false && genConfig.tests !== false,
        });

        console.log(pc.green(`\nContext ${name} created successfully!\n`));
      } catch (error) {
        console.error(pc.red('Failed to generate context:'), error);
        process.exit(1);
      }
    });

  // Route generator
  generate
    .command('route <name>')
    .alias('r')
    .description('Generate a route with loader and action')
    .option('-d, --directory <dir>', 'Target directory')
    .option('--no-test', 'Skip test file generation')
    .option('--js', 'Use JavaScript instead of TypeScript')
    .action(async (name, options) => {
      console.log(pc.cyan(`\nGenerating route: ${name}\n`));
      try {
        const config = await loadConfig();
        const genConfig = getGeneratorConfig(config, 'route');

        await generateRoute({
          name,
          directory: options.directory || genConfig.path,
          typescript: !options.js && genConfig.typescript !== false,
          withTest: options.test !== false && genConfig.tests !== false,
        });

        console.log(pc.green(`\nRoute ${name} created successfully!\n`));
      } catch (error) {
        console.error(pc.red('Failed to generate route:'), error);
        process.exit(1);
      }
    });

  // Store generator
  generate
    .command('store <name>')
    .alias('s')
    .description('Generate a state store with signals')
    .option('-d, --directory <dir>', 'Target directory')
    .option('--no-test', 'Skip test file generation')
    .option('--js', 'Use JavaScript instead of TypeScript')
    .action(async (name, options) => {
      console.log(pc.cyan(`\nGenerating store: ${name}\n`));
      try {
        const config = await loadConfig();
        const genConfig = getGeneratorConfig(config, 'store');

        await generateStore({
          name,
          directory: options.directory || genConfig.path,
          typescript: !options.js && genConfig.typescript !== false,
          withTest: options.test !== false && genConfig.tests !== false,
        });

        console.log(pc.green(`\nStore ${name} created successfully!\n`));
      } catch (error) {
        console.error(pc.red('Failed to generate store:'), error);
        process.exit(1);
      }
    });

  // Auth generator
  generate
    .command('auth <provider>')
    .description('Generate authentication setup (clerk, auth0, supabase, nextauth, custom)')
    .option('-d, --directory <dir>', 'Target directory', 'src')
    .option('--no-ui', 'Skip UI components generation')
    .option('--no-middleware', 'Skip middleware generation')
    .option('--no-protected-routes', 'Skip protected route utilities')
    .option('--js', 'Use JavaScript instead of TypeScript')
    .action(async (provider, options) => {
      const validProviders = ['clerk', 'auth0', 'supabase', 'nextauth', 'custom'];

      if (!validProviders.includes(provider.toLowerCase())) {
        console.error(pc.red(`Invalid provider: ${provider}`));
        console.log(pc.white('Valid providers: clerk, auth0, supabase, nextauth, custom'));
        process.exit(1);
      }

      try {
        await generateAuth({
          provider: provider.toLowerCase(),
          directory: options.directory,
          typescript: !options.js,
          withUI: options.ui !== false,
          withMiddleware: options.middleware !== false,
          withProtectedRoutes: options.protectedRoutes !== false,
        });
      } catch (error) {
        console.error(pc.red('Failed to generate auth:'), error);
        process.exit(1);
      }
    });

  // RSS feed generator
  generate
    .command('rss')
    .description('Generate RSS/Atom/JSON feed setup')
    .option('-o, --output <path>', 'Output file path', 'public/feed.xml')
    .option('-f, --format <format>', 'Feed format: rss, atom, or json', 'rss')
    .option('-c, --collection <name>', 'Collection name', 'blog')
    .option('--title <title>', 'Feed title', 'My Blog')
    .option('--description <desc>', 'Feed description', 'My blog posts')
    .option('--site <url>', 'Site URL', 'https://example.com')
    .option('--limit <number>', 'Maximum number of items', '20')
    .action(async (options) => {
      console.log(pc.cyan('\nGenerating RSS feed setup...\n'));
      try {
        await generateRSS({
          output: options.output,
          format: options.format,
          collection: options.collection,
          title: options.title,
          description: options.description,
          site: options.site,
          limit: parseInt(options.limit, 10),
        });

        console.log(pc.green('\nRSS feed setup created successfully!\n'));
      } catch (error) {
        console.error(pc.red('Failed to generate RSS feed:'), error);
        process.exit(1);
      }
    });

  // Sitemap generator
  generate
    .command('sitemap')
    .description('Generate XML sitemap setup')
    .option('-o, --output <path>', 'Output file path', 'public/sitemap.xml')
    .option('-c, --collection <name>', 'Collection name', 'blog')
    .option('--site <url>', 'Site URL', 'https://example.com')
    .option('--changefreq <freq>', 'Change frequency', 'weekly')
    .option('--priority <priority>', 'Priority (0.0 to 1.0)', '0.7')
    .action(async (options) => {
      console.log(pc.cyan('\nGenerating sitemap setup...\n'));
      try {
        await generateSitemap({
          output: options.output,
          collection: options.collection,
          site: options.site,
          changefreq: options.changefreq,
          priority: parseFloat(options.priority),
        });

        console.log(pc.green('\nSitemap setup created successfully!\n'));
      } catch (error) {
        console.error(pc.red('Failed to generate sitemap:'), error);
        process.exit(1);
      }
    });
}

/**
 * Run a generator by type
 */
async function runGenerator(
  type: GeneratorType,
  name: string,
  options: {
    typescript?: boolean;
    withTest?: boolean;
    withStyles?: boolean;
    fields?: string[];
  }
): Promise<void> {
  const config = await loadConfig();

  switch (type) {
    case 'component':
      await generateComponent({
        name,
        typescript: options.typescript,
        withTest: options.withTest,
        withStyles: options.withStyles,
      });
      break;

    case 'page':
      await generatePage({
        name,
        typescript: options.typescript,
        withTest: options.withTest,
        withStyles: options.withStyles,
      });
      break;

    case 'api':
      await generateApi({
        name,
        typescript: options.typescript,
        withTest: options.withTest,
      });
      break;

    case 'model':
      await generateModel({
        name,
        fields: options.fields,
        typescript: options.typescript,
        provider: config.database?.provider,
      });
      break;

    case 'scaffold':
      await generateScaffold({
        name,
        fields: options.fields,
        typescript: options.typescript,
        withTests: options.withTest,
        provider: config.database?.provider,
      });
      break;

    case 'hook':
      await generateHook({
        name,
        typescript: options.typescript,
        withTest: options.withTest,
      });
      break;

    case 'context':
      await generateContext({
        name,
        typescript: options.typescript,
        withTest: options.withTest,
      });
      break;

    case 'route':
      await generateRoute({
        name,
        typescript: options.typescript,
        withTest: options.withTest,
      });
      break;

    case 'store':
      await generateStore({
        name,
        typescript: options.typescript,
        withTest: options.withTest,
      });
      break;

    default:
      throw new Error(`Unknown generator type: ${type}`);
  }
}
