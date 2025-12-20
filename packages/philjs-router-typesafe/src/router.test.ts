/**
 * Tests for philjs-router-typesafe
 * Tests both runtime behavior and type inference
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { z } from "zod";
import {
  createRoute,
  createRootRoute,
  addChildren,
  parsePathParams,
  buildPath,
  parseSearchParams,
  serializeSearchParams,
  matchRoutes,
  flattenRouteTree,
} from "./route.js";
import type {
  ExtractPathParams,
  PathParams,
  HasParams,
  InferSearchParams,
} from "./types.js";

// =============================================================================
// Type-Level Tests (compile-time verification)
// =============================================================================

describe("Type Inference", () => {
  describe("ExtractPathParams", () => {
    it("should extract single param", () => {
      type Result = ExtractPathParams<"/users/$userId">;
      // @ts-expect-error - Type test: Result should be 'userId'
      const _test: Result = "wrong";
      const correct: Result = "userId";
      expect(correct).toBe("userId");
    });

    it("should extract multiple params", () => {
      type Result = ExtractPathParams<"/users/$userId/posts/$postId">;
      const valid1: Result = "userId";
      const valid2: Result = "postId";
      expect(valid1).toBe("userId");
      expect(valid2).toBe("postId");
    });

    it("should return never for paths without params", () => {
      type Result = ExtractPathParams<"/about">;
      type IsNever = [Result] extends [never] ? true : false;
      const check: IsNever = true;
      expect(check).toBe(true);
    });
  });

  describe("PathParams", () => {
    it("should create correct params object type", () => {
      type Result = PathParams<"/users/$userId/posts/$postId">;
      const params: Result = { userId: "123", postId: "456" };
      expect(params.userId).toBe("123");
      expect(params.postId).toBe("456");
    });

    it("should return empty object for paths without params", () => {
      type Result = PathParams<"/about">;
      const params: Result = {};
      expect(Object.keys(params)).toHaveLength(0);
    });
  });

  describe("HasParams", () => {
    it("should be true for paths with params", () => {
      type Result = HasParams<"/users/$userId">;
      const hasParams: Result = true;
      expect(hasParams).toBe(true);
    });

    it("should be false for paths without params", () => {
      type Result = HasParams<"/about">;
      const hasParams: Result = false;
      expect(hasParams).toBe(false);
    });
  });

  describe("InferSearchParams", () => {
    it("should infer Zod schema output type", () => {
      const schema = z.object({
        tab: z.enum(["posts", "comments"]),
        page: z.number().optional(),
      });

      type Result = InferSearchParams<typeof schema>;
      const params: Result = { tab: "posts", page: 1 };
      expect(params.tab).toBe("posts");
    });
  });
});

// =============================================================================
// Route Creation Tests
// =============================================================================

describe("createRoute", () => {
  it("should create a route with basic path", () => {
    const route = createRoute({
      path: "/about",
    });

    expect(route.path).toBe("/about");
    expect(route.fullPath).toBe("/about");
    expect(route.id).toMatch(/^route_/);
  });

  it("should create a route with params", () => {
    const route = createRoute({
      path: "/users/$userId",
    });

    expect(route.path).toBe("/users/$userId");
  });

  it("should create a route with search validation", () => {
    const searchSchema = z.object({
      tab: z.enum(["posts", "comments"]),
    });

    const route = createRoute({
      path: "/users/$userId",
      validateSearch: searchSchema,
    });

    expect(route.validateSearch).toBe(searchSchema);
  });

  it("should create a route with loader", () => {
    const loader = vi.fn().mockResolvedValue({ name: "Test" });

    const route = createRoute({
      path: "/users/$userId",
      loader,
    });

    expect(route.loader).toBe(loader);
  });

  it("should create a route with component", () => {
    const component = vi.fn().mockReturnValue(null);

    const route = createRoute({
      path: "/about",
      component,
    });

    expect(route.component).toBe(component);
  });

  it("should attach useParams, useSearch, useLoaderData methods", () => {
    const route = createRoute({
      path: "/users/$userId",
    });

    expect(typeof route.useParams).toBe("function");
    expect(typeof route.useSearch).toBe("function");
    expect(typeof route.useLoaderData).toBe("function");
  });
});

describe("createRootRoute", () => {
  it("should create a root route with / path", () => {
    const root = createRootRoute();

    expect(root.path).toBe("/");
    expect(root.fullPath).toBe("/");
  });

  it("should accept a component", () => {
    const component = vi.fn().mockReturnValue(null);
    const root = createRootRoute({ component });

    expect(root.component).toBe(component);
  });
});

describe("addChildren", () => {
  it("should add children to a parent route", () => {
    const parent = createRoute({ path: "/users" });
    const child1 = createRoute({ path: "/$userId" });
    const child2 = createRoute({ path: "/new" });

    const result = addChildren(parent, [child1, child2]);

    expect(result.children).toHaveLength(2);
  });

  it("should update child full paths", () => {
    const parent = createRoute({ path: "/users" });
    const child = createRoute({ path: "/$userId" });

    const result = addChildren(parent, [child]);

    expect(result.children[0]?.fullPath).toBe("/users/$userId");
  });

  it("should set parent reference on children", () => {
    const parent = createRoute({ path: "/users" });
    const child = createRoute({ path: "/$userId" });

    const result = addChildren(parent, [child]);

    expect(result.children[0]?.parent).toBe(parent);
  });
});

describe("flattenRouteTree", () => {
  it("should flatten nested routes", () => {
    const root = createRoute({ path: "/" });
    const users = createRoute({ path: "/users" });
    const user = createRoute({ path: "/$userId" });

    const tree = addChildren(root, [
      addChildren(users, [user]),
    ]);

    const flat = flattenRouteTree([tree]);

    expect(flat.length).toBeGreaterThan(1);
  });
});

// =============================================================================
// Path Parsing Tests
// =============================================================================

describe("parsePathParams", () => {
  it("should parse single param", () => {
    const result = parsePathParams("/users/$userId", "/users/123");

    expect(result).toEqual({ userId: "123" });
  });

  it("should parse multiple params", () => {
    const result = parsePathParams(
      "/users/$userId/posts/$postId",
      "/users/123/posts/456"
    );

    expect(result).toEqual({ userId: "123", postId: "456" });
  });

  it("should return null for non-matching paths", () => {
    const result = parsePathParams("/users/$userId", "/posts/123");

    expect(result).toBeNull();
  });

  it("should return null for different segment counts", () => {
    const result = parsePathParams("/users/$userId", "/users/123/extra");

    expect(result).toBeNull();
  });

  it("should decode URI components", () => {
    const result = parsePathParams("/search/$query", "/search/hello%20world");

    expect(result).toEqual({ query: "hello world" });
  });

  it("should match static segments exactly", () => {
    const result = parsePathParams("/users/profile", "/users/profile");

    expect(result).toEqual({});
  });

  it("should handle wildcard params", () => {
    const result = parsePathParams("/files/*", "/files/path/to/file.txt");

    expect(result).toEqual({ "*": "path/to/file.txt" });
  });

  it("should handle paths without params", () => {
    const result = parsePathParams("/about", "/about");

    expect(result).toEqual({});
  });
});

describe("buildPath", () => {
  it("should build path with single param", () => {
    const result = buildPath("/users/$userId", { userId: "123" });

    expect(result).toBe("/users/123");
  });

  it("should build path with multiple params", () => {
    const result = buildPath("/users/$userId/posts/$postId", {
      userId: "123",
      postId: "456",
    });

    expect(result).toBe("/users/123/posts/456");
  });

  it("should encode URI components", () => {
    const result = buildPath("/search/$query", { query: "hello world" });

    expect(result).toBe("/search/hello%20world");
  });

  it("should handle empty params object", () => {
    const result = buildPath("/about", {} as Record<string, never>);

    expect(result).toBe("/about");
  });
});

// =============================================================================
// Search Params Tests
// =============================================================================

describe("parseSearchParams", () => {
  it("should parse search params with Zod schema", () => {
    const schema = z.object({
      tab: z.enum(["posts", "comments"]),
      page: z.coerce.number().optional(),
    });

    const result = parseSearchParams("?tab=posts&page=2", schema);

    expect(result).toEqual({ tab: "posts", page: 2 });
  });

  it("should apply default values", () => {
    const schema = z.object({
      tab: z.enum(["posts", "comments"]).default("posts"),
    });

    const result = parseSearchParams("", schema);

    expect(result).toEqual({ tab: "posts" });
  });

  it("should parse JSON values", () => {
    const schema = z.object({
      filters: z.array(z.string()),
    });

    const result = parseSearchParams(
      '?filters=["active","pending"]',
      schema
    );

    expect(result).toEqual({ filters: ["active", "pending"] });
  });

  it("should throw on invalid params", () => {
    const schema = z.object({
      tab: z.enum(["posts", "comments"]),
    });

    expect(() => {
      parseSearchParams("?tab=invalid", schema);
    }).toThrow();
  });
});

describe("serializeSearchParams", () => {
  it("should serialize simple values", () => {
    const result = serializeSearchParams({ tab: "posts", page: 2 });

    expect(result).toContain("tab=posts");
    expect(result).toContain("page=2");
  });

  it("should serialize object values as JSON", () => {
    const result = serializeSearchParams({
      filters: ["active", "pending"],
    });

    expect(result).toContain("filters=");
  });

  it("should omit null and undefined values", () => {
    const result = serializeSearchParams({
      tab: "posts",
      page: undefined,
      filter: null,
    });

    expect(result).not.toContain("page");
    expect(result).not.toContain("filter");
  });

  it("should return empty string for empty params", () => {
    const result = serializeSearchParams({});

    expect(result).toBe("");
  });
});

// =============================================================================
// Route Matching Tests
// =============================================================================

describe("matchRoutes", () => {
  it("should match simple route", () => {
    const routes = [
      createRoute({ path: "/about" }),
      createRoute({ path: "/contact" }),
    ];

    const result = matchRoutes(routes, "/about");

    expect(result).not.toBeNull();
    expect(result?.route.path).toBe("/about");
  });

  it("should match route with params", () => {
    const routes = [
      createRoute({ path: "/users" }),
      createRoute({ path: "/users/$userId" }),
    ];

    const result = matchRoutes(routes, "/users/123");

    expect(result).not.toBeNull();
    expect(result?.params).toEqual({ userId: "123" });
  });

  it("should return null for no match", () => {
    const routes = [createRoute({ path: "/about" })];

    const result = matchRoutes(routes, "/contact");

    expect(result).toBeNull();
  });

  it("should prefer more specific routes", () => {
    const routes = [
      createRoute({ path: "/users/$userId" }),
      createRoute({ path: "/users/new" }),
    ];

    const result = matchRoutes(routes, "/users/new");

    expect(result?.route.path).toBe("/users/new");
  });

  it("should match nested routes", () => {
    const parent = createRoute({ path: "/users" });
    const child = createRoute({ path: "/$userId" });
    const tree = addChildren(parent, [child]);

    const result = matchRoutes([tree], "/users/123");

    expect(result).not.toBeNull();
    expect(result?.params).toEqual({ userId: "123" });
  });
});

// =============================================================================
// Type-Safe Route Tests (compile-time)
// =============================================================================

describe("Type-Safe Routes", () => {
  it("should type loader params correctly", () => {
    const route = createRoute({
      path: "/users/$userId/posts/$postId",
      loader: async ({ params }) => {
        // TypeScript should know these are strings
        const userId: string = params.userId;
        const postId: string = params.postId;

        return { userId, postId };
      },
    });

    expect(route.loader).toBeDefined();
  });

  it("should type search params from Zod schema", () => {
    const route = createRoute({
      path: "/search",
      validateSearch: z.object({
        query: z.string(),
        page: z.number().default(1),
      }),
      loader: async ({ search }) => {
        // TypeScript should know types
        const query: string = search.query;
        const page: number = search.page;

        return { query, page };
      },
    });

    expect(route.validateSearch).toBeDefined();
  });

  it("should type component props correctly", () => {
    interface User {
      id: string;
      name: string;
    }

    const route = createRoute({
      path: "/users/$userId",
      validateSearch: z.object({
        tab: z.enum(["profile", "settings"]),
      }),
      loader: async (): Promise<User> => {
        return { id: "1", name: "Test" };
      },
      component: ({ params, search, loaderData }) => {
        // All should be properly typed
        const userId: string = params.userId;
        const tab: "profile" | "settings" = search.tab;
        const user: User = loaderData;

        return null;
      },
    });

    expect(route.component).toBeDefined();
  });
});

// =============================================================================
// Integration Tests
// =============================================================================

describe("Full Route Definition", () => {
  it("should create a complete route with all options", () => {
    const searchSchema = z.object({
      tab: z.enum(["posts", "comments"]).default("posts"),
      page: z.number().optional(),
    });

    const route = createRoute({
      path: "/users/$userId",
      validateSearch: searchSchema,
      loader: async ({ params, search }) => {
        return {
          userId: params.userId,
          tab: search.tab,
          page: search.page ?? 1,
        };
      },
      component: ({ params, search, loaderData }) => {
        return {
          type: "div",
          props: {
            children: `User: ${params.userId}, Tab: ${search.tab}`,
          },
        };
      },
      errorComponent: ({ error, reset }) => {
        return {
          type: "div",
          props: {
            children: `Error: ${error.message}`,
          },
        };
      },
      pendingComponent: () => {
        return { type: "div", props: { children: "Loading..." } };
      },
      meta: {
        title: "User Profile",
        description: "View user profile",
      },
    });

    expect(route.path).toBe("/users/$userId");
    expect(route.validateSearch).toBe(searchSchema);
    expect(route.loader).toBeDefined();
    expect(route.component).toBeDefined();
    expect(route.errorComponent).toBeDefined();
    expect(route.pendingComponent).toBeDefined();
    expect(route.meta?.title).toBe("User Profile");
  });
});
