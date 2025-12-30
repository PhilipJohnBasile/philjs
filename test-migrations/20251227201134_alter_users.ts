import type { Migration } from '../types';

export default {
  name: 'alter_users',

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
