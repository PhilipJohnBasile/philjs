/**
 * AWS Lambda Adapter
 */

export interface AWSLambdaEvent {
  httpMethod: string;
  path: string;
  headers: Record<string, string>;
  queryStringParameters: Record<string, string> | null;
  body: string | null;
  isBase64Encoded: boolean;
}

export interface AWSLambdaContext {
  functionName: string;
  functionVersion: string;
  invokedFunctionArn: string;
  memoryLimitInMB: string;
  awsRequestId: string;
  logGroupName: string;
  logStreamName: string;
  getRemainingTimeInMillis: () => number;
}

export interface AWSLambdaResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
  isBase64Encoded?: boolean;
}

/**
 * Convert AWS Lambda event to standard Request
 */
export function lambdaEventToRequest(event: AWSLambdaEvent): Request {
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
 * Convert standard Response to AWS Lambda response
 */
export async function responseToLambda(response: Response): Promise<AWSLambdaResponse> {
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
 * AWS Lambda handler wrapper
 */
export async function awsHandler(
  event: AWSLambdaEvent,
  _context: AWSLambdaContext,
  handler: (request: Request) => Promise<Response>
): Promise<AWSLambdaResponse> {
  const request = lambdaEventToRequest(event);
  const response = await handler(request);
  return responseToLambda(response);
}