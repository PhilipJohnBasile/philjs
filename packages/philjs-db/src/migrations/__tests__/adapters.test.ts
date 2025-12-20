/**
 * Database Adapter Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PostgresMigrationAdapter } from '../adapters/postgres';
import { MySQLMigrationAdapter } from '../adapters/mysql';
import { SQLiteMigrationAdapter } from '../adapters/sqlite';

describe('PostgresMigrationAdapter', () => {
  let adapter: PostgresMigrationAdapter;
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      query: vi.fn().mockResolvedValue({ rows: [] }),
    };
    adapter = new PostgresMigrationAdapter(mockDb);
  });

  describe('schema builder', () => {
    it('should create table', () => {
      const context = adapter.createContext();

      context.schema.createTable('users', (table) => {
        table.increments('id').primary();
        table.string('name').notNullable();
        table.string('email').unique();
        table.timestamps(true);
      });

      const queries = adapter.getQueries();
      expect(queries.length).toBeGreaterThan(0);
      expect(queries[0]).toContain('CREATE TABLE');
      expect(queries[0]).toContain('users');
    });

    it('should drop table', () => {
      const context = adapter.createContext();
      context.schema.dropTable('users');

      const queries = adapter.getQueries();
      expect(queries[0]).toContain('DROP TABLE');
      expect(queries[0]).toContain('users');
    });

    it('should alter table', () => {
      const context = adapter.createContext();

      context.schema.alterTable('users', (table) => {
        table.string('phone');
        table.dropColumn('old_column');
      });

      const queries = adapter.getQueries();
      expect(queries.length).toBeGreaterThan(0);
    });

    it('should rename table', () => {
      const context = adapter.createContext();
      context.schema.renameTable('users', 'accounts');

      const queries = adapter.getQueries();
      expect(queries[0]).toContain('ALTER TABLE');
      expect(queries[0]).toContain('RENAME');
    });

    it('should check table exists', async () => {
      const context = adapter.createContext();
      const exists = await context.schema.hasTable('users');
      expect(typeof exists).toBe('boolean');
    });
  });

  describe('column types', () => {
    it('should create integer column', () => {
      const context = adapter.createContext();

      context.schema.createTable('test', (table) => {
        table.integer('count');
      });

      const queries = adapter.getQueries();
      expect(queries[0]).toContain('INTEGER');
    });

    it('should create string column', () => {
      const context = adapter.createContext();

      context.schema.createTable('test', (table) => {
        table.string('name', 100);
      });

      const queries = adapter.getQueries();
      expect(queries[0]).toContain('VARCHAR(100)');
    });

    it('should create text column', () => {
      const context = adapter.createContext();

      context.schema.createTable('test', (table) => {
        table.text('description');
      });

      const queries = adapter.getQueries();
      expect(queries[0]).toContain('TEXT');
    });

    it('should create boolean column', () => {
      const context = adapter.createContext();

      context.schema.createTable('test', (table) => {
        table.boolean('is_active');
      });

      const queries = adapter.getQueries();
      expect(queries[0]).toContain('BOOLEAN');
    });

    it('should create timestamp column', () => {
      const context = adapter.createContext();

      context.schema.createTable('test', (table) => {
        table.timestamp('created_at');
      });

      const queries = adapter.getQueries();
      expect(queries[0]).toContain('TIMESTAMP');
    });

    it('should create json column', () => {
      const context = adapter.createContext();

      context.schema.createTable('test', (table) => {
        table.json('data');
      });

      const queries = adapter.getQueries();
      expect(queries[0]).toContain('JSON');
    });

    it('should create jsonb column', () => {
      const context = adapter.createContext();

      context.schema.createTable('test', (table) => {
        table.jsonb('metadata');
      });

      const queries = adapter.getQueries();
      expect(queries[0]).toContain('JSONB');
    });

    it('should create uuid column', () => {
      const context = adapter.createContext();

      context.schema.createTable('test', (table) => {
        table.uuid('id');
      });

      const queries = adapter.getQueries();
      expect(queries[0]).toContain('UUID');
    });

    it('should create decimal column', () => {
      const context = adapter.createContext();

      context.schema.createTable('test', (table) => {
        table.decimal('price', 10, 2);
      });

      const queries = adapter.getQueries();
      expect(queries[0]).toContain('DECIMAL(10, 2)');
    });

    it('should create enum column', () => {
      const context = adapter.createContext();

      context.schema.createTable('test', (table) => {
        table.enum('status', ['active', 'inactive', 'pending']);
      });

      const queries = adapter.getQueries();
      expect(queries[0]).toContain('CHECK');
    });
  });

  describe('column modifiers', () => {
    it('should set column as nullable', () => {
      const context = adapter.createContext();

      context.schema.createTable('test', (table) => {
        table.string('name').nullable();
      });

      const queries = adapter.getQueries();
      expect(queries[0]).toContain('NULL');
    });

    it('should set column as not nullable', () => {
      const context = adapter.createContext();

      context.schema.createTable('test', (table) => {
        table.string('name').notNullable();
      });

      const queries = adapter.getQueries();
      expect(queries[0]).toContain('NOT NULL');
    });

    it('should set column as unique', () => {
      const context = adapter.createContext();

      context.schema.createTable('test', (table) => {
        table.string('email').unique();
      });

      const queries = adapter.getQueries();
      expect(queries[0]).toContain('UNIQUE');
    });

    it('should set default value', () => {
      const context = adapter.createContext();

      context.schema.createTable('test', (table) => {
        table.boolean('is_active').defaultTo(true);
      });

      const queries = adapter.getQueries();
      expect(queries[0]).toContain('DEFAULT');
    });

    it('should set unsigned', () => {
      const context = adapter.createContext();

      context.schema.createTable('test', (table) => {
        table.integer('count').unsigned();
      });

      const queries = adapter.getQueries();
      expect(queries[0]).toContain('CHECK');
    });
  });

  describe('constraints', () => {
    it('should create primary key', () => {
      const context = adapter.createContext();

      context.schema.createTable('test', (table) => {
        table.integer('id');
        table.primary('id');
      });

      const queries = adapter.getQueries();
      expect(queries[0]).toContain('PRIMARY KEY');
    });

    it('should create composite primary key', () => {
      const context = adapter.createContext();

      context.schema.createTable('test', (table) => {
        table.integer('user_id');
        table.integer('post_id');
        table.primary(['user_id', 'post_id']);
      });

      const queries = adapter.getQueries();
      expect(queries[0]).toContain('PRIMARY KEY');
    });

    it('should create unique constraint', () => {
      const context = adapter.createContext();

      context.schema.createTable('test', (table) => {
        table.string('email');
        table.unique('email');
      });

      const queries = adapter.getQueries();
      expect(queries[0]).toContain('UNIQUE');
    });

    it('should create index', () => {
      const context = adapter.createContext();

      context.schema.createTable('test', (table) => {
        table.string('email');
        table.index('email');
      });

      const queries = adapter.getQueries();
      expect(queries.some((q) => q.includes('CREATE INDEX'))).toBe(true);
    });

    it('should create foreign key', () => {
      const context = adapter.createContext();

      context.schema.createTable('posts', (table) => {
        table.integer('user_id');
        table.foreign('user_id').references('id').inTable('users');
      });

      const queries = adapter.getQueries();
      expect(queries[0]).toContain('FOREIGN KEY');
    });

    it('should create foreign key with cascade', () => {
      const context = adapter.createContext();

      context.schema.createTable('posts', (table) => {
        table.integer('user_id');
        table
          .foreign('user_id')
          .references('id')
          .inTable('users')
          .onDelete('CASCADE');
      });

      const queries = adapter.getQueries();
      expect(queries[0]).toContain('ON DELETE CASCADE');
    });
  });

  describe('data operations', () => {
    it('should insert data', async () => {
      const context = adapter.createContext();

      await context.data.insert('users', {
        name: 'John',
        email: 'john@example.com',
      });

      expect(mockDb.query).toHaveBeenCalled();
    });

    it('should insert multiple rows', async () => {
      const context = adapter.createContext();

      await context.data.insert('users', [
        { name: 'John', email: 'john@example.com' },
        { name: 'Jane', email: 'jane@example.com' },
      ]);

      expect(mockDb.query).toHaveBeenCalled();
    });

    it('should update data', async () => {
      const context = adapter.createContext();

      await context.data.update('users', { id: 1 }, { name: 'Updated' });

      expect(mockDb.query).toHaveBeenCalled();
    });

    it('should delete data', async () => {
      const context = adapter.createContext();

      await context.data.delete('users', { id: 1 });

      expect(mockDb.query).toHaveBeenCalled();
    });

    it('should batch insert', async () => {
      const context = adapter.createContext();

      const data = Array.from({ length: 150 }, (_, i) => ({
        name: `User ${i}`,
        email: `user${i}@example.com`,
      }));

      await context.data.batchInsert('users', data, 50);

      expect(mockDb.query).toHaveBeenCalledTimes(3); // 150 / 50 = 3 batches
    });
  });
});

describe('MySQLMigrationAdapter', () => {
  let adapter: MySQLMigrationAdapter;
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      query: vi.fn().mockResolvedValue([]),
    };
    adapter = new MySQLMigrationAdapter(mockDb);
  });

  it('should generate MySQL-compatible SQL', () => {
    const context = adapter.createContext();

    context.schema.createTable('users', (table) => {
      table.increments('id').primary();
      table.string('name');
    });

    const queries = adapter.getQueries();
    expect(queries[0]).toContain('AUTO_INCREMENT');
    expect(queries[0]).toContain('ENGINE=InnoDB');
  });

  it('should use backticks for identifiers', () => {
    const context = adapter.createContext();

    context.schema.createTable('users', (table) => {
      table.string('name');
    });

    const queries = adapter.getQueries();
    expect(queries[0]).toContain('`users`');
  });
});

describe('SQLiteMigrationAdapter', () => {
  let adapter: SQLiteMigrationAdapter;
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      all: vi.fn().mockResolvedValue([]),
    };
    adapter = new SQLiteMigrationAdapter(mockDb);
  });

  it('should generate SQLite-compatible SQL', () => {
    const context = adapter.createContext();

    context.schema.createTable('users', (table) => {
      table.increments('id');
      table.string('name');
    });

    const queries = adapter.getQueries();
    expect(queries[0]).toContain('AUTOINCREMENT');
  });

  it('should handle SQLite limitations', () => {
    const context = adapter.createContext();

    context.schema.alterTable('users', (table) => {
      table.dropColumn('old_column');
    });

    const queries = adapter.getQueries();
    // SQLite doesn't support DROP COLUMN in older versions
    expect(queries.some((q) => q.includes('Warning'))).toBe(true);
  });
});
