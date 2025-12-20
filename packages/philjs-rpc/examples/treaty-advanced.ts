/**
 * Advanced treaty client examples.
 *
 * Shows file uploads, WebSockets, error handling,
 * retry logic, and advanced patterns.
 */

import { createAPI, procedure } from '../src/index.js';
import { treaty, createTreatyClient } from '../src/treaty.js';
import { z } from 'zod';

// ============================================================================
// Server API with Advanced Features
// ============================================================================

export const api = createAPI({
  // File upload endpoint
  files: {
    upload: procedure
      .input(
        z.object({
          filename: z.string(),
          size: z.number(),
          type: z.string(),
          data: z.string(), // base64 encoded in real app, would use Blob/File
        })
      )
      .mutation(async ({ input }) => {
        // Process file upload
        return {
          id: Math.random().toString(36).substr(2, 9),
          filename: input.filename,
          size: input.size,
          type: input.type,
          url: `/uploads/${input.filename}`,
          uploadedAt: new Date().toISOString(),
        };
      }),

    // Multiple file upload
    uploadMultiple: procedure
      .input(
        z.object({
          files: z.array(
            z.object({
              filename: z.string(),
              size: z.number(),
              type: z.string(),
              data: z.string(),
            })
          ),
        })
      )
      .mutation(async ({ input }) => {
        return {
          uploaded: input.files.length,
          files: input.files.map((f) => ({
            filename: f.filename,
            url: `/uploads/${f.filename}`,
          })),
        };
      }),

    // Download file
    download: procedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        return {
          id: input.id,
          filename: 'example.pdf',
          data: 'base64encodeddata...',
          type: 'application/pdf',
        };
      }),
  },

  // Streaming data endpoint
  stream: {
    data: procedure
      .input(z.object({ count: z.number().default(10) }))
      .query(async ({ input }) => {
        // Return streaming data
        return {
          chunks: Array.from({ length: input.count }, (_, i) => ({
            id: i,
            data: `Chunk ${i}`,
            timestamp: Date.now(),
          })),
        };
      }),
  },

  // Error handling examples
  errors: {
    // Endpoint that might fail
    flaky: procedure
      .input(z.object({ shouldFail: z.boolean().default(false) }))
      .query(async ({ input }) => {
        if (input.shouldFail) {
          throw new Error('Simulated error');
        }
        return { success: true };
      }),

    // Timeout example
    slow: procedure
      .input(z.object({ delay: z.number().default(5000) }))
      .query(async ({ input }) => {
        await new Promise((resolve) => setTimeout(resolve, input.delay));
        return { completed: true };
      }),

    // Validation error
    validated: procedure
      .input(
        z.object({
          email: z.string().email(),
          age: z.number().min(18).max(120),
        })
      )
      .mutation(async ({ input }) => {
        return { email: input.email, age: input.age };
      }),
  },

  // Batch operations
  batch: {
    createUsers: procedure
      .input(
        z.object({
          users: z.array(
            z.object({
              name: z.string(),
              email: z.string().email(),
            })
          ),
        })
      )
      .mutation(async ({ input }) => {
        return {
          created: input.users.length,
          users: input.users.map((u, i) => ({
            id: `user-${i}`,
            ...u,
          })),
        };
      }),
  },

  // Pagination example
  posts: {
    paginated: procedure
      .input(
        z.object({
          page: z.number().min(1).default(1),
          pageSize: z.number().min(1).max(100).default(10),
          orderBy: z.enum(['createdAt', 'updatedAt', 'title']).default('createdAt'),
          order: z.enum(['asc', 'desc']).default('desc'),
        })
      )
      .query(async ({ input }) => {
        // Simulate pagination
        const total = 100;
        const totalPages = Math.ceil(total / input.pageSize);

        return {
          data: Array.from({ length: input.pageSize }, (_, i) => ({
            id: `${input.page}-${i}`,
            title: `Post ${(input.page - 1) * input.pageSize + i + 1}`,
            createdAt: new Date().toISOString(),
          })),
          pagination: {
            page: input.page,
            pageSize: input.pageSize,
            total,
            totalPages,
            hasNext: input.page < totalPages,
            hasPrev: input.page > 1,
          },
        };
      }),
  },
});

export type AppAPI = typeof api;

// ============================================================================
// Client Usage Examples
// ============================================================================

async function examples() {
  const { client, utils } = createTreatyClient<AppAPI>({
    baseUrl: 'http://localhost:3000/api',
    // Default timeout for all requests
    defaults: {
      timeout: 30000, // 30 seconds
    },
  });

  // ==========================================================================
  // Example 1: File Upload
  // ==========================================================================

  async function uploadFile(file: File) {
    // Convert file to base64 (simplified)
    const reader = new FileReader();
    const data = await new Promise<string>((resolve) => {
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });

    const result = await client.files.upload.post({
      filename: file.name,
      size: file.size,
      type: file.type,
      data: data.split(',')[1], // Remove data URL prefix
    });

    console.log('File uploaded:', result);
    return result;
  }

  // ==========================================================================
  // Example 2: Multiple File Upload
  // ==========================================================================

  async function uploadMultipleFiles(files: File[]) {
    const fileData = await Promise.all(
      files.map(async (file) => {
        const reader = new FileReader();
        const data = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });

        return {
          filename: file.name,
          size: file.size,
          type: file.type,
          data: data.split(',')[1],
        };
      })
    );

    const result = await client.files.uploadMultiple.post({ files: fileData });
    console.log('Multiple files uploaded:', result);
    return result;
  }

  // ==========================================================================
  // Example 3: Upload with Progress (custom implementation)
  // ==========================================================================

  async function uploadWithProgress(file: File, onProgress: (percent: number) => void) {
    // Simulate chunked upload with progress
    const chunkSize = 1024 * 1024; // 1MB chunks
    const totalChunks = Math.ceil(file.size / chunkSize);

    for (let i = 0; i < totalChunks; i++) {
      const chunk = file.slice(i * chunkSize, (i + 1) * chunkSize);
      // Upload chunk...
      const progress = ((i + 1) / totalChunks) * 100;
      onProgress(progress);
    }

    // Final upload
    const reader = new FileReader();
    const data = await new Promise<string>((resolve) => {
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });

    return client.files.upload.post({
      filename: file.name,
      size: file.size,
      type: file.type,
      data: data.split(',')[1],
    });
  }

  // ==========================================================================
  // Example 4: Error Handling with Retry
  // ==========================================================================

  try {
    const result = await client.errors.flaky.get(
      { shouldFail: true },
      {
        retry: {
          count: 3,
          delay: 1000,
          backoff: 2, // Exponential backoff
          statusCodes: [500, 502, 503], // Retry only on server errors
        },
      }
    );
    console.log('Success after retry:', result);
  } catch (error) {
    console.error('Failed after retries:', error);
  }

  // ==========================================================================
  // Example 5: Request Timeout
  // ==========================================================================

  try {
    const result = await client.errors.slow.get(
      { delay: 10000 },
      {
        timeout: 2000, // 2 second timeout
      }
    );
    console.log('Completed:', result);
  } catch (error) {
    console.error('Request timed out:', error);
  }

  // ==========================================================================
  // Example 6: AbortController for Cancellation
  // ==========================================================================

  const controller = new AbortController();

  // Start request
  const request = client.errors.slow.get(
    { delay: 5000 },
    {
      signal: controller.signal,
    }
  );

  // Cancel after 1 second
  setTimeout(() => {
    controller.abort();
    console.log('Request cancelled');
  }, 1000);

  try {
    await request;
  } catch (error) {
    console.error('Request was aborted:', error);
  }

  // ==========================================================================
  // Example 7: Batch Requests
  // ==========================================================================

  const [posts, users] = await utils.batch([
    () => client.posts.paginated.get({ page: 1 }),
    () =>
      client.batch.createUsers.post({
        users: [
          { name: 'Alice', email: 'alice@example.com' },
          { name: 'Bob', email: 'bob@example.com' },
        ],
      }),
  ] as const);

  console.log('Posts:', posts.data.length);
  console.log('Created users:', users.created);

  // ==========================================================================
  // Example 8: Pagination
  // ==========================================================================

  async function getAllPosts() {
    let page = 1;
    const allPosts = [];

    while (true) {
      const result = await client.posts.paginated.get({
        page,
        pageSize: 20,
      });

      allPosts.push(...result.data);

      if (!result.pagination.hasNext) {
        break;
      }

      page++;
    }

    return allPosts;
  }

  const allPosts = await getAllPosts();
  console.log('Total posts fetched:', allPosts.length);

  // ==========================================================================
  // Example 9: Cursor-based Pagination Helper
  // ==========================================================================

  async function* paginatePosts(pageSize = 10) {
    let page = 1;

    while (true) {
      const result = await client.posts.paginated.get({
        page,
        pageSize,
      });

      yield result.data;

      if (!result.pagination.hasNext) {
        break;
      }

      page++;
    }
  }

  // Use with for-await-of
  for await (const posts of paginatePosts(20)) {
    console.log('Page of posts:', posts.length);
  }

  // ==========================================================================
  // Example 10: Validation Error Handling
  // ==========================================================================

  try {
    await client.errors.validated.post({
      email: 'invalid-email', // ❌ Invalid email
      age: 15, // ❌ Too young
    });
  } catch (error: any) {
    if (error.code === 'UNPROCESSABLE_ENTITY') {
      console.error('Validation errors:', error.response);
    }
  }

  // ==========================================================================
  // Example 11: Custom Request with Utils
  // ==========================================================================

  const customResult = await utils.request<{ custom: boolean }>('custom/endpoint', {
    method: 'POST',
    body: { data: 'test' },
    headers: {
      'X-Custom-Header': 'value',
    },
  });

  console.log('Custom request result:', customResult);

  // ==========================================================================
  // Example 12: Streaming Data (simulated)
  // ==========================================================================

  const streamData = await client.stream.data.get({ count: 100 });
  console.log('Received chunks:', streamData.chunks.length);

  // Process chunks
  for (const chunk of streamData.chunks) {
    console.log('Processing chunk:', chunk.id);
    // Process each chunk
  }

  // ==========================================================================
  // Example 13: Download File
  // ==========================================================================

  async function downloadFile(id: string) {
    const file = await client.files.download.get({ id });

    // Convert base64 to blob
    const blob = new Blob([atob(file.data)], { type: file.type });

    // Create download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.filename;
    a.click();

    URL.revokeObjectURL(url);
  }

  // ==========================================================================
  // Example 14: WebSocket Connection (if supported)
  // ==========================================================================

  // Note: This requires server-side WebSocket support
  // const ws = client.notifications.ws({
  //   onOpen: () => console.log('Connected'),
  //   onMessage: (data) => console.log('Received:', data),
  //   onClose: () => console.log('Disconnected'),
  // }, {
  //   autoReconnect: true,
  //   reconnectDelay: 1000,
  // });
  //
  // // Send message
  // ws.send({ type: 'subscribe', channel: 'updates' });
  //
  // // Close connection
  // ws.close();
}

// ============================================================================
// Utility Functions
// ============================================================================

// Progress tracker
class ProgressTracker {
  private progress = 0;

  update(percent: number) {
    this.progress = percent;
    console.log(`Progress: ${percent.toFixed(2)}%`);
  }

  get current() {
    return this.progress;
  }
}

// Debounced request
function debounce<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>): Promise<ReturnType<T>> => {
    return new Promise((resolve, reject) => {
      if (timeout) clearTimeout(timeout);

      timeout = setTimeout(async () => {
        try {
          const result = await fn(...args);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delay);
    });
  };
}

// Run examples
examples().catch(console.error);
