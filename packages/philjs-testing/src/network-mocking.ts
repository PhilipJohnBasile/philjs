/**
 * Network Mocking for Testing
 *
 * Mock HTTP requests for testing:
 * - Request interception
 * - Response mocking
 * - Network delay simulation
 * - Error simulation
 */

// =============================================================================
// Types
// =============================================================================

export interface MockRequest {
  url: string;
  method: string;
  headers: Headers;
  body: unknown;
}

export interface MockResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: unknown;
  delay?: number;
}

export interface MockHandler {
  match: (request: MockRequest) => boolean;
  respond: (request: MockRequest) => MockResponse | Promise<MockResponse>;
}

export interface NetworkMock {
  get: (url: string | RegExp, response: MockResponseConfig) => NetworkMock;
  post: (url: string | RegExp, response: MockResponseConfig) => NetworkMock;
  put: (url: string | RegExp, response: MockResponseConfig) => NetworkMock;
  patch: (url: string | RegExp, response: MockResponseConfig) => NetworkMock;
  delete: (url: string | RegExp, response: MockResponseConfig) => NetworkMock;
  any: (url: string | RegExp, response: MockResponseConfig) => NetworkMock;
  intercept: (handler: MockHandler) => NetworkMock;
  reset: () => void;
  restore: () => void;
  history: () => MockRequest[];
  pending: () => number;
  waitForAll: () => Promise<void>;
  setNetworkDelay: (ms: number) => void;
  setOffline: (offline: boolean) => void;
}

export type MockResponseConfig =
  | MockResponse
  | ((request: MockRequest) => MockResponse | Promise<MockResponse>)
  | unknown;

export interface NetworkStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatency: number;
  pendingRequests: number;
}

// =============================================================================
// Network Mock Implementation
// =============================================================================

let handlers: MockHandler[] = [];
let requestHistory: MockRequest[] = [];
let pendingCount = 0;
let networkDelay = 0;
let isOffline = false;
let originalFetch: typeof fetch | null = null;

/**
 * Create network mock instance
 */
export function createNetworkMock(): NetworkMock {
  // Store original fetch
  if (!originalFetch && typeof fetch !== 'undefined') {
    originalFetch = fetch;
  }

  // Install mock fetch
  installMockFetch();

  const mock: NetworkMock = {
    get: (url, response) => addHandler('GET', url, response, mock),
    post: (url, response) => addHandler('POST', url, response, mock),
    put: (url, response) => addHandler('PUT', url, response, mock),
    patch: (url, response) => addHandler('PATCH', url, response, mock),
    delete: (url, response) => addHandler('DELETE', url, response, mock),
    any: (url, response) => addHandler('*', url, response, mock),
    intercept: (handler) => {
      handlers.push(handler);
      return mock;
    },
    reset: () => {
      handlers = [];
      requestHistory = [];
      pendingCount = 0;
    },
    restore: () => {
      restoreOriginalFetch();
      mock.reset();
    },
    history: () => [...requestHistory],
    pending: () => pendingCount,
    waitForAll: () => waitForPendingRequests(),
    setNetworkDelay: (ms) => {
      networkDelay = ms;
    },
    setOffline: (offline) => {
      isOffline = offline;
    },
  };

  return mock;
}

function addHandler(
  method: string,
  url: string | RegExp,
  response: MockResponseConfig,
  mock: NetworkMock
): NetworkMock {
  const handler: MockHandler = {
    match: (request) => {
      if (method !== '*' && request.method !== method) return false;
      if (url instanceof RegExp) return url.test(request.url);
      return request.url === url || request.url.includes(url);
    },
    respond: async (request) => {
      if (typeof response === 'function') {
        return await response(request);
      }
      if (isFullResponse(response)) {
        return response;
      }
      return {
        status: 200,
        statusText: 'OK',
        headers: { 'Content-Type': 'application/json' },
        body: response,
      };
    },
  };

  handlers.push(handler);
  return mock;
}

function isFullResponse(response: unknown): response is MockResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    'status' in response &&
    'body' in response
  );
}

function installMockFetch(): void {
  if (typeof globalThis !== 'undefined') {
    (globalThis as any).fetch = mockFetch;
  }
}

function restoreOriginalFetch(): void {
  if (originalFetch && typeof globalThis !== 'undefined') {
    (globalThis as any).fetch = originalFetch;
  }
}

async function mockFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  const method = init?.method || 'GET';
  const headers = new Headers(init?.headers);
  let body: unknown = init?.body;

  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      // Keep as string
    }
  }

  const request: MockRequest = { url, method, headers, body };
  requestHistory.push(request);
  pendingCount++;

  try {
    // Check offline mode
    if (isOffline) {
      throw new TypeError('Failed to fetch');
    }

    // Apply network delay
    if (networkDelay > 0) {
      await delay(networkDelay);
    }

    // Find matching handler
    for (const handler of handlers) {
      if (handler.match(request)) {
        const response = await handler.respond(request);

        // Apply response delay
        if (response.delay) {
          await delay(response.delay);
        }

        const responseHeaders = new Headers(response.headers);
        const responseBody = typeof response.body === 'object'
          ? JSON.stringify(response.body)
          : String(response.body);

        return new Response(responseBody, {
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders,
        });
      }
    }

    // No handler found - throw or pass through
    throw new Error(`No mock handler found for ${method} ${url}`);
  } finally {
    pendingCount--;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForPendingRequests(): Promise<void> {
  while (pendingCount > 0) {
    await delay(10);
  }
}

// =============================================================================
// Mock Response Helpers
// =============================================================================

/**
 * Create successful JSON response
 */
export function json(data: unknown, status: number = 200): MockResponse {
  return {
    status,
    statusText: status === 200 ? 'OK' : 'Success',
    headers: { 'Content-Type': 'application/json' },
    body: data,
  };
}

/**
 * Create error response
 */
export function error(status: number, message?: string): MockResponse {
  const statusMessages: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
  };

  return {
    status,
    statusText: statusMessages[status] || 'Error',
    headers: { 'Content-Type': 'application/json' },
    body: { error: message || statusMessages[status] || 'Unknown error' },
  };
}

/**
 * Create delayed response
 */
export function delayed(response: MockResponse, ms: number): MockResponse {
  return { ...response, delay: ms };
}

/**
 * Create response that fails N times before succeeding
 */
export function flaky(
  successResponse: MockResponse,
  failureCount: number = 2,
  failureResponse?: MockResponse
): (request: MockRequest) => MockResponse {
  let attempts = 0;
  return () => {
    attempts++;
    if (attempts <= failureCount) {
      return failureResponse || error(500, 'Temporary failure');
    }
    return successResponse;
  };
}

/**
 * Create paginated response
 */
export function paginated<T>(
  items: T[],
  pageSize: number = 10
): (request: MockRequest) => MockResponse {
  return (request) => {
    const url = new URL(request.url, 'http://localhost');
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const pageItems = items.slice(start, end);

    return json({
      items: pageItems,
      page,
      pageSize,
      total: items.length,
      totalPages: Math.ceil(items.length / pageSize),
      hasNext: end < items.length,
      hasPrev: page > 1,
    });
  };
}

// =============================================================================
// Request Matchers
// =============================================================================

/**
 * Match request by headers
 */
export function withHeaders(
  headers: Record<string, string>
): (request: MockRequest) => boolean {
  return (request) => {
    for (const [key, value] of Object.entries(headers)) {
      if (request.headers.get(key) !== value) return false;
    }
    return true;
  };
}

/**
 * Match request by body content
 */
export function withBody(
  bodyMatcher: Record<string, unknown> | ((body: unknown) => boolean)
): (request: MockRequest) => boolean {
  return (request) => {
    if (typeof bodyMatcher === 'function') {
      return bodyMatcher(request.body);
    }
    for (const [key, value] of Object.entries(bodyMatcher)) {
      if ((request.body as Record<string, unknown>)?.[key] !== value) return false;
    }
    return true;
  };
}

/**
 * Match request by query parameters
 */
export function withQuery(
  params: Record<string, string>
): (request: MockRequest) => boolean {
  return (request) => {
    const url = new URL(request.url, 'http://localhost');
    for (const [key, value] of Object.entries(params)) {
      if (url.searchParams.get(key) !== value) return false;
    }
    return true;
  };
}

// =============================================================================
// Assertions
// =============================================================================

/**
 * Assert request was made
 */
export function expectRequest(
  mock: NetworkMock,
  method: string,
  url: string | RegExp
): void {
  const history = mock.history();
  const found = history.some(req => {
    if (req.method !== method) return false;
    if (url instanceof RegExp) return url.test(req.url);
    return req.url === url || req.url.includes(url);
  });

  if (!found) {
    throw new Error(
      `Expected ${method} request to ${url} but it was not made.\n` +
      `Requests made: ${history.map(r => `${r.method} ${r.url}`).join(', ')}`
    );
  }
}

/**
 * Assert request count
 */
export function expectRequestCount(
  mock: NetworkMock,
  method: string,
  url: string | RegExp,
  count: number
): void {
  const history = mock.history();
  const matches = history.filter(req => {
    if (req.method !== method) return false;
    if (url instanceof RegExp) return url.test(req.url);
    return req.url === url || req.url.includes(url);
  });

  if (matches.length !== count) {
    throw new Error(
      `Expected ${count} ${method} requests to ${url} but got ${matches.length}`
    );
  }
}

/**
 * Assert no requests were made
 */
export function expectNoRequests(mock: NetworkMock): void {
  const history = mock.history();
  if (history.length > 0) {
    throw new Error(
      `Expected no requests but ${history.length} were made:\n` +
      history.map(r => `${r.method} ${r.url}`).join('\n')
    );
  }
}

/**
 * Get network stats
 */
export function getNetworkStats(mock: NetworkMock): NetworkStats {
  const history = mock.history();

  return {
    totalRequests: history.length,
    successfulRequests: history.length, // Simplified
    failedRequests: 0,
    averageLatency: networkDelay,
    pendingRequests: mock.pending(),
  };
}

// =============================================================================
// GraphQL Mocking
// =============================================================================

export interface GraphQLMock {
  query: (operationName: string, response: unknown) => GraphQLMock;
  mutation: (operationName: string, response: unknown) => GraphQLMock;
  subscription: (operationName: string, response: unknown) => GraphQLMock;
}

/**
 * Create GraphQL mock
 */
export function createGraphQLMock(endpoint: string = '/graphql'): GraphQLMock & NetworkMock {
  const networkMock = createNetworkMock();
  const operationHandlers: Map<string, unknown> = new Map();

  networkMock.post(endpoint, (request: MockRequest) => {
    const body = request.body as { query: string; operationName?: string; variables?: unknown };
    const operationName = body.operationName || extractOperationName(body.query);

    if (operationHandlers.has(operationName)) {
      const response = operationHandlers.get(operationName);
      if (typeof response === 'function') {
        return json({ data: response(body.variables) });
      }
      return json({ data: response });
    }

    return error(400, `No mock for operation: ${operationName}`);
  });

  const graphqlMock: GraphQLMock = {
    query: (operationName, response) => {
      operationHandlers.set(operationName, response);
      return graphqlMock;
    },
    mutation: (operationName, response) => {
      operationHandlers.set(operationName, response);
      return graphqlMock;
    },
    subscription: (operationName, response) => {
      operationHandlers.set(operationName, response);
      return graphqlMock;
    },
  };

  return { ...networkMock, ...graphqlMock };
}

function extractOperationName(query: string): string {
  const match = query.match(/(?:query|mutation|subscription)\s+(\w+)/);
  return match ? match[1] : 'unknown';
}

// =============================================================================
// WebSocket Mocking
// =============================================================================

export interface WebSocketMock {
  send: (data: unknown) => void;
  close: () => void;
  onMessage: (handler: (data: unknown) => void) => void;
  simulateMessage: (data: unknown) => void;
  simulateError: (error: Error) => void;
  simulateClose: (code?: number, reason?: string) => void;
}

/**
 * Create WebSocket mock
 */
export function createWebSocketMock(url: string): WebSocketMock {
  const messageHandlers: Array<(data: unknown) => void> = [];
  let isOpen = true;

  const mock: WebSocketMock = {
    send: (data) => {
      if (!isOpen) throw new Error('WebSocket is closed');
      // Could trigger response handlers here
    },
    close: () => {
      isOpen = false;
    },
    onMessage: (handler) => {
      messageHandlers.push(handler);
    },
    simulateMessage: (data) => {
      messageHandlers.forEach(h => h(data));
    },
    simulateError: (error) => {
      // Trigger error handlers
    },
    simulateClose: (code = 1000, reason = 'Normal closure') => {
      isOpen = false;
    },
  };

  return mock;
}
