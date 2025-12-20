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
import { MigrationManager } from './manager';
import { SchemaDiffGenerator } from './schema-diff';
import { AutoMigrationGenerator } from './auto-migration';
import type { MigrationConfig, DatabaseType } from './types';

interface CLIOptions {
  config?: string;
  env?: string;
  step?: number;
  to?: string;
  batch?: number;
  name?: string;
  template?: string;
  dryRun?: boolean;
  verbose?: boolean;
}

class MigrationCLI {
  private manager?: MigrationManager;
  private config?: MigrationConfig;

  async run(args: string[]): Promise<void> {
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
    } catch (error) {
      console.error('Error:', (error as Error).message);
      if (options.verbose) {
        console.error((error as Error).stack);
      }
      process.exit(1);
    }
  }

  private async loadConfig(configPath?: string): Promise<void> {
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
      } catch (error) {
        // Continue to next path
      }
    }

    throw new Error(
      'Configuration file not found. Create philjs-db.config.js in your project root.'
    );
  }

  private async migrate(options: CLIOptions): Promise<void> {
    if (!this.manager) throw new Error('Manager not initialized');

    console.log('Running migrations...\n');

    if (options.dryRun) {
      const status = await this.manager.getStatus();
      console.log('Pending migrations (dry run):');
      status.pending.forEach((m) => console.log(`  - ${m.version}_${m.name}`));
      return;
    }

    const result = await this.manager.migrate({
      to: options.to,
      step: options.step,
    });

    if (result.success) {
      console.log('✓ Migrations completed successfully\n');
      console.log(`  Executed: ${result.migrations.length} migration(s)`);
      console.log(`  Duration: ${result.duration}ms`);

      if (result.migrations.length > 0) {
        console.log('\nMigrations:');
        result.migrations.forEach((m) => console.log(`  ✓ ${m}`));
      }
    } else {
      console.error('✗ Migration failed\n');
      result.errors.forEach((err) => {
        console.error(`  ✗ ${err.migration}: ${err.error.message}`);
      });
      process.exit(1);
    }
  }

  private async createMigration(options: CLIOptions): Promise<void> {
    if (!this.manager) throw new Error('Manager not initialized');

    const name = options.name || this.promptMigrationName();
    if (!name) {
      throw new Error('Migration name is required');
    }

    const filepath = await this.manager.create(name, {
      template: options.template,
    });

    console.log(`✓ Created migration: ${filepath}`);
  }

  private async rollback(options: CLIOptions): Promise<void> {
    if (!this.manager) throw new Error('Manager not initialized');

    console.log('Rolling back migrations...\n');

    if (options.dryRun) {
      const status = await this.manager.getStatus();
      const lastBatch = Math.max(...status.executed.map((m) => m.batch), 0);
      const toRollback = status.executed.filter((m) => m.batch === lastBatch);

      console.log('Migrations to rollback (dry run):');
      toRollback.forEach((m) => console.log(`  - ${m.version}_${m.name}`));
      return;
    }

    const result = await this.manager.rollback({
      to: options.to,
      step: options.step,
      batch: options.batch,
    });

    if (result.success) {
      console.log('✓ Rollback completed successfully\n');
      console.log(`  Rolled back: ${result.migrations.length} migration(s)`);
      console.log(`  Duration: ${result.duration}ms`);

      if (result.migrations.length > 0) {
        console.log('\nMigrations:');
        result.migrations.forEach((m) => console.log(`  ✓ ${m}`));
      }
    } else {
      console.error('✗ Rollback failed\n');
      result.errors.forEach((err) => {
        console.error(`  ✗ ${err.migration}: ${err.error.message}`);
      });
      process.exit(1);
    }
  }

  private async status(options: CLIOptions): Promise<void> {
    if (!this.manager) throw new Error('Manager not initialized');

    const status = await this.manager.getStatus();

    console.log('Migration Status\n');

    if (status.conflicts.length > 0) {
      console.log('⚠ Conflicts:\n');
      status.conflicts.forEach((c) => {
        console.log(`  ${c.type.toUpperCase()}: ${c.message}`);
      });
      console.log();
    }

    console.log(`Executed Migrations: ${status.executed.length}`);
    if (status.executed.length > 0) {
      const batches = new Set(status.executed.map((m) => m.batch));
      console.log(`Batches: ${batches.size}`);
      console.log();

      if (options.verbose) {
        console.log('Executed:');
        status.executed.forEach((m) => {
          console.log(
            `  ✓ ${m.version}_${m.name} (batch ${m.batch}, ${m.execution_time}ms)`
          );
        });
        console.log();
      }
    }

    console.log(`Pending Migrations: ${status.pending.length}`);
    if (status.pending.length > 0) {
      console.log('\nPending:');
      status.pending.forEach((m) => {
        console.log(`  - ${m.version}_${m.name}`);
      });
    }
  }

  private async fresh(options: CLIOptions): Promise<void> {
    if (!this.manager) throw new Error('Manager not initialized');

    console.log('⚠ Warning: This will drop all tables and re-run migrations.\n');

    if (!options.dryRun && !(await this.confirm('Continue?'))) {
      console.log('Aborted.');
      return;
    }

    if (options.dryRun) {
      console.log('Would drop all tables and run migrations (dry run)');
      return;
    }

    console.log('Dropping all tables...');
    const result = await this.manager.fresh();

    if (result.success) {
      console.log('✓ Database refreshed successfully\n');
      console.log(`  Executed: ${result.migrations.length} migration(s)`);
      console.log(`  Duration: ${result.duration}ms`);
    } else {
      console.error('✗ Fresh failed');
      process.exit(1);
    }
  }

  private async reset(options: CLIOptions): Promise<void> {
    if (!this.manager) throw new Error('Manager not initialized');

    console.log('⚠ Warning: This will rollback all migrations and re-run them.\n');

    if (!options.dryRun && !(await this.confirm('Continue?'))) {
      console.log('Aborted.');
      return;
    }

    if (options.dryRun) {
      console.log('Would rollback all and re-run migrations (dry run)');
      return;
    }

    console.log('Resetting database...');
    const result = await this.manager.reset();

    if (result.success) {
      console.log('✓ Database reset successfully\n');
      console.log(`  Executed: ${result.migrations.length} migration(s)`);
      console.log(`  Duration: ${result.duration}ms`);
    } else {
      console.error('✗ Reset failed');
      process.exit(1);
    }
  }

  private async diff(options: CLIOptions): Promise<void> {
    if (!this.config) throw new Error('Config not loaded');

    console.log('Generating schema diff...\n');

    const generator = new SchemaDiffGenerator(this.config);
    const diff = await generator.generate();

    this.printSchemaDiff(diff);
  }

  private async autoMigration(options: CLIOptions): Promise<void> {
    if (!this.config || !this.manager) throw new Error('Not initialized');

    console.log('Generating migration from schema changes...\n');

    const generator = new AutoMigrationGenerator(this.config);
    const migration = await generator.generate({
      compare: true,
      name: options.name,
      dryRun: options.dryRun,
    });

    if (options.dryRun) {
      console.log('Generated SQL (dry run):');
      migration.sql.forEach((sql) => console.log(`  ${sql}`));

      if (migration.warnings.length > 0) {
        console.log('\n⚠ Warnings:');
        migration.warnings.forEach((w) => console.log(`  ${w}`));
      }
    } else {
      const filepath = await this.manager.create(options.name || 'auto_migration');
      console.log(`✓ Created migration: ${filepath}`);
    }
  }

  private parseOptions(args: string[]): CLIOptions {
    const options: CLIOptions = {};

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      if (arg === '--config' || arg === '-c') {
        options.config = args[++i];
      } else if (arg === '--env' || arg === '-e') {
        options.env = args[++i];
      } else if (arg === '--step' || arg === '-s') {
        options.step = parseInt(args[++i], 10);
      } else if (arg === '--to' || arg === '-t') {
        options.to = args[++i];
      } else if (arg === '--batch' || arg === '-b') {
        options.batch = parseInt(args[++i], 10);
      } else if (arg === '--name' || arg === '-n') {
        options.name = args[++i];
      } else if (arg === '--template') {
        options.template = args[++i];
      } else if (arg === '--dry-run' || arg === '-d') {
        options.dryRun = true;
      } else if (arg === '--verbose' || arg === '-v') {
        options.verbose = true;
      }
    }

    return options;
  }

  private promptMigrationName(): string {
    // In a real CLI, this would use readline or inquirer
    return process.argv[process.argv.length - 1];
  }

  private async confirm(message: string): Promise<boolean> {
    // In a real CLI, this would use readline
    return process.env.CI === 'true' || process.argv.includes('--yes');
  }

  private printSchemaDiff(diff: any): void {
    console.log('Tables:');
    if (diff.tables.created.length > 0) {
      console.log('\n  Created:');
      diff.tables.created.forEach((t: any) => console.log(`    + ${t.name}`));
    }

    if (diff.tables.dropped.length > 0) {
      console.log('\n  Dropped:');
      diff.tables.dropped.forEach((t: string) => console.log(`    - ${t}`));
    }

    if (diff.tables.modified.length > 0) {
      console.log('\n  Modified:');
      diff.tables.modified.forEach((t: any) => console.log(`    ~ ${t.name}`));
    }
  }

  private showHelp(): void {
    console.log(`
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
