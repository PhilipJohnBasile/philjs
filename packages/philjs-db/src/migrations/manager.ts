/**
 * PhilJS Database Migration Manager
 * Core migration orchestration and execution
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { pathToFileURL } from 'url';
import type {
  Migration,
  MigrationConfig,
  MigrationRecord,
  MigrationStatus,
  MigrationResult,
  MigrationFile,
  MigrationConflict,
  MigrationError,
  BackupConfig,
} from './types.js';

export class MigrationManager {
  private config: Required<MigrationConfig>;
  private connection: unknown;
  private executedMigrations: MigrationRecord[] = [];

  constructor(config: MigrationConfig) {
    this.config = {
      type: config.type,
      connection: config.connection,
      migrationsDir: config.migrationsDir || './migrations',
      tableName: config.tableName || 'migrations',
      transactional: config.transactional ?? true,
      backup: config.backup ?? false,
      seedsDir: config.seedsDir || './seeds',
      schemaFile: config.schemaFile || './schema.sql',
    };
  }

  /**
   * Initialize migration system
   */
  async initialize(): Promise<void> {
    // Create migrations directory if it doesn't exist
    await fs.mkdir(this.config.migrationsDir, { recursive: true });

    // Create migrations table
    await this.createMigrationsTable();
  }

  /**
   * Create migrations tracking table
   */
  private async createMigrationsTable(): Promise<void> {
    const sql = this.generateCreateTableSQL();
    // Execute SQL based on database type
    // Implementation depends on database driver
  }

  /**
   * Get migration status
   */
  async getStatus(): Promise<MigrationStatus> {
    const executed = await this.getExecutedMigrations();
    const files = await this.getMigrationFiles();
    const executedVersions = new Set(executed.map((record) => record.version));
    const pending = files.filter((file) => !executedVersions.has(file.version));
    const conflicts = await this.detectConflicts(files, executed);

    return { pending, executed, conflicts };
  }

  /**
   * Run pending migrations
   */
  async migrate(options: { to?: string; step?: number } = {}): Promise<MigrationResult> {
    const startTime = Date.now();
    const status = await this.getStatus();
    const errors: MigrationError[] = [];
    const migrated: string[] = [];

    if (status.conflicts.length > 0) {
      throw new Error(
        `Migration conflicts detected:\n${status.conflicts.map((c) => c.message).join('\n')}`
      );
    }

    let migrationsToRun = status.pending;

    // Filter migrations based on options
    if (options.to) {
      const index = migrationsToRun.findIndex((m) => m.version === options.to);
      if (index === -1) {
        throw new Error(`Migration ${options.to} not found`);
      }
      migrationsToRun = migrationsToRun.slice(0, index + 1);
    } else if (options.step) {
      migrationsToRun = migrationsToRun.slice(0, options.step);
    }

    // Backup if configured
    if (this.config.backup) {
      await this.createBackup();
    }

    const batch = await this.getNextBatch();

    for (const file of migrationsToRun) {
      try {
        await this.runMigration(file, batch, 'up');
        migrated.push(file.version);
      } catch (error) {
        errors.push({
          migration: file.version,
          error: error as Error,
          timestamp: new Date(),
        });
        break; // Stop on first error
      }
    }

    return {
      success: errors.length === 0,
      migrations: migrated,
      errors,
      duration: Date.now() - startTime,
    };
  }

  /**
   * Rollback migrations
   */
  async rollback(options: { to?: string; step?: number; batch?: number } = {}): Promise<MigrationResult> {
    const startTime = Date.now();
    const executed = await this.getExecutedMigrations();
    const errors: MigrationError[] = [];
    const rolledBack: string[] = [];

    let migrationsToRollback = executed.reverse();

    if (options.batch !== undefined) {
      migrationsToRollback = migrationsToRollback.filter(
        (m) => m.batch === options.batch
      );
    } else if (options.to) {
      const index = migrationsToRollback.findIndex((m) => m.version === options.to);
      if (index === -1) {
        throw new Error(`Migration ${options.to} not found`);
      }
      migrationsToRollback = migrationsToRollback.slice(0, index);
    } else if (options.step) {
      migrationsToRollback = migrationsToRollback.slice(0, options.step);
    } else {
      // Rollback last batch by default
      const lastBatch = Math.max(...executed.map((m) => m.batch));
      migrationsToRollback = migrationsToRollback.filter(
        (m) => m.batch === lastBatch
      );
    }

    // Backup if configured
    if (this.config.backup) {
      await this.createBackup();
    }

    for (const record of migrationsToRollback) {
      try {
        const file = await this.findMigrationFile(record.version);
        if (!file) {
          throw new Error(`Migration file not found: ${record.version}`);
        }
        await this.runMigration(file, record.batch, 'down');
        rolledBack.push(record.version);
      } catch (error) {
        errors.push({
          migration: record.version,
          error: error as Error,
          timestamp: new Date(),
        });
        break;
      }
    }

    return {
      success: errors.length === 0,
      migrations: rolledBack,
      errors,
      duration: Date.now() - startTime,
    };
  }

  /**
   * Reset database (rollback all, then migrate)
   */
  async reset(): Promise<MigrationResult> {
    const rollbackResult = await this.rollback({ step: Infinity });
    if (!rollbackResult.success) {
      return rollbackResult;
    }

    return await this.migrate();
  }

  /**
   * Fresh database (drop all tables, then migrate)
   */
  async fresh(): Promise<MigrationResult> {
    await this.dropAllTables();
    await this.createMigrationsTable();
    return await this.migrate();
  }

  /**
   * Create a new migration file
   */
  async create(name: string, options: { template?: string } = {}): Promise<string> {
    const timestamp = this.generateTimestamp();
    const version = await this.ensureUniqueVersion(timestamp);
    const filename = `${version}_${this.sanitizeName(name)}.ts`;
    const filepath = path.join(this.config.migrationsDir, filename);

    const template = this.getMigrationTemplate(name, options.template);
    await fs.writeFile(filepath, template, 'utf-8');

    return filepath;
  }

  /**
   * Run a single migration
   */
  private async runMigration(
    file: MigrationFile,
    batch: number,
    direction: 'up' | 'down'
  ): Promise<void> {
    const startTime = Date.now();
    const migration = await this.loadMigration(file.filepath);

    const runMigrationFn = async () => {
      const context = await this.createMigrationContext();

      if (direction === 'up') {
        await migration.up(context);
        await this.recordMigration(file.version, file.name, batch, Date.now() - startTime);
      } else {
        await migration.down(context);
        await this.deleteMigrationRecord(file.version);
      }
    };

    if (this.config.transactional && migration.transaction !== false) {
      await this.withTransaction(runMigrationFn);
    } else {
      await runMigrationFn();
    }
  }

  /**
   * Load migration from file
   */
  private async loadMigration(filepath: string): Promise<Migration> {
    // Dynamic import of migration file
    const module = await import(pathToFileURL(filepath).href);
    return module.default || module;
  }

  /**
   * Create migration context
   */
  private async createMigrationContext() {
    // Create context with database connection and helpers
    // Implementation depends on database type
    return {} as any;
  }

  /**
   * Get executed migrations
   */
  private async getExecutedMigrations(): Promise<MigrationRecord[]> {
    return [...this.executedMigrations];
  }

  /**
   * Get migration files from directory
   */
  private async getMigrationFiles(): Promise<MigrationFile[]> {
    const entries = await fs.readdir(this.config.migrationsDir, { withFileTypes: true });
    const migrationFiles: MigrationFile[] = [];

    for (const entry of entries) {
      const file = typeof entry === 'string' ? entry : entry.name;
      const isFile = typeof entry === 'string' ? true : entry.isFile();
      if (!isFile) continue;
      if (!file.endsWith('.ts') && !file.endsWith('.js')) continue;

      const match = file.match(/^(\d+)_(.+)\.(ts|js)$/);
      if (!match) continue;

      const [, version, name] = match;
      if (version === undefined || name === undefined) continue;
      migrationFiles.push({
        version,
        name,
        filename: file,
        filepath: path.join(this.config.migrationsDir, file),
      });
    }

    return migrationFiles.sort((a, b) => a.version.localeCompare(b.version));
  }

  /**
   * Find specific migration file
   */
  private async findMigrationFile(version: string): Promise<MigrationFile | null> {
    const files = await this.getMigrationFiles();
    return files.find((f) => f.version === version) || null;
  }

  /**
   * Detect migration conflicts
   */
  private async detectConflicts(
    files: MigrationFile[],
    executed: MigrationRecord[]
  ): Promise<MigrationConflict[]> {
    const conflicts: MigrationConflict[] = [];
    const fileVersions = new Set(files.map((file) => file.version));

    // Check for missing migration files
    for (const record of executed) {
      if (!fileVersions.has(record.version)) {
        conflicts.push({
          type: 'missing',
          migration: record.version,
          message: `Migration file missing for executed migration: ${record.version}`,
        });
      }
    }

    // Check for duplicate versions
    const seen = new Set<string>();
    const duplicateVersions = new Set<string>();
    for (const file of files) {
      if (seen.has(file.version)) {
        duplicateVersions.add(file.version);
      } else {
        seen.add(file.version);
      }
    }
    for (const version of duplicateVersions) {
      conflicts.push({
        type: 'duplicate',
        migration: version,
        message: `Duplicate migration version: ${version}`,
      });
    }

    return conflicts;
  }

  /**
   * Record migration execution
   */
  private async recordMigration(
    version: string,
    name: string,
    batch: number,
    executionTime: number
  ): Promise<void> {
    this.executedMigrations.push({
      id: this.executedMigrations.length + 1,
      version,
      name,
      executed_at: new Date(),
      execution_time: executionTime,
      batch,
    });
  }

  /**
   * Delete migration record
   */
  private async deleteMigrationRecord(version: string): Promise<void> {
    this.executedMigrations = this.executedMigrations.filter(
      (record) => record.version !== version
    );
  }

  /**
   * Get next batch number
   */
  private async getNextBatch(): Promise<number> {
    const executed = await this.getExecutedMigrations();
    if (executed.length === 0) return 1;
    return Math.max(...executed.map((m) => m.batch)) + 1;
  }

  /**
   * Create database backup
   */
  private async createBackup(): Promise<void> {
    // Implementation depends on database type
  }

  /**
   * Drop all tables
   */
  private async dropAllTables(): Promise<void> {
    // Implementation depends on database type
  }

  /**
   * Execute function in transaction
   */
  private async withTransaction(fn: () => Promise<void>): Promise<void> {
    await fn();
  }

  /**
   * Generate timestamp for migration version
   */
  private generateTimestamp(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  private async ensureUniqueVersion(baseVersion: string): Promise<string> {
    let existingVersions = new Set<string>();

    try {
      const entries = await fs.readdir(this.config.migrationsDir, { withFileTypes: true });
      for (const entry of entries) {
        const name = typeof entry === 'string' ? entry : entry.name;
        const isFile = typeof entry === 'string' ? true : entry.isFile();
        if (!isFile) continue;
        const match = name.match(/^(\d+)_/);
        if (match?.[1]) {
          existingVersions.add(match[1]);
        }
      }
    } catch {
      existingVersions = new Set<string>();
    }

    if (!existingVersions.has(baseVersion)) {
      return baseVersion;
    }

    let counter = 1;
    let candidate = `${baseVersion}${String(counter).padStart(2, '0')}`;
    while (existingVersions.has(candidate)) {
      counter += 1;
      candidate = `${baseVersion}${String(counter).padStart(2, '0')}`;
    }

    return candidate;
  }

  /**
   * Sanitize migration name
   */
  private sanitizeName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
  }

  /**
   * Generate SQL for creating migrations table
   */
  private generateCreateTableSQL(): string {
    const table = this.config.tableName;

    switch (this.config.type) {
      case 'postgres':
        return `
          CREATE TABLE IF NOT EXISTS "${table}" (
            id SERIAL PRIMARY KEY,
            version VARCHAR(255) NOT NULL UNIQUE,
            name VARCHAR(255) NOT NULL,
            executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            execution_time INTEGER NOT NULL,
            batch INTEGER NOT NULL
          )
        `;

      case 'mysql':
        return `
          CREATE TABLE IF NOT EXISTS \`${table}\` (
            id INT AUTO_INCREMENT PRIMARY KEY,
            version VARCHAR(255) NOT NULL UNIQUE,
            name VARCHAR(255) NOT NULL,
            executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            execution_time INT NOT NULL,
            batch INT NOT NULL
          )
        `;

      case 'sqlite':
        return `
          CREATE TABLE IF NOT EXISTS "${table}" (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            version TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL,
            executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            execution_time INTEGER NOT NULL,
            batch INTEGER NOT NULL
          )
        `;

      default:
        throw new Error(`Unsupported database type: ${this.config.type}`);
    }
  }

  /**
   * Get migration template
   */
  private getMigrationTemplate(name: string, template?: string): string {
    if (template === 'table') {
      return this.getTableMigrationTemplate(name);
    } else if (template === 'alter') {
      return this.getAlterMigrationTemplate(name);
    } else if (template === 'data') {
      return this.getDataMigrationTemplate(name);
    }

    return this.getDefaultMigrationTemplate(name);
  }

  private getDefaultMigrationTemplate(name: string): string {
    return `import type { Migration } from '../types';

export default {
  name: '${name}',

  async up(context) {
    // Write migration here
  },

  async down(context) {
    // Write rollback here
  },
} as Migration;
`;
  }

  private getTableMigrationTemplate(name: string): string {
    const tableName = this.sanitizeName(name.replace(/^create_/, ''));

    return `import type { Migration } from '../types';

export default {
  name: '${name}',

  async up(context) {
    context.schema.createTable('${tableName}', (table) => {
      table.increments('id').primary();
      table.timestamps(true);
    });
  },

  async down(context) {
    context.schema.dropTable('${tableName}');
  },
} as Migration;
`;
  }

  private getAlterMigrationTemplate(name: string): string {
    return `import type { Migration } from '../types';

export default {
  name: '${name}',

  async up(context) {
    context.schema.alterTable('table_name', (table) => {
      // Add columns, indexes, etc.
    });
  },

  async down(context) {
    context.schema.alterTable('table_name', (table) => {
      // Reverse changes
    });
  },
} as Migration;
`;
  }

  private getDataMigrationTemplate(name: string): string {
    return `import type { Migration } from '../types';

export default {
  name: '${name}',
  transaction: true,

  async up(context) {
    await context.data.insert('table_name', [
      // Data here
    ]);
  },

  async down(context) {
    await context.data.delete('table_name', {
      // Conditions here
    });
  },
} as Migration;
`;
  }
}
