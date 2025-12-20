/**
 * Basic usage example for treaty client.
 *
 * Shows fundamental treaty patterns with GET, POST, PUT, DELETE operations.
 */

import { createAPI, procedure } from '../src/index.js';
import { treaty } from '../src/treaty.js';
import { z } from 'zod';

// ============================================================================
// Server API Definition
// ============================================================================

// Define your API on the server
export const api = createAPI({
  // GET endpoint - no input required
  health: procedure.query(async () => {
    return { status: 'ok', timestamp: Date.now() };
  }),

  users: {
    // GET endpoint - list all users
    list: procedure.query(async () => {
      return [
        { id: '1', name: 'Alice', email: 'alice@example.com', role: 'admin' },
        { id: '2', name: 'Bob', email: 'bob@example.com', role: 'user' },
        { id: '3', name: 'Charlie', email: 'charlie@example.com', role: 'user' },
      ];
    }),

    // GET endpoint - get user by ID
    byId: procedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        // Simulate database lookup
        const users = [
          { id: '1', name: 'Alice', email: 'alice@example.com', role: 'admin' },
          { id: '2', name: 'Bob', email: 'bob@example.com', role: 'user' },
        ];
        return users.find((u) => u.id === input.id) ?? null;
      }),

    // POST endpoint - create user
    create: procedure
      .input(
        z.object({
          name: z.string().min(1),
          email: z.string().email(),
          role: z.enum(['admin', 'user']).default('user'),
        })
      )
      .mutation(async ({ input }) => {
        // Simulate database insert
        const newUser = {
          id: Math.random().toString(36).substr(2, 9),
          ...input,
          createdAt: new Date().toISOString(),
        };
        return newUser;
      }),

    // PUT endpoint - update user
    update: procedure
      .input(
        z.object({
          id: z.string(),
          name: z.string().min(1).optional(),
          email: z.string().email().optional(),
          role: z.enum(['admin', 'user']).optional(),
        })
      )
      .mutation(async ({ input }) => {
        // Simulate database update
        return {
          id: input.id,
          name: input.name ?? 'Updated User',
          email: input.email ?? 'updated@example.com',
          role: input.role ?? 'user',
          updatedAt: new Date().toISOString(),
        };
      }),

    // DELETE endpoint - delete user
    delete: procedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        // Simulate database delete
        return { success: true, id: input.id };
      }),

    // Search with query parameters
    search: procedure
      .input(
        z.object({
          query: z.string(),
          role: z.enum(['admin', 'user']).optional(),
          limit: z.number().min(1).max(100).default(10),
        })
      )
      .query(async ({ input }) => {
        // Simulate search
        return [
          { id: '1', name: 'Alice', email: 'alice@example.com', role: 'admin' },
        ].filter(
          (u) =>
            u.name.toLowerCase().includes(input.query.toLowerCase()) &&
            (!input.role || u.role === input.role)
        );
      }),
  },
});

// Export the type for client-side usage
export type AppAPI = typeof api;

// ============================================================================
// Client Usage Examples
// ============================================================================

async function examples() {
  // Create the treaty client
  const client = treaty<AppAPI>('http://localhost:3000/api');

  // ==========================================================================
  // Example 1: Simple GET request (no parameters)
  // ==========================================================================

  const health = await client.health.get();
  console.log('Health check:', health);
  // Output: { status: 'ok', timestamp: 1234567890 }

  // ==========================================================================
  // Example 2: GET request with parameters
  // ==========================================================================

  const user = await client.users.byId.get({ id: '1' });
  console.log('User:', user);
  // Output: { id: '1', name: 'Alice', email: 'alice@example.com', role: 'admin' }

  // ==========================================================================
  // Example 3: List all users
  // ==========================================================================

  const users = await client.users.list.get();
  console.log('Users:', users.length);
  // Output: 3

  // ==========================================================================
  // Example 4: POST request (create)
  // ==========================================================================

  const newUser = await client.users.create.post({
    name: 'David',
    email: 'david@example.com',
    role: 'user',
  });
  console.log('Created user:', newUser);
  // Output: { id: 'xyz', name: 'David', email: 'david@example.com', ... }

  // ==========================================================================
  // Example 5: PUT request (update)
  // ==========================================================================

  const updatedUser = await client.users.update.put({
    id: '1',
    name: 'Alice Updated',
  });
  console.log('Updated user:', updatedUser);

  // ==========================================================================
  // Example 6: DELETE request
  // ==========================================================================

  const deleteResult = await client.users.delete.delete({ id: '1' });
  console.log('Delete result:', deleteResult);
  // Output: { success: true, id: '1' }

  // ==========================================================================
  // Example 7: Search with multiple parameters
  // ==========================================================================

  const searchResults = await client.users.search.get({
    query: 'alice',
    role: 'admin',
    limit: 10,
  });
  console.log('Search results:', searchResults);

  // ==========================================================================
  // Example 8: Type safety - These will show TypeScript errors
  // ==========================================================================

  // ❌ Error: email must be a valid email
  // const invalid = await client.users.create.post({
  //   name: 'Test',
  //   email: 'invalid-email',
  // });

  // ❌ Error: id is required
  // const noId = await client.users.byId.get({});

  // ❌ Error: role must be 'admin' or 'user'
  // const invalidRole = await client.users.create.post({
  //   name: 'Test',
  //   email: 'test@example.com',
  //   role: 'superuser', // ❌ Not allowed
  // });

  // ==========================================================================
  // Example 9: Full autocomplete support
  // ==========================================================================

  // Type 'client.' and see all available routes
  // Type 'client.users.' and see all user operations
  // Type 'client.users.create.post(' and see required parameters

  // TypeScript knows the exact return type
  const userData = await client.users.byId.get({ id: '1' });
  // userData is typed as:
  // { id: string; name: string; email: string; role: 'admin' | 'user' } | null

  if (userData) {
    // Safe to access properties
    console.log(userData.name); // ✅ OK
    console.log(userData.email); // ✅ OK
    // console.log(userData.unknown); // ❌ Error: Property doesn't exist
  }
}

// Run examples
examples().catch(console.error);
