
// PhilJS AWS Lambda Handler
export async function handler(event, context) {
  const { handleRequest } = await import('@philjs/ssr');

  const url = new URL(event.rawPath || '/', `https://${event.requestContext?.domainName || 'localhost'}`);

  // Add query parameters
  if (event.rawQueryString) {
    url.search = event.rawQueryString;
  }

  const headers = new Headers();
  for (const [key, value] of Object.entries(event.headers || {})) {
    if (value) headers.set(key, value);
  }

  const requestContext = {
    url,
    method: event.requestContext?.http?.method || 'GET',
    headers,
    body: event.body,
    params: event.pathParameters || {},
    platform: {
      name: 'aws',
      mode: 'lambda',
      streaming: false,
      context,
    },
  };

  const response = await handleRequest(requestContext);

  const responseHeaders = {};
  response.headers.forEach((value, key) => {
    responseHeaders[key] = value;
  });

  return {
    statusCode: response.status,
    headers: responseHeaders,
    body: await response.text(),
    isBase64Encoded: false,
  };
}
