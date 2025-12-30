import type { Migration } from '../types';

export default {
  name: 'create_users',

  async up(context) {
    context.schema.createTable('users', (table) => {
      table.increments('id').primary();
      table.timestamps(true);
    });
  },

  async down(context) {
    context.schema.dropTable('users');
  },
} as Migration;
