/**
 * Production server reading compiled PhilJS output.
 */

import http from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import { Readable } from "node:stream";
import { writeEarlyHints } from "@philjs/ssr";

const clientDir = resolve(process.cwd(), "dist/client");
const port = Number(process.env.PORT ?? 3000);
const serverEntry = await import("../dist/server/entry-server.js");

const mimeMap = new Map(
  Object.entries({
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".ico": "image/x-icon",
    ".png": "image/png",
    ".svg": "image/svg+xml"
  })
);

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
    const filePath = join(clientDir, url.pathname.replace(/^\//, ""));

    const file = await tryServeFile(filePath, res);
    if (file) {
      return;
    }

    const result = await serverEntry.render(req);
    if (Array.isArray(result?.earlyHints)) {
      writeEarlyHints(res, result.earlyHints);
    }
    if (!result) {
      res.writeHead(404, { "content-type": "text/plain" });
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

    if (typeof body.getReader === "function") {
      Readable.fromWeb(body).pipe(res);
      return;
    }

    if (body instanceof Readable) {
      body.pipe(res);
      return;
    }

    res.end();
  } catch (error) {
    console.error("SSR render error", error);
    res.writeHead(500, { "content-type": "text/plain" });
    res.end("Internal Server Error");
  }
});

server.listen(port, () => {
  console.log(`PhilJS storefront (prod) listening on http://localhost:${port}`);
});

async function tryServeFile(path, res) {
  try {
    const stats = await stat(path);
    if (!stats.isFile()) {
      return false;
    }

    const type = mimeMap.get(extname(path)) ?? "application/octet-stream";
    res.writeHead(200, { "content-type": type, "content-length": stats.size });
    createReadStream(path).pipe(res);
    return true;
  } catch (error) {
    return false;
  }
}
