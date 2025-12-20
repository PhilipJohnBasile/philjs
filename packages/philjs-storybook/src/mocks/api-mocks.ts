/**
 * API Mocking Utilities
 *
 * Mock API endpoints using MSW
 */

import { http, HttpResponse } from 'msw';

export interface MockAPIHandler {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  response: any;
  status?: number;
  delay?: number;
}

/**
 * Create a mock API handler
 */
export function createMockAPI(handlers: MockAPIHandler[]) {
  return handlers.map((handler) => {
    const { method, path, response, status = 200, delay = 0 } = handler;

    const httpMethod = http[method.toLowerCase() as keyof typeof http];

    return httpMethod(path, async () => {
      if (delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      return HttpResponse.json(response, { status });
    });
  });
}

/**
 * Create a mock API error response
 */
export function createMockError(
  path: string,
  message: string,
  status = 500,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'GET'
) {
  const httpMethod = http[method.toLowerCase() as keyof typeof http];

  return httpMethod(path, () => {
    return HttpResponse.json(
      {
        error: message,
        status,
      },
      { status }
    );
  });
}

/**
 * Create a mock API with delay
 */
export function createMockDelayedAPI(
  path: string,
  response: any,
  delay: number,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'GET'
) {
  const httpMethod = http[method.toLowerCase() as keyof typeof http];

  return httpMethod(path, async () => {
    await new Promise((resolve) => setTimeout(resolve, delay));
    return HttpResponse.json(response);
  });
}

/**
 * Create a mock paginated API
 */
export function createMockPaginatedAPI(
  path: string,
  data: any[],
  pageSize = 10
) {
  return http.get(path, ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || pageSize.toString());

    const start = (page - 1) * limit;
    const end = start + limit;
    const items = data.slice(start, end);

    return HttpResponse.json({
      items,
      page,
      limit,
      total: data.length,
      totalPages: Math.ceil(data.length / limit),
      hasMore: end < data.length,
    });
  });
}
