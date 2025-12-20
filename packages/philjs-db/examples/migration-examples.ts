/**
 * PhilJS Migration Examples
 */

import type { Migration } from '../src/migrations/types';

/**
 * Example 1: Create Users Table
 */
export const createUsersTable: Migration = {
  version: '20240101000000',
  name: 'create_users_table',

  async up(context) {
    context.schema.createTable('users', (table) => {
      table.increments('id').primary();
      table.string('email', 255).unique().notNullable();
      table.string('name', 255).notNullable();
      table.string('password_hash', 255).notNullable();
      table.boolean('is_active').defaultTo(true);
      table.timestamp('email_verified_at').nullable();
      table.timestamps(true);
    });

    // Create index on email
    context.schema.raw('CREATE INDEX idx_users_email ON users(email)');
  },

  async down(context) {
    context.schema.dropTable('users');
  },
};

/**
 * Example 2: Create Posts Table with Foreign Key
 */
export const createPostsTable: Migration = {
  version: '20240101000001',
  name: 'create_posts_table',

  async up(context) {
    context.schema.createTable('posts', (table) => {
      table.increments('id').primary();
      table.integer('user_id').notNullable();
      table.string('title', 500).notNullable();
      table.text('content').notNullable();
      table.string('slug', 500).unique();
      table.enum('status', ['draft', 'published', 'archived']).defaultTo('draft');
      table.integer('views').defaultTo(0);
      table.timestamp('published_at').nullable();
      table.timestamps(true);

      // Foreign key
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');

      // Indexes
      table.index('user_id');
      table.index('status');
      table.index('published_at');
    });
  },

  async down(context) {
    context.schema.dropTable('posts');
  },
};

/**
 * Example 3: Add Column to Existing Table
 */
export const addAvatarToUsers: Migration = {
  version: '20240101000002',
  name: 'add_avatar_to_users',

  async up(context) {
    context.schema.alterTable('users', (table) => {
      table.string('avatar_url', 500).nullable();
      table.string('bio', 1000).nullable();
    });
  },

  async down(context) {
    context.schema.alterTable('users', (table) => {
      table.dropColumn('avatar_url');
      table.dropColumn('bio');
    });
  },
};

/**
 * Example 4: Rename Column
 */
export const renameUserNameColumn: Migration = {
  version: '20240101000003',
  name: 'rename_user_name_column',

  async up(context) {
    context.schema.alterTable('users', (table) => {
      table.renameColumn('name', 'full_name');
    });
  },

  async down(context) {
    context.schema.alterTable('users', (table) => {
      table.renameColumn('full_name', 'name');
    });
  },
};

/**
 * Example 5: Data Migration - Seed Admin User
 */
export const seedAdminUser: Migration = {
  version: '20240101000004',
  name: 'seed_admin_user',
  transaction: true,

  async up(context) {
    await context.data.insert('users', {
      email: 'admin@example.com',
      name: 'Admin User',
      password_hash: '$2b$10$...', // hashed password
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    });

    // Create admin role
    await context.data.insert('roles', {
      name: 'admin',
      permissions: JSON.stringify(['read', 'write', 'delete']),
    });
  },

  async down(context) {
    await context.data.delete('users', { email: 'admin@example.com' });
    await context.data.delete('roles', { name: 'admin' });
  },
};

/**
 * Example 6: Complex Data Migration - Transform Data
 */
export const migrateUserData: Migration = {
  version: '20240101000005',
  name: 'migrate_user_data',
  transaction: true,

  async up(context) {
    // Get all users
    const users = await context.sql('SELECT * FROM users');

    // Transform and update each user
    for (const user of users as any[]) {
      await context.data.update(
        'users',
        { id: user.id },
        {
          email: user.email.toLowerCase(),
          updated_at: new Date(),
        }
      );
    }
  },

  async down(context) {
    // Reverse transformation if possible
    // In this case, we can't reliably reverse lowercase transformation
    console.warn('Data migration cannot be fully reversed');
  },
};

/**
 * Example 7: Create Junction Table (Many-to-Many)
 */
export const createPostTagsTable: Migration = {
  version: '20240101000006',
  name: 'create_post_tags_table',

  async up(context) {
    // Create tags table
    context.schema.createTable('tags', (table) => {
      table.increments('id').primary();
      table.string('name', 100).unique().notNullable();
      table.string('slug', 100).unique().notNullable();
      table.timestamps(true);
    });

    // Create junction table
    context.schema.createTable('post_tags', (table) => {
      table.integer('post_id').notNullable();
      table.integer('tag_id').notNullable();
      table.timestamps(true);

      // Composite primary key
      table.primary(['post_id', 'tag_id']);

      // Foreign keys
      table.foreign('post_id').references('id').inTable('posts').onDelete('CASCADE');
      table.foreign('tag_id').references('id').inTable('tags').onDelete('CASCADE');

      // Indexes
      table.index('post_id');
      table.index('tag_id');
    });
  },

  async down(context) {
    context.schema.dropTable('post_tags');
    context.schema.dropTable('tags');
  },
};

/**
 * Example 8: Add JSON Column
 */
export const addMetadataToPost: Migration = {
  version: '20240101000007',
  name: 'add_metadata_to_posts',

  async up(context) {
    context.schema.alterTable('posts', (table) => {
      table.jsonb('metadata').defaultTo('{}');
    });
  },

  async down(context) {
    context.schema.alterTable('posts', (table) => {
      table.dropColumn('metadata');
    });
  },
};

/**
 * Example 9: Create Full-Text Search Index (PostgreSQL)
 */
export const addFullTextSearch: Migration = {
  version: '20240101000008',
  name: 'add_full_text_search',

  async up(context) {
    if (context.type === 'postgres') {
      // Add tsvector column
      await context.sql(`
        ALTER TABLE posts
        ADD COLUMN search_vector tsvector
        GENERATED ALWAYS AS (
          setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
          setweight(to_tsvector('english', coalesce(content, '')), 'B')
        ) STORED
      `);

      // Create GIN index
      await context.sql('CREATE INDEX idx_posts_search ON posts USING GIN(search_vector)');
    }
  },

  async down(context) {
    if (context.type === 'postgres') {
      await context.sql('DROP INDEX IF EXISTS idx_posts_search');
      await context.sql('ALTER TABLE posts DROP COLUMN IF EXISTS search_vector');
    }
  },
};

/**
 * Example 10: Batch Data Insert
 */
export const seedCategories: Migration = {
  version: '20240101000009',
  name: 'seed_categories',
  transaction: true,

  async up(context) {
    const categories = [
      { name: 'Technology', slug: 'technology' },
      { name: 'Business', slug: 'business' },
      { name: 'Design', slug: 'design' },
      { name: 'Marketing', slug: 'marketing' },
      { name: 'Development', slug: 'development' },
    ];

    await context.data.batchInsert('categories', categories, 10);
  },

  async down(context) {
    await context.data.delete('categories', {});
  },
};

/**
 * Example 11: Add Soft Delete
 */
export const addSoftDelete: Migration = {
  version: '20240101000010',
  name: 'add_soft_delete_to_posts',

  async up(context) {
    context.schema.alterTable('posts', (table) => {
      table.timestamp('deleted_at').nullable();
    });

    // Create index for soft deleted records
    context.schema.raw('CREATE INDEX idx_posts_deleted_at ON posts(deleted_at)');
  },

  async down(context) {
    context.schema.alterTable('posts', (table) => {
      table.dropColumn('deleted_at');
    });
  },
};

/**
 * Example 12: Migration with Dependencies
 */
export const createCommentsTable: Migration = {
  version: '20240101000011',
  name: 'create_comments_table',
  dependencies: ['20240101000000', '20240101000001'], // users and posts

  async up(context) {
    context.schema.createTable('comments', (table) => {
      table.increments('id').primary();
      table.integer('post_id').notNullable();
      table.integer('user_id').notNullable();
      table.integer('parent_id').nullable(); // For nested comments
      table.text('content').notNullable();
      table.boolean('is_approved').defaultTo(false);
      table.timestamps(true);
      table.timestamp('deleted_at').nullable();

      // Foreign keys
      table.foreign('post_id').references('id').inTable('posts').onDelete('CASCADE');
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.foreign('parent_id').references('id').inTable('comments').onDelete('CASCADE');

      // Indexes
      table.index('post_id');
      table.index('user_id');
      table.index('parent_id');
      table.index('is_approved');
    });
  },

  async down(context) {
    context.schema.dropTable('comments');
  },
};

/**
 * Example 13: Raw SQL Migration
 */
export const createCustomFunction: Migration = {
  version: '20240101000012',
  name: 'create_custom_function',
  transaction: false, // Some DDL operations can't be in transactions

  async up(context) {
    if (context.type === 'postgres') {
      await context.sql(`
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ language 'plpgsql';
      `);

      await context.sql(`
        CREATE TRIGGER update_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
      `);
    }
  },

  async down(context) {
    if (context.type === 'postgres') {
      await context.sql('DROP TRIGGER IF EXISTS update_users_updated_at ON users');
      await context.sql('DROP FUNCTION IF EXISTS update_updated_at_column');
    }
  },
};
