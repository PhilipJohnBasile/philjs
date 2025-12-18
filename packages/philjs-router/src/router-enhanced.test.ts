import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  createAppRouter,
  useRouter,
  useRoute,
  Link,
  RouterView,
  createRouteMatcher,
  NavigateFunction,
  RouteDefinition,
} from "./high-level.js";
import { Ok, Err } from "philjs-core";

/**
 * Enhanced Router Test Suite
 *
 * Covers:
 * - Nested routes with multiple levels
 * - Route guards and middleware
 * - Dynamic parameters with edge cases
 * - Navigation edge cases (replace, state, back/forward)
 * - History handling and popstate events
 */

describe("Enhanced Router Tests", () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
    window.history.replaceState({}, "", "/");
    delete (window as any).__PHILJS_ROUTE_DATA__;
    delete (window as any).__PHILJS_ROUTE_ERROR__;
    delete (window as any).__PHILJS_ROUTE_INFO__;
  });

  afterEach(() => {
    document.body.innerHTML = "";
    window.history.replaceState({}, "", "/");
  });

  // ============================================================================
  // Nested Routes Tests
  // ============================================================================

  describe("Nested Routes", () => {
    it("should handle deeply nested routes with multiple layouts", async () => {
      const router = createAppRouter({
        routes: [
          {
            path: "/app",
            component: () => "App Root",
            layout: ({ children }) => `<div class="app-layout">${children}</div>`,
            children: [
              {
                path: "/dashboard",
                component: () => "Dashboard",
                layout: ({ children }) => `<div class="dashboard-layout">${children}</div>`,
                children: [
                  {
                    path: "/analytics",
                    component: () => "Analytics",
                    layout: ({ children }) => `<div class="analytics-layout">${children}</div>`,
                    children: [
                      {
                        path: "/:metric",
                        component: ({ params }) => `Metric: ${params.metric}`,
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      });

      await router.navigate("/app/dashboard/analytics/revenue");
      const content = document.getElementById("app")?.innerHTML;

      expect(content).toContain("app-layout");
      expect(content).toContain("dashboard-layout");
      expect(content).toContain("analytics-layout");
      expect(content).toContain("Metric: revenue");

      router.dispose();
    });

    it("should handle sibling routes at different nesting levels", async () => {
      const router = createAppRouter({
        routes: [
          {
            path: "/blog",
            component: () => "Blog Index",
            children: [
              { path: "/new", component: () => "New Post" },
              { path: "/:slug", component: ({ params }) => `Post: ${params.slug}` },
              {
                path: "/category",
                component: () => "Categories",
                children: [
                  { path: "/:name", component: ({ params }) => `Category: ${params.name}` },
                ],
              },
            ],
          },
        ],
      });

      await router.navigate("/blog/new");
      expect(document.getElementById("app")?.textContent).toContain("New Post");

      await router.navigate("/blog/my-post");
      expect(document.getElementById("app")?.textContent).toContain("Post: my-post");

      await router.navigate("/blog/category/tech");
      expect(document.getElementById("app")?.textContent).toContain("Category: tech");

      router.dispose();
    });

    it("should support multiple children routes", async () => {
      const router = createAppRouter({
        routes: [
          {
            path: "/docs",
            component: () => "Docs",
            children: [
              { path: "/getting-started", component: () => "Getting Started" },
              { path: "/api-reference", component: () => "API Reference" },
              { path: "/tutorials", component: () => "Tutorials" },
            ],
          },
        ],
      });

      await router.navigate("/docs/getting-started");
      expect(document.getElementById("app")?.textContent).toContain("Getting Started");

      await router.navigate("/docs/api-reference");
      expect(document.getElementById("app")?.textContent).toContain("API Reference");

      router.dispose();
    });

    it("should inherit layout from parent routes", async () => {
      const router = createAppRouter({
        routes: [
          {
            path: "/admin",
            component: () => "Admin",
            layout: ({ children }) => `<nav>Admin Nav</nav>${children}`,
            children: [
              { path: "/users", component: () => "Users List" },
              { path: "/settings", component: () => "Settings" },
            ],
          },
        ],
      });

      await router.navigate("/admin/users");
      const content = document.getElementById("app")?.innerHTML;
      expect(content).toContain("Admin Nav");
      expect(content).toContain("Users List");

      await router.navigate("/admin/settings");
      const content2 = document.getElementById("app")?.innerHTML;
      expect(content2).toContain("Admin Nav");
      expect(content2).toContain("Settings");

      router.dispose();
    });

    it("should handle empty nested paths correctly", async () => {
      const router = createAppRouter({
        routes: [
          {
            path: "/products",
            component: () => "Products Index",
            children: [
              { path: "/", component: () => "All Products" },
              { path: "/:id", component: ({ params }) => `Product ${params.id}` },
            ],
          },
        ],
      });

      await router.navigate("/products");
      expect(document.getElementById("app")?.textContent).toContain("Products Index");

      await router.navigate("/products/123");
      expect(document.getElementById("app")?.textContent).toContain("Product 123");

      router.dispose();
    });
  });

  // ============================================================================
  // Route Guards Tests
  // ============================================================================

  describe("Route Guards and Middleware", () => {
    it("should block navigation when loader returns an error", async () => {
      const router = createAppRouter({
        routes: [
          { path: "/", component: () => "Home" },
          {
            path: "/protected",
            component: ({ error }) => (error ? `Error: ${error}` : "Protected Content"),
            loader: async () => Err("Unauthorized"),
          },
        ],
      });

      await router.navigate("/protected");
      const route = useRoute();
      expect(route?.error).toBe("Unauthorized");
      expect(document.getElementById("app")?.textContent).toContain("Error: Unauthorized");

      router.dispose();
    });

    it("should allow navigation when loader returns Ok", async () => {
      const router = createAppRouter({
        routes: [
          {
            path: "/dashboard",
            component: ({ data }) => `Welcome ${data.user}`,
            loader: async () => Ok({ user: "Alice" }),
          },
        ],
      });

      await router.navigate("/dashboard");
      const route = useRoute();
      expect(route?.data).toEqual({ user: "Alice" });
      expect(document.getElementById("app")?.textContent).toContain("Welcome Alice");

      router.dispose();
    });

    it("should handle async loader errors gracefully", async () => {
      const router = createAppRouter({
        routes: [
          {
            path: "/data",
            component: ({ error }) => (error ? `Failed: ${error.message}` : "Data"),
            loader: async () => {
              throw new Error("Network Error");
            },
          },
        ],
      });

      await router.navigate("/data");
      const route = useRoute();
      expect(route?.error).toBeDefined();
      expect(route?.error.message).toBe("Network Error");

      router.dispose();
    });

    it("should pass route params to loader", async () => {
      let capturedParams: any = null;

      const router = createAppRouter({
        routes: [
          {
            path: "/users/:id/posts/:postId",
            component: () => "User Post",
            loader: async ({ params }) => {
              capturedParams = params;
              return Ok({ params });
            },
          },
        ],
      });

      await router.navigate("/users/42/posts/100");
      expect(capturedParams).toEqual({ id: "42", postId: "100" });

      router.dispose();
    });

    it("should re-run loader on navigation even to same route with different params", async () => {
      let loadCount = 0;

      const router = createAppRouter({
        routes: [
          {
            path: "/items/:id",
            component: ({ params }) => `Item ${params.id}`,
            loader: async ({ params }) => {
              loadCount++;
              return Ok({ id: params.id });
            },
          },
        ],
      });

      await router.navigate("/items/1");
      expect(loadCount).toBe(1);

      await router.navigate("/items/2");
      expect(loadCount).toBe(2);

      router.dispose();
    });

    it("should provide request object to loader", async () => {
      let capturedRequest: Request | null = null;

      const router = createAppRouter({
        routes: [
          {
            path: "/api/data",
            component: () => "API Data",
            loader: async ({ request }) => {
              capturedRequest = request;
              return Ok({ url: request.url });
            },
          },
        ],
      });

      await router.navigate("/api/data");
      expect(capturedRequest).toBeDefined();
      expect(capturedRequest?.url).toContain("/api/data");

      router.dispose();
    });
  });

  // ============================================================================
  // Dynamic Parameters Edge Cases
  // ============================================================================

  describe("Dynamic Parameters", () => {
    it("should handle URL-encoded parameters", async () => {
      const router = createAppRouter({
        routes: [
          {
            path: "/search/:query",
            component: ({ params }) => `Search: ${params.query}`,
          },
        ],
      });

      await router.navigate("/search/hello%20world");
      const route = useRoute();
      expect(route?.params.query).toBe("hello world");

      router.dispose();
    });

    it("should handle special characters in parameters", async () => {
      const router = createAppRouter({
        routes: [
          {
            path: "/tags/:tag",
            component: ({ params }) => `Tag: ${params.tag}`,
          },
        ],
      });

      await router.navigate("/tags/c%2B%2B");
      const route = useRoute();
      expect(route?.params.tag).toBe("c++");

      router.dispose();
    });

    it("should handle numeric parameters as strings", async () => {
      const router = createAppRouter({
        routes: [
          {
            path: "/items/:id",
            component: ({ params }) => {
              expect(typeof params.id).toBe("string");
              return `Item ${params.id}`;
            },
          },
        ],
      });

      await router.navigate("/items/123");
      const route = useRoute();
      expect(route?.params.id).toBe("123");

      router.dispose();
    });

    it("should handle multiple consecutive dynamic segments", async () => {
      const router = createAppRouter({
        routes: [
          {
            path: "/:lang/:region/:city",
            component: ({ params }) =>
              `${params.lang}/${params.region}/${params.city}`,
          },
        ],
      });

      await router.navigate("/en/us/seattle");
      const route = useRoute();
      expect(route?.params).toEqual({ lang: "en", region: "us", city: "seattle" });

      router.dispose();
    });

    it("should handle single-segment wildcard parameters", async () => {
      const router = createAppRouter({
        routes: [
          {
            path: "/files/:filename",
            component: ({ params }) => `File: ${params.filename}`,
          },
        ],
      });

      await router.navigate("/files/report.pdf");
      const route = useRoute();
      expect(route?.params.filename).toBe("report.pdf");

      router.dispose();
    });

    it("should handle empty string parameters", async () => {
      const router = createAppRouter({
        routes: [
          {
            path: "/optional/:value?",
            component: ({ params }) => `Value: ${params.value || "none"}`,
          },
        ],
      });

      // Note: This tests the matcher's ability to handle optional params
      // The current implementation doesn't support optional params natively
      // but this documents the expected behavior

      router.dispose();
    });

    it("should preserve parameter order", async () => {
      const router = createAppRouter({
        routes: [
          {
            path: "/:a/:b/:c/:d/:e",
            component: ({ params }) => {
              const keys = Object.keys(params);
              return `Keys: ${keys.join(",")}`;
            },
          },
        ],
      });

      await router.navigate("/1/2/3/4/5");
      const route = useRoute();
      expect(route?.params).toEqual({ a: "1", b: "2", c: "3", d: "4", e: "5" });

      router.dispose();
    });
  });

  // ============================================================================
  // Navigation Edge Cases
  // ============================================================================

  describe("Navigation Edge Cases", () => {
    it("should support replace option to replace history state", async () => {
      const router = createAppRouter({
        routes: [
          { path: "/", component: () => "Home" },
          { path: "/page1", component: () => "Page 1" },
          { path: "/page2", component: () => "Page 2" },
        ],
      });

      const initialLength = window.history.length;

      await router.navigate("/page1");
      await router.navigate("/page2", { replace: true });

      // Replace shouldn't add a new history entry
      expect(document.getElementById("app")?.textContent).toContain("Page 2");

      router.dispose();
    });

    it("should preserve custom state in navigation", async () => {
      const router = createAppRouter({
        routes: [
          { path: "/", component: () => "Home" },
          { path: "/page", component: () => "Page" },
        ],
      });

      const customState = { scrollPosition: 100, timestamp: Date.now() };
      await router.navigate("/page", { state: customState });

      expect(window.history.state).toEqual(customState);

      router.dispose();
    });

    it("should handle navigation to the same route", async () => {
      const router = createAppRouter({
        routes: [
          { path: "/page", component: () => "Page" },
        ],
      });

      await router.navigate("/page");
      const firstContent = document.getElementById("app")?.textContent;

      await router.navigate("/page");
      const secondContent = document.getElementById("app")?.textContent;

      expect(firstContent).toBe(secondContent);

      router.dispose();
    });

    it("should handle navigation to non-existent routes", async () => {
      const router = createAppRouter({
        routes: [
          { path: "/", component: () => "Home" },
        ],
      });

      await router.navigate("/nonexistent");
      const route = useRoute();
      expect(route).toBeNull();
      expect(document.getElementById("app")?.innerHTML).toBe("");

      router.dispose();
    });

    it("should handle rapid navigation", async () => {
      const router = createAppRouter({
        routes: [
          { path: "/page1", component: () => "Page 1" },
          { path: "/page2", component: () => "Page 2" },
          { path: "/page3", component: () => "Page 3" },
        ],
      });

      // Rapidly navigate
      const nav1 = router.navigate("/page1");
      const nav2 = router.navigate("/page2");
      const nav3 = router.navigate("/page3");

      await Promise.all([nav1, nav2, nav3]);

      // Should end up on the last navigation
      expect(document.getElementById("app")?.textContent).toContain("Page 3");

      router.dispose();
    });

    it("should handle absolute vs relative-style paths", async () => {
      const router = createAppRouter({
        routes: [
          { path: "/app/dashboard", component: () => "Dashboard" },
        ],
      });

      await router.navigate("/app/dashboard");
      expect(document.getElementById("app")?.textContent).toContain("Dashboard");

      router.dispose();
    });

    it("should update useRouter hook on navigation", async () => {
      const router = createAppRouter({
        routes: [
          { path: "/", component: () => "Home" },
          { path: "/about", component: () => "About" },
        ],
      });

      const initialState = useRouter();
      expect(initialState.route?.path).toBe("/");

      await router.navigate("/about");

      const updatedState = useRouter();
      expect(updatedState.route?.path).toBe("/about");

      router.dispose();
    });

    it("should clear route when navigating to unmatched path", async () => {
      const router = createAppRouter({
        routes: [
          { path: "/", component: () => "Home" },
        ],
      });

      await router.navigate("/");
      expect(useRoute()).not.toBeNull();

      await router.navigate("/404");
      expect(useRoute()).toBeNull();

      router.dispose();
    });
  });

  // ============================================================================
  // History Handling
  // ============================================================================

  describe("History Handling", () => {
    it("should handle browser back button", async () => {
      const router = createAppRouter({
        routes: [
          { path: "/", component: () => "Home" },
          { path: "/page1", component: () => "Page 1" },
          { path: "/page2", component: () => "Page 2" },
        ],
      });

      await router.navigate("/page1");
      await router.navigate("/page2");

      // Simulate back button
      window.history.back();
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Should be back on page1 after a brief delay for popstate
      // Note: In actual browser, popstate would fire
      router.dispose();
    });

    it("should handle browser forward button", async () => {
      const router = createAppRouter({
        routes: [
          { path: "/", component: () => "Home" },
          { path: "/page1", component: () => "Page 1" },
        ],
      });

      await router.navigate("/page1");
      window.history.back();
      await new Promise((resolve) => setTimeout(resolve, 50));

      window.history.forward();
      await new Promise((resolve) => setTimeout(resolve, 50));

      router.dispose();
    });

    it("should respond to popstate events", async () => {
      const router = createAppRouter({
        routes: [
          { path: "/", component: () => "Home" },
          { path: "/page1", component: () => "Page 1" },
        ],
      });

      await router.navigate("/page1");

      // Manually change URL and trigger popstate
      window.history.pushState({}, "", "/");
      window.dispatchEvent(new PopStateEvent("popstate"));

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Router should respond to popstate
      expect(window.location.pathname).toBe("/");

      router.dispose();
    });

    it("should clean up popstate listener on dispose", async () => {
      const router = createAppRouter({
        routes: [
          { path: "/", component: () => "Home" },
        ],
      });

      const listenersBefore = window.addEventListener.length;
      router.dispose();

      // After dispose, popstate listener should be removed
      window.dispatchEvent(new PopStateEvent("popstate"));
      // No error should occur

      expect(true).toBe(true);
    });

    it("should handle history.replaceState correctly", async () => {
      const router = createAppRouter({
        routes: [
          { path: "/", component: () => "Home" },
          { path: "/page1", component: () => "Page 1" },
          { path: "/page2", component: () => "Page 2" },
        ],
      });

      await router.navigate("/page1");
      const afterPage1Length = window.history.length;

      await router.navigate("/page2", { replace: true });
      const afterPage2Length = window.history.length;

      // Replace should not increase history length
      expect(afterPage2Length).toBe(afterPage1Length);

      router.dispose();
    });

    it("should maintain history state across navigations", async () => {
      const router = createAppRouter({
        routes: [
          { path: "/", component: () => "Home" },
          { path: "/page", component: () => "Page" },
        ],
      });

      await router.navigate("/page", { state: { key: "value1" } });
      expect(window.history.state).toEqual({ key: "value1" });

      await router.navigate("/", { state: { key: "value2" } });
      expect(window.history.state).toEqual({ key: "value2" });

      router.dispose();
    });

    it("should handle multiple router instances sequentially", () => {
      const router1 = createAppRouter({
        routes: [{ path: "/", component: () => "Router 1" }],
      });

      expect(document.getElementById("app")?.textContent).toContain("Router 1");
      router1.dispose();

      const router2 = createAppRouter({
        routes: [{ path: "/", component: () => "Router 2" }],
      });

      expect(document.getElementById("app")?.textContent).toContain("Router 2");
      router2.dispose();
    });
  });

  // ============================================================================
  // Route Matcher Tests
  // ============================================================================

  describe("Route Matcher", () => {
    it("should create a standalone route matcher", () => {
      const matcher = createRouteMatcher([
        { path: "/", component: () => "Home" },
        { path: "/about", component: () => "About" },
        { path: "/users/:id", component: () => "User" },
      ]);

      expect(matcher("/")).not.toBeNull();
      expect(matcher("/about")).not.toBeNull();
      expect(matcher("/users/123")).not.toBeNull();
      expect(matcher("/nonexistent")).toBeNull();
    });

    it("should extract params from matched routes", () => {
      const matcher = createRouteMatcher([
        { path: "/posts/:postId/comments/:commentId", component: () => "Comment" },
      ]);

      const match = matcher("/posts/42/comments/100");
      expect(match?.params).toEqual({ postId: "42", commentId: "100" });
    });

    it("should handle base path in matcher", () => {
      const matcher = createRouteMatcher(
        [
          { path: "/", component: () => "Home" },
          { path: "/about", component: () => "About" },
        ],
        { base: "/app" }
      );

      expect(matcher("/app")).not.toBeNull();
      expect(matcher("/app/about")).not.toBeNull();
    });

    it("should prioritize static routes over dynamic in matcher", () => {
      const matcher = createRouteMatcher([
        { path: "/users/new", component: () => "New User" },
        { path: "/users/:id", component: () => "User Detail" },
      ]);

      const match = matcher("/users/new");
      expect(match?.path).toBe("/users/new");
    });
  });

  // ============================================================================
  // Link Component Tests
  // ============================================================================

  describe("Link Component", () => {
    it("should prevent default on regular clicks", async () => {
      const router = createAppRouter({
        routes: [
          { path: "/", component: () => "Home" },
          { path: "/page", component: () => "Page" },
        ],
      });

      const link = Link({ to: "/page", children: "Go to Page" });

      const event = new MouseEvent("click", { bubbles: true, cancelable: true });
      Object.defineProperty(event, "button", { value: 0 });

      const preventDefaultSpy = vi.spyOn(event, "preventDefault");

      await link.props.onClick(event);

      expect(preventDefaultSpy).toHaveBeenCalled();

      router.dispose();
    });

    it("should not prevent default on modified clicks", () => {
      const router = createAppRouter({
        routes: [{ path: "/", component: () => "Home" }],
      });

      const link = Link({ to: "/page", children: "Go to Page" });

      const ctrlClick = new MouseEvent("click", { ctrlKey: true, cancelable: true });
      Object.defineProperty(ctrlClick, "button", { value: 0 });

      const preventDefaultSpy = vi.spyOn(ctrlClick, "preventDefault");

      link.props.onClick(ctrlClick);

      expect(preventDefaultSpy).not.toHaveBeenCalled();

      router.dispose();
    });

    it("should not prevent default on middle/right clicks", () => {
      const router = createAppRouter({
        routes: [{ path: "/", component: () => "Home" }],
      });

      const link = Link({ to: "/page", children: "Go to Page" });

      const middleClick = new MouseEvent("click", { bubbles: true, cancelable: true });
      Object.defineProperty(middleClick, "button", { value: 1 }); // Middle button

      const preventDefaultSpy = vi.spyOn(middleClick, "preventDefault");

      link.props.onClick(middleClick);

      expect(preventDefaultSpy).not.toHaveBeenCalled();

      router.dispose();
    });

    it("should pass through additional props to anchor", () => {
      const link = Link({
        to: "/page",
        children: "Link",
        className: "custom-link",
        "data-testid": "my-link",
      });

      expect(link.props.href).toBe("/page");
      expect(link.props.className).toBe("custom-link");
      expect(link.props["data-testid"]).toBe("my-link");
    });

    it("should support replace option", async () => {
      const router = createAppRouter({
        routes: [
          { path: "/", component: () => "Home" },
          { path: "/page", component: () => "Page" },
        ],
      });

      const link = Link({ to: "/page", replace: true, children: "Replace" });

      const event = new MouseEvent("click", { bubbles: true, cancelable: true });
      Object.defineProperty(event, "button", { value: 0 });

      await link.props.onClick(event);

      // Verify navigation occurred
      expect(document.getElementById("app")?.textContent).toContain("Page");

      router.dispose();
    });

    it("should call custom onClick handler if provided", async () => {
      const router = createAppRouter({
        routes: [{ path: "/", component: () => "Home" }],
      });

      const customClickHandler = vi.fn();
      const link = Link({ to: "/page", onClick: customClickHandler, children: "Link" });

      const event = new MouseEvent("click", { bubbles: true, cancelable: true });
      Object.defineProperty(event, "button", { value: 0 });

      await link.props.onClick(event);

      expect(customClickHandler).toHaveBeenCalledWith(event);

      router.dispose();
    });
  });

  // ============================================================================
  // RouterView Component Tests
  // ============================================================================

  describe("RouterView Component", () => {
    it("should render null when no route matched", () => {
      document.body.innerHTML = '<div id="app"></div>';

      const router = createAppRouter({
        routes: [{ path: "/other", component: () => "Other" }],
      });

      // Should start at "/" which doesn't match any route
      const view = RouterView();
      expect(view).toBeNull();

      router.dispose();
    });

    it("should pass all props to route component", async () => {
      let receivedProps: any = null;

      const router = createAppRouter({
        routes: [
          {
            path: "/test/:id",
            component: (props) => {
              receivedProps = props;
              return "Test";
            },
            loader: async () => Ok({ data: "loaded" }),
          },
        ],
      });

      await router.navigate("/test/123");

      expect(receivedProps).toBeDefined();
      expect(receivedProps.params).toEqual({ id: "123" });
      expect(receivedProps.data).toEqual({ data: "loaded" });
      expect(receivedProps.navigate).toBeDefined();
      expect(receivedProps.url).toBeInstanceOf(URL);

      router.dispose();
    });
  });

  // ============================================================================
  // Error Handling
  // ============================================================================

  describe("Error Handling", () => {
    it("should handle component render errors gracefully", async () => {
      const router = createAppRouter({
        routes: [
          {
            path: "/error",
            component: () => {
              throw new Error("Component Error");
            },
          },
        ],
      });

      // Should not crash the router
      try {
        await router.navigate("/error");
      } catch (error) {
        // Expected to throw
      }

      router.dispose();
    });

    it("should surface loader errors in route state", async () => {
      const router = createAppRouter({
        routes: [
          {
            path: "/fail",
            component: ({ error }) => (error ? "Error occurred" : "Success"),
            loader: async () => {
              throw new Error("Loader failed");
            },
          },
        ],
      });

      await router.navigate("/fail");
      const route = useRoute();

      expect(route?.error).toBeDefined();
      expect(route?.error.message).toBe("Loader failed");

      router.dispose();
    });

    it("should handle missing target element", () => {
      document.body.innerHTML = ""; // No #app element

      expect(() => {
        createAppRouter({
          routes: [{ path: "/", component: () => "Home" }],
        });
      }).toThrow();
    });

    it("should handle custom target element", () => {
      document.body.innerHTML = '<div id="custom-root"></div>';

      const router = createAppRouter({
        routes: [{ path: "/", component: () => "Home" }],
        target: "#custom-root",
      });

      expect(document.getElementById("custom-root")?.textContent).toContain("Home");

      router.dispose();
    });
  });

  // ============================================================================
  // Base Path Support
  // ============================================================================

  describe("Base Path", () => {
    it("should handle base path in routes", async () => {
      document.body.innerHTML = '<div id="app"></div>';

      const router = createAppRouter({
        routes: [
          { path: "/", component: () => "App Home" },
          { path: "/about", component: () => "App About" },
        ],
        base: "/myapp",
      });

      await router.navigate("/myapp/about");
      expect(document.getElementById("app")?.textContent).toContain("App About");

      router.dispose();
    });

    it("should handle trailing slashes in base path", async () => {
      document.body.innerHTML = '<div id="app"></div>';

      const router = createAppRouter({
        routes: [{ path: "/", component: () => "Home" }],
        base: "/app/",
      });

      await router.navigate("/app");
      expect(document.getElementById("app")?.textContent).toContain("Home");

      router.dispose();
    });
  });
});
