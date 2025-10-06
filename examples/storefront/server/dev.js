/**
 * Development server for the storefront example with PhilJS SSR.
 */

import http from "node:http";
import { Readable } from "node:stream";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createServer as createViteServer } from "vite";
import { writeEarlyHints } from "philjs-ssr";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const vite = await createViteServer({
  root,
  server: {
    middlewareMode: true,
    port: 3000
  },
  appType: "custom"
});

const server = http.createServer((req, res) => {
  vite.middlewares(req, res, async (err) => {
    if (err) {
      vite.ssrFixStacktrace?.(err);
      console.error(err);
      res.statusCode = 500;
      res.end(err.stack ?? "Internal Server Error");
      return;
    }

    if (res.writableEnded) {
      return;
    }

    const accept = req.headers.accept ?? "";
    if (!accept.includes("text/html")) {
      res.statusCode = 404;
      res.end("Not Found");
      return;
    }

    try {
      const { render } = await vite.ssrLoadModule("/src/server/entry-server.ts");
      const result = await render(req);

      if (Array.isArray(result?.earlyHints)) {
        writeEarlyHints(res, result.earlyHints);
      }

      if (!result) {
        res.statusCode = 404;
        res.end("Not Found");
        return;
      }

      const { status = 200, headers = {}, body } = result;
      res.writeHead(status, headers);

      if (!body) {
        res.end();
        return;
      }

      if (typeof body === "string") {
        res.end(body);
        return;
      }

      if (body instanceof Readable) {
        body.pipe(res);
        return;
      }

      if (typeof body.getReader === "function") {
        const stream = Readable.fromWeb(body);
        stream.pipe(res);
        return;
      }

      res.end();
    } catch (error) {
      vite.ssrFixStacktrace?.(error);
      console.error(error);
      res.statusCode = 500;
      res.end(error?.stack ?? "Internal Server Error");
    }
  });
});

server.listen(3000, () => {
  console.log("Storefront dev server running at http://localhost:3000");
});
