/**
 * Authentication example for treaty client.
 *
 * Shows how to implement authentication with JWT tokens,
 * request interceptors, and protected routes.
 */

import { createAPI, procedure, createAuthMiddleware } from '../src/index.js';
import { treaty } from '../src/treaty.js';
import { z } from 'zod';

// ============================================================================
// Auth Middleware
// ============================================================================

// Create authentication middleware
const authMiddleware = createAuthMiddleware<{ userId: string; role: string }>({
  verify: async (token) => {
    // Verify JWT token (simplified for example)
    if (!token) {
      throw new Error('No token provided');
    }

    // In production, verify the JWT signature
    const [header, payload] = token.split('.');
    const decoded = JSON.parse(atob(payload));

    return {
      userId: decoded.userId,
      role: decoded.role,
    };
  },
  getToken: (ctx) => {
    // Extract token from Authorization header
    const authHeader = ctx.headers?.['authorization'];
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    return null;
  },
});

// ============================================================================
// Server API Definition
// ============================================================================

export const api = createAPI({
  // Public routes - no auth required
  auth: {
    // Login endpoint
    login: procedure
      .input(
        z.object({
          email: z.string().email(),
          password: z.string().min(6),
        })
      )
      .mutation(async ({ input }) => {
        // Verify credentials (simplified)
        if (input.email === 'alice@example.com' && input.password === 'password') {
          // Create JWT token (simplified)
          const payload = {
            userId: '1',
            email: input.email,
            role: 'admin',
          };
          const token = `header.${btoa(JSON.stringify(payload))}.signature`;

          return {
            token,
            user: {
              id: '1',
              email: input.email,
              role: 'admin',
            },
          };
        }

        throw new Error('Invalid credentials');
      }),

    // Register endpoint
    register: procedure
      .input(
        z.object({
          email: z.string().email(),
          password: z.string().min(6),
          name: z.string().min(1),
        })
      )
      .mutation(async ({ input }) => {
        // Create user and return token
        const payload = {
          userId: Math.random().toString(36).substr(2, 9),
          email: input.email,
          role: 'user',
        };
        const token = `header.${btoa(JSON.stringify(payload))}.signature`;

        return {
          token,
          user: {
            id: payload.userId,
            email: input.email,
            name: input.name,
            role: 'user',
          },
        };
      }),
  },

  // Protected routes - require authentication
  me: {
    // Get current user
    profile: procedure
      .use(authMiddleware)
      .query(async ({ ctx }) => {
        // ctx.user is available from auth middleware
        return {
          id: ctx.user.userId,
          role: ctx.user.role,
          // Fetch additional user data from database
        };
      }),

    // Update current user
    update: procedure
      .use(authMiddleware)
      .input(
        z.object({
          name: z.string().optional(),
          bio: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // Update user in database
        return {
          id: ctx.user.userId,
          ...input,
          updatedAt: new Date().toISOString(),
        };
      }),

    // Get user's posts
    posts: procedure
      .use(authMiddleware)
      .query(async ({ ctx }) => {
        // Fetch posts for the authenticated user
        return [
          {
            id: '1',
            title: 'My First Post',
            authorId: ctx.user.userId,
          },
        ];
      }),
  },

  // Admin-only routes
  admin: {
    users: {
      list: procedure
        .use(authMiddleware)
        .query(async ({ ctx }) => {
          // Check if user is admin
          if (ctx.user.role !== 'admin') {
            throw new Error('Unauthorized: Admin access required');
          }

          return [
            { id: '1', email: 'alice@example.com', role: 'admin' },
            { id: '2', email: 'bob@example.com', role: 'user' },
          ];
        }),

      delete: procedure
        .use(authMiddleware)
        .input(z.object({ id: z.string() }))
        .mutation(async ({ input, ctx }) => {
          if (ctx.user.role !== 'admin') {
            throw new Error('Unauthorized: Admin access required');
          }

          // Delete user
          return { success: true, id: input.id };
        }),
    },
  },
});

export type AppAPI = typeof api;

// ============================================================================
// Client Usage Examples
// ============================================================================

// Token management
let authToken: string | null = null;

function setAuthToken(token: string) {
  authToken = token;
  // Optionally store in localStorage
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('auth_token', token);
  }
}

function getAuthToken(): string | null {
  if (authToken) return authToken;
  // Retrieve from localStorage if available
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
}

function clearAuthToken() {
  authToken = null;
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('auth_token');
  }
}

// Create client with auth interceptor
const client = treaty<AppAPI>('http://localhost:3000/api', {
  // Add auth token to every request
  onRequest: async (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },

  // Handle auth errors
  onError: async (error) => {
    if (error.status === 401) {
      // Unauthorized - clear token and redirect to login
      clearAuthToken();
      console.log('Session expired, please log in again');
      // Optionally redirect to login page
    }
  },
});

// ============================================================================
// Example Usage
// ============================================================================

async function examples() {
  // ==========================================================================
  // Example 1: Login
  // ==========================================================================

  try {
    const loginResult = await client.auth.login.post({
      email: 'alice@example.com',
      password: 'password',
    });

    console.log('Logged in:', loginResult.user);
    setAuthToken(loginResult.token);
  } catch (error) {
    console.error('Login failed:', error);
  }

  // ==========================================================================
  // Example 2: Access protected route
  // ==========================================================================

  try {
    // Token is automatically added by onRequest interceptor
    const profile = await client.me.profile.get();
    console.log('My profile:', profile);
  } catch (error) {
    console.error('Failed to fetch profile:', error);
  }

  // ==========================================================================
  // Example 3: Update profile
  // ==========================================================================

  try {
    const updated = await client.me.update.post({
      name: 'Alice Updated',
      bio: 'Software engineer',
    });
    console.log('Profile updated:', updated);
  } catch (error) {
    console.error('Failed to update profile:', error);
  }

  // ==========================================================================
  // Example 4: Admin route
  // ==========================================================================

  try {
    const users = await client.admin.users.list.get();
    console.log('All users (admin only):', users);
  } catch (error) {
    console.error('Admin access denied:', error);
  }

  // ==========================================================================
  // Example 5: Manual token in request
  // ==========================================================================

  // Override global auth with custom token for a single request
  const customProfile = await client.me.profile.get({
    headers: {
      Authorization: 'Bearer custom-token',
    },
  });

  // ==========================================================================
  // Example 6: Register new user
  // ==========================================================================

  try {
    const registerResult = await client.auth.register.post({
      email: 'newuser@example.com',
      password: 'password123',
      name: 'New User',
    });

    console.log('Registered:', registerResult.user);
    setAuthToken(registerResult.token);
  } catch (error) {
    console.error('Registration failed:', error);
  }

  // ==========================================================================
  // Example 7: Logout
  // ==========================================================================

  clearAuthToken();
  console.log('Logged out');

  // ==========================================================================
  // Example 8: Automatic token refresh
  // ==========================================================================

  const clientWithRefresh = treaty<AppAPI>('http://localhost:3000/api', {
    onRequest: async (config) => {
      let token = getAuthToken();

      // Check if token is expired
      if (token) {
        const [, payload] = token.split('.');
        const decoded = JSON.parse(atob(payload));

        if (decoded.exp && decoded.exp < Date.now() / 1000) {
          // Token expired, refresh it
          try {
            const refreshResult = await fetch('http://localhost:3000/api/auth/refresh', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token }),
            });
            const { newToken } = await refreshResult.json();
            setAuthToken(newToken);
            token = newToken;
          } catch {
            clearAuthToken();
            throw new Error('Session expired');
          }
        }
      }

      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }

      return config;
    },
  });

  // ==========================================================================
  // Example 9: Role-based access
  // ==========================================================================

  async function checkAdminAccess() {
    try {
      await client.admin.users.list.get();
      return true;
    } catch {
      return false;
    }
  }

  const isAdmin = await checkAdminAccess();
  console.log('Is admin:', isAdmin);
}

// Helper function for protected requests
async function withAuth<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (error.status === 401) {
      // Redirect to login
      console.log('Please log in');
      throw error;
    }
    throw error;
  }
}

// Run examples
examples().catch(console.error);
