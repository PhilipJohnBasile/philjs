import type { Migration } from '../types';

export default {
  name: 'seed_users',
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
