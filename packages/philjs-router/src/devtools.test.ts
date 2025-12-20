/**
 * Tests for Router DevTools.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  initRouterDevTools,
  trackNavigation,
  completeNavigation,
  trackLoader,
  updateRouteTree,
  updateRouteState,
  recordRouteMatch,
  clearHistory,
  clearPerformance,
  exportState,
  importState,
  getDevToolsState,
  toggleDevTools,
  toggleMinimize,
  setActiveTab,
  type RouteTreeNode,
  type RouteStateSnapshot,
  type RouteMatchDebugInfo,
} from "./devtools.js";

describe("Router DevTools", () => {
  beforeEach(() => {
    // Reset state before each test
    clearHistory();
    clearPerformance();
  });

  describe("Initialization", () => {
    it("should initialize DevTools with default config", () => {
      initRouterDevTools();
      const state = getDevToolsState();

      expect(state.enabled).toBe(true);
      expect(state.config.position).toBe("bottom");
      expect(state.config.maxHistoryEntries).toBe(100);
    });

    it("should initialize DevTools with custom config", () => {
      initRouterDevTools({
        position: "right",
        size: 500,
        minimized: true,
        maxHistoryEntries: 50,
      });

      const state = getDevToolsState();
      expect(state.config.position).toBe("right");
      expect(state.config.size).toBe(500);
      expect(state.minimized).toBe(true);
      expect(state.config.maxHistoryEntries).toBe(50);
    });
  });

  describe("Navigation Tracking", () => {
    it("should track navigation events", () => {
      initRouterDevTools();
      const params = { id: "123" };
      const searchParams = new URLSearchParams("?foo=bar");

      trackNavigation("/users/123", params, searchParams);

      const state = getDevToolsState();
      expect(state.history.length).toBe(1);
      expect(state.history[0].path).toBe("/users/123");
      expect(state.history[0].params).toEqual(params);
    });

    it("should complete navigation with metrics", () => {
      initRouterDevTools();
      trackNavigation("/users/123", {}, new URLSearchParams());

      completeNavigation({
        total: 150,
        matching: 10,
        dataLoading: 100,
        rendering: 40,
      });

      const state = getDevToolsState();
      const lastEntry = state.history[state.history.length - 1];

      expect(lastEntry.duration).toBeGreaterThan(0);
      expect(lastEntry.metrics).toBeDefined();
      expect(lastEntry.metrics?.total).toBe(150);
      expect(lastEntry.metrics?.matching).toBe(10);
    });

    it("should limit history entries", () => {
      initRouterDevTools({ maxHistoryEntries: 3 });

      for (let i = 0; i < 5; i++) {
        trackNavigation(`/route${i}`, {}, new URLSearchParams());
      }

      const state = getDevToolsState();
      expect(state.history.length).toBe(3);
      expect(state.history[0].path).toBe("/route2");
    });

    it("should track history vs direct navigation", () => {
      initRouterDevTools();

      trackNavigation("/route1", {}, new URLSearchParams(), false);
      trackNavigation("/route2", {}, new URLSearchParams(), true);

      const state = getDevToolsState();
      expect(state.history[0].isHistoryNavigation).toBe(false);
      expect(state.history[1].isHistoryNavigation).toBe(true);
    });
  });

  describe("Loader Tracking", () => {
    it("should track loader execution", () => {
      initRouterDevTools();
      trackNavigation("/users", {}, new URLSearchParams());

      trackLoader("users-route", 50);
      trackLoader("users-layout", 30);

      completeNavigation();

      const state = getDevToolsState();
      const lastEntry = state.history[state.history.length - 1];

      expect(lastEntry.metrics?.loaders).toEqual({
        "users-route": 50,
        "users-layout": 30,
      });
    });
  });

  describe("Route Tree", () => {
    it("should update route tree", () => {
      initRouterDevTools();

      const tree: RouteTreeNode[] = [
        {
          id: "root",
          path: "/",
          children: [],
          isActive: true,
          hasLoader: false,
          hasAction: false,
          hasErrorBoundary: false,
        },
        {
          id: "users",
          path: "/users",
          parentId: "root",
          children: [],
          isActive: false,
          hasLoader: true,
          hasAction: true,
          hasErrorBoundary: false,
        },
      ];

      updateRouteTree(tree);

      const state = getDevToolsState();
      expect(state.routeTree).toEqual(tree);
      expect(state.routeTree.length).toBe(2);
    });

    it("should handle nested route tree", () => {
      initRouterDevTools();

      const tree: RouteTreeNode[] = [
        {
          id: "parent",
          path: "/parent",
          children: [
            {
              id: "child",
              path: "/parent/child",
              children: [],
              isActive: true,
              hasLoader: true,
              hasAction: false,
              hasErrorBoundary: true,
            },
          ],
          isActive: false,
          hasLoader: false,
          hasAction: false,
          hasErrorBoundary: false,
        },
      ];

      updateRouteTree(tree);

      const state = getDevToolsState();
      expect(state.routeTree[0].children.length).toBe(1);
      expect(state.routeTree[0].children[0].id).toBe("child");
    });
  });

  describe("State Inspector", () => {
    it("should update route state snapshot", () => {
      initRouterDevTools();

      const snapshot: RouteStateSnapshot = {
        path: "/users/123",
        params: { id: "123" },
        searchParams: { foo: "bar" },
        loaderData: {
          "users-route": { user: { name: "John" } },
        },
        errors: {},
        loading: false,
        matches: [
          {
            id: "users-route",
            path: "/users/123",
            params: { id: "123" },
            data: { user: { name: "John" } },
          },
        ],
      };

      updateRouteState(snapshot);

      const state = getDevToolsState();
      expect(state.currentState).toEqual(snapshot);
    });

    it("should handle loading state", () => {
      initRouterDevTools();

      const snapshot: RouteStateSnapshot = {
        path: "/loading",
        params: {},
        searchParams: {},
        loaderData: {},
        errors: {},
        loading: true,
        matches: [],
      };

      updateRouteState(snapshot);

      const state = getDevToolsState();
      expect(state.currentState?.loading).toBe(true);
    });

    it("should handle errors", () => {
      initRouterDevTools();

      const error = new Error("Test error");
      const snapshot: RouteStateSnapshot = {
        path: "/error",
        params: {},
        searchParams: {},
        loaderData: {},
        errors: { "error-route": error },
        loading: false,
        matches: [],
      };

      updateRouteState(snapshot);

      const state = getDevToolsState();
      expect(state.currentState?.errors["error-route"]).toBe(error);
    });
  });

  describe("Route Matching Debugger", () => {
    it("should record route match attempts", () => {
      initRouterDevTools();

      const debugInfo: RouteMatchDebugInfo = {
        pathname: "/users/123",
        attempts: [
          { pattern: "/", matched: false, reason: "Path mismatch" },
          { pattern: "/users", matched: false, reason: "Path mismatch" },
          {
            pattern: "/users/:id",
            matched: true,
            params: { id: "123" },
          },
        ],
        matchTime: 2.5,
      };

      recordRouteMatch(debugInfo);

      const state = getDevToolsState();
      expect(state.matchDebugInfo).toEqual(debugInfo);
      expect(state.matchDebugInfo?.attempts.length).toBe(3);
    });

    it("should track match performance", () => {
      initRouterDevTools();

      const debugInfo: RouteMatchDebugInfo = {
        pathname: "/complex/nested/route",
        attempts: Array(20)
          .fill(null)
          .map((_, i) => ({
            pattern: `/pattern${i}`,
            matched: false,
          })),
        matchTime: 15.7,
      };

      recordRouteMatch(debugInfo);

      const state = getDevToolsState();
      expect(state.matchDebugInfo?.matchTime).toBe(15.7);
    });
  });

  describe("Performance Tracking", () => {
    it("should track route performance", () => {
      initRouterDevTools();

      // Navigate to same route multiple times
      for (let i = 0; i < 3; i++) {
        trackNavigation("/users", {}, new URLSearchParams());
        completeNavigation({ total: 100 + i * 10 });
      }

      const state = getDevToolsState();
      const perf = state.performance.get("/users");

      expect(perf).toBeDefined();
      expect(perf?.visitCount).toBe(3);
      expect(perf?.minLoadTime).toBe(100);
      expect(perf?.maxLoadTime).toBe(120);
    });

    it("should calculate average load time", () => {
      initRouterDevTools();

      trackNavigation("/route", {}, new URLSearchParams());
      completeNavigation({ total: 100 });

      trackNavigation("/route", {}, new URLSearchParams());
      completeNavigation({ total: 200 });

      const state = getDevToolsState();
      const perf = state.performance.get("/route");

      expect(perf?.avgLoadTime).toBe(150);
    });

    it("should clear performance data", () => {
      initRouterDevTools();

      trackNavigation("/route", {}, new URLSearchParams());
      completeNavigation();

      clearPerformance();

      const state = getDevToolsState();
      expect(state.performance.size).toBe(0);
    });
  });

  describe("State Management", () => {
    it("should toggle DevTools visibility", () => {
      initRouterDevTools();
      expect(getDevToolsState().enabled).toBe(true);

      toggleDevTools();
      expect(getDevToolsState().enabled).toBe(false);

      toggleDevTools();
      expect(getDevToolsState().enabled).toBe(true);
    });

    it("should toggle minimize state", () => {
      initRouterDevTools();
      expect(getDevToolsState().minimized).toBe(false);

      toggleMinimize();
      expect(getDevToolsState().minimized).toBe(true);

      toggleMinimize();
      expect(getDevToolsState().minimized).toBe(false);
    });

    it("should set active tab", () => {
      initRouterDevTools();

      setActiveTab("performance");
      expect(getDevToolsState().activeTab).toBe("performance");

      setActiveTab("state");
      expect(getDevToolsState().activeTab).toBe("state");
    });
  });

  describe("Import/Export", () => {
    it("should export state as JSON", () => {
      initRouterDevTools();

      trackNavigation("/route", { id: "1" }, new URLSearchParams());
      completeNavigation();

      const exported = exportState();
      const parsed = JSON.parse(exported);

      expect(parsed.history).toBeDefined();
      expect(parsed.history.length).toBe(1);
      expect(parsed.history[0].path).toBe("/route");
    });

    it("should import state from JSON", () => {
      initRouterDevTools();

      const stateData = {
        history: [
          {
            id: "1",
            timestamp: Date.now(),
            path: "/imported",
            params: {},
            searchParams: new URLSearchParams(),
            isHistoryNavigation: false,
          },
        ],
        performance: [],
        currentState: null,
        routeTree: [],
      };

      importState(JSON.stringify(stateData));

      const state = getDevToolsState();
      expect(state.history.length).toBe(1);
      expect(state.history[0].path).toBe("/imported");
    });

    it("should handle invalid import gracefully", () => {
      initRouterDevTools();

      importState("invalid json");

      // Should not crash
      const state = getDevToolsState();
      expect(state).toBeDefined();
    });
  });

  describe("History Management", () => {
    it("should clear navigation history", () => {
      initRouterDevTools();

      trackNavigation("/route1", {}, new URLSearchParams());
      trackNavigation("/route2", {}, new URLSearchParams());

      expect(getDevToolsState().history.length).toBe(2);

      clearHistory();

      expect(getDevToolsState().history.length).toBe(0);
    });
  });

  describe("Auto-tracking", () => {
    it("should not track when autoTrack is disabled", () => {
      initRouterDevTools({ autoTrack: false });

      trackNavigation("/route", {}, new URLSearchParams());

      const state = getDevToolsState();
      expect(state.history.length).toBe(0);
    });

    it("should track when autoTrack is enabled", () => {
      initRouterDevTools({ autoTrack: true });

      trackNavigation("/route", {}, new URLSearchParams());

      const state = getDevToolsState();
      expect(state.history.length).toBe(1);
    });
  });
});
