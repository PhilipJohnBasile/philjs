/**
 * Database Integration PhilJS Plugin Template
 * Template for creating plugins that integrate with databases
 */

import type { Plugin, PluginContext } from "@philjs/core/plugin-system";

/**
 * Database type
 */
export type DatabaseType = "sqlite" | "postgres" | "mysql" | "mongodb";

/**
 * Database configuration
 */
export interface {{PLUGIN_NAME}}Config {
  /** Enable the plugin */
  enabled?: boolean;
  /** Database type */
  type: DatabaseType;
  /** Connection string or URL */
  connectionString?: string;
  /** Database host */
  host?: string;
  /** Database port */
  port?: number;
  /** Database name */
  database: string;
  /** Database user */
  user?: string;
  /** Database password */
  password?: string;
  /** Enable connection pooling */
  pooling?: boolean;
  /** Pool size */
  poolSize?: number;
  /** Enable query logging */
  logging?: boolean;
  /** Enable migrations */
  migrations?: boolean;
  /** Migrations directory */
  migrationsDir?: string;
}

/**
 * Query options
 */
interface QueryOptions {
  values?: any[];
  timeout?: number;
}

/**
 * Query result
 */
interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
  fields?: string[];
}

/**
 * Migration info
 */
interface Migration {
  id: string;
  name: string;
  timestamp: number;
  applied: boolean;
}

/**
 * Database connection interface
 */
interface DatabaseConnection {
  query<T = any>(sql: string, options?: QueryOptions): Promise<QueryResult<T>>;
  execute(sql: string, options?: QueryOptions): Promise<number>;
  transaction<T>(fn: (conn: DatabaseConnection) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

/**
 * Abstract database client
 */
abstract class BaseDatabaseClient implements DatabaseConnection {
  protected config: {{PLUGIN_NAME}}Config;
  protected connected = false;

  constructor(config: {{PLUGIN_NAME}}Config) {
    this.config = config;
  }

  abstract connect(): Promise<void>;
  abstract query<T = any>(sql: string, options?: QueryOptions): Promise<QueryResult<T>>;
  abstract execute(sql: string, options?: QueryOptions): Promise<number>;
  abstract transaction<T>(fn: (conn: DatabaseConnection) => Promise<T>): Promise<T>;
  abstract close(): Promise<void>;

  protected log(message: string): void {
    if (this.config.logging) {
      console.log(`[{{PLUGIN_NAME}}] ${message}`);
    }
  }
}

/**
 * Mock database client for development/testing
 */
class MockDatabaseClient extends BaseDatabaseClient {
  private data: Map<string, any[]> = new Map();

  async connect(): Promise<void> {
    this.connected = true;
    this.log("Connected to mock database");
  }

  async query<T = any>(sql: string, options?: QueryOptions): Promise<QueryResult<T>> {
    this.log(`Query: ${sql}`);

    // Simple table extraction from SELECT queries
    const tableMatch = sql.match(/FROM\s+(\w+)/i);
    const tableName = tableMatch ? tableMatch[1] : "default";

    const rows = (this.data.get(tableName) || []) as T[];

    return {
      rows,
      rowCount: rows.length,
      fields: rows.length > 0 ? Object.keys(rows[0] as object) : [],
    };
  }

  async execute(sql: string, options?: QueryOptions): Promise<number> {
    this.log(`Execute: ${sql}`);

    // Simple table extraction from INSERT/UPDATE/DELETE queries
    const tableMatch = sql.match(/(?:INTO|UPDATE|FROM)\s+(\w+)/i);
    const tableName = tableMatch ? tableMatch[1] : "default";

    // For INSERT, add mock data
    if (sql.toUpperCase().startsWith("INSERT")) {
      const existing = this.data.get(tableName) || [];
      existing.push({ id: existing.length + 1, ...this.parseInsertValues(sql) });
      this.data.set(tableName, existing);
      return 1;
    }

    // For DELETE, clear mock data
    if (sql.toUpperCase().startsWith("DELETE")) {
      this.data.set(tableName, []);
      return 1;
    }

    return 0;
  }

  async transaction<T>(fn: (conn: DatabaseConnection) => Promise<T>): Promise<T> {
    this.log("Starting transaction");
    try {
      const result = await fn(this);
      this.log("Transaction committed");
      return result;
    } catch (error) {
      this.log("Transaction rolled back");
      throw error;
    }
  }

  async close(): Promise<void> {
    this.connected = false;
    this.log("Disconnected from mock database");
  }

  private parseInsertValues(sql: string): Record<string, any> {
    // Very simplified parsing for mock purposes
    return { created_at: new Date().toISOString() };
  }
}

// Global database client
let db: DatabaseConnection | null = null;

/**
 * Get the database client
 */
export function getDatabase(): DatabaseConnection {
  if (!db) {
    throw new Error("Database not initialized. Call the plugin setup first.");
  }
  return db;
}

/**
 * Database query helper
 */
export async function query<T = any>(
  sql: string,
  values?: any[]
): Promise<T[]> {
  const result = await getDatabase().query<T>(sql, { values });
  return result.rows;
}

/**
 * Database execute helper
 */
export async function execute(sql: string, values?: any[]): Promise<number> {
  return getDatabase().execute(sql, { values });
}

/**
 * Create {{PLUGIN_NAME}} plugin
 */
export function create{{PLUGIN_NAME}}Plugin(
  pluginConfig: {{PLUGIN_NAME}}Config
): Plugin {
  return {
    meta: {
      name: "{{PACKAGE_NAME}}",
      version: "0.1.0",
      description: "{{DESCRIPTION}}",
      author: "{{AUTHOR}}",
      license: "{{LICENSE}}",
      philjs: "^0.1.0",
    },

    configSchema: {
      type: "object",
      required: ["type", "database"],
      properties: {
        type: {
          type: "string",
          enum: ["sqlite", "postgres", "mysql", "mongodb"],
          description: "Database type",
        },
        database: {
          type: "string",
          description: "Database name",
        },
        host: {
          type: "string",
          description: "Database host",
          default: "localhost",
        },
        port: {
          type: "number",
          description: "Database port",
        },
        user: {
          type: "string",
          description: "Database user",
        },
        password: {
          type: "string",
          description: "Database password",
        },
        pooling: {
          type: "boolean",
          description: "Enable connection pooling",
          default: true,
        },
        logging: {
          type: "boolean",
          description: "Enable query logging",
          default: false,
        },
      },
    },

    async setup(config: {{PLUGIN_NAME}}Config, ctx: PluginContext) {
      ctx.logger.info("Setting up {{PLUGIN_NAME}}...");

      if (!config.enabled) {
        ctx.logger.warn("Plugin is disabled");
        return;
      }

      // Initialize database client
      // In production, use actual database drivers
      db = new MockDatabaseClient(config);
      await (db as MockDatabaseClient).connect();

      // Generate database helper file
      const dbCode = `
/**
 * Database utilities
 * Auto-generated by {{PACKAGE_NAME}}
 */

import { getDatabase, query, execute } from '{{PACKAGE_NAME}}';

export { getDatabase, query, execute };

// Usage examples:
// const users = await query<User>('SELECT * FROM users');
// await execute('INSERT INTO users (name) VALUES (?)', ['John']);
`;

      try {
        await ctx.fs.mkdir("src/lib", { recursive: true });
        await ctx.fs.writeFile("src/lib/db.ts", dbCode);
        ctx.logger.success("Created database helper file");
      } catch (error) {
        ctx.logger.warn("Could not create database helper file");
      }

      // Generate migrations directory if enabled
      if (config.migrations) {
        const migrationsDir = config.migrationsDir || "migrations";
        try {
          await ctx.fs.mkdir(migrationsDir, { recursive: true });

          // Create example migration
          const exampleMigration = `
/**
 * Example migration
 * Generated at ${new Date().toISOString()}
 */

export async function up(db: any): Promise<void> {
  // Add your migration logic here
  // Example:
  // await db.execute(\`
  //   CREATE TABLE users (
  //     id SERIAL PRIMARY KEY,
  //     name VARCHAR(255) NOT NULL,
  //     email VARCHAR(255) UNIQUE NOT NULL,
  //     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  //   )
  // \`);
}

export async function down(db: any): Promise<void> {
  // Add your rollback logic here
  // Example:
  // await db.execute('DROP TABLE users');
}
`;

          await ctx.fs.writeFile(
            `${migrationsDir}/001_example.ts`,
            exampleMigration
          );
          ctx.logger.success("Created migrations directory with example");
        } catch (error) {
          ctx.logger.warn("Could not create migrations directory");
        }
      }

      ctx.logger.success("{{PLUGIN_NAME}} setup complete!");
      ctx.logger.info(`Database type: ${config.type}`);
      ctx.logger.info(`Database: ${config.database}`);
    },

    hooks: {
      async init(ctx) {
        ctx.logger.info("{{PLUGIN_NAME}} initialized");
      },

      async buildStart(ctx, buildConfig) {
        ctx.logger.debug("Build starting...");
      },

      async buildEnd(ctx, result) {
        if (result.success) {
          ctx.logger.success("Build completed successfully");
        }
      },

      async cleanup(ctx) {
        if (db) {
          await db.close();
          db = null;
        }
        ctx.logger.info("Database connection closed");
      },
    },
  };
}

export default create{{PLUGIN_NAME}}Plugin;
