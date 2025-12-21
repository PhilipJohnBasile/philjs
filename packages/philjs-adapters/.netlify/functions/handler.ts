
// PhilJS Netlify Serverless Function Handler
import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { builder } from "@netlify/functions";

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  const { handleRequest } = await import('@philjs/ssr');

  const url = new URL(event.rawUrl);

  const headers = new Headers();
  for (const [key, value] of Object.entries(event.headers || {})) {
    if (value) headers.set(key, value);
  }

  const requestContext = {
    url,
    method: event.httpMethod,
    headers,
    body: event.body,
    params: {},
    platform: {
      name: 'netlify',
      edge: false,
      context,
      clientContext: context.clientContext,
    },
  };

  const response = await handleRequest(requestContext);

  const responseHeaders: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    responseHeaders[key] = value;
  });

  return {
    statusCode: response.status,
    headers: responseHeaders,
    body: await response.text(),
  };
};

export { builder(handler) as handler };
