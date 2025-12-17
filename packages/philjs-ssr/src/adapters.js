import { createRouteMatcher } from "philjs-router";
import { handleRequest } from "./request-handler.js";
export function createFetchHandler(options) {
    const match = createRouteMatcher(options.routes, options.routeOptions);
    return (request) => handleRequest(request, {
        match,
        baseUrl: options.baseUrl,
        render: options.render,
    });
}
export function createNodeHttpHandler(options) {
    const fetchHandler = createFetchHandler(options);
    return async function nodeHandler(req, res) {
        try {
            await processIncoming(fetchHandler, req, res, options.baseUrl);
        }
        catch (error) {
            console.error("PhilJS server error", error);
            if (!res.headersSent) {
                res.statusCode = 500;
                res.end("Internal Server Error");
            }
            else {
                res.end();
            }
        }
    };
}
export function createExpressMiddleware(options) {
    const fetchHandler = createFetchHandler(options);
    return function philjsExpress(req, res, next) {
        processIncoming(fetchHandler, req, res, options.baseUrl).catch((error) => {
            console.error("PhilJS Express adapter error", error);
            if (!res.headersSent) {
                res.statusCode = 500;
                res.end("Internal Server Error");
            }
            if (next) {
                next(error);
            }
        });
    };
}
export function createViteMiddleware(options) {
    const fetchHandler = createFetchHandler(options);
    return function philjsVite(req, res, next) {
        processIncoming(fetchHandler, req, res, options.baseUrl).catch((error) => {
            if (!res.headersSent) {
                res.statusCode = 500;
                res.end("Internal Server Error");
            }
            next(error);
        });
    };
}
export function createWorkerHandler(options) {
    const fetchHandler = createFetchHandler(options);
    return (request) => fetchHandler(request);
}
async function processIncoming(fetchHandler, req, res, baseUrl) {
    const request = await toFetchRequest(req, baseUrl);
    const response = await fetchHandler(request);
    await sendNodeResponse(res, response, req.method ?? "GET");
}
async function toFetchRequest(req, baseUrl) {
    const origin = resolveOrigin(req, baseUrl);
    const url = new URL(req.url ?? "/", origin);
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
        if (value === undefined)
            continue;
        if (Array.isArray(value)) {
            for (const entry of value)
                headers.append(key, entry);
        }
        else {
            headers.set(key, value);
        }
    }
    const method = req.method ?? "GET";
    const init = {
        method,
        headers,
    };
    if (method !== "GET" && method !== "HEAD") {
        const chunks = [];
        for await (const chunk of req) {
            chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
        }
        init.body = Buffer.concat(chunks);
    }
    return new Request(url.toString(), init);
}
async function sendNodeResponse(res, response, method) {
    res.statusCode = response.status;
    res.statusMessage = response.statusText;
    response.headers.forEach((value, key) => {
        res.setHeader(key, value);
    });
    if (method === "HEAD") {
        res.end();
        return;
    }
    if (!response.body) {
        res.end();
        return;
    }
    const arrayBuffer = await response.arrayBuffer();
    res.end(Buffer.from(arrayBuffer));
}
function resolveOrigin(req, baseUrl) {
    if (baseUrl)
        return baseUrl;
    // Type guard to check if socket is a TLS socket
    const isTLS = req.socket && 'encrypted' in req.socket;
    const protocol = isTLS && req.socket.encrypted ? "https" : "http";
    const host = req.headers.host ?? "localhost";
    return `${protocol}://${host}`;
}
//# sourceMappingURL=adapters.js.map