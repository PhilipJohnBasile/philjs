/**
 * GraphQL Integration Tests
 * These tests prove that the GraphQL integration actually works
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createGraphQLClient,
  createQuery,
  createMutation,
  createGraphQLLoader,
  createGraphQLAction,
  gql,
  type GraphQLResponse
} from './index';

describe('GraphQL Client', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
  });

  it('should create a GraphQL client', () => {
    const client = createGraphQLClient({
      endpoint: 'https://api.example.com/graphql',
      headers: {
        'Authorization': 'Bearer token123'
      },
      fetch: mockFetch
    });

    expect(client).toBeDefined();
  });

  it('should execute a GraphQL query', async () => {
    const mockResponse: GraphQLResponse<{ user: { id: string; name: string } }> = {
      data: {
        user: {
          id: '1',
          name: 'Alice'
        }
      }
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponse
    });

    const client = createGraphQLClient({
      endpoint: 'https://api.example.com/graphql',
      fetch: mockFetch
    });

    const query = gql`
      query GetUser($id: ID!) {
        user(id: $id) {
          id
          name
        }
      }
    `;

    const result = await client.query({
      query,
      variables: { id: '1' }
    });

    expect(result.data).toEqual({
      user: { id: '1', name: 'Alice' }
    });

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/graphql',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        }),
        body: expect.stringContaining('GetUser')
      })
    );
  });

  it('should cache query results', async () => {
    const mockResponse: GraphQLResponse<{ posts: any[] }> = {
      data: {
        posts: [{ id: '1', title: 'Test Post' }]
      }
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponse
    });

    const client = createGraphQLClient({
      endpoint: 'https://api.example.com/graphql',
      fetch: mockFetch
    });

    const query = gql`
      query GetPosts {
        posts {
          id
          title
        }
      }
    `;

    // First call
    await client.query({ query });

    // Second call (should use cache)
    await client.query({ query });

    // Should only fetch once due to caching
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should bypass cache when noCache is true', async () => {
    const mockResponse: GraphQLResponse<{ posts: any[] }> = {
      data: {
        posts: [{ id: '1', title: 'Test Post' }]
      }
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponse
    });

    const client = createGraphQLClient({
      endpoint: 'https://api.example.com/graphql',
      fetch: mockFetch
    });

    const query = gql`
      query GetPosts {
        posts {
          id
          title
        }
      }
    `;

    // First call with noCache
    await client.query({ query, noCache: true });

    // Second call with noCache
    await client.query({ query, noCache: true });

    // Should fetch twice (no caching)
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('should execute a GraphQL mutation', async () => {
    const mockResponse: GraphQLResponse<{ createPost: { id: string; title: string } }> = {
      data: {
        createPost: {
          id: '1',
          title: 'New Post'
        }
      }
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponse
    });

    const client = createGraphQLClient({
      endpoint: 'https://api.example.com/graphql',
      fetch: mockFetch
    });

    const mutation = gql`
      mutation CreatePost($title: String!, $content: String!) {
        createPost(title: $title, content: $content) {
          id
          title
        }
      }
    `;

    const result = await client.mutate({
      mutation,
      variables: {
        title: 'New Post',
        content: 'Post content'
      }
    });

    expect(result.data).toEqual({
      createPost: { id: '1', title: 'New Post' }
    });
  });

  it('should clear cache after mutation', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: {} })
    });

    const client = createGraphQLClient({
      endpoint: 'https://api.example.com/graphql',
      fetch: mockFetch
    });

    const query = gql`query { posts { id } }`;
    const mutation = gql`mutation { createPost { id } }`;

    // Execute query to populate cache
    await client.query({ query });

    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Execute mutation (clears cache)
    await client.mutate({ mutation, variables: {} });

    // Execute query again (should fetch, not use cache)
    await client.query({ query });

    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('should handle GraphQL errors', async () => {
    const mockResponse: GraphQLResponse = {
      errors: [
        {
          message: 'User not found',
          path: ['user']
        }
      ]
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponse
    });

    const client = createGraphQLClient({
      endpoint: 'https://api.example.com/graphql',
      fetch: mockFetch
    });

    const query = gql`query { user(id: "999") { id } }`;

    const result = await client.query({ query });

    expect(result.errors).toBeDefined();
    expect(result.errors![0].message).toBe('User not found');
  });

  it('should handle network errors', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      statusText: 'Internal Server Error'
    });

    const client = createGraphQLClient({
      endpoint: 'https://api.example.com/graphql',
      fetch: mockFetch,
      retry: { maxRetries: 0 } // Disable retries for this test
    });

    await expect(async () => {
      await client.query({
        query: gql`query { posts { id } }`
      });
    }).rejects.toThrow('GraphQL request failed');
  });

  it('should include custom headers', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: {} })
    });

    const client = createGraphQLClient({
      endpoint: 'https://api.example.com/graphql',
      headers: {
        'Authorization': 'Bearer secret-token',
        'X-Custom-Header': 'custom-value'
      },
      fetch: mockFetch
    });

    await client.query({
      query: gql`query { posts { id } }`
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer secret-token',
          'X-Custom-Header': 'custom-value'
        })
      })
    );
  });

  it('should clear cache with pattern', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: {} })
    });

    const client = createGraphQLClient({
      endpoint: 'https://api.example.com/graphql',
      fetch: mockFetch
    });

    // Populate cache with multiple queries
    await client.query({ query: gql`query { posts { id } }` });
    await client.query({ query: gql`query { users { id } }` });

    mockFetch.mockClear();

    // Clear only 'posts' queries
    client.clearCache('posts');

    // Query posts (should fetch - cache cleared)
    await client.query({ query: gql`query { posts { id } }` });

    // Query users (should use cache)
    await client.query({ query: gql`query { users { id } }` });

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});

describe('Reactive GraphQL Hooks', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
  });

  it('should create a reactive query', async () => {
    const mockResponse: GraphQLResponse<{ user: { name: string } }> = {
      data: {
        user: { name: 'Alice' }
      }
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponse
    });

    const client = createGraphQLClient({
      endpoint: 'https://api.example.com/graphql',
      fetch: mockFetch
    });

    const queryHook = createQuery(client, {
      query: gql`query { user { name } }`
    });

    // Initially loading
    expect(queryHook.loading()).toBe(true);

    // Wait for query to complete
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(queryHook.loading()).toBe(false);
    expect(queryHook.data()).toEqual({ user: { name: 'Alice' } });
    expect(queryHook.error()).toBeNull();
  });

  it('should create a reactive mutation', async () => {
    const mockResponse: GraphQLResponse<{ createPost: { id: string } }> = {
      data: {
        createPost: { id: '1' }
      }
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponse
    });

    const client = createGraphQLClient({
      endpoint: 'https://api.example.com/graphql',
      fetch: mockFetch
    });

    const mutation = createMutation(client, gql`
      mutation CreatePost($title: String!) {
        createPost(title: $title) {
          id
        }
      }
    `);

    expect(mutation.loading()).toBe(false);

    const result = await mutation.mutate({ title: 'Test' });

    expect(result).toEqual({ createPost: { id: '1' } });
    expect(mutation.data()).toEqual({ createPost: { id: '1' } });
    expect(mutation.error()).toBeNull();
  });
});

describe('GraphQL Loaders and Actions', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
  });

  it('should create a GraphQL loader', async () => {
    const mockResponse: GraphQLResponse<{ user: { id: string; name: string } }> = {
      data: {
        user: { id: '1', name: 'Alice' }
      }
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponse
    });

    const client = createGraphQLClient({
      endpoint: 'https://api.example.com/graphql',
      fetch: mockFetch
    });

    const loader = createGraphQLLoader(client, gql`
      query GetUser($id: ID!) {
        user(id: $id) {
          id
          name
        }
      }
    `);

    const result = await loader({
      params: { id: '1' },
      request: new Request('http://localhost/user/1'),
      url: new URL('http://localhost/user/1')
    });

    expect(result).toEqual({ user: { id: '1', name: 'Alice' } });
  });

  it('should create a GraphQL action', async () => {
    const mockResponse: GraphQLResponse<{ createPost: { id: string } }> = {
      data: {
        createPost: { id: '1' }
      }
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponse
    });

    const client = createGraphQLClient({
      endpoint: 'https://api.example.com/graphql',
      fetch: mockFetch
    });

    const action = createGraphQLAction(client, gql`
      mutation CreatePost($title: String!, $content: String!) {
        createPost(title: $title, content: $content) {
          id
        }
      }
    `);

    const formData = new FormData();
    formData.append('title', 'Test Post');
    formData.append('content', 'Test content');

    const request = new Request('http://localhost/api/posts', {
      method: 'POST',
      body: formData
    });

    const result = await action({ request, params: {}, url: new URL('http://localhost/api/posts') });

    expect(result).toEqual({ createPost: { id: '1' } });
  });
});

describe('gql template tag', () => {
  it('should create a GraphQL query string', () => {
    const query = gql`
      query GetUser($id: ID!) {
        user(id: $id) {
          id
          name
        }
      }
    `;

    expect(query).toContain('query GetUser');
    expect(query).toContain('user(id: $id)');
  });

  it('should interpolate variables', () => {
    const field = 'name';
    const query = gql`
      query {
        user {
          id
          ${field}
        }
      }
    `;

    expect(query).toContain('name');
  });
});
