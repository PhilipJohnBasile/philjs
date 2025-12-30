/**
 * Comprehensive tests for MigrationManager
 * Testing migration execution, rollback, status, conflict detection
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { MigrationManager } from './manager';
import type { MigrationConfig, MigrationFile, MigrationRecord } from './types';

// Mock fs/promises
vi.mock('fs/promises', () => ({
  mkdir: vi.fn().mockResolvedValue(undefined),
  readdir: vi.fn().mockResolvedValue([]),
  writeFile: vi.fn().mockResolvedValue(undefined),
  readFile: vi.fn().mockResolvedValue(''),
}));

describe('MigrationManager', () => {
  let manager: MigrationManager;
  const defaultConfig: MigrationConfig = {
    type: 'postgres',
    connection: { host: 'localhost', database: 'test' },
    migrationsDir: './test-migrations',
    tableName: 'test_migrations',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    manager = new MigrationManager(defaultConfig);
  });

  describe('constructor', () => {
    it('should create manager with default config values', () => {
      const minimalConfig: MigrationConfig = {
        type: 'sqlite',
        connection: ':memory:',
      };

      const mgr = new MigrationManager(minimalConfig);
      expect(mgr).toBeInstanceOf(MigrationManager);
    });

    it('should merge custom config with defaults', () => {
      const customConfig: MigrationConfig = {
        type: 'mysql',
        connection: { host: 'localhost' },
        migrationsDir: './custom-migrations',
        tableName: 'custom_migrations',
        transactional: false,
        backup: true,
      };

      const mgr = new MigrationManager(customConfig);
      expect(mgr).toBeInstanceOf(MigrationManager);
    });
  });

  describe('initialize', () => {
    it('should create migrations directory', async () => {
      await manager.initialize();

      expect(fs.mkdir).toHaveBeenCalledWith('./test-migrations', { recursive: true });
    });

    it('should handle directory creation errors', async () => {
      const mkdirMock = vi.mocked(fs.mkdir);
      mkdirMock.mockRejectedValueOnce(new Error('Permission denied'));

      await expect(manager.initialize()).rejects.toThrow('Permission denied');
    });
  });

  describe('getStatus', () => {
    it('should return pending migrations', async () => {
      const readdirMock = vi.mocked(fs.readdir);
      readdirMock.mockResolvedValueOnce([
        '20240101000000_create_users.ts',
        '20240102000000_create_posts.ts',
      ] as any);

      // Mock getExecutedMigrations to return empty (no executed migrations)
      const getExecutedSpy = vi
        .spyOn(manager as any, 'getExecutedMigrations')
        .mockResolvedValue([]);

      const status = await manager.getStatus();

      expect(status.pending).toHaveLength(2);
      expect(status.executed).toHaveLength(0);
      expect(status.conflicts).toHaveLength(0);

      getExecutedSpy.mockRestore();
    });

    it('should exclude executed migrations from pending', async () => {
      const readdirMock = vi.mocked(fs.readdir);
      readdirMock.mockResolvedValueOnce([
        '20240101000000_create_users.ts',
        '20240102000000_create_posts.ts',
      ] as any);

      const executedRecords: MigrationRecord[] = [
        {
          id: 1,
          version: '20240101000000',
          name: 'create_users',
          executedAt: new Date(),
          executionTime: 100,
          batch: 1,
        },
      ];

      const getExecutedSpy = vi
        .spyOn(manager as any, 'getExecutedMigrations')
        .mockResolvedValue(executedRecords);

      const status = await manager.getStatus();

      expect(status.pending).toHaveLength(1);
      expect(status.pending[0].version).toBe('20240102000000');
      expect(status.executed).toHaveLength(1);

      getExecutedSpy.mockRestore();
    });

    it('should detect missing migration files', async () => {
      const readdirMock = vi.mocked(fs.readdir);
      readdirMock.mockResolvedValueOnce([] as any);

      const executedRecords: MigrationRecord[] = [
        {
          id: 1,
          version: '20240101000000',
          name: 'deleted_migration',
          executedAt: new Date(),
          executionTime: 100,
          batch: 1,
        },
      ];

      const getExecutedSpy = vi
        .spyOn(manager as any, 'getExecutedMigrations')
        .mockResolvedValue(executedRecords);

      const status = await manager.getStatus();

      expect(status.conflicts).toHaveLength(1);
      expect(status.conflicts[0].type).toBe('missing');

      getExecutedSpy.mockRestore();
    });
  });

  describe('migrate', () => {
    it('should run pending migrations', async () => {
      const readdirMock = vi.mocked(fs.readdir);
      readdirMock.mockResolvedValueOnce(['20240101000000_test.ts'] as any);

      const getExecutedSpy = vi
        .spyOn(manager as any, 'getExecutedMigrations')
        .mockResolvedValue([]);

      const runMigrationSpy = vi
        .spyOn(manager as any, 'runMigration')
        .mockResolvedValue(undefined);

      const getNextBatchSpy = vi
        .spyOn(manager as any, 'getNextBatch')
        .mockResolvedValue(1);

      const detectConflictsSpy = vi
        .spyOn(manager as any, 'detectConflicts')
        .mockResolvedValue([]);

      const result = await manager.migrate();

      expect(result.success).toBe(true);
      expect(result.migrations).toHaveLength(1);
      expect(runMigrationSpy).toHaveBeenCalled();

      getExecutedSpy.mockRestore();
      runMigrationSpy.mockRestore();
      getNextBatchSpy.mockRestore();
      detectConflictsSpy.mockRestore();
    });

    it('should stop on migration error', async () => {
      const readdirMock = vi.mocked(fs.readdir);
      readdirMock.mockResolvedValueOnce([
        '20240101000000_first.ts',
        '20240102000000_second.ts',
      ] as any);

      const getExecutedSpy = vi
        .spyOn(manager as any, 'getExecutedMigrations')
        .mockResolvedValue([]);

      const runMigrationSpy = vi
        .spyOn(manager as any, 'runMigration')
        .mockRejectedValueOnce(new Error('Migration failed'));

      const getNextBatchSpy = vi
        .spyOn(manager as any, 'getNextBatch')
        .mockResolvedValue(1);

      const detectConflictsSpy = vi
        .spyOn(manager as any, 'detectConflicts')
        .mockResolvedValue([]);

      const result = await manager.migrate();

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error.message).toBe('Migration failed');

      getExecutedSpy.mockRestore();
      runMigrationSpy.mockRestore();
      getNextBatchSpy.mockRestore();
      detectConflictsSpy.mockRestore();
    });

    it('should throw on conflicts', async () => {
      const readdirMock = vi.mocked(fs.readdir);
      readdirMock.mockResolvedValueOnce([] as any);

      const getExecutedSpy = vi
        .spyOn(manager as any, 'getExecutedMigrations')
        .mockResolvedValue([
          { version: '20240101000000', name: 'test', batch: 1 },
        ]);

      const detectConflictsSpy = vi
        .spyOn(manager as any, 'detectConflicts')
        .mockResolvedValue([
          { type: 'missing', migration: '20240101000000', message: 'Missing file' },
        ]);

      await expect(manager.migrate()).rejects.toThrow('Migration conflicts detected');

      getExecutedSpy.mockRestore();
      detectConflictsSpy.mockRestore();
    });

    it('should respect step option', async () => {
      const readdirMock = vi.mocked(fs.readdir);
      readdirMock.mockResolvedValueOnce([
        '20240101000000_first.ts',
        '20240102000000_second.ts',
        '20240103000000_third.ts',
      ] as any);

      const getExecutedSpy = vi
        .spyOn(manager as any, 'getExecutedMigrations')
        .mockResolvedValue([]);

      const runMigrationSpy = vi
        .spyOn(manager as any, 'runMigration')
        .mockResolvedValue(undefined);

      const getNextBatchSpy = vi
        .spyOn(manager as any, 'getNextBatch')
        .mockResolvedValue(1);

      const detectConflictsSpy = vi
        .spyOn(manager as any, 'detectConflicts')
        .mockResolvedValue([]);

      const result = await manager.migrate({ step: 2 });

      expect(result.migrations).toHaveLength(2);
      expect(runMigrationSpy).toHaveBeenCalledTimes(2);

      getExecutedSpy.mockRestore();
      runMigrationSpy.mockRestore();
      getNextBatchSpy.mockRestore();
      detectConflictsSpy.mockRestore();
    });

    it('should respect to option', async () => {
      const readdirMock = vi.mocked(fs.readdir);
      readdirMock.mockResolvedValueOnce([
        '20240101000000_first.ts',
        '20240102000000_second.ts',
        '20240103000000_third.ts',
      ] as any);

      const getExecutedSpy = vi
        .spyOn(manager as any, 'getExecutedMigrations')
        .mockResolvedValue([]);

      const runMigrationSpy = vi
        .spyOn(manager as any, 'runMigration')
        .mockResolvedValue(undefined);

      const getNextBatchSpy = vi
        .spyOn(manager as any, 'getNextBatch')
        .mockResolvedValue(1);

      const detectConflictsSpy = vi
        .spyOn(manager as any, 'detectConflicts')
        .mockResolvedValue([]);

      const result = await manager.migrate({ to: '20240102000000' });

      expect(result.migrations).toHaveLength(2);

      getExecutedSpy.mockRestore();
      runMigrationSpy.mockRestore();
      getNextBatchSpy.mockRestore();
      detectConflictsSpy.mockRestore();
    });
  });

  describe('rollback', () => {
    it('should rollback last batch by default', async () => {
      const executedRecords: MigrationRecord[] = [
        { id: 1, version: '20240101000000', name: 'first', executedAt: new Date(), executionTime: 100, batch: 1 },
        { id: 2, version: '20240102000000', name: 'second', executedAt: new Date(), executionTime: 100, batch: 2 },
        { id: 3, version: '20240103000000', name: 'third', executedAt: new Date(), executionTime: 100, batch: 2 },
      ];

      const getExecutedSpy = vi
        .spyOn(manager as any, 'getExecutedMigrations')
        .mockResolvedValue(executedRecords);

      const findMigrationFileSpy = vi
        .spyOn(manager as any, 'findMigrationFile')
        .mockImplementation((version: string) => ({
          version,
          name: 'test',
          filename: `${version}_test.ts`,
          filepath: `./migrations/${version}_test.ts`,
        }));

      const runMigrationSpy = vi
        .spyOn(manager as any, 'runMigration')
        .mockResolvedValue(undefined);

      const result = await manager.rollback();

      expect(result.success).toBe(true);
      // Should only rollback batch 2 (2 migrations)
      expect(result.migrations).toHaveLength(2);

      getExecutedSpy.mockRestore();
      findMigrationFileSpy.mockRestore();
      runMigrationSpy.mockRestore();
    });

    it('should rollback specific batch', async () => {
      const executedRecords: MigrationRecord[] = [
        { id: 1, version: '20240101000000', name: 'first', executedAt: new Date(), executionTime: 100, batch: 1 },
        { id: 2, version: '20240102000000', name: 'second', executedAt: new Date(), executionTime: 100, batch: 2 },
      ];

      const getExecutedSpy = vi
        .spyOn(manager as any, 'getExecutedMigrations')
        .mockResolvedValue(executedRecords);

      const findMigrationFileSpy = vi
        .spyOn(manager as any, 'findMigrationFile')
        .mockImplementation((version: string) => ({
          version,
          name: 'test',
          filename: `${version}_test.ts`,
          filepath: `./migrations/${version}_test.ts`,
        }));

      const runMigrationSpy = vi
        .spyOn(manager as any, 'runMigration')
        .mockResolvedValue(undefined);

      const result = await manager.rollback({ batch: 1 });

      expect(result.success).toBe(true);
      expect(result.migrations).toHaveLength(1);
      expect(result.migrations[0]).toBe('20240101000000');

      getExecutedSpy.mockRestore();
      findMigrationFileSpy.mockRestore();
      runMigrationSpy.mockRestore();
    });

    it('should handle missing migration files during rollback', async () => {
      const executedRecords: MigrationRecord[] = [
        { id: 1, version: '20240101000000', name: 'first', executedAt: new Date(), executionTime: 100, batch: 1 },
      ];

      const getExecutedSpy = vi
        .spyOn(manager as any, 'getExecutedMigrations')
        .mockResolvedValue(executedRecords);

      const findMigrationFileSpy = vi
        .spyOn(manager as any, 'findMigrationFile')
        .mockResolvedValue(null);

      const result = await manager.rollback();

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error.message).toContain('Migration file not found');

      getExecutedSpy.mockRestore();
      findMigrationFileSpy.mockRestore();
    });
  });

  describe('create', () => {
    it('should create migration file', async () => {
      const filepath = await manager.create('create_users');

      expect(fs.writeFile).toHaveBeenCalled();
      expect(filepath).toContain('create_users');
      expect(filepath).toEndWith('.ts');
    });

    it('should sanitize migration name', async () => {
      const filepath = await manager.create('Create Users Table!');

      expect(filepath).toContain('create_users_table');
      expect(filepath).not.toContain('!');
      expect(filepath).not.toContain(' ');
    });

    it('should use table template', async () => {
      await manager.create('create_posts', { template: 'table' });

      const writeCall = vi.mocked(fs.writeFile).mock.calls[0];
      const content = writeCall[1] as string;

      expect(content).toContain('createTable');
      expect(content).toContain('dropTable');
    });

    it('should use alter template', async () => {
      await manager.create('add_email_to_users', { template: 'alter' });

      const writeCall = vi.mocked(fs.writeFile).mock.calls[0];
      const content = writeCall[1] as string;

      expect(content).toContain('alterTable');
    });

    it('should use data template', async () => {
      await manager.create('seed_categories', { template: 'data' });

      const writeCall = vi.mocked(fs.writeFile).mock.calls[0];
      const content = writeCall[1] as string;

      expect(content).toContain('data.insert');
      expect(content).toContain('data.delete');
    });
  });

  describe('reset', () => {
    it('should rollback all and migrate', async () => {
      const rollbackSpy = vi.spyOn(manager, 'rollback').mockResolvedValue({
        success: true,
        migrations: ['20240101000000'],
        errors: [],
        duration: 100,
      });

      const migrateSpy = vi.spyOn(manager, 'migrate').mockResolvedValue({
        success: true,
        migrations: ['20240101000000'],
        errors: [],
        duration: 100,
      });

      const result = await manager.reset();

      expect(rollbackSpy).toHaveBeenCalledWith({ step: Infinity });
      expect(migrateSpy).toHaveBeenCalled();
      expect(result.success).toBe(true);

      rollbackSpy.mockRestore();
      migrateSpy.mockRestore();
    });

    it('should return rollback result on failure', async () => {
      const rollbackSpy = vi.spyOn(manager, 'rollback').mockResolvedValue({
        success: false,
        migrations: [],
        errors: [{ migration: 'test', error: new Error('Rollback failed'), timestamp: new Date() }],
        duration: 100,
      });

      const migrateSpy = vi.spyOn(manager, 'migrate');

      const result = await manager.reset();

      expect(result.success).toBe(false);
      expect(migrateSpy).not.toHaveBeenCalled();

      rollbackSpy.mockRestore();
      migrateSpy.mockRestore();
    });
  });

  describe('fresh', () => {
    it('should drop all tables and migrate', async () => {
      const dropAllTablesSpy = vi
        .spyOn(manager as any, 'dropAllTables')
        .mockResolvedValue(undefined);

      const createMigrationsTableSpy = vi
        .spyOn(manager as any, 'createMigrationsTable')
        .mockResolvedValue(undefined);

      const migrateSpy = vi.spyOn(manager, 'migrate').mockResolvedValue({
        success: true,
        migrations: [],
        errors: [],
        duration: 100,
      });

      await manager.fresh();

      expect(dropAllTablesSpy).toHaveBeenCalled();
      expect(createMigrationsTableSpy).toHaveBeenCalled();
      expect(migrateSpy).toHaveBeenCalled();

      dropAllTablesSpy.mockRestore();
      createMigrationsTableSpy.mockRestore();
      migrateSpy.mockRestore();
    });
  });

  describe('generateCreateTableSQL', () => {
    it('should generate PostgreSQL CREATE TABLE SQL', () => {
      const pgManager = new MigrationManager({
        type: 'postgres',
        connection: {},
        tableName: 'my_migrations',
      });

      const sql = (pgManager as any).generateCreateTableSQL();

      expect(sql).toContain('CREATE TABLE IF NOT EXISTS "my_migrations"');
      expect(sql).toContain('SERIAL PRIMARY KEY');
      expect(sql).toContain('VARCHAR(255)');
    });

    it('should generate MySQL CREATE TABLE SQL', () => {
      const mysqlManager = new MigrationManager({
        type: 'mysql',
        connection: {},
        tableName: 'my_migrations',
      });

      const sql = (mysqlManager as any).generateCreateTableSQL();

      expect(sql).toContain('CREATE TABLE IF NOT EXISTS `my_migrations`');
      expect(sql).toContain('AUTO_INCREMENT');
    });

    it('should generate SQLite CREATE TABLE SQL', () => {
      const sqliteManager = new MigrationManager({
        type: 'sqlite',
        connection: ':memory:',
        tableName: 'my_migrations',
      });

      const sql = (sqliteManager as any).generateCreateTableSQL();

      expect(sql).toContain('CREATE TABLE IF NOT EXISTS "my_migrations"');
      expect(sql).toContain('AUTOINCREMENT');
      expect(sql).toContain('TEXT');
    });

    it('should throw for unsupported database type', () => {
      const unsupportedManager = new MigrationManager({
        type: 'oracle' as any,
        connection: {},
      });

      expect(() => (unsupportedManager as any).generateCreateTableSQL()).toThrow(
        'Unsupported database type'
      );
    });
  });

  describe('getMigrationFiles', () => {
    it('should parse migration files correctly', async () => {
      const readdirMock = vi.mocked(fs.readdir);
      readdirMock.mockResolvedValueOnce([
        '20240101120000_create_users.ts',
        '20240102130000_add_posts.ts',
        'invalid_file.txt',
        'readme.md',
      ] as any);

      const files = await (manager as any).getMigrationFiles();

      expect(files).toHaveLength(2);
      expect(files[0].version).toBe('20240101120000');
      expect(files[0].name).toBe('create_users');
      expect(files[1].version).toBe('20240102130000');
      expect(files[1].name).toBe('add_posts');
    });

    it('should sort files by version', async () => {
      const readdirMock = vi.mocked(fs.readdir);
      readdirMock.mockResolvedValueOnce([
        '20240103000000_third.ts',
        '20240101000000_first.ts',
        '20240102000000_second.ts',
      ] as any);

      const files = await (manager as any).getMigrationFiles();

      expect(files[0].version).toBe('20240101000000');
      expect(files[1].version).toBe('20240102000000');
      expect(files[2].version).toBe('20240103000000');
    });

    it('should support .js files', async () => {
      const readdirMock = vi.mocked(fs.readdir);
      readdirMock.mockResolvedValueOnce([
        '20240101000000_create_users.js',
      ] as any);

      const files = await (manager as any).getMigrationFiles();

      expect(files).toHaveLength(1);
      expect(files[0].version).toBe('20240101000000');
    });
  });

  describe('detectConflicts', () => {
    it('should detect duplicate versions', async () => {
      const files: MigrationFile[] = [
        { version: '20240101000000', name: 'first', filename: '20240101000000_first.ts', filepath: '' },
        { version: '20240101000000', name: 'duplicate', filename: '20240101000000_duplicate.ts', filepath: '' },
      ];

      const conflicts = await (manager as any).detectConflicts(files, []);

      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].type).toBe('duplicate');
    });
  });

  describe('generateTimestamp', () => {
    it('should generate timestamp in correct format', () => {
      const timestamp = (manager as any).generateTimestamp();

      expect(timestamp).toMatch(/^\d{14}$/);
    });
  });

  describe('sanitizeName', () => {
    it('should lowercase name', () => {
      const result = (manager as any).sanitizeName('CreateUsers');
      expect(result).toBe('createusers');
    });

    it('should replace special characters with underscores', () => {
      const result = (manager as any).sanitizeName('create users table!');
      expect(result).toBe('create_users_table');
    });

    it('should trim leading/trailing underscores', () => {
      const result = (manager as any).sanitizeName('__create_users__');
      expect(result).toBe('create_users');
    });
  });
});
