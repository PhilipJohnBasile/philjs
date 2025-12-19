/**
 * Production server for the PhilJS marketing site.
 */

import http from "node:http";
import { Readable } from "node:stream";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { readFileSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const { render } = await import("../dist/server/entry-server.js");
const indexTemplate = readFileSync(resolve(root, "dist/client/index.html"), "utf-8");

const server = http.createServer(async (req, res) => {
  try {
    const accept = req.headers.accept ?? "";
    if (!accept.includes("text/html")) {
      res.statusCode = 404;
      res.end("Not Found");
      return;
    }

    const result = await render(req);

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
    console.error(error);
    res.statusCode = 500;
    res.end(error?.stack ?? "Internal Server Error");
  }
});

const port = process.env.PORT || 3001;
server.listen(port, () => {
  console.log(`PhilJS Marketing Site running at http://localhost:${port}`);
});
