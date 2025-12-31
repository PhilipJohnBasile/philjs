/**
 * Comprehensive tests for Partial Prerendering (PPR)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { VNode } from "@philjs/core";
import {
  createPPRContext,
  renderToStaticShell,
  renderDynamicContent,
  injectDynamicContent,
  generatePPRResponse,
} from "./ppr.js";
import {
  dynamic,
  isDynamic,
  createDynamic,
  dynamicPriority,
  dynamicDeferred,
  dynamicWithDependencies,
  makeDynamic,
  serverOnly,
  registerDynamicBoundary,
} from "./dynamic.js";
import {
  PPRStreamController,
  createPPRStream,
  streamPPRResponse,
} from "./ppr-streaming.js";
import {
  PPRBuilder,
  MemoryPPRCache,
  buildPPR,
  loadStaticShell,
} from "./ppr-build.js";
import {
  LRUPPRCache,
  EdgeCacheController,
  CacheTagManager,
  generateCacheHeaders,
  parseConditionalRequest,
  shouldReturn304,
  create304Response,
} from "./ppr-cache.js";
import type {
  PPRConfig,
  StaticShell,
  DynamicBoundary,
  PPRContext,
  RequestTimeData,
} from "./ppr-types.js";
import {
  PPR_PLACEHOLDER_START,
  PPR_PLACEHOLDER_END,
  extractBoundaryId,
  hashContent,
} from "./ppr-types.js";

// ============================================================================
// Test Helpers
// ============================================================================

function createMockVNode(
  type: string | ((props: any) => VNode),
  props: Record<string, any> = {}
): VNode {
  return { type, props } as any;
}

function createMockShell(path: string, html: string): StaticShell {
  return {
    path,
    html,
    boundaries: new Map(),
    buildTime: Date.now(),
    contentHash: "abc123",
    assets: { css: [], js: [], fonts: [] },
  };
}

function createMockRequestData(url = "http://localhost/"): RequestTimeData {
  return {
    request: new Request(url),
    params: {},
    headers: new Headers(),
    cookies: new Map(),
    timestamp: Date.now(),
  };
}

// ============================================================================
// PPR Context Tests
// ============================================================================

describe("PPR Context", () => {
  it("should create a build-time context", () => {
    const ctx = createPPRContext("build");

    expect(ctx.mode).toBe("build");
    expect(ctx.boundaries.size).toBe(0);
    expect(ctx.boundaryId).toBe(0);
    expect(ctx.insideDynamicBoundary).toBe(false);
  });

  it("should create a request-time context", () => {
    const requestData = createMockRequestData();
    const ctx = createPPRContext("request", { requestData });

    expect(ctx.mode).toBe("request");
    expect(ctx.requestData).toBe(requestData);
  });

  it("should use custom placeholder prefix", () => {
    const ctx = createPPRContext("build", { placeholderPrefix: "custom-" });

    expect(ctx.placeholderPrefix).toBe("custom-");
  });
});

// ============================================================================
// Dynamic Component Tests
// ============================================================================

describe("Dynamic Component", () => {
  it("should create a dynamic boundary", () => {
    const content = createMockVNode("div", { children: "Hello" });
    const fallback = createMockVNode("span", { children: "Loading..." });

    const result = dynamic({
      children: content,
      fallback,
      priority: 8,
    });

    expect(result).toBeDefined();
    expect((result as any).props.children).toBe(content);
    expect((result as any).props.fallback).toBe(fallback);
    expect((result as any).props.priority).toBe(8);
  });

  it("should identify dynamic components", () => {
    const dynamicComponent = dynamic({
      children: createMockVNode("div"),
    });

    expect(isDynamic(dynamicComponent)).toBe(true);
    expect(isDynamic(createMockVNode("div"))).toBe(false);
    expect(isDynamic(null)).toBe(false);
    expect(isDynamic("string")).toBe(false);
  });

  it("should create configured dynamic factories", () => {
    const highPriority = createDynamic({ priority: 10 });
    const result = highPriority({
      children: createMockVNode("div"),
    });

    expect((result as any).props.priority).toBe(10);
  });

  it("should create priority dynamic components", () => {
    const result = dynamicPriority({
      children: createMockVNode("div"),
    });

    expect((result as any).props.priority).toBe(10);
  });

  it("should create deferred dynamic components", () => {
    const result = dynamicDeferred({
      children: createMockVNode("div"),
    });

    expect((result as any).props.priority).toBe(1);
  });

  it("should create dynamic with dependencies", () => {
    const result = dynamicWithDependencies(["user:session", "cart:items"], {
      children: createMockVNode("div"),
    });

    expect((result as any).props.dataDependencies).toEqual([
      "user:session",
      "cart:items",
    ]);
  });

  it("should wrap components as dynamic", () => {
    function MyComponent(props: { name: string }): VNode {
      return createMockVNode("div", { children: props.name });
    }

    const DynamicMyComponent = makeDynamic(MyComponent, { priority: 7 });
    const result = DynamicMyComponent({ name: "Test" });

    expect(isDynamic(result)).toBe(true);
    expect((result as any).props.priority).toBe(7);
  });

  it("should register dynamic boundary in context", () => {
    const ctx = createPPRContext("build");

    const { id, placeholders } = registerDynamicBoundary(ctx, {
      children: createMockVNode("div"),
      fallback: createMockVNode("span", { children: "Loading" }),
      priority: 5,
    });

    expect(id).toBe("ppr-dynamic-0");
    expect(placeholders.start).toBe("<!--ppr:start:ppr-dynamic-0-->");
    expect(placeholders.end).toBe("<!--ppr:end:ppr-dynamic-0-->");
    expect(ctx.boundaries.size).toBe(1);
    expect(ctx.boundaryId).toBe(1);
  });
});

// ============================================================================
// Static Shell Rendering Tests
// ============================================================================

describe("Static Shell Rendering", () => {
  it("should render simple HTML", async () => {
    const vnode = createMockVNode("div", {
      className: "container",
      children: createMockVNode("h1", { children: "Hello World" }),
    });

    const shell = await renderToStaticShell(vnode, "/");

    expect(shell.path).toBe("/");
    expect(shell.html).toContain('<div class="container">');
    expect(shell.html).toContain("<h1>Hello World</h1>");
    expect(shell.html).toContain("</div>");
    expect(shell.boundaries.size).toBe(0);
  });

  it("should render dynamic boundaries with placeholders", async () => {
    const vnode = createMockVNode("div", {
      children: dynamic({
        children: createMockVNode("span", { children: "Dynamic Content" }),
        fallback: createMockVNode("span", { children: "Loading..." }),
      }),
    });

    const shell = await renderToStaticShell(vnode, "/test");

    expect(shell.boundaries.size).toBe(1);
    expect(shell.html).toContain("<!--ppr:start:");
    expect(shell.html).toContain("<!--ppr:end:");
    expect(shell.html).toContain("Loading...");
  });

  it("should render nested dynamic boundaries", async () => {
    const vnode = createMockVNode("div", {
      children: [
        dynamic({
          children: createMockVNode("div", { id: "outer" }),
          fallback: createMockVNode("span", { children: "Outer Loading" }),
        }),
        dynamic({
          children: createMockVNode("div", { id: "inner" }),
          fallback: createMockVNode("span", { children: "Inner Loading" }),
        }),
      ],
    });

    const shell = await renderToStaticShell(vnode, "/nested");

    expect(shell.boundaries.size).toBe(2);
  });

  it("should generate content hash", async () => {
    const vnode = createMockVNode("div", { children: "Content" });
    const shell = await renderToStaticShell(vnode, "/");

    expect(shell.contentHash).toBeDefined();
    expect(shell.contentHash.length).toBeGreaterThan(0);
  });

  it("should extract assets from HTML", async () => {
    // This test simulates a component that would include asset references
    const vnode = createMockVNode("div", { children: "Content" });
    const shell = await renderToStaticShell(vnode, "/");

    expect(shell.assets).toBeDefined();
    expect(shell.assets.css).toBeInstanceOf(Array);
    expect(shell.assets.js).toBeInstanceOf(Array);
    expect(shell.assets.fonts).toBeInstanceOf(Array);
  });
});

// ============================================================================
// PPR Types Utility Tests
// ============================================================================

describe("PPR Type Utilities", () => {
  it("should create placeholder markers", () => {
    expect(PPR_PLACEHOLDER_START("test-id")).toBe("<!--ppr:start:test-id-->");
    expect(PPR_PLACEHOLDER_END("test-id")).toBe("<!--ppr:end:test-id-->");
  });

  it("should extract boundary ID from comments", () => {
    expect(extractBoundaryId("ppr:start:abc123")).toEqual({
      type: "start",
      id: "abc123",
    });
    expect(extractBoundaryId("ppr:end:abc123")).toEqual({
      type: "end",
      id: "abc123",
    });
    expect(extractBoundaryId("ppr:fallback:abc123")).toEqual({
      type: "fallback",
      id: "abc123",
    });
    expect(extractBoundaryId("invalid")).toBeNull();
  });

  it("should hash content consistently", async () => {
    const content = "Hello World";
    const hash1 = await hashContent(content);
    const hash2 = await hashContent(content);

    expect(hash1).toBe(hash2);
    expect(hash1.length).toBeGreaterThan(0);
  });

  it("should produce different hashes for different content", async () => {
    const hash1 = await hashContent("Content A");
    const hash2 = await hashContent("Content B");

    expect(hash1).not.toBe(hash2);
  });
});

// ============================================================================
// PPR Cache Tests
// ============================================================================

describe("PPR Cache - LRU", () => {
  let cache: LRUPPRCache;

  beforeEach(() => {
    cache = new LRUPPRCache({ maxSize: 3, maxAge: 60000 });
  });

  it("should store and retrieve shells", async () => {
    const shell = createMockShell("/test", "<div>Test</div>");

    await cache.set("/test", shell);
    const retrieved = await cache.get("/test");

    expect(retrieved).not.toBeNull();
    expect(retrieved?.html).toBe("<div>Test</div>");
  });

  it("should return null for missing entries", async () => {
    const result = await cache.get("/nonexistent");
    expect(result).toBeNull();
  });

  it("should evict oldest entries when at capacity", async () => {
    await cache.set("/a", createMockShell("/a", "A"));
    await cache.set("/b", createMockShell("/b", "B"));
    await cache.set("/c", createMockShell("/c", "C"));
    await cache.set("/d", createMockShell("/d", "D")); // Should evict /a

    expect(await cache.get("/a")).toBeNull();
    expect(await cache.get("/b")).not.toBeNull();
    expect(await cache.get("/c")).not.toBeNull();
    expect(await cache.get("/d")).not.toBeNull();
  });

  it("should invalidate entries", async () => {
    await cache.set("/test", createMockShell("/test", "Test"));
    await cache.invalidate("/test");

    expect(await cache.get("/test")).toBeNull();
  });

  it("should invalidate all entries", async () => {
    await cache.set("/a", createMockShell("/a", "A"));
    await cache.set("/b", createMockShell("/b", "B"));
    await cache.invalidateAll();

    expect(await cache.get("/a")).toBeNull();
    expect(await cache.get("/b")).toBeNull();
  });

  it("should report cache stats", async () => {
    await cache.set("/test", createMockShell("/test", "Test"));
    await cache.get("/test"); // Hit
    await cache.get("/nonexistent"); // Miss

    const stats = await cache.stats();

    expect(stats.size).toBe(1);
    expect(stats.bytes).toBeGreaterThan(0);
    expect(stats.hitRatio).toBe(0.5); // 1 hit, 1 miss
  });
});

describe("Memory PPR Cache", () => {
  let cache: MemoryPPRCache;

  beforeEach(() => {
    cache = new MemoryPPRCache();
  });

  it("should store and retrieve shells", async () => {
    const shell = createMockShell("/test", "<div>Test</div>");

    await cache.set("/test", shell);
    const retrieved = await cache.get("/test");

    expect(retrieved).not.toBeNull();
    expect(retrieved?.html).toBe("<div>Test</div>");
  });

  it("should check existence", async () => {
    await cache.set("/test", createMockShell("/test", "Test"));

    expect(await cache.has("/test")).toBe(true);
    expect(await cache.has("/nonexistent")).toBe(false);
  });
});

// ============================================================================
// Edge Cache Controller Tests
// ============================================================================

describe("Edge Cache Controller", () => {
  let cache: MemoryPPRCache;
  let controller: EdgeCacheController;

  beforeEach(() => {
    cache = new MemoryPPRCache();
    controller = new EdgeCacheController({
      strategy: "stale-while-revalidate",
      cache,
      staleTTL: 60,
    });
  });

  it("should fetch and cache on miss", async () => {
    const fetcher = vi.fn().mockResolvedValue(createMockShell("/test", "Fresh"));

    const result = await controller.get("/test", fetcher);

    expect(result.shell.html).toBe("Fresh");
    expect(result.stale).toBe(false);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("should return cached value on hit", async () => {
    await cache.set("/test", createMockShell("/test", "Cached"));
    const fetcher = vi.fn();

    const result = await controller.get("/test", fetcher);

    expect(result.shell.html).toBe("Cached");
    expect(result.stale).toBe(false);
    expect(fetcher).not.toHaveBeenCalled();
  });
});

// ============================================================================
// Cache Tag Manager Tests
// ============================================================================

describe("Cache Tag Manager", () => {
  let manager: CacheTagManager;

  beforeEach(() => {
    manager = new CacheTagManager();
  });

  it("should associate tags with paths", () => {
    manager.tag("/blog/1", ["blog", "post:1"]);
    manager.tag("/blog/2", ["blog", "post:2"]);

    expect(manager.getPathsForTag("blog")).toEqual(["/blog/1", "/blog/2"]);
    expect(manager.getPathsForTag("post:1")).toEqual(["/blog/1"]);
    expect(manager.getTagsForPath("/blog/1")).toEqual(["blog", "post:1"]);
  });

  it("should invalidate by tag", async () => {
    const cache = new MemoryPPRCache();
    await cache.set("/blog/1", createMockShell("/blog/1", "Post 1"));
    await cache.set("/blog/2", createMockShell("/blog/2", "Post 2"));

    manager.tag("/blog/1", ["blog"]);
    manager.tag("/blog/2", ["blog"]);

    const invalidated = await manager.invalidateTag("blog", cache);

    expect(invalidated).toBe(2);
    expect(await cache.get("/blog/1")).toBeNull();
    expect(await cache.get("/blog/2")).toBeNull();
  });

  it("should remove path from tracking", () => {
    manager.tag("/test", ["tag1", "tag2"]);
    manager.remove("/test");

    expect(manager.getTagsForPath("/test")).toEqual([]);
    expect(manager.getPathsForTag("tag1")).toEqual([]);
  });
});

// ============================================================================
// Cache Headers Tests
// ============================================================================

describe("Cache Headers", () => {
  it("should generate default cache headers", () => {
    const shell = createMockShell("/test", "Test");
    const headers = generateCacheHeaders(shell);

    expect(headers["Cache-Control"]).toContain("public");
    expect(headers["Cache-Control"]).toContain("max-age=3600");
    expect(headers["ETag"]).toBe('"abc123"');
    expect(headers["Vary"]).toBe("Accept-Encoding, Cookie");
  });

  it("should generate stale-while-revalidate headers", () => {
    const shell = createMockShell("/test", "Test");
    const headers = generateCacheHeaders(shell, {
      strategy: "stale-while-revalidate",
      maxAge: 600,
      staleWhileRevalidate: 120,
    });

    expect(headers["Cache-Control"]).toContain("stale-while-revalidate=120");
    expect(headers["Cache-Control"]).toContain("max-age=600");
  });

  it("should generate private headers", () => {
    const shell = createMockShell("/test", "Test");
    const headers = generateCacheHeaders(shell, { private: true });

    expect(headers["Cache-Control"]).toContain("private");
    expect(headers["Cache-Control"]).not.toContain("public");
  });
});

describe("Conditional Requests", () => {
  it("should parse If-None-Match header", () => {
    const request = new Request("http://localhost/", {
      headers: { "If-None-Match": '"abc123"' },
    });

    const conditional = parseConditionalRequest(request);

    expect(conditional.ifNoneMatch).toBe('"abc123"');
  });

  it("should parse If-Modified-Since header", () => {
    const date = new Date("2024-01-01T00:00:00Z");
    const request = new Request("http://localhost/", {
      headers: { "If-Modified-Since": date.toUTCString() },
    });

    const conditional = parseConditionalRequest(request);

    expect(conditional.ifModifiedSince?.getTime()).toBe(date.getTime());
  });

  it("should determine if 304 should be returned", () => {
    const shell = createMockShell("/test", "Test");

    expect(shouldReturn304(shell, { ifNoneMatch: '"abc123"' })).toBe(true);
    expect(shouldReturn304(shell, { ifNoneMatch: '"different"' })).toBe(false);
  });

  it("should create 304 response", () => {
    const shell = createMockShell("/test", "Test");
    const response = create304Response(shell);

    expect(response.status).toBe(304);
    expect(response.headers.get("ETag")).toBe('"abc123"');
  });
});

// ============================================================================
// PPR Builder Tests
// ============================================================================

describe("PPR Builder", () => {
  it("should create a builder instance", () => {
    const builder = new PPRBuilder({
      outDir: "./dist/ppr",
      routes: [],
      renderFn: async () => "",
    });

    expect(builder).toBeDefined();
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe("PPR Integration", () => {
  it("should render a complete PPR page", async () => {
    // Create a page with static and dynamic content
    function Header(): VNode {
      return createMockVNode("header", { children: "Static Header" });
    }

    function UserProfile(): VNode {
      return createMockVNode("div", {
        className: "profile",
        children: "User: John",
      });
    }

    function Page(): VNode {
      return createMockVNode("div", {
        children: [
          createMockVNode(Header as any, {}),
          dynamic({
            children: createMockVNode(UserProfile as any, {}),
            fallback: createMockVNode("div", { children: "Loading profile..." }),
            priority: 8,
          }),
        ],
      });
    }

    const shell = await renderToStaticShell(
      createMockVNode(Page as any, {}),
      "/"
    );

    // Verify static content is rendered
    expect(shell.html).toContain("Static Header");

    // Verify dynamic boundary has fallback
    expect(shell.html).toContain("Loading profile...");

    // Verify boundary metadata
    expect(shell.boundaries.size).toBe(1);
  });

  it("should inject dynamic content into shell", () => {
    const shell: StaticShell = {
      path: "/",
      html:
        '<div><!--ppr:start:ppr-dynamic-0--><!--ppr:fallback:ppr-dynamic-0-->' +
        '<div id="ppr-dynamic-0" data-ppr-boundary="true">Loading...</div>' +
        '<!--ppr:fallback-end:ppr-dynamic-0--><!--ppr:end:ppr-dynamic-0--></div>',
      boundaries: new Map([
        [
          "ppr-dynamic-0",
          {
            id: "ppr-dynamic-0",
            type: "dynamic",
            fallbackHtml: "Loading...",
            dataDependencies: [],
            priority: 5,
            startMarker: "<!--ppr:start:ppr-dynamic-0-->",
            endMarker: "<!--ppr:end:ppr-dynamic-0-->",
          },
        ],
      ]),
      buildTime: Date.now(),
      contentHash: "test",
      assets: { css: [], js: [], fonts: [] },
    };

    const resolutions = new Map([
      [
        "ppr-dynamic-0",
        {
          id: "ppr-dynamic-0",
          html: "Dynamic Content Here",
          resolveTime: 50,
          cached: false,
        },
      ],
    ]);

    const result = injectDynamicContent(shell, resolutions);

    expect(result).toContain("Dynamic Content Here");
    expect(result).toContain('data-ppr-resolved="true"');
  });
});

// ============================================================================
// Stream Tests
// ============================================================================

describe("PPR Streaming", () => {
  it("should create a PPR stream controller", () => {
    const shell = createMockShell("/", "<div>Shell</div>");
    const requestData = createMockRequestData();

    const controller = new PPRStreamController({
      shell,
      requestData,
    });

    expect(controller).toBeDefined();
    expect(controller.getStatus().pending).toBe(0);
    expect(controller.getStatus().aborted).toBe(false);
  });

  it("should create a readable stream", () => {
    const shell = createMockShell("/", "<div>Shell</div>");
    const requestData = createMockRequestData();

    const stream = createPPRStream({
      shell,
      requestData,
    });

    expect(stream).toBeInstanceOf(ReadableStream);
  });

  it("should abort streaming", () => {
    const shell = createMockShell("/", "<div>Shell</div>");
    const requestData = createMockRequestData();

    const controller = new PPRStreamController({
      shell,
      requestData,
    });

    controller.abort();

    expect(controller.getStatus().aborted).toBe(true);
  });
});

// ============================================================================
// Server Only Tests
// ============================================================================

describe("Server Only Content", () => {
  it("should create server-only dynamic content", () => {
    const result = serverOnly({
      children: createMockVNode("div", { children: "Secret data" }),
    });

    expect((result as any).props.priority).toBe(10);
    expect(isDynamic(result)).toBe(true);
  });
});
