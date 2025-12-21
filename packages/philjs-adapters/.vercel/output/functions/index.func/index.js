
// PhilJS Vercel Serverless Handler
export default async function handler(req, res) {
  const { handleRequest } = await import('@philjs/ssr');

  const url = new URL(req.url, `https://${req.headers.host}`);

  const context = {
    url,
    method: req.method,
    headers: new Headers(req.headers),
    body: req.body,
    params: {},
    platform: { name: 'vercel', edge: false },
  };

  const response = await handleRequest(context);

  // Set response headers
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });

  res.status(response.status);

  const body = await response.text();
  res.send(body);
}
