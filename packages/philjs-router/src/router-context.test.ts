/**
 * Tests for Router Context.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  initRouterContext,
  setGlobalContext,
  updateGlobalContext,
  updateGlobalContextMultiple,
  getGlobalContext,
  getGlobalContextValue,
  registerContextProvider,
  unregisterContextProvider,
  computeProvidedContext,
  registerRouteContextOverride,
  unregisterRouteContextOverride,
  getRouteContext,
  setCurrentRouteContext,
  getCurrentRouteContext,
  addContextMiddleware,
  removeContextMiddleware,
  applyContextMiddleware,
  clearContextCache,
  resetRouterContext,
  useRouterContext,
  useRouterContextValue,
  createTypedContext,
  defineContextProvider,
  defineContextMiddleware,
  validateContext,
  mergeContexts,
  hasContextKey,
  getContextKeys,
  createUserContextProvider,
  createThemeContextProvider,
  createLoggingContextMiddleware,
  type RouterContext,
  type ContextProvider,
  type ContextMiddleware,
} from "./router-context.js";

describe("Router Context", () => {
  beforeEach(() => {
    resetRouterContext();
  });

  describe("Initialization", () => {
    it("should initialize with default config", () => {
      initRouterContext();

      const context = getGlobalContext();
      expect(context).toEqual({});
    });

    it("should initialize with initial context", () => {
      initRouterContext({
        initialContext: { user: "test", theme: "dark" },
      });

      const context = getGlobalContext();
      expect(context.user).toBe("test");
      expect(context.theme).toBe("dark");
    });

    it("should register providers during initialization", async () => {
      const provider = defineContextProvider("test", () => "value");

      initRouterContext({
        providers: [provider],
      });

      const context = await computeProvidedContext();
      expect(context.test).toBe("value");
    });

    it("should register overrides during initialization", () => {
      initRouterContext({
        initialContext: { value: "global" },
        overrides: [
          {
            route: "/admin",
            context: { value: "admin" },
          },
        ],
      });

      const routeContext = getRouteContext("/admin");
      expect(routeContext.value).toBe("admin");
    });

    it("should register middleware during initialization", async () => {
      const middleware = vi.fn((ctx) => ({ ...ctx, added: true }));

      initRouterContext({
        middleware: [middleware],
      });

      addContextMiddleware(middleware);

      const context = await applyContextMiddleware(
        {},
        { route: "/test", params: {} }
      );

      expect(middleware).toHaveBeenCalled();
    });
  });

  describe("Global Context", () => {
    it("should set global context", () => {
      const context = { user: "alice", role: "admin" };
      setGlobalContext(context);

      const result = getGlobalContext();
      expect(result).toEqual(context);
    });

    it("should update single value", () => {
      setGlobalContext({ user: "alice", role: "user" });

      updateGlobalContext("role", "admin");

      const context = getGlobalContext();
      expect(context.role).toBe("admin");
      expect(context.user).toBe("alice");
    });

    it("should update multiple values", () => {
      setGlobalContext({ user: "alice", role: "user", theme: "light" });

      updateGlobalContextMultiple({ role: "admin", theme: "dark" });

      const context = getGlobalContext();
      expect(context.role).toBe("admin");
      expect(context.theme).toBe("dark");
      expect(context.user).toBe("alice");
    });

    it("should get specific value", () => {
      setGlobalContext({ user: "alice", role: "admin" });

      const user = getGlobalContextValue("user");
      expect(user).toBe("alice");
    });

    it("should return undefined for missing key", () => {
      setGlobalContext({ user: "alice" });

      const missing = getGlobalContextValue("nonexistent");
      expect(missing).toBeUndefined();
    });
  });

  describe("Context Providers", () => {
    it("should register context provider", async () => {
      const provider = defineContextProvider("apiKey", () => "secret-key");

      registerContextProvider(provider);

      const context = await computeProvidedContext();
      expect(context.apiKey).toBe("secret-key");
    });

    it("should unregister context provider", async () => {
      const provider = defineContextProvider("temp", () => "value");

      registerContextProvider(provider);
      unregisterContextProvider("temp");

      const context = await computeProvidedContext();
      expect(context.temp).toBeUndefined();
    });

    it("should cache provider results", async () => {
      let callCount = 0;
      const provider = defineContextProvider(
        "cached",
        () => {
          callCount++;
          return "value";
        },
        { cache: true }
      );

      registerContextProvider(provider);

      await computeProvidedContext();
      await computeProvidedContext();

      expect(callCount).toBe(1);
    });

    it("should not cache when disabled", async () => {
      let callCount = 0;
      const provider = defineContextProvider(
        "notCached",
        () => {
          callCount++;
          return "value";
        },
        { cache: false }
      );

      registerContextProvider(provider);

      await computeProvidedContext();
      await computeProvidedContext();

      expect(callCount).toBe(2);
    });

    it("should handle async providers", async () => {
      const provider = defineContextProvider("async", async () => {
        return new Promise((resolve) =>
          setTimeout(() => resolve("async-value"), 10)
        );
      });

      registerContextProvider(provider);

      const context = await computeProvidedContext();
      expect(context.async).toBe("async-value");
    });

    it("should clear provider cache", async () => {
      let callCount = 0;
      const provider = defineContextProvider(
        "test",
        () => {
          callCount++;
          return "value";
        },
        { cache: true }
      );

      registerContextProvider(provider);

      await computeProvidedContext();
      clearContextCache("test");
      await computeProvidedContext();

      expect(callCount).toBe(2);
    });
  });

  describe("Route Context Overrides", () => {
    it("should register route override", () => {
      setGlobalContext({ theme: "light" });

      registerRouteContextOverride({
        route: "/dark-mode",
        context: { theme: "dark" },
      });

      const routeContext = getRouteContext("/dark-mode");
      expect(routeContext.theme).toBe("dark");
    });

    it("should unregister route override", () => {
      setGlobalContext({ theme: "light" });

      registerRouteContextOverride({
        route: "/dark-mode",
        context: { theme: "dark" },
      });

      unregisterRouteContextOverride("/dark-mode");

      const routeContext = getRouteContext("/dark-mode");
      expect(routeContext.theme).toBe("light");
    });

    it("should merge with global context", () => {
      setGlobalContext({ user: "alice", theme: "light" });

      registerRouteContextOverride({
        route: "/admin",
        context: { role: "admin" },
        merge: true,
      });

      const routeContext = getRouteContext("/admin");
      expect(routeContext.user).toBe("alice");
      expect(routeContext.role).toBe("admin");
    });

    it("should match wildcard patterns", () => {
      setGlobalContext({ layout: "default" });

      registerRouteContextOverride({
        route: "/admin/*",
        context: { layout: "admin" },
      });

      const routeContext = getRouteContext("/admin/settings");
      expect(routeContext.layout).toBe("admin");
    });
  });

  describe("Current Route Context", () => {
    it("should set current route context", () => {
      setGlobalContext({ global: "value" });

      setCurrentRouteContext("/test", { route: "value" });

      const current = getCurrentRouteContext();
      expect(current.global).toBe("value");
      expect(current.route).toBe("value");
    });

    it("should override with route context", () => {
      setGlobalContext({ value: "global" });

      registerRouteContextOverride({
        route: "/special",
        context: { value: "special" },
      });

      setCurrentRouteContext("/special");

      const current = getCurrentRouteContext();
      expect(current.value).toBe("special");
    });
  });

  describe("Context Middleware", () => {
    it("should add and execute middleware", async () => {
      const middleware: ContextMiddleware = (ctx) => ({
        ...ctx,
        middlewareApplied: true,
      });

      addContextMiddleware(middleware);

      const result = await applyContextMiddleware(
        {},
        { route: "/test", params: {} }
      );

      expect(result.middlewareApplied).toBe(true);
    });

    it("should execute middleware in order", async () => {
      const order: number[] = [];

      const mw1: ContextMiddleware = (ctx) => {
        order.push(1);
        return ctx;
      };
      const mw2: ContextMiddleware = (ctx) => {
        order.push(2);
        return ctx;
      };

      addContextMiddleware(mw1);
      addContextMiddleware(mw2);

      await applyContextMiddleware({}, { route: "/test", params: {} });

      expect(order).toEqual([1, 2]);
    });

    it("should remove middleware", async () => {
      const middleware = vi.fn((ctx) => ctx);

      addContextMiddleware(middleware);
      removeContextMiddleware(middleware);

      await applyContextMiddleware({}, { route: "/test", params: {} });

      expect(middleware).not.toHaveBeenCalled();
    });

    it("should transform context through middleware", async () => {
      const middleware: ContextMiddleware = (ctx) => ({
        ...ctx,
        value: (ctx.value as number) * 2,
      });

      addContextMiddleware(middleware);

      const result = await applyContextMiddleware(
        { value: 5 },
        { route: "/test", params: {} }
      );

      expect(result.value).toBe(10);
    });

    it("should handle async middleware", async () => {
      const middleware: ContextMiddleware = async (ctx) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return { ...ctx, async: true };
      };

      addContextMiddleware(middleware);

      const result = await applyContextMiddleware(
        {},
        { route: "/test", params: {} }
      );

      expect(result.async).toBe(true);
    });
  });

  describe("Hooks", () => {
    it("should use router context", () => {
      setCurrentRouteContext("/test", { value: "test" });

      const context = useRouterContext();
      expect(context.value).toBe("test");
    });

    it("should use specific context value", () => {
      setCurrentRouteContext("/test", { user: "alice" });

      const user = useRouterContextValue("user");
      expect(user).toBe("alice");
    });

    it("should throw in strict mode for missing key", () => {
      initRouterContext({ strict: true });
      setCurrentRouteContext("/test", {});

      expect(() => useRouterContextValue("missing")).toThrow();
    });
  });

  describe("Typed Context", () => {
    it("should create typed context", () => {
      type AppContext = {
        user: string;
        theme: "light" | "dark";
      };

      const typedContext = createTypedContext<AppContext>();

      setGlobalContext({ user: "alice", theme: "dark" });

      const context = typedContext.useContext();
      expect(context.user).toBe("alice");
      expect(context.theme).toBe("dark");
    });

    it("should use typed value", () => {
      type AppContext = {
        count: number;
      };

      const typedContext = createTypedContext<AppContext>();

      setGlobalContext({ count: 42 });

      const count = typedContext.useValue("count");
      expect(count).toBe(42);
    });
  });

  describe("Validation", () => {
    it("should validate context", () => {
      const validators = {
        age: {
          validate: (value: unknown) =>
            typeof value === "number" && value >= 0,
          errorMessage: "Age must be a positive number",
        },
      };

      const result = validateContext({ age: 25 }, validators);

      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it("should detect validation errors", () => {
      const validators = {
        age: {
          validate: (value: unknown) =>
            typeof value === "number" && value >= 0,
          errorMessage: "Age must be a positive number",
        },
      };

      const result = validateContext({ age: -5 }, validators);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should validate on context update", () => {
      const validators = {
        email: {
          validate: (value: unknown) =>
            typeof value === "string" && value.includes("@"),
          errorMessage: "Invalid email",
        },
      };

      initRouterContext({ validators });

      expect(() => setGlobalContext({ email: "invalid" })).toThrow();
    });
  });

  describe("Utility Functions", () => {
    it("should merge contexts", () => {
      const ctx1 = { a: 1, b: 2 };
      const ctx2 = { b: 3, c: 4 };

      const merged = mergeContexts(ctx1, ctx2);

      expect(merged).toEqual({ a: 1, b: 3, c: 4 });
    });

    it("should check for context key", () => {
      setCurrentRouteContext("/test", { user: "alice" });

      expect(hasContextKey("user")).toBe(true);
      expect(hasContextKey("missing")).toBe(false);
    });

    it("should get context keys", () => {
      setCurrentRouteContext("/test", { a: 1, b: 2, c: 3 });

      const keys = getContextKeys();

      expect(keys).toContain("a");
      expect(keys).toContain("b");
      expect(keys).toContain("c");
      expect(keys.length).toBe(3);
    });
  });

  describe("Built-in Providers", () => {
    it("should create user context provider", async () => {
      const fetchUser = vi.fn(async () => ({ id: "1", name: "Alice" }));
      const provider = createUserContextProvider(fetchUser);

      registerContextProvider(provider);

      const context = await computeProvidedContext();

      expect(fetchUser).toHaveBeenCalled();
      expect(context.user).toEqual({ id: "1", name: "Alice" });
    });

    it("should create theme context provider", async () => {
      const provider = createThemeContextProvider(() => "dark");

      registerContextProvider(provider);

      const context = await computeProvidedContext();

      expect(context.theme).toBe("dark");
    });
  });

  describe("Built-in Middleware", () => {
    it("should create logging middleware", async () => {
      const middleware = createLoggingContextMiddleware();

      addContextMiddleware(middleware);

      // Should not throw
      await applyContextMiddleware(
        { value: "test" },
        { route: "/test", params: {} }
      );
    });
  });

  describe("Context Reset", () => {
    it("should reset all context", () => {
      setGlobalContext({ value: "test" });
      registerContextProvider(
        defineContextProvider("test", () => "value")
      );
      registerRouteContextOverride({
        route: "/test",
        context: { override: true },
      });

      resetRouterContext();

      expect(getGlobalContext()).toEqual({});
      expect(computeProvidedContext()).resolves.toEqual({});
    });
  });

  describe("Freezing Context", () => {
    it("should freeze context when configured", () => {
      initRouterContext({ freeze: true });

      setGlobalContext({ value: "test" });

      const context = getGlobalContext();

      expect(Object.isFrozen(context)).toBe(true);
    });

    it("should not freeze by default", () => {
      setGlobalContext({ value: "test" });

      const context = getGlobalContext();

      expect(Object.isFrozen(context)).toBe(false);
    });
  });

  describe("Scoped Providers", () => {
    it("should define provider with scope", async () => {
      const provider = defineContextProvider(
        "scoped",
        () => "value",
        { scope: "route" }
      );

      registerContextProvider(provider);

      const context = await computeProvidedContext();
      expect(context.scoped).toBe("value");
    });
  });

  describe("Complex Scenarios", () => {
    it("should handle full context flow", async () => {
      // Set up providers
      const userProvider = defineContextProvider(
        "user",
        async () => ({ id: "1", name: "Alice" }),
        { cache: true }
      );

      registerContextProvider(userProvider);

      // Set global context
      setGlobalContext({ appName: "TestApp" });

      // Add route override
      registerRouteContextOverride({
        route: "/admin",
        context: { isAdmin: true },
      });

      // Add middleware
      const middleware: ContextMiddleware = (ctx) => ({
        ...ctx,
        timestamp: Date.now(),
      });
      addContextMiddleware(middleware);

      // Compute and apply
      const provided = await computeProvidedContext();
      setGlobalContext({ ...getGlobalContext(), ...provided });
      setCurrentRouteContext("/admin");

      const final = await applyContextMiddleware(getCurrentRouteContext(), {
        route: "/admin",
        params: {},
      });

      expect(final.user).toBeDefined();
      expect(final.appName).toBe("TestApp");
      expect(final.isAdmin).toBe(true);
      expect(final.timestamp).toBeDefined();
    });
  });
});
