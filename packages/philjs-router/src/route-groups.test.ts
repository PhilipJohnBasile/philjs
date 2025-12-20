/**
 * Tests for Route Groups.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  parseRouteGroup,
  createRouteGroup,
  addRouteToGroup,
  processRouteGroups,
  executeGroupMiddleware,
  createAuthMiddleware,
  createPermissionMiddleware,
  createLoggingMiddleware,
  createRateLimitMiddleware,
  discoverRouteGroups,
  isGroupPath,
  extractGroups,
  removeGroups,
  getRoutesByGroup,
  mergeRouteGroups,
  validateRouteGroup,
  visualizeRouteGroups,
  type RouteGroup,
  type GroupRoute,
  type MiddlewareContext,
} from "./route-groups.js";

describe("Route Groups", () => {
  describe("Route Group Parsing", () => {
    it("should parse route group from path", () => {
      const result = parseRouteGroup("/(marketing)/about");

      expect(result.group).toBe("marketing");
      expect(result.cleanPath).toBe("/about");
    });

    it("should handle nested groups", () => {
      const result = parseRouteGroup("/(app)/(dashboard)/settings");

      expect(result.group).toBe("app");
      expect(result.cleanPath).toBe("/dashboard/settings");
    });

    it("should return null group for non-group path", () => {
      const result = parseRouteGroup("/about");

      expect(result.group).toBeNull();
      expect(result.cleanPath).toBe("/about");
    });

    it("should handle root path", () => {
      const result = parseRouteGroup("/");

      expect(result.group).toBeNull();
      expect(result.cleanPath).toBe("/");
    });

    it("should extract group name correctly", () => {
      const result = parseRouteGroup("/(admin)/users/create");

      expect(result.group).toBe("admin");
      expect(result.cleanPath).toBe("/users/create");
    });
  });

  describe("Group Creation", () => {
    it("should create a route group", () => {
      const group = createRouteGroup("marketing", {
        meta: { displayName: "Marketing Pages" },
      });

      expect(group.name).toBe("marketing");
      expect(group.meta?.displayName).toBe("Marketing Pages");
      expect(group.routes).toEqual([]);
    });

    it("should create group with routes", () => {
      const route: GroupRoute = {
        path: "/about",
        component: () => "About",
      };

      const group = createRouteGroup("marketing", {
        routes: [route],
      });

      expect(group.routes.length).toBe(1);
      expect(group.routes[0].path).toBe("/about");
    });

    it("should create group with layout", () => {
      const layout = (props: any) => props.children;

      const group = createRouteGroup("dashboard", {
        layout,
      });

      expect(group.layout).toBe(layout);
    });

    it("should create group with middleware", () => {
      const middleware = vi.fn(async () => ({ allow: true }));

      const group = createRouteGroup("admin", {
        middleware: [middleware],
      });

      expect(group.middleware?.length).toBe(1);
    });
  });

  describe("Adding Routes to Groups", () => {
    it("should add route to group", () => {
      const group = createRouteGroup("marketing");
      const route: GroupRoute = {
        path: "/contact",
        component: () => "Contact",
      };

      const updated = addRouteToGroup(group, route);

      expect(updated.routes.length).toBe(1);
      expect(updated.routes[0].path).toBe("/contact");
    });

    it("should preserve existing routes", () => {
      const route1: GroupRoute = {
        path: "/about",
        component: () => "About",
      };

      let group = createRouteGroup("marketing", { routes: [route1] });

      const route2: GroupRoute = {
        path: "/contact",
        component: () => "Contact",
      };

      group = addRouteToGroup(group, route2);

      expect(group.routes.length).toBe(2);
    });
  });

  describe("Processing Route Groups", () => {
    it("should process route groups into flat routes", () => {
      const group = createRouteGroup("marketing", {
        routes: [
          { path: "/about", component: () => "About" },
          { path: "/contact", component: () => "Contact" },
        ],
      });

      const processed = processRouteGroups([group]);

      expect(processed.length).toBe(2);
      expect(processed[0].path).toBe("/about");
      expect(processed[1].path).toBe("/contact");
    });

    it("should combine group loader with route loader", async () => {
      const groupLoader = vi.fn(async () => ({ groupData: true }));
      const routeLoader = vi.fn(async () => ({ routeData: true }));

      const group = createRouteGroup("test", {
        loader: groupLoader,
        routes: [
          {
            path: "/page",
            component: () => "Page",
            loader: routeLoader,
          },
        ],
      });

      const processed = processRouteGroups([group]);
      const context = {
        params: {},
        request: new Request("http://localhost/page"),
        url: new URL("http://localhost/page"),
      };

      const result = await processed[0].loader?.(context);

      expect(groupLoader).toHaveBeenCalled();
      expect(routeLoader).toHaveBeenCalled();
      expect(result).toEqual({
        groupData: true,
        routeData: true,
      });
    });

    it("should wrap component with group layout", () => {
      const layout = (props: any) => `Layout[${props.children}]`;
      const component = () => "Content";

      const group = createRouteGroup("test", {
        layout,
        routes: [{ path: "/page", component }],
      });

      const processed = processRouteGroups([group]);
      const result = processed[0].component({});

      expect(result).toBe("Layout[Content]");
    });

    it("should set correct group reference", () => {
      const group = createRouteGroup("dashboard", {
        routes: [{ path: "/settings", component: () => "Settings" }],
      });

      const processed = processRouteGroups([group]);

      expect(processed[0].group).toBe("dashboard");
    });

    it("should generate route IDs", () => {
      const group = createRouteGroup("test", {
        routes: [
          { path: "/page1", component: () => "Page 1" },
          { path: "/page2", component: () => "Page 2", id: "custom-id" },
        ],
      });

      const processed = processRouteGroups([group]);

      expect(processed[0].id).toBe("test:/page1");
      expect(processed[1].id).toBe("custom-id");
    });
  });

  describe("Middleware Execution", () => {
    it("should execute middleware in order", async () => {
      const order: number[] = [];
      const mw1 = async () => {
        order.push(1);
        return { allow: true };
      };
      const mw2 = async () => {
        order.push(2);
        return { allow: true };
      };

      const context: MiddlewareContext = {
        url: new URL("http://localhost/test"),
        params: {},
        request: new Request("http://localhost/test"),
        groupName: "test",
        routePath: "/test",
      };

      await executeGroupMiddleware([mw1, mw2], context);

      expect(order).toEqual([1, 2]);
    });

    it("should stop on first deny", async () => {
      const executed: string[] = [];
      const mw1 = async () => {
        executed.push("mw1");
        return { allow: false };
      };
      const mw2 = async () => {
        executed.push("mw2");
        return { allow: true };
      };

      const context: MiddlewareContext = {
        url: new URL("http://localhost/test"),
        params: {},
        request: new Request("http://localhost/test"),
        groupName: "test",
        routePath: "/test",
      };

      const result = await executeGroupMiddleware([mw1, mw2], context);

      expect(executed).toEqual(["mw1"]);
      expect(result.allow).toBe(false);
    });

    it("should merge data from middleware", async () => {
      const mw1 = async () => ({ allow: true, data: { a: 1 } });
      const mw2 = async () => ({ allow: true, data: { b: 2 } });

      const context: MiddlewareContext = {
        url: new URL("http://localhost/test"),
        params: {},
        request: new Request("http://localhost/test"),
        groupName: "test",
        routePath: "/test",
      };

      const result = await executeGroupMiddleware([mw1, mw2], context);

      expect(result.data).toEqual({ a: 1, b: 2 });
    });

    it("should handle redirects", async () => {
      const mw = async () => ({
        allow: false,
        redirect: "/login",
      });

      const context: MiddlewareContext = {
        url: new URL("http://localhost/test"),
        params: {},
        request: new Request("http://localhost/test"),
        groupName: "test",
        routePath: "/test",
      };

      const result = await executeGroupMiddleware([mw], context);

      expect(result.allow).toBe(false);
      expect(result.redirect).toBe("/login");
    });
  });

  describe("Built-in Middleware", () => {
    it("should create auth middleware", async () => {
      const checkAuth = vi.fn(() => false);
      const middleware = createAuthMiddleware(checkAuth, "/login");

      const context: MiddlewareContext = {
        url: new URL("http://localhost/protected"),
        params: {},
        request: new Request("http://localhost/protected"),
        groupName: "admin",
        routePath: "/protected",
      };

      const result = await middleware(context);

      expect(checkAuth).toHaveBeenCalled();
      expect(result.allow).toBe(false);
      expect(result.redirect).toContain("/login");
    });

    it("should create permission middleware", async () => {
      const getPermissions = vi.fn(() => ["read"]);
      const middleware = createPermissionMiddleware(
        ["read", "write"],
        getPermissions
      );

      const context: MiddlewareContext = {
        url: new URL("http://localhost/test"),
        params: {},
        request: new Request("http://localhost/test"),
        groupName: "test",
        routePath: "/test",
      };

      const result = await middleware(context);

      expect(result.allow).toBe(false);
    });

    it("should create logging middleware", async () => {
      const logger = vi.fn();
      const middleware = createLoggingMiddleware(logger);

      const context: MiddlewareContext = {
        url: new URL("http://localhost/test"),
        params: {},
        request: new Request("http://localhost/test"),
        groupName: "test",
        routePath: "/test",
      };

      await middleware(context);

      expect(logger).toHaveBeenCalledWith(
        expect.objectContaining({
          group: "test",
          path: "/test",
        })
      );
    });

    it("should create rate limit middleware", () => {
      const middleware = createRateLimitMiddleware({
        maxRequests: 2,
        windowMs: 1000,
      });

      const context: MiddlewareContext = {
        url: new URL("http://localhost/test"),
        params: {},
        request: new Request("http://localhost/test"),
        groupName: "test",
        routePath: "/test",
      };

      // First two requests should pass
      let result = middleware(context);
      expect(result.allow).toBe(true);

      result = middleware(context);
      expect(result.allow).toBe(true);

      // Third request should fail
      result = middleware(context);
      expect(result.allow).toBe(false);
    });
  });

  describe("Route Group Discovery", () => {
    it("should discover route groups from files", () => {
      const files = {
        "/(marketing)/about.tsx": {
          default: () => "About",
        },
        "/(marketing)/contact.tsx": {
          default: () => "Contact",
        },
        "/(marketing)/layout.tsx": {
          default: (props: any) => props.children,
        },
      };

      const groups = discoverRouteGroups(files);

      expect(groups.length).toBe(1);
      expect(groups[0].name).toBe("marketing");
      expect(groups[0].routes.length).toBe(2);
      expect(groups[0].layout).toBeDefined();
    });

    it("should handle multiple groups", () => {
      const files = {
        "/(marketing)/about.tsx": { default: () => "About" },
        "/(dashboard)/settings.tsx": { default: () => "Settings" },
      };

      const groups = discoverRouteGroups(files);

      expect(groups.length).toBe(2);
    });
  });

  describe("Utility Functions", () => {
    it("should check if path is a group path", () => {
      expect(isGroupPath("/(marketing)/about")).toBe(true);
      expect(isGroupPath("/about")).toBe(false);
    });

    it("should extract groups from path", () => {
      const groups = extractGroups("/(app)/(dashboard)/settings");

      expect(groups).toEqual(["app", "dashboard"]);
    });

    it("should remove groups from path", () => {
      const clean = removeGroups("/(marketing)/about");

      expect(clean).toBe("/about");
    });

    it("should get routes by group name", () => {
      const group1 = createRouteGroup("marketing", {
        routes: [{ path: "/about", component: () => "About" }],
      });
      const group2 = createRouteGroup("dashboard", {
        routes: [{ path: "/settings", component: () => "Settings" }],
      });

      const routes = getRoutesByGroup([group1, group2], "marketing");

      expect(routes.length).toBe(1);
      expect(routes[0].path).toBe("/about");
    });

    it("should merge route groups", () => {
      const group1 = createRouteGroup("test", {
        routes: [{ path: "/page1", component: () => "Page 1" }],
      });
      const group2 = createRouteGroup("test", {
        routes: [{ path: "/page2", component: () => "Page 2" }],
      });

      const merged = mergeRouteGroups(group1, group2);

      expect(merged.routes.length).toBe(2);
    });

    it("should validate route group", () => {
      const validGroup = createRouteGroup("test", {
        routes: [{ path: "/page", component: () => "Page" }],
      });

      const result = validateRouteGroup(validGroup);

      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it("should detect invalid route group", () => {
      const invalidGroup = createRouteGroup("test", {
        routes: [{ path: "", component: null as any }],
      });

      const result = validateRouteGroup(invalidGroup);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe("Visualization", () => {
    it("should visualize route groups", () => {
      const group = createRouteGroup("marketing", {
        meta: { displayName: "Marketing" },
        routes: [
          { path: "/about", component: () => "About" },
          { path: "/contact", component: () => "Contact" },
        ],
      });

      const visualization = visualizeRouteGroups([group]);

      expect(visualization).toContain("Group: (marketing)");
      expect(visualization).toContain("/about");
      expect(visualization).toContain("/contact");
    });
  });
});
