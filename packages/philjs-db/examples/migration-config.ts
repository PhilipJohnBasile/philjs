/**
 * PhilJS Database Migration Configuration Examples
 */

import type { MigrationConfig } from '../src/migrations/types';

// PostgreSQL Configuration
export const postgresConfig: MigrationConfig = {
  type: 'postgres',
  connection: process.env.DATABASE_URL || 'postgresql://localhost:5432/myapp',
  migrationsDir: './migrations',
  tableName: 'migrations',
  transactional: true,
  backup: true,
  seedsDir: './seeds',
  schemaFile: './schema.sql',
};

// MySQL Configuration
export const mysqlConfig: MigrationConfig = {
  type: 'mysql',
  connection: process.env.DATABASE_URL || 'mysql://root@localhost:3306/myapp',
  migrationsDir: './migrations',
  tableName: 'migrations',
  transactional: true,
  backup: false,
};

// SQLite Configuration
export const sqliteConfig: MigrationConfig = {
  type: 'sqlite',
  connection: './database.db',
  migrationsDir: './migrations',
  tableName: 'migrations',
  transactional: true,
  backup: true,
};

// MongoDB Configuration
export const mongoConfig: MigrationConfig = {
  type: 'mongodb',
  connection: process.env.MONGODB_URI || 'mongodb://localhost:27017/myapp',
  migrationsDir: './migrations',
  tableName: 'migrations',
  transactional: false, // MongoDB transactions require replica set
};

// Development Configuration
export const devConfig: MigrationConfig = {
  type: 'postgres',
  connection: 'postgresql://localhost:5432/myapp_dev',
  migrationsDir: './migrations',
  tableName: 'migrations',
  transactional: true,
  backup: false, // Disable backup in development
};

// Production Configuration
export const prodConfig: MigrationConfig = {
  type: 'postgres',
  connection: process.env.DATABASE_URL!,
  migrationsDir: './migrations',
  tableName: 'migrations',
  transactional: true,
  backup: true, // Always backup in production
};

// Default export based on environment
const environment = process.env.NODE_ENV || 'development';

const configs: Record<string, MigrationConfig> = {
  development: devConfig,
  production: prodConfig,
  test: sqliteConfig,
};

export default configs[environment];
