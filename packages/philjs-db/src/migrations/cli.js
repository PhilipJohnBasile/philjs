#!/usr/bin/env node
/**
 * PhilJS Database Migration CLI
 *
 * Commands:
 * - philjs db migrate - Run pending migrations
 * - philjs db migrate:create - Create new migration
 * - philjs db migrate:rollback - Rollback migrations
 * - philjs db migrate:status - Check migration status
 * - philjs db migrate:fresh - Fresh database
 * - philjs db migrate:reset - Reset and re-run
 */
import * as path from 'path';
import * as fs from 'fs/promises';
import { MigrationManager } from './manager.js';
import { SchemaDiffGenerator } from './schema-diff.js';
import { AutoMigrationGenerator } from './auto-migration.js';
class MigrationCLI {
    manager;
    config;
    async run(args) {
        const [command, ...rest] = args;
        const options = this.parseOptions(rest);
        try {
            await this.loadConfig(options.config);
            switch (command) {
                case 'migrate':
                    await this.migrate(options);
                    break;
                case 'migrate:create':
                case 'create':
                    await this.createMigration(options);
                    break;
                case 'migrate:rollback':
                case 'rollback':
                    await this.rollback(options);
                    break;
                case 'migrate:status':
                case 'status':
                    await this.status(options);
                    break;
                case 'migrate:fresh':
                case 'fresh':
                    await this.fresh(options);
                    break;
                case 'migrate:reset':
                case 'reset':
                    await this.reset(options);
                    break;
                case 'migrate:diff':
                case 'diff':
                    await this.diff(options);
                    break;
                case 'migrate:auto':
                case 'auto':
                    await this.autoMigration(options);
                    break;
                default:
                    this.showHelp();
            }
        }
        catch (error) {
            console.error('Error:', error.message);
            if (options.verbose) {
                console.error(error.stack);
            }
            process.exit(1);
        }
    }
    async loadConfig(configPath) {
        const defaultPaths = [
            'philjs-db.config.js',
            'philjs-db.config.ts',
            'database.config.js',
            'database.config.ts',
        ];
        const paths = configPath ? [configPath] : defaultPaths;
        for (const p of paths) {
            try {
                const fullPath = path.resolve(process.cwd(), p);
                const config = await import(fullPath);
                this.config = config.default || config;
                if (this.config) {
                    this.manager = new MigrationManager(this.config);
                    await this.manager.initialize();
                    return;
                }
            }
            catch (error) {
                // Continue to next path
            }
        }
        throw new Error('Configuration file not found. Create philjs-db.config.js in your project root.');
    }
    async migrate(options) {
        if (!this.manager)
            throw new Error('Manager not initialized');
        if (options.dryRun) {
            const status = await this.manager.getStatus();
            status.pending.forEach((m) => console.log(`  - ${m.version}_${m.name}`));
            return;
        }
        const result = await this.manager.migrate({
            ...(options.to !== undefined && { to: options.to }),
            ...(options.step !== undefined && { step: options.step }),
        });
        if (result.success) {
            console.log('✓ Migrations completed successfully\n');
            console.log(`  Executed: ${result.migrations.length} migration(s)`);
            console.log(`  Duration: ${result.duration}ms`);
            if (result.migrations.length > 0) {
                result.migrations.forEach((m) => console.log(`  ✓ ${m}`));
            }
        }
        else {
            console.error('✗ Migration failed\n');
            result.errors.forEach((err) => {
                console.error(`  ✗ ${err.migration}: ${err.error.message}`);
            });
            process.exit(1);
        }
    }
    async createMigration(options) {
        if (!this.manager)
            throw new Error('Manager not initialized');
        const name = options.name || this.promptMigrationName();
        if (!name) {
            throw new Error('Migration name is required');
        }
        const filepath = await this.manager.create(name, {
            ...(options.template !== undefined && { template: options.template }),
        });
        console.log(`✓ Created migration: ${filepath}`);
    }
    async rollback(options) {
        if (!this.manager)
            throw new Error('Manager not initialized');
        if (options.dryRun) {
            const status = await this.manager.getStatus();
            const lastBatch = Math.max(...status.executed.map((m) => m.batch), 0);
            const toRollback = status.executed.filter((m) => m.batch === lastBatch);
            toRollback.forEach((m) => console.log(`  - ${m.version}_${m.name}`));
            return;
        }
        const result = await this.manager.rollback({
            ...(options.to !== undefined && { to: options.to }),
            ...(options.step !== undefined && { step: options.step }),
            ...(options.batch !== undefined && { batch: options.batch }),
        });
        if (result.success) {
            console.log('✓ Rollback completed successfully\n');
            console.log(`  Rolled back: ${result.migrations.length} migration(s)`);
            console.log(`  Duration: ${result.duration}ms`);
            if (result.migrations.length > 0) {
                result.migrations.forEach((m) => console.log(`  ✓ ${m}`));
            }
        }
        else {
            console.error('✗ Rollback failed\n');
            result.errors.forEach((err) => {
                console.error(`  ✗ ${err.migration}: ${err.error.message}`);
            });
            process.exit(1);
        }
    }
    async status(options) {
        if (!this.manager)
            throw new Error('Manager not initialized');
        const status = await this.manager.getStatus();
        if (status.conflicts.length > 0) {
            status.conflicts.forEach((c) => {
                console.log(`  ${c.type.toUpperCase()}: ${c.message}`);
            });
        }
        console.log(`Executed Migrations: ${status.executed.length}`);
        if (status.executed.length > 0) {
            const batches = new Set(status.executed.map((m) => m.batch));
            console.log(`Batches: ${batches.size}`);
            if (options.verbose) {
                status.executed.forEach((m) => {
                    console.log(`  ✓ ${m.version}_${m.name} (batch ${m.batch}, ${m.execution_time}ms)`);
                });
            }
        }
        console.log(`Pending Migrations: ${status.pending.length}`);
        if (status.pending.length > 0) {
            status.pending.forEach((m) => {
                console.log(`  - ${m.version}_${m.name}`);
            });
        }
    }
    async fresh(options) {
        if (!this.manager)
            throw new Error('Manager not initialized');
        console.log('⚠ Warning: This will drop all tables and re-run migrations.\n');
        if (!options.dryRun && !(await this.confirm('Continue?'))) {
            return;
        }
        if (options.dryRun) {
            console.log('Would drop all tables and run migrations (dry run)');
            return;
        }
        const result = await this.manager.fresh();
        if (result.success) {
            console.log('✓ Database refreshed successfully\n');
            console.log(`  Executed: ${result.migrations.length} migration(s)`);
            console.log(`  Duration: ${result.duration}ms`);
        }
        else {
            console.error('✗ Fresh failed');
            process.exit(1);
        }
    }
    async reset(options) {
        if (!this.manager)
            throw new Error('Manager not initialized');
        console.log('⚠ Warning: This will rollback all migrations and re-run them.\n');
        if (!options.dryRun && !(await this.confirm('Continue?'))) {
            return;
        }
        if (options.dryRun) {
            console.log('Would rollback all and re-run migrations (dry run)');
            return;
        }
        const result = await this.manager.reset();
        if (result.success) {
            console.log(`  Executed: ${result.migrations.length} migration(s)`);
            console.log(`  Duration: ${result.duration}ms`);
        }
        else {
            console.error('✗ Reset failed');
            process.exit(1);
        }
    }
    async diff(options) {
        if (!this.config)
            throw new Error('Config not loaded');
        const generator = new SchemaDiffGenerator(this.config);
        const diff = await generator.generate();
        this.printSchemaDiff(diff);
    }
    async autoMigration(options) {
        if (!this.config || !this.manager)
            throw new Error('Not initialized');
        console.log('Generating migration from schema changes...\n');
        const generator = new AutoMigrationGenerator(this.config);
        const migration = await generator.generate({
            compare: true,
            ...(options.name !== undefined ? { name: options.name } : {}),
            ...(options.dryRun !== undefined ? { dryRun: options.dryRun } : {}),
        });
        if (options.dryRun) {
            migration.sql.forEach((sql) => console.log(`  ${sql}`));
            if (migration.warnings.length > 0) {
                migration.warnings.forEach((w) => console.log(`  ${w}`));
            }
        }
        else {
            const filepath = await this.manager.create(options.name || 'auto_migration');
            console.log(`✓ Created migration: ${filepath}`);
        }
    }
    parseOptions(args) {
        const options = {};
        for (let i = 0; i < args.length; i++) {
            const arg = args[i];
            if (arg === '--config' || arg === '-c') {
                const value = args[++i];
                if (value !== undefined)
                    options.config = value;
            }
            else if (arg === '--env' || arg === '-e') {
                const value = args[++i];
                if (value !== undefined)
                    options.env = value;
            }
            else if (arg === '--step' || arg === '-s') {
                const value = args[++i];
                if (value !== undefined)
                    options.step = parseInt(value, 10);
            }
            else if (arg === '--to' || arg === '-t') {
                const value = args[++i];
                if (value !== undefined)
                    options.to = value;
            }
            else if (arg === '--batch' || arg === '-b') {
                const value = args[++i];
                if (value !== undefined)
                    options.batch = parseInt(value, 10);
            }
            else if (arg === '--name' || arg === '-n') {
                const value = args[++i];
                if (value !== undefined)
                    options.name = value;
            }
            else if (arg === '--template') {
                const value = args[++i];
                if (value !== undefined)
                    options.template = value;
            }
            else if (arg === '--dry-run' || arg === '-d') {
                options.dryRun = true;
            }
            else if (arg === '--verbose' || arg === '-v') {
                options.verbose = true;
            }
        }
        return options;
    }
    promptMigrationName() {
        // In a real CLI, this would use readline or inquirer
        return process.argv[process.argv.length - 1] ?? '';
    }
    async confirm(message) {
        // In a real CLI, this would use readline
        return process.env['CI'] === 'true' || process.argv.includes('--yes');
    }
    printSchemaDiff(diff) {
        if (diff.tables.created.length > 0) {
            diff.tables.created.forEach((t) => console.log(`    + ${t.name}`));
        }
        if (diff.tables.dropped.length > 0) {
            diff.tables.dropped.forEach((t) => console.log(`    - ${t}`));
        }
        if (diff.tables.modified.length > 0) {
            diff.tables.modified.forEach((t) => console.log(`    ~ ${t.name}`));
        }
    }
    showHelp() {
PhilJS Database Migration CLI

Usage:
  philjs db <command> [options]

Commands:
  migrate              Run pending migrations
  migrate:create       Create a new migration
  migrate:rollback     Rollback the last batch of migrations
  migrate:status       Show migration status
  migrate:fresh        Drop all tables and re-run migrations
  migrate:reset        Rollback all migrations and re-run them
  migrate:diff         Show schema differences
  migrate:auto         Generate migration from schema changes

Options:
  --config, -c <path>  Config file path
  --env, -e <env>      Environment (default: development)
  --step, -s <n>       Number of migrations to run/rollback
  --to, -t <version>   Migrate/rollback to specific version
  --batch, -b <n>      Rollback specific batch number
  --name, -n <name>    Migration name
  --template <type>    Migration template (table, alter, data)
  --dry-run, -d        Show what would happen without executing
  --verbose, -v        Show detailed output
  --yes, -y            Skip confirmation prompts

Examples:
  philjs db migrate
  philjs db migrate:create --name create_users_table --template table
  philjs db migrate:rollback --step 1
  philjs db migrate:status
  philjs db migrate:fresh --yes
  philjs db migrate:auto --name auto_migration --dry-run
    `);
    }
}
// Run CLI if executed directly
if (require.main === module) {
    const cli = new MigrationCLI();
    cli.run(process.argv.slice(2)).catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}
export { MigrationCLI };
//# sourceMappingURL=cli.js.map