/**
 * Netlify Functions Adapter
 */

export interface NetlifyEvent {
  httpMethod: string;
  path: string;
  headers: Record<string, string>;
  queryStringParameters: Record<string, string> | null;
  body: string | null;
  isBase64Encoded: boolean;
}

export interface NetlifyContext {
  callbackWaitsForEmptyEventLoop: boolean;
}

export interface NetlifyResponse {
  statusCode: number;
  headers?: Record<string, string>;
  body: string;
  isBase64Encoded?: boolean;
}

/**
 * Convert Netlify event to standard Request
 */
export function netlifyEventToRequest(event: NetlifyEvent): Request {
  const url = new URL(event.path, 'https://localhost');
  
  if (event.queryStringParameters) {
    for (const [key, value] of Object.entries(event.queryStringParameters)) {
      url.searchParams.set(key, value);
    }
  }

  const headers = new Headers(event.headers);

  let body: BodyInit | null = null;
  if (event.body) {
    body = event.isBase64Encoded
      ? Buffer.from(event.body, 'base64')
      : event.body;
  }

  return new Request(url.toString(), {
    method: event.httpMethod,
    headers,
    body: ['GET', 'HEAD'].includes(event.httpMethod) ? null : body,
  });
}

/**
 * Convert standard Response to Netlify response
 */
export async function responseToNetlify(response: Response): Promise<NetlifyResponse> {
  const headers: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    headers[key] = value;
  });

  const body = await response.text();

  return {
    statusCode: response.status,
    headers,
    body,
  };
}

/**
 * Netlify handler wrapper
 */
export async function netlifyHandler(
  event: NetlifyEvent,
  _context: NetlifyContext,
  handler: (request: Request) => Promise<Response>
): Promise<NetlifyResponse> {
  const request = netlifyEventToRequest(event);
  const response = await handler(request);
  return responseToNetlify(response);
}